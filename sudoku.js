/* sudoku.js - simple: show a sample puzzle and verify */
(function(){
  const boardEl = document.getElementById('sudokuBoard');
  const status = document.getElementById('statusText');
  const generateBtn = document.getElementById('generateBtn');
  const checkBtn = document.getElementById('checkBtn');

  const sample = [
    5,3,null, null,7,null, null,null,null,
    6,null,null, 1,9,5, null,null,null,
    null,9,8, null,null,null, null,6,null,
    8,null,null, null,6,null, null,null,3,
    4,null,null, 8,null,3, null,null,1,
    7,null,null, null,2,null, null,null,6,
    null,6,null, null,null,null, 2,8,null,
    null,null,null, 4,1,9, null,null,5,
    null,null,null, null,8,null, null,7,9
  ];

  function render(grid){
    boardEl.innerHTML='';
    for(let i=0;i<81;i++){
      const cell = document.createElement('div'); cell.className='sudoku-board-cell';
      const input = document.createElement('input'); input.maxLength=1; input.type='text';
      if(grid[i]){ input.value = grid[i]; input.disabled=true; }
      cell.appendChild(input); boardEl.appendChild(cell);
    }
  }

  function getGrid(){
    const vals = [];
    const inputs = boardEl.querySelectorAll('input');
    inputs.forEach(inp => { const v = inp.value.trim(); vals.push(v?parseInt(v):null); });
    return vals;
  }

  function checkValid(grid){
    // check rows, cols, boxes
    for(let r=0;r<9;r++){
      const seen=[];
      for(let c=0;c<9;c++){ const v=grid[r*9+c]; if(v){ if(seen.includes(v)) return false; seen.push(v); } }
    }
    for(let c=0;c<9;c++){
      const seen=[];
      for(let r=0;r<9;r++){ const v=grid[r*9+c]; if(v){ if(seen.includes(v)) return false; seen.push(v); } }
    }
    for(let br=0;br<3;br++) for(let bc=0;bc<3;bc++){
      const seen=[];
      for(let r=0;r<3;r++) for(let c=0;c<3;c++){
        const v = grid[(br*3+r)*9 + (bc*3+c)]; if(v){ if(seen.includes(v)) return false; seen.push(v); }
      }
    }
    return true;
  }

  generateBtn.addEventListener('click', ()=>{ render(sample); setStatus('Puzzle gerado.'); });
  checkBtn.addEventListener('click', ()=>{ const g = getGrid(); if(g.includes(null)){ setStatus('Faltam números'); return; } setStatus(checkValid(g)?'Puzzle válido!':'Puzzle inválido'); });

  // init blank
  render(sample);
  setStatus('Preenche o tabuleiro');
})();
