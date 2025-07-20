// controllers/socketController.js

const connectedHosts = new Map();

module.exports = (io, socket) => {
  const room = 'live-room';

  socket.on('host-join', () => {
    socket.join(room);
    connectedHosts.set(room, socket.id); // Save host socket ID
    console.log(`🟢 Host joined: ${socket.id}`);
  });

  socket.on('viewer-join', () => {
    socket.join(room);
    const hostId = connectedHosts.get(room);
    if (!hostId) {
      socket.emit('no-host');
    } else {
      io.to(hostId).emit('viewer-joined', socket.id);
      socket.emit('host-available', hostId);
      console.log(`👀 Viewer ${socket.id} joined and connected to host ${hostId}`);
    }
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
    if (connectedHosts.get(room) === socket.id) {
      connectedHosts.delete(room);
      io.to(room).emit('no-host'); // Notify all viewers
      console.log(`🔴 Host disconnected: ${socket.id}`);
    } else {
      console.log(`🔌 Viewer disconnected: ${socket.id}`);
    }
  });
};
