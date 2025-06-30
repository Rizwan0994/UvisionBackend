const CronTab = require("../models/index").cronReport;
const moment = require('moment');

class Cron {
    constructor(query) {
        this.query = query;
        this.model = CronTab;
    }
    async get() {
        try {
            let cron = await this.model.findOne({ 
                where: {
                    ...this.query
                },
                raw: true
            });
            return cron;
        } catch (error) {
            console.log("error while fetching cron.", error);
        }
    }
    async getAndSet() {
        try {
            let cron = await this.model.findOne({ 
                where: {
                    ...this.query
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
            const cron = this.model.create(this.query);
            return cron;
        } catch (error) {
            console.log('error while setting cron :>> ', error);
        }
    }
    async start() {
        try {
            let cron = await this.model.findOne({ where: this.query });
            if (!cron) {
                cron = await this.set();
            }
            cron.isRunning = true;
            await cron.save();
            console.log(`Started: `, moment().format('MMMM Do YYYY, h:mm:ss a'));
            return cron;
        } catch (error) {
            console.log('error while starting cron :>> ', error);
        }
    }
    async stop() {
        try {
            const cron = await this.model.findOne({where: this.query });
            if (cron) {
                cron.isRunning = false;
                cron.lastSync = moment().toISOString();
                await cron.save();
                console.log(`Completed: `, moment(cron.lastSync).format('MMMM Do YYYY, h:mm:ss a'));
            }
            return cron;
        } catch (error) {
            console.log('error while stopping cron:>> ', error);
        }
    }
    async isRunning() {
        try {
            let cron = await this.model.findOne({ where: this.query });
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