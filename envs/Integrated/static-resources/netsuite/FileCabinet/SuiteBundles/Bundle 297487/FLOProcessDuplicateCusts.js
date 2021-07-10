START_TIME = new Date().getTime();
MAX_TIME = 600000; //10 mins.
MAX_USAGE = 500;

/**
1) check if the script record have duplicate

2) if there is a duplicate check if the duplicate have changelogs associated if it have move the change logs to the original record. (FLO Change Log customrecord_flo_change_log)

3) if the duplicate is associated to a change request, remove it and associate the original record.  Ensure that the CR end up in the status complete or in progress, it cannot need to be approved again. (FLO Change Request customrecord_flo_change_request)

4) if the duplicate have test cases associated, remove it and associate the original record. (FLO Test Record customrecord_flo_test_report)

5) if the duplicate have process issues associated, remove it and associate the original record. (FLO Process Issue customrecord_process_issue)

6) set inactive the the duplicate record. 

7) log in the execution log a the name,customscript and internal ID of the script processed.

As reference: 

The original record is the one with the smaller internalid  
The duplicate record is the one with the bigger internalid. 

For example:

orginal: name=test,internalid=1,scriptid="customscrtip_test",internal ID="911", type=schedule

duplicate: name=test,internalid=332423,scriptid="customscrtip_test",internal ID="911", type=user event
*/
function processDuplicates() {
	nlapiLogExecution('AUDIT','FLO Start','processDuplicates');
	
	var context = nlapiGetContext();
	var s = nlapiLoadSearch('customrecord_flo_customization', 'customsearch_flo_duplicate_cust_script');
	var res = s.runSearch();
	var set=res.getResults(0,1000);
	var cols=res.getColumns();
	nlapiLogExecution('DEBUG','Records',set.length);
	/*
	Name name
	ScriptId  	custrecord_flo_cust_id
	Internal Id	 	custrecord_flo_int_id
	Formula  	formulanumeric
	for (var i=0;i<cols.length;i++){
		nlapiLogExecution('DEBUG','Column',cols[i].getName());
	}
	*/
	if (set!= null && set.length > 0) {
		for (var i=0; i < set.length && set[i] != null; i++) {
			
			//USAGE CHECK / RESCHEDULE
			if (context.getRemainingUsage() < MAX_USAGE || new Date().getTime() - START_TIME > MAX_TIME) {
				var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());
				nlapiLogExecution('AUDIT','Rescheduled Due to Usage','processDuplicates');
				if ( status == 'QUEUED' )
					break;
			}
			
			var name=set[i].getValue(cols[0]);
			var scriptId=set[i].getValue(cols[1]);
			if (scriptId == '- None -')
				scriptId = '';
			var intId=set[i].getValue(cols[2]);
			
			if (name == '' || scriptId == '' || intId == '')
				continue;
			
			// search duplicate
			var filters = [];
			filters[0] = new nlobjSearchFilter('name', null, 'is', name );
			filters[1] = new nlobjSearchFilter('custrecord_flo_cust_id', null, 'is', scriptId );
			filters[2] = new nlobjSearchFilter('custrecord_flo_int_id', null, 'equalto', intId );
			filters[3] = new nlobjSearchFilter('isinactive', null, 'is', 'F' );

			var dupRes=nlapiSearchRecord('customrecord_flo_customization',null,filters);
			if (dupRes == null || dupRes.length < 2) {
				nlapiLogExecution('ERROR','Couldnt Find Duplicate',name+','+scriptId+','+intId);
				continue;
			}
			var dupId=dupRes[0].getId();
			var id=dupRes[1].getId();
			
			if (parseInt(id) > parseInt(dupId)) {
				//swap variables
				var temp=dupId;
				dupId=id;
				id=temp;
			}
			
			nlapiLogExecution('DEBUG','id, dupId', id + ',' + dupId);
			
			//FLO Change Log
			//custrecord_flo_customization_record
			filters = [];
			filters[0] = new nlobjSearchFilter('custrecord_flo_customization_record', null, 'anyof', dupId );
			filters[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F' );
			var clRes=nlapiSearchRecord('customrecord_flo_change_log',null,filters);
			
			if (clRes != null && clRes.length > 0) {
				for (var ii = 0; ii < clRes.length && clRes[ii] != null; ii++) {
					var clId=clRes[ii].getId();
					var clRec = nlapiLoadRecord('customrecord_flo_change_log',clId);
					if (clRec == null)
						continue;
					clRec.setFieldValue('custrecord_flo_customization_record',id);
					try {
						nlapiSubmitRecord(clRec,false,true);
						nlapiLogExecution('AUDIT','Updated FLO Change Log',clId);
					} catch(e) {
						nlapiLogExecution('DEBUG','Error Submit',e);
						continue;
					}
				}
			
			} else {
				nlapiLogExecution('DEBUG','No Change Log',dupId);
			}
			
			//FLO Change Request customrecord_flo_change_request
			// custrecord_flo_cust_change	multiselect
			// custrecord_flo_customization_to_cleanup	multiselect
			// custrecord_flo_approve_customization		multiselect
			var crFilterExpr=[[['custrecord_flo_cust_change','anyof',dupId]
			,'or',['custrecord_flo_customization_to_cleanup','anyof',dupId]
			,'or',['custrecord_flo_approve_customization','anyof',dupId]]
			,'and',['isinactive','is','F']];
			
			updateRecord('FLO Change Request','customrecord_flo_change_request',null,['custrecord_flo_cust_change','custrecord_flo_customization_to_cleanup','custrecord_flo_approve_customization'],crFilterExpr,id,dupId);
			
			
			//FLO Test Record customrecord_flo_test_report
			//custrecord_flo_customization_tested
			//custrecord_flo_data_input_fields	multiselect
			//custrecord_flo_data_input_form	multiselect
			var trFilterExpr=[[['custrecord_flo_customization_tested','anyof',dupId]
			,'or',['custrecord_flo_data_input_fields','anyof',dupId]
			,'or',['custrecord_flo_data_input_form','anyof',dupId]]
			,'and',['isinactive','is','F']];
			
			updateRecord('FLO Test Record','customrecord_flo_test_report',['custrecord_flo_customization_tested']
				,['custrecord_flo_data_input_fields','custrecord_flo_data_input_form'],trFilterExpr,id,dupId);
				
			
			//FLO Process Issue customrecord_process_issue
			//custrecord_flo_issue_cust 	multiselect
			//custrecord_flo_source_control
			var piFilterExpr=[[['custrecord_flo_issue_cust','anyof',dupId]
			,'or',['custrecord_flo_source_control','anyof',dupId]]
			,'and',['isinactive','is','F']];
			
			updateRecord('FLO Process Issue','customrecord_process_issue',['custrecord_flo_source_control']
				,['custrecord_flo_issue_cust'],piFilterExpr,id,dupId);
				
			//Set Duplicate to Inactive
			
			var dupRec = nlapiLoadRecord('customrecord_flo_customization',dupId);
			if (dupRec != null) {
				dupRec.setFieldValue('isinactive','T');
				try {
					nlapiSubmitRecord(dupRec,false,true);
					nlapiLogExecution('AUDIT','Duplicate Processed',dupId + ':' + name + ',' + scriptId + ',' + intId);
				} catch (e) {
					nlapiLogExecution('AUDIT','Error set to inactive',dupId + ':' + name + ',' + scriptId + ',' + intId);
					continue;
				}
			}
			
			
		}
		

		if (set.length == 1000) {
			var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());
			nlapiLogExecution('AUDIT','Rescheduled','processDuplicates');
			if ( status == 'QUEUED' )
				return;  
			//reschedule
		}
	
	} else {
		nlapiLogExecution('DEBUG','No Duplicates Found');
	}

	nlapiLogExecution('AUDIT','FLO End','processDuplicates');
}

