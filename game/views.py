from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, JsonResponse
from django.db import IntegrityError
from django.db.models import Q
from django.shortcuts import render
from django.urls import reverse

from .models import User, Game


@login_required
def index(request):
    user = request.user
    if not user.in_game:
        return render(request, "game/index.html", {
            "started_games": Game.objects.filter(is_enterable=False),
            "waiting_games": Game.objects.filter(is_enterable=True),
        })
    else:
        return render(request, "game/game_table.html", {
            "game": Game.objects.get(Q(player1=user) | Q(player2=user))
        })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "game/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "game/login.html")
    

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("login"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        
        # Ensure passwork matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "game/register.html", {
                "message": "Passwords must match."
            })
        
        # Attempt to create new user
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
        except IntegrityError:
            return render(request, "game/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    
    else: # GET request
        return render(request, "game/register.html")
    

@login_required
def return_games(request):

    games = Game.objects.all()
    if games:
        return JsonResponse([game.serialize() for game in games], safe=False)


@login_required
def enter_game(request, game_id):
    
    # Get game
    game = Game.objects.get(pk=game_id)
    user = request.user

    # Handle errors:
    if user.in_game:
        return render(request, "game/error", {
            "error": "You're already playing a game"
        })
    elif game.player2:
        return render(request, "game/error", {
            "error": "This game is full"
        })
    
    else:
        game.player2 = user
        game.is_enterable = False
        game.is_active = True
        user.in_game = game

        game.save()
        user.save()

        # Redirect to game page
        return render(request, "game/game_table.html", {
            "game": Game.objects.get(Q(player1=user) | Q(player2=user))
        })


@login_required
def create_game(request):
    user = request.user
    if user.in_game:
        return render(request, "game/error", {
            "error": "You're already playing a game"
        })
    else:
        new_game = Game.objects.create(player1 = user, is_active = False, is_enterable = True)
        user.in_game = new_game
        user.save()

        # Redirect to game page
        return render(request, "game/game_table.html", {
            "game": Game.objects.get(Q(player1=user) | Q(player2=user))
        })


@login_required
def end_game(request, game_id):
    user = request.user
    game = Game.objects.get(pk=game_id)

    # Only delete if the user is one of the players
    if user in [game.player1, game.player2]:
        # Make user able to enter other games
        if game.player1: 
            game.player1.in_game = None
            game.player1.save()
        if game.player2:
            game.player2.in_game = None
            game.player2.save()

        game.delete()

        return HttpResponseRedirect(reverse("index"))
    
    else:
        return render(request, "game/error", {
            "error": "Unauthorized"
        })
        
