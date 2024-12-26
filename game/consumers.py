import json

from channels.generic.websocket import AsyncWebsocketConsumer

class IndexConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "index_room"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "index_update",
                "message": { 
                    'message': f"user {self.channel_name} connected"
                }
            }
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "index_update",
                "message": { 
                    'message': f"user {self.channel_name} disconnected"
                }
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