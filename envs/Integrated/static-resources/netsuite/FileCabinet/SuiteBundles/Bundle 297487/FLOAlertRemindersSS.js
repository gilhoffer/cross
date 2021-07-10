var context = nlapiGetContext();
var sender = context.getUser();
var totalResultsGlobal = 0;

/**
* Workflow Action, send email alert to all Admin
*/
function alertAdmins() {
	try {
		//updateStats();
		//++ NS-2038 Sender is Default FLODOcs User
		//if(sender < 1) {
		//sender = getDefaultUser(true);
		//}
		//nlapiLogExecution("DEBUG", "sender", sender);
		//-- NS-2038
		
		var compId = context.getCompany();
		var subject = "Flashlight Spider Completion Reminder";
		//var body = "Strongpoint Spider has finished processing in " + compId;
		var companyInfo = nlapiLoadConfiguration('companyinformation');
        var compName = companyInfo.getFieldValue('companyname');
		//var recipient = getAdminEmails();
		//++ NS-2038
		//var recipient = getBundleOwnerDetails();
		var recipients = getAlertRecipients();

		//if(recipient && Object.keys(recipient).length > 0) {
		if (recipients && recipients.length > 0) {
			sender = recipients[0].id;
			nlapiLogExecution("DEBUG", "sender", sender);
			//nlapiLogExecution("DEBUG", "recipient", JSON.stringify(recipient));
			var emailTemplate = spiderCompletionEmailTemplate();
			if(sender != null && emailTemplate != null) {
				//var firstName = recipient.name.split(' ')[0];
				//emailTemplate = emailTemplate.replace('{name}', firstName);

				var portletData = getFormattedReminderPortletData();
				emailTemplate = emailTemplate.replace('{portlet_data}', portletData);

				var installationSettings = nlapiLoadRecord('customrecord_flo_spider_configuration', 1);

				var docSummaryData = getAccountSummary(installationSettings);

				var custrecord_flo_las_manual_trigger_date = installationSettings.getFieldValue('custrecord_flo_spider_front_end_date');
				
				var lastSpiderRunDate = nlapiStringToDate(custrecord_flo_las_manual_trigger_date);
              nlapiLogExecution("DEBUG", "lastSpiderRunDate", lastSpiderRunDate);
				var today = new Date();
				var timeDiff = Math.abs(lastSpiderRunDate.getTime() - today.getTime());
				var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
				emailTemplate = emailTemplate.replace('{days}', diffDays);
				if(diffDays > 7) {
					emailTemplate = emailTemplate.replace('{7_day_notice}', '<br>Your account documentation may be out-of-date - please Respider Now to get up-to-date information on the status of your system.');
				}
				else {
					emailTemplate = emailTemplate.replace('{7_day_notice}', '');
				}

				emailTemplate = emailTemplate.replace('{doc_summary}', docSummaryData);

				for (var i = 0; recipients[i] != null; i++) {
					var recipient = recipients[i];
					if (Object.keys(recipient).length > 0) {
						nlapiLogExecution('DEBUG', 'recipient', JSON.stringify(recipient));
						var firstName = recipient.name.split(' ')[0];
						var recipientEmail = recipient.email;

						var body = emailTemplate;
						body = body.replace('{name}', firstName);
						nlapiLogExecution("DEBUG", "body", body);
						try {
							nlapiLogExecution("DEBUG", "recipientEmail", recipientEmail);
							nlapiSendEmail(sender, recipientEmail, subject, body);
						} catch(ee) {
							nlapiLogExecution("DEBUG", "ee", ee);
							var adminSender = getAdminSender();
		                    nlapiSendEmail(adminSender, recipientEmail, subject, body);
		                    nlapiLogExecution("DEBUG", "sent", 'admin');
						}
					}
				}
				// triggerStatusReport();
			}
		}
		//-- NS-2038
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
	return '<html><head> <title>Flashlight Spider Completion Report</title> <style> <!-- body, p, td { font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 12px; } td.headlines { color: #255599; font-size: 16px; } .textLabel { font-size: 11px; font-weight: normal !important; color: #255599 !important; text-transform: uppercase } .textTotal { font-size: 1em; font-weight: 600 !important; color: #666666 !important; vertical-align: top; } --> </style></head><body> <table width="100%" border="0" cellspacing="2" cellpadding="2"> <tr> <td valign="top"> <p><b>Hi {name}!</b></p> <p>It has been <b>{days} days</b> since Flashlight’s Spider was last run.{7_day_notice}</p> <p><b>Here are the key system warnings and metrics that Flashlight has detected in your NetSuite account this week.</b></p> </td> </tr> <tr> <td valign="top"> {portlet_data} <p>Warnings are highlighted in Red and represent a potential security or stability problem which should be reviewed. Cautions are highlighted in Yellow and represent departures from NetSuite best practices. Refer to our User Guide for an explanation of each warning or metric.</p> </td> </tr> <tr> <td valign="top"> <p><b>Here is a summary of what Flashlight has documented in your account to date.</b></p> </td> </tr> <tr> <td valign="top"> {doc_summary} </td> </tr> </table> <!-- *************** FOOTER START *************** --> <hr width="100%" size="1" noshade color="#CCCCCC"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tr> <td align="right"> <font style="font-size:9px; font-family:Verdana,Arial,Helvetica,sans-serif; color:#999999;">Strongpoint.io is powered by <a href="http://www.netsuite.com/" style="color:#999999;">NetSuite</a> — One System. No Limits.</font> </td> </tr> </table> <!-- *************** FOOTER END **';
}	