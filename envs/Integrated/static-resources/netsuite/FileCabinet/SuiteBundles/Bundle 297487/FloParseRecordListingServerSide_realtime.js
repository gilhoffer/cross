nlapiLogExecution("AUDIT", "FLOStart", new Date().getTime())

//HANDLE SPANISH ACCOUNT
var USER_LANGUAGE_PREFERENCE = 'en_US'; //defaults
var englishtranslations = {};

var searchlist = "";
var recnum = 0;
var autoSpiderFound = "T";
var recfield = 0;
var lastFieldprocess = 0;
var domainGlobal = ""
var rectypes = "Start,Online Customer Form,76,CRM Field,25,Entity Field,3,Item Field,26,Other Field,27,Item Option Field,28,Column Field,4,Body Field,5,List,1,Record,2,Item Number Field,29,Entry Form,6,Transaction Form,7,Saved Search,8,Mass Update,9,Custom Record Field,30,Standard Record,24,Standard Field,31,Suitelet,17,RESTlet,22,User Event,21,Scheduled,34,Portlet,18,Client,20,Bundle Installation,35,Workflow Action,19,Workflow,10,Mass Update Script,23,Plug-In Script,33,Map Reduce,61,User Roles,50,Script Deployments,51,Bundle,71,End";
var spiderConfigRecordid = 0;

function parseListing(url, rectype, a, domain, itemNum, namefilter, update, rqXML, rIds, actionfileID) {
  //HANDLE SPANISH ACCOUNT
  USER_LANGUAGE_PREFERENCE = nlapiGetContext().getPreference('language');
  if (USER_LANGUAGE_PREFERENCE.indexOf('en') != 0) {
    englishtranslations = getTranslations();
  }

  //docWrite('entre');
  url += "&frame=B&segment='000GETFULLLIST&showall=F";

  //url+="&csv=Export&OfficeXML=F";

  url = domain + url.split("netsuite.com")[1];
  docWrite(url);

  domainGlobal = domain;
  var reqPage = nlapiRequestURL(url, null, a)

  var page = reqPage.getBody();


  reqPage = null;
  itemNum = getData(page, rectype, a, domain, itemNum, namefilter, update, rqXML, rIds, actionfileID);
  return itemNum;
}

function storeFile(page, rectype, itemNum, json) {

  //nlapiLogExecution("DEBUG","storing file")

  try {
    var folderId = null;

    var folderPathSrch = nlapiLoadSearch("", "customsearch_flo_realtime_spider_folder");

    var folderList = nlapiSearchRecord(folderPathSrch.getSearchType(), "customsearch_flo_realtime_spider_folder", null, null);
    if (folderList != null) {
      folderId = folderList[0].getId();
    }

    if (folderId == null || folderId == '') {
      docWrite("Real time spider folder not found");
    } else {
      var fileName = rectype.replace(" ", "-").toLowerCase() + "-" + itemNum;

      docWrite('name:' + fileName);

      if (json != null && json == "F") {
        var newFile = nlapiCreateFile(fileName + '.txt', 'PLAINTEXT', page);
      } else {
        var newFile = nlapiCreateFile(fileName + '.txt', 'PLAINTEXT', JSON.stringify(page));
      }

      newFile.setFolder(folderId); //we need to define how to set the folder id, may be an scipt paramenter
      var id = nlapiSubmitFile(newFile);

      //create customization customrecord_flo_spider_files
      if (rectype != "wfactions") {
        createCustomization(id);
      }

      return id;
    }

  } catch (e) {
    //docWrite('e'+e.message);
    nlapiLogExecution('debug', 'storeFile', e);
  }

}

// Creates customrecord_flo_spider_files given the fileId
function createCustomization(fileId) {
  try {
    var cust = nlapiCreateRecord('customrecord_flo_spider_files');
    cust.setFieldValue('custrecord_flo_spiderfile_doc', fileId);
    cust.setFieldValue('custrecord_flo_spider_status', 1);
    if (crid && crid != 0) {
      cust.setFieldValue('custrecord_flo_cr_trigger', crid);
    }

    var custId = nlapiSubmitRecord(cust, false, true);
    nlapiLogExecution('DEBUG', 'Customization created', custId);
  } catch (e) {
    nlapiLogExecution('DEBUG', 'createCustomization', e);
  }
}



function setReport(rectype, count) {


  nlapiLogExecution("DEBUG", "rectypes", rectypes)
  nlapiLogExecution("DEBUG", "rectype", rectype)
  // /customrecord_flo_spider_log
  try {


    nlapiLogExecution("DEBUG", "rectypes", rectype)
    nlapiLogExecution("DEBUG", "rectype", rectype)


    var newrecnum = rectypes.toLowerCase().split("," + rectype.toLowerCase() + ",")[1].split(",")[0];

    nlapiLogExecution("DEBUG", "newrecnum", newrecnum)

    //var spiderConfigRecordid=0

    var mycount = count - 1

    //var newrecnum=9//rectypes.toLowerCase().split(","+rectype.toLowerCase()+",")[1].split(",")[0];

    nlapiLogExecution("DEBUG", "newrecnum", newrecnum)

    if (spiderConfigRecordid == 0) {
      var spiderConfigList = nlapiSearchRecord("customrecord_flo_spider_configuration");
      if (spiderConfigList != null) {
        spiderConfigRecordid = spiderConfigList[0].getId();
      }
    }

    var logsFilt = [];


    nlapiLogExecution("DEBUG", "spiderConfigRecordid", spiderConfigRecordid)
    nlapiLogExecution("DEBUG", "count", count)


    logsFilt[0] = new nlobjSearchFilter('custrecord_flo_log_type', null, 'anyof', newrecnum);

    var logList = nlapiSearchRecord("customrecord_flo_spider_log", null, logsFilt, null);

    if (logList && logList.length > 0) {

      var myid = logList[0].getId();

      nlapiLogExecution("DEBUG", "myid", myid)

      var myRecordLog = nlapiLoadRecord('customrecord_flo_spider_log', myid);
      myRecordLog.setFieldValue('custrecord_flo_log_spider_count', mycount);
      myRecordLog.setFieldValue('custrecord_flo_log_status', 'NOT COMPLETE');
      myRecordLog.setFieldValue('custrecord_flo_config_stats_link', spiderConfigRecordid);
      nlapiSubmitRecord(myRecordLog);

    }

  } catch (e) {
    nlapiLogExecution("debug", "setReport", e)

  }

}


