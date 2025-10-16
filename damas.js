var square_class = document.getElementsByClassName("square");
var white_checker_class = document.getElementsByClassName("white_checker");
var black_checker_class = document.getElementsByClassName("black_checker");
var table = document.getElementById("table");
var score = document.getElementById("score");
var black_background = document.getElementById("black_background");
var moveSound = document.getElementById("moveSound");
var winSound = document.getElementById("winSound");

// --- VARIÁVEIS DE DIMENSÃO AJUSTADAS PARA O NOVO CSS (60px/40px) ---
var moveLength = 60; // Tamanho da célula para Desktop (ajustado de 80)
var moveDeviation = 5; // Ajustado: (60px - 50px peça)/2 = 5px (para centralizar a peça)
var Dimension = 1;

var selectedPiece,selectedPieceindex;
var upRight,upLeft,downLeft,downRight;
var contor = 0 , gameOver = 0;
var bigScreen = 1;

var block = [];
var w_checker = [];
var b_checker = [];
var the_checker;
var oneMove;
var anotherMove;
var mustAttack = false;
var multiplier = 1

var tableLimit,reverse_tableLimit ,  moveUpLeft,moveUpRight, moveDownLeft,moveDownRight , tableLimitLeft, tableLimitRight;

getDimension();
initializeTable();
drawCheckers();

// --- FUNÇÃO getDimension AJUSTADA PARA O NOVO BREAKPOINT CSS (768px) ---
function getDimension (){
	contor ++;
    var windowHeight = window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;
    var windowWidth =  window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

    // Novo Breakpoint de responsividade (de 640 para 768px, conforme o site-geral.css)
	if(windowWidth > 768){ 
		moveLength = 60;
		moveDeviation = 5;
		bigScreen = 1;
	} else {
		moveLength = 40; // Tamanho da célula para Mobile
		moveDeviation = 2; // (40px - 36px peça)/2 = 2px
		bigScreen = 0;
    }
}


function drawCheckers(){
	var i,j;
	for(i=1; i<=3; i++)
		for(j=1; j<=8; j++)
			if(block[i][j].color == "black"){
				table.innerHTML += "<div class='checker black_checker' id='bc"+(8*(i-1)+j)+"' style='top:"+block[i][j].top+";left:"+block[i][j].left+";'> </div>";
				block[i][j].occupier = "black";
			}
	for(i=6; i<=8; i++)
		for(j=1; j<=8; j++)
			if(block[i][j].color == "black"){
				table.innerHTML += "<div class='checker white_checker' id='wc"+(8*(i-6)+j)+"' style='top:"+block[i][j].top+";left:"+block[i][j].left+";'> </div>";
				block[i][j].occupier = "white";
			}

	white_checker_class = document.getElementsByClassName("white_checker");
	black_checker_class = document.getElementsByClassName("black_checker");
	
	for(i=0; i<white_checker_class.length; i++){
		white_checker_class[i].setAttribute("onClick","selectPiece(this,"+i+")");
		w_checker[i+1] = new Checker(white_checker_class[i],i+1,"white",parseInt(white_checker_class[i].style.top),parseInt(white_checker_class[i].style.left));
	}
	for(i=0; i<black_checker_class.length; i++){
		black_checker_class[i].setAttribute("onClick","selectPiece(this,"+i+")");
		b_checker[i+1] = new Checker(black_checker_class[i],i+1,"black",parseInt(black_checker_class[i].style.top),parseInt(black_checker_class[i].style.left));
	}
	the_checker = b_checker;
}

function initializeTable(){
	var i,j,k=0;
	for(i=1; i<=8; i++){
		block[i] = [];
		for(j=1; j<=8; j++){
			k++;
			var top = (i-1)*moveLength;
			var left = (j-1)*moveLength;
			if(i%2 == j%2){
				block[i][j] = new Block(document.getElementById("sq"+i+j),"white",i,j,left,top);
			}else{
				block[i][j] = new Block(document.getElementById("sq"+i+j),"black",i,j,left,top);
			}
		}
	}
}

function Block(element, color, row, col, left, top){
	this.element = element;
	this.color = color;
	this.row = row;
	this.col = col;
	this.left = left;
	this.top = top;
	this.occupier = null;
	this.element.setAttribute("onClick","movePiece(this)");
}

function Checker(element, id, color, top, left){
	this.element = element;
	this.id = id;
	this.color = color;
	this.top = top;
	this.left = left;
	this.king = false;
	this.alive = true;
	this.element.style.top = top +"px";
	this.element.style.left = left +"px";
}

