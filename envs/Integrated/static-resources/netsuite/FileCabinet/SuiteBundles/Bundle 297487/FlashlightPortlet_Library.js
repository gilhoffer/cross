var reminders = {
	headlines : [
		{ id: 'customsearch_flo_new_custs_document_2', name: 'New Customizations'},
		{ id: 'customsearch_flo_yesterday_error_rept', name: 'Script Errors from Yesterday'},
		{ id: 'customsearch_flo_new_obj_documented_3', name: 'Customizations Updated'},
		{ id: 'customsearch_flo_deleted_custs_ligh_2', name: 'Deleted Customizations'}
	],
	others : [
		{ id: 'customsearch_flo_workflow_detected_3', name: 'Scripts Detected'},
		{ id: 'customsearch_flo_cust_filter_2_3_2__8', name: 'New Critical API risks'},
		{ id: 'customsearch_flo_scripted_object_de_5', name: 'New Customizations used by Scripts'},
		{ id: 'customsearch_flo_scripted_object_de_4', name: 'New Customizations used by Workflows'},
		{ id: 'customsearch_flo_cust_filter_2_3_2__7', name: 'New Public Saved Searches'},
		{ id: 'customsearch_flo_cust_filter_2_3_2__6', name: 'New Public Saved Searches Used in Scripts'},
		{ id: 'customsearch_flo_cust_filter_2_3_3', name: 'New Transactions Saved Searches'},
		{ id: 'customsearch_flo_cust_filter_2_3_2_3', name: 'New Employee Saved Searches'},
		{ id: 'customsearch_flo_cust_filter_2_3_2__9', name: 'New Customer Saved Searches'},
		{ id: 'customsearch_scripts_default_ids', name: 'Customizations with Poor Script IDs'},
		{ id: 'customsearch_flo_custs_no_help_ligh_2', name: 'Customizations with Missing Help'},
		{ id: 'customsearch_flo_custs_no_desc_ligh_2', name: 'Customizations with Missing Descriptions'},
		{ id: 'customsearch_flo_cust_no_owner_ligh_2', name: 'Customizations with Missing Active Owners'},
		{ id: 'customsearch_employees_standard_roles', name: 'Employees with Standard Operational Roles'},
		{ id: 'customsearch_flo_unused_logins', name: 'Employees with Unused Logins'},
		{ id: 'customsearch_flo_unused_logins_2', name: 'Employees Logging In From New IP Address'},
		{ id: 'customsearch_flo_employee_perm_change', name: 'Employee Permission Changes'},
		{ id: 'customsearch_flo_employee_role_change_2', name: 'Critical Role Changes'},
		{ id: 'customsearch_flo_employee_global_perm_2', name: 'Critical Permission Changes'},
		{ id: 'customsearch_flo_employee_role_change__2', name: 'Record Deletion Risk Role Changes'},
		{ id: 'customsearch_flo_deleted_records_2_2', name: 'Deleted Records'},
		{ id: 'customsearch_flo_undelivered_emails', name: 'Undelivered Email Errors'}
	]
};

function getReminderPortletData() {
	var headlines = reminders.headlines;
	for(var i in headlines) {
		var savedSearchItem = headlines[i];
		var count = getSavedSearchDataCount(savedSearchItem.id);
		if(count > 0) {
			headlines[i].count = count;
		}
	}
	reminders.headlines = headlines;

	var others = reminders.others;
	for(var i in others) {
		var savedSearchItem = others[i];
		var count = getSavedSearchDataCount(savedSearchItem.id);
		if(count > 0) {
			others[i].count = count;
		}
		else {
			others[i].count = 0;
		}
	}
	reminders.others = others;

	return {headlines: headlines, others: others};	
}

