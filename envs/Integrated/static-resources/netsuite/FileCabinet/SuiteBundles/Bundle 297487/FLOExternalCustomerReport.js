function externalReport(request,response) {
	try {
		var config = nlapiLoadRecord("customrecord_flo_spider_configuration",1);
		var custrecord_flo_header = config.getFieldValue("custrecord_flo_header");
		var custrecord_flo_install = config.getFieldValue("custrecord_flo_install");
		var custrecord_flo_last_update = config.getFieldValue("custrecord_flo_last_update");
		var custrecord_flo_script_queues_set = config.getFieldValue("custrecord_flo_script_queues_set") == "T" ? 'Yes' : 'No';
		var custrecord_flo_segment_sets = config.getFieldValue("custrecord_flo_segment_sets") == "T" ? 'Yes' : 'No';
		var custrecord_flo_number_queues = config.getFieldValue("custrecord_flo_number_queues");
		var custrecord_flo_number_flodocs_ss_running = config.getFieldValue("custrecord_flo_number_flodocs_ss_running");
		var custrecord_flo_spider_intro = config.getFieldValue("custrecord_flo_spider_intro");
		var custrecord_flo_autospider_enable = config.getFieldValue("custrecord_flo_autospider_enable")== "T" ? 'Yes' : 'No';
		var custrecord_flo_autospider_last_run_date = config.getFieldValue("custrecord_flo_autospider_last_run_date");
		var custrecord_flo_last_completed_spider = config.getFieldValue("custrecord_flo_last_completed_spider");
		var custrecord_flo_las_manual_trigger_user = config.getFieldValue("custrecord_flo_las_manual_trigger_user");
		var custrecord_flo_las_manual_trigger_date = config.getFieldValue("custrecord_flo_las_manual_trigger_date");
		var custrecord_flo_session_lost = config.getFieldValue("custrecord_flo_session_lost");
		var custrecord_flo_spider_front_end = config.getFieldText("custrecord_flo_spider_front_end");
		var custrecord_flo_spider_back_end = config.getFieldText("custrecord_flo_spider_back_end");
		var custrecord_flo_script_spider = config.getFieldText("custrecord_flo_script_spider");
		var custrecord_flo_make_joins = config.getFieldText("custrecord_flo_make_joins");
		var custrecord_flo_utiliz_metadata = config.getFieldText("custrecord_flo_utiliz_metadata");
		var custrecord_flo_rectypes_notcompleted = config.getFieldValue("custrecord_flo_rectypes_notcompleted");
		var custrecord_flo_files_pending_to_process = config.getFieldValue("custrecord_flo_files_pending_to_process");
		var custrecord_flo_remaining_obj_to_join = config.getFieldValue("custrecord_flo_remaining_obj_to_join");
		var custrecord_flo_bundle_version = config.getFieldValue("custrecord_flo_bundle_version");

		var custrecord_flo_doc_rec_overview = config.getFieldValue("custrecord_flo_doc_rec_overview");


		var form=nlapiCreateForm("Strongpoint", false);
		
		var group1 = form.addFieldGroup( 'maingroup', 'Configuration and Stats');
		form.addField('overview', 'richtext', null, null,'maingroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue(custrecord_flo_header);
		form.addField('reportcss','inlinehtml').setDefaultValue("<style>.bgbar{display:none} td.fgroup_title{background-color:orange;} .smalltextnolink,.input {font-size: 12pt !important;font-weight: bold;} .smalltextnolink {color: grey !important;} div.fgroup_title {font-size: 18px !important;} .uir-list-row-tr > td {font-size: 11px;} </style><script src='https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js'></script><script>$(document).ready(function(){ $('.fgroup_title').css('color','#000000'); $('#spiderlogs_val').closest('table').attr('align','center').attr('width','95%'); $('.uir-outside-fields-table td').attr('align','left'); });</script>")
		form.addField('dateinstalled','date',"Date Installed",null,'maingroup').setDisplayType('inline').setDefaultValue(custrecord_flo_install);
		form.addField('lastupdated','date',"Last Updated",null,'maingroup').setDisplayType('inline').setDefaultValue(custrecord_flo_last_update);
		form.addField('scriptqueuesset','text',"Schedule Script Queues set",null,'maingroup').setDisplayType('inline').setDefaultValue(custrecord_flo_script_queues_set);
		form.addField('segmentsset','text',"Row in List Segments Sets",null,'maingroup').setDisplayType('inline').setDefaultValue(custrecord_flo_segment_sets);
		form.addField('noofqueues','text',"Number of Queues",null,'maingroup').setDisplayType('inline').setBreakType("startcol").setDefaultValue(custrecord_flo_number_queues);
		form.addField('scriptrunning','integer',"Avg. Five days Number of Schedule Script running (excluding Strongpoint)",null,'maingroup').setDisplayType('inline').setDefaultValue(custrecord_flo_number_flodocs_ss_running);
		form.addField('bundleversion','text',"Bundle Version",null,'maingroup').setDisplayType('inline').setDefaultValue(custrecord_flo_bundle_version);
		form.addField('dummyforcolumn','text','',null,'maingroup').setDisplayType('inline').setBreakType("startcol").setDefaultValue('&nbsp;')

		var group2 = form.addFieldGroup( 'spiderstatusgroup', 'Spider Status');
		form.addField("intro",'richtext','Spider Status Intro',null,'spiderstatusgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue('');
		form.addField("introtext",'richtext','',null,'spiderstatusgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue(custrecord_flo_spider_intro);
	    form.addField('autospiderenabled','text',"Auto Spider Enabled",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_autospider_enable);
	    form.addField('autospidelastrun','text',"Auto Spider Last Run Date",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_autospider_last_run_date);

	    form.addField('lastspideredrec','text',"Last Completed Spider",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_last_completed_spider);
	    form.addField('lastspiderby','text',"Last Manual Spider Trigger by",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_las_manual_trigger_user);
	    form.addField('lastspiderdate','text',"Last Manual Spider Trigger date",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_las_manual_trigger_date);
	    form.addField('sessionlost','text',"Session Lost",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_session_lost);
	    form.addField('spiderfront','text',"Spider - Front End",null,'spiderstatusgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_spider_front_end);
	    form.addField('spiderback','text',"Spider - Back End",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_spider_back_end);
	    form.addField('spiderparser','text',"Spider - Script Parser",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_script_spider);
	    form.addField('spidermakejoins','text',"Spider - Make Joins",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_make_joins);
	    form.addField('spidermetadata','text',"Spider - Gather Utilization Metadata",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_utiliz_metadata);
	    form.addField('unfinishedrecs','text',"Record Types with Unfinished Indexing",null,'spiderstatusgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_rectypes_notcompleted);
	    form.addField('pendingfiles','text',"Files Pending to process",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_files_pending_to_process);
	    form.addField('remainingobjectstojoin','text',"Remaining Objects to Join",null,'spiderstatusgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_remaining_obj_to_join);

	    form.addField("documentoverviewlabel",'richtext','Documented Records Overview',null,'spiderstatusgroup').setDisplayType("inline").setLayoutType("outsidebelow", "startrow").setDefaultValue('');
	    form.addField("documentoverview",'richtext','',null,'spiderstatusgroup').setDisplayType("inline").setLayoutType("outsidebelow", "startrow").setDefaultValue(custrecord_flo_doc_rec_overview);

	    var columns = [];
	    columns.push(new nlobjSearchColumn( 'custrecord_flo_log_type' ));
	    columns.push(new nlobjSearchColumn( 'custrecord_flo_log_spider_count' ));
	    columns.push(new nlobjSearchColumn( 'custrecord_flo_log_doc_rec_count' ));
	    columns.push(new nlobjSearchColumn( 'custrecord_flo_log_status' ));
	    columns[3].setSort(true);

	    var spiderlogs = nlapiSearchRecord('customrecord_flo_spider_log', null, null, columns); 
	    var content = "<table width='100%' cellpadding='0' cellspacing='0'>";
	    if(spiderlogs) {
	    	content += '<thead><tr class="uir-list-headerrow "><td height="100%" id="div__lab1" nowrap="" class="listheadernosort listheadertextb uir-list-header-td" style="font-weight:bold !important;" data-label="Customization Type"><span class="">Customization Type</span></td><td height="100%" id="div__lab2" nowrap="" class="listheadernosort listheadertextbrt uir-list-header-td uir-list-header-align-rt" data-label="Spider Count"><span class="">Spider Count</span></td><td height="100%" id="div__lab3" nowrap="" class="listheadernosort listheadertextbrt uir-list-header-td uir-list-header-align-rt" data-label="Documented Record Count"><span class="">Documented Record Count</span></td><td height="100%" id="div__lab4" nowrap="" class="listheadernosort listheadertextb uir-list-header-td" data-label="Spider Status" style="font-weight:bold !important;"><span class="">Spider Status</span></td></tr></thead><tbody>'
	    	for(var i=0; spiderlogs[i] != null; i++) {
	    		content += '<tr class="uir-list-row-tr uir-list-row-even" id="recmachcustrecord_flo_config_stats_linkrow0"><td valign="top" class="printtexttable uir-list-row-cell" style="">'+spiderlogs[i].getText('custrecord_flo_log_type')+'</td><td valign="top" class="printtexttablert uir-list-row-cell" style="">'+spiderlogs[i].getValue('custrecord_flo_log_spider_count')+'</td><td valign="top" class="printtexttablert uir-list-row-cell" style="">'+spiderlogs[i].getValue('custrecord_flo_log_doc_rec_count')+'</td><td valign="top" class="printtexttable uir-list-row-cell" style="">'+spiderlogs[i].getValue('custrecord_flo_log_status')+'</td></tr>';
	    	}
	    	content += "</tbody>";
	    }
	    content += "</table>";
	    form.addField("spiderlogs",'inlinehtml','',null,'spiderstatusgroup').setLayoutType("outsidebelow", "startrow").setDefaultValue(content);

	    var custrecord_flo_documentation_stats = config.getFieldValue('custrecord_flo_documentation_stats');
	 	var custrecord_flo_customization_total = config.getFieldValue('custrecord_flo_customization_total');
	 	var custrecord_flo_total_joins = config.getFieldValue('custrecord_flo_total_joins');
	 	var custrecord_flo_list_joins = config.getFieldValue('custrecord_flo_list_joins');
	 	var custrecord_flo_sourcing_join = config.getFieldValue('custrecord_flo_sourcing_join');
	 	var custrecord_flo_script_joins = config.getFieldValue('custrecord_flo_script_joins');
	 	var custrecord_flo_search_join = config.getFieldValue('custrecord_flo_search_join');
	 	var custrecord_flo_workflo_joins = config.getFieldValue('custrecord_flo_workflo_joins');
	 	var custrecord_flo_form_join = config.getFieldValue('custrecord_flo_form_join');

	    var group3 = form.addFieldGroup( 'documentationgroup', 'Documentation');
	    form.addField("docustatlabel",'richtext','Documentation Stats',null,'documentationgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue('');
		form.addField("docustat",'richtext','',null,'documentationgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue(custrecord_flo_documentation_stats);
		form.addField('totalcusts','text',"Total Customizations",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_customization_total);
		form.addField('totaljoins','text',"Total Joins",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_total_joins);
		form.addField('listjoins','text',"List Joins",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_list_joins);
		form.addField('sourcingjoin','text',"Sourcing Join",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_sourcing_join);
		form.addField('scriptjoins','text',"Script Joins",null,'documentationgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_script_joins);
		form.addField('searchjoins','text',"Search Join",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_search_join);
		form.addField('wfjoins','text',"Workflow Joins",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_workflo_joins);
		form.addField('formjoins','text',"Form Join",null,'documentationgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_form_join);

		var custrecord_flo_cleanup_overview = config.getFieldValue('custrecord_flo_cleanup_overview');
		var custrecord_flo_unused_fields = config.getFieldValue('custrecord_flo_unused_fields');
		var custrecord_flo_unused_searches = config.getFieldValue('custrecord_flo_unused_searches');
		var custrecord_flo_def_scriptid = config.getFieldValue('custrecord_flo_def_scriptid');
		var custrecord_flo_inactive_owner = config.getFieldValue('custrecord_flo_inactive_owner');
		var custrecord_flo_unused_records = config.getFieldValue('custrecord_flo_unused_records');
		var custrecord_flo_field_no_parent = config.getFieldValue('custrecord_flo_field_no_parent');
		var custrecord_flo_no_help = config.getFieldValue('custrecord_flo_no_help');
		var custrecord_flo_no_desc = config.getFieldValue('custrecord_flo_no_desc');

		var group4 = form.addFieldGroup( 'cleanupgroup', 'Clean-Up');
		form.addField("cleanuplabel",'richtext','Documentation Stats',null,'cleanupgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue('');
		form.addField("cleanuptext",'richtext','',null,'cleanupgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue(custrecord_flo_cleanup_overview);
		form.addField('unusedfields','text',"Unused Fields",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_unused_fields);
		form.addField('unusedsearches','text',"Unused Searches",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_unused_searches);
		form.addField('defids','text',"Customizations with Default Script Ids",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_def_scriptid);
		form.addField('inactiveowner','text',"Customizations with No Active Owner",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_inactive_owner);
		form.addField('unusedrecords','text',"Unused Records",null,'cleanupgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_unused_records);
		form.addField('fieldsnoparent','text',"Fields With No Parent",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_field_no_parent);
		form.addField('fieldsnohelp','text',"Custom Fields with No Help",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_no_help);
		form.addField('custnodesc','text',"Customizations with No Description",null,'cleanupgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_no_desc);

		var custrecord_flo_script_mgt_overview = config.getFieldValue('custrecord_flo_script_mgt_overview');
		var custrecord_flo_unused_scripts = config.getFieldValue('custrecord_flo_unused_scripts');
		var custrecord_flo_start_tags = config.getFieldValue('custrecord_flo_start_tags');
		var custrecord_flo_end_tags = config.getFieldValue('custrecord_flo_end_tags');
		var custrecord_flo_no_audit_tags = config.getFieldValue('custrecord_flo_no_audit_tags');

		var group5 = form.addFieldGroup( 'scripmgmtgroup', 'Script Management');
		form.addField("scriptstatlabel",'richtext','Script Management Stats',null,'scripmgmtgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue('');
		form.addField("scriptstattext",'richtext','',null,'scripmgmtgroup').setDisplayType("inline").setLayoutType("outsideabove", "startrow").setDefaultValue(custrecord_flo_script_mgt_overview);

		form.addField('unusedscript','text',"Potentially Unused Scripts",null,'scripmgmtgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_unused_scripts);
		form.addField('scriptswithflostarttags','text',"Scripts with FLOStart Tags",null,'scripmgmtgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_start_tags);
		form.addField('scriptswithfloendtags','text',"Scripts with FLOEnd Tags",null,'scripmgmtgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_end_tags);
		form.addField('scriptsnoaudittags','text',"Scripts with No Audit Tags",null,'scripmgmtgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_no_audit_tags);

		var custrecord_flo_script_start_time = config.getFieldValue('custrecord_flo_script_start_time');
		var custrecord_flo_script_end_time = config.getFieldValue('custrecord_flo_script_end_time');
		var custrecord_flo_enable_auto_arch = config.getFieldValue('custrecord_flo_enable_auto_arch') == 'T' ? 'Yes' : 'No';
		var custrecord_flo_auto_archive_folder = config.getFieldValue('custrecord_flo_auto_archive_folder');
		var custrecord_flo_process_enabled = config.getFieldValue('custrecord_flo_process_enabled') == 'T' ? 'Yes' : 'No';
		var custrecord_flo_process_issue_assing = config.getFieldValue('custrecord_flo_process_issue_assing');
		var custrecord_flo_process_issue_approver = config.getFieldValue('custrecord_flo_process_issue_approver');
		var custrecord_flo_disable_autospider = config.getFieldValue('custrecord_flo_disable_autospider') == 'T' ? 'Yes' : 'No';
		var custrecord_flo_ss_time_limi = config.getFieldValue('custrecord_flo_ss_time_limi');
		var custrecord_flo_enable_remote_sr = config.getFieldValue('custrecord_flo_enable_remote_sr')== 'T' ? 'Yes' : 'No';
		var custrecord_flo_total_cr = config.getFieldValue('custrecord_flo_total_cr');
		var custrecord_flo_total_pi = config.getFieldValue('custrecord_flo_total_pi');
		var custrecord_flo_total_policies = config.getFieldValue('custrecord_flo_total_policies');
		
		var group6 = form.addFieldGroup( 'installgroup', 'Installation');
		form.addField('starttime','text',"Start Time",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_script_start_time);
		form.addField('endtime','text',"End Time",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_script_end_time);
		form.addField('enablearchive','text',"Enable Auto Archive",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_enable_auto_arch);
		form.addField('archivefolder','text',"Auto Archive Folder",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_auto_archive_folder);
		form.addField('enableprocessissue','text',"Enable Auto Process Issue",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_process_enabled);
		form.addField('piassigned','text',"Process Issue Assigned",null,'installgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_process_issue_assing);
		form.addField('piapprover','text',"Process Issue Approver",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_process_issue_approver);
		form.addField('disablereport','text',"Disable Spider Last Use Report",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_disable_autospider);
		form.addField('searchlimite','text',"Saved Searches Spider Time Limit",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_ss_time_limi);
		form.addField('enableremotestatreport','text',"Enable Remote Status Report",null,'installgroup').setBreakType("startcol").setDisplayType('inline').setDefaultValue(custrecord_flo_enable_remote_sr);
		form.addField('totalcr','text',"Total Change Requests",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_total_cr);
		form.addField('totalpi','text',"Total Process Issue",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_total_pi);
		form.addField('totalpolicies','text',"Total Policies",null,'installgroup').setDisplayType('inline').setDefaultValue(custrecord_flo_total_policies);

		var context = nlapiGetContext();
		var userAccountId = context.getCompany()
		form.setTitle(userAccountId +" Status Report");
		response.writePage( form );
	} catch(e) {

	}
	

}