function isWithinTimeWindow(starttime, endtime) {
	try {
		//Dummy Record to get current timeof day
	    var dummyConfig = nlapiCreateRecord("customrecord_flo_spider_configuration", {recordmode: 'dynamic'});
	    currenttime = dummyConfig.getFieldValue('custrecord_flo_conf_current_tod');

	    var ret = false;

	    //Compare by Hour and Minutes because Timezone is a mess.

	    if(starttime != null && starttime != "" && endtime != null && endtime != "" && currenttime) {

	    	starttime = getDateTime(starttime);
	   	 	endtime = getDateTime(endtime);
	    	currenttime = getDateTime(currenttime);
	        nlapiLogExecution("debug","currenttime",currenttime.hour + " : " + currenttime.minute);
	        nlapiLogExecution("debug","starttime",starttime.hour + " : " + starttime.minute);
	        nlapiLogExecution("debug","endtime",endtime.hour + " : " + endtime.minute);

	        if(starttime.hour > endtime.hour) {
	            if(currenttime.hour > starttime.hour) { 
	                ret = true;
	            } else if(currenttime.hour == starttime.hour && currenttime.minute >= starttime.minute) {
	                ret = true;
	            } else if(currenttime.hour < endtime.hour ) {
	                ret = true;
	            } else if(currenttime.hour == endtime.hour && currenttime.minute < endtime.minute) {
	                ret = true;
	            }
	        } else if(currenttime.hour >= starttime.hour && currenttime.hour <= endtime.hour) {
	            
	        	if(currenttime.hour == starttime.hour && currenttime.hour == endtime.hour) {
	        		if(currenttime.minute >= starttime.minute &&  currenttime.minute < endtime.minute)	{
	        			ret = true;
	        		}
	        	} else if(currenttime.hour == starttime.hour) {
	                if(currenttime.minute >= starttime.minute) {
	                    ret = true;
	                }
	            } else if(currenttime.hour == endtime.hour) {
	                if(currenttime.minute < endtime.minute) {
	                    ret = true;
	                } 
	            } else {
	                ret = true;
	            }
	            
	        }
	    } else {
	        ret = true; 
	    }
	}  catch(e) {
		 nlapiLogExecution("debug","isWithinTimeWindow",e);
		return true;
	}      
       
    return ret;
}

function getDateTime(time) {
    var d = {hour: 0, minute:0};
    var splitSign = "";
    var userPreferences = nlapiLoadConfiguration('userpreferences');
    var timeFormat = userPreferences.getFieldValue('TIMEFORMAT');
    if ( (timeFormat == "fmHH:fmMI am") || (timeFormat == "fmHH-fmMI am") ) {
        // separate am/pm sign
        var timeFieldValue = time.split(" ");
        // choose split sign
        if (timeFormat == "fmHH:fmMI am") {splitSign = ":";} else {splitSign = "-";}
        // split hours and minutes
        var timeArray = timeFieldValue[0].split(splitSign);
        var hour = parseInt(timeArray[0]);
        var minute = parseInt(timeArray[1]);
        if(hour == 12) hour = 0;
        
        if(timeFieldValue[1] == "pm") {
            hour += 12;
        }
        d.hour = hour;
        d.minute = minute;
          
    }else{
        // 24 hours time format (no am/pm)
        //choose split sign
        if (timeFormat == "fmHH24:fmMI") {splitSign = ":";} else {splitSign = "-";}
        // split hours and minutes
        var timeArray = time.split(splitSign);
        
        d.hour = parseInt(timeArray[0]);
        d.minute =parseInt(timeArray[1]);
    }
    
    return d;
}