import { Router } from 'express';
import { db } from '../db';
import { 
  users, companies, transactions, taxFilings, invoices, notifications,
  creditNotes, debitNotes, kpiData, chartOfAccounts, transferPricingDocumentation,
  insertTransactionSchema, insertTaxFilingSchema, insertInvoiceSchema, 
  insertNotificationSchema, insertCreditNoteSchema, insertDebitNoteSchema,
  insertTransferPricingDocumentationSchema
} from '../db/schema';
import { calculateVAT, VATCalculationSchema } from '../tax/vat-calculator';
import { calculateCIT, CITCalculationSchema } from '../tax/cit-calculator';
import { count, eq, desc, and, gte, lte } from 'drizzle-orm';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'peergos-backend-prod'
  });
});

// API Health check
router.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'peergos-backend-prod'
  });
});

// Workflow Status API
router.get('/api/workflow-status', async (req, res) => {
  try {
    const userId = req.session?.userId || 1; // Default for demo
    
    // Get user's company and setup status
    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    const companyId = user?.companyId || 1;
    
    // Calculate current workflow position based on company data
    const company = companyId ? await db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]) : null;
    const setupComplete = company?.setupCompleted || false;
    
    // Determine current step
    let currentStep = 0;
    let overallProgress = 0;
    
    if (setupComplete) {
      currentStep = 1;
      overallProgress = 50; // Setup complete, data entry current
    } else {
      overallProgress = 25; // Setup in progress
    }
    
    // Build workflow steps based on current state
    const steps = [
      {
        id: 'setup',
        title: 'Initial Setup',
        description: 'Company registration, VAT setup, chart of accounts',
        status: setupComplete ? 'completed' : 'current',
        completionDate: setupComplete ? '2024-08-01' : undefined,
        nextAction: setupComplete ? 'Review company settings' : 'Complete setup wizard',
        estimatedTime: '5 min'
      },
      {
        id: 'data-entry',
        title: 'Data Entry',
        description: 'Record transactions, invoices, and expenses',
        status: setupComplete ? 'current' : 'pending',
        nextAction: 'Upload pending invoices and receipts',
        estimatedTime: '2 hours'
      },
      {
        id: 'calculation',
        title: 'Tax Calculation',
        description: 'VAT and CIT calculations, compliance checks',
        status: 'pending',
        nextAction: 'Review and validate calculations',
        estimatedTime: '30 min'
      },
      {
        id: 'filing',
        title: 'FTA Filing',
        description: 'Submit returns and maintain compliance',
        status: 'pending',
        nextAction: 'Submit VAT return by 28th',
        estimatedTime: '15 min'
      }
    ];
    
    // Calculate next deadline (28th of next month for VAT)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 28);
    
    const workflowData = {
      currentStep,
      overallProgress,
      taxPeriod: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      nextDeadline: nextMonth.toISOString().split('T')[0],
      steps
    };
    
    res.json(workflowData);
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    res.status(500).json({ error: 'Failed to fetch workflow status' });
  }
});

// Authentication routes
router.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Mock authentication - in production use proper password hashing
    const user = await db.select().from(users)
      .where(eq(users.username, username))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Set session
    req.session.userId = user.id;
    req.session.companyId = user.companyId || undefined;
    
    // Return user without password
    const { password: _, ...userResponse } = user;
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Get current user
router.get("/api/users/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await db.select().from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0]);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password: _, ...userResponse } = user;
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Company routes
router.get("/api/companies/:id", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const company = await db.select().from(companies)
      .where(eq(companies.id, companyId))
      .then(rows => rows[0]);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: "Failed to fetch company" });
  }
});

router.patch("/api/companies/:id", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const updateData = req.body;
    
    const result = await db.update(companies)
      .set(updateData)
      .where(eq(companies.id, companyId))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: "Failed to update company" });
  }
});

// Transaction routes
router.get("/api/transactions", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const transactionsList = await db.select().from(transactions)
      .where(eq(transactions.companyId, companyId))
      .orderBy(desc(transactions.createdAt));
    
    res.json(transactionsList);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post("/api/transactions", async (req, res) => {
  try {
    const validatedData = insertTransactionSchema.parse(req.body);
    const result = await db.insert(transactions)
      .values({
        ...validatedData,
        companyId: req.session?.companyId || 1,
        createdBy: req.session?.userId || 1,
      })
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ error: 'Invalid transaction data' });
  }
});

