var square_class = document.getElementsByClassName("square");
var white_checker_class;
var black_checker_class;
var table = document.getElementById("table");
var score = document.getElementById("score");
var moveSound = document.getElementById("moveSound");
var winSound = document.getElementById("winSound");

var moveLength = 60;
var moveDeviation = 5;

var selectedPiece, selectedPieceindex;
var upRight, upLeft, downLeft, downRight;
var gameOver = 0;

var block = [];
var w_checker = [];
var b_checker = [];
var the_checker;
var mustAttack = false;

var whoseTurn = "white"; 

function getDimension() {
    var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (windowWidth <= 768) {
        moveLength = 40; 
        moveDeviation = 2; 
    } else {
        moveLength = 60;
        moveDeviation = 5;
    }
}

function drawCheckers() {
    let whiteIndex = 1;
    let blackIndex = 1;
    for (let i = 1; i <= 8; i++) {
        for (let j = 1; j <= 8; j++) {
            if (block[i][j].color == "black") {
                if (i <= 3) {
                    table.innerHTML += `<div class='checker black_checker' id='b_checker_${blackIndex}'></div>`;
                    block[i][j].occupier = "black";
                    b_checker[blackIndex] = new Checker(document.getElementById(`b_checker_${blackIndex}`), blackIndex, "black", block[i][j].top, block[i][j].left);
                    blackIndex++;
                } else if (i >= 6) {
                    table.innerHTML += `<div class='checker white_checker' id='w_checker_${whiteIndex}'></div>`;
                    block[i][j].occupier = "white";
                    w_checker[whiteIndex] = new Checker(document.getElementById(`w_checker_${whiteIndex}`), whiteIndex, "white", block[i][j].top, block[i][j].left);
                    whiteIndex++;
                }
            }
        }
    }

    white_checker_class = document.getElementsByClassName("white_checker");
    black_checker_class = document.getElementsByClassName("black_checker");

    for (let i = 0; i < white_checker_class.length; i++) {
        white_checker_class[i].setAttribute("onClick", "selectPiece(this)");
    }
    for (let i = 0; i < black_checker_class.length; i++) {
        black_checker_class[i].setAttribute("onClick", "selectPiece(this)");
    }
    the_checker = w_checker;
}

function initializeTable() {
    for (let i = 1; i <= 8; i++) {
        block[i] = [];
        for (let j = 1; j <= 8; j++) {
            var top = (i - 1) * moveLength;
            var left = (j - 1) * moveLength;
            var squareElement = document.getElementById("sq" + i + j);
            var color = (i % 2 !== j % 2) ? "black" : "white";
            block[i][j] = new Block(squareElement, color, i, j, left, top);
        }
    }
}

function Block(element, color, row, col, left, top) {
    this.element = element;
    this.color = color;
    this.row = row;
    this.col = col;
    this.left = left;
    this.top = top;
    this.occupier = null;
    if (this.color === 'black') {
        this.element.setAttribute("onClick", "movePiece(this)");
    }
}

function Checker(element, id, color, top, left) {
    this.element = element;
    this.id = id;
    this.color = color;
    this.king = false;
    this.alive = true;
    this.top = top;
    this.left = left;
    this.element.style.top = top + moveDeviation + "px";
    this.element.style.left = left + moveDeviation + "px";
}

function getCheckerByElement(element) {
    const isWhite = element.classList.contains('white_checker');
    const checkers = isWhite ? w_checker : b_checker;
    for (let i = 1; i < checkers.length; i++) {
        if (checkers[i] && checkers[i].element === element) {
            return checkers[i];
        }
    }
    return null;
}

function selectPiece(pieceElement) {
    if (gameOver) return;
    
    selectedPiece = getCheckerByElement(pieceElement);
    if (!selectedPiece || selectedPiece.color !== whoseTurn) return;

    playSound(moveSound);
    erase_roads();

    let potentialMoves = getAvailableMoves(selectedPiece);
    mustAttack = potentialMoves.some(move => move.isAttack);

    if (mustAttack) {
        potentialMoves = potentialMoves.filter(move => move.isAttack);
    }
    
    potentialMoves.forEach(move => {
        move.square.element.style.backgroundColor = "lightgreen";
        if (move.isAttack) {
            move.jumpedSquare.element.style.boxShadow = "0 0 15px orange";
        }
    });
}

function getAvailableMoves(piece) {
    const moves = [];
    const directions = [];
    
    if (piece.color === 'white' || piece.king) {
        directions.push({ y: -1, x: -1 }, { y: -1, x: 1 }); // Up-left, Up-right
    }
    if (piece.color === 'black' || piece.king) {
        directions.push({ y: 1, x: -1 }, { y: 1, x: 1 }); // Down-left, Down-right
    }

    for (const dir of directions) {
        const oneStep = getSquare(piece.top + dir.y * moveLength, piece.left + dir.x * moveLength);
        if (oneStep && !oneStep.occupier) {
            moves.push({ square: oneStep, isAttack: false });
        } else if (oneStep && oneStep.occupier && oneStep.occupier !== piece.color) {
            const twoSteps = getSquare(piece.top + 2 * dir.y * moveLength, piece.left + 2 * dir.x * moveLength);
            if (twoSteps && !twoSteps.occupier) {
                moves.push({ square: twoSteps, isAttack: true, jumpedSquare: oneStep });
            }
        }
    }
    return moves;
}

