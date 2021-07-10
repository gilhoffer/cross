function setBundleToCust() {

	try {
		var processRec=nlapiGetNewRecord();

		var processRecId=nlapiGetRecordId();
		nlapiLogExecution('DEBUG', 'setBundleToCust', 'setBundleToCust processRecId= ' + processRecId);

		var type = processRec.getFieldText("custrecord_flo_cust_type");
		nlapiLogExecution('DEBUG', 'type', type);

		var bundleid=""
		// if(type=='Custom Record Field'){
		if(['Custom Record Field', 'Entry Form'].indexOf(type) > -1){
			var parentid = processRec.getFieldValue("custrecord_flo_cust_parent");
			if(parentid){
				var parent = nlapiLoadRecord("customrecord_flo_customization",parentid);
				bundleid= parent.getFieldValue("custrecord_flo_bundle");
			}
		} else if (type == 'Script Deployments') {
			//var scriptid = processRec.getFieldValue("custrecord_flo_script_deployment");
			var scriptid = processRec.getFieldValue("custrecord_flo_scripts");
			nlapiLogExecution('DEBUG', 'scriptid', scriptid);
			nlapiLogExecution('DEBUG', 'scriptid', processRec.getFieldValue("custrecord_flo_scripts"));
			if(scriptid){
				var script = nlapiLoadRecord("customrecord_flo_customization",scriptid);
				bundleid= script.getFieldValue("custrecord_flo_bundle");
			}
		} else if(type == 'Library Script File') {
			var scriptid = processRec.getFieldValue("custrecord_flo_scripts");
			nlapiLogExecution('DEBUG', 'scriptid', scriptid);
			if(scriptid){
				scriptid = scriptid.split(",")[0];
				var script = nlapiLoadRecord("customrecord_flo_customization",scriptid);
				bundleid= script.getFieldValue("custrecord_flo_bundle");
			}
		}
		//++ NS-1683 Set Bundle ID to Bundle Customization record
		else if(type == 'Bundle') {
			bundleid = processRec.getFieldValue("custrecord_flo_cust_id");
			nlapiLogExecution("DEBUG", "Setting Bundle to Customization " + processRecId, bundleid);
		}
		//-- NS-1683

		bundleid = cleanseBundle(bundleid);
		nlapiLogExecution('DEBUG', 'bundleid', bundleid);
		if(bundleid != null && bundleid.trim() != "") {
			nlapiSubmitField('customrecord_flo_customization',processRecId,'custrecord_flo_bundle', bundleid);
			nlapiLogExecution('DEBUG', 'nlapiSubmitField', 'nlapiSubmitField processRecId= ' + processRecId + " custrecord_flo_bundle= " + bundleid);
		}
	} catch(e) {
		nlapiLogExecution("error","error", e);
	}
}

function cleanseBundle(bundleid) {
	var bundles = [];
	if(bundleid !== null && bundleid !== '') {
		// Replace HTML character codes to symbols
		var bundle = bundleid.replace(/&#(\d{1,4});/g, function(fullStr, code){ return String.fromCharCode(code); });
		bundle = bundle.replace(/&nbsp;/, '');
		// Replace dash (-) with comma (,)
		bundle = bundle.replace('-', ',');

		bundle = bundle.split(',');
		if(bundle.length > 0) {
			for(var i = 0; i < bundle.length; i++) {
            	if(bundle[i].trim() !== '') {
					bundles.push(bundle[i].trim());
                }
			}
		}

	}

	return bundles.join();
}
