(function(window,$,undefined){'use strict';$.fn.sudokuJS=function(opts){var DIFFICULTY_EASY="easy";var DIFFICULTY_MEDIUM="medium";var DIFFICULTY_HARD="hard";var DIFFICULTY_VERY_HARD="very hard";var SOLVE_MODE_STEP="step";var SOLVE_MODE_ALL="all";var DIFFICULTIES=[DIFFICULTY_EASY,DIFFICULTY_MEDIUM,DIFFICULTY_HARD,DIFFICULTY_VERY_HARD];opts=opts||{};var solveMode=SOLVE_MODE_STEP,difficulty="unknown",candidatesShowing=false,editingCandidates=false,boardFinished=false,boardError=false,onlyUpdatedCandidates=false,gradingMode=false,generatingMode=false,invalidCandidates=[],strategies=[{title:"openSingles",fn:openSingles,score:0.1},{title:"singleCandidate",fn:singleCandidate,score:9},{title:"visualElimination",fn:visualElimination,score:8},{title:"nakedPair",fn:nakedPair,score:50},{title:"pointingElimination",fn:pointingElimination,score:80},{title:"hiddenPair",fn:hiddenPair,score:90},{title:"nakedTriplet",fn:nakedTriplet,score:100},{title:"hiddenTriplet",fn:hiddenTriplet,score:140},{title:"nakedQuad",fn:nakedQuad,score:150},{title:"hiddenQuad",fn:hiddenQuad,score:280}],usedStrategies=[],board=[],boardSize,boardNumbers,houses=[[],[],[]];var $board=$(this),$boardInputs,$boardInputCandidates;function log(msg){if(window.console&&console.log)
console.log(msg);}
var contains=function(a,obj){for(var i=0;i<a.length;i++){if(a[i]===obj){return true;}}
return false;};var uniqueArray=function(a){var temp={};for(var i=0;i<a.length;i++)
temp[a[i]]=true;var r=[];for(var k in temp)
r.push(k);return r;};var calcBoardDifficulty=function(usedStrategies){var boardDiff={};if(usedStrategies.length<3)
boardDiff.level=DIFFICULTY_EASY;else if(usedStrategies.length<4)
boardDiff.level=DIFFICULTY_MEDIUM;else
boardDiff.level=DIFFICULTY_HARD;var totalScore=0;for(var i=0;i<strategies.length;i++){var freq=usedStrategies[i];if(!freq)
continue;var stratObj=strategies[i];totalScore+=freq*stratObj.score;}
boardDiff.score=totalScore;if(totalScore>750)
boardDiff.level=DIFFICULTY_VERY_HARD;return boardDiff;};var isBoardFinished=function(){for(var i=0;i<boardSize*boardSize;i++){if(board[i].val===null)
return false;}
return true;};var generateHouseIndexList=function(){houses=[[],[],[]]
var boxSideSize=Math.sqrt(boardSize);for(var i=0;i<boardSize;i++){var hrow=[];var vrow=[];var box=[];for(var j=0;j<boardSize;j++){hrow.push(boardSize*i+j);vrow.push(boardSize*j+i);if(j<boxSideSize){for(var k=0;k<boxSideSize;k++){var a=Math.floor(i/boxSideSize)*boardSize*boxSideSize;var b=(i%boxSideSize)*boxSideSize;var boxStartIndex=a+b;box.push(boxStartIndex+boardSize*j+k);}}}
houses[0].push(hrow);houses[1].push(vrow);houses[2].push(box);}};var initBoard=function(opts){var alreadyEnhanced=(board[0]!==null&&typeof board[0]==="object");var nullCandidateList=[];boardNumbers=[];boardSize=(!board.length&&opts.boardSize)||Math.sqrt(board.length)||9;$board.attr("data-board-size",boardSize);if(boardSize%1!==0||Math.sqrt(boardSize)%1!==0){log("invalid boardSize: "+boardSize);if(typeof opts.boardErrorFn==="function")
opts.boardErrorFn({msg:"invalid board size"});return;}
for(var i=0;i<boardSize;i++){boardNumbers.push(i+1);nullCandidateList.push(null);}
generateHouseIndexList();if(!alreadyEnhanced){for(var j=0;j<boardSize*boardSize;j++){var cellVal=(typeof board[j]==="undefined")?null:board[j];var candidates=cellVal===null?boardNumbers.slice():nullCandidateList.slice();board[j]={val:cellVal,candidates:candidates};}}};var renderBoard=function(){var htmlString="";for(var i=0;i<boardSize*boardSize;i++){htmlString+=renderBoardCell(board[i],i);if((i+1)%boardSize===0){htmlString+="<br>";}}
$board.append(htmlString);$boardInputs=$board.find("input");$boardInputCandidates=$board.find(".candidates");};var renderBoardCell=function(boardCell,id){var val=(boardCell.val===null)?"":boardCell.val;var candidates=boardCell.candidates||[];var candidatesString=buildCandidatesString(candidates);var maxlength=(boardSize<10)?" maxlength='1'":"";return "<div class='sudoku-board-cell'>"+
"<input type='text' pattern='\\d*' novalidate id='input-"+id+"' value='"+val+"'"+maxlength+">"+
"<div id='input-"+id+"-candidates' class='candidates'>"+candidatesString+"</div>"+
"</div>";};var buildCandidatesString=function(candidatesList){var s="";for(var i=1;i<boardSize+1;i++){if(contains(candidatesList,i))
s+="<div>"+i+"</div> ";else
s+="<div>&nbsp;</div> ";}
return s;};var updateUIBoard=function(paintNew){$boardInputs.removeClass("highlight-val").each(function(i,v){var $input=$(this);var newVal=board[i].val;$input.val(newVal);if(paintNew)
$input.addClass("highlight-val");var $candidates=$input.siblings(".candidates");$candidates.html(buildCandidatesString(board[i].candidates));});};var updateUIBoardCell=function(cellIndex,opts){opts=opts||{};var newVal=board[cellIndex].val;$("#input-"+cellIndex).val(newVal).addClass("highlight-val");$("#input-"+cellIndex+"-candidates").html(buildCandidatesString(board[cellIndex].candidates));};var uIBoardHighlightRemoveCandidate=function(cellIndex,digit){$("#input-"+cellIndex+"-candidates div:nth-of-type("+digit+")").addClass("candidate--to-remove");};var uIBoardHighlightCandidate=function(cellIndex,digit){$("#input-"+cellIndex+"-candidates div:nth-of-type("+digit+")").addClass("candidate--highlight");};var removeCandidatesFromCell=function(cell,candidates){var boardCell=board[cell];var c=boardCell.candidates;var cellUpdated=false;for(var i=0;i<candidates.length;i++){if(c[candidates[i]-1]!==null){c[candidates[i]-1]=null;cellUpdated=true;}}
if(cellUpdated&&solveMode===SOLVE_MODE_STEP)
updateUIBoardCell(cell,{mode:"only-candidates"});};var removeCandidatesFromCells=function(cells,candidates){var cellsUpdated=[];for(var i=0;i<cells.length;i++){var c=board[cells[i]].candidates;for(var j=0;j<candidates.length;j++){var candidate=candidates[j];if(c[candidate-1]!==null){c[candidate-1]=null;cellsUpdated.push(cells[i]);if(solveMode===SOLVE_MODE_STEP){uIBoardHighlightRemoveCandidate(cells[i],candidate);}}}}
return cellsUpdated;};var highLightCandidatesOnCells=function(candidates,cells){for(var i=0;i<cells.length;i++){var cellCandidates=board[cells[i]].candidates;for(var j=0;j<cellCandidates.length;j++){if(contains(candidates,cellCandidates[j]))
uIBoardHighlightCandidate(cells[i],cellCandidates[j]);}}};var resetBoardVariables=function(){boardFinished=false;boardError=false;onlyUpdatedCandidates=false;usedStrategies=[];gradingMode=false;};var clearBoard=function(){resetBoardVariables();var cands=boardNumbers.slice(0);for(var i=0;i<boardSize*boardSize;i++){board[i]={val:null,candidates:cands.slice()};}
$boardInputs.removeClass("highlight-val").removeClass("board-cell--error").val("");updateUIBoard(false);};var getNullCandidatesList=function(){var l=[];for(var i=0;i<boardSize;i++){l.push(null);}
return l;};var resetCandidates=function(updateUI){var resetCandidatesList=boardNumbers.slice(0);for(var i=0;i<boardSize*boardSize;i++){if(board[i].val===null){board[i].candidates=resetCandidatesList.slice();if(updateUI!==false)
$("#input-"+i+"-candidates").html(buildCandidatesString(resetCandidatesList));}else if(updateUI!==false){$("#input-"+i+"-candidates").html("");}}};var setBoardCell=function(cellIndex,val){var boardCell=board[cellIndex];boardCell.val=val;if(val!==null)
boardCell.candidates=getNullCandidatesList();};var indexInHouse=function(digit,house){for(var i=0;i<boardSize;i++){if(board[house[i]].val===digit)
return i;}
return false;};var housesWithCell=function(cellIndex){var boxSideSize=Math.sqrt(boardSize);var houses=[];var hrow=Math.floor(cellIndex/boardSize);houses.push(hrow);var vrow=Math.floor(cellIndex%boardSize);houses.push(vrow);var box=(Math.floor(hrow/boxSideSize)*boxSideSize)+Math.floor(vrow/boxSideSize);houses.push(box);return houses;};var numbersLeft=function(house){var numbers=boardNumbers.slice();for(var i=0;i<house.length;i++){for(var j=0;j<numbers.length;j++){if(numbers[j]===board[house[i]].val)
numbers.splice(j,1);}}
return numbers;};var numbersTaken=function(house){var numbers=[];for(var i=0;i<house.length;i++){var n=board[house[i]].val;if(n!==null)
numbers.push(n);}
return numbers;};var candidatesLeft=function(cellIndex){var t=[];var candidates=board[cellIndex].candidates;for(var i=0;i<candidates.length;i++){if(candidates[i]!==null)
t.push(candidates[i]);}
return t;};var cellsForCandidate=function(candidate,house){var t=[];for(var i=0;i<house.length;i++){var cell=board[house[i]];var candidates=cell.candidates;if(contains(candidates,candidate))
t.push(house[i]);}
return t;};function openSingles(){var hlength=houses.length;for(var i=0;i<hlength;i++){var housesCompleted=0;for(var j=0;j<boardSize;j++){var emptyCells=[];for(var k=0;k<boardSize;k++){var boardIndex=houses[i][j][k];if(board[boardIndex].val===null){emptyCells.push({house:houses[i][j],cell:boardIndex});if(emptyCells.length>1){break;}}}
if(emptyCells.length===1){var emptyCell=emptyCells[0];var val=numbersLeft(emptyCell.house);if(val.length>1){boardError=true;return-1;}
setBoardCell(emptyCell.cell,val[0]);if(solveMode===SOLVE_MODE_STEP)
uIBoardHighlightCandidate(emptyCell.cell,val[0]);return[emptyCell.cell];}
if(emptyCells.length===0){housesCompleted++;if(housesCompleted===boardSize){boardFinished=true;return-1;}}}}
return false;}
function visualEliminationOfCandidates(){var hlength=houses.length;for(var i=0;i<hlength;i++){for(var j=0;j<boardSize;j++){var house=houses[i][j];var candidatesToRemove=numbersTaken(house);for(var k=0;k<boardSize;k++){var cell=house[k];var candidates=board[cell].candidates;removeCandidatesFromCell(cell,candidatesToRemove);}}}
return false;}
function visualElimination(){var hlength=houses.length;for(var i=0;i<hlength;i++){for(var j=0;j<boardSize;j++){var house=houses[i][j];var digits=numbersLeft(house);for(var k=0;k<digits.length;k++){var digit=digits[k];var possibleCells=[];for(var l=0;l<boardSize;l++){var cell=house[l];var boardCell=board[cell];if(contains(boardCell.candidates,digit)){possibleCells.push(cell);if(possibleCells.length>1)
break;}}
if(possibleCells.length===1){var cellIndex=possibleCells[0];setBoardCell(cellIndex,digit);if(solveMode===SOLVE_MODE_STEP)
uIBoardHighlightCandidate(cellIndex,digit);onlyUpdatedCandidates=false;return[cellIndex];}}}}
return false;}
function singleCandidate(){visualEliminationOfCandidates();for(var i=0;i<board.length;i++){var cell=board[i];var candidates=cell.candidates;var possibleCandidates=[];for(var j=0;j<candidates.length;j++){if(candidates[j]!==null)
possibleCandidates.push(candidates[j]);if(possibleCandidates.length>1)
break;}
if(possibleCandidates.length===1){var digit=possibleCandidates[0];setBoardCell(i,digit);if(solveMode===SOLVE_MODE_STEP)
uIBoardHighlightCandidate(i,digit);onlyUpdatedCandidates=false;return[i];}}
return false;}
function pointingElimination(){var effectedCells=false;var hlength=houses.length;for(var a=0;a<hlength;a++){var houseType=a;for(var i=0;i<boardSize;i++){var house=houses[houseType][i];var digits=numbersLeft(house);for(var j=0;j<digits.length;j++){var digit=digits[j];var sameAltHouse=true;var houseId=-1;var houseTwoId=-1;var sameAltTwoHouse=true;var cellsWithCandidate=[];for(var k=0;k<house.length;k++){var cell=house[k];if(contains(board[cell].candidates,digit)){var cellHouses=housesWithCell(cell);var newHouseId=(houseType===2)?cellHouses[0]:cellHouses[2];var newHouseTwoId=(houseType===2)?cellHouses[1]:cellHouses[2];if(cellsWithCandidate.length>0){if(newHouseId!==houseId){sameAltHouse=false;}
if(houseTwoId!==newHouseTwoId){sameAltTwoHouse=false;}
if(sameAltHouse===false&&sameAltTwoHouse===false){break;}}
houseId=newHouseId;houseTwoId=newHouseTwoId;cellsWithCandidate.push(cell);}}
if((sameAltHouse===true||sameAltTwoHouse===true)&&cellsWithCandidate.length>0){var h=housesWithCell(cellsWithCandidate[0]);var altHouseType=2;if(houseType===2){if(sameAltHouse)
altHouseType=0;else
altHouseType=1;}
var altHouse=houses[altHouseType][h[altHouseType]];var cellsEffected=[];for(var x=0;x<altHouse.length;x++){if(!contains(cellsWithCandidate,altHouse[x])){cellsEffected.push(altHouse[x]);}}
var cellsUpdated=removeCandidatesFromCells(cellsEffected,[digit]);if(cellsUpdated.length>0){if(solveMode===SOLVE_MODE_STEP)
highLightCandidatesOnCells([digit],cellsWithCandidate);onlyUpdatedCandidates=true;return cellsUpdated;}}}}}
return false;}
function nakedCandidates(n){var hlength=houses.length;for(var i=0;i<hlength;i++){for(var j=0;j<boardSize;j++){var house=houses[i][j];if(numbersLeft(house).length<=n)
continue;var combineInfo=[];var minIndexes=[-1];var result=checkCombinedCandidates(house,0);if(result!==false)
return result;}}
return false;function checkCombinedCandidates(house,startIndex){for(var i=Math.max(startIndex,minIndexes[startIndex]);i<boardSize-n+startIndex;i++){minIndexes[startIndex]=i+1;minIndexes[startIndex+1]=i+1;var cell=house[i];var cellCandidates=candidatesLeft(cell);if(cellCandidates.length===0||cellCandidates.length>n)
continue;if(combineInfo.length>0){var temp=cellCandidates.slice();for(var a=0;a<combineInfo.length;a++){var candidates=combineInfo[a].candidates;for(var b=0;b<candidates.length;b++){if(!contains(temp,candidates[b]))
temp.push(candidates[b]);}}
if(temp.length>n){continue;}}
combineInfo.push({cell:cell,candidates:cellCandidates});if(startIndex<n-1){var r=checkCombinedCandidates(house,startIndex+1);if(r!==false)
return r;}
if(combineInfo.length===n){var cellsWithCandidates=[];var combinedCandidates=[];for(var x=0;x<combineInfo.length;x++){cellsWithCandidates.push(combineInfo[x].cell);combinedCandidates=combinedCandidates.concat(combineInfo[x].candidates);}
var cellsEffected=[];for(var y=0;y<boardSize;y++){if(!contains(cellsWithCandidates,house[y])){cellsEffected.push(house[y]);}}
var cellsUpdated=removeCandidatesFromCells(cellsEffected,combinedCandidates);if(cellsUpdated.length>0){if(solveMode===SOLVE_MODE_STEP)
highLightCandidatesOnCells(combinedCandidates,cellsWithCandidates);onlyUpdatedCandidates=true;return uniqueArray(cellsUpdated);}}}
if(startIndex>0){if(combineInfo.length>startIndex-1){combineInfo.pop();}}
return false;}}
function nakedPair(){return nakedCandidates(2);}
function nakedTriplet(){return nakedCandidates(3);}
function nakedQuad(){return nakedCandidates(4);}
function hiddenLockedCandidates(n){var hlength=houses.length;for(var i=0;i<hlength;i++){for(var j=0;j<boardSize;j++){var house=houses[i][j];if(numbersLeft(house).length<=n)
continue;var combineInfo=[];var minIndexes=[-1];var result=checkLockedCandidates(house,0);if(result!==false)
return result;}}
return false;function checkLockedCandidates(house,startIndex){for(var i=Math.max(startIndex,minIndexes[startIndex]);i<=boardSize-n+startIndex;i++){minIndexes[startIndex]=i+1;minIndexes[startIndex+1]=i+1;var candidate=i+1;var possibleCells=cellsForCandidate(candidate,house);if(possibleCells.length===0||possibleCells.length>n)
continue;if(combineInfo.length>0){var temp=possibleCells.slice();for(var a=0;a<combineInfo.length;a++){var cells=combineInfo[a].cells;for(var b=0;b<cells.length;b++){if(!contains(temp,cells[b]))
temp.push(cells[b]);}}
if(temp.length>n){continue;}}
combineInfo.push({candidate:candidate,cells:possibleCells});if(startIndex<n-1){var r=checkLockedCandidates(house,startIndex+1);if(r!==false)
return r;}
if(combineInfo.length===n){var combinedCandidates=[];var cellsWithCandidates=[];for(var x=0;x<combineInfo.length;x++){combinedCandidates.push(combineInfo[x].candidate);cellsWithCandidates=cellsWithCandidates.concat(combineInfo[x].cells);}
var candidatesToRemove=[];for(var c=0;c<boardSize;c++){if(!contains(combinedCandidates,c+1))
candidatesToRemove.push(c+1);}
var cellsUpdated=removeCandidatesFromCells(cellsWithCandidates,candidatesToRemove);if(cellsUpdated.length>0){if(solveMode===SOLVE_MODE_STEP)
highLightCandidatesOnCells(combinedCandidates,cellsWithCandidates);onlyUpdatedCandidates=true;return uniqueArray(cellsWithCandidates);}}}
if(startIndex>0){if(combineInfo.length>startIndex-1){combineInfo.pop();}}
return false;}}
function hiddenPair(){return hiddenLockedCandidates(2);}
function hiddenTriplet(){return hiddenLockedCandidates(3);}
function hiddenQuad(){return hiddenLockedCandidates(4);}
var nrSolveLoops=0;var effectedCells=false;var solveFn=function(i){if(boardFinished){if(!gradingMode){updateUIBoard(false);if(typeof opts.boardFinishedFn==="function"){opts.boardFinishedFn({difficultyInfo:calcBoardDifficulty(usedStrategies)});}}
return false;}else if(solveMode===SOLVE_MODE_STEP){if(effectedCells&&effectedCells!==-1){$boardInputs.removeClass("highlight-val");$(".candidate--highlight").removeClass("candidate--highlight");for(var j=0;j<effectedCells.length;j++){updateUIBoardCell(effectedCells[j]);}}}
nrSolveLoops++;var strat=strategies[i].fn;effectedCells=strat();if(effectedCells===false){if(strategies.length>i+1){return solveFn(i+1);}else{if(typeof opts.boardErrorFn==="function"&&!generatingMode)
opts.boardErrorFn({msg:"no more strategies"});if(!gradingMode&&!generatingMode&&solveMode===SOLVE_MODE_ALL)
updateUIBoard(false);return false;}}else if(boardError){if(typeof opts.boardErrorFn==="function")
opts.boardErrorFn({msg:"Board incorrect"});if(solveMode===SOLVE_MODE_ALL){updateUIBoard(false);}
return false;}else if(solveMode===SOLVE_MODE_STEP){if(typeof opts.boardUpdatedFn==="function"){opts.boardUpdatedFn({cause:strategies[i].title,cellsUpdated:effectedCells});}
if(isBoardFinished()){boardFinished=true;if(typeof opts.boardFinishedFn==="function"){opts.boardFinishedFn({difficultyInfo:calcBoardDifficulty(usedStrategies)});}
if(candidatesShowing)
updateUIBoard(false);}
if(!candidatesShowing&&!onlyUpdatedCandidates&&effectedCells&&effectedCells!==-1){$boardInputs.removeClass("highlight-val");$(".candidate--highlight").removeClass("candidate--highlight");for(var k=0;k<effectedCells.length;k++){updateUIBoardCell(effectedCells[k]);}}}
if(typeof usedStrategies[i]==="undefined")
usedStrategies[i]=0;usedStrategies[i]=usedStrategies[i]+1;if(!gradingMode&&!candidatesShowing&&onlyUpdatedCandidates){showCandidates();if(typeof opts.candidateShowToggleFn==="function")
opts.candidateShowToggleFn(true);}
return true;};var keyboardMoveBoardFocus=function(currentId,keyCode){var newId=currentId;if(keyCode===39)
newId++;else if(keyCode===37)
newId--;else if(keyCode===40)
newId=newId+boardSize;else if(keyCode===38)
newId=newId-boardSize;if(newId<0||newId>(boardSize*boardSize))
return;$("#input-"+newId).focus();};var toggleCandidateOnCell=function(candidate,cell){var boardCell=board[cell];if(boardCell.val){return;}
var c=boardCell.candidates;c[candidate-1]=c[candidate-1]===null?candidate:null;if(solveMode===SOLVE_MODE_STEP)
updateUIBoardCell(cell,{mode:"only-candidates"});};var keyboardNumberInput=function(input,id){var val=parseInt(input.val());if(editingCandidates){toggleCandidateOnCell(val,id);input.val(board[id].val);return;}
var candidates=getNullCandidatesList();if(val>0){var temp=housesWithCell(id);for(var i=0;i<houses.length;i++){if(indexInHouse(val,houses[i][temp[i]])){var alreadyExistingCellInHouseWithDigit=houses[i][temp[i]][indexInHouse(val,houses[i][temp[i]])];if(alreadyExistingCellInHouseWithDigit===id)
continue;$("#input-"+alreadyExistingCellInHouseWithDigit+", #input-"+id).addClass("board-cell--error");return;}}
input.siblings(".candidates").html(buildCandidatesString(candidates));board[id].candidates=candidates;board[id].val=val;if(isBoardFinished()){boardFinished=true;log("user finished board!");if(typeof opts.boardFinishedFn==="function"){opts.boardFinishedFn({});}}}else{boardError=false;val=null;candidates=boardNumbers.slice();input.siblings(".candidates").html(buildCandidatesString(candidates));board[id].val=val;resetCandidates();visualEliminationOfCandidates();}
if($("#input-"+id).hasClass("board-cell--error"))
$boardInputs.removeClass("board-cell--error");if(typeof opts.boardUpdatedFn==="function")
opts.boardUpdatedFn({cause:"user input",cellsUpdated:[id]});onlyUpdatedCandidates=false;};var toggleShowCandidates=function(){$board.toggleClass("showCandidates");candidatesShowing=!candidatesShowing;};var analyzeBoard=function(){gradingMode=true;solveMode=SOLVE_MODE_ALL;var usedStrategiesClone=JSON.parse(JSON.stringify(usedStrategies));var boardClone=JSON.parse(JSON.stringify(board));var canContinue=true;while(canContinue){var startStrat=onlyUpdatedCandidates?2:0;canContinue=solveFn(startStrat);}
var data={};if(boardError){data.error="Board incorrect";}
else{data.finished=boardFinished;data.usedStrategies=[];for(var i=0;i<usedStrategies.length;i++){var strat=strategies[i];if(typeof usedStrategies[i]!=="undefined"){data.usedStrategies[i]={title:strat.title,freq:usedStrategies[i]};}}
if(boardFinished){var boardDiff=calcBoardDifficulty(usedStrategies);data.level=boardDiff.level;data.score=boardDiff.score;}}
resetBoardVariables();usedStrategies=usedStrategiesClone;board=boardClone;return data;};var setBoardCellWithRandomCandidate=function(cellIndex,forceUIUpdate){visualEliminationOfCandidates();var invalids=invalidCandidates&&invalidCandidates[cellIndex];var candidates=board[cellIndex].candidates.filter(function(candidate){if(!candidate||(invalids&&contains(invalids,candidate)))
return false;return candidate;});if(candidates.length===0){return false;}
var randIndex=Math.round(Math.random()*(candidates.length-1));var randomCandidate=candidates[randIndex];setBoardCell(cellIndex,randomCandidate);return true;};var generateBoardAnswerRecursively=function(cellIndex){if((cellIndex+1)>(boardSize*boardSize)){invalidCandidates=[];return true;}
if(setBoardCellWithRandomCandidate(cellIndex)){generateBoardAnswerRecursively(cellIndex+1);}else{if(cellIndex<=0)
return false;var lastIndex=cellIndex-1;invalidCandidates[lastIndex]=invalidCandidates[lastIndex]||[];invalidCandidates[lastIndex].push(board[lastIndex].val);setBoardCell(lastIndex,null);resetCandidates(false);invalidCandidates[cellIndex]=[];generateBoardAnswerRecursively(lastIndex);return false;}};var easyEnough=function(data){if(data.level===DIFFICULTY_EASY)
return true;if(data.level===DIFFICULTY_MEDIUM)
return difficulty!==DIFFICULTY_EASY;if(data.level===DIFFICULTY_HARD)
return difficulty!==DIFFICULTY_EASY&&difficulty!==DIFFICULTY_MEDIUM;if(data.level===DIFFICULTY_VERY_HARD)
return difficulty!==DIFFICULTY_EASY&&difficulty!==DIFFICULTY_MEDIUM&&difficulty!==DIFFICULTY_HARD;};var hardEnough=function(data){if(difficulty===DIFFICULTY_EASY)
return true;if(difficulty===DIFFICULTY_MEDIUM)
return data.level!==DIFFICULTY_EASY;if(difficulty===DIFFICULTY_HARD)
return data.level!==DIFFICULTY_EASY&&data.level!==DIFFICULTY_MEDIUM;if(difficulty===DIFFICULTY_VERY_HARD)
return data.level!==DIFFICULTY_EASY&&data.level!==DIFFICULTY_MEDIUM&&data.level!==DIFFICULTY_HARD;};var digCells=function(){var cells=[];var given=boardSize*boardSize;var minGiven=17;if(difficulty===DIFFICULTY_EASY){minGiven=40;}else if(difficulty===DIFFICULTY_MEDIUM){minGiven=30;}
if(boardSize<9){minGiven=4}
for(var i=0;i<boardSize*boardSize;i++){cells.push(i);}
while(cells.length>0&&given>minGiven){var randIndex=Math.round(Math.random()*(cells.length-1));var cellIndex=cells.splice(randIndex,1);var val=board[cellIndex].val;setBoardCell(cellIndex,null);resetCandidates(false);var data=analyzeBoard();if(data.finished!==false&&easyEnough(data)){given--;}else{setBoardCell(cellIndex,val);}}};var generateBoard=function(diff,callback){if($boardInputs)
clearBoard();if(contains(DIFFICULTIES,diff)){difficulty=diff}else if(boardSize>=9){difficulty=DIFFICULTY_MEDIUM}else{difficulty=DIFFICULTY_EASY}
generatingMode=true;solveMode=SOLVE_MODE_ALL;generateBoardAnswerRecursively(0);var boardAnswer=board.slice();var boardTooEasy=true;while(boardTooEasy){digCells();var data=analyzeBoard();if(hardEnough(data))
boardTooEasy=false;else
board=boardAnswer;}
solveMode=SOLVE_MODE_STEP;if($boardInputs)
updateUIBoard();visualEliminationOfCandidates();if(typeof callback==='function'){callback();}};if(!opts.board){initBoard(opts);generateBoard(opts);renderBoard();}else{board=opts.board;initBoard();renderBoard();visualEliminationOfCandidates();}
$boardInputs.on("keyup",function(e){var $this=$(this);var id=parseInt($this.attr("id").replace("input-",""));if(e.keyCode>=37&&e.keyCode<=40){keyboardMoveBoardFocus(id,e.keyCode);}});$boardInputs.on("change",function(){var $this=$(this);var id=parseInt($this.attr("id").replace("input-",""));keyboardNumberInput($this,id);});var solveAll=function(){solveMode=SOLVE_MODE_ALL;var canContinue=true;while(canContinue){var startStrat=onlyUpdatedCandidates?2:0;canContinue=solveFn(startStrat);}};var solveStep=function(){solveMode=SOLVE_MODE_STEP;var startStrat=onlyUpdatedCandidates?2:0;solveFn(startStrat);};var getBoard=function(){return board;};var setBoard=function(newBoard){clearBoard();board=newBoard;initBoard();visualEliminationOfCandidates();updateUIBoard(false);};var hideCandidates=function(){$board.removeClass("showCandidates");candidatesShowing=false;};var showCandidates=function(){$board.addClass("showCandidates");candidatesShowing=true;};var setEditingCandidates=function(newVal){editingCandidates=newVal;};return{solveAll:solveAll,solveStep:solveStep,analyzeBoard:analyzeBoard,clearBoard:clearBoard,getBoard:getBoard,setBoard:setBoard,hideCandidates:hideCandidates,showCandidates:showCandidates,setEditingCandidates:setEditingCandidates,generateBoard:generateBoard};};})(window,jQuery);
