function showSpiderButtoninCustomization(type, form) {


	var recordtype = nlapiGetRecordType();
	var ids = "";
	var crid = 0;
	var proposedcusts = "";
	var propwithcustsnoid = "";
	var scriptid = "";
	var ctype = "";
	var typeregex = new RegExp("^(custform|custbody|custcol|custevent|custrecord|custentity|custitemnumber|custitem|customlist|customdeploy|customsearch|customrecord|customrole|customworkflow|customscript)");

	if(recordtype == "customrecord_flo_customization") {
		ids = nlapiGetRecordId();
		var flo_int_id = nlapiGetFieldValue("custrecord_flo_int_id") || "" ;
		var custname = nlapiGetFieldValue("name");
		if (flo_int_id == "") {
			scriptid = nlapiGetFieldValue("custrecord_flo_cust_id") || "" ;
			ctype = nlapiGetFieldValue("custrecord_flo_cust_type") || "";
			ctypetext = nlapiGetFieldText("custrecord_flo_cust_type") || "";

			if(custname && custname.indexOf("Global Permissions") == 0 && ctypetext=="Standard Sublist") {
				scriptid = "globalpermissions"
			}

			if(scriptid && scriptid.match(typeregex) == null && ctypetext) {
				scriptid = ctypetext+'|'+scriptid;
			}



		}
	} else if(recordtype == "customrecord_flo_change_request") {
		ids = nlapiGetFieldValues("custrecord_flo_cust_change") || "";
		if(ids) {
			ids = ids.join(",")
		}
		crid = nlapiGetRecordId();
		proposedcusts = nlapiGetFieldValue("custrecord_flo_cr_proposed_cust") || "" ;
		proposedcusts = cleanpropcust(proposedcusts);
		//nlapiLogExecution("AUDIT","propcusts", proposedcusts);
		if(proposedcusts) {
			//Check if there are existing customization for the scriptid
			resultobj = findExistingCusts(proposedcusts,crid,type);
			proposedcusts = resultobj.notfound.join(",");
			//nlapiLogExecution("AUDIT","propcusts 2", proposedcusts);
			if(ids) {
				ids = ids.split(",");
				ids = ids.concat(resultobj.found);
				ids = ids.join(",")
			}
		}

	}

	var content = "<script>function onclick_respider(){";
	if(ids || proposedcusts) {
		//content+="window.open('/app/site/hosting/scriptlet.nl?script=customscript_flo_trigger_realtime_spider&deploy=1&ids="+ids+"')";

		//CSS & HTML for the pop-up
		var modalcontent = '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css"> <style>.black_overlay{display: none;position: absolute;top: 0%; left: 0%; width: 100%; height: 100%;background-color: gray;z-index:1001;-moz-opacity: 0.8;opacity:.80;filter: alpha(opacity=80);}</style>';
		var modalcontent1 = '<style>.white_content {display: none; margin: auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 420px; height: 250px; padding: 30px 20px;border: 1px solid gray;background-color: white;z-index:1002;overflow: auto; font-size: 16px; font-family: Arial, Helvetica, sans-serif;}</style>';
		var modalcontent2 = '<div id="light" class="white_content">Documentation update in progress.<i class="fa fa-gears fa-10x fa-spin" style="color: orange; font-size: 6em; position: absolute; top: 40%; left: 33%; transform: translate(-40%, -33%);"></i></div><div id="fade" class="black_overlay"></div>';

		//Set up the needed popup html. Cut in 3 parts because there is 300 char limit
		loadinghtml = form.addField("custpage_myloading","inlinehtml","myloading");
		loadinghtml.setDefaultValue(modalcontent);

		loadinghtml1 = form.addField("custpage_myloading1","inlinehtml","myloading1");
		loadinghtml1.setDefaultValue(modalcontent1);

		loadinghtml2 = form.addField("custpage_myloading2","inlinehtml","myloading2");
		loadinghtml2.setDefaultValue(modalcontent2);

		iframehtml = form.addField("custpage_myiframe","inlinehtml","");
		iframehtml.setDefaultValue("<iframe id='spiderframe' src='' style='display:none'></iframe>");

		content+="document.getElementById('light').style.display='block';document.getElementById('fade').style.display='block';";
		content+="document.getElementById('spiderframe').src='/app/site/hosting/scriptlet.nl?script=customscript_flo_trigger_realtime_spider&deploy=1&ids="+ids+"&proposedcusts="+proposedcusts+"&crid="+crid+"&scriptid="+scriptid+"&ctype="+ctype+"';}";

		content+="function removeModal(pReload){ addproposedcustomizations(); document.getElementById('light').style.display='none';document.getElementById('fade').style.display='none';";
	} else {
		content += "pReload=false; alert('No Customizations to Process from this Record');";
	}
	var addpropcusts = "function addproposedcustomizations(){ var crid='"+crid+"'; var pcusts='"+proposedcusts+"'; if(crid != 0 && pcusts!='') { pcusts = pcusts.split(','); var unprocessedcusts = pcusts; var propfilters = []; var scriptidfilters = []; for(var p = 0; pcusts[p] != null; p++) { if(scriptidfilters.length > 0) { scriptidfilters.push('OR'); } var sf  = ['custrecord_flo_cust_id','is',pcusts[p].trim()]; scriptidfilters.push(sf); } if(scriptidfilters.length > 0) { propfilters.push(scriptidfilters); var inactivefilter = ['isinactive','is','F']; propfilters.push('AND'); propfilters.push(inactivefilter); var searchcusts = top.nlapiSearchRecord('customrecord_flo_customization',null,propfilters,new top.nlobjSearchColumn('custrecord_flo_cust_id')); if(searchcusts) { var crrec = top.nlapiLoadRecord('customrecord_flo_change_request',crid); var olcusts = crrec.getFieldValue('custrecord_flo_cust_change') || ''; var newcusts = []; if(olcusts) { if(olcusts instanceof Array) {olcusts = olcusts.join(',')} newcusts = olcusts.split(','); } var updatecr = false; for(var c = 0; searchcusts[c] != null; c++) { custrectid = searchcusts[c].getId(); var custrecscriptid = searchcusts[c].getValue('custrecord_flo_cust_id');  if(newcusts.indexOf(custrectid) == -1) { updatecr = true; newcusts.push(custrectid); } var sindex = unprocessedcusts.indexOf(custrecscriptid); if(sindex != -1) { unprocessedcusts.splice(sindex,1)} updatecr=true;  }  if(updatecr) { newcusts=checkActiveCustomizationsFromList(newcusts); crrec.setFieldValues('custrecord_flo_cust_change',newcusts); crrec.setFieldValue('custrecord_flo_cr_proposed_cust',unprocessedcusts.join(',')); top.nlapiSubmitRecord(crrec);}}}}}";

	addpropcusts += "function checkActiveCustomizationsFromList(list) {	var retActives = []; if(list && list.length > 0) {var ifilters = [];		ifilters.push(new nlobjSearchFilter('internalid', null,'anyof',list)); ifilters.push(new nlobjSearchFilter('isinactive', null,'is','F')); var activerecords=nlapiSearchRecord('customrecord_flo_customization',null,ifilters); if(activerecords) {	for(var ar = 0; ar < activerecords.length; ar++) {	retActives.push(activerecords[ar].getId());}}}return retActives;}";

	content += "if(pReload == true)location.reload();} "+addpropcusts+" </script>";
	var scriptcontainer = form.addField('custpage_respiderscriptcontainer', 'inlinehtml', '');
	scriptcontainer.setDefaultValue(content);
	form.addButton('custpage_buttonrespidernow', 'Respider Now', 'onclick_respider()');


 }

