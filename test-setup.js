// Simple test script to verify setup
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing VideoCall Pro setup...\n');

// Check if required files exist
const requiredFiles = [
  'server/index.js',
  'server/models/User.js',
  'server/models/Meeting.js',
  'server/routes/auth.js',
  'server/routes/meetings.js',
  'server/middleware/auth.js',
  'client/src/App.js',
  'client/src/components/Home.js',
  'client/src/components/MeetingRoom.js',
  'client/package.json',
  'package.json',
  'README.md'
];

let allFilesExist = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'socket.io', 'mongoose', 'cors', 'dotenv', 'uuid', 'bcryptjs', 'jsonwebtoken'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
  allFilesExist = false;
}

console.log('\n🔧 Checking client package.json...');
try {
  const clientPackageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  const requiredClientDeps = ['react', 'socket.io-client', 'axios', 'react-router-dom', '@mui/material'];
  
  requiredClientDeps.forEach(dep => {
    if (clientPackageJson.dependencies && clientPackageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${clientPackageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading client/package.json');
  allFilesExist = false;
}

console.log('\n📋 Summary:');
if (allFilesExist) {
  console.log('✅ All required files and dependencies are present!');
  console.log('\n🚀 Next steps:');
  console.log('1. Create .env file with your configuration');
  console.log('2. Start MongoDB');
  console.log('3. Run: npm run dev');
  console.log('4. Open http://localhost:3000');
} else {
  console.log('❌ Some files or dependencies are missing.');
  console.log('Please check the errors above and fix them before proceeding.');
}

console.log('\n📚 For detailed setup instructions, see README.md');
