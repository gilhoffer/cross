function getSearchFields()
{
    var searchCusts=nlapiSearchRecord("customrecord_flo_customization","customsearch_flo_search_spider",null,null);
    var custRecs=nlapiSearchRecord("customrecord_flo_customization","customsearch_flo_custom_rec",null,null);
    var thisSearch="";
    for(s=0;searchCusts!=null && searchCusts[s]!=null && s<10 && thisSearch!="no match";s++)
    {
       columns=searchCusts[s].getAllColumns();
       var recordtype=searchCusts[s].getValue(columns[4]).toLowerCase().replace(" ","");
       var searchid=searchCusts[s].getValue(columns[2]);
       var searchname=searchCusts[s].getValue(columns[0]);
       var searchcustrec=searchCusts[s].getId();
       parseSearchFields(recordtype,searchid,searchname,searchcustrec);
       makeJoins(searchCusts[s].getId());
    }
}

function parseSearchFieldsOld(recordtype,searchid,searchname,searchcustrec,custRecs)
{
	// try
	   {
       if(custRecs==null){var custRecs=nlapiSearchRecord("customrecord_flo_customization","customsearch_flo_custom_rec",null,null);}
       fieldArray=[];
       //load search
       //var recordtype=searchCusts[s].getValue(columns[4]).toLowerCase().replace(" ","");
       if(recordtype=="giftcertificates"){recordtype="giftcertificate"};
       if(recordtype=="event"){recordtype="calendarevent"};
       if(recordtype=="time"){recordtype="timebill"};
       if(recordtype=="case"){recordtype="supportcase"};
       nlapiLogExecution("debug","recordtype",recordtype)
       if(recordtype=="custom")
       {thisSearch=findRecType(custRecs,searchid,searchname)}
       else
       {
       thisSearch=nlapiLoadSearch(recordtype,searchid);
       }

       fe=thisSearch.getFilterExpression();
       nlapiLogExecution("debug","FE",fe)
       
       fs=thisSearch.getFilters();
       for(f=0;fs[f]!=null;f++)
       {
           if(fieldArray.indexOf(fs[f].getName())<0)
           {fieldArray.push(fs[f].getName())}
       }
       //response.write(fieldArray+"<br>")
       cs=thisSearch.getColumns();
       for(c=0;cs[c]!=null;c++)
       {
           if(fieldArray.indexOf(cs[c].getName())<0)
           {fieldArray.push(cs[c].getName())}
       }
       nlapiLogExecution("debug","fieldstring",fieldArray)
       nlapiSubmitField("customrecord_flo_customization",searchcustrec,"custrecord_flo_search_fields",fieldArray.join())
       }
       /*catch(e)
       {response.write(searchCusts[s].getValue(columns[0])+"--"+e.message+"<br><br>")}*/
}

function findRecType(custRecs,searchid,searchname)
{
	namewords=searchname.split(" ");
	namewords.push("#ALL#");
	//look for matching custom record starting by selecting only those whose names include a word from the search name
	for(n=0;namewords[n]!=0;n++) //loop through namewords
	{
		for(cr=0;custRecs[cr]!=null;cr++) //loop through custom records
		{
		
			custcols=custRecs[cr].getAllColumns();
			try
			{
				//response.write("Trying:"+custRecs[cr].getValue(custcols[1])+"<br>")
				if(custRecs[cr].getValue(custcols[1]).indexOf(namewords[n])>=0 | namewords[n]=="#ALL")
				{
					thisSearch=nlapiLoadSearch(custRecs[cr].getValue(custcols[1]),searchid);
			
					return thisSearch
				}
			}
			catch(e){}  //if its an invalid match, it will throw an error
		
		}
    }
	return "nomatch"
	
}
