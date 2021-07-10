// JavaScript Document
function showConfigbutton(type, form) {
	
	 form.addButton('custpage_buttonrefresh', 'Refresh', 'onclick_refresh()');  
	// var content='<button onClick="window.open(\'/app/site/hosting/scriptlet.nl?script=customscript_flo_report_record_count_stl&deploy=1\'); return false;">Refresh</button>';
	//var refbutton=form.addField('custpage_field', 'inlinehtml', '');
	//refbutton.setDefaultValue(content);
}

function onclick_refresh() {
	window.open('/app/site/hosting/scriptlet.nl?script=customscript_flo_report_record_count_stl&deploy=1');
}