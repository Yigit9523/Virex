const Message = require('../models/Message');
const logger = require('../config/logger');

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    req.body.sender = req.user.id;

    const message = await Message.create(req.body);
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'email avatar');

    // Emit socket event
    req.app.get('io').emit('newMessage', populatedMessage);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const message = await Message.create({
      sender: req.user.id,
      type: 'image',
      mediaUrl: req.file.filename
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'email avatar');

    // Emit socket event
    req.app.get('io').emit('newMessage', populatedMessage);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};
