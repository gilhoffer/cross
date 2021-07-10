public with sharing class UpsellOpportunities{

public UpsellOpportunities(){

    Account acc = [Select Id,Maintenance_Type__c, Invoice_ID__c, company_website__c 
                   From Account Limit 1];
    
    
    
}

}