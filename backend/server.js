const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const socketController = require('./controllers/soketController');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "snazzy-cupcake-0b6e66.netlify.app", // ✅ or your deployed frontend URL
    methods: ["GET", "POST"],
  }
});

app.use(cors());
app.get("/", (req, res) => res.send("Server running"));

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);
  socketController(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
