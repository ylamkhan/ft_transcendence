import random
import string
from accounts.models import *
from channels.db import database_sync_to_async
from django.db.models import Q
from asgiref.sync import sync_to_async

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
def getFriends(user_id):
    return Friend.objects.filter(Q(user=user) | Q(friend=user))
    
@database_sync_to_async
def save_user(user):
    user.save()

@database_sync_to_async
def get_user_friends(user):
    friendships = Friend.objects.filter(Q(user=user) | Q(friend=user))
    friend_ids = set()
    for friendship in friendships:
        if friendship.user.id != user.id:
            friend_ids.add(friendship.user.id)
        if friendship.friend.id != user.id:
            friend_ids.add(friendship.friend.id)
    
    return friend_ids

@database_sync_to_async
def set_user_status(user, is_online):
    """
    Update the user's status in the database.
    """
    user.is_online = is_online
    user.save()