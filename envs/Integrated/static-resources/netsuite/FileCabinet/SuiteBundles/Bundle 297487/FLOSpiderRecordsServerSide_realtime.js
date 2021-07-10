nlapiLogExecution("audit","FLOStart",new Date().getTime())
  /*Global Variables*/
  var unabletoprocess="";
  var searchlist="";//used to store a list of relevant customizations
  var emplist="";//used to store a list of employees used to set the relevant employees.
  var completedRecTypes="";//These are the rectypes that were completed in this pass and are skipped on a reload.
  var pageNum=0;//tracks the page that the process was on when it stopped
  var itemNum=0;//tracks the item that the process was on when it stopped
  var recsProcessed=0;//tracks the number of records processed.
  var recsCreated=0;//tracks the number of new records created.
  var recsUpdated=0;//tracks the number of records updated.
  var namefilter="";//tracks any search string to be applied to records.
  var rectypes="Start,Online Customer Form,76,CRM Field,25,Entity Field,3,Item Field,26,Other Field,27,Item Option Field,28,Column Field,4,Body Field,5,List,1,Record,2,Item Number Field,29,Entry Form,6,Transaction Form,7,Saved Search,8,Mass Update,9,Custom Record Field,30,Standard Record,24,Standard Field,31,Suitelet,17,RESTlet,22,User Event,21,Scheduled,34,Portlet,18,Client,20,Bundle Installation,35,Workflow Action,19,Workflow,10,Mass Update Script,23,Plug-In Script,33,Map Reduce,61,User Roles,50,Script Deployments,51,Bundle,71,End";
  var masterNotFound = {};
  var rectypesToArray="Online Customer Form,CRM Field,Entity Field,Item Field,Other Field,Item Option Field,Column Field,Body Field,List,Record,Item Number Field,Entry Form,Transaction Form,Saved Search,Mass Update,Custom Record Field,Standard Record,Standard Field,Suitelet,RESTlet,User Event,Scheduled,Portlet,Client,Bundle Installation,Workflow Action,Workflow,Mass Update Script,Plug-In Script,Map Reduce,User Roles,Script Deployments,Bundle";
  var writedebug=0;
  var recordNum=0;
  var rqXML="T";
  var portlet="F";
  var notFoundIds=[];
  var crid = 0;

/* Global variables end */


