from django.urls import re_path
from pingpongTourn.consumers import TournamentConsumer

websocket_urlpatterns = [
    re_path(r'ws/pingpong/tournament', TournamentConsumer.as_asgi()),
    re_path(r'ws/pingpong/tournament/(?P<tournament_name>\w+)/$', TournamentConsumer.as_asgi()),
    # re_path(r'ws/pingpong/tournament/(?P<tournament_name>\w+)/room/(?P<room_name>\w+)/$', RemoteConsumer4.as_asgi()),
]
