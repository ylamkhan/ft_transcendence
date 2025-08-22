import urllib
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.signals import user_logged_in, user_logged_out
from accounts.models import *
from django.db.models import Q
from accounts.views import get_avatar_url
import logging

# @receiver(user_logged_in)
# def log_user_login(sender, user, **kwargs):
#     """ log user login to user log """
#     print(f"User {user.username} just logged in!")
#     channel_layer = get_channel_layer()
#     if not channel_layer:
#         print("Channel layer not configured!")
#         return

#     friends = Friend.objects.filter(Q(user=user) | Q(friend=user))
#     print(f"Friends found: {friends}")  # Debugging
#     avatar_url = get_avatar_url(user.avatar)  # Ensure this works
#     user.is_online = True
#     user.save()

#     for friendship in friends:
#         friend = friendship.friend if friendship.friend != user else friendship.user
#         group_name = f"user_{friend.id}"
#         print(f"Sending status to group: {group_name}")  # Debugging

#         async_to_sync(channel_layer.group_send)(
#             group_name,
#             {
#                 "type": "status_update",
#                 "action": "status",
#                 "id": user.id,
#                 "status": user.is_online,
#                 "avatar": avatar_url,
#                 "username": user.username,
#             }
#         )


# @receiver(user_login_failed)
# def log_user_login_failed(sender, user=None, **kwargs):
#     """ log user login to user log """
#     if user:
#         user_logger.info('%s login failed', user)
#     else:
#         user_logger.error('login failed; unknown user')


# @receiver(user_logged_out)
# def log_user_logout(sender, user, **kwargs):
#     """ Log user logout to user log """
#     channel_layer = get_channel_layer()
#     if not channel_layer:
#         logger.error("Channel layer not configured!")
#         return

#     try:
#         friends = Friend.objects.filter(Q(user=user) | Q(friend=user))
#         logger.debug(f"Friends found: {friends}")
#     except Exception as e:
#         logger.error(f"Error fetching friends: {e}")
#         return

#     try:
#         avatar_url = get_avatar_url(user.avatar)
#     except Exception as e:
#         avatar_url = ""
#         logger.error(f"Error fetching avatar URL: {e}")

#     try:
#         user.is_online = False
#         user.save()
#     except Exception as e:
#         logger.error(f"Error updating user status: {e}")
#         return

#     for friendship in friends:
#         friend = friendship.friend if friendship.friend != user else friendship.user
#         group_name = f"user_{friend.id}"
#         logger.debug(f"Sending status to group: {group_name}")

#         try:
#             async_to_sync(channel_layer.group_send)(
#                 group_name,
#                 {
#                     "type": "status_update",
#                     "action": "status",
#                     "id": user.id,
#                     "status": user.is_online,
#                     "avatar": avatar_url,
#                     "username": user.username,
#                 }
#             )
#         except Exception as e:
#             logger.error(f"Error sending message to group {group_name}: {e}")

# @receiver(user_logged_in)
# def on_login(sender, user, request, **kwargs):
#     print(f"User {user.username} just logged in!")  # Debugging
#     channel_layer = get_channel_layer()
#     if not channel_layer:
#         print("Channel layer not configured!")
#         return

#     friends = Friend.objects.filter(Q(user=user) | Q(friend=user))
#     print(f"Friends found: {friends}")  # Debugging
#     avatar_url = get_avatar_url(user.avatar)  # Ensure this works

#     for friendship in friends:
#         friend = friendship.friend if friendship.friend != user else friendship.user
#         group_name = f"user_{friend.id}"
#         print(f"Sending status to group: {group_name}")  # Debugging

#         async_to_sync(channel_layer.group_send)(
#             group_name,
#             {
#                 "type": "status_update",
#                 "action": "status",
#                 "id": user.id,
#                 "status": user.is_online,
#                 "avatar": avatar_url,
#                 "username": user.username,
#             }
#         )

