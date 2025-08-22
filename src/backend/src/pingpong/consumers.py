import json
from channels.generic.websocket import WebsocketConsumer
from accounts.models import *
from asgiref.sync import async_to_sync, sync_to_async
from .utils import *
import redis
import jwt
from django.conf import settings
from channels.exceptions import DenyConnection
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.db import DatabaseError
from django.core.exceptions import ObjectDoesNotExist
import urllib.parse
from channels.layers import get_channel_layer
import logging
from accounts.views import get_avatar_url
from django.db.models import Q

logger = logging.getLogger(__name__)

pool = redis.ConnectionPool(host='redis', port=6379, db=0)
redis_instance = redis.StrictRedis(connection_pool=pool)

class GameConsumer2(AsyncWebsocketConsumer):
    map_players_matched = {}
    active_connections = []

    async def connect(self):
        try:
            user = await self.check_token()
            self.player, created = await database_sync_to_async(Player.objects.get_or_create)(username=user.username, avatar=user.avatar)
            await database_sync_to_async(self.player.save)()

            if not self.player.is_active:
                await database_sync_to_async(MatchmakingQueue.objects.create)(player=self.player)
                await self.validate_active_connections()
                await self.add_player_to_queue()
                if self.player not in GameConsumer2.active_connections:
                    GameConsumer2.active_connections.append(self.player)
                await database_sync_to_async(self.player.save)()
                await self.channel_layer.group_add(
                    f'player_{self.player.id}',
                    self.channel_name
                )
            await self.accept()
        except DenyConnection:
            await self.close()

    async def flush_queue(self):
        try:
            redis_instance.delete('pingpong_1to1_matchmaking_queue')
            GameConsumer2.map_players_matched.clear()
        except Exception as e:
            logger.error(f"Failed to flush the queue: {e}")

    async def validate_active_connections(self):
        for player in list(GameConsumer2.active_connections):
            if not await self.check_user(player):
                GameConsumer2.active_connections.remove(player)
                await database_sync_to_async(redis_instance.lrem)('pingpong_1to1_matchmaking_queue', 0, player.id)
        
        if len(GameConsumer2.active_connections) == 0:
            self.flush_queue()

    async def disconnect(self, close_code):
        await self.notify_opponent_if_exists()
        await database_sync_to_async(redis_instance.lrem)('pingpong_1to1_matchmaking_queue', 0, self.player.id)
        await self.channel_layer.group_discard(f'player_{self.player.id}', self.channel_name)
        if self.player.is_active:
            self.player.is_active = False
            await database_sync_to_async(self.player.save)()
        if self.player in GameConsumer2.active_connections:
            GameConsumer2.active_connections.remove(self.player)
        if len(GameConsumer2.active_connections) == 0:
            redis_instance.delete('pingpong_1to1_matchmaking_queue')
        self.validate_active_connections()

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['message'] == 'Enter Queue':
            queue_length = await database_sync_to_async(redis_instance.llen)('pingpong_1to1_matchmaking_queue')

            if queue_length >= 2:
                opponent_id1 = await database_sync_to_async(redis_instance.rpop)('pingpong_1to1_matchmaking_queue')
                opponent_id = await database_sync_to_async(redis_instance.rpop)('pingpong_1to1_matchmaking_queue')
                if opponent_id and opponent_id1 and opponent_id != opponent_id1:
                    opponent = await database_sync_to_async(Player.objects.get)(id=opponent_id)
                    GameConsumer2.map_players_matched[opponent] = self.player
                    GameConsumer2.map_players_matched[self.player] = opponent
                    self.opponent = opponent
                    room_name = make_key(20)
                    game_room = await database_sync_to_async(GameRoom.objects.create)(room_name=room_name, player1=self.player, player2=opponent)
                    await database_sync_to_async(OneToOneHistory.objects.create)(
                        game_type="pingpong", player1=self.player.username, player2=opponent.username,
                        player1_avatar=self.player.avatar, player2_avatar=opponent.avatar, score1=0, score2=0, room_name=room_name
                    )
                    self.player.is_active = False
                    opponent.is_active = False
                    self.player.player_side = 'right'
                    opponent.player_side = 'left'
                    await database_sync_to_async(self.player.save)()
                    await database_sync_to_async(opponent.save)()

                    await self.send(text_data=json.dumps({
                        'status': 'match_found',
                        'room_name': game_room.room_name
                    }))

                    await self.channel_layer.group_send(
                        f'player_{opponent.id}',
                        {
                            'type': 'match.found',
                            'room_name': game_room.room_name,
                            'game': 'notstart',
                            'opponent_username': self.player.username,
                            'opponent_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                        }
                    )

                    await self.send(text_data=json.dumps({
                        'status': 'match_found',
                        'room_name': game_room.room_name,
                        'opponent_username': opponent.username,
                        'opponent_avatar': urllib.parse.unquote(opponent.avatar.url[1:] if opponent.avatar.url.startswith('/') else opponent.avatar.url) if opponent.avatar else None,
                        'player_username': self.player.username,
                        'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                        'time': 'stop',
                        'game': 'notstart',
                        'player_side': 'right', 
                    }))
                    
                    await self.handle_match_start(game_room, opponent)
                else:
                    await self.add_player_to_queue()
                    await self.send(text_data=json.dumps({
                        'status': 'waiting',
                        'player_username': self.player.username,
                        'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                    }))
            else:
                await self.send(text_data=json.dumps({
                    'status': 'waiting',
                    'player_username': self.player.username,
                    'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                }))

    async def handle_match_start(self, game_room, opponent):
        await asyncio.sleep(1)
        user1 = await self.check_user(opponent)
        user2 = await self.check_user(self.player)

        if user1 and user2:
            await self.send(text_data=json.dumps({
                'status': 'match_found',
                'room_name': game_room.room_name
            }))

            await self.channel_layer.group_send(
                f'player_{opponent.id}',
                {
                    'type': 'match.found',
                    'room_name': game_room.room_name,
                    'game': 'start',
                    'opponent_username': self.player.username,
                    'opponent_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                }
            )
            
            await self.send(text_data=json.dumps({
                'status': 'match_found',
                'room_name': game_room.room_name,
                'opponent_username': opponent.username,
                'opponent_avatar': urllib.parse.unquote(opponent.avatar.url[1:] if opponent.avatar.url.startswith('/') else opponent.avatar.url) if opponent.avatar else None,
                'player_username': self.player.username,
                'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                'time': 'stop',
                'game': 'start',
                'player_side': 'right', 
            }))

    async def check_user(self, user):
        if user not in GameConsumer2.active_connections:
            return False
        else:
            logger.info(f"User {user} found in active connections")
            return True

    async def add_player_to_queue(self):
        """Add the current player to the matchmaking queue if not already there."""
        queue_length = redis_instance.llen('pingpong_1to1_matchmaking_queue')

        if self.player.id not in await self.get_queue_ids():
            redis_instance.rpush('pingpong_1to1_matchmaking_queue', self.player.id)
        else:
            print(f"Player {self.player.username} is already in the queue.")

    async def get_queue_ids(self):
        """Get all player IDs currently in the matchmaking queue."""
        queue = redis_instance.lrange('pingpong_1to1_matchmaking_queue', 0, -1)  # No await needed here
        return set(queue) 

    async def match_found(self, event):
        """ Asynchronously send match found event to the player """
        opponent_username = event['opponent_username']
        player_username = self.player.username
        await self.send(text_data=json.dumps({
            'status': 'match_found',
            'room_name': event['room_name'],
            'opponent_username': opponent_username,
            'opponent_avatar': event['opponent_avatar'],
            'player_username': player_username,
            'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
            'time': 'stop',
            'game': event['game'],
            'player_side': 'left',
        }))
        
        await self.remove_from_matchmaking_queue()

    async def remove_from_matchmaking_queue(self):
        await database_sync_to_async(redis_instance.lrem)('pingpong_1to1_matchmaking_queue', 0, self.player.id)

    async def notify_opponent_if_exists(self):
        if self.player in GameConsumer2.map_players_matched:
            opponent = GameConsumer2.map_players_matched[self.player]
            del GameConsumer2.map_players_matched[self.player]
            opponent_group = f"player_{opponent.id}"
            await self.channel_layer.group_send(
                opponent_group,
                {
                    'type': 'opponent_left',
                    'message': f"{self.player.username} has left the matchmaking queue. You are now alone in the queue.",
                    'status': 'waiting',
                    'player_username': opponent.username,
                    'player_avatar': get_avatar_url(opponent.avatar),
                }
            )

    async def opponent_left(self, event):
        """ Asynchronously send the opponent left message """
        await self.send(text_data=json.dumps({
            'status': event['status'],
            'message': event['message'],
            'player_username': event['player_username'],
            'player_avatar': event['player_avatar'],
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await getUser(decoded_token.get('user_id'))
        return user

class GameConsumer2friend(AsyncWebsocketConsumer):
    map_players_matched = {}
    active_connections = []

    async def connect(self):
        try:
            user = await self.check_token()
            max_id = self.scope['url_route']['kwargs']['max_id']
            min_id = self.scope['url_route']['kwargs']['min_id']
            
            self.matchmakingqueue = f'matchmakingqueue_{max_id}_{min_id}'
            self.player, created = await database_sync_to_async(Player.objects.get_or_create)(username=user.username, avatar=user.avatar)
            await database_sync_to_async(self.player.save)()
            if not self.player.is_active:
                await database_sync_to_async(MatchmakingQueue.objects.create)(player=self.player)
                await self.validate_active_connections()
                await self.add_player_to_queue()
                if self.player not in GameConsumer2friend.active_connections:
                    GameConsumer2friend.active_connections.append(self.player)
                await database_sync_to_async(self.player.save)()
                await self.channel_layer.group_add(
                    f'player_{self.player.id}',
                    self.channel_name
                )
            await self.accept()
            queue_length = await database_sync_to_async(redis_instance.llen)(self.matchmakingqueue)
            if queue_length == 1:
                receiver_id = max_id if int(min_id) == int(user.id) else min_id
                receiver = await getUser(receiver_id)
                notification = await sync_to_async(Notification.objects.create)(
                    sender=user,
                    sender_id=user.id,
                    receiver=receiver,
                    type='match_invitation',
                    message=f'{user.username} invited you to play a match',
                    is_read=False,
                    game_id=user.id,
                )
                await sync_to_async(notification.save)()
        except DenyConnection:
            await self.close()

    async def flush_queue(self):
        try:
            await database_sync_to_async(redis_instance.delete)(self.matchmakingqueue)
            GameConsumer2friend.map_players_matched.clear()
        except Exception as e:
            logger.error(f"Failed to flush the queue: {e}")

    async def validate_active_connections(self):
        for player in list(GameConsumer2friend.active_connections):
            if not await self.check_user(player):
                GameConsumer2friend.active_connections.remove(player)
                await database_sync_to_async(redis_instance.lrem)(self.matchmakingqueue, 0, player.id)
        
        if len(GameConsumer2friend.active_connections) == 0:
            await self.flush_queue()

    async def disconnect(self, close_code):
        await self.notify_opponent_if_exists()
        await database_sync_to_async(redis_instance.lrem)(self.matchmakingqueue, 0, self.player.id)
        await self.channel_layer.group_discard(f'player_{self.player.id}', self.channel_name)
        if self.player.is_active:
            self.player.is_active = False
            await database_sync_to_async(self.player.save)()
        if self.player in GameConsumer2friend.active_connections:
            GameConsumer2friend.active_connections.remove(self.player)
        if len(GameConsumer2friend.active_connections) == 0:
            redis_instance.delete(self.matchmakingqueue)
        await self.validate_active_connections()

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['message'] == 'Enter Queue':
            queue_length = await database_sync_to_async(redis_instance.llen)(self.matchmakingqueue)
            if queue_length == 2:
                opponent_id1 = await database_sync_to_async(redis_instance.rpop)(self.matchmakingqueue)
                opponent_id = await database_sync_to_async(redis_instance.rpop)(self.matchmakingqueue)
                if opponent_id and opponent_id1 and opponent_id != opponent_id1:
                    opponent = await database_sync_to_async(Player.objects.get)(id=opponent_id)
                    GameConsumer2friend.map_players_matched[opponent] = self.player
                    GameConsumer2friend.map_players_matched[self.player] = opponent
                    self.opponent = opponent
                    room_name = make_key(20)
                    game_room = await database_sync_to_async(GameRoom.objects.create)(room_name=room_name, player1=self.player, player2=opponent)
                    await database_sync_to_async(OneToOneHistory.objects.create)(
                        game_type="pingpong", player1=self.player.username, player2=opponent.username,
                        player2_avatar=self.player.avatar, player1_avatar=opponent.avatar, score1=0, score2=0, room_name=room_name
                    )
                    self.player.is_active = False
                    opponent.is_active = False
                    self.player.player_side = 'right'
                    opponent.player_side = 'left'
                    await database_sync_to_async(self.player.save)()
                    await database_sync_to_async(opponent.save)()

                    await self.send(text_data=json.dumps({
                        'status': 'match_found',
                        'room_name': game_room.room_name
                    }))

                    await self.channel_layer.group_send(
                        f'player_{opponent.id}',
                        {
                            'type': 'match.found',
                            'room_name': game_room.room_name,
                            'game': 'notstart',
                            'opponent_username': self.player.username,
                            'opponent_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                        }
                    )

                    await self.send(text_data=json.dumps({
                        'status': 'match_found',
                        'room_name': game_room.room_name,
                        'opponent_username': opponent.username,
                        'opponent_avatar': urllib.parse.unquote(opponent.avatar.url[1:] if opponent.avatar.url.startswith('/') else opponent.avatar.url) if opponent.avatar else None,
                        'player_username': self.player.username,
                        'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                        'time': 'stop',
                        'game': 'notstart',
                        'player_side': 'right', 
                    }))
                    
                    await self.handle_match_start(game_room, opponent)
                else:
                    await self.add_player_to_queue()
                    await self.send(text_data=json.dumps({
                        'status': 'waiting',
                        'player_username': self.player.username,
                        'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                    }))
            else:
                await self.send(text_data=json.dumps({
                    'status': 'waiting',
                    'player_username': self.player.username,
                    'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                }))

    async def handle_match_start(self, game_room, opponent):
        """ Asynchronous method to handle match start with a delay """
        await asyncio.sleep(1)
        user1 = await self.check_user(opponent)
        user2 = await self.check_user(self.player)

        if user1 and user2:
            await self.send(text_data=json.dumps({
                'status': 'match_found',
                'room_name': game_room.room_name
            }))

            await self.channel_layer.group_send(
                f'player_{opponent.id}',
                {
                    'type': 'match.found',
                    'room_name': game_room.room_name,
                    'game': 'start',
                    'opponent_username': self.player.username,
                    'opponent_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                }
            )
            
            await self.send(text_data=json.dumps({
                'status': 'match_found',
                'room_name': game_room.room_name,
                'opponent_username': opponent.username,
                'opponent_avatar': urllib.parse.unquote(opponent.avatar.url[1:] if opponent.avatar.url.startswith('/') else opponent.avatar.url) if opponent.avatar else None,
                'player_username': self.player.username,
                'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                'time': 'stop',
                'game': 'start',
                'player_side': 'right', 
            }))

    async def check_user(self, user):
        if user not in GameConsumer2friend.active_connections:
            return False
        else:
            return True

    async def add_player_to_queue(self):
        queue_length = redis_instance.llen(self.matchmakingqueue)

        if self.player.id not in await self.get_queue_ids():
            redis_instance.rpush(self.matchmakingqueue, self.player.id)

    async def get_queue_ids(self):
        queue = redis_instance.lrange(self.matchmakingqueue, 0, -1)
        return set(queue) 

    async def match_found(self, event):
        opponent_username = event['opponent_username']
        player_username = self.player.username
        await self.send(text_data=json.dumps({
            'status': 'match_found',
            'room_name': event['room_name'],
            'opponent_username': opponent_username,
            'opponent_avatar': event['opponent_avatar'],
            'player_username': player_username,
            'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
            'time': 'stop',
            'game': event['game'],
            'player_side': 'left',
        }))
        
        await self.remove_from_matchmaking_queue()

    async def decline_match(self, event):
        await self.send(text_data=json.dumps({
            'type': 'decline_match',
            'status': 'decline_match',
        }))

    async def remove_from_matchmaking_queue(self):
        await database_sync_to_async(redis_instance.lrem)(self.matchmakingqueue, 0, self.player.id)

    async def notify_opponent_if_exists(self):
        if self.player in GameConsumer2friend.map_players_matched:
            opponent = GameConsumer2friend.map_players_matched[self.player]
            del GameConsumer2friend.map_players_matched[self.player]
            opponent_group = f"player_{opponent.id}"
            await self.channel_layer.group_send(
                opponent_group,
                {
                    'type': 'opponent_left',
                    'message': f"{self.player.username} has left the matchmaking queue. You are now alone in the queue.",
                    'status': 'waiting',
                    'player_username': opponent.username,
                    'player_avatar': get_avatar_url(opponent.avatar),
                }
            )

    async def opponent_left(self, event):
        """ Asynchronously send the opponent left message """
        await self.send(text_data=json.dumps({
            'status': event['status'],
            'message': event['message'],
            'player_username': event['player_username'],
            'player_avatar': event['player_avatar'],
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await getUser(decoded_token.get('user_id'))
        return user

class RemoteConsumer2(AsyncWebsocketConsumer):
    game_states = {}
    game_tasks = {}
    active_connections = {}
    lock = asyncio.Lock()
    game_results_processed = []
    game_over_rooms = {}

    async def connect(self):
        username = await self.check_token()
        self.player, created = await sync_to_async(Player.objects.get_or_create)(username=username)
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"game_{self.room_name}"
        
        if self.room_group_name not in RemoteConsumer2.game_states:
            RemoteConsumer2.game_states[self.room_group_name] = {
                'ball': {'x': 0, 'y': 0, 'dx': 1, 'dy': 1, 'radius': 4, 'speed': 2},
                'paddles': {
                    'left': {'x': -143, 'y': 0, 'z': 1, 'width': 7, 'height': 20, 'dy': 0},
                    'right': {'x': 143, 'y': 0, 'z': 1, 'width': 7, 'height': 20, 'dy': 0}
                },
                'score': {'left': 0, 'right': 0},
                'chrono': 10
            }
            RemoteConsumer2.active_connections[self.room_group_name] = 0

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        RemoteConsumer2.active_connections[self.room_group_name] += 1

        self.player_side = 'left' if RemoteConsumer2.active_connections[self.room_group_name] == 1 else 'right'

        if self.room_group_name not in RemoteConsumer2.game_tasks:
            RemoteConsumer2.game_tasks[self.room_group_name] = asyncio.create_task(self.game_loop())
        # if len(RemoteConsumer2.active_connections[self.room_group_name]) == 1:
        #     await asyncio.sleep(5)
        #     await self.channel_layer.group_send(
        #         self.room_group_name,
        #         {
        #             'type': 'game_interupted',
        #             'message': 'Game interrupted',
        #         }
        #     )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if self.room_group_name in RemoteConsumer2.active_connections:
            RemoteConsumer2.active_connections[self.room_group_name] -= 1
            if RemoteConsumer2.active_connections[self.room_group_name] == 1 :
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_interupted',
                        'message': 'Game interrupted',
                    }
                )
            if RemoteConsumer2.active_connections[self.room_group_name] == 0 :
                if RemoteConsumer2.game_tasks[self.room_group_name]:
                    RemoteConsumer2.game_tasks[self.room_group_name].cancel()
                    del RemoteConsumer2.game_tasks[self.room_group_name]
                    del RemoteConsumer2.game_states[self.room_group_name]
                    del RemoteConsumer2.active_connections[self.room_group_name]


    async def receive(self, text_data):
        data = json.loads(text_data)
        state = RemoteConsumer2.game_states[self.room_group_name]

        if data.get('type') == 'game_interrupted':
            await self.broadcast_game_interrupted()

        if data.get('type') == 'game_result':
            await self.update_user_data(data)

        if data.get('message') == 'start':
            await self.send_game_state()
        
        if 'paddle_move' in data:
            direction = data['paddle_move']
            paddle = state['paddles'][self.player_side]
            if direction == 'up':
                if paddle['y'] < 150 * 0.45:
                    paddle['dy'] = 1.5
                else:
                    paddle['dy'] = 0
            elif direction == 'down':
                if paddle['y'] > -150 * 0.45:
                    paddle['dy'] = -1.5
                else:
                    paddle['dy'] = 0
            else:
                paddle['dy'] = 0

    async def send_game_state(self):
        state = RemoteConsumer2.game_states[self.room_group_name]
        state['chrono_display'] = self.format_chrono(state['chrono'])
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': state
            }
        )

    async def game_state(self, event):
        state = event['state']
        await self.send(text_data=json.dumps(state))

    async def game_loop(self):
        game_duration = 10
        for _ in range(int(game_duration / 0.02)):
            await self.update_game_state()
            await asyncio.sleep(0.02)
            await self.update_chrono()
            await self.send_game_state()

        await self.broadcast_game_over()

    async def update_game_state(self):
        state = RemoteConsumer2.game_states[self.room_group_name]
        ball = state['ball']
        paddle_left = state['paddles']['left']
        paddle_right = state['paddles']['right']
        score1 = state['score']['left']
        score2 = state['score']['right']
        
        ball['x'] += ball['dx'] * ball['speed']
        ball['y'] += ball['dy'] * ball['speed']

        if ball['y'] <= -75 or ball['y'] >= 75:
            ball['dy'] *= -1

        if ball['dx'] < 0:
            if (ball['x'] - ball['radius'] <= paddle_left['x'] + paddle_left['width'] and
                paddle_left['y'] - paddle_left['height'] / 2 <= ball['y'] <= paddle_left['y'] + paddle_left['height'] / 2):
                ball['dx'] = -ball['dx']
                ball['dy'] += paddle_left['dy'] * 0.2

        if ball['dx'] > 0:
            if (ball['x'] + ball['radius'] >= paddle_right['x'] - paddle_right['width'] and
                paddle_right['y'] - paddle_right['height'] / 2 <= ball['y'] <= paddle_right['y'] + paddle_right['height'] / 2):
                ball['dx'] = -ball['dx']
                ball['dy'] += paddle_right['dy'] * 0.2

        if ball['x'] <= -150:
            score2 += 1
            self.reset_ball()
        elif ball['x'] >= 150:
            score1 += 1
            self.reset_ball()

        paddle_left['y'] += paddle_left['dy']
        paddle_right['y'] += paddle_right['dy']

        state['score']['left'] = score1
        state['score']['right'] = score2

    async def update_chrono(self):
        state = RemoteConsumer2.game_states[self.room_group_name]
        if state['chrono'] > 0:
            state['chrono'] -= 0.02
        else:
            state['chrono'] = 0

    def format_chrono(self, chrono):
        minutes = int(chrono) // 60
        seconds = int(chrono) % 60
        return f"{minutes:02}:{seconds:02}"

    def reset_ball(self):
        state = RemoteConsumer2.game_states[self.room_group_name]
        state['ball']['x'] = 0
        state['ball']['y'] = 0
        state['ball']['dx'] = -state['ball']['dx']
        state['ball']['dy'] = 1
    
    async def update_user_data(self, data):
        room_name = self.room_group_name
        winner = data.get('winner')
        loser = data.get('loser')
        test = f"Room: {room_name}, player: {self.player.username}"
        
        async with RemoteConsumer2.lock:
            if test not in RemoteConsumer2.game_results_processed:
                RemoteConsumer2.game_results_processed.append(test)
                if self.player.username == winner:
                    await self.user_is_winner(data)
                else:
                    await self.user_is_loser(data)

    async def update_history(self, user, data):
        winner = data.get('winner')
        loser = data.get('loser')
        state = RemoteConsumer2.game_states[self.room_group_name]
        score1 = state['score']['left']
        score2 = state['score']['right']

        history1, created = await database_sync_to_async(OneToOneHistory.objects.get_or_create)(player1=user.username, player2=loser, room_name=self.room_name)

        # history1 = history1.first()
        
        history2, created = await database_sync_to_async(OneToOneHistory.objects.get_or_create)(player1=loser, player2=user.username, room_name=self.room_name)
        # history2 = history2.first()

        if history1:
            history1.score1 = max(score1, score2)
            history1.score2 = min(score1, score2)
            await database_sync_to_async(history1.save)()

        if history2:
            history2.score2 = max(score1, score2)
            history2.score1 = min(score1, score2)
            await database_sync_to_async(history2.save)()

    # async def update_history_(self, user, data):
    #     winner = data.get('winner')
    #     loser = data.get('loser')
    #     state = RemoteConsumer2.game_states[self.room_group_name]
    #     score1 = state['score']['left']
    #     score2 = state['score']['right']
    #     winner_player, created = await database_sync_to_async(Player.objects.get_or_create)(username=winner)

    #     history1, created = await database_sync_to_async(OneToOneHistory.objects.get_or_create)(player1=user.username, player2=winner, room_name=self.room_name)

    #     # history1 = history1.first()
        
    #     history2, created = await database_sync_to_async(OneToOneHistory.objects.get_or_create)(player1=winner, player2=user.username, room_name=self.room_name)

    #     # history2 = history2.first()

    #     if history2:
    #         history1.score1 = max(score1, score2)
    #         history1.score2 = min(score1, score2)
    #         await database_sync_to_async(history1.save)()

    #     if history1:
    #         history2.score2 = max(score1, score2)
    #         history2.score1 = min(score1, score2)
    #         await database_sync_to_async(history2.save)()


    async def broadcast_game_over(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_over',
                'message': 'Game over',
                'final_scores': RemoteConsumer2.game_states[self.room_group_name]['score']
            }
        )

    async def broadcast_game_interrupted(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_interupted',
                'message': 'Game interrupted',
            }
        )

    async def game_interupted(self, event):
        if RemoteConsumer2.game_tasks[self.room_group_name]:
            RemoteConsumer2.game_tasks[self.room_group_name].cancel()
            del RemoteConsumer2.game_tasks[self.room_group_name]
            del RemoteConsumer2.game_states[self.room_group_name]
            del RemoteConsumer2.active_connections[self.room_group_name]
        await self.send(text_data=json.dumps({
            'type': 'game_interupted',
            'message': event['message'],
        }))

    async def game_over(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_over',
            'message': event['message'],
            'final_scores': event['final_scores']
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await getUser(decoded_token.get('user_id'))
        return user.username if user else None

    async def user_is_winner(self, data):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_token.get('user_id')
            
            user = await getUser(user_id)
            
            if user:
                user.total_match += 1
                user.xp += 100
                user.win += 1
                user.level_progress += 10
                if user.win == 1 and not user.first_match_won:
                    await sync_to_async(Achievement.objects.create)(
                        user=user,
                        achievement_type='First Match Won',
                        description='You won your first match!'
                    )
                    user.first_match_won = True
                if user.win % 5 == 0:
                    await sync_to_async(Achievement.objects.create)(
                        user=user,
                        achievement_type=f'{user.win} Wins!',
                        description=f'You have won {user.win} matches!'
                    )
                if user.xp >= user.xp_periodic:
                    await sync_to_async(Achievement.objects.create)(
                        user=user,
                        achievement_type='Periodic XP Reward',
                        description=f'You earned {user.xp} XP!'
                    )
                    user.xp_periodic += 500
                
                user.update_daily_winning_rate(user.win)
                await self.update_history(user, data)
                await sync_to_async(user.save)()

        except jwt.ExpiredSignatureError:
            raise DenyConnection("Token has expired")
        except jwt.InvalidTokenError:
            raise DenyConnection("Invalid token")
        except (ObjectDoesNotExist, DatabaseError):
            raise DenyConnection("User does not exist or database error")


    async def user_is_loser(self, data):
            token = self.scope['cookies'].get('my-token')
            if not token:
                raise DenyConnection("No token provided")
            
            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_token.get('user_id')
                
                user = await getUser(user_id)
                
                if user:
                    user.total_match += 1
                    user.lose += 1
                    await sync_to_async(user.save)()

            except jwt.ExpiredSignatureError:
                raise DenyConnection("Token has expired")
            except jwt.InvalidTokenError:
                raise DenyConnection("Invalid token")
            except (ObjectDoesNotExist, DatabaseError):
                raise DenyConnection("User does not exist or database error")

    async def user_is_draw(self):
            token = self.scope['cookies'].get('my-token')
            if not token:
                raise DenyConnection("No token provided")
            
            try:
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_token.get('user_id')
                
                user = await getUser(user_id)
                
                if user:
                    user.total_match += 1
                    user.xp += 50
                    user.draw += 1
                    await sync_to_async(user.save)()

            except jwt.ExpiredSignatureError:
                raise DenyConnection("Token has expired")
            except jwt.InvalidTokenError:
                raise DenyConnection("Invalid token")
            except (ObjectDoesNotExist, DatabaseError):
                raise DenyConnection("User does not exist or database error")