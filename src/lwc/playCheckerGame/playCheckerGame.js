import { LightningElement, api, track } from 'lwc';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled} from 'lightning/empApi';

import currentUserId from '@salesforce/user/Id';
import getGameData from '@salesforce/apex/PlayGameControllerLWC.getGameData';
import moveTool from '@salesforce/apex/PlayGameControllerLWC.moveTool';

export default class PlayCheckerGame extends LightningElement {

    @api recordId;
    @track gameRecord;
    @track isTurnUser1;
    @track isCurrentUserIsP1;
    @track isCurrentUserIsP2;
    @track isCurrentUserViewer;
    @track boardRows = [];
    @track allCellsMap;
    @track p1Tools;
    @track p2Tools;
    @track movementsLogs = [];

    @track gameTitle;

    @track mainUserCss;
    @track mainUserPhotoURL;
    @track mainUserName;

    @track opponentUserCss;
    @track opponentUserPhotoURL;
    @track opponentUserName;

    @track clickedToolRow;
    @track clickedToolCol;
    @track clickedOptions;

    connectedCallback(){
        getGameData({gameId: this.recordId}).then(
            result =>{
                this.gameRecord = result;

                this.loadGameData();
            }
        ).catch(error => {
                console.log('error' + error);
        });
    }

    cellClicked(event){    
        var player = event.target.dataset.player;
        var row = Number(event.target.dataset.row);
        var col = Number(event.target.dataset.col);

        this.clickedToolRow = row;
        this.clickedToolCol = col;
        this.clickedOptions = '';
        
        console.log('clickedToolRow:' + this.clickedToolRow);
        console.log('clickedToolCol:' + this.clickedToolCol);
        console.log('player:' + player);
        
        if(this.allCellsMap[row + '_' + col].isKing) {
            this.findKingOptions(player, row, col);
        }
        else{
            if(player == 1){
                var rightCellRow = row - 1;
                var rightCellCol = col + 1;
                
                var leftCellRow = row - 1;
                var leftCellCol = col - 1;

                for(var key in this.allCellsMap){
                    this.allCellsMap[key].showPlayer1Option = false;
                    this.allCellsMap[key].isEatOptionCell = false;
                }

                if(rightCellRow > 0 && rightCellCol <= 8){

                    if(this.allCellsMap[rightCellRow + '_' + rightCellCol].status == 'E'){
                        this.allCellsMap[(rightCellRow) + '_' + (rightCellCol)].showPlayer1Option = true;
                    }
                    else if(this.allCellsMap[rightCellRow + '_' + rightCellCol].status == 'P2') {
                        if(rightCellRow - 1 > 0 
                            && rightCellCol + 1 <=8 
                            && this.allCellsMap[(rightCellRow - 1) + '_' + (rightCellCol + 1)].status == 'E'){
                            
                            this.allCellsMap[(rightCellRow - 1) + '_' + (rightCellCol + 1)].showPlayer1Option = true;
                            this.allCellsMap[(rightCellRow - 1) + '_' + (rightCellCol + 1)].isEatOptionCell = true;
                        }
                    }
                }
                if(leftCellRow > 0 && leftCellCol > 0){
                    if(this.allCellsMap[leftCellRow + '_' + leftCellCol].status == 'E'){
                        this.allCellsMap[(leftCellRow) + '_' + (leftCellCol)].showPlayer1Option = true;
                    }
                    else if(this.allCellsMap[leftCellRow + '_' + leftCellCol].status == 'P2') {
                        if(leftCellRow - 1 > 0
                            && leftCellCol- 1 > 0
                            && this.allCellsMap[(leftCellRow - 1)  + '_' + (leftCellCol- 1)].status == 'E'){

                            this.allCellsMap[(leftCellRow - 1) + '_' + (leftCellCol - 1)].showPlayer1Option = true;
                            this.allCellsMap[(leftCellRow - 1) + '_' + (leftCellCol - 1)].isEatOptionCell = true;
                        }
                    }
                }
            }
            else if(player == 2){
                var rightCellRow = row + 1;
                var rightCellCol = col - 1;
        
                var leftCellRow = row + 1;
                var leftCellCol = col + 1;
                
                for(var key in this.allCellsMap){
                    this.allCellsMap[key].showPlayer2Option = false;
                    this.allCellsMap[key].isEatOptionCell = false;
                }

                if(rightCellRow <= 8 && rightCellCol > 0){
                    if(this.allCellsMap[rightCellRow + '_' + rightCellCol].status == 'E'){
                        this.allCellsMap[(rightCellRow) + '_' + (rightCellCol)].showPlayer2Option = true;
                    }
                    else if(this.allCellsMap[rightCellRow + '_' + rightCellCol].status == 'P1') {
                        if(rightCellRow + 1 <= 8
                            && rightCellCol - 1 > 0
                            && this.allCellsMap[(rightCellRow + 1) + '_' + (rightCellCol - 1)].status == 'E'){
                            this.allCellsMap[(rightCellRow + 1) + '_' + (rightCellCol - 1)].showPlayer2Option = true;
                            this.allCellsMap[(rightCellRow + 1) + '_' + (rightCellCol - 1)].isEatOptionCell = true;
                        }
                    }
                }
               
                if(leftCellRow <= 8 && leftCellCol <= 8){
                    if(this.allCellsMap[leftCellRow+ '_' + leftCellCol].status == 'E'){
                        this.allCellsMap[(leftCellRow) + '_' + (leftCellCol)].showPlayer2Option = true;
                    }
                    else if(this.allCellsMap[leftCellRow + '_' + leftCellCol].status == 'P1') {
                        if(leftCellRow + 1 <= 8
                            && leftCellCol + 1 <= 8
                            && this.allCellsMap[(leftCellRow + 1)  + '_' + (leftCellCol + 1)].status == 'E'){
                            
                            this.allCellsMap[(leftCellRow + 1) + '_' + (leftCellCol + 1)].showPlayer2Option = true;
                            this.allCellsMap[(leftCellRow + 1) + '_' + (leftCellCol + 1)].isEatOptionCell = true;
                        }
                    }
                }
            }
        }
    }

