nlapiLogExecution("audit","FLOStart",new Date().getTime())
function inactiveDeprecatedCustomizations()
{
	var thisCntxt=nlapiGetContext();//the execution context of the script
	var recrodlastinternalid = thisCntxt.getSetting('SCRIPT', 'custscript_spiderrss_last_record');

    var ssfilters = new Array();

	if(recrodlastinternalid) {
			ssfilters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthanorequalto', recrodlastinternalid));
	}else{
			ssfilters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthan', 0));
	}
	
	var recordList=nlapiSearchRecord("customrecord_flo_customization","customsearch_customization_to_inactive",ssfilters)

    for(sl=0;recordList!=null && recordList[sl]!=null;sl++)
    {
       
        if (thisCntxt.getRemainingUsage()<= 80 || sl >= 990)
        {
		   var sparams = new Array();
		   sparams['custscript_spiderrss_last_record'] = internalidnumber;
           var status = nlapiScheduleScript(thisCntxt.getScriptId(), thisCntxt.getDeploymentId(), sparams)
           if ( status == 'QUEUED' ){break};   

        }else{

        	
			var internalidnumber=recordList[sl].getId();
			
			var rec=nlapiLoadRecord('customrecord_flo_customization',internalidnumber);
			rec.setFieldValue('inactive','T');
			nlapiSubmitRecord(rec,'F','F');

			//nlapiSubmitField('customrecord_flo_customization',internalidnumber,'inactive','T');
        } 
    }
}