function getSavedSearchDataCount(savedSearchId) {
	var count = 0;
	var columns = [new nlobjSearchColumn('internalid', null, 'count')];
	try {
		var saveSearchCountResults = nlapiSearchRecord(null, savedSearchId, null, columns);
		nlapiLogExecution("DEBUG", "saveSearchCountResults", savedSearchId + ': ' + JSON.stringify(saveSearchCountResults[0]));
		if(saveSearchCountResults && saveSearchCountResults[0].getValue('internalid', null, 'count') != null) {
			count = saveSearchCountResults[0].getValue('internalid', null, 'count') || 0;
		}		
	}
	catch(e) {
		nlapiLogExecution("DEBUG", "error", savedSearchId + ': ' + e);
		try{
			if(savedSearchId == 'customsearch_flo_undelivered_emails') {
				saveSearchCountResults = nlapiSearchRecord(null, savedSearchId, null, null);
			}
			else if(savedSearchId == 'customsearch_flo_deleted_records_2_2') {
				saveSearchCountResults = nlapiSearchRecord('DeletedRecord', savedSearchId, null, null);
			}

			if(saveSearchCountResults) {
				count = saveSearchCountResults.length || 0;
			}
		}
		catch(e2) {
			count = 0;
		}

	}
	
	return count;
}

function getFormattedReminderPortletData() {
	reminderPortletData = getReminderPortletData();
	nlapiLogExecution("DEBUG", "reminderPortletData", JSON.stringify(reminderPortletData));
	if(reminderPortletData) {
		var headlineData = '<table width="100%" border="0" cellspacing="2" cellpadding="2" style="color:#696969;"><tr>';
		var headlines = reminderPortletData.headlines;
		var columnCounter = 0;
		for(var i in headlines) {
			var savedSearchData = headlines[i];
			if(savedSearchData.hasOwnProperty('count') && savedSearchData.count > 0) {
				var highlightColor = '';
				if(savedSearchData.id == 'customsearch_flo_new_custs_document_2') {
					highlightColor = 'color:#008000;'; // Green
				}
				else {
					highlightColor = 'color:#FF0000;'; // Red
				}
				headlineData += '<td style="font-size:16px; font-family:Verdana,Arial,Helvetica,sans-serif;"><font style="' + highlightColor + '"><b>' + savedSearchData.count + '</b></font>&nbsp;' + savedSearchData.name + '</td>';
				columnCounter++;
			}
			if(columnCounter == 3) {
				columnCounter = 0;
				headlineData += '</tr><tr>';
			}
		}
		headlineData += '</tr></table>';

		var otherData = '<table width="100%" border="0" cellspacing="2" cellpadding="2" style="color:#696969;"><tr>';
		var others = reminderPortletData.others;
		var columnCounter = 0;
		for(var i in others) {
			var savedSearchData = others[i];
			if(savedSearchData.hasOwnProperty('count') && savedSearchData.count > 0) {
				otherData += '<td><b>' + savedSearchData.count + '</b> ' + savedSearchData.name + '</td>';
				columnCounter++;
			}
			if(columnCounter == 3) {
				columnCounter = 0;
				otherData += '</tr><tr>';
			}
		}
		otherData += '</tr></table>';		
	}

	return headlineData + '<br>' + otherData;
}

function getBundleOwnerDetails() {
	var columns = [new nlobjSearchColumn('entityid', 'owner')];
	columns.push(new nlobjSearchColumn('email', 'owner'));
	//++ NS-2038
	columns.push(new nlobjSearchColumn('internalid', 'owner'))
	//var result = nlapiSearchRecord("customrecord_flo_spider_configuration", null, null, columns);
	var result = nlapiSearchRecord("customrecord_flo_spider_configuration",null, [['owner.isinactive','is','F']], columns);
	//-- NS-2038
	var owner = {};
	if (result && result[0] != undefined) {
		owner = {
			name: result[0].getValue('entityid', 'owner'),
			email: result[0].getValue('email', 'owner'),
			//NS-2038
			id: result[0].getValue('internalid', 'owner')
		};
	}
	return owner;	
}

