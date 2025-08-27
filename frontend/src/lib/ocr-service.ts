import { createWorker } from 'tesseract.js';

export interface ExtractedInvoiceData {
  supplierName: string;
  trn?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  vatAmount?: number;
  netAmount?: number;
  currency?: string;
  description?: string;
  confidence: number;
  rawText: string;
}

export interface UAE_BusinessRules {
  supplierName: string;
  category: string;
  vatEligible: boolean;
  confidence: number;
  keywords: string[];
}

// UAE-specific business entities and keywords
const UAE_BUSINESS_ENTITIES = {
  utilities: {
    keywords: ['taqa', 'dewa', 'adwea', 'sewa', 'fewa', 'electricity', 'water', 'utility', 'power'],
    entities: ['Abu Dhabi National Energy Company', 'Dubai Electricity & Water Authority', 'Sharjah Electricity & Water Authority'],
    category: 'Utilities',
    vatEligible: true,
  },
  telecom: {
    keywords: ['etisalat', 'du', 'emirates telecom', 'telecommunication', 'internet', 'mobile'],
    entities: ['Emirates Telecommunications Corporation', 'Emirates Integrated Telecommunications Company'],
    category: 'Telecommunications',
    vatEligible: true,
  },
  payroll: {
    keywords: ['wps', 'salary', 'wages', 'payroll', 'ministry of labour', 'mol', 'mohre', 'central bank'],
    entities: ['Ministry of Human Resources and Emiratisation', 'Central Bank of UAE'],
    category: 'Payroll & HR',
    vatEligible: false,
  },
  government: {
    keywords: ['municipality', 'ministry', 'federal', 'government', 'authority', 'customs', 'immigration'],
    entities: ['Dubai Municipality', 'Abu Dhabi Municipality', 'Federal Authority'],
    category: 'Government Fees',
    vatEligible: false,
  },
  banks: {
    keywords: ['bank', 'emirates nbd', 'adcb', 'fab', 'mashreq', 'banking', 'finance'],
    entities: ['Emirates NBD', 'Abu Dhabi Commercial Bank', 'First Abu Dhabi Bank', 'Mashreq Bank'],
    category: 'Banking & Finance',
    vatEligible: true,
  },
  transport: {
    keywords: ['salik', 'toll', 'parking', 'transport', 'taxi', 'metro', 'bus'],
    entities: ['Salik Company', 'Dubai Taxi Corporation', 'Roads and Transport Authority'],
    category: 'Transportation',
    vatEligible: true,
  },
  fuel: {
    keywords: ['adnoc', 'emarat', 'fuel', 'petrol', 'diesel', 'gas station'],
    entities: ['Abu Dhabi National Oil Company', 'Emarat'],
    category: 'Fuel & Energy',
    vatEligible: true,
  },
};

