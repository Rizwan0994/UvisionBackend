'use strict';
const createError = require('http-errors');
const db = require("../models/index");
const momentTimeZone = require("moment-timezone");
const { DISPLAY_RECORDS, RESPONSR_MAX_RECORDS } = require("../constants/limit.constant");
const models = [
    { key: "user", model: db.user },
    { key: "userLogs", model: db.userLogs },
    { key: "message", model: db.message },
    { key: "taskStatuses", model: db.taskStatus },
    { key: "designation", model: db.designations },
    { key: "fcmToken", model: db.FCMToken },
    { key: "userLogs", model: db.userLogs },
    { key: "userDesignations", model: db.userDesignations },
    { key: "roles", model: db.roles },
    { key: "chatUser", model: db.chatUser },
    { key: "chatUserUnscope", model: db.chatUser.unscoped() },
    { key: "messageRecipient", model: db.messageRecipient },
    { key: "chat", model: db.chat },
    { key: "organization", model: db.organization },
];

exports.create = async (model, createObj) => {
    try {
        let obj = { ...createObj || {} };
        if(Object.keys(obj).length === 0) return;
        const formCreated = await model.create(obj,{ returning : true});
        return formCreated;
    } catch (error) {
        console.log('error :>> ', error);
        throw new createError["BadRequest"]("Something went wrong");
    }   
}

exports.findOrCreate = async (model, createObj, defaults) => {
    try {
        let obj = { ...createObj || {} };
        if(Object.keys(obj).length === 0) return;
        let data = await model.findOrCreate({ where: createObj, defaults });
        return data;
    } catch (error) {
        console.log('error :>> ', error);
        throw new createError["BadRequest"]("Something went wrong");
    }   
}

exports.list = async (model, query, col) => {
    try {
        console.log(col)
        const dataToList = {...query || {}};
        let {queryGenerate, populate} = await this.queryGenerator(dataToList);
        if(process.env.hasOwnProperty('NODE_ENV') && process.env.NODE_ENV == "development") console.log('queryGenerate :>> ', queryGenerate, "populate:>>", populate);
        let data = {};
        if(dataToList.isCount){ if(col) queryGenerate = { col, ...queryGenerate }; data = await model.scope(populate).findAndCountAll(queryGenerate); }
        else if(dataToList.findOne) data = await model.scope(populate).findOne(queryGenerate);
        else if(dataToList.isCountOnly) data = await model.count(queryGenerate)
        else data = await model.scope(populate).findAll(queryGenerate);
        return {data};
    } catch (error) {   
        console.log('error :>> ', error);
        throw error;
    }  
} 

exports.delete = async (model, deleteVal) => {
    try {
        if(!deleteVal) return;
        let deleteStatus = await model.destroy({ where: { id: deleteVal } })
        if(deleteStatus) return deleteVal;
        return;
    } catch (error) {
        console.log('error :>> ', error);
        throw new createError["BadRequest"]("Something went wrong");
    }
}

exports.update = async (model, updateObj) => {
    try {
        if(Object.keys(updateObj).length === 0) return;
        if (!updateObj.id) return;
        const formDetails = await model.update(updateObj, { where: { id: updateObj.id }, returning: true });
        if(formDetails) return formDetails[1][0];
        return;
    } catch (error) {
        console.log('error :>> ', error);
        throw new createError["BadRequest"]("Something went wrong");
    }
}


