const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  mediaUrl: {
    type: String
  },
  readBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

messageSchema.pre('save', function(next) {
  if (this.type === 'text') {
    this.mediaUrl = undefined;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
