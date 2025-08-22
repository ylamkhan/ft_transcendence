from django.db import models

class Tournament(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=[
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
    ], default='upcoming')
    participants = models.ManyToManyField('Participant', related_name='tournaments')

    def __str__(self):
        return self.name

class Participant(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Round(models.Model):
    tournament = models.ForeignKey(Tournament, related_name='rounds', on_delete=models.CASCADE)
    round_number = models.PositiveIntegerField()
    participants = models.ManyToManyField(Participant, related_name='rounds')
    is_final_round = models.BooleanField(default=False)

    def __str__(self):
        return f"Round {self.round_number} of {self.tournament.name}"

class Match(models.Model):
    round = models.ForeignKey(Round, related_name='matches', on_delete=models.CASCADE)
    participant_1 = models.ForeignKey(Participant, related_name='matches_as_participant_1', on_delete=models.CASCADE)
    participant_2 = models.ForeignKey(Participant, related_name='matches_as_participant_2', on_delete=models.CASCADE)
    winner = models.ForeignKey(Participant, related_name='won_matches', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.participant_1} vs {self.participant_2} (Round {self.round.round_number})'
