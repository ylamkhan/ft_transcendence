import os
import random
from django.core.validators import MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django_countries.fields import CountryField
from django.utils import timezone
from datetime import timedelta
from collections import OrderedDict
from django.utils.timezone import now

def GenerateProfileImagePath(instance, filename):
    ext = filename.split('.')[-1]
    path = f'static/accounts/{instance.id}/images/'
    name = f'profile_image.{ext}'
    return os.path.join(path, name)

class User(AbstractUser):
    avatar = models.FileField(upload_to=GenerateProfileImagePath, max_length=500, null=True, blank=True)
    reset_password_pin = models.CharField(max_length=6, null=True, blank=True)
    status = models.CharField(max_length=20, default='Offline')
    is_online = models.BooleanField(default=False)
    nickname = models.CharField(max_length=150, null=True, blank=True)
    # country = models.CharField(max_length=20, default='Palestine')
    country_select = CountryField(default="PS")
    date_of_birth = models.DateField(null=True, blank=True, default=None)
    about = models.TextField(max_length=150, null=True, blank=True)
    level = models.PositiveIntegerField(null=True, blank=True, default=0)
    level_progress = models.PositiveIntegerField(null=True, blank=True, default=0)
    xp = models.PositiveIntegerField(null=True, blank=True, default=0)
    win = models.PositiveIntegerField(null=True, blank=True, default=0)
    draw = models.PositiveIntegerField(null=True, blank=True, default=0)
    lose = models.PositiveIntegerField(null=True, blank=True, default=0)
    total_match = models.PositiveIntegerField(null=True, blank=True, default=0)
    daily_winning_rates = models.JSONField(default=list, blank=True)
    tfa_enabled = models.BooleanField(default=False)
    otp_code = models.PositiveIntegerField(null=True, blank=True, default=123456)
    first_match_won = models.BooleanField(default=False)
    xp_periodic = models.IntegerField(default=500)

    def initialize_fake_daily_winning_rates(self):
        if not self.daily_winning_rates:
            self.daily_winning_rates = [
                ((timezone.now() - timedelta(days=i)).strftime("%d %b"), rate)
                for i, rate in enumerate([60, 55, 20, 40, 15, 35, 30])
            ]

            self.save()

    def update_daily_winning_rate(self, win_count):
        today = timezone.now().strftime("%d %b")
        found = False

        for i, (date, rate) in enumerate(self.daily_winning_rates):
            if date == today:
                self.daily_winning_rates[i] = (date, win_count)
                found = True
                break

        if not found:
            self.daily_winning_rates.append((today, win_count))

        if len(self.daily_winning_rates) > 7:
            self.daily_winning_rates = self.daily_winning_rates[-7:]

