window.sourceResults = [];
window.targetResults = [];
window.activeAccountConnections = 0;
window.sourceObjectJSON = [];
window.targetObjectJSON = [];

var diffCompareResults = {
  customizationNotExistInTarget: [],
  customizationNotExistInSource: [],
  customizationsWithDiff: [],
  nonMaterialChangesDetected: [],
  diffCustomizationsSource: [],
  diffCustomizationsTarget: [],
  sourceObjects: [],
  targetObjects: []
}
var diffArr = [];

jQuery(document).ready(function() {

  //Event when result header is clicked
  jQuery('tr.results_header > td').click(function() {
      //console.log("clicked")
      var tableid = jQuery(this).closest('table').attr('id');
      //console.log(tableid)
      var key = jQuery(this).attr('data-key');
      var order = jQuery(this).attr('data-order');
      var datatype = jQuery(this).attr('data-type');
      if(!order) { order = "asc"; }

      var custArray;
      if(tableid == "resultssource") {
         custArray = window.sourceResults;
      } else if(tableid == "resultstarget") {
        custArray = window.targetResults;
      } else if(tableid == "results_diff" || tableid == "results_targetvssource") {
        custArray = diffArr;
      }
      if(custArray && key) {
        sortList(custArray,key,order,tableid,datatype);
        var neworder = "desc";
        if(order == "desc") {
          neworder = "asc";
        }
        jQuery("[data-order=desc]").attr('data-order','');
        jQuery("[data-order=asc]").attr('data-order','');
        jQuery(this).attr('data-order',neworder);
      }
      
  });


  var objecthashrestlet = "/app/site/hosting/restlet.nl?script=customscript_flo_getobjecthash&deploy=1";
  getCustomizationHash('REPLACE_SOURCECREDENTIALS', objecthashrestlet, 'REPLACE_SOURCEJSONFILTERS', true);
  getCustomizationHash('REPLACE_TARGETCREDENTIALS', objecthashrestlet, 'REPLACE_TARGETJSONFILTERS', false);

});

var notInTarget = "Does Not Exist in Target";
var notInSource = "Does Not Exist in Source";
var noMaterialChange = "No Material Change Detected";

function toggleShowHide(elementID) {
  jQuery("#"+elementID).toggleClass("diffhide");
  jQuery("#"+elementID).toggleClass("diffshow");
  //console.log(jQuery("#"+elementID).parent().offset().top)
  jQuery('html, body').animate({
        scrollTop: (jQuery("#"+elementID).parent().offset().top - 100)
    });
}

function diffButtonAction() {
  var count = diffArr.length;
  var sourceinternalIds=[]; 
  var targetinternalIds=[]; 
  for( var i = 0; i < count; i++){  
    var custId=diffArr[i].sourceintid;
    sourceinternalIds.push(custId);   
    targetinternalIds.push(diffArr[i].internalid);
  }

    if(sourceinternalIds.length > 0 || targetinternalIds.length > 0) {
      nlapiSetFieldValue('custpage_flo_diffcusts_source',sourceinternalIds.join(','));
      nlapiSetFieldValue('custpage_flo_diffcusts_target',targetinternalIds.join(','));
      //console.log('diffcusts'+diffcusts.join(','));
      nlapiSetFieldValue('custpage_cred','F');
      //nlapiSetFieldValue('custpage_changereq','');
      nlapiSetFieldValue('custpage_flo_qadd','');
      nlapiSetFieldValue('custpage_flo_qadd_f','');
      nlapiSetFieldValue('custpage_objsearch','');
      nlapiSetFieldValue('custpage_targetvssource',2);
      nlapiSetFieldValue('custpage_objsearch','');
      var d = new Date();
      d.setFullYear(1969);
      nlapiSetFieldValue('custpage_date',nlapiDateToString(d));
      document.getElementById('main_form').submit();
    } else {
      alert('There are no customizations to diff.');
    }
}

function finalAct() {
  if(nlapiGetFieldValue("custpage_changereq")) {
      attachToCR();
  }
  jQuery('#light').css('display', 'none');
  jQuery('#fade').css('display', 'none');
}

function sortList(custArray,key,order,tableid,datatype) {
  custArray.sort(compareValues(key,order,datatype));
  jQuery("#"+tableid).find("tr:gt(0)").remove();
  if(tableid == "results_diff") {
    buildDiffTable(custArray,tableid);
  } else {
    buildSourceTargetTable(custArray,tableid);
  }
  var newclass = "listheadersortdown";
  if(order == "asc") {
    newclass = "listheadersortup";
  }
  var orderspan = '<span style="margin-left: 2px;" class="'+newclass+'"></span>';
  jQuery("#"+tableid).find("span.listheadersortup").remove();
  jQuery("#"+tableid).find("span.listheadersortdown").remove();
  jQuery("#"+tableid).find("td[data-key="+key+"] div").append(orderspan);
  //console.log("#"+tableid+" td[data-key="+key+"] div");
}

function compareValues(key, order='asc',datatype) {
  return function(a, b) {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
        return 0; 
    }

    var varA = a[key];
    var varB = b[key];

    if(datatype == "text") {
      varA = a[key].toUpperCase();
      varB = b[key].toUpperCase()
    } else if(datatype == "date") {
      varA = nlapiStringToDate(a[key]);
      varB = nlapiStringToDate(b[key]);
    } else if(datatype == "int"){
      varA = parseInt(a[key]);
      varB = parseInt(b[key]);
    }

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order == 'desc') ? (comparison * -1) : comparison
    );
  };
}

function attachToCR() {
    var compareType = nlapiGetFieldValue('custpage_targetvssource');
    var count = diffArr.length;
    var contentstring='';
    var rows = []; 
    var path = nlapiResolveURL('SUITELET','customscript_flo_dl_compare_csv',1);  
    for(var i = 0; i < count;i++){ 
      var rowobj = {}; 
      rowobj.internalid=diffArr[i].internalid;
      rowobj.custrecord_flo_int_id=diffArr[i].custrecord_flo_int_id;
      rowobj.custrecord_flo_cust_id=diffArr[i].custrecord_flo_cust_id; 
      rowobj.name=unescape(diffArr[i].name);
      rowobj.custrecord_flo_cust_type=unescape(diffArr[i].custrecord_flo_cust_type);
      rowobj.custrecord_flo_last_spider_date=diffArr[i].custrecord_flo_last_spider_date;
      rowobj.lastmodified=diffArr[i].lastmodified; 
      if(compareType != "1") {
        rowobj.diff_overview=diffArr[i].diffOverview;
        rowobj.diff_field=diffArr[i].diffObj;
      }

      rows.push(rowobj);
    }

    contentstring=JSON.stringify(rows); 
    var description = nlapiGetFieldValue('custpage_desc');
    var sourceaccount = nlapiGetFieldValue('custpage_accountsource');
    var targetaccount = nlapiGetFieldValue('custpage_accounttarget');
    var issourselected = nlapiGetFieldValue('custpage_flo_enviornmentu');
    var istargetselected = nlapiGetFieldValue('custpage_flo_enviornments');
    var custtypetext = nlapiGetFieldText("custpage_custtype");
    var changrequest = nlapiGetFieldValue("custpage_changereq");
    var objsearch = nlapiGetFieldText("custpage_objsearch");
    var changeafter =nlapiGetFieldValue("custpage_date");
    var mode = nlapiGetFieldValue("custpage_flo_bundlemode");
    var bundles = nlapiGetFieldValue("custpage_flo_bundlestoexclude");
    if(changeafter && changeafter.indexOf('1969') != -1) {
      changeafter = "";
    }
    var qadd = nlapiGetFieldTexts("custpage_flo_qadd");
    if(qadd && qadd instanceof Array) {
       qadd = qadd.join(',');
    }
    var issourcesandbox = nlapiGetFieldValue('custpage_flo_enviornmentcheck');
    var istargetsandbox = nlapiGetFieldValue('custpage_flo_enviornmentcheck2');

    console.log("diffcount="+count);
    jQuery.post( path, { contents: contentstring, desc: description, srcaccount: sourceaccount, tgtaccount: targetaccount, attachCR : "T", comptype: compareType, diffcount: count, custpage_flo_enviornmentu: issourselected, custpage_flo_enviornments: istargetselected, custpage_custtype: custtypetext, cr: changrequest, custpage_objsearch:  objsearch, custpage_date: changeafter, custpage_flo_qadd: qadd, custpage_flo_enviornmentcheck: issourcesandbox, custpage_flo_enviornmentcheck2: istargetsandbox, custpage_flo_bundlemode: mode, custpage_flo_bundlestoexclude: bundles  } );

}

