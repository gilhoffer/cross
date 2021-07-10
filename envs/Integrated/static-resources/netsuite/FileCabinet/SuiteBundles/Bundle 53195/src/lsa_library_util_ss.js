/**
 * � 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *
 * Library functions for Last Sales Activity server side scripts.
 *
 * Version		Date				Author				Remarks
 * 1.00			23 Feb 2015			jbabaran			328506
 * 2.00			26 Feb 2015			jbabaran			329089
*/

var lsans;
if (!lsans) { lsans = {}; }

 var onServerLog = true;
//var onServerLog = false;
 
 
 /*
  * Set last sales activity date
  */
 lsans.ServerLibrary.setCustLastSalesActivityDate = function (recordtype, recordid, activitydate, activityrecordtype, activitylabel, activityinternalid) 
 {
     var MSG_TITLE = 'setCustLastSalesActivityDate';
     var serverlogger = new lsans.GeneralLibrary.Logger(MSG_TITLE, false);
     if(onServerLog)
     {
         serverlogger.enable(); //comment this line to disable debug server
     }   
     
     
     serverlogger.debug(MSG_TITLE, 'start USAGE: '+nlapiGetContext().getRemainingUsage()+'\n'
                              + ' recordtype:  '+recordtype+'\n'
                              + ' recorid:  '+recordid+'\n'
                              + ' activitydate:  '+activitydate+'\n'
                              + ' activityrecordtype:  '+activityrecordtype+'\n'
                              + ' activitylabel:  '+activitylabel+'\n'
                              + ' activityinternalid:  '+activityinternalid+'\n'
                              + ' IS_MARKETING_AUTO_ON:  '+IS_MARKETING_AUTO_ON+'\n'
                              + ' IS_LSA_ACTIVITY_MARKETING_CAMPAIGN:  '+IS_LSA_ACTIVITY_MARKETING_CAMPAIGN+'\n'
                             );
     
     try
     {
         var maxdate;
         var oldlsadate;
         var oldlink;
         var oldlinkname;
         var recentActivityArr;
         var recentActivityLabel;
         var recentActivityLink;
     	var lsaPropertyArr = null;
     	lsaPropertyArr = lsans.ServerLibrary.GetLSAProperties(recordtype, recordid);
     	var custLsaFields = new Array();
     	custLsaFields.push(lsaPropertyArr['lsaDateField']);
     	custLsaFields.push(lsaPropertyArr['lsaLinkField']);
     	custLsaFields.push(lsaPropertyArr['lsaLinkNameField']);
     	var record = nlapiLookupField(recordtype, recordid, custLsaFields);
         
       //dont get the existing date if this is a marketing automation
         if(IS_MARKETING_AUTO_ON && IS_LSA_ACTIVITY_MARKETING_CAMPAIGN)
         {
             oldlsadate = '';
             oldlink = '';
             oldlinkname = '';
         }
         else
         {
             oldlsadate = record[lsaPropertyArr['lsaDateField']];
             oldlink = record[lsaPropertyArr['lsaLinkField']];
             oldlinkname = record[lsaPropertyArr['lsaLinkNameField']];
         }   
         
         serverlogger.debug(MSG_TITLE, '\n'
                 + ' oldlsadate:  '+oldlsadate+'\n'
                 + ' oldlink:  '+oldlink+'\n'
                 + ' oldlinkname:  '+activitydate+'\n'
                 + ' record[lsaPropertyArr[lsaDateField]]:  '+record[lsaPropertyArr['lsaDateField']]+'\n'
                 + ' record[lsaPropertyArr[lsaLinkField]]:  '+record[lsaPropertyArr['lsaLinkField']]+'\n'
                 + ' record[lsaPropertyArr[lsaLinkNameField]]:  '+record[lsaPropertyArr['lsaLinkNameField']]+'\n'
                 );
         
         var environment = nlapiGetContext().getEnvironment();
         
         //compare dates if there is an existing LSA else set the max to the activity date
         if( lsans.GeneralLibrary.isValidObject(oldlsadate) && lsans.GeneralLibrary.isValidObject(activitydate) )
         {
             recentActivityArr = lsans.ServerLibrary.returnRecentActivity (oldlsadate, oldlinkname, oldlink, activitydate, activitylabel, activityinternalid);
             maxdate = recentActivityArr[0];
             recentActivityLabel = recentActivityArr[1];
             
             if(recentActivityLabel.indexOf(oldlinkname) != -1 )
             {
                 recentActivityLink = recentActivityArr[2];
             }
             else
             {
                 recentActivityLabel = maxdate +' '+activitylabel; 
                 recentActivityLink =  nlapiResolveURL('RECORD', activityrecordtype, activityinternalid); 
             }   
             
         }
         else
         {
             maxdate = activitydate;
             recentActivityLabel = maxdate +' '+activitylabel;
             recentActivityLink = nlapiResolveURL('RECORD', activityrecordtype, activityinternalid); 
         }
         
         serverlogger.debug(MSG_TITLE, 'Before setting.....\n'
                  + ' maxdate  >>>'+oldlsadate+'<<<\n'
                  + ' recentActivityLabel  >>>'+recentActivityLabel+'<<<\n'
                  + ' recentActivityLink  >>>'+recentActivityLink+'<<<\n'
                  + ' environment:  '+environment+'\n'
                 );
         
         if ( (maxdate != oldlsadate) || lsans.GeneralLibrary.isValidObject(maxdate) ) 
         {
         	lsans.ServerLibrary.UpdateLastSalesActivity(recordtype, recordid, maxdate, recentActivityLink, recentActivityLabel);
         }
         
     }
     catch(ex)
         {
             var subject_message = 'setCustLastSalesActivityDate';
             var body_message = '';
             
             if (ex instanceof nlobjError) 
             {
                 body_message = 'system error: <p>' + ex.getCode() + ': <p>' + ex.getDetails();
                 nlapiLogExecution('ERROR', MSG_TITLE, body_message);
             }
             else 
             {
                 body_message = 'unexpected error: <p>' + ex.toString();
                 nlapiLogExecution('ERROR', MSG_TITLE, body_message);
             }
             
     
         }    
     
     serverlogger.debug(MSG_TITLE, 'setCustLastSalesActivityDate: end\n USAGE: '+nlapiGetContext().getRemainingUsage()+'\n'
                              + ' recordtype:  '+recordtype+'\n'
                              + ' recordid:  '+recordid+'\n'
                              + ' activitydate:  '+activitydate+'\n'
                              + ' oldlsadate:  '+oldlsadate+'\n'
                              + ' maxdate:  '+maxdate+'\n' 
                             );
     
     
 };//end 

 /* 
 * Set LSA hidden field and LSA link visible
 */
