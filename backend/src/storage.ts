import { 
  users, companies, transactions, taxFilings, invoices, notifications, creditNotes, debitNotes, kpiData, documentsTable,
  integrations, syncJobs, exportJobs, importJobs, webhooks, webhookDeliveries, syncConflicts,
  type User, type InsertUser, type Company, type InsertCompany,
  type Transaction, type InsertTransaction, type TaxFiling, type InsertTaxFiling,
  type Invoice, type InsertInvoice, type Notification, type InsertNotification,
  type CreditNote, type InsertCreditNote, type DebitNote, type InsertDebitNote,
  type KpiData, type InsertKpiData, type Document, type InsertDocument,
  type Integration, type InsertIntegration, type SyncJob, type InsertSyncJob,
  type ExportJob, type InsertExportJob, type ImportJob, type InsertImportJob,
  type Webhook, type InsertWebhook, type WebhookDelivery, type InsertWebhookDelivery,
  type SyncConflict, type InsertSyncConflict
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Company management
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Transactions
  getTransactions(companyId: number, filters?: { type?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Tax filings
  getTaxFilings(companyId: number, type?: string): Promise<TaxFiling[]>;
  createTaxFiling(filing: InsertTaxFiling): Promise<TaxFiling>;
  updateTaxFiling(id: number, updates: Partial<InsertTaxFiling>): Promise<TaxFiling | undefined>;
  
  // Invoices
  getInvoices(companyId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  
  // Credit Notes
  getCreditNotes(companyId: number): Promise<CreditNote[]>;
  getCreditNote(id: number): Promise<CreditNote | undefined>;
  createCreditNote(creditNote: InsertCreditNote): Promise<CreditNote>;
  updateCreditNote(id: number, updates: Partial<InsertCreditNote>): Promise<CreditNote | undefined>;
  
  // Debit Notes
  getDebitNotes(companyId: number): Promise<DebitNote[]>;
  getDebitNote(id: number): Promise<DebitNote | undefined>;
  createDebitNote(debitNote: InsertDebitNote): Promise<DebitNote>;
  updateDebitNote(id: number, updates: Partial<InsertDebitNote>): Promise<DebitNote | undefined>;
  
  // Notifications
  getNotifications(companyId: number, userId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  updateNotification(id: number, updates: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  
  // KPI Data
  getKpiData(companyId: number, period?: string): Promise<KpiData[]>;
  createKpiData(data: InsertKpiData): Promise<KpiData>;
  updateKpiData(companyId: number, period: string, updates: Partial<InsertKpiData>): Promise<KpiData | undefined>;
  
  // Automatic Tax Calculations
  calculateAndUpdateTaxes(companyId: number, period?: string): Promise<{ vatDue: number; citDue: number; netIncome: number }>;
  recalculateFinancials(companyId: number): Promise<void>;

  // Document Management
  getDocuments(filters: { companyId: number; category?: string; search?: string; sortBy?: string; sortOrder?: string }): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Integration Management
  getIntegrations(companyId: number): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, updates: Partial<InsertIntegration>): Promise<Integration | undefined>;
  
  // Sync Jobs
  createSyncJob(job: InsertSyncJob): Promise<SyncJob>;
  getSyncJob(id: number): Promise<SyncJob | undefined>;
  updateSyncJob(id: number, updates: Partial<InsertSyncJob>): Promise<SyncJob | undefined>;
  getSyncHistory(companyId: number, options: { page: number; limit: number; integrationId?: number; status?: string; startDate?: Date; endDate?: Date }): Promise<{ jobs: SyncJob[]; total: number }>;
  getSyncStats(companyId: number, period: string): Promise<any>;
  
  // Data Export/Import
  createExportJob(job: InsertExportJob): Promise<ExportJob>;
  updateExportJob(id: number, updates: Partial<InsertExportJob>): Promise<ExportJob | undefined>;
  getExportHistory(companyId: number, options: { page: number; limit: number }): Promise<{ jobs: ExportJob[]; total: number }>;
  
  createImportJob(job: InsertImportJob): Promise<ImportJob>;
  getImportJob(id: number): Promise<ImportJob | undefined>;
  updateImportJob(id: number, updates: Partial<InsertImportJob>): Promise<ImportJob | undefined>;
  getImportHistory(companyId: number, options: { page: number; limit: number }): Promise<{ jobs: ImportJob[]; total: number }>;
  
  // Webhooks
  getWebhooks(companyId: number): Promise<Webhook[]>;
  getWebhook(id: number): Promise<Webhook | undefined>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: number, updates: Partial<InsertWebhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;
  getWebhooksByEvent(companyId: number, event: string): Promise<Webhook[]>;
  
  // Webhook Deliveries
  createWebhookDelivery(delivery: InsertWebhookDelivery): Promise<WebhookDelivery>;
  getWebhookDelivery(id: number): Promise<WebhookDelivery | undefined>;
  updateWebhookDelivery(id: number, updates: Partial<InsertWebhookDelivery>): Promise<WebhookDelivery | undefined>;
  getWebhookDeliveries(webhookId: number, options: { page: number; limit: number; status?: string }): Promise<{ deliveries: WebhookDelivery[]; total: number }>;
  
  // Sync Conflicts
  createSyncConflict(conflict: InsertSyncConflict): Promise<SyncConflict>;
  getSyncConflict(id: number): Promise<SyncConflict | undefined>;
  updateSyncConflict(id: number, updates: Partial<InsertSyncConflict>): Promise<SyncConflict | undefined>;
  getSyncConflicts(syncJobId: number): Promise<SyncConflict[]>;
  
  // Data mappings and other integration utilities
  getDataMapping(integrationId: number): Promise<any>;
  updateDataMapping(integrationId: number, mappings: any[]): Promise<any>;
  
  // Export specific data methods
  getTransactionsForExport(companyId: number, dateRange?: any, filters?: any): Promise<any[]>;
  getInvoicesForExport(companyId: number, dateRange?: any, filters?: any): Promise<any[]>;
  getAccountsForExport(companyId: number): Promise<any[]>;
  getTaxReturnsForExport(companyId: number, dateRange?: any): Promise<any[]>;
  getFinancialStatementsForExport(companyId: number, dateRange?: any): Promise<any[]>;
  
  // Import creation methods
  createTransactionFromImport(companyId: number, rowData: any, mapping: any): Promise<Transaction>;
  createInvoiceFromImport(companyId: number, rowData: any, mapping: any): Promise<Invoice>;
  createAccountFromImport(companyId: number, rowData: any, mapping: any): Promise<any>;
  createCustomerFromImport(companyId: number, rowData: any, mapping: any): Promise<any>;
  
  // Accounting software specific export methods
  getTransactionsForQuickBooks(companyId: number, dateRange?: any): Promise<any[]>;
  getTransactionsForSage(companyId: number, dateRange?: any): Promise<any[]>;
  getTransactionsForXero(companyId: number, dateRange?: any): Promise<any[]>;
  
  // Sync configurations
  getSyncConfigs(companyId: number): Promise<any[]>;
  createSyncConfig(config: any): Promise<any>;
  updateSyncConfig(id: number, updates: any): Promise<any>;
  deleteSyncConfig(id: number): Promise<boolean>;
  getSyncConfig(id: number): Promise<any>;
  
  // Document management methods
  getDocuments(filters: { companyId: number; category?: string; search?: string; sortBy?: string; sortOrder?: string }): Promise<Document[]>;
  createDocument(insertDocument: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  archiveDocument(id: number): Promise<Document | undefined>;
  getDocumentStats(companyId: number): Promise<{
    total?: number;
    required?: number;
    expiringSoon?: number;
    storageUsed?: number;
    totalDocuments?: number;
    totalSize?: number;
    byCategory?: Record<string, number>;
    compliance?: {
      requiredDocuments: string[];
      missingDocuments: string[];
      completionRate: number;
    };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async getTransactions(companyId: number, filters?: { type?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]> {
    const conditions = [eq(transactions.companyId, companyId)];
    
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    
    const results = await db.select().from(transactions).where(and(...conditions));
    return results;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    // Automatically recalculate financials after creating transaction
    await this.recalculateFinancials(insertTransaction.companyId);
    
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction || undefined;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTaxFilings(companyId: number, type?: string): Promise<TaxFiling[]> {
    const conditions = [eq(taxFilings.companyId, companyId)];
    
    if (type) {
      conditions.push(eq(taxFilings.type, type));
    }
    
    return await db.select().from(taxFilings).where(and(...conditions));
  }

  async createTaxFiling(insertFiling: InsertTaxFiling): Promise<TaxFiling> {
    const [filing] = await db
      .insert(taxFilings)
      .values(insertFiling)
      .returning();
    return filing;
  }

  async updateTaxFiling(id: number, updates: Partial<InsertTaxFiling>): Promise<TaxFiling | undefined> {
    const [filing] = await db
      .update(taxFilings)
      .set(updates)
      .where(eq(taxFilings.id, id))
      .returning();
    return filing || undefined;
  }

  async getInvoices(companyId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.companyId, companyId));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    
    // Automatically recalculate financials after creating invoice
    await this.recalculateFinancials(insertInvoice.companyId);
    
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  // Credit Notes methods
  async getCreditNotes(companyId: number): Promise<CreditNote[]> {
    return await db.select().from(creditNotes).where(eq(creditNotes.companyId, companyId));
  }

  async getCreditNote(id: number): Promise<CreditNote | undefined> {
    const [creditNote] = await db.select().from(creditNotes).where(eq(creditNotes.id, id));
    return creditNote || undefined;
  }

  async createCreditNote(insertCreditNote: InsertCreditNote): Promise<CreditNote> {
    const [creditNote] = await db
      .insert(creditNotes)
      .values(insertCreditNote)
      .returning();
    
    // Automatically recalculate financials after creating credit note
    await this.recalculateFinancials(insertCreditNote.companyId);
    
    return creditNote;
  }

  async updateCreditNote(id: number, updates: Partial<InsertCreditNote>): Promise<CreditNote | undefined> {
    const [creditNote] = await db
      .update(creditNotes)
      .set(updates)
      .where(eq(creditNotes.id, id))
      .returning();
    return creditNote || undefined;
  }

  // Debit Notes methods
  async getDebitNotes(companyId: number): Promise<DebitNote[]> {
    return await db.select().from(debitNotes).where(eq(debitNotes.companyId, companyId));
  }

  async getDebitNote(id: number): Promise<DebitNote | undefined> {
    const [debitNote] = await db.select().from(debitNotes).where(eq(debitNotes.id, id));
    return debitNote || undefined;
  }

  async createDebitNote(insertDebitNote: InsertDebitNote): Promise<DebitNote> {
    const [debitNote] = await db
      .insert(debitNotes)
      .values(insertDebitNote)
      .returning();
    
    // Automatically recalculate financials after creating debit note
    await this.recalculateFinancials(insertDebitNote.companyId);
    
    return debitNote;
  }

  async updateDebitNote(id: number, updates: Partial<InsertDebitNote>): Promise<DebitNote | undefined> {
    const [debitNote] = await db
      .update(debitNotes)
      .set(updates)
      .where(eq(debitNotes.id, id))
      .returning();
    return debitNote || undefined;
  }

  async getNotifications(companyId: number, userId?: number): Promise<Notification[]> {
    const conditions = [eq(notifications.companyId, companyId)];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }
    
    return await db.select().from(notifications).where(and(...conditions));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateNotification(id: number, updates: Partial<InsertNotification>): Promise<Notification | undefined> {
    try {
      const [updated] = await db
        .update(notifications)
        .set(updates)
        .where(eq(notifications.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating notification:', error);
      return undefined;
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async getKpiData(companyId: number, period?: string): Promise<KpiData[]> {
    const conditions = [eq(kpiData.companyId, companyId)];
    
    if (period) {
      conditions.push(eq(kpiData.period, period));
    }
    
    return await db.select().from(kpiData).where(and(...conditions));
  }

  async createKpiData(insertData: InsertKpiData): Promise<KpiData> {
    const [data] = await db
      .insert(kpiData)
      .values(insertData)
      .returning();
    return data;
  }

  async updateKpiData(companyId: number, period: string, updates: Partial<InsertKpiData>): Promise<KpiData | undefined> {
    const [data] = await db
      .update(kpiData)
      .set(updates)
      .where(and(
        eq(kpiData.companyId, companyId),
        eq(kpiData.period, period)
      ))
      .returning();
    return data || undefined;
  }

  // Automatic Tax Calculations
  async calculateAndUpdateTaxes(companyId: number, period?: string): Promise<{ vatDue: number; citDue: number; netIncome: number }> {
    const currentPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Get all financial data for calculations
    const allTransactions = await db.select().from(transactions).where(eq(transactions.companyId, companyId));
    const allInvoices = await db.select().from(invoices).where(eq(invoices.companyId, companyId));
    const allCreditNotes = await db.select().from(creditNotes).where(eq(creditNotes.companyId, companyId));
    const allDebitNotes = await db.select().from(debitNotes).where(eq(debitNotes.companyId, companyId));
    
    // Calculate revenue from invoices and transactions
    const invoiceRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);
    const transactionRevenue = allTransactions
      .filter(t => t.type === 'REVENUE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate adjustments from credit/debit notes
    const creditAdjustments = allCreditNotes.reduce((sum, cn) => sum - parseFloat(cn.total.toString()), 0);
    const debitAdjustments = allDebitNotes.reduce((sum, dn) => sum + parseFloat(dn.total.toString()), 0);
    
    // Calculate expenses
    const expenses = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    // Calculate totals
    const totalRevenue = invoiceRevenue + transactionRevenue + creditAdjustments + debitAdjustments;
    const netIncome = totalRevenue - expenses;
    
    // Calculate VAT (5% UAE rate)
    const outputVAT = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.vatAmount.toString()), 0) +
                     allTransactions.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + parseFloat(t.vatAmount?.toString() || '0'), 0) +
                     allDebitNotes.reduce((sum, dn) => sum + parseFloat(dn.vatAmount.toString()), 0);
    
    const inputVAT = allTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.vatAmount?.toString() || '0'), 0) +
                    allCreditNotes.reduce((sum, cn) => sum + parseFloat(cn.vatAmount.toString()), 0);
    
    const vatDue = Math.max(0, outputVAT - inputVAT);
    
    // Calculate CIT (UAE Corporate Income Tax)
    // Small Business Relief: 0% on first AED 375,000
    // Standard rate: 9% on excess
    let citDue = 0;
    if (netIncome > 375000) {
      citDue = (netIncome - 375000) * 0.09;
    }
    
    // Update or create KPI data
    const existingKpi = await db.select().from(kpiData).where(and(
      eq(kpiData.companyId, companyId),
      eq(kpiData.period, currentPeriod)
    ));
    
    const kpiValues = {
      companyId,
      period: currentPeriod,
      revenue: totalRevenue.toString(),
      expenses: expenses.toString(),
      netIncome: netIncome.toString(),
      vatDue: vatDue.toString(),
      citDue: citDue.toString()
    };
    
    if (existingKpi.length > 0) {
      await db.update(kpiData)
        .set(kpiValues)
        .where(and(
          eq(kpiData.companyId, companyId),
          eq(kpiData.period, currentPeriod)
        ));
    } else {
      await db.insert(kpiData).values(kpiValues);
    }
    
    return { vatDue, citDue, netIncome };
  }

  async recalculateFinancials(companyId: number): Promise<void> {
    // Recalculate for current period
    await this.calculateAndUpdateTaxes(companyId);
    
    // Also recalculate for the last 12 months to ensure historical accuracy
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7);
      await this.calculateAndUpdateTaxes(companyId, period);
    }
  }

  // Document Management Methods
  async getDocuments(filters: { companyId: number; category?: string; search?: string; sortBy?: string; sortOrder?: string }): Promise<Document[]> {
    const { desc, asc, like, ilike, and } = await import("drizzle-orm");
    
    const conditions = [eq(documentsTable.companyId, filters.companyId)];
    
    if (filters.category) {
      conditions.push(eq(documentsTable.category, filters.category));
    }
    
    if (filters.search) {
      conditions.push(ilike(documentsTable.name, `%${filters.search}%`));
    }
    
    let query = db.select().from(documentsTable).where(and(...conditions));
    
    // Sort by specified field and order
    const sortField = filters.sortBy || 'uploadedAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    if (sortOrder === 'desc') {
      query = query.orderBy(desc(documentsTable.uploadedAt));
    } else {
      query = query.orderBy(asc(documentsTable.uploadedAt));
    }
    
    return await query;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    return document || undefined;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documentsTable)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documentsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documentsTable.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .update(documentsTable)
      .set({ status: 'DELETED', updatedAt: new Date() })
      .where(eq(documentsTable.id, id));
    return (result.rowCount || 0) > 0;
  }

  async archiveDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .update(documentsTable)
      .set({ status: 'ARCHIVED', updatedAt: new Date() })
      .where(eq(documentsTable.id, id))
      .returning();
    return document || undefined;
  }

  async getDocumentStats(companyId: number): Promise<{
    totalDocuments: number;
    totalSize: number;
    byCategory: Record<string, number>;
    compliance: {
      requiredDocuments: string[];
      missingDocuments: string[];
      completionRate: number;
    };
  }> {
    const { sql, count, sum } = await import("drizzle-orm");
    
    // Get all active documents for the company
    const documents = await db.select().from(documentsTable)
      .where(and(
        eq(documentsTable.companyId, companyId),
        eq(documentsTable.status, 'ACTIVE')
      ));
    
    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    
    // Group by category
    const byCategory: Record<string, number> = {};
    documents.forEach(doc => {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    });
    
    // Compliance tracking
    const requiredDocuments = [
      'TRN_CERTIFICATE',
      'TRADE_LICENSE',
      'MOA_AOA',
      'AUDIT_REPORT'
    ];
    
    const presentCategories = Object.keys(byCategory);
    const missingDocuments = requiredDocuments.filter(req => !presentCategories.includes(req));
    const completionRate = ((requiredDocuments.length - missingDocuments.length) / requiredDocuments.length) * 100;
    
    return {
      totalDocuments,
      totalSize,
      byCategory,
      compliance: {
        requiredDocuments,
        missingDocuments,
        completionRate: Math.round(completionRate)
      }
    };
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private companies: Map<number, Company> = new Map();
  private transactions: Map<number, Transaction> = new Map();
  private taxFilings: Map<number, TaxFiling> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private notifications: Map<number, Notification> = new Map();
  private kpiData: Map<number, KpiData> = new Map();
  private documents: Map<number, Document> = new Map();
  
  private currentId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default company
    const company: Company = {
      id: 1,
      name: "ABC Trading LLC",
      trn: "100123456700003",
      address: "Dubai, UAE",
      phone: "+971-4-1234567",
      email: "info@abctrading.ae",
      industry: "Trading",
      freeZone: false,
      vatRegistered: true,
      logoUrl: "",
      primaryColor: "#1976d2",
      language: "en",
      createdAt: new Date(),
    };
    this.companies.set(1, company);

    // Create default admin user
    const user: User = {
      id: 1,
      username: "admin",
      email: "admin@abctrading.ae",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "ADMIN",
      isActive: true,
      companyId: 1,
      createdAt: new Date(),
    };
    this.users.set(1, user);

    // Create sample transactions
    const transactions: Transaction[] = [
      {
        id: 1,
        companyId: 1,
        type: "REVENUE",
        category: "Sales",
        description: "Client Payment - ABC Corp",
        amount: "15750.00",
        vatAmount: "750.00",
        transactionDate: new Date("2024-03-15"),
        attachments: [],
        status: "PROCESSED",
        createdBy: 1,
        createdAt: new Date("2024-03-15"),
      },
      {
        id: 2,
        companyId: 1,
        type: "EXPENSE",
        category: "Office Supplies",
        description: "Office Supplies - Staples",
        amount: "450.00",
        vatAmount: "21.43",
        transactionDate: new Date("2024-03-14"),
        attachments: [],
        status: "PROCESSED",
        createdBy: 1,
        createdAt: new Date("2024-03-14"),
      },
    ];
    
    transactions.forEach(t => this.transactions.set(t.id, t));

    // Create sample KPI data
    const kpi: KpiData = {
      id: 1,
      companyId: 1,
      period: "2024-03",
      revenue: "285340.00",
      expenses: "125450.00",
      netIncome: "159890.00",
      vatDue: "12450.00",
      citDue: "0.00",
      calculatedAt: new Date(),
    };
    this.kpiData.set(1, kpi);

    // Create sample notifications
    const notification: Notification = {
      id: 1,
      companyId: 1,
      userId: 1,
      type: "DEADLINE_REMINDER",
      title: "VAT Filing Reminder",
      message: "Your VAT return is due in 12 days. Start preparing now to avoid penalties.",
      priority: "HIGH",
      isRead: false,
      scheduledFor: new Date(),
      createdAt: new Date(),
    };
    this.notifications.set(1, notification);

    this.currentId = 10;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: insertUser.role || 'SME_CLIENT',
      isActive: insertUser.isActive ?? true,
      companyId: insertUser.companyId ?? null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentId++;
    const company: Company = { 
      id, 
      name: insertCompany.name,
      address: insertCompany.address ?? null,
      trn: insertCompany.trn ?? null,
      email: insertCompany.email ?? null,
      phone: insertCompany.phone ?? null,
      industry: insertCompany.industry ?? null,
      freeZone: insertCompany.freeZone ?? null,
      vatRegistered: insertCompany.vatRegistered ?? null,
      logoUrl: insertCompany.logoUrl ?? null,
      primaryColor: insertCompany.primaryColor ?? null,
      language: insertCompany.language ?? null,
      createdAt: new Date() 
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updated = { ...company, ...updates };
    this.companies.set(id, updated);
    return updated;
  }

  // Transaction methods
  async getTransactions(companyId: number, filters?: { type?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(t => t.companyId === companyId);
    
    if (filters?.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    
    if (filters?.startDate) {
      transactions = transactions.filter(t => new Date(t.transactionDate) >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      transactions = transactions.filter(t => new Date(t.transactionDate) <= filters.endDate!);
    }
    
    return transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      status: insertTransaction.status ?? 'PROCESSED',
      vatAmount: insertTransaction.vatAmount ?? null,
      attachments: insertTransaction.attachments ?? null,
      createdAt: new Date() 
    } as Transaction;
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Tax filing methods
  async getTaxFilings(companyId: number, type?: string): Promise<TaxFiling[]> {
    let filings = Array.from(this.taxFilings.values()).filter(f => f.companyId === companyId);
    
    if (type) {
      filings = filings.filter(f => f.type === type);
    }
    
    return filings.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTaxFiling(insertFiling: InsertTaxFiling): Promise<TaxFiling> {
    const id = this.currentId++;
    const filing: TaxFiling = { 
      ...insertFiling, 
      id, 
      status: insertFiling.status ?? 'DRAFT',
      calculations: insertFiling.calculations ?? {},
      totalTax: insertFiling.totalTax ?? null,
      submittedAt: insertFiling.submittedAt ?? null,
      submittedBy: insertFiling.submittedBy ?? null,
      ftaReference: insertFiling.ftaReference ?? null,
      createdAt: new Date() 
    } as TaxFiling;
    this.taxFilings.set(id, filing);
    return filing;
  }

  async updateTaxFiling(id: number, updates: Partial<InsertTaxFiling>): Promise<TaxFiling | undefined> {
    const filing = this.taxFilings.get(id);
    if (!filing) return undefined;
    
    const updated = { ...filing, ...updates };
    this.taxFilings.set(id, updated);
    return updated;
  }

  // Invoice methods
  async getInvoices(companyId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(i => i.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentId++;
    const invoice: Invoice = { 
      ...insertInvoice, 
      id, 
      status: insertInvoice.status ?? 'DRAFT',
      clientEmail: insertInvoice.clientEmail ?? null,
      clientAddress: insertInvoice.clientAddress ?? null,
      xmlGenerated: insertInvoice.xmlGenerated ?? false,
      qrCode: insertInvoice.qrCode ?? null,
      createdAt: new Date() 
    } as Invoice;
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updated = { ...invoice, ...updates };
    this.invoices.set(id, updated);
    return updated;
  }

  // Notification methods
  async getNotifications(companyId: number, userId?: number): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values()).filter(n => n.companyId === companyId);
    
    if (userId) {
      notifications = notifications.filter(n => !n.userId || n.userId === userId);
    }
    
    return notifications.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      userId: insertNotification.userId ?? null,
      priority: insertNotification.priority ?? 'MEDIUM',
      isRead: insertNotification.isRead ?? false,
      scheduledFor: insertNotification.scheduledFor ?? null,
      createdAt: new Date() 
    } as Notification;
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    return true;
  }

  // KPI methods
  async getKpiData(companyId: number, period?: string): Promise<KpiData[]> {
    let data = Array.from(this.kpiData.values()).filter(k => k.companyId === companyId);
    
    if (period) {
      data = data.filter(k => k.period === period);
    }
    
    return data.sort((a, b) => b.period.localeCompare(a.period));
  }

  async createKpiData(insertData: InsertKpiData): Promise<KpiData> {
    const id = this.currentId++;
    const data: KpiData = { 
      ...insertData, 
      id, 
      revenue: insertData.revenue ?? null,
      expenses: insertData.expenses ?? null,
      netIncome: insertData.netIncome ?? null,
      vatDue: insertData.vatDue ?? null,
      citDue: insertData.citDue ?? null,
      calculatedAt: new Date() 
    } as KpiData;
    this.kpiData.set(id, data);
    return data;
  }

  async updateKpiData(companyId: number, period: string, updates: Partial<InsertKpiData>): Promise<KpiData | undefined> {
    const existing = Array.from(this.kpiData.values()).find(k => k.companyId === companyId && k.period === period);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.kpiData.set(existing.id, updated);
    return updated;
  }
  // Integration Management
  async getIntegrations(companyId: number): Promise<Integration[]> {
    const results = await db.select().from(integrations).where(eq(integrations.companyId, companyId));
    return results;
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [result] = await db.insert(integrations).values(integration).returning();
    return result;
  }

  async updateIntegration(id: number, updates: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [result] = await db.update(integrations).set(updates).where(eq(integrations.id, id)).returning();
    return result;
  }

  // Sync Jobs
  async createSyncJob(job: InsertSyncJob): Promise<SyncJob> {
    const [result] = await db.insert(syncJobs).values(job).returning();
    return result;
  }

  async getSyncJob(id: number): Promise<SyncJob | undefined> {
    const [job] = await db.select().from(syncJobs).where(eq(syncJobs.id, id));
    return job;
  }

  async updateSyncJob(id: number, updates: Partial<InsertSyncJob>): Promise<SyncJob | undefined> {
    const [result] = await db.update(syncJobs).set(updates).where(eq(syncJobs.id, id)).returning();
    return result;
  }

  async getSyncHistory(companyId: number, options: { page: number; limit: number; integrationId?: number; status?: string; startDate?: Date; endDate?: Date }): Promise<{ jobs: SyncJob[]; total: number }> {
    const jobs = await db.select().from(syncJobs).limit(options.limit).offset((options.page - 1) * options.limit);
    return { jobs, total: jobs.length };
  }

  async getSyncStats(companyId: number, period: string): Promise<any> {
    return {
      totalSyncs: 25,
      successfulSyncs: 22,
      failedSyncs: 3,
      totalRecordsProcessed: 1250,
      totalConflicts: 8,
      avgSyncDuration: 45000,
      syncsByDataType: { TRANSACTIONS: 15, INVOICES: 8, CUSTOMERS: 2 },
      syncsByIntegration: { 'QuickBooks': 12, 'Xero': 8, 'Sage': 5 },
      recentActivity: []
    };
  }

  // Data Export/Import
  async createExportJob(job: InsertExportJob): Promise<ExportJob> {
    const [result] = await db.insert(exportJobs).values(job).returning();
    return result;
  }

  async updateExportJob(id: number, updates: Partial<InsertExportJob>): Promise<ExportJob | undefined> {
    const [result] = await db.update(exportJobs).set(updates).where(eq(exportJobs.id, id)).returning();
    return result;
  }

  async getExportHistory(companyId: number, options: { page: number; limit: number }): Promise<{ jobs: ExportJob[]; total: number }> {
    const jobs = await db.select().from(exportJobs).where(eq(exportJobs.companyId, companyId)).limit(options.limit).offset((options.page - 1) * options.limit);
    return { jobs, total: jobs.length };
  }

  async createImportJob(job: InsertImportJob): Promise<ImportJob> {
    const [result] = await db.insert(importJobs).values(job).returning();
    return result;
  }

  async getImportJob(id: number): Promise<ImportJob | undefined> {
    const [job] = await db.select().from(importJobs).where(eq(importJobs.id, id));
    return job;
  }

  async updateImportJob(id: number, updates: Partial<InsertImportJob>): Promise<ImportJob | undefined> {
    const [result] = await db.update(importJobs).set(updates).where(eq(importJobs.id, id)).returning();
    return result;
  }

  async getImportHistory(companyId: number, options: { page: number; limit: number }): Promise<{ jobs: ImportJob[]; total: number }> {
    const jobs = await db.select().from(importJobs).where(eq(importJobs.companyId, companyId)).limit(options.limit).offset((options.page - 1) * options.limit);
    return { jobs, total: jobs.length };
  }

  // Webhooks
  async getWebhooks(companyId: number): Promise<Webhook[]> {
    const results = await db.select().from(webhooks).where(eq(webhooks.companyId, companyId));
    return results;
  }

  async getWebhook(id: number): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return webhook;
  }

  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [result] = await db.insert(webhooks).values(webhook).returning();
    return result;
  }

  async updateWebhook(id: number, updates: Partial<InsertWebhook>): Promise<Webhook | undefined> {
    const [result] = await db.update(webhooks).set(updates).where(eq(webhooks.id, id)).returning();
    return result;
  }

  async deleteWebhook(id: number): Promise<boolean> {
    try {
      const result = await db.delete(webhooks).where(eq(webhooks.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting webhook:", error);
      return false;
    }
  }

  async getWebhooksByEvent(companyId: number, event: string): Promise<Webhook[]> {
    const results = await db.select().from(webhooks).where(and(eq(webhooks.companyId, companyId), eq(webhooks.isActive, true)));
    return results.filter(w => w.events.includes(event));
  }

  // Webhook Deliveries
  async createWebhookDelivery(delivery: InsertWebhookDelivery): Promise<WebhookDelivery> {
    const [result] = await db.insert(webhookDeliveries).values(delivery).returning();
    return result;
  }

  async getWebhookDelivery(id: number): Promise<WebhookDelivery | undefined> {
    const [delivery] = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.id, id));
    return delivery;
  }

  async updateWebhookDelivery(id: number, updates: Partial<InsertWebhookDelivery>): Promise<WebhookDelivery | undefined> {
    const [result] = await db.update(webhookDeliveries).set(updates).where(eq(webhookDeliveries.id, id)).returning();
    return result;
  }

  async getWebhookDeliveries(webhookId: number, options: { page: number; limit: number; status?: string }): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
    let query = db.select().from(webhookDeliveries).where(eq(webhookDeliveries.webhookId, webhookId));
    if (options.status) {
      query = query.where(eq(webhookDeliveries.status, options.status));
    }
    const deliveries = await query.limit(options.limit).offset((options.page - 1) * options.limit);
    return { deliveries, total: deliveries.length };
  }

  // Sync Conflicts
  async createSyncConflict(conflict: InsertSyncConflict): Promise<SyncConflict> {
    const [result] = await db.insert(syncConflicts).values(conflict).returning();
    return result;
  }

  async getSyncConflict(id: number): Promise<SyncConflict | undefined> {
    const [conflict] = await db.select().from(syncConflicts).where(eq(syncConflicts.id, id));
    return conflict;
  }

  async updateSyncConflict(id: number, updates: Partial<InsertSyncConflict>): Promise<SyncConflict | undefined> {
    const [result] = await db.update(syncConflicts).set(updates).where(eq(syncConflicts.id, id)).returning();
    return result;
  }

  async getSyncConflicts(syncJobId: number): Promise<SyncConflict[]> {
    const results = await db.select().from(syncConflicts).where(eq(syncConflicts.syncJobId, syncJobId));
    return results;
  }

  // Data mappings and integration utilities
  async getDataMapping(integrationId: number): Promise<any> {
    return [
      { sourceField: 'amount', targetField: 'amount', transformation: 'NONE' },
      { sourceField: 'description', targetField: 'description', transformation: 'NONE' },
      { sourceField: 'date', targetField: 'transactionDate', transformation: 'DATE_FORMAT' }
    ];
  }

  async updateDataMapping(integrationId: number, mappings: any[]): Promise<any> {
    return { success: true, mappings };
  }

  // Export-specific data methods
  async getTransactionsForExport(companyId: number, dateRange?: any, filters?: any): Promise<any[]> {
    const results = await db.select().from(transactions).where(eq(transactions.companyId, companyId)).limit(1000);
    return results.map(t => ({
      date: t.transactionDate,
      account: t.category,
      amount: t.amount,
      description: t.description,
      reference: `TXN-${t.id}`,
      vatAmount: t.vatAmount
    }));
  }

  async getInvoicesForExport(companyId: number, dateRange?: any, filters?: any): Promise<any[]> {
    const results = await db.select().from(invoices).where(eq(invoices.companyId, companyId)).limit(1000);
    return results.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.clientName,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalAmount: inv.total,
      vatAmount: inv.vatAmount,
      status: inv.status
    }));
  }

  async getAccountsForExport(companyId: number): Promise<any[]> {
    return [
      { accountCode: '1001', accountName: 'Cash', accountType: 'ASSET' },
      { accountCode: '2001', accountName: 'Accounts Payable', accountType: 'LIABILITY' },
      { accountCode: '3001', accountName: 'Share Capital', accountType: 'EQUITY' },
      { accountCode: '4001', accountName: 'Sales Revenue', accountType: 'REVENUE' },
      { accountCode: '5001', accountName: 'Office Expenses', accountType: 'EXPENSE' }
    ];
  }

  async getTaxReturnsForExport(companyId: number, dateRange?: any): Promise<any[]> {
    const results = await db.select().from(taxFilings).where(eq(taxFilings.companyId, companyId)).limit(100);
    return results.map(filing => ({
      period: filing.period,
      type: filing.type,
      status: filing.status,
      totalTax: filing.totalTax,
      dueDate: filing.dueDate,
      submittedAt: filing.submittedAt
    }));
  }

  async getFinancialStatementsForExport(companyId: number, dateRange?: any): Promise<any[]> {
    const kpi = await db.select().from(kpiData).where(eq(kpiData.companyId, companyId)).limit(12);
    return kpi.map(data => ({
      period: data.period,
      revenue: data.revenue,
      expenses: data.expenses,
      netIncome: data.netIncome,
      vatDue: data.vatDue,
      citDue: data.citDue
    }));
  }

  // Import creation methods
  async createTransactionFromImport(companyId: number, rowData: any, mapping: any): Promise<Transaction> {
    const transaction: InsertTransaction = {
      companyId,
      type: rowData.amount > 0 ? 'REVENUE' : 'EXPENSE',
      category: rowData.category || 'General',
      description: rowData.description || 'Imported transaction',
      amount: Math.abs(parseFloat(rowData.amount)).toString(),
      vatAmount: rowData.vatAmount ? parseFloat(rowData.vatAmount).toString() : "0",
      transactionDate: new Date(rowData.date),
      attachments: [],
      status: 'PROCESSED',
      createdBy: 1
    };
    return this.createTransaction(transaction);
  }

  async createInvoiceFromImport(companyId: number, rowData: any, mapping: any): Promise<Invoice> {
    const invoice: InsertInvoice = {
      companyId,
      invoiceNumber: rowData.invoiceNumber,
      clientName: rowData.customerName,
      clientEmail: rowData.customerEmail || '',
      clientAddress: rowData.customerAddress || '',
      issueDate: new Date(rowData.issueDate),
      dueDate: new Date(rowData.dueDate || rowData.issueDate),
      items: [{ description: 'Imported item', quantity: 1, price: rowData.totalAmount }],
      subtotal: (parseFloat(rowData.totalAmount) - parseFloat(rowData.vatAmount || 0)).toString(),
      vatAmount: (rowData.vatAmount || 0).toString(),
      total: rowData.totalAmount.toString(),
      status: rowData.status || 'DRAFT',
      xmlGenerated: false,
      createdBy: 1
    };
    return this.createInvoice(invoice);
  }

  async createAccountFromImport(companyId: number, rowData: any, mapping: any): Promise<any> {
    return {
      id: Math.floor(Math.random() * 10000),
      code: rowData.accountCode,
      name: rowData.accountName,
      type: rowData.accountType,
      companyId
    };
  }

  async createCustomerFromImport(companyId: number, rowData: any, mapping: any): Promise<any> {
    return {
      id: Math.floor(Math.random() * 10000),
      name: rowData.name,
      email: rowData.email,
      phone: rowData.phone,
      address: rowData.address,
      companyId
    };
  }

  // Accounting software specific export methods
  async getTransactionsForQuickBooks(companyId: number, dateRange?: any): Promise<any[]> {
    const transactions = await this.getTransactionsForExport(companyId, dateRange);
    return transactions.map(t => ({
      type: 'GENERAL JOURNAL',
      date: t.date,
      reference: t.reference,
      account: t.account,
      name: 'Import',
      amount: t.amount,
      description: t.description
    }));
  }

  async getTransactionsForSage(companyId: number, dateRange?: any): Promise<any[]> {
    const transactions = await this.getTransactionsForExport(companyId, dateRange);
    return transactions.map(t => ({
      type: 'JC',
      accountRef: 'IMPORT',
      nominalAccount: '4000',
      date: t.date,
      reference: t.reference,
      details: t.description,
      netAmount: t.amount,
      taxCode: 'T1',
      taxAmount: t.vatAmount,
      grossAmount: (parseFloat(t.amount) + parseFloat(t.vatAmount || '0')).toFixed(2)
    }));
  }

  async getTransactionsForXero(companyId: number, dateRange?: any): Promise<any[]> {
    const transactions = await this.getTransactionsForExport(companyId, dateRange);
    return transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      payee: 'Import',
      description: t.description,
      reference: t.reference
    }));
  }

  // Sync configurations
  async getSyncConfigs(companyId: number): Promise<any[]> {
    return [];
  }

  async createSyncConfig(config: any): Promise<any> {
    return { id: Math.floor(Math.random() * 10000), ...config };
  }

  async updateSyncConfig(id: number, updates: any): Promise<any> {
    return { id, ...updates };
  }

  async deleteSyncConfig(id: number): Promise<boolean> {
    return true;
  }

  async getSyncConfig(id: number): Promise<any> {
    return { id, companyId: 1, integrationId: 1 };
  }

  // Document Management Methods for MemStorage
  async getDocuments(filters: { companyId: number; category?: string; search?: string; sortBy?: string; sortOrder?: string }): Promise<Document[]> {
    const companyDocs = Array.from(this.documents.values()).filter(doc => 
      doc.companyId === filters.companyId && doc.status === 'ACTIVE'
    );
    
    let filtered = companyDocs;
    
    if (filters.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        doc.originalName.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort documents
    const sortBy = filters.sortBy || 'uploadedAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Document] as any;
      const bVal = b[sortBy as keyof Document] as any;
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const newDocument: Document = {
      id,
      ...document,
      status: 'ACTIVE',
      uploadedAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const updated = { ...doc, ...updates, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;
    
    doc.status = 'DELETED';
    doc.updatedAt = new Date();
    this.documents.set(id, doc);
    return true;
  }

  async archiveDocument(id: number): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    doc.status = 'ARCHIVED';
    doc.updatedAt = new Date();
    this.documents.set(id, doc);
    return doc;
  }

  async getDocumentStats(companyId: number): Promise<{
    total?: number;
    required?: number;
    expiringSoon?: number;
    storageUsed?: number;
    totalDocuments?: number;
    totalSize?: number;
    byCategory?: Record<string, number>;
    compliance?: {
      requiredDocuments: string[];
      missingDocuments: string[];
      completionRate: number;
    };
  }> {
    const companyDocs = Array.from(this.documents.values()).filter(doc => 
      doc.companyId === companyId && doc.status === 'ACTIVE'
    );
    
    const totalDocuments = companyDocs.length;
    const totalSize = companyDocs.reduce((sum, doc) => sum + doc.size, 0);
    
    // Group by category
    const byCategory: Record<string, number> = {};
    companyDocs.forEach(doc => {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    });
    
    // Check for expiring documents
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expiringSoon = companyDocs.filter(doc => 
      doc.expiryDate && new Date(doc.expiryDate) <= thirtyDaysFromNow
    ).length;
    
    // Compliance tracking
    const requiredDocuments = ['TRN_CERTIFICATE', 'LICENSES_PERMITS'];
    const presentCategories = Object.keys(byCategory);
    const missingDocuments = requiredDocuments.filter(req => !presentCategories.includes(req));
    const completionRate = ((requiredDocuments.length - missingDocuments.length) / requiredDocuments.length) * 100;
    
    return {
      total: totalDocuments,
      required: requiredDocuments.filter(req => presentCategories.includes(req)).length,
      expiringSoon,
      storageUsed: totalSize,
      totalDocuments,
      totalSize,
      byCategory,
      compliance: {
        requiredDocuments,
        missingDocuments,
        completionRate: Math.round(completionRate)
      }
    };
  }

  // Add stub methods for other missing interface methods
  async getCreditNotes(): Promise<CreditNote[]> { return []; }
  async getCreditNote(): Promise<CreditNote | undefined> { return undefined; }
  async createCreditNote(): Promise<CreditNote> { return {} as CreditNote; }
  async updateCreditNote(): Promise<CreditNote | undefined> { return undefined; }
  
  async getDebitNotes(): Promise<any[]> { return []; }
  async getDebitNote(): Promise<any> { return undefined; }
  async createDebitNote(): Promise<any> { return {}; }
  async updateDebitNote(): Promise<any> { return undefined; }
  
  async getIntegrations(): Promise<any[]> { return []; }
  async getIntegration(): Promise<any> { return undefined; }
  async createIntegration(): Promise<any> { return { id: 1 }; }
  async updateIntegration(): Promise<any> { return { id: 1 }; }
  
  async createSyncJob(): Promise<any> { return { id: 1 }; }
  async getSyncJob(): Promise<any> { return undefined; }
  async updateSyncJob(): Promise<any> { return { id: 1 }; }
  async getSyncHistory(): Promise<any> { return { jobs: [], total: 0 }; }
  async getSyncStats(): Promise<any> { return {}; }
  
  async createExportJob(): Promise<any> { return { id: 1 }; }
  async updateExportJob(): Promise<any> { return { id: 1 }; }
  async getExportHistory(): Promise<any> { return { jobs: [], total: 0 }; }
  
  async createImportJob(): Promise<any> { return { id: 1 }; }
  async getImportJob(): Promise<any> { return undefined; }
  async updateImportJob(): Promise<any> { return { id: 1 }; }
  async getImportHistory(): Promise<any> { return { jobs: [], total: 0 }; }
  
  async getWebhooks(): Promise<any[]> { return []; }
  async getWebhook(): Promise<any> { return undefined; }
  async createWebhook(): Promise<any> { return { id: 1 }; }
  async updateWebhook(): Promise<any> { return { id: 1 }; }
  async deleteWebhook(): Promise<boolean> { return true; }
  async getWebhooksByEvent(): Promise<any[]> { return []; }
  
  async createWebhookDelivery(): Promise<any> { return { id: 1 }; }
  async getWebhookDelivery(): Promise<any> { return undefined; }
  async updateWebhookDelivery(): Promise<any> { return { id: 1 }; }
  async getWebhookDeliveries(): Promise<any> { return { deliveries: [], total: 0 }; }
  
  async createSyncConflict(): Promise<any> { return { id: 1 }; }
  async getSyncConflict(): Promise<any> { return undefined; }
  async updateSyncConflict(): Promise<any> { return { id: 1 }; }
  async getSyncConflicts(): Promise<any[]> { return []; }
  
  async getDataMapping(): Promise<any> { return []; }
  async updateDataMapping(): Promise<any> { return { success: true }; }
}

export const storage = new DatabaseStorage();
