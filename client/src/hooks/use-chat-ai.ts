import { useState, useCallback } from 'react';
import { useAuth } from './use-auth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  language?: 'en' | 'ar';
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  rating?: number;
  feedback?: string;
  createdAt: Date;
}

// UAE FTA knowledge base for mock responses
const FTA_KNOWLEDGE_BASE = {
  en: {
    vatDeductible: {
      keywords: ['vat', 'deductible', 'input', 'claim', 'eligible'],
      response: `**VAT Input Tax Deductibility in UAE:**

✓ **Eligible for Input VAT Recovery:**
• Business-related purchases (office supplies, equipment)
• Professional services (accounting, legal, consulting)
• Utilities for business premises (DEWA, TAQA bills)
• Transportation costs (fuel, vehicle maintenance)
• Marketing and advertising expenses

✗ **Not Eligible for Input VAT Recovery:**
• Personal expenses or entertainment
• Residential property purchases
• Medical and education services
• Financial services and insurance

**Key Requirement:** Must have valid tax invoice with supplier's TRN number.

*Reference: Article 55, Federal Decree-Law No. 8 of 2017 on VAT*`
    },
    citEligibility: {
      keywords: ['cit', 'qualify', '0%', 'small business relief', 'exempt'],
      response: `**UAE Corporate Income Tax (CIT) Eligibility:**

🎯 **Small Business Relief (0% rate):**
• Annual revenue ≤ AED 375,000
• Automatic qualification - no application needed
• Must maintain proper accounting records

💼 **Standard CIT (9% rate):**
• Annual revenue > AED 375,000
• Applies to all UAE mainland companies
• Free Zone companies on qualifying income

🏢 **Free Zone Benefits:**
• 0% CIT on qualifying income if revenue < AED 3M
• Qualifying Free Zone Person (QFZP) status
• Must conduct adequate substance in UAE

**Next Steps:** Complete our SME categorization in Setup to determine your exact rate.

*Reference: Federal Decree-Law No. 47 of 2022 on Corporate Income Tax*`
    },
    expenses: {
      keywords: ['expenses', 'deductible', 'business', 'allowable', 'claim'],
      response: `**Deductible Business Expenses in UAE:**

✅ **Fully Deductible:**
• Staff salaries and benefits (including WPS fees)
• Office rent and utilities
• Professional fees (audit, legal, tax advisory)
• Marketing and advertising costs
• Equipment depreciation
• Insurance premiums
• Bank charges and financing costs

⚠️ **Partially Deductible:**
• Meals and entertainment (50% limit)
• Vehicle expenses (business use portion)
• Home office expenses (business area only)

❌ **Non-Deductible:**
• Personal expenses
• Penalties and fines
• Illegal payments
• Excessive compensation to owners

**Documentation:** Keep invoices, receipts, and proof of business purpose.

*Reference: UAE Corporate Income Tax Law, Article 30*`
    },
    registration: {
      keywords: ['register', 'registration', 'trn', 'when', 'mandatory'],
      response: `**UAE Tax Registration Requirements:**

📋 **VAT Registration:**
• **Mandatory:** Annual revenue > AED 375,000
• **Voluntary:** Revenue AED 187,500 - 375,000
• **Process:** Online via FTA portal
• **Timeline:** 30 days from crossing threshold

🏢 **CIT Registration:**
• **All UAE companies** must register
• **Deadline:** March 31, 2025 (for existing businesses)
• **New businesses:** 3 months from incorporation
• **Natural persons:** Only if business income > AED 1M

📄 **Required Documents:**
• Trade license
• Memorandum of Association
• Audited financial statements
• Bank account details

**Start Here:** Use our Setup Wizard to check your registration requirements.

*Reference: FTA Cabinet Resolution No. 52 of 2017*`
    }
  },
  ar: {
    vatDeductible: {
      keywords: ['ضريبة', 'مخصوم', 'مدخلات', 'استرداد', 'مؤهل'],
      response: `**ضريبة القيمة المضافة المخصومة في دولة الإمارات:**

✓ **المؤهل لاسترداد ضريبة المدخلات:**
• المشتريات المتعلقة بالأعمال (اللوازم المكتبية، المعدات)
• الخدمات المهنية (المحاسبة، القانونية، الاستشارات)
• المرافق للمباني التجارية (فواتير ديوا، طاقة)
• تكاليف النقل (الوقود، صيانة المركبات)
• مصاريف التسويق والإعلان

✗ **غير مؤهل لاسترداد ضريبة المدخلات:**
• المصاريف الشخصية أو الترفيه
• شراء العقارات السكنية
• الخدمات الطبية والتعليمية
• الخدمات المالية والتأمين

**الشرط الأساسي:** يجب وجود فاتورة ضريبية صالحة برقم تسجيل المورد الضريبي.

*المرجع: المادة 55، المرسوم بقانون اتحادي رقم 8 لسنة 2017 بشأن ضريبة القيمة المضافة*`
    }
  }
};