/*function loadSpiderCompletionEmailTemplate() {
	var template = null;

    //Search for file ID
    var ssfilters = new Array();
    ssfilters.push(new nlobjSearchFilter('name', null, 'startswith', 'SpiderCompletionTemplate'));
    var fileList = nlapiSearchRecord(null, 'customsearch_email_template_files', ssfilters)
    if (fileList) {
        var columns = fileList[0].getAllColumns();
        var emailTemplateId = fileList[0].getValue(columns[1]);
        if(emailTemplateId) {
        	var templateFile = nlapiLoadFile(emailTemplateId);
            var templateContent = templateFile.getValue();
            if(templateContent && templateContent.trim() != '') {
				template = templateContent;
            }
        }
    }

	return template;
}*/


function getAccountSummary(installationSettings) {
	//var content = "<style>.textLabel {font-size: 11px;font-weight: normal !important; color: #255599 !important;text-transform: uppercase} .textTotal {font-size: 1em;font-weight: 600 !important; color: #666666 !important; vertical-align:top;}</style>"
	var content = '';

	try {
		var data = getAccountSummaryData();
		nlapiLogExecution('debug', 'data', JSON.stringify(data));

		// var installationSettings = nlapiLoadRecord('customrecord_flo_spider_configuration', 1);
		var custrecord_flo_customization_total = installationSettings.getFieldValue('custrecord_flo_customization_total');
		data['custrecord_flo_customization_total'] = custrecord_flo_customization_total;

		var custrecord_flo_total_joins = installationSettings.getFieldValue('custrecord_flo_total_joins');
		data['custrecord_flo_total_joins'] = custrecord_flo_total_joins;

		var custrecord_flo_list_joins = installationSettings.getFieldValue('custrecord_flo_list_joins');
		data['custrecord_flo_list_joins'] = custrecord_flo_list_joins;

		var custrecord_flo_sourcing_join = installationSettings.getFieldValue('custrecord_flo_sourcing_join');
		data['custrecord_flo_sourcing_join'] = custrecord_flo_sourcing_join;

		var custrecord_flo_script_joins = installationSettings.getFieldValue('custrecord_flo_script_joins');
		data['custrecord_flo_script_joins'] = custrecord_flo_script_joins;

		var custrecord_flo_search_join = installationSettings.getFieldValue('custrecord_flo_search_join');
		data['custrecord_flo_search_join'] = custrecord_flo_search_join;

		var custrecord_flo_workflo_joins = installationSettings.getFieldValue('custrecord_flo_workflo_joins');
		data['custrecord_flo_workflo_joins'] = custrecord_flo_workflo_joins;

		var custrecord_flo_form_join = installationSettings.getFieldValue('custrecord_flo_form_join');
		data['custrecord_flo_form_join'] = custrecord_flo_form_join;

		var custrecord_flo_las_manual_trigger_date = installationSettings.getFieldValue('custrecord_flo_las_manual_trigger_date');
		data['custrecord_flo_las_manual_trigger_date'] = custrecord_flo_las_manual_trigger_date;
      
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
		
		content += '<table width="100%" border="0" cellspacing="2" cellpadding="2" style="color:#696969;">';
		content += '<tr><td colspan="2"><b>Documentation Summary</b></td></tr>'

		content += '<tr><td valign="top" width="50%">';

			// Documentation Summary
			var documentSummary = [
				{id: 'customsearch_flo_new_custs_all', name: 'CUSTOMIZATIONS'},
				{id: 'customsearch_flo_deleted_custs_all', name: 'DELETED CUSTOMIZATIONS'},
				{id: 'custrecord_flo_list_joins', name: 'LIST DEPENDENCIES'},
				{id: 'custrecord_flo_search_join', name: 'SEARCH DEPENDENCIES'},
				{id: 'custrecord_flo_sourcing_join', name: 'SOURCING DEPENDENCIES'},
				{id: 'customsearch_flo_custs_poor_scrptids_all', name: 'Customizations with Poor Script IDs'},
				{id: 'customsearch_flo_custs_no_desc_all', name: 'Customizations with Missing Descriptions'},
			];

			content += '<table>';
			for(var i in documentSummary) {
				//nlapiLogExecution('audit', 'documentSummary', JSON.stringify(documentSummary[i]));
				nlapiLogExecution('audit', 'data[documentSummary[i].id]', documentSummary[i].id + ': ' + data[documentSummary[i].id]);
				if(data.hasOwnProperty(documentSummary[i].id) && data[documentSummary[i].id] > 0) {
					content += '<tr valign="top"><td><b>' + data[documentSummary[i].id] + '</b> ' + documentSummary[i].name.toUpperCase() + '</td></tr>';
				}
			}
			content += '</table>';

		content += '</td><td valign="top" width="50%">';

			documentSummary = [
				{id: 'customsearch_flo_updated_custs_all', name: 'CUSTOMIZATIONS UPDATED'},
				{id: 'custrecord_flo_total_joins', name: 'TOTAL DEPENDENCIES'},
				{id: 'custrecord_flo_workflo_joins', name: 'WORKFLOW DEPENDENCIES'},
				{id: 'custrecord_flo_script_joins', name: 'SCRIPT DEPENDENCIES'},
				{id: 'custrecord_flo_form_join', name: 'FORM DEPENDENCIES'},
				{id: 'customsearch_flo_custs_no_help_all', name: 'Customizations With Missing Help'},
				{id: 'customsearch_flo_cust_no_owner_all', name: 'Customizations With Missing Active Owners'},
			];
			content += '<table><tr valign="top"><td><b></b>&nbsp;</td></tr>';
			for(var i in documentSummary) {
				//nlapiLogExecution('audit', 'documentSummary', JSON.stringify(documentSummary[i]));
				nlapiLogExecution('audit', 'data[documentSummary[i].id]', documentSummary[i].id + ': ' + data[documentSummary[i].id]);				
				if(data.hasOwnProperty(documentSummary[i].id) && data[documentSummary[i].id] > 0) {
					content += '<tr valign="top"><td><b>' + data[documentSummary[i].id] + '</b> ' + documentSummary[i].name.toUpperCase() + '</td></tr>';
				}
			}
			content += '</table>';		

		content += '</td></tr>';

		// Users Summary
		//content += '<p>Users Summary</p>';
		//content += '<table width="100%" border="0" cellspacing="2" cellpadding="2" style="color:#696969;"><tr><td valign="top">';
		content += '<tr><td colspan="2"><b>User Summary</b></td></tr>'

			// Documentation Summary
			var documentSummary = [
				{id: 'customsearch_flo_employee_std_roles_all', name: 'Employees with Standard Operational Roles'},
				{id: 'customsearch_flo_unused_logins_2', name: 'Employees Logging In From New IP Address'},
				{id: 'customsearch_flo_crit_role_change_all', name: 'Critical Role Changes'},
			];

			content += '<table>';
			for(var i in documentSummary) {
				if(data.hasOwnProperty(documentSummary[i].id) && data[documentSummary[i].id] > 0) {
					content += '<tr valign="top"><td><b>' + data[documentSummary[i].id] + '</b> ' + documentSummary[i].name.toUpperCase() + '</td></tr>';
				}
			}
			content += '</table>';

		content += '</td><td valign="top">';

			documentSummary = [
				{id: 'customsearch_flo_unused_logins', name: 'Employees With Unused Logins'},
				{id: 'customsearch_flo_employee_perm_chnge_all', name: 'Employee Permission Changes'},
				{id: 'customsearch_flo_crit_perm_changes_all', name: 'Critical Permission Changes'},
			];
			content += '<table><tr valign="top"><td>&nbsp;</td></tr>';
			for(var i in documentSummary) {
				if(data.hasOwnProperty(documentSummary[i].id) && data[documentSummary[i].id] > 0) {
					content += '<tr valign="top"><td><b>' + data[documentSummary[i].id] + '</b> ' + documentSummary[i].name.toUpperCase() + '</td></tr>';
				}
			}
			content += '</table>';		

		content += '</td></tr></table>';

	} catch(e) {
		nlapiLogExecution('audit', 'showAccountSummary', e)
	}
	return content;
}


