import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlusCircle, 
  Upload, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2,
  Clock,
  FileText,
  Download
} from 'lucide-react';
import EnhancedTransactionForm from '@/components/forms/enhanced-transaction-form';
import DataImport from '@/components/forms/data-import';

interface DataEntryStats {
  totalTransactions: number;
  pendingValidation: number;
  lastImport: string;
  completionRate: number;
}

export default function EnhancedDataEntry() {
  const [activeTab, setActiveTab] = useState('manual-entry');
  const queryClient = useQueryClient();

  // Fetch data entry statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DataEntryStats>({
    queryKey: ['/api/data-import/stats'],
    retry: false,
  });

  const handleTransactionSuccess = () => {
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/data-import/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
  };

  const handleImportComplete = (result: any) => {
    // Refresh stats and other relevant data
    queryClient.invalidateQueries({ queryKey: ['/api/data-import/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Data Entry</h1>
          <p className="text-gray-600 mt-1">
            Advanced data entry with real-time validation and bulk import capabilities
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : stats?.totalTransactions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Validation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : stats?.pendingValidation || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '-' : `${stats?.completionRate || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Import</p>
                <p className="text-sm font-bold text-gray-900">
                  {statsLoading ? '-' : stats?.lastImport ? 
                    new Date(stats.lastImport).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Entry Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual-entry" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Enhanced Manual Entry
              </TabsTrigger>
              <TabsTrigger value="bulk-import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Data Import
              </TabsTrigger>
            </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent value="manual-entry" className="space-y-6">
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Enhanced Manual Entry Features:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Real-time validation with UAE business rules</li>
                      <li>• Auto-calculated VAT (5% UAE rate)</li>
                      <li>• Auto-save functionality to prevent data loss</li>
                      <li>• Smart category suggestions</li>
                      <li>• Professional form validation with hints and examples</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <EnhancedTransactionForm onSuccess={handleTransactionSuccess} />
              </div>
            </TabsContent>

            {/* Bulk Import Tab */}
            <TabsContent value="bulk-import" className="space-y-6">
              <div className="space-y-4">
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Bulk Import Capabilities:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Support for CSV, XLS, and XLSX files (up to 10MB)</li>
                      <li>• Pre-built templates for transactions, invoices, and customers</li>
                      <li>• Data preview before import</li>
                      <li>• Comprehensive validation and error reporting</li>
                      <li>• Progress tracking and detailed import summaries</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <DataImport onImportComplete={handleImportComplete} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => setActiveTab('manual-entry')}
            >
              <PlusCircle className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Add Transaction</div>
                <div className="text-sm text-gray-600">Create single transaction with validation</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => setActiveTab('bulk-import')}
            >
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Bulk Import</div>
                <div className="text-sm text-gray-600">Import multiple records from files</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => {
                // Download example CSV
                const csvContent = `date,description,amount,type,category,vat_amount,reference,notes
2025-01-15,Office supplies,500.00,EXPENSE,Office Supplies,25.00,REF001,Monthly supplies
2025-01-16,Client payment,5000.00,REVENUE,Sales Revenue,250.00,INV001,Payment received`;
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'transaction_example.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Download Template</div>
                <div className="text-sm text-gray-600">Get example CSV format</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}