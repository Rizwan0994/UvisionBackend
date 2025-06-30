'use strict';
const { listDesignations } = require("../controllers/designations.controller");

module.exports = (io, socket) => {
    socket.on("designation:req-list", async (data) => {
        try {
            const result = await listDesignations(data);
            io.to(socket.id).emit('designation:res-list', result);
        } catch (error) {
            console.log("error: ", error);
        }
    })
}