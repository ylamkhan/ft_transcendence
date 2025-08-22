import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from accounts.models import *
from django.utils import timezone
import redis
from django.db import models
import jwt
from django.conf import settings
from channels.exceptions import DenyConnection
from channels.db import database_sync_to_async
from .utils import *
from channels.generic.websocket import WebsocketConsumer
import logging
from accounts.views import get_avatar_url

logger = logging.getLogger(__name__)
redis_instance = redis.StrictRedis(host='redis', port=6379, db=0)

def clear_redis():
        redis_instance.flushdb()

class TournamentList(WebsocketConsumer):
    def connect(self):
        self.accept()
        self.send_existing_tournaments()

    def disconnect(self, close_code):
        self.close()

    def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'create_tournament':
            tournament_name = data.get('tournamentName')

            if RemoteTournament.objects.filter(name=tournament_name).exists():
                self.send(text_data=json.dumps({
                    'type': 'duplicate'
                }))
            else:
                RemoteTournament.objects.create(name=tournament_name)
                self.send_existing_tournaments()

    def send_existing_tournaments(self):
        tournaments = RemoteTournament.objects.filter(finished=False).values_list('name', flat=True)
        
        self.send(text_data=json.dumps({
            'type': 'tournament_list',
            'tournaments': list(tournaments)
        }))

