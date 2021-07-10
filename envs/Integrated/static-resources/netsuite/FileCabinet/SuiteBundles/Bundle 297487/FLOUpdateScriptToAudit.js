function updateFLOScriptToAudit() {
	try {
		var MAXUSAGEREMAIN = 1001;
		var MAX_TIME=600000; //10 minutes
		var START_TIME=new Date().getTime();
		var paramlastindex = nlapiGetContext().getSetting('SCRIPT', 'custscript_flo_scriptdep_index') || '0,0';
		nlapiLogExecution("AUDIT", "paramlastindex", paramlastindex);
		
		if (paramlastindex.indexOf(",0") > -1) {
			var lastindex = paramlastindex.split(",")[0];
			var ssfilters = [];
			ssfilters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthanorequalto', lastindex));

			var scriptdeployments = nlapiSearchRecord(null,"customsearch_flo_debug_script_deployment",ssfilters,null);

			if(scriptdeployments) {
				for(var i=0; scriptdeployments[i] != null; i++) {
					var remainingUsage=nlapiGetContext().getRemainingUsage();
					var timeDiff=new Date().getTime() - START_TIME;
					var deploymentid = scriptdeployments[i].getId();
					if (remainingUsage <= MAXUSAGEREMAIN || timeDiff > MAX_TIME || i == 999){
						var sparams = [];
						sparams['custscript_flo_scriptdep_index'] = deploymentid + ",0";
						var context = nlapiGetContext();
						var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams);
						if ( status == 'QUEUED' ) {
							return;
							nlapiLogExecution("debug","RESCHEDULE");
						}
					} else {
						try {
							
							var columns = scriptdeployments[i].getAllColumns();
							var scriptname = scriptdeployments[i].getValue(columns[0]);
							var deploymentlink = scriptdeployments[i].getValue(columns[1]);
							nlapiSubmitField("scriptdeployment", deploymentid, 'loglevel', 'AUDIT');

							var deploymentscriptid= scriptdeployments[i].getValue(columns[2]);
							if(deploymentscriptid && deploymentscriptid.toUpperCase() == "CUSTOMDEPLOY_FLO_CREATE_CL_FROMSN") {
								nlapiSubmitField("scriptdeployment", deploymentid, 'allroles', 'T');
							}
							nlapiLogExecution("AUDIT","UPDATE " + deploymentid,scriptname + " " + deploymentlink);	
						} catch(e) {
							nlapiLogExecution("debug","E",e);
						}
									
					}
				}
			}

		}

		var odlastindex = paramlastindex.split(",")[1];
		var odFilters = [];
		odFilters[0] = new nlobjSearchFilter('title', null, 'startswith', 'FLO');
		odFilters[1] = new nlobjSearchFilter('name','script','startswith','Strongpoint');
		odFilters[2] = new nlobjSearchFilter('internalidnumber', null,'greaterthanorequalto', odlastindex);

		var oldColumns = [];
		oldColumns[0] = new nlobjSearchColumn('internalid');
		oldColumns[0].setSort();
		oldColumns[1] = new nlobjSearchColumn('title');
		var oldDeployments = nlapiSearchRecord('scriptdeployment', null, odFilters, oldColumns);
		if (oldDeployments) {
			for (var i = 0; oldDeployments[i] != null; i++) {
				var id = oldDeployments[i].getId();
				if (nlapiGetContext().getRemainingUsage() <= MAXUSAGEREMAIN || 
						new Date().getTime() - START_TIME > MAX_TIME || 
						i == 999){
					var sparams = [];
					sparams['custscript_flo_scriptdep_index'] = "0," + id;
					var context = nlapiGetContext();
					var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams);
					if ( status == 'QUEUED' ) {
						return;
						nlapiLogExecution("debug","RESCHEDULE");
					}
				} else {
					var title = oldDeployments[i].getValue('title') || "";
					if (title) {
						if (title.match(/FLODocs/i) != null) {
							title = title.replace(/FLODocs/i,'Strongpoint');
						} else if (title.match(/FLO Docs/i) != null) {
							title = title.replace(/FLO Docs/i,'Strongpoint');
						} else if (title.match(/^flo_/)) {
							title = title.replace(/^flo_/i,'strongpoint_');
						} else {
							title = title.replace(/FLO/i,'Strongpoint');
						}

						try {
							nlapiLogExecution("DEBUG", "new title " + id, title);
							nlapiSubmitField("scriptdeployment", id, 'title', title);
						} catch (ee) {
							nlapiLogExecution("DEBUG", "Unable to submit new title", ee);
						}
					}
				}
			}
		}
	} catch(e) {
		nlapiLogExecution("debug","E",e);
	}
}