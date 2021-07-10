	  //set default stage
	  var stage="topicon";
          var currentpid="";
	  var laststage="";
	   sessionStorage.stage=stage;

	  function overwriteLastStage(last) {
		laststage+=","+last;
	  }
	  
	  function showNav2(type)
	  {
		//alert(type)
               //This function operates the navigation of suiteview
               //alert("Type:"+type)

		sessionStorage.stage=type;

		$("."+stage).hide();
        //$(".backbutton").fadeIn(fadespeed);
		//	$("."+type).fadeIn(fadespeed);
		//setTimeout(function(){
			//alert(type+"--"+$("."+type).length+$("."+type)[0].innerHTML)
		    $("."+type).show();
	        //$(".backbutton").fadeIn(fadespeed);
		    //},1000);
                if(laststage.indexOf(type)>0)
                {
                    //alert("LS:"+laststage);
laststage=laststage.substring(0,laststage.lastIndexOf(","+type));
//alert(laststage);
                }
                else
                {
		 laststage+=","+stage;
                }
		stage=type;
				//EXTERNAL SYSTEM CHANGE : TYPE=CUSTFRAME
                if(type=="processframe" | type=="custframe" | type=="custexternal" | type=="processlist")
                {
                  loadFrame(type);
				  
                  /*if(document.getElementById("processmapdiv").style.display=="none")
				{document.getElementById("processmapdiv").style.display="inline";}*/
				$('.processframe').show();
                }
				
				
                if(type=="spider" && hideSpider()==true)
                {return}
 				else
				{
                
                  showControls(type);
				  
				}
				
				//Check license STOPSCRIPT FIELD. If ticked, show alert.
 				if(type=="spider" && top.nlapiLookupField("customrecord_flo_license",1,"custrecord_flo_license_stopscripts") == "T") {
				   //++NS-1986 Alert is not needed anymore because we will automaticall start the  scripts when Run Spider is clicked.
                   //alert("Strongpoint Scripts are stopped, no update will be completed");
                   //--NS-1986
				}
		
	  }

        function loadFrame(type)
        {
	
           //This function loads the main navigation frames.
           if(type=="custframe" && document.getElementById("custmap").src)
           {
              var customizationid = "";
              var custparam=window.location.href.split("customizationid=")[1];
              if(custparam!=null && custparam!=undefined) {
                  custparam = custparam.split("&")[0];
                  if(!isNaN(custparam)) {
                    customizationid+=custparam;
                  }
              }

				      document.getElementById("custmap").src="/app/site/hosting/scriptlet.nl?script=customscript_flo_cust_viz&deploy=1&customizationid="+customizationid;
				      document.getElementById("custdetail").src="empty.html";
          }
		  //FOR EXTERNAL SYSTEM ERD
		  if(type=="custexternal" && document.getElementById("custmapexternal").src)
           {
				document.getElementById("custmapexternal").src="/app/site/hosting/scriptlet.nl?script=customscript_flo_cust_viz_external&deploy=1";
				document.getElementById("custdetail").src="empty.html";
          }

          if(type=="processframe" && document.getElementById("processframe").contentWindow.canvas==null)
          {

			document.getElementById("processframe").src="FLOIndex3.html";
          	//document.getElementById("processdetail").src="/app/site/hosting/scriptlet.nl?script=customscript_process_asst&deploy=1";
          }

          if(type=="processlist")
          {

			document.getElementById("processlist").src="FLOProcessTree.html";
			alert(document.getElementById("processlist").src)
			
          }
         
        }

         function showControls(icontype)
         {
            //This script shows the icons for the relevant process and customization displays
          //icontype is the current view being displayed derived from the type parameter 
          
          if(icontype=="processframe")
          {
           $(".savebutton").fadeIn(fadespeed);
           $(".copybutton").fadeIn(fadespeed);
           $(".printbutton").fadeIn(fadespeed);
           $(".toolbutton").fadeIn(fadespeed);
		   $(".backbutton").fadeIn(fadespeed);
		   $(".homebutton").fadeIn(fadespeed);
			$(".flobreadcrumbs").fadeIn(fadespeed);
			$(".processlisticon").fadeIn(fadespeed);
           $(".newbutton").fadeIn(fadespeed);
           $(".forwardbutton").fadeIn(fadespeed);
           $(".flocrumb").fadeIn(fadespeed);
           
           }
          else if(icontype=="processlist")
          {
           $(".savebutton").fadeOut(fadespeed);
           $(".copybutton").fadeOut(fadespeed);
           $(".printbutton").fadeOut(fadespeed);
           $(".toolbutton").fadeOut(fadespeed);
		   $(".backbutton").fadeIn(fadespeed);
		   $(".homebutton").fadeIn(fadespeed);
			$(".flobreadcrumbs").fadeOut(fadespeed);
			$(".processlisticon").fadeOut(fadespeed);
           $(".newbutton").fadeOut(fadespeed);
           $(".forwardbutton").fadeOut(fadespeed);
           $(".flocrumb").fadeOut(fadespeed);

           }
          else if(icontype=="newframe" | icontype=="processdetail")
          {
           $(".savebutton").fadeOut(fadespeed);
           $(".copybutton").fadeOut(fadespeed);
           $(".printbutton").fadeIn(fadespeed);
           $(".toolbutton").fadeIn(fadespeed);
		   $(".backbutton").fadeIn(fadespeed);
		   $(".homebutton").fadeIn(fadespeed);
			$(".flobreadcrumbs").fadeIn(fadespeed);
			$(".processlisticon").fadeIn(fadespeed);
           $(".newbutton").display="none";
           $(".forwardbutton").fadeIn(fadespeed);
           $(".flocrumb").fadeIn(fadespeed);

           }
           else if(icontype=="custframe" || icontype=="custexternal")
          {
		   $(".backbutton").fadeIn(fadespeed);
		   $(".homebutton").fadeIn(fadespeed);
           $(".savebutton").display="inline";
           $(".printbutton").display="inline";
		   $(".backbutton").display="inline";
		   $(".homebutton").display="inline";
           $(".newbutton").display="inline";
           $(".forwardbutton").display="inline";
		   $(".flobreadcrumbs").display="none";
           $(".flocrumb").display="none";
		   $(".processframe").hide();
		   $(".processdetail").hide();
           }
           else if(icontype=="spider")
          {
           $(".savebutton").display="none";
           $(".printbutton").display="none";
		   $(".backbutton").display="inline";
		   $(".homebutton").display="inline";
           $(".newbutton").display="none";
           $(".forwardbutton").display="none";
		   $(".flobreadcrumbs").display="none";
          $(".flocrumb").display="none";
           }
           else
           {
           $(".savebutton").fadeOut("fast");
           $(".copybutton").fadeOut("fast");
           $(".printbutton").fadeOut("fast");
           $(".toolbutton").fadeOut("fast");
		   $(".backbutton").display="none";
		   $(".homebutton").display="none";
           $(".newbutton").display="none";
           $(".forwardbutton").fadeOut("fast");
           $(".flocrumb").fadeOut("fast");
		   $(".flobreadcrumbs").display="none";
             
           }
		                   
         }

          function goHome()
          {
              //Jumps back to the home screen
              //laststage=laststage.split(",")[0];
              laststage="";
              tdate=new Date();
              window.location.href="FLOEntryScreens.html?t="+tdate;
          }
  
          function goBack()
          {
               var thisType=laststage.substring(laststage.lastIndexOf(",")+1);
               
               if((stage=="processframe" && document.getElementById("processdetaildiv").style.display=='inline') |( stage=="custframe" && document.getElementById("detaildiv").style.display=='inline'))
               {closeDetail();}
               else
               {showNav2(thisType);}
			   
			    if(laststage=="" || !laststage) {  goHome();}
           }

          function closeDetail()
          {
              try
              {
              //document.getElementById("detaildiv").style.display='none';
               //document.getElementById("processdiv").style.display='inline';
				$('.processframe').show();
				$('.processdetail').hide();
               }catch(e){}
               try
               {
				//document.getElementById("processdetaildiv").style.display='none';
				//document.getElementById("processmapdiv").style.display='inline';
               }catch(e){}
                 
          
          }

           function closeProcessDetail()
          {
              
             // document.getElementById("detaildiv").style.display='none';
               
			//document.getElementById("processdetaildiv").style.display='none';
			//document.getElementById("processmapdiv").style.display='inline';
			$('.processframe').show();
			$('.processdetail').hide();
          }
	
