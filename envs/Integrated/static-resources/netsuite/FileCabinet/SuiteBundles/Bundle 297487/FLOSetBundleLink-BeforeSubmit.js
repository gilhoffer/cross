function setBundleLink() {
	try {
		var thisCust = nlapiGetNewRecord();
		var thisCustID = nlapiGetRecordId();
		//Sets Bundle Links
		var custrecord_flo_bundle = thisCust.getFieldValue("custrecord_flo_bundle") || null;

		if(nlapiGetFieldValue("custrecord_flo_cust_id") == "customscript_flo_joindeployparam" || nlapiGetFieldValue("custrecord_flo_cust_id") == "customdeploy_flo_joindeployparam"){
			custrecord_flo_bundle = "36969";
			nlapiSetFieldValue("custrecord_flo_bundle", custrecord_flo_bundle);
		}
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
			nlapiSetFieldValue("custrecord_flo_bundlink", bundleids);
			nlapiSetFieldValue("custrecord_flo_manage_bundle", ismanaged);
		}
	} catch (e) {
		nlapiLogExecution('debug', 'e',e);
	}
	
}