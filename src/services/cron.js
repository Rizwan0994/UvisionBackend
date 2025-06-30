const CronTab = require("../models/index").cron;
const moment = require('moment');

class Cron {
    constructor(job) {
        this.job = job;
        this.model = CronTab;
    }
    async get() {
        try {
            let cron = await this.model.findOne({ 
                where: {
                    job: this.job 
                },
                raw: true
            });
            if (!cron) {
                cron = await this.set();
            }
            return cron;
        } catch (error) {
            console.log("error while fetching cron.", error);
        }
    }
    async set() {
        try {
            const cron = this.model.create({ job: this.job });
            return cron;
        } catch (error) {
            console.log('error while setting cron :>> ', error);
        }
    }
    async start() {
        try {
            // TODO: set isRunning to TRUE
            let cron = await this.model.findOne({ where: { job: this.job } });
            if (!cron) {
                cron = await this.set();
            }
            cron.isRunning = true;
            await cron.save();
            // console.log(`${this.job} Started: `, moment().format('MMMM Do YYYY, h:mm:ss a'));
            return cron;
        } catch (error) {
            console.log('error while starting cron :>> ', error);
        }
    }
    async stop() {
        try {
            const cron = await this.model.findOne({where: { job: this.job } });
            if (cron) {
                cron.isRunning = false;
                cron.lastSync = moment().toISOString();
                await cron.save();
                // console.log(`${this.job} Completed: `, moment(cron.lastSync).format('MMMM Do YYYY, h:mm:ss a'));
            }
            return cron;
        } catch (error) {
            console.log('error while stopping cron:>> ', error);
        }
    }
    async isRunning() {
        try {
            let cron = await this.model.findOne({ where: { job: this.job } });
            if (!cron) {
                cron = await this.set();
            }
            return cron.isRunning;
        } catch (error) {
            console.log(error);
        }
    }
}
module.exports = Cron;