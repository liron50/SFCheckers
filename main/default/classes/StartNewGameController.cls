public with sharing class StartNewGameController {


    @AuraEnabled
    public static String startGame(String userToolSelection){
    
        Game__c newGame = new Game__c(
            Type__c = 'Checkers',
            Status__c = 'New',
            Player_Turn__c = 'P1',
            Player_1_Tools__c = '{"8_1":{"toolType":"R","rowNumber":"8","colNumber":"1","toolStatus":"p"},"8_3":{"toolType":"R","rowNumber":"8","colNumber":"3","toolStatus":"p"},"8_5":{"toolType":"R","rowNumber":"8","colNumber":"5","toolStatus":"p"},"8_7":{"toolType":"R","rowNumber":"8","colNumber":"7","toolStatus":"p"},"7_2":{"toolType":"R","rowNumber":"7","colNumber":"2","toolStatus":"p"},"7_4":{"toolType":"R","rowNumber":"7","colNumber":"4","toolStatus":"p"},"7_6":{"toolType":"R","rowNumber":"7","colNumber":"6","toolStatus":"p"},"7_8":{"toolType":"R","rowNumber":"7","colNumber":"8","toolStatus":"p"},"6_1":{"toolType":"R","rowNumber":"6","colNumber":"1","toolStatus":"p"},"6_3":{"toolType":"R","rowNumber":"6","colNumber":"3","toolStatus":"p"},"6_5":{"toolType":"R","rowNumber":"6","colNumber":"5","toolStatus":"p"},"6_7":{"toolType":"R","rowNumber":"6","colNumber":"7","toolStatus":"p"}}',
            Player_2_Tools__c = '{"1_2":{"toolType":"R","rowNumber":"1","colNumber":"2","toolStatus":"p"},"1_4":{"toolType":"R","rowNumber":"1","colNumber":"4","toolStatus":"p"},"1_6":{"toolType":"R","rowNumber":"1","colNumber":"6","toolStatus":"p"},"1_8":{"toolType":"R","rowNumber":"1","colNumber":"8","toolStatus":"p"},"2_1":{"toolType":"R","rowNumber":"2","colNumber":"1","toolStatus":"p"},"2_3":{"toolType":"R","rowNumber":"2","colNumber":"3","toolStatus":"p"},"2_5":{"toolType":"R","rowNumber":"2","colNumber":"5","toolStatus":"p"},"2_7":{"toolType":"R","rowNumber":"2","colNumber":"7","toolStatus":"p"},"3_2":{"toolType":"R","rowNumber":"3","colNumber":"2","toolStatus":"p"},"3_4":{"toolType":"R","rowNumber":"3","colNumber":"4","toolStatus":"p"},"3_6":{"toolType":"R","rowNumber":"3","colNumber":"6","toolStatus":"p"},"3_8":{"toolType":"R","rowNumber":"3","colNumber":"8","toolStatus":"p"}}');
        
        if(userToolSelection == 'White'){
            newGame.Player_1__c = UserInfo.getUserId();
        }
        else if(userToolSelection == 'Black'){
            newGame.Player_2__c = UserInfo.getUserId();
        }
            
        insert newGame;
        
        return newGame.Id;
    }

}