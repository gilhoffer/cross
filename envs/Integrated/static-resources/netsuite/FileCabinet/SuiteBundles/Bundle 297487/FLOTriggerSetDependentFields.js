/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

define(['N/task'],
function(task) {
    function afterSubmit(context) {
        try {
            var newRec = context.newRecord;
            var oldRec = context.oldRecord;

            if (oldRec) {
                var completeStatusNew = newRec.getText({fieldId:"custrecord_flo_make_joins"});
                var completeStatusOld = oldRec.getText({fieldId:"custrecord_flo_make_joins"});

                log.debug('completeStatusNew',completeStatusNew);
                log.debug('completeStatusOld',completeStatusOld);

				if (completeStatusNew != completeStatusOld && completeStatusNew == "Completed")  {
                    // call Flag Item On Hand MapReduce script
                    var scriptTask = task.create({taskType: task.TaskType.MAP_REDUCE});
                    scriptTask.scriptId = 'customscript_flo_set_dependent_fields';
                    scriptTask.deploymentId = 'customdeploy_flo_set_dependent_fields';
                    scriptTask.submit();
				}
                
            }
        } catch (e) {
            log.error ({ 
                title: e.name,
                details: e.message
            });           
        }

        return true;
    }

    return {
        afterSubmit: afterSubmit
    };
});