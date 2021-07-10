/*
* Function called after bundle install
*/
function createLight(toversion) {
	try{
		installDate();
		//++ NS-528 Bundle Separation
		//Do not reset config and stats values if bundle upgrade/downgrade
		var bundlechange = isUpdgradeDowndgrade();
		if(!bundlechange) {
			createSpiderLogs();
			resetStatusReport();
		}
		//-- NS-528 Bundle Separation
		callLicenseUpdate();
		//++ NS-690
		createDefaultPolicy();
		//-- NS-690
		removeScriptSchedules();
		updateBundleVersion(toversion);
	}catch(e){
		nlapiLogExecution('AUDIT', 'e',e);
	}
  
  	//++ NS-1799
  	try {
		var id = nlapiInitiateWorkflow('customrecord_flo_license', 1, 'customworkflow_flo_init_lic_rec', null);
		nlapiLogExecution("AUDIT","Initiate License", id);
    } catch (e) {
		nlapiLogExecution("AUDIT","Eerror Initiate License", e);
    }
  	//-- NS-1799
}

/*
* Function called after bundle update
*/
function updateLight(fromversion, toversion) {
	try{		
		updateDate();
		updateBundleVersion(toversion);
		enableRemoteStatusReport();
		removeScriptSchedules();
	}catch(e){
	}

	try{
      nlapiScheduleScript('customscript_flo_repair_cust_schedule',1);
    }catch(e){
      
    }

	try{
      nlapiScheduleScript('customscript_flo_cleanup_custs',1);
    }catch(e){
      
    }
    
    try{
      nlapiScheduleScript('customscript_flo_update_script_to_audit','customdeploy_flo_update_script_to_audit');
    }catch(e){
      
    }

    try{
      nlapiScheduleScript('customscript_flo_cleanup_recforms_wo_par','customdeploy_flo_cleanup_recforms_wo_par');
    }catch(e){
      
    }

    try{
    	nlapiScheduleScript('customscript_flo_fix_stdrecord_names', 'customdeploy_flo_clean_stdnames1');
    }catch(e){

    }


	try{
    	nlapiScheduleScript('customscript_flo_clean_invalid_std_field', 'customdeploy_flo_clean_invalid_std_field');
    }catch(e){

    }
  
  	//++ NS-1799
  	try {
		var id = nlapiInitiateWorkflow('customrecord_flo_license', 1, 'customworkflow_flo_init_lic_rec', null);
		nlapiLogExecution("AUDIT","Initiate License", id);
    } catch (e) {
		nlapiLogExecution("AUDIT","Eerror Initiate License", e);
    }
  	//-- NS-1799
}


/*
* Remove Script File Parser schedule
*/
function removeScriptSchedules() {

	try {
		//Script File Parser SS
		var filters = [ ["isdeployed","is","T"], "AND", ["script.scriptid", "is", "customscript_flo_script_parser"], "AND",["formulatext:{status}", "is", "Scheduled"]];

		var searchDeployment = nlapiSearchRecord('scriptdeployment', null, filters);
		if(searchDeployment && searchDeployment[0]) {
			var scriptRec = nlapiLoadRecord('scriptdeployment', searchDeployment[0].getId());
			scriptRec.setFieldText('status','Not Scheduled');
			nlapiSubmitRecord(scriptRec, false, true);
		}
	} catch(e) {

	}
	
	
}
