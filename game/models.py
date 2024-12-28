from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    in_game = models.ForeignKey("Game", on_delete=models.SET_NULL, related_name='games', null=True, blank=True)

class Game(models.Model):
    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games_as_player1', null=True, blank=True)
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games_as_player2', null=True, blank=True)
    is_active = models.BooleanField(default=False)
    is_enterable = models.BooleanField(default=True)

    def serialize(self):
        return {
            "id": self.id,
            "player1": self.player1.username,
            "player2": self.player2.username if self.player2 else "Empty",
            "is_active": self.is_active,
            "is_enterable": self.is_enterable
        }

    def __str__(self):
        return f"{self.player1} X {self.player2 or 'Empty'}"
    

