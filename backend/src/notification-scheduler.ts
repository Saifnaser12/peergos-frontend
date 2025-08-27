import * as cron from 'node-cron';
import { db } from './db';
import { notifications, companies, users } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

interface ReminderTemplate {
  id: string;
  type: 'VAT' | 'CIT' | 'LICENSE_RENEWAL' | 'QUARTERLY_REVIEW';
  daysBeforeDeadline: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  ftaReference?: string;
  penaltyAmount?: number;
}

const UAE_COMPLIANCE_TEMPLATES: ReminderTemplate[] = [
  // VAT Return Reminders
  {
    id: 'vat-30-day',
    type: 'VAT',
    daysBeforeDeadline: 30,
    urgency: 'low',
    titleEn: 'VAT Return Due in 30 Days',
    titleAr: 'إقرار ضريبة القيمة المضافة مستحق خلال 30 يوم',
    messageEn: 'Your quarterly VAT return is due in 30 days. Start preparing your documentation to avoid late filing penalties.',
    messageAr: 'إقرار ضريبة القيمة المضافة الفصلي مستحق خلال 30 يوماً. ابدأ في تحضير المستندات لتجنب غرامات التأخير.',
    ftaReference: 'FTA-VAT-001',
  },
  {
    id: 'vat-7-day',
    type: 'VAT',
    daysBeforeDeadline: 7,
    urgency: 'medium',
    titleEn: 'VAT Return Due in 7 Days',
    titleAr: 'إقرار ضريبة القيمة المضافة مستحق خلال 7 أيام',
    messageEn: 'Urgent: VAT return must be filed within 7 days. Late filing penalty is AED 1,000 per FTA regulations.',
    messageAr: 'عاجل: يجب تقديم إقرار ضريبة القيمة المضافة خلال 7 أيام. غرامة التأخير 1,000 درهم وفقاً لقوانين الهيئة الاتحادية للضرائب.',
    ftaReference: 'Article 67, Federal Decree-Law No. 8 of 2017',
    penaltyAmount: 1000,
  },
  {
    id: 'vat-1-day',
    type: 'VAT',
    daysBeforeDeadline: 1,
    urgency: 'high',
    titleEn: 'VAT Return Due Tomorrow',
    titleAr: 'إقرار ضريبة القيمة المضافة مستحق غداً',
    messageEn: 'Critical: VAT return due tomorrow! File immediately to avoid AED 1,000 penalty and potential business suspension.',
    messageAr: 'حرج: إقرار ضريبة القيمة المضافة مستحق غداً! قدم فوراً لتجنب غرامة 1,000 درهم وإمكانية تعليق النشاط التجاري.',
    ftaReference: 'Article 67, Federal Decree-Law No. 8 of 2017',
    penaltyAmount: 1000,
  },
  {
    id: 'vat-same-day',
    type: 'VAT',
    daysBeforeDeadline: 0,
    urgency: 'critical',
    titleEn: 'VAT Return Due Today',
    titleAr: 'إقرار ضريبة القيمة المضافة مستحق اليوم',
    messageEn: 'FINAL NOTICE: VAT return due today by 11:59 PM GST. File now to avoid penalties and legal consequences.',
    messageAr: 'إشعار أخير: إقرار ضريبة القيمة المضافة مستحق اليوم قبل 11:59 م بتوقيت الخليج. قدم الآن لتجنب الغرامات والعواقب القانونية.',
    ftaReference: 'Article 67, Federal Decree-Law No. 8 of 2017',
    penaltyAmount: 1000,
  },

  // Corporate Income Tax Reminders
  {
    id: 'cit-30-day',
    type: 'CIT',
    daysBeforeDeadline: 30,
    urgency: 'low',
    titleEn: 'Corporate Income Tax Return Due in 30 Days',
    titleAr: 'إقرار ضريبة دخل الشركات مستحق خلال 30 يوم',
    messageEn: 'Your annual CIT return is due in 30 days. Ensure all financial statements and supporting documents are ready.',
    messageAr: 'إقرار ضريبة دخل الشركات السنوي مستحق خلال 30 يوماً. تأكد من جاهزية جميع البيانات المالية والمستندات الداعمة.',
    ftaReference: 'Federal Decree-Law No. 47 of 2022',
  },
  {
    id: 'cit-7-day',
    type: 'CIT',
    daysBeforeDeadline: 7,
    urgency: 'medium',
    titleEn: 'CIT Return Due in 7 Days',
    titleAr: 'إقرار ضريبة دخل الشركات مستحق خلال 7 أيام',
    messageEn: 'Urgent: Corporate Income Tax return due in 7 days. Late filing may result in penalties up to AED 10,000.',
    messageAr: 'عاجل: إقرار ضريبة دخل الشركات مستحق خلال 7 أيام. التأخير قد يؤدي إلى غرامات تصل إلى 10,000 درهم.',
    ftaReference: 'Article 49, Federal Decree-Law No. 47 of 2022',
    penaltyAmount: 10000,
  },
  {
    id: 'cit-1-day',
    type: 'CIT',
    daysBeforeDeadline: 1,
    urgency: 'high',
    titleEn: 'CIT Return Due Tomorrow',
    titleAr: 'إقرار ضريبة دخل الشركات مستحق غداً',
    messageEn: 'Critical: CIT return due tomorrow! File immediately to avoid severe penalties and audit triggers.',
    messageAr: 'حرج: إقرار ضريبة دخل الشركات مستحق غداً! قدم فوراً لتجنب الغرامات الصارمة وإثارة عمليات التدقيق.',
    ftaReference: 'Article 49, Federal Decree-Law No. 47 of 2022',
    penaltyAmount: 10000,
  },
  {
    id: 'cit-same-day',
    type: 'CIT',
    daysBeforeDeadline: 0,
    urgency: 'critical',
    titleEn: 'CIT Return Due Today',
    titleAr: 'إقرار ضريبة دخل الشركات مستحق اليوم',
    messageEn: 'FINAL NOTICE: Corporate Income Tax return due today. File before midnight GST to avoid legal action.',
    messageAr: 'إشعار أخير: إقرار ضريبة دخل الشركات مستحق اليوم. قدم قبل منتصف الليل بتوقيت الخليج لتجنب الإجراءات القانونية.',
    ftaReference: 'Article 49, Federal Decree-Law No. 47 of 2022',
    penaltyAmount: 10000,
  },

  // License Renewal Reminders
  {
    id: 'license-30-day',
    type: 'LICENSE_RENEWAL',
    daysBeforeDeadline: 30,
    urgency: 'medium',
    titleEn: 'Business License Renewal Due in 30 Days',
    titleAr: 'تجديد الرخصة التجارية مستحق خلال 30 يوم',
    messageEn: 'Your business license expires in 30 days. Start renewal process to maintain business operations.',
    messageAr: 'رخصتك التجارية تنتهي خلال 30 يوماً. ابدأ عملية التجديد للحفاظ على العمليات التجارية.',
  },
  {
    id: 'license-7-day',
    type: 'LICENSE_RENEWAL',
    daysBeforeDeadline: 7,
    urgency: 'high',
    titleEn: 'Business License Expires in 7 Days',
    titleAr: 'الرخصة التجارية تنتهي خلال 7 أيام',
    messageEn: 'Urgent: Business license expires in 7 days. Operating without valid license may result in closure.',
    messageAr: 'عاجل: الرخصة التجارية تنتهي خلال 7 أيام. العمل بدون رخصة سارية قد يؤدي إلى الإغلاق.',
  },
];

