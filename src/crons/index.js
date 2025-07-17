'use strict';
const cron = require('node-cron');
const cronClass = require("../services/cron")
const seedRoles = require('../seeders/roles.seeder');
const seedCategories = require('../seeders/categories.seeder');

let socketObj = null;
exports.socketInstance = (io) => {
    if(io) socketObj = io;
    // Run roles seeder when socket is initialized (server start)
    seedRoles().catch(error => console.error('Failed to seed roles:', error));
    // Run categories seeder when socket is initialized (server start)
    seedCategories().catch(error => console.error('Failed to seed categories:', error));
}


// run every 5 min to check template task exist or not

// cron.schedule('*/5 * * * *', async () => { 
// // cron.schedule('*/10 * * * * *', async () => { 
//     try {
//         // runs schdule task 
//         let cronJob = new cronClass("RUN_TEMPLATE_SCHDULE")
//         let job = await cronJob.get();    
//         if(job.isRunning){
//             console.log({ status: 1, message: `RUN_TEMPLATE_SCHDULE already running`});
//         } else {
//             await cronJob.start();
//             await require('./template.cron').runTemplateSchdule(socketObj); // its runs if template task schedule exists
//             await cronJob.stop();
//         }

//         // runs schdule task 
//         cronJob = new cronClass("MESSAGE_REMAINDER_SCHEDULE")
//         job = await cronJob.get();    
//         if(job.isRunning){
//             console.log({ status: 1, message: `MESSAGE_REMAINDER_SCHEDULE already running`});
//         } else {
//             await cronJob.start();
//             await require("../controllers/remainder.controller").sendRemainder(socketObj); // message reminder function
//             await cronJob.stop();
//         }

//     } catch (error) {
//         console.log('error :>> ', error);
//     }
// });


// run every 30 min to task alert remainders
// cron.schedule('*/30 * * * *', async () => { 
//     try {
//         const cronJob = new cronClass("TASK_ALERT_PROMPT")
//         const job = await cronJob.get();    
//         if(job.isRunning){
//             console.log({ status: 1, message: `TASK_ALERT_PROMPT already running`});
//             return;
//         } 
//         await cronJob.start();
//         await require('./task.cron').runTaskAlert(socketObj); // its runs if template task schedule exists
//         await cronJob.stop();

//     } catch (error) {
//         console.log('error :>> ', error);
//     }
// });

// Professional Metrics Cron Jobs

// Update all professional metrics every 6 hours
cron.schedule('0 */6 * * *', async () => { 
    try {
        const cronJob = new cronClass("PROFESSIONAL_METRICS_UPDATE")
        const job = await cronJob.get();    
        if(job.isRunning){
            console.log({ status: 1, message: `PROFESSIONAL_METRICS_UPDATE already running`});
            return;
        } 
        await cronJob.start();
        await require('./professionalMetrics.cron').updateAllProfessionalMetrics();
        await cronJob.stop();

    } catch (error) {
        console.log('Professional metrics cron error :>> ', error);
    }
});

// Update response time metrics every hour
cron.schedule('0 * * * *', async () => { 
    try {
        const cronJob = new cronClass("RESPONSE_TIME_UPDATE")
        const job = await cronJob.get();    
        if(job.isRunning){
            console.log({ status: 1, message: `RESPONSE_TIME_UPDATE already running`});
            return;
        } 
        await cronJob.start();
        await require('./professionalMetrics.cron').updateActiveResponseTimes();
        await cronJob.stop();

    } catch (error) {
        console.log('Response time metrics cron error :>> ', error);
    }
});

// Update completion rates daily at 2 AM
cron.schedule('0 2 * * *', async () => { 
    try {
        const cronJob = new cronClass("COMPLETION_RATE_UPDATE")
        const job = await cronJob.get();    
        if(job.isRunning){
            console.log({ status: 1, message: `COMPLETION_RATE_UPDATE already running`});
            return;
        } 
        await cronJob.start();
        await require('./professionalMetrics.cron').updateProfessionalCompletionRates();
        await cronJob.stop();

    } catch (error) {
        console.log('Completion rate metrics cron error :>> ', error);
    }
});
