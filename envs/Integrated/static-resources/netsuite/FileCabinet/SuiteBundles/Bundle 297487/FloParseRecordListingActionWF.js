var rectypes="Start,Online Customer Form,76,CRM Field,25,Entity Field,3,Item Field,26,Other Field,27,Item Option Field,28,Column Field,4,Body Field,5,List,1,Record,2,Item Number Field,29,Entry Form,6,Transaction Form,7,Saved Search,8,Mass Update,9,Custom Record Field,30,Standard Record,24,Standard Field,31,Suitelet,17,RESTlet,22,User Event,21,Scheduled,34,Portlet,18,Client,20,Bundle Installation,35,Workflow Action,19,Workflow,10,Mass Update Script,23,Plug-In Script,33,Map Reduce,61,User Roles,50,Script Deployments,51,Bundle,71,End";
var recnum=0;
var starttime = new Date().getTime();
var maxruntime= 240000; // 4mins

function processFile() {
	
	//FLO Spider Files record
	thisRec = nlapiGetNewRecord();
	
	if (thisRec == null) {
		nlapiLogExecution('ERROR','No Record Retrieved');
		return 'ERROR';
	}
	
	var fileId = thisRec.getFieldValue('custrecord_flo_spiderfile_doc');
	nlapiLogExecution('DEBUG','fileId',fileId);
	
	var custIds = [];
	
	if (fileId != null && fileId != '') {
		//load file
		var f = nlapiLoadFile(fileId); 
		if (f) 
		{ 
			try{
				var fileContent=f.getValue();
				//parse JSON
				var fileJson=JSON.parse(fileContent);
			}catch(e){
				var fileJson={};
				fileJson.lines=[];
			}
			
			//traverse each line and create cust
			try {
				for (var i = 0; i < fileJson.lines.length; i++) {
					if (new Date().getTime() - starttime > maxruntime) {
						nlapiLogExecution('ERROR', 'Spider File parse not finished', 'Script Running more than 4mins');
						return "ERROR";
					}
					
					if (nlapiGetContext().getRemainingUsage() < 100) {
						nlapiLogExecution('ERROR', 'Spider File parse not finished', 'Script Resource Usage Limit');
						return "ERROR";
					}
					var id=createCustomization(fileJson.lines[i]);
					if (id != null && id != '')
						custIds.push(id);
				}
			} catch(e) {
			
				nlapiLogExecution('ERROR','Error Processing. Workflow will not proceed', e);
				return "ERROR";
			}
		}

	} else {
		nlapiLogExecution('ERROR','No File ID', thisRec.getId());
	}
	
	//return/save FLO customization IDs
	if (custIds.length > 0)
		custIds=custIds.join();
	else
		custIds='EMPTY';
	
	nlapiLogExecution('debug','custIds',custIds);
	return custIds;
}

