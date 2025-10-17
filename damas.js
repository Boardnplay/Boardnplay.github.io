/* damas.js - clean reimplementation */
(function(){
  const boardEl = document.querySelector('.checker-board');
  const status = document.getElementById('statusText');
  const restartBtn = document.getElementById('restartBtn');
  const aiToggle = document.getElementById('aiToggle');
  let board = [];
  let turn = 'w';
  let selected = null;
  let aiEnabled = false;
  let mustContinue = null;

  function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

  function reset(){
    board = new Array(8).fill(null).map(()=>new Array(8).fill(null));
    for(let r=0;r<3;r++) for(let c=0;c<8;c++) if((r+c)%2===1) board[r][c] = {color:'b', king:false};
    for(let r=5;r<8;r++) for(let c=0;c<8;c++) if((r+c)%2===1) board[r][c] = {color:'w', king:false};
    turn='w'; selected=null; mustContinue=null; render(); setStatus('Vez: Brancas');
  }

  function setStatus(s){ if(status) status.textContent = s; }

  function render(){
    boardEl.innerHTML=''; for(let r=0;r<8;r++) for(let c=0;c<8;c++){
      const sq = document.createElement('div'); sq.className='square '+((r+c)%2===0?'white_square':'black_square'); sq.dataset.r=r; sq.dataset.c=c;
      if(board[r][c]){ const p = document.createElement('div'); p.className = 'checker '+(board[r][c].color==='w'?'white_checker':'black_checker'); if(board[r][c].king) p.textContent='K'; sq.appendChild(p); }
      sq.addEventListener('click', onClick); boardEl.appendChild(sq);
    }
  }

  function pieceMoves(r,c){
    const p = board[r][c]; if(!p) return {moves:[], captures:[]};
    const dir = p.color==='w' ? -1:1; const deltas = p.king? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[dir,1],[dir,-1]];
    const moves=[], captures=[];
    for(const [dr,dc] of deltas){
      const nr=r+dr, nc=c+dc; if(inBounds(nr,nc) && !board[nr][nc]) moves.push([nr,nc]);
      const mr=r+dr, mc=c+dc, jr=r+2*dr, jc=c+2*dc;
      if(inBounds(jr,jc) && board[mr][mc] && board[mr][mc].color!==p.color && !board[jr][jc]) captures.push([jr,jc,mr,mc]);
    }
    return {moves, captures};
  }

  function allMovesFor(color){
    const arr=[]; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===color){ const pm = pieceMoves(r,c); if(pm.captures.length) arr.push({from:[r,c], captures: pm.captures}); else if(pm.moves.length) arr.push({from:[r,c], moves:pm.moves}); } }
    const anyCap = arr.some(e=>e.captures && e.captures.length); if(anyCap) return arr.filter(e=>e.captures && e.captures.length); return arr;
  }

  function onClick(e){
    if(turn!=='w' && aiEnabled) return;
    const r=parseInt(this.dataset.r), c=parseInt(this.dataset.c); const p = board[r][c];
    if(mustContinue){
      const [sr,sc]=mustContinue;
      if(sr===r && sc===c){ selected=[r,c]; highlight(); return; }
      const pm = pieceMoves(sr,sc); const cap = pm.captures.find(cc=>cc[0]===r && cc[1]===c);
      if(cap){ doCapture([sr,sc],[r,c],[cap[2],cap[3]]); return; }
      return;
    }
    if(selected){
      const pm = pieceMoves(selected[0], selected[1]);
      const cap = pm.captures.find(cc=>cc[0]===r && cc[1]===c);
      if(cap){ doCapture(selected, [r,c],[cap[2],cap[3]]); return; }
      const mv = pm.moves.find(m=>m[0]===r && m[1]===c);
      if(mv){ movePiece(selected, [r,c]); selected=null; return; }
      if(p && p.color===turn){ selected=[r,c]; highlight(); } else { selected=null; render(); }
    } else {
      if(p && p.color===turn){ selected=[r,c]; highlight(); }
    }
  }

  function highlight(){ const squares = boardEl.querySelectorAll('.square'); squares.forEach(s=>s.style.outline=''); if(selected){ const idx = selected[0]*8+selected[1]; squares[idx].style.outline='3px solid gold'; } }

  function movePiece(from,to){
    const [fr,fc]=from, [tr,tc]=to; const p = board[fr][fc]; board[tr][tc]=p; board[fr][fc]=null; if(p.color==='w' && tr===0) p.king=true; if(p.color==='b' && tr===7) p.king=true; render(); endTurn();
  }

  function doCapture(from,to,capPos){
    const [fr,fc]=from, [tr,tc]=to, [cr,cc]=capPos; const p = board[fr][fc];
    board[tr][tc]=p; board[fr][fc]=null; board[cr][cc]=null; if(p.color==='w' && tr===0) p.king=true; if(p.color==='b' && tr===7) p.king=true; render();
    const pm = pieceMoves(tr,tc);
    if(pm.captures.length){ mustContinue=[tr,tc]; selected=[tr,tc]; setStatus('Captura! Continua.'); highlight(); } else { mustContinue=null; selected=null; endTurn(); }
  }

  function endTurn(){ turn = (turn==='w'?'b':'w'); selected=null; mustContinue=null; render(); setStatus('Vez: '+(turn==='w'?'Brancas':'Pretas')); const moves = allMovesFor(turn); if(moves.length===0){ setStatus('Fim de jogo. '+(turn==='w'?'Pretas':'Brancas')+' vencem!'); return; } if(aiEnabled && turn==='b') setTimeout(runAI,200); }

  function runAI(){ const all = allMovesFor('b'); if(all.length===0) return endTurn(); const caps = all.filter(e=>e.captures && e.captures.length); if(caps.length){ const chosen = caps[Math.floor(Math.random()*caps.length)]; const cap = chosen.captures[Math.floor(Math.random()*chosen.captures.length)]; doCapture(chosen.from, [cap[0],cap[1]], [cap[2],cap[3]]); } else { const simples = all.filter(e=>e.moves && e.moves.length); const pick = simples[Math.floor(Math.random()*simples.length)]; const mv = pick.moves[Math.floor(Math.random()*pick.moves.length)]; movePiece(pick.from, mv); } }

  aiToggle.addEventListener('click', ()=>{ aiEnabled = !aiEnabled; aiToggle.textContent = 'IA: '+(aiEnabled?'ON':'OFF')+' (pretas)'; if(aiEnabled && turn==='b') setTimeout(runAI,200); });
  restartBtn.addEventListener('click', reset);
  reset();
  window._damas_refresh = { reset };
})();
