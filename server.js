import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------- PUBLIC HEALTH ENDPOINT ---------- */
app.get('/api/public/demo', (_req, res) => {
  res.json({
    ok: true,
    name: 'Peergos Tax Compliance Hub',
    version: '1.0.0',
    vatRate: 0.05,
    citSmallBusinessReliefAED: 375000,
    timestamp: new Date().toISOString()
  });
});

/* ---------- SEED DEMO ACCOUNT (idempotent) ---------- */
let seeded = false;
app.post('/api/public/seedDemo', async (_req, res) => {
  if (seeded) {
    return res.status(409).json({ error: 'demo-exists' });
  }
  
  try {
    // Demo credentials for external testing
    const demoCredentials = {
      email: 'demo@peergos.test',
      password: 'Demo1234!',
      company: 'Demo Trading LLC',
      trn: '100000000001'
    };
    
    seeded = true;
    res.status(201).json({
      ok: true,
      email: demoCredentials.email,
      password: demoCredentials.password,
      loginUrl: '/login',
      company: demoCredentials.company,
      trn: demoCredentials.trn,
      note: 'Demo account ready for external testing'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed demo account' });
  }
});

/* ---------- PROXY TO MAIN APP API ---------- */
app.use('/api', async (req, res, next) => {
  // Skip public endpoints
  if (req.path.startsWith('/public/')) {
    return next();
  }
  
  try {
    // Proxy to main application running on port 5000
    const response = await fetch(`http://localhost:5000${req.originalUrl}`, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(503).json({ error: 'Main application unavailable' });
  }
});

/* ---------- SERVE BUILT SPA --------------- */
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
);

/* ---------- START ------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);