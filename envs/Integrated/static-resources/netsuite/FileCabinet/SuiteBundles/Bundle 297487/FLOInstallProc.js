nlapiLogExecution("audit","FLOStart",new Date().getTime())
function update(fromversion, toversion){
	try{		
		updateDate();
		updateBundleVersion(toversion);
		enableRemoteStatusReport();
	}catch(e){
	}

	 		try{
            	nlapiScheduleScript('customscript_flo_create_json_active','customdeploy_flo_cust_list');
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
              //nlapiScheduleScript('customscript_flo_data_validity_test','customdeploy_flo_data_validity_test_sche');
            }catch(e){
              
            }

           /*  try{
              nlapiScheduleScript('customscript_flo_spider_field_delete','customdeploy_flo_inactive_delete_field');
            }catch(e){
              
            }*/


            try{
              nlapiScheduleScript('customscript_customizations_make_joinss','customdeploy_customizations_make_joinss');
            }catch(e){
              
            }

            try{
              //nlapiScheduleScript('customscript_flo_script_parser','customdeploy_flo_script_parser_od');
            }catch(e){
              
            }

            try{
              nlapiScheduleScript('customscript_flo_cleanup_dup_bundle_cr','customdeploy_flo_cleanup_dup_bundle_cr');
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
            	nlapiScheduleScript('customscript_flo_migrate_cleanup_status', 'customdeploy_flo_migrate_cleanup_status');
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
            //Run retroactive metrics
            try {
            	var configRec = nlapiLoadRecord("customrecord_flo_spider_configuration", 1);
            	var bundleDateInstalled = configRec.getFieldValue('custrecord_flo_install') || "";
            	var retroAttempt = configRec.getFieldValue('custrecord_flo_retrometrics_run') || 0;
            	if(retroAttempt) {
            		retroAttempt = parseInt(retroAttempt);
            	}
            	var installDateObj = null
				if(!bundleDateInstalled) {
					installDateObj = new Date('11/30/2017');
				} else {
					installDateObj = nlapiStringToDate(bundleDateInstalled, 'date');
				}

				if(retroAttempt < 2 && installDateObj.getTime() < (new Date('06/09/2018').getTime())) {
					nlapiScheduleScript('customscript_flo_retrometrics', 'customdeploy_flo_retrometrics');
					nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_retrometrics_run',2);
				}
            } catch(e) {

            }

            /*try {
            	var today = new Date();
            	var day = today.getDate();
            	//Run Strongpoint Metrics if not run for this month.
            	if(day > 2 && day < 28) {
            		var metricsExecution = nlapiSearchRecord('scheduledscriptinstance', null, [[['script.scriptid','is','customscript_flo_strongpointmetrics'],'OR',['script.scriptid','is','customscript_flo_strongpointmetrics_od']],'AND',['datecreated','within','thisMonth'],'AND',[["formulanumeric:({enddate}-{startdate}) * 24 * 60 * 60", "greaterthan", 1],'OR',['status','noneof',['COMPLETE', 'CANCELED', 'RETRY', 'FAILED']]]]);

            		if(!metricsExecution || metricsExecution.length == 0) {
            			nlapiScheduleScript('customscript_flo_strongpointmetrics_od', 'customdeploy_flo_strongpointmetrics_od');
            		}
            	}
            } catch(e) {
            	nlapiLogExecution('AUDIT', 'metrics',e);
            }*/
}
function enableRemoteStatusReport() {
	try {
		var configRec = nlapiLoadRecord("customrecord_flo_spider_configuration", 1);
		var enableremotereport = configRec.getFieldValue('custrecord_flo_enable_remote_sr');
		if(enableremotereport != "T") {
			//Check if there is any system notes change, if none we will set the custrecord_flo_enable_remote_sr field.
			var sysnotesfilters = [['internalidnumber','equalto',1],'AND',['systemnotes.field','anyof',['CUSTRECORD_FLO_ENABLE_REMOTE_SR']],'AND',['systemnotes.oldvalue','is','T']];
			var sysnotessearch = nlapiSearchRecord('customrecord_flo_spider_configuration', null, sysnotesfilters);
			if(!sysnotessearch || sysnotessearch.length == 0) {
				nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_enable_remote_sr',"T");
			}
		}
	} catch(e){

	}
}

function create(toversion){
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
		createDefaultPolicy()
		//-- NS-690
		updateBundleVersion(toversion)
	}catch(e){
		nlapiLogExecution('AUDIT', 'e',e);
	}
}

