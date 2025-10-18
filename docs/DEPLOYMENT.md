# Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Heroku (Recommended for beginners)

1. **Create Heroku Account**
   - Go to [heroku.com](https://heroku.com)
   - Sign up for a free account

2. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   
   # Linux
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create Heroku App**
   ```bash
   heroku create your-videocall-app-name
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
   heroku config:set JWT_SECRET=your_secure_jwt_secret_here
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

### Option 2: Vercel (Recommended for React apps)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   - Go to Vercel dashboard
   - Navigate to your project settings
   - Add environment variables:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `NODE_ENV=production`

### Option 3: Netlify + Railway

1. **Deploy Backend to Railway**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Set environment variables
   - Deploy

2. **Deploy Frontend to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `cd client && npm run build`
   - Set publish directory: `client/build`
   - Deploy

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to you
   - Create cluster

3. **Set Up Database Access**
   - Go to Database Access
   - Add new database user
   - Create username and password
   - Save credentials

4. **Set Up Network Access**
   - Go to Network Access
   - Add IP address (0.0.0.0/0 for all IPs)
   - Or add your specific IP

5. **Get Connection String**
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

## 🔧 Environment Configuration

### Production Environment Variables

Create these environment variables in your deployment platform:

```env
# Server Configuration
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video-calling-app?retryWrites=true&w=majority
JWT_SECRET=your_very_secure_jwt_secret_key_here
NODE_ENV=production

# Client Configuration (for build process)
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

## 📱 Mobile Deployment

### PWA Configuration

The app is already configured for Progressive Web App (PWA) features:

1. **Install as PWA**
   - Open the app in mobile browser
   - Look for "Add to Home Screen" option
   - Install the app

2. **Offline Support**
   - Basic offline functionality included
   - Cached resources for better performance

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secret
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Set up proper firewall rules
- [ ] Use secure WebRTC configuration

### HTTPS Configuration

For WebRTC to work properly in production, you need HTTPS:

1. **Heroku**: Automatically provides HTTPS
2. **Vercel**: Automatically provides HTTPS
3. **Custom Domain**: Use Let's Encrypt for free SSL

## 🚀 Performance Optimization

### Build Optimization

1. **Client Build**
   ```bash
   cd client
   npm run build
   ```

2. **Server Optimization**
   - Enable gzip compression
   - Use CDN for static assets
   - Optimize database queries

### Monitoring

1. **Application Monitoring**
   - Use services like New Relic or DataDog
   - Monitor WebRTC connection quality
   - Track user engagement metrics

2. **Database Monitoring**
   - Monitor MongoDB performance
   - Set up alerts for high usage
   - Regular backup procedures

## 🐛 Troubleshooting

### Common Deployment Issues

1. **WebRTC Not Working**
   - Ensure HTTPS is enabled
   - Check STUN server configuration
   - Verify firewall settings

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network access settings
   - Ensure database user has proper permissions

3. **Socket.IO Connection Issues**
   - Check CORS configuration
   - Verify Socket.IO server setup
   - Monitor network connectivity

### Debug Commands

```bash
# Check application logs
heroku logs --tail

# Check environment variables
heroku config

# Restart application
heroku restart
```

## 📊 Analytics and Monitoring

### Recommended Tools

1. **Application Performance**
   - New Relic
   - DataDog
   - Google Analytics

2. **Error Tracking**
   - Sentry
   - Bugsnag
   - Rollbar

3. **User Analytics**
   - Google Analytics
   - Mixpanel
   - Amplitude

## 🎯 Post-Deployment Checklist

- [ ] Test all features in production
- [ ] Verify HTTPS is working
- [ ] Test WebRTC connections
- [ ] Check database connectivity
- [ ] Monitor application logs
- [ ] Set up monitoring alerts
- [ ] Configure backup procedures
- [ ] Test on different devices
- [ ] Verify mobile responsiveness
- [ ] Check performance metrics

## 📞 Support

If you encounter issues during deployment:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Ensure database is accessible
4. Test locally first
5. Check platform-specific documentation

For additional help, refer to the main README.md file or create an issue in the repository.
