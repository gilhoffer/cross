function getDeploymentParameters() {
    try {
        var MAX_TIME=600000; //10 minutes
        var START_TIME=new Date().getTime();
        var context = nlapiGetContext();

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
                            var  fields = ["custrecord_flo_searches","custrecord_flo_data_source"];
                            var values = [searchparams,datasourcesparams];
                            nlapiSubmitField("customrecord_flo_customization", deploymentCustomization, fields, values, false);

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