function exportResults() {
  var compareType = nlapiGetFieldValue('custpage_targetvssource');
  var results = diffArr;
  var count = results.length;
  var contents='';
  var rows = []; 
  for(var i = 0; i < count;i++){ 
    var rowobj = {}; 
    rowobj.internalid=results[i].internalid;
    rowobj.custrecord_flo_int_id=results[i].custrecord_flo_int_id;
    rowobj.custrecord_flo_cust_id=results[i].custrecord_flo_cust_id; 
    rowobj.name=unescape(results[i].name);
    rowobj.custrecord_flo_cust_type=unescape(results[i].custrecord_flo_cust_type);
    rowobj.custrecord_flo_last_spider_date=results[i].custrecord_flo_last_spider_date;
    rowobj.lastmodified=results[i].lastmodified; 
    if(compareType != "1") {
      rowobj.diff_overview=results[i].diffOverview;
      rowobj.diff_field=results[i].diffObj;
    }

    rows.push(rowobj);
  }
  if(count > 0) { 
    var desc = nlapiGetFieldValue('custpage_desc'); 
    if(desc == null || desc == '') { 
      alert('Please enter description'); 
      return false;
    } 

    var path = nlapiResolveURL('SUITELET','customscript_flo_dl_compare_csv',1); 
    contents=JSON.stringify(rows); 
    
    var form = document.createElement('form'); 
    form.setAttribute('method', 'post');  
    form.setAttribute('action', path);
    form.setAttribute('target', '_blank');  

    var confield = document.createElement('input');
    confield.setAttribute('type', 'hidden');
    confield.setAttribute('name', 'contents');
    confield.setAttribute('value', contents);
    form.appendChild(confield);
    
    var descfield = document.createElement('input');
    descfield.setAttribute('type','hidden');
    descfield.setAttribute('name','desc');
    descfield.setAttribute('value',desc);
    form.appendChild(descfield);
    
    var srcacctfield = document.createElement('input');
    srcacctfield.setAttribute('type','hidden');
    srcacctfield.setAttribute('name','srcaccount');
    srcacctfield.setAttribute('value',nlapiGetFieldValue('custpage_accountsource'));
    form.appendChild(srcacctfield);

    var tgtacctfield = document.createElement('input');
    tgtacctfield.setAttribute('type','hidden');
    tgtacctfield.setAttribute('name','tgtaccount');
    tgtacctfield.setAttribute('value',nlapiGetFieldValue('custpage_accounttarget'));
    form.appendChild(tgtacctfield);

    document.body.appendChild(form);
    form.submit(); 
  }else {
    alert('There are no customizations to export.');
  }
}
function processAccountObjects() {

  var compareType = nlapiGetFieldValue('custpage_targetvssource');
  var founderror = '';
  if (typeof window.sourceResults != 'undefined' && window.sourceResults['error'] != null && window.sourceResults['error'] != '') {
    founderror = 'Found Error in Source Account: ' + window.sourceResults['error'].message;
  }
  if (typeof targetResults != 'undefined' && targetResults['error'] != null && targetResults['error'] != '') {
    if (founderror != '') {
      founderror += '<br>';
    }
    founderror += 'Found Error in Target Account: ' + targetResults['error'].message;
  }

  if (founderror) {
    nlapiSetFieldValue('custpage_founderror', founderror);
    jQuery("#custpage_founderror_fs").html(founderror);
    jQuery('input#custpage_desc').closest('#detail_table_lay').css('display','none');
    jQuery('#light').css('display', 'none');
    jQuery('#fade').css('display', 'none');
    jQuery('#resultssource').closest('.uir_form_tab_container').css('display','none');
    
  } else {
    var hasmorethan1000results = false;
    if (window.sourceResults) {
      if (window.sourceResults.length > 999) {
        hasmorethan1000results = true;
      }
      //buildSourceTargetTable(window.sourceResults, 'resultssource');
      sortList(window.sourceResults,'lastmodified','asc','resultssource','date');
    }
    if (window.targetResults) {
      if (window.targetResults.length > 999) {
        hasmorethan1000results = true;
      }
     //buildSourceTargetTable(window.targetResults, 'resultstarget');
     sortList(window.targetResults,'lastmodified','asc','resultstarget','date');
    }
    var res1 = window.sourceResults;
    var res2 = window.targetResults;
    var diffcount = 0;
    var custprocessedcount = 0;
    var clearanceString = 'undefined,- None -';
    if (compareType == '1') {
      var res1Array = [];
      for (var j = 0; res1 && j < res1.length; j++) {
        var scriptid1 = res1[j].custrecord_flo_cust_id;
        var pattern = "%20%28" + res1[j].custrecord_flo_cust_type + "%29";
        var regex = new RegExp(pattern);
        var nameType1 = res1[j].name;

        if (nameType1) {
          nameType1 = nameType1.replace(regex, '') + res1[j].custrecord_flo_cust_type;
        }

        if (clearanceString.indexOf(scriptid1) >= 0 | scriptid1 == '') {
          res1Array[nameType1] = res1[j];
        } else {
          res1Array[scriptid1] = res1[j];
        }
      }

      for (var i = 0; res2 && i < res2.length; i++) {
        var scriptid2 = res2[i].custrecord_flo_cust_id;
        var pattern = "%20%28" + res2[i].custrecord_flo_cust_type + "%29";
        var regex = new RegExp(pattern);
        var nameType2 = res2[i].name;

        if (nameType2) {
          nameType2 = nameType2.replace(regex, '') + res2[i].custrecord_flo_cust_type;
        }

        var includeRes = false;
        var r1obj = null;

        if (clearanceString.indexOf(scriptid2) >= 0 | scriptid2 == '') {
          r1obj = res1Array[nameType2];
        } else {
          r1obj = res1Array[scriptid2];
        }

        if (typeof r1obj == "undefined" || r1obj == null || (nlapiStringToDate(res2[i].lastmodified) > nlapiStringToDate(r1obj.lastmodified) && res2[i].lastmodified != r1obj.lastmodified)) {
          includeRes = true;
        }

        if (includeRes) {
          var founddiff = JSON.parse(JSON.stringify(res2[i]));
          var sourintid = 0;
          if (r1obj && r1obj.internalid) {
            sourintid = r1obj.internalid;
          }
          founddiff.sourceintid = sourintid;
          diffArr.push(founddiff);
          diffcount++;
        }
      }

      //buildSourceTargetTable(diffArr, 'results_targetvssource');
      sortList(diffArr,'lastmodified','asc','results_targetvssource','date');
      finalAct();
    } else {
      diffCompareResults = compareHash(window.sourceResults, window.targetResults);
     // console.log(diffCompareResults)
      if (diffCompareResults.diffCustomizationsSource.length > 0 && diffCompareResults.diffCustomizationsTarget.length > 0) {
        var objecthashrestlet = "/app/site/hosting/restlet.nl?script=customscript_flo_getobjectjson&deploy=1"
        var sourcepassword = nlapiGetFieldValue('custpage_password');
        var sourceinternalids = {
          internalids: diffCompareResults.diffCustomizationsSource.join(',')
        }

        var targetpassword = nlapiGetFieldValue('custpage_password2') || sourcepassword;
        var targetinternalids = {
          internalids: diffCompareResults.diffCustomizationsTarget.join(',')
        }
        getCustomizationJSON('REPLACE_SOURCECREDENTIALS', objecthashrestlet, JSON.stringify(sourceinternalids), true);
        getCustomizationJSON('REPLACE_TARGETCREDENTIALS', objecthashrestlet, JSON.stringify(targetinternalids), false);
      } else {
        //buildDiffTable(diffArr);
        diffArr = diffCompareResults.customizationNotExistInTarget.concat(diffCompareResults.customizationNotExistInSource)
        diffArr = diffArr.concat(diffCompareResults.nonMaterialChangesDetected)
        sortList(diffArr,'diffObj','desc','results_diff','text');
        finalAct();
      }
    } 
  }

}

