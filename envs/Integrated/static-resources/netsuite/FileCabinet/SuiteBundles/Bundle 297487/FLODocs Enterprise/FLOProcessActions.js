 function rowLabel(thisCanvas,text,x,y)
	   {
		      thisLabel=new FLORowLabel(cleanText(text,10));
		      thisLabel.setColor("#FFFFFF");
		      thisLabel.setBackgroundColor("#FFFFFF");
		      thisLabel.setFontColor("#000000");
		      thisLabel.setStroke(0);
             
		      thisCanvas.addFigure(thisLabel,x/2,y);
		      thisLabel.setId("Label::"+cleanText(text,10))
             
		      //thisLabel.installEditor(new draw2d.ui.LabelInplaceEditor());
		      return thisLabel
	    }

var target=""

        function openProcess(id) {
			var purl = top.nlapiResolveURL('RECORD', 'customrecord_flo_process', id);	
			window.open(purl);
		}
	

	
		function drillDown(id,userData,skipSave)
		{

				if(sessionStorage.saveFinished && sessionStorage.saveFinished!=1){
					alert("Data is been saved... please try again");
					return true;
				}

					 if(hlp==true)
					 {
						//check the position on all steps
						//alert("checking steps")
						checkOrder();
						//alert("finished check")
					 }
					 if(id==null | id=="")
					 {
						if(pid!=null && skipSave==null)
						{saveProcess(pid);}
						//clear process bradcrumb cookies
						for(i=1;i<20;i++)
						{
							
							document.cookie = "pid"+i+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
						}
						
						
						canvas.clear();
						//location.reload();
						createHLPDiag("");
						parent.currentpid="";
			            parent.currentud="";
			            return
					 }
					
					 
					 
					 if(skipSave==null)
			         {saveProcess(pid);}
                     if(userData!=null && userData.name==null)
                     {userData=eval(userData)}
                     canvas.clear();
 					 steps=[];
                     pid=id;
                     //alert(id)
                     createHLPDiag(pid,userData);
                     //alert(userData)
	                     //set next crumb in breadcrumb
	                     if(userData!=null && userData!="")
                         {crumb=userData.name;}
                         else
                         {crumb=top.nlapiLookupField("customrecord_flo_process",pid,"name")}

                     parent.updateBreadcrumbs(id,crumb);//update the breadcrumbs in the parent window
                     //window.location.href=window.location.href+"&pid="+id;
					 //set breadcrumb cookie
					 setPidCookie(pid,userData);
                     
                }
        function explodedView(userData)
        {
                   if(sessionStorage.saveFinished && sessionStorage.saveFinished!=1){
					alert("Data is being saved... please try again");
					return true;
				}

                   	//update currentud which tracks the details of the process we are on.
                      parent.currentpid=userData.internalid;
		              parent.currentud=userData;
		           saveProcess();
                   setDetail(userData.internalid,userData);
                   resizeDetail(userData.internalid);
				   	
	
		}

        function setPidCookie(thisid,userData)
        {
	        
	        breadcrumbs=parent.document.getElementById("flobreadcrumbs").innerHTML;
	        idcount=breadcrumbs.split(' id=').length-2;
	        //alert("setting cookie: pid"+idcount);
	        if(userData!=null)
			{setCookie("pid"+idcount,thisid+"::"+userData.name,60);}
			//alert(getCookie("pid"+idcount))

			
		}
		
		function resetProcessDiag()
		{
			//This function retrieves the breadcrumbs when the user reopens FLODocs
			//skip if the pid is not empty
			//alert(pid)
			if(pid!=""){return true}
			//get the breadcrumbs
			pidstring="blank";
			thisid="";
			for(i=2;pidstring!="" && i<4;i++)
			{
				pidstring=getCookie("pid"+i);
			    //alert("Retrieved:"+pidstring)
				if(pidstring!="")
				{
					thisid=pidstring.split("::")[0];
					thisname=pidstring.split("::")[1];
					parent.updateBreadcrumbs(thisid,unescape(thisname))

				}

			}
			if(thisid!="" && thisid!=pid)
			{
				createHLPDiag(thisid);
			}
			return true
		}
		
		function setCookie(cname, cvalue, exdays) {
		    var d = new Date();
		    d.setTime(d.getTime() + (exdays*24*60*60*1000));
		    var expires = "expires="+d.toUTCString();
		    document.cookie = cname + "=" + cvalue + "; " + expires;
		}
		
		function getCookie(cname) {
		    var name = cname + "=";
		    var ca = document.cookie.split(';');
		    for(var i=0; i<ca.length; i++) {
		        var c = ca[i];
		        while (c.charAt(0)==' ') c = c.substring(1);
		        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
		    }
		    return "";
		}




                function cleanTextValue(thisText)
                {
                     if(thisText.indexOf("StartFragment")>=0)
{thisText=thisText.substring(thisText.indexOf(">")+1,thisText.lastIndexOf("<"));}
                if(thisText.indexOf("<")<0)
                {
                //thisText="<div>"+thisText+"</div>";
                }
                     return thisText
                }

		function setDetail(id,userData)
		{

				if(sessionStorage.saveFinished && sessionStorage.saveFinished!=1){
					alert("Data is being saved. Please try again");
					return true;
				}

		  try{
		   //var detsrc=parent.document.getElementById("processdetail").src;
                  var detsrc="/app/site/hosting/scriptlet.nl?script=customscript_process_asst&deploy=1";
		  //xlert(detsrc)
		   if(detsrc.indexOf("pid=")>0)
		   {detsrc=detsrc.substring(0,detsrc.lastIndexOf("&pid="))}
		   detsrc+="&pid="+id;
		   //alert(detsrc)
		  // parent.document.getElementById("processdetail").src=detsrc;

		   top.location.href=detsrc;


		   	if(userData!=null && userData!="undefined")
           {
               crumb=userData.name;//set next crumb in breadcrumb
            }
            else
            {
                crumb="";
            }
           parent.updateBreadcrumbs(id,crumb);//update the breadcrumbs in the parent window
	   }
		   catch(e){}
		}

		var target=""
		var detailOpen=false;

