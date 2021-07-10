/**
* Display Go to Record button in the Customization record.
*/
function redirectToLink(type, form) {
	var custrecord_flo_custz_link = nlapiGetFieldValue('custrecord_flo_custz_link') || "";
	var content = "<script>function onclick_gotorecord(){";
	if(custrecord_flo_custz_link) {
		content += "window.open('"+custrecord_flo_custz_link+"')";
	}			
	content += "}</script>";
	var scriptcontainer = form.addField('custpage_gotorecordscriptcontainer', 'inlinehtml', '');
	scriptcontainer.setDefaultValue(content);

	form.addButton('custpage_buttongotorecord', 'Go to Record', 'onclick_gotorecord()');	
} 