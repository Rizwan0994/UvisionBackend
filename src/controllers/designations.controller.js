'use strict';
const {
    designations: Designations,
    designationGroup: DesignationGroupModel,
    Op
} = require("../models/index")
    
exports.addDesignation = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const obj = {
                name: data.name,
                createdBy: data.loginUser.id
            }
            const result = await Designations.create(obj, { returning: true })
            resolve({ data: result, message: 'Designation created successfully' })
        } catch (error) {
            reject({ error })
        }
    })
}

exports.deleteDesignation = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await Designations.destroy({
                where: {
                    id: data.id
                }
            })
            resolve({ data, message: 'Designation deleted successfully' })
        } catch (error) {
            reject({ error })
        }
    })
}

exports.updateDesignation = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const obj = {
                name: data.name
            }
            const result = await Designations.update(obj, {
                where: {
                    id: data.id
                }
            })
            resolve({ data, message: 'Designation updated successfully' })
        } catch (error) {
            reject({ error })
        }
    })

}
exports.listDesignations = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await Designations.findAll()
            resolve({ data: result, message: 'Designations fetched successfully' })
        } catch (error) {
            reject({ error })
        }
    })

}

exports.create = async (dataToCreate, loginUser) => {
    try {
        dataToCreate.createdBy = loginUser.id;
        // const dataToCreate = {...req.body || {}};
        let groupIds = [];
        if (dataToCreate.groupIds?.length) { groupIds = dataToCreate.groupIds; delete dataToCreate.groupIds}
        const formCreated = await Designations.create(dataToCreate,{ returning : true});
        if(formCreated && groupIds.length){
            let designationGroupIdsObj = groupIds.map(ele => { return { chatId: ele, designationId: formCreated.dataValues.id } })
            await DesignationGroupModel.bulkCreate(designationGroupIdsObj);
        }
        return { message: `Designation successfully.`, data: formCreated };
    } catch (error) {
        throw error;
    }
}

exports.update = async (dataToUpdate, loginUser) => {
    try {
        // const dataToUpdate = {...req.body || {}};
        let groupIds = [];
        if (dataToUpdate.hasOwnProperty('groupIds') && dataToUpdate.groupIds) { groupIds = dataToUpdate.groupIds; delete dataToUpdate.groupIds}
        const updatedData = await Designations.update(dataToUpdate, { where: { id: dataToUpdate.id }, returning: true });
        if(updatedData && groupIds){
            let updatedObj = updatedData[1][0];
            await DesignationGroupModel.destroy({where: { designationId: updatedObj.dataValues.id }});
            let designationGroupIdsObj = groupIds.map(ele => { return { chatId: ele, designationId: updatedObj.dataValues.id, createdBy: loginUser.id } })
            await DesignationGroupModel.bulkCreate(designationGroupIdsObj);
        }
        return { message: `Designation successfully.`, data: updatedData };
    } catch (error) {
        throw error;
    }
}

exports.getChatsByDesignationIds = async (designationIds) => {
    return new Promise(async (resolve, reject) => {
        try {
            let designationChatIds = await DesignationGroupModel.findAll({ attributes: ['chatId'], where: { designationId: { [Op.in] : designationIds } }, raw: true });
            designationChatIds = designationChatIds.map(ele=> ele.chatId);
            resolve(designationChatIds);
        }catch (error) {
            console.log(error)
            reject({ status: 0, message: "Something went wrong.", error });
        }
    })
}