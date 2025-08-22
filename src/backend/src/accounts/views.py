from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import JsonResponse
from accounts.models import *
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
import json
import random
from django.core.mail import send_mail
from rest_framework.views import APIView
from .serializers import *
from channels.layers import get_channel_layer
from django.core.validators import URLValidator, ValidationError
import logging
from asgiref.sync import async_to_sync
from pingpongTourn.models import Tournament

logger = logging.getLogger(__name__)

def get_avatar_url(avatar_url):
    if avatar_url:
        try:
            URLValidator()(str(avatar_url))
            return str(avatar_url)
        except ValidationError:
            return avatar_url.url
    return None

@api_view(['POST'])
def OtpCheck(request):
    try:
        body = json.loads(request.body)
        username = body.get('username')
        password = body.get('password')
        if not username or not password:
            return Response({"error": "Username and password are required"}, status=400)
        try:
            user = User.objects.get(email=username)
        except ObjectDoesNotExist:
            return Response({"error": "User does not exist"}, status=404)
        if hasattr(user, 'tfa_enabled') and user.tfa_enabled:
            new_otp_code = random.randint(100000, 999999)
            user.otp_code = new_otp_code
            user.save()
            send_mail(
                subject="Password Reset Code",
                message=f"Your password reset code is: {new_otp_code}",
                from_email="ylamkhantar086@gmail.com",
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({"tfaenabled": True})
        return Response({"tfaenabled": False})
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def OtpVerify(request):
    try:
        body = json.loads(request.body)
        username = body.get('username')
        password = body.get('password')
        otp_code = int(body.get('token'))
        if not username or not password or not otp_code:
            return Response({"error": "Username and password and otp code are required"}, status=400)
        try:
            user = User.objects.get(email=username)
        except ObjectDoesNotExist:
            return Response({"error": "User does not exist"}, status=404)
        if hasattr(user, 'otp_code') and user.otp_code == otp_code:
            return Response({"tfaverified": True})
        return Response({"tfaverified": False})
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

from rest_framework.decorators import api_view
from rest_framework.response import Response
import json

@api_view(['POST'])
def change_nickname(request):
    try:
        body = json.loads(request.body)
        nickname = body.get('nickname')
        if not nickname:
            return Response({"error": "Nickname is required"}, status=400)
        user = request.user
        user.nickname = nickname
        user.save()

        return Response({"message": "Nickname updated successfully"}, status=200)

    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON format"}, status=400)
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def TfaEnable(request):
    try:
        body = request.data
        enable = body.get('enable')
        if enable is None:
            return Response({"error": "Enable flag is required"}, status=400)
        user = request.user
        if not user:
            return Response({"error": "User does not exist"}, status=404)
        user.tfa_enabled = enable
        user.save()
        return Response({"message": f"Two-factor authentication {'enabled' if enable else 'disabled'} successfully."}, status=200)
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
def get_all_users(request):
    friend_requests = FriendRequest.objects.filter(Q(sender=request.user) | Q(receiver=request.user))
    friends = Friend.objects.filter(Q(user=request.user) | Q(friend=request.user))
    excluded_ids = set(friends.values_list('user_id', flat=True)) | \
                   set(friends.values_list('friend_id', flat=True)) | \
                   set(friend_requests.values_list('sender_id', flat=True)) | \
                   set(friend_requests.values_list('receiver_id', flat=True))
    users = User.objects.exclude(is_superuser=True).exclude(id=request.user.id).exclude(id__in=excluded_ids).values('id', 'username', 'avatar')
    return Response(list(users))

@api_view(['POST'])
def send_friend_request(request):
    sender = request.user
    receiver_id = request.data.get('receiver_id')
    if not receiver_id:
        return Response({"error": "Receiver ID is required"}, status=status.HTTP_400_BAD_REQUEST)    
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)
    if sender == receiver:
        return Response({"error": "You cannot send a friend request to yourself"}, status=status.HTTP_400_BAD_REQUEST) 
    friend_request, created = FriendRequest.objects.get_or_create(sender=sender, receiver=receiver)   
    if not created:
        return Response({"message": "Friend request already sent"}, status=status.HTTP_200_OK)
    return Response({
        "message": "Friend request sent successfully",
        "request_id": friend_request.id
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
def get_friends(request):
    friends = Friend.objects.filter(Q(user=request.user) | Q(friend=request.user))
    friend_ids = set()
    for friend in friends:
        if friend.user != request.user:
            friend_ids.add(friend.user.id)
        if friend.friend != request.user:
            friend_ids.add(friend.friend.id)
    friend_users = User.objects.filter(id__in=friend_ids).values('id', 'username', 'avatar')
    friends_data = [
        {
            "id": user['id'],
            "username": user['username'],
            "avatar": user['avatar'] or 'https://via.placeholder.com/150'
        }
        for user in friend_users
    ]
    return JsonResponse({"friends": friends_data})

@api_view(['GET'])
def get_online_friends(request):
    friends = Friend.objects.filter(Q(user=request.user) | Q(friend=request.user))
    friend_ids = set()
    for friend in friends:
        if friend.user != request.user:
            friend_ids.add(friend.user.id)
        if friend.friend != request.user:
            friend_ids.add(friend.friend.id)
    friend_users = User.objects.filter(id__in=friend_ids).values('id', 'username', 'avatar', 'is_online')
    online_friends_data = []
    for user in friend_users:
        online = user['is_online']
        if online:
            online_friends_data.append({
                "id": user['id'],
                "username": user['username'],
                "avatar": user['avatar'] or 'https://via.placeholder.com/150'
            })
    return JsonResponse({"friends": online_friends_data})

@api_view(['POST'])
def accept_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id)
    except FriendRequest.DoesNotExist:
        return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)
    friendship_exists = Friend.objects.filter(
        Q(user=friend_request.sender, friend=friend_request.receiver) |
        Q(user=friend_request.receiver, friend=friend_request.sender)
    ).exists()
    if friendship_exists:
        return Response({"error": "Friendship already exists"}, status=status.HTTP_400_BAD_REQUEST)
    Friend.objects.create(user=friend_request.sender, friend=friend_request.receiver)
    notification = Notification.objects.get(request_id=request_id)
    notification.delete()
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{friend_request.sender.id}",
        {
            "type": "status_update",
            "action": "connect",
            "id": friend_request.receiver.id,
            "status": True,
            "avatar": get_avatar_url(friend_request.receiver.avatar),
            "username": friend_request.receiver.username
        },
    )
    async_to_sync(channel_layer.group_send)(
        f"user_{friend_request.receiver.id}",
        {
            "type": "status_update",
            "action": "connect",
            "id": friend_request.sender.id,
            "status": True,
            "avatar": get_avatar_url(friend_request.sender.avatar),
            "username": friend_request.sender.username
        },
    )
    friend_request.delete()
    return Response({"message": "Friend request accepted successfully"}, status=status.HTTP_200_OK)

