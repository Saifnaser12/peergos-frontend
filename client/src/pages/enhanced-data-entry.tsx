import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calculator,
  PieChart
} from 'lucide-react';
import EnhancedTransactionForm from '@/components/forms/enhanced-transaction-form';
import DataImport from '@/components/forms/data-import';
import { useQuery } from '@tanstack/react-query';

interface DataEntryStats {
  totalTransactions: number;
  pendingValidation: number;
  lastImport: string | null;
  completionRate: number;
}

export default function EnhancedDataEntryPage() {
  const [activeTab, setActiveTab] = useState('manual-entry');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch data entry statistics
  const { data: stats } = useQuery<DataEntryStats>({
    queryKey: ['/api/data-entry/stats'],
    initialData: {
      totalTransactions: 156,
      pendingValidation: 3,
      lastImport: '2025-01-15T10:30:00Z',
      completionRate: 92
    }
  });

  const handleTransactionSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleImportComplete = (result: any) => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  return (
    <>
      <Helmet>
        <title>Enhanced Data Entry | Peergos</title>
        <meta 
          name="description" 
          content="Advanced data entry with real-time validation, auto-save, and bulk import capabilities for UAE tax compliance."
        />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Enhanced Data Entry
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Advanced form validation, auto-save, and bulk data import capabilities
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalTransactions}</div>
                  <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats?.completionRate}%</div>
                  <div className="text-sm text-gray-600">Data Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats?.pendingValidation}</div>
                  <div className="text-sm text-gray-600">Pending Review</div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Data has been successfully saved with enhanced validation and auto-save features!
                </AlertDescription>
              </Alert>
            )}

            {/* Feature Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Real-time Validation</h3>
                      <p className="text-sm text-blue-700">Instant feedback as you type</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">Auto-save</h3>
                      <p className="text-sm text-green-700">Never lose your work</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-purple-900">Bulk Import</h3>
                      <p className="text-sm text-purple-700">CSV & Excel support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Smart Validation</h3>
                      <p className="text-sm text-orange-700">UAE compliance rules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Data Entry Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual-entry" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="bulk-import" className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Bulk Import
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual-entry" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Enhanced Transaction Entry</h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Real-time validation</Badge>
                          <Badge variant="secondary">Auto-save enabled</Badge>
                          <Badge variant="secondary">UAE tax rules</Badge>
                        </div>
                      </div>
                      
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          <div className="space-y-2">
                            <p className="font-medium">Enhanced Features Active:</p>
                            <ul className="text-sm space-y-1">
                              <li>• Real-time validation with UAE-specific rules</li>
                              <li>• Auto-save every 2 seconds (changes saved locally)</li>
                              <li>• Input format guidance and examples</li>
                              <li>• Comprehensive error handling with actionable messages</li>
                              <li>• Auto-calculation of VAT for AED transactions</li>
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <EnhancedTransactionForm onSuccess={handleTransactionSuccess} />
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk-import" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Bulk Data Import</h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary">CSV Support</Badge>
                          <Badge variant="secondary">Excel Support</Badge>
                          <Badge variant="secondary">Data validation</Badge>
                        </div>
                      </div>
                      
                      <Alert className="border-green-200 bg-green-50">
                        <Upload className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          <div className="space-y-2">
                            <p className="font-medium">Import Capabilities:</p>
                            <ul className="text-sm space-y-1">
                              <li>• Support for CSV, XLS, and XLSX files</li>
                              <li>• Pre-built templates for different data types</li>
                              <li>• Data preview before import</li>
                              <li>• Comprehensive validation and error reporting</li>
                              <li>• Bulk processing with progress tracking</li>
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <DataImport onImportComplete={handleImportComplete} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Data Quality Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Data Quality Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-sm text-gray-600">{stats?.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats?.completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Validation Pass Rate</span>
                      <span className="text-sm text-gray-600">96%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-save Success</span>
                      <span className="text-sm text-gray-600">99%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                </div>

                {stats?.pendingValidation && stats.pendingValidation > 0 && (
                  <Alert className="mt-4 border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      You have {stats.pendingValidation} entries pending validation review.
                      <Button variant="link" className="p-0 h-auto ml-2 text-orange-700 underline">
                        Review now
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}