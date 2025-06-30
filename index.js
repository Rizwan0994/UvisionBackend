require('dotenv').config();
const fs = require('fs');
const app = require('./src/app');
const { socketInstance } = require('./src/crons');
const init = require('./src/socket');
process.env.UV_THREADPOOL_SIZE = require('os').cpus().length

const server = require('http').createServer({}, app);

const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowEIO3: true,
    },
    transport: ['websocket'],
});

init(io);
socketInstance(io);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server is listening to PORT: ${PORT}`);
});
