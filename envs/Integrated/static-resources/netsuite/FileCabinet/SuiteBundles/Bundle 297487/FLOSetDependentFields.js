/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * 
 * NS-2421
 * This script sets the custrecord_flo_dependent_fields of the customization
 * record.
 * Supports the following cases:
 * - Record referenced as list by a field
 * - List referenced by a field
 * - Search used as source by a field
 * - Field used as source by another field
 * - Field used in the default formula by another field
 */
define(['N/search', 'N/record', 'N/error'],
    function(search, record, error)
    {
        function createSummaryLog(summary)
        {
            log.audit('Summary', 'seconds: ' + summary.seconds + ' usage: ' + summary.usage + ' yields: ' + summary.yields);
        }

        function getInputData()
        {
            log.debug("getInputData","loading search...");
            return search.create({
                type: "customrecord_flo_customization",
                filters: [
                    ["isinactive", "is", "F"],
                    "AND",
                    ["formulatext: {custrecord_flo_data_source}","isnotempty",""],
                    "AND",
                    ["custrecord_flo_cust_type","anyof",[25,3,26,27,28,4,5,29,30]]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({name: "custrecord_flo_data_source"}),
                ]
            });
        }

        function map(context)
        {
            log.audit("context.value", context.value);

            try {
                var searchResult = JSON.parse(context.value);
                var id = searchResult.id;
                var datasources = searchResult.values.custrecord_flo_data_source || [];

                log.debug("MAP datasources", datasources);

                if (Array.isArray(datasources)) {
                    for (var i = 0; i < datasources.length; i++) {
                        log.debug("MAP datasources["+i+"]", datasources[i]);
                        log.debug("MAP internalid", id);

                        context.write({
                            key: datasources[i],
                            value: id
                        });
                    }
                } else {
                    log.debug("MAP datasources is NOT array", datasources.value);
                    context.write({
                        key: datasources.value,
                        value: id
                    });
                }
            } catch (e) {
                log.debug('MAP exception', e);
            }
        }

        function reduce(context)
        {
            log.debug("REDUCE context",context);

            try {
                var key = context.key;
                var values = context.values.sort();

                var customization = record.load({
                    type: "customrecord_flo_customization",
                    id: key
                });

                var oldDependentFields = customization.getValue({ fieldId: "custrecord_flo_dependent_fields" }) || [];

                if (Array.isArray(oldDependentFields)) {
                    oldDependentFields = oldDependentFields.sort();
                } else {
                    oldDependentFields = [oldDependentFields.value];
                }

                var newDependentFields = values.concat(filterExternalCustomFields(oldDependentFields));

              	log.debug("REDUCE newDependentFields", newDependentFields.sort());
              	log.debug("REDUCE oldDependentFields", oldDependentFields.sort());
                if (JSON.stringify(newDependentFields.sort()) != JSON.stringify(oldDependentFields.sort())) {
                    customization.setValue({ fieldId: "custrecord_flo_dependent_fields", value: newDependentFields });
                    customization.save();
                    log.debug("REDUCE saving", key);
                }
            } catch (e) {
                log.debug('REDUCE exception', e);
            }
        }

        // remove current dependent fields in the new list
        // except for External Custom Fields because
        // they are manually added
        function filterExternalCustomFields(fields) {
            var newFields = [];

            for (var i = 0; i < fields.length; i++) {
                try {
                    var fieldLookUp = search.lookupFields({
                        type: 'customrecord_flo_customization',
                        id: fields[i],
                        columns: ['custrecord_flo_cust_type']
                    });

                    if (fieldLookUp && fieldLookUp.custrecord_flo_cust_type && fieldLookUp.custrecord_flo_cust_type.length > 0) {
                        log.debug('REDUCE filterExternalCustomFields', fieldLookUp.custrecord_flo_cust_type[0].text);
                        if (fieldLookUp.custrecord_flo_cust_type[0].text == "External Custom Field") {
                            newFields.push(fields[i]);
                        }
                    }
                } catch (ex) {
                    log.debug('REDUCE filterExternalCustomFields exception', ex);
                }
            }

            return newFields;
        }


        function summarize(summary)
        {
            handleErrorIfAny(summary);
            createSummaryLog(summary);
        }


        function handleErrorAndSendNotification(e, stage)
        {
            log.audit('Stage: ' + stage + ' failed', e);
        }

        function handleErrorIfAny(summary)
        {
            var inputSummary = summary.inputSummary;
            var mapSummary = summary.mapSummary;
            var reduceSummary = summary.reduceSummary;

            if (inputSummary.error)
            {
                var e = error.create({
                    name: 'INPUT_STAGE_FAILED',
                    message: inputSummary.error
                });
                handleErrorAndSendNotification(e, 'getInputData');
            }

            handleErrorInStage('map', mapSummary);
            handleErrorInStage('reduce', reduceSummary);
        }

        function handleErrorInStage(stage, summary)
        {
            var errorMsg = [];
            summary.errors.iterator().each(function(key, value){
                var msg = 'Process failure on customization id: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
                errorMsg.push(msg);
                return true;
            });
            if (errorMsg.length > 0)
            {
                var e = error.create({
                    name: 'RECORD_TRANSFORM_FAILED',
                    message: JSON.stringify(errorMsg)
                });
                handleErrorAndSendNotification(e, stage);
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    }
);