lsans.ServerLibrary.setLSAandLink = function (recordtype, recordid, activitydate, linktext, activityinternalid) 
{
    var MSG_TITLE = 'setLSAandLink';
    var serverlogger = new lsans.GeneralLibrary.Logger(MSG_TITLE, false);
    if(onServerLog)
    {
        serverlogger.enable(); //comment this line to disable debug server
    }   
    serverlogger.debug(MSG_TITLE, 'start USAGE: '+nlapiGetContext().getRemainingUsage()+'\n'
                             + ' recordtype:  '+recordtype+'\n'
                             + ' recorid:  '+recordid+'\n'
                             + ' activitydate:  '+activitydate+'\n'
                             + ' linktext:  '+linktext+'\n'
                             + ' activityinternalid:  '+activityinternalid+'\n'
                             + ' IS_MARKETING_AUTO_ON:  '+IS_MARKETING_AUTO_ON+'\n'
                             + ' IS_LSA_ACTIVITY_MARKETING_CAMPAIGN:  '+IS_LSA_ACTIVITY_MARKETING_CAMPAIGN+'\n'
                            );
    try
    {
        var record = nlapiLoadRecord(recordtype , recordid );
        var lsaURLlink = '';
        var activityrecordtype = '';
        var maxdate = '';
        var maxdatelinkvalue = '';
        var oldlsadate = '';
        var oldlsadatelink = '';
        var oldlsadatelinkvalue = '';
        var activityArr = new Array();
       	var lsaPropertyArr = null;
    	lsaPropertyArr = lsans.ServerLibrary.GetLSAProperties(recordtype, recordid);
        
        //dont get the existing date if this is a marketing automation
        if((IS_MARKETING_AUTO_ON && IS_LSA_ACTIVITY_MARKETING_CAMPAIGN)
        		|| !(lsans.GeneralLibrary.isValidObject(lsaRecordId)))
        {
            oldlsadate = null;
            maxdatelinkvalue  = '';
        }
        else
        {
        	oldlsadate = record.getFieldValue(lsaPropertyArr['lsaDateField']);
        	oldlsadatelink = record.getFieldValue(lsaPropertyArr['lsaLinkField']);

            if( oldlsadatelink.toLowerCase().match(/marketing campaign/gi) !=null )
            {
                oldlsadatelinkvalue = 'Marketing Campaign';
            }
            if( oldlsadatelink.toLowerCase().match(/task/gi) !=null )
            {
                oldlsadatelinkvalue = 'Task';
            }
            if( oldlsadatelink.toLowerCase().match(/phone call/gi) !=null )
            {
                oldlsadatelinkvalue = 'Phone Call';
            }
            if( oldlsadatelink.toLowerCase().match(/event/gi) !=null )
            {
                oldlsadatelinkvalue = 'Event';
            }
            if( oldlsadatelink.toLowerCase().match(/note/gi) !=null )
            {
                oldlsadatelinkvalue = 'Note';
            }
            if( oldlsadatelink.toLowerCase().match(/message/gi) !=null )
            {
                oldlsadatelinkvalue = 'Message';
            }   
        }   
        
        //compare dates if there is an existing LSA else set the max to the activity date
        if( lsans.GeneralLibrary.isValidObject(oldlsadate) && lsans.GeneralLibrary.isValidObject(activitydate) )
        {
            activityArr = lsans.ServerLibrary.returnRecentActivity(oldlsadate, oldlsadatelinkvalue, linktext);
            maxdate = activityArr[0];
            maxdatelinkvalue = activityArr[1];
        }
        else
        {
            maxdate = activitydate;
            maxdatelinkvalue = linktext;
        }
            
        if ( (maxdate != oldlsadate) || lsans.GeneralLibrary.isValidObject(maxdate) 
                && lsans.GeneralLibrary.isValidObject(maxdatelinkvalue) && lsans.GeneralLibrary.isValidObject(activityinternalid)
            ) 
        {
            
            if( maxdatelinkvalue.toLowerCase().match(/marketing campaign/gi) !=null )
            {
                activityrecordtype = 'campaign';
            }
            if( maxdatelinkvalue.toLowerCase().match(/task/gi) !=null )
            {
                activityrecordtype = 'task';
            }
            if( maxdatelinkvalue.toLowerCase().match(/phone call/gi) !=null )
            {
                activityrecordtype = 'phonecall';
            }
            if( maxdatelinkvalue.toLowerCase().match(/event/gi) !=null )
            {
                activityrecordtype = 'calendarevent';
            }
            if( maxdatelinkvalue.toLowerCase().match(/note/gi) !=null )
            {
                activityrecordtype = 'note';
            }
            if( maxdatelinkvalue.toLowerCase().match(/message/gi) !=null )
            {
                activityrecordtype = 'message';
            }   
            

            if( lsans.GeneralLibrary.isValidObject(maxdate) && maxdate.toLowerCase().match(/NaN/gi) == null)
            {   
                lsaURLlink = nlapiResolveURL('RECORD', activityrecordtype, activityinternalid);
                maxdatelinkvalue = maxdate +' '+maxdatelinkvalue;
            }
            else
            {
            	lsaURLlink = '';
            	maxdate = '';
            	maxdatelinkvalue = '';
            }

            lsans.ServerLibrary.UpdateLastSalesActivity(recordtype, recordid, maxdate, lsaURLlink, maxdatelinkvalue);
            
            serverlogger.debug(MSG_TITLE, '\n'
                     + ' lsaURLlink:  '+lsaURLlink+'\n'
                     + ' maxdatelinkvalue:  '+maxdatelinkvalue+'\n'
                     + ' maxdate:  '+maxdate+'\n'
                    );
        }
        
    }
    catch(ex)
        {
            var subject_message = 'setLSAandLink';
            var body_message = '';
            
            if (ex instanceof nlobjError) 
            {
                body_message = 'system error: <p>' + ex.getCode() + ': <p>' + ex.getDetails();
                nlapiLogExecution('ERROR', MSG_TITLE, body_message);
            }
            else 
            {
                body_message = 'unexpected error: <p>' + ex.toString();
                nlapiLogExecution('ERROR', MSG_TITLE, body_message);
            }
            
    
        }    
    
    serverlogger.debug(MSG_TITLE, 'setLSAandLink: end\n USAGE: '+nlapiGetContext().getRemainingUsage()+'\n'
                             + ' recordtype:  '+recordtype+'\n'
                             + ' recorid:  '+recordid+'\n'
                             + ' activitydate:  '+activitydate+'\n'
                             + ' linktext:  '+linktext+'\n'
                             + ' oldlsadate:  '+oldlsadate+'\n'
                             + ' oldlsadatelinkvalue:  '+oldlsadatelinkvalue+'\n'
                             + ' maxdate:  '+maxdate+'\n' 
                             + ' maxdatelinkvalue:  '+maxdatelinkvalue+'\n' 
                             + ' lsaURLlink:  '+lsaURLlink+'\n'
                             + ' activityArr:  '+activityArr+'\n' 
                            );
    
    
};//end 

