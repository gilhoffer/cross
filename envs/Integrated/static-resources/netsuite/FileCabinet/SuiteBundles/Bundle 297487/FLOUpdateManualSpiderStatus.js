function updateManualSpiderStatus() {
	try {
		//Set Configuration Fields
        var filesinspiderfolder = nlapiSearchRecord(null,"customsearch_flo_spider_files");
        var filescount = 0;
        if(filesinspiderfolder != null && filesinspiderfolder.length > 0) {
           filescount = filesinspiderfolder.length;
        }

        var qfilters = [];
        qfilters.push(new nlobjSearchFilter('name', 'script','startswith', "Strongpoint "));
        qfilters.push(new nlobjSearchFilter('queueid', null,'notequalto', "1"));
        qfilters.push(new nlobjSearchFilter('isdeployed', null,'is', "T"));
        qfilters.push(new nlobjSearchFilter('formulatext', 'null','is', "SCHEDULED"));
        qfilters[3].setFormula('{script.scripttype}')
        var queuenot1 =  nlapiSearchRecord('scriptdeployment',null, qfilters);
        var hasqueuenot1 = "F";
        if(queuenot1 != null && queuenot1.length > 0) {
           hasqueuenot1 = "T";
        }

        

        var notflofilters = [];
        notflofilters.push(new nlobjSearchFilter('name', 'script','doesnotstartwith', "Strongpoint "));
        notflofilters.push(new nlobjSearchFilter('enddate', null,'isempty'));
        var schedulednotflo = nlapiSearchRecord('scheduledscriptinstance',null, notflofilters);
        var schedulednotflocount = 0;
        if(schedulednotflo != null && schedulednotflo.length > 0) {
          schedulednotflocount = schedulednotflo.length;
        }
        var listsegmentpreference = nlapiGetContext().getPreference('LISTSEGMENTSIZE');
        var listsegmentok = "T";
        if(isNaN(listsegmentpreference) || parseInt(listsegmentpreference) < 1000) {
          listsegmentok = "F";              
        } 
        var fields = ["custrecord_flo_files_pending_to_process","custrecord_flo_script_queues_set","custrecord_flo_number_flodocs_ss_running","custrecord_flo_segment_sets"]
        var values = [filescount,hasqueuenot1,schedulednotflocount,listsegmentok]

        nlapiSubmitField("customrecord_flo_spider_configuration",1,fields,values);
	} catch(e) {

	}
		
}