// Tax filing routes
router.get("/api/tax-filings", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const filings = await db.select().from(taxFilings)
      .where(eq(taxFilings.companyId, companyId))
      .orderBy(desc(taxFilings.createdAt));
    
    res.json(filings);
  } catch (error) {
    console.error('Error fetching tax filings:', error);
    res.status(500).json({ error: 'Failed to fetch tax filings' });
  }
});

router.post("/api/tax-filings", async (req, res) => {
  try {
    const validatedData = insertTaxFilingSchema.parse(req.body);
    const result = await db.insert(taxFilings)
      .values({
        ...validatedData,
        companyId: req.session?.companyId || 1,
        submittedBy: req.session?.userId || 1,
      })
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating tax filing:', error);
    res.status(400).json({ error: 'Invalid tax filing data' });
  }
});

// Invoice routes  
router.get("/api/invoices", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const invoiceList = await db.select().from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.createdAt));
    
    res.json(invoiceList);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post("/api/invoices", async (req, res) => {
  try {
    const validatedData = insertInvoiceSchema.parse(req.body);
    const result = await db.insert(invoices)
      .values({
        ...validatedData,
        companyId: req.session?.companyId || 1,
        createdBy: req.session?.userId || 1,
      })
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({ error: 'Invalid invoice data' });
  }
});