/*
 * 
 */
lsans.ServerLibrary.getTimeZoneObj = function()
{
    var timezones = {
            'etc/gmt+12': -12.00,
            'pacific/samoa': -11.00,
            'pacific/honolulu': -10.00,
            'america/anchorage': -9.00,
            'america/los_angeles': -8.00,
            'america/tijuana': -8.00,
            'america/denver': -7.00,
            'america/phoenix': -7.00,
            'america/chihuahua': -7.00,
            'america/chicago': -6.00,
            'america/regina': -6.00,
            'america/guatemala': -6.00,
            'america/mexico_city': -6.00,
            'america/new_york': -5.00,
            'us/east-indiana': -5.00,
            'america/bogota': -5.00,
            'america/caracas': -4.50,
            'america/halifax': -4.00,
            'america/la_paz': -4.00,
            'america/manaus': -4.00,
            'america/santiago': -4.00,
            'america/st_johns': -3.50,
            'america/sao_paulo': -3.50,
            'america/buenos_Aires': -3.00,
            'etc/gmt+3': -3.00,
            'america/godthab': -3.00,
            'america/montevideo': -3.00,
            'america/noronha': -2.00,
            'etc/gmt+1': -2.00,
            'atlantic/azores': -1.00,
            'europe/london': 0.00,
            'atlantic/reykjavik': 0.00,
            'europe/warsaw': +1.00,
            'europe/paris': +1.00,
            'etc/gmt-1': +1.00,
            'europe/amsterdam': +1.00,
            'europe/budapest': +1.00,
            'africa/cairo': +2.00,
            'europe/istanbul': +2.00,
            'asia/jerusalem': +2.00,
            'asia/amman': +2.00,
            'asia/beirut': +2.00,
            'africa/johannesburg': +2.00,
            'europe/kiev': +2.00,
            'europe/minsk': +2.00,
            'africa/windhoek': +2.00,
            'asia/riyadh': +3.00,
            'europe/moscow': +3.00,
            'asia/baghdad': +3.00,
            'africa/nairobi': +3.00,
            'asia/tehran': +3.50,
            'asia/muscat': +4.00,
            'asia/baku': +4.00,
            'asia/yerevan': +4.00,
            'etc/gmt-3': +4.00,
            'asia/kabul': +4.50,
            'asia/karachi': +5.00,
            'asia/yekaterinburg': +5.00,
            'asia/tashkent': +5.00,
            'asia/calcutta': +5.50,
            'asia/katmandu': +5.75,
            'asia/almaty': +6.00,
            'asia/dhaka': +6.00,
            'asia/rangoon': +6.50,
            'asia/bangkok': +7.00,
            'asia/krasnoyarsk': +7.00,
            'asia/hong_kong': +8.00,
            'asia/kuala_Lumpur': +8.00,
            'asia/taipei': +8.00,
            'australia/perth': +8.00,
            'asia/irkutsk': +8.00,
            'asia/manila': +8.00,
            'asia/seoul': +9.00,
            'asia/tokyo': +9.00,
            'asia/yakutsk': +9.00,
            'australia/darwin': +9.50,
            'australia/adelaide': +9.50,
            'australia/sydney': +10.00,
            'australia/brisbane': +10.00,
            'australia/hobart': +10.00,
            'pacific/guam': +10.00,
            'asia/vladivostok': +10.00,
            'asia/magadan': +11.00,
            'pacific/kwajalein': +12.00,
            'pacific/auckland': +12.00,
            'pacific/tongatapu': +13.00
        };
    return timezones;
};//end