function getScriptid(ids,typeregex) {
	ids = ids.split(',');
	var retObj = {ids: ids,scriptids:[]};
	try {
		if(ids) {
			var filters = [["internalid","anyof",ids],'AND',['custrecord_flo_int_id','isempty',null],'AND',[['custrecord_flo_cust_id','isnotempty',null],'OR', [['name','startswith','Global Permissions'],'AND',['custrecord_flo_cust_type','anyof',[37]]]]];
			var columns = [];
			columns.push(new nlobjSearchColumn("name"));
			columns.push(new nlobjSearchColumn("custrecord_flo_cust_id"));
			columns.push(new nlobjSearchColumn("custrecord_flo_cust_type"));
			var custsearch = nlapiSearchRecord('customrecord_flo_customization', null, filters, columns);
			if(custsearch) {
				for(var i=0; custsearch[i] != null; i++) {
					var custintid = custsearch[i].getId();
					var custid = custsearch[i].getValue("custrecord_flo_cust_id");
					var custtype = custsearch[i].getText("custrecord_flo_cust_type");
					var custname = custsearch[i].getValue("name");
					if(custid) {
						if(custid.match(typeregex) == null){
							custid = custtype+"|"+custid;
						}
						var pos = retObj.ids.indexOf(custintid);
						if(pos > -1) {
							retObj.ids.splice(pos,1)
						}
						retObj.scriptids.push(custid);
					} else if(custname && custname.indexOf('Global Permissions') == 0 && custtype == "Standard Sublist") {
						custid = custtype+"|globalpermissions";
						var pos = retObj.ids.indexOf(custintid);
						if(pos > -1) {
							retObj.ids.splice(pos,1)
						}
						retObj.scriptids.push(custid);
					}
				}
			}
		}
	} catch(e) {

	}


	return retObj;

}
function cleanpropcust(propcusts) {
	var cleanpropcust = [];
	try {
		if(propcusts && propcusts !== undefined && propcusts.trim() !="") {
			var pcusts = propcusts.replace(/\s/g,'').split(",");
			for(var p = 0; p < pcusts.length;  p++) {
				if(pcusts[p] != null && pcusts[p] !== undefined && pcusts[p].trim() != "") {
					//++ NS-621 convert to lower case
					cleanpropcust.push(pcusts[p].toLowerCase())
					//-- NS-621
				}
			}
		}
		nlapiLogExecution("AUDIT","cleanpropcust.join()", cleanpropcust.join());
	} catch(e) {

	}

	return cleanpropcust.join();
}

