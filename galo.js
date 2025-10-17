/* galo.js - tic tac toe */
(function(){
  const boardEl = document.getElementById('cellContainer');
  const status = document.getElementById('statusText');
  const restartBtn = document.getElementById('restartBtn');
  let cells = [];
  let state = Array(9).fill(null);
  let turn = 'X';
  function setStatus(s){ if(status) status.textContent = s; }
  function render(){
    boardEl.innerHTML=''; cells=[]; for(let i=0;i<9;i++){ const d=document.createElement('div'); d.className='cell'; d.dataset.i=i; d.textContent = state[i]||''; d.addEventListener('click', onClick); boardEl.appendChild(d); cells.push(d); } }
  function onClick(){ const i=parseInt(this.dataset.i); if(state[i]||checkWinner()||winner) return; state[i]=turn; render(); const w=checkWinner(); if(w){ setStatus('Vencedor: '+w); return; } if(state.every(x=>x)) { setStatus('Empate'); return; } turn = (turn==='X'?'O':'X'); setStatus('Vez: '+turn); }
  function checkWinner(){ const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(const l of lines){ const [a,b,c]=l; if(state[a] && state[a]===state[b] && state[a]===state[c]) return state[a]; } return null; }
  restartBtn.addEventListener('click', ()=>{ state=Array(9).fill(null); turn='X'; setStatus('Vez: X'); render(); });
  // init
  setStatus('Vez: X'); render();
})();
