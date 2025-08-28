import { createContext, useContext, useState, ReactNode } from 'react';

export interface TaxClassification {
  category: 'MICRO' | 'SMALL' | 'MEDIUM';
  citRequired: boolean;
  citRate: number;
  vatRequired: boolean;
  vatRate: number;
  financialBasis: 'CASH' | 'ACCRUAL';
  transferPricingRequired: boolean;
  badge: string;
  description: string;
  obligations: string[];
  annualRevenue: number;
  ftaReferences: {
    title: string;
    url: string;
    description: string;
  }[];
}

interface TaxClassificationContextType {
  classification: TaxClassification | null;
  setClassification: (classification: TaxClassification | null) => void;
  updateRevenue: (revenue: number) => void;
  isClassified: boolean;
}

const TaxClassificationContext = createContext<TaxClassificationContextType | undefined>(undefined);

interface TaxClassificationProviderProps {
  children: ReactNode;
}

export function TaxClassificationProvider({ children }: TaxClassificationProviderProps) {
  const [classification, setClassification] = useState<TaxClassification | null>(null);

  const updateRevenue = (revenue: number) => {
    if (classification) {
      setClassification({
        ...classification,
        annualRevenue: revenue
      });
    }
  };

  const isClassified = classification !== null;

  return (
    <TaxClassificationContext.Provider 
      value={{
        classification,
        setClassification,
        updateRevenue,
        isClassified
      }}
    >
      {children}
    </TaxClassificationContext.Provider>
  );
}

export function useTaxClassification() {
  const context = useContext(TaxClassificationContext);
  if (context === undefined) {
    throw new Error('useTaxClassification must be used within a TaxClassificationProvider');
  }
  return context;
}

// Utility function to classify business based on revenue
export function classifyBusinessByRevenue(revenue: number): TaxClassification {
  const baseClassification = {
    annualRevenue: revenue,
    ftaReferences: []
  };

  if (revenue < 375000) {
    return {
      ...baseClassification,
      category: 'MICRO',
      citRequired: true,
      citRate: 0,
      vatRequired: false,
      vatRate: 0,
      financialBasis: 'CASH',
      transferPricingRequired: false,
      badge: '0% CIT Only',
      description: 'Micro Business - CIT registration required, no VAT obligations',
      obligations: [
        'CIT registration within 3 months of exceeding threshold',
        'Annual CIT return filing (0% rate due to Small Business Relief)',
        'Cash basis financial statements acceptable',
        'Basic bookkeeping requirements',
        'No VAT registration required'
      ],
      ftaReferences: [
        {
          title: 'Corporate Tax Law - Small Business Relief',
          url: 'https://tax.gov.ae/en/corporate-tax',
          description: 'Small Business Relief provides 0% CIT rate for businesses with taxable income ≤ AED 375,000'
        }
      ]
    };
  } else if (revenue < 3000000) {
    return {
      ...baseClassification,
      category: 'SMALL',
      citRequired: true,
      citRate: 0,
      vatRequired: true,
      vatRate: 5,
      financialBasis: 'CASH',
      transferPricingRequired: false,
      badge: 'Small Business - Full Compliance',
      description: 'Small Business - VAT + CIT obligations with cash basis accounting',
      obligations: [
        'VAT registration mandatory (revenue > AED 375,000)',
        'Quarterly VAT returns filing',
        'CIT registration and annual returns (0% rate applies)',
        'Cash basis financial statements permitted',
        'VAT-compliant invoicing with QR codes',
        'Monthly/quarterly bookkeeping requirements'
      ],
      ftaReferences: [
        {
          title: 'VAT Registration Thresholds',
          url: 'https://tax.gov.ae/en/vat/registration',
          description: 'Mandatory VAT registration for businesses with annual revenue > AED 375,000'
        }
      ]
    };
  } else {
    return {
      ...baseClassification,
      category: 'MEDIUM',
      citRequired: true,
      citRate: 9,
      vatRequired: true,
      vatRate: 5,
      financialBasis: 'ACCRUAL',
      transferPricingRequired: true,
      badge: 'Medium Business - Enhanced Compliance',
      description: 'Medium Business - Full tax obligations with accrual accounting and transfer pricing',
      obligations: [
        'VAT registration and quarterly returns mandatory',
        'CIT registration with 9% rate (after AED 375K relief)',
        'Accrual basis financial statements required',
        'Transfer pricing documentation (if applicable)',
        'Enhanced bookkeeping and audit requirements',
        'Potential substance requirements for certain entities',
        'Country-by-Country reporting (if part of multinational group)'
      ],
      ftaReferences: [
        {
          title: 'Corporate Tax Rates',
          url: 'https://tax.gov.ae/en/corporate-tax/rates',
          description: '9% CIT rate applies to taxable income above AED 375,000'
        },
        {
          title: 'Transfer Pricing Rules',
          url: 'https://tax.gov.ae/en/corporate-tax/transfer-pricing',
          description: 'Transfer pricing documentation required for related party transactions'
        }
      ]
    };
  }
}