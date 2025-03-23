require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/database');
const errorHandler = require('./middlewares/error');
const logger = require('./config/logger');
const handleChatSocket = require('./sockets/chat.socket');
const handleVideoSocket = require('./sockets/video.socket');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set socket.io instance
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-url.com']
    : ['http://localhost:19006', 'http://localhost:19000', 'exp://192.168.1.x:19000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/video', require('./routes/video.routes'));

// Error handler
app.use(errorHandler);

// Handle socket connections
handleChatSocket(io);
handleVideoSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
