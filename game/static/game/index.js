document.addEventListener('DOMContentLoaded', () => {
    displayGames();
    initiateIndexSocket();
});

function displayGames() {
    fetch('/games')
    .then(response => response.json())
    .then(games => {
        // Empty the games_div
        document.querySelector('#waiting_games_div').innerHTML = '';
        document.querySelector('#started_games_div').innerHTML = '';

        games.forEach(game => {
            // Create the div to append
            const element = document.createElement('div'); 
            element.classList.add("col", "d-flex", "justify-content-center");
            element.innerHTML = `
                <div class="card border-info mb-3 text-center" style="max-width: 18rem;">
                    <div class="card-header">Game ${game.id}</div>
                    <div class="card-body px-5">
                        <h5 class="card-title pb-2">${game.player1} X ${game.player2}</h5>
                        <div class="d-flex justify-content-center">
                            <a type="button" href="enter_game/${game.id}" class="btn btn-outline-info" style="display: ${game.is_enterable ? 'block' : 'none'};">Enter Match</a>
                        </div>
                    </div>
                </div>                  
            `;

            // Append to the respective
            if (game.is_enterable) {
                document.querySelector('#waiting_games_div').append(element);
            } else {
                document.querySelector('#started_games_div').append(element);
            }

        });
    })
}

function initiateIndexSocket() {
    const indexSocket = new WebSocket(`ws://${window.location.host}/ws/index-room/`);
    
    indexSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        // if data is equal to databse update, to this

        if (data === 'database updated' || data === 'game ended')
            displayGames();
    }

    indexSocket.onclose = (event) => {
        console.log('WebSocket connection closed');
    };

    indexSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
    };
}
