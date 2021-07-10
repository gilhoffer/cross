trigger RepairAfterInsert on Repairs__c (before insert) {
	
    for(Repairs__c r : trigger.new){
        r.Maintenance_Package__c  = null;
        r.Discount_Code__c = '1';
    }
}