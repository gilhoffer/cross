nlapiLogExecution("audit","FLOStart",new Date().getTime())
function FLOProcessAsst(request, response)
{
    //Retreive License Information and store details to License Manager record.
    var licenseOk;

    try {
        var licnumber = nlapiLookupField("customrecord_flo_license",1,"custrecord_flo_license_number") || "";
        if(!licnumber) {
            getNumber();
        }
         var licenseOk = licenseManager();
    } catch(e) {
      //2018-09-25 - LL - Log added below:
      nlapiLogExecution('audit', 'License exception caught', 'Check lic. records');
        licenseOk = 0;
    }
    
      nlapiLogExecution('audit', 'License check done', licenseOk);

   

    if (licenseOk == 0) {
        content = "<b>There is no valid license for the current user, please contact Flashlight@Strongpoint.io</b>";
    } else if (licenseOk == -1) {
      	content = "<b>Flashlight is not registered, please go to http://strongpoint.io/purchase to get your Flashlight instance ready to use.</b>";
    } else {
        var context=nlapiGetContext();
        //Calculate the path for the entry screens
        var company=context.getCompany();
        var bundle=36969;
        var docPathSrch=nlapiLoadSearch("","customsearch_flo_base_path");
        docPathSrch=nlapiSearchRecord(docPathSrch.getSearchType(),"customsearch_flo_base_path");
        var doc=docPathSrch[0];
        var columns=doc.getAllColumns();
        var path=doc.getValue(columns[4]);
        //Calculate the stage
        var stageaddon="";//used to store instructions about which interface to go to (spider, process, erd) based on the deployment.
        var stage=context.getSetting("SCRIPT","custscript_flo_entry_stage");
        if(stage!=null && stage!=""){

            stageaddon="?STAGE="+stage;
            if(stage == "spider") {
                try {
                    var filefilter = [];
                    filefilter.push(new nlobjSearchFilter("name",null,"is",company+"-flospideredobjects.txt"));

                    var filesearch = nlapiSearchRecord("file",null,filefilter);
                    if(filesearch != null && filesearch[0] !=null) {
                       var file = nlapiLoadFile(filesearch[0].getId());
                       var comprec = JSON.parse(file.getValue());
                       var warning = "";
                       if(comprec && comprec.rectypes) {
                            var unfinished = [];
                            for(var r in comprec.rectypes) {
                                if(comprec.rectypes[r] == "0") {
                                    unfinished.push(toTitleCase(r));
                                }
                            }
                            
                            if(unfinished.length > 0) {
                                warning = unfinished.join(", ");
                            }
                       }
                       var lastcompleted = "";
                       if(comprec.rec) {
                            lastcompleted = comprec.rec +" at "+comprec.time;
                       }
                       stageaddon += "&lastcompleted="+escape(lastcompleted);
                       stageaddon += "&warning="+escape(warning);
                    } else {
                        stageaddon += "&lastcompleted=";
                        stageaddon += "&warning=";
                    }
                } catch(e) {
                    stageaddon += "&lastcompleted=";
                    stageaddon += "&warning=";
                }
            } else if(stage=="custframe") {
                var customizationid = request.getParameter("customizationid");
                if(customizationid!=null && !isNaN(customizationid)) {
                    stageaddon += "&customizationid="+customizationid;
                }
            }

        }
        

        var autoSpiderUrl=nlapiResolveURL('SUITELET','customscript_getfields_server_side',1);
        autoSpiderUrl=autoSpiderUrl+"&update=T&targetRec=all&rqXML=F&portlet=T";

       content='<iframe name="processasst" id="processasst" frameborder="0" height="1000" xwidth="1400" src="" seamless></iframe>';

        content+='<script>document.getElementById("processasst").width=top.window.innerWidth-20;document.getElementById("processasst").src=window.location.href.split("netsuite.com")[0]+"netsuite.com/c.'+company+path+stageaddon+'";</script>';
        //content+='<script>document.getElementById("processasst").src=window.location.href.split("netsuite.com")[0]+"netsuite.com/c.'+company+'/suitebundle'+bundle+'/FLO%20Social%20Process%20Improvement/FLOEntryScreens.html";</script>';
        if(typeof stage =="undefined" || stage!='spider'){
              //  content+='<iframe name="processasst" id="autospiderTopLevel" frameborder="0" height="1" width="1" src="" style="display:none;" seamless></iframe>';
            //content+='<script>document.getElementById("autospiderTopLevel").src="'+autoSpiderUrl+'";</script>';
        }
        content+='<script>document.getElementById("processasst").src=window.location.href.split("netsuite.com")[0]+"netsuite.com/c.'+company+path+stageaddon+'";</script>';

        //portlet.setHtml( content );
        //portlet.setTitle("FLODocs<subscript>&trade;</subscript> Documentation and Process Management");
    }
    
    thisForm=nlapiCreateForm("Strongpoint", false);
    thisForm.setTitle("Strongpoint");
    flobody=thisForm.addField("flobody","inlinehtml","");
    flobody.setDefaultValue(content);
    response.writePage(thisForm);

}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}