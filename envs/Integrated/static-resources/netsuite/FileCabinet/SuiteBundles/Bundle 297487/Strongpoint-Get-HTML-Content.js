/**
* @NApiVersion 2.x
* @NScriptType Suitelet
*/
define(['N/runtime', 'N/workflow', 'N/search', 'N/record', 'N/https', 'N/url', 'N/log' , 'N/xml', 'N/format'], 
    function (runtime, workflow, search, record, https, urlMod, log, xml, format) {
        function onRequest(context) {
            var request = context.request;
            log.debug("Context ", context)
            try {
                var metricsSearch = search.load({
                    type: 'customrecord_flo_customization',
                    id: 'customsearch_flo_custom_metrics'
                });
                log.debug("Metrics Search ", metricsSearch);
                metricsSearch.run().each(function(result){
                    log.debug("Metrics Result ", result);
                    log.debug("Metrics Result Type ", result.getValue({name: 'custrecord_flo_search_cust_rec'}));
                    log.debug("Metrics Result ID ", result.getValue({name: 'custrecord_flo_int_id'}));
                    var searchInternalId = result.getValue({name: 'custrecord_flo_int_id'});
                    var searchRecord = record.load({
                        type: 'customrecord_flo_customization',
                        id: result.id
                    });

                    var savedSearchExecutionLogs = [];

                    var htmlExecutionLogs = getHtmlContents(request, searchInternalId);
                    log.debug("Metrics Search HTML Contents ", htmlExecutionLogs);

                    htmlExecutionLogs = htmlExecutionLogs.substring(htmlExecutionLogs.indexOf('<table'), htmlExecutionLogs.indexOf('</table>') + 8);
                    htmlExecutionLogs = htmlExecutionLogs.replace(/&nbsp;/g, '');

                    try {
                        var xmlObject = xml.Parser.fromString({text: htmlExecutionLogs});
                        log.debug("xmlObject", xmlObject);
                        var trNodes = xml.XPath.select({
                            node: xmlObject, 
                            xpath: '//table/TR'
                        });

                        for(var j in trNodes) {
                            var executionTime = trNodes[j].firstChild.textContent;
                            executionTime = format.parse({
                                value: executionTime,
                                type: format.Type.DATETIMETZ
                            });
                            log.debug("executionTime", executionTime);
                            executionTime = executionTime.getTime();
                            log.debug("executionTime", executionTime);
                            var user = trNodes[j].firstChild.nextSibling.textContent;
                            log.debug("user", user);
                            savedSearchExecutionLogs.push({
                                executionTime: executionTime,
                                user: user
                            });
                        }
                    }
                    catch(eXML) {
                        log.debug("eXML", eXML);
                    }                    

                    searchRecord.setValue({
                        fieldId: 'custrecord_flo_html_execution_logs',
                        value: JSON.stringify(savedSearchExecutionLogs)
                    });
                    searchRecord.save({ 
                        ignoreMandatoryFields: true 
                    });
                    return true;
                });
            } catch(error) {
                log.debug("Error",error)
            }
        }

        function getHtmlContents(request, searchInternalId) {
            log.debug("Metrics Search Account ID ", runtime.accountId);
            var url = 'https://' + runtime.accountId + '.app.netsuite.com/app/common/search/search.nl?id=' + searchInternalId + '&e=T&searchtype=Custom&adv=T&cu=T&r=T&e=T&id=' + searchInternalId + '&machine=runlog';
            log.debug("Execution Logs URL ", url);
            log.debug("Execution Logs Header ", request.headers);
            var response = https.get({
                url: url,
                headers: request.headers
            });
            return response.body;
        }

        return {
            onRequest: onRequest
        };
});