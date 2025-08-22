import json
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer
from accounts.models import GameRoom, MatchmakingQueue, Player, OneToOneHistory
from asgiref.sync import async_to_sync
from pingpong.utils import *
import redis
import jwt
from django.conf import settings
from channels.exceptions import DenyConnection
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer
import urllib.parse
from channels.layers import get_channel_layer
import logging
from accounts.views import get_avatar_url

logger = logging.getLogger(__name__)

redis_instance = redis.StrictRedis(host='redis', port=6379, db=0)

class GameConsumer1(AsyncWebsocketConsumer):
    map_players_matched = {}
    active_connections = []

    async def connect(self):
        try:
            user = await self.check_token()
            self.player, created = await database_sync_to_async(Player.objects.get_or_create)(username=user.username, avatar=user.avatar)
            await database_sync_to_async(self.player.save)()

            if not self.player.is_active:
                await database_sync_to_async(MatchmakingQueue.objects.create)(player=self.player)
                await self.add_player_to_queue()
                if self.player not in GameConsumer1.active_connections:
                    GameConsumer1.active_connections.append(self.player)
                await database_sync_to_async(self.player.save)()
                await self.channel_layer.group_add(
                    f'player_{self.player.id}',
                    self.channel_name
                )
            await self.accept()
        except DenyConnection:
            await self.close()

    async def disconnect(self, close_code):
        await self.notify_opponent_if_exists()
        await database_sync_to_async(redis_instance.lrem)('rps_1to1_matchmaking_queue', 0, self.player.id)
        await self.channel_layer.group_discard(f'player_{self.player.id}', self.channel_name)
        if self.player.is_active:
            self.player.is_active = False
            await database_sync_to_async(self.player.save)()
        if self.player in GameConsumer1.active_connections:
            GameConsumer1.active_connections.remove(self.player)
        if len(GameConsumer1.active_connections) == 0:
            redis_instance.delete('rps_1to1_matchmaking_queue')

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['message'] == 'Enter Queue':
            queue_length = await database_sync_to_async(redis_instance.llen)('rps_1to1_matchmaking_queue')

            if queue_length >= 2:
                opponent_id1 = await database_sync_to_async(redis_instance.rpop)('rps_1to1_matchmaking_queue')
                opponent_id = await database_sync_to_async(redis_instance.rpop)('rps_1to1_matchmaking_queue')
                if opponent_id != opponent_id1:
                    opponent = await database_sync_to_async(Player.objects.get)(id=opponent_id)
                    GameConsumer1.map_players_matched[opponent] = self.player
                    GameConsumer1.map_players_matched[self.player] = opponent
                    self.opponent = opponent
                    room_name = make_key(20)
                    game_room = await database_sync_to_async(GameRoom.objects.create)(room_name=room_name, player1=self.player, player2=opponent)
                    self.player.is_active = False
                    opponent.is_active = False
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
        if user not in GameConsumer1.active_connections:
            return False
        else:
            return True

    async def add_player_to_queue(self):
        """Add the current player to the matchmaking queue if not already there."""
        queue_length = redis_instance.llen('rps_1to1_matchmaking_queue')

        if self.player.id not in await self.get_queue_ids():
            redis_instance.rpush('rps_1to1_matchmaking_queue', self.player.id)
        else:
            print(f"Player {self.player.username} is already in the queue.")

    async def get_queue_ids(self):
        """Get all player IDs currently in the matchmaking queue."""
        queue = redis_instance.lrange('rps_1to1_matchmaking_queue', 0, -1)  # No await needed here
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
        await database_sync_to_async(redis_instance.lrem)('rps_1to1_matchmaking_queue', 0, self.player.id)

    async def notify_opponent_if_exists(self):
        if self.player in GameConsumer1.map_players_matched:
            opponent = GameConsumer1.map_players_matched[self.player]
            del GameConsumer1.map_players_matched[self.player]
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

import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio

class RemoteConsumer1(AsyncWebsocketConsumer):
    active_connections = {}
    player_actions = {}
    outcomes = {
        "RR": "Draw",
        "RP": "second",
        "RS": "first",
        "PP": "Draw",
        "PR": "first",
        "PS": "second",
        "SS": "Draw",
        "SR": "second",
        "SP": "first",
    }

    async def connect(self):
        try:
            self.user = await self.check_token()
            self.player, created = await database_sync_to_async(Player.objects.get_or_create)(
                username=self.user.username, avatar=self.user.avatar)
            await database_sync_to_async(self.player.save)()

            self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
            self.room_group_name = f"game_{self.room_name}"

            if self.room_group_name not in RemoteConsumer1.active_connections:
                RemoteConsumer1.active_connections[self.room_group_name] = {'first_player': None, 'second_player': None}
                RemoteConsumer1.player_actions[self.room_group_name] = await self.initialize_player_actions()

            if RemoteConsumer1.active_connections[self.room_group_name]['first_player'] is None:
                RemoteConsumer1.active_connections[self.room_group_name]['first_player'] = self.user.username
                self.player_type = 'first'
            elif RemoteConsumer1.active_connections[self.room_group_name]['second_player'] is None:
                RemoteConsumer1.active_connections[self.room_group_name]['second_player'] = self.user.username
                self.player_type = 'second'
            else:
                await self.close()

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()

        except DenyConnection:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        if self.player_type == 'first':
            RemoteConsumer1.active_connections[self.room_group_name]['first_player'] = None
        elif self.player_type == 'second':
            RemoteConsumer1.active_connections[self.room_group_name]['second_player'] = None

        if (RemoteConsumer1.active_connections[self.room_group_name]['first_player'] is None and
                RemoteConsumer1.active_connections[self.room_group_name]['second_player'] is None):
            del RemoteConsumer1.active_connections[self.room_group_name]
            del RemoteConsumer1.player_actions[self.room_group_name]
        if self.room_group_name in RemoteConsumer1.active_connections:
            await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_interupted',
                        'status': 'game_interupted',
                        'message': f'{self.user.username} left the match',
                    }
                )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')
        changeTurn = data.get('changeTurn')
        
        if (changeTurn == False and self.player_type == 'second') or (changeTurn == True and self.player_type == 'first'):
            changeTurn = not changeTurn
            player_actions = RemoteConsumer1.player_actions.get(self.room_group_name, None)
            if player_actions and self.player_type in player_actions:
                RemoteConsumer1.player_actions[self.room_group_name][self.player_type] = action       

            result, winner = await self.checkWinner(self.room_group_name)
            first_player = RemoteConsumer1.active_connections[self.room_group_name]["first_player"]
            second_player = RemoteConsumer1.active_connections[self.room_group_name]["second_player"]
            
            if result in ["Draw", "first", "second"]:
                RemoteConsumer1.player_actions[self.room_group_name] = self.initialize_player_actions()
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send.message',
                    'click': 'ON',
                    'result': result,
                    'winner': winner,
                    'turnChange': changeTurn,
                    'status': '',
                    'action': action,
                    'first': first_player,
                    'second': second_player,
                }
            )

    async def game_interupted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_interupted',
            'status': event['status'],
            'message': event['message'],
        }))

    async def send_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'send_message',
            'click': 'OFF',
            'winner': event['winner'],
            'result': event['result'],
            'status': event['status'],
            'turnChange': event['turnChange'],
            'action': event['action'],
            'first': event['first'],
            'second': event['second'],
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await getUser(decoded_token.get('user_id'))
        return user

    async def initialize_player_actions(self):
        return {'first': None, 'second': None}

    async def checkWinner(self, room_group_name):
        player_actions = RemoteConsumer1.player_actions[room_group_name]
        first_action = player_actions['first']
        second_action = player_actions['second']

        if first_action and second_action:
            result_key = first_action + second_action
            result = RemoteConsumer1.outcomes.get(result_key, "Invalid")
            
            first_player = RemoteConsumer1.active_connections[room_group_name]["first_player"]
            second_player = RemoteConsumer1.active_connections[room_group_name]["second_player"]
            
            if result == "first":
                winner = first_player
            elif result == "second":
                winner = second_player
            else:
                winner = None
            return result, winner

        return "Invalid", None