    optionalCellClicked(event){

        var player = event.target.dataset.player;
        var row = Number(event.target.dataset.row);
        var col = Number(event.target.dataset.col);

        var isEatMove = this.allCellsMap[row + '_' + col].isEatOptionCell;

        if(this.clickedOptions.indexOf(row + '_' + col) == -1){
            this.clickedOptions = this.clickedOptions == '' ? (row + '_' + col) : (this.clickedOptions + ',' + row + '_' + col);
        }

        for(var key in this.allCellsMap){
            this.allCellsMap[key].showPlayer1Option = false;
            this.allCellsMap[key].showPlayer2Option = false;
            this.allCellsMap[key].isEatOptionCell = false;
        }
        
        if(isEatMove && this.canEatMore(player, row, col)){
            if(player == 1){
                this.allCellsMap[row + '_' + col].showPlayer1Option = true;
            }
            else if(player == 2){
                this.allCellsMap[row + '_' + col].showPlayer2Option = true;
            }
            this.allCellsMap[row + '_' + col].isEatPrev = true;
        }
        else{
            isEatMove = isEatMove ||  this.allCellsMap[row + '_' + col].isEatPrev;
            this.allCellsMap[row + '_' + col].isEatPrev = false;
          
            moveTool({
                gameId : this.recordId, 
                playerNum : player, 
                fromCell : (this.clickedToolRow + '_' + this.clickedToolCol), 
                toCells : this.clickedOptions, 
                isEatMove : isEatMove}).then(
                
                    result =>{
                        this.gameRecord = result;
        
                        this.loadGameData();
                    }
            ).catch(error => {
                    console.log('error' + error);
            });
        }
    }


    canEatMore(player, row, col){
        var canEat = false;
        var otherPlayer = player == 1 ? '2' : '1';
        
        if(this.allCellsMap[this.clickedToolRow + '_' + this.clickedToolCol].isKing){

            if(this.allCellsMap[row + '_' + col].ignoreDirection != 'UL'
                && this.isKingCanEat(player, otherPlayer, row, col, 'U', 'L')){
                canEat = true;
            }
            if(this.allCellsMap[row + '_' + col].ignoreDirection != 'UR'
                && this.isKingCanEat(player, otherPlayer, row, col, 'U', 'R')){
                canEat = true;
            }
            if(this.allCellsMap[row + '_' + col].ignoreDirection != 'DL'
                && this.isKingCanEat(player, otherPlayer, row, col, 'D', 'L')){
                canEat = true;
            }
            if(this.allCellsMap[row + '_' + col].ignoreDirection != 'DR'
                && this.isKingCanEat(player, otherPlayer, row, col, 'D', 'R')){
                canEat = true;
            }
        }
        else{
            if(this.canEatCell(player, otherPlayer, row + 1, col + 1, row + 2, col + 2)){
                canEat = true;
            }
            if(this.canEatCell(player, otherPlayer, row + 1, col - 1, row + 2, col - 2)){
                canEat = true;
            }
            if(this.canEatCell(player, otherPlayer, row - 1, col + 1, row - 2, col +2)){
                canEat = true;
            }
            if(this.canEatCell(player, otherPlayer, row - 1, col - 1, row -2, col - 2)){
                canEat = true;
            }
        }
        
        return canEat;
    }
    