function getAccountSummaryData() {
	var data = {};
	var searches = [ 
		{search: 'customsearch_flo_new_custs_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_updated_custs_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_deleted_custs_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_script_errors_all', type: 'scriptexecutionlog'},
		{search: 'customsearch_flo_scripts_detected_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_usdby_scripts_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_publicsearch_scrpts_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_customer_search_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_no_desc_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_unused_logins', type: 'employee'},//review later
		{search: 'customsearch_flo_crit_role_change_all', type: 'employee'},
		{search: 'customsearch_flo_deleted_recs_all', type: 'DeletedRecord'},

		{search: 'customsearch_flo_wrkflows_detected_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_used_wrkflow_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_trans_savedsearch_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_poor_scrptids_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_cust_no_owner_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_unused_logins_2', type: 'employee'},//review later
		{search: 'customsearch_flo_crit_perm_changes_all', type: 'employee'},
		{search: 'customsearch_flo_undelivered_emails_all', type: 'UndeliveredEmail'},

		{search: 'customsearch_flo_crit_api_risks_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_publicsearches_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_employeesearch_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_custs_no_help_all', type: 'customrecord_flo_customization'},
		{search: 'customsearch_flo_employee_std_roles_all', type: 'employee'},
		{search: 'customsearch_flo_employee_perm_chnge_all', type: 'employee'},
		{search: 'customsearch_flo_rec_del_risk_all', type: 'employee'}//review later
	];

	for (var i = 0; i < searches.length; i++) {
		try {
			var resultcount = 0;
			if(searches[i].search != 'customsearch_flo_unused_logins' && searches[i].search != 'customsearch_flo_unused_logins_2' && searches[i].search != 'customsearch_flo_rec_del_risk_all'){
				var searchObj = nlapiLoadSearch(searches[i].type, searches[i].search);
				var results = searchObj.runSearch();
				var resultset = results.getResults(0,1);
				if (resultset && resultset[0]) {
					var columns = resultset[0].getAllColumns();
					data[searches[i].search] = resultset[0].getValue(columns[0]) || '0';
					nlapiLogExecution('audit', JSON.stringify(searches[i]), JSON.stringify(resultset[0].getValue(columns[0])));
				} else {
					data[searches[i].search] = "0";
				}
			}else{
				nlapiLogExecution('DEBUG', 'Exceptional searches', 'Loading Search: '+searches[i].search);
				var searchObj = nlapiLoadSearch(searches[i].type, searches[i].search);
				var results = searchObj.runSearch();
				results.forEachResult(getTotalsUpToFourThousands);

				nlapiLogExecution('DEBUG', 'Exceptional searches', 'Total Results: '+totalResultsGlobal);
					data[searches[i].search] = totalResultsGlobal;
					nlapiLogExecution('DEBUG', 'Exceptional searches', 'Search Totals: '+data[searches[i].search]+' for search id '+searches[i].search);
					totalResultsGlobal = 0;
			}
		} catch (e) {
			nlapiLogExecution('audit', e, JSON.stringify(searches[i]));
		}
	}

	return data;
}

