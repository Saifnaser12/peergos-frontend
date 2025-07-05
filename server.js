import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ---------- PUBLIC DEMO ENDPOINT ---------- */
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

/* ---------- SERVE BUILT SPA --------------- */
app.use(express.static(path.join(__dirname, 'peergos-fixed', 'dist')));
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, 'peergos-fixed', 'dist', 'index.html'))
);

/* ---------- START ------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);