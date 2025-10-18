# Configuration Guide

## Environment Variables

### Server Configuration (.env in root directory)

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-calling-app
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
NODE_ENV=development
```

### Client Configuration (.env in client directory)

Create a `.env` file in the client directory with the following variables:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Production Configuration

For production deployment, update the URLs to your production domain:

```env
# Server
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret_for_production
NODE_ENV=production

# Client
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_SOCKET_URL=https://your-domain.com
```

## MongoDB Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use the connection string: `mongodb://localhost:27017/video-calling-app`

### MongoDB Atlas (Recommended for Production)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Replace `<password>` with your database password
5. Use the connection string in your `.env` file

## Security Notes

- **JWT_SECRET**: Use a strong, random secret key in production
- **MongoDB**: Use strong authentication and network access controls
- **HTTPS**: Always use HTTPS in production for WebRTC to work properly
- **CORS**: Configure CORS settings for your production domain

## Deployment Platforms

### Heroku
1. Set environment variables in Heroku dashboard
2. Use MongoDB Atlas for database
3. Deploy using Git

### Vercel
1. Set environment variables in Vercel dashboard
2. Use MongoDB Atlas for database
3. Deploy using Vercel CLI or GitHub integration

### AWS/Google Cloud/Azure
1. Set up MongoDB Atlas or use cloud database service
2. Configure environment variables
3. Deploy using platform-specific methods
