var totalResultsGlobal = 0;

/**
* Displays the Welcome Portlet
*/
function welcome(portlet, column) {
	var daysSinceLastSpider = getDaysSinceLastSpider();
	var color = getColorForDaysSinceSpider(daysSinceLastSpider);
	var content = '<div id="ns-dashboard-heading-panel" style="width: 100%;"><h1 style="padding:5px;float: none; display: block;">Welcome~</h1>';
	content +='<h2 style="font-size:18pxpadding: 5px;float: none; display: block;">Welcome to <i>Flashlight&trade;</i> by Strongpoint - the only solution for documenting your NetSuite account.<br />Reduce risk by documenting your entire NetSuite account - answer the question "If I change this, what will break?"<br />Save time and money by saving hundreds of hours documenting and troubleshooting your system.<br />Move faster by using the Flashlight™ dashboard & ERD to spot problems before they happen & respond to your users more quickly.<br />Every change in your account is rapidly & efficiently documented, logged, linked across all customizations and ready for audit.<br><br><a href="#">Videos Placeholder</a><br><br><a href="#">User Guide Placeholder</a><br><br><br></h2>';
	content +='<h2 style="position:absolute;top: 15%; left: 64%;font-size:18px;padding:5px; float: right;margin-bottom: 50px;font-size:18px;padding:5px; float: right;margin-bottom: 50px;"><font color="grey"><br><br><span class="ns-reminder-item-color" style="background-color: rgb(197, 14, 0);"></span> Click <a href="https://system.netsuite.com/app/common/custom/custrecordentry.nl?rectype=339&id=1&e=T">here </a>to set the weekly report recipients</font><br><br></h2>';
	content += '<h2 style="position:absolute;top: 10%; left: 64%;font-size:18px;padding:5px; float: right;margin-bottom: 50px;font-size:18px;padding:5px; float: right;margin-bottom: 50px;">Spider Status: Done<br><font color="'+color+'">'+daysSinceLastSpider+' days</font> since last system spider (Respider <a href="https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=353&deploy=2&compid=TSTDRV1049933&whence=">Now</a>)</h2>';


	portlet.setHtml( content );
    portlet.setTitle("Flashlight™ By Strongpoint");
}

/**
* Calculates Number of Days since the Last Spider Date
*/
function getDaysSinceLastSpider() {

	var dayDiff = -1;
	try {
		var installationSettings = nlapiLoadRecord('customrecord_flo_spider_configuration', 1);

		//Last Complete Spider Date
		var lastManualSpiderTriggerDate = installationSettings.getFieldValue('custrecord_flo_spider_front_end_date');
		var lastSpider = null;
		if(lastManualSpiderTriggerDate) {
			lastSpider = nlapiStringToDate(lastManualSpiderTriggerDate,'datetime');
		}
		
		//Get Current Date Time
		var dumdum = nlapiCreateRecord('customrecord_flo_spider_configuration');
		var currentDate = dumdum.getDateTimeValue('custrecord_flo_current_server_time');
		currentDate = nlapiStringToDate(currentDate,'datetime');

		
		if(lastSpider && currentDate) {
			var diff = currentDate.getTime() - lastSpider.getTime();
			dayDiff = Math.floor(diff / (1000 * 3600 * 24));
		}
		
	} catch(e) {
		nlapiLogExecution('debug', 'getDaysSinceLastSpider e', e)
	}
	
	return dayDiff;
}

/**
* Pick text color based of Days since Last Spider.
*/
function getColorForDaysSinceSpider(dayDiff){
	if(dayDiff < 7)return 'green';
	if(dayDiff >= 7 && dayDiff <= 10)return '#ffca00';
	if(dayDiff > 10)return 'red';
	return 'black';
}

