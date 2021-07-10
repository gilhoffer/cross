function cleanStandardRecordNames() {
	try {
		var MAXUSAGEREMAIN = 1001;
		var MAX_TIME=600000; //10 minutes
		var START_TIME=new Date().getTime();
		var paramlastindex = nlapiGetContext().getSetting('SCRIPT', 'custscript_flo_stdrecord_id') || '0';
		var context = nlapiGetContext();
		var deploymentId = context.getDeploymentId();
		nlapiLogExecution("debug", "paramlastindex", paramlastindex);
		if(deploymentId == "customdeploy_flo_clean_stdnames1") {
			nlapiLogExecution("debug", "paramlastindex", paramlastindex);
		

			var lastindex = paramlastindex;
			var ssfilters = [];

			ssfilters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthanorequalto', lastindex));
			ssfilters.push(new nlobjSearchFilter('isinactive', null,'is', "F"));
			ssfilters.push(new nlobjSearchFilter('custrecord_flo_cust_type', null,'anyof', [24]));
			ssfilters.push(new nlobjSearchFilter('formulanumeric', null,'notequalto', '0').setFormula("REGEXP_INSTR({name},'_')"));
			
			var sscolumns = [];
			sscolumns.push(new nlobjSearchColumn('internalid'));
			sscolumns[0].setSort();
			sscolumns.push(new nlobjSearchColumn('name'));

			var customizationsearch = nlapiSearchRecord("customrecord_flo_customization",null,ssfilters,sscolumns);
			nlapiLogExecution("debug", "customizationsearch", customizationsearch);
			var scheduled = false;
			if(customizationsearch) {
				for(var i=0; customizationsearch[i] != null; i++) {
					var columns = customizationsearch[i].getAllColumns();
					var remainingUsage=nlapiGetContext().getRemainingUsage();
					var timeDiff=new Date().getTime() - START_TIME;
					var internalid = customizationsearch[i].getValue(columns[0]);
					if (remainingUsage <= MAXUSAGEREMAIN || timeDiff > MAX_TIME || i == 999){
						var sparams = [];
						sparams['custscript_flo_stdrecord_id'] = internalid;
						
						var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams);
						scheduled = true;
						if ( status == 'QUEUED' ) {
							return;
							nlapiLogExecution("debug","RESCHEDULE");
						}
						break;
					} else {
						try {
							var custname = customizationsearch[i].getValue('name');
							var origcustname = custname.replace(' (Standard Record)','');
							var newcustname = origcustname.replace(/_/g,' ');
							if(newcustname && origcustname) {
								nlapiLogExecution("debug",newcustname,origcustname);
								var fields = ["name","custrecord_flo_orig_name","custrecord_skip_rec_log"];
								var values = [newcustname,origcustname,'T']

								nlapiSubmitField("customrecord_flo_customization", internalid, fields, values, false);			
							}
						} catch(e) {
							nlapiLogExecution("debug","E",e);
						}
									
					}
				}
			}
			if(!scheduled) {
				var status = nlapiScheduleScript(context.getScriptId(), 'customdeploy_flo_clean_stdnames2');
			}

		} else {
			mergeDuplicateStandardRecords();
		}
			

		

		
	} catch(e) {
		nlapiLogExecution("debug","E",e);
	}
}

