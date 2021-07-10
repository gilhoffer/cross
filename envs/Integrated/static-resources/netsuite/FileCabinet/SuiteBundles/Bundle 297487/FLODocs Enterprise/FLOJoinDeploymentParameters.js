function getDeploymentParameters() {
    try {
        var MAX_TIME=600000; //10 minutes
        var START_TIME=new Date().getTime();
        var context = nlapiGetContext();

        //++ NS-584
        try {
            var spiderConfig = nlapiLoadRecord('customrecord_flo_spider_configuration', 1)
            var configFrom = spiderConfig.getFieldValue('custrecord_flo_script_start_time');
            var configTo = spiderConfig.getFieldValue('custrecord_flo_script_end_time');
            nlapiLogExecution("debug","configFrom",configFrom);
            if(configFrom && configTo) {
                 if(configFrom && configTo && !isWithinTimeWindow(configFrom,configTo)) {
                    nlapiLogExecution("audit","current time out of time range.","current time out of time range.");
                    return;
                }
            }
           

        } catch(e){
            nlapiLogExecution("debug","time range.",e);
        }
        //-- NS-584

        var lastIndex = context.getSetting('SCRIPT', 'custscript_flo_last_dep_index') || 0;
        nlapiLogExecution("debug","lastIndex",lastIndex);
       var filters = [['internalidnumber','greaterthanorequalto',lastIndex],'AND',['isdeployed','is','T'],'AND',['formulatext:{scriptid}','startswith','customdeploy']];
      // var filters = [['internalidnumber','equalto',93],'AND',['isdeployed','is','T'],'AND',['formulatext:{scriptid}','startswith','customdeploy']];
        var columns = [new nlobjSearchColumn('internalid')];
        columns[0].setSort();

        var scriptDeployments = nlapiSearchRecord("ScriptDeployment", null, filters,columns);

        if(scriptDeployments) {
            for(var i=0; scriptDeployments[i] != null; i++) {
                //CHECK SCRIPT USAGE
                var remainingUsage=context.getRemainingUsage();
                var timeDiff=new Date().getTime() - START_TIME;
                if (remainingUsage <= 1000 || timeDiff > MAX_TIME || i == 999){
                    nlapiLogExecution("DEBUG","Rescheduling","RemainingUsage="+remainingUsage+",TimeDiff="+timeDiff+",index="+i);
                    nlapiLogExecution("AUDIT","Rescheduling","Last Deployment="+ scriptDeployments[i].getId());
                    var sparams = [];
                    sparams['custscript_flo_last_dep_index'] = scriptDeployments[i].getId();
                    var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams);
                    if ( status == 'QUEUED' ) {
                        return;
                        nlapiLogExecution("debug","FLO End");
                    }
                } else {
                    var deploymentCustomization = findCustomization(51,scriptDeployments[i].getId()); 
                    if(deploymentCustomization && deploymentCustomization != 0) {
                        var deploymentRecord = nlapiLoadRecord("ScriptDeployment", scriptDeployments[i].getId());
                        var script_internalid = deploymentRecord.getFieldValue('script');

                        var scriptRec = nlapiLoadRecord("Script", script_internalid);
                        var searches = [];
                        var lists = [];
                        var records = [];
                        var linecount = scriptRec.getLineItemCount("parameters");
                        for(var j = 1; j <= linecount; j++) {
                            var paramfieldtype = scriptRec.getLineItemValue("parameters", "fieldtype", j);
                            var paraminternalid = scriptRec.getLineItemValue("parameters", "internalid", j);
                            var paramid = scriptRec.getLineItemValue("parameters", "id", j);
                            var parameterValue = deploymentRecord.getFieldValue(paraminternalid);
                           
                            if(paramfieldtype == "List/Record") {
                                nlapiLogExecution("debug","paramdetails",paraminternalid + " -- " + paramfieldtype + " --- value: " + parameterValue)
                                var paramRec = nlapiLoadRecord("scriptcustomfield", paramid);
                                var selectrecordtype = paramRec.getFieldValue("selectrecordtype");
                                var fldselectislist = paramRec.getFieldValue("fldselectislist");
                                if(selectrecordtype) {
                                    selectrecordtype = parseInt(selectrecordtype);
                                    if(selectrecordtype == -119) {
                                        //-119 is the internalid of Saved Searches
                                        if(parameterValue) {
                                            searches.push(parameterValue);
                                        }
                                    } else if(selectrecordtype > 0) {
                                        var customizationfound = 0;
                                        if(fldselectislist == "T") {
                                            lists.push(selectrecordtype);
                                        } else {
                                            records.push(selectrecordtype)
                                        }
                                    }
                                }
                               
                            } else if(parameterValue && ((paraminternalid && paraminternalid.toUpperCase().indexOf('SEARCH') > -1) || parameterValue.toUpperCase().indexOf("CUSTOMSEARCH") == 0) ) {
                                 nlapiLogExecution("debug","paramdetails",paraminternalid + " -- " + paramfieldtype + " --- value: " + parameterValue)
                                searches.push(parameterValue);
                            }
                        }

                        var searchparams = [];
                        var datasourcesparams = [];
                        if(searches.length > 0) {
                            searchparams = getCustomizationRecords(searches,8,searchparams)
                        }
                        if(lists.length > 0) {
                            datasourcesparams = getCustomizationRecords(lists,1,datasourcesparams)
                        }

                        if(records.length > 0) {
                            datasourcesparams = getCustomizationRecords(records,2,datasourcesparams)
                        }

                        try {
                            //Search and Data Sources field in the Deployment Customization. Join Deployment to linked Customization.   
                            var saveme = false;
                            var deploymentCustRecord = nlapiLoadRecord("customrecord_flo_customization", deploymentCustomization)
                            var current_custrecord_flo_searches = deploymentCustRecord.getFieldValues("custrecord_flo_searches");
                            var current_custrecord_flo_data_source = deploymentCustRecord.getFieldValues("custrecord_flo_data_source");

                            if(!current_custrecord_flo_searches){
                                current_custrecord_flo_searches = [];
                            } else if(current_custrecord_flo_searches instanceof Array) {
                                current_custrecord_flo_searches = current_custrecord_flo_searches.join(',').split(',');
                            } else {
                                current_custrecord_flo_searches = current_custrecord_flo_searches.split(',')
                            }

                            if(!current_custrecord_flo_data_source){
                                current_custrecord_flo_data_source = [];
                            } else if(current_custrecord_flo_data_source instanceof Array) {
                                current_custrecord_flo_data_source = current_custrecord_flo_data_source.join(',').split(',');
                            } else {
                                current_custrecord_flo_data_source = current_custrecord_flo_data_source.split(',')
                            }

                            if(current_custrecord_flo_searches) {
                                for(var c = 0; c < searchparams.length; c++) {
                                    var searchid = searchparams[c];
                                    if(current_custrecord_flo_searches.indexOf(searchid) == -1) {
                                        saveme = true;
                                        break;
                                    }
                                }
                            }

                            if(!saveme && current_custrecord_flo_data_source) {
                                for(var c = 0; c < datasourcesparams.length; c++) {
                                    var searchid = datasourcesparams[c];
                                    if(current_custrecord_flo_data_source.indexOf(searchid) == -1) {
                                        saveme = true;
                                        break;
                                    }
                                }
                            }

                            var hashString = ""; 
                            var objectJSON = "";
                            var prevObjectJSON = deploymentCustRecord.getFieldValue('custrecord_flo_object_json');
                            try {
                                objectJSON = parseObjectJSON(deploymentRecord);
                                if(objectJSON) {
                                    hashString =  nlapiEncrypt(objectJSON, "sha1");
                                }
                                if(objectJSON != prevObjectJSON) {
                                    saveme = true;
                                }
                            } catch(e) {
                                nlapiLogExecution("debug","hashString",e)
                                
                            }
                            
                            

                            if(saveme) {

                                var  fields = ["custrecord_flo_searches","custrecord_flo_data_source","custrecord_flo_object_json","custrecord_flo_object_hash"];
                                var values = [searchparams,datasourcesparams,objectJSON,hashString];
                                nlapiSubmitField("customrecord_flo_customization", deploymentCustomization, fields, values, false);
                                nlapiLogExecution("debug","submit",deploymentCustomization)
                            }
                            

                            //Handle JOINS
                            var currentlinks = searchparams.concat(datasourcesparams);
                            removeOldLinks(deploymentCustomization, currentlinks)
                            if(currentlinks.length > 0) {
                                joinDeploymentLinks(deploymentCustomization, currentlinks);
                            }
                        } catch(e1) {
                            nlapiLogExecution("debug","joins",e1)
                        }
                        
                    }
                }
            }  
        }
    } catch(e) {
        nlapiLogExecution("debug","getDeploymentParameters",e)
    }
    
}

