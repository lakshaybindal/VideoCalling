//index.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://lakshaybindal:lakshay1234@cluster0.znxlqyn.mongodb.net/VideoCallApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/auth', require('./routes/auth'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join meeting room
  socket.on('join-meeting', (data) => {
    const { meetingId, userId, userName } = data;
    socket.join(meetingId);
    
    // Get current room size
    const room = io.sockets.adapter.rooms.get(meetingId);
    const roomSize = room ? room.size : 0;
    
    console.log(`👥 User ${userName} (${userId}) joined meeting ${meetingId}`);
    console.log(`📊 Room size: ${roomSize} participants`);
    
    // Notify all other users in the room
    socket.to(meetingId).emit('user-joined', { userId, userName, socketId: socket.id });
    console.log(`📢 Sent user-joined event to ${roomSize - 1} other participants`);
  });

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    console.log('Server received offer from', data.targetUserId, 'to', data.targetUserId);
    // Send offer to specific target user
    socket.to(data.meetingId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    console.log('Server received answer from', data.targetUserId, 'to', data.targetUserId);
    // Send answer to specific target user
    socket.to(data.meetingId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    console.log('Server received ice-candidate from', data.targetUserId, 'to', data.targetUserId);
    // Send ICE candidate to specific target user
    socket.to(data.meetingId).emit('ice-candidate', data);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    socket.to(data.meetingId).emit('receive-message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Handle screen sharing
  socket.on('start-screen-share', (data) => {
    socket.to(data.meetingId).emit('user-started-screen-share', {
      userId: data.userId,
      userName: data.userName
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Note: We don't have userId here, so we can't notify others
    // This is a limitation - we'd need to store socket-to-user mapping
  });

  socket.on('stop-screen-share', (data) => {
    socket.to(data.meetingId).emit('user-stopped-screen-share', {
      userId: data.userId,
      userName: data.userName
    });
  });

  // Handle audio/video toggle
  socket.on('toggle-audio', (data) => {
    socket.to(data.meetingId).emit('user-toggled-audio', {
      userId: data.userId,
      isMuted: data.isMuted
    });
  });

  socket.on('toggle-video', (data) => {
    socket.to(data.meetingId).emit('user-toggled-video', {
      userId: data.userId,
      isVideoOff: data.isVideoOff
    });
  });

  // Handle admin controls
  socket.on('admin-mute-user', (data) => {
    socket.to(data.meetingId).emit('admin-muted-user', {
      targetUserId: data.targetUserId,
      isMuted: data.isMuted
    });
  });

  socket.on('admin-toggle-user-video', (data) => {
    socket.to(data.meetingId).emit('admin-toggled-user-video', {
      targetUserId: data.targetUserId,
      isVideoOff: data.isVideoOff
    });
  });

  // Handle user leaving
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
