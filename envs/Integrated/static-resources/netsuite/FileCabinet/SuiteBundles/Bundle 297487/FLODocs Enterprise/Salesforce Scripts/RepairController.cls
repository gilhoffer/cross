public with sharing class RepairController{

public RepairController(){

    List< Repairs__c > list1 = [Select Id, Maintenance_Package__c, Discount_Code__c, service_order_number__c From Repairs__c];
    
    
    for( Repairs__c r : list1){
        r.Maintenance_Package__c = null;
    }
}


public void repairNotificationMethod(){

}

public void repairConstruction(){

}

public void repairSaleValue(){

}

}