export class ExpenseRecognitionService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.worker = await createWorker('eng+ara', 1, {
        logger: m => console.log('OCR:', m)
      });
      
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,- /:()[]{}أبتثجحخدذرزسشصضطظعغفقكلمنهويةئآ',
        preserve_interword_spaces: '1',
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR initialization failed');
    }
  }

  async extractFromImage(imageFile: File): Promise<ExtractedInvoiceData> {
    if (!this.worker) {
      await this.initialize();
    }

    try {
      const { data: { text, confidence } } = await this.worker!.recognize(imageFile);
      return this.parseInvoiceText(text, confidence);
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async extractFromPDF(pdfFile: File): Promise<ExtractedInvoiceData> {
    // For PDF processing, we would typically convert to image first
    // This is a simplified implementation - in production, use PDF.js or similar
    throw new Error('PDF processing not yet implemented. Please convert PDF to image format.');
  }

  private parseInvoiceText(text: string, confidence: number): ExtractedInvoiceData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      supplierName: this.extractSupplierName(text),
      trn: this.extractTRN(text),
      invoiceNumber: this.extractInvoiceNumber(text),
      invoiceDate: this.extractDate(text),
      totalAmount: this.extractAmount(text, ['total', 'amount due', 'grand total', 'invoice total']),
      vatAmount: this.extractAmount(text, ['vat', 'tax', '5%', 'value added tax']),
      netAmount: this.extractAmount(text, ['net', 'subtotal', 'sub total', 'net amount']),
      currency: this.extractCurrency(text),
      description: this.extractDescription(lines),
      confidence,
      rawText: text,
    };
  }

  private extractSupplierName(text: string): string {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for company-like patterns in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Skip obvious non-company lines
      if (line.match(/^\d+$/) || line.match(/^(invoice|receipt|bill)/i)) continue;
      
      // Look for lines that contain company indicators
      if (line.match(/(company|corp|llc|ltd|l\.l\.c|corporation|establishment|trading|services|group)/i)) {
        return line;
      }
      
      // If it's a reasonably long line that's not obviously data, consider it
      if (line.length > 10 && line.length < 100 && !line.match(/^\d+[\d\s\.,]+$/)) {
        return line;
      }
    }
    
    return lines[0] || 'Unknown Supplier';
  }

  private extractTRN(text: string): string | undefined {
    // UAE TRN is 15 digits
    const trnMatch = text.match(/(?:TRN|Tax Registration|Registration Number)[\s:]*(\d{15})/i);
    if (trnMatch) return trnMatch[1];
    
    // Look for 15-digit numbers
    const digitMatch = text.match(/\b\d{15}\b/);
    return digitMatch ? digitMatch[0] : undefined;
  }

  private extractInvoiceNumber(text: string): string | undefined {
    const patterns = [
      /(?:invoice|inv|receipt|bill)[\s#:]*([A-Z0-9\-]+)/i,
      /#([A-Z0-9\-]+)/,
      /(?:no|number)[\s:]*([A-Z0-9\-]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    
    return undefined;
  }

  private extractDate(text: string): string | undefined {
    const patterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
      /(\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
      /(?:date|dated)[\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // Attempt to parse and standardize the date
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          // If parsing fails, return the raw match
          return match[1];
        }
      }
    }
    
    return undefined;
  }

  private extractAmount(text: string, keywords: string[]): number | undefined {
    for (const keyword of keywords) {
      const patterns = [
        new RegExp(`${keyword}[\\s:]*([\\d,]+\\.\\d{2})`, 'i'),
        new RegExp(`${keyword}[\\s:]*([\\d,]+)`, 'i'),
        new RegExp(`([\\d,]+\\.\\d{2})[\\s]*${keyword}`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(amount)) return amount;
        }
      }
    }
    
    return undefined;
  }

  private extractCurrency(text: string): string {
    if (text.match(/AED|dirham/i)) return 'AED';
    if (text.match(/USD|\$/)) return 'USD';
    if (text.match(/EUR|€/)) return 'EUR';
    return 'AED'; // Default for UAE
  }

  private extractDescription(lines: string[]): string {
    // Look for description or item lines
    const descriptionLines = lines.filter(line => {
      const lower = line.toLowerCase();
      return line.length > 10 && 
             !lower.match(/^(invoice|receipt|total|vat|tax|amount|date|trn)/i) &&
             !line.match(/^\d+[\d\s\.,]+$/) &&
             !line.match(/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/);
    });
    
    return descriptionLines.slice(0, 3).join(' | ') || 'Service/Product';
  }

  // Business rule mapping
  applyBusinessRules(supplierName: string, extractedData: ExtractedInvoiceData): UAE_BusinessRules {
    const normalizedSupplier = supplierName.toLowerCase();
    
    for (const [category, rules] of Object.entries(UAE_BUSINESS_ENTITIES)) {
      // Check exact entity matches
      for (const entity of rules.entities) {
        if (normalizedSupplier.includes(entity.toLowerCase())) {
          return {
            supplierName: entity,
            category: rules.category,
            vatEligible: rules.vatEligible,
            confidence: 0.95,
            keywords: [entity],
          };
        }
      }
      
      // Check keyword matches
      const matchedKeywords = rules.keywords.filter(keyword => 
        normalizedSupplier.includes(keyword)
      );
      
      if (matchedKeywords.length > 0) {
        const confidence = matchedKeywords.length / rules.keywords.length;
        return {
          supplierName,
          category: rules.category,
          vatEligible: rules.vatEligible,
          confidence: Math.min(0.9, confidence * 0.8 + 0.1),
          keywords: matchedKeywords,
        };
      }
    }
    
    // Default categorization
    return {
      supplierName,
      category: 'General Expenses',
      vatEligible: true, // Conservative assumption for UAE business expenses
      confidence: 0.1,
      keywords: [],
    };
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const expenseRecognitionService = new ExpenseRecognitionService();