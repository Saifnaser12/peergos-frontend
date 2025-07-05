// Production server entry point for deployment
// Ensures PORT environment variable is properly handled for Autoscale

import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Use PORT environment variable for deployment compatibility
const port = parseInt(process.env.PORT || '3000', 10);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: port, timestamp: new Date().toISOString() });
});

// Serve static files from dist directory
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Serve the main application
  app.get('*', (req, res) => {
    const indexPath = join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Application not built. Run build command first.' });
    }
  });
} else {
  // Fallback if dist doesn't exist - try to start the built server
  try {
    const builtServerPath = join(__dirname, 'dist', 'index.js');
    if (fs.existsSync(builtServerPath)) {
      console.log('Starting built server from dist/index.js...');
      import('./dist/index.js');
    } else {
      app.get('*', (req, res) => {
        res.status(500).json({ 
          error: 'Server not built. Run: npm run build', 
          help: 'Build command creates dist/index.js'
        });
      });
    }
  } catch (error) {
    console.error('Failed to start built server:', error);
    app.get('*', (req, res) => {
      res.status(500).json({ error: 'Server startup failed', details: error.message });
    });
  }
}

const server = createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`Peergos server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});