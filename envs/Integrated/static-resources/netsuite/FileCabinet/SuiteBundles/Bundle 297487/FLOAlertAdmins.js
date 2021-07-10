var context = nlapiGetContext();
var sender = context.getUser();
var totalResultsGlobal = 0;

/**
* Workflow Action, send email alert to all Admin
*/
function alertAdmins() {
    //++ NS-1695
    //Send email alert to all Admin
    try {
        //Send email alert to all Admin
        nlapiScheduleScript('customscript_flashlight_alert_admins_ss', 1);
    } catch(e) {
        nlapiLogExecution("DEBUG", "triggerAdminAlert e", e);
    }       

    //-- NS-1695
    return;	
	try {
		updateStats();
		if(sender < 1) {
			sender = getDefaultUser();
		}		
		nlapiLogExecution("DEBUG", "sender", sender);
		var compId = context.getCompany();
		var subject = "Flashlight Spider Completion Report";
		//var body = "Strongpoint Spider has finished processing in " + compId;
		var companyInfo = nlapiLoadConfiguration('companyinformation');
        var compName = companyInfo.getFieldValue('companyname');
		//var recipient = getAdminEmails();
		var recipient = getBundleOwnerDetails();
		if(recipient && Object.keys(recipient).length > 0) {
			nlapiLogExecution("DEBUG", "recipient", JSON.stringify(recipient));
			var objToJoinCount = nlapiGetFieldValue('custrecord_flo_remaining_obj_to_join') || 0;
			if (objToJoinCount == 0) {
				//var emailTemplate = loadSpiderCompletionEmailTemplate();
				var emailTemplate = spiderCompletionEmailTemplate();
				if(emailTemplate != null) {
					var firstName = recipient.name.split(' ')[0];
					emailTemplate = emailTemplate.replace('{name}', firstName);

					var portletData = getFormattedReminderPortletData();
					emailTemplate = emailTemplate.replace('{portlet_data}', portletData);

					var installationSettings = nlapiLoadRecord('customrecord_flo_spider_configuration', 1);
					var docSummaryData = getAccountSummary(installationSettings);
					emailTemplate = emailTemplate.replace('{doc_summary}', docSummaryData);

					var erdUrl = 'https://system.netsuite.com' + nlapiResolveURL('SUITELET', 'customscript_flo_enterprise_suitelet',3);
					emailTemplate = emailTemplate.replace('{erd_link}', erdUrl);

					var sqlLibUrl = 'https://system.netsuite.com' + '/app/common/search/searchresults.nl?searchid=customsearch_flo_sql_library';
					emailTemplate = emailTemplate.replace('{sql_lib_link}', sqlLibUrl);

					var custImpactSearchUrl = 'https://system.netsuite.com' + '/app/common/search/searchresults.nl?searchid=customsearch_flo_cust_impact_srch_l_2';
					emailTemplate = emailTemplate.replace('{cust_impact}', custImpactSearchUrl);

					var impactAnalysisFieldsUrl = 'https://system.netsuite.com' + nlapiResolveURL('SUITELET', 'customscript_flo_impact_analysis_fields', 1);
					emailTemplate = emailTemplate.replace('{field_impact}', impactAnalysisFieldsUrl);

					var recipientEmail = recipient.email;

					var body = emailTemplate;
					nlapiLogExecution("DEBUG", "body", body);
					try {
						nlapiSendEmail(sender, recipientEmail, subject, body);
					} catch(ee) {
						nlapiLogExecution("DEBUG", "ee", ee);
						var adminSender = getAdminSender();
						nlapiSendEmail(adminSender, recipientEmail, subject, body);
					}
					triggerStatusReport();
				}
			}
		}	
	} catch(e) {
		nlapiLogExecution("DEBUG", "alertAdmins e", e);
	}

}


/**
* Returns as csv all users with Administrator roles
*/
function getAdminEmails() {
	
	var filter = [["role","anyof",3],"AND",["email","isnotempty",""],"AND",["isinactive","is","F"]];
	var result = nlapiSearchRecord("Employee", null, filter, new nlobjSearchColumn("email"));
	var emails = [];
	if (result) {
		for (var i = 0; result[i] != null; i++) {
			if (emails.indexOf(result[i].getValue("email")) < 0)
				emails.push(result[i].getValue("email"));
		}
	}
	return emails;
}


