from django.urls import re_path

from . import consumers


websocket_urlpatterns = [
    re_path(r'ws/index-room/$', consumers.IndexConsumer.as_asgi()),
    re_path(r'^ws/game-room/(?P<game_id>\d+)$', consumers.GameConsumer.as_asgi()),
]