function selectPiece(piece, index){

	if(the_checker[1].color != piece.color)
		return;

	playSound(moveSound);
	erase_roads(0);

	if(piece.id[0] == 'w'){
		selectedPiece = w_checker[index+1];
		selectedPieceindex = index+1;
		
	}else{
		selectedPiece = b_checker[index+1];
		selectedPieceindex = index+1;
	}
	
	upRight = getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength);
	upLeft = getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength);
	downRight = getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength);
	downLeft = getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength);
	
	tableLimit = 5*moveLength;
	reverse_tableLimit = 3*moveLength;
	moveUpLeft = getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left - 2*moveLength);
	moveUpRight = getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left + 2*moveLength);
	moveDownLeft = getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left - 2*moveLength);
	moveDownRight = getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left + 2*moveLength);
	tableLimitLeft = 1*moveLength;
	tableLimitRight = 6*moveLength;

	//attack
	if(selectedPiece.color == "white" || selectedPiece.king){
		if(upRight && upRight.occupier == "black" && selectedPiece.top > moveLength && selectedPiece.left < tableLimitRight && getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left + 2*moveLength) && !getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left + 2*moveLength).occupier){
			getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left + 2*moveLength).element.style.backgroundColor = "lightgreen";
			mustAttack = true;
			upRight.element.style.boxShadow = "0 0 15px orange";
		}
		if(upLeft && upLeft.occupier == "black" && selectedPiece.top > moveLength && selectedPiece.left > tableLimitLeft && getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left - 2*moveLength) && !getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left - 2*moveLength).occupier){
			getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left - 2*moveLength).element.style.backgroundColor = "lightgreen";
			mustAttack = true;
			upLeft.element.style.boxShadow = "0 0 15px orange";
		}
	}
	if(selectedPiece.color == "black" || selectedPiece.king){
		if(downRight && downRight.occupier == "white" && selectedPiece.top < tableLimit && selectedPiece.left < tableLimitRight && getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left + 2*moveLength) && !getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left + 2*moveLength).occupier){
			getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left + 2*moveLength).element.style.backgroundColor = "lightgreen";
			mustAttack = true;
			downRight.element.style.boxShadow = "0 0 15px orange";
		}
		if(downLeft && downLeft.occupier == "white" && selectedPiece.top < tableLimit && selectedPiece.left > tableLimitLeft && getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left - 2*moveLength) && !getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left - 2*moveLength).occupier){
			getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left - 2*moveLength).element.style.backgroundColor = "lightgreen";
			mustAttack = true;
			downLeft.element.style.boxShadow = "0 0 15px orange";
		}
	}
	
	//move
	if(!mustAttack){
		if(selectedPiece.color == "white" || selectedPiece.king){
			if(upRight && !upRight.occupier && selectedPiece.top > 0 && selectedPiece.left < 7*moveLength){
				upRight.element.style.backgroundColor = "lightgreen";
			}
			if(upLeft && !upLeft.occupier && selectedPiece.top > 0 && selectedPiece.left > 0){
				upLeft.element.style.backgroundColor = "lightgreen";
			}
		}
		if(selectedPiece.color == "black" || selectedPiece.king){
			if(downRight && !downRight.occupier && selectedPiece.top < 7*moveLength && selectedPiece.left < 7*moveLength){
				downRight.element.style.backgroundColor = "lightgreen";
			}
			if(downLeft && !downLeft.occupier && selectedPiece.top < 7*moveLength && selectedPiece.left > 0){
				downLeft.element.style.backgroundColor = "lightgreen";
			}
		}
	}
	
	if(mustAttack)
		if(!checkIfMustAttack())
			mustAttack = false;
	
}