class TournamentConsumer(AsyncWebsocketConsumer):
    connected_players = {}
    tournament_winners = {}
    players_map = {}
    drawn_players = {}
    matches_map = {}
    final_winner_list = []

    async def connect(self):
        try:
            self.user = await self.check_token()
            self.profile_picture = self.user.avatar
            self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
            self.tournament_group_name = f'tournament_{self.tournament_name}'
            self.nickname = self.user.nickname if self.user.nickname else self.user.username
            self.player, created = await self.get_or_create_player(self.user.username, self.profile_picture, self.nickname)
            await sync_to_async(self.player.save)()

            await self.channel_layer.group_add(
                self.tournament_group_name,
                self.channel_name
            )
            await self.accept()

            if self.tournament_name not in TournamentConsumer.connected_players:
                TournamentConsumer.connected_players[self.tournament_name] = []

            if not any(player['player'] == self.player for player in TournamentConsumer.connected_players[self.tournament_name]):
                TournamentConsumer.connected_players[self.tournament_name].append({
                    'player': self.player,
                    'nickname': self.nickname,
                    'channel_name': self.channel_name
                })
                TournamentConsumer.players_map[self.player.username] = self.player


            players = await self.get_players(self.tournament_name)
            player_list = [{
                'player_name': player.username,
                'player_nickname': player.nickname,
                'profile_picture_url': get_avatar_url(player.avatar)
            } for player in players]

            await self.send(text_data=json.dumps({
                'type': 'player_joined',
                'player_name': self.player.username,
                'player_nickname': self.player.nickname,
                'profile_picture_url': get_avatar_url(self.player.avatar),
                'players': player_list
            }))

            await self.channel_layer.group_send(
                self.tournament_group_name,
                {
                    'type': 'player_list_update',
                    'player_name': self.player.username,
                    'player_nickname': self.player.nickname,
                    'profile_picture_url': get_avatar_url(self.player.avatar),
                    'players': player_list
                }
            )
            await asyncio.sleep(5)

            if len(TournamentConsumer.connected_players[self.tournament_name]) == 4:
                all_players = [{"username": p['player'].username, "nickname": p['nickname']} for p in TournamentConsumer.connected_players[self.tournament_name]]
                await self.send(text_data=json.dumps({
                    'type': 'show_shema',
                    'round': 'one',
                    'players': all_players,
                    'nicknames': []
                }))
                await self.channel_layer.group_send(
                    self.tournament_group_name,
                    {
                        'type': 'show_shema',
                        'round': 'one',
                        'players': all_players,
                        'nicknames': []
                    }
                )

                await asyncio.sleep(5)
                players = [p['player'] for p in TournamentConsumer.connected_players[self.tournament_name]]
                await self.create_tournament_and_matches(players)

                
        except DenyConnection:
            await self.close()

    async def team_locked(self, event):
        await self.send(text_data=json.dumps({
            'type': 'team_locked',
            'players': event['players']
        }))

    async def show_shema(self, event):
        await self.send(text_data=json.dumps({
            'type': 'show_shema',
            'round': event['round'],
            'players': event['players'],
            'nicknames': event['nicknames']
        }))

    async def player_list_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_list_update',
            'players': event['players']
        }))


    async def disconnect(self, close_code):
        if self.tournament_name in TournamentConsumer.connected_players:
            TournamentConsumer.connected_players[self.tournament_name] = [
                p for p in TournamentConsumer.connected_players[self.tournament_name] if p['player'].id != self.player.id
            ]

            if len(TournamentConsumer.connected_players[self.tournament_name]) == 0:
                del TournamentConsumer.connected_players[self.tournament_name]

        await self.channel_layer.group_discard(
            self.tournament_group_name,
            self.channel_name
        )

        if self.player not in TournamentConsumer.matches_map:
            connected_players = TournamentConsumer.connected_players.get(self.tournament_name, [])
            player_list = [{
                'player_name': player_info['player'].username,
                'profile_picture_url': get_avatar_url(player_info['player'].avatar)
            } for player_info in connected_players]

            await self.channel_layer.group_send(
                self.tournament_group_name,
                {
                    'type': 'player_list_update',
                    'player_name': self.player.username,
                    'profile_picture_url': get_avatar_url(self.player.avatar),
                    'players': player_list
                }
            )
        else:
            del TournamentConsumer.matches_map[self.player]
            await self.channel_layer.group_send(
                self.tournament_group_name,
                {
                    'type': 'player_left',
                    'player': self.player.id,
                }
            )

    async def player_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_left',
            'player': event['player']
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data['action']

        if action == 'match_finished':
            winner = data['winner']
            loser = data['loser']
            if winner == 'Draw':
                await self.handle_match_drawn(data)
            else:
                await self.handle_match_winner(winner, loser)
        if action == 'final':
            await self.handle_final_match(data['winner'])
        if action == 'player_left':
            await self.check_player(data['player'], data['round'])

    async def check_player(self, player, round):
        if self.player in TournamentConsumer.matches_map:
            player_left = await getPlayer(player)
            if TournamentConsumer.matches_map[self.player] == player_left:
                if round == 1:
                    await self.handle_match_winner(self.player.username, player_left.username)
                else:
                    await self.handle_final_match(self.player.username)

    async def handle_match_drawn(self, data):
        room_name = data['room_name']
        
        if room_name not in TournamentConsumer.drawn_players:
            TournamentConsumer.drawn_players[room_name] = []
        
        if self.player not in TournamentConsumer.drawn_players[room_name]:
            TournamentConsumer.drawn_players[room_name].append(self.player)

        if len(TournamentConsumer.drawn_players[room_name]) == 2:
            tournament = await self.get_or_create_tournament()
            all_players = [{"username": p['player'].username} for p in TournamentConsumer.connected_players[self.tournament_name]]
            
            player1_user = TournamentConsumer.drawn_players[room_name][0]
            player2_user = TournamentConsumer.drawn_players[room_name][1]

            match, created = await sync_to_async(RemoteMatch.objects.get_or_create)(
                player1=player1_user,
                player2=player2_user,
                tournament=tournament,
                round_number=data['round']
            )

            player1_channel_name = await self.get_channel_name_for_user(player1_user)
            player2_channel_name = await self.get_channel_name_for_user(player2_user)

            if player1_channel_name and player2_channel_name:
                await self.send(text_data=json.dumps({
                        'type': 'match_result',
                        'message': 'draw',
                        'winner': '',
                        'loser': '',
                        'winner_nickname': '',
                        'loser_nickname': '',
                        'leave': False
                }))
                await self.channel_layer.send(player1_channel_name, {
                    'type': 'match_result',
                    'message': 'draw',
                    'winner': '',
                    'loser': '',
                    'winner_nickname': '',
                    'loser_nickname': '',
                    'leave': False
                })
                await self.channel_layer.send(player2_channel_name, {
                    'type': 'match_result',
                    'message': 'draw',
                    'winner': '',
                    'loser': '',
                    'winner_nickname': '',
                    'loser_nickname': '',
                    'leave': False
                })
                await self.notify_new_match(player1_channel_name, player2_channel_name, player1_user.username, player2_user.username, all_players, match.id, data['round'])

    async def notify_new_match(self, player1_channel_name, player2_channel_name, player1_user, player2_user, all_players, matchid, round):
        await asyncio.sleep(5)

        if player1_channel_name and player2_channel_name:
            await self.channel_layer.send(player1_channel_name, {
                'type': 'matches_created',
                'message': 'show matchdiv',
                'round': round,
                'match': {
                    'match_id': matchid,
                    'player': player1_user,
                    'opponent': player2_user,
                    'all_players': all_players
                }
            })

            await self.channel_layer.send(player2_channel_name, {
                'type': 'matches_created',
                'message': 'show matchdiv',
                'round': round,
                'match': {
                    'match_id': matchid,
                    'player': player2_user,
                    'opponent': player1_user,
                    'all_players': all_players
                }
            })

    async def handle_final_match(self, winner):
        tournament = await sync_to_async(RemoteTournament.objects.get)(name=self.tournament_name)
        tournament.finished = True
        await sync_to_async(tournament.save)()

        winners = TournamentConsumer.tournament_winners[self.tournament_name]
        winner1_username = winners[0]
        winner2_username = winners[1]

        user1 = TournamentConsumer.players_map[winner1_username]
        user2 = TournamentConsumer.players_map[winner2_username]

        winner1_channel_name = await self.get_channel_name_for_user(user1)
        winner2_channel_name = await self.get_channel_name_for_user(user2)

        if self.tournament_group_name not in TournamentConsumer.final_winner_list:
            TournamentConsumer.final_winner_list.append(self.tournament_group_name)
            if self.user.username == winner:
                await self.send(text_data=json.dumps({
                    'type': 'final_winner',
                    'message': f'{winner} is the final winner of the tournament!',
                    'final_winner': winner,
                    'winner_nickname': self.nickname
                }))
                if winner1_channel_name:
                    await self.channel_layer.send(winner1_channel_name, {
                        'type': 'final_winner',
                        'message': f'{winner} is the final winner of the tournament!',
                        'final_winner': winner,
                        'winner_nickname': self.nickname
                    }
                )
                if winner2_channel_name:
                    await self.channel_layer.send(winner2_channel_name, {
                        'type': 'final_winner',
                        'message': f'{winner} is the final winner of the tournament!',
                        'final_winner': winner,
                        'winner_nickname': self.nickname
                    }
                )
                await asyncio.sleep(5)
                await self.send(text_data=json.dumps({
                        'type': 'show_trophy',
                        'winner': winner,
                        'winner_nickname': self.nickname
                }))

                if winner1_channel_name:
                    await self.channel_layer.send(winner1_channel_name, {
                        'type': 'show_trophy',
                        'winner': winner,
                        'winner_nickname': self.nickname
                    }
                )
                if winner2_channel_name:
                    await self.channel_layer.send(winner2_channel_name, {
                        'type': 'show_trophy',
                        'winner': winner,
                        'winner_nickname': self.nickname
                    }
                )

                await asyncio.sleep(5)

                await self.send(text_data=json.dumps({
                        'type': 'leave_tournament',
                        'message': 'Tournament Is Ended'
                }))
                if winner1_channel_name:
                    await self.channel_layer.send(winner1_channel_name,
                    {
                        'type': 'leave_tournament',
                        'message': 'Tournament Is Ended'
                    }
                )
                if winner2_channel_name:
                    await self.channel_layer.send(winner2_channel_name,
                    {
                        'type': 'leave_tournament',
                        'message': 'Tournament Is Ended'
                    }
            )

            tournament.finished = True
            tournament.ended_at = timezone.now()
            await sync_to_async(tournament.save)()

            clear_redis()

    async def create_tournament_and_matches(self, players):
        tournament = await self.get_or_create_tournament()

        for player in players:
            remote_player = await sync_to_async(RemotePlayer.objects.get)(username=player.username)
            await sync_to_async(RemoteParticipant.objects.create)(
                tournament=tournament,
                player=remote_player
            )
            await sync_to_async(TournamentHistory.objects.create)(
                user=player.username,
                tournament=tournament
            )

        round_1 = await sync_to_async(RemoteRound.objects.create)(
            tournament=tournament,
            round_number=1
        )

        match_1 = await sync_to_async(RemoteMatch.objects.create)(
            player1=await sync_to_async(RemotePlayer.objects.get)(username=players[0].username),
            player2=await sync_to_async(RemotePlayer.objects.get)(username=players[1].username),
            tournament=tournament,
            round_number=1
        )
        TournamentConsumer.matches_map[players[0]] = players[1]
        TournamentConsumer.matches_map[players[1]] = players[0]

        match_2 = await sync_to_async(RemoteMatch.objects.create)(
            player1=await sync_to_async(RemotePlayer.objects.get)(username=players[2].username),
            player2=await sync_to_async(RemotePlayer.objects.get)(username=players[3].username),
            tournament=tournament,
            round_number=1
        )
        TournamentConsumer.matches_map[players[2]] = players[3]
        TournamentConsumer.matches_map[players[3]] = players[2]
        await self.notify_players_about_matches(match_1, match_2, players, 1)

    async def handle_match_winner(self, winner, loser):
        if self.tournament_name not in TournamentConsumer.tournament_winners:
            TournamentConsumer.tournament_winners[self.tournament_name] = []

        if winner not in TournamentConsumer.tournament_winners[self.tournament_name]:
            TournamentConsumer.tournament_winners[self.tournament_name].append(winner)

        winner_user = TournamentConsumer.players_map[winner]
        loser_user = TournamentConsumer.players_map[loser]

        winner_channel_name = await self.get_channel_name_for_user(winner_user)
        loser_channel_name = await self.get_channel_name_for_user(loser_user)

        if len(TournamentConsumer.tournament_winners[self.tournament_name]) == 2:
            if winner_channel_name:
                await self.channel_layer.send(winner_channel_name, {
                    'type': 'match_result',
                    'message': 'complete',
                    'winner': winner,
                    'winner_nickname': winner_user.nickname,
                    'loser_nickname': loser_user.nickname,
                    'loser': loser,
                    'leave': False
                })

            if loser_channel_name:
                await self.channel_layer.send(loser_channel_name, {
                    'type': 'match_result',
                    'message': 'completee',
                    'winner': winner,
                    'loser': loser,
                    'winner_nickname': winner_user.nickname,
                    'loser_nickname': loser_user.nickname,
                    'leave': True
                })
            await self.organize_next_match()
        else:
            if winner_channel_name:
                await self.channel_layer.send(winner_channel_name, {
                    'type': 'match_result',
                    'message': f'You won the match against {loser}',
                    'winner': winner,
                    'loser': loser,
                    'winner_nickname': winner_user.nickname,
                    'loser_nickname': loser_user.nickname,
                    'leave': False
                })

            if loser_channel_name:
                await self.channel_layer.send(loser_channel_name, {
                    'type': 'match_result',
                    'message': 'You lost the match and have been eliminated from the tournament.',
                    'winner': winner,
                    'loser': loser,
                    'winner_nickname': winner_user.nickname,
                    'loser_nickname': loser_user.nickname,
                    'leave': True
                })

    async def leave_tournament(self, event):
        await self.send(text_data=json.dumps({
            'type': 'leave_tournament',
            'message': event['message']
        }))

    async def show_trophy(self, event):
        await self.send(text_data=json.dumps({
            'type': 'show_trophy',
            'winner': event['winner'],
            'winner_nickname': event['winner_nickname']
        }))

    async def match_result(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_result',
            'message': event['message'],
            'winner': event['winner'],
            'loser': event['loser'],
            'leave': event['leave'],
            'winner_nickname': event['winner_nickname'],
            'loser_nickname': event['loser_nickname'],
        }))

    async def organize_next_match(self):
        winners = TournamentConsumer.tournament_winners[self.tournament_name]
        winner1_username = winners[0]
        winner2_username = winners[1]

        user1 = TournamentConsumer.players_map[winner1_username]
        user2 = TournamentConsumer.players_map[winner2_username]
        nicknames = [user1.nickname, user2.nickname]

        tournament = await sync_to_async(RemoteTournament.objects.get)(name=self.tournament_name)
        round_2 = await sync_to_async(RemoteRound.objects.create)(
            tournament=tournament,
            round_number=2
        )

        match_3 = await sync_to_async(RemoteMatch.objects.create)(
            player1=await sync_to_async(RemotePlayer.objects.get)(username=user1.username),
            player2=await sync_to_async(RemotePlayer.objects.get)(username=user2.username),
            tournament=tournament,
            round_number=2
        )

        TournamentConsumer.matches_map[user1] = user2
        TournamentConsumer.matches_map[user2] = user1

        winner1_channel_name = await self.get_channel_name_for_user(user1)
        winner2_channel_name = await self.get_channel_name_for_user(user2)
        if self.user.username in winners:
            await self.send(text_data=json.dumps({
                'type': 'show_shema',
                'round': 'two',
                'players': winners,
                'nicknames': nicknames
            }))
            if winner1_channel_name:
                await self.channel_layer.send(winner1_channel_name, {
                    'type': 'show_shema',
                    'round': 'two',
                    'players': winners,
                    'nicknames': nicknames
                }
            )
            if winner2_channel_name:
                await self.channel_layer.send(winner2_channel_name, {
                    'type': 'show_shema',
                    'round': 'two',
                    'players': winners,
                    'nicknames': nicknames
                }
            )
            await asyncio.sleep(15)
            if winner1_channel_name:
                await self.channel_layer.send(winner1_channel_name, {
                    'type': 'new_match',
                    'message': f'Your next match is against {user2.username} in Round 2',
                    'player': user1.username,
                    'opponent': user2.username,
                    'opponent_nickname': user2.nickname,
                    'player_nickname': user1.nickname,
                    'match_id': match_3.id,
                    'round': 2,
                    'winners': winners,
                    'nicknames': nicknames
                })

            if winner2_channel_name:
                await self.channel_layer.send(winner2_channel_name, {
                    'type': 'new_match',
                    'message': f'Your next match is against {user1.username} in Round 2',
                    'player': user2.username,
                    'opponent': user1.username,
                    'player_nickname': user2.nickname,
                    'opponent_nickname': user1.nickname,
                    'match_id': match_3.id,
                    'round': 2,
                    'winners': winners,
                    'nicknames': nicknames
                })

        # TournamentConsumer.tournament_winners[self.tournament_name] = []


    async def notify_players_about_matches(self, match_1, match_2, players, round):
        all_players = [{"username": p['player'].username, "nickname": p['nickname']} for p in TournamentConsumer.connected_players[self.tournament_name]]

        player1_channel_name = await self.get_channel_name_for_user(players[0])
        player2_channel_name = await self.get_channel_name_for_user(players[1])
        player3_channel_name = await self.get_channel_name_for_user(players[2])
        player4_channel_name = await self.get_channel_name_for_user(players[3])

        if player1_channel_name:
            await self.channel_layer.send(player1_channel_name, {
                'type': 'matches_created',
                'message': 'show matchdiv',
                'round': round,
                'match': {
                    'match_id': match_1.id,
                    'player': players[0].username,
                    'opponent': players[1].username,
                    'player_nickname': players[0].nickname,
                    'opponent_nickname': players[1].nickname,
                    'all_players': all_players
                }
            })

        if player2_channel_name:
            await self.channel_layer.send(player2_channel_name, {
                'type': 'matches_created',
                'message': 'show matchdiv',
                'round': round,
                'match': {
                    'match_id': match_1.id,
                    'player': players[1].username,
                    'opponent': players[0].username,
                    'player_nickname': players[1].nickname,
                    'opponent_nickname': players[0].nickname,
                    'all_players': all_players
                }
            })

        if player3_channel_name:
            await self.channel_layer.send(player3_channel_name, {
                'type': 'matches_created',
                'message': 'show matchdiv',
                'round': round,
                'match': {
                    'match_id': match_2.id,
                    'player': players[2].username,
                    'opponent': players[3].username,
                    'player_nickname': players[2].nickname,
                    'opponent_nickname': players[3].nickname,
                    'all_players': all_players
                }
            })

        if player4_channel_name:
            await self.channel_layer.send(player4_channel_name, {
                'type': 'matches_created',
                'message': 'show matchdiv',
                'round': round,
                'match': {
                    'match_id': match_2.id,
                    'player': players[3].username,
                    'opponent': players[2].username,
                    'player_nickname': players[3].nickname,
                    'opponent_nickname': players[2].nickname,
                    'all_players': all_players
                }
            })


    async def matches_created(self, event):
        await self.send(text_data=json.dumps({
            'type': 'matches_created',
            'message': event['message'],
            'round': event['round'],
            'match': event['match']
        }))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_joined',
            'player_name': event['player_name'],
            'player_nickname': event['player_nickname'],
            'profile_picture_url': event['profile_picture_url'],
            'players': event['players']
        }))

    async def final_winner(self, event):
        await self.send(text_data=json.dumps({
            'type': 'final_winner',
            'message': event['message'],
            'final_winner': event['final_winner'],
            'winner_nickname': event['winner_nickname']
        }))

    async def new_match(self, event):
        print("new match")
        await self.send(text_data=json.dumps({
            'type': 'new_match',
            'message': event['message'],
            'player': event['player'],
            'opponent': event['opponent'],
            'player_nickname': event['player_nickname'],
            'opponent_nickname': event['opponent_nickname'],
            'match_id': event.get('match_id'),
            'round': event.get('round'),
            'winners': event['winners']
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")
        
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user = await getUser(decoded_token.get('user_id'))
        return user if user else None

    @sync_to_async
    def get_channel_name_for_user(self, user):
        """
        This method returns the channel name for the given user.
        """
        for entry in TournamentConsumer.connected_players[self.tournament_name]:
            if entry['player'].id == user.id:
                return entry['channel_name']
        print(user)
        return None
    
    @database_sync_to_async
    def get_or_create_player(self, username, avatar, nickname):
        player, created = RemotePlayer.objects.get_or_create(username=username)
        player.tourn_name = self.tournament_name
        player.avatar = avatar
        player.nickname = nickname
        player.profile_picture = player.profile_picture
        player.save()
        return player, created
    
    @database_sync_to_async
    def get_or_create_tournament(self):
        print(self.tournament_name)
        tournament, created = RemoteTournament.objects.get_or_create(name=self.tournament_name)
        tournament.started = True
        tournament.finished = True
        tournament.created_at = timezone.now() if created else tournament.created_at
        tournament.save()
        return tournament
    
    @database_sync_to_async
    def get_players(self, tournament_name):
        return list(RemotePlayer.objects.filter(tourn_name=tournament_name))


import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .utils import make_key
import redis
import urllib.parse

class GameConsumer3(AsyncWebsocketConsumer):
    map_players_matched = {}
    active_connections = []

    async def connect(self):

        try:
            user = await self.check_token()
            self.player, created = await database_sync_to_async(RemotePlayer.objects.get_or_create)(username=user.username, avatar=user.avatar)
            await database_sync_to_async(self.player.save)()
            self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
            self.match_id = self.scope['url_route']['kwargs']['match_id']

            self.matchmaking_queue = f'tournament_{self.tournament_name}_match_{self.match_id}'

            if not self.player.is_active:
                await database_sync_to_async(MatchmakingQueue3.objects.create)(player=self.player)
                await self.add_player_to_queue()
                if self.player not in GameConsumer3.active_connections:
                    GameConsumer3.active_connections.append(self.player)
                await self.channel_layer.group_add(
                    f'player_{self.player.id}',
                    self.channel_name
                )
            await self.accept()
        except DenyConnection:
            await self.close()
    
    async def disconnect(self, close_code):
        await self.notify_opponent_if_exists()
        await database_sync_to_async(redis_instance.lrem)(self.matchmaking_queue, 0, self.player.id)
        await self.channel_layer.group_discard(f'player_{self.player.id}', self.channel_name)
        if self.player.is_active:
            self.player.is_active = False
            await database_sync_to_async(self.player.save)()
        if self.player in GameConsumer3.active_connections:
            GameConsumer3.active_connections.remove(self.player)
        if len(GameConsumer3.active_connections) == 0:
            redis_instance.delete(self.matchmaking_queue)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['message'] == 'Enter Queue':
            queue_length = await database_sync_to_async(redis_instance.llen)(self.matchmaking_queue)
            if queue_length >= 2:
                opponent_id1 = await database_sync_to_async(redis_instance.rpop)(self.matchmaking_queue)
                opponent_id = await database_sync_to_async(redis_instance.rpop)(self.matchmaking_queue)
                if opponent_id1 and opponent_id and opponent_id != opponent_id1:
                    opponent = await database_sync_to_async(RemotePlayer.objects.get)(id=opponent_id)
                    GameConsumer3.map_players_matched[opponent] = self.player
                    GameConsumer3.map_players_matched[self.player] = opponent
                    self.opponent = opponent
                    room_name = make_key(20)
                    game_room = await database_sync_to_async(GameRoom3.objects.create)(room_name=room_name, player1=self.player, player2=opponent)
                    # await database_sync_to_async(OneToOneHistory.objects.create)(
                    #     game_type="pingpong", player1=self.player.username, player2=opponent.username,
                    #     player2_avatar=self.player.avatar, player1_avatar=opponent.avatar, score1=0, score2=0, room_name=room_name
                    # )
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
                            'opponent_nickname': self.player.nickname,
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
                        'player_nickname': self.player.nickname,
                        'opponent_nickname': opponent.nickname,
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
                    'opponent_nickname': self.player.nickname,
                    'opponent_username': self.player.username,
                    'opponent_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                }
            )
            
            await self.send(text_data=json.dumps({
                'status': 'match_found',
                'room_name': game_room.room_name,
                'opponent_username': opponent.username,
                'opponent_nickname': opponent.nickname,
                'player_nickname': self.player.nickname,
                'opponent_avatar': urllib.parse.unquote(opponent.avatar.url[1:] if opponent.avatar.url.startswith('/') else opponent.avatar.url) if opponent.avatar else None,
                'player_username': self.player.username,
                'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
                'time': 'stop',
                'game': 'start',
                'player_side': 'right', 
            }))

    async def check_user(self, user):
        if user not in GameConsumer3.active_connections:
            return False
        else:
            return True

    async def add_player_to_queue(self):
        """Add the current player to the matchmaking queue if not already there."""
        queue_length = redis_instance.llen(self.matchmaking_queue)

        if self.player.id not in await self.get_queue_ids():
            redis_instance.rpush(self.matchmaking_queue, self.player.id)
        else:
            print(f"Player {self.player.username} is already in the queue.")

    async def get_queue_ids(self):
        """Get all player IDs currently in the matchmaking queue."""
        queue = redis_instance.lrange(self.matchmaking_queue, 0, -1) 
        return set(queue) 

    async def match_found(self, event):
        """ Asynchronously send match found event to the player """
        opponent_username = event['opponent_username']
        player_username = self.player.username
        await self.send(text_data=json.dumps({
            'status': 'match_found',
            'room_name': event['room_name'],
            'opponent_nickname': event['opponent_nickname'],
            'opponent_username': opponent_username,
            'opponent_avatar': event['opponent_avatar'],
            'player_username': player_username,
            'player_nickname': self.player.nickname,
            'player_avatar': urllib.parse.unquote(self.player.avatar.url[1:] if self.player.avatar.url.startswith('/') else self.player.avatar.url) if self.player.avatar else None,
            'time': 'stop',
            'game': event['game'],
            'player_side': 'left',
        }))
        
        await self.remove_from_matchmaking_queue()

    async def remove_from_matchmaking_queue(self):
        await database_sync_to_async(redis_instance.lrem)(self.matchmaking_queue, 0, self.player.id)

    async def notify_opponent_if_exists(self):
        if self.player in GameConsumer3.map_players_matched:
            opponent = GameConsumer3.map_players_matched[self.player]
            del GameConsumer3.map_players_matched[self.player]
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

class RemoteConsumer3(AsyncWebsocketConsumer):
    game_states = {}
    game_tasks = {}
    active_connections = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"game_{self.room_name}"
        
        if self.room_group_name not in RemoteConsumer3.game_states:
            RemoteConsumer3.game_states[self.room_group_name] = {
                'ball': {'x': 0, 'y': 0, 'dx': 1, 'dy': 1, 'radius': 4, 'speed': 2},
                'paddles': {
                    'left': {'x': -143, 'y': 0, 'z': 1, 'width': 7, 'height': 20, 'dy': 0},
                    'right': {'x': 143, 'y': 0, 'z': 1, 'width': 7, 'height': 20, 'dy': 0}
                },
                'score': {'left': 0, 'right': 0},
                'chrono': 10
            }
            RemoteConsumer3.active_connections[self.room_group_name] = 0

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        RemoteConsumer3.active_connections[self.room_group_name] += 1

        self.player_side = 'left' if RemoteConsumer3.active_connections[self.room_group_name] == 1 else 'right'

        if self.room_group_name not in RemoteConsumer3.game_tasks:
            RemoteConsumer3.game_tasks[self.room_group_name] = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        RemoteConsumer3.active_connections[self.room_group_name] -= 1

        if RemoteConsumer3.active_connections[self.room_group_name] == 0:
            if RemoteConsumer3.game_tasks[self.room_group_name]:
                RemoteConsumer3.game_tasks[self.room_group_name].cancel()
                del RemoteConsumer3.game_tasks[self.room_group_name]
                del RemoteConsumer3.game_states[self.room_group_name]
                del RemoteConsumer3.active_connections[self.room_group_name]

    async def receive(self, text_data):
        data = json.loads(text_data)
        state = RemoteConsumer3.game_states[self.room_group_name]

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
        state = RemoteConsumer3.game_states[self.room_group_name]
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
            await self.update_chrono()
            await self.send_game_state()
            await asyncio.sleep(0.02)

        await self.broadcast_game_over()

    async def update_game_state(self):
        state = RemoteConsumer3.game_states[self.room_group_name]
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
        state = RemoteConsumer3.game_states[self.room_group_name]
        if state['chrono'] > 0:
            state['chrono'] -= 0.02
        else:
            state['chrono'] = 0

    def format_chrono(self, chrono):
        minutes = int(chrono) // 60
        seconds = int(chrono) % 60
        return f"{minutes:02}:{seconds:02}"

    def reset_ball(self):
        state = RemoteConsumer3.game_states[self.room_group_name]
        state['ball']['x'] = 0
        state['ball']['y'] = 0
        state['ball']['dx'] = -state['ball']['dx']
        state['ball']['dy'] = 1

    async def broadcast_game_over(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_over',
                'message': 'Game over',
                'final_scores': RemoteConsumer3.game_states[self.room_group_name]['score'],
                'room_name': self.room_name,
            }
        )

    async def game_over(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_over',
            'message': event['message'],
            'final_scores': event['final_scores'],
            'room_name': event['room_name'],
        }))
