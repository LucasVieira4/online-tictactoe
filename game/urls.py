from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("register", views.register, name="register"),
    path("logout", views.logout_view, name="logout"),
    path("login", views.login_view, name="login"),

    # API Routes
    path("games", views.return_games, name="return_games"),
    path("enter_game/<int:game_id>", views.enter_game, name="enter_game"),
    path("create_game", views.create_game, name="create_game"),
    path("end_game/<int:game_id>", views.end_game, name="end_game"),
]