public with sharing class PlayGameControllerLWC{
    
    public class RowBoard {
        public integer rowNumber {get; set;}
        public list<CellBoard> l_cells {get; set;}
        
        public RowBoard(integer rowNumberInp){
            rowNumber = rowNumberInp;
            l_cells = new list<CellBoard>();
        }
    }
    
    public class CellBoard {
        public String cellIndexId {get; set;}
        public integer rowNumber {get; set;}
        public integer colNumber {get; set;}
        public String status {get; set;}        //E (empty), P1 (player1), P2 (player2)
        public Boolean isKing {get; set;}
        public Boolean isEven {get; set;}
        
        public CellBoard(integer rowNumberInp, integer colNumberInp, String statusInp){
            cellIndexId = rowNumberInp + '_' + colNumberInp;
            rowNumber = rowNumberInp;
            colNumber = colNumberInp;
            status = statusInp;
            isEven = math.mod(colNumberInp + rowNumber, 2) != 0;
            isKing = false;
        }
    }
    
    public class PlayerTool {
        public String toolType {get; set;}
        public String toolStatus {get; set;}        //p (playing) d (dead)
        public Integer rowNumber {get; set;}
        public Integer colNumber {get; set;}
    }
    
    public class MovementItem implements Comparable{
        public Integer index {get; set;}
        public String player1Move {get; set;}
        public String player2Move {get; set;}
        
        public MovementItem (Integer indexInp){
            index = indexInp; 
        }
        
        public void setPlayerMove(Integer playerNumber, String movement){
            if(playerNumber == 1){
                player1Move = movement;
            }
            else if(playerNumber == 2){
                player2Move = movement;
            }
        }
        
        public void setPlayerBurn(Integer playerNumber, set<String> s_burn){
            if(playerNumber == 1){
                player1Move += '<br/>[B: ' + String.valueOf(s_burn) + ']';
            }
            else if(playerNumber == 2){
                player2Move += '<br/>[B: ' + String.valueOf(s_burn) + ']';
            }
        }
        
        public Integer compareTo(Object compareTo) {
            MovementItem compareToItem = (MovementItem) compareTo;
        
            return compareToItem.index > index ? 1 : -1;
        }
    }
    
    
    
    
    
    
    
    
    
    
    @AuraEnabled
    public static Game__c getGameData(String gameId){
        Game__c retGameRecord = [select Id,Name,Status__c,Game_Summary__c,Player_Turn__c,Player_1__c,Player_1__r.Name,Player_1__r.SmallPhotoUrl,Player_2__c,Player_2__r.Name,Player_2__r.SmallPhotoUrl,Player_1_Tools__c,Player_2_Tools__c,Movement_Log__c from Game__c where Id = :gameId];
        
        return retGameRecord;
    }
    
    @AuraEnabled
    public static Game__c moveTool(
        String gameId,
        Integer playerNum,
        String fromCell,
        String toCells,
        Boolean isEatMove){
        
        Game__c gameRecord = getGameData(gameId);
        
        Boolean isCurrentUser1 = gameRecord.Player_1__c == UserInfo.getUserId();
        Boolean isCurrentUser2 = gameRecord.Player_2__c == UserInfo.getUserId();
    
        list<MovementItem> l_movementItems = String.isBlank(gameRecord.Movement_Log__c) ? new list<MovementItem>() 
                                    : (list<MovementItem>) JSON.deserialize(gameRecord.Movement_Log__c, list<MovementItem>.class);
        
        map<String, PlayerTool> p1Tools = String.isBlank(gameRecord.Player_1_Tools__c) ? new map<String, PlayerTool>()
                                    : (map<String, PlayerTool>) JSON.deserialize(gameRecord.Player_1_Tools__c, map<String, PlayerTool>.class);
        
        map<String, PlayerTool> p2Tools = String.isBlank(gameRecord.Player_2_Tools__c) ? new map<String, PlayerTool>()
                                    : (map<String, PlayerTool>) JSON.deserialize(gameRecord.Player_2_Tools__c, map<String, PlayerTool>.class);
        
        
        map<String, CellBoard> allCellsMap = new map<String, CellBoard>();
        
        if(! isCurrentUser2){                          
            for(integer rowIndex = 1; rowIndex <= 8; rowIndex ++){
                RowBoard rBoard = new RowBoard(rowIndex);
            
                for(integer colIndex = 1; colIndex <= 8; colIndex ++){
                    String keyCell = rowIndex + '_' + colIndex;
                    
                    CellBoard newCell = new CellBoard(
                        rowIndex, 
                        colIndex, 
                        p1Tools.containsKey(keyCell) ? 'P1' : (p2Tools.containsKey(keyCell) ? 'P2' : 'E'));
                    
                    if((newCell.status == 'P1' && p1Tools.get(keyCell).toolType == 'K')
                        || (newCell.status == 'P2' && p2Tools.get(keyCell).toolType == 'K')){
                        newCell.isKing = true;
                    }
                    
                    allCellsMap.put(keyCell, newCell);
                }
            }
        }
        else{
            for(integer rowIndex = 8; rowIndex >= 1; rowIndex --){
                RowBoard rBoard = new RowBoard(rowIndex);
            
                for(integer colIndex = 8; colIndex >= 1; colIndex --){
                    String keyCell = rowIndex + '_' + colIndex;
                
                    CellBoard newCell = new CellBoard(
                        rowIndex, 
                        colIndex, 
                        p1Tools.containsKey(keyCell) ? 'P1' : (p2Tools.containsKey(keyCell) ? 'P2' : 'E'));
                    
                    if((newCell.status == 'P1' && p1Tools.get(keyCell).toolType == 'K')
                        || (newCell.status == 'P2' && p2Tools.get(keyCell).toolType == 'K')){
                        newCell.isKing = true;
                    }
                    
                    allCellsMap.put(keyCell, newCell);
                }
            }
        }
        
        
        
        
        
        map<String, PlayerTool> pTools = playerNum == 1 ? p1Tools : p2Tools;
        
        list<String> l_toCells = toCells.split(',');
        set<String> s_eatenCells = new set<String>();
        
        if(playerNum == 1){
            l_movementItems.add(new MovementItem (l_movementItems.size() + 1));
        }
        l_movementItems.get(l_movementItems.size() - 1).setPlayerMove(playerNum, fromCell+ ' >> ' + toCells);
        
        System.debug('fromCell  :: '  + fromCell );
        System.debug('toCells :: '  + toCells );
        System.debug('isEatMove :: ' + isEatMove );
        
        Boolean isAlreadyKing = false;
        Boolean movementToolWasBurn = false;
        
        //If user did not eat anyhing, checking if tools that had option to eat should be burn
        if(isEatMove == false){
            set<String> s_burnTools = checkForBurnTools(playerNum, pTools, allCellsMap);
               
            if(! s_burnTools.isEmpty()){
                l_movementItems.get(l_movementItems.size() - 1).setPlayerBurn(playerNum, s_burnTools);
                
                if(s_burnTools.contains(fromCell)){
                    movementToolWasBurn = true;
                }
            }
        }
        
        gameRecord.Movement_Log__c = JSON.serialize(l_movementItems);
        
        if(movementToolWasBurn == false){        /*NOT SURE IF THIS IS CORRECT???*/
        
            for(String nextToCell : l_toCells){
                Integer fromRow = Integer.valueOf(fromCell.substringBefore('_'));
                Integer fromCol = Integer.valueOf(fromCell.substringAfter('_'));
                Integer toRow = Integer.valueOf(nextToCell.substringBefore('_'));
                Integer toCol = Integer.valueOf(nextToCell.substringAfter('_'));
                    
                System.debug('fromRow :: '  + fromRow );
                System.debug('fromCol :: '  + fromCol );
                System.debug('toRow :: '  + toRow );
                System.debug('toCol :: '  + toCol );
            
            
                movePlayerTool(playerNum, fromCell, nextToCell, toRow, toCol, pTools, allCellsMap);
                
                ///Check if some tool was eating
                if(isEatMove) {
                    while(fromRow != toRow){
                        fromRow = fromRow < toRow ? (fromRow + 1) : (fromRow - 1);
                        fromCol = fromCol < toCol ? (fromCol + 1) : (fromCol - 1);
                            
                        if(playerNum == 1){
                            if(p2Tools.containsKey(fromRow + '_' + fromCol)){
                                p2Tools.remove(fromRow + '_' + fromCol);
                                
                                allCellsMap.get(fromRow + '_' + fromCol).status = 'E';
                            }
                        }
                        else{
                            if(p1Tools.containsKey(fromRow + '_' + fromCol)){
                                p1Tools.remove(fromRow + '_' + fromCol);
                                
                                allCellsMap.get(fromRow + '_' + fromCol).status = 'E';
                            }
                        }
                    }
                }
                
                fromCell = nextToCell;
            }
        }
        
        //Check if game completed
        if(p1Tools.isEmpty()){
            gameRecord.Status__c = 'Completed';
            gameRecord.Game_Summary__c = gameRecord.Player_2__r.Name + ' won';
        }
        else if(p2Tools.isEmpty()){
            gameRecord.Status__c = 'Completed';
            gameRecord.Game_Summary__c = gameRecord.Player_1__r.Name + ' won';
        }
        else if(anyValidMovement(playerNum, pTools, allCellsMap) == false){    //Check if the next player have any valid movement. If not it is a draw
            
            gameRecord.Status__c = 'Completed';
            gameRecord.Game_Summary__c = 'Draw. ' + (playerNum == 1 ? gameRecord.Player_2__r.Name : gameRecord.Player_1__r.Name) + ' does not left any valid movements';
        }
        
        gameRecord.Player_1_Tools__c = JSON.serialize(p1Tools);
        gameRecord.Player_2_Tools__c = JSON.serialize(p2Tools);
        gameRecord.Player_Turn__c = gameRecord.Status__c == 'Completed' ? 'N' : (playerNum == 1 ? 'P2' : 'P1');
        
        //Should save the player status after each move!!!
        update gameRecord;
        
        return gameRecord;
    }
    
    //move player tool 1 move
    private static void movePlayerTool(
        Integer playerNum, 
        String fromCell, 
        String toCell, 
        Integer toRow, 
        Integer toCol,
        map<String, PlayerTool> pTools, 
        map<String, CellBoard> allCellsMap){
    
        Boolean isAlreadyKing = pTools.get(fromCell).toolType == 'K';
            
        pTools.put(toCell, pTools.get(fromCell));
        pTools.remove(fromCell);
        
        allCellsMap.get(fromCell).status = 'E';
        allCellsMap.get(toCell).status = 'P' + playerNum;
        
        pTools.get(toCell).rowNumber = toRow;
        pTools.get(toCell).colNumber = toCol;
        
        //become king?
        if(((toRow == 1 && playerNum == 1) || (toRow == 8 && playerNum == 2)) || isAlreadyKing){
            pTools.get(toCell).toolType = 'K';
            allCellsMap.get(toCell).isKing = true;
        }
        else{
            allCellsMap.get(toCell).isKing = false;
        }
    }
    
    //Check if there were any tools that had option to eat but did not eat
    private static set<String> checkForBurnTools(Integer playerNum, map<String, PlayerTool> pTools, map<String, CellBoard> allCellsMap){
    
        Integer opponent = playerNum == 1 ? 2 : 1;
        set<String> s_burnTools = new set<String>();
        
        for(PlayerTool tool : pTools.values()){
        
            if(tool.toolType == 'K'){
                if(isKingCanEat(playerNum, opponent, tool.rowNumber, tool.colNumber, 'U', 'L', allCellsMap)){
                    burnTool(playerNum, tool.rowNumber, tool.colNumber, pTools, allCellsMap);
                    s_burnTools.add(tool.rowNumber + '_' + tool.colNumber);
                }
                else if(isKingCanEat(playerNum, opponent, tool.rowNumber, tool.colNumber, 'U', 'L', allCellsMap)){
                    burnTool(playerNum, tool.rowNumber, tool.colNumber, pTools, allCellsMap);
                    s_burnTools.add(tool.rowNumber + '_' + tool.colNumber);
                }
                else if(isKingCanEat(playerNum, opponent, tool.rowNumber, tool.colNumber, 'D', 'L', allCellsMap)){
                    burnTool(playerNum, tool.rowNumber, tool.colNumber, pTools, allCellsMap);
                    s_burnTools.add(tool.rowNumber + '_' + tool.colNumber);
                }
                else if(isKingCanEat(playerNum, opponent, tool.rowNumber, tool.colNumber, 'D', 'R', allCellsMap)){
                    burnTool(playerNum, tool.rowNumber, tool.colNumber, pTools, allCellsMap);
                    s_burnTools.add(tool.rowNumber + '_' + tool.colNumber);
                }
            }
            else{   //Tool is not a king
                Integer nextRow = playerNum == 1 ? (tool.rowNumber - 1) : (tool.rowNumber + 1);
                Integer nextNextRow = playerNum == 1 ? (tool.rowNumber - 2) : (tool.rowNumber + 2);
                
                if(nextNextRow > 0 && nextNextRow <= 8 && tool.colNumber -2 > 0){
                    
                    if(allCellsMap.get(nextRow + '_' + (tool.colNumber - 1)).status == ('P' + opponent)) {
                        if(allCellsMap.get(nextNextRow + '_' + (tool.colNumber - 2)).status == 'E') {
                            burnTool(playerNum, tool.rowNumber, tool.colNumber, pTools, allCellsMap);
                            s_burnTools.add(tool.rowNumber + '_' + tool.colNumber);
                        }
                    }
                }
                
                if(nextNextRow > 0 && nextNextRow <= 8 && tool.colNumber + 2 <= 8){
                    if(allCellsMap.get(nextRow + '_' + (tool.colNumber + 1)).status == ('P' + opponent)) {
                        if(allCellsMap.get(nextNextRow + '_' + (tool.colNumber + 2)).status == 'E') {
                            burnTool(playerNum, tool.rowNumber, tool.colNumber, pTools, allCellsMap);
                            s_burnTools.add(tool.rowNumber + '_' + tool.colNumber);
                        }
                    }
                }
            }
        }
        
        return s_burnTools;
    }
    
    //Burn tool that had option to eat but did not eat
    private static void burnTool(Integer playerNum, Integer row, Integer col, map<String, PlayerTool> pTools, map<String, CellBoard> allCellsMap){
        allCellsMap.get(row + '_' + col).status = 'E';
        pTools.remove(row + '_' + col);
    }
    
    //Special logic to check if king tool had option to eat in specific direction
    private static Boolean isKingCanEat(
        Integer playerNum, Integer opponent, Integer row, Integer col, String dirVert, String dirHorz, map<String, CellBoard> allCellsMap){
    
        Boolean isKingCanEat = false;
    
        Integer checkRow = dirVert == 'U' ? row - 1 : row + 1;
        Integer checkCol = dirHorz == 'L' ? col - 1 : col + 1;
        Boolean prevCellWasOpponent = false;
        Boolean stopLoop = false;
        
        while(stopLoop == false && checkRow > 0 && checkRow <=8 && checkCol > 0 && checkCol <= 8) {
        
            if(allCellsMap.get(checkRow + '_' + checkCol).status == ('P' + playerNum)){
                stopLoop = true;
            }
            else if(allCellsMap.get(checkRow + '_' + checkCol).status == ('P' + opponent)){
                if(prevCellWasOpponent){
                    stopLoop = true;
                }
                else{
                    prevCellWasOpponent = true;
                }
            }
            else {  //cell is empty
                if(prevCellWasOpponent){
                    isKingCanEat = true;
                    stopLoop = true;
                }
            }
            
            checkRow = dirVert == 'U' ? checkRow - 1 : checkRow + 1;
            checkCol = dirHorz == 'L' ? checkCol - 1 : checkCol + 1;
        }
        
        
        return isKingCanEat;
    }
    
    //Check if player have any valid moves left
    private static boolean anyValidMovement(Integer playerNum, map<String, PlayerTool> pTools, map<String, CellBoard> allCellsMap){
        
        Integer opponent = playerNum == 1 ? 2 : 1;
        
        for(PlayerTool tool : pTools.values()){
                    
            if(tool.toolType == 'K'){
                if(isKingCanMove(playerNum, opponent, tool.rowNumber, tool.colNumber, 'U', 'L', allCellsMap)){
                    return true;
                }
                else if(isKingCanMove(playerNum, opponent, tool.rowNumber, tool.colNumber, 'U', 'L', allCellsMap)){
                    return true;
                }
                else if(isKingCanMove(playerNum, opponent, tool.rowNumber, tool.colNumber, 'D', 'L', allCellsMap)){
                    return true;
                }
                else if(isKingCanMove(playerNum, opponent, tool.rowNumber, tool.colNumber, 'D', 'R', allCellsMap)){
                    return true;
                }
            }
            else{   //Tool is not a king
                Integer nextRow = playerNum == 1 ? (tool.rowNumber - 1) : (tool.rowNumber + 1);
                Integer nextNextRow = playerNum == 1 ? (tool.rowNumber - 2) : (tool.rowNumber + 2);
                
                if(nextRow > 0 && nextRow <= 8 && tool.colNumber - 1 > 0){
                    if(allCellsMap.get(nextRow + '_' + (tool.colNumber - 1)).status == 'E') {
                        return true;
                    }
                    else if(allCellsMap.get(nextRow + '_' + (tool.colNumber - 1)).status == ('P' + opponent)) {
                        if(nextNextRow > 0 && nextNextRow <= 8 && tool.colNumber - 2 > 0){
                            if(allCellsMap.get(nextNextRow + '_' + (tool.colNumber - 2)).status == 'E') {
                                return true;
                            }
                        }
                    }
                }
                
                if(nextRow > 0 && nextRow <= 8 && tool.colNumber + 1 <= 8){
                    if(allCellsMap.get(nextRow + '_' + (tool.colNumber + 1)).status == 'E') {
                        return true;
                    }
                    else if(allCellsMap.get(nextRow + '_' + (tool.colNumber + 1)).status == ('P' + opponent)) {
                        if(nextNextRow > 0 && nextNextRow <= 8 && tool.colNumber + 2 <= 8){
                            if(allCellsMap.get(nextNextRow + '_' + (tool.colNumber + 2)).status == 'E') {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    //Special logic to check if king tool had option to move
    private static Boolean isKingCanMove(
        Integer playerNum, Integer opponent, Integer row, Integer col, String dirVert, String dirHorz, map<String, CellBoard> allCellsMap){
    
        Boolean isKingCanMove = false;
    
        Integer checkRow = dirVert == 'U' ? row - 1 : row + 1;
        Integer checkCol = dirHorz == 'L' ? col - 1 : col + 1;
        Boolean prevCellWasOpponent = false;
        Boolean stopLoop = false;
        
        while(stopLoop == false && checkRow > 0 && checkRow <=8 && checkCol > 0 && checkCol <= 8) {
        
            if(allCellsMap.get(checkRow + '_' + checkCol).status == ('P' + playerNum)){
                stopLoop = true;
            }
            else if(allCellsMap.get(checkRow + '_' + checkCol).status == ('P' + opponent)){
                if(prevCellWasOpponent){
                    stopLoop = true;
                }
                else{
                    prevCellWasOpponent = true;
                }
            }
            else {  //cell is empty
                isKingCanMove = true;
                stopLoop = true;
            }
            
            checkRow = dirVert == 'U' ? checkRow - 1 : checkRow + 1;
            checkCol = dirHorz == 'L' ? checkCol - 1 : checkCol + 1;
        }
        
        
        return isKingCanMove;
    }
}