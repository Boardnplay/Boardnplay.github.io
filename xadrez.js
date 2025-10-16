document.addEventListener('DOMContentLoaded', () => {
    const boxes = document.querySelectorAll(".box");
    const tog = document.getElementById("tog");
    const undoBtn = document.getElementById("undoBtn");
    const gameArea = document.querySelector(".game-area");

    let boardState = {};
    let turn = "white";
    let selectedBox = null;
    let history = [];
    let isGameOver = false;

    // Estado para regras especiais
    let castlingRights = { w: { k: true, q: true }, b: { k: true, q: true } };
    let enPassantTarget = null; // Ex: 'b304'

    function initializeGame() {
        boxes.forEach(box => {
            const pieceClass = Array.from(box.classList).find(cls => cls.startsWith('W') || cls.startsWith('B'));
            boardState[box.id] = pieceClass || null;
            box.addEventListener("click", handleBoxClick);
        });
        undoBtn.addEventListener("click", undoMove);
        saveHistory();
        updateTurnIndicator();
    }

    function handleBoxClick(event) {
        if (isGameOver) return;
        const clickedBox = event.currentTarget;
        const piece = boardState[clickedBox.id];
        const pieceColor = piece ? (piece.startsWith('W') ? 'white' : 'black') : null;

        if (selectedBox) {
            // Se o clique for num movimento válido, executa-o
            if (clickedBox.classList.contains('highlight')) {
                makeMove(selectedBox, clickedBox);
            } else { // Senão, deseleciona e talvez seleciona outra peça
                removeHighlightsAndSelection();
                if (pieceColor === turn) {
                    selectPiece(clickedBox);
                }
            }
        } else if (pieceColor === turn) {
            selectPiece(clickedBox);
        }
    }

    function selectPiece(box) {
        removeHighlightsAndSelection();
        selectedBox = box;
        selectedBox.classList.add('selected');
        const legalMoves = getLegalMovesForPiece(box.id);
        legalMoves.forEach(id => document.getElementById(id)?.classList.add('highlight'));
    }

    function makeMove(fromBox, toBox) {
        saveHistory();

        const fromId = fromBox.id;
        const toId = toBox.id;
        const piece = boardState[fromId];
        const capturedPiece = boardState[toId];
        const pieceColor = piece.startsWith('W') ? 'w' : 'b';
        const { row: toRow } = getCoordinates(toId);

        // --- Lógica de Movimentos Especiais ---

        // 1. En Passant
        if (piece.endsWith('pawn') && toId === enPassantTarget) {
            const capturedPawnRow = pieceColor === 'w' ? toRow - 1 : toRow + 1;
            const capturedPawnId = getIdFromCoordinates(capturedPawnRow, getCoordinates(toId).col);
            boardState[capturedPawnId] = null;
        }

        // 2. Promoção de Peão
        const promotionRank = pieceColor === 'w' ? 8 : 1;
        if (piece.endsWith('pawn') && toRow === promotionRank) {
            showPromotionDialog(toId);
            // O resto da lógica (trocar turno, etc.) continua em handlePromotionChoice
        }
        
        // 3. Roque (Castling)
        if (piece.endsWith('king') && Math.abs(getCoordinates(fromId).col - getCoordinates(toId).col) === 2) {
            const isKingSide = getCoordinates(toId).col === 7;
            const rookFromCol = isKingSide ? 8 : 1;
            const rookToCol = isKingSide ? 6 : 4;
            const rookId = getIdFromCoordinates(toRow, rookFromCol);
            const rookToId = getIdFromCoordinates(toRow, rookToCol);
            boardState[rookToId] = boardState[rookId];
            boardState[rookId] = null;
        }

        // Atualiza o estado do tabuleiro
        boardState[toId] = piece;
        boardState[fromId] = null;

        // --- Atualiza o estado para regras especiais ---

        // 1. Resetar alvo de en passant
        enPassantTarget = null;
        if (piece.endsWith('pawn') && Math.abs(getCoordinates(fromId).row - toRow) === 2) {
            enPassantTarget = getIdFromCoordinates(pieceColor === 'w' ? toRow - 1 : toRow + 1, getCoordinates(toId).col);
        }

        // 2. Atualizar direitos de roque
        if (piece.endsWith('king')) {
            castlingRights[pieceColor].k = false;
            castlingRights[pieceColor].q = false;
        }
        if (fromId === 'b101' || toId === 'b101') castlingRights.w.q = false;
        if (fromId === 'b108' || toId === 'b108') castlingRights.w.k = false;
        if (fromId === 'b801' || toId === 'b801') castlingRights.b.q = false;
        if (fromId === 'b808' || toId === 'b808') castlingRights.b.k = false;

        // Finaliza a jogada
        removeHighlightsAndSelection();
        updateBoardUI();

        // Se não for uma promoção, troca o turno e verifica o fim do jogo
        if (!(piece.endsWith('pawn') && toRow === promotionRank)) {
            changeTurn();
        }
    }

    function changeTurn() {
        turn = turn === 'white' ? 'black' : 'white';
        updateTurnIndicator();
        checkForGameOver();
    }
    
    // ===============================================
    // LÓGICA DE VALIDAÇÃO DE JOGADAS (XEQUE, XEQUE-MATE)
    // ===============================================

    function getLegalMovesForPiece(pieceId) {
        const piece = boardState[pieceId];
        const pseudoLegalMoves = getPseudoLegalMoves(pieceId, piece);
        const legalMoves = [];

        pseudoLegalMoves.forEach(moveId => {
            // Simula a jogada
            const tempState = { ...boardState };
            tempState[moveId] = tempState[pieceId];
            tempState[pieceId] = null;

            // Se o rei não estiver em xeque após a jogada, ela é legal
            if (!isKingInCheck(turn, tempState)) {
                legalMoves.push(moveId);
            }
        });
        return legalMoves;
    }

    function getAllLegalMovesForColor(color, board) {
        const allMoves = [];
        for (const id in board) {
            const piece = board[id];
            if (piece && (piece.startsWith('W') ? 'white' : 'black') === color) {
                const legalMoves = getLegalMovesForPiece(id);
                if (legalMoves.length > 0) {
                    allMoves.push(...legalMoves);
                }
            }
        }
        return allMoves;
    }

    function isKingInCheck(kingColor, board) {
        const kingId = Object.keys(board).find(id => board[id] === (kingColor === 'white' ? 'Wking' : 'Bking'));
        if (!kingId) return false;
        
        const opponentColor = kingColor === 'white' ? 'black' : 'white';
        for (const id in board) {
            const piece = board[id];
            if (piece && (piece.startsWith('W') ? 'white' : 'black') === opponentColor) {
                const moves = getPseudoLegalMoves(id, piece, true); // Get attack moves
                if (moves.includes(kingId)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function checkForGameOver() {
        const legalMoves = getAllLegalMovesForColor(turn, boardState);
        if (legalMoves.length === 0) {
            isGameOver = true;
            if (isKingInCheck(turn, boardState)) {
                const winner = turn === 'white' ? 'Preto' : 'Branco';
                showAlert(`${winner} ganhou por Xeque-Mate!`);
            } else {
                showAlert('Empate por Afogamento (Stalemate)!');
            }
        }
    }

    // ===============================================
    // GERAÇÃO DE MOVIMENTOS (PSEUDO-LEGAIS)
    // ===============================================

    function getPseudoLegalMoves(fromId, piece, forAttacksOnly = false) {
        if (!piece) return [];
        const type = piece.substring(1).toLowerCase();
        switch (type) {
            case 'pawn': return getPawnMoves(fromId, piece, forAttacksOnly);
            case 'rook': return getLinearMoves(fromId, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
            case 'knight': return getKnightMoves(fromId);
            case 'bishop': return getLinearMoves(fromId, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
            case 'queen': return [...getLinearMoves(fromId, [[1, 0], [-1, 0], [0, 1], [0, -1]]), ...getLinearMoves(fromId, [[1, 1], [1, -1], [-1, 1], [-1, -1]])];
            case 'king': return getKingMoves(fromId);
        }
        return [];
    }

    function getPawnMoves(fromId, piece, forAttacksOnly = false) {
        const moves = [];
        const { row, col } = getCoordinates(fromId);
        const color = piece.startsWith('W') ? 'white' : 'black';
        const dir = color === 'white' ? 1 : -1;

        // Movimento para a frente
        if (!forAttacksOnly) {
            const oneStepId = getIdFromCoordinates(row + dir, col);
            if (oneStepId && !boardState[oneStepId]) {
                moves.push(oneStepId);
                // Primeiro movimento duplo
                const startRow = color === 'white' ? 2 : 7;
                if (row === startRow) {
                    const twoStepsId = getIdFromCoordinates(row + 2 * dir, col);
                    if (twoStepsId && !boardState[twoStepsId]) {
                        moves.push(twoStepsId);
                    }
                }
            }
        }

        // Capturas
        [col - 1, col + 1].forEach(c => {
            const captureId = getIdFromCoordinates(row + dir, c);
            if (captureId) {
                // Captura normal
                const targetPiece = boardState[captureId];
                if (targetPiece && !targetPiece.startsWith(piece[0])) {
                    moves.push(captureId);
                }
                // Captura En Passant
                if (captureId === enPassantTarget) {
                    moves.push(captureId);
                }
            }
        });

        return moves;
    }
    
    function getLinearMoves(fromId, directions) {
        const moves = [];
        const { row, col } = getCoordinates(fromId);
        const piece = boardState[fromId];

        directions.forEach(([dRow, dCol]) => {
            for (let i = 1; i <= 8; i++) {
                const nextId = getIdFromCoordinates(row + i * dRow, col + i * dCol);
                if (!nextId) break;
                const targetPiece = boardState[nextId];
                if (targetPiece) {
                    if (!targetPiece.startsWith(piece[0])) moves.push(nextId);
                    break;
                }
                moves.push(nextId);
            }
        });
        return moves;
    }

    function getKnightMoves(fromId) {
        const moves = [];
        const { row, col } = getCoordinates(fromId);
        const piece = boardState[fromId];
        const knightOffsets = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];

        knightOffsets.forEach(([dRow, dCol]) => {
            const nextId = getIdFromCoordinates(row + dRow, col + dCol);
            if (nextId) {
                const targetPiece = boardState[nextId];
                if (!targetPiece || !targetPiece.startsWith(piece[0])) {
                    moves.push(nextId);
                }
            }
        });
        return moves;
    }
    
    function getKingMoves(fromId) {
        const moves = [];
        const { row, col } = getCoordinates(fromId);
        const piece = boardState[fromId];
        const color = piece.startsWith('W') ? 'white' : 'black';
        const c = piece.startsWith('W') ? 'w' : 'b';

        // Movimentos normais
        for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
                if (dRow === 0 && dCol === 0) continue;
                const nextId = getIdFromCoordinates(row + dRow, col + dCol);
                if (nextId) {
                    const targetPiece = boardState[nextId];
                    if (!targetPiece || !targetPiece.startsWith(piece[0])) {
                        moves.push(nextId);
                    }
                }
            }
        }
        
        // Roque (Castling)
        if (!isKingInCheck(color, boardState)) {
            // Lado do rei (Kingside)
            if (castlingRights[c].k && !boardState[getIdFromCoordinates(row, col + 1)] && !boardState[getIdFromCoordinates(row, col + 2)]) {
                if (!isSquareAttacked(getIdFromCoordinates(row, col + 1), color) && !isSquareAttacked(getIdFromCoordinates(row, col + 2), color)) {
                    moves.push(getIdFromCoordinates(row, col + 2));
                }
            }
            // Lado da rainha (Queenside)
            if (castlingRights[c].q && !boardState[getIdFromCoordinates(row, col - 1)] && !boardState[getIdFromCoordinates(row, col - 2)] && !boardState[getIdFromCoordinates(row, col - 3)]) {
                if (!isSquareAttacked(getIdFromCoordinates(row, col - 1), color) && !isSquareAttacked(getIdFromCoordinates(row, col - 2), color)) {
                    moves.push(getIdFromCoordinates(row, col - 2));
                }
            }
        }
        return moves;
    }

    function isSquareAttacked(squareId, attackedColor) {
        const opponentColor = attackedColor === 'white' ? 'black' : 'white';
        for (const id in boardState) {
            const piece = boardState[id];
            if (piece && (piece.startsWith('W') ? 'white' : 'black') === opponentColor) {
                const attackMoves = getPseudoLegalMoves(id, piece, true);
                if (attackMoves.includes(squareId)) return true;
            }
        }
        return false;
    }

    // ===============================================
    // PROMOÇÃO DE PEÃO
    // ===============================================

    function showPromotionDialog(pawnId) {
        const promotionDialog = document.createElement('div');
        promotionDialog.id = 'promotion-dialog';
        const colorPrefix = turn === 'white' ? 'W' : 'B';
        const pieces = ['queen', 'rook', 'bishop', 'knight'];
        
        promotionDialog.innerHTML = '<h3>Promover Peão para:</h3>';
        pieces.forEach(p => {
            const btn = document.createElement('button');
            btn.className = `box ${colorPrefix}${p}`;
            btn.dataset.piece = `${colorPrefix}${p}`;
            btn.addEventListener('click', () => handlePromotionChoice(pawnId, btn.dataset.piece));
            promotionDialog.appendChild(btn);
        });
        
        gameArea.appendChild(promotionDialog);
    }
    
    function handlePromotionChoice(pawnId, chosenPiece) {
        boardState[pawnId] = chosenPiece;
        document.getElementById('promotion-dialog')?.remove();
        updateBoardUI();
        changeTurn();
    }
    
    // ===============================================
    // FUNÇÕES AUXILIARES E DE UI
    // ===============================================
    
    function getCoordinates(id) {
        return { row: parseInt(id[1]), col: parseInt(id[3]) };
    }

    function getIdFromCoordinates(row, col) {
        if (row < 1 || row > 8 || col < 1 || col > 8) return null;
        return `b${row}0${col}`;
    }

    function updateBoardUI() {
        boxes.forEach(box => {
            const piece = boardState[box.id];
            box.className = 'box' + (piece ? ` ${piece}` : '');
        });
    }

    function removeHighlightsAndSelection() {
        boxes.forEach(box => {
            box.classList.remove('highlight', 'selected');
        });
        selectedBox = null;
    }

    function updateTurnIndicator() {
        const turnName = turn === 'white' ? 'Branco' : 'Preto';
        tog.textContent = `Turno: ${turnName}`;
        if (isKingInCheck(turn, boardState)) {
            tog.textContent += ' (Xeque!)';
        }
    }
    
    function showAlert(message) {
        const alertBox = document.createElement('div');
        alertBox.id = 'game-over-alert';
        alertBox.innerHTML = `<h2>Fim de Jogo</h2><p>${message}</p>`;
        gameArea.appendChild(alertBox);
    }
    
    // ===============================================
    // HISTÓRICO E DESFAZER JOGADA
    // ===============================================

    function saveHistory() {
        history.push({
            board: JSON.parse(JSON.stringify(boardState)),
            turn: turn,
            castling: JSON.parse(JSON.stringify(castlingRights)),
            enPassant: enPassantTarget,
            gameOver: isGameOver,
        });
    }

    function undoMove() {
        if (history.length <= 1) return;
        
        // Remove o estado atual e o anterior
        history.pop();
        const prevState = history[history.length - 1];
        
        boardState = prevState.board;
        turn = prevState.turn;
        castlingRights = prevState.castling;
        enPassantTarget = prevState.enPassant;
        isGameOver = prevState.gameOver;
        
        removeHighlightsAndSelection();
        updateBoardUI();
        updateTurnIndicator();
        document.getElementById('game-over-alert')?.remove();
        document.getElementById('promotion-dialog')?.remove();
    }
    
    initializeGame();
});