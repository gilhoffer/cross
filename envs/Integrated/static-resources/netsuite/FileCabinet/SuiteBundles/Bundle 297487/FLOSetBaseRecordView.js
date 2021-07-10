function setBaseRecordView() {
	try {
		var custType = nlapiGetFieldText('custrecord_flo_cust_type');
		var baseRecordList = '';
		var customrecorid = nlapiGetFieldValue('custrecord_flo_search_cust_rec');
		var deploymentList = nlapiGetFieldValues('custrecord_flo_deployments_list') || "";
		if(deploymentList && custType && custType.indexOf('Script') != -1) {
			//Ensure the list is an Array
			if(deploymentList instanceof Array) {
				deploymentList = deploymentList.join(',').split(',');
			} else {
				deploymentList = deploymentList.split(',')
			}
			var scriptRec = []
			var searchCol = [new nlobjSearchColumn('formulatext',null,'group'),new nlobjSearchColumn('internalid',null,'max')];
			searchCol[0].setFormula('{custrecord_flo_base_record}')
			var searchBase = nlapiSearchRecord('customrecord_flo_customization', null, [['isinactive','is','F'],'AND',['internalid','anyof',deploymentList]], searchCol);
			if(searchBase && searchBase.length) {
				for(var o = 0; o < searchBase.length; o++) {
					var cols3 = searchBase[o].getAllColumns();
					var recname = searchBase[o].getValue(cols3[0]);
					var reclink = "";
					try {
						reclink = nlapiResolveURL('RECORD', 'customrecord_flo_customization', searchBase[o].getValue(cols3[1]));
					} catch(e) {

					}
					
					scriptRec.push(recname);
				}
				if(scriptRec.length > 0) {
					baseRecordList = scriptRec.join(',');
				}
			}
		} else {
			var baseRecordIds = nlapiGetFieldValues('custrecord_flo_cust_parent') || ""; 
			var baseRecordIdsTexts = nlapiGetFieldTexts('custrecord_flo_cust_parent') || ""; 
			if(baseRecordIds && baseRecordIdsTexts) {
				if(baseRecordIdsTexts instanceof Array) {
					baseRecordIdsTexts = baseRecordIdsTexts.join(',');
				} else {
					baseRecordIdsTexts = baseRecordIdsTexts.split(',').join(',');
				}
				baseRecordList = baseRecordIdsTexts;
			} else {
				var baseRecordId = nlapiGetFieldValue('custrecord_flo_base_record');
				var baseRecordText = nlapiGetFieldText('custrecord_flo_base_record')
				if(baseRecordId && baseRecordText) {
					baseRecordList = baseRecordText
				} else if(custType.indexOf('Mass Update') != -1 || custType.indexOf('Search') != -1) {
					baseRecordList = nlapiGetFieldValue('custrecord_flo_data_type');
					if(custType && baseRecordList == "Custom" && customrecorid) {
						var searchRecName = nlapiSearchRecord('customrecord_flo_customization', null, [['isinactive','is','F'],'AND',['custrecord_flo_cust_id','is',customrecorid]], [new nlobjSearchColumn('name')]);
						if(searchRecName && searchRecName[0]){
							try {
								baseRecordList =searchRecName[0].getValue('name')
							} catch(e) {

							}
						}
					}
				}
			}
			
		}
		if(baseRecordList != "undefined") {
			nlapiSetFieldValue('custrecord_flo_base_record_view',baseRecordList);
		}
	} catch(e) {
		nlapiLogExecution('audit', 'err', e)
	}
}