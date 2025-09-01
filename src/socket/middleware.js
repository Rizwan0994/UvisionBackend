const UserModel = require("../models/index").user;
const { GHOST_MODE_KEY } = require("../config/constants");
const { PROFILE_STATUS } = require("../constants/user.constant");
// In-memory store for connected users
const connectedUsers = new Map();

const connectUserToOnline = async (loginUser, socket, io) => {
    try {
        let existConnectedUser = connectedUsers.get(loginUser.id);

        if (existConnectedUser) {
            // Add the new socket ID
            existConnectedUser.push(socket.id);
            connectedUsers.set(loginUser.id, existConnectedUser);
        } else {
            // First connection for this user
            connectedUsers.set(loginUser.id, [socket.id]);
            existConnectedUser = [socket.id];
        }

        if (existConnectedUser.length === 1) {
            // First connection means the user just came online
            await UserModel.update(
                { profileStatus: PROFILE_STATUS.ONLINE },
                { where: { id: loginUser.id } }
            );

            io.emit('SOCKET_MESSAGE', {
                id: 'user-online',
                data: {
                    userId: loginUser.id,
                    previousStatus: PROFILE_STATUS.OFFLINE,
                    profileStatus: PROFILE_STATUS.ONLINE
                }
            });

            loginUser.dataValues.profileStatus = PROFILE_STATUS.ONLINE;
        }
    } catch (error) {
        console.log('error :>> ', error);
        throw error;
    }
};
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
            await connectUserToOnline(loginUser, socket, io);
            // console.log('connectedUsers :>> ', connectedUsers);
            // connected_users[loginUser.id] = [socket.id]
            next();
          }
        } catch (error) {
          next(error);
        }
    });
}

