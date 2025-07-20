const hosts = new Map(); // Tracks host socket ID per room

module.exports = (io, socket) => {
  // Host joins
  socket.on('host-join', room => {
    hosts.set(room, socket.id); // Save host
    socket.join(room);

    // Notify existing viewers that host is available
    socket.to(room).emit('host-available', socket.id);

    // WebRTC handlers
    socket.on('offer', data => socket.to(data.to).emit('offer', data));
    socket.on('answer', data => socket.to(data.to).emit('answer', data));
    socket.on('ice-candidate', data => socket.to(data.to).emit('ice-candidate', data));

    socket.on('disconnect', () => {
      hosts.delete(room); // Remove host if disconnected
      socket.to(room).emit('host-left', socket.id);
    });
  });

  // Viewer joins
  socket.on('viewer-join', room => {
    socket.join(room);

    const hostId = hosts.get(room);
    if (hostId) {
      // Notify the host that a viewer joined
      io.to(hostId).emit('viewer-joined', socket.id);
      // Notify the viewer that host is available
      socket.emit('host-available', hostId);
    } else {
      // No host present
      socket.emit('no-host');
    }
  });
};
