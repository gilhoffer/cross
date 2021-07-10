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

  var rectypesToArray="Online Customer Form,CRM Field,Entity Field,Item Field,Other Field,Item Option Field,Column Field,Body Field,List,Record,Item Number Field,Entry Form,Transaction Form,Saved Search,Mass Update,Custom Record Field,Standard Record,Standard Field,Suitelet,RESTlet,User Event,Scheduled,Portlet,Client,Bundle Installation,Workflow Action,Workflow,Mass Update Script,Plug-In Script,Map Reduce,User Roles,Script Deployments,Bundle";
  var writedebug=0;
  var recordNum=0;
  var rqXML="T";
  var portlet="F";
  var trackCustomFieldCount = {}
  trackCustomFieldCount.lastitemNum="";
  trackCustomFieldCount.count=0;

/* Global variables end */

function setStatField(myvalue)
{
  var spiderDate=nlapiDateToString(new Date());
    var spiderConfigList=nlapiSearchRecord("customrecord_flo_spider_configuration");
    if(spiderConfigList!=null)
    {
              spiderid=spiderConfigList[0].getId();
              var spiderConfigRec=nlapiLoadRecord('customrecord_flo_spider_configuration',spiderid);
              spiderConfigRec.setFieldText('custrecord_flo_spider_front_end',myvalue);
              if(myvalue == "Completed") {
                 spiderConfigRec.setFieldValue('custrecord_flo_spider_front_end_date',nlapiDateToString(new Date(),'datetimetz'));
                 spiderConfigRec.setFieldValue('custrecord_flo_session_lost','');

                  //Get Last Spider Completed
                  try {
                    var company=nlapiGetContext().getCompany();
                    var filefilter = [];
                    filefilter.push(new nlobjSearchFilter("name",null,"is",company+"-flospideredobjects.txt"));
                    var filesearch = nlapiSearchRecord("file",null,filefilter);
                    if(filesearch != null && filesearch[0] !=null) {
                        var file = nlapiLoadFile(filesearch[0].getId());
                        var spidercompleted = file.getValue();
                        if(spidercompleted) {
                         var comprec = JSON.parse(spidercompleted);
                         spiderConfigRec.setFieldValue('custrecord_flo_last_completed_spider',comprec.rec +" at "+comprec.time)
                        }

                    }
                  } catch(ef) {
                    nlapiLogExecution('debug', 'ERROR', ef);
                  }

              }
              nlapiSubmitRecord(spiderConfigRec);
    }
}



