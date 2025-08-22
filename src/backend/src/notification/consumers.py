from channels.generic.websocket import AsyncWebsocketConsumer
from accounts.models import *
from accounts.views import get_avatar_url
import jwt
import json
from .utils import *
from django.conf import settings
from channels.exceptions import DenyConnection
from asgiref.sync import sync_to_async
import urllib.parse
from django.db.models import Q
import asyncio
from channels.layers import get_channel_layer

class UserSocketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = await self.check_token()
            self.group_name = f"user_{self.user.id}"

            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await set_user_status(self.user, True)
            await self.change_status(True)
            await self.accept()
        except DenyConnection as e:
            await self.close()
            return

    async def disconnect(self, close_code):
        await self.change_status(False)
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")

        if action == "send_notification":
            await self.send_notification(data)
        elif action == "updateStatus":
            status = data.get("status")
            self.user.is_online = status
            await sync_to_async(self.user.save)()
        elif action == "invite_tournament":
            await self.tournament_notification(data)

    async def decline_match(self, event):
        await self.send(text_data=json.dumps({
            'type': 'decline_match',
            'status': 'decline_match',
            'action': 'decline_match',
        }))

    async def tournament_notification(self, data):
        sender = self.user
        receiver_id = data.get("receiver_id")
        notification_type = data.get("type")
        message = data.get("message")
        tournament_name = data.get("tournament_name")

        try:
            receiver = await sync_to_async(User.objects.get)(id=receiver_id)
            if sender == receiver:
                return
            notification = await sync_to_async(Notification.objects.create)(
                sender=sender,
                receiver=receiver,
                type=notification_type,
                message=message,
                is_read=False,
                tournament_name=tournament_name
            )
            await sync_to_async(notification.save)()
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({"error": "User not found"}))

    async def send_notification(self, data):
        sender = self.user
        receiver_id = data.get("receiver_id")
        notification_type = data.get("type")
        message = data.get("message")
        request_id = data.get("request_id")

        try:
            receiver = await sync_to_async(User.objects.get)(id=receiver_id)
            if sender == receiver:
                return
            notification = await sync_to_async(Notification.objects.create)(
                sender=sender,
                receiver=receiver,
                type=notification_type,
                message=message,
                is_read=False,
                request_id=request_id
            )
            await sync_to_async(notification.save)()
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({"error": "User not found"}))

    async def change_status(self, status):
        try:
            friends_ids = await get_user_friends(self.user)
        except Exception as e:
            return

        avatar_url = get_avatar_url(self.user.avatar)
        channel_layer = get_channel_layer()

        for friend_id in friends_ids:
            group_name = f"user_{friend_id}"
            print(f"Sending status to group: {group_name}")

            try:
                await channel_layer.group_send(
                    group_name,
                    {
                        "type": "status_update",
                        "action": "status",
                        "id": self.user.id,
                        "status": status,
                        "avatar": avatar_url,
                        "username": self.user.username,
                    }
                )
            except Exception as e:
                print(f"Error sending message to group {group_name}: {e}")

    async def notify(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            "action": event["action"],
            "id": event["id"],
            "status": event["status"],
            "avatar": event["avatar"],
            "username": event["username"],
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_token.get('user_id')
            user = await getUser(user_id)
            if not user:
                raise DenyConnection("Invalid token")
            return user
        except jwt.ExpiredSignatureError:
            raise DenyConnection("Token expired")
        except jwt.InvalidTokenError:
            raise DenyConnection("Invalid token")

class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user = await self.check_token()
            self.group_name = f"friends_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            self.user.is_online = True
            await sync_to_async(self.user.save)()
            await self.accept()
        except DenyConnection as e:
            await self.close()
            return
        
    async def disconnect(self, close_code):
        self.user.is_online = False
        await sync_to_async(self.user.save)()
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        status = data.get('status')
        self.user.is_online = status
        await sync_to_async(self.user.save)()

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            "action": event["action"],
            "id": event["id"],
            "status": event["status"],
            "avatar": event["avatar"],
            "username": event["username"],
        }))

    async def check_token(self):
        token = self.scope['cookies'].get('my-token')
        if not token:
            raise DenyConnection("No token provided")

        try:
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_token.get('user_id')
            user = await getUser(user_id)
            if not user:
                raise DenyConnection("Invalid token")
            return user
        except jwt.ExpiredSignatureError:
            raise DenyConnection("Token expired")
        except jwt.InvalidTokenError:
            raise DenyConnection("Invalid token")
