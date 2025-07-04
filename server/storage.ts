import { 
  users, companies, transactions, taxFilings, invoices, notifications, kpiData,
  type User, type InsertUser, type Company, type InsertCompany,
  type Transaction, type InsertTransaction, type TaxFiling, type InsertTaxFiling,
  type Invoice, type InsertInvoice, type Notification, type InsertNotification,
  type KpiData, type InsertKpiData
} from "@shared/schema";

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
  
  // Notifications
  getNotifications(companyId: number, userId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // KPI Data
  getKpiData(companyId: number, period?: string): Promise<KpiData[]>;
  createKpiData(data: InsertKpiData): Promise<KpiData>;
  updateKpiData(companyId: number, period: string, updates: Partial<InsertKpiData>): Promise<KpiData | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private companies: Map<number, Company> = new Map();
  private transactions: Map<number, Transaction> = new Map();
  private taxFilings: Map<number, TaxFiling> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private notifications: Map<number, Notification> = new Map();
  private kpiData: Map<number, KpiData> = new Map();
  
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
}

export const storage = new MemStorage();
