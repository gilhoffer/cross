//auditTagResultSS()
var date = new Date().getTime();
var MIN_SYS_USAGE = 2000; //minimum usage before reschedule
var EXEC_TIME = 300000; //5mins
var context = nlapiGetContext();
var status = "";
var lastIndex = context.getSetting('SCRIPT', 'custscript_flo_audittag_index');
var lastIndex2 = context.getSetting('SCRIPT', 'custscript_flo_audittag_index2');
var lastotalcount = context.getSetting('SCRIPT', 'custscript_flo_audittag_totalcount');

function auditTagResultSS() {
	try {
		var from = context.getSetting('SCRIPT', 'custscript_flo_audittag_starttime');
		var to = context.getSetting('SCRIPT', 'custscript_flo_audittag_endtime');
		var statconfigobj = nlapiLoadRecord("customrecord_flo_spider_configuration", 1)
		var configfrom = statconfigobj.getFieldValue('custrecord_flo_script_start_time');
		var configto = statconfigobj.getFieldValue('custrecord_flo_script_end_time');
		var licensedmodules = nlapiLookupField('customrecord_flo_license', 1, 'custrecord_flo_licensed_modules');

		if (!from || !to) {
			from = configfrom;
			to = configto;
		}

		if (!isWithinTimeWindow(from, to)) {
			nlapiLogExecution("AUDIT", "out of range", "out of time range");
			return;
		}

		if (licensedmodules == null || licensedmodules.indexOf('SCRIPT') == -1) {
			nlapiLogExecution("AUDIT", "license error", "Please check licensed modules.");
			return;
		}

		//GET USERS AND MAX EXECUTION DATE OF ALL SCRIPTS
		var scriptDetails = getUsersAndMaxDateFromScriptLog();

		//SEARCH FOR SCRIPT CUSTOMIZATIOINS
		var s = nlapiLoadSearch(null, 'customsearch_flo_cust_scripts_get_audit');
		var filterExpression = [
			[
				[
					["custrecord_flo_audit_logging", "isnotempty", null], "AND", ["custrecord_flo_cust_type", "anyof", "22", "34", "42", "18", "23", "35", "20", "21", "17", "43", "19", "33"]
				], "OR", [
					[["name", "contains", "FLO"], "OR", ["name","startswith","Strongpoint"]], "AND", ["custrecord_flo_retrieval_error", "isnotempty", null]
				]
			], "AND", ["internalidnumber", "greaterthanorequalto", 0, null]
		]

		nlapiLogExecution('DEBUG', 'lastIndex', lastIndex + ', ' + lastIndex2 + ', ' + lastotalcount);

		var filters = null;
		if (lastIndex) {
			filters = [];
			if (lastIndex2 != null && lastIndex2 != "") {
				filterExpression[2] = ["internalidnumber", "greaterthanorequalto", lastIndex, null];
				//filters[0]=new nlobjSearchFilter('internalidnumber',null,'greaterthanorequalto',lastIndex);
			} else {
				filterExpression[2] = ["internalidnumber", "greaterthan", lastIndex, null];
				//filters[0]=new nlobjSearchFilter('internalidnumber',null,'greaterthan',lastIndex);
			}
		}

		try {
			nlapiLogExecution('DEBUG', 'filterExpression', JSON.stringify(filterExpression));
			s.setFilterExpression(filterExpression);
			var resultSet = s.runSearch();
			resultSet.forEachResult(function(searchResult) {
				if (context.getRemainingUsage() < MIN_SYS_USAGE || (new Date().getTime() - date) > EXEC_TIME) {
					nlapiLogExecution('DEBUG', 'END Rescheduling', 'Rescheduling');
					var sparams = new Array();
					sparams['custscript_flo_audittag_index'] = lastIndex;
					sparams['custscript_flo_audittag_index2'] = null;
					sparams['custscript_flo_audittag_totalcount'] = 0;
					sparams['custscript_flo_audittag_avgtime'] = 0;
					status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), sparams);
					if (status == 'QUEUED') return false;
				} else {

					var rectype = searchResult.getRecordType();
					var recid = searchResult.getId();
					nlapiLogExecution('DEBUG', 'recid', recid);
					//auditTagsResults(rectype,recid);
					analyzeScriptExecution(rectype, recid, scriptDetails)
					lastIndex = recid;
				}

				if (status == 'QUEUED') return false;
				else return true; // return true to keep iterating
			});

		} catch (e) {
			nlapiLogExecution('DEBUG', 'search error', e);
		}

	} catch (ee) {
		nlapiLogExecution("debug", "ee", ee);
	}



}