class FriendRequest(models.Model):
    sender = models.ForeignKey(User, related_name="sent_requests", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_requests", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sender', 'receiver')

class Friend(models.Model):
    user = models.ForeignKey(User, related_name='friends', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friend_of', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_users')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by_users')

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"

class Player(models.Model):
    username = models.CharField(max_length=150, unique=True, default='anonyme-player2')
    is_active = models.BooleanField(default=False)
    avatar = models.FileField(max_length=500, null=True, blank=True)
    player_side = models.CharField(max_length=255)

class GameRoom(models.Model):
    room_name = models.CharField(max_length=255, unique=True)
    player1 = models.ForeignKey(Player, related_name='player1_games', on_delete=models.CASCADE, null=True)
    player2 = models.ForeignKey(Player, related_name='player2_games', on_delete=models.CASCADE, null=True)

class MatchmakingQueue(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    TYPE_CHOICES = [
        ('message', 'Message'),
        ('friend_request', 'Friend Request'),
        ('match_invitation', 'Match Invitation'),
        ('tournament_invitation', 'Tournament Invitation'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_notifications')
    type = models.CharField(max_length=255, choices=TYPE_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    request_id = models.IntegerField(unique=True, null=True)
    message_id = models.IntegerField(unique=True, null=True)
    game_id = models.IntegerField(null=True)
    is_treated = models.BooleanField(default=False)
    tournament_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.type} from {self.sender} to {self.receiver}"

class RemotePlayer(models.Model):
    # user = models.OneToOneField(User, on_delete=models.CASCADE)
    username = models.CharField(max_length=150, unique=True, default='anonyme-remoteplayer')
    nickname = models.CharField(max_length=150, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    avatar = models.FileField(max_length=500, null=True, blank=True)
    is_active = models.BooleanField(default=False)
    current_tournament = models.ForeignKey('RemoteTournament', on_delete=models.SET_NULL, blank=True, null=True)
    tourn_name = models.CharField(max_length=150)

    def __str__(self):
        return self.username

class RemoteTournament(models.Model):
    name = models.CharField(max_length=100, unique=True, default='anonyme-remotetournament')
    created_at = models.DateTimeField(auto_now_add=True)
    started = models.BooleanField(default=False)
    finished = models.BooleanField(default=False)
    winner = models.ForeignKey(RemotePlayer, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_tournaments')

    def __str__(self):
        return self.name

class RemoteMatch(models.Model):
    player1 = models.ForeignKey(RemotePlayer, on_delete=models.CASCADE, related_name='match_player1')
    player2 = models.ForeignKey(RemotePlayer, on_delete=models.CASCADE, related_name='match_player2')
    tournament = models.ForeignKey(RemoteTournament, on_delete=models.CASCADE, related_name='matches')
    round_number = models.IntegerField()
    winner = models.ForeignKey(RemotePlayer, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_matches')
    played = models.BooleanField(default=False)
    match_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.tournament.name} - Round {self.round_number}: {self.player1} vs {self.player2}"

class RemoteRound(models.Model):
    tournament = models.ForeignKey(RemoteTournament, on_delete=models.CASCADE, related_name='rounds')
    round_number = models.IntegerField()
    is_complete = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.tournament.name} - Round {self.round_number}"

class RemoteParticipant(models.Model):
    tournament = models.ForeignKey(RemoteTournament, on_delete=models.CASCADE, related_name='participants')
    player = models.ForeignKey(RemotePlayer, on_delete=models.CASCADE, related_name='participations')
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player.username} in {self.tournament.name}"

# class RemoteMatchmakingQueue(models.Model):
#     player = models.ForeignKey(RemotePlayer, on_delete=models.CASCADE)
#     created_at = models.DateTimeField(auto_now_add=True)

# models.py

# class Player3(models.Model):
#     username = models.CharField(max_length=150, unique=True)
#     is_active = models.BooleanField(default=False)
#     avatar = models.ImageField(upload_to='avatars/', default='https://cdn.intra.42.fr/users/baf751885ec2df6993059c1a2c056bfa/zsaoud.JPG')

class GameRoom3(models.Model):
    room_name = models.CharField(max_length=255, unique=True)
    player1 = models.ForeignKey(RemotePlayer, related_name='player1_games', on_delete=models.CASCADE, null=True)
    player2 = models.ForeignKey(RemotePlayer, related_name='player2_games', on_delete=models.CASCADE, null=True)

class MatchmakingQueue3(models.Model):
    player = models.ForeignKey(RemotePlayer, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class OneToOneHistory(models.Model):
    game_type = models.CharField(max_length=50, null=True, blank=True)
    player1 = models.CharField(max_length=50, null=True, blank=True)
    player2 = models.CharField(max_length=50, null=True, blank=True)
    player1_avatar = models.FileField(max_length=500, null=True, blank=True)
    player2_avatar = models.FileField(max_length=500, null=True, blank=True)
    score1 = models.PositiveIntegerField(validators=[MaxValueValidator(10)], null=True, blank=True)
    score2 = models.PositiveIntegerField(validators=[MaxValueValidator(10)], null=True, blank=True)
    winner = models.CharField(max_length=50, null=True, blank=True)
    loser = models.CharField(max_length=50, null=True, blank=True)
    date_played = models.DateTimeField(auto_now_add=True)
    room_name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('player1', 'player2', 'room_name')

class TournamentHistory(models.Model):
    user = models.CharField(max_length=150)
    tournament = models.ForeignKey(RemoteTournament, on_delete=models.CASCADE, related_name="histories")
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.tournament.name}"

class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    achievement_type = models.CharField(max_length=255)
    description = models.TextField()
    date_awarded = models.DateTimeField(auto_now_add=True)

class PrivateChat(models.Model):
    groupName = models.CharField(max_length=50, unique=True)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_user2')
    Friendship = models.ForeignKey(Friend, on_delete=models.CASCADE)

    def __str__(self):
        return f'Chat between {self.user1.username} and {self.user2.username}'

class Message(models.Model):
    chatGroup = models.ForeignKey(PrivateChat, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sends_message', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='receives_message', on_delete=models.CASCADE)
    content = models.CharField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=False)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.sender.name}: {self.content[:30]}'