function spiderRecords(request,response)
{
  nlapiLogExecution("DEBUG","INSIDE");
  //response.write("<script>if(window.parent.getElementById('light') != null)window.parent.getElementById('light').style.display='none';if(window.parent.getElementById('fade')!= null)window.parent.getElementById('fade').style.display='none';window.close();</script>");
  itemNum=0;
  recDesc='';
  recordNum=0;
  rqXML=="F";
  portlet="F";

  var started = 0;
  var startedaux = request.getParameter("started")
  if(startedaux && !isNaN(startedaux)) {
      started = parseInt(startedaux);
  }

  var portletAux=request.getParameter("portlet");
  if(portletAux!=null){portlet=portletAux};

  var itemNumaux=request.getParameter("itemNum");
  if(itemNumaux!=null){itemNum=itemNumaux};

  var rqXMLaux=request.getParameter("rqXML");
  if(rqXMLaux!=null){rqXML=rqXMLaux};

  var recordNumaux=request.getParameter("recordNum");
  if(recordNumaux!=null){recordNum=recordNumaux};

  var notFoundIdsAux = request.getParameter("notFoundIds");
  if(notFoundIdsAux!=null && notFoundIdsAux!="") {notFoundIds=notFoundIdsAux.split(",")}

  var masterNotFoundAux = request.getParameter("masterNotFound");
  if(masterNotFoundAux!=null && masterNotFoundAux!="") {masterNotFound=JSON.parse(masterNotFoundAux);}

  var isReload = request.getParameter("isReload");
  if(isReload == null) { isReload="F"}

  var fileid=request.getParameter("file");

  crid=request.getParameter("crid") || 0;
  
  nlapiLogExecution("debug","getURL",request.getURL())

  a=request.getAllHeaders();

  var domain=request.getURL().split(/\/app\//)[0];


  nlapiLogExecution("debug","redirected","redirected")
  //check if the script should update records
  update=request.getParameter("update");
  if(update==null){update="F"}
  //check excluded records that will be skipped
  exclude=request.getParameter("exclude");
  nlapiLogExecution("debug","exclude",exclude);
  if(exclude==null){exclude="";}

  
  rectypeObjPair=request.getParameter("rectypeObjPair");
  nlapiLogExecution("DEBUG","rectypeObjPair",rectypeObjPair);
  
  if (rectypeObjPair) {
	try {
		rectypeObjPair = JSON.parse(rectypeObjPair);
	} catch(e) {
		nlapiLogExecution("ERROR","rectypeObjPair",e);
	}
  }
  


  namefilter=request.getParameter("namefilter");
  nlapiLogExecution("debug","exclude",namefilter);
  if(namefilter==null){namefilter="";}

  //Calculate path to script files
  var company=nlapiGetContext().getCompany();
  var version=nlapiGetContext().getVersion();

var allrecords=[];
allrecords.push({rectype:'Entity Field', url: 'https://system.na1.netsuite.com/app/common/custom/entitycustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'CRM Field', url: 'https://system.na1.netsuite.com/app/common/custom/eventcustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Other Field', url: 'https://system.na1.netsuite.com/app/common/custom/othercustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Item Field', url: 'https://system.na1.netsuite.com/app/common/custom/itemcustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Item Option Field', url: 'https://system.na1.netsuite.com/app/common/custom/itemoptions.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Body Field', url: 'https://system.na1.netsuite.com/app/common/custom/bodycustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Column Field', url: 'https://system.na1.netsuite.com/app/common/custom/columncustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Item Number Field', url: 'https://system.na1.netsuite.com/app/common/custom/itemnumbercustfields.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'List', url: 'https://system.na1.netsuite.com/app/common/custom/custlists.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Record', url: 'https://system.na1.netsuite.com/app/common/custom/custrecords.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&owner=&bundlefilter=BLANK'});
allrecords.push({rectype:'Custom Record Field', url: 'https://system.na1.netsuite.com/app/common/custom/custrecords.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&owner=&bundlefilter=BLANK'});
allrecords.push({rectype:'Entry Form', url: 'https://system.na1.netsuite.com/app/common/custom/custentryforms.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Mass Update', url: 'https://system.na1.netsuite.com/app/common/bulk/savedbulkops.nl?whence=&allprivate=T&bundlefilter=BLANK'});
allrecords.push({rectype:'Saved Search', url: 'https://system.na1.netsuite.com/app/common/search/savedsearches.nl?sortcol=type&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&showall=F&allprivate=T&use=ALL&type=&accesslevel=ALL&scheduled=ALL&bundlefilter=BLANK'});
allrecords.push({rectype:'Suitelet', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=SCRIPTLET&bundlefilter=BLANK'});
allrecords.push({rectype:'RESTlet', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=RESTLET&bundlefilter=BLANK'});
allrecords.push({rectype:'User Event', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=USEREVENT&bundlefilter=BLANK'});
allrecords.push({rectype:'Scheduled', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=SCHEDULED&bundlefilter=BLANK'});
allrecords.push({rectype:'Client', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=CLIENT&bundlefilter=BLANK'});
allrecords.push({rectype:'Portlet', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=PORTLET&bundlefilter=BLANK'});
allrecords.push({rectype:'Mass Update Script', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=MASSUPDATE&bundlefilter=BLANK'});
allrecords.push({rectype:'Workflow Action', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=ACTION&bundlefilter=BLANK'});
allrecords.push({rectype:'Bundle Installation', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=BUNDLEINSTALLATION&bundlefilter=BLANK'});
//allrecords.push({rectype:'Plug-In Script', url: 'https://system.na1.netsuite.com/app/common/scripting/pluginlist.nl?whence=&scripttype='});
allrecords.push({rectype:'Plug-In Script', url: 'https://system.na1.netsuite.com/app/common/scripting/pluginlist.nl?scripttype=&scriptfile=&bundlefilter=BLANK&sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=1000&showall=F&apiversion='});
allrecords.push({rectype:'Plug-In Type', url: 'https://system.na1.netsuite.com/app/common/scripting/plugintypelist.nl?scripttype=&scriptfile=&bundlefilter=BLANK&sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=1000&showall=F&apiversion='});
allrecords.push({rectype:'Map Reduce', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=MAPREDUCE&bundlefilter=BLANK'});
allrecords.push({rectype:'Workflow', url: 'https://system.na1.netsuite.com/app/common/workflow/setup/workflowlist.nl?searchtype=Workflow&Workflow_RECORDTYPE=@ALL@&Workflow_OWNER=@ALL@&Workflow_RELEASESTATUS=@ALL@&sortcol=Workflow_NAME_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&style=NORMAL&report=&grid=&searchid=-2800&bundlefilter=BLANK'});
allrecords.push({rectype:'Transaction Form', url: 'https://system.na1.netsuite.com/app/common/custom/custforms.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Script Deployments', url: 'https://system.na1.netsuite.com/app/common/scripting/scriptrecordlist.nl?type=&status=&recordtype=&apiversion=&scripttype=&sortcol=type&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=500&showall=F&bundlefilter=BLANK'});
allrecords.push({rectype:'User Roles', url: 'https://system.na1.netsuite.com/app/setup/rolelist.nl?whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Bundle', url: 'https://system.na1.netsuite.com/app/bundler/bundlelist.nl?type=I&whence=&bundlefilter=BLANK'});
allrecords.push({rectype:'Online Customer Form', url: 'https://system.na1.netsuite.com/app/crm/sales/leadforms.nl?whence=&bundlefilter=BLANK'});
var prefurl = "";
try {
  prefurl = nlapiResolveURL("SUITELET", "customscript_flo_pref_spider_respidernow",1);
} catch(e) {

}



var recStart=recordNum;

//Create file log to monitor completed record types.
if(started == 0) {
      //Call parent mapping script:
      try {
        var parentmapurl = nlapiResolveURL("SUITELET","customscript_flo_field_parent_map_file",1);
        nlapiRequestURL(domain+parentmapurl, null, a)
      } catch(e) {

      }
      
      started++;
}



	if (rectypeObjPair) {
	
	keys = Object.keys(rectypeObjPair);
    
    // sort keys so that Script Deployments is last
    // in the list.
    keys.sort();
    var keypos = keys.indexOf('Script Deployments');
    if(keypos != -1 && keypos !=keys.length - 1) {
      keys.splice(keypos,1);
      keys[keys.length] = 'Script Deployments'
    }
	
	for (ii=0; ii < keys.length; ) { //traverse request rectypes
		var targetRec=keys[ii];
		  
		if(targetRec == "Setup Preference" && prefurl) {
       var recIDs = rectypeObjPair[targetRec];
       var resp = nlapiRequestURL(domain+prefurl+"&scriptid="+recIDs, null, a)
    } else {
      for(var reci=recStart; reci < allrecords.length; reci++) {
        recordNum=reci;

        if(targetRec.toLowerCase()=='all' || targetRec.toLowerCase() == allrecords[reci].rectype.toLowerCase()) {
          var recIDs = rectypeObjPair[targetRec];

          //Check for non-existing objects
          if(isReload != "T") {
              notFoundIds = recIDs.split(",");
          }

          nlapiLogExecution("DEBUG","rectype: recIds", allrecords[reci].rectype +' : ' +recIDs);

          try{ 
            if (allrecords[reci].rectype == 'Plug-In Type') 
              itemNum=parseListing(allrecords[reci].url,'Plug-In Script',a,domain,itemNum,namefilter,update,rqXML,recIDs,fileid); 
            else
              itemNum=parseListing(allrecords[reci].url,allrecords[reci].rectype,a,domain,itemNum,namefilter,update,rqXML,recIDs,fileid); 
          }catch(e){
            nlapiLogExecution("debug","docWrite",e.message)
          }
          var actionsfileId = '';
          //CHECK IF THERE IS A FILE ACTION TO CONTINUE PROCESSING
          if(itemNum && itemNum.itemnum != null) {
            actionsfileId =itemNum.fileid;
            itemNum = itemNum.itemnum
          }
      
          
          recDesc=allrecords[reci].rectype;

          var context = nlapiGetContext();
          var usageRemaining = context.getRemainingUsage();

          if(targetRec.toLowerCase()!='all' && itemNum>1 ){ 
              nlapiLogExecution('audit', 'End processed', '1');reload=9999;  
              isReload = "T";
              break;
          }  else if( itemNum>1 ){ 
            nlapiLogExecution('audit', 'End processed', '3');  reload=9999; 
            isReload = "T"; 
            break;
          } else if(usageRemaining<=100){
            nlapiLogExecution('audit', 'End processed', '2'); 
            reload=9999; 
             isReload = "F";
            break;
          } else {
            isReload = "F";
          }
           nlapiLogExecution('debug', 'isReload', isReload);
        }
      }
    }
		
    if(isReload!="T") {
        if(notFoundIds != null && notFoundIds.length>0) {
          masterNotFound[targetRec] = notFoundIds;
          notFoundIds = [];
        }
        ii++;
    }
		if (typeof reload !="undefined" && reload > 1) {
			break;
    } 
	}
	} else {
    //Inactivate customizations if object is non-existent
    if(masterNotFound != null && Object.keys(masterNotFound).length > 0) {

      try {

        processNotFoundCustomizations(masterNotFound,crid);
      } catch(err) {
         nlapiLogExecution('debug','e',err);
      }
      
    }

     nlapiLogExecution('AUDIT','DONE');
     responseText="<script>parent.removeModal(true);</script>";
     response.write(responseText);
     return;
    }



if(typeof reload!="undefined" && reload>1){
  var newRecObj={};
  //continue with ii index
  for (;ii < keys.length; ii++) {
	newRecObj[keys[ii]]=rectypeObjPair[keys[ii]];
  }
  newRecObj=JSON.stringify(newRecObj);
  nlapiLogExecution("DEBUG","newRecObj",newRecObj);

  nlapiLogExecution("DEBUG","notFoundIds",notFoundIds.join(","));
  masterNotFound = JSON.stringify(masterNotFound);

  nlapiLogExecution("DEBUG","masterNotFound",masterNotFound);
  var url_servlet = nlapiResolveURL('SUITELET', 'customscript_getfields_server_side_rt', 'customdeploy_getfields_server_side_rt');
  responseText="<script>parent.document.getElementById('spiderframe').src='"+url_servlet+"&itemNum="+itemNum+"&rectypeObjPair="+newRecObj+"&update="+update+"&file="+actionsfileId+"&isReload="+isReload+"&notFoundIds="+notFoundIds.join(",")+"&masterNotFound="+masterNotFound+"&crid="+crid+"&started="+started+"'</script>";
  response.write(responseText);

  
}else{

  masterNotFound = JSON.stringify(masterNotFound);
  var url_servlet = nlapiResolveURL('SUITELET', 'customscript_getfields_server_side_rt', 'customdeploy_getfields_server_side_rt');
  responseText="<script>parent.document.getElementById('spiderframe').src='"+url_servlet+"&itemNum=&rectypeObjPair=&update=&file=&masterNotFound="+masterNotFound+"&crid="+crid+"&started="+started+"'</script>";
  nlapiLogExecution('debug', 'responseText', responseText);
  response.write(responseText);
}

}

function processNotFoundCustomizations(masterNotFound,crid) {
  try {
    var mainFilter = [];
    var typeIdFilters = [];
    var potentialprototype = [];
     for(var c in masterNotFound) {
        var tempfilters = [];
        var newrecnum=rectypes.toLowerCase().split(","+c.toLowerCase()+",")[1].split(",")[0];
        nlapiLogExecution("DEBUG","newrecnum",newrecnum);
        if(newrecnum!=null && !isNaN(newrecnum)) {
            var ids = masterNotFound[c];
            if(ids != null) {

              var scriptids = ids.filter(function(el){
                return isNaN(el)  && el.indexOf("parent-") != 0;
              });
              nlapiLogExecution("debug","scriptids",scriptids);
              if(scriptids != null && scriptids.length > 0) {
                nlapiLogExecution("debug","scriptids",JSON.stringify(scriptids));
                potentialprototype = potentialprototype.concat(scriptids);
              }


              ids = ids.filter(function(el){
                return !isNaN(el)  && el.indexOf("parent-") != 0;
              });


            }
            
            
            if(ids != null && ids.length > 0) {
               var typefilter = ['custrecord_flo_cust_type','is',newrecnum];
               tempfilters.push(typefilter);
               tempfilters.push('AND');
               var idsfilter = [];
               for(var i=0; ids[i]!=null;i++) {
                    if(idsfilter.length > 0) {
                       idsfilter.push("OR");
                    }
                    var custid = ids[i];
                    var idfilter  = ['custrecord_flo_int_id','equalto',custid];
                    idsfilter.push(idfilter);
               }
               tempfilters.push(idsfilter);
               
            }
        }
       nlapiLogExecution("DEBUG","tempfilters",tempfilters);
        if(tempfilters.length > 0) {

          if(typeIdFilters.length > 0) {
            typeIdFilters.push("OR")
          }
          typeIdFilters.push(tempfilters);
        }
        
     }
     if(typeIdFilters.length > 0) {
        mainFilter.push(typeIdFilters);
        nlapiLogExecution("DEBUG","typeIdFilters",JSON.stringify(typeIdFilters));
        var inactivefilter = ["isinactive","is","F"];
        mainFilter.push("AND");
        mainFilter.push(inactivefilter);
        mainFilter.push("AND");
        var notprototype = ["name","doesnotstartwith","prototype customization"]
        mainFilter.push(notprototype);
        nlapiLogExecution("DEBUG","mainFilter",JSON.stringify(mainFilter));


        //var searchcustomizations = nlapiSearchRecord("customrecord_flo_customization",null,mainFilter);
        var custTypeCol = new nlobjSearchColumn("custrecord_flo_cust_type");
        var searchcustomizations = nlapiSearchRecord("customrecord_flo_customization",null,mainFilter,custTypeCol);
        if(searchcustomizations) {
          for(var s = 0; searchcustomizations[s]!=null; s++) {

             var log=nlapiCreateRecord("customrecord_flo_change_log");
             log.setFieldValue("custrecord_flo_customization_record",searchcustomizations[s].getId());
             log.setFieldValue("custrecord_flo_field_name","Deleted");
             if (searchcustomizations[s].getText(custTypeCol)) {
                log.setFieldValue("custrecord_flo_change_overview",searchcustomizations[s].getText(custTypeCol) + " Deleted/Inactivated.");
             }             
             log.setFieldValue("custrecord_flo_field_script_id","isinactive");
             log.setFieldValue("custrecord_flo_field_new_value","true");
             log.setFieldValue("custrecord_flo_operation","delete");
             log.setFieldValue("custrecord_flo_old_value","false");
             logid=nlapiSubmitRecord(log,true,true);
             nlapiSubmitField("customrecord_flo_customization",searchcustomizations[s].getId(),"isinactive","T");
             //var workflowid =  nlapiInitiateWorkflowAsync('customrecord_flo_change_log', logid, 'customworkflow_flo_review_change_log_wf')
               
          }
        }

     }
     //create prototypes

      nlapiLogExecution("debug","potentialprototype.length",potentialprototype.length);
     if(potentialprototype && potentialprototype.length && crid!=null && crid != 0) {
        var recprefix = [];
        recprefix["custbody"] = "Body Field";
        recprefix["custevent"] = "CRM Field";
        recprefix["custentity"] = "Entity Field";
        recprefix["custitemnumber"] = "Item Number Field";
        recprefix["custitem"] = "Item Field";
        recprefix["customlist"] = "List";
        recprefix["customsearch"] = "Search";
        recprefix["customrecord"] = "Record";
        recprefix["customrole"] = "User Role";
        recprefix["customworkflow"] = "Workflow";
        potentialprototype = findNonExistingCustIDs(potentialprototype);
       // nlapiLogExecution("audit","potentialprototype",JSON.stringify(potentialprototype));
        for(var p=0; potentialprototype[p]!=null; p++) {
          for(var q in recprefix) {
            if(potentialprototype[p].indexOf(q) == 0) {
              try {
                var newrec = nlapiCreateRecord("customrecord_flo_customization");
                newrec.setFieldValue("name","prototype customization "+potentialprototype[p]+" ("+recprefix[q]+")" );
                newrec.setFieldText("custrecord_flo_cust_type",recprefix[q]);
                newrec.setFieldValue("custrecord_flo_cust_id",potentialprototype[p]);
                newrec.setFieldValue("owner",nlapiGetUser())
                var newrecid = nlapiSubmitRecord(newrec,false,true);

               /* var log=nlapiCreateRecord("customrecord_flo_change_log");
                 log.setFieldValue("custrecord_flo_customization_record",newrecid);
                 log.setFieldValue("custrecord_flo_field_name","System Notes");
                 log.setFieldValue("custrecord_flo_field_script_id","custrecord_flo_customization_system_notes");
                 log.setFieldValue("custrecord_flo_field_new_value","Record Created/Update");
                 log.setFieldValue("custrecord_flo_operation","edit");
                 log.setFieldValue("custrecord_flo_old_value","Record Created/Update");
                 log.setFieldValue("custrecord_flo_resolution_cr",crid);
                 log.setFieldValue("custrecord_flo_user_link",nlapiGetUser());
                 logid=nlapiSubmitRecord(log,true,true);*/
                 //var workflowid =  nlapiInitiateWorkflowAsync('customrecord_flo_change_log', logid, 'customworkflow_flo_review_change_log_wf')
               
              } catch(ee) {
                  nlapiLogExecution("debug","ee",ee);
              }
              
              break;
            }

          }
        }
     }

  } catch(e) {

  }
  
}

function findNonExistingCustIDs (potentialprototype) {
  var notfound = [];
  try {
    var propfilters = []; 
    var scriptidfilters = [];
    if(potentialprototype) {
      var pcusts = potentialprototype;
      notfound = pcusts;
      for(var p = 0; pcusts[p] != null; p++) { 
        if(scriptidfilters.length > 0) { 
          scriptidfilters.push('OR'); 
        } 
        var sf  = ['custrecord_flo_cust_id','is',pcusts[p].trim()]; 
        scriptidfilters.push(sf); 
      } 
     //  nlapiLogExecution("debug","scriptidfilters",JSON.stringify(scriptidfilters));
      if(scriptidfilters.length > 0) { 
        propfilters.push(scriptidfilters); 
        var inactivefilter = ['isinactive','is','F']; 
        propfilters.push('AND'); 
        propfilters.push(inactivefilter); 
        var columns = [];
        columns.push(new nlobjSearchColumn("custrecord_flo_cust_id"));
        var searchcusts = nlapiSearchRecord('customrecord_flo_customization',null,propfilters,columns); 
        if(searchcusts) { 
          
          for(var c = 0; searchcusts[c] != null; c++) { 
            custrectid = searchcusts[c].getValue("custrecord_flo_cust_id"); 
            
            var iindex = notfound.indexOf(custrectid);
            if(iindex != -1) {
              notfound.splice(iindex,1)
            } 
          }
        }
      }
    }
    
  } catch(e) {
    nlapiLogExecution("debug","e",ee);
  }
  return notfound;
  
}