/**
* Retrieves overall spider status based from Spider, Make Join and Parser status.
*/
function getSpiderStatus() {
	var status = '<span style="color:red">Not Started</span>';
	var IN_PROGRESS = "In Progress";
	var COMPLETE = "Completed";
	try {

		var installationSettings = nlapiLoadRecord('customrecord_flo_spider_configuration', 1);
        var spiderfrontstatusval = installationSettings.getFieldValue('custrecord_flo_spider_front_end') || "";
		var spiderfrontstatus = installationSettings.getFieldText('custrecord_flo_spider_front_end') || "";
		var spiderbackstatus = installationSettings.getFieldText('custrecord_flo_spider_back_end') || "";
		var parserstatus = installationSettings.getFieldText('custrecord_flo_script_spider') || "";
		var makejoinstatus = installationSettings.getFieldText('custrecord_flo_make_joins') || "";

		if(spiderfrontstatus == IN_PROGRESS || spiderbackstatus == IN_PROGRESS || parserstatus == IN_PROGRESS || makejoinstatus == IN_PROGRESS) {
			status = '<span style="color:#ffca00;font-weight:bold">In Progress</span>';
		} else if(spiderfrontstatus == COMPLETE && spiderbackstatus == COMPLETE && parserstatus == COMPLETE && makejoinstatus == COMPLETE) {
			status = '<span style="color:green;font-weight:bold">Done</span>';
		} else if(spiderfrontstatusval != null && spiderfrontstatusval != "") {
			status = '<span style="color:#ffca00;font-weight:bold">In Progress</span>';
		}

	} catch(e) {
		nlapiLogExecution('audit', 'getSpiderStatus', e)
	}
	return status;
}

/**
* HTML Portlet that displays Spider Status and Days Since Last Spider
*/
function showLastSpider(portlet) {
	var content = "";
	portlet.setTitle("Spider Status");
	try {
		var licenseOk = 0;

	    try {
	        licenseOk = licenseManager();
	    } catch(e) {
	        licenseOk = 0;
	    }

	    if (licenseOk == -1) {
	        content = "Flashlight is not registered, please go to <a href='http://strongpoint.io/purchase' target='_blank'>http://strongpoint.io/purchase</a> to get your Flashlight instance ready to use.";
	    } else if (licenseOk == 0) {
          	content = "There is no valid license for the current user, please contact Flashlight@Strongpoint.io";
    	} else {
	    	var spiderURL = nlapiResolveURL('SUITELET', 'customscript_flo_enterprise_suitelet', 'customdeploy_flo_spider_entry');
			var daysSinceLastSpider = getDaysSinceLastSpider();
			var color = getColorForDaysSinceSpider(daysSinceLastSpider);
			var linkText = "";
			var daysText = "";
			if(daysSinceLastSpider > -1) {
				daysText = '<font color="'+color+'" style="font-size:18px;font-weight:bold">'+daysSinceLastSpider+' </font><span class="ns-reminder-item-label"> days since last system spider</span>';
			} 
			
			var spiderStatus = getSpiderStatus();
			if(daysText == "" && spiderStatus && spiderStatus.indexOf('Not Started') != -1) {
				linkText = 'Start documenting your account with the <a href="'+spiderURL+'">Flashlight Spider</a>';
			} else {
				linkText = '(Respider <a href="'+spiderURL+'">Now</a>)';
			}

			var content = "";
			content += '<div style="height:55px;"><span class="ns-reminder-item-label">Spider Status: </span><strong>'+spiderStatus+'</strong><br><br>'+daysText+'<span class="ns-reminder-item-label"> '+linkText+'</span></div>';

            var urlHTMLContent = nlapiResolveURL('SUITELET', 'customscript_flo_get_html_content', 1);
            content += '<script>req=top.jQuery.get("' + urlHTMLContent + '");</script>';  			
	    }
		

	} catch(e) {
		nlapiLogExecution('audit', 'showLastSpider', e)
	}
	portlet.setHtml( content );
}

