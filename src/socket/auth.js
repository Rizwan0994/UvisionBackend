// const { disconnectUserToOffline, changeUserProfileStatus } = require("../controllers/user.contoller");
const { createUserLog } = require("../controllers/userLogs.controller");
const { logoutUser } = require("../controllers/auth.contoller");

module.exports = (io, socket, connectedUsers) => {
    socket.on('log-out-user', async data => {
        try {
            await logoutUser({ fcmToken: data.fcmToken, ...socket.handshake.query.loginUser });
            await disconnectUserToOffline(connectedUsers, socket.handshake.query.loginUser, socket, io);
            // io.to(socket.id).emit('res-get-chat-users', result);
        } catch (error) {
            console.log("Error: ", error)
        }
      });  
  
      socket.on('change-profile-status', async data => {
        // await changeUserProfileStatus(connectedUsers, socket.handshake.query.loginUser, socket, io, data);
      });
  
      socket.on('disconnect', async data => {
        console.log("Socket disconnected", socket.id);
        socket.leave(socket.handshake.query.loginUser.slug);
        // socket.socket.reconnect();
        // await disconnectUserToOffline(connectedUsers, socket.handshake.query.loginUser, socket, io);     
        await createUserLog({ ...data, userId: socket.handshake.query.loginUser.id }); 
        // const lastToDisconnect = io.of("/").sockets.size === 0;
        // if (lastToDisconnect) {
        //   global.gc(); 
        // }
      });
}