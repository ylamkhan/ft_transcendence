import random
import string
from accounts.models import User
from channels.db import database_sync_to_async

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
def save_user(user):
    user.save()