/**
* HTML Portlet that displays account summary which includes: Total Customizations, Total Joins, 
* Total Customizations Without Description / Bad Script ID /  Missing Help, and 
* Customizations with Standard Script IDs needs to be changed to Customizations with Poor Script IDs
*/
function showAccountSummary(portlet) {
	nlapiLogExecution('AUDIT', 'Summary Start', new Date().getTime());
	var content = "<style>.textLabel {font-size: 11px;font-weight: normal !important; color: #255599 !important;text-transform: uppercase} .textTotal {font-size: 1em;font-weight: 600 !important; color: #666666 !important; vertical-align:top;}</style>"
	portlet.setTitle("Last Spider Run Summary");
	try {
		var installationSettings = nlapiLoadRecord('customrecord_flo_spider_configuration', 1);
		var custrecord_flo_customization_total = installationSettings.getFieldValue('custrecord_flo_customization_total');
		var custrecord_flo_total_joins = installationSettings.getFieldValue('custrecord_flo_total_joins');
		var custrecord_flo_list_joins = installationSettings.getFieldValue('custrecord_flo_list_joins');
		var custrecord_flo_sourcing_join = installationSettings.getFieldValue('custrecord_flo_sourcing_join');
		var custrecord_flo_script_joins = installationSettings.getFieldValue('custrecord_flo_script_joins');
		var custrecord_flo_search_join = installationSettings.getFieldValue('custrecord_flo_search_join');
		var custrecord_flo_workflo_joins = installationSettings.getFieldValue('custrecord_flo_workflo_joins');
		var custrecord_flo_form_join = installationSettings.getFieldValue('custrecord_flo_form_join');
      
		var data = getAccountSummaryData();
      
		//Common Filters: isinactive = F, managed bundle is F, type does not contain Standard
		//Customizations without Description Filters
		var noDescFilters = [['custrecord_flo_description','isempty',null],'AND',['formulatext: {custrecord_flo_cust_type}','doesnotcontain','Search'],'AND',['custrecord_flo_bundle','isempty',null]];
		//Customizations Missing Help
		var noHelpFilters = [['custrecord_flo_help','isempty',null],'AND',['custrecord_flo_cust_type','anyof',[5, 26, 4, 25, 30, 3, 29, 28, 27]],'AND',["formulanumeric: INSTR(REPLACE(REPLACE(REPLACE({custrecord_flo_cust_page_xml},'iconhelp',''),',help,',''),'billableprefshelp',''),'help')",'equalto',0]];
		//Customizations with Bad ID
		var badScriptIdFilter = [['custrecord_flo_cust_type','noneof',[51]],'AND',[['custrecord_flo_cust_type','anyof',[5, 4, 25, 3, 26, 29, 28, 27]],'OR',['formulatext:{custrecord_flo_searches.custrecord_flo_search_formulas}','isnotempty',null],'OR',['formulatext: {custrecord_flo_wflws}','isnotempty',null],'OR',['formulatext: {custrecord_flo_scripts}','isnotempty',null]],'AND',["formulanumeric: REGEXP_INSTR({custrecord_flo_cust_id},'cust[a-z]*[0-9]')",'greaterthan',0]]

		var combinedFilters = [['isinactive','is','F'],'AND',['formulatext: {custrecord_flo_cust_type}','doesnotcontain','Standard'],'AND',['custrecord_flo_manage_bundle','is','F'],'AND',[noDescFilters,'OR',noHelpFilters,'OR',badScriptIdFilter]];

		var totalCols = [new nlobjSearchColumn('internalid', null, 'count')];

		var totalSearch = nlapiSearchRecord('customrecord_flo_customization', null, combinedFilters, totalCols);
		var totalNoDescHelpBadId = 0;
		if(totalSearch && totalSearch[0]) {
			var rescols = totalSearch[0].getAllColumns();
			totalNoDescHelpBadId = totalSearch[0].getValue(rescols[0]);
		}
		content += "<table width='100%'>";
      
		// 2 column version
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>Documentation Summary</span> </td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'></td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_new_custs_all+"</span> CUSTOMIZATIONS</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_updated_custs_all+"</span> CUSTOMIZATIONS UPDATED</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_deleted_custs_all+"</span> DELETED CUSTOMIZATIONS</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_total_joins+"</span> TOTAL DEPENDENCIES</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_total_joins+"</span> TOTAL DEPENDENCIES</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span></td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_list_joins+"</span> LIST DEPENDENCIES</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_workflo_joins+"</span> WORKFLOW DEPENDENCIES</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_search_join+"</span> SEARCH DEPENDENCIES</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_script_joins+"</span> SCRIPT DEPENDENCIES</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_sourcing_join+"</span> SOURCING DEPENDENCIES</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_form_join+"</span> FORM DEPENDENCIES</td></tr></table></td></tr>";
	

		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_scripts_detected_all+"</span> Scripts Detected</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_wrkflows_detected_all+"</span> Workflows Detected</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_crit_api_risks_all+"</span> Critical API Risks</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_usdby_scripts_all+"</span> Customizations Used by Scripts</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_used_wrkflow_all+"</span> Customizations Used by Workflows</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_publicsearches_all+"</span> Public Saved Searches</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_publicsearch_scrpts_all+"</span> Public Saved Searches Used in Scripts</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_trans_savedsearch_all+"</span> Transactions Saved Searches</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_employeesearch_all+"</span> Employee Saved Searches</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_customer_search_all+"</span> Customer Saved Searches</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_poor_scrptids_all+"</span> Customizations with Poor Script IDs</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_no_help_all+"</span> Customizations With Missing Help</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_no_desc_all+"</span> Customizations with Missing Descriptions</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_cust_no_owner_all+"</span> Customizations With Missing Active Owners</td></tr></table></td></tr>";

		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>USERS SUMMARY</span> </td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'></td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";

		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_employee_std_roles_all+"</span> Employees with Standard Operational Roles</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_unused_logins_all+"</span> Employees With Unused Logins</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_login_new_ip_all+"</span> Employees Logging In From New IP Address</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_employee_perm_chnge_all+"</span> Employee Permission Changes</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_crit_role_change_all+"</span> Critical Role Changes</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_crit_perm_changes_all+"</span> Critical Permission Changes</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_rec_del_risk_all+"</span> Record Deletion Risk Role Changes</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_deleted_recs_all+"</span> Deleted Records</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_undelivered_emails_all+"</span> Undelivered Email Errors</td></tr></table></td><td width='50%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span></td></tr></table></td></tr>";
      
      	
		// 3 columns version

		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_new_custs_all+"</span> CUSTOMIZATIONS</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_updated_custs_all+"</span> CUSTOMIZATIONS UPDATED</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_deleted_custs_all+"</span> DELETED CUSTOMIZATIONS</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_script_errors_all+"</span> SCRIPT ERRORS</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'></td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";

		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'></span> </td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'></td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";

		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_scripts_detected_all+"</span> Scripts Detected</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_wrkflows_detected_all+"</span> Workflows Detected</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_crit_api_risks_all+"</span> Critical API Risks</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_usdby_scripts_all+"</span> New Customization Used By Scripts</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_used_wrkflow_all+"</span> Customizations Used By Workflows</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_publicsearches_all+"</span> Public Saved Searches</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_publicsearch_scrpts_all+"</span> Public Saved Searches Used in Scripts</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_trans_savedsearch_all+"</span> Transactions Saved Searches</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_employeesearch_all+"</span> Employee Saved Searches</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_customer_search_all+"</span> Customer Saved Searches</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_poor_scrptids_all+"</span> Customizations with Poor Script IDs</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_no_help_all +"</span> Customizations with Missing Help</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_custs_no_desc_all+"</span> Customizations with Missing Descriptions</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_cust_no_owner_all +"</span> Customizations with Missing Active Owners</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_employee_std_roles_all +"</span> Employees with Standard Operational Roles</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_unused_logins_all+"</span> Employees with Unused Logins</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_login_new_ip_all+"</span> Employees Logging In From New IP Address</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_employee_perm_chnge_all+"</span> Employee with Permission Changes</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_crit_role_change_all+"</span> Critical Role Changes</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_crit_perm_changes_all+"</span> Critical Permission Changes</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_rec_del_risk_all+"</span> Record Deletion Risk Role Changes</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_deleted_recs_all+"</span> Deleted Records</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+data.customsearch_flo_undelivered_emails_all+"</span> Undelivered Email Errors</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";


		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'></span> </td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'></td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";

		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_total_joins+"</span> TOTAL DEPENDENCIES</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'></td></tr></table></td><td><table><tr valign='top'><td class='textLabel'></td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_list_joins+"</span> LIST DEPENDENCIES</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_sourcing_join+"</span> SOURCING DEPENDENCIES</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_script_joins+"</span> SCRIPT DEPENDENCIES</td></tr></table></td></tr>";
		// content += "<tr valign='top'><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_search_join+"</span> SEARCH DEPENDENCIES</td></tr></table></td><td width='33%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_workflo_joins+"</span> WORKFLOW DEPENDENCIES</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #FFFFFF;vertical-align:top;'></span> <span class='textTotal'>"+custrecord_flo_form_join+"</span> FORM DEPENDENCIES</td></tr></table></td></tr>";

      
		/*content += "<tr valign='top'><td width='25%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #F0F0F0;'></span> TOTAL CUSTOMIZATIONS</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_customization_total+"</td></tr></table></td><td width='25%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #F0F0F0;'></span> TOTAL DEPENDENCIES</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_total_joins+"</td></tr></table></td><td width='25%'><table><tr valign='top'><td class='textLabel'><span class='ns-reminder-item-color' style='background-color: #F0F0F0;'></span> LIST DEPENDENCIES</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_list_joins+"</td></tr></table></td><td><table><tr valign='top'><td class='textLabel'>TOTAL Customizations Without Description / Poor Script ID /  Missing Help</td></tr><tr valign='top'><td class='textTotal'>"+totalNoDescHelpBadId+"</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='25%'><table><tr valign='top'><td class='textLabel'>LIST DEPENDENCIES</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_list_joins+"</td></tr></table></td><td width='25%'><table><tr valign='top'><td class='textLabel'>SOURCING JOINS</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_sourcing_join+"</td></tr></table></td><td width='25%'><table><tr valign='top'><td class='textLabel'>SCRIPT DEPENDENCIES</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_script_joins+"</td></tr></table></td></tr>";
		content += "<tr valign='top'><td width='25%'><table><tr valign='top'><td class='textLabel'>SEARCH DEPENDENCIES</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_search_join+"</td></tr></table></td><td width='25%'><table><tr valign='top'><td class='textLabel'>WORKFLOW JOINS</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_workflo_joins+"</td></tr></table></td><td width='25%'><table><tr valign='top'><td class='textLabel'>FORM DEPENDENCIES</td></tr><tr valign='top'><td class='textTotal'>"+custrecord_flo_form_join+"</td></tr></table></td></tr>";
		//content += "<tr valign='top'><td colspan='3' align='left'><table><tr valign='top'><td class='textLabel'>TOTAL Customizations Without Description / Poor Script ID /  Missing Help</td></tr><tr valign='top'><td class='textTotal'>"+totalNoDescHelpBadId+"</td></tr></table></td></tr>";*/

		content += "</table>";

	} catch(e) {
		nlapiLogExecution('audit', 'showAccountSummary', e)
	}
	nlapiLogExecution('AUDIT', 'Summary End', new Date().getTime());
	portlet.setHtml( content );
}