function crumbAction(pid,crumbName)
{
            //alert(pid+"--"+crumbName+"--"+document.getElementById("processmapdiv").style.display+"--"+document.getElementById("processframe").style.display)
            //This function passes the process id (pid) from the breadcrumb div element created by updateBreadcrumbs(pid) to the drillDown function in the process map.   
              var mapflag=false;//tracks whether we should switch to the map
              if(pid==currentpid )
              {
                 //if(document.getElementById("processmapdiv").style.display=="none" | (document.getElementById("processmapdiv").style.display!="none" && confirm("You are already on this page.  Click 'OK' to refresh the diagram.  All unsaved changes will be lost.  Press 'Cancel' to return to editing.")==true))
				if($('.processframe').is(':hidden') | (!$('.processframe').is(':hidden') && confirm("You are already on this page.  Click 'OK' to refresh the diagram.  All unsaved changes will be lost.  Press 'Cancel' to return to editing.")==true))
               {
					//Check if the assistant needs to be saved.
					if(document.getElementById("processdetail").contentWindow.ischanged)
					{
						if(confirm("You have entered information in the assistant that has not been saved.\n\n - Press 'OK' to Continue \n -  'Cancel' to Stay in the Assistant. \n\nPress 'Save' in the menu bar to save your work")==true)
						{
							updateBreadcrumbs(pid,crumbName);
							document.getElementById("processframe").contentWindow.drillDown(pid,null,true);
							mapflag=true;
						}
					}
					else
					{
						updateBreadcrumbs(pid,crumbName);
						document.getElementById("processframe").contentWindow.drillDown(pid,null,true);
						mapflag=true;
					}
					//document.getElementById("processdetaildiv").style.display="none";
					$('.processframe').hide();
				}
              }
              else
              {
             updateBreadcrumbs(pid,crumbName);
 			//document.getElementById("processdetaildiv").style.display="none";
			$('.processframe').hide();
            
			document.getElementById("processframe").contentWindow.drillDown(pid);
			mapflag=true;

              }
    		//alert("2::"+pid+"--"+crumbName+"--"+document.getElementById("processmapdiv").style.display+"--"+document.getElementById("processframe").style.display)
	
             //show map 
            if(mapflag)
            {
				//document.getElementById("processmapdiv").style.display="inline"                
				//document.getElementById("processframe").style.display="inline";
				$('.processframe').show();
			//hide assistant
            //document.getElementById("processdetaildiv").style.display="none";
			//document.getElementById("processdetail").style.display="none";
			$('.processdetail').hide();
			}
			//alert("3::"+pid+"--"+crumbName+"--"+document.getElementById("processmapdiv").style.display+"--"+document.getElementById("processframe").style.display)
			
}

          function updateBreadcrumbs(pid,crumbName)
          {
              //update currentpid which tracks which process we are on.
              currentpid=pid;
              currentud="";
              if(crumbName==null | crumbName=="")
              {crumbName="Crumb"}
              //This function writes the breadcrumbs
              //the present breadcrumbs
             var currentCrumbs=document.getElementById("flobreadcrumbs").innerHTML;
             //The new breadcrumb text
             var newCrumbs=currentCrumbs;

             //check for existing crumb matching id, if so, truncate the list
             //the index of the pid in the currentcrumbs
             var crumbMatch=currentCrumbs.indexOf('id="'+pid+'"'); 
            if(crumbMatch>0)
             {
   
                 //this is the end of the crumb
                var crumbEnd=currentCrumbs.indexOf("</div>",crumbMatch)+6;
             
newCrumbs=currentCrumbs.substring(0,crumbEnd);//reset the crumbs
             }
             else
             {

                //Add a crumb
                var newCrumb='<div id="" class="flocrumb" style="display: block;">:</div><div id="'+pid+'" class="flocrumb" style="display: block;" onclick="crumbAction(this.id,this.innerHTML)">'+unescape(crumbName).toUpperCase()+'</div>';
                
                newCrumbs=currentCrumbs+newCrumb;
                
             }
               //set new breadcrumbs 
$("#flobreadcrumbs").html(newCrumbs);

          }

