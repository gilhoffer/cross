function setBundleLink() {
	try {
		var thisCust = nlapiGetNewRecord();
		var thisCustID = nlapiGetRecordId();
		//Sets Bundle Links
		var custrecord_flo_bundle = thisCust.getFieldValue("custrecord_flo_bundle") || null;
		nlapiLogExecution('debug', 'custrecord_flo_bundle',custrecord_flo_bundle);
		if(custrecord_flo_bundle && custrecord_flo_bundle.replace("&nbsp;","").replace(/\s/g,"") != "") {
			//Set Bundle Link
			var bundleids = [];
			var bundlelist = custrecord_flo_bundle.replace(/\s/g,"").replace(/&#44;/g,",").split(",");
			nlapiLogExecution('debug', 'bundlelist',bundlelist);
			var bundleidfilters = [];
			var bundlefilters = [["isinactive","is","F"],"AND",["custrecord_flo_cust_type","anyof",71]];
			for(var bindex = 0; bundlelist[bindex] != null; bindex++) {
				nlapiLogExecution('debug', 'bundlelist[bindex]',bundlelist[bindex] + !isNaN(bundlelist[bindex]));
				if(bundlelist[bindex] && !isNaN(bundlelist[bindex])) {
					var bundleidfilter = ["custrecord_flo_int_id","equalto",bundlelist[bindex]];
					if(bundleidfilters.length > 0) {
						bundleidfilters.push("OR");
					}
					bundleidfilters.push(bundleidfilter);
				}
			}
			var ismanaged = "F";

			if(bundleidfilters.length > 0 ) {
				bundlefilters.push("AND");
				bundlefilters.push(bundleidfilters);
				nlapiLogExecution('debug', 'bundlefilters',bundlefilters);
				var columns = [new nlobjSearchColumn("custrecord_flo_manage_bundle")];
				var bundlesearch = nlapiSearchRecord("customrecord_flo_customization", null, bundlefilters,columns);
				if(bundlesearch && bundlesearch.length > 0) {
					for(var b = 0; bundlesearch[b] != null; b++) {
						if(ismanaged != "T") {
							ismanaged = bundlesearch[b].getValue('custrecord_flo_manage_bundle')
						}
						bundleids.push(bundlesearch[b].getId());
					}	
				}
			}
			if(bundleids.length > 0) {
				nlapiSubmitField("customrecord_flo_customization", thisCustID, ["custrecord_flo_bundlink","custrecord_flo_manage_bundle"], [bundleids,ismanaged]);
			}
			
		}
	} catch (e) {
		nlapiLogExecution('debug', 'e',e);
	}
	
}