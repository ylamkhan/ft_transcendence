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
from accounts.views import get_avatar_url
import urllib.parse
import logging

logger = logging.getLogger(__name__)

redis_instance = redis.StrictRedis(host='redis', port=6379, db=0)

class GameConsumer(AsyncWebsocketConsumer):
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
                if self.player not in GameConsumer.active_connections:
                    GameConsumer.active_connections.append(self.player)
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
        await database_sync_to_async(redis_instance.lrem)('tictactoe_1to1_matchmaking_queue', 0, self.player.id)
        await self.channel_layer.group_discard(f'player_{self.player.id}', self.channel_name)
        if self.player.is_active:
            self.player.is_active = False
            await database_sync_to_async(self.player.save)()
        if self.player in GameConsumer.active_connections:
            GameConsumer.active_connections.remove(self.player)
        if len(GameConsumer.active_connections) == 0:
            redis_instance.delete('tictactoe_1to1_matchmaking_queue')

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['message'] == 'Enter Queue':
            queue_length = await database_sync_to_async(redis_instance.llen)('tictactoe_1to1_matchmaking_queue')

            if queue_length >= 2:
                opponent_id1 = await database_sync_to_async(redis_instance.rpop)('tictactoe_1to1_matchmaking_queue')
                opponent_id = await database_sync_to_async(redis_instance.rpop)('tictactoe_1to1_matchmaking_queue')
                if opponent_id != opponent_id1:
                    opponent = await database_sync_to_async(Player.objects.get)(id=opponent_id)
                    GameConsumer.map_players_matched[opponent] = self.player
                    GameConsumer.map_players_matched[self.player] = opponent
                    self.opponent = opponent
                    room_name = make_key(20)
                    game_room = await database_sync_to_async(GameRoom.objects.create)(room_name=room_name, player1=self.player, player2=opponent)
                    await database_sync_to_async(OneToOneHistory.objects.create)(
                        game_type="tictactoe", player1=self.player.username, player2=opponent.username,
                        player1_avatar=self.player.avatar, player2_avatar=opponent.avatar, score1=0, score2=0, room_name=room_name
                    )
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
                        'player_letter':'o', 
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
                'player_letter':'o', 
            }))

    async def check_user(self, user):
        if user not in GameConsumer.active_connections:
            return False
        else:
            return True

    async def add_player_to_queue(self):
        """Add the current player to the matchmaking queue if not already there."""
        queue_length = redis_instance.llen('tictactoe_1to1_matchmaking_queue')

        if self.player.id not in await self.get_queue_ids():
            redis_instance.rpush('tictactoe_1to1_matchmaking_queue', self.player.id)
        else:
            print(f"Player {self.player.username} is already in the queue.")

    async def get_queue_ids(self):
        """Get all player IDs currently in the matchmaking queue."""
        queue = redis_instance.lrange('tictactoe_1to1_matchmaking_queue', 0, -1)  # No await needed here
        return set(queue)
    
    async def match_found(self, event):
        opponent_username = event['opponent_username']
        player_username = self.player.username
        await self.send(text_data=json.dumps({
            'status': 'match_found',
            'room_name': event['room_name'],
            'opponent_username': opponent_username,
            'opponent_avatar':event['opponent_avatar'],
            'player_username':player_username,
            'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
            'time':'stop',
            'game': event['game'],
            'player_letter':'x',  
        }))

        await self.remove_from_matchmaking_queue()

    async def remove_from_matchmaking_queue(self):
        await database_sync_to_async(redis_instance.lrem)('tictactoe_1to1_matchmaking_queue', 0, self.player.id)

    async def notify_opponent_if_exists(self):
        if self.player in GameConsumer.map_players_matched:
            opponent = GameConsumer.map_players_matched[self.player]
            del GameConsumer.map_players_matched[self.player]
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
        return user if user else None

import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import logging
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from django.db.models import Q

logger = logging.getLogger(__name__)

@sync_to_async
def update_match_score(match, score1, score2):
    match.score1 = score1
    match.score2 = score2
    match.save()

