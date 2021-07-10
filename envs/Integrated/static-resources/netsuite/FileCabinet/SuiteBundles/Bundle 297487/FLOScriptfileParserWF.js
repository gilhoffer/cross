var scriptlist;//list of script customization records retained over time
var scriptarch;//used to store the body of the scripts processed during each pass to enable archiving of previous versions
var libscriptarch;
var thisCust;//used to store the particular customization being updated at this time
var thisCntxt=nlapiGetContext();//the execution context of the script
var newcount=0;
var scriptid=0;




function spiderScriptFilesSS() {
    /**
     * Module Description
     * 
     * Version    Date            Author           Remarks
     * 1.00       22 Jan 2014     markwalker
     * 2.00     21 Jun 2014     markwalker    Added: 1. Store reference copy of the code, 2.  Check if code changed 3. Check execution log data 4. check library files as well
     */
    /**
     * @param {nlobjRequest} request Request object
     * @param {nlobjResponse} response Response object
     * @returns {Void} Any output is written via response object
     */
    var custworkflow_flo_customization_ids = nlapiGetContext().getSetting('SCRIPT', 'custscript_flo_parser_param_custid');
    returnValue = custworkflow_flo_customization_ids;
    try {
        var remainingUsage = thisCntxt.getRemainingUsage(); //tracking the remaining usage to see if we need to reschedule execution
        //nlapiLogExecution("debug","initialusage",remainingUsage)
        //get all scripts
        var t1 = new Date();

        var defaultsearch = 'customsearch_flo_script_srch';
        var respider = "F";

        nlapiLogExecution("debug", "defaultsearch ", "defaultsearch.... " + defaultsearch);


        nlapiLogExecution("debug", "custworkflow_flo_customization_ids ", custworkflow_flo_customization_ids);
        //Exit if there are no Ids
        if (!custworkflow_flo_customization_ids || custworkflow_flo_customization_ids == "EMPTY") {
            return 'EMPTY';
        } else {
            custworkflow_flo_customization_ids = custworkflow_flo_customization_ids.split(',');
        }

        var scriptCusts = [];
        var filters = [];
        filters.push(new nlobjSearchFilter('internalid', null, 'anyof', custworkflow_flo_customization_ids));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', "F"));
        var scriptCustomizations = nlapiSearchRecord("customrecord_flo_customization", "customsearch_flo_cust_script_search", filters, null);
        for (var x = 0; scriptCustomizations != null && scriptCustomizations[x] != null; x++) {
            var scriptcols = scriptCustomizations[x].getAllColumns();
            var scriptid = scriptCustomizations[x].getValue(scriptcols[5]);
            var custid = scriptCustomizations[x].getId();
            scriptCusts[scriptid] = custid;
        }

        //Exit if there are no script customizations
        if (scriptCusts.length == 0) {
            return returnValue;
        }

        var ssfilters = new Array();
        ssfilters.push(new nlobjSearchFilter('internalid', null, 'anyof', Object.keys(scriptCusts)));
        var scripts = null;
        try {
            scripts = nlapiSearchRecord("script", defaultsearch, ssfilters, null);
        } catch (e) {
            nlapiLogExecution("debug", "ERROR", e);
            nlapiLogExecution("AUDIT", "Script END", "Error Occurred");
        }
        //loop through the scripts retrieved
        for (s = 0; scripts != null && scripts[s] != null; s++) {
        	try {
	            var t2 = new Date()
	            var dif = t1.getTime() - t2.getTime()
	            var Minutes_from_T1_to_T2 = dif / 1000 / 60;
	            var Minutes_from_T1_to_T2 = Math.abs(Minutes_from_T1_to_T2);

	            if (remainingUsage < 100 || Minutes_from_T1_to_T2 > 4) {
	                returnValue = "ERROR";
	                break;
	            }
	            //initialize script archive field
	            scriptarch = "";
	            startusage = thisCntxt.getRemainingUsage();
	            //nlapiLogExecution("debug","startusage",startusage)

	            columns = scripts[s].getAllColumns();
	            nlapiLogExecution("debug", "Name:" + scripts[s].getValue(columns[1]) + "<br>");
	            scriptid = scripts[s].getId();

	            nlapiLogExecution("debug", "scriptgetIDid", scriptid);

	            var scriptFileName = scripts[s].getText(columns[7]);
	            var scriptFileId = scripts[s].getValue(columns[7]);

	            //look for existing customization record
	            //load list of existing script customization records and store for reuse on each script
	            var myFilter = [];
	            myFilter.push(new nlobjSearchFilter('custrecord_flo_int_id', null, 'equalto', scriptid));
	            try {
	                scriptlist = nlapiSearchRecord("customrecord_flo_customization", "customsearch_flo_cust_script_search", myFilter, null);
	            } catch (e) {
	                nlapiLogExecution("debug", "ERROR", e);
	                nlapiLogExecution("AUDIT", "Search Record", "customrecord_flo_customization," + "customsearch_flo_cust_script_search," + "ID=" + scriptid);
	                continue;
	            }


	            var foundScript = scriptCusts[scriptid]; //variable used to track whether a script customization record was found.


	            nlapiLogExecution("debug", "foundScript", foundScript);

	            //if no script cust record is found - create one. - if previously checked, skip it.
	            if ((foundScript == "" | scriptlist == null | (scriptlist != null && foundScript != ""))) {

	                if (foundScript == "") {
	                    continue;
	                } else {
	                    nlapiLogExecution("debug", "<br>foundscript" + foundScript + "<br>")
	                    thisCust = nlapiLoadRecord("customrecord_flo_customization", foundScript);
	                    nlapiLogExecution("debug", "<br>foundscript" + foundScript + "<br>")

	                }

	                //Get Script Metadata - comments, fields, functions, apicalls, debug tags
	                var origmetadata = getScriptMetaData(scriptFileId, false)
	                var metadata = origmetadata.split("##");

	                //update the record
	                if (thisCust != null) {

	                	var auditTag = "";

	                    //SET # of attempts script parser processed this script
	                    var curattempt = thisCust.getFieldValue("custrecord_flo_attempt");
	                    if (curattempt != null && curattempt != "" && !isNaN(curattempt)) {
	                        thisCust.setFieldValue("custrecord_flo_attempt", Number(curattempt) + 1);
	                    } else {
	                        thisCust.setFieldValue("custrecord_flo_attempt", 1);
	                    }

	                    //SET retrieval debug
	                    if (origmetadata == "  ## ## ##  ") {
	                        var curretdebug = thisCust.getFieldValue("custrecord_flo_retrieval_debug");
	                        if (curretdebug == null || curretdebug == "") {
	                            thisCust.setFieldValue("custrecord_flo_retrieval_debug", "Locked");
	                        } else if (curretdebug == "Locked") {
	                            thisCust.setFieldValue("custrecord_flo_retrieval_debug", "TIMED OUT");
	                        }

	                    }

	                    //Check for a library file
	                    nlapiLogExecution('debug', 'Check for a library file', "Check for a library file");
	                    var allLibraries = processLibraryFiles(thisCust, scriptFileId);
	                    nlapiLogExecution('debug', 'allLibraries', allLibraries);
	                    var newScriptLibraries = getScriptLibraries(allLibraries);
	                    //if a script is found, load the record
	                    nlapiLogExecution('debug', 'scriptFileName', scriptFileName);
	                    nlapiLogExecution('debug', 'scriptFileId', scriptFileId);

	                    var filessfilters = [];

	                    filessfilters.push(new nlobjSearchFilter('internalid', null, 'is', scriptFileId));
	                    var fileResult = null;
	                    try {
	                        fileResult = nlapiSearchRecord(null, 'customsearch_flo_script_file_search_2', filessfilters);
	                    } catch (e) {
	                        nlapiLogExecution("debug", "ERROR", e);
	                        nlapiLogExecution("AUDIT", "Search Record", "customsearch_flo_script_file_search_2," + "name=" + scriptFileName);
	                    }
	                    var filesize = null;
	                    var filedate = null;
	                    var filesizebytes = null;
	                    var old_file_size = thisCust.getFieldValue("custrecord_flo_script_file_size");
	                    var old_file_sizebytes = thisCust.getFieldValue("custrecord_flo_script_filebytes");
	                    if (fileResult != null && fileResult.length > 0) {

	                        var fileCols = fileResult[0].getAllColumns();
	                        filedate = fileResult[0].getValue(fileCols[1]);
	                        var filediff = fileResult[0].getValue(fileCols[4]);
	                        filesize = fileResult[0].getValue(fileCols[6]);
	                        filesizebytes = fileResult[0].getValue(fileCols[7]);

	                        nlapiLogExecution('debug', 'filedate SCRIPT', scriptFileName + ":" + filedate);
	                        nlapiLogExecution('debug', 'filedate SCRIPT', scriptFileName + ":" + nlapiDateToString(new Date(filedate)));
	                    }
	                    thisCust.setFieldValue("custrecord_flo_script_file_date", filedate)

	                    thisCust.setFieldValue("custrecord_flo_script_file_size", filesize)
	                    thisCust.setFieldValue("custrecord_flo_script_filebytes", filesizebytes)

	                    //check whether metadata has changed
	                    var old_scriptfields = thisCust.getFieldValue("custrecord_flo_script_fields");
	                    var old_raw_metadata = thisCust.getFieldValue("custrecord_flo_script_raw_metadata");
	                    if (old_raw_metadata) old_raw_metadata = old_raw_metadata.trim();

	                    var new_raw_metadata = metadata.join();
	                    if (new_raw_metadata) new_raw_metadata = new_raw_metadata.trim();

	                    var metahaschanged = false;
	                    if (old_raw_metadata != new_raw_metadata || old_file_size != filesize || filesizebytes != old_file_sizebytes) {
	                        nlapiLogExecution("debug", "old_raw_metadata", old_raw_metadata);
	                        nlapiLogExecution("debug", "new metadata", new_raw_metadata);
	                        nlapiLogExecution("debug", "updating values")
	                        //store script metadata in the raw metadata field
	                        thisCust.setFieldValue("custrecord_flo_script_raw_metadata", metadata.join());
	                        //set Script Metadata
	                        //metadata1=getScriptMetaData(scripts[s].getValue(columns[7]));
	                        nlapiLogExecution("debug", "custfields:" + metadata[0] + "<br>")
	                        thisCust.setFieldValue("custrecord_flo_script_fields", metadata[0]);
	                        thisCust.setFieldValue("custrecord_flo_script_comments", unescape(metadata[1]).substring(0, 3999));
	                        nlapiLogExecution("debug", "Functions:" + metadata[2] + "<br>");
	                        thisCust.setFieldValue("custrecord_flo_script_functions", metadata[2].substring(0, 3999));
	                        nlapiLogExecution("debug", "APIs:" + metadata[3] + "<br>");
	                        thisCust.setFieldValue("custrecord_flo_script_apis", unescape(metadata[3]).substring(0, 3999));
	                        thisCust.setFieldValue("custrecord_flo_script_filecontent_hash", metadata[5]);

	                        nlapiLogExecution("debug", "APICHECK:" + thisCust.getFieldValue("custrecord_script_apis") + "<br>")

	                        if (metadata[0] != old_scriptfields) {
	                            //reset make join date to trigger the join script.
	                            thisCust.setFieldValue("custrecord_flo_make_join_date", '');
	                        }

	                        if (metadata[4]) {
	                        	auditTag = metadata[4].substring(0, 299);
	                            //thisCust.setFieldValue("custrecord_flo_audit_logging", metadata[4].substring(0, 299));
	                            //average run time is now set in FLO Script Monitor Result Data SS
	                            //thisCust.setFieldValue("custrecord_flo_script_avg_run_time",parseInt(metadata[4].split("**")[1]));
	                        }

	                        try {
	                            thisCust = archiveScript(thisCust, scriptarch);
	                        } catch (e) {
	                            nlapiLogExecution("debug", "Archive Script debug");

	                        }
	                        metahaschanged = true;
	                    } //end of check for metadata change

	                    //++ NS-369
	                    var prevObjectJSON = thisCust.getFieldValue('custrecord_flo_object_json');
	                    var hashString = '';
	                    var objectJSON = '';
	                    try {
	                        objectJSON = getObjectJSON(thisCust, newScriptLibraries, scripts[s]);
	                        if (objectJSON) {
	                            objectJSON = objectJSON.replace(/(,)?\"owner\":\".*?\"/g, "").replace(/(,)?\"scriptfiledate\":\".*?\"/g, "").replace(/\{,\"/g, '{"');
	                            hashString = nlapiEncrypt(objectJSON, "sha1");

	                        }


	                        nlapiLogExecution("debug", "objectJSON", objectJSON);

	                        thisCust.setFieldValue("custrecord_flo_object_json", objectJSON)
	                        thisCust.setFieldValue("custrecord_flo_object_hash", hashString)

	                    } catch (e) {
	                        nlapiLogExecution("debug", "objectJSON", e);
	                    }
	                    //-- NS-369

	                    if (metahaschanged || prevObjectJSON != objectJSON) {
	                        try {

	                        	thisCust.setFieldValue("custrecord_flo_audit_logging", auditTag);

	                            var spiderDate = nlapiDateToString(new Date());

	                            thisCust.setFieldValue("custrecord_flo_make_join_proc", "F")
	                            thisCust.setFieldValue("custrecord_flo_last_spider_date", spiderDate)


	                            sid = nlapiSubmitRecord(thisCust, true);
	                            nlapiLogExecution("debug", "<br>NEWID:" + sid + "<br>")
	                        } catch (e) {
	                            nlapiLogExecution("debug", "Update Script debug");
	                        }
	                    }



	                    //updateExecutionData(thisCust);

	                } //end of check for custRec


	                //Script Monitoring Code
	                //endusage=thisCntxt.getRemainingUsage();
	                //nlapiLogExecution("debug","endusage",endusage);
	                //remainingUsage=endusage+endusage-startusage;
	                nlapiLogExecution("debug", "thisCntxt.getRemainingUsage()", thisCntxt.getRemainingUsage());
	            } //end of loop through scripts
	        } catch (scriptsRetrievedException) {
                nlapiLogExecution("audit", "scriptsRetrievedException", scriptsRetrievedException);
            }
        } //end of check for previously checked scripts




    } catch (errmain) {
        nlapiLogExecution("AUDIT", "ERROR", errmain);
        returnValue = "ERROR";
    }

    return returnValue;
}

//++ NS-369
function checkActiveCustomizationsFromList(list) {
    var retActives = new Array();
    if (list && list.length > 0) {
        var ifilters = new Array();
        ifilters.push(new nlobjSearchFilter('internalid', null, "anyof", list));
        ifilters.push(new nlobjSearchFilter('isinactive', null, 'is', "F"));


        var activerecords = nlapiSearchRecord("customrecord_flo_customization", null, ifilters);
        if (activerecords) {
            for (var ar = 0; ar < activerecords.length; ar++) {
                retActives.push(activerecords[ar].getId());
            }
        }
    }
    return retActives;
}

function getScriptLibraries(libIds) {
    var scriptlibraries = [];
    try {
        if(libIds && libIds.length > 0) {
             var filefilters = [['internalid','anyof',libIds]];
             var filecolumn = [new nlobjSearchColumn('name')];

             var filesearch = nlapiSearchRecord('file', null, filefilters, filecolumn);
             if(filesearch) {
                for(var c = 0; filesearch[c] != null; c++) {
                    var lib_scriptid = filesearch[c].getValue('name');
                    if(scriptlibraries.indexOf(lib_scriptid) == -1) {
                         scriptlibraries.push(lib_scriptid);
                    }
                   
                }
                scriptlibraries.sort();
             }
        }
       
         nlapiLogExecution("debug","getScriptLibraries",scriptlibraries);
    } catch(e) {
    	nlapiLogExecution("debug","err getScriptLibraries",e);
    }
    return scriptlibraries;
}

function getObjectJSON(custRecord, libraryScriptIds,searchRes) {
    var cleanJSON = "";
    try {
        var cols = searchRes.getAllColumns();
        var scriptObj = {};
        scriptObj.name = searchRes.getValue('name');
        scriptObj.scriptid = searchRes.getValue(cols[1]);
        scriptObj.scripttype = searchRes.getValue(cols[2]);
        scriptObj.owner = searchRes.getText(cols[3]);
        scriptObj.description = searchRes.getValue(cols[5]);
        scriptObj.scriptfile = searchRes.getText(cols[7]);
        scriptObj.scriptfilehash = custRecord.getFieldValue('custrecord_flo_script_filecontent_hash');
        scriptObj.scriptfiledate = custRecord.getFieldValue('custrecord_flo_script_file_date');
        scriptObj.scriptfilesize = custRecord.getFieldValue('custrecord_flo_script_filebytes');
        if(scriptObj.scriptfilehash == "undefined") {
        	scriptObj.scriptfilehash = "";
        }
        scriptObj.libraries = {};
        if(libraryScriptIds && libraryScriptIds.length > 0) {
            for(var l = 0; l < libraryScriptIds.length; l++) {
                var libscriptid = libraryScriptIds[l];
                scriptObj.libraries[libscriptid] = libscriptid;

            }
        }

        cleanJSON = JSON.stringify(scriptObj);
    } catch(e) {

    }
    return cleanJSON;
}
//-- NS-369
//++ NS-413
function getIterationScriptID(fileContents) {
    var variableDeclarations = {};
    var scriptIds = [];
    var scriptIDsWithIteration = [];
    try {
        var ast = esprima.parseScript(fileContents);
        var scriptidRegex = RegExp('^cust[a-zA-Z_]+([0-9a-zA-Z_]*)');
        window.estraverse.traverse(ast, {
              enter: function(node){
                if(node.type == 'VariableDeclarator' && node.init)  {
                    var varname = node.id.name;
                    var varvalue = "";
                    if(node.init.type =='Literal') {
                        varvalue = node.init.value;
                        variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                    } else if(node.init.type =='ArrayExpression' && node.init.elements && node.init.elements.length > 0) {
                        for(var el = 0; el < node.init.elements.length; el++) {
                            if(node.init.elements[el].type == "Literal") {
                                varvalue = node.init.elements[el].value;
                                variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                            } else if(node.init.elements[el].type == "ObjectExpression" && node.init.elements[el].properties && node.init.elements[el].properties.length > 0){
                                var properties = node.init.elements[el].properties;
                                for(var pr = 0; pr < properties.length; pr++ ) {
                                    if(properties[pr].key && properties[pr].value && properties[pr].value.type == "Literal") {
                                        varvalue = "propname:" + properties[pr].key.name+'|propvalue:'+properties[pr].value.value;
                                        variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                                    }
                                }
                                
                            }
                        }

                    } else if(node.init.type =='ObjectExpression' && node.init.properties && node.init.properties.length > 0){
                        var properties = node.init.properties;
                        for(var el = 0; el < properties.length; el++) {
                            if(properties[el].value && properties[el].value.type == "Literal") {
                                varvalue = "propname:" + properties[el].key.name+'|propvalue:'+properties[el].value.value;
                                variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                            }
                            
                        }
                    } else if(node.init.type =='Identifier') {
                    	varvalue = 'Identifier:'+node.init.name;
                    	variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                    }
                    
                } else if(node.type == 'AssignmentExpression' && node.operator == "=" && node.right) {
                    var varname = node.left.name;
                    var varvalue = "";
                    if(node.right.type == 'Literal') {  
                        varvalue = node.right.value;
                        variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                    } else if(node.right.type == 'ArrayExpression' && node.right.elements && node.right.elements.length > 0) {
                        for(var el = 0; el < node.right.elements.length; el++) {
                            if(node.right.elements[el].type == "Literal") {
                                varvalue = node.right.elements[el].value;
                                variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                            } else if(node.right.elements[el].type == "ObjectExpression" && node.right.elements[el].properties && node.right.elements[el].properties.length > 0){
                                var properties = node.right.elements[el].properties;
                                for(var pr = 0; pr < properties.length; pr++ ) {
                                    if(properties[pr].key && properties[pr].value && properties[pr].value.type == "Literal") {
                                        varvalue = "propname:" + properties[pr].key.name+'|propvalue:'+properties[pr].value.value;
                                        variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                                    }
                                }
                                
                            }
                            
                        }
                    }  else if(node.right.type =='Identifier') {
                    	varvalue = 'Identifier:'+node.right.name;
                    	variableDeclarations = updateVariableList(varname,varvalue,variableDeclarations);
                    }

                } else if(node.type == 'BinaryExpression' && node.operator == "+" && node.left && node.left.type == "Literal" && node.left.value && scriptidRegex.test(node.left.value)) {
                    var scriptidprefix = node.left.value;
                    if(node.right.type == "Identifier") {
                        scriptidprefix += "+" + node.right.name;
                    } else if(node.right.type == "MemberExpression" && node.right.object){
                        if(node.right.object.type == "Identifier") {
                            scriptidprefix += "+" + node.right.object.name;
                        } else if(node.right.object.type == "MemberExpression" && node.right.property && node.right.property.type == "Identifier" && node.right.object.object && node.right.object.object.name){
                            scriptidprefix += "+" + node.right.object.object.name + 'propname:' + node.right.property.name;
                        }
                        
                        
                    }

                    if(scriptidprefix && scriptidprefix.indexOf("+") != -1 && scriptIDsWithIteration.indexOf(scriptidprefix) == -1) {
                        scriptIDsWithIteration.push(scriptidprefix);
                    }
                }
              }
            });
			try {
				if(Object.keys(variableDeclarations).length > 0) {
					for(var k in variableDeclarations) {
						var variableValues = variableDeclarations[k];
						//nlapiLogExecution("debug", "ast variableValues", variableValues)
						if(variableValues && variableValues.length > 0) {
							var identifierValues = variableValues.filter(function(el){  return el.indexOf('Identifier:') == 0; });
							//nlapiLogExecution("debug", "ast identifierValues", identifierValues)
							if(identifierValues && identifierValues.length > 0) {
								for(var iv = 0; iv < identifierValues.length; iv++) {
									var identifierName = identifierValues[iv];
									var pos = variableValues.indexOf(identifierName);
									if(pos > -1) {
										variableValues.splice(pos,1)
									}
									identifierName = identifierName.replace('Identifier:','');
									//nlapiLogExecution("debug", "ast identifierName " + identifierName,  variableDeclarations.hasOwnProperty(identifierName))
									if(identifierName && variableDeclarations.hasOwnProperty(identifierName) && variableDeclarations[identifierName] && variableDeclarations[identifierName].length > 0) {
										variableDeclarations[k] = variableValues.concat(variableDeclarations[identifierName]);
									}
									
								}
							}
						}
					}
				}
			} catch(e) {
				nlapiLogExecution("debug", "ast err variableDeclarations" , e)
			}
			
            nlapiLogExecution("debug", "ast scriptIDsWithIteration", scriptIDsWithIteration)
            if(scriptIDsWithIteration && scriptIDsWithIteration.length > 0 && Object.keys(variableDeclarations).length > 0) {
                for(var si = 0; si < scriptIDsWithIteration.length; si++) {
                    var statementArr = scriptIDsWithIteration[si].split('+');
                    var variablename = statementArr[1];
                    var scriptIdPref = statementArr[0];
                    var property = ""
                    if(variablename && variablename.indexOf('propname:') != -1) {
                        var variableparts = variablename.split('propname:');
                        variablename = variableparts[0];
                        property = variableparts[1];
                    }
                    if(scriptIdPref && variablename && variableDeclarations.hasOwnProperty(variablename)) {
                        
                        var iterationvalues = variableDeclarations[variablename];
                        if(iterationvalues && iterationvalues.length > 0) {
                            
                            for(var v = 0; v < iterationvalues.length; v++) {
                                var scriptIDReference = "";
                                var iterationValue = iterationvalues[v];
                                if(property) {
                                    //nlapiLogExecution("debug", "ast property", property);
                                    if(iterationValue.indexOf('propname') != -1) {
                                        var pairvalue = iterationValue.split('|');
                                        //nlapiLogExecution("debug", "ast pairvalue", pairvalue)
                                        if(pairvalue && pairvalue[0] && pairvalue[1]) {
                                            var propname = pairvalue[0].replace('propname:','');
                                            var propvalue = pairvalue[1].replace('propvalue:','');
                                            if(property == propname && propvalue != "null" && propvalue != "undefined") {
                                                scriptIDReference = scriptIdPref + propvalue.replace(/\s/g,"");
                                            }
                                        }
                                    }
                                    
                                    
                                } else if(iterationValue.indexOf('propname') == -1 && iterationValue != "null" && iterationValue != "undefined") {
                                    scriptIDReference = scriptIdPref + iterationvalues[v].replace(/\s/g,"");
                                }
                                
                                
                                if(scriptIDReference && scriptIds.indexOf(scriptIDReference)<0) {
                                    scriptIds.push(scriptIDReference);
                                }
                            }
                        }
                    }
                }
            }
        nlapiLogExecution("debug", "ast variableDeclarations", JSON.stringify(variableDeclarations))
    } catch(e) {
        nlapiLogExecution("debug", "ast error", e + fileContents)
    }
    nlapiLogExecution("debug", "ast scriptIds", scriptIds)
    return scriptIds;
}
//-- NS-413
function getScriptMetaData(file,islib)
{
  //Initial Variables
  custList="";
  var hashfile=""
  var origFileValue = "";
  //load file
 try
  {
	var docu=nlapiLoadFile(file)
	thisFile = docu.getValue();
	origFileValue = thisFile;
	//++ NS-413
	var MAXFILETOHASH = 100000; //10kb
	if (docu.getSize() > MAXFILETOHASH) {
		//retrieve hash from docu record if size > 100kb
		var hashres = nlapiSearchRecord(null, 'customsearch_flo_document_hash_search', new nlobjSearchFilter('internalid', null, 'is', file));
		if (hashres && hashres.length > 0) {
		    var hashcol = hashres[0].getAllColumns();
		    hashfile = hashres[0].getValue(hashcol[0]);
		} else {
		    //leave hashfile result empty/blank
		}
		//nlapiLogExecution('AUDIT','RETRIEVE HASH');
	} else {
		try {
		    hashfile = calcSHA1(thisFile);    
		}
		catch(e) {
		    // Ignore and continue with the rest of the function
		}
	}
		
	//hashfile=calcSHA1(thisFile);
	//-- NS-413
  } catch(e)
  {
    	return "  ## ## ##  "
  }
  if(!islib) {
  	scriptarch+="\n\n\n"+thisFile;
  } else {
	libscriptarch+="\n\n\n"+thisFile;
  }
  
   if (thisFile === null)
   		thisFile = "";

  //find comments
    //NS-767 ++
   // thisFile+="http://alerthttp://varhttp://nlapiLoghttp:///*test*/";
   // var doubleslashes=thisFile.match(/\/\//g).length;
   // var webaddresses=thisFile.match(/http:/ig).length;
   // var alerts=thisFile.match(/\/\/alert/g).length;
   // var vars=thisFile.match(/\/\/var/g).length;
   // var logs=thisFile.match(/\/\/nlapi/g).length;
    //NS-767 --
   //Remove all http:// && https:// to avoid mistaking for a comment
   thisFile = thisFile.replace(/(ht|f)tp(s)?:\/\//g,'');
   //Get ordinary comment lines
   var commentList=thisFile.match(/\/\/.+/g);
   commentString="";
   var removeComments = thisFile;

   if (commentList) {
	   for(cl=0;commentList[cl]!=null ;cl++)
	   {
			try {
				if(commentList[cl].indexOf("var")<2  && commentList[cl].lastIndexOf("/")<2 && commentList[cl].indexOf("alert")<2 && commentList[cl].indexOf("nlapi")<2 && commentList[cl].indexOf("system.netsuite")<2)
				{
					commentString+=commentList[cl]+"\r\n";
				}
				removeComments = removeComments.replace(commentList[cl],'');
				//nlapiLogExecution("debug",commentList[cl]+"<br>")
			} catch (removeCommentsException) {
	            nlapiLogExecution("debug", "removeCommentsException:", removeCommentsException);
	        }
	   }
   }
  //get any comment blocks
  if(thisFile.indexOf("/**")>=0)
  {
       blocks=thisFile.split("/**");
       for(b=0;blocks[b]!=null;b++)
       {

           commentBlock=blocks[b].substring(0,blocks[b].indexOf("*/"))+"\r\n";
           if(commentBlock.indexOf("{")<0 | commentBlock.indexOf("=")<0)
           {
                   commentString=commentBlock+commentString;
				   nlapiLogExecution("debug","commentBlock:",commentBlock)
					
                   removeComments = removeComments.replace(blocks[b].substring(0,blocks[b].indexOf("*/")),'');
				   
				   nlapiLogExecution("debug","removeComments:",removeComments)
            }
       }
   }

   //nlapiLogExecution("debug","COMMENTS:"+commentString+"<br>")
    //NS-767 ++
   //comments=doubleslashes-webaddresses-vars-alerts-logs+1;
    //NS-767 --
  //nlapiLogExecution("debug",doubleslashes+"--"+webaddresses+"--"+alerts+"--"+vars+"--"+logs+"--"+comments+"<br>")
  //find number of lines
  var lines=thisFile.match(/\n/g);
  
  var debuglogs=getdebugLogs(thisFile);
   
  //get All functions
  //++ NS-413
  var functions=thisFile.match(/(function [a-z0-9_\$]+)\(/ig);
  //-- NS-413
  functionList="";
  for(f=0;functions!=null && functions[f]!=null;f++)
  {functionList+=functions[f].substring(9,functions[f].length-1)+",";}

//Get all fields, searches, custom records and functions
nlapiLogExecution("debug","removeComments:",removeComments)
//Remove unnecessary string
//NS-767 ++
//removeComments = removeComments.replace("http://alerthttp://varhttp://nlapiLoghttp:///*test*/","");
//NS-767 --

/*var res = ","+removeComments.match(/nlapi[a-zA-Z]*(.*)/g);
res+= ","+removeComments.match(/[s,g]etField['Value'|'Text']*(.*)/g);
res+= ","+removeComments.match(/nlobj[a-zA-Z]*(.*)/g);

nlapiLogExecution("debug","res:",res)*/

apicalls = [];
nlapicalls = removeComments.match(/nlapi[a-zA-Z]*(.*)/g);
getsetcalls = removeComments.match(/[s,g]etField['Value'|'Text']*(.*)/g);
objcalls = removeComments.match(/nlobj[a-zA-Z]*(.*)/g);
nlapiLogExecution("debug","nlapicalls:",nlapicalls)
if(nlapicalls) {
   apicalls = apicalls.concat(nlapicalls);	
}

if(getsetcalls) {
	apicalls = apicalls.concat(getsetcalls);
}

if(objcalls) {
	apicalls = apicalls.concat(objcalls);
}
//apicalls=res.split(")");
apicount=new Array();
scriptfields=new Array();
nlapiLogExecution("debug","apicalls:",apicalls)
scriptfields = getStandardFields(removeComments);
try{

	//++ NS-413
	var customfields = removeComments.match(/[\'|\"]cust[a-zA-Z_]*([0-9a-zA-Z_]*)[\'|\"](\s*\+\s*[0-9a-zA-Z_]*)?/g);
	if(customfields != null) {
		
		for(var cf = 0; cf < customfields.length; cf++) {
			if(customfields[cf] && customfields[cf].indexOf('+') != -1) {
				//do nothing. This will be processed in getIterationScriptID loop
				
			} else {
				var cfield =customfields[cf].replace(/\'|\"/g,"");
				if(scriptfields.indexOf(cfield)<0  &&  cfield.length>4 &&  cfield.indexOf(" ")<0 &&  cfield.indexOf("%20")<0 &&  cfield.match(/^[a-zA-Z0-9_]*$/g) != null) {
					scriptfields.push(cfield);
				}
			}
			
			
		}
		
	}
	
	var scriptIDsFromAST = getIterationScriptID(origFileValue);
	if(scriptIDsFromAST && scriptIDsFromAST.length > 0) {
		scriptfields = scriptfields.concat(scriptIDsFromAST);
	}
	//-- NS-413
	
} catch (e) {
	 nlapiLogExecution("error","error",e);
}

nlapiLogExecution("debug", "ast scriptfields", scriptfields)
for(a=0;apicalls[a]!=null;a++)
{
   //alert(apicalls[a])
  
    nlapiLogExecution("debug","apicalls[a] ",apicalls[a]);
   //apiname=apicalls[a].split("(")[0].substring(apicalls[a].indexOf(",")+1);
   apiname=apicalls[a].split("(")[0];															 
   //nlapiLogExecution("debug","apiname ",apiname);
  
 

   var trimmedapi = "";
   if(apiname.indexOf("nlapi") > 0) {
       nlapiLogExecution("debug","apiname index ",apiname.indexOf("nlapi"));
       apiname =  apiname.substring(apiname.indexOf("nlapi"));
   } else if (apiname.indexOf("setFieldValue") > 0) {
      apiname =  apiname.substring(apiname.indexOf("setFieldValue")  );
   } else if (apiname.indexOf("getFieldValue") > 0) {
      apiname =  apiname.substring(apiname.indexOf("getFieldValue"));
   } else if (apiname.indexOf("nlobj") > 0) {
      apiname =  apiname.substring(apiname.indexOf("nlobj"));
   }
//   nlapiLogExecution("debug","trimmedapi ",trimmedapi);
   
   if(apiname.indexOf("nlapi")== 0) {
	   try {
		  //Check if there are api inside the apicall
		  var removeapiname = apicalls[a].replace(apiname,'');
		  var insideapimatches = removeapiname.match(/nlapi[a-zA-Z]*(.*?)/g);
		  nlapiLogExecution("debug","insideapimatches ",insideapimatches);
		  if(insideapimatches) {
			 apicalls = apicalls.concat(insideapimatches); 
		  }
	   } catch(ex) {
		   nlapiLogExecution("debug","ex ",ex);
	   }  
   }
                                   
   if(apiname!=null && apiname.indexOf("http")<0 && apiname!="null" )
   {
    if(apicount[apiname]==null)
    {apicount[apiname]=1}
    else
    {apicount[apiname]++}
   }
   try
   {

   checkfirstopenparen = apicalls[a].indexOf("(");  
//   nlapiLogExecution("debug","checkfirstopenparen ",checkfirstopenparen);
  // nlapiLogExecution("debug","apiname ",apiname);
    afields=[];
   if(apicalls[a].indexOf("nlapiLogExecution") < 0 && apicalls[a].indexOf("nlapiRequestURL") < 0 && apicalls[a].indexOf("nlapiSelectValue") < 0  && apicalls[a].indexOf("getPreference") < 0 && apicalls[a].indexOf("nlapiSelectNodes") < 0) {
     if(checkfirstopenparen < 0) {
     afields=apicalls[a].split(")")[0].split("[")[0].split(",");
     }
     else {
	  //replace inner function calls	 
      afields=apicalls[a].replace(/\w*\(\)/g,'').split("(")[1].split(")")[0].split("[")[0].split(",");
     }
   }
   //nlapiLogExecution("debug", "ast afields", afields)
   for(f=0;afields[f]!=null;f++)
   {
    var skiplist="debug,@none@,is,script,suitelet,restlet,anyof,debug,noneof,name,owner,internalid,isinactive,after,anyof,before,between,contains,doesnotcontain,doesnotstartwith,equalto,greaterthan,greaterthanorequalto,haskeywords,is,isempty,isnot,isnotempty,lessthan,lessthanorequalto,noneof,notafter,notbefore,notbetween,notequalto,notgreaterthan,notgreaterthanorequalto,notlessthan,notlessthanorequalto,noton,notonorafter,notonorbefore,notwithin,on,onorafter,onorbefore,startswith,within,plaintext,record,debug,T,F";
      
      //++ NS-413 Added condition to exclude scriptids with iteration    //--NS-413
      if(afields[f].indexOf("+") == -1 && (afields[f].indexOf('"')>=0 | afields[f].indexOf("'")>=0 ) )
      {

        if(afields[f].indexOf('"')>=0)
        {thisfield=afields[f].substring(afields[f].indexOf('"')+1,afields[f].lastIndexOf('"'))}
        if(afields[f].indexOf("'")>=0)
        {thisfield=afields[f].substring(afields[f].indexOf("'")+1,afields[f].lastIndexOf("'"))}
        if(functionList.indexOf(thisfield)<0 && scriptfields.indexOf(thisfield)<0 && skiplist.indexOf(thisfield.toLowerCase())<0 && thisfield.length>4 && thisfield.indexOf(" ")<0 && thisfield.indexOf("%20")<0 && thisfield.match(/^[a-zA-Z0-9_]*$/g) != null && isNaN(thisfield) && thisfield.indexOf('cust') == 0)
        {scriptfields.push(thisfield)}
      }
   }
   }
   catch(e){}
}
//res+="<br><br>APICalls:<br>";
apistring="";
//Check if api matches one of the ff. patterna
var apipatt1 = /nlapi[a-zA-Z]*/;
var apipatt2 = /[s,g]etField['Value'|'Text']*/;
var apipatt3 = /nlobj[a-zA-Z]*/;
for(api in apicount)
{
 // nlapiLogExecution("debug","api = ",api + " = " + (apipatt1.exec(api) != null || apipatt2.exec(api) != null || apipatt3.exec(api) != null));
  if(api!="" && api.indexOf("=")<0 && api!=";" && (apipatt1.exec(api) != null || apipatt2.exec(api) != null || apipatt3.exec(api) != null))
  {apistring+=api+":"+apicount[api]+"\n";} 
}
//res+=apistring;
//res+="<br><br>Fields:"+scriptfields.join();
  nlapiLogExecution("debug","scriptfields ",scriptfields.join());

  nlapiLogExecution("debug","apistring ",apistring);

  nlapiLogExecution("debug","debuglogs final",debuglogs);

  returnString=scriptfields.join()+"##"+escape(commentString)+"##"+functionList+"##"+apistring+"##"+debuglogs+"##"+hashfile;
   return returnString
  ////nlapiLogExecution("debug",functionList)
}


function getStandardFields(scriptcode) {
    var standardfields = [];
    try {
        if(scriptcode) {
           var functionnames = scriptcode.split(/function\s*([A-z0-9]+)\s*\(.*?\)/g);
           if(functionnames) {
                for(var h = 0; h < functionnames.length; h++) {
                    var functiondefinition = functionnames[h];
                    var fieldcalls = functiondefinition.match(/([a-zA-Z_0-9]*|currentRecord\.get\(\))\.(g|s)et(Field)?(Value|Values|Text|Texts)\((\s)*({(\s)*fieldId(\s)*:|{(\s)*name(\s)*:(\s)*)?(\s)*?(\"|\').*?(\"|\')/g);
                    nlapiLogExecution("debug","standardfields fieldcalls",fieldcalls);
                    if(fieldcalls != null) {
                        for(var f = 0; f < fieldcalls.length; f++) {
                            var objName = "";
                            var fieldId = "";
                            if(fieldcalls[f].indexOf('currentRecord.get(') == 0) {
                                objName = "CurrentRecord";
                                fieldId = fieldcalls[f].split('.')[2];
                            } else {
                                fieldId = fieldcalls[f].split('.')[1];
                                objName = fieldcalls[f].split('.')[0].replace(/\[.*?\]/,'');
                            }
                            if(fieldId) {
                                 fieldId = fieldId.replace(/(g|s)et(Field)?(Value|Values|Text|Texts)\(/,'').replace(/\{(\s)*(fieldId|name)(\s)*:/,'');
                            }
                           
                            nlapiLogExecution("debug","standardfields objName",objName);
                           
                            if(fieldId.indexOf('"') != -1 || fieldId.indexOf("'") != -1) {
                                fieldId = fieldId.replace(/'|"/g,'');
                            } else {
                                //find variable
                                fieldId = "";
                            }
                            nlapiLogExecution("debug","standardfields fieldId",fieldId);
                            if(objName && fieldId) {
                                var idPrefix = fieldId.match(/cust(record|body|item|entity|event|col|page)/g)
                                if(idPrefix != null && fieldId.indexOf(idPrefix[0]) == 0) {
                                    continue;
                                }

                                if(objName == "CurrentRecord") {
                                    var scriptid = 'CurrentRecord.'+ fieldId;
                                    if(standardfields.indexOf(scriptid) == -1){
                                         standardfields.push(scriptid);
                                    }
                                } else {
                                    //nlapiLogExecution("debug","standardfields idPrefix",idPrefix);
                                    var regex = objName + '((\\s)*=(\\s)*((nlapi(Create|Search|Load)+|record\\.).*?\\(((("|\').*?("|\'))|([\\s\\S]*?,))))|currentRecord\\.get\\(\\)|nlapiGet(New|Old)Record';
                                    //nlapiLogExecution("debug","standardfields regex",regex);
                                    var findobjectName = new RegExp(regex,'g');
                                    var foundObj = functiondefinition.match(findobjectName);
                                    
                                    nlapiLogExecution("debug","standardfields foundObj",foundObj);
                                    if(foundObj != null && foundObj.length == 1 && foundObj[0] && foundObj[0].indexOf('customrecord') == -1) {
                                        var recordid ="";
                                        nlapiLogExecution("debug","standardfields foundObj",foundObj[0]);
                                        if(foundObj[0].indexOf('nlapi') != -1 && foundObj[0].match(/nlapiGet(New|Old)Record/) == null) {
                                            recordid = foundObj[0].split('(')[1].replace(/'|"/g,'');
                                        } else {
                                            if(foundObj[0].indexOf('currentRecord.get(') != -1 || foundObj[0].match(/nlapiGet(New|Old)Record/) != null) {
                                                recordid = "CurrentRecord";
                                            } else {
                                                recordid = foundObj[0].split('(')[1].replace(/\s|type|:|,|\{/g,'');
                                                nlapiLogExecution("debug","standardfields recordid",recordid);
                                                if(recordid.indexOf('record.Type') != -1) {
                                                    recordid = recordid.replace('record.Type.','');
                                                    nlapiLogExecution("debug","standardfields recordid",recordid);
                                                    recordid = recordTypeEnum[recordid]
                                                    nlapiLogExecution("debug","standardfields recordid",recordid);
                                                }
                                            }
                                            
                                        }
                                         nlapiLogExecution("debug","standardfields recordid",recordid);
                                        if(recordid && supportedRecord.hasOwnProperty(recordid)) {
                                             var recordName = supportedRecord[recordid]
                                             if(recordName) {
                                                var scriptid = recordName.replace(/\s/g,'_') + '.'+ fieldId;
                                                 if(standardfields.indexOf(scriptid) == -1){
                                                        standardfields.push(scriptid);
                                                 }
                                             }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    var fieldcalls2 = functiondefinition.match(/nlapi(G|S)et(Field)?(Value|Values|Text|Texts)\((\s)*(\"|\').*?(\"|\')/g);
                    nlapiLogExecution("debug","standardfields fieldcalls2",fieldcalls2);
                    if(fieldcalls2) {
                        for(var f = 0; f < fieldcalls2.length; f++) {
                            var fieldId = fieldcalls2[f].replace(/nlapi(G|S)et(Field)?(Value|Values|Text|Texts)\((\s)*(\"|\')/g,'').replace(/"|'/g,'');
                            var idPrefix = fieldId.match(/cust(record|body|item|entity|event|col|page)/g)
                            if(!fieldId) {
                                continue;
                            }
                            if(idPrefix != null && fieldId.indexOf(idPrefix[0]) == 0) {
                                continue;
                            }

                            var scriptid = 'CurrentRecord.'+ fieldId;
                            if(standardfields.indexOf(scriptid) == -1){
                                 standardfields.push(scriptid);
                            }
                           
                        }
                    }

                    var fieldcalls3 = functiondefinition.match(/nlapiSubmitField\s*\(\s*('|")[a-zA-Z0-9_]*'\s*,\s*(\w|\d)*\s*,\s*(('|")[a-zA-Z0-9_]*('|")|\[(('|")[a-zA-Z0-9_]*('|")(,)?)*\]),/g);
                    nlapiLogExecution("debug","standardfields fieldcalls3",fieldcalls3);
                   
                    if(fieldcalls3) {
                        try {
                            for(var f = 0; f < fieldcalls3.length; f++) {
                                var fcall = fieldcalls3[f];
                                if(fcall.indexOf('customrecord') != -1) continue;

                                var fieldIds = [];
                                if(fcall.match(/\[(('|")[a-zA-Z0-9_]*('|")(,)?)*\]/g) != null) {
                                    fieldIds = fcall.match(/\[(('|")[a-zA-Z0-9_]*('|")(,)?)*\]/g)[0].replace(/"|'|\[|\]/g,"").split(',')
                                } else {
                                    var fid = fcall.split(',')[2].replace(/"|'/g,"");
                                    fieldIds.push(fid);
                                }
                                if(fieldIds.length > 0) {
                                    var recordid = fcall.split(',')[0].replace(/nlapiSubmitField\s*\(/,'').replace(/"|'/g,"");
                                    if(recordid && supportedRecord.hasOwnProperty(recordid)) {
                                        var recordName = supportedRecord[recordid];
                                        for(var f1 = 0; f1 < fieldIds.length; f1++) {
                                          	var fieldIdTrimmed = fieldIds[f1].trim();
                                            var idPrefix = fieldIdTrimmed.match(/cust(record|body|item|entity|event|col|page)/g)
                                            if(idPrefix != null && fieldIdTrimmed.indexOf(idPrefix[0]) == 0) {
                                                continue;
                                            }

                                            var scriptid = recordName.replace(/\s/g,'_') + '.'+ fieldIdTrimmed;
                                            if(standardfields.indexOf(scriptid) == -1){
                                                 standardfields.push(scriptid);
                                            }

                                        }

                                    }
                                }

                            }
                        } catch(e) {
                             nlapiLogExecution("debug","err fieldcalls3",e);
                        }
                        
                    }

                }
           }
           

           
        }
        
    } catch(e) {
        nlapiLogExecution("debug","standardfields",e);
   
    }
    nlapiLogExecution("debug","standardfields",standardfields);
    return standardfields;
}


function getdebugLogs(thisFile)
{
    try{//This function retrieves any logs that can be used to check the last date of use of a script and the time of execution.
    //check execution logs
    //first check for start and stop debug logs
    var debuglogs="";//used to store the debug log fields
  //  var startlog=thisFile.match(/[^\/{2}]nlapiLogExecution\(['"]debug['"],['"]FLOStart['"],/ig);
  //  var endlog=thisFile.match(/[^\/{2}]nlapiLogExecution\(['"]debug['"],['"]FLOEnd['"],/ig);

    var startlog=thisFile.match(/FLOStart/ig);
    var endlog=thisFile.match(/FLOEnd,/ig);

    //var startlog=thisFile.match(/[^\/{2}]nlapiLogExecution\(['"]debug['"],/ig);
    //var endlog=thisFile.match(/[^\/{2}]nlapiLogExecution\(['"]debug['"],/ig);

    if(startlog!=null && endlog!=null)
    {debuglogs=startlog[0]+"::"+endlog[0]}
    //if standard start and stop debug logs are not available, check for other debug logs
    //var audlogs=thisFile.match(/[^\/{2}]nlapiLogExecution\(['"]debug['"],['"].+['"][,\)]/ig);
    //var audlogs=thisFile.match(/nlapiLogExecution\(['"]debug['"],/ig);
    var audlogs=thisFile.match(/nlapiLogExecution.+audit['"]\,.+\,/ig);
    
    nlapiLogExecution("debug","audlogs",audlogs)

    if(audlogs!=null)
    {
      nlapiLogExecution("debug","audlogs length",audlogs.length)
    debuglogs=audlogs[0].replace("nlapiLogExecution(","");
    logmatched=false;//used to track whether the end log was found
    for(a=audlogs.length-1;a!=0 && audlogs[a]!=null && logmatched==false;a--)
    {
      title=audlogs[a].split(",")[1];
      if(debuglogs.split(",")[1]!="title");
      {
        debuglogs+="::"+audlogs[a].replace("nlapiLogExecution(","");
        logmatched=true;
      }
    }
    }

     nlapiLogExecution("debug","debuglogs 1 ",debuglogs)


     var auxdebuglogs=debuglogs

    //get start time and end time
  
    try{

    if(startlog!=null && startlog[0] != null && scriptid > 0) {
     var lateststart = "";
     var latestend = "";
     var firsttitle = debuglogs.split("::")[0].split(",")[1];
     if(firsttitle) firsttitle = firsttitle.replace(/'/g, '');
     var lastttitle = debuglogs.split("::")[1].split(",")[1];
      if(lastttitle) lastttitle = lastttitle.replace(/'/g, '')
     var srchfilters = new Array();
     
     nlapiLogExecution("debug","scriptid",scriptid)

     srchfilters.push(new nlobjSearchFilter('internalid', null, 'is',scriptid));
     var scriptdebug=null;
	 try {
		scriptdebug=nlapiSearchRecord("script","customsearch_flo_scriptaudit_srch",srchfilters,null);
	 } catch(e) {
		nlapiLogExecution("debug","ERROR",e);
		nlapiLogExecution("AUDIT","Search Record","script," + "customsearch_flo_scriptaudit_srch,"+"internalid="+scriptid);
	 }
     var avgruntime=0;
     if(scriptdebug) {
           
      nlapiLogExecution("debug","scriptdebug",scriptid)

      for(var au = 0; au < scriptdebug.length; au++)
      {
        debugcols=scriptdebug[au].getAllColumns();
        debugtitle = scriptdebug[au].getValue(debugcols[1]);
        debugdetails = scriptdebug[au].getValue(debugcols[4]);  

        nlapiLogExecution("debug","debugdetails",debugdetails);

         nlapiLogExecution("debug","debugtitle = " + debugtitle,"firsttitle = " + firsttitle + (!lateststart && debugtitle == firsttitle))
        if(lateststart=="" && firsttitle.match(debugtitle)) {
          lateststart = debugdetails;
        }
        
         nlapiLogExecution("debug","debugtitle = " + debugtitle,"lastttitle = " + lastttitle + (!latestend && debugtitle == lastttitle))
        if(latestend=="" && lastttitle.match(debugtitle)) {
          latestend = debugdetails;
        }
        nlapiLogExecution("debug","latestend = " + latestend,"lateststart = " + lateststart)
        
        if(latestend !="" && lateststart !="") { avgruntime=parseInt(latestend) - parseInt(lateststart);break;}
      }
     }

     nlapiLogExecution("debug","avgruntime",avgruntime)

     debuglogs += "**"+avgruntime; 
    }
    
    /*
    if(debuglogs=="" | debuglogs.indexOf("::")<0)
    {
        //check regular debug logs
        //var deblogs=thisFile.match(/[^\/{2}]nlapiLogExecution\(['"]DEBUG['"],['"].+['"][,\)]/ig);
        var deblogs=thisFile.match(/[^\/{2}]nlapiLogExecution.+DEBUG,.+\,/ig);
        if(deblogs!=null)
        {
        debuglogs2=deblogs[0].replace("nlapiLogExecution(","");
        logmatched=false;//used to track whether the end log was found
        for(a=deblogs.length-1;a!=0 && deblogs[a]!=null && logmatched==false;a--)
        {
          title=deblogs[a].split(",")[1];
          if(debuglogs2.split(",")[1]!="title");
          {
            debuglogs2+="::"+deblogs[a].replace("nlapiLogExecution(","");
            logmatched=true;
            debuglogs=debuglogs2;
          }
        }
        }
    }
    */

  }catch(e){
      nlapiLogExecution("debug","debuglogs debug",e)
  }
  
  if(auxdebuglogs!="" && debuglogs=="") debuglogs=auxdebuglogs;

  nlapiLogExecution('debug', 'debuglogs 2', debuglogs);


  return debuglogs
 }catch(e){
   return "";
 }

}

function archiveScript(custRec,currArch)
{
  var archFolder=nlapiGetContext().getSetting("SCRIPT","custscript_flo_script_archive_folderss");
  nlapiLogExecution("debug",archFolder)
  if(archFolder==null | archFolder=="")
  {return custRec}
  var archive=custRec.getFieldValue("custrecord_flo_script_archive");
  archFile="";//reset archFile to empty
  if(archive!=null && archive!="")
  {
    //load archive file
   try
    {
    var archFile=nlapiLoadFile(archive).getValue();

    }
    catch(e)
    {
      archFile="";
    }
  }
  
  //check if the scripts have changed
  if(archFile!=currArch)
  {
    //create new archive document
    newArchFile=nlapiCreateFile(custRec.getFieldValue("name")+"_scriptarchive_"+nlapiDateToString(new Date(),'date'),'PLAINTEXT',currArch);
    // set the folder where this file will be added. In this case, 10 is the internal ID
     // of the SuiteScripts folder in the NetSuite file cabinet
      newArchFile.setFolder(archFolder) 

      // now create file and upload it to the file cabinet. You must use nalpiSubmitFile
     // to upload a file to the file cabinet. See nlapiSubmitFile(file).
      var id = nlapiSubmitFile(newArchFile)

      // now attach file to customer record
      nlapiAttachRecord("file", id, "customrecord_flo_customization", custRec.getId());

     //set archive file field
      custRec.setFieldValue("custrecord_flo_script_archive",id)
    
  }
  
    return custRec
}

function updateExecutionData(custRec)
{
  //This function checks the execution data for the script:  date of last use and average execution time

  changed="";//used to track whether any data needs to be updated.
  //check if script is deployed
  var filters=[];
  filters[0] = new nlobjSearchFilter("script",null,'is',custRec.getFieldValue('custrecord_flo_int_id'));
  filters[1] = new nlobjSearchFilter("isdeployed",null,'is','T');
  var deps=null;
  try{
	deps=nlapiSearchRecord("scriptdeployment",'customsearch_flo_script_deployment_date',filters,null);
  } catch(e) {
	nlapiLogExecution("debug","ERROR",e);
	nlapiLogExecution("AUDIT","Search Record","scriptdeployment," + "customsearch_flo_script_deployment_date,"+"script="+custRec.getFieldValue('custrecord_flo_int_id'));
  }
  
  //var deps=nlapiSearchRecord("script",'customsearch_flo_scripts_lr',filters,null)
  
  nlapiLogExecution('DEBUG', 'deps', deps.length);

  if(deps!=null)
  {
      columns=deps[0].getAllColumns();
  
      nlapiLogExecution('DEBUG', 'depsColumn', deps[0].getValue(columns[1]));

      var date=nlapiStringToDate(deps[0].getValue(columns[1]));

      if(date!=null && date!="")
      {
        date=nlapiDateToString(date,"date").split(' ')[1];
        custRec.setFieldValue("custrecord_flo_dls",date);

        nlapiLogExecution('DEBUG', 'DLU', date);

      }
  }
  return custRec;
}

function getLibrariesInModules(file) {
    var libraryFileIds = [];

    //load file
    var thisFile;
    try {
        nlapiLogExecution("DEBUG", "file", file);
        var docu = nlapiLoadFile(file);
        thisFile = docu.getValue();
        nlapiLogExecution("DEBUG", "name", docu.getName());
    } catch (e) {
        nlapiLogExecution('DEBUG', 'catch', e);
        return libraryFileIds;
    }

    var modulesRaw = thisFile.match(/define\(\[.*?\]/g);
    nlapiLogExecution("DEBUG", "modules", JSON.stringify(modulesRaw));

    var modules = [];
    if(modulesRaw && modulesRaw.length > 0) {
        modules = modulesRaw[0].match(/\[.*?\]/g);
        nlapiLogExecution("DEBUG", "modules", JSON.stringify(modules));
    }

    if(modules && modules.length > 0) {
        var modulesList = modules[0];
        modulesList = modulesList.replace(/'/g, '"');
        modulesList = JSON.parse(modulesList);
        if(modulesList.length > 0) {
            for(var i = 0; i < modulesList.length; i++) {
                if(modulesList[i].indexOf('N/') < 0) {
                    var libPath = modulesList[i];
                    if(libPath.indexOf('/') === 0) {
                       libPath = libPath.substring(1);
                    }
                    nlapiLogExecution("DEBUG", "libPath", libPath);
                    try {
                        var libFile = nlapiLoadFile(libPath + '.js');
                        if(libFile) {
                            var libFileId = libFile.getId();
                            if(libFileId) {
                                libraryFileIds.push(libFileId);
                            }
                        }
                    }
                    catch(e) {
                        nlapiLogExecution("DEBUG", "catch", e);
                    }

                }
            }
        }
    }

    return libraryFileIds;
}

function processLibraryFiles(thisCust,scriptFileId) {
	var allLibraries = [];
	try {
		var libraryFileIds = getLibrariesInModules(scriptFileId);
        nlapiLogExecution('debug','libraryFileIds', libraryFileIds);

       
        if(libraryFileIds.length > 0) {
            allLibraries = allLibraries.concat(libraryFileIds);
        }
		var xml = thisCust.getFieldValue('custrecord_flo_cust_page_xml');
		nlapiLogExecution('DEBUG', 'xml', xml);
		if(xml) {
			try {
				var custid = thisCust.getId();
				var recordXML=nlapiStringToXML(xml);  
				var node=nlapiSelectNode(recordXML,"//machine[@name='libraries']");
				var libs=nlapiSelectValues(node,'./line/scriptfile')
				nlapiLogExecution('DEBUG', 'libs', libs);
				if (libs != null && libs.length > 0) {
	                allLibraries = allLibraries.concat(libs);
	            }
			} catch (e) {

			}
			
		}

		for(var i=0; i < allLibraries.length; i++) {
			try {
				libscriptarch = "";
				var libfilessfilters=[];
				nlapiLogExecution('DEBUG', 'allLibraries[i]', allLibraries[i]);
				libfilessfilters.push(new nlobjSearchFilter('internalid', null,'anyof', allLibraries[i]));
				libefileResult=nlapiSearchRecord(null,'customsearch_flo_script_file_search_2',libfilessfilters);
				nlapiLogExecution('DEBUG', 'libefileResult', libefileResult);
				if(libefileResult && libefileResult[0] != null) {
					
					var fileCols=libefileResult[0].getAllColumns();
	 				var filedate=libefileResult[0].getValue(fileCols[1]);
					var fileowner=libefileResult[0].getValue(fileCols[5]);
	  				var filesize=libefileResult[0].getValue(fileCols[6]);
	  				var filesizebytes = libefileResult[0].getValue(fileCols[7]);
					var libfilename = libefileResult[0].getValue(fileCols[0]);
					nlapiLogExecution('DEBUG', 'libfilename', libfilename + ' id: ' + allLibraries[i]);
					var libfilters=[];
					libfilters.push(new nlobjSearchFilter('custrecord_flo_cust_type', null,'anyof',59));
					libfilters.push(new nlobjSearchFilter('isinactive', null,'is','F'));
					libfilters.push(new nlobjSearchFilter('custrecord_flo_script_file', null,'is',allLibraries[i]));
					
					var librarysearch=nlapiSearchRecord("customrecord_flo_customization",null,libfilters);
					
					var libscripts = [];
					var libcustId = "";
					if(librarysearch && librarysearch[0] != null) {
						libcustId = librarysearch[0].getId();
					} else {
						var newlibCust = nlapiCreateRecord("customrecord_flo_customization");
						newlibCust.setFieldValue('name',libfilename.replace('.js',''));
						newlibCust.setFieldValue('custrecord_flo_cust_id',libfilename);
						newlibCust.setFieldValue('custrecord_flo_cust_type',59);
						 newlibCust.setFieldValue("custrecord_flo_int_id", allLibraries[i]);
						if (fileowner != null && fileowner != '' && !isNaN(fileowner)) {

	                        if (!isUserActive(fileowner)) {
	                            newlibCust.setFieldValue('owner', thisCust.getFieldValue('owner'));

	                        } else {
	                            newlibCust.setFieldValue('owner', fileowner);
	                        }

	                    } else {
	                        newlibCust.setFieldValue('owner', thisCust.getFieldValue('owner'));
	                    }
						newlibCust.setFieldValue('custrecord_flo_script_file',allLibraries[i]);
						libcustId = nlapiSubmitRecord(newlibCust,false,true);
						nlapiLogExecution("debug","new lib cust",libcustId);
					}
					
					
					var libCust = nlapiLoadRecord("customrecord_flo_customization",libcustId);
					var oldlibscripts = libCust.getFieldValues('custrecord_flo_scripts');
	  				var old_lib_file_size = libCust.getFieldValue("custrecord_flo_script_file_size");
	  				var old_lib_file_bytes = libCust.getFieldValue("custrecord_flo_script_filebytes");
					if(oldlibscripts == null) {
						libscripts = [];	
						oldlibscripts=[];
					}  else if(typeof oldlibscripts === 'string'){
						libscripts = oldlibscripts.split(',')
					} else {
						libscripts = oldlibscripts.join(',').split(',');	
					}
					if(libscripts.length > 0) {
						libscripts = checkActiveCustomizationsFromList(libscripts);
					}
					if (fileowner && isUserActive(fileowner)) {
	                    libCust.setFieldValue('owner', fileowner);
	                } else {
	                    libCust.setFieldValue('owner', thisCust.getFieldValue('owner'));
	                }
					libCust.setFieldValue("custrecord_flo_script_file_date",filedate)
	  				libCust.setFieldValue("custrecord_flo_script_file_size",filesize)
	  				libCust.setFieldValue("custrecord_flo_script_filebytes", filesizebytes)
					if(libscripts.indexOf(custid) == -1) {
						libscripts.push(custid);
					}
					
					libCust.setFieldValues("custrecord_flo_scripts",libscripts);
					libCust.setFieldValue("custrecord_flo_int_id",allLibraries[i]);
					
					var origlibmetadata=getScriptMetaData(allLibraries[i],true)
						var libmetadata = origlibmetadata.split("##");
					if(libCust!=null) {
						var auditTag = "";
						//SET # of attempts script parser processed this script
						var libcurattempt=libCust.getFieldValue("custrecord_flo_attempt");
						if(libcurattempt != null && libcurattempt != "" && !isNaN(libcurattempt)) {
						   libCust.setFieldValue("custrecord_flo_attempt",Number(libcurattempt)+1);
						} else {
						   libCust.setFieldValue("custrecord_flo_attempt",1);
						}
						
						if(origlibmetadata == "  ## ## ##  ") {
							 var libcurrentdebug=libCust.getFieldValue("custrecord_flo_retrieval_error");
						   if(libcurrentdebug == null || libcurrentdebug == "") {
							 libCust.setFieldValue("custrecord_flo_retrieval_error","Locked");
						   } else if(libcurrentdebug == "Locked") {
							 libCust.setFieldValue("custrecord_flo_retrieval_error","TIMED OUT");
						   }
						
						}
						
						//check whether metadata has changed
						var old_lib_scriptsfields = libCust.getFieldValue("custrecord_flo_script_fields");
						var old_lib_raw_metadata = libCust.getFieldValue("custrecord_flo_script_raw_metadata");
	    
						if(old_lib_raw_metadata) old_lib_raw_metadata = old_lib_raw_metadata.trim();
						
						var new_lib_raw_metadata = libmetadata.join();
							if(new_lib_raw_metadata) new_lib_raw_metadata = new_lib_raw_metadata.trim();
						 nlapiLogExecution("debug","lib compare",old_lib_raw_metadata!=new_lib_raw_metadata);
						 nlapiLogExecution("debug","lib new",new_lib_raw_metadata);
						 nlapiLogExecution("debug","lib old",old_lib_raw_metadata);
						 
						 nlapiLogExecution("debug","lib compare scripts"+oldlibscripts.join()+"=="+libscripts.join(),oldlibscripts!=libscripts);
						var prevObjectJSON = libCust.getFieldValue('custrecord_flo_object_json');
						if(old_lib_raw_metadata!=new_lib_raw_metadata || oldlibscripts.join()!=libscripts.join() || old_lib_file_size!=filesize  || old_lib_file_bytes != filesizebytes || !prevObjectJSON)
							{
							libCust.setFieldValue("custrecord_flo_script_raw_metadata",libmetadata.join());
							libCust.setFieldValue("custrecord_flo_script_fields",libmetadata[0]);
								libCust.setFieldValue("custrecord_flo_script_comments",unescape(libmetadata[1]).substring(0,3999));
							libCust.setFieldValue("custrecord_flo_script_functions",libmetadata[2].substring(0,3999)); 
							nlapiLogExecution("debug","APIs:"+libmetadata[3]+"<br>");
							libCust.setFieldValue("custrecord_flo_script_apis",unescape(libmetadata[3]).substring(0,3999)); 
							libCust.setFieldValue("custrecord_flo_script_filecontent_hash",libmetadata[5]);
	      
							if(libmetadata[0] != old_lib_scriptsfields) {
								//reset make join date to trigger the join script.
								libCust.setFieldValue("custrecord_flo_make_join_date",''); 
							}
							
							if(libmetadata[4]) {
								auditTag = libmetadata[4].substring(0,299);
								//libCust.setFieldValue("custrecord_flo_audit_logging",libmetadata[4].substring(0,299)); 
							}
							
							try{
								libCust=archiveScript(libCust,libscriptarch);
						    }catch(eee){
								nlapiLogExecution("debug","Archive Script debug",eee);
							}
							
							//++ NS-369
                            var hashString = '';
                            var objectJSON = '';
                            try {
                                var libObj = {};
                                libObj.filename = libfilename;
                                libObj.filesize = filesizebytes;
                                libObj.filecontenthash = libCust.getFieldValue("custrecord_flo_script_filecontent_hash");
                                if(libObj.filecontenthash == "undefined") {
                                	libObj.filecontenthash = "";
                                }
                                objectJSON = JSON.stringify(libObj);
                                if(objectJSON) {
                                    hashString =  nlapiEncrypt(objectJSON, "sha1");
                                }
                                
                                nlapiLogExecution("debug", "lib objectJSON",objectJSON);

                                libCust.setFieldValue("custrecord_flo_object_json", objectJSON)
                                libCust.setFieldValue("custrecord_flo_object_hash", hashString)
                                
                            } catch(e) {
                                nlapiLogExecution("debug", "objectJSON",e);
                            }
                            //-- NS-369

							try{ 
								libCust.setFieldValue("custrecord_flo_audit_logging", auditTag);
							
								var libspiderDate=nlapiDateToString(new Date());
								
								libCust.setFieldValue("custrecord_flo_make_join_proc","F")
								libCust.setFieldValue("custrecord_flo_last_spider_date",libspiderDate)
								
								
								lid=nlapiSubmitRecord(libCust,false,true);
								nlapiLogExecution("debug","<br>LIB NEWID:"+lid+"<br>")
							}catch(e){
								nlapiLogExecution("debug","Update Script debug");
							}
							
						}
					}
				}
				
				
			} catch(ee) {
				nlapiLogExecution('DEBUG', 'ee', ee);	
			}
		}
	}catch(e) {
		nlapiLogExecution('DEBUG', 'e', e);	
	}

	return allLibraries;
}

function isUserActive(internalid) {
    if (internalid) {
        try {
            var empfilters = [
                ['internalid', 'anyof', internalid], 'AND', ['isinactive', 'is', 'F']
            ];
            var user = nlapiSearchRecord('employee', null, empfilters);
            if (user != null && user[0] != null) {
                return true;
            }
        } catch (e) {
            nlapiLogExecution('debug', 'isUserActive error', e);
        }

    }

    return false;
}

function updateVariableList(varname,varvalue,list) {
	try {
		varvalue = String(varvalue);
		if(list.hasOwnProperty(varname)) {
    		if(list[varname] && list[varname].indexOf(varvalue) == -1) {
    			list[varname].push(varvalue);
    		}
    	} else {
    		list[varname] = [varvalue];
    	}
	} catch(e) {

	}
	return list;
}