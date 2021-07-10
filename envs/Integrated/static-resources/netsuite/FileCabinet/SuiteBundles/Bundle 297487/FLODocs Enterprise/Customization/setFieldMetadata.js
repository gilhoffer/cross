function setFieldMetadata()
{
  //get search of system notes
  var notes=nlapiSearchRecord("customer","customsearch_flo_customer_system_notes",null,null)
  {
    for(n=0;notes!=null && notes[n]!=null;n++)
    {
	   fieldchanged=false;
       //process system notes
       var columns=notes[n].getAllColumns();
       nlapiLogExecution("debug","Columns",columns.join())
       //get field name
       var thisField=notes[n].getText(columns[2]);
       nlapiLogExecution("debug","Field",thisField)
       //find customization record
       var filters= [];
       filters[0]= new nlobjSearchFilter("name",null,'startswith',thisField);
       var custrecs=nlapiSearchRecord("customrecord_flo_customization",null,filters,null)
       if(custrecs!=null)
       {thisCustRec=nlapiLoadRecord("customrecord_flo_customization",custrecs[0].getId())}
       //check and update dates
       var mindate=notes[n].getValue(columns[1]).split(" ")[0];
       var maxdate=notes[n].getValue(columns[1]).split(" ")[0];
       nlapiLogExecution("debug","Dates",(new Date(maxdate))-new Date(thisCustRec.getFieldValue("custrecord_flo_dls")))
       if(maxdate!=null && maxdate!="" && (thisCustRec.getFieldValue("custrecord_flo_dls")==null | (new Date(maxdate))-new Date(thisCustRec.getFieldValue("custrecord_flo_dls"))>0))
       {

	      /*month=(maxdate.getMonth()*1+1)+"";
	      if(month<10){month="0"+month}
	      theDate=(maxdate.getDate()*1)+"";
	      if(theDate<10==1){theDate="0"+theDate}
		  year=(maxdate.getYear()*1)+"";
		  nlapiLogExecution("debug","year",year)
	      if(year<2000){year=2000+year}
	      thisCustRec.setFieldValue("custrecord_flo_dls",month+"/"+theDate+"/"+year);*/
	      thisCustRec.setFieldValue("custrecord_flo_dls",maxdate);
	      fieldchanged=true;
	   }
	   
	   

       
       //check and update employees
       var setby=notes[n].getValue(columns[0]);

       nlapiLogExecution("debug","Employees","Set BY:"+setby+"Set BY Text:"+notes[n].getText(columns[0])+",Current:",thisCustRec.getFieldValue("custrecord_flo_employees_cust"))
       if(setby!=null && setby!=-4 && thisCustRec.getFieldValue("custrecord_flo_employees_cust").indexOf(setby)<0)
       {
	      
	      employees=thisCustRec.getFieldValue("custrecord_flo_employees_cust").split(",");
	      if(thisCustRec.getFieldValue("custrecord_flo_employees_cust")=="")
	      {
		     employees[0]=setby;
		     thisCustRec.setFieldValues("custrecord_flo_employees_cust",employees);
		     fieldchanged=true;
		  }
	      else
	      {
		     employees.push(setby);
	         thisCustRec.setFieldValue("custrecord_flo_employees_cust",employees);
	         fieldchanged=true;
          }
	      
	   
       //get departments from employees
          var fields=['department','location'];
          var empdata=nlapiLookupField("employee",setby,fields);
          var thisDept=empdata.department;
          var depts=thisCustRec.getFieldValue("custrecord_flo_depts_cust").split(",");
          if(thisDept!=null && thisDept!="" && thisDept!="undefined" && thisCustRec.getFieldValue("custrecord_flo_depts_cust").indexOf(thisDept)<0)
          {
	      	if(thisCustRec.getFieldValue("custrecord_flo_depts_cust")=="")
	      	{
		     	depts[0]=thisDept;
		     	thisCustRec.setFieldValues("custrecord_flo_depts_cust",depts);
		     	fieldchanged=true;
		  	}
	      	else
	      	{
		        
		     	depts.push(thisDept);
	         	thisCustRec.setFieldValue("custrecord_flo_depts_cust",depts);
	         	fieldchanged=true;
          	}
      	  }// End of check for existing dept
       

       //get locations from employees
       var thisLoc=empdata.location;
       var locs=thisCustRec.getFieldValue("custrecord_flo_loc_cust").split(",");
       if(thisLoc!=null && thisLoc!="undefined" && thisLoc!="" && thisCustRec.getFieldValue("custrecord_flo_loc_cust").indexOf(thisLoc)<0)
       {
	      	if(thisCustRec.getFieldValue("custrecord_flo_loc_cust")=="")
	      	{
		     	depts[0]=thisLoc;
		     	thisCustRec.setFieldValues("custrecord_flo_loc_cust",locs);
		     	fieldchanged=true;
		  	}
	      	else
	      	{
		     	depts.push(thisLoc);
	         	thisCustRec.setFieldValue("custrecord_flo_loc_cust",locs);
	         	fieldchanged=true;
       	    }
   	      }// End of check for existing loc
       }//end of check for employee match
       
       if(fieldchanged)
	   {
		  nlapiLogExecution("debug","saving",employees)
		  custID=nlapiSubmitRecord(thisCustRec);
		  nlapiLogExecution("debug","custID",custID);
	   }
    }
  }
}