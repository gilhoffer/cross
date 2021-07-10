nlapiLogExecution("audit","FLOStart",new Date().getTime())
function createSpiderLogs()
{
    //This function checks for all spider record logs and creates any missing ones
    for(i=1;i<=5;i++)
    {
     	filters=[new nlobjSearchFilter("custrecord_flo_log_type",null,'is',i)];
       	logs=nlapiSearchRecord("customrecord_flo_spider_log",null,filters,null);
       	if(logs==null)
		{
			try
			{
		    newlog=nlapiCreateRecord("customrecord_flo_spider_log");
		    newlog.setFieldValue("custrecord_flo_log_type",i);
		    newlog.setFieldValue("custrecord_flo_config_stats_link",1);
		    nlapiSubmitRecord(newlog)
	    	}
	        catch(e){nlapiLogExecution("error","e",e)}
		}
    }
}