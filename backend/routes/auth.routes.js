const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  register,
  login,
  logout,
  getMe
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
