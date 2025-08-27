export interface FinancialNote {
  id: string;
  reportType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TAX_SUMMARY';
  noteNumber: number;
  title: string;
  content: string;
  isEditable: boolean;
  lastModified: string;
  modifiedBy: string;
}

export interface ReportPackConfig {
  includeIncomeStatement: boolean;
  includeBalanceSheet: boolean;
  includeCashFlow: boolean;
  includeTaxSummary: boolean;
  includeAuditTrail: boolean;
  includeNotes: boolean;
  language: 'en' | 'ar';
  signedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
}

export interface ExportMetadata {
  generatedAt: string;
  generatedBy: string;
  companyName: string;
  tradeLicenseNumber: string;
  trnNumber: string;
  reportingPeriod: string;
  preparationDate: string;
  complianceStatement: string;
}

// UAE FTA-compliant note templates
export const UAE_NOTE_TEMPLATES = {
  en: {
    INCOME_STATEMENT: [
      {
        id: 'revenue_recognition',
        title: '1. Revenue Recognition',
        content: `The Company recognizes revenue in accordance with IFRS 15 "Revenue from Contracts with Customers." Revenue is recognized when control of goods or services is transferred to the customer.

For UAE VAT purposes, revenue is recognized at the time of supply as defined under Federal Decree-Law No. 8 of 2017.

${process.env.NODE_ENV === 'development' ? '[Note: This company operates under cash/accrual accounting basis - to be specified based on company setup]' : ''}`,
        isEditable: true
      },
      {
        id: 'free_zone_status',
        title: '2. Free Zone Operations',
        content: `The Company [operates/does not operate] within a UAE Free Zone. Free Zone income qualifies for Corporate Income Tax exemption under Federal Decree-Law No. 47 of 2022, subject to meeting qualifying conditions and substance requirements.

All transactions with related parties are conducted at arm's length in accordance with UAE Transfer Pricing regulations.`,
        isEditable: true
      },
      {
        id: 'accounting_estimates',
        title: '3. Significant Accounting Estimates',
        content: `The preparation of financial statements requires management to make estimates and assumptions that affect reported amounts. Key areas of estimation include:

• Depreciation rates for property, plant and equipment
• Provision for doubtful debts
• Inventory valuation
• Accrued expenses and liabilities

Management reviews these estimates regularly and adjusts them as necessary.`,
        isEditable: true
      }
    ],
    BALANCE_SHEET: [
      {
        id: 'accounting_policies',
        title: '1. Basis of Preparation',
        content: `These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as adopted in the UAE and the UAE Companies Law.

The financial statements are prepared under the historical cost convention, except for certain financial instruments that are measured at fair value.`,
        isEditable: true
      },
      {
        id: 'related_parties',
        title: '2. Related Party Transactions',
        content: `Related party transactions are conducted in the ordinary course of business and at arm's length prices in accordance with UAE Transfer Pricing regulations.

All material related party transactions are disclosed in accordance with IAS 24 "Related Party Disclosures."`,
        isEditable: true
      }
    ],
    CASH_FLOW: [
      {
        id: 'cash_flow_basis',
        title: '1. Cash Flow Statement Basis',
        content: `The cash flow statement has been prepared using the indirect method in accordance with IAS 7 "Statement of Cash Flows."

Cash and cash equivalents comprise cash on hand, deposits held at call with banks, and other short-term highly liquid investments with original maturities of three months or less.`,
        isEditable: true
      }
    ],
    TAX_SUMMARY: [
      {
        id: 'tax_compliance',
        title: '1. UAE Tax Compliance',
        content: `The Company is registered for UAE VAT (TRN: [TO BE INSERTED]) and Corporate Income Tax as required under UAE tax laws.

VAT returns are filed quarterly and Corporate Income Tax returns are filed annually within prescribed deadlines.

The Company maintains proper books and records in accordance with Article 11 of the UAE Tax Procedures Law.`,
        isEditable: true
      }
    ]
  },
  ar: {
    INCOME_STATEMENT: [
      {
        id: 'revenue_recognition',
        title: '1. الاعتراف بالإيرادات',
        content: `تعترف الشركة بالإيرادات وفقاً للمعيار الدولي للتقارير المالية رقم 15 "الإيرادات من العقود مع العملاء". يتم الاعتراف بالإيرادات عند نقل السيطرة على السلع أو الخدمات إلى العميل.

لأغراض ضريبة القيمة المضافة الإماراتية، يتم الاعتراف بالإيرادات في وقت التوريد كما هو محدد في المرسوم بقانون اتحادي رقم 8 لسنة 2017.`,
        isEditable: true
      }
    ],
    BALANCE_SHEET: [
      {
        id: 'accounting_policies',
        title: '1. أساس الإعداد',
        content: `تم إعداد هذه البيانات المالية وفقاً للمعايير الدولية للتقارير المالية كما تم اعتمادها في دولة الإمارات العربية المتحدة وقانون الشركات الإماراتي.`,
        isEditable: true
      }
    ],
    CASH_FLOW: [
      {
        id: 'cash_flow_basis',
        title: '1. أساس بيان التدفق النقدي',
        content: `تم إعداد بيان التدفق النقدي باستخدام الطريقة غير المباشرة وفقاً لمعيار المحاسبة الدولي رقم 7 "بيان التدفقات النقدية".`,
        isEditable: true
      }
    ],
    TAX_SUMMARY: [
      {
        id: 'tax_compliance',
        title: '1. الامتثال الضريبي الإماراتي',
        content: `الشركة مسجلة في ضريبة القيمة المضافة الإماراتية وضريبة دخل الشركات كما هو مطلوب بموجب القوانين الضريبية الإماراتية.

يتم تقديم إقرارات ضريبة القيمة المضافة ربع سنوية وإقرارات ضريبة دخل الشركات سنوياً ضمن المواعيد المحددة.`,
        isEditable: true
      }
    ]
  }
};

