nlapiLogExecution("audit","FLOStart",new Date().getTime())
function floScriptSearchFieldsView(rectype,recid)
{

	try{

 		var rec=nlapiLoadRecord(rectype,recid);

 		if(rec){

		var replaceFor="\r\n";
		
		var sriptField=rec.getFieldValue('custrecord_flo_script_fields');
		if(typeof sriptField!="undefined" && sriptField!=null)  rec.setFieldValue('custrecord_flo_scripts_fields_view',sriptField.replace(/,/gi,replaceFor));
		
		var searchField=rec.getFieldValue('custrecord_flo_search_fields');
		if(typeof searchField!="undefined" && searchField!=null) rec.setFieldValue('custrecord_flo_search_fields_view',searchField.replace(/,/gi,replaceFor));

		 var ff=rec.getFieldValue('custrecord_flo_script_functions');
		if(typeof ff!="undefined" && ff!=null) rec.setFieldValue('custrecord_flo_functions_view',ff.replace(/,/gi,replaceFor));

		nlapiSubmitRecord(rec);
	}
	
	}catch(e){

	}
}
function floScriptSearchFieldsViewUS()
{

try{
 		var rec= nlapiGetNewRecord();

 		if(rec){
 			
		var replaceFor="\r\n";
		
		var sriptField=rec.getFieldValue('custrecord_flo_script_fields');
		if(typeof sriptField!="undefined" && sriptField!=null)  rec.setFieldValue('custrecord_flo_scripts_fields_view',sriptField.replace(/,/gi,replaceFor));
		
		var searchField=rec.getFieldValue('custrecord_flo_search_fields');
		if(typeof searchField!="undefined" && searchField!=null) rec.setFieldValue('custrecord_flo_search_fields_view',searchField.replace(/,/gi,replaceFor));

		 var ff=rec.getFieldValue('custrecord_flo_script_functions');
		if(typeof ff!="undefined" && ff!=null) rec.setFieldValue('custrecord_flo_functions_view',ff.replace(/,/gi,replaceFor));

		nlapiSubmitRecord(rec);
	}

		}catch(e){

	}
}