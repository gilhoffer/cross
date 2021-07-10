/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *
 * Scheduled spider for Saved Searches
 */
define(['N/runtime','N/search','N/record','N/task','N/format','N/crypto'],
    function(runtime,search,record,task,format,crypto)
    {

    	/**
		* Main function
		*/
    	function execute(context)
		{
			try {
				log.debug('FLO Start');
				var maxTime = 600000; // 10mins
				var minUsage = 1000;
				var batchsize = 1000;
				var starttime = new Date().getTime();
				var one_day=1000*60*60*24;
				var script = runtime.getCurrentScript();
				var defaultUser = "";

				var lastId = script.getParameter({name: "custscript_searchspider_lastid"}) || -1;

				//++ NS-584
				// Check Time Window set in the config record.
				try {
					var startTimeRange = null; //script.getParameter({name: "custscript_flo_search_2_0_start_time"});
					var endTimeRange = null; //script.getParameter({name: "custscript_flo_search_2_0_end_time"});

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
						log.audit("current time out of time range.")
						return;
					}

				} catch(e){

				}
				//-- NS-584

				//NS-2149
				var fromInitSpider = script.getParameter({name: 'custscript_flo_isinitialspider_search'}) || false;
				log.debug('fromInitSpider',fromInitSpider);

				log.debug("lastId",lastId);
				var searchesSearch = search.load({type:search.Type.SAVED_SEARCH,id:"customsearch_flo_active_searches"});
				//Get active searches
				if (lastId != null && lastId > -1) {
					log.debug("inside lastId",lastId);
				 	searchesSearch.filters.push(search.createFilter({
					    name: 'internalidnumber',
					    operator: search.Operator.GREATERTHANOREQUALTO,
					    values: lastId }));
				} else {
					updateSpiderCount(searchesSearch,8);
				}

				log.debug('searchesSearch',JSON.stringify(searchesSearch));


				//Spider 1k searches at a time
				var reschedSize = batchsize - 1;
				var searchRes = searchesSearch.run();
				var searchesFound = searchRes.getRange({start:0,end:batchsize});
				if (searchesFound != null) {
					var searchesLen = searchesFound.length;
					log.debug('Search Length',searchesLen);

					for (var i = 0; i < searchesLen && searchesFound[i] != null; i++) {

						var sRec  = searchesFound[i];
						var sId = sRec.getValue({name:"internalid"});
						var lastMod = sRec.getValue({name:"datemodified"});
						var haschanged = false;
						var lastModObj = null;
						if(lastMod) {
							lastModObj = format.parse({
				                value: lastMod,
				                type: format.Type.DATE
				            });
				            try {
				            	var dayschanged = starttime - lastModObj.getTime();
					            if(dayschanged != 0) {
					            	dayschanged = dayschanged/one_day;
					            }
					            if(dayschanged < 2) {
					            	haschanged = true;
					            }
				            } catch(e) {

				            }
						}

						var sRecColumns = sRec.columns;
						var lastRunOnColumn = sRecColumns[5];

						log.debug('lastRunOn', sRec.getValue(lastRunOnColumn));
						//log.debug('lastRunOnDateParsed', format.parse({value: sRec.getValue(lastRunOnColumn), type: format.Type.DATE}));

						//NS-1353 This is a useless checking. Last Run is checked against the customization dlu below.
						/*var lastRunDate = sRec.getValue(lastRunOnColumn) != null && sRec.getValue(lastRunOnColumn).trim() != '' ? format.parse({value: sRec.getValue(lastRunOnColumn), type: format.Type.DATE}) : null;
						log.debug('lastRunDate', lastRunDate);
						if(haschanged == false) {
							if(lastRunDate !== null) {
								var daysRan = starttime - lastRunDate.getTime();
								if(daysRan !== 0) {
									daysRan = daysRan / one_day;
								}
								if(daysRan < 2) {
									haschanged = true;
								}
							}
							else {
								haschanged = true;
							}
						}*/

						log.debug('sRec',JSON.stringify(sRec));

						try {
							//Check running state / resched
							if (i == reschedSize ||
								script.getRemainingUsage() < minUsage ||
								new Date().getTime() - starttime > maxTime) {
								var scriptTask = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT});
								scriptTask.scriptId = script.id;
								scriptTask.deploymentId = script.deploymentId;
								//++ NS-2149
								var thisParams = {custscript_searchspider_lastid: sId, custscript_flo_isinitialspider_search: "F"};
								if (fromInitSpider)
									thisParams.custscript_flo_isinitialspider_search = "T";
								scriptTask.params = thisParams;
								//scriptTask.params = {custscript_searchspider_lastid: sId};
								//-- NS-2149
								log.debug('scriptTask',JSON.stringify(scriptTask));
								var scriptTaskId = scriptTask.submit();
								log.audit('Reschedule',scriptTaskId+','+i+','+script.getRemainingUsage()+','+(new Date().getTime() - starttime)+','+sId);
								break;
							} else {
								var sObj = {};
								sObj.name = sRec.getValue({name:"title"});
								sObj.custrecord_flo_cust_type = 8; //Search
								sObj.custrecord_flo_int_id = sId;
								sObj.custrecord_flo_cust_id = sRec.getValue({name:"id"});

								sObj.owner = sRec.getValue(searchesSearch.columns[8]);
								log.debug("sObj here",JSON.stringify(sObj));
								if (checkInactive(sObj.owner,"Employee")) {
									if (defaultUser == "") {
										defaultUser = getDefaultUser();
									}
									sObj.owner = defaultUser;
								}

								sObj.custrecord_flo_bundle = sRec.getValue({name:"frombundle"}) || "&nbsp;";
								sObj.custrecord_flo_dls = sRec.getValue(lastRunOnColumn) != null && sRec.getValue(lastRunOnColumn).trim() != '' ? format.parse({value: sRec.getValue(lastRunOnColumn), type: format.Type.DATE}) : format.parse({value: new Date('12/31/1969'), type: format.Type.DATE});
								log.debug('sObj.custrecord_flo_dls', sObj.custrecord_flo_dls);
								if (util.isDate(sObj.custrecord_flo_dls))
									log.debug('Converted to Date',sObj.custrecord_flo_dls);
								else {
									log.debug('Not Date',sObj.custrecord_flo_dls);
									sObj.custrecord_flo_dls = format.parse({value: new Date(sObj.custrecord_flo_dls), type: format.Type.DATE});
									log.debug('Converted to Date',sObj.custrecord_flo_dls);
								}

								sObj.custrecord_flo_employees_cust = sRec.getValue({name:"lastrunby"});
								if(checkInactive(sObj.custrecord_flo_employees_cust,'Employee')) {
									sObj.custrecord_flo_employees_cust = "";
								}
								sObj.custrecord_flo_data_type = sRec.getValue({name:"recordtype"});

								var sSchedule = sRec.getValue(searchesSearch.columns[9]) == false ? "No" : "Yes";
								var sAccess = sRec.getValue(searchesSearch.columns[10]) == false ? "Private" : "Public";
								var sType = sObj.custrecord_flo_data_type;
								var sRecType = " ";


								log.debug('sObj',JSON.stringify(sObj));


								//search_fields / Search Fields (Raw)
								//search_fields_view / Search Fields View
								//search_filters / Search Filters
								//search_formulas / Search Formulas
								sObj.custrecord_flo_search_fields = '';
								sObj.custrecord_flo_search_fields_view = '';
								sObj.custrecord_flo_search_filters = '';
								sObj.custrecord_flo_search_formulas = '';

								var thisSearch = null;
								try {
									thisSearch = search.load({type:sObj.custrecord_flo_data_type.replace(/\s/g,''),id:sObj.custrecord_flo_int_id});
								} catch (e) {
									log.debug('Invalid type',JSON.stringify(sObj));
									try {
										thisSearch = search.load({id:sObj.custrecord_flo_int_id});
									} catch (e2) {
										log.debug('Unable to load search via id',JSON.stringify(sObj));
									}
								}

								if (thisSearch) {
									log.debug("Search Load", JSON.stringify(thisSearch));

									if(thisSearch.searchType != null && thisSearch.searchType.indexOf("customrecord_") == 0) {
										sType = "Custom";
										sObj.custrecord_flo_data_type = sType;
										sRecType = sObj.custrecord_flo_data_type;
									}
									//search_cust_rec / Custom Record ID
									sObj.custrecord_flo_search_cust_rec = thisSearch.searchType != null ? thisSearch.searchType.toLowerCase() : '';

									var sFieldsAndFormula = {fields:[],formula:[]};
									var sFields = [];
									var sFormula = [];
									//Get filters like how api1.0 does it
									if(thisSearch.filters) {
										filterArray=[];
										fs=thisSearch.filters;
										log.debug("fs",JSON.stringify(fs));
										for(f=0;fs[f]!=null;f++) {
											try {
												var filterrow = JSON.parse(JSON.stringify(fs[f]));
												/*if(filterrow['values'] && filterrow['values'][0] && !filterrow['values'][1]) {
													filterrow['values'][1] ="null";
												}*/
												log.debug("filterrow",filterrow)
												thisFilter=filterrow.name + ', ' + ( filterrow['join'] || "null" ) + ', ' + filterrow.operator + ', [' + filterrow['values'].join(", ")+ ']';
												if(filterrow.summarytype) {
													thisFilter += ", summary=" + filterrow.summarytype;
												}

												if(filterrow.formula) {
													thisFilter += ", formula=" + filterrow.formula;
												}

												if(filterrow.isor) {
													thisFilter += ", OR";
												}

												if(filterrow.isnot) {
													thisFilter += ", NOT";
												}

												if(filterrow.leftparens != 0) {
													thisFilter += ", leftparens="+filterrow.leftparens;
												}

												if(filterrow.rightparens != 0) {
													thisFilter += ", rightparens="+filterrow.rightparens;
												}


												if(f!=0){thisFilter="\n"+thisFilter;}
												filterArray.push(thisFilter);

												//parse fields
												var fieldname = filterrow.name;
												if(sFields.indexOf(fieldname) == -1) {
													if(fieldname.indexOf("formula") == 0) {
														if(filterrow.formula) {
															parseFieldFromFormula(filterrow.formula,sFields);
														}
													} else {
														sFields.push(fieldname);
													}
												}
											} catch(e) {
												log.debug('e',e);
											}

										}
										sObj.custrecord_flo_search_filters = filterArray.join();
									}

									log.debug('thisSearch.columns',JSON.stringify(thisSearch.columns));
									if (thisSearch.columns) {
										//parse fields and formula from columns
										var cols = thisSearch.columns;
										for (var ii = 0; ii < cols.length && cols[ii] != null ; ii++) {
											if (cols[ii].name && cols[ii].name.indexOf("formula") == 0) {
												if(cols[ii].formula) {
													sFormula.push(cols[ii].formula);
													parseFieldFromFormula(cols[ii].formula,sFields);
												}
											} else {
												if (cols[ii].name != null &&
													sFields.indexOf(cols[ii].name) < 0) {
													sFields.push(cols[ii].name);
												}
											}
										}
									}


									var rFields = [];
									try{
										var thisSearchSearch = search.create({
										    type: search.Type.SAVED_SEARCH,
										    columns: [
										    	{name: 'result'}, 
										    	{name: 'returnfield'}
										    ],
										    filters: [search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: sObj.custrecord_flo_int_id })]
										});

										var thisSearchResult = thisSearchSearch.run().getRange(0, 1000);
										log.debug('thisSearchResult', JSON.stringify(thisSearchResult));
										if(thisSearchResult) {
											for(var j = 0; j < thisSearchResult.length; j++) {
												var returnField = thisSearchResult[j].getValue({name: 'returnfield'});
												var resultField = thisSearchResult[j].getValue({name: 'result'});
												if(returnField) {
													rFields.push(returnField);
												}
											}
										}	
									}
									catch(e) {
										log.debug('ERROR', e);
									}
									
									log.debug('rFields', JSON.stringify(rFields));
									sObj.custrecord_flo_search_fields_names = rFields.length > 0 ? rFields.join(',') : '';	
									
									if (sFormula.length > 0)
										sObj.custrecord_flo_search_formulas = sFormula.join(',');

									if (sFields.length > 0) {
										sObj.custrecord_flo_search_fields = sFields.join(',');
										sObj.custrecord_flo_search_fields_view = sFields.join('\n');
										if(sObj.custrecord_flo_search_fields_view) {
											sObj.custrecord_flo_search_fields_view = sObj.custrecord_flo_search_fields_view.substring(0,2999)
										}
									}

								} else {
									log.debug("Unable to Load");
									//sObj.custrecord_flo_autospider_found = false;
								}
								//++ NS-369
								var searchObj = thisSearch;
								var searchTitle = sRec.getValue({name:"title"});
								var searchAccess = sRec.getValue(searchesSearch.columns[10]);
								if(!searchObj) {
									searchObj = {title:searchTitle, scriptId: sObj.custrecord_flo_cust_id, type: sRecType, isPublic: searchAccess}
								}
								var cleanJSON = getObjectJSONString(searchObj,searchTitle,sSchedule,sObj.custrecord_flo_search_fields_names);
								var hashString = "";
								if(cleanJSON) {
									var hashObj = crypto.createHash({
									    algorithm: crypto.HashAlg.SHA1
									});
									hashObj.update({
						                input: cleanJSON
						            });

						            hashString = hashObj.digest();


								}
								//-- NS-369


								//++ NS-640
								//sObj.custrecord_flo_customization = "Edit_|_Results:Edit,Internal_ID:"+sId+",Name:"+formatcuststring(sRec.getValue({name:"title"}))+",From_Bundle:"+formatcuststring(sObj.custrecord_flo_bundle)+",ID:"+sObj.custrecord_flo_cust_id+",Search_Form:Search Form,Type:"+ sType +",Record_Type:" + sRecType + ",Owner:"+formatcuststring(sRec.getValue({name:"owner"}))+",Access:"+ sAccess +",Export_Results:Export (CSV),Persist_Results:Persist (CSV),Scheduled:"+ sSchedule +",Last_Run_By:"+formatcuststring(sRec.getText({name:"lastrunby"}))+",Last_Run_On:"+formatcuststring(sRec.getValue({name:"lastrunon"}))+",Internal_Id:"+sId;
								var thisLastRunOn = sRec.getValue(lastRunOnColumn);
								log.debug('thisLastRunOn', thisLastRunOn);
								if (thisLastRunOn) {
									log.debug('thisLastRunOn Date Format', format.parse({value: thisLastRunOn,type: format.Type.DATE}));
									try {
										thisLastRunOn = format.parse({value: thisLastRunOn,type: format.Type.DATE}).getTime();
									} catch(eLRO) {
										log.debug("eLRO", eLRO);
										thisLastRunOn = "";
									}
								}
								log.debug('thisLastRunOn Timestamp', thisLastRunOn);
								sObj.custrecord_flo_customization = "Edit_|_Results:Edit,Internal_ID:"+sId+",Name:"+formatcuststring(sRec.getValue({name:"title"}))+",From_Bundle:"+formatcuststring(sObj.custrecord_flo_bundle)+",ID:"+sObj.custrecord_flo_cust_id+",Search_Form:Search Form,Type:"+ sType +",Record_Type:" + sRecType + ",Owner:"+formatcuststring(sRec.getValue({name:"owner"}))+",Access:"+ sAccess +",Export_Results:Export (CSV),Persist_Results:Persist (CSV),Scheduled:"+ sSchedule +",Last_Run_By:"+formatcuststring(sRec.getText({name:"lastrunby"}))+",Last_Run_On:"+thisLastRunOn+",Internal_Id:"+sId;
								//-- NS-640

								log.debug("sObj now",JSON.stringify(sObj));

								//check if flo customization exists
								//if exists
									//compare json for changes
										//if there's change
											//update
										//if none, skip
								//if it doesnt exist
									//create
								var dateLastUsedColumn = search.createColumn({
								   name: "formulatext",
								   formula: "TO_CHAR({custrecord_flo_dls}, 'MM/DD/YYYY HH:MI am')"
								});

								var sortByInactive = search.createColumn({
								   name: "formulatext",
								   //formula: "CASE WHEN {isinactive}='T' THEN CONCAT('b',{internalid}) ELSE CONCAT('a',{internalid}) END",
								   formula: "CASE WHEN {isinactive}='T' THEN 'b' ELSE 'a' END",
								   sort: search.Sort.ASC
								});
								var sortByIntId = search.createColumn({name:"internalid",sort:search.Sort.ASC});
								var custSearch = search.create({
					                type : "customrecord_flo_customization",
					            	filters: [[["custrecord_flo_int_id","equalto",sObj.custrecord_flo_int_id], 'OR',['custrecord_flo_cust_id','is',sObj.custrecord_flo_cust_id]],"AND",["custrecord_flo_cust_type", "is", 8]],
					            	columns : ["internalid","name","custrecord_flo_record_json","custrecord_flo_employees_cust","custrecord_flo_search_fields_names","isinactive","custrecord_flo_object_json","custrecord_flo_dls",dateLastUsedColumn,sortByInactive,sortByIntId]
					            	});
								var cust = custSearch.run().getRange({start:0,end:1});
								var custRec = null;

								if (cust != null && cust[0] != null) {		

									log.debug('cust', JSON.stringify(cust[0]));
									//var custrecordFloDls = cust[0].getValue(cust[0].columns[8]) || '';	
									var custrecordFloDls = cust[0].getValue('custrecord_flo_dls') || '';	
									if(custrecordFloDls){
										custrecordFloDls = format.parse({value: custrecordFloDls,type: format.Type.DATE});
										try {
											custrecordFloDls.setSeconds(0);
											custrecordFloDls.setMinutes(0);		
											custrecordFloDls.setHours(0);
											custrecordFloDls = custrecordFloDls.getTime();
										} catch(e){

										}
									}

									log.debug('custrecordFloDls', custrecordFloDls);

									var lastRunOnDate = sRec.getValue(lastRunOnColumn) || '';
									if(sObj.custrecord_flo_dls) {
										try {
											lastRunOnDate = sObj.custrecord_flo_dls;
											lastRunOnDate.setSeconds(0);
											lastRunOnDate.setMinutes(0);		
											lastRunOnDate.setHours(0);
											lastRunOnDate = lastRunOnDate.getTime();
										} catch(e){

										}
									}
									
									log.debug('lastRunOnDate', lastRunOnDate);
									log.debug(custrecordFloDls + " != " + lastRunOnDate , custrecordFloDls != lastRunOnDate );
									var currentObjJSON = cust[0].getValue("custrecord_flo_object_json");
									if(!currentObjJSON ||  custrecordFloDls != lastRunOnDate ) {
										haschanged = true;
									}

									if(haschanged == false) {
										continue; //Skip if not recently modified.
									}

									
									sObj.isinactive = false;
									sObj.custrecord_flo_cust_in_use = true;
									var employeesUsing = cust[0].getValue("custrecord_flo_employees_cust");
									log.debug("employeesUsing",employeesUsing);
									if (employeesUsing != null && employeesUsing.trim() != '') {
										employeesUsing = employeesUsing.split(",");
									} else {
										employeesUsing = [];
									}

									if (sObj.custrecord_flo_employees_cust != null &&
										sObj.custrecord_flo_employees_cust.trim() != "" &&
										employeesUsing.indexOf(sObj.custrecord_flo_employees_cust) < 0)
										employeesUsing.push(sObj.custrecord_flo_employees_cust);

									employeesUsing = removeInactive(employeesUsing,"Employee");

									var activeEmp = [];
									for (var iii=0;employeesUsing[iii] != null;iii++) {
										activeEmp.push(employeesUsing[iii].getValue("internalid"));
									}

									sObj.custrecord_flo_employees_cust = activeEmp;

									
									

									//++ NS-369

									sObj.custrecord_flo_object_json = cleanJSON;
									sObj.custrecord_flo_object_hash = hashString;
									log.debug("objectjson:" + sObj.custrecord_flo_int_id,sObj.custrecord_flo_object_hash);
									//-- NS-369

									
									var custInactive = cust[0].getValue("isinactive");

									var customizationRec = record.load({type:"customrecord_flo_customization",id:cust[0].getValue("internalid")});
									var currentObjJSON = "";
									var custJSON = "";
									if(customizationRec) {
										currentObjJSON = customizationRec.getValue({fieldId:'custrecord_flo_object_json'}) || "";
										custJSON = customizationRec.getValue({fieldId:"custrecord_flo_record_json"});
									}

									//NS-1353 Check whether the search customization already has the updated details. 
									//This check is necessary because NetSuite is returning odd date formats in the search filters. 
									//We will only update search filters, fields, and formula by checking if is a change in date formate only
									if(currentObjJSON != "") {
										//If custrecord_flo_object_json is not empty, meaning search spider has run for the customization before.
										sObj = verifyActualChange(customizationRec,sObj);
										log.debug('verify sObj',sObj.custrecord_flo_search_filters);
									}

									var sObjJSONCopy = JSON.parse(JSON.stringify(sObj));
									delete sObjJSONCopy['custrecord_flo_object_json'];
									delete sObjJSONCopy['custrecord_flo_object_hash'];
									var sObjJSON = JSON.stringify(sObjJSONCopy)

									sObj.custrecord_flo_record_json = sObjJSON;
										
									log.debug('custJSON',custJSON);
									log.debug('sObjJSON',sObjJSON);							
									log.debug('cleanJSON',cleanJSON);
									log.debug('currentObjJSON',currentObjJSON);
									log.debug('custrecordFloDls != lastRunOnDate',custrecordFloDls != lastRunOnDate);
									log.debug('custJSON != sObjJSON ',custJSON != sObjJSON );
									log.debug('custInactive === true',custInactive === true);
									log.debug('cleanJSON != currentObjJSON',cleanJSON != currentObjJSON);

									if (custrecordFloDls != lastRunOnDate || custJSON != sObjJSON || custInactive === true || cleanJSON != currentObjJSON) {
										sObj.custrecord_flo_autospider_found = false;

										//Only set Make join proc to F if search fields are changed.
										log.debug('custrecord_flo_search_fields ' + customizationRec.getValue({fieldId:'custrecord_flo_search_fields'}) ,sObj.custrecord_flo_search_fields);
										if(customizationRec.getValue({fieldId:'custrecord_flo_search_fields'}) != sObj.custrecord_flo_search_fields) {
											sObj.custrecord_flo_make_join_proc = false;
										}
										
										//++ NS-790 Prevent constant update of CUSTOM RECORD ID between spider and make join (for transaction search)
										if (sObj.custrecord_flo_search_cust_rec && sObj.custrecord_flo_search_cust_rec.match(/^transaction$/i) != null) {
											delete sObj.custrecord_flo_search_cust_rec;
										}
										//-- NS-790
										//++ NS-2149
										if (fromInitSpider) {
											sObj.custrecord_skip_rec_log = true;
											log.debug("2149 skip rec log",cust[0].getValue("internalid"));
										}
										//-- NS-2149
										custRec = updateCustomization(cust[0].getValue("internalid"),sObj);
									} else {
										log.debug('No Changes');
									}

								} else {
									var sObjJSON = JSON.stringify(sObj);
									sObj.custrecord_flo_autospider_found = false;
									sObj.custrecord_flo_make_join_proc = false;
									sObj.custrecord_flo_record_json = sObjJSON;
									//++ NS-2149
									if (fromInitSpider) {
										sObj.custrecord_flo_is_initial_spider = true;
										log.debug("2149 initial spider",sId);
									}
									//-- NS-2149
									custRec = createCustomization(sObj);
								}

								//submit cust
								if (custRec) {
									var recordId = custRec.save({
						                enableSourcing: false,
						                ignoreMandatoryFields: true
						            });
						            log.debug('ID',recordId);
								}

							}
						} catch(e) {
							log.debug("ERROR " + sId, e);
						}


					}//end of for loop

				}
			} catch(e) {
				log.audit('e',e);
			}
		}
		//-- END execute

		/** 
		* NS-1353 Verify it there is an actual search change. 
		* If there are no actual changes, reset search customizations's search fields, formula, filters
		*/
		function verifyActualChange(customizationRec, sObj) {
			try {
				//Additional Check if search filters has changed, check if change is only date format.
				var currentSearchFilters =  customizationRec.getValue({fieldId: 'custrecord_flo_search_filters'}) || "";
				var dateRegExp = new RegExp(/[0-9]{1,4}(\/|-|\.)[0-9]{1,2}(\/|-|\.)[0-9]{1,4}/g);
				var dateFilters = sObj.custrecord_flo_search_filters.match(dateRegExp);
				if(currentSearchFilters != "" && sObj.custrecord_flo_search_filters != currentSearchFilters && dateFilters != null) {
					//Reformat dates by removing leading zeros and changing delimiter to ###. And then compare old and new search filters
					var newSearchFilters = removeLeadingZero(sObj.custrecord_flo_search_filters);
					var currentSearchFilters = removeLeadingZero(currentSearchFilters);

					//If search filters are the same after reformatting, then do not update customization's search metadata
					log.debug('filter the same? ' + customizationRec.id, newSearchFilters === currentSearchFilters);
					if(newSearchFilters === currentSearchFilters) {
						log.debug('No Actual Metadata Change ' + customizationRec.id, 'Filters are the same after reformatting');
						//If there are no other change than searchfilters, reset object json and hash.
						var newObjectJSON = sObj.custrecord_flo_object_json || "";
						var currentObjectJSON = customizationRec.getValue({fieldId: 'custrecord_flo_object_json'}) || "";
						//remove filter part of the json
						newObjectJSON = newObjectJSON.replace(/\{"filters":.*?,"columns":/,"");
						currentObjectJSON = currentObjectJSON.replace(/\{"filters":.*?,"columns":/,"");
						log.debug('json the same? ',  currentObjectJSON === newObjectJSON);
						if(currentObjectJSON === newObjectJSON) {

							sObj.custrecord_flo_search_filters = customizationRec.getValue({fieldId: 'custrecord_flo_search_filters'});
							sObj.custrecord_flo_object_json = customizationRec.getValue({fieldId: 'custrecord_flo_object_json'});
							sObj.custrecord_flo_object_hash = customizationRec.getValue({fieldId: 'custrecord_flo_object_hash'});
						}
						
					}


				}
			} catch(e) {
				log.debug('e verifyActualChange', e);
			}
			return sObj;
		}

		//NS-1353
		/*
		* Reformat date in filters by removing leading 0
		*/
		function removeLeadingZero(filters) {
			var formattedFilters = filters;
			var dateRegExp = new RegExp(/[0-9]{1,4}(\/|-|\.)[0-9]{1,2}(\/|-|\.)[0-9]{1,4}(\s[0-9]{1,2}:[0-9]{1,2})?/g);
			try {
				var dateFilters = filters.match(dateRegExp);
				if(dateFilters != null) {
					for(var d = 0; d < dateFilters.length; d++) {
						var originalformat = dateFilters[d];

						//split date by the delimiter and space for the time
						var dateNumArr = originalformat.split(/\/|-|\.|\s|:/);
						//log.debug('dateNumArr', dateNumArr);
						var noLeadingZerosDate = []
						for(var n = 0; n < dateNumArr.length; n++) {
							var thisNum = dateNumArr[n];
							if(thisNum.indexOf("0") == 0 && thisNum.match(/0[0-9]/) != null) {
								//remove the first 0 found
								thisNum = thisNum.substring(1);
							}
							noLeadingZerosDate.push(thisNum);
						}

						//dates are joined by ###, date delimiter is not important because we are only checking if old and new search filters are the same
						var newformat = noLeadingZerosDate.join("###");
						//log.debug('date format ' + originalformat, newformat);
						formattedFilters = formattedFilters.replace(originalformat,newformat);
					}
				}
			} catch(e) {
				log.debug('e removeLeadingZero', e);
			}

			log.debug('formattedFilters', formattedFilters);
			return formattedFilters;
		}

		//++ NS-369
		/**
		* Generates the Object Hash and Object JSON for the search
		*/
		function getObjectJSONString(searchObj,searchName,sSchedule,searchFieldNames) {
			var cleanjsonString = "";
			try {
				var searchString = JSON.stringify(searchObj);
				searchString = searchString.replace(/(,)?\"type\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
				

				var searchJSON = JSON.parse(searchString);

				if(searchJSON.hasOwnProperty('id')) {
					delete searchJSON['id'];
				}
				
				if(searchJSON.hasOwnProperty('title') && !searchJSON.title) {
					searchJSON.title = searchName;
				}

				if(searchJSON.hasOwnProperty('filters') && searchJSON.filters) {
					for(var f in searchJSON.filters) {
						var line = searchJSON.filters[f];
						if(line.hasOwnProperty('values') && typeof line.values === "object") {
							searchJSON.filters[f]['values'] = JSON.stringify(line.values);
						}
					}
				}

				searchJSON.sendscheduledemails = sSchedule;
				searchJSON.field_names = searchFieldNames;

				cleanjsonString = JSON.stringify(searchJSON);
			} catch(e) {
				log.debug("getObjectJSONString",e)
			}

			return cleanjsonString;

		}
		//-- END getObjectJSONString
		//-- NS-369

		/**
		* Returns active object from the list.
		*/
		function removeInactive(idList,type) {
			var r = [];
			if (idList != null && idList.length > 0) {
				var s = search.create({
			                type : type,
			            	filters: [["internalid","anyof",idList],"AND",["isinactive","is","F"]],
			            	columns: ["internalid"]});
				r = s.run().getRange({start:0,end:1000});
			}
			return r;
		}
		//--END removeInactive

		/**
		* Determines if object is active
		*/
		function checkInactive(id,type) {
			var inActive = false;
			try {
				var s = search.create({
		                type : type,
		            	filters: [["internalid","is",id],"AND",["isinactive","is","F"]]});
				var r = s.run().getRange({start:0,end:1});
				if (r == null || r.length < 1)
					inActive = true;
			} catch(e) {
				inActive = true;
			}


			return inActive;
		}
		//--END checkInactive

		/**
		* Retrieves the default user when the search is inactive
		*/ 
		function getDefaultUser() {
			var du;
			try {
				var s = search.create({
		                type : record.Type.EMPLOYEE,
		                columns : [ 'isinactive','internalid'],
		            	filters: [["lastname","is","FLODocs User"]]});
				var e = s.run().getRange({start:0,end:1});
				if (e == null || e.length < 1) {
					var rec = record.create({
			                type : record.Type.EMPLOYEE,
			                isDynamic: true });
					rec.setValue({ fieldId:'firstname' , value:'Default' });
					rec.setValue({ fieldId:'lastname'  , value: 'FLODocs User' });
					rec.setValue({ fieldId:'isinactive', value: false });
					rec.setValue({ fieldId:'comments'  , value:'This is a dummy record used as a placeholder for missing record owner and to route custom controls' });
					du = rec.save({ ignoreMandatoryFields: true }); // ignore any mandatory
				} else {
					du = e[0].getValue('internalid');
					var isinactive = e[0].getValue({ name: 'isinactive' });
					if (!isinactive){
						log.audit("FloDocUser (" +du +")" + " IS active.");
					}else{
						var floDocUser = record.load({
							type: record.Type.EMPLOYEE,
							isDynamic: true,
							id: du
						});
						floDocUser.setValue({ fieldId:'isinactive', value: false });
						floDocUser.save({ ignoreMandatoryFields: true });
						log.audit("FloDocUser (" + du + ")" + " SET to active.");
					}

				}
			} catch(ex) {
				try {
	                var defEmpSearch = search.create({
	                    type : search.Type.EMPLOYEE,
	                    columns : [ search.createColumn({
	                         name: 'internalid',
	                         summary: search.Summary.MIN
	                         })],
	                    filters : [['isinactive','is','F'],'AND',['giveaccess','is','T'],'AND',['role','anyof',[3]]]
	                });

	                var defEmpSearchResult = defEmpSearch.run().getRange({ start: 0, end: 1 });
	                if(defEmpSearchResult && defEmpSearchResult.length > 0 && defEmpSearchResult[0] ) {
	                    var firstcol = defEmpSearchResult[0].columns;
	                    du = defEmpSearchResult[0].getValue(firstcol[0]);
	                } 

	                log.debug("default user", du)
	                if(du == null || du == "") {
	                    du = -5;
	                }
	            } catch(e) {
	                log.debug("err getDefaultUser", e);
	                du = -5;
	            }
			}
			
			log.debug('DEFAULT USER',du);
			return du;
		}
		//-- END getDefaultUser

		/**
		* Retrieves the fields from search formula
		*/ 
		function parseFieldFromFormula(formula,sFields){
			if (formula != null) {
				var fields = formula.match(/{[a-z0-9_]+\.?[a-z0-9_]+}/ig);
				if (fields != null) {
					for (var i = 0; fields[i] != null; i++) {
						var field =  fields[i].replace(/[{}]/g,"");
						if (field != null && sFields.indexOf(field) < 0) {
							sFields.push(field);
						}
					}
				}
			}
		}
		//--END parseFieldFromFormula

		/**
		* Creates customization record for search if it does not exist yet.
		*/
		function createCustomization(sObj){
			log.debug('Create Cust',sObj.custrecord_flo_record_json);
			var rec = record.create({type:"customrecord_flo_customization"});
			if (rec) {
				for (var key in sObj) {
		            if (sObj.hasOwnProperty(key)) {
		            	if (sObj[key] != null) {
			                rec.setValue({
			                    fieldId: key,
			                    value: sObj[key]
			                });
		            	}
	            	}
				}
			}
			return rec;
		}
		//--END createCustomization

		/**
		* Updates the existing customization for the search
		*/
		function updateCustomization(recId, sObj){
			log.debug('Update Cust',sObj.custrecord_flo_record_json);

			var rec = record.load({type:"customrecord_flo_customization",id:recId});
			if (rec) {
				for (var key in sObj) {
		            if (sObj.hasOwnProperty(key)) {
		            	if (sObj[key] != null) {
			                rec.setValue({
			                    fieldId: key,
			                    value: sObj[key]
			                });
		                }
	            	}
				}
			}
			return rec;
		}
		//--END updateCustomization

		/**
		* Updates the search customization count
		*/
		function updateSpiderCount(docSearch,newrecnum) {

			try {
				var searchesSearch2 = search.load({type:search.Type.SAVED_SEARCH,id:"customsearch_flo_active_searches"});
				searchesSearch2.columns = [search.createColumn({
						name: 'internalid',
						summary: search.Summary.COUNT
					})];
				var searchesResult2 = searchesSearch2.run();
				var searchesFound = searchesResult2.getRange({start:0, end:1});
				log.debug('searchesFound', JSON.stringify(searchesFound));
				log.debug('searchesFound', searchesFound[0].getValue({
						name: 'internalid',
						summary: search.Summary.COUNT 
					}));

				if(searchesFound.length > 0) {
					var searchCount = searchesFound[0].getValue({
							name: 'internalid',
							summary: search.Summary.COUNT 
						});

					if(searchCount && searchCount != '') {
						var logList = search.create({
					    	type : 'customrecord_flo_spider_log',
					    	columns : ['internalid'],
					        filters : [['custrecord_flo_log_type','anyof',newrecnum]]
					    });

					    var logresults = logList.run().getRange(0,1);

					    if(logresults && logresults.length > 0) {
						    var spiderLogRecord = record.load({ type: 'customrecord_flo_spider_log', id: logresults[0].id });
							spiderLogRecord.setValue({ fieldId:'custrecord_flo_log_spider_count', value: searchCount });
							spiderLogRecord.setValue({ fieldId:'custrecord_flo_config_stats_link', value: 1 });
							spiderLogRecord.save({ ignoreMandatoryFields: true });
					    }
					}			
				}
			} catch(e) {
				log.debug("get all results",e)
			}
		}
		//-- END updateSpiderCount

		/**
		* Escapes the comma character
		*/
		function formatcuststring(text) {
			 if(text) {
			 	text = text.replace(/,/g,'&#44;');
			 }
			 return text;
		}
		//-- END formatcuststring

		/**
         * Checks whether the current time is within the time window set in config record
        */
		function isWithinTimeWindow(starttime, endtime) {
			
			//Dummy Record to get current timeof day
			var dummyConfig = record.create({type: "customrecord_flo_spider_configuration", isDynamic: true});
			currenttime = dummyConfig.getValue({fieldId: 'custrecord_flo_conf_current_tod'});
			

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

	return {
	     execute: execute
	}
});
