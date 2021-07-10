function updateSearchLinks() {
	try {
		var rec = nlapiGetNewRecord();
		var recid = nlapiGetRecordId();
		nlapiLogExecution("DEBUG","recid",recid);
		//Search links to update
		var filters = ["internalidnumber","equalto",recid];
		var searchresults = nlapiSearchRecord(null, "customsearch_flo_links_to_update", filters);
		if(searchresults) {
			var custidstoupdate = [];
			var searchlinks = rec.getFieldValues("custrecord_flo_searches") || null;
			var scriptid = rec.getFieldValue("custrecord_flo_cust_id");
			if(searchlinks && scriptid) {
				searchlinks = searchlinks.join(",").split(",");
				nlapiLogExecution("DEBUG","searchlinks before",JSON.stringify(searchlinks));
				for(var i = 0; searchresults[i] != null; i++) {
					var columns = searchresults[i].getAllColumns();
					var linkid = searchresults[i].getValue(columns[2]);
					var searchfieldids = searchresults[i].getValue(columns[4]);
					var linkpos = searchlinks.indexOf(linkid);
					
					//IF SEARCH FIELDS IDS LENGTH IS TOO LONG DO ADDITIONAL VERIFICATION
					if(searchfieldids && searchfieldids.length > 999) {

						nlapiLogExecution("DEBUG","linkid",searchfieldids.length)
						var allsearchfieldids = nlapiLookupField("customrecord_flo_customization", linkid, "custrecord_flo_search_fields");
						nlapiLogExecution("DEBUG","linkid",searchfieldids + " " + searchfieldids.length + " " + allsearchfieldids)
						if(allsearchfieldids.indexOf(scriptid) != -1) {
							nlapiLogExecution("DEBUG","SKIP","scriptid was found")
							//scriptid was found. The search lied.
							continue;
						}

					}

					custidstoupdate.push(linkid);
					//Remove CUST IDs from Searches
					nlapiLogExecution("DEBUG","linkid",linkid + " " + linkpos)
					if(linkpos != -1) {
						searchlinks.splice(linkpos,1);
					}
				}
				nlapiLogExecution("DEBUG","custidstoupdate",custidstoupdate)
				if(custidstoupdate.length > 0) {

					nlapiLogExecution("DEBUG","Remove Inactive",searchlinks);
					if (searchlinks.length > 0)
						searchlinks = removeInactiveRecord(searchlinks,"customrecord_flo_customization");
					nlapiLogExecution("DEBUG","searchlinks after",searchlinks);
					nlapiSubmitField("customrecord_flo_customization", recid, "custrecord_flo_searches", searchlinks)

					//Force run make join for all removed custs
					for(var j = 0; custidstoupdate[j] != null; j++) {
						nlapiSubmitField("customrecord_flo_customization", custidstoupdate[j], "custrecord_flo_make_join_proc", "F");
					}
				}
			}
			
		}

	} catch(e) {
		nlapiLogExecution("DEBUG","e",e)
	}
}

function removeInactiveRecord(idlist,fieldrecordtype) {
	
	var newlist = [];
	try {
		var lfilters = [];
		lfilters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
		lfilters.push(new nlobjSearchFilter('internalid',null,'anyof',idlist));
		
		lresults=nlapiSearchRecord(fieldrecordtype,null,lfilters);
		if(lresults) {
			for(var lr = 0; lresults[lr] != null; lr++) {
				newlist.push(lresults[lr].getId());
			}
		}
	} catch(e) {
		
	}
	return newlist;
}