function resizeDetail(id)
{  
			if(sessionStorage.saveFinished && sessionStorage.saveFinished!=1){
					console.log("Data is being saved...  please try again");
					return true;
				}

     //if(target=="")
     {
        //xlert("Target"+target)
        var framewidth=parent.document.getElementById("processmapdiv").width;
        //parent.document.getElementById("processmapdiv").width='0';
        parent.document.getElementById("processmapdiv").style.display='none';
        parent.document.getElementById("processdetail").style.display='inline';
         parent.document.getElementById("processdetaildiv").width=framewidth;
         /*while($("#mapdiv).width>300){$("#mapdiv).width=$("#mapdiv).width-1;$("#detaildiv).width=$("#mapdiv).width+1;}*/
          parent.document.getElementById("processdetaildiv").style.display='inline';
         target=id
     }
/*     else 
   {
        //xlert("Target2"+target)
        target="";
        
        parent.document.getElementById("processmapdiv").width='100%';
parent.document.getElementById("processmapdiv").style.display='inline';       parent.document.getElementById("processdetaildiv").style.display='none';
    }*/
}

function handleResponseAction(response)
{

}


		function normalView(id)
		{
		  try{
		  thisShape=canvas.getFigure(id);
		  thisShape.setDimension(blockwidth,blockheight);
		}
		catch(e){}
		}


		function updateStepNameNum(id,name,newnum,type,checkOrder)
		{
		 //setTimeout(function(){

		   		console.log("USNN id"+id + " name:" + name)
		   //This function updates the step name and number in the UserData when the step name is edited.
		   var currentData=canvas.getFigure(id).getUserData();
		   nnchanged=false;//track if either the name or the number changed
		   if(currentData.name!=name)
		   {
			  	currentData.name=name;
			  //update NS process record
				console.log('Start 3: '+new Date().getTime());	

			  //top.nlapiSubmitField("customrecord_flo_process",id,"name",name);
			  
				var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
				var url=url_servlet+'&id='+id+'&recordtype=customrecord_flo_process&json=[{"field":"name","multi":"F","values":"'+encodeURIComponent(name).replace(/%0A/gi,"%20")+'"}]'
									
				//var a = {"User-Agent-x": "SuiteScript-Call"};
									
				//var req=top.nlapiRequestURL(url, null, null,handleResponseAction);	

				jQuery.ajax({
				  method: "POST",
				  url: url,
				})
				.done(function(msg){
				    console.log("end update");
				})


				console.log('End 3: '+new Date().getTime());

			  nnchanged=true
			}

		    var currNum=currentData.custrecord_flo_number;
		    //console.log(currNum.substring(currNum.lastIndexOf(".")+1)+"--"+newnum)
		    try{

		    if(currNum!=null && currNum.substring(currNum.lastIndexOf(".")+1)!=newnum)
		    {
			      if(currentData.custrecord_flo_process_parent!="" | currentData.custrecord_flo_number.indexOf(".")>0 )
			      {currentData.custrecord_flo_number=currNum.substring(0,currNum.lastIndexOf("."))+"."+newnum;}
			      else
			      {
				    
					currentData.custrecord_flo_number=newnum;
				  }
			      
				  top.nlapiSubmitField("customrecord_flo_process",id,"custrecord_flo_number",currentData.custrecord_flo_number);
				  nnchanged=true;
		    }
		    }catch(e){}

		   if(nnchanged) 
		   {canvas.getFigure(id).setUserData(currentData);}
			
		//},1000);

		}

draw2d.ui.FLOLabelEditor = Class.extend({
    
    /**
     * @constructor
     * Create an label editor with a dedicated callback listener
     * 
     * @private
     */
    init: function(listener){
        
        // register some default listener and override this with the handover one 
        this.listener = $.extend({onCommit:function(){}, onCancel:function(){}},listener);
     },
    
    /**
     * @method
     * Trigger the edit of the label text.
     * 
     * @param {draw2d.shape.basic.Label} label the label to edit
     */
    start: function( label){
        var newText = prompt("Label: ", label.getText());
        if(newText){
            label.setText(cleanText(newText));
            this.listener.onCommit(label.getText());
        }
        else{
            this.listener.onCancel();
        }
    }
    
});






