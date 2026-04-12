let ioRef = null;

function initSocket(server) {
  const io = require("socket.io")(server, {
    cors: { origin: "*" }, // cho phép mọi frontend
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Frontend connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Frontend disconnected: ${socket.id}`);
    });
  });

  ioRef = io;
  return io;
}

function emitSensorData(topic, data) {
  if (ioRef) {
    ioRef.emit(topic, data);
    console.log(`[Socket.io] Emitted data on topic "${topic}":`, data);
  }
}

module.exports = {
  initSocket,
  emitSensorData,
};
