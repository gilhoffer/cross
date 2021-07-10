trigger AutoMobileDatabaseOperation on Automobile__c (before insert) {
    for(Automobile__c a : trigger.new){
        a.Extended_Package__c = null;
    }
}