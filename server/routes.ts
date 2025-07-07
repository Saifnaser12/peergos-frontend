import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertTaxFilingSchema, insertInvoiceSchema, insertNotificationSchema, insertCreditNoteSchema, insertDebitNoteSchema } from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
