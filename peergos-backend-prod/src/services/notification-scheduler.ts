import * as cron from 'node-cron';
import { db } from '../db';
import { notifications, companies, taxFilings, invoices } from '../db/schema';
import { eq, and, lt, gte, isNull } from 'drizzle-orm';

class NotificationScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isStarted = false;

  start() {
    if (this.isStarted) {
      console.log('[Scheduler] Already started');
      return;
    }

    console.log('[Scheduler] Starting notification scheduler...');

    // Main compliance check job - runs every 30 seconds for development
    const complianceJob = cron.schedule('*/30 * * * * *', async () => {
      try {
        await this.runComplianceChecks();
      } catch (error) {
        console.error('[Scheduler] Error in compliance checks:', error);
      }
    });

    this.jobs.set('compliance', complianceJob);

    // VAT filing deadline reminders - Daily at 9 AM
    const vatRemindersJob = cron.schedule('0 9 * * *', async () => {
      try {
        await this.checkVATDeadlines();
      } catch (error) {
        console.error('[Scheduler] Error in VAT deadline checks:', error);
      }
    });

    this.jobs.set('vat-reminders', vatRemindersJob);

    // CIT filing deadline reminders - Daily at 9 AM
    const citRemindersJob = cron.schedule('0 9 * * *', async () => {
      try {
        await this.checkCITDeadlines();
      } catch (error) {
        console.error('[Scheduler] Error in CIT deadline checks:', error);
      }
    });

    this.jobs.set('cit-reminders', citRemindersJob);

    // Invoice overdue reminders - Daily at 10 AM
    const invoiceRemindersJob = cron.schedule('0 10 * * *', async () => {
      try {
        await this.checkOverdueInvoices();
      } catch (error) {
        console.error('[Scheduler] Error in invoice checks:', error);
      }
    });

    this.jobs.set('invoice-reminders', invoiceRemindersJob);

    // Weekly compliance summary - Mondays at 8 AM
    const weeklySummaryJob = cron.schedule('0 8 * * 1', async () => {
      try {
        await this.generateWeeklyComplianceSummary();
      } catch (error) {
        console.error('[Scheduler] Error in weekly summary:', error);
      }
    });

    this.jobs.set('weekly-summary', weeklySummaryJob);

    // Monthly tax calculation reminders - 25th of each month at 9 AM
    const monthlyTaxJob = cron.schedule('0 9 25 * *', async () => {
      try {
        await this.monthlyTaxCalculationReminders();
      } catch (error) {
        console.error('[Scheduler] Error in monthly tax reminders:', error);
      }
    });

    this.jobs.set('monthly-tax', monthlyTaxJob);

    this.isStarted = true;
    console.log('[Scheduler] Started with expression: */30 * * * * *');
  }

  stop() {
    if (!this.isStarted) {
      console.log('[Scheduler] Not started');
      return;
    }

    console.log('[Scheduler] Stopping notification scheduler...');
    
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`[Scheduler] Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isStarted = false;
    console.log('[Scheduler] Stopped');
  }

  private async runComplianceChecks() {
    console.log('[Scheduler] Running compliance check at', new Date().toISOString());
    
    try {
      // Get all active companies
      const activeCompanies = await db.select().from(companies);
      
      console.log(`[Scheduler] Processed ${activeCompanies.length} companies`);

      for (const company of activeCompanies) {
        await this.checkCompanyCompliance(company);
      }
    } catch (error) {
      console.error('[Scheduler] Error in compliance checks:', error);
    }
  }

  private async checkCompanyCompliance(company: any) {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      // Check for upcoming VAT filing deadlines
      const vatFilings = await db.select()
        .from(taxFilings)
        .where(
          and(
            eq(taxFilings.companyId, company.id),
            eq(taxFilings.type, 'VAT'),
            eq(taxFilings.status, 'DRAFT'),
            lt(taxFilings.dueDate, thirtyDaysFromNow),
            gte(taxFilings.dueDate, today)
          )
        );

      for (const filing of vatFilings) {
        const daysUntilDue = Math.ceil((new Date(filing.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7) {
          await this.createNotification({
            companyId: company.id,
            type: 'TAX_FILING_DUE',
            title: 'VAT Filing Due Soon',
            message: `VAT return for ${filing.period} is due in ${daysUntilDue} days`,
            priority: daysUntilDue <= 3 ? 'HIGH' : 'MEDIUM',
            scheduledFor: today
          });
        }
      }

      // Check for upcoming CIT filing deadlines
      const citFilings = await db.select()
        .from(taxFilings)
        .where(
          and(
            eq(taxFilings.companyId, company.id),
            eq(taxFilings.type, 'CIT'),
            eq(taxFilings.status, 'DRAFT'),
            lt(taxFilings.dueDate, thirtyDaysFromNow),
            gte(taxFilings.dueDate, today)
          )
        );

      for (const filing of citFilings) {
        const daysUntilDue = Math.ceil((new Date(filing.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 30) {
          await this.createNotification({
            companyId: company.id,
            type: 'TAX_FILING_DUE',
            title: 'CIT Filing Due Soon',
            message: `Corporate Income Tax return for ${filing.period} is due in ${daysUntilDue} days`,
            priority: daysUntilDue <= 7 ? 'HIGH' : 'MEDIUM',
            scheduledFor: today
          });
        }
      }

    } catch (error) {
      console.error(`[Scheduler] Error checking compliance for company ${company.id}:`, error);
    }
  }

  private async checkVATDeadlines() {
    console.log('[Scheduler] Checking VAT deadlines...');
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    try {
      const upcomingVATFilings = await db.select()
        .from(taxFilings)
        .where(
          and(
            eq(taxFilings.type, 'VAT'),
            eq(taxFilings.status, 'DRAFT'),
            lt(taxFilings.dueDate, thirtyDaysFromNow),
            gte(taxFilings.dueDate, today)
          )
        );

      for (const filing of upcomingVATFilings) {
        const daysUntilDue = Math.ceil((new Date(filing.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await this.createNotification({
          companyId: filing.companyId,
          type: 'DEADLINE_REMINDER',
          title: 'VAT Filing Deadline Approaching',
          message: `VAT return for ${filing.period} is due in ${daysUntilDue} days. Please prepare your submission.`,
          priority: daysUntilDue <= 7 ? 'HIGH' : 'MEDIUM',
          scheduledFor: today
        });
      }

      console.log(`[Scheduler] Processed ${upcomingVATFilings.length} VAT deadline reminders`);
    } catch (error) {
      console.error('[Scheduler] Error checking VAT deadlines:', error);
    }
  }

  private async checkCITDeadlines() {
    console.log('[Scheduler] Checking CIT deadlines...');
    
    const today = new Date();
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    try {
      const upcomingCITFilings = await db.select()
        .from(taxFilings)
        .where(
          and(
            eq(taxFilings.type, 'CIT'),
            eq(taxFilings.status, 'DRAFT'),
            lt(taxFilings.dueDate, ninetyDaysFromNow),
            gte(taxFilings.dueDate, today)
          )
        );

      for (const filing of upcomingCITFilings) {
        const daysUntilDue = Math.ceil((new Date(filing.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await this.createNotification({
          companyId: filing.companyId,
          type: 'DEADLINE_REMINDER',
          title: 'CIT Filing Deadline Approaching',
          message: `Corporate Income Tax return for ${filing.period} is due in ${daysUntilDue} days. Start preparing your annual accounts.`,
          priority: daysUntilDue <= 30 ? 'HIGH' : 'MEDIUM',
          scheduledFor: today
        });
      }

      console.log(`[Scheduler] Processed ${upcomingCITFilings.length} CIT deadline reminders`);
    } catch (error) {
      console.error('[Scheduler] Error checking CIT deadlines:', error);
    }
  }

  private async checkOverdueInvoices() {
    console.log('[Scheduler] Checking overdue invoices...');
    
    const today = new Date();

    try {
      const overdueInvoices = await db.select()
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'SENT'),
            lt(invoices.dueDate, today)
          )
        );

      for (const invoice of overdueInvoices) {
        const daysOverdue = Math.ceil((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        
        await this.createNotification({
          companyId: invoice.companyId,
          type: 'INVOICE_OVERDUE',
          title: 'Invoice Overdue',
          message: `Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue. Total: AED ${invoice.total}`,
          priority: daysOverdue > 30 ? 'HIGH' : 'MEDIUM',
          scheduledFor: today
        });

        // Update invoice status to overdue
        await db.update(invoices)
          .set({ status: 'OVERDUE' })
          .where(eq(invoices.id, invoice.id));
      }

      console.log(`[Scheduler] Processed ${overdueInvoices.length} overdue invoice reminders`);
    } catch (error) {
      console.error('[Scheduler] Error checking overdue invoices:', error);
    }
  }

  private async generateWeeklyComplianceSummary() {
    console.log('[Scheduler] Generating weekly compliance summary...');
    
    try {
      const activeCompanies = await db.select().from(companies);

      for (const company of activeCompanies) {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Count pending tasks
        const pendingVATFilings = await db.select()
          .from(taxFilings)
          .where(
            and(
              eq(taxFilings.companyId, company.id),
              eq(taxFilings.type, 'VAT'),
              eq(taxFilings.status, 'DRAFT')
            )
          );

        const pendingCITFilings = await db.select()
          .from(taxFilings)
          .where(
            and(
              eq(taxFilings.companyId, company.id),
              eq(taxFilings.type, 'CIT'),
              eq(taxFilings.status, 'DRAFT')
            )
          );

        const overdueInvoices = await db.select()
          .from(invoices)
          .where(
            and(
              eq(invoices.companyId, company.id),
              eq(invoices.status, 'OVERDUE')
            )
          );

        if (pendingVATFilings.length > 0 || pendingCITFilings.length > 0 || overdueInvoices.length > 0) {
          await this.createNotification({
            companyId: company.id,
            type: 'COMPLIANCE_SUMMARY',
            title: 'Weekly Compliance Summary',
            message: `You have ${pendingVATFilings.length} pending VAT filings, ${pendingCITFilings.length} pending CIT filings, and ${overdueInvoices.length} overdue invoices.`,
            priority: 'MEDIUM',
            scheduledFor: today
          });
        }
      }

      console.log(`[Scheduler] Generated weekly summaries for ${activeCompanies.length} companies`);
    } catch (error) {
      console.error('[Scheduler] Error generating weekly summary:', error);
    }
  }

  private async monthlyTaxCalculationReminders() {
    console.log('[Scheduler] Sending monthly tax calculation reminders...');
    
    try {
      const activeCompanies = await db.select().from(companies);

      for (const company of activeCompanies) {
        await this.createNotification({
          companyId: company.id,
          type: 'TAX_CALCULATION_REMINDER',
          title: 'Monthly Tax Calculation Reminder',
          message: 'It\'s time to review your monthly transactions and calculate your tax obligations.',
          priority: 'MEDIUM',
          scheduledFor: new Date()
        });
      }

      console.log(`[Scheduler] Sent monthly reminders to ${activeCompanies.length} companies`);
    } catch (error) {
      console.error('[Scheduler] Error sending monthly reminders:', error);
    }
  }

  private async createNotification(notification: any) {
    try {
      // Check if similar notification already exists (avoid duplicates)
      const existingNotification = await db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.companyId, notification.companyId),
            eq(notifications.type, notification.type),
            eq(notifications.title, notification.title),
            isNull(notifications.scheduledFor)
          )
        );

      if (existingNotification.length === 0) {
        await db.insert(notifications).values({
          companyId: notification.companyId,
          userId: null, // Company-wide notification
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority || 'MEDIUM',
          isRead: false,
          scheduledFor: notification.scheduledFor || new Date()
        });

        console.log(`[Scheduler] Created notification: ${notification.title} for company ${notification.companyId}`);
      }
    } catch (error) {
      console.error('[Scheduler] Error creating notification:', error);
    }
  }

  // Method to seed development notifications for testing
  async seedDevelopmentNotifications() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    console.log('[Scheduler] Seeding development notifications...');

    const developmentNotifications = [
      {
        companyId: 1,
        type: 'DEADLINE_REMINDER',
        title: 'VAT Return Due Soon',
        message: 'Your Q3 2025 VAT return is due in 5 days. Please ensure all transactions are recorded.',
        priority: 'HIGH'
      },
      {
        companyId: 1,
        type: 'COMPLIANCE_ALERT',
        title: 'Missing Transaction Categories',
        message: '3 transactions need proper categorization for accurate tax calculations.',
        priority: 'MEDIUM'
      },
      {
        companyId: 1,
        type: 'INVOICE_OVERDUE',
        title: 'Overdue Invoice #INV-2025-001',
        message: 'Invoice #INV-2025-001 for AED 12,500 is 15 days overdue.',
        priority: 'HIGH'
      }
    ];

    for (const notification of developmentNotifications) {
      await this.createNotification(notification);
    }

    console.log('[Scheduler] Seeded development notifications');
  }

  getStatus() {
    return {
      isStarted: this.isStarted,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }
}

export const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;