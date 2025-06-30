'use strict';
const TaskService = require("../services/task");

// taskId send by message socket if created task is urgent and emgency 
exports.runTaskAlert = async (socketObj, createdMessageTaskId, messageTaskcreatedBy) => {
    try {
        let dueDateTasks = await TaskService.dueDateTaskMemberAlert(createdMessageTaskId);
        if(!dueDateTasks) return {};
        // Iterate through the data array
        const counts = {};
        dueDateTasks.forEach((item) => {
            const userId = item?.dataValues.userId;
            const status = item?.dataValues.taskmembers?.dataValues.status;
            if (!counts[userId]) {
                counts[userId] = {
                    pending: 0,
                    started: 0,
                    slug: item?.dataValues.user.dataValues.slug,
                    taskAlert : item?.dataValues.user?.dataValues.taskAlert?.dataValues
                };
            }
            if (status === "pending") counts[userId].pending++;
            else if (status === "started") counts[userId].started++;
        });
       
        // Log the counts for each user
        for (const user in counts) {
            if(!createdMessageTaskId) await TaskService.updateAlertTimer(counts[user].taskAlert);
            if(socketObj && (counts[user].pending || counts[user].started)) {
                if(messageTaskcreatedBy){
                    socketObj.in(counts[user].slug).emit('res-alert', {
                        type: "TASK_ALERT",
                        title: "Task Alert",
                        message: `Attention Needed: '${messageTaskcreatedBy}' Has Created an Urgent/Emergency Task`
                    });
                } 
                else{
                    socketObj.in(counts[user].slug).emit('res-alert', {
                        type: "TASK_ALERT",
                        title: "Task Alert",
                        message: ` You have ${counts[user].pending} Pending task and ${counts[user].started} started task remaining. Complete it to avoid receiving this message. `
                    });
                } 
            }
        }
        return dueDateTasks;
    } catch (error) {
        console.log('error :>> ', error);
    }
}