function findExistingCusts (propcusts,crid,eventtype) {
	//nlapiLogExecution("AUDIT","propcusts", propcusts);
	var notfound = [];
	var foundids = [];
	var returnobj = {};
	returnobj.notfound = [];
	returnobj.found = [];
	try {
		var propfilters = [];
		var scriptidfilters = [];
		if(propcusts && propcusts !== undefined && propcusts.trim() !="") {
			var pcusts = propcusts.replace(/\s/g,'').split(",");
			if(pcusts) {
				for(var p = 0; p < pcusts.length;  p++) {
					if(scriptidfilters.length > 0) {
						scriptidfilters.push('OR');
					}
					var sf  = ['custrecord_flo_cust_id','is',pcusts[p].trim()];
					scriptidfilters.push(sf);
					returnobj.notfound.push(pcusts[p].trim());


				}
			}


			if(scriptidfilters.length > 0) {
				propfilters.push(scriptidfilters);
				var inactivefilter = ['isinactive','is','F'];
				propfilters.push('AND');
				propfilters.push(inactivefilter);
				var columns = [];
				columns.push(new nlobjSearchColumn("custrecord_flo_cust_id"));
				var searchcusts = nlapiSearchRecord('customrecord_flo_customization',null,propfilters,columns);
				if(searchcusts) {
					var crrec = nlapiLoadRecord('customrecord_flo_change_request',crid);
					var olcusts = crrec.getFieldValues('custrecord_flo_cust_change') || '';
					var newcusts = [];

					if(olcusts && olcusts != '') {
						if(olcusts instanceof Array) { olcusts = olcusts.join(',')}
						newcusts = olcusts.split(',');
					}
					var updatecr = false;
					for(var c = 0; searchcusts[c] != null; c++) {
						var custrectid = searchcusts[c].getId();
						var custrecscriptid = searchcusts[c].getValue('custrecord_flo_cust_id')
						if(newcusts.indexOf(custrectid) == -1) {
							updatecr = true;
							newcusts.push(custrectid);

						}
						if(custrecscriptid) {
							custrecscriptid = custrecscriptid.toLowerCase();
							var iindex = returnobj.notfound.indexOf(custrecscriptid);
							if(iindex != -1) {
								returnobj.notfound.splice(iindex,1);
								updatecr = true;
							}
						}
						

						if(returnobj.found.indexOf(custrectid) == -1) {
							returnobj.found.push(custrectid);
						}
					}

					if(updatecr) {
						nlapiLogExecution("debug","newcusts", newcusts);
						nlapiLogExecution("debug","notfound", returnobj.notfound.join(","));
						nlapiLogExecution("debug","found", returnobj.found.join(","));
						crrec.setFieldValues('custrecord_flo_cust_change',newcusts);
						crrec.setFieldValue('custrecord_flo_cr_proposed_cust',returnobj.notfound.join(","));
						var crrecid = nlapiSubmitRecord(crrec);
						var editmode = true;
						if(eventtype == "view") {
							editmode = false;
						}
						nlapiSetRedirectURL( 'RECORD', 'customrecord_flo_change_request', crrecid, editmode );
					}
				}
			}
		}

	} catch(e) {
		nlapiLogExecution("AUDIT","E", e);
	}
	return returnobj;

}

