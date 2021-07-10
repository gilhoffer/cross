/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
  */
define(['N/runtime','N/search','N/record','N/task','N/format'],
    function(runtime,search,record,task,format)
    {
    	function onAction(scriptContext) {
    		log.debug('FLOStart');
    		var currentScript = runtime.getCurrentScript();
    		var custIds = currentScript.getParameter({name: 'custscript_flo_userrole_cust_id'});
			log.debug('CustIds',custIds);
    		if (custIds != null) {
    			custIds = custIds.split(",");
    			for (var i = 0; i < custIds.length; i++) {
    				try {
    					var floCustomRec = record.load({ type: 'customrecord_flo_customization', id: custIds[i] });
    					//User Role
    					if (floCustomRec != null && floCustomRec.getValue('custrecord_flo_cust_type') == 50 &&
    						floCustomRec.getValue('custrecord_flo_int_id') != null) {

    						var roleId = floCustomRec.getValue('custrecord_flo_int_id');
    						var oldJSONConfig = floCustomRec.getValue('custrecord_flo_json_configuration') || "";
    						var newJSONConfig = getJSONString(roleId);
							log.debug("old JSONConfig",oldJSONConfig);
							log.debug("new JSONConfig",newJSONConfig);
    						if (oldJSONConfig != newJSONConfig) {
    							floCustomRec.setValue({fieldId:'custrecord_flo_json_configuration',value:newJSONConfig});
    							floCustomRec.setValue({fieldId:'custrecord_skip_rec_log',value: true});
    							var id = floCustomRec.save({
								    enableSourcing: false,
								    ignoreMandatoryFields: true
								});
								log.debug("Updated Cust",id);
    						}
    					}
	    			} catch (e) {
	    				log.debug('e',e);
	    			}
    			}
    		}
    	}

		function getJSONString(roleId){
			var mysearch = search.load({ type: 'Role',    id: 'customsearch_flo_role_fields_ss'  });
			var roleFilter = search.createFilter({ name: 'internalid', operator: 'anyof', values: roleId });
			mysearch.filters.push(roleFilter);
			var searchResultCustomFlo = mysearch.run().getRange({ start: 0, end: 1 });
			var resultObj = {};
			resultObj['id'] = roleId;
			resultObj.recordtype = "role";
			resultObj.columns = {};
			resultObj.columns.name = searchResultCustomFlo[0].getValue('name');
			resultObj.columns.customstandard = searchResultCustomFlo[0].getValue('customstandard');
			resultObj.columns.centertype = {};
			resultObj.columns.centertype.name = searchResultCustomFlo[0].getText('centertype');
			resultObj.columns.centertype.internalid = searchResultCustomFlo[0].getValue('centertype');
			if(searchResultCustomFlo[0].getValue('frombundle')) {
				resultObj.columns.frombundle = searchResultCustomFlo[0].getValue('frombundle');
			}


			var fieldsSS = JSON.stringify(resultObj);

			mysearch = search.load({ type: 'Role',	 id: 'customsearch_flo_role_permissions'  });
			roleFilter = search.createFilter({ name: 'internalid', operator: 'anyof', values: roleId });
			mysearch.filters.push(roleFilter);
			var rolePerms='';
			var ctr=0;
			var permissionsarr = [];
			mysearch.run().each(function(result) {
				var perm = {};
				perm.id = roleId
				perm.recordtype = "role";
				perm.columns = {};
				perm.columns.name = result.getValue('name');
				perm.columns.internalid = {"name":  result.getValue('internalid'), "internalid" : result.getValue('internalid')};
				perm.columns.permission = {"name": result.getText('permission'), "internalid" : result.getValue('permission')};
				perm.columns.level = {"name": result.getText('level'), "internalid" : result.getValue('level')};
				permissionsarr.push(perm);
				ctr++;
				return true;
			});
			if(permissionsarr.length > 0) {
				rolePerms = JSON.stringify(permissionsarr);
			}

			return fieldsSS+rolePerms;
		}

		return {
		     onAction: onAction
		}
	}
);