function updateRecord(name,recId,fields,multiFields,filterExpr,origId,dupId) {

	var res = nlapiSearchRecord(recId,null,filterExpr);
	if (res != null && res.length > 0) {
		for (var ii=0;ii < res.length && res[ii] != null; ii++) {
			var id = res[ii].getId();
			var rec = nlapiLoadRecord(recId,id);
			var delInactive = true;
			if (rec == null)
				continue;
				
			if(recId == "customrecord_flo_change_request" && rec.getFieldValue('custrecord_flo_cr_remove_inactive_cust')!="T") {
				delInactive = false;	
			}
			
			if (multiFields != null) {
				for (var jj=0; jj < multiFields.length; jj++) {
					
					var fvalues=rec.getFieldValues(multiFields[jj]);
					if (fvalues != null) {
					
						if(!(fvalues.constructor == Array))
							fvalues=[fvalues];
						var index = fvalues.indexOf(dupId);
						if (index >= 0) {
							
							
							var indexOrig = fvalues.indexOf(origId);
							if (indexOrig < 0) {
								
								fvalues.splice(index,1,origId);
							} else {
								
								fvalues.splice(index,1);
							}
							if (delInactive)
								fvalues=checkActiveCustomizationsFromList(fvalues);
							rec.setFieldValues(multiFields[jj],fvalues);
							nlapiLogExecution('AUDIT','Updated '+ name +' '+multiFields[jj], fvalues.join());
						}
					}
				}
			}
			
			if (fields != null) {
				for (var jj=0; jj< fields.length; jj++) {
					var fvalue = rec.getFieldValue(fields[jj]);
					if (fvalue == dupId)
						rec.setFieldValue(fields[jj],origId);
				}
			}
			
			try {
				nlapiSubmitRecord(rec,false,true);
				nlapiLogExecution('AUDIT','Updated ' + name,id);
			} catch(e) {
				nlapiLogExecution('DEBUG','Error Submit',e);
				continue;
			}
		}
			
	} else {
		nlapiLogExecution('DEBUG','No ' + name,dupId);
	}
}
	
/**
* Removes inactive customizations in the list
*/
function checkActiveCustomizationsFromList(list) {
 var retActives = new Array();
 var ifilters = new Array(); 
 ifilters.push(new nlobjSearchFilter('internalid', null,"anyof",list));
 ifilters.push(new nlobjSearchFilter('isinactive', null,'is',"F"));
   
  
 var activerecords=nlapiSearchRecord("customrecord_flo_customization",null,ifilters);
 if(activerecords) {
  for(var ar = 0; ar < activerecords.length; ar++) { 
   retActives.push(activerecords[ar].getId());
  }
 }
 return retActives;
}
