function removeInactiveReferences() {
	try {
		var record=nlapiGetNewRecord();
		var recordid=nlapiGetRecordId();
		nlapiLogExecution('AUDIT', 'recordid', recordid);
		
		
		var referenceids = [];
		custrecord_flo_scripts = getReferenceValues(record.getFieldValues('custrecord_flo_scripts'));
		custrecord_flo_searches = getReferenceValues(record.getFieldValues('custrecord_flo_searches'));
		custrecord_flo_cust_forms = getReferenceValues(record.getFieldValues('custrecord_flo_cust_forms'));
		custrecord_flo_wflws = getReferenceValues(record.getFieldValues('custrecord_flo_wflws'));
		custrecord_flo_data_source = getReferenceValues(record.getFieldValues('custrecord_flo_data_source'));
		custrecord_flo_dependent_fields = getReferenceValues(record.getFieldValues('custrecord_flo_dependent_fields'));
		
		referenceids = []
		if(custrecord_flo_scripts && custrecord_flo_scripts.length > 0) {
			 referenceids = referenceids.concat(custrecord_flo_scripts);
		}
		if(custrecord_flo_searches && custrecord_flo_searches.length > 0) {
			referenceids = referenceids.concat(custrecord_flo_searches);
		}
		if(custrecord_flo_cust_forms && custrecord_flo_cust_forms.length > 0) {
			referenceids = referenceids.concat(custrecord_flo_cust_forms);
		}
		if(custrecord_flo_wflws && custrecord_flo_wflws.length > 0) {
			referenceids = referenceids.concat(custrecord_flo_wflws);
		}
		if(custrecord_flo_data_source && custrecord_flo_data_source.length > 0) {
			referenceids = referenceids.concat(custrecord_flo_data_source);
		}
		if(custrecord_flo_dependent_fields && custrecord_flo_dependent_fields.length > 0) {
			referenceids = referenceids.concat(custrecord_flo_dependent_fields);
		}
		
		nlapiLogExecution('DEBUG', 'referenceids length', referenceids.length);
		
		//search which of the reference ids are inactive
		if(referenceids.length > 0) {
			nlapiLogExecution('DEBUG', 'referenceids', referenceids);
			var filter=[];
			filter.push(new nlobjSearchFilter('internalid', null,'anyof', referenceids));
			filter.push(new nlobjSearchFilter('isinactive', null,'is', 'T'));
			var customizationsList=nlapiSearchRecord('customrecord_flo_customization',null,filter,null);
			
			if(customizationsList != null) {
				for(var i=0; customizationsList[i] != null; i++) {
					var custid = customizationsList[i].getId();
					nlapiLogExecution('DEBUG', 'INACTIVE custid', custid);
					var index = custrecord_flo_scripts.indexOf(custid);
					if(index > -1) {
						nlapiLogExecution('DEBUG', 'UPDATE', "Removing "+custid+" from custrecord_flo_scripts");
						custrecord_flo_scripts.splice(index, 1);
					}
					
					index = custrecord_flo_searches.indexOf(custid);
					if(index > -1) {
						nlapiLogExecution('DEBUG', 'UPDATE', "Removing "+custid+" from custrecord_flo_searches");
						custrecord_flo_searches.splice(index, 1);
					}
					
					index = custrecord_flo_cust_forms.indexOf(custid);
					if(index > -1) {
						nlapiLogExecution('DEBUG', 'UPDATE', "Removing "+custid+" from custrecord_flo_cust_forms index"+index);
						custrecord_flo_cust_forms.splice(index, 1);
						nlapiLogExecution('DEBUG', ' custrecord_flo_cust_forms length', custrecord_flo_cust_forms.length);
					}
					
					index = custrecord_flo_wflws.indexOf(custid);
					if(index > -1) {
						nlapiLogExecution('DEBUG', 'UPDATE', "Removing "+custid+" from custrecord_flo_wflws");
						custrecord_flo_wflws.splice(index, 1);
					}
					
					index = custrecord_flo_data_source.indexOf(custid);
					if(index > -1) {
						nlapiLogExecution('DEBUG', 'UPDATE', "Removing "+custid+" from custrecord_flo_data_source");
						custrecord_flo_data_source.splice(index, 1);
					}
					
					index = custrecord_flo_dependent_fields.indexOf(custid);
					if(index > -1) {
						nlapiLogExecution('DEBUG', 'UPDATE', "Removing "+custid+" from custrecord_flo_dependent_fields");
						custrecord_flo_dependent_fields.splice(index, 1);
					}
				}
			}
			var fields = ['custrecord_flo_scripts','custrecord_flo_searches','custrecord_flo_cust_forms','custrecord_flo_wflws','custrecord_flo_data_source','custrecord_flo_dependent_fields'];
			
			var values = [];
			values.push(custrecord_flo_scripts);
			values.push(custrecord_flo_searches);
			values.push(custrecord_flo_cust_forms);
			values.push(custrecord_flo_wflws);
			values.push(custrecord_flo_data_source);
			values.push(custrecord_flo_dependent_fields);
	
	
	
	
			nlapiSubmitField('customrecord_flo_customization',recordid,fields,values);
	
		}
	} catch(e) {
		nlapiLogExecution('debug', 'debug', e);
	}
}

function getReferenceValues(fieldvalue) {
	var custfield = [];
	if(fieldvalue != null && fieldvalue != '') {
		//nlapiLogExecution('DEBUG', 'typeof', typeof fieldvalue);
		
		if(typeof fieldvalue === 'string') {
			custfield = [fieldvalue]
		} else {
			custfield = fieldvalue;	
		}
		
	} 
	
	return custfield;
}