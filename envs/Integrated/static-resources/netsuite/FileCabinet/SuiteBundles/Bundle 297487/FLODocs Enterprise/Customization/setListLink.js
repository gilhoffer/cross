function setListLink(rec_type, rec_id)
{
  var thisCust=nlapiLoadRecord(rec_type, rec_id);
  nlapiLogExecution("debug","link",thisCust.getFieldValue("custrecord_flo_custz_link"))
  if(thisCust.getFieldValue("custrecord_flo_custz_link").indexOf("custlist.nl?")<0)
  {
thisCust.setFieldValue(("custrecord_flo_custz_link"),'https://system.na1.netsuite.com/app/common/custom/custlist.nl?hasowneraccess=T&e=T&whence=&id='+thisCust.getFieldValue("custrecord_flo_int_id"));
nlapiLogExecution("debug","newlink",thisCust.getFieldValue("custrecord_flo_custz_link"))
nlapiSubmitRecord(thisCust); 
}
}