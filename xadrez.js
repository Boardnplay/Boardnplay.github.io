// --- VARIÁVEIS DE CONFIGURAÇÃO E DOM ---
const boxes = document.querySelectorAll(".box");
const tog = document.getElementById("tog");
const undoBtn = document.getElementById("undoBtn");

let boardState = {}; // Mapa para armazenar a peça em cada célula: { "b101": "Wrook", ... }
let turn = "white";
let selectedBox = null;
let history = []; // Para a funcionalidade Desfazer (Undo)

// --- CONSTANTES DA GRElHA ---
// No novo CSS, cada casa tem 60px.
// A lógica de xadrez deve ser baseada em coordenadas (r, c), mas mantemos a dimensão como referência se necessário.
const BOARD_SIZE = 8;
const CELL_SIZE = 60; // 60px (Desktop) - Se o seu código original usava esta variável para cálculo de pixels, ele deve ser 60.

// Mapeamento das classes das peças (simplificado)
const PIECES = {
    'Wking': 'king', 'Wqueen': 'queen', 'Wrook': 'rook', 'Wbishop': 'bishop', 'Wknight': 'knight', 'Wpawn': 'pawn',
    'Bking': 'king', 'Bqueen': 'queen', 'Brook': 'rook', 'Bbishop': 'bishop', 'Bknight': 'Bknight', 'Bpawn': 'pawn'
};

// --- INICIALIZAÇÃO ---
function initializeGame() {
    // 1. Configura o estado inicial do tabuleiro (a partir do HTML)
    boxes.forEach(box => {
        const pieceClass = Array.from(box.classList).find(cls => cls.startsWith('W') || cls.startsWith('B'));
        boardState[box.id] = pieceClass || null;
        box.addEventListener("click", handleMove);
    });

    // 2. Define o texto do turno
    tog.textContent = `Turno: Branco`;

    // 3. Adiciona o listener para Desfazer
    undoBtn.addEventListener("click", undoMove);

    // Salva o estado inicial
    saveHistory();
}

// --- FUNÇÃO PRINCIPAL DE MOVIMENTO ---
function handleMove(event) {
    const clickedBox = event.currentTarget;
    const pieceClass = boardState[clickedBox.id];
    const pieceColor = pieceClass ? (pieceClass.startsWith('W') ? 'white' : 'black') : null;

    // Remove destaques anteriores
    removeHighlights();

    if (selectedBox) {
        // Tentativa de mover
        const selectedPieceClass = boardState[selectedBox.id];
        const selectedPieceColor = selectedPieceClass.startsWith('W') ? 'white' : 'black';

        if (isValidMove(selectedBox.id, clickedBox.id, selectedPieceClass)) {
            // Se o movimento for válido (incluindo captura)
            makeMove(selectedBox, clickedBox);
            changeTurn();
        } else {
            // Se o movimento for inválido, deseleciona
            selectedBox.classList.remove('selected');
            selectedBox = null;
            // Se o utilizador clicou noutra peça da sua cor, seleciona-a
            if (pieceClass && pieceColor === turn) {
                selectPiece(clickedBox);
            }
        }
    } else if (pieceClass && pieceColor === turn) {
        // Primeira seleção de peça
        selectPiece(clickedBox);
    }
}

function selectPiece(box) {
    box.classList.add('selected');
    selectedBox = box;
    highlightValidMoves(box.id, boardState[box.id]);
}

function makeMove(fromBox, toBox) {
    saveHistory();

    const piece = boardState[fromBox.id];

    // 1. Mover peça no DOM
    toBox.className = `box ${piece}`; // Adiciona a peça ao novo quadrado
    toBox.textContent = piece;        // Mantém o texto da peça (se usar ícones, isto é apenas um fallback)
    
    fromBox.className = `box`;       // Limpa o quadrado original
    fromBox.textContent = '';

    // 2. Mover peça no BoardState
    boardState[toBox.id] = piece;
    boardState[fromBox.id] = null;

    // 3. Desselecionar e limpar
    fromBox.classList.remove('selected');
    selectedBox = null;

    // Lógica para coroação de Peão (simplificada)
    if (piece.endsWith('pawn')) {
        const row = parseInt(toBox.id.substring(1, 2));
        if (piece.startsWith('W') && row === 8) {
            toBox.className = 'box Wqueen';
            boardState[toBox.id] = 'Wqueen';
        } else if (piece.startsWith('B') && row === 1) {
            toBox.className = 'box Bqueen';
            boardState[toBox.id] = 'Bqueen';
        }
    }
}

function changeTurn() {
    turn = turn === 'white' ? 'black' : 'white';
    const turnName = turn === 'white' ? 'Branco' : 'Preto';
    tog.textContent = `Turno: ${turnName}`;
}