/**
 * Updates LSA custom fields and deletes LSA record
 * 
 * @param {string} type record Type
 * @param {number} recordId record Id
 * 
 */
lsans.ServerLibrary.UpdateCustomFields = function(type , recordId)
{
    var MSG_TITLE = 'UpdateCustomFields';
    var serverlogger = new lsans.GeneralLibrary.Logger(MSG_TITLE, false);
    if(onServerLog)
    {
        serverlogger.enable(); //comment this line to disable debug server
    }   
    
    serverlogger.debug(MSG_TITLE, 'UpdateCustomFields: start\nUSAGE: \n'
                             + ' nlapiGetContext().getRemainingUsage():  '+nlapiGetContext().getRemainingUsage()+'\n'
                             + ' type:  '+type+'\n'
                            );

	var lsaRecordId = '';
	var lsaPropertyArr = null;
	lsaPropertyArr = lsans.ServerLibrary.GetLSAProperties(type,recordId);

	// Get LSA Record
	lsaRecordId = lsans.ServerLibrary.getLSARecordId(lsaPropertyArr['entityOppId']);
	
		
	if(lsans.GeneralLibrary.isValidObject(lsaRecordId)){
		// Update LSA Custom Field
		var customLsaFields = new Array();
		customLsaFields.push('custrecord_date_lsa');
		customLsaFields.push('custrecord_link_lsa');
		customLsaFields.push('custrecord_link_name_lsa');
		
		var lsaRecord = nlapiLookupField('customrecord_lsa', lsaRecordId, customLsaFields );
		
		var lsaFields = new Array();
		lsaFields.push(lsaPropertyArr['lsaDateField']);
		lsaFields.push(lsaPropertyArr['lsaLinkField']);
		lsaFields.push(lsaPropertyArr['lsaLinkNameField']);
		var lsaValues = new Array();
		lsaValues.push(lsaRecord.custrecord_date_lsa);
		lsaValues.push(lsaRecord.custrecord_link_lsa);
		lsaValues.push(lsaRecord.custrecord_link_name_lsa);
		nlapiSubmitField(lsaPropertyArr['entityOppType'], recordId, lsaFields, lsaValues);

		
		// Delete LSA Record
		nlapiDeleteRecord('customrecord_lsa', lsaRecordId);

		serverlogger.debug(MSG_TITLE, 'UpdateCustomFields: END: \n'
	            + ' lsaRecord.custrecord_date_lsa:  '+lsaRecord.custrecord_date_lsa+'\n'
	            + ' lsaRecord.custrecord_link_lsa:  '+lsaRecord.custrecord_link_lsa+'\n'
	            + ' lsaRecord.custrecord_link_name_lsa:  '+lsaRecord.custrecord_link_name_lsa+'\n'
	            + ' lsaRecordId:  '+lsaRecordId+'\n'
	           );
	}


};
/**
 * Deletes the  LSA record
 * 
 * @param {string} type record Type
 * @param {number} recordId record Id
 * 
 */