@api_view(['POST'])
def reject_friend_request(request, request_id):
    try:
        friend_request = get_object_or_404(FriendRequest, id=request_id, status='pending')
        if friend_request.receiver != request.user:
            return JsonResponse({"error": "You can only reject requests sent to you."}, status=400)
        notification = Notification.objects.get(request_id=request_id)
        notification.delete()
        friend_request.status = 'rejected'
        friend_request.save()
        return JsonResponse({"message": "Friend request rejected."}, status=200)
    except FriendRequest.DoesNotExist:
        return JsonResponse({"error": "Friend request not found."}, status=404)

@api_view(['POST'])
def disconnect_friend(request, username):
    try:
        friend = get_object_or_404(User, username=username)
        Friend.objects.filter(
            Q(user=request.user, friend=friend) | Q(user=friend, friend=request.user)
        ).delete()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}",
            {
                "type": "status_update",
                "action": "disconnect",
                "id": friend.id,
                "status": "offline",
                "avatar": get_avatar_url(friend.avatar),
                "username": friend.username
            },
        )
        async_to_sync(channel_layer.group_send)(
            f"user_{friend.id}",
            {
                "type": "status_update",
                "action": "disconnect",
                "id": request.user.id,
                "status": "offline",
                "avatar": get_avatar_url(request.user.avatar),
                "username": request.user.username
            },
        )
        return Response(
            {"message": f"Successfully disconnected from {username}."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def block_friend(request, username):
    try:
        user_to_block = get_object_or_404(User, username=username)
        Friend.objects.filter(
            Q(user=request.user, friend=user_to_block) | Q(user=user_to_block, friend=request.user)
        ).delete()
        BlockedUser.objects.get_or_create(blocker=request.user, blocked=user_to_block)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{request.user.id}",
            {
                "type": "status_update",
                "action": "block",
                "id": user_to_block.id,
                "status": "offline",
                "avatar": get_avatar_url(user_to_block.avatar),
                "username": user_to_block.username
            },
        )
        async_to_sync(channel_layer.group_send)(
            f"user_{user_to_block.id}",
            {
                "type": "status_update",
                "action": "block",
                "id": request.user.id,
                "status": "offline",
                "avatar": get_avatar_url(request.user.avatar),
                "username": request.user.username
            },
        )
        return Response({"message": f"{username} has been blocked."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def unblock_friend(request, username):
    try:
        user_to_unblock = get_object_or_404(User, username=username)
        BlockedUser.objects.filter(blocker=request.user, blocked=user_to_unblock).delete()
        return Response({"message": f"{username} has been unblocked."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_friend_requests(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=401)
    try:
        friend_requests = FriendRequest.objects.filter(receiver=request.user, status='pending').select_related('sender')
        requests_data = [{"request_id": req.id, "sender": req.sender.username, "sender_avatar": get_avatar_url(req.sender.avatar)} for req in friend_requests]
        return Response({"friend_requests": requests_data})
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

@api_view(['GET'])
def search_users(request):
    users = User.objects.exclude(is_superuser=True).values('id', 'username', 'avatar')
    return JsonResponse(list(users), safe=False)

@api_view(['GET'])
def get_blocked_users(request):
    blocked_users = BlockedUser.objects.filter(blocker=request.user)
    serializer = BlockedUserSerializer(blocked_users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def user_profile(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    is_friend = Friend.objects.filter(
        Q(user=request.user, friend=user) | Q(user=user, friend=request.user)
    ).exists()
    is_blocked = BlockedUser.objects.filter(blocker=request.user, blocked=user).exists()
    blocked_you = BlockedUser.objects.filter(blocker=user, blocked=request.user).exists()
    is_invited = FriendRequest.objects.filter(sender=request.user, receiver=user, status='pending').exists()
    invited_you = FriendRequest.objects.filter(sender=user, receiver=request.user, status='pending').exists()
    friend_request_id = None
    if is_invited:
        friend_request_id = FriendRequest.objects.get(sender=request.user, receiver=user).id
    elif invited_you:
        friend_request_id = FriendRequest.objects.get(sender=user, receiver=request.user).id
    serializer = FriendDetailSerializer(user, context={'request': request})
    response_data = serializer.data
    response_data['is_friend'] = is_friend
    response_data['is_blocked'] = is_blocked
    response_data['blocked_you'] = blocked_you
    response_data['is_invited'] = is_invited
    response_data['invited_you'] = invited_you
    response_data['user_id'] = request.user.id
    response_data['request_id'] = friend_request_id
    return Response(response_data)

@api_view(['GET'])
def get_notifications(request):
    notifications = Notification.objects.filter(receiver=request.user, is_treated=False)
    notifications_list = []
    all_read = notifications.filter(is_read=False).count() == 0
    for notification in notifications:
        notifications_list.append({
            "notification_id": notification.id,
            "sender": notification.sender.username,
            "sender_id": notification.sender.id,
            "tournament_name": notification.tournament_name,
            "is_treated": notification.is_treated,
            "sender": notification.sender.username,
            "sender_avatar": get_avatar_url(notification.sender.avatar),
            "type": notification.type,
            "message": notification.message,
            "request_id": notification.request_id,
            "message_id": notification.message_id,
            "game_id": notification.game_id,
            "created_at": str(notification.created_at),
            "is_read": notification.is_read,
        })
    return JsonResponse({"notifications": notifications_list, "all_read": all_read})

@api_view(['GET'])
def get_chats(request):
    chats = PrivateChat.objects.filter(Q(user1=request.user) | Q(user2=request.user))
    chat_data = []
    
    for chat in chats:
        last_message = Message.objects.filter(chatGroup=chat).order_by('-timestamp').first()
        if chat.user1 == request.user:
            other_user = chat.user2
            other_user_avatar = get_avatar_url(chat.user2.avatar)
        else:
            other_user = chat.user1
            other_user_avatar = get_avatar_url(chat.user1.avatar)
        unread_messages_count = Message.objects.filter(
            chatGroup=chat,
            read=False,
            receiver=request.user
        ).count()
        chat_data.append({
            "chat_id": chat.id,
            "group_name": chat.groupName,
            "other_user_username": other_user.username,
            "other_user_id": other_user.id,
            "other_user_avatar": other_user_avatar,
            "friendship_id": chat.Friendship.id,
            "unread_messages": unread_messages_count,
            "last_message": last_message.content if last_message else None,
            "last_message_timestamp": last_message.timestamp if last_message else None
        })

    return JsonResponse({"chats": chat_data})

@api_view(['GET'])
def get_target_discussion(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    chat = PrivateChat.objects.filter(Q(user1=user) | Q(user2=user)).first()

    if not chat:
        return Response({'error': 'No chats found for this user'}, status=status.HTTP_404_NOT_FOUND)

    messages = Message.objects.filter(chatGroup=chat)

    response_data = []
    for message in messages:
        response_data.append({
            'message_id': message.id,
            'receiver': message.receiver.username,
            'sender': message.sender.username,
            'sender_id': message.sender.id,
            'receiver_id': message.receiver.id,
            'receiver_avatar': get_avatar_url(message.receiver.avatar),
            'sender_avatar': get_avatar_url(message.sender.avatar),
            'content': message.content,
            'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'is_sent': True if request.user == message.sender else False,
            'is_read': message.read,
        })

    return JsonResponse({
            "messages": response_data,
            "target_username": user.username,
            "target_avatar": get_avatar_url(user.avatar),
            "user_id": request.user.id,
            "user_username": request.user.username,
            "user_avatar": get_avatar_url(request.user.avatar)
        })

@api_view(['POST'])
def mark_message_read(request):
    data = json.loads(request.body)
    message_id = data.get('message_id')
    logger.warning(f'---------------------------{message_id}')
    try:
        message = Message.objects.get(id=message_id, receiver=request.user)
        message.read = True
        message.save()
        try:
            notification = Notification.objects.get(message_id=message.id)
            notification.is_read = True
            notification.is_treated = True
            notification.save()
        except ObjectDoesNotExist:
            pass
        return JsonResponse({'success': True, 'message': 'Message marked as read'})
    except Message.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Message not found'}, status=404)

@api_view(['POST'])
def mark_notification_read(request):
    data = json.loads(request.body)
    notification_id = data.get('notification_id')
    
    try:
        notification = Notification.objects.get(id=notification_id)
        notification.is_read = True
        notification.save()
        return JsonResponse({'success': True, 'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Notification not found'}, status=404)

@api_view(['POST'])
def mark_notification_treated(request):
    data = json.loads(request.body)
    notification_id = data.get('notification_id')
    
    try:
        notification = Notification.objects.get(id=notification_id)
        notification.is_read = True
        notification.is_treated = True
        notification.save()
        if notification.type == 'match_invitation':
            accept = data.get('accept')
            if not accept:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"user_{notification.sender_id}",
                    {
                        "type": "decline_match",
                    },
                )
        return JsonResponse({'success': True, 'message': 'Notification marked as treated'})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Notification not found'}, status=404)

@api_view(['POST'])
def check_tournament_name(request):
    tournament_name = request.data.get('name')

    if tournament_name:
        exists = Tournament.objects.filter(name=tournament_name).exists()

        return JsonResponse({'exists': exists})
    else:
        return JsonResponse({'error': 'Tournament name is required'}, status=400)