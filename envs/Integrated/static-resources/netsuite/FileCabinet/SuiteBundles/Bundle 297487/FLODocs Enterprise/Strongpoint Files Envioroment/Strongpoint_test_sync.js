function addTabSource(type,form){
  try{
    var record = nlapiGetNewRecord();
    var firstTab = form.addTab('custpage_comparison', 'Sync Tool');
    //Add a text field to the first tab.
    //form.addFieldGroup('custpage_comparison', "Name");
    var urlFile='';
    var searchResultFile = nlapiSearchRecord("file",null,[new nlobjSearchFilter("name",null,"is","download.gif")],null);
    if(searchResultFile && searchResultFile.length){
      var filterFile=nlapiLoadFile(searchResultFile[0].getId());
      urlFile = filterFile.getURL();
    }

    targetselect = form.addField('custpage_flo_enviornments', 'select','Target','customrecord_flo_environment','custpage_comparison');
    //targetselect.setBreakType('startcol');
    targetselect.setHelpText('Select or create a new FLO Environment Record to autopopulate target Account ID and Sandbox fields');
    
    //ChangeRequestSend = form.addField('custpage_change_to_send', "longtext","Change To Source","customrecord_flo_change_to_send","custpage_comparison");
    //ChangeRequestSend.setHelpText('Numbers of change request separate by coma to send in target environment.</br></br>You can leave this field blank.</br>InternalID: custpage_change_to_send');

    email2 = form.addField('custpage_email2', 'email', 'Target Email',null,'custpage_comparison').setBreakType('startcol');
    //email2.setBreakType('startcol');
    email2.setHelpText('Email to be used for authentication in target environment.</br></br>You can leave this field blank when the credentials for source environment are the same.');
    pwd2 = form.addField('custpage_password2', 'password', 'Target Password',null,'custpage_comparison').setMaxLength(30);
    //pwd2.setBreakType('startcol');
    pwd2.setHelpText('Password to be used for authentication in target environment.</br></br>You can leave this field blank when the credentials for source environment are the same.');
    accttgt = form.addField('custpage_accounttarget', 'text', 'Account ID Target',null,'custpage_comparison');
    accttgt.setBreakType('startcol');
    accttgt.setHelpText('Enter the account ID for the environment that\'s going to be used as target for the comparison.');


    accttgtrole = form.addField('custpage_accounttargetrole', 'select', 'Account Target Role','customrecord_flo_account_roles','custpage_comparison')
    //accttgtrole.setBreakType('startcol');
    accttgtrole.setHelpText('Select the role to be used for authentication in target environment.</br></br>You can leave this field blank when the role for target environment is the same.');
    envcheck2 = form.addField('custpage_flo_enviornmentcheck2', 'checkbox','Sandbox',null,'custpage_comparison');
   // envcheck2.setBreakType('startcol');
    envcheck2.setHelpText('This box should be checked when target environment is a Sandbox account.');

    var suiteletUrl = nlapiResolveURL('SUITELET','customscript_flo_get_rest_change_request','customdeploy_call_rest');
    nlapiLogExecution("DEBUG","suitelet url",suiteletUrl)

    var buttonHtmlPull='<button id="pull" style="display:none" onClick="callRest(); return false;">Pull</button>';//window.open(\'/app/site/hosting/scriptlet.nl?script=1074&deploy=1&changeRequest='+nlapiGetRecordId()+'&action=pull&idArray='+nlapiGetFieldValue("custpage_change_to_send")+'\',\'\',\'width=440, height=500\')
    buttonHtmlPull+='<script>function callRest(){var record = nlapiLoadRecord("customrecord_flo_change_request",nlapiGetRecordId());'
    buttonHtmlPull+='var iframe = document.createElement("iframe");'
    buttonHtmlPull+='iframe.style.display = "none";'
    buttonHtmlPull+='iframe.src="'+suiteletUrl+'&changeRequest='+nlapiGetRecordId()+'&action=pull&idArray="+nlapiGetFieldValue(\'custpage_change_to_send\')+"&target="+nlapiGetFieldValue(\'custpage_flo_enviornments\')+"&accountIdTarget="+nlapiGetFieldValue(\'custpage_accounttarget\')+"&email="+nlapiGetFieldValue(\'custpage_email2\')+"&pass="+nlapiGetFieldValue(\'custpage_password2\')+"&acctRole="+nlapiGetFieldText(\'custpage_accounttargetrole\')+"&isSandbox="+nlapiGetFieldValue(\'custpage_flo_enviornmentcheck2\')+"&path="+nlapiGetFieldValue(\'custpage_path\');';
    buttonHtmlPull+='document.body.appendChild(iframe);}</script>'
    buttonHtmlPull+='<style type="text/css">';
    buttonHtmlPull+='.x-window-dlg .ext-mb-download {';
    buttonHtmlPull+='background:transparent url('+urlFile+') no-repeat top left;';
    buttonHtmlPull+='height:46px;}</style>';



    var buttonHtmlPush='<button class="btn-primary" style="color: #fff;background-color: #337ab7;border-color: #2e6da4;" id="push" onClick="callRestWithOut(); return false;">Push</button>';//window.open(\'/app/site/hosting/scriptlet.nl?script=1074&deploy=1&changeRequest='+nlapiGetRecordId()+'&action=pull&idArray='+nlapiGetFieldValue("custpage_change_to_send")+'\',\'\',\'width=440, height=500\')
    buttonHtmlPush+='<script>function callRestWithOut(){var record = nlapiLoadRecord("customrecord_flo_change_request",nlapiGetRecordId());'
    buttonHtmlPush+='var iframe = document.createElement("iframe");'
   // buttonHtmlPush+='if(!nlapiGetFieldValue(\'custpage_email2\'))alert("Email is required")return;'
    buttonHtmlPush+='iframe.style.display = "none";'
    buttonHtmlPush+='iframe.src="'+suiteletUrl+'&changeRequest='+nlapiGetRecordId()+'&action=push&idArray="+nlapiGetFieldValue(\'custpage_change_to_send\')+"&target="+nlapiGetFieldValue(\'custpage_flo_enviornments\')+"&accountIdTarget="+nlapiGetFieldValue(\'custpage_accounttarget\')+"&email="+nlapiGetFieldValue(\'custpage_email2\')+"&pass="+nlapiGetFieldValue(\'custpage_password2\')+"&acctRole="+nlapiGetFieldText(\'custpage_accounttargetrole\')+"&isSandbox="+nlapiGetFieldValue(\'custpage_flo_enviornmentcheck2\')+"&path="+nlapiGetFieldValue(\'custpage_path\');';
    buttonHtmlPush+='document.body.appendChild(iframe);}</script>'
    buttonHtmlPush+='<style type="text/css">';
    buttonHtmlPush+='.x-window-dlg .ext-mb-download {';
    buttonHtmlPush+='background:transparent url('+urlFile+') no-repeat top left;';
    buttonHtmlPush+='height:46px;}</style>';
    //targetselect = form.addField('custpage_flo_enviornments_button', 'inlinehtml','Target button','customrecord_flo_environment_button','custpage_comparison');
    button = form.addField('custpage_flo_enviornments_buttonpull', 'inlinehtml',null,null,'custpage_comparison').setDefaultValue(buttonHtmlPull);
    button2 = form.addField('custpage_flo_enviornments_buttonpush', 'inlinehtml',null,null,'custpage_comparison').setDefaultValue(buttonHtmlPush);
    form.setScript("customscript_flo_pop_uo_sync_tool");

  }catch(e){
    nlapiLogExecution("DEBUG","DEBUG",e)
  }
}

