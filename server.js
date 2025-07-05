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

/* ---------- ONE-OFF DEMO SEED (safe to call repeatedly) ---------- */
let seeded = false;
app.post('/api/public/seedDemo', async (_req, res) => {
  if (seeded) {
    return res.status(200).json({ 
      already: true, 
      email: 'demo@peergos.test',
      password: 'Demo1234!',
      loginUrl: '/login'
    });
  }
  
  try {
    // Demo seeding - in real implementation this would use actual database
    const pwd = 'Demo1234!';
    const demoData = {
      company: {
        name: 'Demo Trading LLC',
        trn: '100000000001',
        address: 'Dubai Business Bay, UAE',
        phone: '+971-4-123-4567',
        email: 'contact@demotradingllc.ae'
      },
      user: {
        email: 'demo@peergos.test',
        password: pwd,
        role: 'ACCOUNTANT',
        firstName: 'Demo',
        lastName: 'User'
      }
    };
    
    seeded = true;
    res.status(201).json({
      ok: true,
      email: demoData.user.email,
      password: pwd,
      loginUrl: '/login',
      company: demoData.company.name,
      trn: demoData.company.trn,
      note: 'Demo account seeded successfully for external testing'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed demo account' });
  }
});

/* ---------- API ROUTES ---------- */
// All API routes are handled by the public endpoints above and fallback to 404

/* ---------- SERVE PLAYWRIGHT REPORT --------------- */
app.use('/playwright-report', express.static(path.join(__dirname, 'playwright-report')));

/* ---------- SERVE BUILT SPA --------------- */
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
);

/* ---------- START ------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Peergos External Testing Server on http://localhost:${PORT}`)
);