function triggerSpider(request,response) {
	try {

		var ids = request.getParameter("ids");
		var crid = request.getParameter("crid") || 0;
		var proposedcusts = request.getParameter("proposedcusts");
		var sId = request.getParameter("scriptid");
		var ctype = request.getParameter("ctype");
		var typeregex = new RegExp("^(custform|custbody|custcol|custevent|custrecord|custentity|custitemnumber|custitem|customlist|customdeploy|customsearch|customrecord|customrole|customworkflow|customscript)");
		var hasUserRole = false;
		var hasReport = false;
        var hasForm = false;
		var reportIds = [];
		var recordForms = [];
		var webHostFiles = [];
        //var formId = null;
        var recId = null;
		nlapiLogExecution("DEBUG","ids,sId,ctype",ids+","+sId+","+ctype+","+proposedcusts);
		if (sId && !(proposedcusts))
			proposedcusts = sId;

		if(ids && crid && crid != 0) {
			//Get scriptid of customizations without internalid
			var custsResult = getScriptid(ids,typeregex);
			var custwithnointid = custsResult.scriptids;
			ids = custsResult.ids.join(",");
			if(custwithnointid && custwithnointid.length > 0) {
				if(proposedcusts) { proposedcusts += "," }
				proposedcusts += custwithnointid.join(",")
			}
		}

		var idsByRecordTypes = {};
		if(proposedcusts) {
			proposedcusts = proposedcusts.split(",");
			var recprefix = [];
            recprefix["custform"] = "Entry Form";
			recprefix["custbody"] = "Body Field";
			recprefix["custcol"] = "Column Field,Item Option Field";
			recprefix["custevent"] = "CRM Field";
			recprefix["custrecord"] = "Custom Record Field,Other Field";
			recprefix["custentity"] = "Entity Field";
			recprefix["custitemnumber"] = "Item Number Field";
			recprefix["custitem"] = "Item Field";
			recprefix["customlist"] = "List";
			recprefix["customdeploy"] = "Script Deployments";
			recprefix["customsearch"] = "Saved Search";
			recprefix["customrecord"] = "Record";
			recprefix["customrole"] = "User Roles";
			recprefix["customworkflow"] = "Workflow";
			//recprefix["customscript"] = "Suitelet,User Event,Scheduled,Client,Portlet,Workflow Action,Bundle Installation,Map Reduce,RESTlet,Mass Update Script,Plug-In Script";
			var scripts = [];
			for(var p=0; proposedcusts[p] != null; p++) {
				if(proposedcusts[p].indexOf("cust") != 0) {
					if(proposedcusts[p].indexOf("|") != -1) {
						var typescriptidpair = proposedcusts[p].split("|");
						var type = typescriptidpair[0];
						var custscriptid = typescriptidpair[1];
						if(type && custscriptid) {
							if(idsByRecordTypes[type]) {
								var existingcustids = idsByRecordTypes[type];
								idsByRecordTypes[type] = existingcustids +","+custscriptid.toLowerCase();
							} else {
								idsByRecordTypes[type] = custscriptid.toLowerCase();
							}
						}

					} else {
						continue;
					}
				} else if(proposedcusts[p].indexOf("customscript") == 0) {
					scripts.push(proposedcusts[p])

				} else {
					for(var q in recprefix) {
						if(proposedcusts[p].indexOf(q) == 0) {
							var possiblerectypes = recprefix[q];
							possiblerectypes = possiblerectypes.split(",")
							for(var r=0; possiblerectypes[r] !=null; r++) {
								var recordtype = possiblerectypes[r];
								if(idsByRecordTypes[recordtype]) {
									var existingcustids = idsByRecordTypes[recordtype];
									idsByRecordTypes[recordtype] = existingcustids +","+proposedcusts[p].toLowerCase();
								} else {
									idsByRecordTypes[recordtype] = proposedcusts[p].toLowerCase();
								}
							}
						break;
						}
					}
				}

			}

			if(scripts.length > 0) {
				var filters = [];
				for(var s = 0; scripts[s]!=null;s++) {
					if(filters.length > 0) {
						filters.push("OR")
					}
					var tempfilter = ["scriptid","is",scripts[s]];
					filters.push(tempfilter);
				}
				if(filters.length > 0) {
					var allfilters = [filters,"AND",['isinactive','is',"F"]]
					var columns = [];
					columns[0]=new nlobjSearchColumn('scriptid');
          			columns[1]=new nlobjSearchColumn('scripttype');

					var searchScripts = nlapiSearchRecord(null, "customsearch_flo_script_srch", allfilters,columns);
					if(searchScripts) {
						for(var s=0; searchScripts[s] !=null; s++) {
							var scriptid = searchScripts[s].getValue("scriptid").toLowerCase();
							var scripttype = searchScripts[s].getValue("scripttype") || "";

							nlapiLogExecution("DEBUG","scripttype",scripttype);
							//if(scripttype != ""  && scripttype!="SSP Application" && scripttype !="Plug-in Type") {
							if(scripttype != ""  && scripttype!="SSP Application") {
								var scriptTypes = [];
								scriptTypes["EMAILCAPTURE"] = "Plug-In Script";
								scriptTypes["MAPREDUCE"] = "Map Reduce";
								scriptTypes["MASSUPDATE"] = "Mass Update Script";
								scriptTypes["PROMOTIONS"] = "Plug-In Script";
								scriptTypes["PLUGINTYPE"] = "Plug-In Type";
								scriptTypes["PLUGINTYPEIMPL"] = "Plug-In Script";
								scriptTypes["RESTLET"] = "RESTlet";
								scriptTypes["SCRIPTLET"] = "Suitelet";
								scriptTypes["USEREVENT"] = "User Event";
								scriptTypes["SCHEDULED"] = "Scheduled";
								scriptTypes["CLIENT"] = "Client";
								scriptTypes["PORTLET"] = "Portlet";
								scriptTypes["ACTION"] = "Workflow Action";
								scriptTypes["BUNDLEINSTALLATION"] = "Bundle Installation";
								scriptTypes["MASSUPDATE"] = "Mass Update Script";
								if(scriptTypes[scripttype]) {
									scripttype = scriptTypes[scripttype]
								}
								if(idsByRecordTypes[scripttype]) {
									var existingcustids = idsByRecordTypes[scripttype];
									idsByRecordTypes[scripttype] = existingcustids +","+scriptid;
								} else {
									idsByRecordTypes[scripttype] = scriptid;
								}
							}
						}
					}
				}
			}
		}

		if (ids && sId && ctype) {
			var custTypes = {"Body Field":5,"Column Field":4,"Item Option Field":28,"CRM Field":25,"Custom Record Field":30,"Other Field":27,"Entity Field":3,"Item Number Field":29,"Item Field":26,"List":1,"Script Deployments":51,"Saved Search":8,"Record":2,"User Roles":50,"Workflow":10,"Plug-In Script":33,"Map Reduce":61,"Mass Update Script":23,"Plug-In Type":33,"RESTlet":22,"Entry Form":6,"Transaction Form":7,"Mass Update":9,"Suitelet":17,"RESTlet":22,",User Event":21,"Scheduled":34,"Portlet":18,"Client":20,"Bundle Installation":35,"Workflow Action": 19};
			var keytypes = Object.keys(idsByRecordTypes);
			if (keytypes.length == 1 && custTypes.hasOwnProperty(keytypes[0])) {
				nlapiLogExecution("DEBUG","keytypes[0]",keytypes[0]);
				if (ctype != custTypes[keytypes[0]])
					nlapiSubmitField("customrecord_flo_customization",ids,"custrecord_flo_cust_type",custTypes[keytypes[0]]);
			}
		}

		nlapiLogExecution("debug","ids", ids);
		if(ids && !(sId)) {
			var renamedTypes = [];
			renamedTypes["Search"] = "Saved Search";
			renamedTypes["Suitelet Script"] = "Suitelet";
			renamedTypes["Restlet Script"] = "RESTlet";
			renamedTypes["User Event Script"] = "User Event";
			renamedTypes["Scheduled Script"] = "Scheduled";
			renamedTypes["Client Script"] = "Client";
			renamedTypes["Portlet Script"] = "Portlet";
			renamedTypes["Workflow Action Script"] = "Workflow Action";
			renamedTypes["Bundle Installation Script"] = "Bundle Installation";
			renamedTypes["User Role"] = "User Roles";
			renamedTypes["Map/Reduce Script"] = "Map Reduce";

			ids = ids.split(",");
			var filters = [];
			var columns = [];

			filters.push(new nlobjSearchFilter('internalid', null,'anyof', ids));
          	// NS-437 --
			//filters.push(new nlobjSearchFilter('isinactive', null,'is', "F"));
			columns.push(new nlobjSearchColumn('custrecord_flo_cust_type'));
			columns[0].setSort();
			columns.push(new nlobjSearchColumn('custrecord_flo_int_id'));
			columns.push(new nlobjSearchColumn('custrecord_flo_data_type'));
			columns.push(new nlobjSearchColumn('custrecord_flo_cust_id'));
			var results = nlapiSearchRecord('customrecord_flo_customization', null, filters, columns);
			var pluginScriptIds = [];
			if(results) {

				nlapiLogExecution("debug","results.length", results.length);
				for(var i=0; results[i] != null; i++) {

					var recordtype = results[i].getText('custrecord_flo_cust_type');
					nlapiLogExecution("DEBUG","recordtype",recordtype);

					if(renamedTypes[recordtype]) {
						recordtype = renamedTypes[recordtype];
					}
					var objId = results[i].getValue('custrecord_flo_int_id');
					var objScriptId = results[i].getValue('custrecord_flo_cust_id') || "";
					if(objId) {
						if(recordtype == "Custom Report") {
							hasReport = true;
							reportIds.push(objId);
						}
						if(recordtype == "User Roles" && parseInt(objId) < 1000) {
							hasUserRole = true;
							//Skip standard roles
							continue;
						} else if(recordtype == "Record") {
							recId = objId;
						} else if(recordtype == "Entry Form" && results[i].getValue('custrecord_flo_data_type') == "RECORD") {
							//Skip custom record forms
							//continue;
                          	hasForm = true;
                          	//formId = objId;
                          	recordForms.push(results[i].getId());
                          	continue;
						} else if(objScriptId.match(/WebSiteHostingFiles/i) != null && (recordtype == "HTML File" || recordtype == "Other File"|| recordtype == "WebApp Script" || recordtype == "JavaScript File")) {
							webHostFiles.push(objId);
							continue;
						}
						if (recordtype == "Plug-In Script") {
							//Plug-In Script needs to be further checked if it's Plug-In Type or Script
							pluginScriptIds.push(objId);
						} else {
							if(idsByRecordTypes[recordtype]) {
								var existingcustids = idsByRecordTypes[recordtype];
								idsByRecordTypes[recordtype] = existingcustids +","+objId;
							} else {
								idsByRecordTypes[recordtype] = objId;
							}
						}
					}
					nlapiLogExecution("debug",recordtype, objId);
				}
			}

			if(pluginScriptIds.length > 0) {
				nlapiLogExecution("DEBUG","pluginScriptIds",pluginScriptIds);
				var allfilters = [["internalid","anyof",pluginScriptIds],"AND",['isinactive','is',"F"]];
				var columns = [];
				columns[0]=new nlobjSearchColumn('scriptid');
      			columns[1]=new nlobjSearchColumn('scripttype');

				var searchScripts = nlapiSearchRecord(null, "customsearch_flo_script_srch", allfilters,columns);
				if (searchScripts) {
					for(var s=0; searchScripts[s] !=null; s++) {
						var scripttype = searchScripts[s].getValue("scripttype") || "";

						nlapiLogExecution("DEBUG","scripttype",scripttype);

						if(scripttype == "PLUGINTYPE") {
							if(idsByRecordTypes["Plug-In Type"]) {
								var existingcustids = idsByRecordTypes["Plug-In Type"];
								idsByRecordTypes["Plug-In Type"] = existingcustids +","+searchScripts[s].getId();
							} else {
								idsByRecordTypes["Plug-In Type"] = searchScripts[s].getId();
							}
						} else {
							if(idsByRecordTypes["Plug-In Script"]) {
								var existingcustids = idsByRecordTypes["Plug-In Script"];
								idsByRecordTypes["Plug-In Script"] = existingcustids +","+searchScripts[s].getId();
							} else {
								idsByRecordTypes["Plug-In Script"] = searchScripts[s].getId();
							}
						}
					}
				}
			}
		}

		var a=request.getAllHeaders();
		var domain=request.getURL().split(/\/app\//)[0];
		a['NS-Client-IP']='64.89.45.251';

		if(Object.keys(idsByRecordTypes).length > 0) {
			// var a=request.getAllHeaders();
			// var domain=request.getURL().split(/app/)[0];
			// a['NS-Client-IP']='64.89.45.251';
			//Check if saved search exists and public
			var hasprivate = false;
			var userRole = nlapiGetRole();
			nlapiLogExecution("debug","userRole", userRole);
			nlapiLogExecution("debug","issavedsearch", ('Saved Search' in idsByRecordTypes));
			//if(userRole !== 3 ) {
				if(idsByRecordTypes  && ('Saved Search' in idsByRecordTypes) && idsByRecordTypes['Saved Search']) {
					hasprivate = checkSearchAccess(idsByRecordTypes['Saved Search'],a,domain,'Search');
				}

				if(!hasprivate && idsByRecordTypes  && ('Mass Update' in idsByRecordTypes) && idsByRecordTypes['Mass Update']) {
					hasprivate = checkSearchAccess(idsByRecordTypes['Mass Update'],a,domain,'Mass Update');
				}
			//}



			var ok = true;
			if(hasprivate) {

				ok = false;
				response.write("<script>alert('A Saved Search/Mass Update is found to be in Private Access which you need to run in a manual spider or you can wait for the autospider.');parent.removeModal();</script>");
			}
			if(ok) {

				//If customization type is Record, spider the record's custom field
				if(idsByRecordTypes.hasOwnProperty("Record") && idsByRecordTypes["Record"]) {
					var parentIds = idsByRecordTypes["Record"];
					var parentArr = parentIds.split(",");
					for(var p = 0; p < parentArr.length; p++) {
						if(idsByRecordTypes["Custom Record Field"]) {
							var existingcustids = idsByRecordTypes["Custom Record Field"];
							idsByRecordTypes["Custom Record Field"] = existingcustids +",parent-"+parentArr[p];
						} else {
							idsByRecordTypes["Custom Record Field"] = "parent-" + parentArr[p];
						}
					}
				}

				// var listspiderurl=nlapiResolveURL('SUITELET','customscript_flo_accountlist_spider',1);
				// nlapiRequestURL(domain+listspiderurl, null, a);

				var url=nlapiResolveURL('SUITELET','customscript_getfields_server_side_rt',1);
				nlapiLogExecution("debug","url", url);
				var formchangeurl=nlapiResolveURL('SUITELET', 'customscript_cstm_doc_form_lvl_spider',1);
				//nlapiLogExecution("debug","requesturl", reportchangesurl);

				var rectypeObjPair = JSON.stringify(idsByRecordTypes);
				nlapiLogExecution("debug","fullurl",domain+url+"&update=T&rectypeObjPair="+rectypeObjPair);
				response.write("<script>window.location='"+domain+url+"&update=T&rectypeObjPair="+rectypeObjPair+"&crid="+crid+"'</script>");

				if (recId != null) {
					nlapiRequestURL(domain+formchangeurl+"&isautospider=F&itemNum="+recId, null, a);
				}
			}
		}

		//List type
		if (ctype == 1) {
			try {
				var listspiderurl=nlapiResolveURL('SUITELET','customscript_flo_accountlist_spider',1);
				nlapiRequestURL(domain+listspiderurl, null, a);
			} catch(e) {

			}	
		}

		try {
			var proprequests = "";
			if(ctype == "50" || hasUserRole==true || (idsByRecordTypes && idsByRecordTypes.hasOwnProperty("User Roles")) || (idsByRecordTypes && idsByRecordTypes.hasOwnProperty("Standard Sublist")  && idsByRecordTypes["Standard Sublist"] && idsByRecordTypes["Standard Sublist"].indexOf("globalpermissions") != -1) ) {
				try {
					var roleassignmenturl=nlapiResolveURL('SUITELET','customscript_flo_role_change_spider',1);
					nlapiLogExecution("debug","requesturl", roleassignmenturl);
					nlapiRequestURL(domain+roleassignmenturl, null, a);
				} catch(e) {

				}
			} 

			if(hasReport && reportIds && reportIds.length > 0) {
				try {
					var reportchangesurl=nlapiResolveURL('SUITELET','customscript_flo_report_spider',1);
					nlapiLogExecution("debug","requesturl", reportchangesurl);
					nlapiRequestURL(domain+reportchangesurl+"&respidernow=T&reportids="+reportIds.join(','), null, a);
				} catch(e) {

				}
			}
          
          	if(hasForm && recordForms.length > 0) {
          		try {
					var formchangeurl=nlapiResolveURL('SUITELET', 'customscript_cstm_doc_form_lvl_spider',1);
					nlapiLogExecution("debug","requesturl", formchangeurl);
	                //var rectypeObjPair = JSON.stringify(idsByRecordTypes);
	                for(var f = 0; f < recordForms.length; f++) {
	                	var formid = recordForms[f];
	                	nlapiRequestURL(domain+formchangeurl+"&isautospider=F&respidernow=T&itemNum="+formid, null, a);
	                }
                } catch(e) {

				}
               
			}

			if(webHostFiles && webHostFiles.length > 0) {
				try {
					var webhosturl=nlapiResolveURL('SUITELET', 'customscript_flo_webhostcust_respidernow',1);
					nlapiRequestURL(domain+webhosturl+"&respidernow=T&wehostFileIds="+webHostFiles.join(','), null, a);
				} catch(e) {

				}
				
			}
		} catch(ee) {
			nlapiLogExecution("debug","ee", ee);
		}



	} catch (e) {
		nlapiLogExecution("debug","error", e);
	}
	nlapiLogExecution("DEBUG","Last Response");
	response.write("<script>parent.removeModal(true);</script>");

}



function checkSearchAccess(ids,a,domain,type) {
	var userId = nlapiGetUser();
	nlapiLogExecution("debug","userId",userId);
	var entityId = "NOUSERFOUND";
	try {
		entityId = nlapiLookupField('employee',userId,'entityid');
		nlapiLogExecution("debug","entityId",entityId);
	} catch(e){
		nlapiLogExecution("debug","e",e);
	}
	var searchids = [];
	if(ids.indexOf(',') > -1) {
		searchids = ids.split(',');
	} else {
		searchids.push(ids);
	}
	nlapiLogExecution("debug","searchids", typeof searchids);

	var foundprivate = false;
	var searchurl = "https://system.na1.netsuite.com/app/common/search/savedsearches.nl?sortcol=type&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&showall=F&allprivate=T&use=ALL&type=&accesslevel=ALL&scheduled=ALL&bundlefilter=BLANK&frame=B&segment='000GETFULLLIST&showall=F";
	if(type == "Mass Update") {
		searchurl = "https://system.na1.netsuite.com/app/common/bulk/savedbulkops.nl?whence=&allprivate=T&frame=B&segment='000GETFULLLIST&showall=F"
	}
	searchurl=domain+searchurl.split("netsuite.com")[1];
	var reqPage = nlapiRequestURL(searchurl,null,a)
    var page=reqPage.getBody();
	//nlapiLogExecution("debug","page", page);
	if(page) {
	   pageRows=page.split(/\<tr id='row[0-9]+\'\>/g);
	  //if rows are not located - use pattern for 2014.2
	  if(pageRows.length==1) {
		  pageRows=page.split(/\<tr class=\'uir-list-row-tr uir-list-row-[o,d,e,v,n]*\'.*id='row[0-9]+\'\>/g);
	   }

	   headerrow=pageRows[0].substring(pageRows[0].lastIndexOf("<tr"));
	   if(headerrow.indexOf('<div class="listheader">')<0)
       {return false;}
   	   var NotFoundIdinList = searchids.slice();
	   for(p=1;pageRows[p]!=null;p++){
		   thisRow=pageRows[p];
		   cells=thisRow.split("\n");
		   intid=thisRow.split("id=")[1].split("&")[0].split('"')[0].split("'")[0];
		   scriptid=thisRow.match(/customsearch[a-zA-Z_0-9]+/i);
		   if(!intid) {
				intid=thisRow.split("href=")[1].split("id=")[1].split("&")[0].split('"')[0].split("'")[0];
		   }
		   //nlapiLogExecution("debug","row", intid +  searchids);
		   var owner = cells[10];
		   if(!owner) {
				owner = 'none';
		   }

		   if(intid && (NotFoundIdinList.indexOf(intid) !== -1)) {
		   		NotFoundIdinList.splice(NotFoundIdinList.indexOf(intid), 1);
		   } else if(scriptid != null && NotFoundIdinList.indexOf(scriptid[0]) != -1) {
		   		NotFoundIdinList.splice(NotFoundIdinList.indexOf(scriptid[0]), 1);
		   }

		 /*  if(intid && (searchids.indexOf(intid) > -1 || (scriptid != null && searchids.indexOf(scriptid[0]) != -1 )) && thisRow.indexOf('Private') > -1 && thisRow.indexOf(entityId) == -1) {
			   nlapiLogExecution("debug","intid", intid + " in " + ids  + " owner: "+ owner);
			   foundprivate = true;
			   break;
		   } */
	   }
	   //++ NS-621
	   if(NotFoundIdinList.length > 0) {
	   		try {
	   			var scriptIDs = [];
	   			for(var n = 0; n < NotFoundIdinList.length; n++) {
	   				var searchID = NotFoundIdinList[n];
	   				if(isNumeric(searchID)) {
	   					if(scriptIDs.length > 0) {
	   						scriptIDs.push('OR')
	   					}
	   					scriptIDs.push(['custrecord_flo_int_id','equalto',searchID]);
	   				} else {
	   					if(scriptIDs.length > 0) {
	   						scriptIDs.push('OR')
	   					}
	   					scriptIDs.push(['custrecord_flo_cust_id','is',searchID]);
	   				}
	   			}

	   			nlapiLogExecution("debug", "scriptIDs", scriptIDs);
	   			if(scriptIDs.length > 0) {
	   				// Get column names
					var privateSearch = nlapiSearchRecord(
						'customrecord_flo_customization',
						null,
						[scriptIDs, 'AND', ['custrecord_flo_cust_type','anyof',[8,9]],'AND',['isinactive','is','F'],'AND',['custrecord_flo_customization','contains','Access:Private,']], 
						[
							new nlobjSearchColumn('internalid')
						]
					);

					if(privateSearch && privateSearch.length > 0) {
						nlapiLogExecution("debug", "privateSearch", privateSearch.length);
						foundprivate = true;
					}
	   			}
				
			} catch(e) {
				nlapiLogExecution("debug", "Error", e);
			}
	   }
	   //-- NS-621
	}
	return foundprivate;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
