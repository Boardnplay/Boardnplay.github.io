/* xadrez.js - versão simples e funcional */
(function(){
  const boardEl = document.querySelector('.chess-board');
  const status = document.getElementById('statusText');
  const restartBtn = document.getElementById('restartBtn');
  const aiToggle = document.getElementById('aiToggle');
  let board = [];
  let squares = [];
  let turn = 'w';
  let selected = null;
  let aiEnabled = false;
  let gameOver = false;

  const PIECE = { wK:'\u2654', wQ:'\u2655', wR:'\u2656', wB:'\u2657', wN:'\u2658', wP:'\u2659',
                  bK:'\u265A', bQ:'\u265B', bR:'\u265C', bB:'\u265D', bN:'\u265E', bP:'\u265F' };

  function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

  function reset(){
    board = new Array(8).fill(null).map(()=>new Array(8).fill(null));
    const back = ['R','N','B','Q','K','B','N','R'];
    for(let c=0;c<8;c++){ board[0][c]={color:'b',type:back[c]}; board[1][c]={color:'b',type:'P'}; board[6][c]={color:'w',type:'P'}; board[7][c]={color:'w',type:back[c]}; }
    turn='w'; selected=null; gameOver=false; render(); setStatus('Vez: Brancas');
  }

  function setStatus(s){ if(status) status.textContent = s; }

  function render(){
    boardEl.innerHTML='';
    squares=[];
    for(let r=0;r<8;r++){
      const row = document.createElement('div'); row.className='divv'; row.id='row'+(8-r);
      for(let c=0;c<8;c++){
        const box = document.createElement('div'); box.className='box'; box.dataset.r=r; box.dataset.c=c;
        const p = board[r][c];
        if(p){ box.innerHTML = '<span>'+PIECE[(p.color==='w'?'w':'b')+p.type]+'</span>'; box.classList.add((p.color==='w'?'W':'B')+p.type.toLowerCase()); }
        box.addEventListener('click', onClick);
        row.appendChild(box); squares.push(box);
      }
      boardEl.appendChild(row);
    }
  }

  // generate moves (simple, without special rules)
  function generateMoves(r,c,checkFilter=true){
    const p = board[r][c]; if(!p) return [];
    const moves = []; const color = p.color; const dir = color==='w'? -1:1;
    const push = (rr,cc)=>{ if(inBounds(rr,cc) && (!board[rr][cc] || board[rr][cc].color!==color)) moves.push([rr,cc]); };
    switch(p.type){
      case 'P':
        if(inBounds(r+dir,c) && !board[r+dir][c]){ moves.push([r+dir,c]); const start=(color==='w'?6:1); if(r===start && !board[r+2*dir][c]) moves.push([r+2*dir,c]); }
        for(const dc of [-1,1]){ const rr=r+dir, cc=c+dc; if(inBounds(rr,cc) && board[rr][cc] && board[rr][cc].color!==color) moves.push([rr,cc]); }
        break;
      case 'N':
        [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(d=>{ const rr=r+d[0], cc=c+d[1]; if(inBounds(rr,cc) && (!board[rr][cc]||board[rr][cc].color!==color)) moves.push([rr,cc]);});
        break;
      case 'B':
        for(const dc of [1,-1]) for(const dr of [1,-1]){ let rr=r+dr, cc=c+dc; while(inBounds(rr,cc)){ if(!board[rr][cc]) moves.push([rr,cc]); else { if(board[rr][cc].color!==color) moves.push([rr,cc]); break;} rr+=dr; cc+=dc; } }
        break;
      case 'R':
        for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){ let rr=r+dr, cc=c+dc; while(inBounds(rr,cc)){ if(!board[rr][cc]) moves.push([rr,cc]); else { if(board[rr][cc].color!==color) moves.push([rr,cc]); break;} rr+=dr; cc+=dc; } }
        break;
      case 'Q':
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>{ let rr=r+dr, cc=c+dc; while(inBounds(rr,cc)){ if(!board[rr][cc]) moves.push([rr,cc]); else { if(board[rr][cc].color!==color) moves.push([rr,cc]); break;} rr+=dr; cc+=dc; }});
        break;
      case 'K':
        for(const dr of [-1,0,1]) for(const dc of [-1,0,1]){ if(dr===0&&dc===0) continue; const rr=r+dr, cc=c+dc; if(inBounds(rr,cc) && (!board[rr][cc]||board[rr][cc].color!==color)) moves.push([rr,cc]); }
        break;
    }
    // simple check filter: avoid leaving king capturable
    if(checkFilter){
      return moves.filter(m=>{ const [tr,tc]=m; const savedDest=board[tr][tc]; const savedFrom=board[r][c]; board[tr][tc]=board[r][c]; board[r][c]=null; const safe = !isKingInCheck(color); board[r][c]=savedFrom; board[tr][tc]=savedDest; return safe; });
    }
    return moves;
  }

  function findKing(color){ for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===color && p.type==='K') return [r,c]; } return null; }
  function isKingInCheck(color){ const pos=findKing(color); if(!pos) return true; const [kr,kc]=pos; const enemy=color==='w'?'b':'w'; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===enemy){ const moves = generateMoves(r,c,false); for(const m of moves) if(m[0]===kr && m[1]===kc) return true; } } return false; }

  function allLegalMoves(color){ const out=[]; for(let r=0;r<8;r++) for(let c=0;c<8;c++){ const p=board[r][c]; if(p && p.color===color){ const ms = generateMoves(r,c,true); for(const m of ms) out.push({from:[r,c],to:m}); } } return out; }

  function applyMove(from,to){ const [fr,fc]=from, [tr,tc]=to; const piece=board[fr][fc]; if(!piece) return false; board[tr][tc]=piece; board[fr][fc]=null; if(piece.type==='P' && (tr===0||tr===7)) piece.type='Q'; return true; }

  function onClick(e){
    if(gameOver) return;
    const r=parseInt(this.dataset.r), c=parseInt(this.dataset.c);
    const p = board[r][c];
    if(selected){
      const [sr,sc]=selected; const moves=generateMoves(sr,sc,true);
      const ok = moves.find(m=>m[0]===r && m[1]===c);
      if(ok){ applyMove([sr,sc],[r,c]); selected=null; render(); turn = (turn==='w'?'b':'w'); postMove(); return; }
      if(p && p.color===turn){ selected=[r,c]; highlight(); } else { selected=null; highlight(); }
    } else { if(p && p.color===turn){ selected=[r,c]; highlight(); } }
  }

  function highlight(){ squares.forEach(s=>{ s.style.outline=''; s.style.boxShadow=''; }); if(selected){ const [r,c]=selected; squares[r*8+c].style.outline='3px solid gold'; const moves=generateMoves(r,c,true); moves.forEach(m=>{ const [mr,mc]=m; squares[mr*8+mc].style.boxShadow='0 0 10px #4caf50'; }); } }

  function postMove(){ render(); const moves = allLegalMoves(turn); if(moves.length===0){ if(isKingInCheck(turn)) setStatus('Xeque-mate! '+(turn==='w'?'Pretas':'Brancas')+' vencem!'); else setStatus('Empate (stalemate)'); gameOver=true; return; } setStatus('Vez: '+(turn==='w'?'Brancas':'Pretas')); if(aiEnabled && turn==='b') setTimeout(runAI,300); }

  function runAI(){ const moves = allLegalMoves('b'); if(moves.length===0) return postMove(); const caps = moves.filter(m=>{ const [tr,tc]=m.to; return board[tr][tc] !== null; }); const pool = caps.length?caps:moves; const sel = pool[Math.floor(Math.random()*pool.length)]; applyMove(sel.from, sel.to); turn='w'; render(); postMove(); }

  aiToggle.addEventListener('click', ()=>{ aiEnabled = !aiEnabled; aiToggle.textContent = 'IA: '+(aiEnabled?'ON':'OFF')+' (pretas)'; if(aiEnabled && turn==='b') setTimeout(runAI,300); });
  restartBtn.addEventListener('click', reset);
  reset();
  window._chess = { board, reset };
})();