function movePiece(squareElement) {
    if (squareElement.style.backgroundColor !== "lightgreen" || !selectedPiece) return;
    
    const fromSquare = getSquare(selectedPiece.top, selectedPiece.left);
    const toSquare = getSquareByElement(squareElement);
    
    const moveDistance = Math.abs(toSquare.row - fromSquare.row);
    let wasAttack = false;

    if (moveDistance === 2) {
        const jumpedX = selectedPiece.left + (toSquare.left - selectedPiece.left) / 2;
        const jumpedY = selectedPiece.top + (toSquare.top - selectedPiece.top) / 2;
        const jumpedSquare = getSquare(jumpedY, jumpedX);
        const jumpedPieceColor = jumpedSquare.occupier;
        const jumpedCheckers = jumpedPieceColor === 'white' ? w_checker : b_checker;
        
        for (let i = 1; i < jumpedCheckers.length; i++) {
            if (jumpedCheckers[i] && jumpedCheckers[i].top === jumpedY && jumpedCheckers[i].left === jumpedX) {
                jumpedCheckers[i].element.remove();
                jumpedCheckers[i].alive = false;
                break;
            }
        }
        jumpedSquare.occupier = null;
        wasAttack = true;
    }

    playSound(moveSound);
    
    fromSquare.occupier = null;
    toSquare.occupier = selectedPiece.color;
    selectedPiece.top = toSquare.top;
    selectedPiece.left = toSquare.left;
    selectedPiece.element.style.top = toSquare.top + moveDeviation + "px";
    selectedPiece.element.style.left = toSquare.left + moveDeviation + "px";

    // Kinging
    if ((selectedPiece.color === "white" && toSquare.row === 1) || (selectedPiece.color === "black" && toSquare.row === 8)) {
        if (!selectedPiece.king) {
            selectedPiece.king = true;
            selectedPiece.element.style.border = "4px solid gold";
        }
    }
    
    erase_roads();

    let canAttackAgain = wasAttack && getAvailableMoves(selectedPiece).some(move => move.isAttack);

    if (!canAttackAgain) {
        changeTurns();
    } else {
        // Force another attack
        selectPiece(selectedPiece.element);
    }
    
    checkGameEnd();
}

function changeTurns() {
    whoseTurn = (whoseTurn === "white") ? "black" : "white";
    the_checker = (whoseTurn === "white") ? w_checker : b_checker;
}

function checkGameEnd() {
    let whitePieces = w_checker.filter(p => p && p.alive).length;
    let blackPieces = b_checker.filter(p => p && p.alive).length;

    if (whitePieces === 0) {
        declareWinner("Preto");
    } else if (blackPieces === 0) {
        declareWinner("Branco");
    } else {
        // Check for no available moves
        const currentPlayerCheckers = whoseTurn === 'white' ? w_checker : b_checker;
        let hasMoves = false;
        for(let i = 1; i < currentPlayerCheckers.length; i++) {
            if(currentPlayerCheckers[i] && currentPlayerCheckers[i].alive) {
                if(getAvailableMoves(currentPlayerCheckers[i]).length > 0) {
                    hasMoves = true;
                    break;
                }
            }
        }
        if(!hasMoves) {
            declareWinner(whoseTurn === 'white' ? 'Preto' : 'Branco');
        }
    }
}


function getSquare(top, left) {
    if (top < 0 || left < 0 || top > moveLength * 7 || left > moveLength * 7) return false;
    let row = top / moveLength + 1;
    let col = left / moveLength + 1;
    return block[row][col];
}

function getSquareByElement(element) {
    for (let i = 1; i <= 8; i++) {
        for (let j = 1; j <= 8; j++) {
            if (block[i][j].element === element) {
                return block[i][j];
            }
        }
    }
    return null;
}

function erase_roads() {
    for (let i = 1; i <= 8; i++) {
        for (let j = 1; j <= 8; j++) {
            if (block[i][j].color === 'black') {
                block[i][j].element.style.backgroundColor = "#BA7A3A";
                block[i][j].element.style.boxShadow = "";
            }
        }
    }
}

function declareWinner(winner) {
    if (gameOver) return;
    gameOver = 1;
    playSound(winSound);
    score.style.display = "block";
    score.innerHTML = `${winner} Ganhou!`;

    setTimeout(() => window.location.reload(), 5000);
}

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}

// --- INITIALIZE GAME ---
window.onload = () => {
    getDimension();
    initializeTable();
    drawCheckers();
};

window.onresize = () => {
    window.location.reload();
}