export class NotificationScheduler {
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    // Schedule daily check at 09:00 GST (GMT+4)
    // In cron: 0 5 * * * = 05:00 UTC = 09:00 GST
    const cronExpression = process.env.NODE_ENV === 'development' 
      ? '*/30 * * * * *' // Every 30 seconds for development testing
      : '0 5 * * *'; // 09:00 GST for production

    cron.schedule(cronExpression, async () => {
      console.log(`[Scheduler] Running compliance check at ${new Date().toISOString()}`);
      await this.checkAndCreateReminders();
    }, {
      timezone: 'Asia/Dubai'
    });

    this.isRunning = true;
    console.log(`[Scheduler] Started with expression: ${cronExpression}`);
    
    // Run immediately for development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => this.checkAndCreateReminders(), 2000);
    }
  }

  stop() {
    cron.destroy();
    this.isRunning = false;
    console.log('[Scheduler] Stopped');
  }

  private async checkAndCreateReminders() {
    try {
      // Get all companies with their compliance deadlines
      const companiesData = await db.select().from(companies);
      
      for (const company of companiesData) {
        await this.processCompanyDeadlines(company);
      }
      
      console.log(`[Scheduler] Processed ${companiesData.length} companies`);
    } catch (error) {
      console.error('[Scheduler] Error during reminder check:', error);
    }
  }

  private async processCompanyDeadlines(company: any) {
    const now = new Date();
    const deadlines: Array<{ type: ReminderTemplate['type'], date: Date }> = [];

    // Calculate next VAT deadline (quarterly - 28th of month following quarter)
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const nextQuarterStart = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 1);
    const vatDeadline = new Date(nextQuarterStart.getFullYear(), nextQuarterStart.getMonth() + 1, 28);
    deadlines.push({ type: 'VAT', date: vatDeadline });

    // Calculate CIT deadline (9 months after fiscal year end)
    const fiscalYearEnd = new Date(now.getFullYear(), 11, 31); // Assuming Dec 31 fiscal year
    const citDeadline = new Date(fiscalYearEnd.getFullYear() + 1, 8, 30); // Sept 30 following year
    deadlines.push({ type: 'CIT', date: citDeadline });

    // License renewal (if available in company data)
    if (company.licenseExpiry) {
      deadlines.push({ type: 'LICENSE_RENEWAL', date: new Date(company.licenseExpiry) });
    }

    // Process each deadline
    for (const deadline of deadlines) {
      await this.checkDeadlineReminders(company, deadline.type, deadline.date);
    }
  }

  private async checkDeadlineReminders(company: any, type: ReminderTemplate['type'], deadlineDate: Date) {
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Get applicable templates for this deadline
    const applicableTemplates = UAE_COMPLIANCE_TEMPLATES.filter(template => 
      template.type === type && template.daysBeforeDeadline >= daysUntilDeadline
    );

    for (const template of applicableTemplates) {
      // Check if we should trigger this reminder
      if (template.daysBeforeDeadline === daysUntilDeadline || 
          (template.daysBeforeDeadline === 0 && daysUntilDeadline <= 0)) {
        
        // Check if reminder already exists
        const existingReminder = await this.findExistingReminder(company.id, template.id, deadlineDate);
        
        if (!existingReminder) {
          await this.createReminder(company, template, deadlineDate);
        }
      }
    }
  }

  private async findExistingReminder(companyId: number, templateId: string, deadlineDate: Date) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.companyId, companyId),
          eq(notifications.type, 'COMPLIANCE_REMINDER'),
          eq(notifications.metadata, JSON.stringify({ templateId, deadlineDate: deadlineDate.toISOString() }))
        )
      )
      .limit(1);
    
    return existing;
  }

  private async createReminder(company: any, template: ReminderTemplate, deadlineDate: Date) {
    try {
      // Get company users (for notification targeting)
      const companyUsers = await db
        .select()
        .from(users)
        .where(eq(users.companyId, company.id));

      const metadata = {
        templateId: template.id,
        deadlineDate: deadlineDate.toISOString(),
        urgency: template.urgency,
        ftaReference: template.ftaReference,
        penaltyAmount: template.penaltyAmount,
      };

      // Create notification for each user in the company
      for (const user of companyUsers) {
        await db.insert(notifications).values({
          companyId: company.id,
          userId: user.id,
          type: 'COMPLIANCE_REMINDER',
          title: template.titleEn, // Default to English, could be user preference
          message: template.messageEn,
          priority: template.urgency === 'critical' ? 'HIGH' : 
                   template.urgency === 'high' ? 'HIGH' : 
                   template.urgency === 'medium' ? 'MEDIUM' : 'LOW',
          isRead: false,
          metadata: JSON.stringify(metadata),
          createdAt: new Date(),
        });

        console.log(`[Scheduler] Created ${template.urgency} reminder for company ${company.name}: ${template.titleEn}`);

        // Send email notification for high/critical urgency
        if (template.urgency === 'high' || template.urgency === 'critical') {
          await this.sendEmailNotification(user, company, template, deadlineDate);
        }
      }
    } catch (error) {
      console.error(`[Scheduler] Error creating reminder for company ${company.id}:`, error);
    }
  }

  private async sendEmailNotification(user: any, company: any, template: ReminderTemplate, deadlineDate: Date) {
    // In development mode, just log the email
    if (process.env.NODE_ENV === 'development' || !process.env.SENDGRID_API_KEY) {
      console.log('[Email] Mock email notification:', {
        to: user.email,
        subject: `[URGENT] ${template.titleEn}`,
        company: company.name,
        deadline: deadlineDate.toLocaleDateString(),
        urgency: template.urgency,
      });
      return;
    }

    try {
      // Real SendGrid implementation would go here
      const emailContent = `
        Dear ${user.username || 'User'},
        
        ${template.messageEn}
        
        Company: ${company.name}
        Deadline: ${deadlineDate.toLocaleDateString()}
        ${template.ftaReference ? `FTA Reference: ${template.ftaReference}` : ''}
        ${template.penaltyAmount ? `Penalty Amount: AED ${template.penaltyAmount.toLocaleString()}` : ''}
        
        Please log into Peergos to complete your filing immediately.
        
        Best regards,
        Peergos Compliance System
      `;

      // Actual SendGrid call would be implemented here
      console.log('[Email] Would send email notification via SendGrid');
      
    } catch (error) {
      console.error('[Email] Failed to send notification:', error);
    }
  }

  // Method to seed development data
  async seedDevelopmentDeadlines() {
    if (process.env.NODE_ENV !== 'development') return;

    try {
      const companiesData = await db.select().from(companies);
      
      // Create some test deadlines that will trigger soon
      const testNotifications = [
        {
          templateId: 'vat-7-day',
          type: 'VAT',
          urgency: 'medium',
          title: 'VAT Return Due in 7 Days',
          message: 'Your quarterly VAT return is due in 7 days. Late filing penalty is AED 1,000.',
        },
        {
          templateId: 'cit-30-day',
          type: 'CIT',
          urgency: 'low',
          title: 'Corporate Income Tax Return Due in 30 Days',
          message: 'Your annual CIT return is due in 30 days. Ensure all documentation is ready.',
        },
      ];

      for (const company of companiesData) {
        const companyUsers = await db
          .select()
          .from(users)
          .where(eq(users.companyId, company.id));

        for (const notification of testNotifications) {
          for (const user of companyUsers) {
            await db.insert(notifications).values({
              companyId: company.id,
              userId: user.id,
              type: 'COMPLIANCE_REMINDER',
              title: notification.title,
              message: notification.message,
              priority: notification.urgency === 'medium' ? 'MEDIUM' : 'LOW',
              isRead: false,
              metadata: JSON.stringify({
                templateId: notification.templateId,
                urgency: notification.urgency,
                deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              }),
              createdAt: new Date(),
            });
          }
        }
      }

      console.log('[Scheduler] Seeded development notifications');
    } catch (error) {
      console.error('[Scheduler] Error seeding development data:', error);
    }
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();