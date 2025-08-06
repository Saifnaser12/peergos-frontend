import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { notificationScheduler } from "./notification-scheduler";
import { seedChartOfAccounts } from "./scripts/seedChartOfAccounts";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('🚀 Starting application initialization...');
    
    // Seed database with initial data
    console.log('📊 Initializing database...');
    await seedDatabase();
    console.log('✅ Database seeding completed');
    
    // Seed Chart of Accounts (with error handling to prevent crash)
    try {
      console.log('📈 Seeding Chart of Accounts...');
      await seedChartOfAccounts();
      console.log('✅ Chart of Accounts seeding completed');
    } catch (error) {
      console.error('⚠️ Chart of Accounts seeding failed, but continuing application startup:', error);
    }
    
    // Start notification scheduler
    console.log('⏰ Starting notification scheduler...');
    notificationScheduler.start();
    await notificationScheduler.seedDevelopmentDeadlines();
    console.log('✅ Notification scheduler started');
  } catch (error) {
    console.error('❌ Error during application initialization:', error);
    // Don't exit the process, try to continue with server startup
  }
  
  console.log('🔧 Registering routes...');
  const server = await registerRoutes(app);
  console.log('✅ Routes registered successfully');

  // Setup Vite middleware for development
  await setupVite(app, server);

  // Add global error handler after Vite setup
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log detailed error information for debugging
    console.error('❌ Global error handler caught:', {
      error: err,
      stack: err.stack,
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    });
    
    // Don't throw the error again to prevent crash
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
