({
	createNewGame : function(component, event, helper) {
		var createGameAction = component.get("c.startGame");
        
        createGameAction.setParams({
            'userToolSelection' : component.get("v.userToolSelection")   
        });
        
        createGameAction.setCallback(this, function(response){
            var gameRecordId = response.getReturnValue();
            
            var navigateEvent = $A.get("e.force:navigateToSObject");
            navigateEvent.setParams({
                "recordId" : gameRecordId,
                "slideDevName" : "detail"
            });
            navigateEvent.fire();
        });
        
        $A.enqueueAction(createGameAction);
	}
})