function processDiff() {
  try {
    var sourceObjectJSON = reconstructArrayById(window.sourceObjectJSON);
    var targetObjectJSON = reconstructArrayById(window.targetObjectJSON);
    //console.log("processDiff sourceObjectJSON="+ sourceObjectJSON.length);

    //console.log("processDiff targetObjectJSON="+ targetObjectJSON.length);
    //console.log("processDiff sourceObjectJSON="+ JSON.stringify(sourceObjectJSON));
    //console.log("processDiff targetObjectJSON="+ JSON.stringify(targetObjectJSON));
    //console.log("processDiff diffCompareResults.customizationsWithDiff="+ diffCompareResults.customizationsWithDiff);
     var isnomatchecked = nlapiGetFieldValue("custpage_flo_nomatbox");
    //Compare Object JSON
    for (var k = 0; k < diffCompareResults.customizationsWithDiff.length; k++) {
      var customization = diffCompareResults.customizationsWithDiff[k];
      var source_internalid = customization.internalid;
      var target_internalid = customization.match;

      var sourceObject = {};
      var targetObject = {};

      if (sourceObjectJSON[source_internalid]) {
        sourceObject = JSON.parse(sourceObjectJSON[source_internalid]);
      }

      if (targetObjectJSON[target_internalid]) {
        targetObject = JSON.parse(targetObjectJSON[target_internalid]);
      }

      try {
       // console.log("sourceObject= " + JSON.stringify(sourceObject));
       // console.log("targetObject= " +  JSON.stringify(targetObject));
        var diffObj = compareObjectJSON(sourceObject, targetObject, {});
         //console.log("diffObj= " + JSON.stringify(diffObj));
        if (diffObj.hasOwnProperty('owner')) {
          delete diffObj['owner'];
        }

        if (diffObj.hasOwnProperty('installed_by')) {
          delete diffObj['installed_by'];
        }

        if (diffObj.hasOwnProperty('installed_on')) {
          delete diffObj['installed_on'];
        }

        if (diffObj.hasOwnProperty('last_update')) {
          delete diffObj['last_update'];
        }

        if (diffObj.hasOwnProperty('scriptfilehash') && diffObj['scriptfilehash'] && diffObj['scriptfilehash'].match('null') != null) {
          delete diffObj['scriptfilehash'];
        }

        if (diffObj.hasOwnProperty('filecontenthash') && diffObj['filecontenthash'] && diffObj['filecontenthash'].match('null') != null) {
          delete diffObj['filecontenthash'];
        }

        if(diffObj.hasOwnProperty('scriptfilesize')) {
            diffObj['scriptfilesize'] = diffObj['scriptfilesize'] + 'REPLACE_VIEWFILELINK';
          } else if(diffObj.hasOwnProperty('scriptfilehash')) {
             diffObj['scriptfilehash'] = diffObj['scriptfilehash'] + 'REPLACE_VIEWFILELINK';
          } else if(diffObj.hasOwnProperty('filesize')) {
             diffObj['filesize'] = diffObj['filesize'] + 'REPLACE_VIEWFILELINK';
          } else if(diffObj.hasOwnProperty('filecontenthash')) {
             diffObj['filecontenthash'] = diffObj['filecontenthash'] + 'REPLACE_VIEWFILELINK';
          }

        if (Object.keys(diffObj).length > 0) {
          var diffString = JSON.stringify(diffObj, undefined, 2);
          //nlapiLogExecution("debug", "diffString", diffString);
          var diffCustType = unescape(diffCompareResults.customizationsWithDiff[k].custrecord_flo_cust_type);
          var changeOverview = getOverviewByType(diffString, diffCustType, {}, 'Configuration');

          var scriptDiffLink = ' <span style="text-decoration: underline;cursor: pointer;" onclick="viewFileDiff(\''+source_internalid+'\',\''+target_internalid+'\',\''+customization.custrecord_flo_cust_id+'\')">View File Diff</span>'
          
          changeOverview = diffCustType + " Changed. " + changeOverview;
          var diffHiddenString = JSON.stringify(diffObj);
          diffCompareResults.customizationsWithDiff[k].diffObj = diffHiddenString;
          var highlightedString = syntaxHighlight(diffString);
          if(highlightedString) {
              highlightedString = highlightedString.replace('REPLACE_VIEWFILELINK',scriptDiffLink);
          }
          diffCompareResults.customizationsWithDiff[k].diff = highlightedString;
          diffCompareResults.customizationsWithDiff[k].diffOverview = changeOverview;
        } else {   
          if(isnomatchecked == "T") {
            var nonMaterialObj = diffCompareResults.customizationsWithDiff[k];
            nonMaterialObj.diffObj = noMaterialChange;
            nonMaterialObj.diffOverview = noMaterialChange;
            diffCompareResults.nonMaterialChangesDetected.push(nonMaterialObj); 
          }
          diffCompareResults.customizationsWithDiff.splice(k, 1);

          k--;
        }


      } catch (e) {
        //nlapiLogExecution("debug", "deepDiffMapper e", e);
        console.log(e);
      }
    }

    diffArr =  diffCompareResults.customizationsWithDiff.concat(diffCompareResults.customizationNotExistInTarget)
    diffArr = diffArr.concat(diffCompareResults.customizationNotExistInSource)
    diffArr = diffArr.concat(diffCompareResults.nonMaterialChangesDetected)
    //buildDiffTable(diffArr);
    sortList(diffArr,'diffObj','desc','results_diff','text');
    finalAct();
    //
  } catch (e) {
    console.log(e);
  }
}

function syntaxHighlight(json) {
  try {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        }
      } else if (/green/.test(match)) {
        cls = 'green';
      } else if (/red/.test(match)) {
        cls = 'red';
      }
      if (cls == 'key') {
        return '<b>' + match.replace(':', '') + '</b>:';
      } else {
        return match;
      }
    });
    json = json.replace(/"/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/{|}/g, '').substring(0, 2500);

    return "<pre class='diffview'>" + json + "</pre>";
  } catch (e) {
    return json;
  }
}

function buildDiffTable(results) {
  if (results && results.length > 0) {
    for (var i = 0; i < results.length; i++) {
      var difflineid = i + 1;
      var diffcontainer = (results[i].diffOverview != notInTarget && results[i].diffOverview != notInSource  && results[i].diffOverview != noMaterialChange ) ? "<span onclick='toggleShowHide(\"diffcontainer" + difflineid + "\")' style='text-decoration:underline;cursor:pointer;'>Show/Hide</span><span id='diffcontainer" + difflineid + "' class='diffhide'>" + results[i].diff + "</span>" : results[i].diffOverview;
               
      var rowcolor = (i % 2 != 0) ? ' uir-list-row-tr uir-list-row-odd' : 'uir-list-row-tr uir-list-row-even';
      var row = '<tr class=\"uir-list-row-tr ' + rowcolor + '\"><td class=\"uir-list-row-cell listtext\">' + results[i].internalid + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].custrecord_flo_int_id + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].custrecord_flo_cust_id + '</td><td class=\"uir-list-row-cell listtext\">' + unescape(results[i].name) + '</td><td class=\"uir-list-row-cell listtext\">' + unescape(results[i].custrecord_flo_cust_type) + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].custrecord_flo_last_spider_date + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].lastmodified + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].diffOverview + '</td><td class=\"uir-list-row-cell listtext\">' + diffcontainer+ '</td></tr>';

      jQuery('table#results_diff').append(row);
    }
  } else {
    jQuery('table#results_diff').append('<tr><td class=\"uir-nodata-row listtexthl\" colspan=\"7\">No records to show.</td></tr>');
  }
}

function reconstructArrayById(jsonarr) {
  var jsonById = {};
  if (jsonarr && jsonarr.length > 0) {
    for (var j = 0; j < jsonarr.length; j++) {
      var intid = jsonarr[j].internalid;
      var objectjson = jsonarr[j].custrecord_flo_object_json
      jsonById[intid] = objectjson;
    }

  }
  return jsonById;
}


function reconstructTargetById(jsonarr) {
  var jsonById = {};
  if (jsonarr && jsonarr.length > 0) {
    for (var j = 0; j < jsonarr.length; j++) {
      var pattern = "%20%28" + jsonarr[j].custrecord_flo_cust_type + "%29"
      var regex = new RegExp(pattern);
      var myid = jsonarr[j].custrecord_flo_cust_id;
      if (typeof myid == "undefined" || myid == null || myid == "" || myid == "- None -" || myid == "undefined") {
        myid = jsonarr[j].name;
        if (myid) {
          myid = myid.replace(regex, "") + jsonarr[j].custrecord_flo_cust_type;
        }
      }
      if (jsonarr[j].custrecord_flo_cust_type.indexOf('Deployment') != -1) {
        myid += jsonarr[j].parent_script;
      }


      jsonById[myid] = jsonarr[j];
    }

  }
  return jsonById;
}

