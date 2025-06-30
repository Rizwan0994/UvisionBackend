'use strict';
const { NOTES_VISIBILITY } = require("../constants/note.constant");
const { NOT_FOUND } = require("../constants/auth.constant");
const {
    note: NoteModel
} = require("../models/index");
const { queryGenerator } = require("../util/dbServices");
const createHttpError = require("http-errors");

exports.create = async (dataToCreate, loginUser) => {
    try {
        let obj = {
            title: dataToCreate.title,
            detail: dataToCreate.detail || '',
            tag: dataToCreate.tag,
            chatId: dataToCreate.chatId,
            createdBy: loginUser.id,
            lastUpdatedBy: loginUser.id,
            visibility: dataToCreate.visibility
        };
        const noteCreated = await NoteModel.create(obj);
        return noteCreated;
    } catch (error) {
        throw error;
    }
}

exports.list =async (dataToList, loginUser) => { 
    try {
        if(dataToList && dataToList.query && dataToList.query.hasOwnProperty('visibility') && dataToList.query.visibility === NOTES_VISIBILITY.PUBLIC  && dataToList.query.hasOwnProperty('chatId') ){
            dataToList.query = {
                ...dataToList.query,
                visibility: NOTES_VISIBILITY.PUBLIC
            }
            delete dataToList.query.chatId;
        }
        if(dataToList && dataToList.query && dataToList.query.hasOwnProperty('visibility') && dataToList.query.visibility === NOTES_VISIBILITY.PRIVATE){
            dataToList.query = {
                ...dataToList.query,
                visibility: NOTES_VISIBILITY.PRIVATE
            }
        }
        if(dataToList && dataToList.query && dataToList.query.hasOwnProperty('visibility') && dataToList.query.visibility === NOTES_VISIBILITY.PERSONAL && dataToList.query.hasOwnProperty('chatId') ){
            dataToList.query = {
                ...dataToList.query,
                visibility: NOTES_VISIBILITY.PERSONAL,
                createdBy: loginUser.id
            }
            delete dataToList.query.chatId;
        }
        const {queryGenerate, populate} = await queryGenerator(dataToList);
        if(dataToList.isCountOnly){
            let data = await NoteModel.count(queryGenerate)
            return {data};   
        }
        if(dataToList.isCount){
            let data = await NoteModel.scope(populate).findAndCountAll(queryGenerate);
            return {data};   
        }
        const data = await NoteModel.scope(populate).findAll(queryGenerate);
        return {data};
    } catch (error) {
        throw error;
    }   
}

exports.updateNote = async (dataToUpdate, loginUser) => {
    try {
        if (!dataToUpdate.id) {
            throw new createHttpError["BadRequest"]("Insufficient request parameters! id is required." );
        }
        let dataToUpdateObj = { ...dataToUpdate, lastUpdatedBy: loginUser.id };
        const query = {
            where: {
                id: dataToUpdate.id
            },
            returning: true
        };
        let updatedNote = await NoteModel.update(dataToUpdateObj, query);
        if (!updatedNote) {
            throw new createHttpError["NotFound"]("Record Not Found")
        }
        return updatedNote[1][0];
    } catch (error) {
        throw error;
    }
}

exports.deleteNote = async (dataToDelete) => {
    try {
        if (!dataToDelete.id) {
            return createHttpError["BadRequest"]( "Insufficient request parameters! id is required." );
        }
        await NoteModel.destroy({ where: { id: dataToDelete.id }});
        return Number(dataToDelete.id);
    } catch (error) {
        throw error;
    }
}