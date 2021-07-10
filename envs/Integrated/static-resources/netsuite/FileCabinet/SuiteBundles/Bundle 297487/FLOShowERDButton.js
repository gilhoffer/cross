/**
* Displays Open ERD button in Customization Record form 
*/
function showERDButton(type, form) {

	try {
		var customizationid = nlapiGetRecordId();
		var url_servlet = nlapiResolveURL('SUITELET', 'customscript_flo_enterprise_suitelet', 'customdeploy_flo_erd_entry');
		url_servlet += "&customizationid="+customizationid + "&custsrc=T";
		var custType = nlapiGetFieldText("custrecord_flo_cust_type");

		var scriptcontainer = form.addField('custpage_erdbuttonscriptcontainer', 'inlinehtml', '');
		var content = "<script>function goToERD(){window.open('"+url_servlet+"')}</script>";
		scriptcontainer.setDefaultValue(content);
		form.addButton('custpage_goToERD', 'Open ERD', 'goToERD()');
	}catch(e) {}
	
}