function createCustomization(line) {

	//check if record exists
		//if record exists, update record
		//else create record
		
	//var rectypes="Start,CRM Field,25,Entity Field,3,Item Field,26,Other Field,27,Item Option Field,28,Column Field,4,Body Field,5,List,1,Record,2,Item Number Field,29,Entry Form,6,Transaction Form,7,Saved Search,8,Mass Update,9,Custom Record Field,30,Standard Record,24,Standard Field,31,Suitelet,17,RESTlet,22,User Event,21,Scheduled,34,Portlet,18,Client,20,Bundle Installation,35,Workflow Action,19,Workflow,10,Mass Update Script,23,Plug-In Script,33,End";

    nlapiLogExecution("debug","createCust START",new Date().getTime())

    customization=line.customizationstring;

    rectype=line.rectype;

    var myJsoninternal_id=line.Internal_Id;

    try{ 
      var rectypeAux=line.rectypeNumAux;
    }catch(e){
      var rectypeAux=null;
    }

    supdate=line.update;
    
    namefilter=line.namefilter;

    nlapiLogExecution('DEBUG', 'rectypeAux', line.rectypeAux);

    update="F";

    //nlapiLogExecution("DEBUG","customization",customization);

      if(supdate!=null){update="T"};//initializes update variable for server-side operations.

       custpairs=customization.split(",");

       custparams=[];
       for(c=0;custpairs[c]!=null && c<custpairs.length && c<6000;c++)
       {

           custdata=custpairs[c].split(":");
           var label=custdata[0];
           label=label.replace('&nbsp;'," ");
           ////alert("#"+label.charAt(label.length-1)+"#")
           if(label.charAt(label.length-1)==" ")
           {label=label.substring(0,label.length-1)}
           ////alert("#"+label+"#")
           custparams[label]=custdata[1]; 
           for(cd=2;custdata[cd]!=null;cd++)
           {custparams[label]+=":"+custdata[cd];}
           //nlapiLogExecution('debug', 'For End Custdata',cd);
       }
       //nlapiLogExecution('debug', 'For End Cust Pairs ',c);  

       var nId=parseFloat(custparams.Internal_Id);
       

        nlapiLogExecution("DEBUG","nId",nId);


       if(isNaN(nId)){custparams.Internal_Id=custparams.Internal_ID;}else{custparams.Internal_Id=nId}

       if(isNaN(parseFloat(custparams.Internal_Id))){
          custparams.Internal_Id=myJsoninternal_id;
       }

        nlapiLogExecution("DEBUG","nId",custparams.Internal_Id);

       if(rectype!='Custom Record Field'){custparams.Internal_ID=custparams.Internal_Id;}

        nlapiLogExecution("DEBUG","nId",custparams.Internal_ID);

       if(custpairs.length<=0){
        nlapiLogExecution("Audit","CUSTOMIZATION STRING EMPTY",line.customizationstring);
        return;
       }

      //nlapiLogExecution("DEBUG","id3",custparams.Internal_Id);
      //get description to be inserted into Name

      var description=custparams.Description;
      if(rectype=="Mass Update")
      {description=custparams.Title_of_Action;}
      if(rectype=="List")
      {description=custparams.List;}
      if(rectype=="Record")
      {description=custparams.Edit;}
      if(rectype == "Online Customer Form" | rectype=="Entry Form" | rectype=="Transaction Form" | rectype=="Saved Search" | rectype=="Workflow" | rectype=="Suitelet" | rectype=="User Event" | rectype=="Client" | rectype=="Scheduled" | rectype=="Bundle Installation" | rectype=="RESTlet" | rectype=="Portlet" | rectype=="Workflow Action" | rectype=="Mass Update Script" | rectype=="Plug-In Script" | rectype=="User Roles" | rectype=="Map Reduce" | rectype=="Bundle")
      {
         //docWrite("setting name to Name")
         description=custparams.Name;
      }
      if(rectype=="Script Deployments")
      {
         description=custparams.Script + " (Deployment)"; 
      }

      if(rectype == "Workflow") {
          try {

              var wfrecordXML=nlapiStringToXML(line.custrecord_flo_cust_page_xml);  
              custparams.ID=nlapiSelectValue(wfrecordXML,'/nsResponse/record[1]/scriptid');
          } catch(e) {

          }
      }

      if(description==null | description=="")
      {description = getCustLabel(line.custrecord_flo_cust_page_xml,rectype)}
   
       //Check name filter
       if(namefilter!=null && namefilter!="")
       {
           namestring=namefilter.replace("%","");
           docWrite(namefilter+"--"+namestring+"--"+description+"--"+description.indexOf(namestring)+"<br>");
           if(namefilter.indexOf("%")==0)
           {
               if(description.indexOf(namestring)<0)
               {return}
           }
           else if(description.indexOf(namefilter)!=0)
           {return}
           
       }
      
        if(typeof custparams.florecordid!="undefined" && custparams.florecordid!=null && custparams.florecordid!="")
        {
            //nlapiLogExecution('DEBUG', 'florecordid', florecordid);
            custrec=nlapiLoadRecord("customrecord_flo_customization",custparams.florecordid);

        }else{

          if(rectypeAux==null){     
                  
                  try{
                    rectypeAux=rectypes.toLowerCase().split(","+rectype.toLowerCase()+",")[1].split(",")[0];
                  }catch(e){
                       nlapiLogExecution("debug","lowercase 1",e);
                       return;
                  }
          }

           var recid=checkCust(custparams.ID,rectype,description,custparams.Internal_ID,rectypeAux,line.custrecord_flo_cust_page_xml);
             
           if(recid=="")
           {
               try{
                custrec=nlapiCreateRecord("customrecord_flo_customization");
                //DON'T CREATE LOGS IN MAKE JOIN IF NEW CUSTRECORD IS CREATED IN MAKE JOIN
                custrec.setFieldValue("custrecord_flo_custxml_set",'T');
               }catch(e){
                 return;
               }
           }else{
                nlapiLogExecution('DEBUG', 'ENTRE', recid);
                try{ 
                  custrec=nlapiLoadRecord("customrecord_flo_customization",recid);
                  //REMOVE INACTIVE REFERENCES FROM THE CUSTOMIZATION RECORD
                  custrec = cleanupInactiveReferences(custrec);
                  //DON'T CREATE LOGS IN MAKE JOIN IF XML IS PREVIOUSLY SET TO AVOID DUPLICATE LOGS
                  var xmldef = custrec.getFieldValue('custrecord_flo_cust_page_xml');
                  var custName = custrec.getFieldValue('name');
                  if(xmldef || (custName && custName.indexOf('prototype customization') == 0)){
                    custrec.setFieldValue("custrecord_flo_custxml_set",'T');
                  }
                }catch(e){
                  nlapiLogExecution('DEBUG', 'ENTRE', e);
                  return;
                }
           }
       }


      if(rectypeAux!=null){          
            custrec.setFieldValue("custrecord_flo_cust_type",rectypeAux);
      }else{

       try{
          var rectypeNum=rectypes.toLowerCase().split(","+rectype.toLowerCase()+",")[1].split(",")[0];
          custrec.setFieldValue("custrecord_flo_cust_type",rectypeNum)
        }catch(e){
           if(rectypeAux!=null){          
            custrec.setFieldValue("custrecord_flo_cust_type",rectypeAux);
           }
            nlapiLogExecution("debug","lowercase debug 2 ",e);
        }

      }

       custrec.setFieldValue("name",description)


       if(typeof custparams.Internal_ID=='undefined' && typeof custparams.internal_id!='undefined'){
              custparams.Internal_ID=custparams.internal_id;
        }

       try{
		   if(custparams.Internal_ID!=null) 
       {
		  	 custrec.setFieldValue("custrecord_flo_int_id",custparams.Internal_ID);
		   }
	   
	   } catch(e){ 
	   		nlapiLogExecution("debug","intid: "+custparams.Internal_ID+","+e); 
		}
	
		if(typeof custparams.ID  !="undefined" && custparams.ID != null && custparams.ID.trim() != '' && custparams.ID.trim() != 'undefined') {
     	  custrec.setFieldValue("custrecord_flo_cust_id",custparams.ID);
		}  else if(rectype == "User Roles" && line.custrecord_flo_cust_page_xml) { //Get Script ID from XML for User Role
    //++ NS-621 
    
        try {
             var xmlobj = nlapiStringToXML(line.custrecord_flo_cust_page_xml);
             ID = nlapiSelectValue(xmlobj, '/nsResponse/record[1]/scriptid') || null;
         } catch(e) {

         }
    }
    //-- NS-621
    
       if (custparams.Type) {
          custrec.setFieldValue("custrecord_flo_data_type",custparams.Type);
       } 
       
       custrec.setFieldValue('custrecord_flo_make_join_proc','F');
       custrec.setFieldValue("custrecord_flo_cust_in_use","T");
       custrec.setFieldValue("isinactive","F");
       custrec.setFieldValue("custrecord_flo_autospider_found","F")

       
       nlapiLogExecution("debug","createCust mid",new Date().getTime())

       //description - not available on all records
       if(custparams.Description!=null && custparams.Description!="" && custrec.getFieldValue("custrecord_flo_description")=="")
       {
        //docWrite("Setting Description<br><br>");
        custrec.setFieldValue("custrecord_flo_description",custparams.Description);
       } else {
		   //custrec.setFieldValue("custrecord_flo_description","");
	   }
  
       //owner - not available on all records
       if(custparams.Owner!=null && custparams.Owner!="")
       {
      
          myName=custparams.Owner;

          if(custparams.Owner.indexOf("-")!=-1){
              var myName=reverseName(custparams.Owner);
           }

            owner=getEmpId(myName);

            //owner
            if(owner!="" && owner!=null)
            {custrec.setFieldValue("owner",owner);}


            if(typeof owner =="undefined" || owner==null || owner=="" || owner==" "){
              try{var tempXML=nlapiStringToXML(line.custrecord_flo_cust_page_xml);  
              var node=nlapiSelectNodes(tempXML,'//owner');
              var owner=nlapiSelectValue(node, '//owner')
              }catch(e){
                //nlapiLogExecution("debug","owner xml debug",e);
              }
              //nlapiLogExecution("DEBUG","owner xml",owner);
            }

          if(owner!="" && owner!=null)
          {
            custrec.setFieldValue("owner",owner);
          }
        }
       //last run date and person for searches
       if(typeof custparams.Last_Run_On!='undefined' && custparams.Last_Run_On!=null && custparams.Last_Run_On!="" && custparams.Last_Run_On!="undefined" && custparams.Last_Run_On!=" ")
       {

          //++ NS-640
          try {
            var thisLRO = nlapiDateToString(new Date(parseInt(custparams.Last_Run_On)));
            nlapiLogExecution("DEBUG", "thisLRO", thisLRO);
            if (thisLRO) {
              custrec.setFieldValue("custrecord_flo_dls", thisLRO);
            }
          } catch (eLRO) {
            nlapiLogExecution("DEBUG", "eLRO", eLRO);
          }
          /*
            var myDate=custparams.Last_Run_On.split(" ")[0].trim();

            try{

                 if(typeof myDate!="undefined" && myDate!=""){ custrec.setFieldValue("custrecord_flo_dls",myDate); }

             }catch(e){
                            

              if(typeof myDate!="undefined" && myDate!=""){
                  day=myDate.split("/")[1];
                  month=myDate.split("/")[0];
                  year=myDate.split("/")[2];
                  myDate=day+"/"+month+"/"+year;
                  try{custrec.setFieldValue("custrecord_flo_dls",myDate);}catch(e){
                    nlapiLogExecution('debug', 'DLS debug', e);
                  }
              }

            }
            */
          //-- NS-640

        }

        if(typeof custparams.Last_Run_By!='undefined' && custparams.Last_Run_By!=null && custparams.Last_Run_By!="" && custparams.Last_Run_By!="undefined")
        {
           var runby=custrec.getFieldValue("custrecord_flo_employees_cust")+"";
           if(runby!="" && runby!=null && runby!="null"){var runnames=runby.split(",");}else{runnames=[];}

           var myName=custparams.Last_Run_By;

           if(custparams.Last_Run_By.indexOf("-")!=-1){
              myName=reverseName(custparams.Last_Run_By);
           }

           var empid=getEmpId(myName);

           if(runnames==null | runnames.length==0 | runnames.indexOf(empid)<0)
           {
               runnames.push(empid);
               custrec.setFieldValues("custrecord_flo_employees_cust",runnames);
           }
        }
        //script file
        if(custparams.Script!=null && !isNaN(custparams.Script))
        {custrec.setFieldValue("custrecord_flo_script_file",custparams.Script)}

        //library script file
        if(custparams.Library_Script!=null && !isNaN(custparams.Library_Script)){custrec.setFieldValue("custrecord_flo_lib_script",custparams.Library_Script)}
        
        if(typeof line.custrecord_flo_cust_page_xml !="undefined" && line.custrecord_flo_cust_page_xml!=null){
            nlapiLogExecution('DEBUG', 'custrecord_flo_cust_page_xml '+custrec.getId(), line.custrecord_flo_cust_page_xml);
            custrec.setFieldValue("custrecord_flo_cust_page_xml",line.custrecord_flo_cust_page_xml.substring(0,999999));
        }else{
            nlapiLogExecution('DEBUG', 'no custrecord_flo_cust_page_xml '+custrec.getId(), line.custrecord_flo_cust_page_xml);
            custrec.setFieldValue("custrecord_flo_cust_page_xml","Locked Object");
        }
       
       //List or Multiple Select get the id
       if(custparams.List!=null && custparams.List!=" " && custparams.List!="&nbsp;" && rectype>2)
       {
        custrec.setFieldValue("custrecord_flo_list_data",line.custrecord_flo_list_data);
        
       }

      if(typeof custparams.From_Bundle !="undefined" && custparams.From_Bundle!=null){
         custrec.setFieldValue("custrecord_flo_bundle",custparams.From_Bundle);
       }

       custrec.setFieldValue("custrecord_flo_customization",customization);    

       nlapiLogExecution('DEBUG', 'rectype', rectype);

       nlapiLogExecution('DEBUG', 'rectype', line.custrecord_flo_cust_page_xml);

      if(rectype=="Bundle") {
          custrec.setFieldValue("custrecord_flo_cust_id",custparams.Bundle_ID);
          var ismanaged=custparams.Managed;
          if(ismanaged == "Yes") {
            custrec.setFieldValue("custrecord_flo_manage_bundle","T");
          } else {
            custrec.setFieldValue("custrecord_flo_manage_bundle","F");
          }
          custrec.setFieldValue("custrecord_flo_description",custparams.Abstract);
          if(custparams.Installed_By) {
            var bundleowner=getEmpId(custparams.Installed_By);
            if(bundleowner!="" && bundleowner!=null) {
                custrec.setFieldValue("owner",bundleowner);
              }
          }
          var lastbundleupdate = custparams.Last_Update;
          if(lastbundleupdate){
            try {
              custrec.setFieldValue("custrecord_flo_bundle_update_date",nlapiDateToString(nlapiStringToDate(lastbundleupdate, 'datetimetz'), 'datetimetz'));
            } catch(e){
              nlapiLogExecution('DEBUG', 'e lastbundleupdate', e);
            }
          } 
           
        }
      
      if((rectype==10 || rectype=="Workflow") && line.custrecord_flo_cust_page_xml!=null && line.custrecord_flo_cust_page_xml!="")
      {
          nlapiLogExecution('DEBUG', 'WF', line.custrecord_flo_cust_page_xml);
          custrec=parseWorkFlowXML(line.custrecord_flo_cust_page_xml,line.custrecord_flo_cust_page_xml_actions,custrec);
      }

      // if(rectype != null && rectype.indexOf("Form") != -1 && line.custrecord_flo_cust_page_xml!=null && line.custrecord_flo_cust_page_xml!="") {
      //     custrec=parseFormXML(line.custrecord_flo_cust_page_xml,custrec);
      // }

      //Online Customer Form is 76
      if(rectype != null && rectype.indexOf("Form") != -1 && custrec.getFieldValue("custrecord_flo_cust_type") != 76 && line.custrecord_flo_cust_page_xml!=null && line.custrecord_flo_cust_page_xml!="") {
          //Online Customer Form type is processed in separate WF
          custrec=parseFormXML(line.custrecord_flo_cust_page_xml,custrec);
      }

      if(rectypeNum==51 && line.custrecord_flo_cust_page_xml!=null && line.custrecord_flo_cust_page_xml!="")
      {
          //custrec=parseDeploymentXML(line.custrecord_flo_cust_page_xml,custrec);
      } 

      nlapiLogExecution("debug","createCust mid2",new Date().getTime())

      try
      {
            docWrite("submitting"+custrec.getFieldValue("name")+"#"+custrec.getFieldValue("custrecord_flo_int_id"))
            
            nlapiLogExecution('debug', 'submitting', custrec.getFieldValue("name"));
            nlapiLogExecution('debug', 'submitting', custrec.getFieldValue("custrecord_flo_int_id"));
            nlapiLogExecution('debug', 'submitting', custrec.getId());

            //Respidering now flag
            custrec.setFieldValue("custrecord_flo_respidering","T");
            newrecid=nlapiSubmitRecord(custrec);
            var crid = nlapiGetNewRecord().getFieldValue("custrecord_flo_cr_trigger");
            if(crid && crid != 0) {
                var crrec = nlapiLoadRecord('customrecord_flo_change_request',crid); 
                var olcusts = crrec.getFieldValues('custrecord_flo_cust_change') || ''; 
                var newcusts = []; 
                
                if(olcusts && olcusts != '') { 
                  if(olcusts instanceof Array) { olcusts = olcusts.join(',')}
                  newcusts = olcusts.split(',');
                } 

                if(newcusts.indexOf(newrecid) == -1) {
                    newcusts.push(newrecid);
                    crrec.setFieldValues('custrecord_flo_cust_change',newcusts);
                    nlapiSubmitRecord(crrec);
                }
            }
           //var workflowid =  nlapiInitiateWorkflowAsync('customrecord_flo_customization', newrecid, 'customworkflow_flo_create_change_log_sn')
          // nlapiLogExecution('debug', 'workflowid', workflowid);
            nlapiLogExecution("debug","createCust mid3",new Date().getTime())

      }
      catch(e)
      {
               nlapiLogExecution('debug', 'WF10', e);

               if(typeof e !='undefined' && e!=null && typeof e.message!='undefined' && e.message!=null && e.message.indexOf("Invalid owner reference")>=0)
               {
                     custrec.setFieldValue("owner",getDefaultUser());
                     try{
                      newrecid=nlapiSubmitRecord(custrec);
                    }catch(e){
                       //nlapiLogExecution('debug', 'WF11', e);
                    }
                }
                else if(typeof e !='undefined' && e!=null && typeof e.message!='undefined' && e.message!=null && e.message.indexOf("custrecord_flo_searches")>=0)
                {
                          nlapiLogExecution('debug', 'WF13', e);

                          custrec.setFieldValues('custrecord_flo_searches',null);

                        try{
                          newrecid=nlapiSubmitRecord(custrec);
                        }catch(e){
                          //nlapiLogExecution('debug', 'WF12', e);
                        }

                }
                else if(typeof e !='undefined' && e!=null && typeof e.message!='undefined' && e.message!=null && e.message.indexOf("Name")>=0)
                {
                          nlapiLogExecution('debug', 'WF14', e);

                        custrec.setFieldValues('name',"Deployment");

                        try{
                          newrecid=nlapiSubmitRecord(custrec);
                        }catch(e){
                          //nlapiLogExecution('debug', 'WF15', e);
                        }

                }
      }

      //custrec==null;
      

      nlapiLogExecution("debug","createCust end",new Date().getTime())


      if(typeof newrecid != "undefined" && newrecid!=null && newrecid!="")
      {
        return newrecid
      }
      else
      { 
        nlapiLogExecution('debug', 'Submitdebug', custrec.getFieldValue("custrecord_flo_cust_id"));
        return "" 
      }
	
	//return customization ID
}



