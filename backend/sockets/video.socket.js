const logger = require('../config/logger');

const handleVideoSocket = (io) => {
  const rooms = new Map();

  io.on('connection', (socket) => {
    logger.info(`Video socket connected: ${socket.id}`);

    // Handle joining a video call room
    socket.on('joinRoom', (roomId, userId) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);
      
      // Notify others in the room
      socket.to(roomId).emit('userJoined', { userId, socketId: socket.id });
      
      // Send existing participants to the new user
      const participants = Array.from(rooms.get(roomId)).filter(id => id !== socket.id);
      socket.emit('existingParticipants', participants);
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        sdp: data.sdp,
        caller: socket.id
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        sdp: data.sdp,
        answerer: socket.id
      });
    });

    socket.on('iceCandidate', (data) => {
      socket.to(data.target).emit('iceCandidate', {
        candidate: data.candidate,
        from: socket.id
      });
    });

    // Handle video/audio mute/unmute
    socket.on('mediaStateChange', (data) => {
      const { roomId, type, enabled } = data;
      socket.to(roomId).emit('participantMediaStateChanged', {
        participantId: socket.id,
        type,
        enabled
      });
    });

    // Handle leaving room
    socket.on('leaveRoom', (roomId) => {
      handleLeaveRoom(socket, roomId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Find and leave all rooms the socket was in
      rooms.forEach((participants, roomId) => {
        if (participants.has(socket.id)) {
          handleLeaveRoom(socket, roomId);
        }
      });
      logger.info(`Video socket disconnected: ${socket.id}`);
    });
  });

  // Helper function to handle leaving a room
  const handleLeaveRoom = (socket, roomId) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(socket.id);
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
      socket.to(roomId).emit('userLeft', socket.id);
      socket.leave(roomId);
    }
  };
};

module.exports = handleVideoSocket;
