/*
@NApiVersion 2.0
@NScriptType ClientScript
@NModuleScope Public
*/
define([], function () {
    function showMessage(context) {
        var message = "This customer has not provided a billing email address. Please reach out to receive an updated address for invoices";
        var email = context.currentRecord.getValue({
            "fieldId": "email"
        });
 
        if (!email) {
            alert(message);
        }
    }
 
    return {
        pageInit: showMessage
    };
});