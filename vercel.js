/**
 * Alternative build script for Vercel (JavaScript instead of shell)
 * To use this, change the buildCommand in vercel.json to:
 * "buildCommand": "node vercel.js"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Display environment information
function logEnvironmentInfo() {
  console.log('====== ENVIRONMENT INFO ======');
  console.log(`Node version: ${process.version}`);
  console.log(`Current directory: ${process.cwd()}`);
  console.log(`Platform: ${process.platform}`);
  
  // List directory contents
  console.log('\nDirectory contents:');
  fs.readdirSync('.').forEach(file => {
    console.log(`- ${file}`);
  });
}

// Create necessary directories
function createDirectories() {
  const dirs = [
    './public/images',
    './dist/images'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      console.log(`Directory already exists: ${dir}`);
    }
  });
}

// Main build process
async function build() {
  try {
    console.log('====== STARTING VERCEL BUILD ======');
    logEnvironmentInfo();
    
    // Create necessary directories
    console.log('\n====== CREATING DIRECTORIES ======');
    createDirectories();
    
    // Install dependencies
    console.log('\n====== INSTALLING DEPENDENCIES ======');
    execSync('npm install', { stdio: 'inherit' });
    
    // Run TypeScript check (but continue even if it fails)
    console.log('\n====== CHECKING TYPESCRIPT ======');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
    } catch (error) {
      console.log('TypeScript check failed, but continuing build process...');
    }
    
    // Build the application
    console.log('\n====== BUILDING APPLICATION ======');
    execSync('npm run vercel-build', { stdio: 'inherit' });
    
    // Verify the build
    console.log('\n====== BUILD COMPLETED ======');
    if (fs.existsSync('./dist')) {
      console.log('Build directory exists: ./dist');
      fs.readdirSync('./dist').forEach(file => {
        console.log(`- ${file}`);
      });
    } else {
      console.error('Error: Build directory not found');
      process.exit(1);
    }
    
    console.log('\n====== BUILD SUCCESSFUL ======');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build(); 