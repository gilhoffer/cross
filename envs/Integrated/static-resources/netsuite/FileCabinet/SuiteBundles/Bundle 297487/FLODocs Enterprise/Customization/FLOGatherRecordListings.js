  var unabletoprocess="";
  var searchlist="";//used to store a list of relevant customizations
  var emplist="";//used to store a list of employees used to set the relevant employees.
  var completedRecTypes="";//These are the rectypes that were completed in this pass and are skipped on a reload.
  var pageNum=0;//tracks the page that the process was on when it stopped
  var itemNum=0;//tracks the item that the process was on when it stopped
  var recsProcessed=0;//tracks the number of records processed.
  var recsCreated=0;//tracks the number of new records created.
  var recsUpdated=0;//tracks the number of records updated.
  var filedata;//This is the data from the spider - it will be processed offline

  rectypes="Start,CRM Field,25,Entity Field,3,Item Field,26,Other Field,27,Item Option Field,28,Column Field,4,Body Field,5,List,1,Record,2,Item Number Field,29,Entry Form,6,Transaction Form,7,Saved Search,8,Custom Record Field,30,Standard Record,24,Standard Field,31,Suitelet,17,RESTlet,22,User Event,21,Scheduled,34,Portlet,18,Client,20,Bundle Installation,35,Workflow Action,19,Workflow,10,Mass Update,23,End";




function parseListing(url,rectype)
{
   filedata="";
   
   docWrite("<br>RECTYPE:"+rectype+"<br>");
   url=window.location.href.split("netsuite.com")[0]+"netsuite.com"+url.split("netsuite.com")[1];
   alert(url)
   docWrite("URL:"+url+"<br>")

   //get page sequence parameter - used to restart on the correct page
   if(pageNum==0 && window.location.href.indexOf("&pageNum=")>0)
   {pageNum=window.location.href.split("&pageNum=")[1].split("&")[0]}
      //get startitem parameter - used to restart on the correct item
   if(itemNum==0 && window.location.href.indexOf("&itemNum=")>0)
   {
       itemNum=window.location.href.split("&itemNum=")[1].split("&")[0];
       //alert("itemNUm:"+itemNum)
    }

   //check if the rectype has already been processed
   if(completedRecTypes==""){completedRecTypes=getExclude()};//set completedRecTypes on first pass 

   if(completedRecTypes.indexOf("##"+rectype+"##")>=0)
   {return}
   //check block on certain rectypes

   
   if(targetRec!=null && rectype.toLowerCase()!=unescape(targetRec).toLowerCase())
  {
        docWrite(rectype.toLowerCase()+"=="+unescape(targetRec).toLowerCase());
        return
  }
      
   //update spider controls
   //parent.document.getElementById('rectypelabel').innerHTML=rectype;
   //get first page
   var reqPage = nlapiRequestURL(url,null,a)
   var page=reqPage.getBody();
   reqPage=null;
   //get the data from the first page unless the pageNum sequence stipulates to start on the second page
    if(pageNum<2)
    {
          pageNum=1;
          getData(page,rectype);
    }
   //check if the list has multiple pages
   if(page.indexOf('segment_fs')>0)
   {

      //get page segment keys
      segmentlist=page.split("id='segment_fs'")[1];

      segmentlist=segmentlist.split("script>")[1];

      segmentlist=segmentlist.split("[")[1];

      segmentlist=segmentlist.split("]")[0];
      //alert("SemiFinal:"+segmentlist)
      segmentlist=segmentlist.split(",");
      for(s=3; segmentlist[s]!=null && segmentlist[s]!=segmentlist[s-2] && s<=segmentlist.length;s=s+2)
      {
         //get starting page sequence number from parameter
         if(s<pageNum){s=pageNum}
         docWrite(s+"  This Segment:  "+segmentlist[s]+"=?LastSegment:  "+segmentlist[Math.max(0,s-2)]+"<br>");
         nexturl=url+"&frame=B&segment="+segmentlist[s];
         docWrite("<br><br>"+nexturl+"<br><br>")
         //alert(nexturl)
         page=nlapiRequestURL(nexturl,null,a);
         page=page.getBody()
         pageNum=s;
         getData(page,rectype);
         
      }
   }
   completedRecTypes+="##"+rectype+"##";//log that this rectype is completed
 pageNum=1;
 //parent.document.getElementById('procnt').innerHTML=recsProcessed;
 //parent.document.getElementById('newcnt').innerHTML=recsCreated;
//parent.document.getElementById('updcnt').innerHTML=recsUpdated;
 recsProcessed=0;//reset the recsProcessed counter
 recsCreated=0;//reset the recsCreated counter
 recsUpdated=0;//reset the recsUpdated counter
  alert(filedata)
  filedata="<header>"+rectype+","+pageNum+"</header>"+filedata;
  page=nlapiRequestURL("/app/site/hosting/scriptlet.nl?script=customscript_flo_save_spider_data&deploy=1",filedata,a);
  alert(filedata)
  filedata="";

}