function getUsersAndMaxDateFromScriptLog() {
	var scriptusers = {}
	try {
		var logfilters = [
			['isinactive', 'is', 'F'], "AND",
			['executionlog.date', 'isnotempty', null]
		];
		var logcoumns = [new nlobjSearchColumn('internalid', null, 'group'), new nlobjSearchColumn('user', 'executionlog', 'group'), new nlobjSearchColumn('date', 'executionlog', 'max')];
		logcoumns[0].setSort();
		var logsearch = nlapiCreateSearch('script', logfilters, logcoumns);
		var resultSet = logsearch.runSearch();
		if (resultSet) {
			var endnow = false;
			for (var i = 0; endnow == false; i++) {
				var start = i * 1000;
				var end = (i + 1) * 1000
				var logresults = resultSet.getResults(start, end);
				if (logresults) {
					for (var l = 0; logresults[l] != null; l++) {
						var allcolumns = logresults[l].getAllColumns();
						var scriptInternalId = logresults[l].getValue(allcolumns[0]);
						var user = logresults[l].getValue(allcolumns[1]);
						var maxdate = logresults[l].getValue(allcolumns[2]);
						if (scriptusers.hasOwnProperty(scriptInternalId)) {
							var lastrecordeddate = scriptusers[scriptInternalId].maxdate;
							var lastrecordedscriptdetails = scriptusers[scriptInternalId]
							if (lastrecordedscriptdetails && lastrecordedscriptdetails.users) {
								if (lastrecordedscriptdetails.users.indexOf(user) == -1) {
									scriptusers[scriptInternalId].users.push(user);
								}
							} else {
								scriptusers[scriptInternalId].users.push(user);
							}

							try {
								if (lastrecordeddate) {
									if (maxdate && nlapiStringToDate(maxdate) > nlapiStringToDate(lastrecordeddate)) {
										scriptusers[scriptInternalId].maxdate = maxdate;
									}
								} else {
									scriptusers[scriptInternalId].maxdate = maxdate;
								}
							} catch (e) {
								nlapiLogExecution("debug", "maxdate", e);
							}

						} else {
							scriptusers[scriptInternalId] = {
								maxdate: maxdate,
								users: [user]
							};
						}

					}

					if(logresults.length < 1000) {
						endnow = true;
					}
				} else {
					endnow = true;
				}

			}
		}
		nlapiLogExecution("debug", "getUsersFromScriptLog", JSON.stringify(scriptusers));
	} catch (e) {
		nlapiLogExecution("debug", "getUsersFromScriptLog", e);
	}
	return scriptusers;
}

function formatArrayReturns(arr) {
	try {
		if (arr) {
			if (arr instanceof Array) {
				arr = arr.join(',').split(',')
			} else {
				arr = arr.split(',')
			}
		} else {
			arr = [];
		}
	} catch (e) {
		nlapiLogExecution("debug", "formatArrayReturns", e);
	}

	return arr;

}

