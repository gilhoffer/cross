/**
 * Copyright (c) 1998-2016 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 
     Author:        PSG Services
     Company:       NetSuite, Inc.
     Date:          
     Version:       
     Details:       Client Script for adding Custom Button for updating LSA field on-demand.
*   
*/

/*
 * Client script function for Update LSA button
 */
function lsaUpdateButton(){
    // get current record, add to url params
    var params = '&custparam_rectype=' + nlapiGetRecordType() + '&custparam_recid=' + nlapiGetRecordId();
    // update LSA thru suitelet
    var url = nlapiResolveURL('SUITELET', 'customscript_lsa_sl_update_lsa', 'customdeploy_lsa_sl_update_lsa') + params;
    window.location = url;
}
