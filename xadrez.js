const boxes = document.querySelectorAll(".box");
const tog = document.getElementById("tog");
const undoBtn = document.getElementById("undoBtn");

let boardState = {};
let turn = "white";
let selectedBox = null;
let history = [];

function initializeGame() {
    boxes.forEach(box => {
        const pieceClass = Array.from(box.classList).find(cls => cls.startsWith('W') || cls.startsWith('B'));
        boardState[box.id] = pieceClass || null;
        box.addEventListener("click", handleMove);
    });

    tog.textContent = `Turno: Branco`;
    undoBtn.addEventListener("click", undoMove);
    saveHistory();
}

function handleMove(event) {
    const clickedBox = event.currentTarget;
    const pieceClass = boardState[clickedBox.id];
    const pieceColor = pieceClass ? (pieceClass.startsWith('W') ? 'white' : 'black') : null;

    if (selectedBox) {
        if (isValidMove(selectedBox.id, clickedBox.id)) {
            makeMove(selectedBox, clickedBox);
            changeTurn();
        } else {
            removeHighlights();
            selectedBox.classList.remove('selected');
            selectedBox = null;
            if (pieceClass && pieceColor === turn) {
                selectPiece(clickedBox);
            }
        }
    } else if (pieceClass && pieceColor === turn) {
        selectPiece(clickedBox);
    }
}

function selectPiece(box) {
    removeHighlights();
    box.classList.add('selected');
    selectedBox = box;
    highlightValidMoves(box.id, boardState[box.id]);
}

function makeMove(fromBox, toBox) {
    saveHistory();

    const piece = boardState[fromBox.id];
    const capturedPiece = boardState[toBox.id];

    if(capturedPiece && capturedPiece.endsWith('king')){
        alert(`${turn === 'white' ? 'Branco' : 'Preto'} ganhou por xeque-mate!`);
    }

    boardState[toBox.id] = piece;
    boardState[fromBox.id] = null;

    // Pawn Promotion
    const { row } = getCoordinates(toBox.id);
    if (piece.endsWith('pawn') && (row === 8 || row === 1)) {
        const newPiece = piece.startsWith('W') ? 'Wqueen' : 'Bqueen';
        boardState[toBox.id] = newPiece;
    }

    updateBoardUI();

    if (selectedBox) selectedBox.classList.remove('selected');
    selectedBox = null;
    removeHighlights();
}

function changeTurn() {
    turn = turn === 'white' ? 'black' : 'white';
    const turnName = turn === 'white' ? 'Branco' : 'Preto';
    tog.textContent = `Turno: ${turnName}`;
}

function getCoordinates(id) {
    return {
        row: parseInt(id.substring(1, 2)),
        col: parseInt(id.substring(3, 4))
    };
}

function getIdFromCoordinates(row, col) {
    if (row < 1 || row > 8 || col < 1 || col > 8) return null;
    return `b${row}0${col}`;
}

function isValidMove(fromId, toId) {
    const toBox = document.getElementById(toId);
    return toBox.classList.contains('highlight');
}

function highlightValidMoves(fromId, pieceClass) {
    const pieceType = pieceClass.substring(1).toLowerCase();
    const moves = [];

    switch (pieceType) {
        case 'pawn': getPawnMoves(fromId, pieceClass, moves); break;
        case 'rook': getLinearMoves(fromId, [[1, 0], [-1, 0], [0, 1], [0, -1]], moves); break;
        case 'knight': getKnightMoves(fromId, pieceClass, moves); break;
        case 'bishop': getLinearMoves(fromId, [[1, 1], [1, -1], [-1, 1], [-1, -1]], moves); break;
        case 'queen':
            getLinearMoves(fromId, [[1, 0], [-1, 0], [0, 1], [0, -1]], moves);
            getLinearMoves(fromId, [[1, 1], [1, -1], [-1, 1], [-1, -1]], moves);
            break;
        case 'king': getKingMoves(fromId, pieceClass, moves); break;
    }

    moves.forEach(id => {
        const box = document.getElementById(id);
        if (box) box.classList.add('highlight');
    });
}