function checkCust(ID,rectype,name,intid,recnumaux, custxml)
{
     var filters=[];

      nlapiLogExecution("debug","recnumaux start",new Date().getTime());
      nlapiLogExecution("debug","recnumaux start",recnumaux);
      nlapiLogExecution("debug","recnumaux name",name);



      if(typeof recnumaux !="undefined" && recnumaux!=null)
      {
        newrecnum=recnumaux;
      
      }else{

        try{
            newrecnum=rectypes.toLowerCase().split(","+rectype.toLowerCase()+",")[1].split(",")[0];
         }catch(e){
            newrecnum=[];//nlapiLogExecution('debug', 'LowerCase CheckCust', e);
         }
      
      }

      //++ NS-621
      if((newrecnum == 50 || newrecnum == 10) && custxml) { //Get Script ID from XML for User Role or Workflow
        try {
             var xmlobj = nlapiStringToXML(custxml);
             ID = nlapiSelectValue(xmlobj, '/nsResponse/record[1]/scriptid') || null;
         } catch(e) {

         }
      }
      //-- NS-621
    
     var searchlist="";
     var deploymentScript = null;
     if(searchlist=="" | newrecnum==null | recnum!=newrecnum)
     {

		  recnum=newrecnum;
		  searchlist="";
	
		  nlapiLogExecution("DEBUG","recnumaux:nerecum:recnum",searchlist.length+":"+ID+":"+recnum)

      //FIND BY SCRIPT ID
     
      if(typeof ID !="undefined" && ID!=null && ID!="") {
        custSearch=nlapiLoadSearch("customrecord_flo_customization",'customsearch_flo_cust_search');
        custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof",recnum));
        custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_id",null,"contains",ID));
        if(recnum == 51 && custxml) {
           try {
               var deploymentXML = nlapiStringToXML(custxml);
               deploymentScript = nlapiSelectValue(deploymentXML, './/script');
               nlapiLogExecution("DEBUG", "deploymentScript", ID + ":" + deploymentScript)
               custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_int_id", "custrecord_flo_script_deployment", "equalto", deploymentScript));
           } catch(e) {

           }
        }
        custResults=custSearch.runSearch();
        custs=custResults.getResults(0,999);
        if(custs && custs.length > 0) {
          searchlist=custs.slice(0);
           cp=0;
           while(custs.length>=999 && cp<30)
           {
    
           start=(cp+1)*1000;
           custs=custResults.getResults(start,(start+999))
           if(custs!=null)
           {
          
            for(c=0;c<custs.length && custs[c]!=null;c++)
            {searchlist.push(custs[c])}
           }
            cp++;
          }
        }
      }

      //FIND BY INTERNAL ID
      if(intid!=null && intid!="") {
        custSearch=nlapiLoadSearch("customrecord_flo_customization",'customsearch_flo_cust_search');
        custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof",recnum));
        custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_int_id",null,"equalto",intid));
        custResults=custSearch.runSearch();
        custs=custResults.getResults(0,999);
        if(custs && custs.length > 0) {
          searchlist=custs.slice(0);
           cp=0;
           while(custs.length>=999 && cp<30)
           {
    
           start=(cp+1)*1000;
           custs=custResults.getResults(start,(start+999))
           if(custs!=null)
           {
          
            for(c=0;c<custs.length && custs[c]!=null;c++)
            {searchlist.push(custs[c])}
           }
            cp++;
          }
        }
      }

      }// End of blank searchlist
      
       //alert(searchlist.length);
       recid="";

       //Check by scriptid or, if there is no script id, by name
       for(r=0;searchlist!=null && searchlist[r]!=null && r<searchlist.length ;r++)
       {

          columns=searchlist[r].getAllColumns();

           //nlapiLogExecution("debug","recnumaux  searchlist[r].getValue(columns[0])", searchlist[r].getValue(columns[0]));

           //  nlapiLogExecution("debug","recnumaux  ID", ID);

          if(ID && ID===searchlist[r].getValue(columns[5])) {
              nlapiLogExecution("DEBUG","matched scriptid",searchlist[r].getValue(columns[5]))

              if(recnum!=51 || deploymentScript)
              {      
                nlapiLogExecution("debug","checkCust end",new Date().getTime())
                return searchlist[r].getId()
              }



          }
		      
          if(intid!=null && intid!="" && columns[4]!=null) {
         	//if no record is located by matching the  scriptid, match on the basis of the internalid.
      			 docWrite(intid+"--"+searchlist[r].getValue(columns[4]));
      			 if(intid==searchlist[r].getValue(columns[4]))
      			 {
      				nlapiLogExecution("DEBUG","matched intid")
      	
      				nlapiLogExecution("debug","checkCust end",new Date().getTime())
      	
      				return searchlist[r].getId()
      			 }
          }
         //nlapiLogExecution('debug', 'For End SearchList ','');  
       }
//116


     return ""
}

