const DesignationModel = require("../models/index").designations;
const DesignationGroupModel = require("../models/index").designationGroup;
class Designation {
    constructor(query) {
        this.query = query;
        this.model = DesignationModel;
    }
    async get() {
        try {
            let cron = await this.model.findOne({ 
                where:{
                    ...this.query,
                },
                raw: true
            });
            if (!cron) {
                cron = await this.set();
            }
            return cron;
        } catch (error) {
            console.log("error :>>", error);
        }
    }
    async create(groups) {
        try {
            const cron = this.model.create({ query: this.query });
            if(groups.hasOwnProperty('addChatId') && groups.addChatId.length) this.addDesignationGroup(groups.addChatId);
            if(groups.hasOwnProperty('removeChatId') && groups.removeChatId.length) this.removeDesignationGroup(groups.removeChatId);
            return cron;
        } catch (error) {
            console.log('error :>> ', error);
        }
    }
    static async addDesignationGroup(chatIds) {
        try {
            if(!chatIds.length) return;
            let designationGroupIdsObj = chatIds.map(ele => { return { chatId: ele, designationId: this.query.designationId } })
            await DesignationGroupModel.bulkCreate(designationGroupIdsObj);
            await DesignationGroupModel.cre
        } catch (error) {
            console.log('error :>> ', error);
        }
    }
    static async removeDesignationGroup(chatIds) {
        try {
            if(!chatIds.length) return;
            await DesignationGroupModel.destroy({where :{ chatId: chatIds, designationId: this.query.designationId }});
        } catch (error) {
            console.log('error :>> ', error);
        }
    }
}
module.exports = Designation;