function getAccountSummaryData() {
	var data = {};
	var searches = [ 
		{search: 'customsearch_flo_new_custs_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_updated_custs_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_deleted_custs_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_script_errors_all', type: 'scriptexecutionlog'},
		//{search: 'customsearch_flo_scripts_detected_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_custs_usdby_scripts_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_publicsearch_scrpts_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_customer_search_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_no_desc_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_unused_logins_all', type: 'employee'},//review later
		{search: 'customsearch_flo_crit_role_change_all', type: 'employee'},
		//{search: 'customsearch_flo_deleted_recs_all', type: 'DeletedRecord'},

		//{search: 'customsearch_flo_wrkflows_detected_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_custs_used_wrkflow_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_trans_savedsearch_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_poor_scrptids_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_cust_no_owner_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_login_new_ip_all', type: 'employee'},//review later
		{search: 'customsearch_flo_crit_perm_changes_all', type: 'employee'},
		//{search: 'customsearch_flo_undelivered_emails_all', type: 'UndeliveredEmail'},

		//{search: 'customsearch_flo_crit_api_risks_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_publicsearches_all', type: 'customrecord_flo_customization'},
		//{search: 'customsearch_flo_employeesearch_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_no_help_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_employee_std_roles_all', type: 'employee'},
		{search: 'customsearch_flo_employee_perm_chnge_all', type: 'employee'},
		//{search: 'customsearch_flo_rec_del_risk_all', type: 'employee'}//review later
	];

	for (var i = 0; i < searches.length; i++) {
		try {
			nlapiLogExecution('AUDIT', 'Processing Search', searches[i].search);
			var resultcount = 0;
			if(!/^customsearch_flo_(unused_logins_all|login_new_ip_all)$/.test(searches[i].search)){
				var searchObj = nlapiLoadSearch(searches[i].type, searches[i].search);
				var results = searchObj.runSearch();
				var resultset = results.getResults(0,1);
				if (resultset && resultset[0]) {
					var columns = resultset[0].getAllColumns();
					data[searches[i].search] = resultset[0].getValue(columns[0]) || '0';
					nlapiLogExecution('debug', JSON.stringify(searches[i]), JSON.stringify(resultset[0].getValue(columns[0])));
				} else {
					data[searches[i].search] = "0";
				}
			}else{
				nlapiLogExecution('DEBUG', 'Exceptional searches', 'Loading Search: '+searches[i].search);
				var searchObj = nlapiLoadSearch(searches[i].type, searches[i].search);
				var results = searchObj.runSearch();
				results.forEachResult(getTotalsUpToFourThousands);
				/*
				var resultset = results.getResults(0,1000);
				if (resultset && resultset.length > 0) {*/
				nlapiLogExecution('DEBUG', 'Exceptional searches', 'Total Results: '+totalResultsGlobal);
					data[searches[i].search] = totalResultsGlobal;//getMoreResults(resultset.length, searchObj, 1);
					nlapiLogExecution('DEBUG', 'Exceptional searches', 'Search Totals: '+data[searches[i].search]+' for search id '+searches[i].search);
				/*}*/
					totalResultsGlobal = 0;
			}
		} catch (e) {
			nlapiLogExecution('debug', e.name, e.message+' - '+JSON.stringify(searches[i]));
		}
	}

	return data;
}

function getTotalsUpToFourThousands(searchResults){
	//nlapiLogExecution('DEBUG', 'getTotalsUpToFourThousands', '');
	totalResultsGlobal++;
	return true;
}

function getMoreResults(totalResults, searchObj, attempt){
	var indexStart = (attempt * 1000) - 1;
	nlapiLogExecution('DEBUG', 'Get More Results', 'Attempt: '+attempt);
	nlapiLogExecution('DEBUG', 'Get More Results', 'total results so far: '+totalResults);
	if(totalResults % 1000 == 0){
		var results = searchObj.runSearch();
		var resultset = results.getResults(indexStart, 1000);
		if(resultset != null && resultset.length > 0){
			totalResults += resultset.length;
		}
		nlapiLogExecution('DEBUG', 'Get More Results', 'amount of results retrieved: '+resultset.length);
		return getMoreResults(totalResults, searchObj, (attempt+1));
	}else{
		return totalResults;
	}
}
