/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
  */
define(['N/runtime','N/search','N/record','N/task','N/format','N/config'],
    function(runtime,search,record,task,format,config)
    {
    	function onAction(context){
			var NEGATIVESPIDERINTERVAL = 8;
			var SEARCHSPIDERINTERVAL = 3;
			var ROLESPIDERINTERVAL = 24;
			var CUSTOMFIELDSPIDERINTERVAL = 6;
			var ONEDAYINTERVAL = 24; //MAKE SURE SCRIPT RUNS DAILY
			var MAKEJOININTERVAL = 2;
			try {	
				var starttime = new Date().getTime();
				var configRec = record.load({type:"customrecord_flo_spider_configuration", id:1});	
				
				spiderdate = configRec.getValue("custrecord_flo_spider_back_en_date") || null;
				makejoindate = configRec.getValue("custrecord_flo_make_joins_date") || null;
				if(spiderdate === null || makejoindate === null) {
			       log.audit("Initial Spider Not Finished","Initial Spider Not Finished");
			       return;
			    }
				//Don't run if initial spider is not yet done

				var timewindowstart = configRec.getValue("custrecord_flo_script_start_time") || null;
				var timewindowend = configRec.getValue("custrecord_flo_script_end_time") || null;


				try {
					log.debug("timewindowstart",timewindowstart);
					log.debug("timewindowend",timewindowend);
					if(!isWithinTimeWindow(timewindowstart, timewindowend)) {
						log.debug("Outside Time Window","Stop Running.")
						return;
					}
				} catch(ee) {
					log.debug('isWithinTimeWindow',ee)
				}
				

				//Field to hold JSON status
				var spiderTracker = configRec.getValue("custrecord_flo_spider2_tracker") || "";
				
				if(spiderTracker === "") {
					spiderTracker = {};
				} else {
					spiderTracker = JSON.parse(spiderTracker);
				}

				try {
					
					//Search for In Queue scripts
					var inqueuescriptsSearch = search.load({type:search.Type.SCHEDULED_SCRIPT_INSTANCE,id:"customsearch_flo_spider_2_in_queue"});
					var inqueuescriptsFound = inqueuescriptsSearch.run().getRange({start:0,end:999});
					var queuedScripts = [];
					if(inqueuescriptsFound) {
						for(var i=0; i < inqueuescriptsFound.length; i++) {
							var qcol = inqueuescriptsFound[i].columns;
							var scriptid = inqueuescriptsFound[i].getValue(qcol[0]).toLowerCase();
							queuedScripts.push(scriptid);
						}
					}
                  
                  	// Schedule scripts when they were not run in the last 24hours 
                  	// this is due to time window behavior
                  	try {
						var recentlyRunScripts = [];
						var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
						var formattedDate = format.format({value: yesterday ,type: format.Type.DATE});

						var scheduledScriptInstances = search.create({
							type: search.Type.SCHEDULED_SCRIPT_INSTANCE,
							columns: [
									search.createColumn({
				                    	name: 'scriptid',
				                    	join: 'script',
				                    	summary: 'group',
				                        sort : search.Sort.ASC
		                    		})
								],
							filters: [
								["script.name", "startswith", "Strongpoint"], 
								"AND",
								[[["formulanumeric:({enddate}-{startdate}) * 24 * 60 * 60", "greaterthan", 1],
								"AND", 
								["startdate", "onorafter", 'yesterday']],'OR',['formulanumeric:(sysdate - {datecreated}) * 24','lessthan',1]]]
						});

						scheduledScriptInstances.run().each(function(result) {
							var scriptid = result.getValue(result.columns[0]);
							scriptid = scriptid.toLowerCase();
							if (recentlyRunScripts.indexOf(scriptid) === -1) {
								recentlyRunScripts.push(scriptid);
							}

							return true;
						});
						
						var scheduledScripts = search.create({
							type: search.Type.SCRIPT_DEPLOYMENT,
							columns : [ 
								{name: 'title'},
								{name: 'script'},
								{name: 'name', join: 'script'},
								{name: 'scriptid', join: 'script'},
								{name: 'internalid', join: 'script'},
								{name: 'scriptid'},
                              	{name: 'internalid'},
								{name: 'loglevel'},
								{name: 'recordtype'},
								{name: 'eventtype'},
								{name: 'apiversion', join: 'script'},
								{name: 'scripttype', join: 'script'},
								{name: 'owner', join: 'script'}],
							filters : [
								["isdeployed","is","T"], 
								"AND", 
								["script.name", "startswith", "Strongpoint"], 
								"AND",
								[["formulatext:{status}", "is", "Scheduled"],'OR',['scriptid','is','customdeploy_flo_script_parser']]]
						});

						scheduledScripts.run().each(function(result) {
							var scriptdeploymentid = result.getValue({ name: 'scriptid' });
							var scriptid = result.getValue({name: 'scriptid', join: 'script'});
							var internalid = result.getValue({name: 'internalid', join: 'script'});
                          	var remainingUsage = runtime.getCurrentScript().getRemainingUsage();

							if (remainingUsage < 250) {
								return false;
							}

							var deploymentRec = null;
							try {
								deploymentRec = record.load({
									type: record.Type.SCRIPT_DEPLOYMENT,
									id: result.getValue({ name: 'internalid' })
								});
							} catch(e) {

							}
							

							if (!deploymentRec) {
								return true;
							}

							var recurringEvent = deploymentRec.getValue({ fieldId: 'recurringevent' });
							var endDate = false;
							if(recurringEvent) {
								try {
									// Check End Date is Not Set.
									var schedevent = JSON.parse(recurringEvent);
									if(schedevent && schedevent.endDate) {
										var endDateTime = format.parse({value: schedevent.endDate,type: format.Type.DATE}).getTime();
										var currentTime = new Date().getTime();
										if(currentTime > endDateTime ) {
											endDate = true;
										}
										log.debug(scriptid + " endDate " + endDate);
									}
								} catch(e) {
									log.debug("schedevent error: " + e);
								}
							}
							scriptid = scriptid.toLowerCase();

							if(scriptid == "customscript_spider_schedule") {
								try {
									var spiderfiles = search.load({type:'file',id:'customsearch_flo_spider_files'});
									if(spiderfiles) {
										var fileresults = spiderfiles.run().getRange({start:0,end:1});
										if(fileresults.length == 0) {
											log.debug("Skipping script no files to process: " + scriptid);
											return true;
										}
									}
								} catch(e) {
									log.debug("customsearch_flo_spider_files error: " + e);
								}
								
							}

							var runScript = false;
							//RUN MAKE JOIN IF THERE ARE PENDING OBJECTS TO JOIN
							if(scriptid == "customscript_customizations_make_joinss") {
								try {
									
									var custrecord_flo_remaining_obj_to_join = 0;
									//REMAINING OBJECTS TO JOIN
									var remainingcusttojoinsearch = search.create({type:'customrecord_flo_customization',
											columns:[{name: 'internalid',summary:'count'}],
											filters:[['isinactive','is','F'],'AND',[['custrecord_flo_make_join_date','isempty',null],'OR',['custrecord_flo_make_join_proc','is','F']]]
											});

									var custToJoinResults = remainingcusttojoinsearch.run().getRange(0,1);

									if(custToJoinResults && custToJoinResults[0]) {
										var cols = custToJoinResults[0].columns;
										custrecord_flo_remaining_obj_to_join = custToJoinResults[0].getValue(cols[0]) || 0;
									}
									if(custrecord_flo_remaining_obj_to_join && custrecord_flo_remaining_obj_to_join != 0) {
										runScript = true;
									}
								} catch(e) {
									log.debug("makejoin error: " + e);
								}
							} else if(scriptid == "customscript_flo_script_parser") {
								try {
									var custrecord_flo_script_spider_date = configRec.getValue('custrecord_flo_script_spider_date') || "";
									var custrecord_flo_spider_front_end_date  = configRec.getValue('custrecord_flo_spider_front_end_date') || "";

									if(custrecord_flo_script_spider_date != "") {
										custrecord_flo_script_spider_date = format.parse({value: custrecord_flo_script_spider_date,type: format.Type.DATETIME}).getTime();
									}

									if(custrecord_flo_spider_front_end_date != "") {
										custrecord_flo_spider_front_end_date = format.parse({value: custrecord_flo_spider_front_end_date,type: format.Type.DATETIME}).getTime();
									}


									if(custrecord_flo_spider_front_end_date && (!custrecord_flo_script_spider_date || custrecord_flo_spider_front_end_date > custrecord_flo_script_spider_date)) {
										runScript = true;
									}
								} catch(e) {
									log.debug("script file parser error: " + e);
								}
							} else if(recentlyRunScripts.indexOf(scriptid) === -1){
								runScript = true;
							}

							//log.debug(recentlyRunScripts)
							//log.debug(queuedScripts)
							if (runScript
								&& queuedScripts.indexOf(scriptid) === -1
                                && scriptdeploymentid !== 'customscript_flo_strongpointmetrics'
                               	&& recurringEvent.indexOf('DailyEvent') !== -1
                               	&& endDate == false) {
								log.debug("Schedule script:","internalid: " + internalid + " deployment: " + scriptdeploymentid + " script: " + scriptid);

								var deploymentid = null;
								var paramvalues = null;
								if(scriptid == "customscript_customizations_make_joinss") {
									deploymentid = 'customdeploy_flo_make_join_from_spider';
									spiderTracker.makejoin = starttime;
								} else if(scriptid == "customscript_flo_script_parser") {
									deploymentid = 'customdeploy_flo_script_parser';
									paramvalues = {custscript_flo_script_parser_search:'customsearch_flo_script_srch'}
								} 

								schedulescript(internalid, deploymentid,paramvalues);
							} else {
								log.debug("Skipping script: " + scriptid);
							}

							return true; // continue
						});
					} catch (e) {
						log.audit("time window scheduler",e)
					}
					
					//Run Negative Search Spider
					if(queuedScripts.indexOf("customscript_flo_search_negative_spider") === -1) {
						
						var runNegSearchSpider = checkLastRun(spiderTracker,"negasearchspider",starttime,NEGATIVESPIDERINTERVAL);
						if(!spiderTracker.hasOwnProperty("negasearchspider") || (runNegSearchSpider === true)) {	
							log.debug("negasearchspider",spiderTracker.negasearchspider);
							spiderTracker.negasearchspider = starttime;
							schedulescript("customscript_flo_search_negative_spider", "customdeploy_flo_search_negative_spider") ;
						} 
					}
					

					//Script Deployment 2.0 Negative Spider
					if(queuedScripts.indexOf("customscript_flo_deployment_nega_spider") === -1) {
						var runNegDeploymentSpider = checkLastRun(spiderTracker,"negadeploymentspider",starttime,NEGATIVESPIDERINTERVAL);
						if(!spiderTracker.hasOwnProperty("negadeploymentspider") || (runNegDeploymentSpider === true)) {	
							log.debug("negadeploymentspider",spiderTracker.negadeploymentspider);
							spiderTracker.negadeploymentspider = starttime;
							schedulescript("customscript_flo_deployment_nega_spider", "customdeploy_flo_deployment_nega_spider") ;
						} 
					}

					//Workflow Spider 2.0 Negative Spider.
					if(queuedScripts.indexOf("customscript_flo_workflow_negative_spide") === -1 ) {
						var runNegWFSpider = checkLastRun(spiderTracker,"negaworkflowspider",starttime,NEGATIVESPIDERINTERVAL);
						if(!spiderTracker.hasOwnProperty("negaworkflowspider") || (runNegWFSpider === true)) {	
							log.debug("negaworkflowspider",spiderTracker.negaworkflowspider);
							spiderTracker.negaworkflowspider = starttime;
							schedulescript("customscript_flo_workflow_negative_spide", "customdeploy_flo_workflow_negative_spide") ;
						} 
					}
					
					//User Role Spider 2.0. Negative Spider
					if(queuedScripts.indexOf("customscript_flo_role_negative_spider") === -1) {
						var runNegRoleSpider = checkLastRun(spiderTracker,"negarolespider",starttime,ROLESPIDERINTERVAL);
						if(!spiderTracker.hasOwnProperty("negarolespider") || (runNegRoleSpider === true)) {	
							log.debug("negarolespider",spiderTracker.negarolespider);
							spiderTracker.negarolespider = starttime;
							schedulescript("customscript_flo_role_negative_spider", "customdeploy_flo_role_negative_spider") ;
						} 
					}
					//Standard Record Custom Fields Negative Spider 2.0.
					if( queuedScripts.indexOf("customscript_flo_custom_fld_neg_spider") == -1) {
						var runStdFieldsSpider = checkLastRun(spiderTracker,"stdfieldspider",starttime,CUSTOMFIELDSPIDERINTERVAL)
						if(runStdFieldsSpider) {
							spiderTracker.stdfieldspider = starttime;
							schedulescript("customscript_flo_list_custom_fields", "customdeploy_flo_list_custom_fields") 
						}
					}

					//Custom Record Custom Fields Spider 2.0. Run every 6 hours 
					if(queuedScripts.indexOf("customscript_flo_custrecfields_negspider") == -1 ) {
						var runNegCustomFieldSpider = checkLastRun(spiderTracker,"negacustomfieldspider",starttime,CUSTOMFIELDSPIDERINTERVAL);
						if(!spiderTracker.hasOwnProperty("negacustomfieldspider") || (runNegCustomFieldSpider === true)) {	
							spiderTracker.negacustomfieldspider = starttime;
							schedulescript("customscript_flo_custom_record_fld_list", "customdeploy_flo_custom_record_fld_list") 
						} 
					}

				} catch(e) {
					log.audit("scheduler internal",e)
				}
				
				//update spider tracker
				updatespidertracker(spiderTracker);
			} catch(e) {

				log.audit("scheduler",e)
			}
			
		}
		
		function checkLastRun(spiderTracker,prop,starttime,numhours) {
			
			var onehour=1000*60*60;
			var runscript = false;
			log.debug("checkLastRun",prop);
			log.debug(prop,spiderTracker[prop]);
			if(!spiderTracker.hasOwnProperty(prop)) {
				runscript = true;
			} else if(isNaN(spiderTracker[prop])) {
				runscript = true;
			} else {
				var diffhours = (starttime - spiderTracker[prop])/onehour;
				log.debug(prop,diffhours);
				if(diffhours >= numhours) {
					runscript = true;
				}

			}
			log.debug("runscript",runscript);
			return runscript;
		}

		function updatespidertracker(spiderTracker) {
			try {
				var id = record.submitFields({
				    type: "customrecord_flo_spider_configuration",
				    id: 1,
				    values: {
				        custrecord_flo_spider2_tracker: JSON.stringify(spiderTracker)
				    },
				    options: {
				        enableSourcing: false,
				        ignoreMandatoryFields : true
				    }
				});
			} catch(e) {
				log.debug("updatespidertracker",e);
			}
			
		}
		function schedulescript(scriptId, deploymentId,params) {
			try {
				var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
				scriptTask.scriptId =scriptId;
				scriptTask.deploymentId = deploymentId;
				if(params && params != undefined) {
					scriptTask.params = params;
				}
				var scriptTaskId = scriptTask.submit();
			} catch (e) {
				log.debug("schedulescript",e);
			}
			
		}

		function isWithinTimeWindow(starttime, endtime) {
			
			//Dummy Record to get current timeof day
			var dummyConfig = record.create({type: "customrecord_flo_spider_configuration", isDynamic: true});
			currenttime = dummyConfig.getValue({fieldId: 'custrecord_flo_conf_current_tod'})
			

			var ret = false;

			//Compare by Hour and Minutes because Timezone is a mess.

			if(starttime != null && starttime != "" && endtime != null && endtime != "" && currenttime) {

				log.debug("currenttime",currenttime.getHours() + " : " + currenttime.getMinutes());
				log.debug("starttime",starttime.getHours() + " : " + starttime.getMinutes());
				log.debug("endtime",endtime.getHours() + " : " + endtime.getMinutes());

				if(starttime.getHours() > endtime.getHours()) {
					if(currenttime.getHours() > starttime.getHours()) {	
						ret = true;
					} else if(currenttime.getHours() == starttime.getHours() && currenttime.getMinutes() >= starttime.getMinutes()) {
						ret = true;
					} else if(currenttime.getHours() < endtime.getHours() ) {
						ret = true;
					} else if(currenttime.getHours() == endtime.getHours() && currenttime.getMinutes() < endtime.getMinutes()) {
						ret = true;
					}
				} else if(currenttime.getHours() >= starttime.getHours() && currenttime.getHours() <= endtime.getHours()) {
					
					if(currenttime.getHours() == starttime.getHours() && currenttime.getHours() == endtime.getHours()) {
						if(currenttime.getMinutes() >= starttime.getMinutes() && currenttime.getMinutes() < endtime.getMinutes()) {
							ret = true;
						}
					} else if(currenttime.getHours() == starttime.getHours()) {
						if(currenttime.getMinutes() >= starttime.getMinutes()) {
							ret = true;
						}
					} else if(currenttime.getHours() == endtime.getHours()) {
						if(currenttime.getMinutes() < endtime.getMinutes()) {
							ret = true;
						} 
					} else {
						ret = true;
					}
					
				}
			} else {
				ret = true;	
			}
			
			return ret;
		}


		function getDateTime(timeparam) {
			var userObj = runtime.getCurrentUser();
			var d = new Date();
			timeFormat = userObj.getPreference({name: "TIMEFORMAT"});

			var time = format.format({
                value: timeparam,
                type: format.Type.TIMEOFDAY
            });

            //log.debug("time",time);

			
			if ( (timeFormat == "fmHH:fmMI am") || (timeFormat == "fmHH-fmMI am") ) {
				// separate am/pm sign
				var timeFieldValue = time.split(" ");
				// choose split sign
				if (timeFormat == "fmHH:fmMI am") {splitSign = ":";} else {splitSign = "-";}
				// split hours and minutes
				var timeArray = timeFieldValue[0].split(splitSign);
				var hour = parseInt(timeArray[0]);
				var minute = parseInt(timeArray[1]);
				if(hour == 12) hour = 0;
				
				if(timeFieldValue[1] == "pm") {
					hour += 12;
				}

				log.debug("hour",hour + " " + minute);

				d.setHours(hour);
				d.setMinutes(minute);
				d.setSeconds(0);
				  
			}else{
				// 24 hours time format (no am/pm)
				//choose split sign
				if (timeFormat == "fmHH24:fmMI") {splitSign = ":";} else {splitSign = "-";}
				// split hours and minutes
				var timeArray = time.split(splitSign);
				
				d.setHours(parseInt(timeArray[0]));
				d.setMinutes(parseInt(timeArray[1]));

				log.debug("hour",timeArray[0] + " " + timeArray[1]);

				d.setSeconds(0);
			}


			

			return d;
		}

		return {
		     onAction: onAction
		}
	}
);