function call_rest(params) {




    var idToSend=params.getParameter('idArray');
    var changeRequestId=params.getParameter('changeRequest')||null;
    var action=params.getParameter('action');
    var email = params.getParameter('email');
    var pass = params.getParameter('pass');
    var sandbox = params.getParameter('isSandbox');
    var accountIdTarget = params.getParameter('accountIdTarget');
    var acctRole = params.getParameter('acctRole');//myRoles[params.getParameter('acctRole').toUpperCase()];
    var path=params.getParameter('path');


      if(!accountIdTarget){
          response.write("<script>alert('Account is required')</script>");
          return;
        };
        if(!email){
          response.write("<script>alert('Password is required')</script>");
          return ;
        };
        if(!pass){
          response.write("<script>alert('Account Target is required')</script>");
          return;
        };
        if(!acctRole){
          response.write("<script>alert('Role Target is required')</script>");
          return ;
        };


    if(action=="pull" && idToSend){
      if(idToSend.indexOf(',')!=-1){
        idToSend=idToSend.split(',');
      }else{
        idToSend=[idToSend];
      }
    }

    var parentChangeRequest=nlapiLoadRecord('customrecord_flo_change_request',changeRequestId);
    var parentParentCR = parentChangeRequest.getFieldValue('custrecord_flo_parent_cr')||null;
    //crSend is the cr to send in format string and assign the parent cr field with name

    if(parentParentCR && parentParentCR!=null){
      // try{
      //   var namePr=nlapiLookupField('customrecord_flo_change_request',parentParentCR,'name');
      //   crSend.fields.customrecord_flo_change_request=namePr;
      // }catch(e){
      //   nlapiLogExecution('DEBUG', 'tryng look up field', e);
      // }

    }

    if(action=="pull"){
      var obj={
        internalid:idToSend
        ,action:action
      }
    }else{
      nlapiLogExecution("DEBUG","DEBUG","PUSH: " + changeRequestId)
      var customizationsSend=parentChangeRequest.getFieldValues('custrecord_flo_cust_change')||null;

      if(customizationsSend)customizationsSend=customizationsSend.join(",").split(",");
      nlapiLogExecution("DEBUG","customizationsSend","customizationsSend: " + customizationsSend)
      if(customizationsSend && customizationsSend.length){
        customizationsSend = getCustomizations(customizationsSend);
      }


      // crSend=JSON.parse(crSend);
      // crSend.custrecord_flo_cust_change = customizationsSend;

      var obj={
         changeRequest:JSON.stringify(parentChangeRequest),
         action:action,
         customizationsSend:JSON.stringify(customizationsSend),
         changeLogs:getChangesLogs(changeRequestId),
         testRecords:getTestRecords(changeRequestId),
         systemNotes:getSystemNotes(changeRequestId),
         sourceAccount:nlapiGetContext().getCompany()
      }
    }

    var accountid = accountIdTarget;//TSTDRV1160871
    var useremail = email;
    var password = pass;

      

    var objectUSER = getPath(email,pass,accountIdTarget,sandbox);

    if(!objectUSER.dataCenterURLs){
      var message = 'window.parent.Ext.MessageBox.show({msg:"Wrong Credentials",width:300,});';
      response.write("<script>window.parent.Ext.MessageBox.hide();"+message+";window.parent.document.getElementById('_cancel').click()</script>")
      return;
    }

    var pathUrl=objectUSER.dataCenterURLs.restDomain;
    pathUrl += "/app/site/hosting/restlet.nl?script=customscript_flo_get_change_request&deploy=customdeploy_flo_get_change_request";

    acctRole=getRole(objectUSER.roles,acctRole);
    nlapiLogExecution("DEBUG","acctRole",JSON.stringify(acctRole))

    var headers = {

      "Accept": "*/*",
      "Authorization": "NLAuth nlauth_account="+accountid+",nlauth_email="+useremail+",  nlauth_signature="+password+",nlauth_role="+acctRole,
      "Accept-Language": "en-us",
      "Content-Type": "application/json"};
      //'https://rest.na1.netsuite.com/app/site/hosting/restlet.nl?script=customscript_flo_get_change_request&deploy=1'
      try{
        nlapiLogExecution("DEBUG","changeRequest","changeRequest")
        var changeRequest=nlapiRequestURL(pathUrl,JSON.stringify(obj),headers,null,'POST');

      }catch(e){
        nlapiLogExecution('DEBUG', 'Test string', e.toString());
        if(e.toString().indexOf("SSS_CONNECTION_TIME_OUT")!=-1 ||e.toString().indexOf("SS_REQUEST_TIME_EXCEEDED")!=-1 ){
          var changeRequestNew=nlapiCreateRecord('customrecord_flo_change_request');
          changeRequestNew.setFieldValue("custrecord_flo_parent_cr",changeRequestId);
          createWarning(e,parentChangeRequest.getId(),"");
          var idChange = nlapiSubmitRecord(changeRequestNew,false,true);
          nlapiLogExecution('DEBUG', 'E---', e);
          nlapiLogExecution('DEBUG', 'idChange for timeout', idChange);
          var url = nlapiResolveURL('RECORD', 'customrecord_flo_change_request', parentChangeRequest.getId());
          //response.write("<script>window.parent.Ext.MessageBox.hide();window.parent.location.href='"+url+"';</script>")
          var message = 'window.parent.Ext.MessageBox.show({msg:"'+e.toString()+'",width:300,});';
          response.write("<script>window.parent.Ext.MessageBox.hide();"+message+";window.parent.document.getElementById('_cancel').click()</script>")
          return;
        }
      }


      if(action=="push"){
      
        var url = nlapiResolveURL('RECORD', 'customrecord_flo_change_request', parentChangeRequest.getId());
        //response.write("<script>window.parent.Ext.MessageBox.hide();window.parent.location.href='"+url+"';</script>")
        var message = 'window.parent.Ext.MessageBox.show({msg:"Your Data was sent!",width:300,});';
        response.write("<script>window.parent.Ext.MessageBox.hide();"+message+";window.parent.document.getElementById('_cancel').click()</script>")

        return;
      }
     
  }