function analyzeScriptExecution(rectype, recid, scriptDetails) {
	try {
		var rec = nlapiLoadRecord(rectype, recid);
		var scriptId = rec.getFieldValue('custrecord_flo_cust_id');
		var myInternalId = rec.getFieldValue('custrecord_flo_int_id');
		var scriptType = rec.getFieldText('custrecord_flo_cust_type');
		var auditlogs = rec.getFieldValue('custrecord_flo_audit_logging');
		var types = rec.getFieldValues("custrecord_flo_by_type");
		var employeeValues = rec.getFieldValues("custrecord_flo_employees_cust");
		var deptValues = [];
		var oldRecordJSON = JSON.stringify(rec);
		//INTERNALID MUST BE SET
		if (!myInternalId) return;

		types = formatArrayReturns(types);
		employeeValues = formatArrayReturns(employeeValues);

		var endTitle = "";
		var startTitle = "";
		if (auditlogs && auditlogs.indexOf('FLOStart') > -1) {
			startTitle = 'FLOStart';
			try {
				endTitle = auditlogs.split("::")[1].split(",")[1];
				if (endTitle) endTitle = endTitle.replace(/'|"/g, '')
			} catch (e) {
				endTitle = "";
			}
		}

		//Set Users & Last Date Used
		var scriptUserAndDate = scriptDetails[myInternalId];
		if (scriptUserAndDate) {
			var executioners = scriptUserAndDate.users;
			var maxdate = scriptUserAndDate.maxdate;

			if (maxdate) {
				rec.setFieldValue("custrecord_flo_dls", maxdate);
			}

			if (executioners) {
				if (executioners.indexOf('-System-')) {
					rec.setFieldValue("custrecord_flo_system", 'T');
				}
				var entityIDFilters = [];
				var hasvendor = false;
				var hascustomer = false;

				//GET FILTER OF ALL ENTITYID
				for (var u = 0; u < executioners.length; u++) {
					var entityID = executioners[u];

					//SKIP SYSTEM
					if (entityID == '-System-') continue;
					if(entityID) {
						var efilter = ['entityid', 'is', entityID];
						if (entityIDFilters.length > 0) {
							entityIDFilters.push("OR");
						}
						entityIDFilters.push(efilter);
					}
					
				}

				var empFilters = entityIDFilters.slice();
				if (employeeValues && employeeValues.length > 0) {
					var internalidfilter = ['internalid', 'anyof', employeeValues];
					if (empFilters.length > 0) {
						empFilters.push("OR");
					}
					empFilters.push(internalidfilter);
				}

				//Vendor -3
				//Customer -2
				if (entityIDFilters.length > 0) {
					nlapiLogExecution("debug", "entityIDFilters", entityIDFilters);
					var employees = getEntityInternalIds("employee", empFilters);
					rec.setFieldValues("custrecord_flo_employees_cust", employees);
					if (employees.length > 0) {
						var depFilters = ['internalid', 'anyof', employees];
						var deptValues = getDeparments(depFilters);
						nlapiLogExecution("debug", "deptValues", deptValues);
						rec.setFieldValues("custrecord_flo_depts_cust", deptValues);
					}

					var vendors = getEntityInternalIds("vendor", entityIDFilters);
					var customers = getEntityInternalIds("customer", entityIDFilters);

					if (vendors && vendors.length > 0 && types.indexOf(-3) == -1) {
						types.push(-3);
					}

					if (customers && customers.length > 0 && types.indexOf(-2) == -1) {
						types.push(-2);
					}

					if (types.length > 0) {
						rec.setFieldValue("custrecord_flo_ext_users", 'T');
						rec.setFieldValue("custrecord_flo_by_type", types);
					}


				}
			}
		}

		//GET custrecord_flo_daily_script_us, custrecord_flo_script_avg_run_time, custrecord_flo_dls
		if (scriptType.indexOf('Scheduled') != -1) {
			//If it is scheduled script, base it from the schedule instance
			var scriptfilters = [
				['startdate', 'onorafter', 'yesterday'], 'AND', ['script.internalidnumber', 'equalto', myInternalId], 'AND', ['enddate', 'isnotempty', null], 'AND', ['startdate', 'isnotempty', null]
			]
			var columns = [new nlobjSearchColumn('internalid', 'script'), new nlobjSearchColumn('startdate'), new nlobjSearchColumn('enddate'), new nlobjSearchColumn('formulanumeric')];
			columns[2].setSort(true);
			columns[3].setFormula('ROUND(ABS(({enddate}-{startdate}) * 24 * 60 * 60 * 1000))');

			var searchinstance = nlapiCreateSearch('scheduledscriptinstance',scriptfilters, columns);
			var resultset = searchinstance.runSearch();
			if (resultset) {
				var instanceresults = resultset.getResults(0, 1000);
				if (instanceresults) {
					var totaltime = 0;
					for (var s = 0; instanceresults[s]; s++) {
						var allcolumns = instanceresults[s].getAllColumns();
						var enddate = instanceresults[s].getValue(allcolumns[2]);
						var runtime = instanceresults[s].getValue(allcolumns[3]);
						if (s == 0) {
							var currentmaxdate = rec.getFieldValue("custrecord_flo_dls");
							if (currentmaxdate) {
								if (nlapiStringToDate(enddate) > nlapiStringToDate(currentmaxdate)) {
									rec.setFieldValue("custrecord_flo_dls", nlapiDateToString(nlapiStringToDate(enddate)))
								}
							}
						}

						totaltime += parseInt(runtime);
					}

					if(totaltime > 0) {
						var avgtime = totaltime / instanceresults.length;
						rec.setFieldValue("custrecord_flo_script_avg_run_time", Math.round(avgtime));
					}
					if(instanceresults.length > 0) {
						rec.setFieldValue("custrecord_flo_daily_script_us", instanceresults.length);
					}
					
				}
			}
			var newRecordJSON = JSON.stringify(rec);
			if(oldRecordJSON != newRecordJSON) {
				var updatedrec = nlapiSubmitRecord(rec);
				nlapiLogExecution("debug", "updatedrec", updatedrec);
			}
			
		} else if (startTitle) {
			auditTagsResults(rec, recid, startTitle, endTitle)
		}
	} catch (e) {
		nlapiLogExecution("debug", "analyzeScriptExecution", e);
	}
}

function getDeparments(entityfilters) {
	var departments = [];
	try {
		var empfilts = [
			['isinactive', 'is', 'F'], "AND", ['department.isinactive', 'is', 'F'], "AND", entityfilters
		];

		var columns = [new nlobjSearchColumn('departmentnohierarchy')];
		emplist = nlapiSearchRecord("employee", null, empfilts, columns);

		for (e = 0; emplist != null && emplist[e] != null; e++) {
			var department = emplist[e].getValue('departmentnohierarchy');
			if(department) {
				departments.push(department);
			}
			
		}
	} catch(e) {

	}
	
	return departments;
}

function getEntityInternalIds(entitytpe, entityfilters) {
	var empIds = [];
	try {
		var empfilts = [
			['isinactive', 'is', 'F'], "AND", entityfilters
		];
		var columns = null;
		nlapiLogExecution("debug", "empfilts", empfilts);
		emplist = nlapiSearchRecord(entitytpe, null, empfilts, columns);

		for (e = 0; emplist != null && emplist[e] != null; e++) {
			empIds.push(emplist[e].getId());
		}
	} catch(e) {

	}
	return empIds;
}

function auditTagsResults(rec, recid, sTitle, eTitle) {


	//var rec=nlapiLoadRecord('customrecord_flo_customization',1316);

	var name = rec.getFieldValue('name');
	var scriptId = rec.getFieldValue('custrecord_flo_cust_id');
	var myInternalId = rec.getFieldValue('custrecord_flo_int_id');

	try {

		/*srchfilters.push(new nlobjSearchFilter('internalidnumber',null, 'equalto',myInternalId));
	if (lastIndex2) {
		 srchfilters.push(new nlobjSearchFilter('formulanumeric',null, 'lessthanorequalto',lastIndex2));
		 srchfilters[1].setFormula('{executionlog.internalid}');
	}*/
		var titlefilter = [['executionlog.title', 'is', sTitle]];
		if(eTitle) {
			titlefilter.push('OR');
			var endtitlefilter = ['executionlog.title', 'is', eTitle];
			titlefilter.push(endtitlefilter);
		}
		var srchfilters = [
			['internalidnumber', 'equalto', myInternalId], 'AND',
			['executionlog.date', 'onorafter', 'yesterday'], 'AND', 
			titlefilter
		];

		if (lastIndex2) {
			srchfilters.push("AND");
			var laststop = ['executionlog.internalidnumber', 'lessthanorequalto', lastIndex2];
			srchfilters.push(laststop);
		}

		nlapiLogExecution("debug", "srchfilters", srchfilters);

		//srchfilters.push(new nlobjSearchFilter('title', null, 'startwith','FLOStart'));
		var scriptauditx = nlapiSearchRecord(null, "customsearch_flo_scriptlogsearch", srchfilters, null);

		var ax = 0;

		if (scriptauditx) {

			// nlapiLogExecution('DEBUG', 'myInternalId2', myInternalId);
			nlapiLogExecution('DEBUG', 'myInternalId', 'recid' + recid + 'myInternalId: ' + myInternalId + ' lastIndex2:' + lastIndex2);
			var totalCount = 0;
			var dateset = false;
			var ax = 0;

			if (lastIndex2) {
				//	ax=parseInt(lastIndex2); //for continuation
				lastIndex2 = null;
				custscript_flo_audittag_totalcount = context.getSetting('SCRIPT', 'custscript_flo_audittag_totalcount');
				if (!custscript_flo_audittag_totalcount) custscript_flo_audittag_totalcount = 0;
				totalCount = parseInt(custscript_flo_audittag_totalcount);
				lastotalcount = 0;
				nlapiLogExecution('DEBUG', 'totalCount - ' + recid, totalCount);
			}

			//CHECK IF WE CAN CALCULATE THE SCRIPT AVG RUN TIME
			var auditlogs = rec.getFieldValue('custrecord_flo_audit_logging');
			var getAvgTime = false;
			var avgTime = 0;
			var floEndTime = 0;
			var floStartTime = 0;
			var endTitle = "";
			var timecheck = 1420041600000; //Milliseconds value for Jan 1 2015
			if (auditlogs && auditlogs.indexOf('FLOStart') > -1) {
				try {
					endTitle = auditlogs.split("::")[1].split(",")[1];
					if (endTitle) endTitle = endTitle.replace(/'|"/g, '')
				} catch (e) {
					endTitle = "";
				}
				//IF START Audit LOG 'FLOStart' AND End AUDIT LOG IS FOUND, GET SCRIPT'S AVG RUN TIME
				if (endTitle) {
					getAvgTime = true;
					avgTime = context.getSetting('SCRIPT', 'custscript_flo_audittag_avgtime');
					if (avgTime) {
						avgTime = parseInt(avgTime)
					} else {
						avgTime = 0;
					}
				}
			}
			nlapiLogExecution('DEBUG', 'getAvgTime for ' + name + ' - ' + getAvgTime, endTitle);
			for (ax = 0; scriptauditx[ax] != null; ax++) {
				var auditcols = scriptauditx[ax].getAllColumns();
				if (context.getRemainingUsage() < MIN_SYS_USAGE || (new Date().getTime() - date) > EXEC_TIME || ax > 995) {
					nlapiLogExecution('DEBUG', 'END Rescheduling inner', 'Rescheduling');
					nlapiLogExecution('DEBUG', 'totalCount3 - ' + recid, totalCount);
					var sparams = new Array();
					sparams['custscript_flo_audittag_index'] = recid;
					sparams['custscript_flo_audittag_index2'] = scriptauditx[ax].getValue(auditcols[4]);
					sparams['custscript_flo_audittag_totalcount'] = totalCount;
					sparams['custscript_flo_audittag_avgtime'] = avgTime;
					status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(), sparams);
					if (status == 'QUEUED') break;
				} else {


					//var auditDep = ""; //scriptauditx[au].getValue(auditcols[4]);
					//var auditUser = scriptauditx[ax].getValue(auditcols[3]);
					var auditCount = 1 //criptauditx[ax].getValue(auditcols[4]); 
					var auditWork = 1 //scriptauditx[au].getValue(auditcols[9]); 
					var auditDate = scriptauditx[ax].getValue(auditcols[5]);
					var auditTitle = scriptauditx[ax].getValue(auditcols[2]);
					var auditDetails = scriptauditx[ax].getValue(auditcols[6]);
					//GET AVERAGE SCRIPT RUN TIME
					if (getAvgTime && avgTime == 0 && auditDetails && !isNaN(auditDetails) && parseInt(auditDetails) > timecheck) {
						nlapiLogExecution('DEBUG', 'getAvgTime for ' + name + ' - ' + auditTitle, auditDetails);
						if (auditTitle.match(endTitle)) {
							floEndTime = parseInt(auditDetails);
						}

						if (floEndTime != 0 && auditTitle.match('FLOStart')) {
							floStartTime = parseInt(auditDetails);
						}

						if (floEndTime && floStartTime) {
							avgTime = floEndTime - floStartTime;
						}
					} //end avg script run time

					if (!auditTitle.match('FLOStart')) {
						//ax =scriptauditx.length+1;

						continue;
					} else {
						//	 nlapiLogExecution('DEBUG', 'today', today + "=" + auditDate);
						// if(today == auditDate) {
						totalCount += parseInt(auditCount);
						//}
					}


					//nlapiLogExecution('DEBUG', 'today ' + ax, auditDate)
					/*if(!dateset){
					
                  rec.setFieldValue("custrecord_flo_dls",auditDate); 
				  dateset=true;
                }

                if(auditUser.match('System')){
                  rec.setFieldValue("custrecord_flo_system",'T');  
                  auditWork=null;
                }
				// nlapiLogExecution('DEBUG', 'auditWork', auditWork);
                if(auditWork!=null){

                      var empId=getEmpId(auditUser)
					
						// nlapiLogExecution('DEBUG', 'empId', empId);
                      if(empId==""){

                        var myCustomer=getCustomer(auditUser) 						
						//nlapiLogExecution('DEBUG', 'myCustomer', myCustomer);
                        
						
						var myVendor=getVendor(auditUser) 
						//nlapiLogExecution('DEBUG', 'myVendor', myVendor);
						
                        var mytype=""; 

                        if(myCustomer!=''){mytype='customer'}

                        if(myVendor!=''){mytype='vendor'}

                        if(mytype!=''){

                        var typeValues=rec.getFieldValues("custrecord_flo_by_type");  
                          if(typeValues!=null && typeValues!="" ){
                              var myArrayUpdatedType=typeValues.join(',').split(",");
                          }else{
                                var myArrayUpdatedType=[];
                          }

                          var mypos=myArrayUpdatedType.indexOf(mytype);

                          if(mypos==-1){ myArrayUpdatedType.push(mytype);}
                          
                          rec.setFieldValues("custrecord_flo_by_type",myArrayUpdatedType);

                          rec.setFieldValue("custrecord_flo_ext_users",'T');  
                        }

                      }else{

                          var emprec=nlapiLoadRecord('employee',empId);
                          auditDep=emprec.getFieldValue('department');
						//  nlapiLogExecution('DEBUG', 'auditDep', auditDep);
                         
                          var employeeValues=rec.getFieldValues("custrecord_flo_employees_cust");  

                          if(employeeValues!=null && employeeValues!="" ){
                              var myArrayUpdated=employeeValues.join(',').split(",");
                          }else{
                                var myArrayUpdated=[];

                          }
						//nlapiLogExecution('DEBUG', 'myArrayUpdated', myArrayUpdated);
                          var mypos=myArrayUpdated.indexOf(empId);

                          if(mypos==-1){ myArrayUpdated.push(empId);}
                          
                          rec.setFieldValues("custrecord_flo_employees_cust",myArrayUpdated);
                        

                          var deptValues=rec.getFieldValues("custrecord_flo_depts_cust");  
						//nlapiLogExecution('DEBUG', 'deptValues', deptValues);
                          if(deptValues!=null && deptValues!="" ){
                              var myArrayUpdatedDep=deptValues.join(',').split(",");
                          }else{
                              var myArrayUpdatedDep=[];

                          }
						//	nlapiLogExecution('DEBUG', 'myArrayUpdatedDep', myArrayUpdatedDep);
							if(auditDep!=null && auditDep!="") {
                        		  var mypos=myArrayUpdatedDep.indexOf(auditDep);

                        		  if(mypos==-1 ){ myArrayUpdatedDep.push(auditDep);}
							}
                          
                          rec.setFieldValues("custrecord_flo_depts_cust",myArrayUpdatedDep);
                      }
                  }*/

				}

			}

			nlapiLogExecution('DEBUG', 'totalCount2 - ' + recid, totalCount);
			if (status == "") {
				rec.setFieldValue("custrecord_flo_daily_script_us", parseInt(totalCount));
				if (avgTime && avgTime > 0) {
					nlapiLogExecution('DEBUG', 'getAvgTime for ' + name, avgTime);
					rec.setFieldValue("custrecord_flo_script_avg_run_time", avgTime);
				}

			}
			var updatedrec = nlapiSubmitRecord(rec);
			nlapiLogExecution('debug', "updatedrec",updatedrec);
		}

	} catch (e) {
		nlapiLogExecution('Error', e);
	}
}


function getEmpId(name) {
	emplist = "";
	name = name.replace("-", ",");
	if (emplist == "") {
		//load a list of employees
		var empfilts = [];
		empfilts[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		empfilts[1] = new nlobjSearchFilter('entityid', null, 'is', name);

		var empcols = [];
		empcols[0] = new nlobjSearchColumn("entityid");
		emplist = nlapiSearchRecord("employee", null, empfilts, empcols);

	}
	for (e = 0; emplist != null && emplist[e] != null; e++) {
		cols = emplist[e].getAllColumns();
		if (emplist[e].getValue(cols[0]).match(name)) {
			return emplist[e].getId();
		}
	}
	return ""
}

function getCustomer(name) {
	emplist = "";
	name = name.replace("-", ",");
	if (emplist == "") {
		//load a list of employees
		var empfilts = [];
		empfilts[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		empfilts[1] = new nlobjSearchFilter('entityid', null, 'is', name);

		var empcols = [];
		empcols[0] = new nlobjSearchColumn("entityid");
		emplist = nlapiSearchRecord("customer", null, empfilts, empcols);

	}
	for (e = 0; emplist != null && emplist[e] != null; e++) {
		cols = emplist[e].getAllColumns();
		if (emplist[e].getValue(cols[0]).match(name)) {
			return emplist[e].getId();
		}
	}
	return ""
}

function getVendor(name) {
	emplist = "";
	name = name.replace("-", ",");
	if (emplist == "") {
		//load a list of employees
		var empfilts = [];
		empfilts[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
		empfilts[1] = new nlobjSearchFilter('entityid', null, 'is', name);

		var empcols = [];
		empcols[0] = new nlobjSearchColumn("entityid");
		emplist = nlapiSearchRecord("vendor", null, empfilts, empcols);

	}
	for (e = 0; emplist != null && emplist[e] != null; e++) {
		cols = emplist[e].getAllColumns();
		if (emplist[e].getValue(cols[0]).match(name)) {
			return emplist[e].getId();
		}
	}
	return ""
}