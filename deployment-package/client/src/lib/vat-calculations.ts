import { formatCurrency } from './business-logic';

export interface VAT201Data {
  // Section 1: Standard-rated supplies (5%)
  standardRatedSupplies: {
    totalValue: number;
    vatAmount: number;
  };
  
  // Section 2: Zero-rated supplies
  zeroRatedSupplies: {
    totalValue: number;
    vatAmount: number; // Always 0
  };
  
  // Section 3: Exempt supplies
  exemptSupplies: {
    totalValue: number;
    vatAmount: number; // Always 0
  };
  
  // Section 4: Reverse charge supplies
  reverseChargeSupplies: {
    totalValue: number;
    vatAmount: number;
  };
  
  // Section 5: Adjustments & corrections
  adjustments: {
    increaseInVAT: number;
    decreaseInVAT: number;
    netAdjustment: number;
  };
  
  // Section 6: Input VAT
  inputVAT: {
    standardRatedPurchases: number;
    capitalGoods: number;
    corrections: number;
    totalClaimable: number;
  };
  
  // Calculations
  totalOutputVAT: number;
  totalInputVAT: number;
  netVATPayable: number; // Positive = payable, Negative = refund
  
  // Return period
  period: {
    startDate: string;
    endDate: string;
    returnPeriod: string; // e.g., "2025-Q1"
  };
  
  // Metadata
  submissionDate?: string;
  status: 'draft' | 'submitted' | 'filed' | 'overdue';
  returnNumber?: string;
}

export interface VATSupply {
  id: string;
  description: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplyValue: number;
  vatRate: number;
  vatAmount: number;
  supplyType: 'standard' | 'zero-rated' | 'exempt' | 'reverse-charge';
}

export interface VATPurchase {
  id: string;
  description: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  purchaseValue: number;
  vatRate: number;
  vatAmount: number;
  claimable: boolean;
  category: 'standard' | 'capital-goods' | 'non-claimable';
}

export class VAT201Calculator {
  private supplies: VATSupply[];
  private purchases: VATPurchase[];
  private adjustments: VAT201Data['adjustments'];

  constructor(
    supplies: VATSupply[] = [],
    purchases: VATPurchase[] = [],
    adjustments: VAT201Data['adjustments'] = { increaseInVAT: 0, decreaseInVAT: 0, netAdjustment: 0 }
  ) {
    this.supplies = supplies;
    this.purchases = purchases;
    this.adjustments = adjustments;
  }

  calculateVAT201(periodStart: string, periodEnd: string): VAT201Data {
    // Filter supplies and purchases for the period
    const periodSupplies = this.supplies.filter(s => 
      new Date(s.invoiceDate) >= new Date(periodStart) && 
      new Date(s.invoiceDate) <= new Date(periodEnd)
    );
    
    const periodPurchases = this.purchases.filter(p => 
      new Date(p.invoiceDate) >= new Date(periodStart) && 
      new Date(p.invoiceDate) <= new Date(periodEnd)
    );

    // Calculate standard-rated supplies (5%)
    const standardSupplies = periodSupplies.filter(s => s.supplyType === 'standard');
    const standardRatedSupplies = {
      totalValue: standardSupplies.reduce((sum, s) => sum + s.supplyValue, 0),
      vatAmount: standardSupplies.reduce((sum, s) => sum + s.vatAmount, 0),
    };

    // Calculate zero-rated supplies
    const zeroSupplies = periodSupplies.filter(s => s.supplyType === 'zero-rated');
    const zeroRatedSupplies = {
      totalValue: zeroSupplies.reduce((sum, s) => sum + s.supplyValue, 0),
      vatAmount: 0,
    };

    // Calculate exempt supplies
    const exemptSuppliesData = periodSupplies.filter(s => s.supplyType === 'exempt');
    const exemptSupplies = {
      totalValue: exemptSuppliesData.reduce((sum, s) => sum + s.supplyValue, 0),
      vatAmount: 0,
    };

    // Calculate reverse charge supplies
    const reverseSupplies = periodSupplies.filter(s => s.supplyType === 'reverse-charge');
    const reverseChargeSupplies = {
      totalValue: reverseSupplies.reduce((sum, s) => sum + s.supplyValue, 0),
      vatAmount: reverseSupplies.reduce((sum, s) => sum + s.vatAmount, 0),
    };

    // Calculate input VAT
    const standardPurchases = periodPurchases.filter(p => p.category === 'standard' && p.claimable);
    const capitalGoodsPurchases = periodPurchases.filter(p => p.category === 'capital-goods' && p.claimable);
    
    const inputVAT = {
      standardRatedPurchases: standardPurchases.reduce((sum, p) => sum + p.vatAmount, 0),
      capitalGoods: capitalGoodsPurchases.reduce((sum, p) => sum + p.vatAmount, 0),
      corrections: 0, // Would come from manual adjustments
      totalClaimable: 0,
    };
    inputVAT.totalClaimable = inputVAT.standardRatedPurchases + inputVAT.capitalGoods + inputVAT.corrections;

    // Calculate totals
    const totalOutputVAT = 
      standardRatedSupplies.vatAmount + 
      reverseChargeSupplies.vatAmount + 
      this.adjustments.increaseInVAT - 
      this.adjustments.decreaseInVAT;

    const totalInputVAT = inputVAT.totalClaimable;
    const netVATPayable = totalOutputVAT - totalInputVAT;

    // Determine status
    const now = new Date();
    const endDate = new Date(periodEnd);
    const filingDeadline = new Date(endDate);
    filingDeadline.setMonth(filingDeadline.getMonth() + 1);
    filingDeadline.setDate(28); // VAT returns due by 28th of following month

    let status: VAT201Data['status'] = 'draft';
    if (now > filingDeadline) {
      status = 'overdue';
    }

    return {
      standardRatedSupplies,
      zeroRatedSupplies,
      exemptSupplies,
      reverseChargeSupplies,
      adjustments: this.adjustments,
      inputVAT,
      totalOutputVAT,
      totalInputVAT,
      netVATPayable,
      period: {
        startDate: periodStart,
        endDate: periodEnd,
        returnPeriod: this.formatReturnPeriod(periodStart, periodEnd),
      },
      status,
    };
  }