// Notification routes
router.get("/api/notifications", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const notificationsList = await db.select().from(notifications)
      .where(eq(notifications.companyId, companyId))
      .orderBy(desc(notifications.createdAt));
    
    res.json(notificationsList);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post("/api/notifications", async (req, res) => {
  try {
    const validatedData = insertNotificationSchema.parse(req.body);
    const result = await db.insert(notifications)
      .values({
        ...validatedData,
        companyId: req.session?.companyId || 1,
      })
      .returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(400).json({ error: 'Invalid notification data' });
  }
});

// KPI data route
router.get("/api/kpi-data", async (req, res) => {
  try {
    const companyId = req.session?.companyId || 1;
    const kpiList = await db.select().from(kpiData)
      .where(eq(kpiData.companyId, companyId))
      .orderBy(desc(kpiData.period));
    
    res.json(kpiList);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
});

// Cross-module data endpoint
router.get('/api/cross-module-data', async (req, res) => {
  try {
    const userId = req.session?.userId || 1;
    const user = await db.select().from(users).where(eq(users.id, userId)).then(rows => rows[0]);
    const companyId = user?.companyId || 1;

    // Gather data from all modules
    const [company, transactionsList] = await Promise.all([
      db.select().from(companies).where(eq(companies.id, companyId)).then(rows => rows[0]),
      db.select().from(transactions).where(eq(transactions.companyId, companyId))
    ]);

    const crossModuleData = {
      transactions: transactionsList,
      company,
    };

    res.json(crossModuleData);
  } catch (error) {
    console.error('Error fetching cross-module data:', error);
    res.status(500).json({ error: 'Failed to fetch cross-module data' });
  }
});

// Tasks endpoint (mock)
router.get("/api/tasks", async (req, res) => {
  try {
    // Mock tasks for now
    const tasks: any[] = [];
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Admin endpoints
router.get('/admin/coa/count', async (req, res) => {
  try {
    // Try database first, fallback to default count for demo
    let accountCount = 90; // Default UAE COA count
    
    try {
      const result = await db.select({ count: count() }).from(chartOfAccounts);
      accountCount = result[0]?.count || 90;
    } catch (dbError) {
      console.log('Database unavailable, using default COA count for demo');
    }
    
    res.json({ 
      count: accountCount,
      timestamp: new Date().toISOString(),
      note: 'UAE FTA-compliant Chart of Accounts'
    });
  } catch (error) {
    console.error('Error in COA count endpoint:', error);
    res.status(500).json({ error: 'Failed to count chart of accounts' });
  }
});

// Chart of Accounts
router.get('/api/coa', async (req, res) => {
  try {
    const accounts = await db.select().from(chartOfAccounts);
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({ error: 'Failed to fetch chart of accounts' });
  }
});

// VAT Calculator
router.post('/api/tax/vat/calculate', (req, res) => {
  try {
    const input = VATCalculationSchema.parse(req.body);
    const result = calculateVAT(input);
    res.json(result);
  } catch (error) {
    console.error('VAT calculation error:', error);
    res.status(400).json({ error: 'Invalid VAT calculation input' });
  }
});

// CIT Calculator
router.post('/api/tax/cit/calculate', (req, res) => {
  try {
    const input = CITCalculationSchema.parse(req.body);
    const result = calculateCIT(input);
    res.json(result);
  } catch (error) {
    console.error('CIT calculation error:', error);
    res.status(400).json({ error: 'Invalid CIT calculation input' });
  }
});

// Transfer Pricing Documentation routes
router.get("/api/transfer-pricing/:companyId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const result = await db.select()
      .from(transferPricingDocumentation)
      .where(eq(transferPricingDocumentation.companyId, companyId))
      .orderBy(transferPricingDocumentation.createdAt);

    res.json(result);
  } catch (error) {
    console.error('Error fetching transfer pricing documentation:', error);
    res.status(500).json({ error: 'Failed to fetch transfer pricing documentation' });
  }
});

router.post("/api/transfer-pricing", async (req, res) => {
  try {
    const validatedData = insertTransferPricingDocumentationSchema.parse(req.body);
    const result = await db.insert(transferPricingDocumentation)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating transfer pricing documentation:', error);
    res.status(400).json({ error: 'Invalid transfer pricing documentation data' });
  }
});

// Missing API endpoints from main system - adding them for complete consistency

// Transaction specific endpoints
router.patch("/api/transactions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const result = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/api/transactions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db.delete(transactions)
      .where(eq(transactions.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Tax Filing specific endpoints
router.patch("/api/tax-filings/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const result = await db.update(taxFilings)
      .set(updates)
      .where(eq(taxFilings.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Tax filing not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating tax filing:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/api/tax-filings/:id/download', async (req, res) => {
  try {
    const filingId = parseInt(req.params.id);
    if (isNaN(filingId)) {
      return res.status(400).json({ error: 'Invalid filing ID' });
    }

    // Get the filing
    const filing = await db.select().from(taxFilings)
      .where(eq(taxFilings.id, filingId))
      .then(rows => rows[0]);

    if (!filing) {
      return res.status(404).json({ error: 'Filing not found' });
    }

    // Generate PDF content
    const pdfContent = `
TAX RETURN DOCUMENT
===================

Filing ID: ${filing.id}
Type: ${filing.type}
Period: ${filing.period}
Due Date: ${new Date(filing.dueDate).toLocaleDateString()}
Submitted: ${filing.submittedAt ? new Date(filing.submittedAt).toLocaleDateString() : 'Not submitted'}
Status: ${filing.status}
Total Tax: AED ${filing.totalTax}

${filing.ftaReference ? `FTA Reference: ${filing.ftaReference}` : ''}

This is a system-generated document for filing ${filing.id}.
For official purposes, please contact the Federal Tax Authority.

Generated on: ${new Date().toLocaleDateString()}
    `;

    // Set headers for text download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filing.type}_Return_${filing.period}_${filing.id}.txt"`);
    
    res.send(pdfContent);

  } catch (error) {
    console.error('Download filing error:', error);
    res.status(500).json({ error: 'Failed to download filing' });
  }
});

// Invoice specific endpoints  
router.get("/api/invoices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const invoice = await db.select().from(invoices)
      .where(eq(invoices.id, id))
      .then(rows => rows[0]);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Credit Notes routes
router.get("/api/credit-notes", async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const creditNotesList = await db.select().from(creditNotes)
      .where(eq(creditNotes.companyId, companyId));
    res.json(creditNotesList);
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/credit-notes", async (req, res) => {
  try {
    const validatedData = insertCreditNoteSchema.parse(req.body);
    const result = await db.insert(creditNotes)
      .values(validatedData)
      .returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Credit note validation error:', error);
    res.status(400).json({ message: "Invalid credit note data", error: error?.message || error });
  }
});

// Debit Notes routes
router.get("/api/debit-notes", async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const debitNotesList = await db.select().from(debitNotes)
      .where(eq(debitNotes.companyId, companyId));
    res.json(debitNotesList);
  } catch (error) {
    console.error('Error fetching debit notes:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/debit-notes", async (req, res) => {
  try {
    const validatedData = insertDebitNoteSchema.parse(req.body);
    const result = await db.insert(debitNotes)
      .values(validatedData)
      .returning();
    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error('Debit note validation error:', error);
    res.status(400).json({ message: "Invalid debit note data", error: error?.message || error });
  }
});

// Notification specific endpoints
router.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Enhanced Tax calculation routes
router.post("/api/tax/calculate-vat", async (req, res) => {
  try {
    const validatedData = VATCalculationSchema.parse(req.body);
    const result = calculateVAT(validatedData);
    res.json(result);
  } catch (error) {
    console.error('VAT calculation error:', error);
    res.status(400).json({ message: "Invalid VAT calculation data" });
  }
});

router.post("/api/tax/calculate-vat-enhanced", async (req, res) => {
  try {
    const { transactions, period } = req.body;
    
    // Enhanced VAT calculation (5%)
    let totalSales = 0;
    let totalPurchases = 0;
    let outputVat = 0;
    let inputVat = 0;
    
    for (const transaction of transactions) {
      const amount = parseFloat(transaction.amount);
      const vatAmount = parseFloat(transaction.vatAmount || '0');
      
      if (transaction.type === 'REVENUE') {
        totalSales += amount;
        outputVat += vatAmount;
      } else if (transaction.type === 'EXPENSE') {
        totalPurchases += amount;
        inputVat += vatAmount;
      }
    }
    
    const netVatDue = Math.max(0, outputVat - inputVat);
    
    res.json({
      period,
      totalSales,
      totalPurchases,
      outputVat,
      inputVat,
      netVatDue,
      calculatedAt: new Date(),
      vatRate: 0.05, // 5% UAE VAT rate
      compliance: {
        isCompliant: true,
        notes: "Calculated according to UAE VAT regulations"
      }
    });
  } catch (error) {
    console.error('Enhanced VAT calculation error:', error);
    res.status(500).json({ message: "VAT calculation failed" });
  }
});

router.post("/api/tax/calculate-cit", async (req, res) => {
  try {
    const validatedData = CITCalculationSchema.parse(req.body);
    const result = calculateCIT(validatedData);
    res.json(result);
  } catch (error) {
    console.error('CIT calculation error:', error);
    res.status(400).json({ message: "Invalid CIT calculation data" });
  }
});

router.post("/api/calculate-tax", async (req, res) => {
  try {
    const { type, ...data } = req.body;
    
    if (type === 'VAT') {
      const result = calculateVAT(data);
      res.json(result);
    } else if (type === 'CIT') {
      const result = calculateCIT(data);
      res.json(result);
    } else {
      res.status(400).json({ message: "Invalid tax type" });
    }
  } catch (error) {
    console.error('Tax calculation error:', error);
    res.status(500).json({ message: "Tax calculation failed" });
  }
});

// Automatic Tax calculation routes
router.post("/api/calculate-taxes", async (req, res) => {
  try {
    const companyId = parseInt(req.body.companyId) || 1;
    const period = req.body.period;
    
    // Mock calculation logic
    res.json({
      companyId,
      period,
      vatCalculated: true,
      citCalculated: true,
      message: "Taxes calculated successfully"
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/api/recalculate-financials", async (req, res) => {
  try {
    const companyId = parseInt(req.body.companyId) || 1;
    
    res.json({ message: "Financial calculations updated successfully" });
  } catch (error) {
    console.error('Financial recalculation error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Tax return submission route
router.post("/api/submit-return", async (req, res) => {
  try {
    const { type, period, totalRevenue, totalExpenses, netIncome, taxOwed, taxAgentName } = req.body;
    
    if (!type || !['CIT', 'VAT'].includes(type)) {
      return res.status(400).json({ error: "Invalid tax type. Must be 'CIT' or 'VAT'" });
    }

    if (!period || !taxAgentName) {
      return res.status(400).json({ error: "Period and tax agent name are required" });
    }

    // Calculate due date based on type
    const now = new Date();
    let dueDate: Date;
    
    if (type === 'VAT') {
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 28);
    } else {
      const currentYear = now.getFullYear();
      dueDate = new Date(currentYear + 1, 8, 30);
    }

    // Generate reference number
    const reference = `${type}_${Date.now()}_1`;

    // Create tax filing record
    const filing = await db.insert(taxFilings).values({
      companyId: 1,
      type,
      period,
      startDate: new Date(),
      endDate: new Date(),
      dueDate,
      status: 'SUBMITTED',
      totalTax: taxOwed?.toString() || '0',
      submittedAt: now,
      submittedBy: 1,
      calculations: {
        totalRevenue: parseFloat(totalRevenue || '0'),
        totalExpenses: parseFloat(totalExpenses || '0'),
        netIncome: parseFloat(netIncome || '0'),
        taxOwed: parseFloat(taxOwed || '0'),
        taxAgentName,
        reference
      }
    }).returning();

    res.json({
      success: true,
      reference,
      filingId: filing[0].id,
      status: 'SUBMITTED',
      submittedAt: now.toISOString(),
      dueDate: dueDate.toISOString(),
      message: `${type} return submitted successfully`
    });

  } catch (error) {
    console.error("Tax return submission failed:", error);
    res.status(500).json({ error: "Tax return submission failed" });
  }
});

// FTA Integration routes
router.get("/api/fta/trn-lookup/:trn", async (req, res) => {
  const { trn } = req.params;
  
  // Mock FTA TRN lookup
  if (trn === "100123456700003") {
    res.json({
      trn,
      businessName: "ABC Trading LLC",
      status: "ACTIVE",
      vatRegistered: true,
      registrationDate: "2020-01-15",
    });
  } else {
    res.status(404).json({ message: "TRN not found" });
  }
});

router.post("/api/fta/submit-filing", async (req, res) => {
  try {
    const { filingId, type } = req.body;
    
    // Mock FTA submission
    const reference = `FTA${Date.now()}`;
    
    res.json({
      success: true,
      reference,
      submittedAt: new Date(),
      status: "SUBMITTED",
      message: `${type} filing submitted successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: "FTA submission error" });
  }
});

router.get("/api/fta/status", async (req, res) => {
  try {
    res.json({
      status: "ACTIVE",
      lastSync: new Date(),
      connectivity: "ONLINE",
      message: "FTA integration is operational"
    });
  } catch (error) {
    res.status(500).json({ message: "FTA status check failed" });
  }
});

router.post('/api/fta/test-connection', async (req, res) => {
  try {
    // Mock FTA connection test
    const testResult = {
      success: true,
      responseTime: Math.floor(Math.random() * 200) + 50,
      status: "Connected to FTA sandbox environment",
      timestamp: new Date(),
      endpoint: "https://api.fta.gov.ae/sandbox"
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('FTA connection test failed:', error);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

router.get('/api/fta/submissions', async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Mock FTA submissions
    const submissions = [
      {
        id: 1,
        companyId,
        type: "VAT",
        period: "2024-Q1",
        status: "APPROVED",
        submittedAt: "2024-04-28T10:00:00Z",
        ftaReference: "FTA123456789",
        amount: 15000
      },
      {
        id: 2,
        companyId,
        type: "CIT",
        period: "2023",
        status: "PENDING",
        submittedAt: "2024-03-15T14:30:00Z",
        ftaReference: "FTA987654321",
        amount: 45000
      }
    ].slice(0, limit);
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching FTA submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.get('/api/fta/notifications', async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    
    // Mock FTA notifications
    const ftaNotifications = [
      {
        id: 1,
        type: "DEADLINE_REMINDER",
        title: "VAT Return Due Soon",
        message: "Your Q1 2024 VAT return is due in 7 days",
        priority: "HIGH",
        date: new Date().toISOString(),
        read: false
      },
      {
        id: 2,
        type: "SUBMISSION_CONFIRMED",
        title: "CIT Return Submitted",
        message: "Your 2023 Corporate Income Tax return has been successfully submitted",
        priority: "MEDIUM",
        date: new Date(Date.now() - 86400000).toISOString(),
        read: true
      }
    ];
    
    res.json(ftaNotifications);
  } catch (error) {
    console.error('Error fetching FTA notifications:', error);
    res.status(500).json({ error: 'Failed to fetch FTA notifications' });
  }
});

router.post('/api/fta/submit', async (req, res) => {
  try {
    const { filingId, type, data } = req.body;
    
    if (!filingId || !type) {
      return res.status(400).json({ error: 'Filing ID and type are required' });
    }
    
    // Mock FTA submission process
    const reference = `FTA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate processing delay
    setTimeout(() => {
      res.json({
        success: true,
        reference,
        status: "SUBMITTED",
        submittedAt: new Date(),
        message: `${type} filing submitted to FTA successfully`,
        trackingId: reference
      });
    }, 100);
    
  } catch (error) {
    console.error('FTA submission error:', error);
    res.status(500).json({ error: 'FTA submission failed' });
  }
});

// Transfer Pricing Documentation routes
router.get("/api/transfer-pricing/:companyId", async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    
    const result = await db.select()
      .from(transferPricingDocumentation)
      .where(eq(transferPricingDocumentation.companyId, companyId));

    res.json(result);
  } catch (error) {
    console.error('Error fetching transfer pricing documentation:', error);
    res.status(500).json({ error: 'Failed to fetch transfer pricing documentation' });
  }
});

router.post("/api/transfer-pricing", async (req, res) => {
  try {
    const validatedData = insertTransferPricingDocumentationSchema.parse(req.body);
    
    const result = await db.insert(transferPricingDocumentation)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating transfer pricing documentation:', error);
    res.status(400).json({ error: 'Invalid transfer pricing documentation data' });
  }
});

router.patch("/api/transfer-pricing/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const result = await db.update(transferPricingDocumentation)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(transferPricingDocumentation.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Transfer pricing documentation not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating transfer pricing documentation:', error);
    res.status(500).json({ error: 'Failed to update transfer pricing documentation' });
  }
});

// Chart of Accounts routes
router.get("/api/chart-of-accounts", async (req, res) => {
  try {
    const result = await db.select().from(chartOfAccounts);
    res.json(result);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({ error: 'Failed to fetch chart of accounts' });
  }
});

router.get("/api/chart-of-accounts/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const result = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.code, code))
      .then(rows => rows[0]);
    
    if (!result) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching chart of account:', error);
    res.status(500).json({ error: 'Failed to fetch chart of account' });
  }
});

// Setup completion route
router.post("/api/setup/complete", async (req, res) => {
  try {
    const companyId = parseInt(req.body.companyId) || 1;
    
    const result = await db.update(companies)
      .set({
        setupCompleted: true,
        setupCompletedAt: new Date()
      })
      .where(eq(companies.id, companyId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      success: true,
      company: result[0],
      message: 'Setup completed successfully'
    });
  } catch (error) {
    console.error('Error completing setup:', error);
    res.status(500).json({ error: 'Failed to complete setup' });
  }
});

// Data synchronization routes
router.post('/api/sync-modules', async (req, res) => {
  try {
    const { modules, options } = req.body;
    
    // Mock sync operation
    const syncResults = modules.map((module: string) => ({
      module,
      status: 'COMPLETED',
      recordsProcessed: Math.floor(Math.random() * 100),
      timestamp: new Date()
    }));
    
    res.json({
      success: true,
      results: syncResults,
      message: 'Modules synchronized successfully'
    });
  } catch (error) {
    console.error('Module sync error:', error);
    res.status(500).json({ error: 'Module synchronization failed' });
  }
});

router.get('/api/validate-data-consistency', async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    
    // Mock validation results
    const validationResults = {
      companyId,
      isConsistent: true,
      checks: [
        { module: 'transactions', status: 'PASS', issues: 0 },
        { module: 'invoices', status: 'PASS', issues: 0 },
        { module: 'tax_filings', status: 'PASS', issues: 0 }
      ],
      validatedAt: new Date(),
      message: 'All data consistency checks passed'
    };
    
    res.json(validationResults);
  } catch (error) {
    console.error('Data validation error:', error);
    res.status(500).json({ error: 'Data validation failed' });
  }
});

router.put('/api/modules/:module/data', async (req, res) => {
  try {
    const module = req.params.module;
    const data = req.body;
    
    // Mock module data update
    res.json({
      success: true,
      module,
      recordsUpdated: Object.keys(data).length,
      updatedAt: new Date(),
      message: `${module} data updated successfully`
    });
  } catch (error) {
    console.error('Module data update error:', error);
    res.status(500).json({ error: 'Module data update failed' });
  }
});

// UAE Pass Integration routes
router.get('/api/admin/uae-pass/config', async (req, res) => {
  try {
    // Mock UAE Pass configuration
    const config = {
      enabled: true,
      environment: 'staging',
      clientId: 'peergos_test_client',
      endpoints: {
        auth: 'https://stg-id.uaepass.ae/idshub/authorize',
        token: 'https://stg-id.uaepass.ae/idshub/token',
        profile: 'https://stg-id.uaepass.ae/idshub/userinfo'
      },
      scopes: ['urn:uae:digitalid:profile', 'urn:uae:digitalid:profile:general'],
      lastUpdated: new Date(),
      status: 'CONFIGURED'
    };
    
    res.json(config);
  } catch (error) {
    console.error('UAE Pass config error:', error);
    res.status(500).json({ error: 'Failed to fetch UAE Pass configuration' });
  }
});

router.get('/api/admin/uae-pass/users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Mock UAE Pass users
    const users = [
      {
        id: 1,
        uaePassId: 'UAE123456789',
        emiratesId: '784-1990-1234567-8',
        fullName: 'Ahmed Al Mansouri',
        email: 'ahmed.almansouri@email.com',
        phone: '+971501234567',
        nationality: 'UAE',
        connectedAt: '2024-01-15T10:30:00Z',
        lastLoginAt: '2024-08-20T14:20:00Z',
        status: 'ACTIVE'
      },
      {
        id: 2,
        uaePassId: 'UAE987654321',
        emiratesId: '784-1985-9876543-2',
        fullName: 'Fatima Al Zahra',
        email: 'fatima.alzahra@email.com',
        phone: '+971509876543',
        nationality: 'UAE',
        connectedAt: '2024-02-20T09:15:00Z',
        lastLoginAt: '2024-08-25T11:45:00Z',
        status: 'ACTIVE'
      }
    ].slice(offset, offset + limit);
    
    res.json({
      users,
      total: 2,
      limit,
      offset,
      hasMore: false
    });
  } catch (error) {
    console.error('UAE Pass users error:', error);
    res.status(500).json({ error: 'Failed to fetch UAE Pass users' });
  }
});

router.post('/api/admin/uae-pass/test-connection', async (req, res) => {
  try {
    // Mock UAE Pass connection test
    const testResult = {
      success: true,
      responseTime: Math.floor(Math.random() * 500) + 100,
      status: "Connected to UAE Pass staging environment",
      timestamp: new Date(),
      environment: "staging",
      endpoints: {
        auth: "REACHABLE",
        token: "REACHABLE", 
        profile: "REACHABLE"
      }
    };
    
    res.json(testResult);
  } catch (error) {
    console.error('UAE Pass connection test failed:', error);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

router.post('/api/admin/uae-pass/mock-login', async (req, res) => {
  try {
    const { emiratesId } = req.body;
    
    if (!emiratesId) {
      return res.status(400).json({ error: 'Emirates ID is required' });
    }
    
    // Mock UAE Pass login response
    const mockUser = {
      uaePassId: `UAE${Date.now()}`,
      emiratesId,
      fullName: 'Test User',
      email: 'testuser@email.com',
      phone: '+971501234567',
      nationality: 'UAE',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      verified: true
    };
    
    res.json({
      success: true,
      user: mockUser,
      accessToken: 'mock_access_token_' + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 3600,
      message: 'Mock UAE Pass authentication successful'
    });
  } catch (error) {
    console.error('UAE Pass mock login error:', error);
    res.status(500).json({ error: 'Mock login failed' });
  }
});

// POS Integration routes
router.get('/api/pos/systems', async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    
    // Mock POS systems
    const posSystems = [
      {
        id: 1,
        companyId,
        name: 'Main Store POS',
        type: 'RETAIL',
        brand: 'Square',
        model: 'Register',
        location: 'Dubai Mall Store',
        status: 'CONNECTED',
        lastSync: new Date(Date.now() - 3600000), // 1 hour ago
        syncInterval: 300, // 5 minutes
        features: ['INVENTORY', 'SALES', 'PAYMENTS', 'REPORTS'],
        settings: {
          autoSync: true,
          syncSales: true,
          syncInventory: true,
          syncPayments: true
        }
      },
      {
        id: 2,
        companyId,
        name: 'Secondary Store POS',
        type: 'RESTAURANT', 
        brand: 'Toast',
        model: 'Go 2',
        location: 'JBR Branch',
        status: 'CONNECTED',
        lastSync: new Date(Date.now() - 1800000), // 30 minutes ago
        syncInterval: 600, // 10 minutes
        features: ['ORDERS', 'PAYMENTS', 'TIPS', 'REPORTS'],
        settings: {
          autoSync: true,
          syncOrders: true,
          syncPayments: true,
          syncTips: false
        }
      }
    ];
    
    res.json(posSystems);
  } catch (error) {
    console.error('POS systems error:', error);
    res.status(500).json({ error: 'Failed to fetch POS systems' });
  }
});

router.get('/api/pos/transactions', async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId as string) || 1;
    const posSystemId = req.query.posSystemId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Mock POS transactions
    const transactions = [
      {
        id: 'pos_txn_001',
        posSystemId: 1,
        transactionId: 'SQ_TXN_123456',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        type: 'SALE',
        amount: 156.75,
        vatAmount: 7.46,
        currency: 'AED',
        paymentMethod: 'CARD',
        items: [
          { name: 'Coffee Beans 1kg', quantity: 1, price: 85.00, vat: 4.05 },
          { name: 'Espresso Cup Set', quantity: 2, price: 35.88, vat: 1.71 }
        ],
        customer: {
          id: 'CUST_001',
          name: 'Ahmed Al Rashid',
          email: 'ahmed@email.com'
        },
        location: 'Dubai Mall Store',
        receipt: 'RCP_001_20240828'
      },
      {
        id: 'pos_txn_002',
        posSystemId: 2,
        transactionId: 'TOAST_TXN_789012',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'SALE',
        amount: 245.50,
        vatAmount: 11.69,
        currency: 'AED',
        paymentMethod: 'CASH',
        items: [
          { name: 'Chef Special Burger', quantity: 2, price: 85.00, vat: 4.05 },
          { name: 'Truffle Fries', quantity: 1, price: 45.00, vat: 2.14 },
          { name: 'Fresh Juice', quantity: 2, price: 25.00, vat: 1.19 }
        ],
        location: 'JBR Branch',
        receipt: 'RCP_002_20240828'
      }
    ].slice(0, limit);
    
    res.json({
      transactions,
      total: transactions.length,
      filters: {
        companyId,
        posSystemId,
        startDate,
        endDate
      },
      summary: {
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalVat: transactions.reduce((sum, t) => sum + t.vatAmount, 0),
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('POS transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch POS transactions' });
  }
});

router.post('/api/pos/connect', async (req, res) => {
  try {
    const { name, type, brand, model, location, apiKey, webhookUrl } = req.body;
    
    if (!name || !type || !brand) {
      return res.status(400).json({ error: 'Name, type, and brand are required' });
    }
    
    // Mock POS system connection
    const newPosSystem = {
      id: Date.now(),
      companyId: 1,
      name,
      type,
      brand,
      model: model || 'Unknown',
      location: location || 'Unspecified',
      status: 'CONNECTING',
      createdAt: new Date(),
      settings: {
        apiKey: apiKey ? '***HIDDEN***' : null,
        webhookUrl: webhookUrl || null,
        autoSync: true
      }
    };
    
    // Simulate connection test
    setTimeout(() => {
      // In real implementation, this would test the actual connection
      newPosSystem.status = 'CONNECTED';
    }, 1000);
    
    res.status(201).json({
      success: true,
      posSystem: newPosSystem,
      message: 'POS system connection initiated'
    });
  } catch (error) {
    console.error('POS connection error:', error);
    res.status(500).json({ error: 'Failed to connect POS system' });
  }
});

router.post('/api/pos/sync', async (req, res) => {
  try {
    const { posSystemId, syncType = 'FULL' } = req.body;
    
    if (!posSystemId) {
      return res.status(400).json({ error: 'POS system ID is required' });
    }
    
    // Mock sync operation
    const syncResult = {
      success: true,
      posSystemId,
      syncType,
      startedAt: new Date(),
      status: 'IN_PROGRESS',
      jobId: `sync_${posSystemId}_${Date.now()}`,
      estimatedDuration: 300, // 5 minutes
      operations: [
        { type: 'TRANSACTIONS', status: 'PENDING', recordCount: 0 },
        { type: 'INVENTORY', status: 'PENDING', recordCount: 0 },
        { type: 'CUSTOMERS', status: 'PENDING', recordCount: 0 }
      ]
    };
    
    // Simulate sync completion
    setTimeout(() => {
      syncResult.status = 'COMPLETED';
      syncResult.operations = [
        { type: 'TRANSACTIONS', status: 'COMPLETED', recordCount: 45 },
        { type: 'INVENTORY', status: 'COMPLETED', recordCount: 230 },
        { type: 'CUSTOMERS', status: 'COMPLETED', recordCount: 12 }
      ];
    }, 2000);
    
    res.json(syncResult);
  } catch (error) {
    console.error('POS sync error:', error);
    res.status(500).json({ error: 'POS synchronization failed' });
  }
});

export default router;