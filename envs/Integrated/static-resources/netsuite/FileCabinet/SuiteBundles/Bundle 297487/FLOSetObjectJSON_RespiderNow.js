/**
 *@NApiVersion 2.x
 *@NScriptType WorkflowActionScript
  */
define(['N/runtime','N/search','N/record','N/crypto'],
    function(runtime,search,record,crypto)
    {
    	function onAction(context){

    		//SUPPORTED RECORD TYPES
    		var ENTITYFIELD = 3;
    		var CRMFIELD = 25;
    		var OTHERFIELD = 27;
    		var ITEMFIELD = 26;
    		var ITEMOPTIONFIELD  = 28;
    		var BODYFIELD = 5;
    		var COLUMNFIELD = 4;
    		var ITEMNUMBERFIELD = 29;
    		var CUSTOMRECORD = 2;
    		var CUSTOMRECORDFIELD = 30;
    		var CUSTOMLIST = 1;
    		var MASSUPDATE = 9;
    		var SAVEDSEARCH = 8;
    		var WORKFLOW = 10;
    		var USERROLE = 50;
    		var BUNDLE = 71;

    		var supportedRecordTypes = {};
    		supportedRecordTypes['type_'+ENTITYFIELD] = 'entitycustomfield';
    		supportedRecordTypes['type_'+CRMFIELD] = 'crmcustomfield';
    		supportedRecordTypes['type_'+OTHERFIELD] = 'othercustomfield';
    		supportedRecordTypes['type_'+ITEMFIELD] = 'itemcustomfield';
    		supportedRecordTypes['type_'+ITEMOPTIONFIELD] = 'itemoptioncustomfield';
    		supportedRecordTypes['type_'+BODYFIELD] = 'transactionbodycustomfield';
    		supportedRecordTypes['type_'+COLUMNFIELD] = 'transactioncolumncustomfield';
			supportedRecordTypes['type_'+ITEMNUMBERFIELD] = 'itemnumbercustomfield';
			supportedRecordTypes['type_'+CUSTOMRECORD] = 'customrecordtype';
			supportedRecordTypes['type_'+CUSTOMRECORDFIELD] ='customrecordcustomfield';
			supportedRecordTypes['type_'+CUSTOMLIST] = 'CustomList';
			supportedRecordTypes['type_'+MASSUPDATE] = 'custom';
			supportedRecordTypes['type_'+SAVEDSEARCH] = 'SavedSearch';
			supportedRecordTypes['type_'+WORKFLOW] = 'Workflow';
			supportedRecordTypes['type_'+USERROLE] =  'role';
			supportedRecordTypes['type_'+BUNDLE] = 'custom';

			var returnValue = "";
			try {
				var script = runtime.getCurrentScript();
				var custworkflow_flo_customization_ids =  script.getParameter({ name: 'custscript_flo_objson_rs_custid'});
				log.debug('custworkflow_flo_customization_ids',custworkflow_flo_customization_ids);
				if(!custworkflow_flo_customization_ids || custworkflow_flo_customization_ids=="EMPTY") {
					return 'EMPTY';	
				} else {	
					custworkflow_flo_customization_ids = custworkflow_flo_customization_ids.split(',');
				}	

				for(var i = 0; i < custworkflow_flo_customization_ids.length; i++) {

					try {
						var custid = custworkflow_flo_customization_ids[i];
						var custRecord = record.load({type: 'customrecord_flo_customization',id: custid});
						var custType = custRecord.getValue({fieldId: 'custrecord_flo_cust_type'});
						var custTypekey = 'type_'+custType;
						var parent = custRecord.getValue({fieldId: 'custrecord_flo_cust_parent'});
						var custString = custRecord.getValue({fieldId: 'custrecord_flo_customization'});

						log.debug('custType',custTypekey);
						log.debug('supportedRecordTypes',JSON.stringify(supportedRecordTypes));
						if(!supportedRecordTypes.hasOwnProperty(custTypekey)) continue;
						var objectJSON = "";
						var objectJSONForHash = "";
						var custInternalId = custRecord.getValue({fieldId: 'custrecord_flo_int_id'});

						log.debug('custInternalId',custInternalId);
						if(custType == ENTITYFIELD || custType == CRMFIELD || custType == OTHERFIELD || custType == ITEMFIELD || custType == ITEMOPTIONFIELD || custType == BODYFIELD || custType == COLUMNFIELD || custType == ITEMNUMBERFIELD) {
							//STANDARD RECORD CUSTOM FIELDS
							var fieldRec = record.load({ type:supportedRecordTypes[custTypekey], id: custInternalId, isDynamic: true });
							objectJSON = getFieldObjectJSON(fieldRec);
							if(objectJSON) {
								objectJSONForHash = objectJSON.replace(/(,)?\"owner\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
							}
						} else if(custType == CUSTOMRECORD || custType == CUSTOMRECORDFIELD) {
							var customRec =  record.load({ type:supportedRecordTypes[custTypekey], id: custInternalId, isDynamic: true });
							var parentscriptid = null;
							if(custType == CUSTOMRECORDFIELD) {
								if(parent) {
									if(parent instanceof Array) {
										parent = parent[0];
									}
									var parentRec = record.load({type: 'customrecord_flo_customization', id: parent});
									parentscriptid = parentRec.getValue({fieldId: 'custrecord_flo_cust_id'});
									if(!parentscriptid) {
										continue;
									}
								} else {
									continue;
								}
								
							}
							objectJSON = getCustomRecordObjectJSON(customRec, parentscriptid);
							if(objectJSON) {
								objectJSONForHash = objectJSON.replace(/(,)?\"owner\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
							}
						} else if(custType == CUSTOMLIST) {
							var listRec = record.load({type: supportedRecordTypes[custTypekey], id: custInternalId, isDynamic: true});
							objectJSON = getListObjectJSON(listRec);
							objectJSONForHash = objectJSON;
						} else if(custType == USERROLE) {
							var roleRec = record.load({type: supportedRecordTypes[custTypekey], id: custInternalId});
							objectJSON = getRoleObjectJSON(roleRec);
							objectJSONForHash = objectJSON;
						} else if(custType == SAVEDSEARCH) {

							var custrecord_flo_data_type = custRecord.getValue({fieldId: 'custrecord_flo_data_type'});
							var custrecord_flo_search_fields_names = custRecord.getValue({fieldId: 'custrecord_flo_search_fields_names'}) ||'';
							var custrecord_flo_cust_id = custRecord.getValue({fieldId: 'custrecord_flo_cust_id'});
							var custrecord_flo_search_cust_rec = custRecord.getValue({fieldId: 'custrecord_flo_search_cust_rec'});

							var searchType = null;
							var thisSearch = null;
							if(custrecord_flo_data_type && custrecord_flo_data_type != 'Custom') {
								searchType = custrecord_flo_data_type.replace(/\s/g,'');
							} else if(custrecord_flo_search_cust_rec && custrecord_flo_search_cust_rec != "custom"){
								searchType = custrecord_flo_search_cust_rec;
							}
							try {
								thisSearch = search.load({type:searchType,id:custInternalId});
							} catch (e) {								
								try {
									thisSearch = search.load({id:custInternalId});
								} catch (e2) {
									
								}
							}
							var searchObj = thisSearch;
							var searchTitle = custRecord.getValue({fieldId: 'name'});
							searchTitle = searchTitle.replace(" (Search)","");

							var custobj = {};
							if(custString) {
								var custpair = custString.split(',');
								for(var c = 0; c < custpair.length; c++) {
									var key = custpair[c].split(':')[0];
									custobj[key] = custpair[c].split(':')[1];
								}
							}

							var searchAccess = custobj.Access;
							if(searchAccess == "Private") {
								searchAccess = false;
							} else {
								searchAccess = true;
							}


							var sSchedule = custobj.Scheduled;
							sSchedule = sSchedule.replace("&nbsp;","");
							if(!sSchedule) sSchedule = "No";

							if(!searchObj) {
								searchObj = {title:searchTitle, scriptId: custrecord_flo_cust_id, type: custrecord_flo_data_type, isPublic: searchAccess}
							}
							objectJSON = getSearchObjectJSON(searchObj,searchTitle,sSchedule,custrecord_flo_search_fields_names);
							objectJSONForHash = objectJSON;
						} else if(custType == WORKFLOW) {
							var workFlowObj   = record.load({ type: supportedRecordTypes[custTypekey], id: custInternalId, isDynamic:true });
							objectJSON = getWorkflowObjectJSON(workFlowObj);
							if(objectJSON) {
								objectJSONForHash = objectJSON.replace(/(,)?\"owner\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
							}
						} else if(custType == MASSUPDATE) {
							var custrecord_flo_data_type = custRecord.getValue({fieldId: 'custrecord_flo_data_type'});
							var custrecord_flo_search_cust_rec = custRecord.getValue({fieldId: 'custrecord_flo_search_cust_rec'});
							var searchType = null;
							
							if(custrecord_flo_data_type && custrecord_flo_data_type != 'Custom') {
								searchType = custrecord_flo_data_type.replace(/\s/g,'');
							} else if(custrecord_flo_search_cust_rec && custrecord_flo_search_cust_rec != "custom"){
								searchType = custrecord_flo_search_cust_rec;
							}

							objectJSON = getMassUpdateObjectJSON(custInternalId,searchType);
							objectJSONForHash = objectJSON;

						} else if(custType == BUNDLE) {
							objectJSON = getBundleObjectJSON(custString);
							objectJSONForHash = objectJSON.replace(/(,)?\"(installed_by|installed_on|last_update)\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
						} 

						if(objectJSON && objectJSONForHash) {
							log.debug('objectJSON',objectJSON)
							var hashString = "";
							if(objectJSONForHash) {
								var hashObj = crypto.createHash({
								    algorithm: crypto.HashAlg.SHA1
								});
								hashObj.update({
					                input: objectJSONForHash
					            });

					            hashString = hashObj.digest();
							}
							
							custRecord.setValue({
								fieldId: "custrecord_flo_object_json",
								value: objectJSON
							});
							custRecord.setValue({
								fieldId: "custrecord_flo_object_hash",
								value: hashString
							});

							var recordId = custRecord.save({
								enableSourcing: false,
								ignoreMandatoryFields: true
							});
						}


					} catch(e) {
						log.debug("err inside forloop",e)
					}
					
				}	
			} catch(e) {

				log.debug("err setobject",e)
			}

			return returnValue;
			
		}
		
		function getFieldObjectJSON(fieldRec) {
			var cleanjsonString = "";
			try {
				var fieldRecString = JSON.stringify(fieldRec);
				fieldRecString = fieldRecString.replace(/(,)?\"sys_parentid\":\".*?\"/g,"").replace(/(,)?\"sys_id\":\".*?\"/g,"").replace(/(,)?\"_eml_nkey_\":\".*?\"/g,"").replace(/(,)?\"nsapiCT\":\".*?\"/g,"").replace(/(,)?\"id\":\".*?\"/g,"").replace(/(,)?\"entryformquerystring\":\".*?\"/g,"").replace(/(,)?\"staticlistrecordtype\":\".*?\"/g,"").replace(/(,)?\"fldcurselrectype\":\".*?\"/g,"").replace(/(,)?\"#\":\".*?\"/g,"").replace(/(,)?\"sourcefromrecordtype\":\".*?\"/g,"").replace(/(,)?\"sourcelistrecordtype\":\".*?\"/g,"").replace(/(,)?\"fldselecttype\":\".*?\"/g,"").replace(/(,)?\"fldfiltersel\":\".*?\"/g,"").replace(/\{,\"/g,'{"');

				var fieldObj = JSON.parse(fieldRecString);
				delete fieldObj['type'];
				delete fieldObj['isDynamic'];
				if(fieldObj.hasOwnProperty('fields')) {
					for(var f  in fieldObj["fields"]) {
						var fieldvalue = fieldObj["fields"][f];
						try {
							fieldvalue = fieldRec.getText({ fieldId: f});
						} catch(e) {
							//log.debug("cleanObjectJSON",e);
						}
						fieldObj[f] = fieldvalue;
					}

					delete fieldObj["fields"];
				}

				if(fieldObj.hasOwnProperty('id')) {
					delete fieldObj['id'];
				}
				if(fieldObj.hasOwnProperty('sublists')) {
					var sublists = fieldObj['sublists'];	
					for(var listname in sublists) {
						if(listname == "customfieldfilter" || listname=="subaccess" || listname=="roleaccess" ||  listname=="translations" ) {					
							for(var j in fieldObj["sublists"][listname]) {
								if(j == "currentline") {
									delete fieldObj["sublists"][listname][j];
									continue;
								}
								var numLines = fieldRec.getLineCount({
								    sublistId: listname
								});

								if(numLines == 0) {
									continue;
								}
								
								var lineobj = fieldObj["sublists"][listname][j];
								var listkey = "";
								var lineid = parseInt(j.replace(/line\s/g,'')) - 1;
								if(listname == "customfieldfilter" && lineobj.fldfilter) {
									log.debug("customfieldfilter line",lineid);
									listkey  = fieldRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'fldfilter',
									    line: lineid
									});
									log.debug("customfieldfilter line",listkey);
									delete fieldObj["sublists"][listname][j]['fldcomparefield'];
									
								} else if(listname == "subaccess" && lineobj.sub) {
									log.debug("subaccess line",lineid);
									listkey = fieldRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'sub',
									    line:lineid
									});
									log.debug("fieldRec line",listkey);
									delete fieldObj["sublists"][listname][j]['sub'];

								} else if(listname == "roleaccess" && lineobj.role) {
									log.debug("roleaccess line",lineid);
									listkey = fieldRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'role',
									    line: lineid
									});
									log.debug("roleaccess line",listkey);
									delete fieldObj["sublists"][listname][j]['role'];

								}  else if(listname == "deptaccess" && lineobj.dept) {
									log.debug("deptaccess line",lineid);
									listkey = fieldRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'dept',
									    line: lineid
									});
									log.debug("deptaccess line",listkey);
									delete fieldObj["sublists"][listname][j]['dept'];
							
								}  else if(listname == "translations" && lineobj.locale) {

									fieldObj["sublists"][listname][lineobj.locale] = lineobj.locale;
									
								}

								if(listkey) {
									fieldObj["sublists"][listname][listkey] = fieldObj["sublists"][listname][j];
								}
								delete fieldObj["sublists"][listname][j];
								
							}
							if(Object.keys(fieldObj["sublists"][listname]).length == 0) {
								delete fieldObj["sublists"][listname];
							}
						} else {
							delete fieldObj["sublists"][listname];
						}
					}

					if(Object.keys(fieldObj['sublists']).length == 0) {
						delete fieldObj["sublists"];
					}
				}

				cleanjsonString = JSON.stringify(fieldObj);
			} catch(e) {
				log.debug("getFieldObjectJSON",e);
			}

			return cleanjsonString;	
		}

		function getCustomRecordObjectJSON(customRec,parentscriptid) {
			var cleanjsonString = "";
			try {
				var customRecString = JSON.stringify(customRec);
				customRecString = customRecString.replace(/(,)?\"sys_parentid\":\".*?\"/g,"").replace(/(,)?\"sys_id\":\".*?\"/g,"").replace(/(,)?\"_eml_nkey_\":\".*?\"/g,"").replace(/(,)?\"nsapiCT\":\".*?\"/g,"").replace(/(,)?\"id\":\".*?\"/g,"").replace(/(,)?\"entryformquerystring\":\".*?\"/g,"").replace(/(,)?\"staticlistrecordtype\":\".*?\"/g,"").replace(/(,)?\"fldcurselrectype\":\".*?\"/g,"").replace(/(,)?\"#\":\".*?\"/g,"").replace(/(,)?\"disclaimer\":\"[\s\S]*?\"/g,"").replace(/(,)?\"customfieldseqnum\":\".*?\"/g,"").replace(/(,)?\"fieldseqnum\":\".*?\"/g,"").replace(/(,)?\"(field|child|formedit|formname)url\":\".*?\"/g,"").replace(/(,)?\"numberingcurrentnumber\":\".*?\"/g,"").replace(/(,)?\"fieldid\":\".*?\"/g,"").replace(/(,)?\"sourcefilterreferencedbycount\":\".*?\"/g,"").replace(/(,)?\"sourcefromrecordtype\":\".*?\"/g,"").replace(/(,)?\"sourcelistrecordtype\":\".*?\"/g,"").replace(/(,)?\"fldselecttype\":\".*?\"/g,"").replace(/(,)?\"fldfiltersel\":\".*?\"/g,"").replace(/\{,\"/g,'{"');

				log.debug("customRecString",customRecString);
				var recObj = JSON.parse(customRecString);
				
				var rectype = recObj['type'];
				delete recObj['type'];
				delete recObj['isDynamic'];
				
				if(recObj.hasOwnProperty('fields')) {
					for(var f  in recObj["fields"]) {
						var fieldvalue = recObj["fields"][f];
						try {
							fieldvalue = customRec.getText({ fieldId: f});
						} catch(e) {
							//log.debug("cleanObjectJSON",e);
						}
						recObj[f] = fieldvalue;
					}

					delete recObj["fields"];
				}

				if(recObj.hasOwnProperty('id')) {
					delete recObj['id'];
				}

				if(rectype == "customrecordcustomfield" && recObj.hasOwnProperty('rectype') && parentscriptid) {
					recObj['rectype'] = parentscriptid;
				}
				
				if(recObj.hasOwnProperty('sublists')) {
					var sublists = recObj['sublists'];	
					for(var listname in sublists) {
						if(rectype == "customrecordtype" && (listname == "customfield" || listname == "children"  || listname == "recordsublists" || listname == "permissions" || listname == "translations" || listname == "tabs"  || listname == "links" || listname == "forms" || listname == "managers" || listname == "parents" )) {
								
							for(var j in recObj["sublists"][listname]) {
								if(j == "currentline") {
									delete recObj["sublists"][listname][j];
									continue;
								}
								var listkey = "";
								var lineobj = recObj["sublists"][listname][j];
								var lineid = parseInt(j.replace(/line\s/g,'')) - 1;
								if(listname == "customfield" && lineobj.fieldcustcodeid) {
									listkey = lineobj.fieldcustcodeid;
									delete recObj["sublists"][listname][j]['fieldcustcodeid'];
								} else if(listname == "children" && lineobj.childdescr) {
									var childkey = lineobj.childdescr;
									var childtab  = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'childtab',
									    line: lineid
									});
									recObj["sublists"][listname][childkey] = { childdescr: childkey ,tab: childtab};
								} else if(listname == "recordsublists" && lineobj.recordsearch) {
									var searchName  = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'recordsearch',
									    line: lineid
									});
									var sublistkeys = ["recorddescr","recordtab","recordfield"];
									var sublistObj = {};
									for(var s = 0; s < sublistkeys.length; s++) {
										var skey = sublistkeys[s];
										if(lineobj.hasOwnProperty(skey)) {
											var textvalue  = customRec.getSublistText({
											    sublistId: listname,
											    fieldId: skey,
											    line: lineid
											});
											sublistObj[skey] = textvalue;
										}
									}

									recObj["sublists"][listname][searchName] = sublistObj;

								}  else if(listname == "permissions" && lineobj.permittedrole) {
									listkey = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'permittedrole',
									    line: lineid
									});
									delete recObj["sublists"][listname][j]['permittedrole'];
									var lineObjKeys = Object.keys(lineobj);
									for(var s = 0; lineObjKeys != null && s < lineObjKeys.length; s++) {
										var skey = lineObjKeys[s];
										var textvalue  = customRec.getSublistText({
											    sublistId: listname,
											    fieldId: skey,
											    line: lineid
										});
										recObj["sublists"][listname][j][skey] = textvalue;
									}

									
								} else if(listname == "translations" && lineobj.locale) {
									recObj["sublists"][listname][lineobj.locale] = lineobj.locale;	
								} else if(listname == "tabs" && lineobj.tabtitle) {
									var tabparentvalue = lineobj.tabparent || "";
									recObj["sublists"][listname][lineobj.tabtitle] = {tabtitle: lineobj.tabtitle, tabparent: tabparentvalue};	
								} else if(listname == "links" && lineobj.linkcenter && lineobj.linksection_display) {
									var linkKey = lineobj.linkcenter + " - " + lineobj.linksection_display;
									var linklabelVal = lineobj.linklabel || "";
									var linkCatlVal = lineobj.linkcategory_display || "";
									var linkIDVal = "";
									linkIDVal = customRec.getSublistText({
											    sublistId: listname,
											    fieldId: "linkid",
											    line: lineid
									});
									recObj["sublists"][listname][linkKey] = {linkcategory: linkCatlVal, linkid: linkIDVal, linklabel: linklabelVal};	
								} else if(listname == "forms" && lineobj.formname) {
									var formkey = lineobj.formname;
									recObj["sublists"][listname][formkey] = {forminactive: lineobj.forminactive, formpref: lineobj.formpref};	
								} else if(listname == "managers" && lineobj.manageremp) {
									var managerkey = customRec.getSublistText({
										    sublistId: listname,
										    fieldId: "manageremp",
										    line: lineid
									});
									recObj["sublists"][listname][managerkey] = managerkey;	

								} else if(listname == "parents" && lineobj.childdescr) {
									var parentKey = lineobj.childdescr;
									recObj["sublists"][listname][parentKey] = parentKey;	

								}
								if(listkey) {
									recObj["sublists"][listname][listkey] = recObj["sublists"][listname][j];
								}
								delete recObj["sublists"][listname][j];
							}

							if(Object.keys(recObj["sublists"][listname]).length == 0) {
								delete recObj["sublists"][listname];
							}

						} else if(rectype == "customrecordcustomfield" && (listname == "customfieldfilter" || listname=="subaccess" || listname=="roleaccess" ||  listname=="translations" )) {
							for(var j in recObj["sublists"][listname]) {
								if(j == "currentline") {
									delete recObj["sublists"][listname][j];
									continue;
								}
								
								var lineobj = recObj["sublists"][listname][j];
								var listkey = "";
								var lineid = parseInt(j.replace(/line\s/g,'')) - 1;

								if(listname == "customfieldfilter" && lineobj.fldfilter) {
									log.debug("customfieldfilter line",lineid);
									listkey  = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'fldfilter',
									    line: lineid
									});
									log.debug("customfieldfilter line",listkey);
									delete recObj["sublists"][listname][j]['fldcomparefield'];
									
								} else if(listname == "subaccess" && lineobj.sub) {
									log.debug("subaccess line",lineid);
									listkey = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'sub',
									    line:lineid
									});
									log.debug("fieldRec line",listkey);
									delete recObj["sublists"][listname][j]['sub'];

								} else if(listname == "roleaccess" && lineobj.role) {
									log.debug("roleaccess line",lineid);
									listkey = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'role',
									    line: lineid
									});
									log.debug("roleaccess line",listkey);
									delete recObj["sublists"][listname][j]['role'];

								}  else if(listname == "deptaccess" && lineobj.dept) {
									log.debug("deptaccess line",lineid);
									listkey = customRec.getSublistText({
									    sublistId: listname,
									    fieldId: 'dept',
									    line: lineid
									});
									log.debug("deptaccess line",listkey);
									delete recObj["sublists"][listname][j]['dept'];
							
								}  else if(listname == "translations" && lineobj.locale) {

									recObj["sublists"][listname][lineobj.locale] = lineobj.locale;
									
								}

								if(listkey) {
									recObj["sublists"][listname][listkey] = recObj["sublists"][listname][j];
								}
								delete recObj["sublists"][listname][j];
								
							}

							if(Object.keys(recObj["sublists"][listname]).length == 0) {
								delete recObj["sublists"][listname];
							}
						} else {
							delete recObj["sublists"][listname];
						}
					}

					if(Object.keys(recObj['sublists']).length == 0) {
						delete recObj["sublists"];
					}
				}

				cleanjsonString = JSON.stringify(recObj);
			} catch(e) {
				log.debug("getCustomRecordObjectJSON",e);
			}

			return cleanjsonString;		
		}
		
		function getListObjectJSON(listRec) {
			var cleanjsonString = "";
			try {
				var listRecString = JSON.stringify(listRec);
				listRecString = listRecString.replace(/(,)?\"sys_parentid\":\".*?\"/g,"").replace(/(,)?\"sys_id\":\".*?\"/g,"").replace(/(,)?\"_eml_nkey_\":\".*?\"/g,"").replace(/(,)?\"nsapiCT\":\".*?\"/g,"").replace(/(,)?\"id\":\".*?\"/g,"").replace(/(,)?\"entryformquerystring\":\".*?\"/g,"").replace(/\{,\"/g,'{"');

				var listObj = JSON.parse(listRecString);
			
				delete listObj['type'];
				delete listObj['isDynamic'];
				
				if(listObj.hasOwnProperty('fields')) {
					for(var f  in listObj["fields"]) {
						var fieldvalue = listObj["fields"][f];
						try {
							fieldvalue = listRec.getText({ fieldId: f});
						} catch(e) {
							//log.debug("cleanObjectJSON",e);
						}
						listObj[f] = fieldvalue;
					}

					delete listObj["fields"];
				}

				if(listObj.hasOwnProperty('id')) {
					delete listObj['id'];
				}
				
				if(listObj.hasOwnProperty('sublists')) {
					var sublists = listObj['sublists'];
					for(var listname in sublists) {
						if(listname == "customvalue" || listname=="translations" ) {
							for(var j in listObj["sublists"][listname]) {
								if(j == "currentline") {
									delete listObj["sublists"][listname][j];
									continue;
								}
								var lineobj = listObj["sublists"][listname][j];
								if(listname == "customvalue" && lineobj.valueid) {
									listObj["sublists"][listname][lineobj.valueid] = lineobj.value;
								} else if(listname == "translations" && lineobj.locale) {
									listObj["sublists"][listname][lineobj.locale] = lineobj.locale;
								}

								delete listObj["sublists"][listname][j];
							}
						} else {
							delete listObj["sublists"][listname];
						}
					}	

					if(Object.keys(listObj['sublists']).length == 0) {
						delete listObj["sublists"];
					}
				}

				cleanjsonString = JSON.stringify(listObj);
			} catch(e) {
				log.debug('getListObjectJSON',e)
			}

			return cleanjsonString;
		}

		function getRoleObjectJSON(floDocrole) {
			var cleanjsonString = "";
			try {
				var roleObj = JSON.parse(JSON.stringify(floDocrole));
				var custrecords = [];
				var customtransactions = [];
				log.debug("roleObj",roleObj);
				delete roleObj['id'];
				delete roleObj['type'];
				delete roleObj['isDynamic'];
				log.debug("roleObj.hasOwnProperty('fields')",roleObj.hasOwnProperty('fields'));
				if(roleObj.hasOwnProperty('fields')) {
					delete roleObj['fields']['_eml_nkey_'];
					delete roleObj['fields']['nsapiCT'];
					delete roleObj['fields']['sys_id'];
					delete roleObj['fields']['entryformquerystring'];
					delete roleObj['fields']['savedash'];
					delete roleObj['fields']['id'];
					delete roleObj['fields']['origid'];

					for(var f  in roleObj["fields"]) {
						roleObj[f] = roleObj["fields"][f];
					}

					delete roleObj["fields"];
				}

				log.debug("roleObj.hasOwnProperty('sublists')",roleObj.hasOwnProperty('sublists'));
				if(roleObj.hasOwnProperty('sublists')) {
					var sublists = roleObj['sublists'];	

					for(var listname in sublists) {
						var lines = sublists[listname];
						
						var lineKeyRegexp = null;
						var valueKeyRegexp = null;

						if(listname == "custrecordmach"){
							lineKeyRegexp = new RegExp('^custrecord$');
							valueKeyRegexp = new RegExp('^permittedlevel$');
						} else if(listname.match(/mach$/) != null) {
							lineKeyRegexp = new RegExp('^permkey');
							valueKeyRegexp = new RegExp('_display$');
						} else if (listname.match(/formprefs$/) != null) {
							lineKeyRegexp = new RegExp('templatename$');
							valueKeyRegexp = new RegExp('(preferred|restricted|enabled|stored)$');

						} else if(listname == "preferences") {
							lineKeyRegexp = new RegExp('^preference$');
							valueKeyRegexp = new RegExp('^prefvalue$');
						} else if(listname == "translations") {
							valueKeyRegexp = new RegExp('^locale$');
						}

						for(var linekey in lines) {
							
							var prefid = listname.replace("formprefs","preferred");
							if(linekey == "currentline") {
								delete roleObj['sublists'][listname][linekey];
							} else if(listname.match(/formprefs$/) != null && (!lines[linekey].hasOwnProperty(prefid) || lines[linekey][prefid] != "T")) {
								delete roleObj['sublists'][listname][linekey];
							} else {
								var obj = lines[linekey];
								var newkey = null;
								var valuekeys = [];
								
								//Get record IDs, this will be substituted with script id later.
								if(listname == "custrecordmach") {
									custrecords.push(roleObj['sublists'][listname][linekey]['custrecord']);
								} else  if(listname == "tranmach") {
									var tranpermkey = roleObj['sublists'][listname][linekey]['permkey1']
									if(tranpermkey && tranpermkey.match(/^[0-9]*$/) != null){
										customtransactions.push(roleObj['sublists'][listname][linekey]['permkey1']);
									}
									
								}

								//Get Key Attribute and Value Attribute/s
								for(var o in obj) {
									//log.debug("o",o + " " + lineKeyRegexp);
									if(lineKeyRegexp != null && o.match(lineKeyRegexp) != null) {
										newkey = obj[o];
									} 
								
									if(valueKeyRegexp != null && o.match(valueKeyRegexp) != null) {
										valuekeys.push(o);
									}
									
								}
								log.debug("newkey",newkey);
								log.debug("valuekeys",valuekeys)
								//Restructure Key - Value 
								if(newkey != null) {
									if(valuekeys.length == 1) {
										var level = roleObj['sublists'][listname][linekey][valuekeys[0]];
										level = getPermLevel(level);
										roleObj['sublists'][listname][newkey] = level;
									} else if(valuekeys.length > 1) {
										var linevalues = {}
										for(v = 0; v < valuekeys.length; v++) {
											var vkey = valuekeys[v];
											linevalues[vkey] = roleObj['sublists'][listname][linekey][vkey];
										} 
										roleObj['sublists'][listname][newkey] = linevalues;
									}
								} else if(valuekeys.length > 0) {
									for(v = 0; v < valuekeys.length; v++) {
										var vkey = valuekeys[v];
										vkey = roleObj['sublists'][listname][linekey][vkey];
										roleObj['sublists'][listname][vkey] = vkey;
									}
								}

								delete roleObj['sublists'][listname][linekey];
							}	
						}

						if(custrecords.length > 0) {
							var customRecScriptIDs = {};
							var customRecSearch = search.create({
				                type: 'customrecordtype',
				                columns:[ {name:"scriptid"},{name:"internalid",sort:"ASC"}],
				                filters : [ ['isinactive', 'is', 'F'],'AND', ['internalid', 'anyof', custrecords ]]
				            });

				            var recSearchResult = customRecSearch.run().getRange({ start: 0, end: 1000 });
				            for(var i = 0; recSearchResult[i] != null; i++) {
				            	var recInternalId = recSearchResult[i].getValue({ name: 'internalid' });
                    			var recScriptId = recSearchResult[i].getValue({ name: 'scriptid' });

                    			customRecScriptIDs[recInternalId] = recScriptId;
				            }

				            if(Object.keys(customRecScriptIDs).length > 0) {
				            	var custrecordmach = roleObj['sublists']['custrecordmach'];
				           		for(var c in custrecordmach) {
				           			var recid = c;
				           			if(customRecScriptIDs.hasOwnProperty(recid)) {
				           				var scriptid = customRecScriptIDs[recid];
				           				roleObj['sublists']['custrecordmach'][scriptid] = roleObj['sublists']['custrecordmach'][c];
				           				delete roleObj['sublists']['custrecordmach'][c];
				           			}


				           		}
				            }
						}


						if(customtransactions.length > 0) {
			           		for(var t = 0 ; t < customtransactions.length; t++) {
			           			try {
			           				var tranID = customtransactions[t];
			           				if(roleObj['sublists']['tranmach'].hasOwnProperty(tranID)) {
			           					var recordObj = record.load({type: 'customtransactiontype', id: tranID});
				           				var scriptid = recordObj.getValue({ fieldId: 'scriptid' });
				           				if(scriptid) {
				           					roleObj['sublists']['tranmach'][scriptid] = roleObj['sublists']['tranmach'][tranID];
				           					delete roleObj['sublists']['tranmach'][tranID];
				           				}
				           				
				           			}
			           			} catch(e) {
			           				log.debug("customtransactions",e);
			           			}
			           			
			           		}
				            
						}
					}
				}

				cleanjsonString = JSON.stringify(roleObj);
			} catch(e) {
				log.audit("getRoleObjectJSON",e);
			}

			return cleanjsonString;		
		}

		function getPermLevel(level) {
			try {
				switch(level) {
					case "0" :
						level = "None";
						break;
					case "1" :
						level = "View";
						break;
					case "2" :
						level = "Create";
						break;
					case "3" :
						level = "Edit";
						break;
					case "4" :
						level = "Full";
						break;
					default:
						//do nothing
						break;
				}
			} catch(e) {

			}
			return level;
		}

		function getSearchObjectJSON(searchObj,searchName,sSchedule,searchFieldNames) {
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
				if(searchFieldNames) {
					searchJSON.field_names = searchFieldNames;
				}
				

				cleanjsonString = JSON.stringify(searchJSON);
			} catch(e) {
				log.debug("getSearchObjectJSON",e)
			}

			return cleanjsonString;

		}

		function getWorkflowObjectJSON(workFlowObj) {
			var cleanjsonString = "";
			try {
				var workflowRecString = JSON.stringify(workFlowObj);
				workflowRecString = workflowRecString.replace(/(,)?\"sys_parentid\":\".*?\"/g,"").replace(/(,)?\"sys_id\":\".*?\"/g,"").replace(/(,)?\"_eml_nkey_\":\".*?\"/g,"").replace(/(,)?\"nsapiCT\":\".*?\"/g,"").replace(/(,)?\"entryformquerystring\":\".*?\"/g,"").replace(/(,)?\"(schedulemonthlydowweek|scheduleyearlydomday|schedulemonthlydomday|scheduleyearlydommonth|scheduledailyperiod|scheduleyearlydowweek|scheduleyearlydowday|scheduleweeklyperiod|schedulemonthlydomperiod|scheduleyearlydowmonth|schedulemonthlydowperiod|schedulemonthlydowday)\":\".*?\"/g,"").replace(/(,)?\"(field|state)url\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
				var recObj = JSON.parse(workflowRecString);
				delete recObj['type'];
				delete recObj['isDynamic'];
				if(recObj.hasOwnProperty('fields')) {
					for(var f  in recObj["fields"]) {
						var fieldvalue = recObj["fields"][f];
						try {
							fieldvalue = workFlowObj.getText({ fieldId: f});
						} catch(e) {
							//log.debug("cleanObjectJSON",e);
						}
						recObj[f] = fieldvalue;
					}

					delete recObj["fields"];
				}
				if(recObj.hasOwnProperty('id')) {
					delete recObj['id'];
				}
				if(recObj['initonschedule'] && recObj['initonschedule']== "Event Based") {
					delete recObj['schedulefrom'];
				}
				delete recObj['initcondition'];

				if(recObj.hasOwnProperty('initconditioninbuilder')) {
					recObj.initconditioninbuilder = recObj.initconditioninbuilder.replace(/((\d{1,2}|\d{4})(\/|-|\.)\d{1,2}(\/|-|\.)(\d{4}|\d{1,2}))|(\d{1,2}(-|\s)(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?){1}(-|,\s)\d{4})/gi,'');
				}
				if(recObj.hasOwnProperty('initconditionformula')) {
					recObj.initconditionformula = recObj.initconditionformula.replace(/((\d{1,2}|\d{4})(\/|-|\.)\d{1,2}(\/|-|\.)(\d{4}|\d{1,2}))|(\d{1,2}(-|\s)(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?){1}(-|,\s)\d{4})/gi,'');
				}

            	log.debug('wfstring',JSON.stringify(recObj))

				recObj.fields = {};
				if(recObj.hasOwnProperty('sublists')) {
					for (var key in recObj.sublists.fields) {
						var fieldId = recObj.sublists.fields[key].id;
						if (fieldId) {
							var lineObj =  recObj.sublists.fields[key];
							var fieldKey = lineObj.internalid;
							recObj.fields[fieldKey] = {label:lineObj.label,fieldinactive:lineObj.fieldinactive,fieldstored:lineObj.fieldstored,fieldtype:lineObj.fieldtype};
							
						}

					}

					

					recObj.states = {};
					for (var key in recObj.sublists.states) {
						var stateKey = recObj.sublists.states[key].name;
						var stateid = recObj.sublists.states[key].stateid;
						var wfstate = record.load({ type: 'workflowstate', isDynamic: false , id: stateid });
						var statestring= JSON.stringify(wfstate);
						statestring = statestring.replace(/(,)?\"(sys_parentid|type|isDynamic|sys_id|nsapiCT|_eml_nkey_|_multibtnstate_|selectedtab|ifrmcntnr|rightpanetitle|type|externalid|whence|customwhence|entryformquerystring|workflow|positionx|positiony|actionname|scriptid)\":\".*?\"/g,"").replace(/\{,\"/g,'{"');

						var stateObj = JSON.parse(statestring);
						if(stateObj.hasOwnProperty('fields')) {
							for(var f  in stateObj.fields) {
								stateObj[f] = stateObj.fields[f];
							}
							delete stateObj["fields"];
						}
						delete stateObj['isDynamic'];
						delete stateObj['id'];
						stateObj.actions = {};
						stateObj.transitions = {};
						stateObj.fields = {};
						stateObj.actionsctr = {};
						stateObj.transitionsctr = {};
						log.debug('stateObjs',JSON.stringify(stateObj))
						if(stateObj.hasOwnProperty('sublists')) {
							log.debug('stateObjs1',JSON.stringify(stateObj))
							if(stateObj.sublists.hasOwnProperty('actions')) {
								for (var a in stateObj.sublists.actions) {
									var actionInternalId = stateObj.sublists.actions[a].actionid;
									var actiontype = stateObj.sublists.actions[a].actiontype;
									if (actiontype.indexOf("ACTION")==-1)  //action not found
			   							actiontype = actiontype + 'ACTION';
									try{
								   		var actionRecord = record.load({ type: actiontype , isDynamic: true , id: actionInternalId });
								   		var actionString = JSON.stringify(actionRecord);
								   		actionString = actionString.replace(/(,)?\"(sys_parentid|type|isDynamic|sys_id|nsapiCT|_eml_nkey_|_multibtnstate_|selectedtab|ifrmcntnr|rightpanetitle|type|externalid|whence|customwhence|entryformquerystring|workflow|scripttype|oldinactive|originalstate|scriptid|fieldrecordtype|condition|customrecordtype|valueselect|state|group)\":\".*?\"/g,"").replace(/(,)?\"recordtype\":\"(\-)?\d*\"/g,"").replace(/(,)?\"id\":\"(\-)?\d*\"/g,"").replace(/\{,\"/g,'{"');
								   		var actionObj = JSON.parse(actionString);
								   		if(actionObj.hasOwnProperty('fields')) {
											for(var f  in actionObj.fields) {
												actionObj[f] = actionObj.fields[f];
											}
											delete actionObj["fields"];
										}
										if(actionObj.hasOwnProperty('conditionsavedsearch')) {
								   			actionObj.conditionsavedsearch = actionRecord.getText({fieldId: 'conditionsavedsearch'});

								   		}
								   		
								   		if(actionObj.hasOwnProperty('initiatedworkflow')) {
								   			actionObj.initiatedworkflow = actionRecord.getText({fieldId: 'initiatedworkflow'});
								   		}

								   		if(actionObj.hasOwnProperty('sender')) {
								   			actionObj.sender = actionRecord.getText({fieldId: 'sender'});
								   		}

								   		if(actionObj.hasOwnProperty('recipient')) {
								   			actionObj.recipient= actionRecord.getText({fieldId: 'recipient'});
								   		}

								   		if(actionObj.hasOwnProperty('campaignevent')) {
								   			actionObj.campaignevent = actionRecord.getText({fieldId: 'campaignevent'});
								   		}

								   		if(actionObj.hasOwnProperty('targetpage')) {
								   			actionObj.targetpage = actionRecord.getText({fieldId: 'targetpage'});
								   		}

								   		if(actionObj.hasOwnProperty('template')) {
								   			actionObj.template = actionRecord.getText({fieldId: 'template'});
								   		}
								   		if(actionObj.hasOwnProperty('conditionformula')) {
											actionObj.conditionformula  = actionObj.conditionformula.replace(/((\d{1,2}|\d{4})(\/|-|\.)\d{1,2}(\/|-|\.)(\d{4}|\d{1,2}))|(\d{1,2}(-|\s)(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?){1}(-|,\s)\d{4})/gi,'');
										}

								   		if(actionObj.hasOwnProperty('sublists')) {
								   			var tempSublists = {};
								   			for (var s in actionObj.sublists) {
												if(s.indexOf('settings') != -1 || s == "translations") {
													var sublist = actionObj.sublists[s];
													var sublistvalues = {};
													for (var line in sublist) {
														if(line != "currentline") {
															var rawLine = actionObj.sublists[s][line];
															var cleanLine = {};
															for (var key2 in rawLine) {
																if (key2.match(/^sys_/i) == null) {
																	cleanLine[key2] = rawLine[key2];
																}
															}
															sublistvalues[line] = cleanLine;
														}
													}
													tempSublists[s] = sublistvalues;
												}
											}
											if (Object.keys(tempSublists).length > 0)
												actionObj.sublists = tempSublists;
								   		}

								   		var actionKey = actionObj.actiontypename;
										//Find similar action names and update counter
										var actionsctr = stateObj.actionsctr;
										if(actionsctr && actionsctr.hasOwnProperty(actionKey)) {
											var currentcount = stateObj.actionsctr[actionKey] + 1;
											stateObj.actionsctr[actionKey] = currentcount;
											actionKey += " " + currentcount;
										} else{
											stateObj.actionsctr[actionKey] = 0;
										}
										delete actionObj['isDynamic'];
										stateObj.actions[actionKey] = actionObj;

								   	}catch(e){
								   		log.debug('err action',e)
								   	}
								}
							}
							log.debug('stateObjs2',JSON.stringify(stateObj))
							if(stateObj.sublists.hasOwnProperty('transitions')) {
								for(var t in stateObj.sublists.transitions) {
									var transitionId = stateObj.sublists.transitions[t].transitionid;
									var transitionRec = record.load({type:"workflowtransition",id:transitionId,isDynamic: true});
									var transitionKey = transitionRec.getText({fieldId: 'tostate'});
									var transitionString = JSON.stringify(transitionRec);
									transitionString = transitionString.replace(/(,)?\"(sys_parentid|type|isDynamic|sys_id|nsapiCT|_eml_nkey_|_multibtnstate_|selectedtab|ifrmcntnr|rightpanetitle|type|id|externalid|whence|customwhence|entryformquerystring|workflow|positionx|positiony|condition|scriptid)\":\".*?\"/g,"").replace(/\{,\"/g,'{"');


									var transitionObj = JSON.parse(transitionString);
									if(transitionObj.hasOwnProperty('fields')) {
										for(var f  in transitionObj.fields) {
											transitionObj[f] = transitionObj.fields[f];
										}
										delete transitionObj["fields"];
									}
									transitionObj.tostate = transitionKey
									if(stateObj.transitionsctr.hasOwnProperty(transitionKey)) {
										var currentcount = stateObj.transitionsctr[transitionKey] + 1;
										stateObj.transitionsctr[transitionKey] = currentcount;
										transitionKey += " " + currentcount;
									} else {
										stateObj.transitionsctr[transitionKey] = 0;
									}
									//Replace condition search id with name
									if(transitionObj.hasOwnProperty('conditionsavedsearch')) {
										transitionObj.conditionsavedsearch = transitionRec.getText({fieldId: 'conditionsavedsearch'});
									}

									if(transitionObj.hasOwnProperty('conditionformula')) {
										transitionObj.conditionformula  = transitionObj.conditionformula.replace(/((\d{1,2}|\d{4})(\/|-|\.)\d{1,2}(\/|-|\.)(\d{4}|\d{1,2}))|(\d{1,2}(-|\s)(Jan(uary)?|Feb(ruary)?|Mar(ch)?|Apr(il)?|May|Jun(e)?|Jul(y)?|Aug(ust)?|Sep(tember)?|Oct(ober)?|Nov(ember)?|Dec(ember)?){1}(-|,\s)\d{4})/gi,'');
									}

									delete transitionObj['state'];
									delete transitionObj['buttonaction'];
									delete transitionObj['isDynamic'];
									stateObj.transitions[transitionKey] = transitionObj;
								}
							}

							log.debug('stateObjs3',JSON.stringify(stateObj))
							if(stateObj.sublists.hasOwnProperty('fields')) {
								log.debug('stateObjs3.1',JSON.stringify(stateObj))
								for (var f in stateObj.sublists.fields) {
									var stateFieldId = stateObj.sublists.fields[f].id;
									if (stateFieldId) {
										var stateFieldRec = record.load({type:"workflowstatecustomfield",id:stateFieldId});
										var stateFieldString = JSON.stringify(stateFieldRec);
										stateFieldString = stateFieldString.replace(/(,)?\"(sys_parentid|type|isDynamic|sys_id|nsapiCT|_eml_nkey_|_multibtnstate_|selectedtab|ifrmcntnr|rightpanetitle|type|id|externalid|whence|customwhence|entryformquerystring|workflow|positionx|positiony|condition|scriptid|owner|staticlistrecordtype|fldcurselrectype|disclaimer|customfieldseqnum|fieldseqnum|numberingcurrentnumber|fieldid|sourcefilterreferencedbycount|sourcefromrecordtype|fldselecttype|fldfiltersel|internalid|#|sourcelistrecordtype|wfstate)\":\".*?\"/g,"").replace(/(,)?\"(field|child|formedit|formname)url\":\".*?\"/g,"").replace(/\{,\"/g,'{"');
										var stateFieldObj = JSON.parse(stateFieldString);
										stateFieldObj = stateFieldObj.fields;
										var fKey = stateFieldObj.label;
										delete stateFieldObj['isDynamic'];
										stateObj.fields[fKey] = stateFieldObj;

									}
									
								}
							}
						}
						
						log.debug('stateObjs3.5',JSON.stringify(stateObj))
						delete stateObj["sublists"];
						log.debug('stateObjs4.0',JSON.stringify(stateObj))
						delete stateObj['actionsctr'];
						delete stateObj['transitionsctr'];
						log.debug('stateObjs4',JSON.stringify(stateObj))
						recObj.states[stateKey] = stateObj;

					}

					delete recObj['sublists'];
				}
				
				cleanjsonString = JSON.stringify(recObj);
				

			} catch(e) {
				log.debug("getWorkflowObjectJSON",e)
			}
			return cleanjsonString;
		}

		function getMassUpdateObjectJSON(custInternalId,searchType) {
			var cleanjsonString = "";
			try {
				var searchObj;
				try {
					searchObj = search.load({type:searchType,id:custInternalId});
				} catch (e) {								
					searchObj = search.load({id:custInternalId});
				}
				searchJSON = JSON.parse(JSON.stringify(searchObj))
				if(searchJSON.hasOwnProperty('id')) {
					delete searchJSON['id'];
				}
			
				if(searchJSON.hasOwnProperty('filters') && searchJSON.filters) {
					for(var f in searchJSON.filters) {
						var line = searchJSON.filters[f];
						if(line.hasOwnProperty('values') && typeof line.values === "object") {
							searchJSON.filters[f]['values'] = JSON.stringify(line.values);
						}
					}
				}
				delete searchJSON['title'];
				delete searchJSON['scriptId'];
				cleanjsonString = JSON.stringify(searchJSON);
			} catch(e) {
				log.debug("getMassUpdateObjectJSON",e)
			}
			return cleanjsonString;
		}

		function getBundleObjectJSON(custstring) {
			var cleanjsonString = "";
			try {
				log.debug("custstring",custstring)
				if(custstring) {
					var bundleobj = {}
					var custpair = custstring.split(',');
					var custobj = {};
					for(var c = 0; c < custpair.length; c++) {
						var key = custpair[c].split(':')[0];
						custobj[key] = custpair[c].split(':')[1];
					}
					log.debug("custobj",JSON.stringify(custobj))
					if(custobj.Name) {
						bundleobj.name = custobj.Name;
					}

					if(custobj.Bundle_ID) {
						bundleobj.bundleID = custobj.Bundle_ID;
					}

					if(custobj.Version) {
						bundleobj.version = custobj.Version;
					}

					if(custobj.Managed) {
						bundleobj.managed = custobj.Managed;
					}

					if(custobj.Installed_From) {
						bundleobj.installed_from = custobj.Installed_From;
					}

					if(custobj.Installed_By) {
						bundleobj.installed_by = custobj.Installed_By;
					}

					if(custobj.Installed_On) {
						bundleobj.installed_on = custobj.Installed_On;
					}

					if(custobj.Last_Update) {
						bundleobj.last_update = custobj.Last_Update;
					}

					cleanjsonString = JSON.stringify(bundleobj);
				}
			} catch(e) {
				log.debug("getBundleObjectJSON",e)
			}
			return cleanjsonString;
		}

		return {
		     onAction: onAction
		}
	}
);