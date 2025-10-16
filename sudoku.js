document.addEventListener('DOMContentLoaded', function () {
    const boardSize = 9;
    const sudokuBoard = document.getElementById('sudoku');
    let board = [];

    // --- Elementos do DOM ---
    const btnEasy = document.querySelector('.js-generate-board-btn--easy');
    const btnMedium = document.querySelector('.js-generate-board-btn--medium');
    const btnHard = document.querySelector('.js-generate-board-btn--hard');
    const btnVeryHard = document.querySelector('.js-generate-board-btn--very-hard');
    const btnSolve = document.querySelector('.js-solve-all-btn');
    const btnClear = document.querySelector('.js-clear-board-btn');

    // --- Funções Principais ---

    /**
     * Inicializa e desenha um tabuleiro vazio.
     */
    function createBoard() {
        sudokuBoard.innerHTML = '';
        for (let i = 0; i < boardSize * boardSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('sudoku-board-cell');

            const input = document.createElement('input');
            input.setAttribute('type', 'number');
            input.setAttribute('min', '1');
            input.setAttribute('max', '9');
            input.addEventListener('input', handleInput);
            
            cell.appendChild(input);
            sudokuBoard.appendChild(cell);
        }
    }

    /**
     * Gera um novo puzzle e atualiza a interface.
     * @param {number} difficulty - O número de células a remover (quanto maior, mais difícil).
     */
    function generatePuzzle(difficulty) {
        // 1. Cria uma matriz 9x9 vazia
        board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(0));

        // 2. Preenche a matriz com uma solução válida
        solveSudoku();

        // 3. Remove números para criar o puzzle
        let removed = 0;
        while (removed < difficulty) {
            let row = Math.floor(Math.random() * boardSize);
            let col = Math.floor(Math.random() * boardSize);
            if (board[row][col] !== 0) {
                board[row][col] = 0;
                removed++;
            }
        }

        // 4. Renderiza o tabuleiro no HTML
        renderBoard();
    }
    
    /**
     * Renderiza a matriz 'board' no HTML.
     */
    function renderBoard() {
        const cells = sudokuBoard.querySelectorAll('.sudoku-board-cell input');
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const index = row * boardSize + col;
                const value = board[row][col];
                
                if (value !== 0) {
                    cells[index].value = value;
                    cells[index].disabled = true;
                    cells[index].parentElement.classList.add('sudoku-board-cell--generated');
                } else {
                    cells[index].value = '';
                    cells[index].disabled = false;
                    cells[index].parentElement.classList.remove('sudoku-board-cell--generated');
                }
            }
        }
    }

    /**
     * Limpa as entradas do utilizador do tabuleiro.
     */
    function clearUserInputs() {
        const cells = sudokuBoard.querySelectorAll('.sudoku-board-cell input');
        cells.forEach(input => {
            if (!input.disabled) {
                input.value = '';
            }
        });
    }

    // --- Lógica de Resolução (Backtracking) ---

    /**
     * Função principal que inicia a resolução do Sudoku.
     * @returns {boolean} - True se encontrou solução, false caso contrário.
     */
    function solveSudoku() {
        let emptySpot = findEmpty(board);
        if (!emptySpot) {
            return true; // Resolvido
        }

        let [row, col] = emptySpot;
        let nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let i = 0; i < nums.length; i++) {
            let num = nums[i];
            if (isValid(board, num, { row, col })) {
                board[row][col] = num;

                if (solveSudoku()) {
                    return true;
                }

                board[row][col] = 0; // Backtrack
            }
        }
        return false; // Não encontrou solução
    }

    /**
     * Encontra a próxima célula vazia (valor 0).
     * @param {Array<Array<number>>} b - A matriz do tabuleiro.
     * @returns {Array<number>|null} - As coordenadas [row, col] ou null se não houver vazios.
     */
    function findEmpty(b) {
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (b[r][c] === 0) {
                    return [r, c];
                }
            }
        }
        return null;
    }

    /**
     * Verifica se um número é válido numa determinada posição.
     * @param {Array<Array<number>>} b - A matriz do tabuleiro.
     * @param {number} num - O número a verificar.
     * @param {{row: number, col: number}} pos - A posição {row, col}.
     * @returns {boolean} - True se for válido, false caso contrário.
     */
    function isValid(b, num, pos) {
        // Verificar linha
        for (let i = 0; i < boardSize; i++) {
            if (b[pos.row][i] === num && pos.col !== i) {
                return false;
            }
        }
        // Verificar coluna
        for (let i = 0; i < boardSize; i++) {
            if (b[i][pos.col] === num && pos.row !== i) {
                return false;
            }
        }
        // Verificar grelha 3x3
        const boxX = Math.floor(pos.col / 3);
        const boxY = Math.floor(pos.row / 3);
        for (let i = boxY * 3; i < boxY * 3 + 3; i++) {
            for (let j = boxX * 3; j < boxX * 3 + 3; j++) {
                if (b[i][j] === num && (i !== pos.row || j !== pos.col)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Baralha um array.
     * @param {Array} array - O array a ser baralhado.
     * @returns {Array} - O array baralhado.
     */
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // --- Manipuladores de Eventos ---

    /**
     * Garante que apenas um dígito (1-9) é inserido na célula.
     * @param {Event} e - O evento de input.
     */
    function handleInput(e) {
        let value = e.target.value;
        if (value.length > 1) {
            e.target.value = value.slice(0, 1);
        }
        if (parseInt(value) < 1 || parseInt(value) > 9) {
            e.target.value = '';
        }
    }
    
    btnEasy.addEventListener('click', () => generatePuzzle(35));
    btnMedium.addEventListener('click', () => generatePuzzle(45));
    btnHard.addEventListener('click', () => generatePuzzle(55));
    btnVeryHard.addEventListener('click', () => generatePuzzle(60));
    
    btnClear.addEventListener('click', clearUserInputs);

    btnSolve.addEventListener('click', () => {
        // Atualiza a matriz 'board' com as entradas do utilizador antes de resolver
        const cells = sudokuBoard.querySelectorAll('.sudoku-board-cell input');
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const index = row * boardSize + col;
                const value = parseInt(cells[index].value);
                if (!cells[index].disabled) {
                    board[row][col] = isNaN(value) ? 0 : value;
                }
            }
        }

        // Tenta resolver a partir do estado atual
        if (solveSudoku()) {
            renderBoard();
        } else {
            alert("Não foi encontrada uma solução a partir dos números inseridos.");
        }
    });

    // --- Inicialização ---
    createBoard();
    generatePuzzle(45); // Gera um puzzle médio por defeito
});