/**
* Sets Respidering Now to F
*/
function unsetRespideringNowFlag() {
	var tstart = new Date().getTime();
	var MAX_TIME = 240000; //4minutes running time
	nlapiLogExecution("Debug", "FLOStart");
	custworkflow_flo_customization_ids = nlapiGetContext().getSetting('SCRIPT', 'custscript_flo_unset_param_custid');
	nlapiLogExecution("debug","custworkflow_flo_customization_ids ", custworkflow_flo_customization_ids);
	//Exit if there are no Ids
	if(!custworkflow_flo_customization_ids) {
		return "ERROR";	
	} else if (custworkflow_flo_customization_ids == 'ERROR' || custworkflow_flo_customization_ids == 'EMPTY') { 
		return custworkflow_flo_customization_ids;
	}else {	
		custworkflow_flo_customization_ids = custworkflow_flo_customization_ids.split(',');
	}

	var context = nlapiGetContext();
	for (var i = 0; custworkflow_flo_customization_ids[i] != null; i++) {
		var remainingUsage = context.getRemainingUsage();
		if (remainingUsage <= 100 || 
			new Date().getTime() - tstart > MAX_TIME) {
			nlapiLogExecution('AUDIT','Ended Processing Customizations', 'Script Usage/Time Limits');
			return "ERROR";
		} else {
			//nlapiLogExecution("Debug", "Before", nlapiLookupField("customrecord_flo_customization", custworkflow_flo_customization_ids[i], "custrecord_flo_respidering"));
			nlapiSubmitField("customrecord_flo_customization", custworkflow_flo_customization_ids[i], "custrecord_flo_respidering", "F");
			//nlapiLogExecution("Debug", "After", nlapiLookupField("customrecord_flo_customization", custworkflow_flo_customization_ids[i], "custrecord_flo_respidering"));
		}
	}
	nlapiLogExecution("Debug", "FLOEnd");
	return custworkflow_flo_customization_ids.join();
}