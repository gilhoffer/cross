/**
Sets Object JSON and Hash For Objects spidered using 1.0
**/
function setObjectJSON_API1() {
	var context = nlapiGetContext();

	//SUPPORTED RECORD TYPES
    var SCRIPTDEPLOYMENT = 51;
    var deploymentIds = [];
    var returnValue = "";
	try {

		var custworkflow_flo_customization_ids = context.getSetting('SCRIPT', 'custscript_flo_objsonap1_rs_custid') || '';
		if(!custworkflow_flo_customization_ids || custworkflow_flo_customization_ids=="EMPTY") {
			return 'EMPTY';	
		} else {	
			custworkflow_flo_customization_ids = custworkflow_flo_customization_ids.split(',');
		}
		nlapiLogExecution("debug","custworkflow_flo_customization_ids",custworkflow_flo_customization_ids)
		var filters = [['isinactive','is','F'], 'AND', ['custrecord_flo_cust_type','anyof', [SCRIPTDEPLOYMENT]], 'AND', ['internalid','anyof',custworkflow_flo_customization_ids]];

		var custSearch = nlapiSearchRecord('customrecord_flo_customization', null, filters);
		if(custSearch) {
			for(var d = 0; custSearch[d] != null; d++) {
				try {
					var custRecord = nlapiLoadRecord('customrecord_flo_customization', custSearch[d].getId());
					var custInternalId = custRecord.getFieldValue('custrecord_flo_int_id');
					var custType = custRecord.getFieldValue('custrecord_flo_cust_type');
					var custObjectJSON = custRecord.getFieldValue('custrecord_flo_object_json');

					var objectJSON = "";
					if(custType == SCRIPTDEPLOYMENT) {
						var deploymenRecord = nlapiLoadRecord('ScriptDeployment', custInternalId);
						objectJSON = parseDeploymentObjectJSON(deploymenRecord);
					}
					nlapiLogExecution("debug","objectJSON",objectJSON)

					if(objectJSON && custObjectJSON != objectJSON) {
						var hashString =  nlapiEncrypt(objectJSON, "sha1");
						custRecord.setFieldValue('custrecord_flo_object_json', objectJSON);
						custRecord.setFieldValue('custrecord_flo_object_hash', hashString);
						nlapiSubmitRecord(custRecord, false, true);
					}
					


				} catch(ee) {
					nlapiLogExecution("debug","setObjectJSON_API1 inside for",ee)
				}

			}

		}
	} catch(e) {
		nlapiLogExecution("debug","setObjectJSON_API1",e)

	}

	return returnValue;
}


function parseDeploymentObjectJSON(deploymentRec) {
    var cleanJSON = "";
    try {
        var deploymentRecString = JSON.stringify(deploymentRec);
        deploymentRecString = deploymentRecString.replace(/(,)?\"sys_parentid\":\".*?\"/g,"").replace(/(,)?\"sys_id\":\".*?\"/g,"").replace(/(,)?\"_eml_nkey_\":\".*?\"/g,"").replace(/(,)?\"nsapiCT\":\".*?\"/g,"").replace(/(,)?\"id\":\".*?\"/g,"").replace(/(,)?\"entryformquerystring\":\".*?\"/g,"").replace(/(,)?\"primarykey\":\".*?\"/g,"").replace(/(,)?\"version\":\".*?\"/g,"").replace(/(,)?\"externalurl\":\".*?\"/g,"").replace(/(,)?\"url\":\".*?\"/g,"").replace(/(,)?\"internalid\":\".*?\"/g,"").replace(/(,)?\"instancestatuspage\":\".*?\"/g,"").replace(/(,)?\"hiddendeprecatedstatus\":\".*?\"/g,"").replace(/(,)?\"processormodelversion\":\".*?\"/g,"").replace(/\{,\"/g,'{"');

        var deploymentObj = JSON.parse(deploymentRecString);
         nlapiLogExecution("debug","deploymentRecString",deploymentRecString)
        delete deploymentObj['type'];
        delete deploymentObj['isDynamic'];
        delete deploymentObj['id'];
        delete deploymentObj['sublists'];
        delete deploymentObj['userevents'];
        for(var f  in deploymentObj) {
            var fieldvalue = deploymentObj[f];
            try {
                nlapiLogExecution("debug","fieldvalue",fieldvalue)
                if(fieldvalue && typeof fieldvalue == 'object' && fieldvalue.hasOwnProperty('name')) {
                    fieldvalue = fieldvalue.name
                } else if(fieldvalue && fieldvalue instanceof Array && fieldvalue.length > 0) {
                     for(var g = 0; g < fieldvalue.length; g++) {
                        var arrvalue = fieldvalue[g];
                        for(var h in arrvalue) {
                            var fieldText = arrvalue[h];
                            if(fieldText && typeof fieldText == 'object' && fieldText.hasOwnProperty('name')) {
                                fieldText = fieldText.name
                            }
                            fieldvalue[g][h] = fieldText;
                        }
                        
                     }
                }
            } catch(e) {
                nlapiLogExecution("debug","cleanJSON",e)
            }
            deploymentObj[f] = fieldvalue;
        }

        if(deploymentObj.hasOwnProperty('id')) {
            delete deploymentObj['id'];
        }

        cleanJSON = JSON.stringify(deploymentObj);
        nlapiLogExecution("debug","cleanJSON",cleanJSON)
    } catch(e) {
         nlapiLogExecution("debug","parseObjectJSON",e)
    }

    return cleanJSON;
}