    canEatCell(player, otherPlayer, checkRow, checkCol, cellBeyondRow, cellBeyondCol){
        var canEat = false;
    
        console.log('checkRow cell....' + checkRow + ':' + checkCol );
    
        if(checkRow <= 8 && checkRow > 0 && checkCol <= 8 && checkCol > 0){
            
            if(this.allCellsMap[checkRow + '_' + checkCol].status == 'P' + otherPlayer) {
                console.log('belong cell....' + cellBeyondRow + ':' + cellBeyondCol );
                
                if(this.clickedOptions.indexOf(cellBeyondRow + '_' + cellBeyondCol) == -1
                    && cellBeyondRow <= 8 && cellBeyondRow > 0
                    && cellBeyondCol <= 8 && cellBeyondCol > 0 
                    && this.allCellsMap[cellBeyondRow + '_' + cellBeyondCol].status == 'E'){
                    
                    if(player == 1){
                        this.allCellsMap[cellBeyondRow + '_' + cellBeyondCol].showPlayer1Option = true;
                    }
                    else if(player == 2){
                        this.allCellsMap[cellBeyondRow + '_' + cellBeyondCol].showPlayer2Option = true;
                    }
                    this.allCellsMap[cellBeyondRow + '_' + cellBeyondCol].isEatOptionCell = true;

                    canEat = true;
                }
            }
        }
    
        return canEat;
    }

    isKingCanEat(playerNum, opponent, row, col, dirVert, dirHorz){
        var isKingCanEat = false;
        
        var checkRow = dirVert == 'U' ? row - 1 : row + 1;
        var checkCol = dirHorz == 'L' ? col - 1 : col + 1;
        var prevCellWasOpponent = false;
        var stopLoop = false;
        var oppositeDir = (dirVert == 'U' ? 'D' : 'U') + (dirHorz == 'L' ? 'R' : 'L');
            
        while(stopLoop == false && checkRow > 0 && checkRow <=8 && checkCol > 0 && checkCol <= 8) {
            
            console.log('checking cell: ' + checkRow + '_' + checkCol);
            
            if(this.allCellsMap[checkRow + '_' + checkCol].status == ('P' + playerNum)){
                console.log('player cell: ');
            
                stopLoop = true;
            }
            else if(this.allCellsMap[checkRow + '_' + checkCol].status == ('P' + opponent)){
                console.log('opponent cell: ');
            
                if(prevCellWasOpponent){
                    stopLoop = true;
                }
                else{
                    prevCellWasOpponent = true;
                }
            }
            else {  //cell is empty
                console.log('empty cell: ');
            
                if(prevCellWasOpponent){
                    isKingCanEat = true;
                    if(playerNum == 1){
                        this.allCellsMap[checkRow + '_' + checkCol].showPlayer1Option = true;
                    }
                    else if(playerNum == 2){
                        this.allCellsMap[checkRow + '_' + checkCol].showPlayer2Option = true;
                    }

                    console.log('adding ignore to row/col: ' + checkRow + '_' + checkCol);
                    console.log('oppositeDir: ' + oppositeDir);

                    this.allCellsMap[checkRow + '_' + checkCol].isEatOptionCell = true;
                    this.allCellsMap[checkRow + '_' + checkCol].ignoreDirection = oppositeDir;
                }
            }
                
            checkRow = dirVert == 'U' ? checkRow - 1 : checkRow + 1;
            checkCol = dirHorz == 'L' ? checkCol - 1 : checkCol + 1;
        }
            
            
        return isKingCanEat;
    }



