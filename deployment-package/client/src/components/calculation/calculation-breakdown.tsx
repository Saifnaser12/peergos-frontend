import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  Download, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  History,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import type { CalculationResult, CalculationStep } from '@shared/calculation-schemas';

interface CalculationBreakdownProps {
  calculation: CalculationResult;
  auditTrailId?: number;
  showExportOptions?: boolean;
  allowAmendments?: boolean;
  onExport?: (format: string) => void;
  onAmend?: () => void;
  onValidate?: () => void;
}

export default function CalculationBreakdown({
  calculation,
  auditTrailId,
  showExportOptions = true,
  allowAmendments = false,
  onExport,
  onAmend,
  onValidate
}: CalculationBreakdownProps) {
  const [showFormulas, setShowFormulas] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStepExpansion = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    if (currency === 'RATE') return `${amount}%`;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const getStepIcon = (step: CalculationStep) => {
    if (step.currency === 'RATE') return <TrendingUp className="h-4 w-4 text-blue-600" />;
    return <Calculator className="h-4 w-4 text-green-600" />;
  };

  const getComplianceStatus = () => {
    const { compliance } = calculation.regulatoryCompliance;
    return compliance ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Compliant
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Non-Compliant
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculation Breakdown
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {calculation.method} • Version {calculation.metadata.version}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getComplianceStatus()}
              {auditTrailId && (
                <Badge variant="outline">
                  ID: {auditTrailId}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(calculation.totalAmount, calculation.currency)}
              </div>
              <div className="text-sm text-blue-600">Final Amount</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {calculation.breakdown.length} Steps
              </div>
              <div className="text-sm text-gray-600">Calculation Steps</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-900">
                {calculation.regulatoryCompliance.regulation}
              </div>
              <div className="text-xs text-green-600">Regulatory Framework</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakdown">Step-by-Step</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="metadata">Details</TabsTrigger>
        </TabsList>

        {/* Step-by-Step Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Calculation Steps</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormulas(!showFormulas)}
              >
                {showFormulas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showFormulas ? 'Hide' : 'Show'} Formulas
              </Button>
              {showExportOptions && (
                <Button variant="outline" size="sm" onClick={() => onExport?.('PDF')}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {calculation.breakdown.map((step, index) => (
              <Card key={step.stepNumber} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStepExpansion(step.stepNumber)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {step.stepNumber}
                      </div>
                      {getStepIcon(step)}
                      <div>
                        <h4 className="font-medium">{step.description}</h4>
                        <p className="text-sm text-gray-600">{step.calculation}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(step.result, step.currency)}
                      </div>
                      {step.formula && showFormulas && (
                        <div className="text-xs text-gray-500 font-mono">
                          {step.formula}
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedSteps.has(step.stepNumber) && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {/* Input Values */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Input Values:</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(step.inputs).map(([key, value]) => (
                            <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Formula */}
                      {step.formula && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Formula:</h5>
                          <code className="text-sm bg-gray-100 p-2 rounded block">
                            {step.formula}
                          </code>
                        </div>
                      )}

                      {/* Notes and References */}
                      {(step.notes || step.regulatoryReference) && (
                        <div className="space-y-2">
                          {step.notes && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Notes:</h5>
                              <p className="text-sm text-gray-600">{step.notes}</p>
                            </div>
                          )}
                          {step.regulatoryReference && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Regulatory Reference:</h5>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-600">{step.regulatoryReference}</span>
                                <ExternalLink className="h-3 w-3 text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Input Summary</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(calculation.metadata.inputs).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Result Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method Used:</span>
                      <span className="font-medium">{calculation.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Steps:</span>
                      <span className="font-medium">{calculation.breakdown.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">{calculation.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calculated:</span>
                      <span className="font-medium">
                        {new Date(calculation.metadata.calculatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-900 mb-2">
                  {formatCurrency(calculation.totalAmount, calculation.currency)}
                </div>
                <div className="text-blue-600">Final Calculated Amount</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{calculation.regulatoryCompliance.regulation}</h4>
                  <p className="text-sm text-gray-600">{calculation.regulatoryCompliance.reference}</p>
                </div>
                {getComplianceStatus()}
              </div>

              <div>
                <h4 className="font-medium mb-3">Regulatory References by Step</h4>
                <div className="space-y-2">
                  {calculation.breakdown
                    .filter(step => step.regulatoryReference)
                    .map((step) => (
                      <div key={step.stepNumber} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{step.description}</div>
                          <div className="text-xs text-gray-600">{step.regulatoryReference}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculation Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Calculation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">{calculation.metadata.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calculated At:</span>
                      <span className="font-medium">
                        {new Date(calculation.metadata.calculatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium">{calculation.method}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">System Information</h4>
                  <div className="space-y-2 text-sm">
                    {auditTrailId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Audit Trail ID:</span>
                        <span className="font-medium">{auditTrailId}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calculated By:</span>
                      <span className="font-medium">System User {calculation.metadata.calculatedBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {(allowAmendments || onValidate) && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {allowAmendments && (
                    <Button variant="outline" onClick={onAmend}>
                      <History className="h-4 w-4 mr-2" />
                      Create Amendment
                    </Button>
                  )}
                  {onValidate && (
                    <Button onClick={onValidate}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validate Calculation
                    </Button>
                  )}
                  {showExportOptions && (
                    <Button variant="outline" onClick={() => onExport?.('JSON')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}