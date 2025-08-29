import express from 'express';
import cors from 'cors';
import session from 'express-session';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8080',
      'https://localhost:3000',
      'https://localhost:5000',
      'https://localhost:8080'
    ];
    
    // Add any *.vercel.app domains
    if (origin.includes('.vercel.app')) {
      allowedOrigins.push(origin);
    }
    
    // Add origins from environment variable
    if (process.env.CORS_ALLOWED_ORIGINS) {
      const envOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'peergos-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint (enhanced)
app.get('/health', (req, res) => {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    version: "1.0.0",
    uptime: process.uptime()
  };
  res.json(healthStatus);
});

// Mount API routes
app.use('/api', apiRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: "Peergos Backend API",
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
      version: "/api/version",
      status: "/api/status"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

export default app;