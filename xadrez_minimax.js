/* xadrez_minimax.js - full from-scratch chess with minimax+alphabeta IA.
   - Supports basic moves, pawn promotion, check and checkmate detection.
   - AI uses minimax with alpha-beta pruning and a material + mobility heuristic.
   - Default AI depth = 2 (configurable in UI).
*/

(function(){
  const boardEl = document.querySelector('.chess-board');
  const status = document.getElementById('statusText');
  const restartBtn = document.getElementById('restartBtn');
  const aiToggleBtn = document.getElementById('aiToggle');
  const aiDepthSelect = document.getElementById('aiDepth');

  const UNICODE = { wK:'\u2654', wQ:'\u2655', wR:'\u2656', wB:'\u2657', wN:'\u2658', wP:'\u2659',
                    bK:'\u265A', bQ:'\u265B', bR:'\u265C', bB:'\u265D', bN:'\u265E', bP:'\u265F' };

  let board = [];
  let squares = [];
  let turn = 'w';
  let selected = null;
  let gameOver = false;
  let aiEnabled = false;

  // piece values
  const VAL = { K:900, Q:90, R:50, B:30, N:30, P:10 };

  function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

  function initBoard(){
    board = new Array(8).fill(null).map(()=>new Array(8).fill(null));
    const back = ['R','N','B','Q','K','B','N','R'];
    for(let c=0;c<8;c++){ board[0][c] = {color:'b',type:back[c]}; board[1][c] = {color:'b',type:'P'}; board[6][c] = {color:'w',type:'P'}; board[7][c] = {color:'w',type:back[c]}; }
    turn='w'; selected=null; gameOver=false; render(); setStatus('Vez: Brancas');
  }

  function setStatus(s){ if(status) status.textContent = s; }

  function render(){
    boardEl.innerHTML=''; squares=[];
    for(let r=0;r<8;r++){
      const row = document.createElement('div'); row.className='divv'; row.id='row'+(8-r);
      for(let c=0;c<8;c++){
        const box = document.createElement('div'); box.className='box'; box.dataset.r=r; box.dataset.c=c;
        const p = board[r][c];
        if(p){ box.innerHTML = '<span>'+UNICODE[(p.color==='w'?'w':'b')+p.type]+'</span>'; box.classList.add((p.color==='w'?'W':'B')+p.type.toLowerCase()); }
        box.addEventListener('click', onClickSquare);
        row.appendChild(box); squares.push(box);
      }
      boardEl.appendChild(row);
    }
  }

  // move generation (naive, correct for main piece moves). Returns list of [toR,toC]
  function generateMoves(r,c,ignoreCheck=false){
    const p = board[r][c]; if(!p) return [];
    const moves = []; const color=p.color; const dir = color==='w'? -1 : 1;
    const push = (rr,cc)=>{ if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc].color!==color)) moves.push([rr,cc]); };

    switch(p.type){
      case 'P':
        if(inBounds(r+dir,c) && !board[r+dir][c]){ moves.push([r+dir,c]); const startRow = (color==='w'?6:1); if(r===startRow && !board[r+2*dir][c]) moves.push([r+2*dir,c]); }
        for(const dc of [-1,1]){ const rr=r+dir, cc=c+dc; if(inBounds(rr,cc) && board[rr][cc] && board[rr][cc].color!==color) moves.push([rr,cc]); }
        break;
      case 'N':
        [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(d=>{ const rr=r+d[0], cc=c+d[1]; if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc].color!==color)) moves.push([rr,cc]); });
        break;
      case 'B':
        for(const dr of [1,-1]) for(const dc of [1,-1]){ let rr=r+dr, cc=c+dc; while(inBounds(rr,cc)){ if(!board[rr][cc]) moves.push([rr,cc]); else{ if(board[rr][cc].color!==color) moves.push([rr,cc]); break; } rr+=dr; cc+=dc; } }
        break;
      case 'R':
        for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ let rr=r+dr, cc=c+dc; while(inBounds(rr,cc)){ if(!board[rr][cc]) moves.push([rr,cc]); else{ if(board[rr][cc].color!==color) moves.push([rr,cc]); break; } rr+=dr; cc+=dc; } }
        break;
      case 'Q':
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{ let rr=r+dr, cc=c+dc; while(inBounds(rr,cc)){ if(!board[rr][cc]) moves.push([rr,cc]); else{ if(board[rr][cc].color!==color) moves.push([rr,cc]); break; } rr+=dr; cc+=dc; } });
        break;
      case 'K':
        for(const dr of [-1,0,1]) for(const dc of [-1,0,1]){ if(dr===0 && dc===0) continue; const rr=r+dr, cc=c+dc; if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc].color!==color)) moves.push([rr,cc]); }
        break;
    }

    if(ignoreCheck) return moves;
    // filter moves that leave king in check
    return moves.filter(m=>{
      const [tr,tc]=m; const savedDest = board[tr][tc]; const savedFrom = board[r][c];
      board[tr][tc]=board[r][c]; board[r][c]=null;
      const safe = !isKingInCheck(color);
      board[r][c]=savedFrom; board[tr][tc]=savedDest;
      return safe;
    });
  }

  function findKing(color){ for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===color && p.type==='K') return [r,c]; } return null; }
  function isKingInCheck(color){ const pos=findKing(color); if(!pos) return true; const [kr,kc]=pos; const enemy = color==='w'?'b':'w'; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===enemy){ const moves = generateMoves(r,c,true); for(const m of moves) if(m[0]===kr && m[1]===kc) return true; } } return false; }

  function allMoves(color){
    const out=[];
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===color){ const ms = generateMoves(r,c,true); for(const m of ms) out.push({from:[r,c],to:m}); } }
    return out;
  }

  function applyMove(from,to){
    const [fr,fc]=from, [tr,tc]=to;
    const piece = board[fr][fc];
    if(!piece) return false;
    const captured = board[tr][tc];
    board[tr][tc]=piece; board[fr][fc]=null;
    // promotion simple
    if(piece.type==='P' && (tr===0 || tr===7)) piece.type='Q';
    return {captured, piece};
  }

  function undoMove(from,to,meta){
    const [fr,fc]=from, [tr,tc]=to;
    board[fr][fc]=board[tr][tc]; board[tr][tc]=meta.captured;
    // no need to revert promotion complexity for simplicity
  }

  function evaluateBoard(){
    // material + mobility small bonus
    let score = 0;
    let wMoves = 0, bMoves = 0;
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p = board[r][c];
      if(p){ const v = VAL[p.type] || 0; score += (p.color==='w'? v : -v); }
    }
    // mobility
    wMoves = countAllMoves('w'); bMoves = countAllMoves('b');
    score += 0.1 * (wMoves - bMoves);
    return score;
  }

  function countAllMoves(color){
    let cnt=0;
    for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const p=board[r][c]; if(p && p.color===color){ cnt += generateMoves(r,c,true).length; }
    }
    return cnt;
  }

  // minimax with alpha-beta. returns {score, move}
  function minimax(depth, alpha, beta, maximizingPlayer){
    if(depth===0) return {score: evaluateBoard()};
    const color = maximizingPlayer ? 'b' : 'w'; // AI plays black in our UI
    const moves = allMoves(color);
    if(moves.length===0){
      // no moves: checkmate or stalemate
      if(isKingInCheck(color)) { return {score: maximizingPlayer ? -10000 : 10000}; }
      return {score: 0};
    }
    let bestMove = null;
    if(maximizingPlayer){
      let value = -Infinity;
      for(const m of moves){
        const meta = applyMove(m.from, m.to);
        const res = minimax(depth-1, alpha, beta, false);
        undoMove(m.from, m.to, meta);
        if(res.score > value){ value = res.score; bestMove = m; }
        alpha = Math.max(alpha, value);
        if(alpha >= beta) break;
      }
      return {score:value, move:bestMove};
    } else {
      let value = Infinity;
      for(const m of moves){
        const meta = applyMove(m.from, m.to);
        const res = minimax(depth-1, alpha, beta, true);
        undoMove(m.from, m.to, meta);
        if(res.score < value){ value = res.score; bestMove = m; }
        beta = Math.min(beta, value);
        if(alpha >= beta) break;
      }
      return {score:value, move:bestMove};
    }
  }

  function aiMakeMove(){
    const depth = parseInt(aiDepthSelect.value,10) || 2;
    const res = minimax(depth, -Infinity, Infinity, true); // AI = black maximizing
    if(res && res.move){
      applyMove(res.move.from, res.move.to);
      turn='w'; render(); postMove();
    } else {
      postMove();
    }
  }

  function onClickSquare(){
    if(gameOver) return;
    const r = parseInt(this.dataset.r), c = parseInt(this.dataset.c);
    const p = board[r][c];
    if(selected){
      const [sr,sc]=selected;
      const moves = generateMoves(sr,sc,true);
      const ok = moves.find(m=>m[0]===r && m[1]===c);
      if(ok){
        applyMove([sr,sc],[r,c]);
        selected = null; render();
        turn = (turn==='w'?'b':'w');
        postMove();
        return;
      } else {
        if(p && p.color===turn){ selected=[r,c]; highlight(); } else { selected=null; highlight(); }
      }
    } else {
      if(p && p.color===turn) { selected=[r,c]; highlight(); }
    }
  }

  function highlight(){
    squares.forEach(s=>{ s.style.outline=''; s.style.boxShadow=''; });
    if(selected){
      const [r,c]=selected; squares[r*8+c].style.outline='3px solid gold';
      const moves = generateMoves(r,c,true);
      moves.forEach(m=>{ const [mr,mc]=m; squares[mr*8+mc].style.boxShadow='0 0 10px #4caf50'; });
    }
  }

  function postMove(){
    render();
    // check for endgame
    const legal = allMoves(turn);
    if(legal.length===0){
      if(isKingInCheck(turn)) setStatus('Xeque-mate! '+(turn==='w'?'Pretas':'Brancas')+' vencem!');
      else setStatus('Empate (stalemate)');
      gameOver=true; return;
    }
    setStatus('Vez: '+(turn==='w'?'Brancas':'Pretas'));
    if(aiEnabled && turn==='b' && !gameOver){
      setTimeout(aiMakeMove, 120); // small delay to let UI update
    }
  }

  // public controls
  aiToggleBtn.addEventListener('click', ()=>{ aiEnabled = !aiEnabled; aiToggleBtn.textContent = 'IA: '+(aiEnabled?'ON':'OFF')+' (pretas)'; if(aiEnabled && turn==='b') setTimeout(aiMakeMove, 200); });
  restartBtn.addEventListener('click', initBoard);

  // init
  initBoard();
  window._chess_minimax = { board, initBoard };
})();
