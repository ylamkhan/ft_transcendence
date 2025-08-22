from django.urls import re_path
from tictactoe.consumers import GameConsumer, RemoteConsumer

websocket_urlpatterns = [
    re_path(r'ws/tictactoe/wait_for_opponent', GameConsumer.as_asgi()),
    re_path(r'ws/tictactoe/room/(?P<room_name>\w+)/$', RemoteConsumer.as_asgi()),
]
