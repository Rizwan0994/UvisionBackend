'use strict';
const {
    Op,
    user: UserModel,
    roles: RolesModel
} = require("../models/index");

exports.me = async (loginUser) => {
    try {
        const user = await UserModel.findOne({
            where: { id: { [Op.ne]: loginUser.id }, },
            include: [
                {
                    model: RolesModel,
                    attributes: ['id', 'name',],
                    as: "roleData"
                }
            ],
        });
        return { message: "User detail get successfully.", data: user.dataValues };
    } catch (error) {
        throw error;
    }
}