function getChangesLogs(getChangesLogs){
  return {};
}

function getSystemNotes(internalid){
try{
var searchFilters =
        [
         ['internalid', "is", internalid]
        ];

       var recordSearch =nlapiSearchRecord('customrecord_flo_change_request',"customsearch_change_request_system_notes",searchFilters,null);
       var returnData=[];
        

      var length = 0;
      if(searchResult.length && searchResult.length>5){
          length=5
      }else{
        length=searchResult.length;
      }

    for (var i = 0; i < length; i++) {
         var result =  searchResult[i];
       
         var columns=result.getAllColumns();
         returnData.push({
             context:result.getFieldValue(columns[1])
            ,date:result.getFieldValue(columns[2])
            ,field:result.getFieldValue(columns[3])
            ,newValue:result.getFieldValue(columns[4])
            ,oldValue:result.getFieldValue(columns[5])
            ,relatedCr:result.getId()
            ,recordType:result.getFieldValue(columns[7])
            ,role:result.getFieldValue(columns[8])
            ,setBy:result.getFieldValue(columns[9])
            ,type:rresult.getFieldValue(columns[10])
            });
         
    }
    return returnData;
  
  }catch(e){
 
  }
}


  function searchCustomizations(x,value,changeRequestNew,parentChangeRequest){
    if(value && value.length){
     value = value.filter(Boolean);
     var submitArray=[];
     var notFound=[];

     for (var r = 0; r < value.length; r++) {
          var searchRecord = nlapiSearchRecord('customrecord_flo_customization',null,[new nlobjSearchFilter('name',null,'is',value[r].name)],null);
         
          if(searchRecord && searchRecord.length)
          {
            
           var inactive = isInactive(searchRecord[0].getRecordType(),searchRecord[0].getId());
           nlapiLogExecution("DEBUG","INCACTIVE",inactive)
           if(!inactive)
             {
                submitArray.push(searchRecord[0].getId());
             }
             else
             {
                nlapiLogExecution("DEBUG","ELSE","ELSE")
                createWarning("Customization is Inactive: "+value[r].name,parentChangeRequest.getId(),"");
                //notFound.push(value[r].id)
             }

          }
          else
          {
           notFound.push(value[r].id)
          }
     }

      changeRequestNew.setFieldValues(x,submitArray);
     if(notFound.length)
       {
          nlapiLogExecution("DEBUG","notFound notFound",notFound)
          changeRequestNew.setFieldValue('custrecord_flo_cr_proposed_cust',notFound.toString());
          createWarning("Customizations not Found: "+ notFound.toString(),parentChangeRequest.getId(),"");
       }
    }
  }

  function getCustomizations(customizationsDefaultArray){
    try{
      var customizationsArray=[];
      for (var xd = 0; xd < customizationsDefaultArray.length; xd++) {
          nlapiLogExecution("ERROR","customizationsDefaultArray",customizationsDefaultArray[xd])
          if(!customizationsDefaultArray[xd] || customizationsDefaultArray[xd]=="")continue;
          var myName=nlapiLookupField("customrecord_flo_customization",customizationsDefaultArray[xd],"name");
          var scriptId=nlapiLookupField("customrecord_flo_customization",customizationsDefaultArray[xd],"custrecord_flo_cust_id");
          var custObj={
                 name:myName
                 ,id:scriptId
          }
          nlapiLogExecution("ERROR","myName",myName)
          customizationsArray.push(custObj)
      }
       
      return customizationsArray;
    }catch(e){
      nlapiLogExecution("ERROR","error",e)
    }

  }

  function searchValueList(type,value){
    var search = nlapiSearchRecord(type,null,null,[new nlobjSearchColumn("name",null,null)]);
    var flag=false;
    var returnVal=null;
    for (var i = 0; i < search.length&&!flag; i++) {
      if(search[i].getValue("name")==value){
        flag=true;
        returnVal=search[i].getId()
      }
    }

    return returnVal;
  }

  function getProcessIssue(changeRequest)
  {
    var searchFilters = 
          [
            ['custrecord_flo_change_request', "is",changeRequest]
          ];

    var searchResult = nlapiSearchRecord('customrecord_process_issue',null,searchFilters,null);

      var returnData=[];

           for (var i = 0; searchResult && i < searchResult.length; i++) {
                var result = searchResult[i];

                var objRecord = nlapiLoadRecord('customrecord_process_issue',result.getId());
                var processObject={
                  name : objRecord.getFieldValue('name'),
                  status: objRecord.getFieldValue('custrecord_flo_issue_status'),
                  type: objRecord.getFieldValue('custrecord_flo_severity')
                }

                returnData.push(processObject);
           }


        return returnData;


  }

     function getTestRecords(changeRequest){
       try{

      
       var searchFilters = 
                    [
                      ['custrecord_flo_change_tested', "anyof",changeRequest]
                    ];

           var searchResult = nlapiSearchRecord('customrecord_flo_test_report',null,searchFilters,null);
           var returnData=[];

           for (var i = 0; searchResult && i < searchResult.length; i++) {
                var result = searchResult[i];


                var objRecord = nlapiLoadRecord('customrecord_flo_test_report',result.getId());


                var myChangeType = objRecord.getFieldText('custrecord_flo_change_type');
                var haveTestTemplate = objRecord.getFieldValue('custrecord_flo_test_template');

                var parentTemplate=objRecord.getFieldValue('custrecord_flo_test_parent');
                var testObj=JSON.stringify(objRecord);
                testObj=JSON.parse(testObj);


                if(haveTestTemplate){
                     var newTest = nlapiLoadRecord("customrecord_flo_test_report",haveTestTemplate);
                     //field type text in test template
                     var myChangeTypeNew = newTest.getFieldText('custrecord_flo_change_type');

                     var statusNewTest=newTest.getFieldText('custrecord_flo_test_status');
            
                     //defined text fields
                     var newTestString=JSON.stringify(newTest);
                     
                     newTestString=JSON.parse(newTestString);
                     newTestString.custrecord_flo_change_type=myChangeTypeNew;

                     testObj.custrecord_flo_change_type=myChangeType;
                     // testObj.fields.custrecord_flo_test_template=JSON.stringify(newTestString);
                     // if(parentTemplate==haveTestTemplate) testObj.fields.custrecord_flo_test_parent=JSON.stringify(newTestString);
                }
                //get content file in current test record
                var file = getFileContent(result.getId());
                testObj.file=file;
                
                //get proess Issue
               // var processIssues = getProcessIssue(result.getId());
                //testObj.processIssue=processIssues;

                returnData.push(testObj);
           }

        nlapiLogExecution("DEBUG","returnData",JSON.stringify(returnData))
        return returnData;
      }catch(e){
          nlapiLogExecution("DEBUG","ERROR --- Test record",e)
           return [];
       }

     }

  function getFileContent(id)
  {
    var searchResult = nlapiSearchRecord(null,'customsearch_strongpoint_get_file_id',["internalid","is",id],null);
    if(!searchResult)return {};

    var columns = searchResult[0].getAllColumns();
    var id = searchResult[0].getValue(columns[1]);
    var type = searchResult[0].getValue(columns[2]);
    var name = searchResult[0].getValue(columns[3]);
    var file = nlapiLoadFile(id);
    
    return {type:type, content:file.getValue(),name:name}
  }
  
  function getProcessIssue(id)
  {
    var returnData=[];

    var searchResult = nlapiSearchRecord('customrecord_process_issue',null,
    ["custrecord_flo_test_report","is",id],
        [
            new nlobjSearchColumn("name",null,null), 
            new nlobjSearchColumn("custrecord_flo_issue_status",null,null), 
            new nlobjSearchColumn("custrecord_flo_pi_number",null,null), 
            new nlobjSearchColumn("custrecord_flo_issue_description",null,null),
            new nlobjSearchColumn("custrecord_flo_pi_external_ticket",null,null), 
            new nlobjSearchColumn("custrecord_flo_pi_external_ticket_link",null,null), 
            new nlobjSearchColumn("custrecord_flo_issue_description",null,null)
        ]
  );
    if(searchResult && searchResult.length)
      {
        for(var i=0;i<searchResult.length;i++)
          {
            var columns=searchResult[0].getAllColumns();
           var object = 
           {
             name:searchResult[0].getValue(columns[0]),
             custrecord_flo_issue_status:searchResult[0].getValue(columns[1]),
             custrecord_flo_pi_number:searchResult[0].getValue(columns[2]),
             custrecord_flo_issue_description:searchResult[0].getValue(columns[3]),
             custrecord_flo_pi_external_ticket:searchResult[0].getValue(columns[4]),
             custrecord_flo_pi_external_ticket_link:searchResult[0].getValue(columns[5]),
             custrecord_flo_issue_description:searchResult[0].getValue(columns[6])
           } 
          }
          returnData.push(object);
      }

      return returnData;
  }

  function searchApproversNotFound(x,value,changeRequestNew,parentChangeRequest){
    value = value.filter(Boolean);
    var submitArray=[];
    var notFound=[];
    for (var r = 0; r < value.length; r++)
    {
      var searchRecord = nlapiSearchRecord('employee',null,[new nlobjSearchFilter('email',null,'is',value[r])],null);
      if(searchRecord && searchRecord.length){
        submitArray.push(searchRecord[0].getId());
      }
      else
      {
        notFound.push(value[r]);
      }

    }
    changeRequestNew.setFieldValues(x,submitArray);
    if(notFound.length)
    {
      createWarning("Approver(s) not Found: "+ notFound.toString(),parentChangeRequest.getId(),"");
    }
  }

  function searchNotFoundProcess(x,message,value,changeRequestNew,parentChangeRequest){
    value = value.filter(Boolean);
    var submitArray=[];
    var notFound=[];
      for (var r = 0; r < value.length; r++)
        {
           var searchRecord = nlapiSearchRecord('customrecord_flo_process',null,[new nlobjSearchFilter('name',null,'is',value[r])],null);
           if(searchRecord && searchRecord.length){
              submitArray.push(searchRecord[0].getId());
            }
            else
            {
              notFound.push(value[r]);
            }

        }
       changeRequestNew.setFieldValues(x,submitArray);
      if(notFound.length)
      {
        createWarning("Flo Process not Found: "+ notFound.toString(),parentChangeRequest.getId(),"");
      }
  }


  function searchRecord(record,type,value){
    if(!value)return null;
    return nlapiSearchRecord(record,null,[new nlobjSearchFilter(type,null,'is',value,null)],null);
  }

  function searchMultiple(type,filter,array){
    nlapiLogExecution("DEBUG","type search",type)
    if(!array.length)return [];
    var ss = nlapiSearchRecord(type,null,[new nlobjSearchFilter(filter,null,'anyof',array),new nlobjSearchFilter("isinactive",null,'is',"F")],null);
    var retorno = [];
    if(ss){
      for (var i = 0; i < ss.length; i++) {
          retorno.push(ss[i].getId());
      }
    }
    return retorno;

  }

  function searchPoli(type,filter,value){

    var submitArray=[];
    for (var r = 0; r < value.length; r++)
    {
      var searchRecord = nlapiSearchRecord('customrecord_flo_policy',null,[new nlobjSearchFilter('name',null,'is',value[r])],null);
      if(searchRecord && searchRecord.length){

        var inactive = isInactive(searchRecord[0].getRecordType(),searchRecord[0].getId());
        if(!inactive)
        {
          submitArray.push(searchRecord[0].getId());
        }

      }


    }
    return submitArray;
  }

  function createChangeLogSystemNotes(objData,parentChangeRequest){
    try{
      for (var i = 0; i < objData.length; i++) {
        var changeLog = nlapiCreateRecord('customrecord_flo_change_log');
        changeLog.setFieldValue("name","System Notes for: "+parentChangeRequest);
        changeLog.setFieldValue("custrecord_flo_resolution_cr",objData[i].relatedCr);
        changeLog.setFieldValue("custrecord_flo_old_value",objData[i].oldValue);
        changeLog.setFieldValue("custrecord_flo_field_new_value",objData[i].newValue);
        changeLog.setFieldValue("custrecord_flo_field_name","System Notes");
        changeLog.setFieldValue("custrecord_flo_change_log_user",objData[i].setBy);
        changeLog.setFieldValue("custrecord_flo_resolution_cr",parentChangeRequest);

        nlapiSubmitRecord(changeLog);
      }
    }catch(e){
      nlapiLogExecution('DEBUG','DEBUG',e);
    }

  }

  function createLog(objData,parentChangeRequest){
    for (var i = 0; i < objData.length; i++) {
      var logObject=objData[i];
      var changeLog = nlapiCreateRecord('customrecord_flo_change_log');

      for (var k in logObject) {
        if (logObject.hasOwnProperty(k)) {
          var valueInObj = logObject[k];
          if(k!="id"){
            changeLog.setFieldValue(k,valueInObj);
          }
          if(k=="sublists"){
            for (var f in changeObject.sublists[d]){
              var value = changeObject.sublists[d][f];

            }
          }else if(k=="fields"){
            for (var x in logObject.fields) {
              var value=logObject.fields[x];
              if(x !='customform' && x !='rectype' && x!='custrecord_flo_change_type' && x!='owner' && x!= 'id' && x!='scriptid'){
                if(x=="custrecord_flo_customization_record"){
                  if(value){
                    value=JSON.parse(value);
                    var searchRecord = nlapiSearchRecord('customrecord_flo_customization',null,[new nlobjSearchFilter('name',null,'is',value.name)],null);
                    if(searchRecord && searchRecord.length){
                      changeLog.setFieldValue(x,searchRecord[0].getId());
                    }else{
                      createWarning("No Customization Found in changeLog",parentChangeRequest.getId(),"");
                    }
                  }



                }else if(x=="custrecord_flo_user_link"){
                  var searchRecord = nlapiSearchRecord('employee',null,[new nlobjSearchFilter('email',null,'is',value)],null);
                  if(searchRecord && searchRecord.length)
                  {
                    changeLog.setFieldValue(x,searchRecord[0].getId());
                  }
                  else
                  {
                    createWarning("No User Found in change Log",parentChangeRequest.getId(),"");
                  }


                }else if(x=="owner"){
                  var searchRecord = nlapiSearchRecord('employee',null,[new nlobjSearchFilter('email',null,'is',value)],null);
                  if(searchRecord && searchRecord.length){
                    changeLog.setFieldValue(x,searchRecord[0].getId());
                  }else{
                    createWarning("No Owner Found",parentChangeRequest.getId(),"");
                  }

                }else{
                  changeLog.setFieldValue(x,value);
                }

              }

            }
          }

        }
      }
      changeLog.setFieldValue('custrecord_flo_resolution_cr',parentChangeRequest.getId());
      try{
        var idChange = nlapiSubmitRecord(changeLog,false,true);
        nlapiLogExecution("DEBUG","id Changelog" , idChange)
      }catch(e){
        nlapiLogExecution("DEBUG","ERROR" , e)
      }


    }
  }



  function isInactive(type,id){
    return nlapiLookupField(type,id,'isinactive')=='T';
  }

  function searchsRecordsInAccount(value,typeRecord,filterName){
    var myObj={
      submitArray:[]
      ,notFound:[]
    }

    var searchRecord = nlapiSearchRecord(typeRecord,null,[new nlobjSearchFilter(filterName,null,'is',value),new nlobjSearchFilter("isinactive",null,'is',"F")],null);

    if(searchRecord && searchRecord.length){
      myObj.submitArray.push(searchRecord[0].getId());
    }
    else
    {
      if(value!=0){
        myObj.notFound.push(value);
      }

    }
    return myObj;
  }

  function getRole(roles,roleSelected){
    var id = "";
    var con=false;
    for (var i = 0; i < roles.length && !con; i++) {
      if(roles[i].name.toUpperCase()==roleSelected.toUpperCase()){
        con=true;
        nlapiLogExecution("DEBUG","roles",roles[i]);
        id=roles[i].internalId;
      }
    }
    return id;
  }

  function getPath(email,pass,account,sandbox) {
    try{

      var rsturl = "";

      var headers = [];
      headers['Authorization'] = "NLAuth nlauth_email="+email+", nlauth_signature="+pass;
      headers['Content-Type'] = 'application/json';
      // headers["Access-Control-Allow-Origin"]="*";
      var datacenterUrl="https://rest.netsuite.com/rest/roles"
      nlapiLogExecution("DEBUG", "sandbox", sandbox)
      if(sandbox == "true"){
        datacenterUrl="https://rest.sandbox.netsuite.com/rest/roles";
      }
      var returnData={
        roles:[],
        dataCenterURLs:{}

      }

      var response = nlapiRequestURL("https://rest.netsuite.com/rest/roles",null,headers,'GET');

      var jsonResponse=JSON.parse(response.body);

      for (var i = 0; i < jsonResponse.length; i++) {
        if(jsonResponse[i].account.internalId==account){
          var json = jsonResponse[i];
          returnData.roles.push(json.role);
          returnData.dataCenterURLs=json.dataCenterURLs;
        }
      }
      nlapiLogExecution("DEBUG","return Data",JSON.stringify(returnData))
      return returnData;
    }catch(e){
      nlapiLogExecution("DEBUG","ERROR",e)
    }
  }
  function createWarning(msg,idParent,targetAccount){
    var date = new Date();

    var recordWarning = nlapiCreateRecord('customrecord_warning_log');
    recordWarning.setFieldValue('custrecord_error_details',msg);
    recordWarning.setFieldValue('name',msg);
    recordWarning.setFieldValue('custrecord_date',(date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear());
    recordWarning.setFieldValue('custrecord_target_account',targetAccount);
    recordWarning.setFieldValue('custrecord_change_request',idParent);
    nlapiSubmitRecord(recordWarning,true,true);

  }

  function getEnvioroment(type,name){
    if(name=='custpage_flo_enviornments'){
      var envid = nlapiGetFieldValue('custpage_flo_enviornments')||null;
      if(!envid)return;
      var envrecord = nlapiLoadRecord("customrecord_flo_environment",envid);
      var accId = envrecord.getFieldValue("custrecord_flo_account_id");
      nlapiSetFieldValue("custpage_accounttarget",accId);
    }
  }