    loadGameData(){
        console.log('this.gameRecord :' + JSON.stringify(this.gameRecord));
        this.gameTitle = (this.gameRecord.Player_1__c == undefined ? '' : this.gameRecord.Player_1__r.Name) + ' VS ' + (this.gameRecord.Player_2__c == undefined ? '' : this.gameRecord.Player_2__r.Name);

        this.isTurnUser1 = this.gameRecord.Player_Turn__c == 'P1';
        this.isCurrentUserIsP1 = this.gameRecord.Player_1__c == currentUserId;
        this.isCurrentUserIsP2 = this.gameRecord.Player_2__c == currentUserId;

        this.isCurrentUserViewer = this.isCurrentUserIsP1 == false && this.isCurrentUserIsP2 == false;

        this.p1Tools = this.gameRecord.Player_1_Tools__c == undefined ? [] : JSON.parse(this.gameRecord.Player_1_Tools__c);
        this.p2Tools = this.gameRecord.Player_2_Tools__c == undefined ? [] : JSON.parse(this.gameRecord.Player_2_Tools__c);

        this.allCellsMap = {};
        this.boardRows = [];
        this.movementsLogs = [];

        if(this.gameRecord.Movement_Log__c != undefined){
            var allMovements = JSON.parse(this.gameRecord.Movement_Log__c);

            for(var moveIndex in allMovements){
                this.movementsLogs.push({
                    'index' : allMovements[moveIndex].index,
                    'player1Move' : allMovements[moveIndex].player1Move,
                    'player2Move': allMovements[moveIndex].player2Move
                });
            }
        }

        if(this.isCurrentUserIsP2 == false){
            
            this.mainUserName = this.gameRecord.Player_1__c == undefined ? '' : this.gameRecord.Player_1__r.Name;
            this.mainUserPhotoURL = this.gameRecord.Player_1__c == undefined ? '' : this.gameRecord.Player_1__r.SmallPhotoUrl;
            this.mainUserCss = (this.gameRecord.Player_Turn__c == 'P1') ? 'playerImgBorder' : '';
            this.opponentUserName = this.gameRecord.Player_2__c == undefined ? '' : this.gameRecord.Player_2__r.Name;
            this.opponentUserPhotoURL = this.gameRecord.Player_2__c == undefined ? '' : this.gameRecord.Player_2__r.SmallPhotoUrl;
            this.opponentUserCss = (this.gameRecord.Player_Turn__c == 'P2') ? 'playerImgBorder' : '';
        
            for(var rowIndex = 1; rowIndex <= 8; rowIndex++){
                var boardRow = {
                    'rowNumber' : rowIndex
                };
                var boardRowCells = [];

                for(var colIndex = 1; colIndex <=8; colIndex++){
                    var keyCell = rowIndex + '_' + colIndex;

                    var newCell = {
                        'keyCell' : keyCell,
                        'rowNumber' : rowIndex,
                        'colNumber' : colIndex,
                        'status' : (this.p1Tools[keyCell] != undefined ? 'P1' : (this.p2Tools[keyCell] != undefined ? 'P2' : 'E')),
                        'isPlayer1Status' : this.p1Tools[keyCell] != undefined,
                        'isPlayer2Status' : this.p2Tools[keyCell] != undefined,
                        'showPlayer1Option' : false,
                        'showPlayer2Option' : false,
                        'isEatOptionCell' : false,
                        'isEatPrev' : false,
                        'ignoreDirection' : '',
                        'classStlye' : ((colIndex + rowIndex) % 2 != 0 ? 'evenbg' : 'oddbg')
                    };
                    
                    newCell.isKing = (newCell.status == 'P1' && this.p1Tools[keyCell].toolType === 'K')
                        || (newCell.status == 'P2' && this.p2Tools[keyCell].toolType === 'K');

                    boardRowCells.push(newCell);
                    this.allCellsMap[keyCell] = newCell;
                }

                boardRow['rowCells'] = boardRowCells;
                this.boardRows.push(boardRow);
            }
        }
        else{ //user 2 
            this.mainUserName = this.gameRecord.Player_2__c == undefined ? '' : this.gameRecord.Player_2__r.Name;
            this.mainUserPhotoURL = this.gameRecord.Player_2__c == undefined ? '' : this.gameRecord.Player_2__r.SmallPhotoUrl;
            this.mainUserCss = (this.gameRecord.Player_Turn__c == 'P2') ? 'playerImgBorder' : '';
            this.opponentUserName = this.gameRecord.Player_1__c == undefined ? '' : this.gameRecord.Player_1__r.Name;
            this.opponentUserPhotoURL = this.gameRecord.Player_1__c == undefined ? '' : this.gameRecord.Player_1__r.SmallPhotoUrl;
            this.opponentUserCss = (this.gameRecord.Player_Turn__c == 'P1') ? 'playerImgBorder' : '';


            for(var rowIndex = 8; rowIndex >= 1; rowIndex--){
                var boardRow = {
                    'rowIndex' : rowIndex
                };
                var boardRowCells = [];

                for(var colIndex = 8; colIndex >=1; colIndex--){
                    var keyCell = rowIndex + '_' + colIndex;

                    var newCell = {
                        'keyCell' : keyCell,
                        'rowNumber' : rowIndex,
                        'colNumber' : colIndex,
                        'status' : (this.p1Tools[keyCell] != undefined ? 'P1' : (this.p2Tools[keyCell] != undefined ? 'P2' : 'E')),
                        'isPlayer1Status' : this.p1Tools[keyCell] != undefined,
                        'isPlayer2Status' : this.p2Tools[keyCell] != undefined,
                        'showPlayer1Option' : false,
                        'showPlayer2Option' : false,
                        'isEatOptionCell' : false,
                        'isEatPrev' : false,
                        'ignoreDirection' : '',
                        'classStlye' : ((colIndex + rowIndex) % 2 != 0 ? 'evenbg' : 'oddbg')
                    };
                    
                    newCell.isKing = (newCell.status == 'P1' && this.p1Tools[keyCell].toolType === 'K')
                        || (newCell.status == 'P2' && this.p2Tools[keyCell].toolType === 'K');

                    boardRowCells.push(newCell);
                    this.allCellsMap[keyCell] = newCell;
                }

                boardRow['rowCells'] = boardRowCells;
                this.boardRows.push(boardRow);
            }
        }

        
        //If it is not the player turn, listen to event
        if((this.isTurnUser1 === false && this.isCurrentUserIsP1 === true)
            || (this.isTurnUser1 === true && this.isCurrentUserIsP2 === true)
            || (this.isCurrentUserViewer)) {

            /*const gameEventHandler = (response) => {
                if(response.data.payload.GameId__c == this.recordId){
                    getGameData({gameId: this.recordId}).then(
                        result =>{
                            this.gameRecord = result;
                            this.loadGameData();
                        }
                    ).catch(error => {
                            console.log('error' + error);
                    });
                }
            }

            subscribe('/event/Game_Played__e', -1, gameEventHandler).then(response => {
                console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
            });
            */
                
            console.log('STARTING TIMER');
            //start timer
            var interval = setInterval(function(){
                
                var expectingNextTurn = this.isTurnUser1 ? 'P2' : 'P1';
                
                getGameData({gameId: this.recordId}).then(
                    result =>{
                        console.log('result TIMER: ' + result);

                        var updatedGame = result;

                        console.log('updatedGame.Player_Turn__c TIMER: ' + updatedGame.Player_Turn__c);

                        if(updatedGame.Player_Turn__c === expectingNextTurn) {
                            clearInterval(interval);

                            this.gameRecord = result;
                            this.loadGameData();
                        }
                    }
                ).catch(error => {
                        console.log('error' + error);
                });

            }.bind(this), 3000);
        }

    }

