function repairCusts()
{
	nlapiLogExecution("AUDIT","repairCusts","START");
	//This function merges customizations and deletes the newer one
	var startTime=new Date().getTime();
	var MAX_TIME=600000; //10 minutes
	
	var context=nlapiGetContext();
	var lastId=context.getSetting('SCRIPT', 'custscript_last_id_processed');
	
	var filters=null;
	if(lastId) {
		filters=[];
		filters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthan', lastId));
	}
	
	//Load the overmatched customizations
	var custs=null;
	try {
		custs=nlapiSearchRecord("customrecord_flo_customization","customsearch_flo_cust_rep",filters,null);
	} catch(e) {
		nlapiLogExecution("DEBUG","Search Error",e);
	}
    //review if will be have more than 1000 results for make a custom search
    /*var search = nlapiCreateSearch('customrecord_flo_customization');
    search.addColumns(columns);
    var resultSet = search.runSearch();

    do {
      var results = resultSet.getResults(startRow, endRow);
      var remainingUsagePoints = nlapiGetContext().getRemainingUsage();
      if ((remainingUsagePoints > usageThreshold) && results) {
        resultCount = results.length;
        allResults = allResults.concat(results);
        startRow = endRow;
        endRow = endRow + 1000;
      }
    } while (resultCount > 999);
    */

	if(custs==null)
	{return}

	//check each cust
	for(c=0;custs[c]!=null;c++)
	{
	    var columns=custs[c].getAllColumns();
	    var scriptid=custs[c].getValue(columns[6]);
	    var intid="";
		thisCust=custs[c].getId();
		lastId=thisCust;
		nlapiLogExecution("debug","thisCust",thisCust)
		for(x=c;custs[x]!=null && custs[x].getId()==thisCust;x++)
		{
			var columns=custs[x].getAllColumns();
			nlapiLogExecution("debug","ScriptId",custs[x].getValue(columns[2]))
			if(custs[x].getValue(columns[2])=="custrecord_flo_cust_id")
			{scriptid=custs[x].getValue(columns[3])}
			if(custs[x].getValue(columns[2])=="custrecord_flo_int_id")
			{intid=custs[x].getValue(columns[3])}
			c=x;
			
			
		}
		nlapiLogExecution("debug","scriptid",scriptid);
		nlapiLogExecution("debug","intid",intid);

		var fields=["custrecord_flo_cust_id","custrecord_flo_autospider_found"];
		var values=[scriptid,"T"];

		if(scriptid!=""){
			nlapiLogExecution("debug","intid2",intid);
			nlapiSubmitField("customrecord_flo_customization",thisCust,fields,values);
		}

		var fields=["custrecord_flo_int_id"];
		var values=[intid];

		if(intid!=""){
						nlapiLogExecution("debug","intid3",intid)

			nlapiLogExecution("debug","intid2",intid);
			nlapiSubmitField("customrecord_flo_customization",thisCust,fields,values);
		}
		
		var remainingUsage=context.getRemainingUsage();
		var timeDiff=new Date().getTime() - startTime;
		 if (remainingUsage <= 200 || timeDiff > MAX_TIME || c == 999){
            //setRecoveryPoint();
            //checkGovernance();
			nlapiLogExecution("DEBUG","Rescheduling","RemainingUsage="+remainingUsage+",TimeDiff="+timeDiff+",index="+c);
			nlapiLogExecution("AUDIT","Rescheduling","Last ID="+ lastId);
			var sparams = [];
			sparams['custscript_last_id_processed'] = lastId;
			var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams);
			if ( status == 'QUEUED' )
				break;
          } 

	}
	
	nlapiLogExecution("AUDIT","repairCusts","END");
	
}

/*
function setRecoveryPoint()
{
 var state = nlapiSetRecoveryPoint(); //100 point governance
 if( state.status == 'SUCCESS' ) return;  //we successfully create a new recovery point
 if( state.status == 'RESUME' ) //a recovery point was previously set, we are resuming due to some unforeseen error
 {
  nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
  handleScriptRecovery();
}
 else if ( state.status == 'FAILURE' )  //we failed to create a new recovery point
 {
   nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
   handleRecoveryFailure(state);
 }
}

function checkGovernance()
{
 var context = nlapiGetContext();
 var state = nlapiYieldScript();

 if( state.status == 'FAILURE')
 {
  nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
  throw "Failed to yield script";
} 
else if ( state.status == 'RESUME' )
{
 nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
}
  // state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield

}

function handleRecoveryFailure(failure)
{
 if( failure.reason == 'SS_MAJOR_RELEASE' ) throw "Major Update of NetSuite in progress, shutting down all processes";
 if( failure.reason == 'SS_CANCELLED' ) throw "Script Cancelled due to UI interaction";
 if( failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT' ) { cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
 if( failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE' ) throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; 
}
*/