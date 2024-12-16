const board = document.getElementById('board');
const currentPlayerDisplay = document.getElementById('currentPlayer');
const messageDisplay = document.getElementById('message');
const rollDiceButton = document.getElementById('rollDice');

const players = [
    { id: 1, position: 0, money: 1500 },
    { id: 2, position: 0, money: 1500 }
];

let currentPlayerIndex = 0;

const properties = [
    { name: "Go", price: 0 },
    { name: "Mediterranean Avenue", price: 100 },
    { name: "Community Chest", price: 0 },
    { name: "Baltic Avenue", price: 100 },
    { name: "Income Tax", price: 0 },
    { name: "Reading Railroad", price: 200 },
    { name: "Oriental Avenue", price: 100 },
    { name: "Chance", price: 0 },
    { name: "Vermont Avenue", price: 100 },
    { name: "Connecticut Avenue", price: 120 },
    // Add more properties as needed
];

function createBoard() {
    properties.forEach((property, index) => {
        const square = document.createElement('div');
        square.classList.add('square');
        square.innerText = property.name;
        square.dataset.index = index;
        board.appendChild(square);
    });
}

function rollDice() {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    messageDisplay.innerText = `Player ${players[currentPlayerIndex].id} rolled a ${diceRoll}`;
    movePlayer(diceRoll);
}

function movePlayer(roll) {
    const player = players[currentPlayerIndex];
    player.position = (player.position + roll) % properties.length;
    currentPlayerDisplay.innerText = player.id;
    checkProperty();
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
}

function checkProperty() {
    const player = players[currentPlayerIndex];
    const property = properties[player.position];
    if (property.price > 0) {
        if (player.money >= property.price) {
            messageDisplay.innerText += ` - You can buy ${property.name} for $${property.price}`;
        } else {
            messageDisplay.innerText += ` - You cannot afford ${property.name}`;
        }
    }
}

rollDiceButton.addEventListener('click', rollDice);
createBoard();