function compareHash(sourceresults, targetresults) {
  var procRecords = [];

  var lastindex = 0;

  var targetResultsById = reconstructTargetById(targetresults);

  for (var i = 0; i < sourceresults.length; i++) {
    var matches = [];
    var myid = sourceresults[i].custrecord_flo_cust_id;
    var custinternalid = sourceresults[i].internalid;
    var pattern = "%20%28" + sourceresults[i].custrecord_flo_cust_type + "%29"
    var regex = new RegExp(pattern);

    var clearanceString = "undefined,- None -";

    if (typeof myid == "undefined" || myid == null || myid == "" || myid == "- None -" || myid == "undefined") {
      myid = sourceresults[i].name
      if (myid) {
        myid = myid.replace(regex, "") + sourceresults[i].custrecord_flo_cust_type;
      }
    }

    if (sourceresults[i].custrecord_flo_cust_type.indexOf('Deployment') != -1) {
      myid += sourceresults[i].parent_script;
    }


    if (targetResultsById.hasOwnProperty(myid) && targetResultsById[myid]) {


      procRecords.push(myid);


      var isnomatchecked = nlapiGetFieldValue("custpage_flo_nomatbox");
      var source = JSON.parse(JSON.stringify(sourceresults[i]));
      var target = JSON.parse(JSON.stringify(targetResultsById[myid]));
      //console.log(source);
      //console.log(target);
      //console.log(source.custrecord_flo_object_hash + " != " + target.custrecord_flo_object_hash);
      if (source.custrecord_flo_object_hash != target.custrecord_flo_object_hash) {
        diffCompareResults.diffCustomizationsSource.push(source.internalid);
        diffCompareResults.diffCustomizationsTarget.push(target.internalid);
        source.match = target.internalid;
        diffCompareResults.customizationsWithDiff.push(source);
      } else if (isnomatchecked == "T") {
        var nonmatlen = diffCompareResults.nonMaterialChangesDetected.push(sourceresults[i]);
        diffCompareResults.nonMaterialChangesDetected[nonmatlen-1].diffObj = noMaterialChange;
        diffCompareResults.nonMaterialChangesDetected[nonmatlen-1].diffOverview = noMaterialChange;
      }

    } else {
      var notInTargetLen = diffCompareResults.customizationNotExistInTarget.push(sourceresults[i]);
      diffCompareResults.customizationNotExistInTarget[notInTargetLen-1].diffObj = notInTarget;
      diffCompareResults.customizationNotExistInTarget[notInTargetLen-1].diffOverview = notInTarget;
    }


    procRecords.push(myid);
  }

  for (var i = 0; i < targetresults.length; i++) {
    var custinternalid = targetresults[i].internalid;
    var id = targetresults[i].custrecord_flo_cust_id;
    if (typeof id == "undefined" || id == null || id == "" || id == "- None -" || id == "undefined") {
      var pattern = "%20%28" + targetresults[i].custrecord_flo_cust_type + "%29"
      var regex = new RegExp(pattern);
      id = targetresults[i].name;
      if (id) {
        id = id.replace(regex, "") + targetresults[i].custrecord_flo_cust_type
      }
    }
    if (targetresults[i].custrecord_flo_cust_type.indexOf('Deployment') != -1) {
      id += targetresults[i].parent_script;
    }
    if (typeof id == "undefined" || id == null || id == "" || id == "- None -" || id == "undefined") continue;

    if (procRecords.indexOf(id) >= 0) continue;

    var notInSourceLen = diffCompareResults.customizationNotExistInSource.push(targetresults[i]);
    diffCompareResults.customizationNotExistInSource[notInSourceLen-1].diffObj = notInSource;
    diffCompareResults.customizationNotExistInSource[notInSourceLen-1].diffOverview = notInSource;

  }

  return diffCompareResults;
}

function getCustomizationHash(credential,restletpath, params, issource) {
  window.activeAccountConnections++;
  var scripturl = nlapiResolveURL('SUITELET', 'customscript_flo_custs_from_acct', 1);
  jQuery.ajax({
    url: scripturl,
    type: 'post',
    data: {
      accountCredential: credential,
      restletURL: restletpath,
      requestParams: params
    },
    success: function(result) {
      if (result) {
        var hasmore = false;
        try {
          result = result.replace(/<!--.*?-->/g,'');
          resultsHolder = JSON.parse(result);
          var customizationarr = JSON.parse(result);
          if(resultsHolder.hasOwnProperty('customizationarr') && resultsHolder.hasOwnProperty('requestParams')) {
             customizationarr = resultsHolder['customizationarr'];
             hasmore = true;
          } 
          
        } catch (e) {
          resultsHolder = {
            error: e
          };
          
        }
      }
      if(customizationarr && customizationarr instanceof Array) {
         if (issource) {
          window.sourceResults = window.sourceResults.concat(customizationarr);
        } else {
          window.targetResults = window.targetResults.concat(customizationarr);;
        }
      } else {
        if (issource) {
          window.sourceResults = resultsHolder;
        } else {
          window.targetResults = resultsHolder;
        }
      }
      window.activeAccountConnections--;
      //console.log("hasmore " + hasmore)
      if (activeAccountConnections == 0 && hasmore == false) {
        processAccountObjects();
      } else if(hasmore) {
        getCustomizationHash(credential, restletpath, resultsHolder['requestParams'], issource)
      }
    }
  });
}

function getCustomizationJSON(credential, restletpath, params, issource) {
  window.activeAccountConnections++;
  //console.log("getCustomizationJSON params="+ params)
  var scripturl = nlapiResolveURL('SUITELET', 'customscript_flo_custs_from_acct', 1);
  jQuery.ajax({
    url: scripturl,
    type: 'post',
    data: {
      accountCredential: credential,
      restletURL: restletpath,
      requestParams: params
    },
    success: function(result) {
      if (result) {
        var hasmore = false;
        try {
          result = result.replace(/<!--.*?-->/g,'');
          resultsHolder = JSON.parse(result);
          var customizationarr = JSON.parse(result);
          if(resultsHolder.hasOwnProperty('customizationarr')) {
             customizationarr = resultsHolder['customizationarr'];
             hasmore = true;
          } 
          
        } catch (e) {
          resultsHolder = {
            error: e
          };
          
        }
      }
     
      if(customizationarr && customizationarr instanceof Array) {
        if (issource) {
          window.sourceObjectJSON = window.sourceObjectJSON.concat(customizationarr);
        } else {
          window.targetObjectJSON  = window.targetObjectJSON.concat(customizationarr);
        }
      } else {
        if (issource) {
          window.sourceObjectJSON = resultsHolder;
        } else {
          window.targetObjectJSON = resultsHolder;
        }
        hasmore = false;
      }
      window.activeAccountConnections--;
      //console.log("getCustomizationJSON hasmore="+ hasmore)
      if (activeAccountConnections == 0 && hasmore == false) {
        processDiff();
      } else if(hasmore) {
        getCustomizationJSON(credential, restletpath, resultsHolder['requestParams'], issource)
      }
    }
  });
}


function buildSourceTargetTable(results, tableid) {

  if (results && results.length > 0) {
    for (var i = 0; i < results.length; i++) {
      var rowcolor = (i % 2 != 0) ? ' uir-list-row-tr uir-list-row-odd' : 'uir-list-row-tr uir-list-row-even';
      var row = '<tr class=\"uir-list-row-tr ' + rowcolor + '\"><td class=\"uir-list-row-cell listtext\">' + results[i].internalid + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].custrecord_flo_int_id + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].custrecord_flo_cust_id + '</td><td class=\"uir-list-row-cell listtext\">' + unescape(results[i].name) + '</td><td class=\"uir-list-row-cell listtext\">' + unescape(results[i].custrecord_flo_cust_type) + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].custrecord_flo_last_spider_date + '</td><td class=\"uir-list-row-cell listtext\">' + results[i].lastmodified + '</td></tr>';

      jQuery('table#' + tableid).append(row);
    }
  } else {
    jQuery('table#' + tableid).append('<tr><td class=\"uir-nodata-row listtexthl\" colspan=\"7\">No records to show.</td></tr>');
  }
}



function compareObjectJSON(oldjson, newjson, diffvalues) {
  try {
    if (oldjson == null || oldjson == "") {
      oldjson = {};
    }
    if (newjson == null || newjson == "") {
      newjson = {};
    }

    for (var k in newjson) {
      if (oldjson.hasOwnProperty(k) && (newjson[k] == oldjson[k] || (typeof newjson[k] === "object" && JSON.stringify(newjson[k]) == JSON.stringify(oldjson[k])))) {
        //same. do nothing
      } else {
        if (typeof newjson[k] === "object" && newjson[k] != null) {
          var oldjsonobj = {};
          if (oldjson.hasOwnProperty(k)) {
            oldjsonobj = oldjson[k];
          }
          diffvalues[k] = {};
          compareObjectJSON(oldjsonobj, newjson[k], diffvalues[k])
          if (Object.keys(diffvalues[k]).length == 0) {
            delete diffvalues[k];
          }

        } else {
          var oldvalue = "";
          if (oldjson.hasOwnProperty(k)) {
            oldvalue = String(oldjson[k]);
          }
          var checkdiff = FLOdiffString(oldvalue, String(newjson[k]))
          if (checkdiff) {
            diffvalues[k] = checkdiff.replace(/\sstyle="color:red"/g, "").replace(/\sstyle="color:green"/g, "");
          }
        }

      }
    }



    for (var k in oldjson) {
      if (Object.keys(diffvalues).length > 0 && Object.keys(diffvalues).indexOf(k) != -1) {
        continue;
      }
      if (newjson.hasOwnProperty(k) && (newjson[k] == oldjson[k] || (typeof oldjson[k] === "object" && JSON.stringify(newjson[k]) == JSON.stringify(oldjson[k])))) {
        //same. do nothing
      } else {
        if (typeof oldjson[k] === "object"  && oldjson[k] != null) {
          var newjsonobj = {};
          if (newjson.hasOwnProperty(k)) {
            newjsonobj = newjson[k];
          }
          diffvalues[k] = {};
          compareObjectJSON(oldjson[k], newjsonobj, diffvalues[k]);
          if (Object.keys(diffvalues[k]).length == 0) {
            delete diffvalues[k];
          }
        } else {
          var newvalue = "";
          if (newjson.hasOwnProperty(k)) {
            newvalue = String(newjson[k]);
          }
          //diffvalues[k] = "<del style='color:red'>"+target[k]+"</del>"+newvalue;
          var checkdiff = FLOdiffString(String(oldjson[k]), newvalue);
          if (checkdiff) {
            diffvalues[k] = checkdiff.replace(/\sstyle="color:red"/g, "").replace(/\sstyle="color:green"/g, "");
          }

        }
      }
    }


  } catch (e) {

  }

  return diffvalues;
}

