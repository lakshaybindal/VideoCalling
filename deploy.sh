#!/bin/bash

# VideoCall Pro Deployment Script

echo "🚀 Starting VideoCall Pro deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install server dependencies
echo "📦 Installing server dependencies..."
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Build the client
echo "🔨 Building client application..."
cd client
npm run build
cd ..

echo "✅ Build completed successfully!"

# Check if MongoDB is running (for local development)
if command -v mongod &> /dev/null; then
    echo "🔍 Checking MongoDB status..."
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB for local development."
        echo "   Run: brew services start mongodb-community (macOS)"
        echo "   Or: sudo systemctl start mongod (Linux)"
    fi
fi

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production:  npm start"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "Don't forget to:"
echo "  1. Set up your .env file with MongoDB URI and JWT secret"
echo "  2. Start MongoDB if running locally"
echo "  3. Configure environment variables for production deployment"
