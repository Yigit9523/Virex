const User = require('../models/User');
const logger = require('../config/logger');

const handleSocket = (io) => {
  io.on('connection', async (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Handle user connection
    socket.on('userConnected', async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, {
          status: 'online'
        });
        io.emit('userStatusChanged', { userId, status: 'online' });
      } catch (error) {
        logger.error(`Error updating user status: ${error.message}`);
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      socket.broadcast.emit('userTyping', data);
    });

    // Handle stop typing
    socket.on('stopTyping', (data) => {
      socket.broadcast.emit('userStoppedTyping', data);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        const userId = socket.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: Date.now()
          });
          io.emit('userStatusChanged', { userId, status: 'offline' });
        }
        logger.info(`User disconnected: ${socket.id}`);
      } catch (error) {
        logger.error(`Error updating user status: ${error.message}`);
      }
    });
  });
};

module.exports = handleSocket;
