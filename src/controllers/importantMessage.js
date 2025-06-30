'use strict';
const { 
    importantMessage: ImportantMessageModel, 
    user: UserModel, 
    message: MessageModel, 
    mentionUser: MentionUserModel 
} = require("../models/index");

exports.updateImportantMessage = async (dataToUpdate, loginUser) => {
    try {
        if (dataToUpdate.type === "add") {
            const { chatId, messageId } = dataToUpdate;
            const importantMessageData = await ImportantMessageModel.findOne({ where: { chatId, userId: loginUser.id, messageId }, raw: true });
            if (importantMessageData) {
                return { status: 0, message: "Message already added as important.", data: importantMessageData };
            } else {
                const result = await ImportantMessageModel.create({ chatId, userId: loginUser.id, messageId });
                return { status: 1, message: "Important Message updated successfully.", data: { chatId: dataToUpdate.chatId, messageId: dataToUpdate.messageId, userId: loginUser.id, id: result.id } };
            }
        } else if (dataToUpdate.type === "remove") {
            const result = await ImportantMessageModel.destroy({ where: { id: dataToUpdate.importantMessageId } });
            return { message: "Important Message updated successfully.", data: { chatId: dataToUpdate.chatId, messageId: dataToUpdate.messageId, userId: loginUser.id, } };
        }
    } catch (error) {
        throw error;
    }
}

exports.getImportantMessage = async (dataToList, loginUser) => {
    try {
        const importantMessageData = await ImportantMessageModel.findAll({
            where: { chatId: dataToList.chatId, userId: loginUser.id },
            attributes: ['id', 'createdAt'],
            include: [
                {
                    model: MessageModel,
                    include: [
                        {
                            model: UserModel, as: "sendByDetail", attributes: ['profilePicture', 'name']
                        },
                        {
                            model: MessageModel,
                            as: "quotedMessageDetail",
                            include: [
                                {
                                    model: UserModel, as: "sendByDetail", attributes: ['name']
                                }
                            ],
                            required: false,
                        },
                        {
                            model: MentionUserModel,
                            attributes: ['id', 'userId', 'type'],
                            include: [{ model: UserModel, attributes: ['name'] }],
                            required: false,
                            order: [["id", "ASC"]]
                        },
                    ],
                    where: { isDeleted: false },
                },
            ],
            order: [["id", "ASC"], ["createdAt", "ASC"]]
        });
        return { message: "Important Message.", data: importantMessageData };
    } catch (error) {
        throw error;
    }
}