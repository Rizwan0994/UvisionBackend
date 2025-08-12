'use strict';
const connectedUsers = new Map();

module.exports = io => {
  /* Middleware 
   * This middleware will run everytime when user reload page or login 
  */
  require("./middleware")(io, connectedUsers);
  io.on('connection',async socket => {
    require("./privateChat")(io, socket);  
    // require("./user")(io, socket);
    require("./chat")(io, socket)
    require("./designations")(io, socket)
    require("./version")(io, socket)
    require("./auth")(io, socket, connectedUsers)
  });
};
