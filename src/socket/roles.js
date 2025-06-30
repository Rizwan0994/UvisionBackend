'use strict';
const { rolesList } = require("../controllers/roles.controller");

module.exports = (io, socket) => {
    socket.on('fetch-role-list', async data => {
        const result = await rolesList()
        io.to(socket.id).emit('res-fetch-role-list', result);
    })
}