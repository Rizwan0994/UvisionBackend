'use strict';
const momentTimeZone = require("moment-timezone");
const { LOGS } = require("../constants/user.constant");
const { BAD_REQUEST, OK_STATUS } = require("../constants/auth.constant");
const { groupBy } = require("../helpers/common");
const { userLogs, taskLogs } = require("../models/index");
const {
    Op,
    userLogs: UsersLogModel,
    taskLogs: TasksLogModel,
    user: UserModel,
    task: TaskModel
} = require("../models/index");
const {queryGenerator} = require("../util/dbServices");
const catchAsync = require('../util/catchAsync').catchAsync;

exports.createUserLog = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let obj = {
                userId: data.userId,
                date: momentTimeZone().utc().format("MM-DD-YYYY"),
                time: momentTimeZone().utc().format(),
            };

            const startDate = momentTimeZone().startOf("day").format();
            const result = await UsersLogModel.findAll({
                where: {
                    userId: data.userId,
                    date: { [Op.eq]: startDate },
                    type : {
                        [Op.in] : [LOGS.CLOCKIN, LOGS.CLOCKOUT]
                    }
                },
                order: [["time", "DESC"]],
            });
            const resultData = result.map((item) => item.dataValues);
            if (resultData?.length) {
                const lastLog = resultData[0];
                // // for go to break
                // if(data.profileStatus === PROFILE_STATUS.BREAK){
                //     obj.type = LOGS.OUT_FOR_BREAK
                // }
                // // back from break
                // else if(lastLog?.type === LOGS.OUT_FOR_BREAK && data.profileStatus === PROFILE_STATUS.BREAK){
                //     obj.type = LOGS.BACK_FROM_BREAK
                // }
                // // on call
                // else if(data.profileStatus === PROFILE_STATUS.ONCALL){
                //     obj.type = LOGS.ON_CALL_START
                // }
                // // end call
                // else if(lastLog?.type === LOGS.ON_CALL_START && data.profileStatus === PROFILE_STATUS.ONCALL){
                //     obj.type = LOGS.ON_CALL_END
                // }

                // for clock out
                if (lastLog?.type === LOGS.CLOCKIN) {
                    obj.type = LOGS.CLOCKOUT;
                } 
                // for clock in
                else if (lastLog?.type === LOGS.CLOCKOUT) {
                    obj.type = LOGS.CLOCKIN;
                }
                await userLogs.create(obj, { returning: true });
            } else {
                obj.type = LOGS.CLOCKIN;
                await userLogs.create(obj, { returning: true });
            }

            const updatedData = await UsersLogModel.findAll({
                where: {
                    userId: data.userId,
                    date: { [Op.eq]: startDate },
                },
                order: [["time", "DESC"]],
            });
            const newData = updatedData.map((item) => item.dataValues);

            resolve({
                status: 1,
                message: "Log added successfully.",
                data: newData,
                // isToday: data.isToday
            });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong.", error });
        }
    });
};

const getDiff = (logs) => {
    const startedTime = momentTimeZone(new Date(logs[0]?.time));
    const endedTime = momentTimeZone(new Date(logs[logs.length - 1]?.time))
    const diff = endedTime.diff(startedTime, "milliseconds");
    // return momentTimeZone.utc(diff).format('HH:mm:ss')
    return diff ? diff : 0;
}

exports.listUserLogByDate = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const startDate = data.date ? momentTimeZone(new Date(data.date)).startOf("day").format() : momentTimeZone().startOf("day").format();
            const result = await UsersLogModel.findAll({
                where: {
                    userId: data.userId,
                    date: { [Op.eq]: startDate },
                },
                order: [["time", "DESC"]],
            });
            const logs = result.map((item) => item.dataValues);
            resolve({ status: 1, message: "Fetch Logs successfully.", data: logs, isDate: data.date ? true : false });
        } catch (error) {
            reject({ status: 0, message: "Something went wrong.", error });
        }
    });
};

