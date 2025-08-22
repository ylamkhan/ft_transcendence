"""
ASGI config for api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter , URLRouter
from rps import routing as RpsRouting
from tictactoe import routing as TictactoeRouting
from pingpong import routing as PingRouting
from pingpongTourn import routing as TournRouting
from remoteTournament import routing as RemoteRouting
from notification import routing as NotifRouting
from chatapp import routing as ChatRouting

application = ProtocolTypeRouter(
    {
        "http" : get_asgi_application() , 
        "websocket" : AuthMiddlewareStack(
            URLRouter(
                TictactoeRouting.websocket_urlpatterns +
                PingRouting.websocket_urlpatterns +
                RpsRouting.websocket_urlpatterns +
                TournRouting.websocket_urlpatterns +
                RemoteRouting.websocket_urlpatterns +
                NotifRouting.websocket_urlpatterns +
                ChatRouting.websocket_urlpatterns
                
            )    
        )
    }
)


