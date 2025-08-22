


from django.urls import path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    path('ws/chat-server/', ChatConsumer.as_asgi()),
]



# from django.urls import re_path
# from . import consumers

# websocket_urlpatterns = [
#     re_path(r'ws/chat-server/', consumers.ChatConsumer.as_asgi()),
# ]

# from django.urls import path
# from .consumers import OneToOneChatConsumer

# websocket_urlpatterns = [
#     path('ws/chat/<uuid:room_name>/', OneToOneChatConsumer.as_asgi()),
# ]