exports.endTaskSessionOnClockout = async (data) => {
    try {
        const startDate = momentTimeZone().startOf("day").format();
        const result = await TasksLogModel.findAll({
            where: {
                userId: data.userId,
                date: { [Op.eq]: startDate },
            },
            order: [["time", "DESC"]],
        });
        const logs = result.map((item) => item.dataValues);
        const groupedData = groupBy(logs, "taskId");
        Object.keys(groupedData).forEach(async (key) => {
            let obj = {
                taskId: key,
                userId: data.userId,
                date: momentTimeZone().utc().format("MM-DD-YYYY"),
                time: momentTimeZone().utc().format(),
            }
            const [lastLog] = groupedData[key];
            if (lastLog?.type === LOGS.STARTED) {
                obj.type = LOGS.ENDED;
                taskLogs.create(obj, { returning: true })
            }
        })
    } catch (error) {
        console.log(error)
    }
}

exports.addUserLog = async (data) => {
    try {
        let obj = {
            userId: data.userId,
            date: momentTimeZone().utc().format("MM-DD-YYYY"),
            time: momentTimeZone().utc().format(),
        };

        const startDate = momentTimeZone().startOf("day").format();;
        const result = await UsersLogModel.findAll({
            where: {
                userId: data.userId,
                date: { [Op.eq]: startDate },
            },
            order: [["time", "DESC"]],
        });
        const resultData = result.map((item) => item.dataValues);
        if (resultData?.length) {
            const lastLog = resultData[0];
            if (lastLog?.type === LOGS.CLOCKOUT) {
                obj.type = LOGS.CLOCKIN;
                await userLogs.create(obj, { returning: true });
            }
        } else {
            obj.type = LOGS.CLOCKIN;
            await userLogs.create(obj, { returning: true });
        }

    } catch (error) {
        console.log({ status: 0, message: "Something went wrong.", error });
    }
}

exports.calculateHoursByLogType = (data) => {
    const obj = {
        userClock: 0,
        userCallTime: 0,
        userBreakTime: 0,
        userTaskTime: 0
    }
    const userClock = data.clockout? data.clockout?.length : 0;
    const userCallTime = data?.callEnd ? data.callEnd?.length : 0;
    const userBreakTime = data.backFromBreak ? data.backFromBreak?.length : 0
    const userTaskTime = data.ended ? data.ended?.length : 0
    let length = Math.max(userClock, userCallTime, userBreakTime, userTaskTime);
    for (let index = 0; index < length; index++) {
        if(data?.clockout && data?.clockout[index]){
            obj.userClock = Number(obj.userClock) + getDiff([
                data.clockin ? data?.clockin[index] : [{time : 0}],
                data.clockout[index].time ? data.clockout[index] : [{time : 0}]
                // data.clockout[index].time ? data.clockout[index] : data?.clockin[index]
            ])
        }
        if(data?.callEnd && data?.callEnd[index]){
            obj.userCallTime = Number(obj.userCallTime) + getDiff([
                data?.callStart ? data?.callStart[index] : [{time : 0}],
                data?.callEnd ? data.callEnd[index] : [{time : 0}]
                // data?.callEnd[index].time ? data.callEnd[index] : data?.callStart[index]
            ])
        }
        if(data?.backFromBreak && data?.backFromBreak[index]){
            obj.userBreakTime = Number(obj.userBreakTime) + getDiff([
                data.outForBreak ? data?.outForBreak[index] : [{time : 0}],
                data.backFromBreak ? data.backFromBreak[index] : [{time : 0}]
                // data.backFromBreak[index].time ? data.backFromBreak[index] : data?.outForBreak[index]
            ])
        }
        if(data?.ended && data?.ended[index]){
            obj.userTaskTime = Number(obj.userTaskTime) + getDiff([
                data.started ? data.started[index] : [{time : 0}],
                data.ended ? data?.ended[index] : [{time : 0}]
                // data.ended[index].time ? data?.ended[index] : data.started[index]
            ])
        }
    }
    return {
        userClock : obj.userClock ? momentTimeZone.utc(obj.userClock).format('HH:mm:ss') : "",
        userCallTime : obj.userCallTime ? momentTimeZone.utc(obj.userCallTime).format('HH:mm:ss') : "",
        userBreakTime : obj.userBreakTime ? momentTimeZone.utc(obj.userBreakTime).format('HH:mm:ss') : "",
        userTaskTime : obj.userTaskTime ? momentTimeZone.utc(obj.userTaskTime).format('HH:mm:ss') : ""
    };
}

