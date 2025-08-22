import random
import string
from accounts.models import User
from channels.db import database_sync_to_async
from accounts.models import RemotePlayer

def make_key(length=5):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

@database_sync_to_async
def getUser(user_id):
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        return None

@database_sync_to_async
def getPlayer(user_id):
    try:
        user = RemotePlayer.objects.get(id=user_id)
        return user
    except RemotePlayer.DoesNotExist:
        return None

@database_sync_to_async
def get_or_create_player(username):
    player, created = RemotePlayer.objects.get_or_create(username=username)
    return player, created