    findKingOptions(player, row, col){
        var opponent = player == 1 ? '2' : '1';
        
        this.findKingOptionDir(player, opponent, row, col, 'U', 'L');
        this.findKingOptionDir(player, opponent, row, col, 'U', 'R');
        this.findKingOptionDir(player, opponent, row, col, 'D', 'L');
        this.findKingOptionDir(player, opponent, row, col, 'D', 'R');
    }
    
    findKingOptionDir(player, opponent, row, col, dirVert, dirHorz){

        var checkRow = dirVert == 'U' ? row - 1 : row + 1;
        var checkCol = dirHorz == 'L' ? col - 1 : col + 1;
        var prevCellWasOpponent = false;
        var prevCellWasEmpty = false;
        var stopLoop = false;
        var oppositeDir = (dirVert == 'U' ? 'D' : 'U') + (dirHorz == 'L' ? 'R' : 'L');
        
        while(stopLoop == false && checkRow > 0 && checkRow <=8 && checkCol > 0 && checkCol <= 8) {
        
            if(this.allCellsMap[checkRow + '_' + checkCol].status == ('P' + player)){
                stopLoop = true;
            }
            else if(this.allCellsMap[checkRow + '_' + checkCol].status == ('P' + opponent)){
                if(prevCellWasOpponent){
                    stopLoop = true;
                }
                else{
                    prevCellWasOpponent = true;
                }
            }
            else {  //cell is empty
                if(player == 1){
                    this.allCellsMap[checkRow + '_' + checkCol].showPlayer1Option = true;
                }
                else if(player == 2){
                    this.allCellsMap[checkRow + '_' + checkCol].showPlayer2Option = true;
                }

                if(prevCellWasOpponent) {
                    this.allCellsMap[checkRow + '_' + checkCol].isEatOptionCell = true;
                    this.allCellsMap[checkRow + '_' + checkCol].ignoreDirection = oppositeDir;
                }
            }
            
            checkRow = dirVert == 'U' ? checkRow - 1 : checkRow + 1;
            checkCol = dirHorz == 'L' ? checkCol - 1 : checkCol + 1;
        }
    }
}