function movePiece(square){
	if(square.style.backgroundColor != "lightgreen")
		return;
	
	playSound(moveSound);
	selectedPiece.element.style.top = square.top + moveDeviation + "px";
	selectedPiece.element.style.left = square.left + moveDeviation + "px";
	
	getSquare(selectedPiece.top,selectedPiece.left).occupier = null;
	selectedPiece.top = square.top;
	selectedPiece.left = square.left;
	square.occupier = selectedPiece.color;
	
	erase_roads(0);
	
	//attack
	var i;
	for(i=1; i<=2; i++){
		if(i==1){
			oneMove = Math.abs(selectedPiece.top - moveUpRight.top) + Math.abs(selectedPiece.left - moveUpRight.left) == 4*moveLength;
			anotherMove = Math.abs(square.top - moveUpRight.top) + Math.abs(square.left - moveUpRight.left) == 2*moveLength;
		}else{
			oneMove = Math.abs(selectedPiece.top - moveUpLeft.top) + Math.abs(selectedPiece.left - moveUpLeft.left) == 4*moveLength;
			anotherMove = Math.abs(square.top - moveUpLeft.top) + Math.abs(square.left - moveUpLeft.left) == 2*moveLength;
		}
		if(selectedPiece.color == "white" && oneMove && anotherMove){
			if(getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength) && getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength).occupier == "black"){
				getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength).occupier = null;
				removeChecker(b_checker, getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength).element.id);
				
			}else if(getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength) && getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength).occupier == "black"){
				getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength).occupier = null;
				removeChecker(b_checker, getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength).element.id);
			}
			
		}

		if(i==1){
			oneMove = Math.abs(selectedPiece.top - moveDownRight.top) + Math.abs(selectedPiece.left - moveDownRight.left) == 4*moveLength;
			anotherMove = Math.abs(square.top - moveDownRight.top) + Math.abs(square.left - moveDownRight.left) == 2*moveLength;
		}else{
			oneMove = Math.abs(selectedPiece.top - moveDownLeft.top) + Math.abs(selectedPiece.left - moveDownLeft.left) == 4*moveLength;
			anotherMove = Math.abs(square.top - moveDownLeft.top) + Math.abs(square.left - moveDownLeft.left) == 2*moveLength;
		}
		if(selectedPiece.color == "black" && oneMove && anotherMove){
			if(getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength) && getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength).occupier == "white"){
				getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength).occupier = null;
				removeChecker(w_checker, getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength).element.id);
			}else if(getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength) && getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength).occupier == "white"){
				getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength).occupier = null;
				removeChecker(w_checker, getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength).element.id);
			}
		}
	}
	//king
	if(selectedPiece.color == "white" && selectedPiece.top == 0){
		selectedPiece.element.style.border = "4px solid gold";
		selectedPiece.king = true;
	}
	if(selectedPiece.color == "black" && selectedPiece.top == 7*moveLength){
		selectedPiece.element.style.border = "4px solid gold";
		selectedPiece.king = true;
	}

	if(!checkIfLost()){
		if(mustAttack){
			if(checkIfMustAttack()){
				selectPiece(selectedPiece.element, selectedPieceindex-1);
				mustAttack = false;
				return;
			}
		}
		changeTurns(selectedPiece);
		if(checkForMoves())
			declareWinner();
	}else{
		declareWinner();
	}
	mustAttack = false;
}

function getSquare(top, left){
	var i,j;
	for(i=1; i<=8; i++)
		for(j=1; j<=8; j++)
			if(block[i][j].top == top && block[i][j].left == left)
				return block[i][j];
	return false;
}

function removeChecker(arr, id){
	var i;
	for(i=1; i<arr.length; i++){
		if(arr[i].element.id == id){
			arr[i].element.remove();
			arr[i].alive = false;
			return;
		}
	}
}

function erase_roads(multiplier){
	var i,j;
	for(i=1; i<=8; i++)
		for(j=1; j<=8; j++){
			if(i%2 != j%2){
				block[i][j].element.style.backgroundColor = "black";
				block[i][j].element.style.boxShadow = "";
			}
			else{
				block[i][j].element.style.backgroundColor = "white";
				block[i][j].element.style.boxShadow = "";
			}
		}

	if(multiplier){
		for(i=0; i<white_checker_class.length; i++){
			if(w_checker[i+1].alive)
				w_checker[i+1].element.style.boxShadow = "0 0 15px orange";
		}
		for(i=0; i<black_checker_class.length; i++){
			if(b_checker[i+1].alive)
				b_checker[i+1].element.style.boxShadow = "0 0 15px orange";
		}
	}
}

function checkIfMustAttack(){
	
	upRight = getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength);
	upLeft = getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength);
	downRight = getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength);
	downLeft = getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength);

	tableLimit = 5*moveLength;
	reverse_tableLimit = 3*moveLength;
	moveUpLeft = getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left - 2*moveLength);
	moveUpRight = getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left + 2*moveLength);
	moveDownLeft = getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left - 2*moveLength);
	moveDownRight = getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left + 2*moveLength);
	tableLimitLeft = 1*moveLength;
	tableLimitRight = 6*moveLength;

	if(selectedPiece.color == "white" || selectedPiece.king){
		if(upRight && upRight.occupier == "black" && selectedPiece.top > moveLength && selectedPiece.left < tableLimitRight && moveUpRight && !moveUpRight.occupier)
			return true;
		if(upLeft && upLeft.occupier == "black" && selectedPiece.top > moveLength && selectedPiece.left > tableLimitLeft && moveUpLeft && !moveUpLeft.occupier)
			return true;
	}
	if(selectedPiece.color == "black" || selectedPiece.king){
		if(downRight && downRight.occupier == "white" && selectedPiece.top < tableLimit && selectedPiece.left < tableLimitRight && moveDownRight && !moveDownRight.occupier)
			return true;
		if(downLeft && downLeft.occupier == "white" && selectedPiece.top < tableLimit && selectedPiece.left > tableLimitLeft && moveDownLeft && !moveDownLeft.occupier)
			return true;
	}
	return false;
}

