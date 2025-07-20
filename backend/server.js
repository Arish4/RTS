const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const rooms = {}; // roomName => { hostId, viewers: [] }

io.on('connection', socket => {
  console.log('✅ Socket connected:', socket.id);

  socket.on('host-join', room => {
    rooms[room] = { hostId: socket.id, viewers: [] };
    socket.join(room);
    console.log('🟢 Host joined:', socket.id);
  });

  socket.on('viewer-join', room => {
    const roomInfo = rooms[room];
    if (!roomInfo || !roomInfo.hostId) {
      socket.emit('no-host');
      return;
    }

    socket.join(room);
    rooms[room].viewers.push(socket.id);
    console.log(`👀 Viewer ${socket.id} joined and connected to host ${roomInfo.hostId}`);

    // Tell viewer who the host is
    socket.emit('host-available', roomInfo.hostId);
  });

  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);

    // Clean up rooms
    for (const room in rooms) {
      const { hostId, viewers } = rooms[room];

      if (hostId === socket.id) {
        console.log('🔴 Host disconnected:', socket.id);
        viewers.forEach(viewerId => {
          io.to(viewerId).emit('no-host');
        });
        delete rooms[room];
      } else if (viewers.includes(socket.id)) {
        rooms[room].viewers = viewers.filter(v => v !== socket.id);
        console.log('🔌 Viewer disconnected:', socket.id);
      }
    }
  });
});

server.listen(process.env.PORT || 10000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 10000}`);
});
