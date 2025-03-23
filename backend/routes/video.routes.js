const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createRoom,
  getRoomInfo
} = require('../controllers/video.controller');

router.post('/rooms', protect, createRoom);
router.get('/rooms/:roomId', protect, getRoomInfo);

module.exports = router;