class RemoteConsumer(AsyncWebsocketConsumer):
    active_connections = {}
    game_matrices = {}
    winning_combinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    async def connect(self):
        try:
            self.user = await self.check_token()
            self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
            self.room_group_name = f"game_{self.room_name}"
            
            if self.room_group_name not in RemoteConsumer.active_connections:
                RemoteConsumer.active_connections[self.room_group_name] = 0
                RemoteConsumer.game_matrices[self.room_group_name] = self.initialize_game_matrix()
                self.player_type = 'O'

            if RemoteConsumer.active_connections[self.room_group_name] == 1:
                self.player_type = 'X'

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            RemoteConsumer.active_connections[self.room_group_name] += 1
        except DenyConnection:
            await self.close()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        RemoteConsumer.active_connections[self.room_group_name] -= 1

        if RemoteConsumer.active_connections[self.room_group_name] == 1:
            await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_interupted',
                        'status': 'game_interupted',
                        'message': 'Game interrupted',
                    }
                )

        if RemoteConsumer.active_connections[self.room_group_name] == 0:
                del RemoteConsumer.active_connections[self.room_group_name]
                del RemoteConsumer.game_matrices[self.room_group_name]

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if (data.get('message') == 'start'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send.message',
                    'click': 'ON',
                    'status': 'initialize',
                    'turnChange': False,
                }
            )
        else:
            row = data.get('row')
            col = data.get('col')
            changeTurn = data.get('changeTurn')
            
            if (changeTurn == False and self.player_type == 'X') or (changeTurn == True and self.player_type == 'O'):
                self.update_game_matrix(self.room_group_name, row, col, changeTurn)
                result = self.checkWinner(self.room_group_name)
                
                if result != '':
                    winner = self.player_type if result != 'd' else None
                    await self.update_match_history(winner)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'send.message',
                        'click': 'ON',
                        'result': result,
                        'turnChange': changeTurn,
                        'status': '',
                        'row': row,
                        'col': col,
                    }
                )

    async def update_match_history(self, winner):
        match = await self.get_match_history_record(self.user.username, self.room_name)

        if winner == 'X':
            await update_match_score(match, 0, 1)
        elif winner == 'O':
            await update_match_score(match, 1, 0)
        else:
            await update_match_score(match, 0, 0)

    async def get_match_history_record(self, player_username, room_name):
        match = await sync_to_async(OneToOneHistory.objects.get)(
            Q(player1=player_username, room_name=room_name) |
            Q(player2=player_username, room_name=room_name)
        )
        return match

    async def game_interupted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_interupted',
            'status': event['status'],
            'message': event['message'],
        }))

    async def send_message(self, event):
        if (event['status'] == 'initialize'):
            await self.send(text_data=json.dumps({
                'click': 'OFF',
                'status': event['status'],
                'turnChange': event['turnChange'],
            }))
        else:
            await self.send(text_data=json.dumps({
                'click': 'OFF',
                'result': event['result'],
                'status': event['status'],
                'turnChange': event['turnChange'],
                'row': event['row'],
                'col': event['col'],
            }))

    def initialize_game_matrix(self):
        return [['' for _ in range(3)] for _ in range(3)]

    def update_game_matrix(self, room_group_name, row, col, changeTurn):
        if room_group_name in RemoteConsumer.game_matrices:
            game_matrix = RemoteConsumer.game_matrices[room_group_name]
            value = 'O' if changeTurn else 'X'
            game_matrix[row][(col-1)%3] = value

    def checkWinner(self, room_group_name):
        if room_group_name not in RemoteConsumer.game_matrices:
            return ''

        game_matrix = RemoteConsumer.game_matrices[room_group_name]
        flat_matrix = [cell for row in game_matrix for cell in row]

        for combo in RemoteConsumer.winning_combinations:
            if flat_matrix[combo[0]] == flat_matrix[combo[1]] == flat_matrix[combo[2]] != '':
                return flat_matrix[combo[0]]

        if '' not in flat_matrix:
            return 'd'

        return ''

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await getUser(decoded_token.get('user_id'))
        return user if user else None