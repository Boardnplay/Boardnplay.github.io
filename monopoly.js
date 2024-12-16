// script.js

let playerTurn = 1;
let playerPositions = [0, 0]; // positions of player 1 and player 2
let playerMoney = [1500, 1500]; // money for player 1 and player 2
const properties = [
    "GO", "Mediterranean Ave.", "Community Chest", "Baltic Ave.", "Income Tax",
    "Reading Railroad" // Add more properties
];

// Function to update player status
function updatePlayerStatus() {
    document.getElementById("player-turn").innerText = `Player ${playerTurn}'s Turn`;
    document.getElementById("player-money").innerText = `Money: $${playerMoney[playerTurn - 1]}`;
}

// Function to roll the dice
function rollDice() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    document.getElementById("dice1").innerText = dice1;
    document.getElementById("dice2").innerText = dice2;
    
    movePlayer(dice1 + dice2);
}

// Function to move the player
function movePlayer(steps) {
    let newPosition = playerPositions[playerTurn - 1] + steps;
    if (newPosition >= properties.length) {
        newPosition -= properties.length;
    }

    playerPositions[playerTurn - 1] = newPosition;
    alert(`Player ${playerTurn} landed on ${properties[newPosition]}`);
    
    // Switch to the next player's turn
    playerTurn = playerTurn === 1 ? 2 : 1;
    updatePlayerStatus();
}

// Event listener for the roll dice button
document.getElementById("roll-dice").addEventListener("click", rollDice);

// Initialize the game
updatePlayerStatus();
