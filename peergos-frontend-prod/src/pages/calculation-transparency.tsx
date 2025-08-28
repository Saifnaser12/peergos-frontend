import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Download, 
  History, 
  BarChart3, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import CalculationBreakdown from '@/components/calculation/calculation-breakdown';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AuditRecord {
  id: number;
  calculationType: string;
  calculationVersion: string;
  timestamp: string;
  finalResult: any;
  methodUsed: string;
  status: string;
  validatedAt?: string;
  validatedBy?: number;
}

interface CalculationFilter {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  searchTerm?: string;
}

export default function CalculationTransparencyPage() {
  const [activeTab, setActiveTab] = useState('audit-trail');
  const [selectedCalculation, setSelectedCalculation] = useState<AuditRecord | null>(null);
  const [filters, setFilters] = useState<CalculationFilter>({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const { toast } = useToast();


  // Fetch audit trail data
  const { data: auditTrail, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/calculation-audit/trail', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status) params.append('status', filters.status);
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      
      return apiRequest(`/api/calculation-audit/trail?${params}`);
    }
  });

  // Fetch audit statistics
  const { data: auditStats } = useQuery({
    queryKey: ['/api/calculation-audit/stats'],
    queryFn: () => apiRequest('/api/calculation-audit/stats')
  });

  // Fetch calculation breakdown
  const { data: calculationBreakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['/api/calculation-audit/breakdown', selectedCalculation?.id],
    queryFn: () => apiRequest(`/api/calculation-audit/breakdown/${selectedCalculation?.id}`),
    enabled: !!selectedCalculation?.id
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async ({ reportId, format }: { reportId: number; format: string }) => {
      return apiRequest('/api/calculation-audit/export', {
        method: 'POST',
        body: JSON.stringify({ reportId, format, includeBreakdown: true })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Export Started",
        description: `Your ${data.format} export is being prepared. Download link: ${data.downloadUrl}`,
      });
      // Open download link
      window.open(data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export calculation details",
        variant: "destructive",
      });
    }
  });

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: async (auditTrailId: number) => {
      return apiRequest(`/api/calculation-audit/validate/${auditTrailId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Calculation Validated",
        description: "The calculation has been successfully validated for audit compliance.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calculation-audit/trail'] });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate calculation",
        variant: "destructive",
      });
    }
  });

  const handleExport = (format: string) => {
    if (selectedCalculation) {
      exportMutation.mutate({ reportId: selectedCalculation.id, format });
    }
  };

  const handleValidate = () => {
    if (selectedCalculation) {
      validateMutation.mutate(selectedCalculation.id);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string, validatedAt?: string) => {
    if (validatedAt) {
      return <Badge className="bg-green-100 text-green-800">Validated</Badge>;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'SUPERSEDED':
        return <Badge variant="secondary">Superseded</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Calculation Transparency & Audit Trail | Peergos</title>
        <meta 
          name="description" 
          content="Comprehensive calculation transparency with detailed audit trails, breakdown analysis, and export capabilities for UAE tax compliance."
        />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Calculation Transparency
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Detailed audit trails, calculation breakdowns, and compliance reporting
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => handleExport('PDF')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            {auditStats && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold">{auditStats.totalCalculations}</div>
                        <div className="text-sm text-gray-600">Total Calculations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold">{auditStats.calculationsThisMonth}</div>
                        <div className="text-sm text-gray-600">This Month</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold">{auditStats.complianceRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Compliance Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <History className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold">{auditStats.amendmentRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Amendment Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div>
                        <div className="text-2xl font-bold">{auditStats.pendingValidations}</div>
                        <div className="text-sm text-gray-600">Pending Validation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
                <TabsTrigger value="breakdown">Calculation Details</TabsTrigger>
                <TabsTrigger value="reports">Summary Reports</TabsTrigger>
                <TabsTrigger value="amendments">Amendments</TabsTrigger>
              </TabsList>

              {/* Audit Trail Tab */}
              <TabsContent value="audit-trail" className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter Calculations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <Label htmlFor="type-filter">Calculation Type</Label>
                        <Select value={filters.type || ''} onValueChange={(value) => setFilters({...filters, type: value || undefined})}>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Types</SelectItem>
                            <SelectItem value="VAT">VAT</SelectItem>
                            <SelectItem value="CIT">Corporate Tax</SelectItem>
                            <SelectItem value="WITHHOLDING_TAX">Withholding Tax</SelectItem>
                            <SelectItem value="TRANSFER_PRICING">Transfer Pricing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="date-from">Date From</Label>
                        <Input
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={(e) => setFilters({...filters, dateFrom: e.target.value || undefined})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="date-to">Date To</Label>
                        <Input
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={(e) => setFilters({...filters, dateTo: e.target.value || undefined})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="status-filter">Status</Label>
                        <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value || undefined})}>
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="SUPERSEDED">Superseded</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="search">Search</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search calculations..."
                            className="pl-10"
                            value={filters.searchTerm || ''}
                            onChange={(e) => setFilters({...filters, searchTerm: e.target.value || undefined})}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Trail List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Calculation History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {auditLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {auditTrail?.map((record: AuditRecord) => (
                          <div 
                            key={record.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedCalculation(record);
                              setActiveTab('breakdown');
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold">
                                {record.calculationType.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-medium">{record.calculationType} Calculation</h4>
                                <p className="text-sm text-gray-600">
                                  {record.methodUsed} • {new Date(record.timestamp).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">Version: {record.calculationVersion}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(record.finalResult?.totalAmount || 0, record.finalResult?.currency)}
                                </div>
                                <div className="text-sm text-gray-600">{record.finalResult?.method}</div>
                              </div>
                              {getStatusBadge(record.status, record.validatedAt)}
                            </div>
                          </div>
                        ))}
                        
                        {auditTrail?.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No calculations found matching your criteria
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Breakdown Tab */}
              <TabsContent value="breakdown" className="space-y-6">
                {selectedCalculation ? (
                  <div className="space-y-6">
                    <Alert>
                      <Calculator className="h-4 w-4" />
                      <AlertDescription>
                        Viewing detailed breakdown for {selectedCalculation.calculationType} calculation 
                        (ID: {selectedCalculation.id}) performed on {new Date(selectedCalculation.timestamp).toLocaleString()}
                      </AlertDescription>
                    </Alert>

                    {breakdownLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : calculationBreakdown ? (
                      <CalculationBreakdown
                        calculation={calculationBreakdown.calculation}
                        auditTrailId={selectedCalculation.id}
                        showExportOptions={true}
                        allowAmendments={true}
                        onExport={handleExport}
                        onValidate={handleValidate}
                      />
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                          Calculation breakdown not available
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Calculation Selected</h3>
                      <p className="text-gray-600">
                        Select a calculation from the audit trail to view its detailed breakdown
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Summary Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Summary Reports</h3>
                      <p className="text-gray-600 mb-4">
                        Generate comprehensive calculation summary reports for specific periods
                      </p>
                      <Button>
                        Generate Monthly Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Amendments Tab */}
              <TabsContent value="amendments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Amendment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Amendment Tracking</h3>
                      <p className="text-gray-600">
                        Track all calculation amendments and corrections with full audit trail
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}