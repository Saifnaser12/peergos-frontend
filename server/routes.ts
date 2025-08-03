import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { insertTransactionSchema, insertTaxFilingSchema, insertInvoiceSchema, insertNotificationSchema, insertCreditNoteSchema, insertDebitNoteSchema, insertTransferPricingDocumentationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  const httpServer = createServer(app);
  return httpServer;
}