function getData(page, rectype, a, domain, itemNum, namefilter, update, rqXML, rIds, actionfileID) {

  try {

    var context = nlapiGetContext();
    var usageRemaining = context.getRemainingUsage();

    if (rIds != null && rIds != '') {
      rIds = rIds.split(',');
      docWrite('rIds length:' + rIds.length);
    }

    if (usageRemaining < 100) return itemNum;

    docWrite('in get data:' + itemNum);


    docWrite('page:' + page);


    var masterFile = {};

    masterFile.lines = [];

    var perRecordFile = 0;

    var t1 = new Date()


    pageRows = page.split(/\<tr id='row[0-9]+\'\>/g);
    //if rows are not located - use pattern for 2014.2
    if (pageRows.length == 1) {
      pageRows = page.split(/\<tr class=\'uir-list-row-tr uir-list-row-[o,d,e,v,n]*\'.*id='row[0-9]+\'\>/g);
    }


    headerrow = pageRows[0].substring(pageRows[0].lastIndexOf("<tr"));


    docWrite(rectype + ":" + pageRows.length);

    //setReport(rectype,pageRows.length);



    //var intid="";
    var currentFielContent = "";

    //get column headers
    //headerrow=pageRows[0].substring(pageRows[0].lastIndexOf("<tr"));

    docWrite('in get data headerrow.indexOf:' + headerrow.indexOf('<div class="listheader">'));

    if (headerrow.indexOf('<div class="listheader">') < 0) {
      return
    }

    headercells = headerrow.split(">");
    headers = [];

    var internalIdIndex = -1; //index of Internal_ID header in headers
    for (h = 0; headercells[h] != null; h++) {
      if (headercells[h].charAt(0) != "<" && headercells[h].charAt(0) != " " && headercells[h].indexOf("&nbsp;") != 0 && headercells[h].indexOf("function") < 0) {
        columnname = headercells[h].substring(0, headercells[h].indexOf("<"));
        if (columnname) {
          columnname = columnname.replace('&nbsp;', '');
          if (USER_LANGUAGE_PREFERENCE && englishtranslations[USER_LANGUAGE_PREFERENCE] && englishtranslations[USER_LANGUAGE_PREFERENCE][columnname.trim().toUpperCase()]) {
            nlapiLogExecution('DEBUG', 'USER_LANGUAGE_PREFERENCE', columnname + ' = ' + englishtranslations[USER_LANGUAGE_PREFERENCE][columnname.trim().toUpperCase()]);
            columnname = englishtranslations[USER_LANGUAGE_PREFERENCE][columnname.trim().toUpperCase()];
          }
        }
        columnname = columnname.replace(" ", "_");
        columnname = columnname.replace(" ", "_");
        if (rectype == "List" && columnname == "List" && headers.indexOf("List") != -1) {
          columnname = "List2";
        }
        headers.push(columnname);
        if (columnname == "Internal_ID")
          internalIdIndex = headers.indexOf(columnname);
        docWrite('Header ' + h + ':' + columnname);
      }
    }
    docWrite('Internal_ID header index:' + internalIdIndex);
    docWrite('in get data: 2');

    for (p = 1; pageRows[p] != null; p++) {
      var context = nlapiGetContext();
      var usageRemaining = context.getRemainingUsage();

      //docWrite('usageRemaining Start:'+usageRemaining+":"+p);

      docWrite('in get data: 3');

      var t2 = new Date()
      var dif = t1.getTime() - t2.getTime()
      var Seconds_from_T1_to_T2 = dif / 1000;
      var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);

      var usageLimit = 210;


      docWrite('in get data: 4');


      if (p == 1 && itemNum > 1) {
        p = itemNum
      }

      itemNum = p;
      thisRow = pageRows[p];
      //skip standard forms and reports 

      docWrite("thisRow" + thisRow);

      if (thisRow.indexOf(">Customize<") < 0 && thisRow.indexOf(">Personalizar<") < 0) {
        customization = "";
        cells = thisRow.split("\n")

        docWrite("cells" + cells.join(","));

        docWrite('in get data: 5');


        if (usageRemaining > usageLimit && Seconds_Between_Dates < 30) {

          for (c = 1; cells[c] != null && headers[c - 1] != null && headers[c - 1] != ""; c++) {

            docWrite('in get data: 6');

            if (customization != "") {
              customization += ","
            }
            //Disregard empty cells
            if (cells[c].indexOf("<td") != 0) {
              cells.splice(c, 1)
            }


            //Get the edit/navigation link
            if ((cells[c].indexOf("common/custom") > 0 | cells[c].indexOf("common/scripting") > 0) && customization.indexOf("Link:") < 0) {

              docWrite("id" + headers[c - 1]);

              thisCell = cells[c];
              var editLink = thisCell.split("href=")[1].split(" ")[0].substring(1);
              editLink = editLink.substring(0, editLink.length - 1);
              if (editLink.indexOf("'") > 0) {
                editLink = editLink.split("'")[0];
              }
              if (editLink.indexOf('"') > 0) {
                editLink = editLink.split('"')[0];
              }
              customization += "Link" + ':' + editLink;
              customization += "," + headers[c - 1] + ':' + getInnerText(cells[c]);

            } else if (cells[c].indexOf("id=") > 0 && cells[c].indexOf("media") > 0) //locate any referenced files and get their internalids
            {
              docWrite("id2" + headers[c - 1]);

              customization += headers[c - 1] + ":" + cells[c].split("id=")[1].split("&")[0].split('"')[0];
            } else {
              //++ NS-640
              if (rectype.match(/^Saved Search$/i) != null && headers[c - 1].match(/^Last_Run_On$/i) != null) {
                try {
                  var lro = getInnerText(cells[c], true);
                  lro = lro.replace(/\s+,\s+/, ", "); //For DD MONTH, YYYY pattern that has DD MONTH , YYYY
                  lro = lro.replace(/\s+-/, "-"); //For DD-MONTH-YYYY that has DD-MONTH -YYYY
                  customization += headers[c - 1] + ':' + nlapiStringToDate(lro).getTime();
                } catch (createDateErr) {
                  nlapiLogExecution("DEBUG", "Create Date E, " + itemNum + "," + lro, createDateErr);
                }
              } else {
                customization += headers[c - 1] + ':' + getInnerText(cells[c]);
              }
              //-- NS-640
            }
          }

          nlapiLogExecution("DEBUG", "customization string", customization);
          var intid = "";

          if (customization.indexOf("Internal_Id") < 0 | customization.indexOf("Internal_Id:,") >= 0 | customization.indexOf("Internal_Id: ,") >= 0) {

            docWrite("id3" + headers[c - 1]);

            try {
              if (customization.match(/internal_id:[-0-9]+/i) != null) {
                intid = customization.match(/internal_id:[-0-9]+/i)[0].split(":")[1];
                nlapiLogExecution("DEBUG", "customization string intid", intid);
              }

              if (intid == "") { //get from link, if not in customization string
                nlapiLogExecution("DEBUG", "customization string no intid.  Get from Link");
                intid = thisRow.split("id=")[1].split("&")[0].split('"')[0].split("'")[0];
                if (!intid) {
                  intid = thisRow.split("href=")[1].split("id=")[1].split("&")[0].split('"')[0].split("'")[0];
                }
              }
            } catch (splitErr) {
              //check if Bundle, meaning it doesnt have a link
              nlapiLogExecution("DEBUG", "customization string Split ERR");
              if (rectype == "Bundle" && customization.match(/,bundle_id:[-0-9]+/i) != null) {
                try {
                  intid = customization.match(/,bundle_id:[-0-9]+/i)[0].split(":")[1];
                  nlapiLogExecution("DEBUG", "Found BundleID", intid);

                } catch (splitErr2) {
                  nlapiLogExecution("DEBUG", "splitErr2", splitErr2);
                  intid = "";
                }
              } else {
                intid = "";
              }

            }
            docWrite("id4" + intid);
            if (!isNaN(parseInt(intid))) {
              if (customization.indexOf("Internal_Id") < 0) {
                customization += ',Internal_Id:' + intid;
              }
            } else {
              customization.replace("Internal_Id:,", "Internal_Id:" + intid);
            }
          }



          var fileContent = {};
          custpairs = customization.split(",");
          custparams = [];
          for (c = 0; c < custpairs.length; c++) {
            custdata = custpairs[c].split(":");
            var label = custdata[0];
            label = label.replace('&nbsp;', " ");
            ////alert("#"+label.charAt(label.length-1)+"#")
            if (label.charAt(label.length - 1) == " ")

            {
              label = label.substring(0, label.length - 1)
            }
            ////alert("#"+label+"#")
            custparams[label] = custdata[1];
            for (cd = 2; custdata[cd] != null; cd++) {
              custparams[label] += ":" + custdata[cd];
            }
          }

          nlapiLogExecution('DEBUG', 'custparams.Name2', custparams.Description);
          nlapiLogExecution('DEBUG', 'custparams.Name2', custparams.Name);
          nlapiLogExecution('DEBUG', 'custparams.Name2', namefilter);
          nlapiLogExecution('DEBUG', 'custparams.ID', custparams.ID);

          //Check if Row Internal ID is part of requested IDs
          if (rIds != null && rIds.length > 0 && rectype != "Custom Record Field" && rectype != "Workflow" && rectype != "User Roles") {
            var nextrecord = true;
            if (intid && rIds.indexOf(intid) != -1) {
              //Internal ID value is not in list of requested IDs
              nextrecord = false;
              //Remove found intid in the notFound list
              var intidPos = notFoundIds.indexOf(intid);
              if (intidPos != -1) {
                notFoundIds.splice(intidPos, 1)
              }
            }

            if (custparams.ID && rIds.indexOf(custparams.ID) != -1) {
              nextrecord = false;
              var scriptidPos = notFoundIds.indexOf(custparams.ID);
              if (scriptidPos != -1) {
                notFoundIds.splice(scriptidPos, 1)
              }
            }

            if (nextrecord) {
              nlapiLogExecution('DEBUG', 'SKIP', "SKIP");
              continue;
            }
          }


          if (typeof custparams.Name != "undefined" && custparams.Name != "" && namefilter != "" && custparams.Name.indexOf(namefilter) < 0) {
            continue;
          }

          if (typeof custparams.Link != "undefined" && custparams.Link != null && custparams.Link.indexOf('&e=T') != -1) {
            //custparams.Link.replace=custparams.Link.replace('&e=T','');
            custparams.Link = custparams.Link.replace('&e=T', '');
          }

          //nlapiLogExecution("DEBUG","custparams.Link 33 ",custparams.Link)
          if (custparams.Link != null && custparams.Link != "" && rqXML == "T") {
            xmlreq = nlapiRequestURL(domain + custparams.Link + "&xml=T", null, a);
            custxml = xmlreq.getBody();
            xmlreq = null;

            fileContent.custrecord_flo_cust_page_xml = custxml;

          } else if (rectype == 'Online Customer Form') {
            try {
              custparams.Link = domain + 'app/crm/sales/leadform.nl?id=' + custparams.Internal_Id;
              nlapiLogExecution('debug', 'custparams.Link', custparams.Link);

              xmlreq = nlapiRequestURL(custparams.Link + "&xml=T", null, a);
              custxml = xmlreq.getBody();
              fileContent.custrecord_flo_cust_page_xml = custxml;
            } catch (e) {
              nlapiLogExecution('debug', 'Online Customer Form (Link)', e);
            }
          } else if (rectype == "Workflow") {


            custparams.Link = domain + 'app/common/workflow/setup/workflow.nl?id=' + custparams.Internal_Id;

            //nlapiLogExecution('DEBUG', 'DEBUG', custparams.Link);

            try {

              xmlreq = nlapiRequestURL(custparams.Link + "&xml=T", null, a);
              custxml = xmlreq.getBody();
              xmlreq = null;

              //Check if session has timed out.
              /*
              if(custxml != null && custxml != ""
               && (custxml.replace(/\n/g,'').indexOf('<html')==0 || custxml.replace(/\n/g,'').indexOf('<!DOCTYPE')==0) ) {
                
                continue;
              
                }*/
              if (custxml != null && custxml != "") {
                var cleanXML = custxml.replace(/\n/g, '').toLowerCase();
                if (cleanXML.indexOf('<html') == 0 ||
                  cleanXML.indexOf('<!doctype') == 0) {
                  nlapiLogExecution('DEBUG', 'Skipping 1 ' + custparams.Internal_Id, custxml);
                  continue;
                }
              }

              fileContent.custrecord_flo_cust_page_xml = custxml;
              actfileid = actionfileID;
              actionfileID = "";
              wfactions = getActions(custxml, domain, custparams.Internal_Id, actfileid, rIds);
              //if usage limit is reached, force redirect.
              if (wfactions && wfactions.message == 'USAGELIMITREACHED') {
                //nlapiLogExecution('debug', 'wfactions', JSON.stringify(wfactions));
                //nlapiLogExecution('debug', 'wfactions actions', JSON.stringify(wfactions.actions));
                //nlapiLogExecution('debug', 'wfactions actions legnth', wfactions.actions.length);
                var retmsg = {};
                retmsg.fileid = "";
                if (wfactions.wfacts && (wfactions.wfacts.states.length > 0 || wfactions.wfacts.lastunfinishedstate)) {
                  wfactionFileId = storeFile(wfactions.wfacts, "wfactions", wfactions.lastindex + '-' + wfactions.lastActionIndex + '-' + itemNum + '-inp');
                  nlapiLogExecution('debug', 'wfactions wfactionFileId', wfactionFileId);
                  retmsg.fileid = wfactionFileId;
                }
                docWrite('Usage Limit Done:' + itemNum);
                nlapiLogExecution('debug', 'masterFile.lines', masterFile.lines);
                if (masterFile.lines.length > 0) {
                  id = storeFile(masterFile, rectype, itemNum);
                }
                recsProcessed = itemNum;
                if (itemNum == 1) itemNum = 2;
                retmsg.itemnum = itemNum
                nlapiLogExecution('debug', 'retmsg', JSON.stringify(retmsg));
                return retmsg;
              } else if (wfactions && (wfactions.message == 'SESSIONTIMEDOUT' || wfactions.message == 'SKIP')) {
                continue;
              }
              fileContent.custrecord_flo_cust_page_xml_actions = wfactions;

              if (typeof fileContent.custrecord_flo_cust_page_xml_actions == "undefined" || fileContent.custrecord_flo_cust_page_xml_actions == null || fileContent.custrecord_flo_cust_page_xml_actions.length <= 0) {
                fileContent.custrecord_flo_cust_page_xml = "Locked Workflow Cannot be Completely Documented";
              } else if (typeof fileContent.custrecord_flo_cust_page_xml_actions != "undefined" && fileContent.custrecord_flo_cust_page_xml_actions != null && fileContent.custrecord_flo_cust_page_xml_actions.length > 0 && fileContent.custrecord_flo_cust_page_xml_actions[0] == "No Actions") {
                fileContent.custrecord_flo_cust_page_xml = "Workflow without actions to Spider";
              }


            } catch (e) {
              nlapiLogExecution('debug', 'HERE THE debug WF', e);
            }

          } else if (rectype == "User Roles") {

            try {
              custparams.Link = domain + 'app/setup/role.nl?id=' + custparams.Internal_Id;

              nlapiLogExecution('debug', 'custparams.Link', custparams.Link);


              xmlreq = nlapiRequestURL(custparams.Link + "&xml=T", null, a);
              custxml = xmlreq.getBody();

              //++ NS-621
              try {
                var roleXML = nlapiStringToXML(custxml);
                var rolescriptid = nlapiSelectValue(roleXML, '/nsResponse/record[1]/scriptid');
                nlapiLogExecution('DEBUG', 'rolescriptid', rolescriptid);
                if( (intid && rIds.indexOf(intid) != -1) || (rolescriptid && rIds.indexOf(rolescriptid.toLowerCase()) != -1) ) {
                  if(intid) {
                    var intidPos = notFoundIds.indexOf(intid);
                    if (intidPos != -1) {
                      notFoundIds.splice(intidPos, 1)
                    }
                  }

                  if(rolescriptid) {
                    var sPos = notFoundIds.indexOf(rolescriptid);
                    if (sPos != -1) {
                      notFoundIds.splice(sPos, 1)
                    }
                  }
                  
                  

                  //Continue with processing
                }  else {
                   continue;
                }
              } catch(e) {
                nlapiLogExecution('DEBUG', 'rolescriptid', e);
              }
              //-- NS-621
              fileContent.custrecord_flo_cust_page_xml = custxml;

              //transiscions
              //fileContent.custrecord_flo_cust_page_xml_transision=getTransisions(custxml,domain);
            } catch (e) {
              nlapiLogExecution('debug', 'HERE THE debug', e);
            }
          }
          //List or Multiple Select get the id
          if (custparams.List != null && custparams.List != " " && custparams.List != "&nbsp;" && rectype > 2 && rqXML == "T") {
            link = nlapiRequestURL(domain + custparams.Link + '&xml=t', null, a);
            linkbody = link.getBody();
            link = null;
            list = linkbody.split("selectrecordtype")[2].substring(1);
            list = list.split("<")[0];
            fileContent.custrecord_flo_list_data = custparams.List + ":" + list;
          }

          fileContent.customizationstring = customization;
          fileContent.Internal_Id = custparams.Internal_Id;
          fileContent.rectype = rectype;
          fileContent.itemNum = itemNum;
          fileContent.update = update;
          fileContent.namefilter = namefilter;
          //Prevent HTML to be set to xml page field
          if (fileContent.custrecord_flo_cust_page_xml) {
            var cleanXML = fileContent.custrecord_flo_cust_page_xml.replace(/\n/g, '').toLowerCase();
            if (cleanXML.indexOf('<html') == 0 ||
              cleanXML.indexOf('<!doctype') == 0) {
              nlapiLogExecution('DEBUG', 'Skipping 2' + custparams.Internal_Id, fileContent.custrecord_flo_cust_page_xml);
              continue;
            }
          }
          docWrite('in get data: 7');


          docWrite("JSON:" + JSON.stringify(fileContent));

          try {

            if (custparams.Internal_Id.match('View')) {
              custparams.Internal_Id = custparams.Internal_ID;
              fileContent.Internal_Id = custparams.Internal_ID
            }

          } catch (e) {
            nlapiLogExecution('DEBUG', 'e', e);
          }

          docWrite('in get data: 11');


          if (rectype == "Custom Record Field") { //special condition for custom fields.

            masterFile.lines = createCustRecFields(fileContent, masterFile.lines, a, rectype, itemNum, update, namefilter, rIds);

          } else {
            //Update parent mappring of the Field customizations
            if (rectype.indexOf('Field') != -1 && rectype.indexOf('Other') == -1) {
              fileContent = updateFieldParents(fileContent, rectype);
            }
            docWrite('in get data: 10');

            masterFile.lines.push(fileContent);

          }

          docWrite('in get data: 9');


          currentFielContent = currentFielContent + fileContent;

          //|| rectype=="Custom Record Field"
          if (masterFile.lines.length == 10) {

            nlapiLogExecution('debug', 'currentFielContent2', JSON.stringify(masterFile).length);

            id = storeFile(masterFile, rectype, itemNum);
            perRecordFile = 1;
            masterFile.lines = [];
            currentFielContent = "";
          } else if (rectype == "Transaction Form" || rectype == "Entry Form" || rectype == "User Roles" || rectype == "Saved Search" || rectype == "Bundle") {

            nlapiLogExecution('debug', 'currentFielContent', JSON.stringify(masterFile).length);

            if (JSON.stringify(masterFile).length > 2000000) {

              nlapiLogExecution('debug', 'currentFielContent2', JSON.stringify(masterFile).length);

              id = storeFile(masterFile, rectype, itemNum);
              perRecordFile = 1;
              masterFile.lines = [];
              currentFielContent = "";
            }
          }

          docWrite('in get data: 8');

          itemNum++;

        } else {

          docWrite('Usage Limit Done:' + itemNum);
          id = storeFile(masterFile, rectype, itemNum);
          recsProcessed = itemNum;
          if (itemNum == 1) itemNum = 2;
          return itemNum;
        }
      }
    }

    docWrite("finishing");

    if (masterFile && masterFile.lines.length > 0) {
      id = storeFile(masterFile, rectype, itemNum);
    }
    recsProcessed = itemNum;
    searchlist = "";
    itemNum = 1;
    docWrite("finishing::" + itemNum);
    return itemNum;

  } catch (e) {
    nlapiLogExecution('debug', 'ERORR GET DATA', e);
  }

  searchlist = "";
  itemNum = 1; //reset itemNum
  docWrite("finishing:::" + itemNum);

  return itemNum;
}

function WaitForIFrame(gotourl) {
  iframe = parent.document.getElementById("spiderframe");
  if (iframe.readyState != "complete") {
    setTimeout("WaitForIFrame();", 200);
  } else {
    parent.document.getElementById("spiderframe").setAttribute("src", gotourl);
  }
}

function checkCust(ID, rectype, name, intid, recnumaux) {
  var filters = [];

  nlapiLogExecution("debug", "recnumaux start", new Date().getTime());
  nlapiLogExecution("debug", "recnumaux start", recnumaux);
  nlapiLogExecution("debug", "recnumaux name", name);
  nlapiLogExecution("debug", "rectype", rectype);


  if (typeof recnumaux != "undefined" && recnumaux != null) {
    newrecnum = recnumaux;

  } else {

    try {
      newrecnum = rectypes.toLowerCase().split("," + rectype.toLowerCase() + ",")[1].split(",")[0];
    } catch (e) {
      newrecnum = []; //nlapiLogExecution('debug', 'LowerCase CheckCust', e);
    }

  }



  var searchlist = "";

  if (searchlist == "" | newrecnum == null | recnum != newrecnum) {

    recnum = newrecnum;
    searchlist = "";

    nlapiLogExecution("DEBUG", "recnumaux:nerecum:recnum", searchlist.length + ":" + ID + ":" + recnum)


    custSearch = nlapiLoadSearch("customrecord_flo_customization", 'customsearch_flo_cust_search');
    //filters[0]=new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof",rectype);
    if (recnum && recnum.length > 0) {
      custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_type", null, "anyof", recnum))
    }

    if (typeof ID != "undefined" && ID != null && ID != "") custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_id", null, "contains", ID))

    //custs=nlapiSearchRecord("customrecord_flo_customization",'customsearch_flo_cust_search',filters,null);

    custResults = custSearch.runSearch();

    custs = custResults.getResults(0, 999);
    //if the list is blank, create a default record
    if (custs == null) {
      /*docWrite("creating test record<br>")
      testRec=nlapiCreateRecord("customrecord_flo_customization");
      testRec.setFieldValue("name","Test"+rectype);
      testRec.setFieldValue("custrecord_flo_cust_type",rectype);
      testRec=nlapiSubmitRecord(testRec);
      custResults=custSearch.runSearch();
      custs=custResults.getResults(0,999);
      docWrite("deleting test record<br>")
      nlapiDeleteRecord("customrecord_flo_customization",testRec);*/
      return "";

    } else {
      //docWrite("creating list"+custs.length+"<br>")
    }

    if (custs != null) {
      //docWrite("creating list"+custs.length+"<br>")
      searchlist = custs.slice(0);
      cp = 0;
      while (custs.length >= 999 && cp < 30) {

        start = (cp + 1) * 1000;
        custs = custResults.getResults(start, (start + 999))
        if (custs != null) {

          for (c = 0; c < custs.length && custs[c] != null; c++) {
            searchlist.push(custs[c])
          }
        }
        cp++;
      }

    }

  } // End of blank searchlist

  //alert(searchlist.length);
  recid = "";

  //Check by scriptid or, if there is no script id, by name
  for (r = 0; searchlist[r] != null && r < searchlist.length; r++) {

    columns = searchlist[r].getAllColumns();

    //nlapiLogExecution("debug","recnumaux  searchlist[r].getValue(columns[0])", searchlist[r].getValue(columns[0]));

    //  nlapiLogExecution("debug","recnumaux  ID", ID);

    if (ID === searchlist[r].getValue(columns[5])) {
      nlapiLogExecution("DEBUG", "matched scriptid", searchlist[r].getValue(columns[5]))

      //autoSpiderFound=nlapiLookupField('customrecord_flo_customization',searchlist[r].getId(),'custrecord_flo_autospider_found');

      if (recnum != 51) {

        nlapiLogExecution("debug", "checkCust end", new Date().getTime())

        return searchlist[r].getId()
      }



    }
    if (intid != null && intid != "" && columns[4] != null) {
      //if no record is located by matching the  scriptid, match on the basis of the internalid.
      docWrite(intid + "--" + searchlist[r].getValue(columns[4]));
      if (intid == searchlist[r].getValue(columns[4])) {
        nlapiLogExecution("DEBUG", "matched intid")

        nlapiLogExecution("debug", "checkCust end", new Date().getTime())

        return searchlist[r].getId()
      }
    }
    //nlapiLogExecution('debug', 'For End SearchList ','');  
  }
  //116


  return ""
}

//
//https://system.na1.netsuite.com/app/common/workflow/setup/actions/addbutton.nl?e=T&workflow=13&state=76&id=229&xml=t
//https://system.na1.netsuite.com/app/common/workflow/setup/workflowstate.nl?workflow=13&xml=t&id=76
//https://system.na1.netsuite.com/app/common/workflow/setup/workflowtransition.nl?workflow=26&id=338&state=119&ifrmcntnr=T&e=T&xml=t
//https://system.na1.netsuite.com/app/common/workflow/setup/workflow.nl?id=8


//setfieldvalue
//customaction
//sendemail

function getActions(xml, domain, wfid, actionfileID, rIds) {

  var custxml = xml;

  var recordXML = nlapiStringToXML(custxml);

  var wfscriptid = nlapiSelectValue(recordXML, '/nsResponse/record[1]/scriptid');

  if (rIds && rIds.indexOf(wfid) == -1 && rIds.indexOf(wfscriptid) == -1) {
    nlapiLogExecution('DEBUG', 'SKIP', wfid + " " + wfscriptid);
    var returnObj = {};
    returnObj.message = "SKIP";
    return returnObj
  } else {
    nlapiLogExecution('DEBUG', 'PROCESS', wfid + " " + wfscriptid);
    //Remove found intid in the notFound list
    var intidPos = notFoundIds.indexOf(wfid);
    if (intidPos != -1) {
      notFoundIds.splice(intidPos, 1)
    }

    var scriptidPos = notFoundIds.indexOf(wfscriptid);
    if (scriptidPos != -1) {
      notFoundIds.splice(scriptidPos, 1)
    }
  }


  var fieldNodes = nlapiSelectNodes(recordXML, './/line');

  var context = nlapiGetContext();
  var usageRemaining = context.getRemainingUsage();

  /*var auxlastActionprocess = nlapiGetContext().getSetting('SCRIPT', 'custscript_last_state_process');
    if(auxlastFieldprocess!=null)
    { 
      var j=auxlastFieldprocess; 
    }else{
      var j=0
    }
  */

  var j = 0
  var startAction = 0;
  var lastIndex = 0;
  var lastActionIndex = 0;
  var myActions = [];
  var actionfileactions = null;
  try {
    nlapiLogExecution('DEBUG', 'actionfileID', actionfileID);
    if (actionfileID) {

      var actionfile = nlapiLoadFile(actionfileID);
      var actionfilename = actionfile.getName();
      var actionfileval = actionfile.getValue();

      j = actionfilename.split("-")[1];
      if (j) {
        j = parseInt(j);
      } else {
        j = 0;
      }
      startAction = actionfilename.split("-")[2];
      if (!isNaN(startAction)) {
        startAction = parseInt(startAction);
      } else {
        startAction = 0;
      }
      nlapiLogExecution('debug', 'actionfileID - ' + wfid, "fileid:" + actionfileID + "filename:" + actionfilename + " startatNode:" + j + " startAction:" + startAction);
      actionfileactions = JSON.parse(actionfileval);
      if (actionfileactions) {
        myActions = actionfileactions.states;
      }
      nlapiDeleteFile(actionfileID);
    }

  } catch (e) {
    nlapiLogExecution('DEBUG', 'e', e);
    return [];
  }

  for (f = j; fieldNodes[f] != null && fieldNodes[f] != null && fieldNodes.length < 100 && f < 100; f++) {

    var usageRemaining = context.getRemainingUsage();

    if (usageRemaining > 70) {

      nlapiLogExecution('DEBUG', 'GetActionsUsageRemaining', usageRemaining);

      try {
        var id = nlapiSelectValue(fieldNodes[f], 'stateid')
      } catch (e) {
        nlapiLogExecution('DEBUG', 'GetActionsUsageRemaining2', e);
      }

      nlapiLogExecution('DEBUG', 'GetActionsUsageRemaining2', id);

      nlapiLogExecution('DEBUG', 'GetActionsUsageRemaining3', wfid);

      if (id == null || id == "") continue;

      var state = {};

      state.actions = [];

      state.stateid = id;
      if (actionfileactions && actionfileactions.lastunfinishedstate && actionfileactions.lastunfinishedstate.stateid == id) {
        state = actionfileactions.lastunfinishedstate;
        actionfileactions = null;
      }

      var url = domainGlobal + "app/common/workflow/setup/workflowstate.nl?workflow=" + wfid + "&xml=t&id=" + id;

      nlapiLogExecution('DEBUG', 'GetActionsUsageRemaining4', url);


      xmlreq = nlapiRequestURL(url, null, a);
      var custxml = xmlreq.getBody();
      xmlreq = null;
      //Check if session has timed out.
      /*
       if(custxml != null && custxml != ""
        && (custxml.replace(/\n/g,'').indexOf('<html')==0 || custxml.replace(/\n/g,'').indexOf('<!DOCTYPE')==0) ) {
         var returnObj = {};
           returnObj.message = "SESSIONTIMEDOUT";
         return returnObj;
        
        }
        */

      if (custxml != null && custxml != "") {
        var cleanXML = custxml.replace(/\n/g, '').toLowerCase();
        if (cleanXML.indexOf('<html') == 0 ||
          cleanXML.indexOf('<!doctype') == 0) {
          nlapiLogExecution('DEBUG', 'Skipping 3 ' + wfid, custxml);
          var returnObj = {};
          returnObj.message = "SESSIONTIMEDOUT";
          return returnObj;
        }
      }

      state.custrecord_flo_cust_page_xml = custxml;

      var recordXMLActions = nlapiStringToXML(custxml);

      var fieldNodesActions = nlapiSelectNodes(recordXMLActions, './/line');
      var notEnoughUsage = false;
      for (i = startAction; fieldNodesActions[i] != null && i < 400; i++) {

        var usageRemaining = context.getRemainingUsage();

        if (usageRemaining > 70) {

          var action = {};

          var actionid = nlapiSelectValue(fieldNodesActions[i], 'actionid')

          if (actionid == null || actionid == "") continue;

          var actiontype = nlapiSelectValue(fieldNodesActions[i], 'actiontype')

          nlapiLogExecution('DEBUG', 'actiontype', actiontype);

          actiontype = actiontype.toLowerCase();

          var urlAct = domainGlobal + "/app/common/workflow/setup/actions/" + actiontype + ".nl?e=T&workflow=" + wfid + "&state=" + id + "&id=" + actionid + "&xml=t";

          nlapiLogExecution('DEBUG', 'urlAct', urlAct);

          var xmlreqAct = nlapiRequestURL(urlAct, null, a);
          var custxml = xmlreqAct.getBody();
          xmlreqAct = null;
          /*
          if(custxml != null && custxml != ""
              && (custxml.replace(/\n/g,'').indexOf('<html')==0 || custxml.replace(/\n/g,'').indexOf('<!DOCTYPE')==0) ) {
              continue;
          }
          */
          if (custxml != null && custxml != "") {
            var cleanXML = custxml.replace(/\n/g, '').toLowerCase();
            if (cleanXML.indexOf('<html') == 0 ||
              cleanXML.indexOf('<!doctype') == 0) {
              nlapiLogExecution('DEBUG', 'Skipping 4 ' + wfid, custxml);
              continue;
            }
          }

          action.custrecord_flo_cust_page_xml = custxml;

          state.actions.push(action);

        } else {
          notEnoughUsage = true;
          lastActionIndex = i;
          break;
        }

      }

      startAction = 0;
      lastIndex = f;
      lastFieldprocess = id;

      if (!notEnoughUsage) {
        myActions.push(state);
        lastActionIndex = 0;
      } else {
        //WHEN THERE'S NOT ENOUGH USAGE UNITS LEFT
        nlapiLogExecution('DEBUG', 'USAGELIMITREACHED', 'USAGELIMITREACHED');
        nlapiLogExecution('DEBUG', 'myActions length', myActions.length);
        var fileJSONObj = {};
        fileJSONObj.states = myActions;
        fileJSONObj.lastunfinishedstate = state;
        var returnObj = {};
        returnObj.message = "USAGELIMITREACHED";
        returnObj.wfacts = fileJSONObj;
        returnObj.lastindex = lastIndex;
        returnObj.lastActionIndex = lastActionIndex;
        return returnObj;
      }
    } else {
      //WHEN THERE'S NOT ENOUGH USAGE UNITS LEFT
      nlapiLogExecution('DEBUG', 'USAGELIMITREACHED', 'USAGELIMITREACHED');
      nlapiLogExecution('DEBUG', 'myActions length', myActions.length);
      var fileJSONObj = {};
      fileJSONObj.states = myActions
      fileJSONObj.lastunfinishedstate = null;
      var returnObj = {};
      returnObj.message = "USAGELIMITREACHED";
      returnObj.wfacts = fileJSONObj;
      returnObj.lastindex = lastIndex;
      returnObj.lastActionIndex = lastActionIndex;
      return returnObj;
    }
  }

  if (fieldNodes[f] != null && fieldNodes[f] != null && fieldNodes.length < 6) {
    return [];
  }

  if (myActions.length <= 0) {
    myActions[0] = "No Actions";
  }
  return myActions;
}


function createCustRecFields(fileContent, lines, a, rectype, itemNum, update, namefilter, rIds) {

  var custxml = fileContent.custrecord_flo_cust_page_xml;
  //nlapiLogExecution("DEBUG","creating CustRecFields",custxml);
  var recordXML = nlapiStringToXML(custxml);
  var fieldNodes = nlapiSelectNodes(recordXML, './/line[./customfieldseqnum]');
  var context = nlapiGetContext();
  var usageRemaining = context.getRemainingUsage();
  var auxlastFieldprocess = nlapiGetContext().getSetting('SCRIPT', 'custscript_last_field_process');
  var recordscriptId = nlapiSelectValue(recordXML, './/scriptid');
  var recordInternalId = nlapiSelectValue(recordXML, './/id');
  //nlapiLogExecution("DEBUG","cfieldNodes",JSON.stringify(fieldNodes));


  if (auxlastFieldprocess != null) {
    var j = auxlastFieldprocess;
  } else {
    var j = 0
  }

  for (f = j; fieldNodes[f] != null; f++) {
    var usageRemaining = context.getRemainingUsage();
    if (usageRemaining > 20) {

      var custrecordid = nlapiSelectValue(fieldNodes[f], 'fieldid');
      var custrecordscriptid = nlapiSelectValue(fieldNodes[f], 'fieldcustcodeid');
      if (rIds && rIds.indexOf(custrecordid) < 0 && rIds.indexOf(custrecordscriptid) < 0 && rIds.indexOf("parent-" + recordInternalId) < 0 && rIds.indexOf("parent-" + recordscriptId) < 0) {
        //Internal ID value is not in list of requested IDs
        docWrite("Skipping this row");
        continue;
      }

      //Remove found intid in the notFound list
      var intidPos = notFoundIds.indexOf(custrecordid);
      if (intidPos != -1) {
        notFoundIds.splice(intidPos, 1);
      }
      var scriptidPos = notFoundIds.indexOf(custrecordscriptid);
      if (scriptidPos != -1) {
        notFoundIds.splice(scriptidPos, 1);
      }
      var fieldcust = "Start,Description:" + nlapiSelectValue(fieldNodes[f], 'fielddescr') + ",Internal_ID:" + nlapiSelectValue(fieldNodes[f], 'fieldid') + ",ID:" + nlapiSelectValue(fieldNodes[f], 'fieldcustcodeid') + ",Link:" + nlapiSelectValue(fieldNodes[f], 'fieldurl') + ",Type:" + nlapiSelectValue(fieldNodes[f], 'fieldtype') + "," + nlapiSelectValue(recordXML, './/recordname') + ":Y,End";

      var fileContentAux = {};

      fileContentAux.rectype = rectype;
      fileContentAux.itemNum = itemNum;
      fileContentAux.update = update;
      fileContentAux.namefilter = namefilter;

      var url = domainGlobal + "/app/common/custom/custreccustfield.nl?id=" + custrecordid + "&xml=t";

      //nlapiLogExecution("DEBUG","url",url)

      xmlreq = nlapiRequestURL(url, null, a);
      custxml = xmlreq.getBody();
      xmlreq = null;
      fileContentAux.customizationstring = fieldcust;
      fileContentAux.custrecord_flo_cust_page_xml = custxml;
      fileContentAux.Internal_Id = nlapiSelectValue(fieldNodes[f], 'fieldcustcodeid');
      //Prevent from setting html in XML page field
      /*
      if(fileContentAux.custrecord_flo_cust_page_xml
         && (fileContentAux.custrecord_flo_cust_page_xml.replace(/\n/g,'').indexOf('<html')==0 || 
            fileContentAux.custrecord_flo_cust_page_xml.replace(/\n/g,'').indexOf('<!DOCTYPE')==0) ) {
          
          continue;
      
      }*/
      if (fileContentAux.custrecord_flo_cust_page_xml) {
        var cleanXML = fileContentAux.custrecord_flo_cust_page_xml.replace(/\n/g, '').toLowerCase();
        if (cleanXML.indexOf('<html') == 0 ||
          cleanXML.indexOf('<!doctype') == 0) {
          nlapiLogExecution('DEBUG', 'Skipping 5 ' + custrecordid, fileContentAux.custrecord_flo_cust_page_xml);
          continue;
        }
      }

      lines.push(fileContentAux);
      lastFieldprocess = f;

    } else {
      return lines;
    }
  }
  return lines;
}


function createCust(line, autoSpider) {

  //var rectypes="Start,CRM Field,25,Entity Field,3,Item Field,26,Other Field,27,Item Option Field,28,Column Field,4,Body Field,5,List,1,Record,2,Item Number Field,29,Entry Form,6,Transaction Form,7,Saved Search,8,Mass Update,9,Custom Record Field,30,Standard Record,24,Standard Field,31,Suitelet,17,RESTlet,22,User Event,21,Scheduled,34,Portlet,18,Client,20,Bundle Installation,35,Workflow Action,19,Workflow,10,Mass Update Script,23,Plug-In Script,33,End";

  nlapiLogExecution("debug", "createCust START", new Date().getTime())

  customization = line.customizationstring;

  //nlapiLogExecution("debug","customization",customization);

  rectype = line.rectype;

  var myJsoninternal_id = line.Internal_Id;

  try {
    var rectypeAux = line.rectypeNumAux;
  } catch (e) {
    var rectypeAux = null;
  }

  supdate = line.update;

  namefilter = line.namefilter;

  nlapiLogExecution('DEBUG', 'rectypeAux', line.rectypeAux);

  update = "F";

  //nlapiLogExecution("DEBUG","customization",customization);

  //recsProcessed++;//increase count of records processed
  if (supdate != null) {
    update = "T"
  }; //initializes update variable for server-side operations.

  custpairs = customization.split(",");

  custparams = [];
  for (c = 0; custpairs[c] != null && c < custpairs.length && c < 6000; c++) {

    custdata = custpairs[c].split(":");
    var label = custdata[0];
    label = label.replace('&nbsp;', " ");
    ////alert("#"+label.charAt(label.length-1)+"#")
    if (label.charAt(label.length - 1) == " ") {
      label = label.substring(0, label.length - 1)
    }
    ////alert("#"+label+"#")
    custparams[label] = custdata[1];
    for (cd = 2; custdata[cd] != null; cd++) {
      custparams[label] += ":" + custdata[cd];
    }
    //nlapiLogExecution('debug', 'For End Custdata',cd);
  }
  //nlapiLogExecution('debug', 'For End Cust Pairs ',c);  

  var nId = parseFloat(custparams.Internal_Id);


  nlapiLogExecution("DEBUG", "nId", nId);


  if (isNaN(nId)) {
    custparams.Internal_Id = custparams.Internal_ID;
  } else {
    custparams.Internal_Id = nId
  }

  if (isNaN(parseFloat(custparams.Internal_Id))) {
    custparams.Internal_Id = myJsoninternal_id;
  }

  nlapiLogExecution("DEBUG", "nId", custparams.Internal_Id);

  if (rectype != 'Custom Record Field') {
    custparams.Internal_ID = custparams.Internal_Id;
  }

  nlapiLogExecution("DEBUG", "nId", custparams.Internal_ID);

  if (custpairs.length <= 0) {
    nlapiLogExecution("Audit", "CUSTOMIZATION STRING EMPTY", line.customizationstring);
    return;
  }

  //nlapiLogExecution("DEBUG","id3",custparams.Internal_Id);
  //get description to be inserted into Name

  var description = custparams.Description;
  if (rectype == "Mass Update") {
    description = custparams.Title_of_Action;
  }
  if (rectype == "List") {
    description = custparams.List;
  }
  if (rectype == "Record") {
    description = custparams.Edit;
  }
  if (rectype == "Entry Form" | rectype == "Transaction Form" | rectype == "Saved Search" | rectype == "Workflow" | rectype == "Suitelet" | rectype == "User Event" | rectype == "Client" | rectype == "Scheduled" | rectype == "Bundle Installation" | rectype == "RESTlet" | rectype == "Portlet" | rectype == "Workflow Action" | rectype == "Mass Update Script" | rectype == "Plug-In Script" | rectype == "User Roles" | rectype == "Map Reduce" | rectype == "Bundle") {
    //docWrite("setting name to Name")
    description = custparams.Name;
  }
  if (rectype == "Script Deployments") {
    description = custparams.Script + " (Deployment)";
  }

  if (description == null | description == "") {
    docWrite("description is null" + rectype); /*return ""*/
  }

  //Check name filter
  if (namefilter != null && namefilter != "") {
    namestring = namefilter.replace("%", "");
    docWrite(namefilter + "--" + namestring + "--" + description + "--" + description.indexOf(namestring) + "<br>");
    if (namefilter.indexOf("%") == 0) {
      if (description.indexOf(namestring) < 0) {
        return 999999
      }
    } else if (description.indexOf(namefilter) != 0) {
      return 999999
    }

  }

  // autoSpiderFound="F";


  if (typeof custparams.florecordid != "undefined" && custparams.florecordid != null && custparams.florecordid != "") {
    //nlapiLogExecution('DEBUG', 'florecordid', florecordid);
    custrec = nlapiLoadRecord("customrecord_flo_customization", custparams.florecordid);

  } else {

    if (rectypeAux == null) {

      try {
        rectypeAux = rectypes.toLowerCase().split("," + rectype.toLowerCase() + ",")[1].split(",")[0];
      } catch (e) {
        rectnlapiLogExecution("debug", "lowercase 1", e);
        return;
      }
    }

    var recid = checkCust(custparams.ID, rectype, description, custparams.Internal_ID, rectypeAux);

    if (recid == "") {
      try {
        custrec = nlapiCreateRecord("customrecord_flo_customization");
      } catch (e) {
        return;
      }
    } else {
      nlapiLogExecution('DEBUG', 'ENTRE', recid);
      try {
        custrec = nlapiLoadRecord("customrecord_flo_customization", recid);
      } catch (e) {
        nlapiLogExecution('DEBUG', 'ENTRE', e);
        return;
      }
    }
  }



  //var recid=checkCust(custparams.ID,rectype,description,custparams.Internal_ID);

  //nlapiLogExecution("DEBUG","recid",recid);
  //nlapiLogExecution("DEBUG","description",description);

  /*if(recid=="")
       {
           custrec=nlapiCreateRecord("customrecord_flo_customization");
       }
       else if(update && update!="F" || autoSpiderFound=="T")
       {
            try{
              custrec=nlapiLoadRecord("customrecord_flo_customization",recid);
              }
              catch(e)
              {
                  nlapiLogExecution('debug', 'recid:'+recid, e);
                  return "autoSpider flag"
              }
            //nlapiLogExecution('debug', 'ENTRE', 'ENTRE');

            //nlapiLogExecution('debug', 'ENTRE', description);

            if(autoSpider != null && autoSpider=="T") nlapiSubmitField('customrecord_flo_customization',recid,'custrecord_flo_cust_in_use','T');


      }
      else if(autoSpider != null && autoSpider=="T")
      {
            nlapiSubmitField('customrecord_flo_customization',recid,'custrecord_flo_cust_in_use','T');
            nlapiLogExecution('DEBUG', 'autoSpider flag', 'autoSpider flag');
            return "autoSpider flag"
      }else{
           return recid
      }*/

  if (rectypeAux != null) {
    custrec.setFieldValue("custrecord_flo_cust_type", rectypeAux);
  } else {

    try {
      var rectypeNum = rectypes.toLowerCase().split("," + rectype.toLowerCase() + ",")[1].split(",")[0];
      custrec.setFieldValue("custrecord_flo_cust_type", rectypeNum)
    } catch (e) {
      if (rectypeAux != null) {
        custrec.setFieldValue("custrecord_flo_cust_type", rectypeAux);
      }
      rectnlapiLogExecution("debug", "lowercase debug 2 ", e);
    }

  }

  custrec.setFieldValue("name", description)


  if (typeof custparams.Internal_ID == 'undefined' && typeof custparams.internal_id != 'undefined') {
    custparams.Internal_ID = custparams.internal_id;
  }


  //if there is a new record created by the autospider set the respider flag. 
  /*if(autoSpider != null && autoSpider=="T"){
      //custrec.setFieldValue("custrecord_flo_autospider_found","T")
      custrec.setFieldValue("custrecord_flo_cust_in_use","T")

  }else{
     //custrec.setFieldValue("custrecord_flo_autospider_found","F")
     custrec.setFieldValue("custrecord_flo_cust_in_use","T")
  }*/

  try {
    if (custparams.Internal_ID != null) {
      custrec.setFieldValue("custrecord_flo_int_id", custparams.Internal_ID);
    }

  } catch (e) {
    nlapiLogExecution("debug", "intid: " + custparams.Internal_ID + "," + e);
  }

  if (typeof custparams.ID != "undefined" && custparams.ID != null && custparams.ID.trim() != '' && custparams.ID.trim() != 'undefined') {
    custrec.setFieldValue("custrecord_flo_cust_id", custparams.ID);
  } else {
    custrec.setFieldValue("custrecord_flo_cust_id", "");
  }

  if (custparams.Type) {
    custrec.setFieldValue("custrecord_flo_data_type", custparams.Type);
  }

  custrec.setFieldValue('custrecord_flo_make_join_proc', 'F');
  custrec.setFieldValue("custrecord_flo_cust_in_use", "T");
  custrec.setFieldValue("isinactive", "F");


  nlapiLogExecution("debug", "createCust mid", new Date().getTime())

  //description - not available on all records
  if (custparams.Description != null && custparams.Description != "" && custrec.getFieldValue("custrecord_flo_description") == "") {
    //docWrite("Setting Description<br><br>");
    custrec.setFieldValue("custrecord_flo_description", custparams.Description);
  } else {
    custrec.setFieldValue("custrecord_flo_description", "");
  }

  //owner - not available on all records
  if (custparams.Owner != null && custparams.Owner != "") {

    myName = custparams.Owner;

    if (custparams.Owner.indexOf("-") != -1) {
      var myName = reverseName(custparams.Owner);
    }

    owner = getEmpId(myName);

    //owner
    if (owner != "" && owner != null) {
      custrec.setFieldValue("owner", owner);
    }


    if (typeof owner == "undefined" || owner == null || owner == "" || owner == " ") {
      try {
        var tempXML = nlapiStringToXML(line.custrecord_flo_cust_page_xml);
        var node = nlapiSelectNodes(tempXML, '//owner');
        var owner = nlapiSelectValue(node, '//owner')
      } catch (e) {
        //nlapiLogExecution("debug","owner xml debug",e);
      }
      //nlapiLogExecution("DEBUG","owner xml",owner);
    }

    if (owner != "" && owner != null) {
      custrec.setFieldValue("owner", owner);
    }
    //docWrite(custparams.Last_Run_On+" "+custparams.Last_Run_By+"<br>")
  }
  //last run date and person for searches
  if (typeof custparams.Last_Run_On != 'undefined' && custparams.Last_Run_On != null && custparams.Last_Run_On != "" && custparams.Last_Run_On != "undefined" && custparams.Last_Run_On != " ") {

    //custrec=nlapiLoadRecord('customrecord_flo_customization',id);
    var myDate = custparams.Last_Run_On.split(" ")[0].trim();

    try {

      if (typeof myDate != "undefined" && myDate != "") {
        custrec.setFieldValue("custrecord_flo_dls", myDate);
      }

    } catch (e) {


      if (typeof myDate != "undefined" && myDate != "") {
        day = myDate.split("/")[1];
        month = myDate.split("/")[0];
        year = myDate.split("/")[2];
        myDate = day + "/" + month + "/" + year;
        try {
          custrec.setFieldValue("custrecord_flo_dls", myDate);
        } catch (e) {
          nlapiLogExecution('debug', 'DLS debug', e);
        }
      }

    }

    //nlapiSubmitRecord(custrec);

    //if(myDate.substring(0,1)=="0") myDate=myDate.replace("0","");

    //       var myDate=nlapiStringToDate(myDate2);

    //          if(myDate.indexOf("/")!=-1)
    //{
    //custrec.setFieldValue("custrecord_flo_dls",myDate);
    //}
  }

  if (typeof custparams.Last_Run_By != 'undefined' && custparams.Last_Run_By != null && custparams.Last_Run_By != "" && custparams.Last_Run_By != "undefined") {
    var runby = custrec.getFieldValue("custrecord_flo_employees_cust") + "";
    if (runby != "" && runby != null && runby != "null") {
      var runnames = runby.split(",");
    } else {
      runnames = [];
    }

    var myName = custparams.Last_Run_By;

    if (custparams.Last_Run_By.indexOf("-") != -1) {
      myName = reverseName(custparams.Last_Run_By);
    }

    var empid = getEmpId(myName);

    if (runnames == null | runnames.length == 0 | runnames.indexOf(empid) < 0) {
      runnames.push(empid);
      //docWrite(runnames.join()+"<br>")
      custrec.setFieldValues("custrecord_flo_employees_cust", runnames);
    }
  }
  //script file
  if (custparams.Script != null && !isNaN(parseInt(custparams.Script))) {
    custrec.setFieldValue("custrecord_flo_script_file", custparams.Script)
  }

  //library script file
  if (custparams.Library_Script != null && !isNaN(parseInt(custparams.Library_Script))) {
    custrec.setFieldValue("custrecord_flo_lib_script", custparams.Library_Script)
  }

  //XML representation of customization page
  //if(custparams.Link!=null && custparams.Link!="" && supdate==null)
  //nlapiLogExecution("DEBUG","XML",line.custrecord_flo_cust_page_xml.length)
  //docWrite("getting XML"+custparams.link)
  //xmlreq=nlapiRequestURL(custparams.link+"&xml=t",null,a);
  //custxml=xmlreq.getBody();
  //xmlreq=null;

  if (typeof line.custrecord_flo_cust_page_xml != "undefined" && line.custrecord_flo_cust_page_xml != null) {
    nlapiLogExecution('DEBUG', 'custrecord_flo_cust_page_xml ' + custrec.getId(), line.custrecord_flo_cust_page_xml);
    custrec.setFieldValue("custrecord_flo_cust_page_xml", line.custrecord_flo_cust_page_xml.substring(0, 999999));
  } else {
    nlapiLogExecution('DEBUG', 'no custrecord_flo_cust_page_xml ' + custrec.getId(), line.custrecord_flo_cust_page_xml);
    custrec.setFieldValue("custrecord_flo_cust_page_xml", "Locked Object");
  }

  //List or Multiple Select get the id
  if (custparams.List != null && custparams.List != " " && custparams.List != "&nbsp;" && rectype > 2) {
    //link=nlapiRequestURL(custparams.link+'&xml=t', null, a);
    //linkbody=link.getBody();
    //link=null;
    //list=linkbody.split("selectrecordtype")[2].substring(1);
    //list=list.split("<")[0];
    custrec.setFieldValue("custrecord_flo_list_data", line.custrecord_flo_list_data);

  }

  if (typeof custparams.From_Bundle != "undefined" && custparams.From_Bundle != null) {
    custrec.setFieldValue("custrecord_flo_bundle", custparams.From_Bundle);
  }

  custrec.setFieldValue("custrecord_flo_customization", customization);

  nlapiLogExecution('DEBUG', 'rectype', rectype);

  nlapiLogExecution('DEBUG', 'rectype', line.custrecord_flo_cust_page_xml);

  if (rectype == "Bundle") {
    var ismanaged = custparams.Managed;
    if (ismanaged == "Yes") {
      custrec.setFieldValue("custrecord_flo_manage_bundle", "T");
    } else {
      custrec.setFieldValue("custrecord_flo_manage_bundle", "F");
    }
    custrec.setFieldValue("custrecord_flo_description", custparams.Abstract);
    if (custparams.Installed_By) {
      var bundleowner = getEmpId(custparams.Installed_By);
      if (bundleowner != "" && bundleowner != null) {
        custrec.setFieldValue("owner", bundleowner);
      }
    }


  }

  if ((rectype == 10 || rectype == "Workflow") && line.custrecord_flo_cust_page_xml != null && line.custrecord_flo_cust_page_xml != "") {
    nlapiLogExecution('DEBUG', 'WF', line.custrecord_flo_cust_page_xml);
    custrec = parseWorkFlowXML(line.custrecord_flo_cust_page_xml, line.custrecord_flo_cust_page_xml_actions, custrec);
  }

  if (rectypeNum == 51 && line.custrecord_flo_cust_page_xml != null && line.custrecord_flo_cust_page_xml != "") {
    //custrec=parseDeploymentXML(line.custrecord_flo_cust_page_xml,custrec);
  }

  nlapiLogExecution("debug", "createCust mid2", new Date().getTime())

  try {
    docWrite("submitting" + custrec.getFieldValue("name") + "#" + custrec.getFieldValue("custrecord_flo_int_id"))

    nlapiLogExecution('debug', 'submitting', custrec.getFieldValue("name"));
    nlapiLogExecution('debug', 'submitting', custrec.getFieldValue("custrecord_flo_int_id"));
    nlapiLogExecution('debug', 'submitting', custrec.getId());


    newrecid = nlapiSubmitRecord(custrec);

    nlapiLogExecution("debug", "createCust mid3", new Date().getTime())

  } catch (e) {
    nlapiLogExecution('debug', 'WF10', e);

    if (typeof e != 'undefined' && e != null && typeof e.message != 'undefined' && e.message != null && e.message.indexOf("Invalid owner reference") >= 0) {
      custrec.setFieldValue("owner", getDefaultUser());
      try {
        newrecid = nlapiSubmitRecord(custrec);
      } catch (e) {
        //nlapiLogExecution('debug', 'WF11', e);
      }
    } else if (typeof e != 'undefined' && e != null && typeof e.message != 'undefined' && e.message != null && e.message.indexOf("custrecord_flo_searches") >= 0) {
      nlapiLogExecution('debug', 'WF13', e);

      custrec.setFieldValues('custrecord_flo_searches', null);

      try {
        newrecid = nlapiSubmitRecord(custrec);
      } catch (e) {
        //nlapiLogExecution('debug', 'WF12', e);
      }

    } else if (typeof e != 'undefined' && e != null && typeof e.message != 'undefined' && e.message != null && e.message.indexOf("Name") >= 0) {
      nlapiLogExecution('debug', 'WF14', e);

      custrec.setFieldValues('name', "Deployment");

      try {
        newrecid = nlapiSubmitRecord(custrec);
      } catch (e) {
        //nlapiLogExecution('debug', 'WF15', e);
      }

    }
  }

  custrec == null;


  nlapiLogExecution("debug", "createCust end", new Date().getTime())


  if (typeof newrecid != "undefined" && newrecid != null && newrecid != "") {
    if (autoSpider != null && autoSpider == "T") {
      return "autoSpider new record"
    };
    return newrecid
  } else {
    nlapiLogExecution('debug', 'Submitdebug', custrec.getFieldValue("custrecord_flo_cust_id"));
    return ""
  }

}


function parseDeploymentXML(custxml, custrec) {


  /*<?xml version="1.0" encoding="UTF-8"?>
  <nsResponse><record recordType="scriptdeployment" id="2" perm="4" fields="_eml_nkey_,_multibtnstate_,selectedtab,nsapiPI,nsapiSR,nsapiVF,nsapiFC,nsapiPS,nsapiVI,nsapiVD,nsapiPD,nsapiVL,nsapiRC,nsapiLI,nsapiLC,nsapiCT,nsbrowserenv,wfPI,wfSR,wfVF,wfFC,wfPS,type,id,externalid,whence,customwhence,entryformquerystring,wfinstances,script,title,scriptid,primarykey,deploymentid,version,isdeployed,status,eventtype,loglevel,hascodeaccess,runasrole,isonline,url,externalurl,audience,audslctrole,allroles,auddepartment,audsubsidiary,audgroup,audemployee,allemployees,audpartner,allpartners">
  <_eml_nkey_>51509591</_eml_nkey_><audience>59</audience>
  <deploymentid>1</deploymentid><entryformquerystring>id=2&e=T&xml=T</entryformquerystring>
  <externalurl>https://forms.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=11&deploy=1&compid=TSTDRV1160859&h=4c323a22cc996e732cee</externalurl>
  <hascodeaccess>T</hascodeaccess><id>2</id><isdeployed>T</isdeployed><isonline>T</isonline><loglevel>DEBUG</loglevel><nsapiCT>1429728574925</nsapiCT>
  <primarykey>2</primarykey><runasrole>3</runasrole><script>11</script><scriptid>customdeploy_sl_view_inventory</scriptid><status>RELEASED</status>
  <title>ViewInventorySL</title><type>scriptrecord</type><url>/app/site/hosting/scriptlet.nl?script=11&deploy=1</url><version>1</version>
  <whence>/app/site/hosting/scriptlet.nl?script=800&deploy=1&itemNum=233&targetRec=script%20deployments&recordNum=26&rqXML=T&portlet=F&update=T&scrollid=2</whence>
  <machine name="links" type="edit" fields="linkcenter,linksection,linkcategory,linklabel,linkinsertbefore,linkseqnum"/></record></nsResponse>*/


  var recordXML = nlapiStringToXML(custxml);
  var status = nlapiSelectValue(recordXML, './/status');
  var scriptid = nlapiSelectValue(recordXML, './/scriptid');
  var recordtype = nlapiSelectValue(recordXML, './/recordtype');
  var isdeployed = nlapiSelectValue(recordXML, './/isdeployed');
  var runasrole = nlapiSelectValue(recordXML, './/runasrole');
  var title = nlapiSelectValue(recordXML, './/title');
  var isonline = nlapiSelectValue(recordXML, './/isonline');
  var loglevel = nlapiSelectValue(recordXML, './/loglevel');


  var link = "/app/common/scripting/scriptrecord.nl?id=" + custrec.getFieldValue('custrecord_flo_int_id');

  if (typeof title != 'undefined' && title != 'null' && title != "") {
    custrec.setFieldValue('name', title);
  }

  custrec.setFieldValue('custrecord_flo_external_url', '');

  custrec.setFieldValue('custrecord_flo_custz_link', link);

  custrec.setFieldValue('custrecord_flo_is_online', isonline);

  if (runasrole != null && runasrole.indexOf(3) >= 0) {
    custrec.setFieldValue('custrecord_flo_execute_as_admin', 'T');
  }

  custrec.setFieldText('custrecord_flo_release_testing', status);

  custrec.setFieldText('custrecord_flo_log_level', loglevel);

  //custrec.setFieldValue('custrecord_flo_event_type',isonline);



  var scriptFil = [];
  scriptFil[0] = new nlobjSearchFilter('custrecord_flo_cust_id', null, 'is', scriptid.toLowerCase());

  var scriptList = nlapiSearchRecord("customrecord_flo_customization", null, scriptFil, null);
  if (scriptList && scriptList.length > 0) {
    var scriptId = scriptList[0].getId();
    custrec.setFieldValues('custrecord_flo_script_deployment', [scriptId]);

  }

  return custrec;

}


function parseWorkFlowXML(custxml, xmlactions, custrec) {

  try {


    var parentsArray = [];

    parentsArray['supportcase'] = 'Case';
    parentsArray['creditmemo'] = 'Sale';
    parentsArray['salesorder'] = 'Sale';
    parentsArray['purchaseorder'] = 'Purchase';
    parentsArray['revenuecommitment'] = 'Sale';
    parentsArray['estimate'] = 'Sale';
    parentsArray['job'] = 'Project';
    parentsArray['invoice'] = 'Sale';
    parentsArray['vendorbill'] = 'Purchase';

    var recordXML = nlapiStringToXML(custxml);

    var scriptid = nlapiSelectValue(recordXML, './/scriptid');

    var parent = nlapiSelectValue(recordXML, './/recordtypes');

    var triggerformulaGloblal = nlapiSelectValue(recordXML, './/initsavedsearchcondition') || null;

    if (triggerformulaGloblal != null && triggerformulaGloblal != "") triggerformulaGloblal = "Saved Search";

    var triggertypeArr = [] //nlapiSelectValue(recordXML,'.//triggertype');

    var triggertype = "";

    var triggeroncreate = nlapiSelectValue(recordXML, './/inittriggertype');

    var triggeronschedule = nlapiSelectValue(recordXML, './/schedulefrequency');
    //var triggeronupdate=nlapiSelectValue(recordXML,'.//triggeronupdate');

    //if(triggeroncreate!=null && triggeroncreate!='F'){
    triggertypeArr.push(triggeroncreate)
    /*}

    if(triggeronupdate!=null && triggeronupdate!='F'){
      triggertypeArr.push("On Update")
    }

    if(triggeronschedule!=null && triggeronschedule!='F'){
      triggertypeArr.push("On Schedule")
    }*/

    if (triggertypeArr.length > 0) triggertype = triggertypeArr.join(",");

    //var savedsearch=nlapiSelectValue(recordXML,'.//initsavedsearchcondition');

    var fieldNodes = nlapiSelectNodes(recordXML, './/line');

    var tranNodes = nlapiSelectNodes(recordXML, './/line');

    var custrecord_flo_wf_conditions = "";

    var custrecord_flo_workflow_field = "";

    var custrecord_flo_workflow_field_raw = "";

    var custrecord_flo_workflow_script_raw = "";


    var j = 0;

    var myActions = [];

    var myStatesActions = [];

    var actionsName = "";
    var satesName = "";

    for (f = j; fieldNodes[f] != null; f++) {

      var actionname = nlapiSelectValue(fieldNodes[f], 'actionname') || "";

      //var  actionname=nlapiSelectValue(fieldNodes[f],'actionname');

      var statename = nlapiSelectValue(fieldNodes[f], 'name') || "";

      var stateid = nlapiSelectValue(fieldNodes[f], 'stateid')

      nlapiLogExecution('DEBUG', 'statename', statename);

      nlapiLogExecution('DEBUG', 'actionname', actionname);


      if ((statename == null || statename == "") && (actionname == null || actionname == "")) continue;
      //if (actionname==null || actionname=="") continue;

      if (actionsName != "") actionsName += "\n"
      if (satesName != "") satesName += "\n"

      actionsName += "\nState:" + statename + "\n" + actionname;
      satesName += statename;

      myStatesActions[stateid] = statename;
    }

    nlapiLogExecution('DEBUG', 'WF4', tranNodes.length);
    var conditionsavedsearchids = [];
    for (ff = 0; tranNodes[ff] != null; ff++) {

      var transitionname = nlapiSelectValue(tranNodes[ff], 'transitionname') || "";
      var conditionsavedsearch = nlapiSelectValue(tranNodes[ff], 'conditionsavedsearch') || '';
      nlapiLogExecution('DEBUG', 'conditionsavedsearch', conditionsavedsearch);
      if (conditionsavedsearch && conditionsavedsearchids.indexOf(conditionsavedsearch) == -1) {
        conditionsavedsearchids.push(conditionsavedsearch);
      }
      if (transitionname != null && transitionname != "") {
        if (custrecord_flo_wf_conditions != "") {
          custrecord_flo_wf_conditions += "\n"
        } else {
          custrecord_flo_wf_conditions += "\n";
        }
        custrecord_flo_wf_conditions += transitionname;
      }

    }

    nlapiLogExecution('DEBUG', 'WF4', scriptid);
    nlapiLogExecution('DEBUG', 'WF4', custrecord_flo_wf_conditions);


    nlapiLogExecution('DEBUG', 'WF4', xmlactions.length);

    for (var i = 0; i < xmlactions.length; i++) {

      //var recordXMLActions=nlapiStringToXML(xmlactions[i].custrecord_flo_cust_page_xml); 

      //var fieldNodesActions=nlapiSelectNodes(recordXMLActions,'.//line');

      //or(f=0;fieldNodesActions[f]!=null;f++)
      for (var ii = 0; ii < xmlactions[i].actions.length; ii++) {

        var recordXMLActions = nlapiStringToXML(xmlactions[i].actions[ii].custrecord_flo_cust_page_xml);

        nlapiLogExecution('DEBUG', 'WF5', xmlactions[i].actions[ii].custrecord_flo_cust_page_xml);

        var recordXMLActions = nlapiStringToXML(xmlactions[i].actions[ii].custrecord_flo_cust_page_xml);

        //var myfield=nlapiSelectValue(fieldNodesActions[f],'field');

        //var mytriggercondition=nlapiSelectValue(fieldNodesActions[f],'triggercondition');

        var mytriggercondition = nlapiSelectValue(recordXMLActions, './/conditiontext') || "";

        var valueformula = nlapiSelectValue(recordXMLActions, './/valueformula') || "";

        var conditionformula = nlapiSelectValue(recordXMLActions, './/conditionformula') || "";

        var actiontype = nlapiSelectValue(recordXMLActions, './/actiontype') || "";

        var myfield = nlapiSelectValue(recordXMLActions, './/field') || "";

        var stateid = nlapiSelectValue(recordXMLActions, './/name') || "";

        var stateidAUX = nlapiSelectValue(recordXMLActions, './/stateid') || "";

        var arguments = nlapiSelectValue(recordXMLActions, './/arguments') || "";

        var conditionsavedsearch = nlapiSelectValue(recordXMLActions, './/conditionsavedsearch') || '';
        nlapiLogExecution('DEBUG', 'conditionsavedsearch', conditionsavedsearch);
        if (conditionsavedsearch && conditionsavedsearchids.indexOf(conditionsavedsearch) == -1) {
          conditionsavedsearchids.push(conditionsavedsearch);
        }

        var formulaExpressions = "";

        if (actiontype == "CUSTOMACTION") {

          var fieldNodesCustomActions = nlapiSelectNodes(recordXMLActions, './/line');
          for (ff = 0; fieldNodesCustomActions[ff] != null; ff++) {
            var myfield = nlapiSelectValue(fieldNodesCustomActions[ff], 'field');
            if (myfield != null && myfield != "") {
              if (custrecord_flo_workflow_field != "") {
                custrecord_flo_workflow_field += "\n"
              }
              /*else{
                                       custrecord_flo_workflow_field+="\n";
                                       //State:"+myStatesActions[stateid]+"\n";
                                    } */

              custrecord_flo_workflow_field += myfield.toLowerCase();

              if (custrecord_flo_workflow_field_raw != "") custrecord_flo_workflow_field_raw += ","
              custrecord_flo_workflow_field_raw += myfield.toLowerCase();
            }
          }

          var recordXMLActionParent = nlapiStringToXML(xmlactions[i].custrecord_flo_cust_page_xml);
          var fieldNodesActionsParent = nlapiSelectNodes(recordXMLActionParent, './/line');

          for (fff = 0; fieldNodesActionsParent[fff] != null; fff++) {
            var myactiontype = nlapiSelectValue(fieldNodesActionsParent[fff], 'actiontype');

            if (actiontype == "CUSTOMACTION") {

              var actiontypename = nlapiSelectValue(fieldNodesActionsParent[fff], 'actiontypename');

              if (actiontypename != null && actiontypename != "") {

                var scriptFil = [];
                scriptFil[0] = new nlobjSearchFilter('name', null, 'is', actiontypename.toLowerCase());
                scriptFil[1] = new nlobjSearchFilter('custrecord_flo_cust_type', null, 'anyof', 19);

                var scriptCol = [];
                scriptCol[0] = new nlobjSearchColumn("custrecord_flo_cust_id");

                var scriptList = nlapiSearchRecord("customrecord_flo_customization", null, scriptFil, scriptCol);
                if (scriptList && scriptList.length > 0) {
                  var myscript = scriptList[0].getValue('custrecord_flo_cust_id');

                  if (custrecord_flo_workflow_script_raw != "") custrecord_flo_workflow_script_raw += ","
                  custrecord_flo_workflow_script_raw += myscript;

                  //nlapiLogExecution('DEBUG', 'WF8', actiontypename+":"+myscript);

                }

              }
            }
          }
        }
        // triggerformula

        if (myfield != null && myfield.indexOf('=') > -1) {
          myfield = myfield.replace('=', ',').replace(/ /gi, '').replace(',T', '');
        } else if (myfield == null) {
          myfield = ""
        }

        if (myfield != null && myfield != "") {
          if (custrecord_flo_workflow_field != "") {
            custrecord_flo_workflow_field += "\n"
          }
          /*else{
                         custrecord_flo_workflow_field+="\n" 
                         //myStatesActions[stateid]+"\n";
                      }*/
          custrecord_flo_workflow_field += myfield.toLowerCase();
        }

        if (myfield != null && myfield != "") {
          if (custrecord_flo_workflow_field_raw != "") {
            custrecord_flo_workflow_field_raw += ","
          }
          custrecord_flo_workflow_field_raw += myfield.toLowerCase();
        }

        if (valueformula) {
          formulaExpressions += valueformula.toLowerCase() + " ";
        }

        if (arguments) {
          formulaExpressions += arguments.toLowerCase() + " ";
        }
        /*if(valueformula!=null && valueformula!=""){
          if(custrecord_flo_workflow_field!=""){
            custrecord_flo_workflow_field+="\n"
          }else{
             custrecord_flo_workflow_field+="\n" 
             //myStatesActions[stateid]+"\n";
          }
          custrecord_flo_workflow_field+=valueformula.toLowerCase();
        }

        if(valueformula!=null && valueformula!=""){
          if(custrecord_flo_workflow_field_raw!=""){
            custrecord_flo_workflow_field_raw+=","
          }
          custrecord_flo_workflow_field_raw+=valueformula.toLowerCase();
        }

        if(arguments!=null && arguments!=""){
          if(custrecord_flo_workflow_field!=""){
            custrecord_flo_workflow_field+="\n"
          }else{
             custrecord_flo_workflow_field+="\n" 
             //myStatesActions[stateid]+"\n";
          }
          custrecord_flo_workflow_field+=arguments.toLowerCase();
        }

        if(arguments!=null && arguments!=""){
          if(custrecord_flo_workflow_field_raw!=""){
            custrecord_flo_workflow_field_raw+=","
          }
          custrecord_flo_workflow_field_raw+=arguments.toLowerCase();
        }*/

        if (mytriggercondition != null && mytriggercondition != "") {
          if (custrecord_flo_wf_conditions != "") {
            custrecord_flo_wf_conditions += "\n"
          }
          /*else{
                         custrecord_flo_wf_conditions+="\n";
                      } */
          custrecord_flo_wf_conditions += mytriggercondition;
        }

        if (conditionformula != null && conditionformula != "") {
          if (custrecord_flo_wf_conditions != "") {
            custrecord_flo_wf_conditions += "\n"
          } else {
            custrecord_flo_wf_conditions += "\n";
          }
          custrecord_flo_wf_conditions += conditionformula;
          formulaExpressions += conditionformula;
          nlapiLogExecution('DEBUG', 'conditionformula', conditionformula);
        }

        if (formulaExpressions) {
          nlapiLogExecution('DEBUG', 'formulaExpressions', formulaExpressions);
          //Get fields from formula
          var formulafields = formulaExpressions.match(/[\'|\"|{]cust[^om][a-zA-Z_]*([0-9a-zA-Z_]*)[\'|\"|}]/g);
          nlapiLogExecution('DEBUG', 'formulafields', formulafields);
          if (formulafields) {
            for (var cf = 0; cf < formulafields.length; cf++) {
              var cfield = formulafields[cf].replace(/\'|\"|{|}/g, "");
              nlapiLogExecution('DEBUG', 'cfield', cfield);
              if (custrecord_flo_workflow_field != "") {
                custrecord_flo_workflow_field += "\n";
              }
              if (custrecord_flo_workflow_field_raw != "") {
                custrecord_flo_workflow_field_raw += ","
              }
              if (custrecord_flo_workflow_field.indexOf(cfield) == -1) {
                custrecord_flo_workflow_field += cfield.toLowerCase();
                custrecord_flo_workflow_field_raw += cfield.toLowerCase();
              }
            }
          }
        }
      }
    }

    //Get saved searches
    if (conditionsavedsearchids && conditionsavedsearchids.length > 0) {
      var ssfilters = [];
      var orfilters = [];
      for (var ss = 0; conditionsavedsearchids[ss] != null; ss++) {
        var exp = ['custrecord_flo_int_id', 'equalto', conditionsavedsearchids[ss]];
        orfilters.push(exp);
        if (ss + 1 != conditionsavedsearchids.length) {
          orfilters.push('or');
        }
      }
      ssfilters.push(orfilters);
      ssfilters.push('and');
      custtypeexp = ['custrecord_flo_cust_type', 'is', 8]; //Search 
      ssfilters.push(custtypeexp);
      ssfilters.push('and');
      inactiveexp = ['isinactive', 'is', 'F'];
      ssfilters.push(inactiveexp);
      nlapiLogExecution('DEBUG', 'ssfilters', ssfilters.join(","));

      searchcusts = nlapiSearchRecord("customrecord_flo_customization", null, ssfilters);
      if (searchcusts) {
        nlapiLogExecution('DEBUG', 'searchcusts', searchcusts.length);
        var workflowsearches = [];
        for (sc = 0; searchcusts[sc] != null; sc++) {
          var searchcustid = searchcusts[sc].getId();
          if (workflowsearches.indexOf(searchcustid) == -1) {
            workflowsearches.push(searchcustid);
          }
        }

        if (workflowsearches && workflowsearches.length > 0) {
          custrec.setFieldValue('custrecord_flo_searches', workflowsearches);
        }

      }
    }
    nlapiLogExecution('DEBUG', 'satesName', satesName);
    nlapiLogExecution('DEBUG', 'actionsName', actionsName);

    if (satesName != null && satesName != "") custrec.setFieldValue('custrecord_flo_wf_states', satesName.substring(0, 3999));
    if (actionsName != null && actionsName != "") custrec.setFieldValue('custrecord_flo_wf_actions', actionsName.substring(0, 3999));
    if (scriptid != null && scriptid != "") custrec.setFieldValue('custrecord_flo_cust_id', scriptid.substring(0, 3999));
    if (triggertype != null && triggertype != "") custrec.setFieldValue('custrecord_flo_wf_trigger_type', triggertype.substring(0, 3999));


    if (parent != null && parent != "") {

      var parentFilt = [];

      if (parentsArray[parent.toLowerCase()] != null && parentsArray[parent.toLowerCase()] != "") {
        parent = parentsArray[parent.toLowerCase()];
      }

      //parentFilt[0]=new nlobjSearchFilter('custrecord_flo_cust_id',null,'is',parent.toLowerCase()).setOr(true);
      parentFilt[0] = new nlobjSearchFilter('name', null, 'is', parent.toLowerCase());
      parentFilt[1] = new nlobjSearchFilter('custrecord_flo_cust_type', null, 'anyof', 24);

      parentList = nlapiSearchRecord("customrecord_flo_customization", null, parentFilt, null);

      if (parentList && parentList.length > 0) {
        var myValues = parentList[0].getId() + ",";

        //nlapiLogExecution('debug', 'WF7',parent.toLowerCase()+":"+myValues);

        custrec.setFieldValues('custrecord_flo_cust_parent', myValues.split(","));

      } else {

        var parentFiltCustom = [];

        parentFiltCustom[0] = new nlobjSearchFilter('custrecord_flo_cust_id', null, 'is', parent.toLowerCase());
        parentList = nlapiSearchRecord("customrecord_flo_customization", null, parentFiltCustom, null);

        if (parentList && parentList.length > 0) {
          var myValues = parentList[0].getId() + ",";

          //nlapiLogExecution('debug', 'WF7.1',parent.toLowerCase()+":"+myValues);

          custrec.setFieldValues('custrecord_flo_cust_parent', myValues.split(","));
        } else {
          //nlapiLogExecution('debug', 'WF7.2',parent.toLowerCase()+":");
        }
      }

    }

    nlapiLogExecution('DEBUG', 'WF4', scriptid);
    nlapiLogExecution('DEBUG', 'WF4', custrecord_flo_wf_conditions);

    if (custrecord_flo_wf_conditions != null && custrecord_flo_wf_conditions != "") {
      if (triggerformulaGloblal != null) {
        custrecord_flo_wf_conditions = "Global:\n" + triggerformulaGloblal + "," + custrecord_flo_wf_conditions;
      }
      custrec.setFieldValue('custrecord_flo_wf_conditions', custrecord_flo_wf_conditions.substring(0, 999999));
    } else {

      if (triggerformulaGloblal != null) {
        custrec.setFieldValue('custrecord_flo_wf_conditions', triggerformulaGloblal.substring(0, 999999));
      }
    }

    if (custrecord_flo_workflow_field != null && custrecord_flo_workflow_field != "") {
      custrec.setFieldValue('custrecord_flo_workflow_field', custrecord_flo_workflow_field.substring(0, 3999));
    }
    if (custrecord_flo_workflow_field_raw != null && custrecord_flo_workflow_field_raw != "") {
      custrec.setFieldValue('custrecord_flo_workflow_field_raw', custrecord_flo_workflow_field_raw.substring(0, 3999));
    }
    if (custrecord_flo_workflow_script_raw != null && custrecord_flo_workflow_script_raw != "") {
      custrec.setFieldValue('custrecord_flo_wf_scripts_raw', custrecord_flo_workflow_script_raw.substring(0, 3999));
    }

    //savedsearch
    //custrecord_flo_searches
    // if(savedsearch!=null && savedsearch!="") custrec.setFieldValues('custrecord_flo_searches',[savedsearch]);

    nlapiLogExecution('debug', 'triggeronschedule', triggeronschedule);

    if (triggeronschedule != null && triggeronschedule != "") {
      custrec.setFieldValue('custrecord_flo_wf_scheduled', triggeronschedule);
      custrec.setFieldValue('custrecord_flo_wf_trigger_type', "SCHEDULED");
    }

    //custrec.setFieldValue('custrecord_flo_xml_page_actions',xmlactions.substring(0,3999));


  } catch (e) {
    nlapiLogExecution('debug', 'WF9', e);
  }

  return custrec;
}

//++ NS-640
//function getInnerText(thisCell)
function getInnerText(thisCell, isDate)
//-- NS-640
{
  try {
    thisCell = thisCell.split("</a>")[0];
    thisCell = thisCell.replace("</td>", "");
    thisCell = thisCell.replace("</a>", "");
    if (thisCell.indexOf('&nbsp<img') != -1) {
      //Added for Bundle Image under Version
      thisCell = thisCell.replace(/\w*\s*=\s*('.*?'|".*?")/g, "").replace(/&nbsp<img.*?>/g, "");
    }
    thisCell = thisCell.substring(thisCell.lastIndexOf(">") + 1);
    //++ NS-640
    if (isDate != null && isDate == true) {
      return thisCell; //do not transform comma possible date format has comma
    } else {
      return thisCell.replace(/,/g, '&#44;');
    }
    //-- NS-640
  } catch (e) {
    nlapiLogExecution('debug', 'getInnerText', e);
    return "";
  }
}

function getRecordData(recordid, parent) {

  var recordReq = nlapiRequestURL("https://system.na1.netsuite.com/app/common/custom/custrecord.nl?id=" + recordid + "&xml=t", null, a);
  var recordXML = nlapiStringToXML(recordReq.getBody());
  //get Fields
  var fieldNodes = nlapiSelectNodes(recordXML, './/line[./customfieldseqnum]');
  for (f = 0; fieldNodes[f] != null && f < 2; f++) {
    fieldcust = "Start,Description:" + nlapiSelectValue(fieldNodes[f], 'fielddescr') + ",Internal_ID:" + nlapiSelectValue(fieldNodes[f], 'fieldid') + ",ID:" + nlapiSelectValue(fieldNodes[f], 'fieldcustcodeid') + "," + nlapiSelectValue(recordXML, './/recordname') + ":Y,End";
    id = createCust(fieldcust, 'Custom Record Field');
  }
}

function getEmpId(name) {
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
  for (e = 0; emplist != null && emplist[e] != null && e < emplist.length; e++) {
    cols = emplist[e].getAllColumns();
    if (emplist[e].getValue(cols[0]).match(name)) {
      return emplist[e].getId();
    }
  }
  //nlapiLogExecution('debug', 'For End emp list 2','');  
  return ""
}

function getExclude() {
  href = window.location.href;
  if (href.indexOf("&exclude=") > 0) {
    return href.substring(href.indexOf("&exclude=")).split("exclude=")[1].split("&")[0]
  }
  return "#";
}

function parseStandardRecords(page, rectype) {
  //alert(rectype)
  page = page.replace(/ class=\"record_cell\"/ig, "");
  page = page.replace(/\<\\td>/ig, "<td>");
  pageRows = page.split('<tr class="row_');
  //alert(pageRows.length)
  for (p = 1; pageRows[p] != null; p++) {
    cells = pageRows[p].split("<td>");
    // docWrite(cells[1]+"--"+cells[2]+"<br>")
    var recName = cells[1].split(">")[1].replace("</a", "");
    var recURL = cells[1].split(">")[0].replace("<a href=\"", "");
    recURL = recURL.replace("\"", "");
    recURL = recURL.substring(recURL.indexOf("=") + 1)

    //load page and convert to XML
    fieldreq = nlapiRequestURL("https://system.netsuite.com/help/helpcenter/en_US/RecordsBrowser/2013_2/" + recURL, null, a);
    fieldpage = fieldreq.getBody();
    fieldreq = null;
    fieldpage = fieldpage.replace(/\&nbsp\;/g, " ");
    fieldpage = "<html>" + fieldpage;
    fieldsXML = nlapiStringToXML(fieldpage);

    //create record if not already created
    customization = "description:" + recName + ",ID:" + cells[2];
    tranCheck = nlapiSelectValue(fieldsXML, ".//table[@class='record_table'][0]/tr/td[./text()=" + cells[2]);
    id = createCust(customization, "Standard Record");
  }
}

function reverseName(str) {
  //var arr=str.replace('-');
  //return arr[1]+" "+arr[0];
  var str = str.replace('-', ',');
  return str;
}

function completeURL(thisurl) {
  var currentloc = window.location.href;
  var currentdom = currentloc.substring(0, currentloc.indexOf("/app"));
  newurl = currentdom + thisurl;
  //alert(newurl)
  return newurl
}

function docWrite(text) {

  //if(writedebug==0) return;
  //try
  //{console.log(text)}
  //catch(e){
  nlapiLogExecution("DEBUG", "docWrite", text)
  //}
}

function Mydebug(message) {
  this.name = "Mydebug";
  this.message = message || "Default Message";
}

function getDefaultUser() {
  //This function returns the id of the default SuiteView user
  var defuser = nlapiGetContext().getSessionObject("defuser");
  if (defuser == null | defuser == "") {
    filters = [];
    filters[0] = new nlobjSearchFilter("lastname", null, 'is', 'FLODocs User');
    defemps = nlapiSearchRecord("employee", null, filters, null)
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
    }
    nlapiGetContext().setSessionObject("defuser", defemp);
    defuser = defemp;
  }
  return defuser;
}

function updateFieldParents(fileContent, rectype) {
  nlapiLogExecution('debug', 'enter', "updateFieldParents");
  try {
    var fieldxml = fileContent.custrecord_flo_cust_page_xml;
    var customizationstring = fileContent.customizationstring;
    if (fieldxml && customizationstring) {
      var recordXML = nlapiStringToXML(fieldxml);
      nlapiLogExecution('debug', 'enter ', rectype.indexOf('Body'));
      var partNodes = null;
      var sourceIndex = -1
      var firstparentIndex = -1
      var lastparentIndex = -1
      if (rectype.indexOf('Body') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'body')]");
        sourceIndex = customizationstring.indexOf("Source:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("Custom:");
        if (lastparentIndex == -1) {
          lastparentIndex = customizationstring.indexOf("Internal_Id:");
        }
      } else if (rectype.indexOf('CRM') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'appliesto')]");
        sourceIndex = customizationstring.indexOf("Tab:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("Internal_Id:");
      } else if (rectype.indexOf('Column') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'col')]");
        sourceIndex = customizationstring.indexOf("Source:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("Custom:");
        if (lastparentIndex == -1) {
          lastparentIndex = customizationstring.indexOf("Internal_Id:");
        }
      } else if (rectype.indexOf('Number') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'appliesto')]");
        sourceIndex = customizationstring.indexOf("Tab:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("Internal_Id:");

      } else if (rectype.indexOf('Option') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'col')]");
        sourceIndex = customizationstring.indexOf("Source:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("Custom:");
        if (lastparentIndex == -1) {
          lastparentIndex = customizationstring.indexOf("Internal_Id:");
        }
      } else if (rectype.indexOf('Item') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'appliesto')]");
        sourceIndex = customizationstring.indexOf("Tab:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("SubType:");
        if (lastparentIndex == -1) {
          lastparentIndex = customizationstring.indexOf("Internal_Id:");
        }
      } else if (rectype.indexOf('Entity') != -1) {
        parentNodes = nlapiSelectNodes(recordXML, "/nsResponse/record[1]/*[starts-with(name(),'appliesto')]");
        sourceIndex = customizationstring.indexOf("Tab:")
        firstparentIndex = customizationstring.indexOf(",", sourceIndex);
        lastparentIndex = customizationstring.indexOf("Internal_Id:");
      }

      if (parentNodes != null) {
        var parentValues = "";
        for (var i = 0; parentNodes != null && i < parentNodes.length; i++) {
          var parentfieldid = parentNodes[i].nodeName;
          var parentfieldvalue = nlapiSelectValue(recordXML, "/nsResponse/record[1]/" + parentfieldid)
          nlapiLogExecution('debug', 'parentfieldvalue', parentfieldvalue);
          if (parentfieldid != null) {
            if (parentValues != "") {
              parentValues += ","
            }
            parentValues += parentfieldid + ":" + (parentfieldvalue == "T" ? "Y" : " ");
          }
        }

        //sort parentnames alphabetically
        var parentArray = parentValues.split(",");
        parentArray.sort();
        parentValues = parentArray.join();

        nlapiLogExecution('debug', 'parentValues', parentValues);
        var newCustString = customizationstring.substring(0, firstparentIndex) + "," + parentValues + "," + customizationstring.substring(lastparentIndex)
        fileContent.customizationstring = newCustString;
      }

    }
  } catch (e) {
    nlapiLogExecution('debug', 'updateFieldParents', e);
  }



  return fileContent;
}