import { Router } from 'express';
import { db } from '../db';
import { transactions, taxFilings, invoices, companies, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Export all company data
router.get('/api/data-export', async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const userId = req.session?.userId || 1;

    // Gather all company data
    const [
      company,
      transactionsList,
      taxFilingsList,
      invoicesList,
      user
    ] = await Promise.all([
      db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]),
      db.select().from(transactions).where(eq(transactions.companyId, companyId)),
      db.select().from(taxFilings).where(eq(taxFilings.companyId, companyId)),
      db.select().from(invoices).where(eq(invoices.companyId, companyId)),
      db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0])
    ]);

    const exportData = {
      exportInfo: {
        companyId,
        companyName: company?.name || 'Unknown Company',
        exportedBy: `${user?.firstName} ${user?.lastName}`,
        exportedAt: new Date().toISOString(),
        dataTypes: ['transactions', 'tax-filings', 'invoices', 'company-info']
      },
      company,
      transactions: transactionsList,
      taxFilings: taxFilingsList,
      invoices: invoicesList,
      summary: {
        totalTransactions: transactionsList.length,
        totalTaxFilings: taxFilingsList.length,
        totalInvoices: invoicesList.length,
        totalRevenue: transactionsList
          .filter(t => t.type === 'REVENUE')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        totalExpenses: transactionsList
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      }
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Export transactions as CSV
router.get('/api/data-export/transactions-csv', async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const transactionsList = await db.select().from(transactions)
      .where(eq(transactions.companyId, companyId));

    // Convert to CSV format
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'VAT Amount', 'Status'];
    const csvRows = [headers.join(',')];

    transactionsList.forEach(transaction => {
      const row = [
        transaction.id,
        new Date(transaction.transactionDate).toLocaleDateString(),
        transaction.type,
        transaction.category,
        `"${transaction.description}"`,
        transaction.amount,
        transaction.vatAmount || '0',
        transaction.status
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting transactions CSV:', error);
    res.status(500).json({ error: 'Failed to export transactions CSV' });
  }
});

// Export tax filings summary
router.get('/api/data-export/tax-summary', async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const { year } = req.query;

    let taxFilingsList;
    if (year) {
      // Filter by year if provided
      taxFilingsList = await db.select().from(taxFilings)
        .where(eq(taxFilings.companyId, companyId));
      
      taxFilingsList = taxFilingsList.filter(filing => 
        filing.period.includes(year as string)
      );
    } else {
      taxFilingsList = await db.select().from(taxFilings)
        .where(eq(taxFilings.companyId, companyId));
    }

    const summary = {
      year: year || 'All Years',
      totalFilings: taxFilingsList.length,
      vatFilings: taxFilingsList.filter(f => f.type === 'VAT').length,
      citFilings: taxFilingsList.filter(f => f.type === 'CIT').length,
      totalTaxPaid: taxFilingsList.reduce((sum, f) => sum + parseFloat(f.totalTax || '0'), 0),
      filingsByStatus: {
        draft: taxFilingsList.filter(f => f.status === 'DRAFT').length,
        submitted: taxFilingsList.filter(f => f.status === 'SUBMITTED').length,
        approved: taxFilingsList.filter(f => f.status === 'APPROVED').length,
        rejected: taxFilingsList.filter(f => f.status === 'REJECTED').length
      },
      filings: taxFilingsList
    };

    res.json(summary);
  } catch (error) {
    console.error('Error exporting tax summary:', error);
    res.status(500).json({ error: 'Failed to export tax summary' });
  }
});

export default router;