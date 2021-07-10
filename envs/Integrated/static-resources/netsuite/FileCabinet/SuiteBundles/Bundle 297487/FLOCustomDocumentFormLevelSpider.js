/**
 *@NApiVersion 2.x
 *@NScriptType suitelet
 */
define(['N/record', 'N/format', 'N/search', 'N/https', 'N/xml', 'N/file', 'N/runtime', 'N/redirect'],
    function(record, format, search, https, xml, file, runtime, redirect) {
        const CUSTOM_ENTRY_FORM = 6;
        const CUSTOM_RECORD = 2;
        const CLIENT_SCRIPT = 20;
        const DATA_TYPE = 'RECORD';
        var MAX_TIME = 25000; //25 seconds

        var startTime = new Date().getTime();

        function onRequest(context) {
            var formsToProcess = {lines: []};
            try {
                log.debug('FLO Start');

                // Get the current sessions' headers
                var request = context.request;
                log.debug('request', JSON.stringify(request));

                var domain = request.url.split('/app/')[0]
                log.debug('domain', domain);

                log.debug('response', JSON.stringify(context.response));

                var isAutoSpider = request.parameters.isautospider;
                if (isAutoSpider == "T") {
                    // set MAX TIME to 4 minutes
                    MAX_TIME = 240000;
                    try {
                        // var spiderBackendDate = nlapiLookupField('customrecord_flo_spider_configuration', 1, 'custrecord_flo_spider_back_en_date') || "";
                        var spiderData = search.lookupFields({
                            type: 'customrecord_flo_spider_configuration',
                            id: 1,
                            columns: 'custrecord_flo_spider_back_en_date'
                        });
                        log.debug('spiderData', JSON.stringify(spiderData));
                        log.debug('spiderData', spiderData.custrecord_flo_spider_back_en_date);

                        var spiderBackendDate = null;
                        if (spiderData !== null) {
                            spiderBackendDate = spiderData.custrecord_flo_spider_back_en_date;
                        }
                        log.debug('spiderBackendDate', spiderBackendDate);

                        if (spiderBackendDate == null || spiderBackendDate == '' || spiderBackendDate == undefined) {
                            log.audit('Initial spider not finished', 'Exiting because initial spider did not finished...')
                            return;
                        }
                    } catch (ee) {
                        //
                    }
                }

                var isRespiderNow = request.parameters.respidernow;
                var procstart = request.parameters.itemNum;
                var counter = request.parameters.counter || 0;
                var linecount = request.parameters.linecount || 0;
                if (!isNaN(procstart) && parseInt(procstart) > 0) {
                    procstart = parseInt(procstart);
                } else {
                    procstart = 0;
                }

                if (!isNaN(linecount) && parseInt(linecount) > 0) {
                    linecount = parseInt(linecount);
                } else {
                    linecount = 0;
                }

                if (isRespiderNow == "T") {
                    var floCustomization = null;
                    var floCustomizationId = procstart;

                    log.debug('floCustomizationId', floCustomizationId);
                    if (floCustomizationId > -1) {
                        floCustomization = record.load({
                            type: 'customrecord_flo_customization',
                            id: floCustomizationId
                        });
                    } else {
                        // skip other forms 
                        return;
                    }

                    if (floCustomization) {
                        var xmlData = getXmlData(request, getFormUrl(domain, '', '', '', floCustomization));

                        if (xmlData != null) {
                            var xmlDocument = xml.Parser.fromString({
                                text: xmlData
                            });

                            var recordNodes = xml.XPath.select({
                                node: xmlDocument,
                                xpath: '//record'
                            });
                            log.debug('data', JSON.stringify(recordNodes[0]));

                            if (recordNodes.length > 0) {
                                if (recordNodes[0].getElementsByTagName({
                                        tagName: 'formname'
                                    })[0] !== undefined) {
                                    var formName = recordNodes[0].getElementsByTagName({
                                        tagName: 'formname'
                                    })[0].textContent;

                                    floCustomization.setValue({
                                        fieldId: 'name',
                                        value: formName
                                    });
                                    log.debug('formName', formName);
                                }

                                floCustomization.setValue({
                                    fieldId: 'custrecord_flo_cust_page_xml',
                                    value: xmlData
                                });
                                floCustomization.setValue({
                                    fieldId: 'custrecord_flo_make_join_proc',
                                    value: false
                                });

                                floCustomization.setValue({
                                    fieldId: 'custrecord_flo_autospider_found',
                                    value: false
                                });
                                
                                // Save FLO Customization
                                var floCustomizationInternalId = floCustomization.save({
                                    ignoreMandatoryFields: true
                                });
                                log.debug('save', floCustomizationInternalId);
                            }
                        }
                    }

                } else {
                    // Search for all active custom types
                    var customRecordTypeSearch = search.create({
                        type: "customrecordtype",
                        columns: [{
                            name: 'internalId',
                            sort: search.Sort.ASC
                        }],
                        filters: [
                            ['isinactive', 'is', 'F'], 'AND', ['internalidnumber', 'greaterthanorequalto', procstart]
                        ]
                    });

                    var crtSearchResult = customRecordTypeSearch.run().getRange({
                        start: 0,
                        end: 999
                    });
                    log.debug('crtSearchResult count', crtSearchResult.length);

                    log.debug('procstart', procstart);
                    log.debug('linecount', linecount);
                    var script = runtime.getCurrentScript();
                    log.debug('getRemainingUsage', script.getRemainingUsage());

                    for (var i = 0; i < crtSearchResult.length; i++) {
                        //++ NS-2092
                        try {
                            var internalId = crtSearchResult[i].getValue('internalId');
                            if (internalId < procstart) {
                                log.debug('Skipped', internalId);
                                continue;
                            }
                            var remainingUsage = script.getRemainingUsage();
                            var timeDiff = new Date().getTime() - startTime;
                            log.debug('Remaining usage', remainingUsage + ' - ' + timeDiff);
                            if (remainingUsage <= 200 || timeDiff > MAX_TIME  || JSON.stringify(formsToProcess).length > 2000000) {
                                if(formsToProcess.lines.length > 0) {
                                    storeFile(formsToProcess,counter);
                                }
                                if (isAutoSpider == "T") {
                                    var sparams = {
                                        itemNum: internalId,
                                        linecount: 0,
                                        counter: counter,
                                        isautospider: 'T'
                                    };
                                    redirect.toSuitelet({
                                        scriptId: 'customscript_cstm_doc_form_lvl_spider',
                                        deploymentId: 1,
                                        parameters: sparams
                                    });
                                    return;
                                } else {
                                    var retobj = {};
                                    retobj.internalId = internalId;
                                    retobj.linecount = 0;
                                    retobj.counter = counter;
                                    context.response.write(JSON.stringify(retobj));
                                    return;
                                }
                            }

                            log.debug('Selected', internalId);

                            // Load current custom record type
                            var customRecord = record.load({
                                type: 'customrecordtype',
                                id: internalId
                            })

                            // Retrieve the record's form sublist
                            var forms = customRecord.getSublist({
                                sublistId: 'forms'
                            });
                            log.debug("forms", JSON.stringify(forms));

                            if (forms !== null) {
                                // Get the number of forms
                                var formCount = customRecord.getLineCount({
                                    sublistId: 'forms'
                                });

                                for (var j = linecount; j < formCount; j++) {
                                    try {
                                        remainingUsage = script.getRemainingUsage();
                                        timeDiff = new Date().getTime() - startTime;
                                        log.debug('Remaining usage 2', remainingUsage + ' - ' + timeDiff);
                                        if (remainingUsage <= 200 || timeDiff > MAX_TIME || JSON.stringify(formsToProcess).length > 2000000) {
                                            if(formsToProcess.lines.length > 0) {
                                                storeFile(formsToProcess,counter);
                                            }
                                            if (isAutoSpider == "T") {
                                                var sparams = {
                                                    itemNum: internalId,
                                                    linecount: j,
                                                    counter: counter,
                                                    isautospider: 'T'
                                                };
                                                redirect.toSuitelet({
                                                    scriptId: 'customscript_cstm_doc_form_lvl_spider',
                                                    deploymentId: 1,
                                                    parameters: sparams
                                                });
                                                return;
                                            } else {
                                                var retobj = {};
                                                retobj.internalId = internalId;
                                                retobj.linecount = j;
                                                retobj.counter = counter;
                                                context.response.write(JSON.stringify(retobj));
                                                return;
                                            }
                                        }

                                        // Get the custom records' form id
                                        var formId = customRecord.getSublistValue({
                                            sublistId: 'forms',
                                            fieldId: 'formnameid',
                                            line: j
                                        });
                                        log.debug('formId', JSON.stringify(formId));

                                        var formName = customRecord.getSublistValue({
                                            sublistId: 'forms',
                                            fieldId: 'formname',
                                            line: j
                                        });
                                        log.debug('formName', JSON.stringify(formName));

                                        // Get the custom records' form url
                                        var formUrl = customRecord.getSublistValue({
                                            sublistId: 'forms',
                                            fieldId: 'formnameurl',
                                            line: j
                                        });
                                        log.debug('formUrl', JSON.stringify(formUrl));

                                        // Get the custom records' form edit url
                                        var formEditUrl = customRecord.getSublistValue({
                                            sublistId: 'forms',
                                            fieldId: 'formediturl',
                                            line: j
                                        });
                                        log.debug('formEditUrl', JSON.stringify(formEditUrl));

                                        // Skip standard forms
                                        if (formId == null || formId == '' || formId < 0) {
                                            log.debug('Skipped: Standard Form', formId);
                                            continue;
                                        }
                                        counter++;
                                        
                                        var canUpdate = true;
                                        var floCustomization = null; 
                                        var fEditUrl = domain + formEditUrl + '&id=' + formId;
                                        if (isAutoSpider == 'T') {
                                            var floCustomizationId = getFloCustomizationInternalId(formId, CUSTOM_ENTRY_FORM);
                                            log.debug('floCustomizationId', floCustomizationId);
                                            if (floCustomizationId > -1) {
                                                var floCustomization = record.load({type: 'customrecord_flo_customization',id: floCustomizationId})
                                                canUpdate = checkHistoryIfCanUpdate(request, domain, fEditUrl,floCustomization);
                                                log.audit('Skipping Form', floCustomizationId);
                                            }
                                        } 

                                        if (canUpdate) {
                                            try {
                                                log.debug('EDIT URL', fEditUrl);
                                                formName = formName.replace(/,/g,'&#44;')
                                                var fieldcust = "Start,Description:" + formName + ",Name:" + formName + ",Internal_ID:" + formId + ",ID:,Link:" + formEditUrl + "&id=" + formId + ",Type:RECORD,End";
                                                var xmlData = getXmlData(request, fEditUrl);

                                                var fileContent = {};
                                                fileContent.custrecord_flo_cust_page_xml = xmlData;
                                                fileContent.customizationstring = fieldcust;
                                                fileContent.Internal_Id = formId;
                                                fileContent.rectype = 'Custom Record Form';
                                                fileContent.rectypeNumAux = CUSTOM_ENTRY_FORM;
                                                fileContent.itemNum = counter;
                                                formsToProcess.lines.push(fileContent);
                                            } catch (ex) {
                                                log.audit('Error in save', ex);
                                            }

                                        }
                                    } catch (ein) {
                                        log.audit('Error in inner for loop', ein);
                                    }
                                }
                            }
                            linecount = 0;
                        } catch (eout) {
                            log.audit('Error in outer for loop', eout);
                        }
                    }

                    if(formsToProcess.lines.length > 0) {
                        storeFile(formsToProcess,counter);
                    }
                }

                var doneObj = {};
                doneObj.internalId = "done";
                doneObj.linecount = "done";
                doneObj.counter = counter;
                context.response.write(JSON.stringify(doneObj));

                log.debug('FLO End');
            } catch (e) {
                log.audit('Error', e);
            }
        }

        return {
            onRequest: onRequest
        };

        /**
         * Filter inactive forms
         **/
        function getOnlyActiveForms(formsList) {
            var activeFormsList = [];

            if (formsList && formsList.length > 0 && formsList[0] != "") {
                var exclude_inactive_forms_search = search.create({
                    type: 'customrecord_flo_customization',
                    columns: ['custrecord_flo_int_id', 'isinactive', 'custrecord_flo_cust_type', 'internalid'],
                    filters: [
                        ['internalid', 'anyof', formsList], 'AND', ['isinactive', 'is', 'F']
                    ]
                });

                var excludeInactiveFormsResult = exclude_inactive_forms_search.run().getRange({
                    start: 0,
                    end: 999
                });

                if (excludeInactiveFormsResult) {
                    for (var ar = 0; ar < excludeInactiveFormsResult.length; ar++) {
                        activeFormsList.push(parseInt(excludeInactiveFormsResult[ar].getValue('internalid')));
                    }
                }
            }

            log.debug('PAX', 'FORMS LIST: ' + JSON.stringify(activeFormsList));
            return activeFormsList;
        }

        /**
         * Get History data of the record. Check if record was updated in the past 2 days. If true, skip update
         **/
        function checkHistoryIfCanUpdate(request, domain, formUrl,customization) {
            var isToRespider =  customization.getValue('custrecord_flo_autospider_found');

            if(isToRespider === true) {
                return true;
            }
            var url = formUrl+ '&r=T&machine=history';

            log.debug('url', url);
            var response = https.get({
                url: url,
                headers: request.headers
            });

            if (response !== null && response !== undefined && response !== '') {
                var history = response.body;
                var strDate = format.format({
                    value: new Date(),
                    type: format.Type.DATE
                });
                var yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                var strDateYes = format.format({
                    value: yesterday,
                    type: format.Type.DATE
                });
              	var twoDaysAgo = new Date();
              	twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
              	var strDateTwoDaysAgo = format.format({
                    value: twoDaysAgo,
                    type: format.Type.DATE
                });

                if (history.indexOf(strDate) >= 0 || history.indexOf(strDateYes) >= 0 || history.indexOf(strDateTwoDaysAgo) >= 0) {
                    log.debug('found match', 'This record ' + formUrl + ' was recently updated. Processing...');
                    return true;
                }
            }

          	log.debug('No recent updates for ' + url, 'Skipping...');
            return false;
        }

        /**
         * Get Entry Form Url
         **/
        function getFormUrl(domain, custId, parentId, dataType, customization) {
            var custid = custId;
            var parentid = parentId;
            var formtype = dataType;

            if (customization) {
                custid = customization.getValue('custrecord_flo_int_id');
                parentid = customization.getValue('custrecord_flo_cust_parent')[0];
                formtype = customization.getValue('custrecord_flo_data_type');
            }

            log.debug('record cust id', custid);
            log.debug('parent record id', parentid);
            log.debug('form type', formtype);

            if (parentid) {
                var parentCust = record.load({
                    type: 'customrecord_flo_customization',
                    id: parentid
                });

                parentid = parentCust.getValue('custrecord_flo_int_id');
            }
            log.debug('parent record cust id', parentid);
            var formUrl = '/app/common/custom/custentryform.nl?ft=' + formtype + '&rt=' + parentid;
            var url = domain + formUrl + '&e=T&id=' + custid;

            log.audit('ENTRY FORM URL: ', url);
            return url;
        }

        /**
         * Get XML data of the record
         **/
        function getXmlData(request, url) {
            if (url == null || url == "") {
                return null;
            }

            var xmlUrl = url + '&xml=T';
            var response = https.get({
                url: xmlUrl,
                headers: request.headers
            });

            if (response !== null && response !== undefined && response !== '') {
                var xmlData = response.body;
                log.debug('xmlData', JSON.stringify(xmlData));

                return xmlData;
            }

            return null;
        }

        /**
         * Tries to retrieve the FLO Customization record and return its Iternal ID
         **/
        function getFloCustomizationInternalId(internalId, type) {
            // log.debug('internalId', internalId);
            log.debug('type', type);

            var customrecord_flo_customization_record = search.create({
                type: 'customrecord_flo_customization',
                columns: ['custrecord_flo_int_id', 'isinactive', 'custrecord_flo_cust_type', 'internalid'],
                filters: [
                    ['custrecord_flo_cust_type', 'anyof', [type]], 'AND', ['isinactive', 'is', 'F'], 'AND', ['custrecord_flo_int_id', 'equalto', internalId]
                ]
            });

            var customizationInternalId = -1;
            var searchResultCustomFlo = customrecord_flo_customization_record.run().getRange({
                start: 0,
                end: 1
            });

            log.debug('JSON', JSON.stringify(searchResultCustomFlo[0]));

            if (searchResultCustomFlo != null && searchResultCustomFlo[0] != null && searchResultCustomFlo[0].getValue({
                    name: 'internalid'
                }) != '') {
                customizationInternalId = searchResultCustomFlo[0].getValue({
                    name: 'internalid'
                });
            }

            return customizationInternalId;
        }

        //Stores xml and customization string in a spider data folder
        function storeFile(fileJSON,count) {
            try {
                
                var foldersearch = search.load({type: 'folder', id: 'customsearch_flo_spider_folder'});
                var folderResult = foldersearch.run().getRange(0,1);
                if(folderResult && folderResult[0]) {
                    var folderid = folderResult[0].id;
                    var filename = 'customrecordforms-'+count+".txt";
                    var contents = JSON.stringify(fileJSON);
                    var jsonfile = file.create({
                        name: filename,
                        contents:contents,   
                        folder: folderid, 
                        fileType: 'PLAINTEXT'
                    });
                    var id = jsonfile.save();
                    log.debug('storeFile', contents);
                }
            } catch(e) {
                log.debug('storeFile',e);
            }
        }

    }
);