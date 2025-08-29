import { Router } from 'express';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import vatRoutes from './vat.js';
import citRoutes from './cit.js';
import chartRoutes from './chart-of-accounts.js';
import calculationRoutes from './calculation-audit.js';
import filingsRoutes from './filings.js';
import reportsRoutes from './reports.js';

const router = Router();

// Version endpoint
router.get('/version', (req, res) => {
  res.json({ version: '1.0.0' });
});

// System status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/vat', vatRoutes);
router.use('/cit', citRoutes);
router.use('/chart-of-accounts', chartRoutes);
router.use('/calculation-audit', calculationRoutes);
router.use('/filings', filingsRoutes);
router.use('/reports', reportsRoutes);

export default router;