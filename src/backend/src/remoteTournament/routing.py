from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/remotetournament/', consumers.TournamentList.as_asgi()),
    re_path(r'ws/tournament/(?P<tournament_name>\w+)/$', consumers.TournamentConsumer.as_asgi()),
    re_path(r'ws/tournament/(?P<tournament_name>\w+)/(?P<match_id>\d+)/$', consumers.GameConsumer3.as_asgi()),
    re_path(r'ws/tournament/(?P<tournament_name>\w+)/(?P<match_id>\d+)/(?P<room_name>\w+)/$', consumers.RemoteConsumer3.as_asgi()),
]
