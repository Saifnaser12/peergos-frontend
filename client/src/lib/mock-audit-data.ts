export const mockAuditTrail = {
  calculationId: 'CALC-2025-001',
  type: 'VAT' as const,
  companyId: 1,
  period: '2025-01',
  totalAmount: 50000,
  steps: [
    {
      step: 1,
      description: 'Calculate Total Taxable Supplies',
      calculation: 'AED 1,000,000 (Standard Rated Supplies)',
      amount: 1000000,
      notes: 'All standard-rated supplies for the period',
      regulation: 'UAE VAT Law Article 25'
    },
    {
      step: 2,
      description: 'Apply UAE VAT Rate',
      calculation: 'AED 1,000,000 × 5% = AED 50,000',
      amount: 50000,
      notes: 'Standard VAT rate applied',
      regulation: 'UAE VAT Law Article 26'
    },
    {
      step: 3,
      description: 'Deduct Input VAT',
      calculation: 'AED 50,000 - AED 0 = AED 50,000',
      amount: 50000,
      notes: 'No input VAT to deduct for this period',
      regulation: 'UAE VAT Law Article 55'
    }
  ],
  metadata: {
    calculatedAt: new Date().toISOString(),
    calculatedBy: 1,
    inputs: {
      standardRatedSupplies: 1000000,
      zeroRatedSupplies: 0,
      exemptSupplies: 0,
      inputVAT: 0
    },
    regulations: [
      'UAE VAT Law Article 25 - Taxable Supplies',
      'UAE VAT Law Article 26 - Standard Rate',
      'UAE VAT Law Article 55 - Input Tax'
    ],
    version: '1.0.0'
  }
};

export const mockTaxConfig = {
  uaeTaxConfig: {
    vat: {
      standardRate: 0.05,
      zeroRatedSupplies: [
        'International transportation',
        'Exports outside GCC',
        'Investment-grade precious metals',
        'Newly constructed residential properties (first supply within 3 years)',
        'Educational services',
        'Healthcare services'
      ],
      exemptSupplies: [
        'Residential properties',
        'Bare land',
        'Local passenger transport',
        'Financial services'
      ]
    },
    cit: {
      standardRate: 0.09,
      smallBusinessThreshold: 3000000,
      smallBusinessRate: 0,
      qfzpRate: 0,
      minimumTax: 0
    },
    thresholds: {
      vatRegistrationMandatory: 375000,
      vatRegistrationVoluntary: 187500
    }
  },
  lastUpdated: new Date().toISOString(),
  version: '2025.1',
  regulations: {
    vat: {
      law: 'Federal Decree-Law No. 8 of 2017',
      effectiveDate: '2018-01-01',
      lastAmendment: '2024-01-01'
    },
    cit: {
      law: 'Federal Decree-Law No. 47 of 2022',
      effectiveDate: '2023-06-01',
      lastAmendment: '2024-01-01'
    }
  }
};

export const mockCalculationHistory = [
  {
    id: 'CALC-2025-001',
    type: 'VAT',
    period: '2025-01',
    amount: 50000,
    status: 'completed',
    calculatedAt: new Date('2025-01-31').toISOString()
  },
  {
    id: 'CALC-2024-012',
    type: 'VAT',
    period: '2024-12',
    amount: 48500,
    status: 'completed',
    calculatedAt: new Date('2024-12-31').toISOString()
  },
  {
    id: 'CALC-2024-011',
    type: 'CIT',
    period: '2024-Q4',
    amount: 135000,
    status: 'completed',
    calculatedAt: new Date('2024-12-31').toISOString()
  }
];
