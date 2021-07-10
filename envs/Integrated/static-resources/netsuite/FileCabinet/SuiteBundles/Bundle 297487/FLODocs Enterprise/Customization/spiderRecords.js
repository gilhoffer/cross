nlapiLogExecution("audit","FLOStart",new Date().getTime())
function spiderRecords(request,response)
{
  //check if the script should update records
  update=request.getParameter("update");
  if(update==null){update="F"}
  //check excluded records that will be skipped
  exclude=request.getParameter("exclude");
  nlapiLogExecution("debug","exclude",exclude);
  if(exclude==null){exclude="";}
  //check if the script should be restricted to certian record types
  targetRec=request.getParameter("targetRec");
  if(targetRec==null){targetRec="Saved Search"}

  responseText="<html><body><script language='JavaScript' type='text/javascript'>window.renderstarttime = new Date(); window.status='Loading...';</script><script type='text/javascript' src='/javascript/NLUtil.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/javascript/NLUIWidgets.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/ext-3.3.1/adapter/ext/ext-base.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/ext-3.3.1/ext-all.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/ext-3.3.1/extensions/plugins/Ext.ux.form.HtmlEditorExtensions.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/jquery/jquery-1.7.2.min.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/highcharts-2.2.4/js/highcharts.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/highcharts-2.2.4/js/modules/exporting.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/javascript/NLHighChartsTheming.js?NS_VER=2013.2.0&minver=108&locale=en_US'></script><script type='text/javascript' src='/javascript/NLHighCharts.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/javascript/NLHighChartsMeter.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/javascript/NLAppUtil.jsp__center=BASIC&NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/javascript/NLAPI.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/javascript/NLAnimation.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='/javascript/NLExtTooltip.jsp__NS_VER=2013.2.0&minver=108&locale=en_US.nlqs'></script><script type='text/javascript' src='https://system.na1.netsuite.com/core/media/media.nl?id=9758&c=TSTDRV1049933&h=1b36345e579b34d5d34c&_xt=.js'></script>";
responseText+="<script>try{";
responseText+="document.write('Starting');\n";
responseText+="var update='"+update+"';\n";
responseText+="var exclude='"+exclude+"';\n";
responseText+="var targetRec='"+targetRec+"';\n";
responseText+="var a = new Array();\n";
responseText+="a['User-Agent-x'] = 'SuiteScript-Call';\n"
//responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/entitycustfields.nl?whence=', null, a);\n"
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/entitycustfields.nl?whence=','Entity Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/eventcustfields.nl?whence=','CRM Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/othercustfields.nl?whence=','Other Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/itemcustfields.nl?whence=','Item Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/itemoptions.nl?whence=','Item Option Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/bodycustfields.nl?whence=','Body Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/columncustfields.nl?whence=','Column Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/itemnumbercustfields.nl?whence=','Item Number Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/custlists.nl?whence=','List');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/custrecords.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&owner=&bundlefilter=BLANK','Record');\n";
//responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/custrecords.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&owner=&bundlefilter=BLANK','Custom Record Field');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/custentryforms.nl?whence=','Entry Form');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/custom/custforms.nl?whence=','Transaction Form');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/search/savedsearches.nl?sortcol=type&sortdir=DESC&csv=HTML&OfficeXML=F&pdf=&showall=F&allprivate=F&use=ALL&type=&accesslevel=ALL&scheduled=ALL&bundlefilter=BLANK','Saved Search');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=SCRIPTLET&bundlefilter=BLANK','Suitelet');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=RESTLET&bundlefilter=BLANK','RESTlet');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=USEREVENT&bundlefilter=BLANK','User Event');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=SCHEDULED&bundlefilter=BLANK','Scheduled');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=CLIENT&bundlefilter=BLANK','Client');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=PORTLET&bundlefilter=BLANK','Portlet');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=MASSUPDATE&bundlefilter=BLANK','Mass Update');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=ACTION&bundlefilter=BLANK','Workflow Action');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/scripting/scriptlist.nl?sortcol=name&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&report=F&scripttype=BUNDLEINSTALLATION&bundlefilter=BLANK','Bundle Installation');\n";
responseText+="rdata = parseListing('https://system.na1.netsuite.com/app/common/workflow/setup/workflowlist.nl?searchtype=Workflow&Workflow_RECORDTYPE=@ALL@&Workflow_OWNER=@ALL@&Workflow_RELEASESTATUS=@ALL@&sortcol=Workflow_NAME_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&showall=F&style=NORMAL&report=&grid=&searchid=-2800&bundlefilter=BLANK&_eml_nkey_=70731460','Workflow');\n";
responseText+="parent.document.getElementById('spiderlogo').style.display='inline';parent.document.getElementById('spiderspin').style.display='none';";
 
  responseText+="}catch(e){if(e.message=='Script Execution Usage Limit Exceeded'){alert('reloading <br>');href=window.location.href;if(href.indexOf('&exclude=')>0){href=href.substring(0,href.indexOf('&exclude='))};alert(window.location.href+'--'+href+'&exclude='+completedRecTypes+'&pageNum='+pageNum+'&itemNum='+itemNum);if(window.location.href!=href+'&exclude='+completedRecTypes+'&pageNum='+pageNum+'&itemNum='+itemNum){window.location.href=href+'&exclude='+completedRecTypes +'&pageNum='+pageNum+'&itemNum='+itemNum;setTimeout(function(){location.reload()},500);}}else{document.write(e.message+'<br>');}}</script></body></html>";
  response.write(responseText)
}