function getTotalsUpToFourThousands(searchResults){
	//nlapiLogExecution('DEBUG', 'getTotalsUpToFourThousands', '');
	totalResultsGlobal++;
	return true;
}

/**
 * Get the ID of the Default User or return -5 as default User ID
 */
function getDefaultUser(forceDefaultUser) {
    //This function returns the id of the default SuiteView user
    var defuser = nlapiGetContext().getSessionObject("defuser");
    try {
    	//++ NS-2038
        if (defuser == null || defuser == "" || forceDefaultUser) {
        //-- NS-2038
            filters = [];
            filters[0] = new nlobjSearchFilter("lastname", null, 'is', 'FLODocs User');
            //filters[1]=new nlobjSearchFilter("isinactive",null,'is','F');

            var column = [];
            column[0] = new nlobjSearchColumn('isinactive');
            column[0].setSort(true);
            defemps = nlapiSearchRecord("employee", null, filters, column)
            if (defemps == null) {
                defemp = nlapiCreateRecord("employee");
                defemp.setFieldValue("firstname", "Default");
                defemp.setFieldValue("lastname", "FLODocs User");
                defemp.setFieldValue("comments", "This is a dummy record used as a placeholder for missing record owner and to route custom controls");

                try {
                    defemp = nlapiSubmitRecord(defemp, false, true);
                } catch (e) {
                    defemp.setFieldValue("billpay", 'F');
                    defemp = nlapiSubmitRecord(defemp, false, true);
                }

            } else {
                defemp = defemps[0].getId()
                if (defemps[0].getValue('isinactive') == "T") {
                    nlapiSubmitField('employee', defemp, 'isinactive', 'F');
                }


            }
            nlapiGetContext().setSessionObject("defuser", defemp);
            defuser = defemp;
        }
    } catch (err) {
        //++ NS-693
        try {
            var defEmpSearch = nlapiSearchRecord('employee', null, [['isinactive','is','F'],'AND',['giveaccess','is','T'],'AND',['role','anyof',[3]]], [new nlobjSearchColumn('internalid', null, 'min')]);

            if(defEmpSearch && defEmpSearch.length > 0) {
                var firstcol = defEmpSearch[0].getAllColumns();
                defuser = defEmpSearch[0].getValue(firstcol[0]);
            } 
            nlapiLogExecution("debug", "defuser1", defuser)
            if(defuser == null || defuser == "") {
                defuser = -5;
            }
        } catch(e) {
            nlapiLogExecution("debug", "err getDefaultUser", e)
            defuser = -5;
        }
        //-- NS-693
        nlapiLogExecution("debug", "err", err)
    }
    nlapiLogExecution("debug", "defuser", defuser)
    return defuser;
}