  private formatReturnPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    
    // Determine quarter
    if (month <= 3) return `${year}-Q1`;
    if (month <= 6) return `${year}-Q2`;
    if (month <= 9) return `${year}-Q3`;
    return `${year}-Q4`;
  }

  // Generate UAE-specific VAT categories
  static getUAEVATCategories() {
    return {
      standardRated: {
        rate: 5,
        description: 'Standard-rated supplies',
        examples: ['Most goods and services', 'Restaurant meals', 'Hotel accommodation', 'Professional services'],
      },
      zeroRated: {
        rate: 0,
        description: 'Zero-rated supplies',
        examples: ['Exports', 'International transport', 'Certain medicines', 'Investment grade precious metals'],
      },
      exempt: {
        rate: 0,
        description: 'Exempt supplies',
        examples: ['Residential property sales', 'Certain financial services', 'Local passenger transport', 'Education'],
      },
      reverseCharge: {
        rate: 5,
        description: 'Reverse charge mechanism',
        examples: ['Digital services from abroad', 'Imported services', 'GCC supplies under specific conditions'],
      },
    };
  }

  // Validate VAT calculations
  static validateVAT201(data: VAT201Data): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if output VAT calculation is correct
    const expectedOutputVAT = 
      data.standardRatedSupplies.vatAmount + 
      data.reverseChargeSupplies.vatAmount + 
      data.adjustments.netAdjustment;

    if (Math.abs(data.totalOutputVAT - expectedOutputVAT) > 0.01) {
      errors.push('Output VAT calculation mismatch');
    }

    // Check if standard-rated VAT is approximately 5% of supply value
    const expectedStandardVAT = data.standardRatedSupplies.totalValue * 0.05;
    if (Math.abs(data.standardRatedSupplies.vatAmount - expectedStandardVAT) > 1) {
      errors.push('Standard-rated VAT should be 5% of supply value');
    }

    // Check if zero-rated and exempt supplies have no VAT
    if (data.zeroRatedSupplies.vatAmount !== 0 || data.exemptSupplies.vatAmount !== 0) {
      errors.push('Zero-rated and exempt supplies should have no VAT');
    }

    // Check if net VAT calculation is correct
    const expectedNetVAT = data.totalOutputVAT - data.totalInputVAT;
    if (Math.abs(data.netVATPayable - expectedNetVAT) > 0.01) {
      errors.push('Net VAT payable calculation mismatch');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate VAT201 XML for FTA submission (placeholder structure)
  static generateVAT201XML(data: VAT201Data, companyInfo: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<VAT201Return xmlns="http://fta.gov.ae/schemas/vat201" version="1.0">
  <Header>
    <TRN>${companyInfo.trn}</TRN>
    <CompanyName>${companyInfo.name}</CompanyName>
    <ReturnPeriod>${data.period.returnPeriod}</ReturnPeriod>
    <PeriodStart>${data.period.startDate}</PeriodStart>
    <PeriodEnd>${data.period.endDate}</PeriodEnd>
    <SubmissionDate>${data.submissionDate || new Date().toISOString()}</SubmissionDate>
  </Header>
  
  <OutputVAT>
    <StandardRatedSupplies>
      <SupplyValue>${data.standardRatedSupplies.totalValue}</SupplyValue>
      <VATAmount>${data.standardRatedSupplies.vatAmount}</VATAmount>
    </StandardRatedSupplies>
    <ZeroRatedSupplies>
      <SupplyValue>${data.zeroRatedSupplies.totalValue}</SupplyValue>
      <VATAmount>${data.zeroRatedSupplies.vatAmount}</VATAmount>
    </ZeroRatedSupplies>
    <ExemptSupplies>
      <SupplyValue>${data.exemptSupplies.totalValue}</SupplyValue>
      <VATAmount>${data.exemptSupplies.vatAmount}</VATAmount>
    </ExemptSupplies>
    <ReverseChargeSupplies>
      <SupplyValue>${data.reverseChargeSupplies.totalValue}</SupplyValue>
      <VATAmount>${data.reverseChargeSupplies.vatAmount}</VATAmount>
    </ReverseChargeSupplies>
    <Adjustments>
      <IncreaseInVAT>${data.adjustments.increaseInVAT}</IncreaseInVAT>
      <DecreaseInVAT>${data.adjustments.decreaseInVAT}</DecreaseInVAT>
    </Adjustments>
    <TotalOutputVAT>${data.totalOutputVAT}</TotalOutputVAT>
  </OutputVAT>
  
  <InputVAT>
    <StandardRatedPurchases>${data.inputVAT.standardRatedPurchases}</StandardRatedPurchases>
    <CapitalGoods>${data.inputVAT.capitalGoods}</CapitalGoods>
    <Corrections>${data.inputVAT.corrections}</Corrections>
    <TotalInputVAT>${data.totalInputVAT}</TotalInputVAT>
  </InputVAT>
  
  <Summary>
    <NetVATPayable>${data.netVATPayable}</NetVATPayable>
    <Status>${data.status}</Status>
  </Summary>
</VAT201Return>`;
  }
}