import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Gavel,
  TrendingUp,
  Eye,
  Download,
  History
} from 'lucide-react';

interface CalculationStep {
  step: number;
  description: string;
  calculation: string;
  amount: number;
  notes?: string;
  regulation?: string;
}

interface AuditTrail {
  calculationId: string;
  type: 'VAT' | 'CIT';
  companyId: number;
  period: string;
  totalAmount: number;
  steps: CalculationStep[];
  metadata: {
    calculatedAt: string;
    calculatedBy: number;
    inputs: Record<string, any>;
    regulations: string[];
    version: string;
  };
}

interface TaxConfig {
  uaeTaxConfig: {
    vat: {
      standardRate: number;
      zeroRatedSupplies: string[];
      exemptSupplies: string[];
    };
    cit: {
      standardRate: number;
      smallBusinessThreshold: number;
      smallBusinessRate: number;
      qfzpRate: number;
      minimumTax: number;
    };
    thresholds: {
      vatRegistrationMandatory: number;
      vatRegistrationVoluntary: number;
    };
  };
  lastUpdated: string;
  version: string;
  regulations: {
    vat: {
      law: string;
      effectiveDate: string;
      lastAmendment: string;
    };
    cit: {
      law: string;
      effectiveDate: string;
      lastAmendment: string;
    };
  };
}