exports.queryGenerator = async (data) => {
    try {
        console.log('data -----------------:>> ', data);
        let query = {};    
        let populate = ['defaultScope'];
        let options;
        let includeModelQuery = {};
        if (typeof data.query === 'object' && data.query !== null) {
            query.where = { ...data.query };
        }
        if (typeof data.options === 'object' && data.options !== null) {
            options = { ...data.options };
        }
        models.forEach(ele => {
            if (query.where?.hasOwnProperty(ele.key)) {
                let generateNestedQuery = { where : query.where[ele.key] };
                if(query.where[ele.key].hasOwnProperty('where')) generateNestedQuery = { ...query.where[ele.key] };
                includeModelQuery = { ...includeModelQuery, [ele.key]: generateNestedQuery };
                delete query.where[ele.key];
            }
        });
        if (query && query.hasOwnProperty("where") && query.where.hasOwnProperty("range")) {
            let range = query.where.range;
            if (Array.isArray(range) && range.length) {
                range.forEach(ele => {
                    if (ele.key && ele.value.length == 2) {
                        query.where = {
                            ...query.where,
                            [ele.key]: {
                                [db.Op.between]: [
                                    momentTimeZone(new Date(ele.value[0])).startOf("day").format(),
                                    momentTimeZone(new Date(ele.value[1])).endOf("day").format()
                                ]
                            },
                        }
                    }
                });
            }
            else {
                if (range.key && range.value.length == 2) {
                    query.where = {
                        ...query.where,
                        [range.key]: {
                            [db.Op.between]: [
                                momentTimeZone(new Date(range.value[0])).startOf("day").format(),
                                momentTimeZone(new Date(range.value[1])).endOf("day").format()
                            ]
                        },
                    }
                }
            }
            delete query.where.range;
        }
        if (query && query.hasOwnProperty("where") && query.where.hasOwnProperty("dateFilter")) {    
            let dateFilter = query.where.dateFilter;
            if (dateFilter.key && (dateFilter.month || dateFilter.year ) ) {
                let filterTime = momentTimeZone();
                if(dateFilter.year){
                    filterTime = filterTime.year(dateFilter.year);
                }
                query.where = {
                    ...query.where,
                    [dateFilter.key]: {
                        [db.Op.between]: [
                            filterTime.month(dateFilter.month).startOf('month').format(),
                            filterTime.month(dateFilter.month).endOf('month').format()
                        ]
                    },
                }
            }
            delete query.where.dateFilter;
        }

        if (query && query.hasOwnProperty("where") && query.where){
            Object.keys(query.where).forEach(key => {
                let filterQuery = query.where[key];
                if(filterQuery && filterQuery.hasOwnProperty("lt")){
                    query.where = {
                        ...query.where,
                        [key]: { [db.Op.lt] : filterQuery['lt']}
                    }
                }
                if(filterQuery && filterQuery.hasOwnProperty("gt")){
                    query.where = {
                        ...query.where,
                        [key]: { [db.Op.gt] : filterQuery['gt']}
                    }
                } 
                if(filterQuery && filterQuery.hasOwnProperty("lte")){
                    query.where = {
                        ...query.where,
                        [key]: { [db.Op.lte] : filterQuery['lte']}
                    }
                }
                if(filterQuery && filterQuery.hasOwnProperty("gte")){
                    query.where = {
                        ...query.where,
                        [key]: { [db.Op.gte] : filterQuery['gte']}
                    }
                } 
            })
        }
        if (options && options.hasOwnProperty("attributes") && options.attributes) {
            query.attributes = options.attributes;
        }
        if (options && options.hasOwnProperty("include") && options.include?.length > 0) {
            query.include = includeRecursive(options.include, includeModelQuery)
        }
        if (options && options.hasOwnProperty("populate") && options.populate?.length > 0) {
            populate.push(...options.populate);
        }
        // query.limit = RESPONSR_MAX_RECORDS;
        if (options && options.hasOwnProperty('pagination') && options.pagination) {
            query.limit = options.limit ? options.limit : DISPLAY_RECORDS;
            if(options.hasOwnProperty('offset')){
                query.offset = options.offset
            }
            else if(options.hasOwnProperty('page')){
                query.offset = (options.page - 1) * options.limit;
            }
        }
        if (options && options.hasOwnProperty("sort") && options.sort.length) {
            query.order = options.sort;
        }
        if (options && options.hasOwnProperty("group") && options.group.length && options.group.length == 2) {
            query.group = options.group[0];
            query.attributes.push([db.sequelize.fn(`${options.group[1]}`, db.sequelize.col(options.group[0])), `count_${options.group[0]}`])
        }

        if (data.isCountOnly) {
            delete query.attributes
        }
        if (data.isCount) {
            query.distinct = true
        }

        //search 
        // if (data && data.hasOwnProperty('keys') && data.hasOwnProperty('value') && Array.isArray(data.keys) && data.keys.length && data.value !== "") {
        //     let or = [];
            
        //     const search = data.value ? [`%${data.value}%`] : []
        //     data.keys.map(key => {
        //         or.push({ [key]: { [db.Op.iLike]: { [db.Op.any]: search } } });
        //     });
        //     query.where = {
        //         ...query.where,
        //         [db.Op.or]: or
        //     }
        // }

        // const whereClause = {
        //     [Op.or]: searchWords.map(word => ({
        //       [Op.or]: [
        //         { columnName1: { [Op.iLike]: `%${word}%` } }, // Replace columnName1 with the actual column name to search in
        //         { columnName2: { [Op.iLike]: `%${word}%` } }, // Replace columnName2 with another column name to search in
        //         // Add more columns as needed
        //       ],
        //     })),
        //   };
        if (data && data.hasOwnProperty('keys') && data.hasOwnProperty('value') && Array.isArray(data.keys) && data.keys.length && data.value !== "") {
            let or = [];
            let search = {};
            if(data.dynamicSearch){
                search = data.value.trim().split(" ").length > 1 ? data.value.split(" ")  : [`%${data.value.trim()}%`]
                if(search.length == 1) {
                    data.keys.map(key => {
                        or.push({ [key]: { [db.Op.iLike]: { [db.Op.any]: search } } });
                    });
                    query.where = {
                        ...query.where,
                        [db.Op.or]: or
                    }
                }
                if(search.length > 1) {
                    console.log('search 3:>> ', search);
                    console.log('keys :>> ', data.keys);
                    or = data.keys.map(key => ({
                        [db.Op.or]: search.map(word =>({
                            // [key]: { [db.Op.iLike]: { [db.Op.any]: [`%${word}%`] } }
                            [key]: { [db.Op.iLike]: `%${word}%` }
                        }))
                    }));
                    query.where = {
                        ...query.where,
                        [db.Op.and]: or
                    }
                }
            }
            search = data.value ? [`%${data.value.trim()}%`] : []
            data.keys.map(key => {
                or.push({ [key]: { [db.Op.iLike]: { [db.Op.any]: search } } });
            });
            query.where = {
                ...query.where,
                [db.Op.or]: or
            }
        }
        return {queryGenerate: query, populate};
        // return query;
    } catch (error) {
        console.log('error :>> ', error);
        throw new createError["BadRequest"]("Something went wrong");
    }
};

const includeRecursive = (data, query) => {
    let includeArr = [];
    for (let queryKeyIndex = 0; queryKeyIndex < data.length; queryKeyIndex++) {
        const modelOption = data[queryKeyIndex];
        const opt = models.find(opt => opt.key === modelOption.model);
        if (modelOption.hasOwnProperty("include")) {
            modelOption.include = includeRecursive(modelOption.include, query);
        }
        includeArr.push({ ...modelOption, model: opt.model, ...query[opt.key] })
    }
    return includeArr;
}
