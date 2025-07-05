import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// Health check endpoint for deployment
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files from dist/public (Vite build output)
app.use(express.static(path.join(__dirname, 'dist/public')));

// API routes - serve the main application if it exists
try {
  // Try to import the main server application
  const { default: mainApp } = await import('./dist/index.js');
  if (mainApp && typeof mainApp.handle === 'function') {
    app.use(mainApp);
  }
} catch (error) {
  console.log('Main application not found, serving static files only');
  
  // Fallback API endpoints for basic functionality
  app.get('/api/public/demo', (_req, res) => {
    res.json({
      ok: true,
      name: 'Peergos Tax Compliance Hub',
      version: '1.0.0',
      vatRate: 0.05,
      citSmallBusinessReliefAED: 375000,
      timestamp: new Date().toISOString(),
      features: [
        'Corporate Income Tax (CIT) calculations',
        'VAT calculations and returns (5% UAE rate)',
        'E-Invoicing with UBL 2.1 XML generation',
        'Financial statements generation',
        'Real-time compliance dashboard',
        'Multi-language support (English/Arabic)',
        'FTA integration ready'
      ],
      demo: {
        email: 'demo@peergos.test',
        company: 'Demo Trading LLC',
        trn: '100000000001'
      }
    });
  });
}

// Catch-all handler for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

// Use PORT environment variable (deployment sets this automatically)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Peergos Production Server running on port ${PORT}`);
});