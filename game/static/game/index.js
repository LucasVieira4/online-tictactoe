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
            element.classList.add("col", "mb-4");
            
            element.innerHTML = `
                <div class="d-flex justify-content-center w-100">
                    <div class="card border-info mb-0 text-center h-100" style="width: 300px;">
                        <div class="card-header">Game ${game.id}</div>
                        <div class="card-body d-flex flex-column justify-content-between py-4 px-3">
                            <h5 class="card-title mb-0">
                                <div class="d-flex justify-content-center align-items-center flex-wrap gap-2">
                                    <span class="text-nowrap">${game.player1}</span>
                                    <span class="px-2">X</span>
                                    <span class="text-nowrap">${game.player2}</span>
                                </div>
                            </h5>
                            ${game.is_enterable ? `
                                <div class="mt-4 d-flex justify-content-center">
                                    <a href="enter_game/${game.id}" class="btn btn-outline-info">
                                        Enter Match
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Append to the respective div
            if (game.is_enterable)
                document.querySelector('#waiting_games_div').append(element);
            else
                document.querySelector('#started_games_div').append(element);
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
