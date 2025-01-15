import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from . models import Game

class IndexConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "index_room"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "index_update",
                "message": f"user {self.channel_name} connected"
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "index_update",
                "message": f"user {self.channel_name} disconnected"
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "index_update",
                "message": data
            }
        )

    async def index_update(self, event):
        # Send message to WebSocket (to client)
        await self.send(text_data=json.dumps(event["message"]))


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.room_group_name = f"room_{self.game_id}"
        self.user = self.scope['user']

        try:
            # Get the game object asynchronously
            self.game = await database_sync_to_async(self.get_game)(self.game_id)
            
            # Create a separate async method to handle player comparison
            is_player1 = await database_sync_to_async(self.check_if_player1)()
            
            # Join room group
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

            # Use the result of our async comparison
            payload = {
                "type": "game_update"
            }

            if is_player1:
                payload["message"] = "player1 joined"
            else:
                payload["message"] = "player2 joined"
                payload["player2_name"] = self.scope["user"].username

            await self.channel_layer.group_send(
                self.room_group_name,
                payload
            )
            
        except Exception as e:
            # Handle cases where the game doesn't exist
            print(f"Error fetching game: {e}")
            await self.close()
            return


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)


        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_update",
                "message": f"{'player1' if self.check_if_player1() else 'player2'} disconnected"
            }
        )


    async def receive(self, text_data):
        data = json.loads(text_data)
        
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_update",
                "message": data
            }
        )


    async def game_update(self, event):
        await self.send(text_data=json.dumps(event))


    def get_game(self, id):
        return Game.objects.get(pk=id)
    
    
    def check_if_player1(self):
        return self.user == self.game.player1