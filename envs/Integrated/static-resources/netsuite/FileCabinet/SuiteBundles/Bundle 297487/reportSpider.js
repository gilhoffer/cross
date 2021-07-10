var pbody = "";
var pbodyW = "";
var domainGlobal = ""

function floSpiderReport(request, response) {

    var isautospider = request.getParameter("isautospider");
    var reportids = request.getParameter("reportids");
    var reportidarray = [];
    if(reportids) {
        try {
          reportidarray = reportids.split(',');
        } catch(e) {

        }
    }
    var respidernow = request.getParameter("respidernow");
    if (isautospider == "T") {
        try {
            var spiderbackenddate = nlapiLookupField('customrecord_flo_spider_configuration', 1, 'custrecord_flo_spider_back_en_date') || "";
            if (spiderbackenddate == "") {
                nlapiLogExecution("audit", "initial spider not finished", "exiting because initial spider not finished...");
                return;
            }
        } catch (ee) {

        }
    }

   
    try {
        var reportsToProcess = [];
        var lastmodifiedArr = {};
        var savedmoddates = nlapiGetContext().getSessionObject("lastmodifiedArr");
        pbody = nlapiGetContext().getSessionObject("savedReportArr");
        nlapiLogExecution('debug', "savedmoddates", savedmoddates);

        if(savedmoddates) {
            try {
                lastmodifiedArr = JSON.parse(savedmoddates);
            } catch(ee) {

            }
            
        }
        var procstart = request.getParameter("itemNum");
        if (!isNaN(procstart) && parseInt(procstart) > 0) {
            procstart = parseInt(procstart);
        } else {
            procstart = 1;
        }

        var today = new Date();
        var twoDaysAgo = today.setDate(today.getDate() - 2);
        var startTime = new Date().getTime();
        var MAX_TIME = 30000; //30 seconds
        var reportcount = 0;
        domainGlobal = request.getURL().split(/app/)[0];

        var myheader = request.getAllHeaders();

        var rbody = "";

        rbody = pbody;
        nlapiLogExecution('debug', 'rbody '+procstart, rbody);
        if (rbody == "" || procstart == 1) {

            var url = domainGlobal + 'app/common/search/searchresults.csv?searchtype=debugTrail&style=NORMAL&sortcol=debugTrail_RECITLE11_raw&sortdir=ASC&csv=Export&OfficeXML=F&pdf=&size=500&twbx=F&report=&grid=&searchid=customsearch_flo_report_search';

            nlapiLogExecution('debug', 'BODY: wf', "getBody");

            try {
                var req = nlapiRequestURL(url, null, myheader);
                var rbody = req.getBody();
            } catch (e) {
                nlapiLogExecution('debug', 'validateSearchWorkflow', e);
                rbody = "";
            }

            pbody = rbody;
            nlapiGetContext().setSessionObject("savedReportArr", pbody);
        }

        
        if (pbody != "") {


            myArr = pbody.split('\n')
            
            
            nlapiLogExecution('debug', 'procstart', procstart);

            if (myArr.length > 2) {
                reportcount = myArr.length - 2;
            }
            if (procstart == 1) {
                nlapiLogExecution('debug', 'reportcount', reportcount);
                updateSpiderCount(reportcount)
            }

             //GET LAST MODIFIED DATE
            if(Object.keys(lastmodifiedArr).length == 0 || procstart == 1) {
                nlapiLogExecution('debug', "GET LAST MODIFIED DATE", "GET LAST MODIFIED DATE");
                var lastmodurl = domainGlobal + 'app/common/search/searchresults.csv?searchtype=debugTrail&style=NORMAL&sortcol=debugTrail_RECITLE11_raw&sortdir=ASC&csv=Export&OfficeXML=F&pdf=&size=500&twbx=F&report=&grid=&searchid=customsearch_flo_reportlastmodfied';
                try {
                    var req2 = nlapiRequestURL(lastmodurl, null, myheader);
                    var resp = req2.getBody();
                    if(resp) {
                        var lastmoddatescsv = resp.split('\n');
                        if(lastmoddatescsv.length > 1) {
                            for(var m = 1; m < lastmoddatescsv.length; m++) {
                                if(lastmoddatescsv[m]) {
                                     var modcells = CSVtoArray(lastmoddatescsv[m]);
                                     if(!modcells) {continue;}

                                     var custReportId = "custreport_"+modcells[0];
                                     var custReportDate = modcells[1];
                                     lastmodifiedArr[custReportId] = custReportDate;
                                }
                               
                            }

                            nlapiGetContext().setSessionObject("lastmodifiedArr", JSON.stringify(lastmodifiedArr));
                        }
                    }
                } catch(e) {
                    nlapiLogExecution('debug', "lastmodifiedArr", e);
                }
            }
            for (i = procstart; i < myArr.length; i++) {

                var remainingUsage = nlapiGetContext().getRemainingUsage();
                var timeDiff = new Date().getTime() - startTime;
                nlapiLogExecution('debug', 'remaining usage', remainingUsage + ' - ' + timeDiff);
                if (remainingUsage <= 200 || timeDiff > MAX_TIME) {
                    storeFile(reportsToProcess,i);
                    if (isautospider == "T" || respidernow == "T") {
                        
                        var sparams = [];
                        sparams['itemNum'] = i;
                        sparams['isautospider'] = isautospider;
                        sparams['respidernow'] = respidernow;
                        sparams['reportids'] = reportids;
                        nlapiSetRedirectURL('SUITELET', 'customscript_flo_report_spider', 1, false, sparams)
                        return;
                    } else {
                        response.write(i);
                        return;
                    }

                } else {
                    var values = myArr[i].split(",");


                    var intid = values[0];

                    var name = values[1];

                    var owner = values[2];

                    nlapiLogExecution('debug', 'intid', intid);
                    if (intid != "") {

                        if(respidernow == "T" && reportids.indexOf(intid) == -1) {
                           continue;
                        }
                        
                        if(respidernow == "T") {
                            var recid = checkCust(intid);

                            if (recid == "") {


                                var custrec = nlapiCreateRecord("customrecord_flo_customization");
                                custrec.setFieldValue("name", name);
                                custrec.setFieldValue("custrecord_flo_int_id", intid);
                                custrec.setFieldValue("custrecord_flo_cust_type", 40);
                                custrec.setFieldValue("custrecord_flo_cust_in_use", "T");
                                custrec.setFieldValue("isinactive", "F");

                                var myOw = getEmpId(owner)

                                if (myOw == "") myOw = getDefaultUser();

                                nlapiLogExecution('debug', 'myOw', myOw);

                                nlapiLogExecution('debug', 'owner', owner);



                                if (owner != "") custrec.setFieldValue("owner", myOw);

                                //var auditobj = validateReport(intid, myheader, domainGlobal);
                                var key = "custreport_"+intid;
                                var lastmodifieddate = lastmodifiedArr[key]
                                nlapiLogExecution('debug', 'lastmodifieddate', name + ' ' + intid + ' ' + lastmodifieddate);
                                if (lastmodifieddate != "") {
                                    try {
                                        var newdlu = nlapiDateToString(nlapiStringToDate(lastmodifieddate));
                                        custrec.setFieldValue("custrecord_flo_dls", newdlu);
                                    } catch (eee) {

                                    }

                                }
                                nlapiSubmitRecord(custrec);
                            } else {

                               // var auditobj = validateReport(intid, myheader, domainGlobal);
                                //nlapiLogExecution('debug', 'hashistory', name + ' ' + intid + ' ' + auditobj.history);
                                var key = "custreport_"+intid;
                                var lastmodifieddate = lastmodifiedArr[key];
                                 nlapiLogExecution('debug', 'lastmodifieddate', name + ' ' + intid + ' ' + lastmodifieddate);
                                if (lastmodifieddate != "") {
                                    try {
                                        var newdlu =  nlapiDateToString(nlapiStringToDate(lastmodifieddate));
                                        var custrecord = nlapiLoadRecord('customrecord_flo_customization', recid)
                                        var currentdlu = custrecord.getFieldValue('custrecord_flo_dls');
                                        var currentname = custrecord.getFieldValue('name');
                                        var currentowner = custrecord.getFieldValue('owner');
                                        var isinactive = custrecord.getFieldValue('isinactive');

                                        if(isinactive == "T") {
                                             updaterecord = true;
                                             custrecord.setFieldValue("isinactive", "F");

                                        }

                                        var updaterecord = false;
                                        if (newdlu != currentdlu) {
                                            updaterecord = true;
                                            custrecord.setFieldValue('custrecord_flo_dls', newdlu);
                                        }

                                        if (name != currentname) {
                                            updaterecord = true;
                                            custrecord.setFieldValue('name', name);
                                        }

                                        var myOw = getEmpId(owner)

                                        if (myOw == "") myOw = getDefaultUser();

                                        if (myOw != "" && myOw != currentowner) {
                                            updaterecord = true;
                                            custrecord.setFieldValue('owner', myOw);
                                        }

                                        if (updaterecord) {
                                            nlapiSubmitRecord(custrecord);
                                        }

                                    } catch (eee) {

                                    }

                                }
                                try{
                                    var lastmodDateObj = nlapiStringToDate(lastmodifieddate);
                                    if (lastmodDateObj > twoDaysAgo) {
                                        nlapiLogExecution('debug', 'process report', name + ' ' + intid);
                                        nlapiSubmitField('customrecord_flo_customization', recid, 'custrecord_flo_change_detected', 'F');
                                        nlapiSubmitField('customrecord_flo_customization', recid, 'custrecord_flo_change_detected', 'T');
                                    }

                                } catch(e) {

                                }
                                
                            }
                        } else {
                            
                            var key = "custreport_"+intid;
                            var lastmodifieddate = lastmodifiedArr[key];
                            var lastmodDateObj = null;
                            if(lastmodifieddate) {
                                lastmodDateObj = nlapiStringToDate(lastmodifieddate);
                                lastmodifieddate = nlapiDateToString(lastmodDateObj);
                            }
                            if(isautospider == "T" && checkCust(intid) != "" && ( lastmodDateObj == null || lastmodDateObj < twoDaysAgo)) {
                                continue;
                            }
                            var reportObj = {};
                            reportObj.Name = name;
                            reportObj.Internal_Id = intid;
                            reportObj.rectype = "Custom Report";
                            var myOw = getEmpId(owner);
                            if (myOw == "") myOw = getDefaultUser();
                            reportObj.owner = myOw;
                            //++ NS-640
                            //reportObj.last_modified = lastmodifieddate;
                            try {
                                reportObj.last_modified = nlapiStringToDate(lastmodifieddate).getTime();
                            } catch (lastModifiedE) {
                                nlapiLogExecution("DEBUG", "lastModifiedE", lastModifiedE);
                                reportObj.last_modified = "";
                            }
                            //-- NS-640
                            reportObj.customizationstring = "Internal_Id:"+intid;
                            reportsToProcess.push(reportObj);
                        }



                        

                    }
                }

            };


        }
        if(reportsToProcess.length > 0) {
            storeFile(reportsToProcess,reportcount);
        }

         if (isautospider == "T") {
            try {
                var status = nlapiScheduleScript('customscript_spider_schedule', 1);
                if ( status == 'QUEUED' ){
                    nlapiLogExecution("debug","Script Status","Script Scheduled");
                }
            } catch(e) {

            }
         }
         if (isautospider == "T" || respidernow =="T") {
              var sparams2 = [];
              sparams2['respidernow'] = respidernow;
              sparams2['reportids'] = reportids;
              //++ NS-528
              try {
                nlapiSetRedirectURL('SUITELET', 'customscript_flo_report_changes', 1,false,sparams2)
              } catch(e) {

              }
              //-- NS-528
              return;
          } 
        response.write('done');
    } catch (e) {
        nlapiLogExecution('AUDIT', 'reportspider', e);
    }
}

