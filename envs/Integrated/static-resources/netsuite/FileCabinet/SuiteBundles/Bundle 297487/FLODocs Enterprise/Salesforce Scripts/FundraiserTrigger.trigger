trigger FundraiserTrigger on Fundraiser__c (before insert) {
	Fundraiser__c[] f = Trigger.new;
}