# @receiver(post_save, sender=User)
# def notify_friends(sender, instance, **kwargs):
#     print("dkhalt l notify_friends")
#     channel_layer = get_channel_layer()
#     friends = Friend.objects.filter(Q(user=instance) | Q(friend=instance))
#     avatar_url = get_avatar_url(instance.avatar)

#     for friendship in friends:
#         friend = friendship.friend
#         user = friendship.user
#         group_name_friend = f"user_{friend.id}"
#         group_name_user = f"user_{user.id}"
#         target_group = group_name_user if group_name_friend == f"user_{instance.id}" else group_name_friend
#         async_to_sync(channel_layer.group_send)(
#             target_group,
#             {
#                 "type": "status_update",
#                 "action": "status",
#                 "id": instance.id,
#                 "status": instance.is_online,
#                 "avatar": avatar_url,
#                 "username": instance.username,
#             }
#         )

# @receiver(user_logged_out)
# def log_logout(sender, request, user, **kwargs):
#     if user:
#         print(f"User {user.username} has logged out.")
#         channel_layer = get_channel_layer()
#         friends = Friend.objects.filter(Q(user=user) | Q(friend=user))
#         avatar_url = get_avatar_url(user.avatar)

#         for friendship in friends:
#             friend = friendship.friend
#             user = friendship.user
#             group_name_friend = f"user_{friend.id}"
#             group_name_user = f"user_{user.id}"
#             target_group = group_name_user if group_name_friend == f"user_{user.id}" else group_name_friend
#             async_to_sync(channel_layer.group_send)(
#                 target_group,
#                 {
#                     "type": "status_update",
#                     "action": "status",
#                     "id": user.id,
#                     "status": user.is_online,
#                     "avatar": avatar_url,
#                     "username": user.username,
#                 }
#             )


# @receiver(pre_save, sender=User)
# def on_change(sender, instance: User, **kwargs):
#     print("jit l on_change()")
#     if instance.id is None: # new object will be created
#         pass # write your code here
#     else:
#         previous = User.objects.get(id=instance.id)
#         if previous.is_online == instance.is_online:
#             pass
#         else:
#             print("jit l on_change()")
#             channel_layer = get_channel_layer()
#             friends = Friend.objects.filter(Q(user=instance) | Q(friend=instance))
#             avatar_url = get_avatar_url(instance.avatar)

#             for friendship in friends:
#                 friend = friendship.friend
#                 user = friendship.user
#                 group_name_friend = f"friends_{friend.id}"
#                 group_name_user = f"friends_{user.id}"
#                 target_group = group_name_user if group_name_friend == f"friends_{instance.id}" else group_name_friend
#                 async_to_sync(channel_layer.group_send)(
#                     target_group,
#                     {
#                         "type": "status_update",
#                         "action": "update",
#                         "id": instance.id,
#                         "status": instance.is_online,
#                         "avatar": avatar_url,
#                         "username": instance.username,
#                     }
#                 )


@receiver(post_save, sender=Notification)
def send_notification_signal(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    group_name = f"user_{instance.receiver.id}"
    if not created:
        try:
            notification_data = {
                "type": "notify",
                "message": {
                    "notification_id": instance.id,
                    "action": "notification",
                    "sender": instance.sender.username,
                    "sender_id": instance.sender.id,
                    "sender_avatar": get_avatar_url(instance.sender.avatar),
                    "type": instance.type,
                    "message": instance.message,
                    "request_id": instance.request_id,
                    "message_id": instance.message_id,
                    "game_id": instance.game_id,
                    "tournament_name": instance.tournament_name,
                    "created_at": str(instance.created_at),
                    "is_read": instance.is_read,
                    "is_treated": instance.is_treated,
                },
            }
            async_to_sync(channel_layer.group_send)(group_name, notification_data)
        except FriendRequest.DoesNotExist:
            print("FriendRequest not found")