lsans.ServerLibrary.DeleteLSARecord = function(type , recordId)
{
    var MSG_TITLE = 'DeleteLSARecord';
    var serverlogger = new lsans.GeneralLibrary.Logger(MSG_TITLE, false);
    if(onServerLog)
    {
        serverlogger.enable(); //comment this line to disable debug server
    }   
    
    serverlogger.debug(MSG_TITLE, 'DeleteLSARecord: start\nUSAGE: \n'
                             + ' nlapiGetContext().getRemainingUsage():  '+nlapiGetContext().getRemainingUsage()+'\n'
                             + ' type:  '+type+'\n'
                            );


	var lsaRecordId = '';
	var lsaPropertyArr = null;
	lsaPropertyArr = lsans.ServerLibrary.GetLSAProperties(type,recordId);

	lsaRecordId = lsans.ServerLibrary.getLSARecordId(lsaPropertyArr['entityOppId']);
	
	if(lsans.GeneralLibrary.isValidObject(lsaRecordId)){
		nlapiDeleteRecord('customrecord_lsa', lsaRecordId);
	}
    serverlogger.debug(MSG_TITLE, 'DeleteLSARecord: end\nUSAGE: \n'
            + ' nlapiGetContext().getRemainingUsage():  '+nlapiGetContext().getRemainingUsage()+'\n'
            + ' lsaRecordId:  '+lsaRecordId+'\n'
           );

};