exports.list =catchAsync(async (req, res) => {
    try {
        let dataToList = { ...req.body || {}};
        if(!dataToList.query.hasOwnProperty('userId')){
            dataToList.query.userId = req.loginUser.id
        }
        let startDate = {};
        let endDate = {};
        if(dataToList.query && dataToList.query.hasOwnProperty("range") && dataToList.query.range.length){            
            startDate = dataToList.query.range[0].value[0] ? momentTimeZone(new Date(dataToList.query.range[0].value[0])).startOf('day').format() : momentTimeZone().startOf('day').format();
            endDate = dataToList.query.range[0].value[1] ? momentTimeZone(new Date(dataToList.query.range[0].value[1])).endOf('day').format() : momentTimeZone().endOf('day').format();
        }
        const {queryGenerate, populate} = await queryGenerator(dataToList);
        if(dataToList.isCountOnly){
            let data = await UsersLogModel.count(queryGenerate)
            return res.success({data});   
        }
        if(dataToList.isCount){
            let data = await UsersLogModel.scope(populate).findAndCountAll(queryGenerate);
            return res.success({data});   
        }
        const result = await UsersLogModel.scope(populate).findAll(queryGenerate);
        const userInfo = await UserModel.findOne({
            where :{
                id : dataToList.query.userId
            },
            attributes : ['name']
        })
        const taskLogList = await TasksLogModel.findAll({
            where :{
                userId : dataToList.query.userId,
                date: {
                    [Op.lte]: endDate,
                    [Op.gte]: startDate,
                },  
            },
            include:[{
                model: TaskModel,
                attributes : ['name']
            }]
        })
        // console.log('taskLogList :>> ', taskLogList);
        const taskLog = taskLogList.map((log)=> {
            return { ...log.dataValues , task : log.dataValues.task.dataValues.name }
        })
        const logs = result.map((item) => item.dataValues).concat(taskLog);
        const groupedData = groupBy(logs, "date")
        const newData = Object.keys(groupedData).map(key => {
            const data = groupedData[key].sort((a, b) => momentTimeZone(new Date(a.time)).unix() - momentTimeZone(new Date(b.time)).unix())
            let taskLogs = {};
            const groupByStatus = groupBy(data,'type');
            if(groupByStatus.hasOwnProperty("started") && groupByStatus.hasOwnProperty("ended")){
                taskLogs = groupBy((groupByStatus.started).concat(groupByStatus.ended),'task');
                taskLogs = Object.keys(taskLogs).map(taskName => {
                    let taskStatusGroupLogs = taskLogs[taskName];
                    taskStatusGroupLogs = groupBy(taskStatusGroupLogs,'type');
                    let grossTaskHours = this.calculateHoursByLogType(taskStatusGroupLogs).userTaskTime;
                    return {taskName: taskName, taskStatusGroupLogs, grossTaskHours};
                })
            }

            let grossHours = this.calculateHoursByLogType(groupByStatus);
            let grossTotalHours = momentTimeZone.utc(getDiff([
                    data[0] ? data[0] : [{time : 0}],
                    data[data.length - 1] ? data[data.length - 1] : [{time : 0}]
                ])).format('HH:mm:ss')
            return { date: key, logs: groupByStatus, grossTotalHours, grossHours, arrivalLog: data[0], recentLog: data[data.length - 1], userInfo, taskLogs}
        })
        const ress = momentTimeZone.duration();
        newData.map(b => {
            ress.add(momentTimeZone.duration(b.grossTotalHours))
        });

        const totalHours = `${parseInt(ress.asHours())}:${ress.minutes()}:${ress.seconds()}`;
        res.success({message: "Fetch Logs successfully.", data: newData, totalHours, userData: req.body.userData });
    } catch (error) {
        console.log(error);
        throw error;
    }  
})