function mergeDuplicateStandardRecords() {
	try {
		var MAXUSAGEREMAIN = 5001;
		var MAX_TIME=600000; //10 minutes
		var START_TIME=new Date().getTime();
		var ssfilters = [];

		ssfilters.push(new nlobjSearchFilter('isinactive', null,'is', "F"));
		ssfilters.push(new nlobjSearchFilter('custrecord_flo_cust_type', null,'anyof', [24]));
		var summaryfilter = new nlobjSearchFilter('internalid', null,'greaterthan', 1);
		summaryfilter.setSummaryType('count')
		ssfilters.push(summaryfilter);

		var sscolumns = [];
		sscolumns.push(new nlobjSearchColumn('internalid',null,'count'));
		sscolumns[0].setSort();
		sscolumns.push(new nlobjSearchColumn('name',null,'group'));

		var customizationsearch = nlapiSearchRecord("customrecord_flo_customization",null,ssfilters,sscolumns);
		nlapiLogExecution("debug", "customizationsearch", customizationsearch);
		
		if(customizationsearch) {
			for(var i=0; customizationsearch[i] != null; i++) {
				var columns = customizationsearch[i].getAllColumns();
				var remainingUsage=nlapiGetContext().getRemainingUsage();
				var timeDiff=new Date().getTime() - START_TIME;
				var internalid = customizationsearch[i].getValue(columns[0]);
				if (remainingUsage <= MAXUSAGEREMAIN || timeDiff > MAX_TIME || i == 999){
					var sparams = [];
					sparams['custscript_flo_scriptdep_index'] = internalid;
					var context = nlapiGetContext();
					var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId());
					
					if ( status == 'QUEUED' ) {
						return;
						nlapiLogExecution("debug","RESCHEDULE");
					}
					break;
				} else {
					try {
						var custname = customizationsearch[i].getValue(columns[1]);
						nlapiLogExecution("debug", "custname", custname);
						var ssfilters2 = [];

						ssfilters2.push(new nlobjSearchFilter('isinactive', null,'is', "F"));
						ssfilters2.push(new nlobjSearchFilter('custrecord_flo_cust_type', null,'anyof', [24]));
						ssfilters2.push(new nlobjSearchFilter('name', null,'is', custname));

						var sscolumns2 = [];
						sscolumns2.push(new nlobjSearchColumn('internalid'));
						sscolumns2[0].setSort();
						sscolumns2.push(new nlobjSearchColumn('name'));
						sscolumns2.push(new nlobjSearchColumn('custrecord_flo_orig_name'));

						var customizationsearch2 = nlapiSearchRecord("customrecord_flo_customization",null,ssfilters2,sscolumns2);
						var customizationsToUpdate = [];	
						var winnerCustomization = null;
						if(customizationsearch2) {
							for(var j = 0; customizationsearch2[j] != null; j++) {
								var custid = customizationsearch2[j].getId();
								var dupname = customizationsearch2[j].getValue('name');
								//nlapiLogExecution("debug", dupname, custid);
								var origname = customizationsearch2[j].getValue('custrecord_flo_orig_name');
								if(origname.match(/_/) != null && winnerCustomization == null) {
									winnerCustomization = custid;
								} else {
									customizationsToUpdate.push(custid)
								}
							}
						}

						if(winnerCustomization == null && customizationsToUpdate.length > 1) {
							winnerCustomization = customizationsToUpdate[0];
							customizationsToUpdate.splice(0,1)
						}
						nlapiLogExecution("debug", "winnerCustomization", winnerCustomization);
						nlapiLogExecution("debug", "customizationsToUpdate", customizationsToUpdate);
						if(winnerCustomization && customizationsToUpdate.length > 0) {
							
							var ssfilters3 = [['isinactive','is','F'],'AND', [['custrecord_flo_cust_parent','anyof',customizationsToUpdate], 'OR', ['custrecord_flo_base_record','anyof',customizationsToUpdate] ] ];

							var sscolumns3 = [];
							sscolumns3.push(new nlobjSearchColumn('internalid'));
							sscolumns3[0].setSort();
							sscolumns3.push(new nlobjSearchColumn('custrecord_flo_cust_parent'));
							sscolumns3.push(new nlobjSearchColumn('custrecord_flo_base_record'));

							var customizationsearch3 = nlapiSearchRecord("customrecord_flo_customization",null,ssfilters3,sscolumns3);
							
							

							if(customizationsearch3) {
								for(var k = 0; customizationsearch3[k] != null; k++) {
									var childid = customizationsearch3[k].getId();
									var custrecord_flo_cust_parent = customizationsearch3[k].getValue('custrecord_flo_cust_parent');
									var custrecord_flo_base_record = customizationsearch3[k].getValue('custrecord_flo_base_record');
									if(custrecord_flo_cust_parent) {
										custrecord_flo_cust_parent = custrecord_flo_cust_parent.split(',');
										for(var c = 0; c < customizationsToUpdate.length; c++) {
											var loserid = customizationsToUpdate[c];
											var pos = custrecord_flo_cust_parent.indexOf(loserid);
											if(pos != -1) {
												custrecord_flo_cust_parent.splice(pos,1)
											}
										}
										custrecord_flo_cust_parent.push(winnerCustomization)
									}
									if(custrecord_flo_base_record) {
										custrecord_flo_base_record = winnerCustomization;
									}
									var fields = ["custrecord_flo_cust_parent",'custrecord_flo_base_record',"custrecord_skip_rec_log"];
									var values = [custrecord_flo_cust_parent,custrecord_flo_base_record,'T'];
									nlapiSubmitField("customrecord_flo_customization", childid, fields, values, false);
									nlapiLogExecution("debug","updated",childid);
								}
							}

							for(var d = 0; d < customizationsToUpdate.length; d++) {
								var fields2 = ["isinactive","custrecord_skip_rec_log"];
								var values2 = ['T','T'];
								nlapiSubmitField("customrecord_flo_customization", customizationsToUpdate[d], fields2, values2, false)
								nlapiLogExecution("debug","inactivated",customizationsToUpdate[d]);
							}
							
						}
						
					} catch(e) {
						nlapiLogExecution("debug","E",e);
					}
								
				}
			}
		}
			

		
			
	} catch(e) {
		nlapiLogExecution("debug","E",e);
	}
}