//++ NS-690
function createDefaultPolicy() {
	try {
		var searchpolicy = nlapiSearchRecord('customrecord_flo_policy', null, [['custrecord_flo_default_policy','is','T'],'AND',['isinactive','is','F']]);
		if(!searchpolicy || searchpolicy.length == 0) {
			var defpolicy = nlapiCreateRecord('customrecord_flo_policy', {recordmode: 'dynamic'});
			defpolicy.setFieldValue('name','Default Policy');
			defpolicy.setFieldValue('custrecord_flo_default_policy','T');
			defpolicy.setFieldValue('custrecord_flo_scripted_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_searches_reports_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_control_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_web_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_other_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_setup_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_roles_changes',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_user_role_related_objects',1); //Log Changes Only
			defpolicy.setFieldValue('custrecord_flo_roleassignment_changes',1); //Log Changes Only
			nlapiSubmitRecord(defpolicy, false, true);

		}
	} catch(e) {
		nlapiLogExecution('AUDIT', 'createDefaultPolicy',e);
	}
}
//-- NS-690


function mydate(){
		var date=new Date();
		mydate=nlapiDateToString(date,"date");
		return mydate;
}

function updateDate(){
		try {
			nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_last_update',mydate());
		} catch(e) {
			nlapiLogExecution('AUDIT', 'updateDate',e);
		}
	    
}

function installDate(){
	    try {
			nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_install',mydate());
		} catch(e) {
			nlapiLogExecution('AUDIT', 'installDate',e);
		}
	   
}

function updateBundleVersion(bundleversion) {
	nlapiLogExecution('AUDIT', 'bundleversion',bundleversion);
	nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_bundle_version',bundleversion.toString());
}

function callLicenseUpdate() {
	//empty license fields
	var licrecord = nlapiLoadRecord("customrecord_flo_license",1);
	licrecord.setFieldValue("custrecord_flo_license_number","");
	licrecord.setFieldValue("custrecord_flo_licensed_modules","");
	licrecord.setFieldValue("custrecord_flo_license_edition","");
	licrecord.setFieldValue("custrecord_flo_subsidiaries","");
	licrecord.setFieldValue("custrecord_flo_license_end_date","");
	licrecord.setFieldValue("custrecord_flo_license_count",null);
	licrecord.setFieldValue("custrecord_flo_auth_email","");
	licrecord.setFieldValue("custrecord_flo_license_stopscripts","F");
	//NS-2038 Set bundle installer as the weekly report recipient
	licrecord.setFieldValue("custrecord_sp_receipt",licrecord.getFieldValue("owner"));
    nlapiSubmitRecord(licrecord);

	
}

function createSpiderLogs()
{
    //This function checks for all spider record logs and creates any missing ones
    var fields = [];
	var values = [];

	fields[0] = 'custrecord_flo_log_spider_count';
	values[0] = null;

	fields[1] = 'custrecord_flo_log_doc_rec_count';
	values[1] = null;
    for(i=1;i<=49;i++)
    {
     	filters=[new nlobjSearchFilter("custrecord_flo_log_type",null,'is',i)];
       	logs=nlapiSearchRecord("customrecord_flo_spider_log",null,filters,null);
       	if(logs==null)
		{
			try
			{
		    newlog=nlapiCreateRecord("customrecord_flo_spider_log");
		    newlog.setFieldValue("custrecord_flo_log_type",i);
		    newlog.setFieldValue("custrecord_flo_config_stats_link",1);
		    nlapiSubmitRecord(newlog)
	    	}
	        catch(e){}
		} else {
			try {
				nlapiSubmitField('customrecord_flo_spider_log',logs[0].getId(),fields,values);
			} catch(e) {

			}
		}
    }

    try {
    	var morefilters = [
    						['custrecord_flo_log_spider_count','isnotempty',null],
    						'OR',
    						['custrecord_flo_log_doc_rec_count','isnotempty',null]
    					  ];

    	logs=nlapiSearchRecord("customrecord_flo_spider_log",null,morefilters,null);
    	if(logs) {
    		for(var l=0; logs[l] != null; l++) {
    			try {
					nlapiSubmitField('customrecord_flo_spider_log',logs[0].getId(),fields,values);
				} catch(e) {

				}
    		}
    	}
    } catch(e) {

    }
    

}


function floRunDataFix()
{
		
			try{
            	nlapiScheduleScript('customscript_flo_create_json_active','customdeploy_flo_cust_list');
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
              nlapiScheduleScript('customscript_flo_data_validity_test','customdeploy_flo_data_validity_test_sche');
            }catch(e){
              
            }

 try{
              nlapiScheduleScript('customscript_customizations_make_joinss','customdeploy_flo_cust_to_make_join_all');
            }catch(e){
              
            }




           response.write("<script>alert('Data Fix Scheduled');window.close();</script>");


}
//++ NS-528 Bundle Separation
function isUpdgradeDowndgrade() {
	var isbundlechange = false;

	try {
		var sysnotesfilters = [['internalidnumber','equalto',1],'AND',['systemnotes.field','anyof',['CUSTRECORD_FLO_SPIDER_BACK_EN_DATE']],'AND',['systemnotes.newvalue','isnotempty',null]];
		var sysnotessearch = nlapiSearchRecord('customrecord_flo_spider_configuration', null, sysnotesfilters);
		if(sysnotessearch && sysnotessearch.length > 0) {
			isbundlechange = true;
		}
	} catch(e) {

	}

	return isbundlechange;
}
//-- NS-528 Bundle Separation
function resetStatusReport() {

	var fields = [];
	var values = [];
	
	fields[0] = 'custrecord_flo_autospider_last_run_date';
	values[0] = '';
	
	fields[1] = 'custrecord_flo_spider_front_end';
	values[1] = '';
	
	fields[2] = 'custrecord_flo_spider_back_end';
	values[2] = '';
	
	fields[3] = 'custrecord_flo_script_spider';
	values[3] = '';
	
	fields[4] = 'custrecord_flo_make_joins';
	values[4] = '';
	
	fields[5] = 'custrecord_flo_utiliz_metadata';
	values[5] = '';
	
	fields[6] = 'custrecord_flo_customization_total';
	values[6] = 0;
	
	fields[7] = 'custrecord_flo_total_joins';
	values[7] = 0;
	
	fields[8] = 'custrecord_flo_list_joins';
	values[8] = 0;
	
	fields[9] = 'custrecord_flo_sourcing_join';
	values[9] = 0;
	
	fields[10] = 'custrecord_flo_script_joins';
	values[10] = 0;
	
	fields[11] = 'custrecord_flo_search_join';
	values[11] = 0;
	
	fields[12] = 'custrecord_flo_workflo_joins';
	values[12] = 0;
	
	fields[13] = 'custrecord_flo_form_join';
	values[13] = 0;
	
	fields[14] = 'custrecord_flo_unused_fields';
	values[14] = 0;
	
	fields[15] = 'custrecord_flo_unused_searches';
	values[15] = 0;
	
	fields[16] = 'custrecord_flo_def_scriptid';
	values[16] = 0;
	
	fields[17] = 'custrecord_flo_inactive_owner';
	values[17] = 0;
	
	fields[18] = 'custrecord_flo_unused_records';
	values[18] = 0;
	
	fields[19] = 'custrecord_flo_field_no_parent';
	values[19] = 0;
	
	fields[20] = 'custrecord_flo_no_help';
	values[20] = 0;
	
	fields[21] = 'custrecord_flo_no_desc';
	values[21] = 0;
	
	fields[22] = 'custrecord_flo_unused_scripts';
	values[22] = 0;
	
	fields[23] = 'custrecord_flo_start_tags';
	values[23] = 0;
	
	fields[24] = 'custrecord_flo_end_tags';
	values[24] = 0;
	
	fields[25] = 'custrecord_flo_no_audit_tags';
	values[25] = 0;

	fields[26] = 'custrecord_flo_spider_front_end_date';
	values[26] = '';

	fields[27] = 'custrecord_flo_spider_back_en_date';
	values[27] = '';

	fields[28] = 'custrecord_flo_script_spider_date';
	values[28] = '';

	fields[29] = 'custrecord_flo_make_joins_date';
	values[29] = '';

	fields[30] = 'custrecord_flo_utiliz_metadata_date';
	values[30] = '';

	fields[31] = 'custrecord_flo_remaining_obj_to_join';
	values[31] = '';

	fields[32] = 'custrecord_flo_last_completed_spider';
	values[32] = '';

	fields[33] = 'custrecord_flo_bundle_version';
	values[33] = '';

	fields[34] = 'custrecord_flo_script_queues_set';
	values[34] = 'F';

	fields[35] = 'custrecord_flo_number_queues';
	values[35] = '';

	fields[36] = 'custrecord_flo_number_flodocs_ss_running';
	values[36] = 0;

	fields[37] = 'custrecord_flo_session_lost';
	values[37] = '';

	fields[38] = 'custrecord_flo_segment_sets';
	values[38] = 'F';

	fields[39] = 'custrecord_flo_las_manual_trigger_user';
	values[39] = '';

	fields[40] = 'custrecord_flo_las_manual_trigger_date';
	values[40] = '';

	fields[41] = 'custrecord_flo_files_pending_to_process';
	values[41] = '';

	fields[42] = 'custrecord_flo_rectypes_notcompleted';
	values[42] = '';

	fields[43] = 'custrecord_flo_total_cr';
	values[43] = '';

	fields[44] = 'custrecord_flo_total_pi';
	values[44] = '';

	fields[45] = 'custrecord_flo_total_policies';
	values[45] = '';

	fields[46] = 'custrecord_flo_spider2_tracker';
	values[46] = '';

  	fields[47] = 'custrecord_flo_autospider_enable';
	values[47] = 'F';
  
  	fields[48] = 'custrecord_flo_installed_from';
	values[48] = '';

	fields[49] = 'custrecord_jira_email';
	values[49] = '';

	fields[50] = 'custrecord_jira_pass';
	values[50] = '';

	fields[51] = 'custrecord_jira_key';
	values[51] = '';

	fields[52] = 'custrecord_jira_hide_credentials';
	values[52] = '';
	
	fields[53] = 'custrecord_jira_compare_token';
	values[53] = '';

	fields[54] = 'custrecord_flo_autospider_initiate_date';
	values[54] = '';

	fields[55] = 'custrecord_flo_stdimpactanalysis_date';
	values[55] = '';

	fields[56] = 'custrecord_flo_erd_usage';
	values[56] = '';

	nlapiSubmitField('customrecord_flo_spider_configuration',1,fields,values);
}