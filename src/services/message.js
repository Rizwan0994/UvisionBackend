const MessageModel = require("../models/index").message;
const { 
    removeSpecialCharFromMessage,
    removeMentionUserId
} = require('../helpers/common');
class Message {
    constructor(query) {
        this.query = query;
        this.model = MessageModel;
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
            console.log("error while fetching data.", error);
        }
    }
    static async create(obj) {
        try {
            obj.plainText = [];
            if(obj.subject) obj.plainText.push(removeSpecialCharFromMessage(obj.subject));
            if(obj.message) obj.plainText.push(removeMentionUserId(removeSpecialCharFromMessage(obj.message))); 
            let data = await MessageModel.create(obj);
            return data;
        } catch (error) {
            console.log("Error :", error);
        }
    }
}
module.exports = Message;