export interface KpiCard {
  label: string;
  value: string;
  change: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'primary' | 'success' | 'warning' | 'error';
}

export interface RecentTransaction {
  id: number;
  date: string;
  type: 'REVENUE' | 'EXPENSE' | 'VAT_FILING';
  description: string;
  amount: string;
  status: 'PROCESSED' | 'DRAFT' | 'PENDING';
}

export interface UpcomingDeadline {
  title: string;
  date: string;
  daysLeft: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface VatCalculation {
  period: string;
  totalSales: number;
  totalPurchases: number;
  outputVat: number;
  inputVat: number;
  netVatDue: number;
  calculatedAt: Date;
}

export interface CitCalculation {
  netIncome: number;
  citRate: number;
  smallBusinessRelief: number;
  taxableIncome: number;
  citDue: number;
  freeZoneApplied: boolean;
  calculatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number;
}

export interface Company {
  id: number;
  name: string;
  trn?: string;
  address?: string;
  phone?: string;
  email?: string;
  industry?: string;
  freeZone: boolean;
  vatRegistered: boolean;
  logoUrl?: string;
  primaryColor: string;
  language: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
  }[];
}
