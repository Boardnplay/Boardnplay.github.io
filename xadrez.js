/* damas.js
   Implementação de damas (checkers) jogável + IA simples.
   Regras simplificadas:
   - Tabuleiro 8x8, peças só nas casas escuras.
   - Movimento diagonal simples para frente (capturas podem pular e várias capturas em sequência são permitidas).
   - Promoção a dama (king) ao chegar à última linha.
   - IA que prioriza capturas; caso contrário faz movimento aleatório.
*/

(function(){
  // Garante existência do board .checker-board
  const ensureBoard = () => {
    let board = document.querySelector('.checker-board');
    if (!board) {
      const main = document.querySelector('.main-content') || document.body;
      board = document.createElement('div');
      board.className = 'checker-board';
      main.appendChild(board);
    }
    board.innerHTML = '';
    return board;
  };

  const boardEl = ensureBoard();

  const status = document.getElementById('statusText') || (() => {
    const el = document.createElement('h2');
    el.id = 'statusText';
    const container = boardEl.parentElement || document.body;
    container.insertBefore(el, boardEl);
    return el;
  })();

  const ctrlContainer = document.createElement('div');
  ctrlContainer.style.textAlign = 'center';
  ctrlContainer.style.marginTop = '10px';

  const restartBtn = document.getElementById('restartBtn') || (() => {
    const b = document.createElement('button');
    b.id = 'restartBtn';
    b.textContent = 'Recomeçar Damas';
    ctrlContainer.appendChild(b);
    boardEl.parentElement.appendChild(ctrlContainer);
    return b;
  })();

  const aiToggle = document.createElement('button');
  aiToggle.textContent = 'IA: OFF (pretas)';
  aiToggle.style.marginLeft = '10px';
  ctrlContainer.appendChild(aiToggle);

  // estado
  let board = new Array(8).fill(null).map(()=>new Array(8).fill(null));
  let squares = [];
  let selected = null;
  let turn = 'w'; // w = brancas (top? escolhi brancas em baixo), b = pretas
  let aiEnabled = false;
  let mustContinueCapture = null; // se uma peça fez captura e deve continuar

  // peças: { color:'w'|'b', king: boolean }

  function resetBoard(){
    board = new Array(8).fill(null).map(()=>new Array(8).fill(null));
    // preencher peças (tradicional: 3 filas de cada lado)
    for(let r=0;r<3;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2 === 1) board[r][c] = {color:'b', king:false};
      }
    }
    for(let r=5;r<8;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2 ===1) board[r][c] = {color:'w', king:false};
      }
    }
    selected = null; turn = 'w'; mustContinueCapture = null; render(); setStatus('Vez: Brancas');
  }

  function setStatus(s){ status.textContent = s; }

  function render(){
    boardEl.innerHTML = '';
    squares = [];
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const sq = document.createElement('div');
        sq.className = 'square ' + ((r+c)%2===0 ? 'white_square' : 'black_square');
        sq.dataset.r = r; sq.dataset.c = c;
        if(board[r][c]){
          const piece = document.createElement('div');
          piece.className = 'checker ' + (board[r][c].color==='w' ? 'white_checker' : 'black_checker');
          if(board[r][c].king) piece.textContent = 'K';
          piece.style.top = (r*0) + 'px'; // absolute used in original css, keep simple
          sq.appendChild(piece);
        }
        sq.addEventListener('click', onSquareClick);
        boardEl.appendChild(sq);
        squares.push(sq);
      }
    }
  }

  function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

  // Gera movimentos simples e capturas para uma peça (retorna {moves:[], captures:[]})
  function pieceMoves(r,c){
    const p = board[r][c];
    if(!p) return {moves:[], captures:[]};
    const dir = (p.color==='w') ? -1 : 1;
    const moves = [], captures = [];
    const deltas = p.king ? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[dir,1],[dir,-1]];
    // simples
    for(const [dr,dc] of deltas){
      const nr=r+dr, nc=c+dc;
      if(inBounds(nr,nc) && !board[nr][nc]) moves.push([nr,nc]);
    }
    // capturas (single jump)
    for(const [dr,dc] of deltas){
      const mr = r+dr, mc = c+dc;
      const jr = r+2*dr, jc = c+2*dc;
      if(inBounds(jr,jc) && board[mr][mc] && board[mr][mc].color !== p.color && !board[jr][jc]){
        captures.push([jr,jc, mr, mc]); // destino e peça capturada pos
      }
    }
    return {moves, captures};
  }

  // find all possible moves for color, but if any captures exist, only returns capture moves (forced capture)
  function allMovesFor(color){
    const res = [];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p = board[r][c];
      if(p && p.color===color){
        const pm = pieceMoves(r,c);
        if(pm.captures.length) res.push({from:[r,c], captures: pm.captures});
        else if(pm.moves.length) res.push({from:[r,c], moves: pm.moves});
      }
    }
    // if any captures exist, keep only capture entries
    const anyCapture = res.some(e => e.captures && e.captures.length);
    if(anyCapture) return res.filter(e => e.captures && e.captures.length);
    return res;
  }

  function onSquareClick(e){
    if(turn !== 'w' && aiEnabled) return; // bloquear cliques enquanto IA espera (se quiseres)
    const r = parseInt(this.dataset.r), c = parseInt(this.dataset.c);
    const p = board[r][c];
    // Se estás em modo de continuar captura obrigatório
    if(mustContinueCapture){
      const [sr,sc] = mustContinueCapture;
      if(sr===r && sc===c){
        selected = [r,c];
        highlight();
      } else if(selected){
        // tentamos realizar captura adicional
        const pm = pieceMoves(selected[0], selected[1]);
        const cap = pm.captures.find(cc => cc[0]===r && cc[1]===c);
        if(cap){
          doCapture(selected, [r,c], [cap[2],cap[3]]);
        }
      }
      return;
    }

    if(selected){
      // se destino é captura possível
      const pm = pieceMoves(selected[0], selected[1]);
      const cap = pm.captures.find(cc => cc[0]===r && cc[1]===c);
      if(cap){
        doCapture(selected, [r,c], [cap[2],cap[3]]);
        return;
      }
      // movimentos simples
      const mv = pm.moves.find(m => m[0]===r && m[1]===c);
      if(mv){
        movePiece(selected, [r,c]);
        selected = null; highlight();
        return;
      }
      // selecionar outra peça sua
      if(p && p.color === turn){
        selected = [r,c]; highlight();
      } else {
        selected = null; highlight();
      }
    } else {
      if(p && p.color===turn){
        selected = [r,c]; highlight();
      }
    }
  }

  function highlight(){
    squares.forEach(s => s.style.outline = '');
    if(selected){
      const idx = selected[0]*8 + selected[1];
      squares[idx].style.outline = '3px solid gold';
    }
  }

  function movePiece(from, to){
    const [fr,fc]=from, [tr,tc]=to;
    const p = board[fr][fc];
    board[tr][tc] = p;
    board[fr][fc] = null;
    // promoção
    if(p.color==='w' && tr===0) p.king = true;
    if(p.color==='b' && tr===7) p.king = true;
    render();
    endTurn();
  }

  function doCapture(from,to,capturedPos){
    const [fr,fc]=from, [tr,tc]=to;
    const [cr,cc]=capturedPos;
    const p = board[fr][fc];
    board[tr][tc] = p;
    board[fr][fc] = null;
    board[cr][cc] = null;
    // promoção
    if(p.color==='w' && tr===0) p.king = true;
    if(p.color==='b' && tr===7) p.king = true;
    render();
    // verificar se a peça pode capturar de novo (multi jump)
    const pm = pieceMoves(tr,tc);
    if(pm.captures.length){
      mustContinueCapture = [tr,tc];
      selected = [tr,tc];
      setStatus(`${turn==='w' ? 'Brancas' : 'Pretas'} capturou! Continua com a mesma peça.`);
      highlight();
      // se AI for quem está a jogar e é a sua vez, AI deverá continuar (tratado em AI)
    } else {
      mustContinueCapture = null;
      selected = null;
      endTurn();
    }
  }

  function endTurn(){
    // alterna turnos
    turn = (turn==='w'?'b':'w');
    selected = null; mustContinueCapture = null;
    render();
    setStatus(`Vez: ${turn==='w'?'Brancas':'Pretas'}`);
    // verificar fim de jogo
    const moves = allMovesFor(turn);
    if(moves.length===0){
      setStatus(`Fim de jogo. ${turn==='w' ? 'Pretas' : 'Brancas'} vencem!`);
      return;
    }
    if(aiEnabled && turn==='b'){
      setTimeout(()=> runAI(), 300);
    }
  }

  // IA: prioriza capturas; se várias capturas escolhe aleatório; tenta sequências
  function runAI(){
    // encontra todos os movimentos (capturas obrigatórias incluídas)
    const all = allMovesFor('b');
    if(all.length===0) return endTurn();
    // se há entradas com captures, escolhe uma
    const caps = all.filter(e => e.captures && e.captures.length);
    let chosen;
    if(caps.length){
      chosen = caps[Math.floor(Math.random()*caps.length)];
      // escolhe dentre as capturas disponíveis desta peça
      const cap = chosen.captures[Math.floor(Math.random()*chosen.captures.length)];
      doCapture(chosen.from, [cap[0],cap[1]], [cap[2],cap[3]]);
    } else {
      // movimentos simples
      const simples = all.filter(e => e.moves && e.moves.length);
      const pick = simples[Math.floor(Math.random()*simples.length)];
      const mv = pick.moves[Math.floor(Math.random()*pick.moves.length)];
      movePiece(pick.from, mv);
    }
  }

  aiToggle.addEventListener('click', () => {
    aiEnabled = !aiEnabled;
    aiToggle.textContent = `IA: ${aiEnabled ? 'ON' : 'OFF'} (pretas)`;
    if(aiEnabled && turn==='b') setTimeout(()=> runAI(), 300);
  });

  restartBtn.addEventListener('click', resetBoard);

  // start
  resetBoard();

  // expose for debug
  window._damas = { board, pieceMoves, allMovesFor, resetBoard };

})();
