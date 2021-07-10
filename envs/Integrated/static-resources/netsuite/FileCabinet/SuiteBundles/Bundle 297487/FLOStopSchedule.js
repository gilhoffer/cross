function stopSchedule() {

	try {

		var deploy = nlapiGetContext().getSetting('SCRIPT', 'custscript_flo_start');

		var custRecs = nlapiSearchRecord("scriptdeployment", 'customsearch_flo_stop_deployments');

		for (var i = 0; i < custRecs.length; i++) {
			id = custRecs[i].getId();
			try {
				nlapiSubmitField('scriptdeployment', id, 'isdeployed', deploy);
			} catch (e) {

			}

		};

		if (deploy == "T") {
			nlapiSubmitField('customrecord_flo_license', 1, 'custrecord_flo_license_stopscripts', 'F');
		} else {
			nlapiSubmitField('customrecord_flo_license', 1, 'custrecord_flo_license_stopscripts', 'T');

		}



		if (deploy == "T") {
			response.write("Realtime Scripts Started. You may now close this window.");
		} else {
			response.write("<script> alert('Scheduled Scripts Stop');window.history.back();</script> Realtime Scripts Stop. You may now close this window.");
		}

	} catch (e) {
		nlapiLogExecution('debug',"stopSchedule", e);
	}

}