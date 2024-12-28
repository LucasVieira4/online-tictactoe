const gameId = document.querySelector('#game-id').innerHTML;
const user = document.querySelector('#user').innerHTML;
let player2HasEntered = false;
let player = '';
let turn = 1;
let game_array = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let player1Username = '';
let player2Username = '';
let gameSocket = null;


document.addEventListener('DOMContentLoaded', () => {
    getPlayer();
    initiateGameSocket();
});

async function drawGrid() {
    // Create the main container that will hold our grid
    const container = document.createElement('div');
    container.id = 'game-container';

    // Create the 3x3 grid structure
    for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'game-row';

        for (let j = 0; j < 3; j++) {
            const counter = i * 3 + j; // Index for the current cell
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.id = `${counter + 1}`;

            // Assign X or O based on game_array
            const value = game_array[counter];
            if (value === 1) {
                cell.textContent = 'X';
                cell.style.color = '#0dcaf0';
            } else if (value === 2) {
                cell.textContent = 'O';
                cell.style.color = '#0dcaf0';
            }

            row.appendChild(cell);
        }

        container.appendChild(row);
    }

    container.addEventListener('click', (event) => makeMove(event));

    // Replace the grid in the DOM
    const gameGrid = document.querySelector('#game-grid');
    gameGrid.innerHTML = ''; // Clear existing grid
    gameGrid.appendChild(container);

    await updatePlayerDisplay();
    updateTurnIndicator();
}


function initiateGameSocket() {
    gameSocket = new WebSocket(`ws://${window.location.host}/ws/game-room/${gameId}`);

    gameSocket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        // game messages
        if (data.message === 'play has been made') {
            game_array = data.gameState; 
            turn = turn === 1 ? 2 : 1; 
            await drawGrid();
        }

        if (data.message === 'player1 won') {
            document.getElementById('1-won').style.display = 'block';
            document.getElementById('game-grid').style.display = 'none';
        }

        if (data.message === 'player2 won') {
            document.getElementById('2-won').style.display = 'block';
            document.getElementById('game-grid').style.display = 'none';
        }
    

        if (data.message === 'draw!') {
            document.getElementById('draw').style.display = 'block';
            document.getElementById('game-grid').style.display = 'none';
        }


        if (data === 'game ended') {
            document.querySelector('#index_button').style.display = 'block';
            document.querySelector('#end_button').style.display = 'none';
            document.querySelector('#game-grid').style.display = 'none';
            localStorage.removeItem('player2HasEntered');
            player2HasEntered = false;
        }
    
        if (data === 'player2 joined') {
            player2HasEntered = true;
            localStorage.setItem('player2HasEntered', 'true');
            await drawGrid();
            updateTurnIndicator()
        } else if (data === 'player1 joined') {
            // Check localStorage instead of the variable
            if (localStorage.getItem('player2HasEntered') === 'true') {
                await drawGrid();
                updateTurnIndicator()
            }
        }
    }

    gameSocket.onclose = (event) => {
        console.log('WebSocket connection closed');
    };

    gameSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
    };
}


function makeMove(event) {
    // Ensure the clicked cell is valid, it's the player's turn, and the cell isn't already filled
    if (event.target.classList.contains('game-cell') && turn === player && !event.target.textContent) {
        // Update the game array with the player's move
        game_array[event.target.id - 1] = player;

        // Check for game result after the move
        const result = checkGameResult();

        // Prepare the message to send to the server
        let message;
        if (result === 1) {
            message = 'player1 won';
        } else if (result === 2) {
            message = 'player2 won';
        } else if (result === 'draw') {
            message = 'draw!';
        } else {
            message = 'play has been made'; // No winner or draw yet
        }

        const moveData = {
            message: message,
            cell: event.target.id - 1,
            player: player,
            gameState: game_array,
        };

        // Send the move data to the server via WebSocket
        if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
            gameSocket.send(JSON.stringify(moveData));
        } else {
            console.error('WebSocket is not connected');
        }
    }
}


async function getPlayer() {
    try {
        const response = await fetch(`/game/${gameId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const game = await response.json();
        
        if (game.player1 === user) {
            player = 1;
        } else {
            player = 2;
        }
        player1Username = game.player1;
        player2Username = game.player2;
        
        return game;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}


async function updatePlayerDisplay() {
    try {
        
        await getPlayer();
        
        document.getElementById('waiting').style.display = 'none';
        document.getElementById('names').style.display = 'block';
        document.getElementById('player1_name').innerHTML = player1Username;
        document.getElementById('player2_name').innerHTML = player2Username;
    } catch (error) {
        console.error('Error updating player display:', error);
    }
}

function updateTurnIndicator() {
    const turnDisplay = document.getElementById('turn-display');
    turnDisplay.textContent = turn === player ? 'Your turn' : "Opponent's turn";
}

function checkGameResult() {
    // Define all possible winning combinations
    const winningCombos = [
        // Horizontal rows
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        // Vertical columns
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        // Diagonals
        [0, 4, 8],
        [2, 4, 6]
    ];

    // Check for a winner
    for (let combo of winningCombos) {
        // Get the value of each position in current winning combination
        const [a, b, c] = combo;
        const valueA = game_array[a];
        const valueB = game_array[b];
        const valueC = game_array[c];

        // If all three positions match and aren't empty (0), we have a winner
        if (valueA !== 0 && valueA === valueB && valueB === valueC) {
            return valueA;
        }
    }

    // If no winner, check for draw (all spaces filled)
    if (!game_array.includes(0)) {
        return 'draw';
    }

    // If no winner and not a draw, game is still ongoing
    return false;
}
