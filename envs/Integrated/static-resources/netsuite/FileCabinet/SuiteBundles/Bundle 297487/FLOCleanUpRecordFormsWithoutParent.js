
function setParentToEntryForms() {
	var context = nlapiGetContext();
	var MAX_TIME=600000; //10 minutes
	var START_TIME=new Date().getTime();
	try {
		var lastrecid = context.getSetting('SCRIPT', 'custscript_flo_last_eform_recid') || 0;
		nlapiLogExecution("debug","lastrecid",lastrecid);
		var formfilters = [['custrecord_flo_cust_type','anyof',[6]],'AND',['formulatext:{custrecord_flo_cust_parent}','isempty',null],'AND',['custrecord_flo_data_type','is','RECORD'],'AND',["formulanumeric:REGEXP_INSTR({custrecord_flo_customization}, 'rectype=[0-9]+')","greaterthan",0],'AND',["formulanumeric:TO_NUMBER(REGEXP_REPLACE(REGEXP_SUBSTR({custrecord_flo_customization}, 'rectype=[0-9]+'), 'rectype=',''))",'greaterthanorequalto',lastrecid]];

		var formcolumns = [];
		formcolumns.push(new nlobjSearchColumn('formulanumeric',null,'group').setFormula("TO_NUMBER(REGEXP_REPLACE(REGEXP_SUBSTR({custrecord_flo_customization}, 'rectype=[0-9]+'), 'rectype=',''))"));
		formcolumns[0].setSort();

		var searchforms = nlapiSearchRecord("customrecord_flo_customization", null, formfilters, formcolumns);
		if(searchforms) {
			var recfiltersids = [];
			for(var i=0; searchforms[i] != null;i++) {
				var cols = searchforms[i].getAllColumns();
				var rectype = parseInt(searchforms[i].getValue(cols[0]));
				nlapiLogExecution("debug","rectype",rectype);
				if(rectype && !isNaN(rectype)) {
					var tempfilter = ['custrecord_flo_int_id','equalto',rectype];
					if(recfiltersids.length > 0) {
						recfiltersids.push('OR');
					}
					recfiltersids.push(tempfilter);
				}
			}
			//Search customizations of Custom Records.
			if(recfiltersids.length > 0) {
				var recfilters = [['isinactive','is','F'],'AND',['custrecord_flo_cust_type','anyof',[2]], 'AND', recfiltersids];
				var reccolumns = [];
				reccolumns.push(new nlobjSearchColumn('internalid'));
				reccolumns.push(new nlobjSearchColumn('custrecord_flo_int_id'));
				reccolumns[1].setSort();

				var recordsearch = nlapiSearchRecord("customrecord_flo_customization", null, recfilters,reccolumns);
				if(recordsearch) {
					for(var j = 0; recordsearch[j] != null; j++) {
						var remainingUsage=context.getRemainingUsage();
						var timeDiff=new Date().getTime() - START_TIME;
						if (remainingUsage <= 500 || timeDiff > MAX_TIME || j == 999){
							var sparams = [];
							sparams['custscript_flo_last_eform_recid'] = recordsearch[j].getValue('custrecord_flo_int_id');
							var status = nlapiScheduleScript(context.getScriptId(), context.getDeploymentId(),sparams);
							if ( status == 'QUEUED' ) {
								return;
								nlapiLogExecution("debug","FLO End");
							}
						} else {
							try {
								//Force Make Join to the Record Customization.
								nlapiSubmitField("customrecord_flo_customization", recordsearch[j].getId(), 'custrecord_flo_make_join_proc', 'F')
								nlapiLogExecution("debug","force make join",recordsearch[j].getId());
							} catch(e) {
								nlapiLogExecution("debug","catch 2",e);
							}
						}
						
					}
				}


			} 
			
		}
	} catch(e) {
		nlapiLogExecution("debug","catch",e);
	}
	

}