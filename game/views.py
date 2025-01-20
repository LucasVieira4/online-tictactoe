import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, JsonResponse
from django.db import IntegrityError
from django.db.models import Q
from django.shortcuts import render
from django.urls import reverse


# Necessary to send messages to the consumer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
# Get the Redis channel layer
channel_layer = get_channel_layer()

from .models import User, Game



@login_required
def index(request):
    user = request.user
    if user.in_game:
        return render(request, "game/game_table.html", {
            "game": Game.objects.get(Q(player1=user) | Q(player2=user))
        })
    
    return render(request, "game/index.html")


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

        # Send message to all the users connect to the index room that the database was changed
        async_to_sync(channel_layer.group_send)(
            "index_room",
            {
                "type": "index_update",
                "message": "database updated"
            }
        )


        # Redirect to game page
        return HttpResponseRedirect(reverse("game", kwargs={'game_id':game_id}))

    
@login_required
def create_game(request):
    user = request.user
    if user.in_game:
        return render(request, "game/error", {
            "error": "You're already playing a game"
        })
    else:
        game_table = json.dumps([0, 0, 0, 0, 0, 0, 0, 0, 0]) # Create game table and set it all to 0
        new_game = Game.objects.create(player1=user, is_active=False, is_enterable=True, table=game_table)
        user.in_game = new_game
        user.save()

        # Send message to all the users connect to the index room that the database was changed
        async_to_sync(channel_layer.group_send)(
            "index_room",
            {
                "type": "index_update",
                "message": "database updated"
            }
        )

        # Redirect to game page
        return HttpResponseRedirect(reverse("game", kwargs={'game_id':new_game.id}))
   

@login_required
def end_game(request, game_id):
    user = request.user
    try:
        game = Game.objects.get(pk=game_id)
    except Game.DoesNotExist:
        return HttpResponseRedirect(reverse("index"))
    game_id = game.id

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
        # Send message to all the users connect to the index room that the database was changed
        async_to_sync(channel_layer.group_send)(
            "index_room",
            {
                "type": "index_update",
                "message": "game ended"
            }
        )

        # Send message to the game room, to alert the other player
        async_to_sync(channel_layer.group_send)(
            f"room_{game_id}",
            {
                "type": "game_update",
                "message": "game ended abruptly",
                "quitter": str(user)

            }
        )

        return HttpResponseRedirect(reverse("index"))
    
    else:
        return render(request, "game/error", {
            "error": "Unauthorized"
        })


@login_required
def game(request, game_id):
    
    try:
        game = Game.objects.get(pk=game_id)
    except:
        return HttpResponseRedirect(reverse("index"))
    
    # Handle logic of updating the game
    if request.method == "PUT":
        data = json.loads(request.body)
        game_table = json.loads(game.table) # Get and deserialize list

        # Check if place chosen is a 0
        if game_table[data['place']] != 0:
            return JsonResponse(
                {'error': 'Square already occupied'}, 
                status=409
            )
        
        # Update game list
        player = data['player']
        game_table[data['place']] = player
        game.table = json.dumps(game_table)
        game.turn = 3 - game.turn # Toggle between 1 and 2.
        game.save() # Save to the db

        # send websocket message
        async_to_sync(channel_layer.group_send)(
            f"room_{game_id}",
            {
                "type": "game_update",
                "message": "database updated"
            }
        )

        # check winner
        combination = check_winner(json.loads(game.table), player)
        
        if combination:
            game.winner = player
            game.combination = json.dumps(combination)
            game.save()
            async_to_sync(channel_layer.group_send)(
                f"room_{game_id}",
                {
                    "type": "game_update",
                    "message": "a player has won",
                    "winner": player
                }
            )   
            
            # Return response
            return JsonResponse(
                {'message': 'The show has ended'}, 
                status=200
            )
        
        if 0 not in game_table:
            game.draw = True
            game.save()

        # Return response
        return JsonResponse(
            {'message': 'The show must go on'}, 
            status=200
        )


    else: # Request method is get
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            game.table = json.loads(game.table)
            return JsonResponse(game.serialize())

        # Redirect to game page
        return render(request, "game/game_table.html", {
            "game": game
        })


# Checks if a player has won the game
def check_winner(board, player):
    winning_combinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    for combination in winning_combinations: # Iterate through all the lists in the combinations list
        win = True
        for index in combination: # Iterate through all the elements of the current list
            if board[index] != player: # Uses the element as index to the board list, that has all the information. If not True, the player did not won in that way
                win = False
                break
        if win:  # If win is still True after checking the combination
            return combination
    return False # None of the list combinations has been found True