/**
* Returns the email alert recipient(s) name & email
* NS-2038
*/
function getAlertRecipients() {
	var alertRecipients = [];
	try {
		var weeklyRepRecipients = nlapiLookupField('customrecord_flo_license', 1, 'custrecord_sp_receipt');
		if (weeklyRepRecipients) {
			weeklyRepRecipients = weeklyRepRecipients.split(',');
			var entityIdCol = new nlobjSearchColumn('entityid');
			var emailCol = new nlobjSearchColumn('email');
			var empS = nlapiSearchRecord('Employee', null, [['internalid','anyof',weeklyRepRecipients],'AND',
				['isinactive','is','F'],'AND',['email','isnotempty','']], [entityIdCol,emailCol]);
			if (empS) {
				for (var i=0; empS[i] != null; i++) {
					var thisEntityId = empS[i].getValue(entityIdCol);
					var thisEmail = empS[i].getValue(emailCol);
					if (thisEntityId && thisEmail)
						alertRecipients.push({name:thisEntityId,email:thisEmail,id:empS[i].getId()});
				}
			}
		}

		if (alertRecipients.length == 0) {
			var configStatOwner = getBundleOwnerDetails();
			if (configStatOwner && configStatOwner.email)
				alertRecipients.push(configStatOwner);
		}
	} catch(e) {
		nlapiLogExecution('AUDIT', 'ERROR: Unable to determine email alert recipients', e);
	}
	return alertRecipients;
}