function storeFile(reportArr,count) {
    try {
         
        var fileJSON = {};
        fileJSON.lines = reportArr
        var foldersearch = nlapiSearchRecord('Folder', 'customsearch_flo_spider_folder');
        if(foldersearch && foldersearch[0]) {
            var folderid = foldersearch[0].getId();
            var filename = 'customreports-'+count+".txt";
            var contents = JSON.stringify(fileJSON);
            file = nlapiCreateFile(filename,'PLAINTEXT',contents);
            file.setFolder(folderid);
            var id = nlapiSubmitFile(file);
            nlapiLogExecution('debug', 'storeFile', contents);
        }
    } catch(e) {
         nlapiLogExecution('debug', 'storeFile', e);
    }
}

function validateReport(intid, myheader, domainGlobal) {
    var history = false;
    var lastmodifieddate = "";
    var returnAuditObj = {};
    var url = domainGlobal + "app/reporting/reportcomposer.nl?curstep=4&cr=" + intid + "&r=T&e=T&id=-1&machine=audittrail";
    var rbody = "";
    try {
        var req = nlapiRequestURL(url, null, myheader);
        var rbody = req.getBody();

        if (rbody) {
            var pageRows = rbody.split(/<tr.*?id='audittrailrow.*?>/g);


            if (pageRows != null && pageRows.length > 1) {
                for (var p = 1; pageRows[p] != null; p++) {
                    //  nlapiLogExecution('debug', 'pageRows', pageRows[p]);
                    var cells = pageRows[p].split('</td>')
                    nlapiLogExecution('debug', 'cells', cells[0]);
                    try {
                        var moddate = cells[0].replace(/<(\/)?td.*?>/g, '');
                        moddate = nlapiStringToDate(moddate)
                        if (lastmodifieddate == "") {
                            lastmodifieddate = moddate;
                        } else if (moddate > lastmodifieddate) {
                            lastmodifieddate = moddate;
                        }
                    } catch (ee) {
                        nlapiLogExecution('debug', 'ee', ee);
                    }

                }
            }
        }
    } catch (e) {
        nlapiLogExecution('debug', 'validateSearchWorkflow', e);
        rbody = "";
    }
    //nlapiLogExecution('debug', 'rbody', rbody);
    var strDate = nlapiDateToString(new Date());
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1)
    var strDateYes = nlapiDateToString(yesterday);

    if (rbody.indexOf(strDate) >= 0 || rbody.indexOf(strDateYes) >= 0) {
        history = true;
    }
    returnAuditObj.lastmodifieddate = lastmodifieddate;
    returnAuditObj.history = history;
    return returnAuditObj;
}