function changeTurns(ckc){
	if(ckc.color=="white")
		the_checker = b_checker;
	else
		the_checker = w_checker;
}

function checkIfLost(){
	var i;
	for(i = 1 ; i <= 12; i++)
		if(the_checker[i].alive)
			return false;
	return true;
}

function  checkForMoves(){
	var i ;
	for(i = 1 ; i <= 12; i++)
		if(the_checker[i].alive && showMoves(the_checker[i].id)){
			erase_roads(0);
			return false;
		}
	return true;
}

function showMoves(id){
	if(id[0] == 'w'){
		var piece = w_checker[parseInt(id.slice(2))];
	}else{
		var piece = b_checker[parseInt(id.slice(2))];
	}

	selectedPiece = piece;

	upRight = getSquare(selectedPiece.top - moveLength, selectedPiece.left + moveLength);
	upLeft = getSquare(selectedPiece.top - moveLength, selectedPiece.left - moveLength);
	downRight = getSquare(selectedPiece.top + moveLength, selectedPiece.left + moveLength);
	downLeft = getSquare(selectedPiece.top + moveLength, selectedPiece.left - moveLength);

	tableLimit = 5*moveLength;
	reverse_tableLimit = 3*moveLength;
	moveUpLeft = getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left - 2*moveLength);
	moveUpRight = getSquare(selectedPiece.top - 2*moveLength, selectedPiece.left + 2*moveLength);
	moveDownLeft = getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left - 2*moveLength);
	moveDownRight = getSquare(selectedPiece.top + 2*moveLength, selectedPiece.left + 2*moveLength);
	tableLimitLeft = 1*moveLength;
	tableLimitRight = 6*moveLength;

	//attack
	if(selectedPiece.color == "white" || selectedPiece.king){
		if(upRight && upRight.occupier == "black" && selectedPiece.top > moveLength && selectedPiece.left < tableLimitRight && moveUpRight && !moveUpRight.occupier){
			selectedPiece = null;
			return true;
		}
		if(upLeft && upLeft.occupier == "black" && selectedPiece.top > moveLength && selectedPiece.left > tableLimitLeft && moveUpLeft && !moveUpLeft.occupier){
			selectedPiece = null;
			return true;
		}
	}
	if(selectedPiece.color == "black" || selectedPiece.king){
		if(downRight && downRight.occupier == "white" && selectedPiece.top < tableLimit && selectedPiece.left < tableLimitRight && moveDownRight && !moveDownRight.occupier){
			selectedPiece = null;
			return true;
		}
		if(downLeft && downLeft.occupier == "white" && selectedPiece.top < tableLimit && selectedPiece.left > tableLimitLeft && moveDownLeft && !moveDownLeft.occupier){
			selectedPiece = null;
			return true;
		}
	}

	//move
	if(!mustAttack){
		if(selectedPiece.color == "white" || selectedPiece.king){
			if(upRight && !upRight.occupier && selectedPiece.top > 0 && selectedPiece.left < 7*moveLength){
				selectedPiece = null;
				return true;
			}
			if(upLeft && !upLeft.occupier && selectedPiece.top > 0 && selectedPiece.left > 0){
				selectedPiece = null;
				return true;
			}
		}
		if(selectedPiece.color == "black" || selectedPiece.king){
			if(downRight && !downRight.occupier && selectedPiece.top < 7*moveLength && selectedPiece.left < 7*moveLength){
				selectedPiece = null;
				return true;
			}
			if(downLeft && !downLeft.occupier && selectedPiece.top < 7*moveLength && selectedPiece.left > 0){
				selectedPiece = null;
				return true;
			}
		}
	}
	selectedPiece = null;
	return false;
}

function declareWinner(){
	playSound(winSound);
	score.style.display = "block";

	if(the_checker[1].color == "white")
		score.innerHTML = "Preto Ganhou!";
	else
		score.innerHTML = "Branco Ganhou!";
	gameOver = 1;

	// Reinicia o jogo após 5 segundos
	setTimeout(function() {
        if (gameOver) {
            window.location.reload();
        }
    }, 5000);
}

function playSound(sound){
	if(sound) sound.play();
}