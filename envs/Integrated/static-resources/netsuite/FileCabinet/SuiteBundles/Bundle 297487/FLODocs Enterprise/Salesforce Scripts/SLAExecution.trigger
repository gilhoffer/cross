trigger SLAExecution on Account (before insert) {

    
    for(Account acc : Trigger.new){
        acc.Market_Share_Value__c = null;
        acc.Number_of_Locations__c = null;
        acc.Package_Upgrade__c = null;
    }
}