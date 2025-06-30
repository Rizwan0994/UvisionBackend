'use strict';
const{ 
    chatUser: ChatUsersModel
} = require("../models/index");

const createHttpError = require("http-errors");
const { queryGenerator } = require("../util/dbServices");

exports.list = async (dataToList, loginUser) => {
    // if messrage received from hidden chat but message mention user at that chat have pop up dot 
    if(dataToList && dataToList.query && dataToList.query.hasOwnProperty('unreadMessageMention') && dataToList.query.unreadMessageMention){
        dataToList.query = {
            ...dataToList.query,
            isImportantChat: false,
            userId: loginUser.id,
            atTheRateMentionMessageCount: { "gt" : 0 }
        }
        delete dataToList.query.unreadMessageMention;
    }
    const {queryGenerate, populate} = await queryGenerator(dataToList);
    if(dataToList.isCountOnly){
        let data = await ChatUsersModel.count(queryGenerate)
        return { data };   
    }
    if(dataToList.findOne){        
        let data = await ChatUsersModel.scope(populate).findOne(queryGenerate)
        return { data };   
    }
    if(dataToList.isCount){
        let data = await ChatUsersModel.scope(populate).findAndCountAll(queryGenerate);
        return { data };   
    }
    const data = await ChatUsersModel.scope(populate).findAll(queryGenerate);
    return { data };
}

exports.update = async(dataToList, loginUser) => {
    try {
        if (!dataToList.id) {
            throw createHttpError['BadRequest']("Insufficient request parameters! id is required.");
        }
        let dataToUpdate = { ...dataToList };
        const query = {
            where: {
                id: dataToList.id
            },
            returning: true
        };
        let updatedChatUser = await ChatUsersModel.update(dataToUpdate, query);
        if (!updatedChatUser) {
            throw createHttpError["NotFound"]("Record Not Found");
        }
        return { status: 1, message: "Chat User updated successfully.", data: updatedChatUser[1][0] };
    } catch (error) {
        throw error;
    }
}