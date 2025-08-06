import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { insertTransactionSchema, insertTaxFilingSchema, insertInvoiceSchema, insertNotificationSchema, insertCreditNoteSchema, insertDebitNoteSchema, insertTransferPricingDocumentationSchema } from "@shared/schema";

// Import security and error handling middleware
import { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler 
} from "./middleware/error-handler";
import { 
  generalRateLimit,
  securityHeaders,
  requestId,
  requestLogger,
  sanitizeInput 
} from "./middleware/security";

// Import workflow template routes
import { registerWorkflowTemplateRoutes } from "./workflow-template-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply security middleware
  app.use(securityHeaders);
  app.use(requestId);
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.use(generalRateLimit);

  // Register workflow template routes
  registerWorkflowTemplateRoutes(app);

  // Workflow Status API
  app.get('/api/workflow-status', async (req, res) => {
    try {
      const userId = req.session?.userId || 1; // Default for demo
      
      // Get user's company and setup status
      const user = await storage.getUser(userId);
      const companyId = user?.companyId || 1;
      
      // Calculate current workflow position based on company data
      const company = companyId ? await storage.getCompany(companyId) : null;
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
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const company = user.companyId ? await storage.getCompany(user.companyId) : null;
      
      res.json({ 
        user: { ...user, password: undefined },
        company 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users/me", async (req, res) => {
    // Mock session - in real app would check session/JWT
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const company = user.companyId ? await storage.getCompany(user.companyId) : null;
    res.json({ user: { ...user, password: undefined }, company });
  });

  // Company routes
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const company = await storage.updateCompany(id, updates);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const type = req.query.type as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const transactions = await storage.getTransactions(companyId, { type, startDate, endDate });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      console.log('Received transaction data:', req.body);
      const validatedData = insertTransactionSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error('Transaction validation error:', error);
      res.status(400).json({ message: "Invalid transaction data", error: error?.message || error });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const transaction = await storage.updateTransaction(id, updates);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTransaction(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tax filing routes
  app.get("/api/tax-filings", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const type = req.query.type as string;
      
      const filings = await storage.getTaxFilings(companyId, type);
      res.json(filings);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tax-filings", async (req, res) => {
    try {
      const validatedData = insertTaxFilingSchema.parse(req.body);
      const filing = await storage.createTaxFiling(validatedData);
      res.status(201).json(filing);
    } catch (error) {
      res.status(400).json({ message: "Invalid tax filing data" });
    }
  });

  app.patch("/api/tax-filings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const filing = await storage.updateTaxFiling(id, updates);
      if (!filing) {
        return res.status(404).json({ message: "Tax filing not found" });
      }
      
      res.json(filing);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const invoices = await storage.getInvoices(companyId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      console.log('Received invoice data:', req.body);
      
      // Auto-generate invoice number if not provided
      if (!req.body.invoiceNumber) {
        req.body.invoiceNumber = `INV-${Date.now()}`;
      }
      
      const validatedData = insertInvoiceSchema.parse(req.body);
      console.log('Validated invoice data:', validatedData);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error('Invoice validation error:', error);
      res.status(400).json({ message: "Invalid invoice data", error: error?.message || error });
    }
  });

  // Credit Notes routes
  app.get("/api/credit-notes", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const creditNotes = await storage.getCreditNotes(companyId);
      res.json(creditNotes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/credit-notes", async (req, res) => {
    try {
      console.log('Received credit note data:', req.body);
      const validatedData = insertCreditNoteSchema.parse(req.body);
      console.log('Validated credit note data:', validatedData);
      const creditNote = await storage.createCreditNote(validatedData);
      res.status(201).json(creditNote);
    } catch (error: any) {
      console.error('Credit note validation error:', error);
      res.status(400).json({ message: "Invalid credit note data", error: error?.message || error });
    }
  });

  // Debit Notes routes
  app.get("/api/debit-notes", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const debitNotes = await storage.getDebitNotes(companyId);
      res.json(debitNotes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/debit-notes", async (req, res) => {
    try {
      console.log('Received debit note data:', req.body);
      const validatedData = insertDebitNoteSchema.parse(req.body);
      console.log('Validated debit note data:', validatedData);
      const debitNote = await storage.createDebitNote(validatedData);
      res.status(201).json(debitNote);
    } catch (error: any) {
      console.error('Debit note validation error:', error);
      res.status(400).json({ message: "Invalid debit note data", error: error?.message || error });
    }
  });

  // Automatic Tax Calculation routes
  app.post("/api/calculate-taxes", async (req, res) => {
    try {
      const companyId = parseInt(req.body.companyId) || 1;
      const period = req.body.period;
      
      const calculations = await storage.calculateAndUpdateTaxes(companyId, period);
      res.json(calculations);
    } catch (error) {
      console.error('Tax calculation error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/recalculate-financials", async (req, res) => {
    try {
      const companyId = parseInt(req.body.companyId) || 1;
      
      await storage.recalculateFinancials(companyId);
      res.json({ message: "Financial calculations updated successfully" });
    } catch (error) {
      console.error('Financial recalculation error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // KPI Data routes
  app.get("/api/kpi-data", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const period = req.query.period as string;
      
      const data = await storage.getKpiData(companyId, period);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const companyId = parseInt(req.query.companyId as string) || 1;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      const notifications = await storage.getNotifications(companyId, userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Invalid notification data" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Tax calculation routes
  app.post("/api/tax/calculate-vat", async (req, res) => {
    try {
      const { transactions, period } = req.body;
      
      // Basic VAT calculation (5%)
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
      });
    } catch (error) {
      res.status(500).json({ message: "VAT calculation error" });
    }
  });

  // Enhanced VAT calculation with comprehensive UAE compliance
  app.post("/api/tax/calculate-vat-enhanced", async (req, res) => {
    try {
      const { 
        standardRatedValue, standardRatedVAT,
        zeroRatedValue, exemptValue,
        reverseChargeValue, reverseChargeVAT,
        inputVATStandard, inputVATCapital, inputVATCorrections,
        increaseInVAT, decreaseInVAT,
        period 
      } = req.body;

      // Validate UAE VAT compliance
      const validationErrors = [];

      // Check standard-rated VAT calculation (5%)
      const expectedStandardVAT = Math.round(standardRatedValue * 0.05 * 100) / 100;
      if (Math.abs(standardRatedVAT - expectedStandardVAT) > 0.01) {
        validationErrors.push(`Standard VAT should be ${expectedStandardVAT}, but ${standardRatedVAT} was provided`);
      }

      // Check reverse charge VAT calculation
      if (reverseChargeValue > 0) {
        const expectedReverseVAT = Math.round(reverseChargeValue * 0.05 * 100) / 100;
        if (Math.abs(reverseChargeVAT - expectedReverseVAT) > 0.01) {
          validationErrors.push(`Reverse charge VAT should be ${expectedReverseVAT}, but ${reverseChargeVAT} was provided`);
        }
      }

      // Calculate totals
      const totalOutputVAT = standardRatedVAT + reverseChargeVAT + increaseInVAT - decreaseInVAT;
      const totalInputVAT = inputVATStandard + inputVATCapital + inputVATCorrections;
      const netVATPayable = totalOutputVAT - totalInputVAT;

      // Generate detailed breakdown
      const breakdown = {
        supplies: {
          standardRated: { value: standardRatedValue, vat: standardRatedVAT, rate: 5 },
          zeroRated: { value: zeroRatedValue, vat: 0, rate: 0 },
          exempt: { value: exemptValue, vat: 0, rate: null },
          reverseCharge: { value: reverseChargeValue, vat: reverseChargeVAT, rate: 5 }
        },
        adjustments: {
          increase: increaseInVAT,
          decrease: decreaseInVAT,
          net: increaseInVAT - decreaseInVAT
        },
        inputVAT: {
          standard: inputVATStandard,
          capital: inputVATCapital,
          corrections: inputVATCorrections,
          total: totalInputVAT
        },
        totals: {
          outputVAT: totalOutputVAT,
          inputVAT: totalInputVAT,
          netVATPayable,
          isRefund: netVATPayable < 0
        },
        compliance: {
          validationErrors,
          isCompliant: validationErrors.length === 0,
          warnings: []
        }
      };

      // Add compliance warnings
      if (exemptValue > 50000) {
        breakdown.compliance.warnings.push('Exempt supplies exceed AED 50,000 - partial exemption rules may apply');
      }

      if (netVATPayable < -10000) {
        breakdown.compliance.warnings.push('Large VAT refund claimed - ensure proper documentation is available');
      }

      res.json({
        period,
        breakdown,
        calculatedAt: new Date(),
        ftaCompliance: {
          standardRate: 5,
          zeroRateSupplies: ['Exports', 'International transport', 'Investment precious metals'],
          exemptSupplies: ['Financial services', 'Residential rent', 'Life insurance'],
          reverseChargeApplicable: ['Digital services from abroad', 'Imported services']
        }
      });
    } catch (error) {
      console.error('Enhanced VAT calculation error:', error);
      res.status(500).json({ message: "Enhanced VAT calculation error" });
    }
  });

  app.post("/api/tax/calculate-cit", async (req, res) => {
    try {
      const { revenue, expenses, freeZone, eligibleIncome } = req.body;
      
      const netIncome = revenue - expenses;
      let citRate = 0.09; // 9% standard rate
      let citDue = 0;
      
      // Small Business Relief - 0% on first AED 375,000
      if (netIncome <= 375000) {
        citDue = 0;
      } else {
        citDue = (netIncome - 375000) * citRate;
      }
      
      // QFZP logic - Free Zone with eligible income < AED 3m
      if (freeZone && eligibleIncome < 3000000) {
        citDue = 0;
      }
      
      res.json({
        netIncome,
        citRate: citRate * 100,
        smallBusinessRelief: Math.min(netIncome, 375000),
        taxableIncome: Math.max(0, netIncome - 375000),
        citDue,
        freeZoneApplied: freeZone && eligibleIncome < 3000000,
        calculatedAt: new Date(),
      });
    } catch (error) {
      res.status(500).json({ message: "CIT calculation error" });
    }
  });

  // Tax calculation route
  app.post("/api/calculate-tax", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { type, startDate, endDate, period } = req.body;
      
      if (!type || !['CIT', 'VAT'].includes(type)) {
        return res.status(400).json({ error: "Invalid tax type. Must be 'CIT' or 'VAT'" });
      }

      // Get company and verify TRN matches user account
      const company = await storage.getCompany(req.user.companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Fetch transactions for the company
      const transactions = await storage.getTransactions(req.user.companyId, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });

      const { TaxCalculator } = await import('./tax-calculator');
      
      let result;
      if (type === 'VAT') {
        result = TaxCalculator.calculateVAT(transactions, company, { 
          companyId: req.user.companyId, 
          type, 
          startDate, 
          endDate, 
          period 
        });
      } else {
        result = TaxCalculator.calculateCIT(transactions, company, { 
          companyId: req.user.companyId, 
          type, 
          startDate, 
          endDate, 
          period 
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Tax calculation failed:", error);
      res.status(500).json({ error: "Tax calculation failed" });
    }
  });

  // Download tax filing endpoint
  app.get('/api/tax-filings/:id/download', async (req: Request, res: Response) => {
    try {
      const filingId = parseInt(req.params.id);
      if (isNaN(filingId)) {
        return res.status(400).json({ error: 'Invalid filing ID' });
      }

      // Verify user authentication
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get the filing
      const filing = await storage.getTaxFilings(req.user.companyId).then(filings => 
        filings.find(f => f.id === filingId)
      );

      if (!filing) {
        return res.status(404).json({ error: 'Filing not found' });
      }

      // Generate PDF content (in a real implementation, this would fetch the actual PDF)
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
Company ID: ${req.user.companyId}
      `;

      // Set headers for text download (in production this would be a proper PDF)
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filing.type}_Return_${filing.period}_${filing.id}.txt"`);
      
      res.send(pdfContent);

    } catch (error) {
      console.error('Download filing error:', error);
      res.status(500).json({ error: 'Failed to download filing' });
    }
  });

  // Tax return submission route
  app.post("/api/submit-return", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Handle multipart form data for file uploads
      const { type, period, totalRevenue, totalExpenses, netIncome, taxOwed, taxAgentName } = req.body;
      
      if (!type || !['CIT', 'VAT'].includes(type)) {
        return res.status(400).json({ error: "Invalid tax type. Must be 'CIT' or 'VAT'" });
      }

      if (!period || !taxAgentName) {
        return res.status(400).json({ error: "Period and tax agent name are required" });
      }

      // Get company and verify ownership
      const company = await storage.getCompany(req.user.companyId);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Calculate due date based on type
      const now = new Date();
      let dueDate: Date;
      
      if (type === 'VAT') {
        // VAT due by 28th of following month
        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 28);
      } else {
        // CIT due within 9 months of financial year-end (assume Dec 31)
        const currentYear = now.getFullYear();
        dueDate = new Date(currentYear + 1, 8, 30); // September 30 of following year
      }

      // Generate reference number
      const reference = `${type}_${Date.now()}_${req.user.companyId}`;

      // Create tax filing record
      const filing = await storage.createTaxFiling({
        companyId: req.user.companyId,
        type,
        period,
        status: 'SUBMITTED',
        totalTax: taxOwed?.toString() || '0',
        dueDate: dueDate.toISOString(),
        submittedAt: now.toISOString(),
        metadata: JSON.stringify({
          totalRevenue: parseFloat(totalRevenue || '0'),
          totalExpenses: parseFloat(totalExpenses || '0'),
          netIncome: parseFloat(netIncome || '0'),
          taxOwed: parseFloat(taxOwed || '0'),
          taxAgentName,
          reference,
          submittedBy: req.user.username,
          // In production, this would include file paths/URLs
          attachments: {
            taxAgentCertificate: req.body.taxAgentCertificate ? 'uploaded' : null,
            paymentProof: req.body.paymentProof ? 'uploaded' : null,
          }
        })
      });

      res.json({
        success: true,
        reference,
        filingId: filing.id,
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

  // FTA Integration mock routes
  app.get("/api/fta/trn-lookup/:trn", async (req, res) => {
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

  app.post("/api/fta/submit-filing", async (req, res) => {
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

  // Transfer Pricing Documentation routes
  app.get("/api/transfer-pricing/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const { transferPricingDocumentation } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
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

  app.post("/api/transfer-pricing", async (req, res) => {
    try {
      const validatedData = insertTransferPricingDocumentationSchema.parse(req.body);
      const { transferPricingDocumentation } = await import("@shared/schema");
      const { db } = await import("./db");
      
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

  app.patch("/api/transfer-pricing/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const { transferPricingDocumentation } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
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
  app.get("/api/chart-of-accounts", async (req, res) => {
    try {
      const { chartOfAccounts } = await import("@shared/schema");
      const { db } = await import("./db");
      
      const result = await db.select().from(chartOfAccounts).orderBy(chartOfAccounts.code);
      res.json(result);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      res.status(500).json({ error: 'Failed to fetch chart of accounts' });
    }
  });

  app.get("/api/chart-of-accounts/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { chartOfAccounts } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      
      const result = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.code, code));

      if (result.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({ error: 'Failed to fetch account' });
    }
  });

  // Document Management Routes
  const { ObjectStorageService } = await import("./objectStorage");
  const objectStorageService = new ObjectStorageService();

  // Get upload URL for documents
  app.post("/api/documents/upload-url", async (req, res) => {
    try {
      const { fileName, fileType, category, companyId } = req.body;
      
      if (!fileName || !fileType || !category || !companyId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const uploadData = await objectStorageService.getObjectEntityUploadURL(fileName);
      
      res.json({
        uploadUrl: uploadData.uploadUrl,
        finalUrl: uploadData.finalUrl,
        objectPath: uploadData.objectPath
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Create document record
  app.post("/api/documents", async (req, res) => {
    try {
      const documentData = req.body;
      const result = await storage.createDocument({
        ...documentData,
        uploadedBy: 1, // Mock user ID - would get from session
        status: 'ACTIVE'
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Get documents for company
  app.get("/api/documents", async (req, res) => {
    try {
      const { companyId = 1, category, search, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query;
      const documents = await storage.getDocuments({
        companyId: Number(companyId),
        category: category as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      });
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get document statistics
  app.get("/api/documents/stats", async (req, res) => {
    try {
      const companyId = req.query.companyId || 1;
      const stats = await storage.getDocumentStats(Number(companyId));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching document stats:", error);
      res.status(500).json({ message: "Failed to fetch document stats" });
    }
  });

  // Serve document files
  app.get("/api/documents/file/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const filePath = `/api/documents/file/${fileName}`;
      const file = await objectStorageService.getObjectEntityFile(filePath);
      
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving document:", error);
      res.status(404).json({ message: "Document not found" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDocument(Number(id));
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Archive document
  app.patch("/api/documents/:id/archive", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.updateDocument(Number(id), { status: 'ARCHIVED' });
      res.json(result);
    } catch (error) {
      console.error("Error archiving document:", error);
      res.status(500).json({ message: "Failed to archive document" });
    }
  });

  // Calculation Audit Routes
  const calculationAuditRoutes = await import("./routes/calculation-audit");
  app.use("/api/calculation-audit", calculationAuditRoutes.default);

  // Integration Routes
  const integrationRoutes = await import("./routes/integrations");
  app.use("/api/integrations", integrationRoutes.default);

  // Data Export Routes
  const dataExportRoutes = await import("./routes/data-export");
  app.use("/api/data-export", dataExportRoutes.default);

  // Data Import Routes
  const dataImportRoutes = await import("./routes/data-import");
  app.use("/api/data-import", dataImportRoutes.default);

  // Webhook Routes
  const webhookRoutes = await import("./routes/webhooks");
  app.use("/api/webhooks", webhookRoutes.default);

  // Sync Service Routes
  const syncServiceRoutes = await import("./routes/sync-service");
  app.use("/api/sync", syncServiceRoutes.default);

  // Setup wizard completion endpoint
  app.post("/api/setup/complete", asyncHandler(async (req, res) => {
    const setupData = req.body;
    const userId = 1; // Mock user ID - would get from session
    const companyId = 1; // Mock company ID - would get from session

    // Update company with setup data
    const updatedCompany = await storage.updateCompany(companyId, {
      name: setupData.companyInfo.name,
      address: setupData.companyInfo.address,
      phone: setupData.companyInfo.phone,
      email: setupData.companyInfo.email,
      emirate: setupData.companyInfo.emirate,
      industry: setupData.companyInfo.industry,
      trn: setupData.companyInfo.trn,
      expectedAnnualRevenue: setupData.revenueThreshold.expectedAnnualRevenue,
      hasInternationalSales: setupData.revenueThreshold.hasInternationalSales,
      internationalSalesPercentage: setupData.revenueThreshold.internationalPercentage,
      vatRegistered: setupData.taxRegistration.vatRegistered,
      citRegistrationRequired: setupData.taxRegistration.citRegistrationRequired,
      freeZone: setupData.taxRegistration.freeZone,
      qfzpStatus: setupData.taxRegistration.qfzpStatus,
      accountingMethod: setupData.accountingBasis.accountingMethod,
      financialYearEnd: setupData.accountingBasis.financialYearEnd,
      setupCompleted: true,
      setupCompletedAt: new Date(),
    });

    // Create initial notification about successful setup
    await storage.createNotification({
      companyId,
      userId,
      type: 'setup',
      title: 'Setup Complete',
      message: `Company setup completed successfully. ${setupData.taxRegistration.vatRegistered ? 'VAT registration required.' : ''} ${setupData.accountingBasis.accountingMethod === 'accrual' ? 'Accrual accounting method selected.' : 'Cash basis accounting available.'}`,
      priority: 'medium',
      read: false,
    });

    res.json({
      success: true,
      message: 'Setup completed successfully',
      company: updatedCompany,
    });
  }));

  // Note: Do not add catch-all error handlers here in development
  // The Vite middleware needs to handle static routes after this
  // Cross-module data sync endpoints
  app.get('/api/cross-module-data', async (req, res) => {
    try {
      const userId = req.session?.userId || 1;
      const user = await storage.getUser(userId);
      const companyId = user?.companyId || 1;

      // Gather data from all modules
      const company = companyId ? await storage.getCompany(companyId) : null;
      const transactions = []; // Will be populated from actual transaction data
      const taxSettings = null; // Will be populated from actual tax settings

      // Auto-calculate VAT from transactions
      const vatCalculations = {
        totalVATCollected: 0,
        totalVATInput: 0,
        netVATLiability: 0,
        vatRate: 0.05
      };
      
      // Auto-calculate CIT from transactions
      const citCalculations = {
        totalIncome: 0,
        deductibleExpenses: 0,
        taxableIncome: 0,
        citLiability: 0,
        citRate: 0.09,
        isEligibleForSBR: true
      };

      const crossModuleData = {
        transactions,
        company,
        vatCalculations,
        citCalculations,
        taxSettings
      };

      res.json(crossModuleData);
    } catch (error) {
      console.error('Error fetching cross-module data:', error);
      res.status(500).json({ error: 'Failed to fetch cross-module data' });
    }
  });

  app.post('/api/sync-modules', async (req, res) => {
    try {
      const { modules } = req.body;
      const timestamp = new Date().toISOString();

      // Process module synchronization
      const syncResults = {};
      modules.forEach(module => {
        syncResults[module] = { status: 'success', updated: [] };
      });

      res.json({
        success: true,
        timestamp,
        results: syncResults
      });
    } catch (error) {
      console.error('Error syncing modules:', error);
      res.status(500).json({ error: 'Failed to sync modules' });
    }
  });

  app.get('/api/validate-data-consistency', async (req, res) => {
    try {
      const userId = req.session?.userId || 1;
      const user = await storage.getUser(userId);
      const companyId = user?.companyId || 1;
      const company = companyId ? await storage.getCompany(companyId) : null;

      const validationErrors = [];

      // Validate company setup completion
      if (!company?.setupCompleted) {
        validationErrors.push({
          id: 'company-setup-incomplete',
          module: 'company',
          field: 'setupCompleted',
          message: 'Company setup is not complete. This will affect tax calculations.',
          severity: 'warning',
          affectedModules: ['vat-calculations', 'cit-calculations', 'reports']
        });
      }

      // Validate TRN format
      if (company?.trn && !/^\d{15}$/.test(company.trn)) {
        validationErrors.push({
          id: 'invalid-trn-format',
          module: 'company',
          field: 'trn',
          message: 'TRN must be exactly 15 digits for FTA compliance',
          severity: 'error',
          affectedModules: ['vat-calculations', 'reports', 'filing']
        });
      }

      res.json(validationErrors);
    } catch (error) {
      console.error('Error validating data consistency:', error);
      res.status(500).json({ error: 'Failed to validate data consistency' });
    }
  });

  app.put('/api/modules/:module/data', async (req, res) => {
    try {
      const { module } = req.params;
      const updateData = req.body;
      const userId = req.session?.userId || 1;

      let result;
      switch (module) {
        case 'company':
          const user = await storage.getUser(userId);
          if (user?.companyId) {
            result = await storage.updateCompany(user.companyId, updateData);
          }
          break;
        default:
          result = { updated: true, module, timestamp: new Date().toISOString() };
      }

      res.json({
        success: true,
        module,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error updating ${req.params.module} data:`, error);
      res.status(500).json({ error: `Failed to update ${req.params.module} data` });
    }
  });

  // FTA Integration API endpoints (placeholder/mock)
  app.get('/api/fta/status', async (req, res) => {
    try {
      // Mock FTA connection status
      const mockStatus = {
        isConnected: false,
        lastConnectionTest: new Date().toISOString(),
        status: 'inactive',
        environment: 'sandbox',
        apiVersion: 'v2.0',
        lastSuccessfulSubmission: null
      };
      
      res.json(mockStatus);
    } catch (error) {
      console.error('Error fetching FTA status:', error);
      res.status(500).json({ error: 'Failed to fetch FTA status' });
    }
  });

  app.post('/api/fta/test-connection', async (req, res) => {
    try {
      // Simulate connection test with random success/failure
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isSuccess) {
        res.json({
          success: true,
          message: 'FTA API connection test successful',
          responseTime: Math.floor(Math.random() * 500) + 200,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: false,
          message: 'FTA API connection test failed - timeout or invalid credentials',
          error: 'CONNECTION_TIMEOUT',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error testing FTA connection:', error);
      res.status(500).json({ error: 'Failed to test FTA connection' });
    }
  });

  app.get('/api/fta/submissions', async (req, res) => {
    try {
      // Mock submission logs
      const mockSubmissions = [
        {
          id: 'sub_001',
          submissionType: 'vat-return',
          status: 'accepted',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          responseTime: 1234,
          ftaReferenceNumber: 'FTA-VAT-2025-001234',
          documentId: 'VAT-Q1-2025'
        },
        {
          id: 'sub_002',
          submissionType: 'e-invoice',
          status: 'pending',
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          responseTime: 856,
          documentId: 'INV-2025-0157'
        },
        {
          id: 'sub_003',
          submissionType: 'cit-return',
          status: 'rejected',
          submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          responseTime: 2145,
          errorMessage: 'Invalid business activity code',
          documentId: 'CIT-2024-ANNUAL'
        },
        {
          id: 'sub_004',
          submissionType: 'e-invoice',
          status: 'accepted',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          responseTime: 623,
          ftaReferenceNumber: 'FTA-INV-2025-005678',
          documentId: 'INV-2025-0156'
        }
      ];
      
      res.json(mockSubmissions);
    } catch (error) {
      console.error('Error fetching FTA submissions:', error);
      res.status(500).json({ error: 'Failed to fetch FTA submissions' });
    }
  });

  app.get('/api/fta/notifications', async (req, res) => {
    try {
      // Mock FTA notifications
      const mockNotifications = [
        {
          id: 'notif_001',
          type: 'submission_success',
          title: 'VAT Return Accepted',
          message: 'Your Q1 2025 VAT return has been successfully submitted and accepted by FTA.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          severity: 'success'
        },
        {
          id: 'notif_002',
          type: 'api_status',
          title: 'FTA API Maintenance',
          message: 'Scheduled maintenance on FTA systems from 2:00 AM to 4:00 AM GST on Sunday.',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          severity: 'info'
        },
        {
          id: 'notif_003',
          type: 'submission_error',
          title: 'CIT Return Rejected',
          message: 'Your annual CIT return was rejected due to invalid business activity code. Please review and resubmit.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          severity: 'error'
        },
        {
          id: 'notif_004',
          type: 'compliance_alert',
          title: 'Filing Deadline Reminder',
          message: 'VAT return for the current period is due in 5 days. Ensure all transactions are recorded.',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          severity: 'warning'
        }
      ];
      
      res.json(mockNotifications);
    } catch (error) {
      console.error('Error fetching FTA notifications:', error);
      res.status(500).json({ error: 'Failed to fetch FTA notifications' });
    }
  });

  // Mock FTA submission endpoint
  app.post('/api/fta/submit', async (req, res) => {
    try {
      const { submissionType, documentId, data } = req.body;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random success/failure for demo
      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      if (isSuccess) {
        const ftaReferenceNumber = `FTA-${submissionType.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
        
        res.json({
          success: true,
          ftaReferenceNumber,
          submissionId: `sub_${Date.now()}`,
          status: 'submitted',
          message: 'Document successfully submitted to FTA',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Document validation failed - missing required fields',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error submitting to FTA:', error);
      res.status(500).json({ error: 'Failed to submit to FTA' });
    }
  });

  // UAE Pass Integration API endpoints (placeholder/mock)
  app.get('/api/admin/uae-pass/config', async (req, res) => {
    try {
      // Mock UAE Pass configuration
      const mockConfig = {
        isEnabled: false,
        environment: 'sandbox',
        autoUserCreation: true,
        requireVerification: true,
        allowedNationalities: ['UAE', 'GCC'],
        clientId: undefined
      };
      
      res.json(mockConfig);
    } catch (error) {
      console.error('Error fetching UAE Pass config:', error);
      res.status(500).json({ error: 'Failed to fetch UAE Pass configuration' });
    }
  });

  app.get('/api/admin/uae-pass/users', async (req, res) => {
    try {
      // Mock UAE Pass connected users
      const mockUsers = [
        {
          id: 'uaepass_001',
          emiratesId: '784-1985-1234567',
          fullNameEn: 'Ahmed Mohammed Al Rashid',
          fullNameAr: 'أحمد محمد الراشد',
          email: 'ahmed.rashid@example.ae',
          phoneNumber: '+971501234567',
          nationality: 'UAE',
          gender: 'M',
          dateOfBirth: '1985-03-15',
          isVerified: true,
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'uaepass_002',
          emiratesId: '784-1990-9876543',
          fullNameEn: 'Fatima Ali Hassan',
          fullNameAr: 'فاطمة علي حسن',
          email: 'fatima.hassan@example.ae',
          phoneNumber: '+971557654321',
          nationality: 'UAE',
          gender: 'F',
          dateOfBirth: '1990-07-22',
          isVerified: true,
          lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          connectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json(mockUsers);
    } catch (error) {
      console.error('Error fetching UAE Pass users:', error);
      res.status(500).json({ error: 'Failed to fetch UAE Pass users' });
    }
  });

  app.post('/api/admin/uae-pass/test-connection', async (req, res) => {
    try {
      // Simulate connection test with random success/failure
      const isSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      if (isSuccess) {
        res.json({
          success: true,
          message: 'UAE Pass API connection test successful',
          environment: 'sandbox',
          responseTime: Math.floor(Math.random() * 800) + 300,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: false,
          message: 'UAE Pass API connection test failed - invalid client credentials',
          error: 'INVALID_CREDENTIALS',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error testing UAE Pass connection:', error);
      res.status(500).json({ error: 'Failed to test UAE Pass connection' });
    }
  });

  // Mock UAE Pass OAuth flow simulation
  app.post('/api/admin/uae-pass/mock-login', async (req, res) => {
    try {
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Random success/failure for demo
      const isSuccess = Math.random() > 0.15; // 85% success rate
      
      if (isSuccess) {
        const mockUser = {
          emiratesId: '784-' + (1980 + Math.floor(Math.random() * 25)) + '-' + Math.floor(Math.random() * 9999999).toString().padStart(7, '0'),
          fullNameEn: 'Test User ' + Math.floor(Math.random() * 1000),
          fullNameAr: 'مستخدم تجريبي ' + Math.floor(Math.random() * 1000),
          email: 'testuser' + Math.floor(Math.random() * 1000) + '@example.ae',
          nationality: 'UAE',
          gender: Math.random() > 0.5 ? 'M' : 'F',
          isVerified: Math.random() > 0.1 // 90% verified
        };
        
        res.json({
          success: true,
          user: mockUser,
          accessToken: 'mock_token_' + Date.now(),
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'USER_CANCELLED',
          message: 'User cancelled authentication or provided invalid credentials',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error in mock UAE Pass login:', error);
      res.status(500).json({ error: 'Failed to simulate UAE Pass login' });
    }
  });

  // POS Integration API endpoints (placeholder/mock)
  app.get('/api/pos/systems', async (req, res) => {
    try {
      // Mock POS systems data
      const mockPOSSystems = [
        {
          id: 'square',
          name: 'Square',
          description: 'Complete POS solution for retail and restaurants',
          isConnected: true,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          transactionCount: 145,
          status: 'connected',
          supportedFeatures: ['Sales', 'Inventory', 'Customers', 'VAT', 'Receipts']
        },
        {
          id: 'shopify_pos',
          name: 'Shopify POS',
          description: 'Unified commerce platform for online and offline sales',
          isConnected: false,
          transactionCount: 0,
          status: 'disconnected',
          supportedFeatures: ['Sales', 'Inventory', 'Multi-location', 'Online Sync']
        },
        {
          id: 'lightspeed',
          name: 'Lightspeed Retail',
          description: 'Cloud-based POS for retail businesses',
          isConnected: true,
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          transactionCount: 89,
          status: 'connected',
          supportedFeatures: ['Sales', 'Inventory', 'Reporting', 'E-commerce']
        },
        {
          id: 'clover',
          name: 'Clover POS',
          description: 'Full-service POS and business management system',
          isConnected: false,
          transactionCount: 0,
          status: 'disconnected',
          supportedFeatures: ['Sales', 'Payments', 'Inventory', 'Staff Management']
        },
        {
          id: 'toast',
          name: 'Toast POS',
          description: 'Restaurant-specific POS solution',
          isConnected: true,
          lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          transactionCount: 67,
          status: 'connected',
          supportedFeatures: ['Orders', 'Kitchen Display', 'Online Ordering', 'Delivery']
        },
        {
          id: 'loyverse',
          name: 'Loyverse POS',
          description: 'Free POS system for small businesses',
          isConnected: false,
          transactionCount: 0,
          status: 'disconnected',
          supportedFeatures: ['Sales', 'Loyalty Programs', 'Analytics', 'Multi-store']
        }
      ];
      
      res.json(mockPOSSystems);
    } catch (error) {
      console.error('Error fetching POS systems:', error);
      res.status(500).json({ error: 'Failed to fetch POS systems' });
    }
  });

  app.get('/api/pos/transactions', async (req, res) => {
    try {
      // Mock POS transactions data
      const mockTransactions = [
        {
          id: 'txn_001',
          posSystemId: 'square',
          transactionDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          amount: 125.50,
          currency: 'AED',
          paymentMethod: 'Card',
          items: [
            { name: 'Coffee', quantity: 2, unitPrice: 15.00, vatRate: 0.05 },
            { name: 'Sandwich', quantity: 1, unitPrice: 45.00, vatRate: 0.05 },
            { name: 'Juice', quantity: 3, unitPrice: 18.50, vatRate: 0.05 }
          ],
          vatAmount: 5.98,
          receiptNumber: 'SQ-2025-001234',
          location: 'Dubai Mall Branch'
        },
        {
          id: 'txn_002',
          posSystemId: 'lightspeed',
          transactionDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          amount: 89.25,
          currency: 'AED',
          paymentMethod: 'Cash',
          items: [
            { name: 'T-Shirt', quantity: 1, unitPrice: 85.00, vatRate: 0.05 }
          ],
          vatAmount: 4.25,
          receiptNumber: 'LS-2025-005678',
          location: 'Marina Walk Store'
        },
        {
          id: 'txn_003',
          posSystemId: 'toast',
          transactionDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          amount: 234.75,
          currency: 'AED',
          paymentMethod: 'Card',
          items: [
            { name: 'Margherita Pizza', quantity: 1, unitPrice: 65.00, vatRate: 0.05 },
            { name: 'Caesar Salad', quantity: 2, unitPrice: 45.00, vatRate: 0.05 },
            { name: 'Soft Drink', quantity: 3, unitPrice: 12.00, vatRate: 0.05 },
            { name: 'Tiramisu', quantity: 1, unitPrice: 32.00, vatRate: 0.05 }
          ],
          vatAmount: 11.18,
          receiptNumber: 'TST-2025-009876',
          customerId: 'cust_789',
          location: 'JBR Restaurant'
        },
        {
          id: 'txn_004',
          posSystemId: 'square',
          transactionDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          amount: 67.50,
          currency: 'AED',
          paymentMethod: 'Digital Wallet',
          items: [
            { name: 'Laptop Bag', quantity: 1, unitPrice: 64.29, vatRate: 0.05 }
          ],
          vatAmount: 3.21,
          receiptNumber: 'SQ-2025-001235',
          location: 'Dubai Mall Branch'
        }
      ];
      
      res.json(mockTransactions);
    } catch (error) {
      console.error('Error fetching POS transactions:', error);
      res.status(500).json({ error: 'Failed to fetch POS transactions' });
    }
  });

  app.post('/api/pos/connect', async (req, res) => {
    try {
      const { posSystemId } = req.body;
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random success/failure for demo
      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      if (isSuccess) {
        res.json({
          success: true,
          message: `Successfully connected to ${posSystemId}`,
          connectionId: `conn_${Date.now()}`,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'CONNECTION_FAILED',
          message: 'Failed to establish connection - check credentials',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error connecting POS system:', error);
      res.status(500).json({ error: 'Failed to connect POS system' });
    }
  });

  app.post('/api/pos/sync', async (req, res) => {
    try {
      const { posSystemId } = req.body;
      
      // Simulate sync process with longer delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Random success/failure for demo
      const isSuccess = Math.random() > 0.1; // 90% success rate
      
      if (isSuccess) {
        const transactionCount = Math.floor(Math.random() * 50) + 10; // 10-60 transactions
        
        res.json({
          success: true,
          message: `Successfully synced transactions from ${posSystemId}`,
          transactionCount,
          newTransactions: transactionCount,
          duplicatesSkipped: Math.floor(Math.random() * 5),
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'SYNC_FAILED',
          message: 'Sync failed - POS system temporarily unavailable',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error syncing POS transactions:', error);
      res.status(500).json({ error: 'Failed to sync POS transactions' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
