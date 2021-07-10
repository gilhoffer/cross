var minQueue = 1;
var firstQueueCount = 0;
var queueCount =1;

jQuery(document).ready(function($) {
 
 makeJoin();
 startParser();
 usage();
 detectQueues();
 setTimeSelectOptions();
	
});


function makeJoin(){
var search = new nlapiSearchRecord(null, 'customsearch_flo_script_to_process_2', null,null)||null;
var columnsSearch = search[0].getAllColumns();
var recordProcess = parseFloat(search[0].getValue(columnsSearch[0]));
if(isNaN(recordProcess))recordProcess=0;

jQuery('#joinRecordProcess').html(recordProcess);

var search = new nlapiSearchRecord(null, 'customsearch_flo_customization_joined_2', null,null)||null;
var columnsSearch = search[0].getAllColumns();
var totalRecord = search[0].getValue(columnsSearch[0]);
if(isNaN(totalRecord))totalRecord=0;
jQuery('#joinRecordTotal').html(totalRecord);

var completePercent = (recordProcess*100)/totalRecord;
var total = parseInt(completePercent)*3;

jQuery('#joinRecordComplete').html(Math.round(completePercent));
jQuery('#estimatedTime').html(total +'hs');


}

function startParser(){
 
var search = new nlapiSearchRecord(null, 'customsearch_flo_script_to_process', null,null)||null;
var columnsSearch = search[0].getAllColumns();
var recordProcess = parseFloat(search[0].getValue(columnsSearch[0]));
if(isNaN(recordProcess))recordProcess=0;

jQuery('#parserRecordProcess').html(recordProcess);

var search = new nlapiSearchRecord(null, 'customsearch_flo_script_to_process_2', null,null)||null;
var columnsSearch = search[0].getAllColumns();
var totalRecord = search[0].getValue(columnsSearch[0]);
if(isNaN(totalRecord))totalRecord=0;
jQuery('#parserRecordTotal').html(totalRecord);

var completePercent = (recordProcess*100)/totalRecord;
var total = parseInt(completePercent)*3;

jQuery('#parserRecordComplete').html(Math.round(completePercent));
jQuery('#parserRecordestimate').html(total +'hs');


}


function usage(){

var search = new nlapiSearchRecord(null, 'customsearch_flo_customization_joined__2', null,null)||null;
var columnsSearch = search[0].getAllColumns();
var recordProcess = parseFloat(search[0].getValue(columnsSearch[0]));
if(isNaN(recordProcess))recordProcess=0;

jQuery('#usageRecordProcess').html(recordProcess);

var search = new nlapiSearchRecord(null, 'customsearch_flo_customization_joined__3', null,null)||null;
var columnsSearch = search[0].getAllColumns();
var totalRecord = search[0].getValue(columnsSearch[0]);
if(isNaN(totalRecord))totalRecord=0;
jQuery('#usageRecordTotal').html(totalRecord);

var completePercent = (recordProcess*100)/totalRecord;
var total = parseInt(completePercent)*3;

jQuery('#usageRecordCompelete').html(Math.round(completePercent));
jQuery('#usageRecordEstimated').html(total +'hs');

}

function detectQueues() {
	var notes = "";
	var results= new nlapiSearchRecord(null,'customsearch_flo_schedule_instance');
	var allScriptsCount = 0;
	if(results != null ) {
		queueCount = results.length;
		for (var i = 0; i < results.length; i++)
		{
			var cols=results[i].getAllColumns();
			var scriptCount = parseInt(results[i].getValue(cols[1]));	
			var queueNum = results[i].getValue(cols[0]);
			
			if(queueNum == '1') {
				firstQueueCount = scriptCount;
			}
			
			if(i == 0) {
				minQueue = queueNum;
			}
			
			allScriptsCount += scriptCount;
		}
	}
	
	if(queueCount > 1 && allScriptsCount!=0 && (firstQueueCount/allScriptsCount) > 0.5 ) {
		notes = "Multiple queue enviroment, please distribute flodocs in the lest used queues";
	} else if(queueCount == 1 && firstQueueCount > 10) {
		notes = "Single Queue environment with heavy use, please review the schedule setting of each flo docs scripts : http://flodocs.com/knowledgebase/advanced-deployment-mode/";
	}
	
	jQuery('textarea[name=notes]').val(notes);
}

function setTimeSelectOptions() {
	var selection = "";
	var i = 0;
	for(var i = 0; i < 24; i++)
	{
		selection += "<option value='"+ zeroFill(i, 2) +"00'>"+ zeroFill(i, 2) + ":00" + "</option>";
			selection += "<option value='"+ zeroFill(i, 2) +"30'>"+ zeroFill(i, 2) + ":30" + "</option>";
	}
	$("select[name=time]").html(selection);
	
	function zeroFill( number, width )
	{
	  width -= number.toString().length;
	  if ( width > 0 )
	  {
		return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
	  }
	  return number + ""; // always return a string
	}	
}

function runNow(scriptid, deploymentid) {
	try {
		
		var suiteleturl =  nlapiResolveURL('SUITELET', 'customscript_flo_portlettab_suitelet', 'customdeploy_flo_portlettab_suitelet');
		suiteleturl += "&method=runNow&scriptid="+scriptid+"&deploymentid="+deploymentid;
		console.log(suiteleturl);
		var response = nlapiRequestURL(suiteleturl);
		
		alert(response.getBody());
	} catch(e) {
		if ( e instanceof nlobjError ) {
			alert("Error Occured:"+e.getCode() + " " + e.getDetails());
		} else {
			alert(e.toString())
		}
	}
}

function setToMinQueue(deploymentids) {
	var response = "";
	try {
		detectQueues();
		if(queueCount == 1) {
			response = "There is only one queue in your account";
			alert(response);
		} else {
			if(confirm('There are multiple Queues in your account. It is recomended distribute FLODocs schedule scripts to queue #'+minQueue+"\nClick Confirm for auto distribute the script, Cancel for manual distribution")) {
				var suiteleturl =  nlapiResolveURL('SUITELET', 'customscript_flo_portlettab_suitelet', 'customdeploy_flo_portlettab_suitelet');
				suiteleturl += "&method=setToMinQueue&deploymentid="+deploymentids+"&minQueue="+minQueue;
				console.log(suiteleturl);
				response = nlapiRequestURL(suiteleturl);
				alert(response.getBody());
			} 
		}
		
	} catch(e) {
		if ( e instanceof nlobjError ) {
			alert("Error Occured:"+e.getCode() + " " + e.getDetails());
		} else {
			alert(e.toString())
		}
	}
	
}

function setSchedule(deploymentid,startdate, starttime) {
	try {
		var suiteleturl =  nlapiResolveURL('SUITELET', 'customscript_flo_portlettab_suitelet', 'customdeploy_flo_portlettab_suitelet');
		suiteleturl += "&method=setSchedule&deploymentid="+deploymentid+"&startdate="+startdate+"&starttime="+starttime;
		console.log(suiteleturl);
		var response = nlapiRequestURL(suiteleturl);
		alert(response.getBody());
	} catch(e) {
		if ( e instanceof nlobjError ) {
			alert("Error Occured:"+e.getCode() + " " + e.getDetails());
		} else {
			alert(e.toString())
		}
	}
}