function saveProcess()
{
	//This function archives the process data from the process record and saves the process image (SVG) and data from the process record
   //It does not operate on the top level
   if(currentpid=="")
   {alert("You cannot save the top level of your process map."); return}
   document.getElementById("processframe").contentWindow.saveProcess();
alert("Process Details Saved");
}

function hideSpider()
{
	//This function hides the spider if the user is not an admin
	userrole=top.nlapiGetContext().getRole();
	//alert("ROLE:"+userrole)
	if(userrole==3 | userrole=="Administrator")
	{
		//alert(false)
		return false
	}
	else
	{
		
                $('button').hide()
		alert("You must be an Administrator to Operate the Spider");
		return true
	}
}

function printProcess(pid)
{
	if(top.location.href.indexOf("&pid="+pid+"&print=t")>0)
	{top.location.href="FLOPrintIndex.html?pid="+pid+"&desctable=t"}
	else
   	{printwindow=window.open("FLOPrintIndex.html?pid="+pid+"&desctable=t","printprocess"+pid);}

   //window.frames["processframe"].focus();
   //window.frames["processframe"].print();
}

function copyProcess(pid)
{
   if(pid==null | pid=="")
   {alert("You cannot copy the top level process"); return}
   else
   {
      var copy=confirm("This will copy all processes and steps shown on the map below.\n - Press 'OK' to Create a Draft Process or 'Cancel' to Create a New Process with Duplicate Steps.");
         document.getElementById("processframe").contentWindow.saveProcess(pid,copy);
      
   }
}

