const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const socketController = require('./controllers/soketController');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());
app.use('/', routes);

io.on('connection', socket => socketController(io, socket));

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
