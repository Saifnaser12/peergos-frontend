// Package script compatibility layer for deployment
const { execSync } = require('child_process');

const scripts = {
  'test:e2e': () => {
    console.log('Running E2E tests...');
    try {
      execSync('node simple-test.js', { stdio: 'inherit' });
      console.log('E2E tests completed successfully!');
    } catch (error) {
      console.error('E2E tests failed:', error.message);
      process.exit(1);
    }
  },
  
  'build': () => {
    console.log('Building Peergos application...');
    try {
      // Run the existing build command
      execSync('npm run build', { stdio: 'inherit' });
      console.log('Build completed successfully!');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  }
};

// Execute script based on command line argument
const scriptName = process.argv[2];
if (scriptName && scripts[scriptName]) {
  scripts[scriptName]();
} else {
  console.error(`Unknown script: ${scriptName}`);
  console.log('Available scripts:', Object.keys(scripts).join(', '));
  process.exit(1);
}