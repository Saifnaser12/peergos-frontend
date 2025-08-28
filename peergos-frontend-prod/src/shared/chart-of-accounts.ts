export interface ChartOfAccount {
  id: string;
  accountCode: string;
  nameEn: string;
  nameAr: string;
  category: string;
  subcategory: string;
  accountType: string;
  vatTreatment: string;
  citRelevance: string;
  mandatoryForSME: boolean;
  description: string;
}

export const UAE_CHART_OF_ACCOUNTS: ChartOfAccount[] = [
  {
    id: '1',
    accountCode: '1010',
    nameEn: 'Bank Account',
    nameAr: 'الحساب المصرفي',
    category: 'ASSET',
    subcategory: 'CURRENT_ASSET',
    accountType: 'DEBIT',
    vatTreatment: 'EXEMPT',
    citRelevance: 'RELEVANT',
    mandatoryForSME: true,
    description: 'Primary business bank account'
  }
];