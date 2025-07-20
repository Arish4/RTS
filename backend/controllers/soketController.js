module.exports = (io, socket) => {
  socket.on('host-join', room => {
    socket.join(room);
    socket.to(room).emit('host-available', socket.id);

    socket.on('offer', data => socket.to(data.to).emit('offer', data));
    socket.on('answer', data => socket.to(data.to).emit('answer', data));
    socket.on('ice-candidate', data => socket.to(data.to).emit('ice-candidate', data));

    socket.on('disconnect', () => {
      socket.to(room).emit('host-left');
    });
  });

  socket.on('viewer-join', room => {
    socket.join(room);
    const host = Array.from(io.sockets.adapter.rooms.get(room) || []).find(id => id !== socket.id);
    if (host) {
      socket.to(room).emit('viewer-joined', socket.id);
    } else {
      socket.emit('no-host');
    }
  });
};
