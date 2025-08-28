import { Router } from 'express';
import { db } from '../db';
import { transactions, invoices, insertTransactionSchema, insertInvoiceSchema } from '../db/schema';

const router = Router();

// Import transactions from CSV/JSON
router.post('/api/data-import/transactions', async (req, res) => {
  try {
    const { data, format } = req.body; // data: array of transaction objects, format: 'csv' | 'json'
    const companyId = req.session?.companyId || 1;
    const userId = req.session?.userId || 1;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of transactions.' });
    }

    const importResults = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const transactionData of data) {
      try {
        // Validate and transform data
        const validatedData = insertTransactionSchema.parse({
          ...transactionData,
          companyId,
          createdBy: userId,
          transactionDate: new Date(transactionData.transactionDate)
        });

        await db.insert(transactions).values(validatedData);
        importResults.successful++;
      } catch (error: any) {
        importResults.failed++;
        importResults.errors.push(`Row ${importResults.successful + importResults.failed}: ${error.message}`);
      }
    }

    res.json({
      message: `Import completed. ${importResults.successful} successful, ${importResults.failed} failed.`,
      results: importResults
    });
  } catch (error) {
    console.error('Error importing transactions:', error);
    res.status(500).json({ error: 'Failed to import transactions' });
  }
});

// Import invoices
router.post('/api/data-import/invoices', async (req, res) => {
  try {
    const { data } = req.body;
    const companyId = req.session?.companyId || 1;
    const userId = req.session?.userId || 1;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format. Expected array of invoices.' });
    }

    const importResults = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const invoiceData of data) {
      try {
        // Validate and transform data
        const validatedData = insertInvoiceSchema.parse({
          ...invoiceData,
          companyId,
          createdBy: userId,
          issueDate: new Date(invoiceData.issueDate),
          dueDate: new Date(invoiceData.dueDate)
        });

        await db.insert(invoices).values(validatedData);
        importResults.successful++;
      } catch (error: any) {
        importResults.failed++;
        importResults.errors.push(`Row ${importResults.successful + importResults.failed}: ${error.message}`);
      }
    }

    res.json({
      message: `Import completed. ${importResults.successful} successful, ${importResults.failed} failed.`,
      results: importResults
    });
  } catch (error) {
    console.error('Error importing invoices:', error);
    res.status(500).json({ error: 'Failed to import invoices' });
  }
});

// Import from external accounting system
router.post('/api/data-import/external-system', async (req, res) => {
  try {
    const { systemType, apiKey, dataTypes } = req.body;
    // systemType: 'quickbooks', 'xero', 'sage', etc.
    // dataTypes: ['transactions', 'invoices', 'customers']

    // Mock external system integration
    // In production, this would connect to external APIs
    const mockImportData = {
      systemType,
      importedAt: new Date().toISOString(),
      dataTypes,
      summary: {
        transactions: 0,
        invoices: 0,
        customers: 0
      },
      status: 'pending' // pending, completed, failed
    };

    res.json({
      message: 'External system import initiated',
      importId: 'ext_import_' + Date.now(),
      data: mockImportData
    });
  } catch (error) {
    console.error('Error initiating external import:', error);
    res.status(500).json({ error: 'Failed to initiate external import' });
  }
});

// Get import history
router.get('/api/data-import/history', async (req, res) => {
  try {
    // Mock import history
    const history = [
      {
        id: 1,
        type: 'transactions',
        importedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        recordsImported: 45,
        status: 'completed'
      },
      {
        id: 2,
        type: 'invoices',
        importedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        recordsImported: 12,
        status: 'completed'
      }
    ];

    res.json(history);
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

export default router;