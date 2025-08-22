from django.urls import re_path
from pingpong.consumers import GameConsumer2, RemoteConsumer2, GameConsumer2friend

websocket_urlpatterns = [
    re_path(r'ws/pingpong/wait_for_opponent2', GameConsumer2.as_asgi()),
    re_path(r'ws/pingpong/room/(?P<room_name>\w+)/$', RemoteConsumer2.as_asgi()),
    re_path(r'ws/pingpong/(?P<max_id>\d+)/(?P<min_id>\d+)/$', GameConsumer2friend.as_asgi()),
]
