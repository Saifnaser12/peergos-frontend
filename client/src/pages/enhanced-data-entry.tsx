import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  PlusCircle, Upload, TrendingUp, BarChart3, CheckCircle2, Clock, FileText, Download
} from 'lucide-react';
import EnhancedTransactionForm from '@/components/forms/enhanced-transaction-form';
import DataImport from '@/components/forms/data-import';
import POSIntegrationPanel from '@/components/integrations/pos-integration-panel';

interface DataEntryStats {
  totalTransactions: number;
  pendingValidation: number;
  lastImport: string;
  completionRate: number;
}

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray-200/80', className)} />;
}

const CHIP_STYLES = [
  { bg: 'rgba(14,159,110,0.10)', color: '#0E9F6E', Icon: FileText },
  { bg: 'rgba(180,83,9,0.10)',   color: '#B45309', Icon: Clock },
  { bg: 'rgba(14,159,110,0.10)', color: '#0E9F6E', Icon: CheckCircle2 },
  { bg: 'rgba(124,58,237,0.10)', color: '#7C3AED', Icon: TrendingUp },
];

export default function EnhancedDataEntry() {
  const [activeTab, setActiveTab] = useState('manual-entry');
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<DataEntryStats>({
    queryKey: ['/api/data-import/stats'],
    retry: false,
  });

  const handleTransactionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/data-import/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
  };

  const handleImportComplete = (_result: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/data-import/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
  };

  const statCards = [
    { label: 'Total Transactions', value: statsLoading ? null : String(stats?.totalTransactions ?? 0), ...CHIP_STYLES[0] },
    { label: 'Pending Validation', value: statsLoading ? null : String(stats?.pendingValidation ?? 0), ...CHIP_STYLES[1] },
    { label: 'Completion Rate',    value: statsLoading ? null : `${stats?.completionRate ?? 0}%`, ...CHIP_STYLES[2] },
    { label: 'Last Import',        value: statsLoading ? null : (stats?.lastImport ? new Date(stats.lastImport).toLocaleDateString('en-AE') : 'Never'), ...CHIP_STYLES[3] },
  ];

  const navyBtn = {
    style: { backgroundColor: '#0A3A5C' },
    onMouseEnter: (e: any) => (e.currentTarget.style.backgroundColor = '#0D4A75'),
    onMouseLeave: (e: any) => (e.currentTarget.style.backgroundColor = '#0A3A5C'),
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Data Entry</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Advanced data entry with real-time validation and bulk import
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, bg, color, Icon }) => (
          <Card key={label} className="rounded-xl border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
                  {value === null
                    ? <Shimmer className="h-8 w-20 mt-2" />
                    : <p className="text-[26px] font-bold text-gray-900 tabular-nums mt-1">{value}</p>
                  }
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3" style={{ backgroundColor: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3 border-b border-[#E5EAF0]">
          <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            Data Entry Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-gray-100/70 p-1 rounded-xl h-auto w-full grid grid-cols-3 mb-5">
              {[
                { value: 'manual-entry',    Icon: PlusCircle, label: 'Manual Entry' },
                { value: 'bulk-import',     Icon: Upload,     label: 'Bulk Import' },
                { value: 'pos-integration', Icon: FileText,   label: 'POS Integration' },
              ].map(({ value, Icon, label }) => (
                <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 rounded-lg text-[12px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold py-2">
                  <Icon className="h-3.5 w-3.5" />{label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="manual-entry" className="space-y-4">
              <Alert className="border-[#E5EAF0] bg-[#F6F8FA]">
                <CheckCircle2 className="h-4 w-4" style={{ color: '#0E9F6E' }} />
                <AlertDescription className="text-[13px] text-gray-600">
                  <strong className="text-gray-800">Enhanced Manual Entry</strong> — Real-time UAE business rule validation, auto-calculated VAT (5%), smart category suggestions.
                </AlertDescription>
              </Alert>
              <EnhancedTransactionForm onSuccess={handleTransactionSuccess} />
            </TabsContent>

            <TabsContent value="bulk-import" className="space-y-4">
              <Alert className="border-[#E5EAF0] bg-[#F6F8FA]">
                <Upload className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-[13px] text-gray-600">
                  <strong className="text-gray-800">Bulk Import</strong> — CSV, XLS, XLSX up to 10 MB. Preview before import with comprehensive validation and error reporting.
                </AlertDescription>
              </Alert>
              <DataImport onImportComplete={handleImportComplete} />
            </TabsContent>

            <TabsContent value="pos-integration">
              <POSIntegrationPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
        <CardHeader className="px-5 pt-5 pb-3 border-b border-[#E5EAF0]">
          <CardTitle className="text-[15px] font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 border-[#E5EAF0] hover:border-[#0A3A5C]/30 hover:bg-gray-50 text-left justify-start"
              onClick={() => setActiveTab('manual-entry')}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(14,159,110,0.10)' }}>
                <PlusCircle className="h-4 w-4" style={{ color: '#0E9F6E' }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Add Transaction</p>
                <p className="text-[11px] text-gray-500">Single transaction with validation</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 border-[#E5EAF0] hover:border-[#0A3A5C]/30 hover:bg-gray-50 text-left justify-start"
              onClick={() => setActiveTab('bulk-import')}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.10)' }}>
                <Upload className="h-4 w-4" style={{ color: '#2563EB' }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Bulk Import</p>
                <p className="text-[11px] text-gray-500">Import multiple records from files</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-3 h-auto p-4 border-[#E5EAF0] hover:border-[#0A3A5C]/30 hover:bg-gray-50 text-left justify-start"
              onClick={() => {
                const csv = `date,description,amount,type,category,vat_amount,reference,notes\n2025-01-15,Office supplies,500.00,EXPENSE,Office Supplies,25.00,REF001,Monthly supplies\n2025-01-16,Client payment,5000.00,REVENUE,Sales Revenue,250.00,INV001,Payment received`;
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'transaction_example.csv';
                document.body.appendChild(a); a.click();
                document.body.removeChild(a); window.URL.revokeObjectURL(url);
              }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(124,58,237,0.10)' }}>
                <Download className="h-4 w-4" style={{ color: '#7C3AED' }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Download Template</p>
                <p className="text-[11px] text-gray-500">Get example CSV format</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
