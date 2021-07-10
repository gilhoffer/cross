trigger SLAExecutions on Account (before insert) {

    
    for(Account acc : Trigger.new){
        acc.Invoice_ID__c = null;
        acc.company_website__c = null;
        acc.Maintenance_Type__c = null;
    }
}