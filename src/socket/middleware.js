const UserModel = require("../models/index").user;
const { GHOST_MODE_KEY } = require("../config/constants")

module.exports = (io, connectedUsers) => {
    io.use(async (socket, next) => {
        try {
          const decodedToken = await require("../helpers/common").decodeToken(socket.handshake.query.token)
          if (decodedToken) {
            const loginUser = await UserModel.scope(['roleData']).findByPk(decodedToken.id);
            socket.handshake.query.loginUser = loginUser;
            if(loginUser.dataValues.ghostUser && loginUser.dataValues.isGhostActive){
              socket.join(GHOST_MODE_KEY);
            }
            // socket.join('CATEGORY_CHAT');
            await require("../controllers/user.contoller").connectUserToOnline(connectedUsers, loginUser, socket, io);
            // console.log('connectedUsers :>> ', connectedUsers);
            // connected_users[loginUser.id] = [socket.id]
            next();
          }
        } catch (error) {
          console.log('error :>> ', error);
          console.log("handle session expiry");
          next(error);
        }
    });
}