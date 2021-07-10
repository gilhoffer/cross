/**
 *@NApiVersion 2.x
 *@NScriptType scheduledscript
 *
 * Inactivates customization records of inactive or deleted standard record custom fields.
*/
define(['N/runtime','N/record','N/task','N/file','N/search'],
function(runtime,record,task,file,search)
{
	var MAXFILESIZE = 10485760;

	/**
	* Main function
	*/
	function execute(context) {

		log.audit("FLO Start");
		var maxTime = 600000; // 10mins
		var minUsage = 1000;
		var starttime = new Date().getTime();
		var script = runtime.getCurrentScript();
		var lastFileIndex =  script.getParameter({name: "custscript_flo_neg_file_last_index"}) || 0;
		log.audit("lastFileIndex",lastFileIndex);

		//++ NS-584
		// Check Time Window set in the config record.
        try {
            var startTimeRange = null; 
            var endTimeRange = null; 

            var spiderConfig = record.load({
                type: 'customrecord_flo_spider_configuration',
                id: 1
            });
            if (spiderConfig != null) {
                var configFrom = spiderConfig.getValue({fieldId: 'custrecord_flo_script_start_time'});
                var configTo = spiderConfig.getValue({fieldId:'custrecord_flo_script_end_time'});

                if(configFrom && configTo) {
                    startTimeRange = configFrom;
                    endTimeRange = configTo
                }
            }
            if(endTimeRange && startTimeRange && !isWithinTimeWindow(startTimeRange,endTimeRange)) {
                log.audit("current time out of time range.");
                return;
            }

        } catch(e){
            log.debug("time range.",e)
        }
        //-- NS-584

		// Search for spider files
		var filenameprefix = runtime.accountId + '-';
	    var fieldSpiderFileSearch = search.create({
	    	type: search.Type.FOLDER,
	    	filters: [["name","is","Field Spider Files"],"AND",["isinactive","is","F"], 'AND',["internalidnumber","greaterthanorequalto",lastFileIndex], 'AND', ['file.name','startswith',filenameprefix]],
	    	columns: [{name:"internalid",join:"file",sort:"ASC"},{name:"name",join:"file"},{name:"created",join:"file"}]
	    });

		// Parse through the spider files
		var sFiles = fieldSpiderFileSearch.run().getRange(0,1000);
	    for (var i = 0; i < sFiles.length; i++) {
			try {

	    		var fId = sFiles[i].getValue(fieldSpiderFileSearch.columns[0]);
	    		if (fId === null)
	    			continue;

	    		//Check Reschedule
				if (script.getRemainingUsage() < minUsage || new Date().getTime() - starttime > maxTime) {
					rescheduleJob(fId, 0);
					return;
				}

	    		var fName = sFiles[i].getValue(fieldSpiderFileSearch.columns[1]);

		    	log.debug("JSON",JSON.stringify(sFiles[i]));
		    	log.debug("internalid",fId);
		    	log.debug("name",fName);

				// Load the spider file
				var sFile = file.load(fId);
				if (sFile.size < MAXFILESIZE) {
					// Get the file type
		    		var fType = fName.replace(filenameprefix,'').split("\.")[0];
		    		log.debug("fType",fType);

					var custTypeIds = [];
					switch (fType) {
						case "entitycustomfield":
							custTypeIds.push(3);
							break;
						case "itemcustomfield":
							custTypeIds.push(26);
							break
						case "crmcustomfield":
							custTypeIds.push(25);
							break
						case "transactionbodycustomfield":
							custTypeIds.push(5);
							break
						case "transactioncolumncustomfield":
							custTypeIds.push(4);
							custTypeIds.push(28);
							break
						case "itemnumbercustomfield":
							custTypeIds.push(29);
							break
						default:
							// Other field type
							custTypeIds.push(27);
							break;

					}

					// Get content of files
					var fContents = sFile.getContents().split("\n");
					log.debug("fContents",JSON.stringify(fContents));


					var lastCustIndex =  script.getParameter({name: "custscript_flo_neglast_cust_index"}) || 0;

					// Search for all FLO Customizations where inactive = F and custrecord_flo_cust_type = the field type, exclude prototype customization
					var floCustomizationRecords = search.create({
						type : 'customrecord_flo_customization',
						columns : [ 'custrecord_flo_int_id','isinactive', 'custrecord_flo_cust_type', 'internalid' ],
						filters : [ ['custrecord_flo_cust_type', 'anyof', custTypeIds],'AND',['isinactive', 'is', 'F'],'AND',['name','doesnotstartwith','prototype customization'],'AND',['internalidnumber','greaterthanorequalto',lastCustIndex]]
					});

					log.debug('Custom Field Type', custTypeIds.toString());

					// Parse through FLO Customization Record search result
					var sFloCustRecords = floCustomizationRecords.run().getRange(0,1000);
					for (var j = 0; j < sFloCustRecords.length; j++) {
						var custRecordFloIntId = sFloCustRecords[j].getValue({ name: 'custrecord_flo_int_id' });

						//Check Reschedule
						if (script.getRemainingUsage() < minUsage || new Date().getTime() - starttime > maxTime) {
							rescheduleJob(fId, custRecordFloIntId);
							return;
						}
						log.debug("custRecordFloIntId", custRecordFloIntId);
						log.debug("internalid", sFloCustRecords[j].getValue({ name: 'internalid' }));

						// Check if search record is on the list
						if(fContents.indexOf(custRecordFloIntId) > -1) {
							// Search record exists in the lilst. Do nothing.
						} else {

							try {
								// Try to load the Field record
							    var thisFld = record.load({ type: fType, id: custRecordFloIntId });
							    var inActive = thisFld.getValue({fieldId: 'inactive'});
							    if(fType == 'othercustomfield') {
							    	 var rectype = thisFld.getValue({fieldId: 'rectype'});
							    	 if(rectype && parseInt(rectype) > 0) {
							    	 	inActive = true;
							    	 }
							    }
							   
							    
							    log.debug('inactive',inActive);
							    if (inActive == true) {
									// Unable to load Field record. Set FLO Customization record to Inactive.
									var internalId = sFloCustRecords[j].getValue({ name: 'internalid' });

									/** -- NS-1205: Flashlight have no change management feature. No change log required.
									var logRecord = record.create({ type: 'customrecord_flo_change_log', isDynamic: true });
			                        logRecord.setValue({ fieldId:'custrecord_flo_customization_record', value: internalId });
			                        logRecord.setValue({ fieldId:'custrecord_flo_field_name', value: 'Deleted' });
			                        if (sFloCustRecords[j].getText({ name: 'custrecord_flo_cust_type' })) {
										var chOverview = sFloCustRecords[j].getText({ name: 'custrecord_flo_cust_type' }) + " Deleted/Inactivated.";
			                        	logRecord.setValue({ fieldId:'custrecord_flo_change_overview', value: chOverview });
			                        }
			                        logRecord.setValue({ fieldId:'custrecord_flo_field_script_id', value: 'isinactive' });
			                        logRecord.setValue({ fieldId:'custrecord_flo_field_new_value', value: true });
			                        logRecord.setValue({ fieldId:'custrecord_flo_operation', value: 'delete' });
			                        logRecord.setValue({ fieldId:'custrecord_flo_old_value', value: false});
			                        var logId = logRecord.save({ ignoreMandatoryFields: true });
									log.debug('logId created',logId);
									*/

									var floCustomRecord = record.load({ type: 'customrecord_flo_customization', id: internalId });
									// Deactiate FLO Customization
									floCustomRecord.setValue({ fieldId:'isinactive', value: true });
									// Save, ignoring mandatory fields
									internalId = floCustomRecord.save({ ignoreMandatoryFields: true });

									log.debug("Deactivated FLO Customization Record ID", internalId);
							    }

							} catch (e) {
								// Unable to load Field record. Set FLO Customization record to Inactive.
								var internalId = sFloCustRecords[j].getValue({ name: 'internalid' });

								/** -- NS-1205: Flashlight have no change management feature. No change log required.
								var logRecord = record.create({ type: 'customrecord_flo_change_log', isDynamic: true });
		                        logRecord.setValue({ fieldId:'custrecord_flo_customization_record', value: internalId });
		                        logRecord.setValue({ fieldId:'custrecord_flo_field_name', value: 'Deleted' });
		                        if (sFloCustRecords[j].getText({ name: 'custrecord_flo_cust_type' })) {
									var chOverview = sFloCustRecords[j].getText({ name: 'custrecord_flo_cust_type' }) + " Deleted/Inactivated.";
		                        	logRecord.setValue({ fieldId:'custrecord_flo_change_overview', value: chOverview });
		                        }
		                        logRecord.setValue({ fieldId:'custrecord_flo_field_script_id', value: 'isinactive' });
		                        logRecord.setValue({ fieldId:'custrecord_flo_field_new_value', value: true });
		                        logRecord.setValue({ fieldId:'custrecord_flo_operation', value: 'delete' });
		                        logRecord.setValue({ fieldId:'custrecord_flo_old_value', value: false});
		                        var logId = logRecord.save({ ignoreMandatoryFields: true });
								log.debug('logId created',logId);
								*/

		                        /*
		                        //Run review log WF
		                        var workflowTask = task.create({taskType: task.TaskType.WORKFLOW_TRIGGER});
		                        workflowTask.recordType = 'customrecord_flo_change_log';
		                        workflowTask.recordId = logId;
		                        workflowTask.workflowId = 'customworkflow_flo_review_change_log_wf';
		                        var wftaskId = workflowTask.submit();
		                        */

								var floCustomRecord = record.load({ type: 'customrecord_flo_customization', id: internalId });
								// Deactiate FLO Customization
								floCustomRecord.setValue({ fieldId:'isinactive', value: true });
								// Save, ignoring mandatory fields
								internalId = floCustomRecord.save({ ignoreMandatoryFields: true });

								log.debug("Deactivated FLO Customization Record ID", internalId);
							}
						}
					}

					
			    } else {
			    	log.audit("File size greater than 10mb",fName);
			    }
			} catch (e) {
	    		log.audit("E",e);
		    }
		}
		/** -- NS-1205: No Field spider 2.0 in Flashlight 
		//Call the Standard Record Custom Field Spider
		try {
	    	//schedule the spider
			var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
			scriptTask.scriptId = "customscript_flo_field_spider_std_rec";
			scriptTask.deploymentId = "customdeploy_flo_field_spider_std_rec";
			var scriptTaskId = scriptTask.submit();
			log.audit("Spider Scheduled",scriptTaskId);
		} catch(e) {
			log.audit('E2',e);
		}
		*/

		log.audit("FLO End");
	}

	return {
		execute: execute
	}
	//-- END execute

	/**
	* Creates new task and reschedule the job
	*/
	function rescheduleJob(lastfileId, lastcustId){
	    var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
	    scheduledScriptTask.scriptId = runtime.getCurrentScript().id;
	    scheduledScriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
	    scheduledScriptTask.params = { custscript_flo_neg_file_last_index : lastfileId, custscript_flo_neglast_cust_index: lastcustId}; // set the last index
	    var taskId = scheduledScriptTask.submit();
		log.audit("Rescheduling... "+lastfileId+" -- "+lastcustId);
	}
	//-- END rescheduleJob

	/**
	* Checks whether the current time is within the time window set in config record
	*/
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
    //-- END isWithinTimeWindow

}
);
