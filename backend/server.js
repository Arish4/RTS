// backend/server.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const socketController = require('./controllers/soketController');

const app = express();
const server = http.createServer(app);

// ✅ Set correct frontend origin here (use https:// if deployed)
const io = new Server(server, {
  cors: {
    origin: "https://snazzy-cupcake-0b6e66.netlify.app", // ✅ change to your deployed frontend
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Middleware
app.use(cors());

// Health Check Route
app.get("/", (req, res) => res.send("Server is live!"));

// Socket.io setup
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);
  socketController(io, socket); // ⬅️ use correct controller here
});

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
