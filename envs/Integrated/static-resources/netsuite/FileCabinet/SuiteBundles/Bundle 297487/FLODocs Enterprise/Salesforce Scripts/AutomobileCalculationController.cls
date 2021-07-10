public with sharing class AutomobileCalculationController{

public AutomobileCalculationController(){

    List< Automobile__c > list1 = [Select Id, Extended_Package__c
                                        From Automobile__c];
    
    
    for( Automobile__c r : list1){
        r.Extended_Package__c = null;
    }
}


public void repairNotificationMethod(){

}

public void repairConstruction(){

}

public void repairSaleValue(){

}

}