function FLOCustPortlet(portlet, column)
{
    content='<table width="100%"><tr><td id="mapdiv" width="75%"><iframe name="processmap" id="processmap" border="0" height="1000" width="100%" src="https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=305&deploy=1&pid=1704" seamless></iframe></td>';
content+='<td id="detaildiv" width="25%" ><iframe name="processdetail" id="processdetail" border="0" height="1000" width="100%" src="https://system.na1.netsuite.com/app/common/custom/custrecordentry.nl?target=main:custrecord_cust_parent&label=Parent&rectype=303&label=Parent&id=3" seamless></iframe></td></tr></table>';
portlet.setTitle("SuiteView<subscript>&trade;</subscript> NetSuite Explorer by FLO<subscript>&trade;</subscript>");
    portlet.setHtml( content );

}