function parseObjectJSON(deploymentRec) {
    var cleanJSON = "";
    try {
        var deploymentRecString = JSON.stringify(deploymentRec);
        deploymentRecString = deploymentRecString.replace(/(,)?\"sys_parentid\":\".*?\"/g,"").replace(/(,)?\"sys_id\":\".*?\"/g,"").replace(/(,)?\"_eml_nkey_\":\".*?\"/g,"").replace(/(,)?\"nsapiCT\":\".*?\"/g,"").replace(/(,)?\"id\":\".*?\"/g,"").replace(/(,)?\"entryformquerystring\":\".*?\"/g,"").replace(/(,)?\"primarykey\":\".*?\"/g,"").replace(/(,)?\"version\":\".*?\"/g,"").replace(/(,)?\"externalurl\":\".*?\"/g,"").replace(/(,)?\"url\":\".*?\"/g,"").replace(/(,)?\"internalid\":\".*?\"/g,"").replace(/(,)?\"instancestatuspage\":\".*?\"/g,"").replace(/(,)?\"hiddendeprecatedstatus\":\".*?\"/g,"").replace(/(,)?\"processormodelversion\":\".*?\"/g,"").replace(/\{,\"/g,'{"');

        var deploymentObj = JSON.parse(deploymentRecString);
         nlapiLogExecution("debug","deploymentRecString",deploymentRecString)
        delete deploymentObj['type'];
        delete deploymentObj['isDynamic'];
        delete deploymentObj['id'];
        delete deploymentObj['sublists'];
        delete deploymentObj['userevents'];
        for(var f  in deploymentObj) {
            var fieldvalue = deploymentObj[f];
            try {
                nlapiLogExecution("debug","fieldvalue",fieldvalue)
                if(fieldvalue && typeof fieldvalue == 'object' && fieldvalue.hasOwnProperty('name')) {
                    fieldvalue = fieldvalue.name
                } else if(fieldvalue && fieldvalue instanceof Array && fieldvalue.length > 0) {
                     for(var g = 0; g < fieldvalue.length; g++) {
                        var arrvalue = fieldvalue[g];
                        for(var h in arrvalue) {
                            var fieldText = arrvalue[h];
                            if(fieldText && typeof fieldText == 'object' && fieldText.hasOwnProperty('name')) {
                                fieldText = fieldText.name
                            }
                            fieldvalue[g][h] = fieldText;
                        }
                        
                     }
                }
            } catch(e) {
                nlapiLogExecution("debug","cleanJSON",e)
            }
            deploymentObj[f] = fieldvalue;
        }

        if(deploymentObj.hasOwnProperty('id')) {
            delete deploymentObj['id'];
        }

        cleanJSON = JSON.stringify(deploymentObj);
        nlapiLogExecution("debug","cleanJSON",cleanJSON)
    } catch(e) {
         nlapiLogExecution("debug","parseObjectJSON",e)
    }

    return cleanJSON;
}


function joinDeploymentLinks(deploymentid, currentlinks) {
    var pfilters = [["isinactive",'is',"F"],"AND",["custrecord_flo_cust_type","anyof", [1,2,8]],"AND",["internalid","anyof",currentlinks], "AND", ['custrecord_flo_deployments_list','noneof',[deploymentid]]];
   nlapiLogExecution("debug","pfilters",pfilters)
    var pcolumns = [];
    pcolumns.push(new nlobjSearchColumn("custrecord_flo_deployments_list"));
    var pcustrec=nlapiSearchRecord("customrecord_flo_customization",null,pfilters,pcolumns);
    if(pcustrec) {
        for(var k = 0; pcustrec[k] != null; k++) {
            var custid = pcustrec[k].getId(); 
            var deploymentlist = pcustrec[k].getValue("custrecord_flo_deployments_list");
            var deploymentarr = [];
            if(deploymentlist) {
                deploymentarr = deploymentlist.split(",");
                for(var w=0; w<deploymentarr.length;w++) deploymentarr[w] = parseInt(deploymentarr[w], 10);
            }

            if(deploymentarr.length > 0) {
                //Remove inactive links to prevent error when saving.
                deploymentarr = removeInactiveLinks(deploymentarr);
            }
            deploymentarr.push(deploymentid);

            nlapiSubmitField("customrecord_flo_customization", custid, "custrecord_flo_deployments_list", deploymentarr, false); 
            nlapiLogExecution("debug","ADDING LINKS FOR DEPLOYMENT "+ deploymentid,custid + " " + deploymentarr.join())
        }
    }
}

//Negative join for deployments field on List/Record/Search Customizations.
function removeOldLinks(deploymentid, currentlinks) {
    var pfilters = [["custrecord_flo_cust_type","anyof", [1,2,8]], "AND", ['custrecord_flo_deployments_list','anyof',[deploymentid]]];
    if(currentlinks.length > 0) {
        var custidfilter = ["internalid","noneof",currentlinks];
        pfilters.push("AND");
        pfilters.push(custidfilter);
    }

   // nlapiLogExecution("debug","pfilters",pfilters)
    var pcolumns = [];
    pcolumns.push(new nlobjSearchColumn("custrecord_flo_deployments_list"));

    var pcustrec=nlapiSearchRecord("customrecord_flo_customization",null,pfilters,pcolumns);
    if(pcustrec) {
        for(var k = 0; pcustrec[k] != null; k++) {
            var custid = pcustrec[k].getId(); 
            var deploymentlist = pcustrec[k].getValue("custrecord_flo_deployments_list");
            nlapiLogExecution("debug","deploymentlist",deploymentlist)
            if(deploymentlist) {
                var deploymentarr = deploymentlist.split(",");
                var pos = -1;
                for(var w=0; w<deploymentarr.length;w++) {
                   depid = parseInt(deploymentarr[w]);
                   if(parseInt(deploymentid) == depid) {
                        pos = w;
                        break;
                   }
                }
                nlapiLogExecution("debug",deploymentid+ " pos in" + deploymentarr,pos)
                if(pos != -1) {
                    deploymentarr.splice(pos,1);
                    if(deploymentarr.length > 0) {
                        //Remove inactive links to prevent error when saving.
                        deploymentarr = removeInactiveLinks(deploymentarr);
                    }
                    nlapiSubmitField("customrecord_flo_customization", custid, "custrecord_flo_deployments_list", deploymentarr, false);
                    nlapiLogExecution("debug","REMOVING LINKS FOR DEPLOYMENT "+ deploymentid,custid + " FROM " + deploymentlist + " TO " + deploymentarr.join())
                }
            } 
        }
    }

}

function removeInactiveLinks(ids) {
    var activelinks = ids;
    var ifilter = [["isinactive",'is',"T"],"AND",["internalid",'anyof',ids]];
    var custrec=nlapiSearchRecord("customrecord_flo_customization",null,ifilter);
    if(custrec) {
        for(var l = 0; custrec[l] != null; l++) {
            var ipos = activelinks.indexOf(custrec[l].getId());
            if(ipos != -1) {
                activelinks.splice(ipos,1);
            }
            
        }
    }
    return activelinks;
}

function findCustomization(custtype,custid) {
    var customizationid = 0;
    var pfilters= [];
    pfilters[0]=new nlobjSearchFilter("custrecord_flo_int_id",null,"equalto",custid);
    pfilters[1]=new nlobjSearchFilter("isinactive",null,"is",'F');
    pfilters[2]=new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof", [custtype]);
    pfilters[3]=new nlobjSearchFilter("custrecord_flo_make_join_date",null,"isnotempty",null);
    var pcustrec=nlapiSearchRecord("customrecord_flo_customization",null,pfilters);
    if(pcustrec != null && pcustrec.length == 1) {
        customizationid =pcustrec[0].getId();
    }
    
    return customizationid;
}

function getCustomizationRecords(valuesarr,custtype,matchcontainer){
    var pfilters= [["isinactive","is","F"],"AND",["custrecord_flo_cust_type","anyof",[custtype]]];
    var idfilters = [];
    //build filters
    for(var s = 0; s < valuesarr.length; s++) {
        if(idfilters.length > 0) {
            idfilters.push("OR");
        }
        if(isNumeric(valuesarr[s])) {
            var  filterbyid  = ["custrecord_flo_int_id","equalto",valuesarr[s]];
            idfilters.push(filterbyid);
        } else {
            var  filterbyid  = ["custrecord_flo_cust_id","is",valuesarr[s]];
            idfilters.push(filterbyid);
        }
    }

    if(idfilters.length > 0) {
        pfilters.push("AND");
        pfilters.push(idfilters);

        var pcustrec=nlapiSearchRecord("customrecord_flo_customization",null,pfilters);
        if(pcustrec) {
            for(var k = 0; pcustrec[k] != null; k++) {
                if(matchcontainer.indexOf(pcustrec[k].getId()) == -1 ) {
                    matchcontainer.push(pcustrec[k].getId());
                }
            }
        }
    
    }
    return matchcontainer;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


function isWithinTimeWindow(starttime, endtime) {
            
    //Dummy Record to get current timeof day
    var dummyConfig = nlapiCreateRecord("customrecord_flo_spider_configuration", {recordmode: 'dynamic'});
    currenttime = dummyConfig.getFieldValue('custrecord_flo_conf_current_tod');
    
    starttime = getDateTime(starttime);
    endtime = getDateTime(endtime);
    currenttime = getDateTime(currenttime);
    var ret = false;

    //Compare by Hour and Minutes because Timezone is a mess.

    if(starttime != null && starttime != "" && endtime != null && endtime != "" && currenttime) {

        nlapiLogExecution("debug","currenttime",currenttime.hour + " : " + currenttime.minute);
        nlapiLogExecution("debug","starttime",starttime.hour + " : " + starttime.minute);
        nlapiLogExecution("debug","endtime",endtime.hour + " : " + endtime.minute);

        if(starttime.hour > endtime.hour) {
            if(currenttime.hour > starttime.hour) { 
                ret = true;
            } else if(currenttime.hour == starttime.hour && currenttime.minute >= starttime.minute) {
                ret = true;
            } else if(currenttime.hour < endtime.hour ) {
                ret = true;
            } else if(currenttime.hour == endtime.hour && currenttime.minute < endtime.minute) {
                ret = true;
            }
        } else if(currenttime.hour >= starttime.hour && currenttime.hour <= endtime.hour) {
            if(currenttime.hour == starttime.hour && currenttime.hour == endtime.hour) {
                if(currenttime.minute >= starttime.minute &&  currenttime.minute < endtime.minute)  {
                    ret = true;
                }
            }else if(currenttime.hour == starttime.hour) {
                if(currenttime.minute >= starttime.minute) {
                    ret = true;
                }
            } else if(currenttime.hour == endtime.hour) {
                if(currenttime.minute < endtime.minute) {
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

function getDateTime(time) {
    var d = {hour: 0, minute:0};
    var splitSign = "";
    var userPreferences = nlapiLoadConfiguration('userpreferences');
    var timeFormat = userPreferences.getFieldValue('TIMEFORMAT');
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
        d.hour = hour;
        d.minute = minute;
          
    }else{
        // 24 hours time format (no am/pm)
        //choose split sign
        if (timeFormat == "fmHH24:fmMI") {splitSign = ":";} else {splitSign = "-";}
        // split hours and minutes
        var timeArray = time.split(splitSign);
        
        d.hour = parseInt(timeArray[0]);
        d.minute =parseInt(timeArray[1]);
    }
    
    return d;
}
