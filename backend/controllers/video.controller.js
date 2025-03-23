const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

exports.createRoom = async (req, res, next) => {
  try {
    const roomId = uuidv4();
    res.status(200).json({
      success: true,
      data: { roomId }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRoomInfo = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const io = req.app.get('io');
    const room = io.sockets.adapter.rooms.get(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        roomId,
        participants: Array.from(room).length
      }
    });
  } catch (error) {
    next(error);
  }
};