function getData(page,rectype)
{

  alert(page)
  pageRows=page.split(/\<tr id=\'row[0-9]+\'\>/g);
  ////alert(rectype+":"+pageRows.length )
  //get column headers
  headerrow=pageRows[0].substring(pageRows[0].lastIndexOf("<tr"));
  if(headerrow.indexOf('<div class="listheader">')<0)
  {return}
  if(headerrow.indexOf('<div class="listheader">#')<0 && headerrow.indexOf('<div class="listheader">Internal ID')<0)
  {alert(headerrow);alert("FLO's Spider requires access to the internal id of all records.  \n\nPlease turn on show Internal Id in your preferences before proceeding.\n\n You can find this preference under HOME>Set Preferences");return}

  headercells=headerrow.split(">");
  headers=[];
  for(h=0;headercells[h]!=null;h++)
  {
     if(headercells[h].charAt(0)!="<" && headercells[h].charAt(0)!=" " && headercells[h].indexOf("&nbsp;")!=0 && headercells[h].indexOf("function")<0)
     {
         columnname=headercells[h].substring(0,headercells[h].indexOf("<"));
         //alert(columnname)
         //docWrite(columnname+"--");
         columnname=columnname.replace(" ","_");
         columnname=columnname.replace(" ","_");
         headers.push(columnname);
      }
      
  }
//docWrite("<br>")
 
  for(p=1;pageRows[p]!=null;p++)
  {
	 //if(!confirm("Proceed?")){return}
     //get starting item number from parameter
     if(p==1 && itemNum>1){p=itemNum}
     itemNum=p;
     ////alert(p+"--"+pageRows.length)
     thisRow=pageRows[p];
    //skip standard forms and reports
    if(thisRow.indexOf(">Customize<")<0)
    {
     customization="";
       ////alert(thisRow)
        cells=thisRow.split("\n")
        for(c=1;cells[c]!=null && headers[c-1]!=null && headers[c-1]!="";c++)
        {
          if(customization!="")
          {customization+=","}
          //Disregard empty cells
          if(cells[c].indexOf("<td")!=0)
          {cells.splice(c,1)}
          //Get the edit/navigation link
          if(cells[c].indexOf("common/custom")>0 && customization.indexOf("Link:")<0)
          {
             thisCell=cells[c];
             var editLink=thisCell.split("href=")[1].split(" ")[0].substring(1);
             editLink=editLink.substring(0,editLink.length-1);
             ////alert(editLink)
             customization+="Link"+':'+editLink;
             customization+=","+headers[c-1]+':'+getInnerText(cells[c]);
             
          }
          else if(cells[c].indexOf("id=")>0 && cells[c].indexOf("media")>0) //locate any referenced files and get their internalids
          {
	           customization+=headers[c-1]+":"+cells[c].split("id=")[1].split("&")[0].split('"')[0];
	            
          }
          else
          {customization+=headers[c-1]+':'+getInnerText(cells[c]);}
          
         
         }
      //replace all space entities
      //customization=customization.replace(\/&nbsp/;\ig," ");
      docWrite("<br>CUSTZN:"+customization+"<br>");


         //id=createCustRec(customization,rectype) ;

         var newData="<record><config><![CDATA["+customization+"]]></config><pagexml><![CDATA["+getRecXML(customization,rectype)+"]]></pagexml></record>";
         filedata+=newData;
         alert(filedata)
      
       itemNum++;
      }

    
    
  }

  //clean up any duplicates
 //nlapiRequestURL("https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=324&deploy=1",null,a);
 
 docWrite("<BR>UNABLE:"+unabletoprocess+"<BR>")
 searchlist="";
 itemNum=1; //reset itemNum
}

function getRecXML(customization,rectype)
{
	var custxml="";
	//parse customization string
	custpairs=customization.split(",");
       ////alert(custpairs.length)
       custparams=[];
       for(c=0;c<custpairs.length ;c++)
       {
           custdata=custpairs[c].split(":");
           var label=custdata[0];
           label=label.replace('&nbsp;'," ");
           ////alert("#"+label.charAt(label.length-1)+"#")
           if(label.charAt(label.length-1)==" ")
           {label=label.substring(0,label.length-1)}
           ////alert("#"+label+"#")
           custparams[label]=custdata[1];  
       }
	//XML representation of customization page
    if(custparams.Link!=null && custparams.Link!="")
    {
        docWrite("getting XML")
        xmlreq=nlapiRequestURL(completeURL(custparams.Link+"&xml=t"),null,a);
        custxml=xmlreq.getBody();
        xmlreq=null;
        
    }
    return custxml
}

function  checkCust(ID,rectype,name)
{
     //return "";
     //alert("ID:  "+ID+"  name:  "+name+"<br>")
     var filters=[];
    //alert("cC:"+ID+"--"+rectype+"<br><br>")
     rectype=rectypes.split(","+rectype+",")[1].split(",")[0];
     if(searchlist=="")
     {
	   custSearch=nlapiLoadSearch("customrecord_flo_customization",'customsearch_flo_cust_search');
       //filters[0]=new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof",rectype);
       custSearch.addFilter(new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof",rectype))
//custs=nlapiSearchRecord("customrecord_flo_customization",'customsearch_flo_cust_search',filters,null);
       custResults=custSearch.runSearch();
       custs=custResults.getResults(0,1000)
       if(custs!=null)
       {
           //alert("creating list"+custs.length)
           searchlist=custs;
           cp=0;
           while(custs.length==1000 && cp<10)
           {
	               //filters[0]=new nlobjSearchFilter("custrecord_flo_cust_type",null,"anyof",rectype);
				   //filters[1]=new nlobjSearchFilter("internalid",null,"greaterthan",custs[999].getId());
			       //custs=nlapiSearchRecord("customrecord_flo_customization",'customsearch_flo_cust_search',filters,null);
			       start=(cp+1)*1000;
			       custs=custResults.getResults(start,(start+1000))
			       if(custs!=null)
			       {
					 for(c=0;custs[c]!=null;c++)
					 {searchlist.push(custs[c])}
			       }
			       cp++;
           }

       }
       
      }// End of blank searchlist
              //alert(searchlist.length);
       
       recid="";

       for(r=0;searchlist[r]!=null;r++)
       {
          columns=searchlist[r].getAllColumns();
          //if(r<2){docWrite("???"+searchlist[r].getValue(columns[0]))}
          if(ID==null | ID=="undefined")
          {
	         //alert("there's no id");
	         
	         if(name==searchlist[r].getValue(columns[0]))
	         {return searchlist[r].getId()}
	      }
	      else if(ID==searchlist[r].getValue(columns[5]))
          {return searchlist[r].getId()}

        }
       
     return ""
}

function createCust(customization,rectype,supdate)
{      
	  docWrite("<br>RT2:"+rectype+"<br>")
      recsProcessed++;//increase count of records processed
      if(supdate!=null){update="T"};//initializes update variable for server-side operations.
      //alert(customization+":"+rectype)
       custpairs=customization.split(",");
       ////alert(custpairs.length)
       custparams=[];
       for(c=0;c<custpairs.length ;c++)
       {
           custdata=custpairs[c].split(":");
           var label=custdata[0];
           label=label.replace('&nbsp;'," ");
           ////alert("#"+label.charAt(label.length-1)+"#")
           if(label.charAt(label.length-1)==" ")
           {label=label.substring(0,label.length-1)}
           ////alert("#"+label+"#")
           custparams[label]=custdata[1];  
       }
       ////alert("cval:"+custparams.Description)
       var recid=checkCust(custparams.ID,rectype,custparams.Name);
       docWrite("FoundRec:?"+recid);
       if(recid=="")
       {
           docWrite("Creating");
           nlapiLogExecution("debug","creating");
           recsCreated++;
           custrec=nlapiCreateRecord("customrecord_flo_customization");
           nlapiLogExecution("debug","created");
           //alert("made record")
           docWrite("<br>Created:"+customization+"--"+recid+"<br>")
       }
       else if(update && update!="F")
      {
            docWrite("<br>Updating record now<br><br>");
            recsUpdated++;
custrec=nlapiLoadRecord("customrecord_flo_customization",recid);
                        docWrite("<br>Created Record<br>");
      }
      else
      {
           return recid
      }
      
      //custrecString1=JSON.stringify(custrec);
      //get description to be inserted into Name
      var description=custparams.Description;
      if(rectype=="List")
      {description=custparams.List;}
      if(rectype=="Record")
      {description=custparams.Edit;}
      if(rectype=="Entry Form" | rectype=="Transaction Form" | rectype=="Saved Search" | rectype=="Workflow" | rectype=="Suitelet" | rectype=="User Event" | rectype=="Client" | rectype=="Scheduled" | rectype=="Bundle Installation" | rectype=="RESTlet" | rectype=="Portlet" | rectype=="Workflow Action" | rectype=="Mass Update")
      {
         docWrite("setting name to Name")
         description=custparams.Name;
      }
      if(description==null | description=="")
      {docWrite("description is null"+rectype);/*return ""*/}
      docWrite("DEC:"+description)
      /*if(description!=null && description!== "" && description.length )
      {description=""}*/
      rectype=rectypes.split(","+rectype+",")[1].split(",")[0];
       docWrite("adding fields")
       custrec.setFieldValue("name",description)
       custrec.setFieldValue("custrecord_flo_cust_type",rectype)
       custrec.setFieldValue("custrecord_flo_int_id",custparams.Internal_ID);
       custrec.setFieldValue("custrecord_flo_cust_id",custparams.ID);
       custrec.setFieldValue("custrecord_flo_data_type",custparams.Type);

       docWrite("adding optional fields")
       //add optional fields
       
       //description - not available on all records
       if(custparams.Description!=null && custparams.Description!="" && custrec.getFieldValue("custrecord_flo_description")=="")
       {
	      docWrite("Setting Description<br><br>");
	      custrec.setFieldValue("custrecord_flo_description",custparams.Description);
	   }
       //owner - not available on all records
       if(custparams.Owner!=null && custparams.Owner!="")
       {
	      owner=getEmpId(custparams.Owner);
              docWrite("<br>OWNER:"+owner+"<br>")
          //owner
          if(owner!="" && owner!=null)
          {custrec.setFieldValue("owner",owner);}
          docWrite(custparams.Last_Run_On+" "+custparams.Last_Run_By+"<br>")
        }
       //last run date and person for searches
       if(custparams.Last_Run_On!=null && custparams.Last_Run_On!="" && custparams.Last_Run_On.indexOf("/")>0 && custparams.Last_Run_On!="undefined")
       {custrec.setFieldValue("custrecord_flo_dls",custparams.Last_Run_On.split(" ")[0]);}
        if(custparams.Last_Run_By!=null && custparams.Last_Run_By!="" && custparams.Last_Run_By!="undefined")
        {
           var runby=custrec.getFieldValue("custrecord_flo_employees_cust")+"";
           if(runby!="" && runby!=null && runby!="null"){var runnames=runby.split(",");}else{runnames=[];}
           var empid=getEmpId(custparams.Last_Run_By)
           if(runnames==null | runnames.length==0 | runnames.indexOf(empid)<0)
           {
               runnames.push(empid);
               docWrite(runnames.join()+"<br>")
               custrec.setFieldValues("custrecord_flo_employees_cust",runnames);
           }
        }
        //alert("adding script fields")
        //script file
        if(custparams.Script!=null && !isNaN(parseInt(custparams.Script)))
        {custrec.setFieldValue("custrecord_flo_script_file",custparams.Script)}

        //library script file
        if(custparams.Library_Script!=null && !isNaN(parseInt(custparams.Library_Script)))      {custrec.setFieldValue("custrecord_flo_lib_script",custparams.Library_Script)}
        
       //XML representation of customization page
       if(custparams.Link!=null && custparams.Link!="" && supdate==null)
       {
           docWrite("getting XML")
           xmlreq=nlapiRequestURL(completeURL(custparams.Link+"&xml=t"),null,a);
           custxml=xmlreq.getBody();
           xmlreq=null;
           custrec.setFieldValue("custrecord_flo_cust_page_xml",custxml);
       }
       //List or Multiple Select get the id
       docWrite("LIST:"+custparams.List)
       if(custparams.List!=null && custparams.List!=" " && custparams.List!="&nbsp;" && rectype>2)
       {
        link=nlapiRequestURL(custparams.Link+'&xml=t', null, a);
        linkbody=link.getBody();
        link=null;
        //alert(linkbody);
        list=linkbody.split("selectrecordtype")[2].substring(1);
        ////alert(list)
        list=list.split("<")[0];
        ////alert(list)
        custrec.setFieldValue("custrecord_flo_list_data",custparams.List+":"+list);
        
       }
       custrec.setFieldValue("custrecord_flo_bundle",custparams.From_Bundle);
       custrec.setFieldValue("custrecord_flo_customization",customization);

           
      try
      {
            
            docWrite("submitting"+custrec.getFieldValue("name")+"#")
            newrecid=nlapiSubmitRecord(custrec);
      }
      catch(e)
      {
         docWrite("ERROR::"+e.message)
         if(e.message.indexOf("Invalid owner reference")>=0)
         {
               docWrite("<br>Resetting Owner to: "+nlapiGetContext().getUser())
               custrec.setFieldValue("owner",nlapiGetContext().getUser());
               newrecid=nlapiSubmitRecord(custrec);
          }
      }

      docWrite("Saved:"+rectype+":"+newrecid+"<br>");
      custrec==null;
      /*if(rectype==2)
      {docWrite("getting fields");getRecordData(custparams.Internal_ID,newrecid)}*/
      
      //alert("NEWRECID:"+newrecid)
      if(newrecid!=null && newrecid!="")
      {return newrecid}
       else
       {return ""}

}

function getInnerText(thisCell)
{     try
       {
       thisCell=thisCell.split("</a>")[0];
       thisCell=thisCell.replace("</td>","");
       thisCell=thisCell.replace("</a>","");
       thisCell=thisCell.substring(thisCell.lastIndexOf(">")+1);
       return thisCell
       }
       catch (e)
       {return "Unable to get text"}
}

function getRecordData(recordid,parent)
{
        //note this is no longer used and can be deleted
        //alert("GRD:"+recordid+":"+parent)

        var recordReq=nlapiRequestURL("https://system.na1.netsuite.com/app/common/custom/custrecord.nl?id="+recordid+"&xml=t",null,a);
        var recordXML=nlapiStringToXML(recordReq.getBody());
        //get Fields
       var fieldNodes=nlapiSelectNodes(recordXML,'.//line[./customfieldseqnum]');
       for(f=0;fieldNodes[f]!=null && f<2;f++)
       {

fieldcust="Start,Description:"+nlapiSelectValue(fieldNodes[f],'fielddescr')+",Internal_ID:"+nlapiSelectValue(fieldNodes[f],'fieldid')+",ID:"+nlapiSelectValue(fieldNodes[f],'fieldcustcodeid')+","+nlapiSelectValue(recordXML,'.//recordname')+":Y,End";
//customization="RED";
//alert("customization:"+fieldcust)

 id=createCust(fieldcust,'Custom Record Field'); 
//alert(id)
       }
}

function getEmpId(name)
{
    docWrite("<br><br>Name:"+name+"<br><br>")
    if(emplist=="")
    {
      //load a list of employees
       var empfilts=[];
        empfilts[0]=new nlobjSearchFilter('isinactive',null,'is','F');
        var empcols=[];
        empcols[0]=new nlobjSearchColumn("entityid");
        emplist=nlapiSearchRecord("employee",null,empfilts,empcols);
        
    }
    for(e=0;emplist!=null && emplist[e]!=null; e++)
   {
         cols=emplist[e].getAllColumns();
         //alert(emplist[e].getValue(cols[0]))
         if(name==emplist[e].getValue(cols[0]))
         {
               return emplist[e].getId();
         }
   }
   return ""
}

function getExclude()
{
   href=window.location.href;
   if(href.indexOf("&exclude=")>0)
   {return href.substring(href.indexOf("&exclude=")).split("exclude=")[1].split("&")[0]}
   return "#";
}

function parseStandardRecords(page,rectype)
{
  //alert(rectype)
  page=page.replace(/ class=\"record_cell\"/ig,"");
  page=page.replace(/\<\\td>/ig,"<td>");
  pageRows=page.split('<tr class="row_');
  //alert(pageRows.length)
  for(p=1;pageRows[p]!=null;p++)
  {
     cells=pageRows[p].split("<td>");
     docWrite(cells[1]+"--"+cells[2]+"<br>")
     var recName=cells[1].split(">")[1].replace("</a","");
     var recURL=cells[1].split(">")[0].replace("<a href=\"","");
     recURL=recURL.replace("\"","");
     recURL=recURL.substring(recURL.indexOf("=")+1)
     //docWrite(recName+"--"+recURL+"--"+cells[2]+"<br>")



      //load page and convert to XML
      fieldreq=nlapiRequestURL("https://system.netsuite.com/help/helpcenter/en_US/RecordsBrowser/2013_2/"+recURL,null, a);
fieldpage=fieldreq.getBody();
fieldreq=null;
fieldpage=fieldpage.replace(/\&nbsp\;/g," ");
fieldpage="<html>"+fieldpage;
fieldsXML=nlapiStringToXML(fieldpage);

     //create record if not already created
     customization="description:"+recName+",ID:"+cells[2];
     tranCheck=nlapiSelectValue(fieldsXML,".//table[@class='record_table'][0]/tr/td[./text()="+cells[2]);
     id=createCust(customization,"Standard Record");

     

  }
}

function completeURL(thisurl)
{
     var currentloc=window.location.href;
     var currentdom=currentloc.substring(0,currentloc.indexOf("/app"));
     newurl=currentdom+thisurl;
     //alert(newurl)
     return newurl
}

function docWrite(text)
{
	try
	{document.write(text+"<br>")}
	catch(e){
		nlapiLogExecution("debug","docWrite",text)
	}
}