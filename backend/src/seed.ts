import { db } from "./db";
import { users, companies, transactions, kpiData, notifications } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Create company
    const [company] = await db.insert(companies).values({
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
      language: "en"
    }).returning();

    // Create admin user
    const [user] = await db.insert(users).values({
      username: "admin",
      email: "admin@abctrading.ae",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "ADMIN",
      isActive: true,
      companyId: company.id
    }).returning();

    // Create sample transactions
    await db.insert(transactions).values([
      {
        companyId: company.id,
        type: "REVENUE",
        category: "Sales",
        description: "Product Sales - December",
        amount: "150000",
        transactionDate: new Date("2024-12-15"),
        status: "PROCESSED",
        createdBy: user.id
      },
      {
        companyId: company.id,
        type: "EXPENSE",
        category: "Office Rent",
        description: "Office Rent Payment",
        amount: "25000",
        transactionDate: new Date("2024-12-01"),
        status: "PROCESSED",
        createdBy: user.id
      },
      {
        companyId: company.id,
        type: "EXPENSE",
        category: "Utilities",
        description: "Electricity Bill",
        amount: "2500",
        transactionDate: new Date("2024-12-05"),
        status: "PROCESSED",
        createdBy: user.id
      }
    ]);

    // Create KPI data
    await db.insert(kpiData).values({
      companyId: company.id,
      period: "2024-12",
      revenue: 150000,
      expenses: 27500,
      netIncome: 122500,
      vatDue: 7500,
      citDue: 0
    });

    // Create notification
    await db.insert(notifications).values({
      companyId: company.id,
      type: "TAX_DEADLINE",
      title: "VAT Return Due",
      message: "Your VAT return for December 2024 is due on January 28, 2025",
      priority: "HIGH",
      isRead: false
    });

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}