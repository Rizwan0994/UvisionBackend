'use strict';
const connectedUsers = new Map();

module.exports = io => {
  /* Middleware 
   * This middleware will run everytime when user reload page or login 
  */
  require("./middleware")(io, connectedUsers);
  io.on('connection',async socket => {
    // require("./privateChat")(io, socket); // Disabled - using simple chat only  
    // require("./user")(io, socket);
    require("./designations")(io, socket)
    require("./version")(io, socket)
    require("./auth")(io, socket, connectedUsers)
    
    // Ultra-simple chat system
    require("./chat")(io, socket)
  });
};