function docWrite(text)
{
  nlapiLogExecution("DEBUG","docWrite",text);
}

function reverseName(str){
    var str=str.replace('-',',');
    return str;
}

function getEmpId(name)
{
    emplist="";
    if(emplist=="")
    {
      //load a list of employees
        var empfilts=[];
        empfilts[0]=new nlobjSearchFilter('isinactive',null,'is','F');
        empfilts[1]=new nlobjSearchFilter('entityid',null,'is',name);


        var empcols=[];
        empcols[0]=new nlobjSearchColumn("entityid");

        try{
          emplist=nlapiSearchRecord("employee",null,empfilts,empcols);
        }catch(e){

          var empfilts=[];
          empfilts[0]=new nlobjSearchFilter('isinactive',null,'is','F');
          emplist=nlapiSearchRecord("employee",null,empfilts,empcols);
        }
    }
    for(e=0;emplist!=null && emplist[e]!=null && e<emplist.length; e++)
    {
         cols=emplist[e].getAllColumns();
         if(emplist[e].getValue(cols[0]) == name)
         {
               return emplist[e].getId();
         }
    }
    //nlapiLogExecution('debug', 'For End emp list 2','');  
    return ""
}

function parseWorkFlowXML(custxml,xmlactions,custrec)
{

try{


var parentsArray=[];

parentsArray['supportcase']='Case';
parentsArray['creditmemo']='Sale';
parentsArray['salesorder']='Sale';
parentsArray['purchaseorder']='Purchase';
parentsArray['revenuecommitment']='Sale';
parentsArray['estimate']='Sale';
parentsArray['job']='Project';
parentsArray['invoice']='Sale';
parentsArray['vendorbill']='Purchase';

  var recordXML=nlapiStringToXML(custxml); 
  
  var scriptid=nlapiSelectValue(recordXML,'.//scriptid');

  var parent=nlapiSelectValue(recordXML,'.//recordtypes');
  
  var triggerformulaGloblal=nlapiSelectValue(recordXML,'.//initsavedsearchcondition') || '';

  var initConditionText=nlapiSelectValue(recordXML,'.//initconditiontext') || '';


  if (triggerformulaGloblal!=null && triggerformulaGloblal!="") triggerformulaGloblal="Saved Search";

  var triggertypeArr=[]//nlapiSelectValue(recordXML,'.//triggertype');



  var triggertype=nlapiSelectValue(recordXML,'.//inittriggertype');

  var triggeronschedule=nlapiSelectValue(recordXML,'.//schedulefrequency');

  var initonschedule=nlapiSelectValue(recordXML,'.//initonschedule');
  //var triggeronupdate=nlapiSelectValue(recordXML,'.//triggeronupdate');

  //if(triggeroncreate!=null && triggeroncreate!='F'){
  //  triggertypeArr.push(triggeroncreate)
  /*}

  if(triggeronupdate!=null && triggeronupdate!='F'){
    triggertypeArr.push("On Update")
  }

  if(triggeronschedule!=null && triggeronschedule!='F'){
    triggertypeArr.push("On Schedule")
  }*/

  //if(triggertypeArr.length>0) triggertype=triggertypeArr.join(",");
  if(triggertype==null || triggertype=="") { triggertype="- ALL -"}

  //var savedsearch=nlapiSelectValue(recordXML,'.//initsavedsearchcondition');
  
  var fieldNodes=nlapiSelectNodes(recordXML,'.//line');

  var tranNodes=nlapiSelectNodes(recordXML,'.//line');

  var custrecord_flo_wf_conditions="";

  var custrecord_flo_workflow_field="";

  var custrecord_flo_workflow_field_raw="";

  var custrecord_flo_workflow_script_raw="";


  var j=0;

  var myActions=[];

  var myStatesActions=[];

  var actionsName="";
  var satesName="";
  var actionsObj = {};

  for(f=j;fieldNodes[f]!=null;f++)
  {

        var  actionname=nlapiSelectValue(fieldNodes[f],'actionname') || "";

        //var  actionname=nlapiSelectValue(fieldNodes[f],'actionname');

        var  statename=nlapiSelectValue(fieldNodes[f],'name') || "";

        var  stateid=nlapiSelectValue(fieldNodes[f],'stateid')

        nlapiLogExecution('DEBUG', 'statename', statename);

        nlapiLogExecution('DEBUG', 'actionname', actionname);


      if ((statename==null || statename=="") && (actionname==null || actionname=="")) continue;
      //if (actionname==null || actionname=="") continue;

        if(actionsName!="") actionsName+="\n"
        if(satesName!="") satesName+="\n"

        actionsName+="\nState:"+statename+"\n"+actionname;
        satesName+=statename;

        myStatesActions[stateid]=statename;

        var tempobj = {};
        tempobj.name=statename;
        tempobj.actions = [];
        tempobj.transitions = [];
        actionsObj[stateid] = tempobj;
  }

  
   var conditionsavedsearchids = [];
   var actionScriptId = [];
   var initiatedWorfklows = [];
   var createRecords = [];
  for(ff=0;tranNodes[ff]!=null;ff++)
  {

        var  transitionname=nlapiSelectValue(tranNodes[ff],'transitionname') || "";
		var conditionsavedsearch=nlapiSelectValue(tranNodes[ff],'conditionsavedsearch') || '';
		nlapiLogExecution('DEBUG', 'conditionsavedsearch', conditionsavedsearch);
		if(conditionsavedsearch && conditionsavedsearchids.indexOf(conditionsavedsearch) == -1) {
		   conditionsavedsearchids.push(conditionsavedsearch);
		}
        if(transitionname!=null && transitionname!=""){
            if(custrecord_flo_wf_conditions!=""){
               custrecord_flo_wf_conditions+="\n"
            }else{
               custrecord_flo_wf_conditions+="\n";
            } 
            custrecord_flo_wf_conditions+=transitionname;
        }
    var fromstate = nlapiSelectValue(tranNodes[ff],'fromstate') || "";
    var tostate = nlapiSelectValue(tranNodes[ff],'tostate') || "";

    if(actionsObj && fromstate && actionsObj[fromstate] && tostate && actionsObj[tostate]) {
        var tostatename  = actionsObj[tostate].name;
        actionsObj[fromstate].transitions.push(tostatename);

    }

  }

  nlapiLogExecution('DEBUG', 'WF4',scriptid);
  nlapiLogExecution('DEBUG', 'WF4', custrecord_flo_wf_conditions);


//nlapiLogExecution('DEBUG', 'WF4', xmlactions.length);
  
for (var i = 0; xmlactions[i] != null; i++) {
 
  //var recordXMLActions=nlapiStringToXML(xmlactions[i].custrecord_flo_cust_page_xml); 

  //var fieldNodesActions=nlapiSelectNodes(recordXMLActions,'.//line');

      //or(f=0;fieldNodesActions[f]!=null;f++)
      var groupactions = null;
      for (var ii = 0; ii < xmlactions[i].actions.length; ii++)
      {

        try {
          var recordXMLActions=nlapiStringToXML(xmlactions[i].actions[ii].custrecord_flo_cust_page_xml); 

          nlapiLogExecution('DEBUG', 'WF5', xmlactions[i].actions[ii].custrecord_flo_cust_page_xml);

          var recordXMLActions=nlapiStringToXML(xmlactions[i].actions[ii].custrecord_flo_cust_page_xml); 

          //var myfield=nlapiSelectValue(fieldNodesActions[f],'field');

          //var mytriggercondition=nlapiSelectValue(fieldNodesActions[f],'triggercondition');
    		  // SENDEMAIL, SENDCAMPAIGNEMAIL
    		  var attachmentjoinfield=nlapiSelectValue(recordXMLActions,'.//attachmentjoinfield') || "";
          var attachmentfield=nlapiSelectValue(recordXMLActions,'.//attachmentfield') || "";
    		  var recipientjoinfield=nlapiSelectValue(recordXMLActions,'.//recipientjoinfield') || "";
    		  var recipientfield=nlapiSelectValue(recordXMLActions,'.//recipientfield') || "";
          var senderfield=nlapiSelectValue(recordXMLActions,'.//senderfield') || "";

    		  // GOTORECORD
    		  var recordidjoinfield=nlapiSelectValue(recordXMLActions,'.//recordidjoinfield') || "";
          var recordidfield=nlapiSelectValue(recordXMLActions,'.//recordidfield') || "";

    		  // SUBSCRIBETORECORD
    		  var recordfield=nlapiSelectValue(recordXMLActions,'.//recordfield') || ""; 

    		  // CREATERECORD, TRANSFORMRECORD, GOTORECORD
    		  var targetfields=nlapiSelectNodes(recordXMLActions,'.//targetfield') || [];

          var mytriggercondition=nlapiSelectValue(recordXMLActions,'.//conditiontext') || "";

          var valueformula=nlapiSelectValue(recordXMLActions,'.//valueformula') || "";

          var conditionformula=nlapiSelectValue(recordXMLActions,'.//conditionformula') || "";

          var actiontype=nlapiSelectValue(recordXMLActions,'.//actiontype') || "";

          var myfield=nlapiSelectValue(recordXMLActions,'.//field') || "";

          var myvaluefield=nlapiSelectValue(recordXMLActions,'.//valuefield') || "";

          var stateid=nlapiSelectValue(recordXMLActions,'.//name') || "" ;

          var stateidAUX=nlapiSelectValue(recordXMLActions,'.//stateid') || "";

          var arguments=nlapiSelectValue(recordXMLActions,'.//arguments') || "";  

          var actionstate = nlapiSelectValue(recordXMLActions,'.//state') || ""; 

          var actiontypename = nlapiSelectValue(recordXMLActions,'.//actiontypename') || ""; 

          var triggertype = nlapiSelectValue(recordXMLActions,'.//triggertype') || ""; 

          var aid = nlapiSelectValue(recordXMLActions,'.//id') || ""; 

          if(actionstate && actiontypename && actionsObj && actionsObj[actionstate]) {
           
            var actionameandtriggertype = actiontypename
            if(triggertype) {
              actionameandtriggertype += " ("+triggertype+")"
            }

            if(groupactions != null) {
                //nlapiLogExecution('AUDIT', 'groupactions '+aid, JSON.stringify(groupactions));
                if(groupactions.actionids && groupactions.actionids.indexOf(aid) != -1) {
                     var actionindex = groupactions.actionids.indexOf(aid);
                     if(groupactions.displaytext != "") { groupactions.displaytext += ", "}
                     groupactions.displaytext += actionameandtriggertype;
                     groupactions.actionids.splice(actionindex,1);
                }

                if(groupactions.actionids && groupactions.actionids.length == 0) {
                  var grouptext = groupactions.name;
                  if(groupactions.triggertype) {
                     grouptext += " ("+groupactions.triggertype+")"
                  }
                  grouptext += "[ " + groupactions.displaytext + " ]"
                  actionsObj[actionstate].actions.push(grouptext);
                  groupactions = null;
                }


            } else if(actiontype == "ACTIONGROUP") {
              var ga = nlapiSelectValues(recordXMLActions,'.//actionid') || [];
              if(ga.length > 0) {
                groupactions = {};
                groupactions.name = actiontypename;
                groupactions.triggertype = triggertype;
                groupactions.actionids = ga.join().split(",")
                groupactions.displaytext = "";
              } else {
                actionsObj[actionstate].actions.push(actionameandtriggertype);
              }
              
            } else {
              actionsObj[actionstate].actions.push(actionameandtriggertype);
            }
              
            
            
          } 
			
		  var conditionsavedsearch=nlapiSelectValue(recordXMLActions,'.//conditionsavedsearch') || '';
		  nlapiLogExecution('DEBUG', 'conditionsavedsearch', conditionsavedsearch);
		  if(conditionsavedsearch && conditionsavedsearchids.indexOf(conditionsavedsearch) == -1) {
			 conditionsavedsearchids.push(conditionsavedsearch);
		  }

		  var formulaExpressions = "";	
      nlapiLogExecution('DEBUG', 'actiontype', actiontype);
          if(actiontype=="CUSTOMACTION"){

              var fieldNodesCustomActions=nlapiSelectNodes(recordXMLActions,'.//line');
              for(ff=0;fieldNodesCustomActions[ff]!=null;ff++)
              {
                  var myfield=nlapiSelectValue(fieldNodesCustomActions[ff],'field');
                  if(myfield!=null && myfield!="")
                  {
                      if(custrecord_flo_workflow_field!="")
                      {
                        custrecord_flo_workflow_field+="\n"
                      }/*else{
                         custrecord_flo_workflow_field+="\n";
                         //State:"+myStatesActions[stateid]+"\n";
                      } */                      
                      
                      custrecord_flo_workflow_field+=myfield.toLowerCase();

                      if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
                      custrecord_flo_workflow_field_raw+=myfield.toLowerCase();
                  }
              }

              var recordXMLActionParent=nlapiStringToXML(xmlactions[i].custrecord_flo_cust_page_xml); 
              var fieldNodesActionsParent=nlapiSelectNodes(recordXMLActionParent,'.//line');

              for(fff=0;fieldNodesActionsParent[fff]!=null;fff++)
              {
                  var myactiontype=nlapiSelectValue(fieldNodesActionsParent[fff],'actiontype');
                  
                  if(actiontype=="CUSTOMACTION"){
                      var actionurl=nlapiSelectValue(fieldNodesActionsParent[fff],'actionurl');

                      if(actionurl!=null && actionurl!=""){
                        var scriptintid = actionurl.split("scripttype=")[1];
                        if(scriptintid) {
                          scriptintid = scriptintid.split('&')[0];
                          actionScriptId.push(scriptintid); 
                        }
                        
                      }
                  } 
              }
        } else if(actiontype == "INITIATEWORKFLOW") {
              var initiatedworkflow=nlapiSelectValue(recordXMLActions,'.//initiatedworkflow');
              //nlapiLogExecution('DEBUG', 'initiatedworkflow', initiatedworkflow);
              if(initiatedworkflow) {
                 initiatedWorfklows.push(initiatedworkflow)
              }
          } else if(actiontype == "CREATERECORD" || actiontype == "GOTORECORD") {
              var customrecordtype=nlapiSelectValue(recordXMLActions,'.//customrecordtype');
              if(customrecordtype) {
                 createRecords.push(customrecordtype)
              }
          }
         // triggerformula

          if(myfield!=null && myfield.indexOf('=')>-1){
              myfield=myfield.replace('=',',').replace(/ /gi,'').replace(',T','');
          }else if(myfield==null){
            myfield=""
          }

          if(myfield!=null && myfield!=""){
            if(custrecord_flo_workflow_field!=""){
              custrecord_flo_workflow_field+="\n"
            }/*else{
               custrecord_flo_workflow_field+="\n" 
               //myStatesActions[stateid]+"\n";
            }*/
            custrecord_flo_workflow_field+=myfield.toLowerCase();
          }
		  
          if(myfield!=null && myfield!=""){
            if(custrecord_flo_workflow_field_raw!=""){
              custrecord_flo_workflow_field_raw+=","
            }
            custrecord_flo_workflow_field_raw+=myfield.toLowerCase();
          }

          if(myvaluefield!=null && myvaluefield!="")
          {
          	  if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=myvaluefield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=myvaluefield.toLowerCase();
          }

          if(attachmentjoinfield!=null && attachmentjoinfield!="")
          {
          	  if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=attachmentjoinfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=attachmentjoinfield.toLowerCase();
          }

          if(attachmentfield!=null && attachmentfield!="")
          {
              if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=attachmentfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=attachmentfield.toLowerCase();
          }

          if(recipientjoinfield!=null && recipientjoinfield!="")
          {
          	  if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=recipientjoinfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=recipientjoinfield.toLowerCase();
          }
          if(recipientfield!=null && recipientfield!="")
          {
          	  if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=recipientfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=recipientfield.toLowerCase();
          }

          if(senderfield!=null && senderfield!="")
          {
              if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=senderfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=senderfield.toLowerCase();
          }

          if(recordidjoinfield!=null && recordidjoinfield!="")
          {
          	  if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=recordidjoinfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=recordidjoinfield.toLowerCase();
          }

          if(recordidfield!=null && recordidfield!="")
          {
              if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=recordidfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=recordidfield.toLowerCase();
          }

          if(recordfield!=null && recordfield!="")
          {
          	  if(custrecord_flo_workflow_field!="")
              {
                custrecord_flo_workflow_field+="\n"
              }                    
              
              custrecord_flo_workflow_field+=recordfield.toLowerCase();

              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
              custrecord_flo_workflow_field_raw+=recordfield.toLowerCase();
          }

          for (var idx=0; idx < targetfields.length; idx++){
          	  var mytargetfield = targetfields[idx].firstChild.nodeValue;
          	  if(mytargetfield!=null && mytargetfield!="")
          	  {
	              if(custrecord_flo_workflow_field!="")
	              {
	                custrecord_flo_workflow_field+="\n"
	              }                    

	              custrecord_flo_workflow_field+=mytargetfield.toLowerCase();

	              if(custrecord_flo_workflow_field_raw!="") custrecord_flo_workflow_field_raw+=","
	              custrecord_flo_workflow_field_raw+=mytargetfield.toLowerCase();
	          }
          }
		
          if(valueformula) {
			formulaExpressions += valueformula.toLowerCase() + " ";
		  }
		  
		  if(arguments) {
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

          if(mytriggercondition!=null && mytriggercondition!=""){
            if(custrecord_flo_wf_conditions!=""){
               custrecord_flo_wf_conditions+="\n"
            }/*else{
               custrecord_flo_wf_conditions+="\n";
            } */
            custrecord_flo_wf_conditions+=mytriggercondition;
          }
          
          if(conditionformula!=null && conditionformula!=""){
            if(custrecord_flo_wf_conditions!=""){
               custrecord_flo_wf_conditions+="\n"
            }else{
               custrecord_flo_wf_conditions+="\n";
            } 
            custrecord_flo_wf_conditions+=conditionformula;
			formulaExpressions += conditionformula;
			nlapiLogExecution('DEBUG', 'conditionformula', conditionformula);
		  }
		  
		  if(formulaExpressions) {
			nlapiLogExecution('DEBUG', 'formulaExpressions', formulaExpressions);
			//Get fields from formula
			var formulafields = formulaExpressions.match(/[\'|\"|{]cust[^om][a-zA-Z_]*([0-9a-zA-Z_]*)[\'|\"|}]/g);
			nlapiLogExecution('DEBUG', 'formulafields', formulafields);
			if(formulafields) {
				for(var cf = 0; cf < formulafields.length; cf++) {
					var cfield =formulafields[cf].replace(/\'|\"|{|}/g,"");
					nlapiLogExecution('DEBUG', 'cfield', cfield);
					if(custrecord_flo_workflow_field!=""){
					  custrecord_flo_workflow_field+="\n";
					}
					if(custrecord_flo_workflow_field_raw!=""){
					  custrecord_flo_workflow_field_raw+=","
					}
					if(custrecord_flo_workflow_field.indexOf(cfield) == -1) {
						custrecord_flo_workflow_field+=cfield.toLowerCase();
						custrecord_flo_workflow_field_raw+=cfield.toLowerCase();
					}
				}
			}
          }
        } catch(err) {
          nlapiLogExecution('DEBUG', 'err', err);
        }
    }
 }
  try {
    //Get Workflow Scripts
    nlapiLogExecution('DEBUG', 'Get Workflow Scripts', 'Get Workflow Scripts');
    if(actionScriptId && actionScriptId.length > 0) {
        var scriptFil=[];
        var orScriptFil=[];
        for(var ss = 0; actionScriptId[ss] != null; ss++) {
          var exp = ['custrecord_flo_int_id', 'equalto',parseInt(actionScriptId[ss])];
          orScriptFil.push(exp);
          if(ss + 1 != actionScriptId.length) {
            orScriptFil.push('or');
          }
        }
        scriptFil.push(orScriptFil);
        scriptFil.push('and');
        var custtypeeexp = ['custrecord_flo_cust_type','anyof',19]; //Search 
        scriptFil.push(custtypeeexp);
        scriptFil.push('and');
        inactiveexp = ['isinactive','is','F']; 
        scriptFil.push(inactiveexp);

        var scriptCol=[];
        scriptCol[0]=new nlobjSearchColumn("custrecord_flo_cust_id");
         nlapiLogExecution('DEBUG', 'scriptFil', JSON.stringify(scriptFil));
        var scriptList=nlapiSearchRecord("customrecord_flo_customization",null,scriptFil,scriptCol);
        if(scriptList && scriptList.length>0)
        {
          for(var sc=0; scriptList[sc] != null; sc++) {
            var myscript=scriptList[sc].getValue('custrecord_flo_cust_id');

            if(custrecord_flo_workflow_script_raw!="") custrecord_flo_workflow_script_raw+=","
            custrecord_flo_workflow_script_raw+=myscript;


          }
          
        //nlapiLogExecution('DEBUG', 'WF8', actiontypename+":"+myscript);

        }
    }
    //Get saved searches

    nlapiLogExecution('DEBUG', 'Get saved searches', 'Get saved searches');
    if(conditionsavedsearchids && conditionsavedsearchids.length > 0) {
      var ssfilters = [];
      var orfilters = [];
      for(var ss = 0; conditionsavedsearchids[ss] != null; ss++) {
        var exp = ['custrecord_flo_int_id', 'equalto',conditionsavedsearchids[ss]];
        orfilters.push(exp);
        if(ss + 1 != conditionsavedsearchids.length) {
        orfilters.push('or');
        }
      }
      ssfilters.push(orfilters);
      ssfilters.push('and');
      custtypeexp = ['custrecord_flo_cust_type','is',8]; //Search 
      ssfilters.push(custtypeexp);
      ssfilters.push('and');
      inactiveexp = ['isinactive','is','F']; 
      ssfilters.push(inactiveexp);
      nlapiLogExecution('DEBUG', 'ssfilters', ssfilters.join(","));
      
      searchcusts=nlapiSearchRecord("customrecord_flo_customization",null,ssfilters); 
      if(searchcusts) {
      nlapiLogExecution('DEBUG', 'searchcusts', searchcusts.length);
      var workflowsearches = [];
      for(sc = 0; searchcusts[sc] != null; sc++) {
        var searchcustid = searchcusts[sc].getId();
        if(workflowsearches.indexOf(searchcustid) == -1) {
          workflowsearches.push(searchcustid);
        }
      }
      
      if(workflowsearches && workflowsearches.length > 0) {
        custrec.setFieldValue('custrecord_flo_searches',workflowsearches);
      }

      }
    }

    //Get initiated workflows
    if(initiatedWorfklows && initiatedWorfklows.length > 0) {
        var wfintfilters = [];
        for(var ss = 0; ss < initiatedWorfklows.length; ss++) {
            var exp = ['custrecord_flo_int_id', 'equalto',initiatedWorfklows[ss]];
            if(wfintfilters.length > 0) wfintfilters.push("OR");
            wfintfilters.push(exp);
        }
        var wffilters = [['custrecord_flo_cust_type','anyof',[10]],"AND",['isinactive','is','F'], "AND", wfintfilters];
        var wfcolumns = [new nlobjSearchColumn("custrecord_flo_cust_id")];
        var wfsearch = nlapiSearchRecord("customrecord_flo_customization", null, wffilters, wfcolumns);
        if(wfsearch) {
            for(var w = 0; wfsearch[w] != null; w++) {

              var wfcustid = wfsearch[w].getValue('custrecord_flo_cust_id');
              if(wfcustid) {
                if(custrecord_flo_workflow_script_raw!="") custrecord_flo_workflow_script_raw+=","
                custrecord_flo_workflow_script_raw+=wfcustid.toLowerCase();
              }
              
            }
        }
    }

    //Get Created Records
    nlapiLogExecution('DEBUG', 'createRecords', createRecords);
    if(createRecords && createRecords.length > 0) {
      var recfilters = [['internalid','anyof',createRecords]];
      var reccolumns = [new nlobjSearchColumn("scriptid")];
      var recsearch = nlapiSearchRecord("customrecordtype", null, recfilters, reccolumns);
      if(recsearch) {
          for(var w = 0; recsearch[w] != null; w++) {
            if(custrecord_flo_workflow_script_raw!="") custrecord_flo_workflow_script_raw+=","
             custrecord_flo_workflow_script_raw+=recsearch[w].getValue('scriptid').toLowerCase();
          }
      }
    }
  } catch(err) {
    nlapiLogExecution('DEBUG', 'err', err);
  }
  
  nlapiLogExecution('DEBUG', 'satesName', satesName);
  nlapiLogExecution('DEBUG', 'actionsName', actionsName);

  if(satesName!=null && satesName!="") custrec.setFieldValue('custrecord_flo_wf_states',satesName.substring(0,3999));
  //if(actionsName!=null && actionsName!="") custrec.setFieldValue('custrecord_flo_wf_actions',actionsName.substring(0,3999));
  if(scriptid!=null && scriptid!="")  custrec.setFieldValue('custrecord_flo_cust_id',scriptid.substring(0,3999));
  if(triggertype!=null && triggertype!="") custrec.setFieldValue('custrecord_flo_wf_trigger_type',triggertype.substring(0,3999));
  if(actionsObj) {

    var workflowactions = ""

    for(var a in actionsObj) {
      if(workflowactions!="") {
        workflowactions+="\n";
      }
      workflowactions += "State: "+actionsObj[a].name+"\n";
      if(actionsObj[a].transitions && actionsObj[a].transitions.length > 0) {
          workflowactions += "Transitions: "+ actionsObj[a].transitions.join(", ")+"\n";
      }
      if(actionsObj[a].actions && actionsObj[a].actions.length > 0) {
          workflowactions += "[ "+actionsObj[a].actions.join(", ") + " ]\n";
      }
    }
    custrec.setFieldValue('custrecord_flo_wf_actions',workflowactions.substring(0,999999));   
  }

  if(parent!=null && parent!=""){

      var parentFilt=[];

      if(parentsArray[parent.toLowerCase()]!=null && parentsArray[parent.toLowerCase()]!="" ){
         parent=parentsArray[parent.toLowerCase()];
      }

      //parentFilt[0]=new nlobjSearchFilter('custrecord_flo_cust_id',null,'is',parent.toLowerCase()).setOr(true);
      //parentFilt[0]=new nlobjSearchFilter('name',null,'is',parent.toLowerCase());
      //parentFilt[1]=new nlobjSearchFilter('custrecord_flo_cust_type',null,'anyof',24);
      var parentFilt = [[['name','is',parent.toLowerCase()], "OR",['name','is',parent.toLowerCase() + ' (Standard Record)']],"AND",['custrecord_flo_cust_type','anyof',[24]],"AND",['isinactive','is','F']];
      parentList=nlapiSearchRecord("customrecord_flo_customization",null,parentFilt,null);

      if(parentList && parentList.length>0)
      {
          var myValues=parentList[0].getId()+",";

          //nlapiLogExecution('debug', 'WF7',parent.toLowerCase()+":"+myValues);
          
          custrec.setFieldValues('custrecord_flo_cust_parent',myValues.split(","));

      }else{
          
          var parentFiltCustom=[];

          parentFiltCustom[0]=new nlobjSearchFilter('custrecord_flo_cust_id',null,'is',parent.toLowerCase());
          parentFiltCustom[1]=new nlobjSearchFilter('custrecord_flo_cust_type',null,'anyof',[2,24]);
          parentList=nlapiSearchRecord("customrecord_flo_customization",null,parentFiltCustom,null);
          
          if(parentList && parentList.length>0)
          {
              var myValues=parentList[0].getId()+",";

              //nlapiLogExecution('debug', 'WF7.1',parent.toLowerCase()+":"+myValues);

              custrec.setFieldValues('custrecord_flo_cust_parent',myValues.split(","));
          }else{
               //nlapiLogExecution('debug', 'WF7.2',parent.toLowerCase()+":");
          }
      }

  }

  nlapiLogExecution('DEBUG', 'WF4',scriptid);
  nlapiLogExecution('DEBUG', 'WF4', custrecord_flo_wf_conditions);

   if(custrecord_flo_wf_conditions!=null && custrecord_flo_wf_conditions!=""){  
      if(triggerformulaGloblal!='' || initConditionText!=''){
        var globalconditions = triggerformulaGloblal;
        if(globalconditions && initConditionText) {globalconditions += ','}
        globalconditions+=initConditionText;
        custrecord_flo_wf_conditions="Global:\n"+globalconditions+","+custrecord_flo_wf_conditions;
      }
      custrec.setFieldValue('custrecord_flo_wf_conditions',custrecord_flo_wf_conditions.substring(0,999999));
   }else{

        if(triggerformulaGloblal!='' || initConditionText!=''){
          var globalconditions = triggerformulaGloblal;
          if(globalconditions && initConditionText) {globalconditions += ','}
          globalconditions+=initConditionText;
          custrec.setFieldValue('custrecord_flo_wf_conditions',globalconditions.substring(0,999999));
        }
   }

  if(custrecord_flo_workflow_field!=null && custrecord_flo_workflow_field!=""){
    custrec.setFieldValue('custrecord_flo_workflow_field',custrecord_flo_workflow_field.substring(0,3999));
  }
  if(custrecord_flo_workflow_field_raw!=null && custrecord_flo_workflow_field_raw!=""){
    custrec.setFieldValue('custrecord_flo_workflow_field_raw',custrecord_flo_workflow_field_raw.substring(0,3999));
  }
  if(custrecord_flo_workflow_script_raw!=null && custrecord_flo_workflow_script_raw!=""){
    custrec.setFieldValue('custrecord_flo_wf_scripts_raw',custrecord_flo_workflow_script_raw.substring(0,3999));
  }

  //savedsearch
  //custrecord_flo_searches
  // if(savedsearch!=null && savedsearch!="") custrec.setFieldValues('custrecord_flo_searches',[savedsearch]);

nlapiLogExecution('debug', 'triggeronschedule',triggeronschedule);
if(initonschedule == "T") {
  custrec.setFieldValue('custrecord_flo_wf_trigger_type',"SCHEDULED");
  if(triggeronschedule!=null && triggeronschedule!=""){
    custrec.setFieldValue('custrecord_flo_wf_scheduled',triggeronschedule);
  }

} else {
  custrec.setFieldValue('custrecord_flo_wf_scheduled','');
}


  //custrec.setFieldValue('custrecord_flo_xml_page_actions',xmlactions.substring(0,3999));

  
  }catch(e){
       nlapiLogExecution('debug', 'WF9',e);
  }

  return custrec;
}

function parseFormXML(custxml,custrec) {
  try {
      var recordXML=nlapiStringToXML(custxml);  
      var fields=nlapiSelectValues(recordXML,'.//@fields');
      var fieldarr= new Array();
      if(fields) {
        for(var i=0; fields[i] != null; i++) {
          //  nlapiLogExecution('DEBUG', 'fields', fields[i]);
            var temparr = fields[i].split(',')
            fieldarr =fieldarr.concat(temparr);
            
        }
      }
      
      var fldsid=nlapiSelectValues(recordXML,".//*[substring(name(), string-length(name()) - 5) = 'fldsid']");
      if(fldsid) {
        for(var k=0; fldsid[k] != null; k++) {
            fieldarr.push(fldsid[k]);
            
        }
      }

      //remove invalid fields
      for(var j=0; fieldarr[j]!=null; j++) {
        if(fieldarr[j].indexOf("_") == 0 || fieldarr[j].indexOf("ns") == 0 ) {
          nlapiLogExecution('DEBUG', 'remove from array',fieldarr[j]);
          fieldarr.splice(j, 1);
          j--;
        }
      }

      //filter mandatory fields
      var mandatoryFlds=[];
      var mandatoryFilter = "fldsmandatory";
      if (custrec.getFieldValue("custrecord_flo_cust_type") == 6) {
        mandatoryFilter = "fldsmand";
      }
      var fieldNodes = nlapiSelectNodes(recordXML,"//*[contains(@fields,'"+mandatoryFilter+"')]");
      if (fieldNodes) {

        for (var x=0; x<fieldNodes.length;x++) {

          var thisNodeIds=nlapiSelectValues(fieldNodes[x],".//*[substring(name(), string-length(name()) - 5) = 'fldsid']");

          var filteredFlds=nlapiSelectValues(fieldNodes[x],".//*[substring(name(), string-length(name()) -  string-length('" + mandatoryFilter + "') +1) = '"+ mandatoryFilter +"']");

          for (var i = 0; i < filteredFlds.length; i++) {
            if (filteredFlds[i] == 'T' && i < thisNodeIds.length && mandatoryFlds.indexOf(thisNodeIds[i]) < 0) {
              mandatoryFlds.push(thisNodeIds[i]);
            }
          }
        }
      }
      
      //remove duplicates
      fieldarr = uniq(fieldarr);
      
      var old_manfields = custrec.getFieldValue('custrecord_flo_cust_form_fields');
      mandatoryFlds = mandatoryFlds.join(",");
      if (mandatoryFlds != old_manfields) {
          custrec.setFieldValue('custrecord_flo_cust_form_fields', mandatoryFlds);
      }

      var old_availfields = custrec.getFieldValue('custrecord_flo_avail_form_fields');
      fieldarr = fieldarr.join(",");
      if(fieldarr != old_availfields) {
        custrec.setFieldValue('custrecord_flo_avail_form_fields', fieldarr);
      }
      // if(fieldarr.length > 0) {
      //   custrec.setFieldValue('custrecord_flo_cust_form_fields', fieldarr.join(","));
      // }
  } catch(e){
       nlapiLogExecution('debug', 'parseFormXML',e);
  }
  return custrec;

}

function getCustLabel(custxml,custtype) {
  var label = "";
  try {
    if(custxml != null && custxml != "") {
      var recordXML=nlapiStringToXML(custxml.replace(/&/g, '&amp;'));
      var label = nlapiSelectValue(recordXML,'/nsResponse/record/label'); //fields
      var recordname =  nlapiSelectValue(recordXML,'/nsResponse/record/recordname'); //records
      var formname =  nlapiSelectValue(recordXML,'/nsResponse/record/formname'); //forms
      var scriptname =  nlapiSelectValue(recordXML,'/nsResponse/record/name'); //scripts and lists and workflows
      var scriptdeployments =  nlapiSelectValue(recordXML,'/nsResponse/record/title'); //script deployments
      var rolename =  nlapiSelectValue(recordXML,'/nsResponse/record/rolename'); //user role
      if(custtype) {
        if(custtype.indexOf('Record') == 0) {
          label = recordname;
        } else if(custtype.indexOf('Form') != -1) {
          label = formname;
        } else if(custtype.indexOf('Script Deployments') == 0) {
          label = scriptdeployments;
        } else if(custtype.indexOf('Script') != -1 || custtype.indexOf('List') == 0 || custtype.indexOf('Workflow') == 0 ) {
          label = scriptname;
        }else if(custtype.indexOf('User Role') == 0 ) {
          label = rolename;
        }
      }
    }
  } catch(e) {
    nlapiLogExecution("debug","e", e);
  }

  return label;
}

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
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