const SYSTEM_PROMPTS = {
  en: (userContext: any) => `You are Peergos AI, an expert UAE tax compliance assistant. You help SMEs with VAT, Corporate Income Tax (CIT), and FTA regulations.

User Context:
- Company: ${userContext.companyName || 'UAE Business'}
- Revenue Category: ${userContext.revenueCategory || 'Not specified'}
- Free Zone Status: ${userContext.isFreeZone ? 'Yes' : 'No'}
- Business Type: ${userContext.businessType || 'General'}

Guidelines:
1. Provide specific, actionable UAE tax advice
2. Always cite relevant FTA regulations and article numbers
3. Use AED currency and UAE business examples
4. Suggest next steps in Peergos system when relevant
5. Keep responses concise but comprehensive
6. Include penalty amounts for late filings when relevant`,

  ar: (userContext: any) => `أنت مساعد الذكي لبيرجوس، خبير في الامتثال الضريبي في دولة الإمارات العربية المتحدة. تساعد الشركات الصغيرة والمتوسطة في ضريبة القيمة المضافة وضريبة دخل الشركات ولوائح الهيئة الاتحادية للضرائب.

سياق المستخدم:
- الشركة: ${userContext.companyName || 'شركة إماراتية'}
- فئة الإيرادات: ${userContext.revenueCategory || 'غير محدد'}
- حالة المنطقة الحرة: ${userContext.isFreeZone ? 'نعم' : 'لا'}
- نوع النشاط: ${userContext.businessType || 'عام'}

الإرشادات:
1. قدم مشورة ضريبية إماراتية محددة وقابلة للتنفيذ
2. اذكر دائماً اللوائح والمواد ذات الصلة للهيئة الاتحادية للضرائب
3. استخدم عملة الدرهم الإماراتي وأمثلة من الأعمال الإماراتية
4. اقترح الخطوات التالية في نظام بيرجوس عند الصلة
5. اجعل الردود موجزة ولكن شاملة
6. اشمل مبالغ الغرامات للتقديم المتأخر عند الصلة`
};

