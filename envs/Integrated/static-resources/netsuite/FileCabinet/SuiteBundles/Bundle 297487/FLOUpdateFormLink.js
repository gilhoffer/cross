function updateFormLink() {
	nlapiLogExecution("AUDIT", "FLO Start");
	try {
		var recId = nlapiGetRecordId();
		var thisRec = nlapiGetNewRecord();
		nlapiLogExecution("DEBUG", "recId", recId);
		if (recId && thisRec) {

			var searchRes = nlapiSearchRecord("customrecord_flo_customization", "customsearch_flo_form_links_to_update", new nlobjSearchFilter("internalid", null, "anyof", recId));
			if (searchRes && searchRes[0]) {

				var thisScriptId = thisRec.getFieldValue("custrecord_flo_cust_id");
				var thisFormLinks = thisRec.getFieldValues("custrecord_flo_cust_forms") || null;

				if (thisScriptId && thisFormLinks) {
					thisFormLinks = thisFormLinks.join().split(",");
					var cols = searchRes[0].getAllColumns();
					var formsToMakeJoin = [];
					nlapiLogExecution("DEBUG", "thisScriptId", thisScriptId);
					for (var i=0;searchRes[i] != null; i++) {
						var formFields = searchRes[i].getValue(cols[3]); //Forms:Form Fields
						var formId = searchRes[i].getValue(cols[2]);//Forms:Internal ID
						var linkPos = thisFormLinks.indexOf(formId);
						if (formFields != null && formFields.length > 999) {
							//double check
							var longFields = nlapiLookupField("customrecord_flo_customization", formId, "custrecord_flo_cust_form_fields");
							if (longFields) {
								var regex = new RegExp(thisScriptId+"(,|$)","i");
								if (longFields.match(regex) != null) {
									nlapiLogExecution("DEBUG", "Found in long Form Fields");
									continue;
								}
							}
						}

						formsToMakeJoin.push(formId);

						if (linkPos > -1) {
							thisFormLinks.splice(linkPos,1);
						}

					} //end of loop

					if (formsToMakeJoin.length > 0) {

						nlapiLogExecution("DEBUG", "Remove Inactive", thisFormLinks);
						if (thisFormLinks.length > 0)
							thisFormLinks = removeInactiveRecord(thisFormLinks,"customrecord_flo_customization");
						nlapiLogExecution("DEBUG", "Link Update", thisFormLinks);
						nlapiSubmitField("customrecord_flo_customization", recId, "custrecord_flo_cust_forms", thisFormLinks);

						//make join the affected forms as backup to the changes
						for (var i=0;i < formsToMakeJoin.length;i++) {
							nlapiSubmitField("customrecord_flo_customization", formsToMakeJoin[i], "custrecord_flo_make_join_proc", "F");
						}
					}

				} else {
					nlapiLogExecution("DEBUG", "No ScriptId/FormLinks");
				}
			} else {
				nlapiLogExecution("DEBUG", "none");
			}
		}
	} catch (e) {
		nlapiLogExecution("DEBUG", "updateFormLink", e);
	}
	nlapiLogExecution("AUDIT", "FLO End");	
}

function removeInactiveRecord(idlist,fieldrecordtype) {
	
	var newlist = [];
	try {
		var lfilters = [];
		lfilters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		lfilters.push(new nlobjSearchFilter('internalid',null,'anyof',idlist));
		
		lresults=nlapiSearchRecord(fieldrecordtype,null,lfilters);
		if(lresults) {
			for(var lr = 0; lresults[lr] != null; lr++) {
				newlist.push(lresults[lr].getId());
			}
		}
	} catch(e) {
		
	}
	return newlist;
}