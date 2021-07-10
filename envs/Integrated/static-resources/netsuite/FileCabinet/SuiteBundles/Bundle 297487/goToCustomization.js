nlapiLogExecution("audit","FLOStart",new Date().getTime())
function goToCustomization(request,response)
{
  cid=request.getParameter("cid");
  nlapiLogExecution("debug",cid)
  if(cid!=null && cid!="")
  {response.write("<html><body><script>window.location.href='"+nlapiResolveURL("RECORD","customrecord_flo_customization",cid)+"';</script></body></html>")}
}