function processEvent(pid)
{
    pe=window.open("/app/crm/calendar/event.nl?l=T&pid="+pid,"activity","width=840,height=620");
    pe.focus();
}

function processTask(pid)
{
  pt=window.open("/app/crm/calendar/task.nl?l=T&pid="+pid,"activity","width=840,height=620");
  pt.focus();
}

function chooseNewProcess(pid)
{
   /*currentpid=pid;
   document.getElementById("processmapdiv").style.display="none";
   document.getElementById("processdetail").style.display="none";
   //showNav2("newprocess");
   showNav2("processframe");*/
   explodedView(currentud)

}

function selectNewProcess(viewtype)
{

  //This function routes the user to the new process assistant or the swim lane based on the icon selected
  if(viewtype=="asst")
  { 

       var nfsrc=document.getElementById("newframe").src;
       alert(currentpid)
       document.getElementById("newframe").src=nfsrc+"&pid="+currentpid;
       showNav2("newframe");
  }
  else
  {
	document.getElementById("newprocesswrap").style.display="none";
	document.getElementById("processframe").contentWindow.createHLPDiag(currentpid,currentud);
     showNav2("processframe");
     
  }
}

function processIssue(pid)
{
   try
   {issueURL=top.nlapiResolveURL('RECORD', 'customrecord_process_issue', null, "EDIT");}
   catch(e){alert(e.message)}
   issuewindow=window.open(issueURL+"&pid="+pid+"&stage="+stage+"&l=T", 'issuepopup','width=400,height=620,resizable=yes,scrollbars=yes');
   issuewindow.focus();
}
function sleep(milliseconds) {
  var start = new Date().getTime();
debugger
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function newProcess(pid)
{

   try{ 
if(sessionStorage.saveFinished && sessionStorage.saveFinished!=1) {
alert('Diagram Saving in progress');
sleep(150000);
debugger
};

       document.getElementById("processframe").contentWindow.saveProcess();}catch(e){}

	$('.processframe').hide();

	asstsrc=top.nlapiResolveURL('SUITELET', 'customscript_process_asst', 1,null);
   //asstsrc=document.getElementById("newframe").src.split("&pid=")[0]+"&pid="+currentpid;
   //asstsrc=asstsrc.replace("&newprocess=T","");
   if(pid==null)
   {pid=""}
   //document.getElementById("processdetail").src=asstsrc+"&pid="+currentpid;
       top.location.href=asstsrc+"&pid="+currentpid;;

   //document.getElementById("newframe").style.display="inline";
   //document.getElementById("processframe").contentWindow.explodedView(currentud);
   	$('.processdetail').show();
}

function delProcessMap(pid)
{
   //This function deletes archives the saved process data from the process record and deletes the process image (SVG) and data from the process record
   //It does not operate on the top level
   if(pid=="")
   {alert("You cannot delete the top level of your process map.   Right click on any individual process box to delete them one at a time."); return}
   //On other levels confirm whether the user wants to delete the process completely or simply clear the saved map.
   var delperm=confirm("THIS WILL DELETE THE PROCESS MAP AND IMAGE ONLY.  To delete the process itself, right click on the process in the parent view.  Click 'OK' to delete the map or 'Cancel' to return without deleting.")
   if(delperm)
   {
       //Check for a map
       if(window.processframe.processJSON!="")
       {
          var fields=["custrecord_flo_current_json","custrecord_flo_process_diag"];
          var vals=["",""];
           //alert(pid);
           //top.contentWindow.nlapiSubmitField("customrecord_flo_process",pid,fields,vals);
//top.nlapiSubmitField("customrecord_flo_process",pid,fields,vals);
           //alert("Process maps are deleted.  Backup copies were stored in the archive on the process record.");
           //refresh the drawing
  
var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
var url=url_servlet+'&id='+pid+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_current_json","multi":"F","values":" "},{"field":"custrecord_flo_process_diag","multi":"F","values":" "}]';

      
      var postdata='';

      console.log(url);

      $.post( url, postdata)
          .done(function( data ) {
           console.log( "diagram deleted");
           document.getElementById("processframe").contentWindow.canvas.clear();
document.getElementById("processframe").contentWindow.createHLPDiag(pid,currentud);
          });


           /*document.getElementById("processframe").contentWindow.canvas.clear();
document.getElementById("processframe").contentWindow.createHLPDiag(pid,currentud);*/

       }
       else
      {alert("There is no saved process map")}
   }

   //if so, copy the process record, inactivate it and make the original the parent
   //clear the saved
}