export const useChatAI = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, company } = useAuth();

  const createNewSession = useCallback(() => {
    const session: ChatSession = {
      id: `session_${Date.now()}`,
      messages: [],
      createdAt: new Date(),
    };
    setCurrentSession(session);
    return session;
  }, []);

  const generateMockResponse = useCallback(async (userMessage: string, language: 'en' | 'ar' = 'en'): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const userContext = {
      companyName: company?.name,
      revenueCategory: (company as any)?.annualRevenue ? 
        ((company as any).annualRevenue <= 375000 ? 'Small Business (≤ AED 375K)' :
         (company as any).annualRevenue <= 3000000 ? 'Medium Business (AED 375K-3M)' :
         'Large Business (> AED 3M)') : undefined,
      isFreeZone: (company as any)?.freeZone,
      businessType: (company as any)?.businessType,
    };

    const knowledge = FTA_KNOWLEDGE_BASE[language];
    const message = userMessage.toLowerCase();

    // Check for keyword matches
    for (const [key, item] of Object.entries(knowledge)) {
      if (item.keywords.some(keyword => message.includes(keyword))) {
        return item.response;
      }
    }

    // Default responses for common scenarios
    if (message.includes('hello') || message.includes('hi') || message.includes('مرحبا')) {
      return language === 'ar' ? 
        `مرحباً بك في مساعد بيرجوس الذكي! 👋

أنا هنا لمساعدتك في الامتثال الضريبي في دولة الإمارات. يمكنني الإجابة على أسئلة حول:

• ضريبة القيمة المضافة (VAT)
• ضريبة دخل الشركات (CIT)
• التسجيل الضريبي
• المصاريف المخصومة
• المواعيد النهائية والامتثال

كيف يمكنني مساعدتك اليوم؟` :
        `Welcome to Peergos AI Assistant! 👋

I'm here to help you with UAE tax compliance. I can answer questions about:

• VAT (Value Added Tax)
• CIT (Corporate Income Tax)
• Tax registration requirements
• Deductible expenses
• Filing deadlines and compliance

${userContext.companyName ? `I see you're with ${userContext.companyName}. ` : ''}How can I help you today?`;
    }

    if (message.includes('deadline') || message.includes('when') || message.includes('موعد')) {
      return language === 'ar' ?
        `**المواعيد النهائية الضريبية الهامة:**

📅 **ضريبة القيمة المضافة:**
• إقرار فصلي: 28 من الشهر التالي للفصل
• غرامة التأخير: 1,000 درهم

📅 **ضريبة دخل الشركات:**
• إقرار سنوي: 9 أشهر من نهاية السنة المالية
• التسجيل للشركات الموجودة: 31 مارس 2025

📅 **تجديد الرخصة التجارية:**
• حسب تاريخ انتهاء الرخصة
• ابدأ التجديد قبل 30 يوم

تحقق من صفحة التقويم في بيرجوس لمراقبة مواعيدك النهائية.` :
        `**Important Tax Deadlines:**

📅 **VAT Returns:**
• Quarterly filing: 28th of month following quarter
• Late penalty: AED 1,000

📅 **Corporate Income Tax:**
• Annual return: 9 months after fiscal year end
• Registration for existing businesses: March 31, 2025

📅 **Business License Renewal:**
• Based on license expiry date
• Start renewal 30 days before expiry

Check the Calendar page in Peergos to monitor your deadlines.`;
    }

    if (message.includes('penalty') || message.includes('fine') || message.includes('غرامة')) {
      return language === 'ar' ?
        `**الغرامات الضريبية في دولة الإمارات:**

⚠️ **ضريبة القيمة المضافة:**
• التأخير في التقديم: 1,000 درهم
• عدم التسجيل: 10,000 درهم
• السجلات غير الصحيحة: 3,000 درهم

⚠️ **ضريبة دخل الشركات:**
• التأخير في التقديم: حتى 10,000 درهم
• عدم التسجيل: 10,000 درهم
• التقديم غير الصحيح: 50,000 درهم

**تجنب الغرامات:** استخدم تذكيرات بيرجوس الذكية لضمان التقديم في الوقت المحدد.` :
        `**UAE Tax Penalties:**

⚠️ **VAT Penalties:**
• Late filing: AED 1,000
• Failure to register: AED 10,000
• Incorrect records: AED 3,000

⚠️ **CIT Penalties:**
• Late filing: Up to AED 10,000
• Failure to register: AED 10,000
• Incorrect filing: AED 50,000

**Avoid Penalties:** Use Peergos smart reminders to ensure timely compliance.`;
    }

    // Generic helpful response
    return language === 'ar' ?
      `شكراً لسؤالك! بينما أعمل على تحسين فهمي لهذا الموضوع، يمكنني مساعدتك في:

• أسئلة ضريبة القيمة المضافة والمدخلات المخصومة
• متطلبات ضريبة دخل الشركات والإعفاءات
• مواعيد التقديم والامتثال
• المصاريف المخصومة للأعمال
• متطلبات التسجيل الضريبي

هل يمكنك إعادة صياغة سؤالك أو تجربة أحد هذه المواضيع؟` :
      `Thank you for your question! While I'm working on improving my understanding of this topic, I can help you with:

• VAT questions and input tax recovery
• CIT requirements and small business relief
• Filing deadlines and compliance
• Business expense deductibility
• Tax registration requirements

Could you rephrase your question or try one of these topics?`;
  }, [company]);

  const sendMessage = useCallback(async (content: string, language: 'en' | 'ar' = 'en') => {
    if (!currentSession) return;

    setIsLoading(true);

    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content,
        timestamp: new Date(),
        language,
      };

      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
      };
      setCurrentSession(updatedSession);

      // Generate AI response
      const aiResponse = await generateMockResponse(content, language);
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        language,
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
      };
      
      setCurrentSession(finalSession);
      
      // Update sessions list
      setSessions(prev => {
        const existing = prev.find(s => s.id === finalSession.id);
        if (existing) {
          return prev.map(s => s.id === finalSession.id ? finalSession : s);
        }
        return [...prev, finalSession];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: language === 'ar' ? 
          'عذراً، حدث خطأ في معالجة رسالتك. يرجى المحاولة مرة أخرى.' :
          'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date(),
        language,
      };

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage],
      } : null);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, generateMockResponse]);

  const rateSession = useCallback((sessionId: string, rating: number, feedback?: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, rating, feedback }
        : session
    ));

    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, rating, feedback } : null);
    }

    // In production, this would send to analytics/feedback API
    console.log('Session feedback:', { sessionId, rating, feedback });
  }, [currentSession]);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    createNewSession,
    sendMessage,
    rateSession,
    clearSession,
  };
};