/**
 * Updates LSA record if mode is equal to view otherwise updates custom fields
 * 
 * @param {string} type record Type
 * @param {number} recordId record Id
 * 
 */
lsans.ServerLibrary.UpdateLastSalesActivity = function(type , recordId, maxDate, recentActivityLink, recentActivityLabel)
{
    var MSG_TITLE = 'UpdateLastSalesActivity';
    var serverlogger = new lsans.GeneralLibrary.Logger(MSG_TITLE, false);
    if(onServerLog)
    {
        serverlogger.enable(); //comment this line to disable debug server
    }   
    

	var mode = '';
	var lsaRecordId = '';
	var lsaPropertyArr = null;
	lsaPropertyArr = lsans.ServerLibrary.GetLSAProperties(type,recordId);
	
	// Get LSA Record
	lsaRecordId = lsans.ServerLibrary.getLSARecordId(lsaPropertyArr['entityOppId']);
	
	var custLsaFields = new Array();
	custLsaFields.push(lsaPropertyArr['lsaDateField']);
	custLsaFields.push(lsaPropertyArr['lsaLinkField']);
	custLsaFields.push(lsaPropertyArr['lsaLinkNameField']);

	var lsaFields = new Array();
	lsaFields.push('custrecord_date_lsa');
	lsaFields.push('custrecord_link_lsa');
	lsaFields.push('custrecord_link_name_lsa');
	
	var lsaValues = new Array();
	lsaValues.push(maxDate);
	lsaValues.push(recentActivityLink);
	lsaValues.push(recentActivityLabel);

		
	if(lsans.GeneralLibrary.isValidObject(lsaRecordId))
	{
		// Get mode from LSA Record
		mode = nlapiLookupField('customrecord_lsa', lsaRecordId, 'custrecord_mode_lsa');

		
		if (mode == 'edit'){

			//Update LSA Record
			nlapiSubmitField('customrecord_lsa', lsaRecordId, lsaFields, lsaValues);

			serverlogger.debug(MSG_TITLE, 'UpdateLastSalesActivity: start\nUSAGE: \n'
		            + ' nlapiGetContext().getRemainingUsage():  '+nlapiGetContext().getRemainingUsage()+'\n'
		            + ' type:  '+type+'\n'
		            + ' mode:  '+mode+'\n'
		            + ' lsaRecordId:  '+lsaRecordId+'\n'
		            + ' maxDate:  '+maxDate+'\n'
		            + ' recentActivityLink:  '+recentActivityLink+'\n'
		            + ' recentActivityLabel:  '+recentActivityLabel+'\n'
		           );

		}
		else
		{
			// Update LSA Custom Field
			nlapiSubmitField(type, recordId, custLsaFields, lsaValues);
			
			
			// Delete LSA Record
			nlapiDeleteRecord('customrecord_lsa', lsaRecordId);

		}
	}
	else
	{
		nlapiSubmitField(type, recordId, custLsaFields, lsaValues);
		
	    serverlogger.debug(MSG_TITLE, 'UpdateLastSalesActivity: start\nUSAGE: \n'
	            + ' nlapiGetContext().getRemainingUsage():  '+nlapiGetContext().getRemainingUsage()+'\n'
	            + ' type:  '+type+'\n'
	            + ' mode:  '+mode+'\n'
	            + ' lsaRecordId:  '+lsaRecordId+'\n'
	            + ' maxDate:  '+maxDate+'\n'
	            + ' recentActivityLink:  '+recentActivityLink+'\n'
	            + ' recentActivityLabel:  '+recentActivityLabel+'\n'
	           );
	}
	

};

