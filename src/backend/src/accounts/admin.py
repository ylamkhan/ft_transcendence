from django.contrib import admin
from .models import User, Player, MatchmakingQueue, GameRoom, OneToOneHistory, FriendRequest, Friend

# Register your models here.

admin.site.register(User)
admin.site.register(Player)
admin.site.register(MatchmakingQueue)
admin.site.register(GameRoom)
admin.site.register(OneToOneHistory)
admin.site.register(FriendRequest)
admin.site.register(Friend)