function getPawnMoves(fromId, pieceClass, moves) {
    const from = getCoordinates(fromId);
    const pieceColor = pieceClass.startsWith('W') ? 'white' : 'black';
    const direction = pieceColor === 'white' ? 1 : -1;

    // Move 1 forward
    let nextRow = from.row + direction;
    let moveId = getIdFromCoordinates(nextRow, from.col);
    if (moveId && !boardState[moveId]) {
        moves.push(moveId);
        // Move 2 forward (first move)
        const startRow = pieceColor === 'white' ? 2 : 7;
        if (from.row === startRow) {
            nextRow = from.row + 2 * direction;
            moveId = getIdFromCoordinates(nextRow, from.col);
            if (moveId && !boardState[moveId]) {
                moves.push(moveId);
            }
        }
    }
    
    // Captures
    [-1, 1].forEach(colMod => {
        nextRow = from.row + direction;
        let nextCol = from.col + colMod;
        moveId = getIdFromCoordinates(nextRow, nextCol);
        if (moveId && boardState[moveId] && !boardState[moveId].startsWith(pieceClass[0])) {
            moves.push(moveId);
        }
    });
}

function getLinearMoves(fromId, directions, moves) {
    const from = getCoordinates(fromId);
    const pieceColor = boardState[fromId].startsWith('W') ? 'white' : 'black';

    directions.forEach(([dRow, dCol]) => {
        let currentRow = from.row + dRow;
        let currentCol = from.col + dCol;

        while (currentRow >= 1 && currentRow <= 8 && currentCol >= 1 && currentCol <= 8) {
            const currentId = getIdFromCoordinates(currentRow, currentCol);
            const targetPiece = boardState[currentId];

            if (targetPiece) {
                const targetColor = targetPiece.startsWith('W') ? 'white' : 'black';
                if (targetColor !== pieceColor) {
                    moves.push(currentId);
                }
                break;
            } else {
                moves.push(currentId);
            }
            currentRow += dRow;
            currentCol += dCol;
        }
    });
}

function getKnightMoves(fromId, pieceClass, moves) {
    const from = getCoordinates(fromId);
    const pieceColor = pieceClass.startsWith('W') ? 'white' : 'black';
    const knightMoves = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];

    knightMoves.forEach(([dRow, dCol]) => {
        const newRow = from.row + dRow;
        const newCol = from.col + dCol;
        const moveId = getIdFromCoordinates(newRow, newCol);
        if (moveId) {
            const targetPiece = boardState[moveId];
            if (!targetPiece || !targetPiece.startsWith(pieceClass[0])) {
                moves.push(moveId);
            }
        }
    });
}

function getKingMoves(fromId, pieceClass, moves) {
    const from = getCoordinates(fromId);
    const kingMoves = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    
    kingMoves.forEach(([dRow, dCol]) => {
        const newRow = from.row + dRow;
        const newCol = from.col + dCol;
        const moveId = getIdFromCoordinates(newRow, newCol);
        if (moveId) {
            const targetPiece = boardState[moveId];
            if (!targetPiece || !targetPiece.startsWith(pieceClass[0])) {
                moves.push(moveId);
            }
        }
    });
}

function removeHighlights() {
    boxes.forEach(box => {
        box.classList.remove('highlight');
    });
}

function saveHistory() {
    history.push({
        board: { ...boardState },
        turn: turn
    });
}

function undoMove() {
    if (history.length <= 1) {
        alert("Não é possível desfazer mais jogadas.");
        return;
    }

    history.pop();
    const previousState = history[history.length - 1];
    
    boardState = { ...previousState.board };
    turn = previousState.turn;
    
    updateBoardUI();
    
    if (selectedBox) {
        selectedBox.classList.remove('selected');
        selectedBox = null;
    }
    removeHighlights();
    tog.textContent = `Turno: ${turn === 'white' ? 'Branco' : 'Preto'}`;
}

function updateBoardUI() {
    boxes.forEach(box => {
        const piece = boardState[box.id];
        box.className = 'box' + (piece ? ` ${piece}` : '');
    });
}

document.addEventListener('DOMContentLoaded', initializeGame);