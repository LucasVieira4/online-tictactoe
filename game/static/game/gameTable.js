const gameId = document.querySelector('#game-id').innerHTML;
const user = document.querySelector('#user').innerHTML;

const xSVG = `<svg fill="#0dcaf0" height="151px" width="151px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 460.775 460.775" xml:space="preserve" stroke="#0dcaf0"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="7.372400000000001"></g><g id="SVGRepo_iconCarrier"> <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55 l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719 c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path> </g></svg>`;
const oSVG = `<svg width="175px" height="175px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#0dcaf0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;

let player           = '';
let turn             = '';
let game             = '';
let combination      = '';
let winner           = '';
let gameSocket       = null;
let isMoveInProgress = false; // Flag to keep check of the async fetches



document.addEventListener('DOMContentLoaded', async () => {
    try {
        game = await getGameInformation(); 
        // Stablish WebSocket connection
        initiateGameSocket(); 
        if (game.player2 == 'Empty') // P2 hasn't entered yet
            waitingScreen(true);
        else
            drawGrid();
    } catch (error) {   
        console.log(error);
    } 
});

async function drawGrid() {
    // First, change the waiting <p> to the names.
    waitingScreen(false);

    const container = document.createElement('div');
    container.id = 'game-container';
    const turnIndicator = document.querySelector('#turn');
    turnIndicator.style.background = `#212529`;

    // Turn indicatior only if game doesn't have a winner
    const isWinner = game.winner === player;
    const isPlayerTurn = turn === player;

    // Create the 3x3 grid structure
    for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'game-row';

        for (let j = 0; j < 3; j++) {
            const counter = i * 3 + j; // Index for the current cell
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.id = `${counter}`;

            if (game.table[counter] === 1) {
                cell.innerHTML = xSVG;
            } else if (game.table[counter] === 2) {
                cell.innerHTML = oSVG;
            }

            row.appendChild(cell);
        }

        container.appendChild(row);
    }

    container.addEventListener('click', (event) => makeMove(event, turnIndicator));

    // Replace the grid in the DOM
    const gameGrid = document.querySelector('#game-grid');
    gameGrid.innerHTML = ''; // Clear existing grid
    gameGrid.appendChild(container);

    
    if (game.winner) {
        container.style.outline = isWinner ? '10px solid #0ac084' : '10px solid #f0330d';
        turnIndicator.innerHTML = isWinner ? 'Victory!' : 'Defeat.';
        const backgroundColor = isWinner ? '#0ac084' : '#f0330d';
        // Parse the combination if it's a string
        const combinationArray = JSON.parse(game.combination)
        combinationArray.forEach(item => {
            document.getElementById(item).style.background = backgroundColor;
        })
        document.querySelector('#end-button').innerHTML = `Main Page`;

    } else if (game.draw) {
        turnIndicator.innerHTML = 'Draw.';

    } else {
        container.style.outline = isPlayerTurn ? '10px solid #0ac084' : '10px solid #f0330d';
        turnIndicator.innerHTML = isPlayerTurn ? 'Your Turn!' : "Wait. Opponent's turn.";
    }

}

async function waitingScreen(bool) {
    const gameInformation = document.querySelector('#game-information');
    if (bool == true) 
        gameInformation.innerHTML = `Waiting for Player2 ...`;    
    else 
        gameInformation.innerHTML = `${game.player1} X ${game.player2}`;   
}


function initiateGameSocket() {
    gameSocket = new WebSocket(`ws://${window.location.host}/ws/game-room/${gameId}`);

    gameSocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.message === 'database updated') {
            game = await getGameInformation();
            await drawGrid();
        }
        // Since p1's first db fetch returns a game that has no p2, we need to set it's value here, to be updated when the screen is first loaded.
        if (data.message === 'player2 joined') {
            game.player2 = data.player2_name; 
            await drawGrid();
        } 

        if (data.message === 'game ended abruptly') {
            endGame(data.quitter);
        }        

        if (data.message === 'a player has won') {
            game = await getGameInformation();
            await drawGrid();
        }

        if (data.message === 'the game ended in a draw') {
            game = await getGameInformation();
            await drawGrid();
        }

    }

    gameSocket.onclose = (event) => {
        console.log('WebSocket connection closed');
    };

    gameSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
    };
}

async function makeMove(event, turnIndicator) {
    
    // First, check the flag. If true, return right away.
    if (isMoveInProgress)
        // Move is already in progress, ignoring this click to prevent overlapping moves
        return;

    if (game.winner)
            return; // Don't send the request if the game has already ended.


    if (turn === player) {
        // Start of the move
        isMoveInProgress = true;

        // This fetch is async, has a delay
        const response = await fetch(`/game/${game.id}/update`, {
            method: 'PUT', 
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({
                player: player,
                place: parseInt(event.target.closest('.game-cell').id)
            })
        })
        if (response.status === 409) {
            isMoveInProgress = false; 
            turnIndicator.innerHTML = `Can't play there! It's already clicked.`; 
            turnIndicator.style.background = `#2c0b0e`;
            return;
        }

        // Move completed
        turn = 3 - turn;
        isMoveInProgress = false;

    } else {
        // Not user's turn. raise error
        turnIndicator.innerHTML = `Can't play yet, not your turn.`; 
        turnIndicator.style.background = `#2c0b0e`;
    }
}

async function getGameInformation() {
    try {
        const response = await fetch(`/game/${gameId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const game = await response.json();
        
        if (game.player1 === user)
            player = 1;
         else
            player = 2;
        turn = game.turn;
        return game;

    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}

function getCSRFToken() {
    const csrfToken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
    return csrfToken ? csrfToken.split('=')[1] : '';
}

function endGame(quitter) {
    document.querySelector('#turn').innerHTML = `This game ended, ${quitter} left the match.`;
    document.querySelector('#game-grid').innerHTML = ``;
    document.querySelector('#end-button').innerHTML = 'Main Page';
}