function spiderRecords(request,response)
{
try {

  itemNum=0;
  recDesc='';
  recordNum=0;
  rqXML=="F";
  portlet="F";

  setStatField("In Progress");

  var trackCustomFieldCountAux=request.getParameter("trackCustomFieldCount");
  if(trackCustomFieldCountAux!=null && trackCustomFieldCountAux != ""){trackCustomFieldCount=JSON.parse(trackCustomFieldCountAux);}

  var portletAux=request.getParameter("portlet");
  if(portletAux!=null){portlet=portletAux};

  var itemNumaux=request.getParameter("itemNum");
  if(itemNumaux!=null){itemNum=itemNumaux};

  var rqXMLaux=request.getParameter("rqXML");
  if(rqXMLaux!=null){rqXML=rqXMLaux};

  var recordNumaux=request.getParameter("recordNum");
  if(recordNumaux!=null){recordNum=recordNumaux};

  var fileid=request.getParameter("file");

  var started = 0;
  var startedaux = request.getParameter("started")
  if(startedaux && !isNaN(startedaux)) {
      started = startedaux;
  }

  var formlinecount = 0;
  var formlinecountaux = request.getParameter("formlinecount")
  if(formlinecountaux && !isNaN(formlinecountaux)) {
      formlinecount = formlinecountaux;
  }

  var formcounter = 0;
  var formcounteraux = request.getParameter("formcounter")
  if(formcounteraux && !isNaN(formcounteraux)) {
      formcounter = formcounteraux;
  }
  var lastProcIndex=request.getParameter("custparamlastprocessedindex") || request.getParameter("lastprocessedindex");
  if(lastProcIndex == null || isNaN(lastProcIndex)) {
    lastProcIndex = 0;
  } else {
    lastProcIndex = parseInt(lastProcIndex);
  }

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
  //check if the script should be restricted to certian record types
  targetRec=request.getParameterValues("targetRec");
  if(targetRec) {
     targetRec = targetRec.join(',').toLowerCase().split(',');
  }




  nlapiLogExecution("debug","targetRec",targetRec);



  if(targetRec=='item options') targetRec='Item Option Field'; // hack for testing

  if(targetRec=='custrec fields') targetRec='Custom Record Field'; // hack for testing

  //added plugin-type
  if (targetRec.indexOf("plug-in script") > -1 && targetRec.indexOf("plug-in type") == -1) {
    targetRec.push("plug-in type");
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
allrecords.push({rectype:'Online Customer Form', url: 'https://system.na1.netsuite.com/app/crm/sales/leadforms.nl?whence=&bundlefilter=BLANK'});

var customreportspiderurl = nlapiResolveURL("SUITELET","customscript_flo_report_spider",1);
allrecords.push({rectype:'Custom Report', url: customreportspiderurl});
allrecords.push({rectype:'Bundle', url: 'https://system.na1.netsuite.com/app/bundler/bundlelist.nl?type=I&whence=&bundlefilter=BLANK'});

var customentryformspiderurl = nlapiResolveURL("SUITELET","customscript_cstm_doc_form_lvl_spider",1);
allrecords.push({rectype:'Custom Record Form', url: customentryformspiderurl});

var groupspiderurl = nlapiResolveURL("SUITELET","customscript_flo_group_spider",1);
allrecords.push({rectype:'Group', url: groupspiderurl});

var spidertimestart = new Date().getTime();


allrecords = convertToAssociatedArr(allrecords);

if(targetRec.indexOf('all') != -1) {
     targetRec = Object.keys(allrecords);
}

//Create file log to monitor completed record types.
if(started == 0) {
      //Call parent mapping script:
      try {
        var parentmapurl = nlapiResolveURL("SUITELET","customscript_flo_field_parent_map_file",1);
        nlapiRequestURL(domain+parentmapurl, null, a)
      } catch(e) {

      }

      started = logRecordTypes(targetRec,true);
}



/*if (targetRec.toLowerCase()!='all' && recordNum!=999999){
       recordNum=0;
};*/
 nlapiLogExecution("debug","targetRecfinal",targetRec);
var recStart=recordNum;
 var showcomplete = "";
 if(portlet=="T"){


          nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_autospider_enable','T');

          var columns=[];
          columns[0]=new nlobjSearchColumn('custrecord_flo_autospider_last_run_date');
          columns[1]=new nlobjSearchColumn('custrecord_flo_autospider_frequency');

          var spiderConfigList=nlapiSearchRecord("customrecord_flo_spider_configuration",null,null,columns);
          var alreadyRun="F";

          if(spiderConfigList!=null)
          {
                  var spiderDate=spiderConfigList[0].getValue('custrecord_flo_autospider_last_run_date');

                  var custrecord_flo_autospider_frequency=spiderConfigList[0].getText('custrecord_flo_autospider_frequency');

                  var spiderid=spiderConfigList[0].getId();

                  var spiderDateActual=nlapiDateToString(new Date());

                  if(spiderDate==spiderDateActual && custrecord_flo_autospider_frequency!="Continuously"){

                        alreadyRun="T"

                        recStart=allrecords.length;
                        nlapiLogExecution("AUDIT","Already Execute");
                  }
          }
  }

var lastprocessedindex = 0;


for(var reci=recStart; reci < targetRec.length; reci++) {
  lastprocessedindex = 0;
  recordNum=reci;
  var rectype = targetRec[reci];
  if(allrecords[rectype] != null) {
    if(rectype== "group") {
      try {
        var statusgroup = nlapiScheduleScript('customscript_flo_group_spider', 1);
      } catch(e) {

      }
      itemNum = 1;
      recsProcessed = 0;
      nlapiLogExecution("debug","itemNum",itemNum)
    } else if(rectype== "custom report") {
  		var procstart = itemNum;
  		if(procstart==0 || isNaN(procstart)) {procstart=1;}
      var timepassed=new Date().getTime() - spidertimestart;

  		while(!isNaN(procstart) && nlapiGetContext().getRemainingUsage() > 200 && timepassed < 60000) {
        nlapiLogExecution("debug","timepassed",timepassed)
  			var resp = nlapiRequestURL(domain+allrecords[rectype].url+"&itemNum="+procstart, null, a)
  			procstart = resp.getBody();
        timepassed=new Date().getTime() - spidertimestart;

  		}
  		if(isNaN(procstart)) {
  			itemNum = 1;
  		} else {
  			itemNum = parseInt(procstart);
  		}
      recsProcessed = itemNum;
  		nlapiLogExecution("debug","itemNum",itemNum)
  	} else if(rectype == "custom record form") {
		var procstart = itemNum;
		if(procstart == 0 || isNaN(procstart)) {
			procstart=0;
		}
    
		var timepassed = new Date().getTime() - spidertimestart;
		while(!isNaN(procstart) && nlapiGetContext().getRemainingUsage() > 200 && timepassed < 60000) {
			nlapiLogExecution("debug","timepassed",timepassed);
			var resp = nlapiRequestURL(domain + allrecords[rectype].url + "&itemNum=" + procstart+"&linecount="+formlinecount+"&counter="+formcounter, null, a);
			
      try {
        var retObj = JSON.parse(resp.getBody());
        procstart = retObj.internalId;
        formlinecount = retObj.linecount;
        formcounter = retObj.counter;
      } catch(e) {
         break;
      }
			timepassed = new Date().getTime() - spidertimestart;
		}

		if(isNaN(procstart) || procstart == 0) {
			itemNum = 1;
      formlinecount = 0;
		} else {
			itemNum = parseInt(procstart);
		}
	  	recsProcessed = formcounter;
		nlapiLogExecution("debug","itemNum",itemNum)
  	} else {
  		try{
        if (rectype == "plug-in type")
          itemNum=parseListing(allrecords[rectype].url,"Plug-In Script",a,domain,itemNum,namefilter,update,rqXML,fileid,lastProcIndex);
        else
  			 itemNum=parseListing(allrecords[rectype].url,allrecords[rectype].rectype,a,domain,itemNum,namefilter,update,rqXML,fileid,lastProcIndex);
  		}catch(e){
        // Start NS-2424
        var errorMessage = e.message
        nlapiLogExecution("debug","rectype",rectype)
        nlapiLogExecution("debug","errorMessage",errorMessage)
        if(rectype == 'saved search' && errorMessage.indexOf('exceeded') !== -1) {
          try{
            nlapiLogExecution('debug','Calling Spider 2.0 for Saved Search',errorMessage);
            nlapiScheduleScript('customscript_flo_searches_spider','customdeploy_flo_searches_spider_2',{"custscript_flo_isinitialspider_search":"T"});
            itemNum = 1;
          }catch(e){
            nlapiLogExecution('debug','Error during Spider 2.0 for Saved Search',e);
          }          
        }
        // End NS-2424
  			nlapiLogExecution("debug","docWrite",errorMessage)
  		}
  		var actionsfileId = '';
  		//CHECK IF THERE IS A FILE ACTION TO CONTINUE PROCESSING
  		if(itemNum && itemNum.itemnum != null) {
        actionsfileId =itemNum.fileid;
        if(itemNum.lastprocessedindex != null) {
          lastprocessedindex = itemNum.lastprocessedindex;
        }
        itemNum = itemNum.itemnum
      }
  	}

    recDesc=allrecords[rectype].rectype;

    var context = nlapiGetContext();
    var usageRemaining = context.getRemainingUsage();
     nlapiLogExecution("debug","itemNum here",itemNum)
      nlapiLogExecution("debug","Object.keys(allrecords).length ",Object.keys(allrecords).length )
      nlapiLogExecution("debug","targetRec.length ",targetRec.length )
      nlapiLogExecution("debug","reci",reci )
    if(itemNum>1){
      nlapiLogExecution('audit', 'End processed', '1');reload=9999; break;
    } else if(itemNum==1) {
      var completetext = {};
      var datetoday = new Date();
      completetext.time = nlapiDateToString(datetoday, 'datetimetz')
      try {
        completetext.time =  nlapiLoadRecord('customrecord_flo_spider_configuration', 1).getDateTimeValue('custrecord_flo_current_server_time')
      } catch(e) {

      }
      completetext.finishedtype = recDesc;
      completetext.iscomplete = false;
      var showtext = recDesc
      if(targetRec.length==Object.keys(allrecords).length && reci == (targetRec.length-1)) {
         completetext.iscomplete = true;
         showtext = "Indexing Complete";
      }
      logRecordTypes(null,false,completetext);
      showcomplete="parent.document.getElementById('completed').innerHTML='"+showtext + " at " +  completetext.time +"'; parent.document.getElementById('completed').parentElement.style.display='table-row'; parent.document.getElementById('attention').parentElement.style.display='none';"
    }

    if(usageRemaining<=200){ nlapiLogExecution('audit', 'End processed', '2'); reload=9999; if(itemNum==1){ recordNum=parseFloat(reci)+1 }; break};

  }
}

if(typeof reload!="undefined" && reload>1){

  //run the spider scheduled script to process files before creating new ones.
  if(nlapiGetContext().getRemainingUsage() > 30) {
	  var  status= nlapiScheduleScript('customscript_spider_schedule', "customdeploy_flo_autospider_od");
	  nlapiLogExecution("debug","run ss spider","current status: "+status)
  }
  trackCustomFieldCount = JSON.stringify(trackCustomFieldCount);
  var url_servlet = nlapiResolveURL('SUITELET', 'customscript_getfields_server_side', 'customdeploy1');
  responseText="<script>try{parent.document.getElementById('rectypelabel').innerHTML='"+recDesc+"';"+showcomplete+"parent.document.getElementById('procnt').innerHTML="+recsProcessed+";}catch(e){}document.location.href='"+url_servlet+"&itemNum="+itemNum+"&targetRec="+targetRec+"&recordNum="+recordNum+"&rqXML="+rqXML+"&portlet="+portlet+"&update="+update+"&file="+actionsfileId+"&trackCustomFieldCount="+trackCustomFieldCount+"&lastprocessedindex="+lastprocessedindex+"&started="+started+"&formlinecount="+formlinecount+"&formcounter="+formcounter+"'</script>";
  response.write(responseText)

}else{

  //TSTDRV1307225

  if(rqXML=="T"){

    var myDeploy="customdeploy1";

    var status = nlapiScheduleScript('customscript_spider_schedule', 1);
    if ( status == 'QUEUED' ){
        nlapiLogExecution("debug","Script Status","Script Scheduled");
    }
     setStatField("Completed");
     try {
        nlapiScheduleScript('customscript_flo_get_status_for_customer', 1);
     } catch(ex) {

     }


  }

 responseText="";

  if(rqXML=="T"){
    responseText="<script>parent.document.getElementById('rectypelabel').innerText='Index Finished';"+showcomplete+"parent.document.getElementById('procnt').innerText='';parent.document.getElementById('spiderlogo').style.display='inline';parent.document.getElementById('spiderspin').style.display='none';</script>"

  }else{

    if(portlet=="T"){
        /*custSearch=nlapiLoadSearch("customrecord_flo_customization",'customsearch_customizations_to_respider');
        custResults=custSearch.runSearch();
        custs=custResults.getResults(0,1);
        if(custs!=null && custs.length>0)
        {
            var floSpiderUrl=nlapiResolveURL('SUITELET','customscript_flo_enterprise_suitelet','customdeploy_flo_spider_entry');
            responseText="";
            //responseText="<script>setTimeout(function(){if(typeof sessionStorage.autoSpider == 'undefined'|| sessionStorage.autoSpider!='T')";
            //responseText+="{var r = confirm('There are records that need to be Respider, Click OK to spider them now.');if(r == true){sessionStorage.///autoSpider='T';";
            //responseText+="top.location.href='"+floSpiderUrl+"';}}sessionStorage.autoSpider='T'},5000);</script>";
        }*/
       var status = nlapiScheduleScript('customscript_spider_schedule', "customdeploy_flo_autospider_od");

        responseText+="<script>if(typeof parent.document.getElementById('spiderspin') !='undefined' && parent.document.getElementById('spiderspin')!=null){parent.document.getElementById('spiderspin').innerHTML='<b>Spider Finished</b>'}</script>";
    }else{
        responseText="process done";
    }
  }
  response.write(responseText)
}

} catch(SpiderRecordsE) {
  nlapiLogExecution("DEBUG", "Spider Records E", SpiderRecordsE);
}
}

function convertToAssociatedArr(allrecords) {
    var assocarr = [];
    for(var a in allrecords) {
       var rectype = allrecords[a].rectype.toLowerCase();
       assocarr[rectype] = allrecords[a];
    }

    return assocarr;

}

function createTrackerFile(recordtypes) {
  try {
    var company=nlapiGetContext().getCompany();

    file = nlapiCreateFile(company+"-flospideredobjects.txt",'PLAINTEXT',contents);

    var folderfilter = [];
    folderfilter.push(new nlobjSearchFilter("name",null,"startswith","FLODocs Enterprise"));
    folderfilter.push(new nlobjSearchFilter("isinactive",null,"is","F"));
    var foldersearch = nlapiSearchRecord("folder",null,folderfilter);
    if(foldersearch && foldersearch[0]) {
       file.setFolder(foldersearch[0].getId());
    }

    if(file) {
      nlapiSubmitFile(file);
    }
  } catch(e) {

  }
}

function logRecordTypes(targetRec,reset,updates) {
  var fileid = 0;
  try {
      var statusobj = {};
      var filefilter = [];

      var company=nlapiGetContext().getCompany();
      filefilter.push(new nlobjSearchFilter("name",null,"is",company+"-flospideredobjects.txt"));
      var folderid = 0;
      var filesearch = nlapiSearchRecord("file",null,filefilter);
      if(filesearch != null && filesearch[0] !=null) {
         var oldfile = nlapiLoadFile(filesearch[0].getId());
         statusobj = JSON.parse(oldfile.getValue());
         folderid = oldfile.getFolder();
      }


      if(folderid <= 0) {
        var folderfilter = [];
        folderfilter.push(new nlobjSearchFilter("name",null,"startswith","FLODocs Enterprise"));
        folderfilter.push(new nlobjSearchFilter("isinactive",null,"is","F"));
        var foldersearch = nlapiSearchRecord("folder",null,folderfilter);
        if(foldersearch && foldersearch[0]) {
          folderid = foldersearch[0].getId();
        }
      }
      if(reset) {
          var rectypesstatus = {};
         // nlapiLogExecution("audit","e",JSON.stringify(targetRec))
          for(var r = 0; targetRec[r] != null; r++) {
             var type = targetRec[r];
             rectypesstatus[type] = "0";
          }
          statusobj.rectypes = rectypesstatus;
      } else if(updates) {
        finishedtype = updates.finishedtype;
        if(finishedtype) {
            finishedtype = finishedtype.toLowerCase();
        }
       // nlapiLogExecution("audit","rectypes",JSON.stringify(statusobj.rectypes) + " " + statusobj.rectypes[finishedtype])
        if(statusobj.rectypes && statusobj.rectypes[finishedtype]) {
          statusobj.rectypes[finishedtype] = "1";
        }

        if(updates.iscomplete) {
           statusobj.rec = "Indexing Complete";
        } else {
          statusobj.rec = updates.finishedtype;;
        }
        statusobj.time = updates.time
      }


      var newcontents = JSON.stringify(statusobj);

      var file = nlapiCreateFile(company+"-flospideredobjects.txt",'PLAINTEXT',newcontents);
      if(file) {
        file.setFolder(folderid);
        fileid = nlapiSubmitFile(file);
      }

      if(statusobj && statusobj.rectypes) {
        var unfinished = [];
        for(var r in statusobj.rectypes) {
            if(statusobj.rectypes[r] == "0") {
                unfinished.push(toTitleCase(r));
            }
        }
        nlapiSubmitField('customrecord_flo_spider_configuration',1,'custrecord_flo_rectypes_notcompleted',unfinished.join());

      }
  } catch(e) {
      nlapiLogExecution("debug","e",e)
  }
  return fileid;
}


function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function donothingfunction(){}