function viewFileDiff(souceinternalid, targetinternalid,scriptid) {
  var sourceCred = 'REPLACE_SOURCECREDENTIALS';
  var targetCred = 'REPLACE_TARGETCREDENTIALS';
   
  if(souceinternalid && targetinternalid) {
    var fileDiffSuiteletUrl = nlapiResolveURL('SUITELET', 'customscript_flo_scriptfile_diff', 1);
    if(jQuery('#scriptfilediffform').length == 0) {
       var $form = jQuery('<form>', {
          action: fileDiffSuiteletUrl,
          method: 'post',
          id: 'scriptfilediffform',
          target: '_blank'
      });

    
      jQuery('<input>').attr({
             type: "hidden",
             name: 'targetCred',
             id: 'targetCred'
      }).appendTo($form);
      
      jQuery('<input>').attr({
             type: "hidden",
             name: 'sourceInternalId',
             id: 'sourceInternalId'
      }).appendTo($form);
      
      jQuery('<input>').attr({
             type: "hidden",
             name: 'targetInternalId',
             id: 'targetInternalId'
      }).appendTo($form);

      jQuery('<input>').attr({
             type: "hidden",
             name: 'sourceCred',
             id: 'sourceCred'
      }).appendTo($form);

      jQuery('<input>').attr({
             type: "hidden",
             name: 'scriptID',
             id: 'scriptID'
      }).appendTo($form);

      $form.appendTo('body')

    }  
    jQuery('#sourceCred').val(sourceCred);
    jQuery('#targetCred').val(targetCred);
    jQuery('#sourceInternalId').val(souceinternalid);
    jQuery('#targetInternalId').val(targetinternalid);
    jQuery('#scriptID').val(scriptid);
    jQuery('#scriptfilediffform').submit() ;

  } else if(!souceinternalid){
     alert('Request could not be completed. Source is missing.')
  } else if(!targetinternalid){
     alert('Request could not be completed. Target is missing.')
  }
   
}

function getOverviewByType(diffString, recType, newRecord, fieldName) {

  try {
    var changeOverview = [];
    if (recType.indexOf(" Field") > -1) {
      changeOverview = getFieldChOverview(diffString);
    } else if (recType.indexOf(" Script") > -1) {
      changeOverview = getScriptChOverview(diffString);
    } else if (recType == "Record") {
      changeOverview = getCustRecChOverview(diffString);
    } else if (recType == "List") {
      changeOverview = getListChOverview(diffString);
    } else if (recType == "Workflow") {
      changeOverview = getWorkflowChOverview(diffString);
    } else if (recType == "Search" || recType == "Mass Update") {
      changeOverview = getSearchChOverview(diffString, newRecord);
    } else if (recType == "Entry Form") {
      changeOverview = getEFormChOverview(diffString);
    } else if (recType == "Transaction Form") {
      changeOverview = getTransFormChOverview(diffString);
    } else if (recType == "Online Customer Form") {
      changeOverview = getOnlineCustFormChOverview(diffString);
    } else if (recType == "Script Deployments") {
      changeOverview = getScriptDeployChOverview(diffString);
    } else if (recType == "User Role") {
      changeOverview = getUserRoleChOverview(diffString);
    }

    changeOverview = getGeneralChOverview(diffString, changeOverview).join();

    if (changeOverview != "")
      changeOverview += ".";

  } catch (e) {

  }
  return changeOverview;

}

function getGeneralChOverview(diffString, changeList) {
  if (diffString && diffString.trim() != "") {
    if (diffString.indexOf('"owner":') > -1) {
      changeList.push("Owner Change");
    }

    if (diffString.indexOf('"custrecord_flo_cust_id"') > -1 || diffString.indexOf('custrecord_flo_cust_id:') > -1) {
      if (changeList.indexOf("Script ID Change") < 0)
        changeList.push("Script ID Change");
    }

    if (diffString.indexOf('"scriptid"') > -1 || diffString.indexOf('scriptid:') > -1) {
      if (changeList.indexOf("Script ID Change") < 0)
        changeList.push("Script ID Change");
    }

    if (diffString.indexOf('"custrecord_flo_cust_parent"') > -1 || diffString.indexOf('custrecord_flo_cust_parent:') > -1) {
      if (changeList.indexOf("Parent Change") < 0)
        changeList.push("Parent Change");
    }

    if (diffString.indexOf('"custrecord_flo_cust_audit_appr_policy"') > -1 || diffString.indexOf('custrecord_flo_cust_audit_appr_policy:') > -1) {
      if (changeList.indexOf("Policy Change") < 0)
        changeList.push("Policy Change");
    }

    if (diffString.indexOf('"custrecord_flo_bundle"') > -1 || diffString.indexOf('custrecord_flo_bundle:') > -1) {
      if (changeList.indexOf("Bundle Change") < 0)
        changeList.push("Bundle Change");
    }
  }
  return changeList;
}

function getFieldChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.match(/"(body|col|appliesto)[a-zA-Z]+?":/g) !== null) {
      changeList.push("Parent Change");
    }

    if (diffString.indexOf('"help":') > -1) {
      changeList.push("Help Change");
    }

    if (diffString.indexOf('"description":') > -1) {
      changeList.push("Description Change");
    }

    if (diffString.indexOf('"label":') > -1) {
      changeList.push("Label Change");
    }

    if (diffString.indexOf('"scriptid":') > -1) {
      changeList.push("Script ID Change");
    }

    if (diffString.indexOf('"fieldtype":') > -1) {
      changeList.push("Field Type Change");
    }

    if (diffString.indexOf('"insertbefore":') > -1 ||
      diffString.indexOf('"subtab":') > -1 ||
      diffString.indexOf('"displaytype":') > -1 ||
      diffString.indexOf('"fldsizelabel":') > -1 ||
      diffString.indexOf('"applyformatting":') > -1 ||
      diffString.indexOf('"allowquickadd":') > -1) {
      changeList.push("Field Display Change");
    }

    if (diffString.indexOf('"ismandatory":') > -1 ||
      diffString.indexOf('"checkspelling":') > -1 ||
      diffString.indexOf('"maxlength":') > -1 ||
      diffString.indexOf('"defaultvalue":') > -1 ||
      diffString.indexOf('"isformula":') > -1 ||
      diffString.indexOf('"searchdefault":') > -1 ||
      diffString.indexOf('"searchcomparefield":') > -1 ||
      diffString.indexOf('"dynamicdefault":') > -1 ||
      diffString.indexOf('"defaultselection":') > -1 ||
      diffString.indexOf('"onparentdelete"') > -1) {
      changeList.push("Field Validation & Sourcing Change");
    }

    if (diffString.indexOf('"sourcelist":') > -1 ||
      diffString.indexOf('"sourcefrom":') > -1 ||
      diffString.indexOf('"sourcefilterby":') > -1 ||
      diffString.indexOf('"customfieldfilter"') > -1) {
      changeList.push("Field Sourcing & Filtering Change");
    }

    if (diffString.indexOf('"accesslevel":') > -1 ||
      diffString.indexOf('"searchlevel":') > -1 ||
      diffString.indexOf('"roleaccess":') > -1 ||
      diffString.indexOf('"deptaccess":') > -1) {
      changeList.push("Field Access Change");
    }

    if (diffString.indexOf('"translations":') > -1) {
      changeList.push("Field Translation Change");
    }
  }
  return changeList;
}

function getScriptChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"custrecord_flo_script_file_size"') > -1 || diffString.indexOf('custrecord_flo_script_file_size:') > -1 ||
      diffString.indexOf('"custrecord_flo_script_filecontent_hash"') > -1 || diffString.indexOf('custrecord_flo_script_filecontent_hash:') > -1) {
      changeList.push("Script File/Code Update");
    }

    if (diffString.indexOf('"defaultfunction"') > -1 || diffString.indexOf('defaultfunction:') > -1) {
      changeList.push("Script Configuration Change");
    }

    if (diffString.indexOf('"libraries"') > -1 || diffString.indexOf('libraries:') > -1) {
      changeList.push("Library Update");
    }

    if (diffString.indexOf('"scriptfile"') > -1 || diffString.indexOf('"scriptfilesize":') > -1 || diffString.indexOf('"scriptfiledate":') > -1 || diffString.indexOf('"scriptfilehash":') > -1 || diffString.indexOf('"filename":') > -1 || diffString.indexOf('"filesize":') > -1 || diffString.indexOf('"filecontenthash":') > -1) {
      changeList.push("Script File Update");
    }

    if (diffString.indexOf('"scriptid"') > -1 || diffString.indexOf('scriptid:') > -1) {
      changeList.push("Script ID Change");
    }

    // if (diffString.indexOf('"custrecord_flo_cust_id"') > -1 || diffString.indexOf('custrecord_flo_cust_id:') > -1) {
    //     changeList.push("Script ID Change");
    // }

    if (diffString.match(/"[a-zA-Z]+function(_v2)?"/g) !== null) {
      changeList.push("Script Function Configuration Change");
    }

    if (diffString.indexOf('"description"') > -1 || diffString.indexOf('description:') > -1) {
      changeList.push("Script Description Change");
    }

    if (diffString.indexOf('"parameters"') > -1 || diffString.indexOf('parameters:') > -1) {
      changeList.push("Script Parameters Change");
    }

    if (diffString.indexOf('"notifyuser"') > -1 || diffString.indexOf('notifyuser:') > -1 ||
      diffString.indexOf('"notifyowner"') > -1 || diffString.indexOf('notifyowner:') > -1 ||
      diffString.indexOf('"notifyadmins"') > -1 || diffString.indexOf('notifyadmins:') > -1 ||
      diffString.indexOf('"notifygroup"') > -1 || diffString.indexOf('notifygroup:') > -1 ||
      diffString.indexOf('"notifyemails"') > -1 || diffString.indexOf('notifyemails:') > -1) {
      changeList.push("Script Notifications Change");
    }

    if (diffString.indexOf('"deployments"') > -1 || diffString.indexOf('deployments:') > -1) {
      changeList.push("Script Deployments Change");
    }

    if (diffString.indexOf('"returnrecordtype"') > -1 || diffString.indexOf('returnrecordtype:') > -1 ||
      diffString.indexOf('"returntype"') > -1 || diffString.indexOf('returntype:') > -1) {
      changeList.push("Script WF Action Return Type Change");
    }

    if (diffString.indexOf('"customplugintypes"') > -1 || diffString.indexOf('customplugintypes:') > -1) {
      changeList.push("Script Plugin Type Change");
    }

    if (diffString.indexOf('"custrecord_flo_script_functions"') > -1 || diffString.indexOf('custrecord_flo_script_functions:') > -1) {
      changeList.push("Script Function Change");
    }

    if (diffString.indexOf('"custrecord_flo_scripts_fields_view"') > -1 || diffString.indexOf('custrecord_flo_scripts_fields_view:') > -1) {
      changeList.push("Script Fields Change");
    }

    if (diffString.indexOf('"custrecord_flo_script_apis"') > -1 || diffString.indexOf('custrecord_flo_script_apis:') > -1) {
      changeList.push("Script API Change");
    }

  }
  return changeList;
}

function getListChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"customvalue":') > -1) {
      changeList.push("List Values Change");
    }

    if (diffString.indexOf('"scriptid"') > -1 || diffString.indexOf('scriptid:') > -1) {
      changeList.push("Script ID Change");
    }

  }
  return changeList;
}

function getWorkflowChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"states"') > -1 || diffString.indexOf('states:') > -1) {
      if (diffString.indexOf('"actionname"') > -1 || diffString.indexOf('actionname:') > -1) {
        changeList.push("Workflow Action Change");
      } else {
        changeList.push("Workflow States Change");
      }
    }

    if (diffString.indexOf('"subrecordtype"') > -1 || diffString.indexOf('subrecordtype:') > -1) {
      changeList.push("Subrecordtype Change");
    }

    if (diffString.indexOf('"savedsearch"') > -1 || diffString.indexOf('savedsearch:') > -1) {
      changeList.push("Search Change");
    }

    if (diffString.indexOf('"releasestatus"') > -1 || diffString.indexOf('releasestatus:') > -1) {
      changeList.push("Release Status Change");
    }

    if (diffString.indexOf('"condition"') > -1 || diffString.indexOf('condition:') > -1) {
      changeList.push("Condition Change");
    }

    if (diffString.indexOf('"transitions"') > -1 || diffString.indexOf('transitions:') > -1) {
      changeList.push("Workflow Transition Change");
    }

    // if (diffString.indexOf('"scriptid"') > -1 || diffString.indexOf('scriptid:') > -1) {
    //     changeList.push("Workflow Script ID Change");
    // }

    if (diffString.indexOf('"runasadmin"') > -1 || diffString.indexOf('runasadmin:') > -1) {
      changeList.push("Workflow Run as Admin Change");
    }

    if (diffString.indexOf('"islogenabled"') > -1 || diffString.indexOf('islogenabled:') > -1) {
      changeList.push("Workflow Log Enabled Change");
    }

    if (diffString.indexOf('"description"') > -1 || diffString.indexOf('description:') > -1) {
      changeList.push("Workflow Description Change");
    }

    if (diffString.indexOf('"initonschedule"') > -1 || diffString.indexOf('initonschedule:') > -1) {
      changeList.push("Workflow Initiation Change");
    }

    if (diffString.indexOf('"initoncreate"') > -1 || diffString.indexOf('initoncreate:') > -1 ||
      diffString.indexOf('"initonvieworupdate"') > -1 || diffString.indexOf('initonvieworupdate:') > -1 ||
      diffString.indexOf('"conditionuse"') > -1 || diffString.indexOf('conditionuse:') > -1 ||
      diffString.indexOf('"initconditioninbuilder"') > -1 || diffString.indexOf('initconditioninbuilder:') > -1 ||
      diffString.indexOf('"initconditiontext"') > -1 || diffString.indexOf('initconditiontext:') > -1 ||
      diffString.indexOf('"inittriggertype"') > -1 || diffString.indexOf('inittriggertype:') > -1 ||
      diffString.indexOf('"initeventtypes"') > -1 || diffString.indexOf('initeventtypes:') > -1 ||
      diffString.indexOf('"initcontexts"') > -1 || diffString.indexOf('initcontexts:') > -1 ||
      diffString.indexOf('"initsavedsearchcondition"') > -1 || diffString.indexOf('initsavedsearchcondition:') > -1 ||
      diffString.indexOf('"triggeroncreate"') > -1 || diffString.indexOf('triggeroncreate:') > -1 ||
      diffString.indexOf('"triggeronupdate"') > -1 || diffString.indexOf('triggeronupdate:') > -1) {
      changeList.push("Workflow Event Definition Change");
    }

    if (diffString.indexOf('"fields"') > -1 || diffString.indexOf('fields:') > -1) {
      changeList.push("Workflow Fields Change");
    }

    if (diffString.indexOf('"statefields"') > -1 || diffString.indexOf('statefields:') > -1) {
      changeList.push("Workflow State Fields Change");
    }

    if (diffString.indexOf('"actions"') > -1 || diffString.indexOf('actions:') > -1) {
      if (changeList.indexOf("Workflow Action Change") < 0)
        changeList.push("Workflow Action Change");
    }

    if (diffString.indexOf('"initsavedsearchfilter"') > -1 || diffString.indexOf('initsavedsearchfilter:') > -1 ||
      diffString.indexOf('"schedulerepeat"') > -1 || diffString.indexOf('schedulerepeat:') > -1 ||
      diffString.indexOf('"schedulefrequency"') > -1 || diffString.indexOf('schedulefrequency:') > -1 ||
      diffString.indexOf('"schedulefrom"') > -1 || diffString.indexOf('schedulefrom:') > -1 ||
      diffString.indexOf('"scheduleuntil"') > -1 || diffString.indexOf('scheduleuntil:') > -1 ||
      diffString.indexOf('"scheduleexecutiontime"') > -1 || diffString.indexOf('scheduleexecutiontime:') > -1) {
      changeList.push("Workflow Schedule Change");
    }

    // if (diffString.indexOf('"triggeroncreate"') > -1 || diffString.indexOf('triggeroncreate:') > -1 ||
    //     diffString.indexOf('"triggeronupdate"') > -1 || diffString.indexOf('triggeronupdate:') > -1) {
    //     changeList.push("Workflow Event Definition Change");
    // }
  }
  return changeList;
}

function getSearchChOverview(diffString, newRecord) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"filters":') > -1) {
      changeList.push("Filters Change");
    }

    if (diffString.indexOf('"columns":') > -1 || diffString.indexOf('"field_names":') > -1) {
      changeList.push("Columns Change");
    }

    if (diffString.indexOf('"title":') > -1) {
      changeList.push("Title Change");
    }

    if (diffString.indexOf('"sendscheduledemails":') > -1) {
      changeList.push("Send Email Change");
    }

    if (diffString.indexOf('"isPublic":') > -1) {
      changeList.push("Access Change");
    }

  }
  return changeList;
}

function getEFormChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"tab"') > -1 || diffString.indexOf('tab:') > -1) {
      changeList.push("Form Subtab Change");
    }

    if (diffString.match(/"[a-zA-Z0-9]+flds"/g) !== null) {
      changeList.push("Form Fields Change");
    }

    if (diffString.indexOf('"button"') > -1 || diffString.indexOf('button:') > -1 ||
      diffString.indexOf('"stdbuttons"') > -1 || diffString.indexOf('stdbuttons:') > -1) {
      changeList.push("Form Actions Change");
    }

    if (diffString.match(/"[a-zA-Z0-9]+machs"/g) !== null) {
      changeList.push("Form Lists Change");
    }

    if (diffString.indexOf('"scriptfile"') > -1 || diffString.indexOf('scriptfile:') > -1 ||
      diffString.match(/"[a-zA-Z]+function(2)?"/g) !== null) {
      changeList.push("Form Script Change");
    }

    if (diffString.indexOf('"roles"') > -1 || diffString.indexOf('roles:') > -1) {
      changeList.push("Form Access Change");
    }
  }
  return changeList;
}

function getTransFormChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"tab"') > -1) {
      changeList.push("Form Tab Change");
    }

    if (diffString.match(/"[a-zA-Z0-9]+flds"/g) !== null || diffString.indexOf('"body"') > -1) {
      changeList.push("Form Screen Fields Change");
    }

    if (diffString.indexOf('"button"') > -1 || diffString.indexOf('button:') > -1 ||
      diffString.indexOf('"stdbuttons"') > -1 || diffString.indexOf('stdbuttons:') > -1) {
      changeList.push("Form Actions Change");
    }

    if (diffString.match(/"[a-zA-Z0-9]+machs"/g) !== null) {
      changeList.push("Form Lists Change");
    }

    if (diffString.indexOf('"scriptfile"') > -1 || diffString.indexOf('scriptfile:') > -1 ||
      diffString.match(/"[a-zA-Z]+function(2)?"/g) !== null) {
      changeList.push("Form Script Change");
    }

    if (diffString.indexOf('"roles"') > -1 || diffString.indexOf('roles:') > -1) {
      changeList.push("Form Access Change");
    }

    if (diffString.indexOf('"workflow"') > -1 || diffString.indexOf('workflow:') > -1) {
      changeList.push("Form Linked Forms Change");
    }
  }
  return changeList;
}

function getOnlineCustFormChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"crmformfields"') > -1 || diffString.indexOf('crmformfields:') > -1) {
      changeList.push("Form Fields Change");
    }

    if (diffString.indexOf('"ldescr"') > -1 || diffString.indexOf('ldescr:') > -1) {
      changeList.push("Form Detail Message Change");
    }

    if (diffString.indexOf('"bCompanyWhenEntered"') > -1 || diffString.indexOf('bCompanyWhenEntered:') > -1 ||
      diffString.indexOf('"defaultprofile"') > -1 || diffString.indexOf('defaultprofile:') > -1 ||
      diffString.indexOf('"caseorigin"') > -1 || diffString.indexOf('caseorigin:') > -1 ||
      diffString.indexOf('"sRedirectUrl"') > -1 || diffString.indexOf('sRedirectUrl:') > -1 ||
      diffString.indexOf('"lookuprecordsqlorderby"') > -1 || diffString.indexOf('lookuprecordsqlorderby:') > -1 ||
      diffString.indexOf('"bUseDupWizCriteria"') > -1 || diffString.indexOf('bUseDupWizCriteria:') > -1 ||
      diffString.indexOf('"emailtemplate"') > -1 || diffString.indexOf('emailtemplate:') > -1 ||
      diffString.indexOf('"autoreplyemailsubject"') > -1 || diffString.indexOf('autoreplyemailsubject:') > -1 ||
      diffString.indexOf('"newrecntfytemplate"') > -1 || diffString.indexOf('newrecntfytemplate:') > -1 ||
      diffString.indexOf('"autonotifyccemails"') > -1 || diffString.indexOf('autonotifyccemails:') > -1) {
      changeList.push("Form Workflow Set-up Change");
    }

    if (diffString.indexOf('"numcols"') > -1 || diffString.indexOf('numcols:') > -1 ||
      diffString.indexOf('"colorset"') > -1 || diffString.indexOf('colorset:') > -1 ||
      diffString.indexOf('"font"') > -1 || diffString.indexOf('font:') > -1 ||
      diffString.indexOf('"isunlayered"') > -1 || diffString.indexOf('isunlayered:') > -1 ||
      diffString.indexOf('"buttonalignment"') > -1 || diffString.indexOf('buttonalignment:') > -1 ||
      diffString.indexOf('"logo"') > -1 || diffString.indexOf('logo:') > -1) {
      changeList.push("Form Appearance Change");
    }

    if (diffString.indexOf('"scriptfile"') > -1 || diffString.indexOf('scriptfile:') > -1 ||
      diffString.match(/"[a-zA-Z]+function(2)?"/g) !== null) {
      changeList.push("Form Script Change");
    }

    if (diffString.indexOf('"numhits"') > -1 || diffString.indexOf('numhits:') > -1 ||
      diffString.indexOf('"numsubmits"') > -1 || diffString.indexOf('numsubmits:') > -1 ||
      diffString.indexOf('"sInternalPageUrl"') > -1 || diffString.indexOf('sInternalPageUrl:') > -1) {
      changeList.push("Form External Change");
    }
  }
  return changeList;

}

function getCustRecChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"customfield"') > -1 || diffString.indexOf('customfield:') > -1) {
      changeList.push("Record Fields Change");
    }

    if (diffString.indexOf('"tabs"') > -1 || diffString.indexOf('tabs:') > -1) {
      changeList.push("Record Subtabs Change");
    }

    if (diffString.indexOf('"recordsublists"') > -1 || diffString.indexOf('recordsublists:') > -1) {
      changeList.push("Record Sublists Change");
    }

    if (diffString.indexOf('"iconbuiltin"') > -1 || diffString.indexOf('iconbuiltin:') > -1 ||
      diffString.indexOf('"iconindex"') > -1 || diffString.indexOf('iconindex:') > -1 ||
      diffString.indexOf('"icon"') > -1 || diffString.indexOf('icon:') > -1) {
      changeList.push("Record Icon Change");
    }

    if (diffString.indexOf('"enablenumbering"') > -1 || diffString.indexOf('enablenumbering:') > -1 ||
      diffString.indexOf('"numberingprefix"') > -1 || diffString.indexOf('numberingprefix:') > -1 ||
      diffString.indexOf('"numberingsuffix"') > -1 || diffString.indexOf('numberingsuffix:') > -1 ||
      diffString.indexOf('"numberingmindigits"') > -1 || diffString.indexOf('numberingmindigits:') > -1 ||
      diffString.indexOf('"numberinginit"') > -1 || diffString.indexOf('numberinginit:') > -1 ||
      diffString.indexOf('"allownumberingoverride"') > -1 || diffString.indexOf('allownumberingoverride:') > -1 ||
      diffString.indexOf('"isnumberingupdateable"') > -1 || diffString.indexOf('isnumberingupdateable:') > -1) {
      changeList.push("Record Numbering Change");
    }

    if (diffString.indexOf('"forms"') > -1 || diffString.indexOf('forms:') > -1) {
      changeList.push("Record Forms Change");
    }

    if (diffString.indexOf('"permissions"') > -1 || diffString.indexOf('permissions:') > -1) {
      changeList.push("Record Permissions Change");
    }

    if (diffString.indexOf('"links"') > -1 || diffString.indexOf('links:') > -1) {
      changeList.push("Record Links Change");
    }

    if (diffString.indexOf('"managers"') > -1 || diffString.indexOf('managers:') > -1) {
      changeList.push("Record Managers Change");
    }

    if (diffString.indexOf('"translations"') > -1 || diffString.indexOf('translations:') > -1) {
      changeList.push("Record Translations Change");
    }

    if (diffString.indexOf('"children"') > -1 || diffString.indexOf('children:') > -1) {
      changeList.push("Record Children Change");
    }

    if (diffString.indexOf('"parents"') > -1 || diffString.indexOf('parents:') > -1) {
      changeList.push("Record Parents Change");
    }
  }
  return changeList;

}

function getScriptDeployChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {

    if (diffString.indexOf('"audslctrole"') > -1 || diffString.indexOf('audslctrole:') > -1 ||
      diffString.indexOf('"allroles"') > -1 || diffString.indexOf('allroles:') > -1 ||
      diffString.indexOf('"auddepartment"') > -1 || diffString.indexOf('auddepartment:') > -1 ||
      diffString.indexOf('"audgroup"') > -1 || diffString.indexOf('audgroup:') > -1 ||
      diffString.indexOf('"audemployee"') > -1 || diffString.indexOf('audemployee:') > -1 ||
      diffString.indexOf('"allemployees"') > -1 || diffString.indexOf('allemployees:') > -1 ||
      diffString.indexOf('"audpartner"') > -1 || diffString.indexOf('audpartner:') > -1 ||
      diffString.indexOf('"allpartners"') > -1 || diffString.indexOf('allpartners:') > -1) {
      changeList.push("Deployment Audience Change");
    }

    if (diffString.indexOf('"status"') > -1 || diffString.indexOf('status:') > -1) {
      changeList.push("Deployment Release Status Change");
    }

    if (diffString.indexOf('"loglevel"') > -1 || diffString.indexOf('loglevel:') > -1) {
      changeList.push("Deployment Log Level Change ");
    }

    if (diffString.indexOf('"runasrole"') > -1 || diffString.indexOf('runasrole:') > -1) {
      changeList.push("Deployment Execute As Role Change");
    }

    if (diffString.indexOf('"_frequency"') > -1 || diffString.indexOf('_frequency:') > -1 ||
      diffString.indexOf('"startdate"') > -1 || diffString.indexOf('startdate:') > -1 ||
      diffString.indexOf('"starttime"') > -1 || diffString.indexOf('starttime:') > -1 ||
      diffString.indexOf('"recurrenceminutes"') > -1 || diffString.indexOf('recurrenceminutes:') > -1 ||
      diffString.indexOf('"enddate"') > -1 || diffString.indexOf('enddate:') > -1 ||
      diffString.indexOf('"noenddate"') > -1 || diffString.indexOf('noenddate:') > -1) {
      changeList.push("Deployment Schedule Change");
    }


    // if (diffString.indexOf('"scriptid"') > -1 || diffString.indexOf('scriptid:') > -1) {
    //     changeList.push("Deployment Script ID Change");
    // }
  }
  return changeList;
}

function getUserRoleChOverview(diffString) {
  var changeList = [];
  if (diffString && diffString.trim() != "") {
    if (diffString.match(/"[a-zA-Z0-9]+mach"/g) !== null) {
      changeList.push("User Role Permissions Change");
    }

    if (diffString.match(/"[a-zA-Z0-9]+formprefs"/g) !== null) {
      changeList.push("User Role Form Preferences Change");
    }

    if (diffString.match(/"searchprefs"/g) !== null || diffString.match(/"[a-zA-Z0-9]+searchprefs"/g) !== null) {
      changeList.push("User Role Search Preferences Change");
    }

    if (diffString.indexOf('"preferences"') > -1 || diffString.indexOf('preferences:') > -1) {
      changeList.push("User Role Preferences Change");
    }

    if (diffString.indexOf('"savedash"') > -1 || diffString.indexOf('savedash:') > -1) {
      changeList.push("User Role Dashboard Change");
    }

    if (diffString.indexOf('"translations"') > -1 || diffString.indexOf('translations:') > -1) {
      changeList.push("User Role Translations Change");
    }

    if (changeList.indexOf("User Role Permissions Change") == -1 && (diffString.indexOf('View') > -1 || diffString.indexOf('View:') > -1 ||
        diffString.indexOf('Create') > -1 || diffString.indexOf('Create:') > -1 ||
        diffString.indexOf('Edit') > -1 || diffString.indexOf('Edit:') > -1 ||
        diffString.indexOf('Full') > -1 || diffString.indexOf('Full:') > -1)) {
      changeList.push("User Role Permissions Change");
    }
  }
  return changeList;
}

 /*
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *
 * Released under the MIT license.
 *
 * More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 */

function escape(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");

    return n;
}

function diffString( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var str = "";

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        str += '<del>' + escape(out.o[i]) + oSpace[i] + "</del>";
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
        str += '<del color="red">' + escape(out.o[n]) + oSpace[n] + "</del>";
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
        str += '<ins>' + escape(out.n[i]) + nSpace[i] + "</ins>";
      } else {
        var pre = "";

        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
          pre += '<del color="red">' + escape(out.o[n]) + oSpace[n] + "</del>";
        }
        str += " " + out.n[i].text + nSpace[i] + pre;
      }
    }
  }
  
  return str;
}

function FLOdiffString( o, n, full) {
   //nlapiLogExecution('DEBUG', 'FLOdiffString 0', "FLOdiffString");
  try
  {
  if(o==null | o=="undefined" | o.toUpperCase()=="NO DATA AVAILABLE" | o.toUpperCase()=="NO DATA AVAILABLE,"){o=""}
  if(n==null){n=""}
  
 
  o = o.replace(/,/g,' ').replace(/<nsapiCT>([0-9])*<\/nsapiCT>/gi,"").replace(/<_eml_nkey_>([0-9])*<\/_eml_nkey_>/gi,"").replace(/<entryformquerystring>.*<\/entryformquerystring>/gi,"").replace(/<\?xml version.*<accesslevel>/gi,"<accesslevel>").replace(/<whence>.*<\/whence>/gi,"").replace(/<whence>.*<\/nsResponse>/gi,"").replace(/<numberingcurrentnumber>.+<\/numberingcurrentnumber>/gi,"").replace(/<schedulefrom>.+<\/schedulefrom>/gi,"").replace(/\>\</g,'>  <').replace(/cust/g,' cust').replace(/set/ig,' set').replace(/get/ig,' get').replace(/set/ig,' set').replace(/nl/ig,' nl').replace(/\s+$/, '');
  n = n.replace(/,/g,' ').replace(/<nsapiCT>([0-9])*<\/nsapiCT>/gi,"").replace(/<_eml_nkey_>([0-9])*<\/_eml_nkey_>/gi,"").replace(/<entryformquerystring>.*<\/entryformquerystring>/gi,"").replace(/<\?xml version.*<accesslevel>/gi,"<accesslevel>").replace(/<whence>.*<\/whence>/gi,"").replace(/<whence>.*<\/nsResponse>/gi,"").replace(/<numberingcurrentnumber>.+<\/numberingcurrentnumber>/gi,"").replace(/\>\</g,'>  <').replace(/<schedulefrom>.+<\/schedulefrom>/gi,"").replace(/cust/g,' cust').replace(/set/ig,' set').replace(/get/ig,' get').replace(/set/ig,' set').replace(/nl/ig,' nl').replace(/\s+$/, '');
 if(o==n) return "";
 if(n.indexOf(o)>=0){return '<ins style="color:green">'+n.replace(o,"")+'</ins>'}

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var str = "";

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        str += '<del style="color:red">' + escape(out.o[i]) + oSpace[i] + "xxdelxx";
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
        str += '<del style="color:red">' + escape(out.o[n]) + oSpace[n] + "xxdelxx";
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
        str += '<ins style="color:green">' + escape(out.n[i]) + nSpace[i] + "</ins>";
      } else {
        var pre = "";

        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
          pre += '<del style="color:red">' + escape(out.o[n]) + oSpace[n] + "xxdelxx";
        }
       if(full==null)
        {
              str += " " + /*out.n[i].text +*/ nSpace[i] + pre;
         }
       else
        {
            //nlapiLogExecution("debug","full");
            str += " " + out.n[i].text + nSpace[i] + pre;
        }
      }
    }
  }

   if(full==null)
   {
      
       str=str.replace(/\<del style="color:red"\>/g,'<del style="color:red">(').replace(/xxdelxx/g,')</del>');
   }
   else
   {
      str=str.replace(/xxdelxx/g,'</del>');
   }

  // nlapiLogExecution('DEBUG', 'str 0', str);
   if(str!=null) {
       str = str.trim().replace(/\s\)/g,')');
      //  nlapiLogExecution('DEBUG', 'str 1', str);
   }
 
  return str;
  }
  catch(e)
  {return "FLO DIFF ERROR"}
}

function randomColor() {
    return "rgb(" + (Math.random() * 100) + "%, " + 
                    (Math.random() * 100) + "%, " + 
                    (Math.random() * 100) + "%)";
}
function diffString2( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  var os = "";
  var colors = new Array();
  for (var i = 0; i < out.o.length; i++) {
      colors[i] = randomColor();

      if (out.o[i].text != null) {
          os += '<span style="background-color: ' +colors[i]+ '">' + 
                escape(out.o[i].text) + oSpace[i] + "</span>";
      } else {
          os += "<del>" + escape(out.o[i]) + oSpace[i] + "</del>";
      }
  }

  var ns = "";
  for (var i = 0; i < out.n.length; i++) {
      if (out.n[i].text != null) {
          ns += '<span style="background-color: ' +colors[out.n[i].row]+ '">' + 
                escape(out.n[i].text) + nSpace[i] + "</span>";
      } else {
          ns += "<ins>" + escape(out.n[i]) + nSpace[i] + "</ins>";
      }
  }
  //alert(os)
  //alert(ns)

  return { o : os , n : ns };
}

function diff( o, n ) {
  var ns = new Object();
  var os = new Object();
  
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }
  
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }
  
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  
  for ( var i = 0; i < n.length - 1; i++ ) {
    if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null && 
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }
  
  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null && 
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }
  
  return { o: o, n: n };
}