function checkCust(ID) {
    
    var recnum = 40;

    custSearch = nlapiLoadSearch("customrecord_flo_customization", 'customsearch_flo_cust_search');
    custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_type", null, "anyof", recnum))
    custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_int_id", null, "equalto", ID))
    custResults = custSearch.runSearch();

    custs = custResults.getResults(0, 1);
    //if the list is blank, create a default record
    if (custs != null && custs[0]) {
        return custs[0].getId();
    } else {
        return "";
    }

    return ""
}

function validateChange(name, a, searchid, wf) {

    var myheader = a //{"User-Agent-x": "SuiteScript-Call"};
    var rbody = "";

    var spider = 0;

    rbody = pbodyW;


    if (rbody == "") {

        var url = domainGlobal + 'app/common/search/searchresults.csv?searchtype=debugTrail&style=NORMAL&sortcol=debugTrail_RECITLE11_raw&sortdir=ASC&csv=Export&OfficeXML=F&pdf=&size=500&twbx=F&report=&grid=&searchid=customsearch_flo_report_change';

        nlapiLogExecution('debug', 'BODY: wf', "getBody");

        try {
            var req = nlapiRequestURL(url, null, myheader);
            var rbody = req.getBody();
        } catch (e) {
            nlapiLogExecution('debug', 'validateSearchWorkflow', e);
            rbody = "";
        }

        pbodyW = rbody;


    }

    nlapiLogExecution('debug', 'BODY: ' + url, rbody);
    nlapiLogExecution('debug', 'BODY: name', name);
    nlapiLogExecution('debug', 'BODY: index', rbody.indexOf(name));

    var strDate = nlapiDateToString(new Date());
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1)
    var strDateYes = nlapiDateToString(yesterday);


    if (rbody.indexOf(name) >= 0) {
        if (rbody.indexOf(strDate) >= 0 || rbody.indexOf(strDateYes) >= 0) {
            spider = 1;
        }
    }


    return spider;

}

