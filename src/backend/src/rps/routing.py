from django.urls import re_path
from rps.consumers import GameConsumer1, RemoteConsumer1

websocket_urlpatterns = [
    re_path(r'ws/rock/wait_for_opponent1', GameConsumer1.as_asgi()),
    re_path(r'ws/rock/room/(?P<room_name>\w+)/$', RemoteConsumer1.as_asgi()),
]
