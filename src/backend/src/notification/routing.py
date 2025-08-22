# routing.py
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/user/<str:user>/', consumers.UserSocketConsumer.as_asgi()),
]