export const generateComplianceStatement = (language: 'en' | 'ar', metadata: ExportMetadata): string => {
  if (language === 'ar') {
    return `تم إعداد هذا التقرير وفقاً للوائح الهيئة الاتحادية للضرائب في دولة الإمارات العربية المتحدة والمعايير الدولية للتقارير المالية.

الشركة: ${metadata.companyName}
رقم الرخصة التجارية: ${metadata.tradeLicenseNumber}
الرقم الضريبي: ${metadata.trnNumber}
فترة التقرير: ${metadata.reportingPeriod}
تاريخ الإعداد: ${metadata.preparationDate}

أشهد بأن هذا التقرير يمثل الوضع المالي الحقيقي للشركة وأنه تم إعداده وفقاً للمتطلبات القانونية والتنظيمية المعمول بها في دولة الإمارات العربية المتحدة.`;
  }

  return `This report has been prepared in compliance with UAE Federal Tax Authority regulations and International Financial Reporting Standards.

Company: ${metadata.companyName}
Trade License Number: ${metadata.tradeLicenseNumber}
Tax Registration Number: ${metadata.trnNumber}
Reporting Period: ${metadata.reportingPeriod}
Preparation Date: ${metadata.preparationDate}

I certify that this report represents the true financial position of the company and has been prepared in accordance with applicable legal and regulatory requirements in the United Arab Emirates.`;
};

export const getReportPackStructure = (config: ReportPackConfig) => {
  const sections = [];

  if (config.includeIncomeStatement) {
    sections.push({
      id: 'income_statement',
      title: config.language === 'ar' ? 'قائمة الدخل' : 'Income Statement',
      includeNotes: config.includeNotes
    });
  }

  if (config.includeBalanceSheet) {
    sections.push({
      id: 'balance_sheet',
      title: config.language === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet',
      includeNotes: config.includeNotes
    });
  }

  if (config.includeCashFlow) {
    sections.push({
      id: 'cash_flow',
      title: config.language === 'ar' ? 'بيان التدفق النقدي' : 'Cash Flow Statement',
      includeNotes: config.includeNotes
    });
  }

  if (config.includeTaxSummary) {
    sections.push({
      id: 'tax_summary',
      title: config.language === 'ar' ? 'ملخص الضرائب' : 'Tax Calculation Summary',
      includeNotes: config.includeNotes
    });
  }

  if (config.includeAuditTrail) {
    sections.push({
      id: 'audit_trail',
      title: config.language === 'ar' ? 'مسار التدقيق' : 'Audit Trail',
      includeNotes: false
    });
  }

  return sections;
};

export const validateReportPack = (config: ReportPackConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.includeIncomeStatement && !config.includeBalanceSheet && !config.includeCashFlow) {
    errors.push('At least one financial statement must be included');
  }

  if (config.includeNotes && !config.includeIncomeStatement && !config.includeBalanceSheet) {
    errors.push('Notes can only be included with financial statements');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatReportTitle = (reportType: string, language: 'en' | 'ar'): string => {
  const titles = {
    en: {
      INCOME_STATEMENT: 'Income Statement',
      BALANCE_SHEET: 'Balance Sheet',
      CASH_FLOW: 'Cash Flow Statement',
      TAX_SUMMARY: 'Tax Calculation Summary',
      AUDIT_TRAIL: 'Audit Trail'
    },
    ar: {
      INCOME_STATEMENT: 'قائمة الدخل',
      BALANCE_SHEET: 'الميزانية العمومية',
      CASH_FLOW: 'بيان التدفق النقدي',
      TAX_SUMMARY: 'ملخص الضرائب',
      AUDIT_TRAIL: 'مسار التدقيق'
    }
  };

  return titles[language][reportType as keyof typeof titles.en] || reportType;
};

export const generateReportMetadata = (companyData: any, period: string): ExportMetadata => {
  const now = new Date();
  
  return {
    generatedAt: now.toISOString(),
    generatedBy: companyData.currentUser?.name || 'System',
    companyName: companyData.name || 'Company Name',
    tradeLicenseNumber: companyData.tradeLicenseNumber || '[TO BE INSERTED]',
    trnNumber: companyData.trnNumber || '[TO BE INSERTED]',
    reportingPeriod: period,
    preparationDate: now.toLocaleDateString(),
    complianceStatement: 'Prepared in compliance with UAE FTA regulations and IFRS standards'
  };
};