function cleanupInactiveReferences(thisRec) {
	try {
		//CLEANUP FLO CUSTOMIZATION REFERENCES
		var customizationfields = ["custrecord_flo_cust_parent","custrecord_flo_external_sys","custrecord_flo_cust_subs","custrecord_flo_mapped_ns_field_2","custrecord_flo_list","custrecord_flo_scripts","custrecord_flo_searches","custrecord_flo_cust_forms","custrecord_flo_wflws","custrecord_flo_base_record","custrecord_flo_script_deployment","custrecord_flo_deployments_list","custrecord_flo_deployments_list_2","custrecord_flo_dependent_fields","custrecord_flo_data_source"];

		//CLEAN-UP EMPLOYEE
		var employeefields = ["custrecord_flo_employees_cust","custrecord_flo_audience","custrecord_flo_control_assignee","custrecord_flo_process_owner"];

		//CLEAN-UP PROCESS
		var processfields = ["custrecord_flo_cust_process_step","custrecord_flo_qa_proc","custrecord_flo_cont_process","custrecord_flo_integration_process"];

		var departmentfields = ["custrecord_flo_depts_cust"];
		var locationfields = ["custrecord_flo_loc_cust"];
		var changerequestfields = ["custrecord_flo_add_to_cr"];
		var entityfields = ["custrecord_flo_assigned_cust_imp"];
		var policyfields = ["custrecord_flo_cust_audit_appr_policy"];
		var processissuefields = ["custrecord_flo_related_issue"];
		var testrecordfields = ["custrecord_test_template_c"];
		
		var fieldsToUpdateByRecordType = {};
		fieldsToUpdateByRecordType["customrecord_flo_customization"] = customizationfields;
		fieldsToUpdateByRecordType["employee"] = employeefields;
		fieldsToUpdateByRecordType["customrecord_flo_process"] = processfields;
		fieldsToUpdateByRecordType["department"] = departmentfields;
		fieldsToUpdateByRecordType["location"] = locationfields;
		fieldsToUpdateByRecordType["customrecord_flo_change_request"] = changerequestfields;
		fieldsToUpdateByRecordType["entity"] = entityfields;
		fieldsToUpdateByRecordType["customrecord_flo_policy"] = policyfields;
		fieldsToUpdateByRecordType["customrecord_process_issue"] = processissuefields;
		fieldsToUpdateByRecordType["customrecord_flo_test_report"] = testrecordfields;

		for(var r in fieldsToUpdateByRecordType) {
			var fieldRecordID = r;
			var fieldslist = fieldsToUpdateByRecordType[r];
			var fieldvaluesobj = getListFieldsValues(fieldslist,thisRec);
			if(fieldvaluesobj && Object.keys(fieldvaluesobj.fields).length > 0) {
				var updatedLinks = removeInactiveReferences(fieldvaluesobj.fields,fieldRecordID,fieldvaluesobj.allids);
				for(var k in updatedLinks) {
					var cleanfieldvalues = updatedLinks[k];
					var fieldtype = thisRec.getField(k).getType(); 
					if(fieldtype == "select") {
						thisRec.setFieldValue(k,cleanfieldvalues.join());
					} else if(fieldtype == "multiselect"){
						thisRec.setFieldValues(k,cleanfieldvalues);
					}
					
				}

			}
		}

	} catch (e) {
		nlapiLogExecution("debug","e",e)
	}
	
	return thisRec;
	
}

function getListFieldsValues(fieldslistarr,thisRec) {
	var linksobj = {}
	linksobj.fields = {};
	linksobj.allids = [];
	for(var findex = 0; fieldslistarr[findex] != null; findex++ ) {
		try {
			var fieldscriptid = fieldslistarr[findex];

			var fieldvalues = "";
			var fieldtype = thisRec.getField(fieldscriptid).getType();
			if(fieldtype == "select") {
				fieldvalues = thisRec.getFieldValue(fieldscriptid);
			} else if(fieldtype == "multiselect") {
				fieldvalues = thisRec.getFieldValues(fieldscriptid);
				if(fieldvalues && fieldvalues.constructor === Array) {
					fieldvalues = fieldvalues.join();
				}
			}
			
			nlapiLogExecution("debug","fieldvalues -" + fieldscriptid + " " + fieldtype ,fieldvalues);
			if(fieldvalues) {
				fieldvalues = fieldvalues.split(",");
				linksobj.allids = linksobj.allids.concat(fieldvalues);
				linksobj.fields[fieldscriptid] = fieldvalues;
			}
		} catch(e) {
			nlapiLogExecution("debug","getListFieldsValues",e)
		}
		
	}
	return linksobj;
}

function removeInactiveReferences(linklist,recordtype,allids) {
	
	var inactiveids = [];
	//Get inactive values
	var searchfilters = [["isinactive","is","T"],"AND",["internalid","anyof",allids]];
	nlapiLogExecution("debug","searchfilters",searchfilters);
	var inactivesearch = nlapiSearchRecord(recordtype, null, searchfilters);
	if(inactivesearch) {
		nlapiLogExecution("debug","inactivesearch.length",inactivesearch.length);
		for(var x = 0; inactivesearch[x] != null; x++) {
			inactiveids.push(inactivesearch[x].getId());
		}
	}
	
	if(inactiveids.length > 0) {
		nlapiLogExecution("debug","inactiveids",inactiveids);
		var obj = {"inactiveids": inactiveids};
		for(var key in linklist) {
			var linkvalues = linklist[key];
			nlapiLogExecution("debug","linkvalues",linkvalues);
			var cleanvalues = linkvalues.filter(filterInactive,obj);
			nlapiLogExecution("debug","cleanvalues",cleanvalues);
			linklist[key] = cleanvalues;
		}
	}
	
	return linklist;

}

function filterInactive(value) {
	//nlapiLogExecution("debug","this.inactiveids",this.inactiveids);
	if(this.inactiveids.indexOf(value) == -1) {
		return true;
	} else {
		return false;
	}
}