// --- VALIDAÇÃO E DESTAQUES ---

function getCoordinates(id) {
    // Converte o ID (ex: "b801") para { row: 8, col: 1 }
    return {
        row: parseInt(id.substring(1, 2)),
        col: parseInt(id.substring(3, 4))
    };
}

function getIdFromCoordinates(row, col) {
    // Converte { row: 8, col: 1 } para ID (ex: "b801")
    if (row < 1 || row > 8 || col < 1 || col > 8) return null;
    return `b${row}0${col}`;
}

function isValidMove(fromId, toId, pieceClass) {
    // **********************************************
    // ESTA É A PARTE MAIS COMPLEXA DO XADREZ!
    // Você precisa de adicionar a lógica de movimento para todas as peças (Peão, Torre, Cavalo, etc.) aqui.
    // O código abaixo é um PLACEHOLDER simples.
    // **********************************************

    const from = getCoordinates(fromId);
    const to = getCoordinates(toId);
    const targetPiece = boardState[toId];
    const targetColor = targetPiece ? (targetPiece.startsWith('W') ? 'white' : 'black') : null;
    const pieceColor = pieceClass.startsWith('W') ? 'white' : 'black';

    // 1. Não pode mover para uma casa com uma peça da mesma cor
    if (targetPiece && targetColor === pieceColor) {
        return false;
    }
    
    // 2. Verifica se a casa de destino foi destacada (melhor do que recalcular a validade)
    const toBox = document.getElementById(toId);
    if (toBox.classList.contains('highlight')) {
        return true;
    }

    return false; // Por omissão, não é válido a menos que tenha sido destacado.
}

function highlightValidMoves(fromId, pieceClass) {
    const from = getCoordinates(fromId);
    const pieceColor = pieceClass.startsWith('W') ? 'white' : 'black';
    const moves = [];

    // **********************************************
    // LÓGICA DE DESTAQUE SIMPLIFICADA (A SER EXPANDIDA)
    // **********************************************

    // Exemplo: Movimentos de Peão (simples, sem capturas diagonais)
    if (pieceClass.endsWith('pawn')) {
        const direction = pieceColor === 'white' ? 1 : -1;
        
        // Movimento de 1 casa
        let nextRow = from.row + direction;
        let moveId = getIdFromCoordinates(nextRow, from.col);
        if (moveId && !boardState[moveId]) {
            moves.push(moveId);
        }
        
        // Movimento de 2 casas na primeira jogada
        if ((pieceColor === 'white' && from.row === 2) || (pieceColor === 'black' && from.row === 7)) {
             nextRow = from.row + 2 * direction;
             moveId = getIdFromCoordinates(nextRow, from.col);
             let intermediateId = getIdFromCoordinates(from.row + direction, from.col);
             if (moveId && !boardState[moveId] && !boardState[intermediateId]) {
                moves.push(moveId);
            }
        }
        
        // Capturas (a implementar a lógica aqui)
        // ...
    } 
    // Outras peças (Torre, Bispo, etc.) - Adicionar aqui a lógica de movimento
    
    // Destaque as casas válidas
    moves.forEach(id => {
        const box = document.getElementById(id);
        if (box) {
            box.classList.add('highlight');
        }
    });
}

function removeHighlights() {
    boxes.forEach(box => {
        box.classList.remove('highlight');
    });
}

// --- HISTÓRICO E DESFAZER ---

function saveHistory() {
    // Limita o histórico para evitar consumo excessivo de memória (ex: últimas 10 jogadas)
    if (history.length > 9) {
        history.shift();
    }
    // Clona o estado do tabuleiro e o turno atual
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

    // Remove o estado atual (e o anterior, que será o novo 'atual')
    history.pop();
    const previousState = history[history.length - 1];
    
    // Aplica o estado anterior
    boardState = { ...previousState.board };
    turn = previousState.turn;
    
    // Atualiza o DOM
    updateBoardUI();
    
    // Limpa seleções
    if (selectedBox) {
        selectedBox.classList.remove('selected');
        selectedBox = null;
    }
    removeHighlights();
    tog.textContent = `Turno: ${turn === 'white' ? 'Branco' : 'Preto'}`;
}

function updateBoardUI() {
    // Redesenha o tabuleiro com base no boardState
    boxes.forEach(box => {
        const piece = boardState[box.id];
        box.className = 'box' + (piece ? ` ${piece}` : '');
        box.textContent = piece || '';
    });
}


// --- INICIA O JOGO AO CARREGAR A PÁGINA ---
document.addEventListener('DOMContentLoaded', initializeGame);