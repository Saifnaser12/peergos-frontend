#!/usr/bin/env node

// Production server wrapper with proper PORT environment variable handling
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure PORT environment variable is set for deployment compatibility
const port = process.env.PORT || '3000';
process.env.PORT = port;

console.log(`Starting server on port ${port}...`);

// Start the built server
const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});