export default function CalculationAudit() {
  const [selectedType, setSelectedType] = useState<'VAT' | 'CIT'>('VAT');
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');
  const [validationAmount, setValidationAmount] = useState('');
  const [activeTab, setActiveTab] = useState('audit-trail');

  // Fetch audit trail
  const { data: auditTrail, isLoading: auditLoading, refetch: refetchAudit } = useQuery<AuditTrail>({
    queryKey: ['/api/calculation-audit/audit', selectedType, selectedPeriod],
    enabled: !!(selectedType && selectedPeriod),
  });

  // Fetch calculation history
  const { data: history, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ['/api/calculation-audit/history', selectedType],
  });

  // Fetch tax configuration
  const { data: taxConfig, isLoading: configLoading } = useQuery<TaxConfig>({
    queryKey: ['/api/calculation-audit/config'],
  });

  const handleValidateCalculation = async () => {
    if (!validationAmount || !selectedType || !selectedPeriod) return;

    try {
      const response = await fetch('/api/calculation-audit/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          period: selectedPeriod,
          expectedAmount: parseFloat(validationAmount)
        })
      });

      const result = await response.json();
      
      // Handle validation result (you could show a toast or modal here)
      console.log('Validation result:', result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const downloadAuditReport = () => {
    if (!auditTrail) return;

    const reportContent = `
CALCULATION AUDIT REPORT
========================

Calculation ID: ${auditTrail.calculationId}
Type: ${auditTrail.type}
Period: ${auditTrail.period}
Total Amount: ${auditTrail.totalAmount.toFixed(2)} AED
Calculated At: ${new Date(auditTrail.metadata.calculatedAt).toLocaleString()}
Version: ${auditTrail.metadata.version}

CALCULATION STEPS:
${auditTrail.steps.map(step => `
Step ${step.step}: ${step.description}
Calculation: ${step.calculation}
Amount: ${step.amount.toFixed(2)} AED
${step.notes ? `Notes: ${step.notes}` : ''}
${step.regulation ? `Regulation: ${step.regulation}` : ''}
`).join('\n')}

APPLICABLE REGULATIONS:
${auditTrail.metadata.regulations.map(reg => `- ${reg}`).join('\n')}
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${auditTrail.type}_Audit_${auditTrail.period}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calculation Audit</h1>
          <p className="text-gray-600 mt-1">
            Review detailed calculation steps and ensure compliance transparency
          </p>
        </div>
        <Button onClick={() => refetchAudit()} variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Recalculate
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Audit Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-type">Tax Type</Label>
              <Select value={selectedType} onValueChange={(value: 'VAT' | 'CIT') => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT">VAT (Value Added Tax)</SelectItem>
                  <SelectItem value="CIT">CIT (Corporate Income Tax)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-01">January 2025</SelectItem>
                  <SelectItem value="2024-12">December 2024</SelectItem>
                  <SelectItem value="2024-11">November 2024</SelectItem>
                  <SelectItem value="2024-10">October 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validation">Validation Amount (AED)</Label>
              <div className="flex gap-2">
                <Input
                  id="validation"
                  type="number"
                  step="0.01"
                  placeholder="Expected amount"
                  value={validationAmount}
                  onChange={(e) => setValidationAmount(e.target.value)}
                />
                <Button onClick={handleValidateCalculation} variant="outline" size="sm">
                  Validate
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit-trail" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="regulations" className="flex items-center gap-2">
            <Gavel className="h-4 w-4" />
            Regulations
          </TabsTrigger>
        </TabsList>

        {/* Audit Trail Tab */}
        <TabsContent value="audit-trail" className="space-y-6">
          {auditLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">Loading calculation audit...</div>
              </CardContent>
            </Card>
          ) : auditTrail ? (
            <>
              {/* Summary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    {auditTrail.type} Calculation Summary
                  </CardTitle>
                  <Button onClick={downloadAuditReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {auditTrail.totalAmount.toFixed(2)} AED
                      </div>
                      <div className="text-sm text-gray-600">Total {auditTrail.type} Amount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{auditTrail.period}</div>
                      <div className="text-sm text-gray-600">Period</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{auditTrail.steps.length}</div>
                      <div className="text-sm text-gray-600">Calculation Steps</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calculation Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditTrail.steps.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Step {step.step}</Badge>
                              <h4 className="font-semibold">{step.description}</h4>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Calculation:</strong> {step.calculation}
                            </div>
                            {step.notes && (
                              <div className="text-sm text-gray-600 mb-2">
                                <strong>Notes:</strong> {step.notes}
                              </div>
                            )}
                            {step.regulation && (
                              <div className="text-xs text-blue-600">
                                <strong>Regulation:</strong> {step.regulation}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {step.amount.toFixed(2)} AED
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Calculation Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold mb-2">Calculation Details</h5>
                      <div className="space-y-1 text-sm">
                        <div><strong>ID:</strong> {auditTrail.calculationId}</div>
                        <div><strong>Calculated At:</strong> {new Date(auditTrail.metadata.calculatedAt).toLocaleString()}</div>
                        <div><strong>Version:</strong> {auditTrail.metadata.version}</div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Applicable Regulations</h5>
                      <div className="space-y-1 text-sm">
                        {auditTrail.metadata.regulations.map((reg, index) => (
                          <div key={index}>• {reg}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No audit trail available for the selected period. Please select a different period or ensure transactions exist.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Calculation History - {selectedType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-4">Loading history...</div>
              ) : history && history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-semibold">{item.period}</div>
                        <div className="text-sm text-gray-600">
                          Calculated by {item.calculatedBy} on {new Date(item.calculatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.totalAmount.toFixed(2)} AED</div>
                        <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No calculation history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulations Tab */}
        <TabsContent value="regulations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                UAE Tax Regulations & Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="text-center py-4">Loading configuration...</div>
              ) : taxConfig ? (
                <div className="space-y-6">
                  {/* VAT Configuration */}
                  <div>
                    <h4 className="font-semibold mb-3">VAT Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Standard Rate</Label>
                        <div className="text-lg font-semibold">
                          {(taxConfig.uaeTaxConfig.vat.standardRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <Label>Registration Threshold</Label>
                        <div className="text-lg font-semibold">
                          {taxConfig.uaeTaxConfig.thresholds.vatRegistrationMandatory.toLocaleString()} AED
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Regulatory Framework</Label>
                      <div className="text-sm text-gray-600">
                        {taxConfig.regulations.vat.law} (Effective: {taxConfig.regulations.vat.effectiveDate})
                      </div>
                    </div>
                  </div>

                  {/* CIT Configuration */}
                  <div>
                    <h4 className="font-semibold mb-3">CIT Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Standard Rate</Label>
                        <div className="text-lg font-semibold">
                          {(taxConfig.uaeTaxConfig.cit.standardRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <Label>Small Business Threshold</Label>
                        <div className="text-lg font-semibold">
                          {(taxConfig.uaeTaxConfig.cit.smallBusinessThreshold / 1000000).toFixed(1)}M AED
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Regulatory Framework</Label>
                      <div className="text-sm text-gray-600">
                        {taxConfig.regulations.cit.law} (Effective: {taxConfig.regulations.cit.effectiveDate})
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Configuration last updated: {new Date(taxConfig.lastUpdated).toLocaleDateString()}
                      (Version {taxConfig.version})
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Unable to load tax configuration
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}