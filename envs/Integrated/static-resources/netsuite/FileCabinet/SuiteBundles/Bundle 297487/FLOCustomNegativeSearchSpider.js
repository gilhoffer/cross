/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *
 * Inactivates customization record for deleted searches
 */
define(['N/runtime','N/config','N/record','N/search','N/task'],
    function(runtime,config,record,search,task){
    	
		//FLOCustomNegativeSearchSpider
		var SEARCH=8; // workflow
		var MIN_USAGE=500;  // min usage per scheduled script
		var MAXTIME=600000;  // max time for a scheduled script to run, 10mins
        var maxLoop=1000;
        
        /**
        * Main function
        */
		function execute(context)
		{
			try {
            	log.audit('START RUN');
			
				var starttime  = new Date().getTime();	
		    	var ctr = 1;
				var scriptObj = runtime.getCurrentScript();
     			var lastIndex = scriptObj.getParameter({name: 'custscript_flo_negative_src_lastindex'});
 				if (lastIndex==null)
 				 	lastIndex=1;
				log.debug('lastIndex:' +lastIndex);

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

				// start main logic
                var activeSearch=[];
                getSearchArray(activeSearch,0);
                log.debug("activeSearch",activeSearch.length);
                getCustomFloRecords(activeSearch,lastIndex,starttime);
                // end main logic

            	log.audit('END RUN');
        	}catch(e){
				log.debug("error",e);
			}          
		}
		return {
		    execute: execute
		};
        //-- END execute

        /**
        * Gets all search customizations and inactivates them when they are not on the list of active searches
        */
		function getCustomFloRecords(activeRecords, lastIndex, starttime){
            var internalidColumn = search.createColumn({ name: 'internalid', sort: search.Sort.ASC });
            var customrecord_flo_customization_record = search.create({
                type : 'customrecord_flo_customization',
                columns : [ internalidColumn , 'custrecord_flo_int_id','isinactive', 'custrecord_flo_cust_type' ],
                filters : [ ['custrecord_flo_cust_type', 'anyof', SEARCH],'AND',['isinactive', 'is', 'F'],'AND', ['name','doesnotstartwith','prototype customization'],'AND',['internalidnumber', 'greaterthan', lastIndex ]]
            });

            var searchResult = customrecord_flo_customization_record.run().getRange({ start: 0, end: maxLoop });
            if (searchResult.length > 0) {
                for (var i = 0; i < searchResult.length; i++) {
                    var internalId = searchResult[i].getValue({ name: 'internalid' })
                    var searchId = searchResult[i].getValue({ name: 'custrecord_flo_int_id' });

                    if (activeRecords.indexOf(searchId)==-1 || !searchId || (searchId && searchId=='')) {
                        /** -- NS-1205: Flashlight have no change management feature. No change log required.
                        var logRecord = record.create({ type: 'customrecord_flo_change_log', isDynamic: true });
                        logRecord.setValue({ fieldId:'custrecord_flo_customization_record', value: internalId });
                        logRecord.setValue({ fieldId:'custrecord_flo_field_name', value: 'Deleted' });
                        if (searchResult[i].getText({ name: 'custrecord_flo_cust_type' })) {
                            var chOverview = searchResult[i].getText({ name: 'custrecord_flo_cust_type' }) + " Deleted/Inactivated.";
                            logRecord.setValue({ fieldId:'custrecord_flo_change_overview', value: chOverview });
                        }
                        logRecord.setValue({ fieldId:'custrecord_flo_field_script_id', value: 'isinactive' });
                        logRecord.setValue({ fieldId:'custrecord_flo_field_new_value', value: true });
                        logRecord.setValue({ fieldId:'custrecord_flo_operation', value: 'delete' });
                        logRecord.setValue({ fieldId:'custrecord_flo_old_value', value: false});
                        var logId = logRecord.save({ ignoreMandatoryFields: true });
                        log.debug('logId created',logId);
                        */
                       
                        //Run review log WF
                        /*
                        var workflowTask = task.create({taskType: task.TaskType.WORKFLOW_TRIGGER});
                        workflowTask.recordType = 'customrecord_flo_change_log';
                        workflowTask.recordId = logId;
                        workflowTask.workflowId = 'customworkflow_flo_review_change_log_wf';
                        var wftaskId = workflowTask.submit();
                        */

                        var floCustomRecord = record.load({ type: 'customrecord_flo_customization', id: internalId });
                        floCustomRecord.setValue({ fieldId:'isinactive', value: true }); // no longer active
                        internalId = floCustomRecord.save({ ignoreMandatoryFields: true }); // ignore any mandatory*/
                        log.debug(internalId,searchId+' no longer exist');
                    }
                    if (isJobTobeRescheduled(starttime,i)) {
                        rescheduleJob(internalId); //reschedule
                        return;
                    }
                }
                log.debug('Moving to next set', internalId);
                getCustomFloRecords(activeRecords, internalId,starttime);

            }
        }
        //-- END getCustomFloRecords

         /**
        * Retrieves all searches in the account
        */
		function getSearchArray(activeRecords,lastInternalId){
            var internalidColumn = search.createColumn({ name: 'internalid', sort: search.Sort.ASC });
            var searchObj = search.create({
                type : 'SavedSearch',
                columns : [  internalidColumn ],
                filters : [['isinactive', 'is', 'F'],'AND', ['internalidnumber', 'greaterthan', lastInternalId ]]
            });

            // loop the search resuts
            var searchResult = searchObj.run().getRange({ start: 0, end: maxLoop });
            if (searchResult.length > 0) {
                var lastId;
                for (var i = 0; i < searchResult.length; i++) {
                    activeRecords.push(searchResult[i].getValue({name: 'internalid'}));
                    lastId = searchResult[i].getValue({name: 'internalid'});
                }
                getSearchArray(activeRecords,lastId);
            }
		}
        //-- END getSearchArray

		/** 
        * Checks if the job is to be rescheduled
        */
		function isJobTobeRescheduled(starttime,ctr){
			var reschedule=false;
			// testing only			
			/*if (ctr >0 && ctr % 25 == 0){
				reschedule=true;
			 	log.audit('isJobTobeRescheduled modulo 25');
			}else { */
                var runningTime = (new Date().getTime() - starttime);
                if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE) {
                    reschedule = true;
                    log.audit('isJobTobeRescheduled RemainingUsage: ' + runtime.getCurrentScript().getRemainingUsage());
                } else if (runningTime > MAXTIME) {
                    reschedule = true;
                    log.audit('isJobTobeRescheduled runningTime: ' + runningTime);
                }
            //}
			return reschedule;
		}
        //-- END isJobTobeRescheduled

		/**
        * Creates new task and reschedule the job
        */
		function rescheduleJob(internalId){
		    var scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
		    scheduledScriptTask.scriptId = runtime.getCurrentScript().id;
		    scheduledScriptTask.deploymentId = runtime.getCurrentScript().deploymentId;
		    scheduledScriptTask.params = { custscript_flo_negative_src_lastindex : internalId }; // set the last index
		    var taskId = scheduledScriptTask.submit();
			log.audit("Rescheduling... "+internalId);
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