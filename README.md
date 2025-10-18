# VideoCall Pro - WebRTC Video Calling Application

A modern, full-featured video calling application built with the MERN stack, featuring real-time communication using WebRTC, Socket.IO for signaling, and a responsive React frontend.

## 🚀 Features

### Core Features
- ✅ **HD Video Calls** - Crystal clear video quality using WebRTC
- ✅ **Real-time Chat** - Send messages during video calls
- ✅ **Screen Sharing** - Share your screen with participants
- ✅ **Audio/Video Controls** - Mute/unmute microphone and toggle camera
- ✅ **Multiple Participants** - Support for multiple users in one call
- ✅ **Meeting Management** - Create, join, and manage meetings
- ✅ **Password Protection** - Secure meetings with optional passwords

### Advanced Features
- ✅ **Admin Controls** - Meeting creators can control participant permissions
- ✅ **Scheduled Meetings** - Plan and schedule future meetings
- ✅ **Responsive Design** - Works on desktop and mobile devices
- ✅ **User Authentication** - Secure user registration and login
- ✅ **Meeting History** - View and manage your meetings

### Bonus Features
- ✅ **Dark/Light Theme** - Toggle between themes
- ✅ **Real-time Notifications** - Get notified of user actions
- ✅ **State Management** - Redux for efficient state management
- ✅ **Modern UI** - Material-UI components with beautiful design

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication

### Frontend
- **React** - UI library
- **Redux Toolkit** - State management
- **Material-UI** - Component library
- **Socket.IO Client** - Real-time communication
- **WebRTC** - Peer-to-peer communication

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd video-calling-app
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-calling-app
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Create a `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Run the Application

#### Development Mode (Recommended)
```bash
# Run both server and client concurrently
npm run dev
```

#### Production Mode
```bash
# Build the client
npm run build

# Start the server
npm start
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## 📱 Usage

### Creating a Meeting
1. Register/Login to your account
2. Click "Start New Meeting" on the home page
3. Share the meeting ID with participants
4. Start your video call!

### Joining a Meeting
1. Click "Join Meeting" on the home page
2. Enter the meeting ID
3. Enter password if required
4. Join the video call!

### During a Meeting
- **Audio/Video Controls**: Use the control buttons at the bottom
- **Screen Sharing**: Click the screen share button
- **Chat**: Click the chat button to open the chat panel
- **Admin Controls**: Meeting creators can access admin panel

## 🏗️ Project Structure

```
video-calling-app/
├── server/                 # Backend server
│   ├── index.js           # Main server file
│   ├── models/            # Database models
│   │   ├── User.js        # User model
│   │   └── Meeting.js     # Meeting model
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   └── meetings.js    # Meeting routes
│   └── middleware/        # Custom middleware
│       └── auth.js        # JWT authentication
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/        # Redux store
│   │   ├── context/      # React context
│   │   └── App.js        # Main App component
│   └── public/           # Static files
├── package.json          # Server dependencies
└── README.md            # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update user preferences

### Meetings
- `POST /api/meetings/create` - Create new meeting
- `POST /api/meetings/join` - Join existing meeting
- `GET /api/meetings/my-meetings` - Get user's meetings
- `GET /api/meetings/:meetingId` - Get meeting details
- `PUT /api/meetings/:meetingId/admin-controls` - Update admin controls
- `PUT /api/meetings/:meetingId/end` - End meeting

## 🌐 Deployment

### Heroku Deployment

1. **Create Heroku App**
```bash
heroku create your-app-name
```

2. **Set Environment Variables**
```bash
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set NODE_ENV=production
```

3. **Deploy**
```bash
git push heroku main
```

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

## 🔒 Security Features

- **JWT Authentication** - Secure user authentication
- **Password Hashing** - Bcrypt for password security
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Server-side validation
- **Password-Protected Meetings** - Optional meeting passwords

## 🎨 UI/UX Features

- **Responsive Design** - Works on all device sizes
- **Material-UI Components** - Modern, accessible components
- **Dark/Light Theme** - User preference support
- **Real-time Updates** - Live status updates
- **Intuitive Controls** - Easy-to-use interface

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **WebRTC Connection Issues**
   - Ensure HTTPS in production
   - Check firewall settings
   - Verify STUN server configuration

3. **Socket.IO Connection Issues**
   - Check CORS settings
   - Verify Socket.IO server configuration

### Development Tips

- Use browser developer tools to debug WebRTC connections
- Check network tab for API call issues
- Monitor console for Socket.IO events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@videocallpro.com or create an issue in the repository.

## 🎯 Future Enhancements

- [ ] Meeting recording functionality
- [ ] Advanced admin controls
- [ ] Meeting analytics
- [ ] Mobile app development
- [ ] Integration with calendar systems
- [ ] Advanced screen sharing options
- [ ] Meeting transcription
- [ ] Virtual backgrounds

---

**Built with ❤️ using WebRTC, Socket.IO, React, and Node.js**
