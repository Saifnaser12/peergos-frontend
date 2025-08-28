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
    req.session.companyId = user.companyId;
    
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
    const tasks = [];
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

export default router;