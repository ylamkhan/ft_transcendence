from django.contrib import admin
from accounts.models import RemoteTournament, RemotePlayer, RemoteMatch, RemoteRound, RemoteParticipant
from accounts.models import GameRoom3, MatchmakingQueue3

# Register your models here.
# admin.site.register(Player3)
admin.site.register(GameRoom3)
admin.site.register(MatchmakingQueue3)
admin.site.register(RemoteTournament)
admin.site.register(RemotePlayer)
admin.site.register(RemoteMatch)
admin.site.register(RemoteRound)
admin.site.register(RemoteParticipant)