function updateSpiderCount(count) {
    try {

        var logfilters = [
            ['custrecord_flo_log_type', 'anyof', [40]]
        ];
        var logresults = nlapiSearchRecord('customrecord_flo_spider_log', null, logfilters);
        if (logresults && logresults.length > 0) {
            var logfields = ['custrecord_flo_log_spider_count', 'custrecord_flo_config_stats_link'];
            var logvalues = [count, 1]
            nlapiSubmitField('customrecord_flo_spider_log', logresults[0].getId(), logfields, logvalues)
        }


    } catch (e) {
        nlapiLogExecution("debug", "updateSpiderCount", e)
    }
}

function getEmpId(name) {
	if(name == null || name == undefined || name === '') {
		return '';
	}

    emplist = "";
    if (emplist == "") {
        //load a list of employees
        var empfilts = [];
        empfilts[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
        empfilts[1] = new nlobjSearchFilter('entityid', null, 'is', name);


        var empcols = [];
        empcols[0] = new nlobjSearchColumn("entityid");

        try {
            emplist = nlapiSearchRecord("employee", null, empfilts, empcols);
        } catch (e) {

            var empfilts = [];
            empfilts[0] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            emplist = nlapiSearchRecord("employee", null, empfilts, empcols);
        }
    }
	if(emplist !== null && emplist !== undefined && emplist !== '') {
		for (e = 0; emplist[e] != null && e < emplist.length; e++) {
	        cols = emplist[e].getAllColumns();
	        if (emplist[e].getValue(cols[0]).match(name)) {
	            return emplist[e].getId();
	        }
	    }
	}
    ////nlapiLogExecution('ERROR', 'For End emp list 2','');
    return ''
}


function getDefaultUser() {
  //This function returns the id of the default SuiteView user
  var defuser = nlapiGetContext().getSessionObject("defuser");
  try {
    if (defuser == null | defuser == "") {
      filters = [];
      filters[0] = new nlobjSearchFilter("lastname", null, 'is', 'FLODocs User');
      //filters[1]=new nlobjSearchFilter("isinactive",null,'is','F');

      var column = [];
      column[0] = new nlobjSearchColumn('isinactive');
      column[0].setSort(true);
      defemps = nlapiSearchRecord("employee", null, filters, column)
      if (defemps == null) {
        defemp = nlapiCreateRecord("employee");
        defemp.setFieldValue("firstname", "Default");
        defemp.setFieldValue("lastname", "FLODocs User");
        defemp.setFieldValue("comments", "This is a dummy record used as a placeholder for missing record owner and to route custom controls");

        try {
          defemp = nlapiSubmitRecord(defemp, false, true);
        } catch (e) {
          defemp.setFieldValue("billpay", 'F');
          defemp = nlapiSubmitRecord(defemp, false, true);
        }

      } else {
        defemp = defemps[0].getId()
        if (defemps[0].getValue('isinactive') == "T") {
          nlapiSubmitField('employee', defemp, 'isinactive', 'F');
        }


      }
      nlapiGetContext().setSessionObject("defuser", defemp);
      defuser = defemp;
    }
  } catch (err) {
    nlapiLogExecution("debug", "err", err)
    try {
        var defEmpSearch = nlapiSearchRecord('employee', null, [['isinactive','is','F'],'AND',['giveaccess','is','T'],'AND',['role','anyof',[3]]], [new nlobjSearchColumn('internalid', null, 'min')]);

        if(defEmpSearch && defEmpSearch.length > 0) {
            var firstcol = defEmpSearch[0].getAllColumns();
            defuser = defEmpSearch[0].getValue(firstcol[0]);
        } 
        nlapiLogExecution("debug", "defuser1", defuser)
        if(defuser == null || defuser == "") {
            defuser = -5;
        }
    } catch(e) {
        nlapiLogExecution("debug", "err getDefaultUser", e)
        defuser = -5;
    }
    
  }
  nlapiLogExecution("debug", "defuser", "defuser")
  return defuser;
}

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
    var re_valid = /^\s*(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,"\s\\]*(?:\s+[^,"\s\\]+)*)\s*(?:,\s*(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,"\s\\]*(?:\s+[^,"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,"\s\\]*(?:\s+[^,"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) return null;
    var a = [];                     // Initialize array to receive values.
    text.replace(re_value, // "Walk" the string using replace with callback.
        function(m0, m1, m2, m3) {
            // Remove backslash from \' in single quoted values.
            if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
            // Remove backslash from \" in double quoted values.
            else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
            else if (m3 !== undefined) a.push(m3);
            return ''; // Return empty string.
        });
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push('');
    return a;
}
