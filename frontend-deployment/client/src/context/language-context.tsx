import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: 'en' | 'ar';
  direction: 'ltr' | 'rtl';
  setLanguage: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Enhanced translations with more comprehensive coverage
const translations = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.calendar': 'Calendar',
    'nav.accounting': 'Accounting',
    'nav.financials': 'Financial Reports',
    'nav.invoicing': 'Invoicing',
    'nav.cit': 'Corporate Income Tax',
    'nav.vat': 'VAT Returns',
    'nav.transfer_pricing': 'Transfer Pricing',
    'nav.assistant': 'AI Assistant',
    'nav.admin': 'Administration',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your tax compliance status',
    'dashboard.vat_due': 'VAT Due This Month',
    'dashboard.cit_liability': 'CIT Liability (Q1)',
    'dashboard.revenue_ytd': 'Revenue (YTD)',
    'dashboard.next_deadline': 'Next Deadline',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.file_vat': 'File VAT Return',
    'dashboard.add_transaction': 'Add Transaction',
    'dashboard.create_invoice': 'Create Invoice',
    'dashboard.generate_report': 'Generate Report',
    'dashboard.upcoming_deadlines': 'Upcoming Deadlines',
    'dashboard.recent_activity': 'Recent Activity',
    'dashboard.revenue_chart': 'Revenue & Tax Trend',
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.settings': 'Settings',
    'common.help': 'Help',
    'common.notifications': 'Notifications',
    'common.profile': 'Profile',
    'common.logout': 'Logout',
    'common.language': 'Language',
    'common.collapse': 'Collapse',
    'common.expand': 'Expand',
    'nav.bookkeeping': 'Bookkeeping',
    'nav.taxes': 'Taxes',
    'nav.documents': 'Documents',
    'nav.data_entry': 'Data Entry',
    'nav.calculation_audit': 'Calculation Audit',
    'nav.reports': 'Reports',
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.calendar': 'التقويم',
    'nav.accounting': 'المحاسبة',
    'nav.financials': 'التقارير المالية',
    'nav.invoicing': 'الفواتير',
    'nav.cit': 'ضريبة دخل الشركات',
    'nav.vat': 'إقرارات ضريبة القيمة المضافة',
    'nav.transfer_pricing': 'تسعير التحويل',
    'nav.assistant': 'المساعد الذكي',
    'nav.admin': 'الإدارة',
    'dashboard.title': 'لوحة التحكم',
    'dashboard.subtitle': 'نظرة عامة على حالة الامتثال الضريبي',
    'dashboard.vat_due': 'ضريبة القيمة المضافة المستحقة هذا الشهر',
    'dashboard.cit_liability': 'التزام ضريبة دخل الشركات (الربع الأول)',
    'dashboard.revenue_ytd': 'الإيرادات (من بداية السنة)',
    'dashboard.next_deadline': 'الموعد النهائي التالي',
    'dashboard.quick_actions': 'إجراءات سريعة',
    'dashboard.file_vat': 'تقديم إقرار ضريبة القيمة المضافة',
    'dashboard.add_transaction': 'إضافة معاملة',
    'dashboard.create_invoice': 'إنشاء فاتورة',
    'dashboard.generate_report': 'إنشاء تقرير',
    'dashboard.upcoming_deadlines': 'المواعيد النهائية القادمة',
    'dashboard.recent_activity': 'النشاط الأخير',
    'dashboard.revenue_chart': 'اتجاه الإيرادات والضرائب',
    'common.loading': 'جارٍ التحميل...',
    'common.error': 'حدث خطأ',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.submit': 'إرسال',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.search': 'بحث',
    'common.close': 'إغلاق',
    'common.open': 'فتح',
    'common.settings': 'الإعدادات',
    'common.help': 'مساعدة',
    'common.notifications': 'الإشعارات',
    'common.profile': 'الملف الشخصي',
    'common.logout': 'تسجيل الخروج',
    'common.language': 'اللغة',
    'common.collapse': 'طي',
    'common.expand': 'توسيع',
    'nav.bookkeeping': 'مسك الدفاتر',
    'nav.taxes': 'الضرائب',
    'nav.documents': 'المستندات',
    'nav.data_entry': 'إدخال البيانات',
    'nav.calculation_audit': 'تدقيق العمليات الحسابية',
    'nav.reports': 'التقارير',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'ar'>('en');
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: 'en' | 'ar') => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as 'en' | 'ar';
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLanguageState(saved);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
