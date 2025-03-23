const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

const {
  getMessages,
  sendMessage,
  uploadImage
} = require('../controllers/message.controller');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

router.get('/', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('image'), uploadImage);

module.exports = router;