/**
* Returns admin employee
*/
function getAdminSender() {
	var col = new nlobjSearchColumn("internalid");
	col.setSort();
	var search = nlapiSearchRecord("Employee", null, [["role","anyof",3],"AND",["isinactive","is","F"]], col);
	var admin = -5;
	if (search && search[0])
		admin = search[0].getValue("internalid");
	return admin;
}

/**
* Trigger Status Report Update
*/
function triggerStatusReport() {
	try {
		//FILES PENDING TO PROCESS
		nlapiScheduleScript('customscript_flo_report_record_count',2);
	} catch(e) {
		nlapiLogExecution("DEBUG", "triggerStatusReport e", e);
	}
}

/**
* Update Remaining Objects To Join and File Pending to Process
*/
function updateStats() {
	try {
		var custrecord_flo_files_pending_to_process = 0;
		var custrecord_flo_remaining_obj_to_join = 0;

		//REMAINING OBJECTS TO JOIN
		var remainingcusttojoinsearch = nlapiSearchRecord('customrecord_flo_customization', null, [['isinactive','is','F'],'AND',[['custrecord_flo_make_join_date','isempty',null],'OR',['custrecord_flo_make_join_proc','is','F']]], [new nlobjSearchColumn('internalid',null,'count')]);
		if(remainingcusttojoinsearch && remainingcusttojoinsearch[0]) {
			var cols = remainingcusttojoinsearch[0].getAllColumns();
			custrecord_flo_remaining_obj_to_join = remainingcusttojoinsearch[0].getValue(cols[0]) || 0;
		}
		nlapiSetFieldValue('custrecord_flo_remaining_obj_to_join', custrecord_flo_remaining_obj_to_join);

		//FILES PENDING TO PROCESS
		var pendingfilessearch = nlapiSearchRecord('file', null, [['formulatext: {folder}','startswith','Spider Data']], [new nlobjSearchColumn('internalid',null,'count')]);
		if(pendingfilessearch && pendingfilessearch[0]) {
			var cols2 = pendingfilessearch[0].getAllColumns();
			custrecord_flo_files_pending_to_process = pendingfilessearch[0].getValue(cols2[0]) || 0;
		}
		nlapiSetFieldValue('custrecord_flo_files_pending_to_process', custrecord_flo_files_pending_to_process);

	} catch(e) {
		nlapiLogExecution("DEBUG", "updateStats e", e);
	}
}

function spiderCompletionEmailTemplate() {
	return '<html><head> <title>Flashlight Spider Completion Report</title> <style> <!-- body, p, td { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 12px; } td.headlines { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 16px; } --> </style></head><body> <table width="100%" border="0" cellspacing="2" cellpadding="2"> <tr> <td valign="top"> <p><b>Hi {name}!</b></p> <p><b>Flashlight’s spider has completed and your account documentation is up to date! We have updated your Reminders and System Overview which are also included on your Flashlight dashboard.</b></p> <p>Here are the key system warnings and metrics that Flashlight has detected in your NetSuite account this week.</p> </td> </tr> <tr> <td valign="top"> {portlet_data} </td> </tr> <tr> <td> <p>Warnings are highlighted in Red and represent a potential security or stability problem which should be reviewed. Cautions are highlighted in Yellow and represent departures from NetSuite best practices. Refer to our User Guide for an explanation of each warning or metric.</p> <p><b>Here is a summary of what Flashlight has documented in your account to date.</b></p> </td> </tr> <tr> <td valign="top"> {doc_summary} </td> </tr> <tr> <td valign="top"> <p>As a reminder, here are some key Flashlight tools you can use with your account documentation: <ul> <li><a href="{erd_link}">ERD</a> - Explore your customizations with Flashlight’s visual ERD and understand how customizations relate to each other; </li> <li><a href="{sql_lib_link}">SQL Library</a> - Easily locate formulas used across the Saved Searches in your account;</li> <li><a href="{cust_impact}">Customization Impact Search</a> - Understand how your customizations are impacted by changes to other customizations;</li> <li><a href="{field_impact}">CStandard Field Impact Search</a> - Understand how your customizations are impacted by changes to standard NetSuite fields.</li> </ul> </p> </td> </tr> </table> <!-- *************** FOOTER START *************** --> <hr width="100%" size="1" noshade color="#CCCCCC"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td align="right"> <font style="font-size:9px; font-family:Verdana,Arial,Helvetica,sans-serif; color:#999999;">Strongpoint.io is powered by <a href="http://www.netsuite.com/" style="color:#999999;">NetSuite</a> — One System. No Limits.</font> </td> </tr> </table> <!-- *************** FOOTER END *************** --></body></html>';
}	