from channels.generic.websocket import WebsocketConsumer
import json
import random
from pingpongTourn.models import Tournament, Participant, Round, Match

class TournamentConsumer(WebsocketConsumer):
    round1 = {}
    round2 = {}
    winners = []

    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'submit':
            self.handle()
        elif action == 'create_tournament':
            if data['tournament_name'] not in TournamentConsumer.round1:
                self.create_tournament(data)
            else:
                self.send(text_data=json.dumps({
                    'type': 'duplicate'
                }))
        elif action == 'play_match':
            round_number = data.get('round')
            if round_number == 1:
                self.handle_first_round(data)
            elif round_number == 2:
                self.handle_second_round(data)

    def handle_first_round(self, data):
        winner = data.get('winner', '')
        if winner and winner != "Draw":
            TournamentConsumer.winners.append(winner)

        tournament_name = data['tournament_name']
        tournament = Tournament.objects.get(name=tournament_name)
        participants = TournamentConsumer.round1[tournament_name]
        i = data['match']

        if len(TournamentConsumer.winners) * 2 == 4:
            TournamentConsumer.round2[tournament_name] = TournamentConsumer.winners
            TournamentConsumer.winners = []
            self.send(text_data=json.dumps({
                'status': 'second_round',
                'tournament_name': tournament_name,
                'participants': TournamentConsumer.round2[tournament_name]
            }))
            return

        round_obj, _ = Round.objects.get_or_create(tournament=tournament, round_number=tournament.rounds.count() + 1)
        participant1, _ = Participant.objects.get_or_create(name=participants[i])
        participant2, _ = Participant.objects.get_or_create(name=participants[i + 1])

        match, _ = Match.objects.get_or_create(round=round_obj, participant_1=participant1, participant_2=participant2)
        match.save()

        self.send(text_data=json.dumps({
            'status': 'play',
            'participant1': participant1.name,
            'participant2': participant2.name
        }))

    def handle_second_round(self, data):
        winner = data.get('winner', '')
        if winner and winner != 'Draw':
            TournamentConsumer.winners.append(winner)

        tournament_name = data['tournament_name']
        tournament = Tournament.objects.get(name=tournament_name)
        participants = TournamentConsumer.round2[tournament_name]
        i = data['match']

        if len(TournamentConsumer.winners) == 1:
            self.send(text_data=json.dumps({
                'status': 'final',
                'tournament_name': tournament_name,
                'winner': TournamentConsumer.winners[0],
            }))
            self.reset_tournament_data(tournament_name)
            return

        round_obj, created = Round.objects.get_or_create(tournament=tournament, round_number=tournament.rounds.count() + 1)
        participant1, _ = Participant.objects.get_or_create(name=participants[i])
        participant2, _ = Participant.objects.get_or_create(name=participants[i + 1])

        match, _ = Match.objects.get_or_create(round=round_obj, participant_1=participant1, participant_2=participant2)
        match.save()

        self.send(text_data=json.dumps({
            'status': 'play',
            'participant1': participant1.name,
            'participant2': participant2.name
        }))

    def create_tournament(self, data):
        tournament_name = data['tournament_name']
        participants = data['participants']

        random.shuffle(participants)
        TournamentConsumer.round1[tournament_name] = participants
        
        tournament = Tournament.objects.create(name=tournament_name)
        for participant_name in participants:
            participant, _ = Participant.objects.get_or_create(name=participant_name)
            tournament.participants.add(participant)
        
        tournament.save()
        self.send(text_data=json.dumps({
            'status': 'first_round',
            'tournament_name': tournament_name,
            'participants': participants
        }))

    def handle(self):
        response = {
            'status': 'handle',
        }
        self.send(text_data=json.dumps(response))

    def reset_tournament_data(self, tournament_name):
        """
        Reset all tournament data at the end of the tournament or when needed.
        """
        if tournament_name in TournamentConsumer.round1:
            del TournamentConsumer.round1[tournament_name]

        if tournament_name in TournamentConsumer.round2:
            del TournamentConsumer.round2[tournament_name]

        TournamentConsumer.winners = []
