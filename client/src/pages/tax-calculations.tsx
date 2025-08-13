import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
// Note: useLanguage context not available, removed import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SecureTaxCalculator from '@/components/tax/secure-tax-calculator';
import { Calculator, FileText, Building2, TrendingUp, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

interface TaxCalculationResult {
  type: 'VAT' | 'CIT';
  amount: number;
  period: string;
  breakdown: any;
}

export default function TaxCalculationsPage() {
  const [activeTab, setActiveTab] = useState('vat');
  const [vatResult, setVatResult] = useState<TaxCalculationResult | null>(null);
  const [citResult, setCitResult] = useState<TaxCalculationResult | null>(null);
  
  const { company } = useAuth();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Calculations</h1>
          <p className="text-muted-foreground">
            Calculate VAT and Corporate Income Tax with UAE FTA compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            FTA Compliant
          </Badge>
        </div>
      </div>

      {/* Company Info Alert */}
      {!company && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Setup Required</strong><br />
            Complete your company profile to access tax calculations with accurate business data.
          </AlertDescription>
        </Alert>
      )}

      {/* Tax Calculation Summary Cards */}
      {(vatResult || citResult) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vatResult && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  VAT Calculation Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="font-medium">{vatResult.period}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">VAT Payable:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(vatResult.amount, 'AED', 'en-AE')}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <Badge variant="outline" className="text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Calculation Complete
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {citResult && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  CIT Calculation Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="font-medium">{citResult.period}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CIT Payable:</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(citResult.amount, 'AED', 'en-AE')}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <Badge variant="outline" className="text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Calculation Complete
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tax Calculators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            UAE Tax Calculators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vat" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                VAT Calculator
              </TabsTrigger>
              <TabsTrigger value="cit" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                CIT Calculator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vat" className="space-y-6">
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>UAE VAT Calculation</strong><br />
                  Calculate your VAT liability at the standard 5% rate. The calculator includes 
                  zero-rated and exempt supplies according to UAE FTA guidelines.
                </AlertDescription>
              </Alert>

              <SecureTaxCalculator 
                type="VAT"
                onResultUpdate={(result) => setVatResult(result)}
                className="max-w-4xl"
              />
            </TabsContent>

            <TabsContent value="cit" className="space-y-6">
              <Alert className="border-purple-200 bg-purple-50">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  <strong>UAE Corporate Income Tax</strong><br />
                  Calculate CIT at 9% standard rate with automatic Small Business Relief 
                  (0% on first AED 375,000) and QFZP provisions for Free Zone entities.
                </AlertDescription>
              </Alert>

              <SecureTaxCalculator 
                type="CIT"
                onResultUpdate={(result) => setCitResult(result)}
                className="max-w-4xl"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tax Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              VAT Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Standard Rate:</span>
                <span className="font-semibold">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Zero Rate:</span>
                <span className="font-semibold">0% (with input VAT recovery)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Exempt:</span>
                <span className="font-semibold">No VAT (limited input recovery)</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Based on UAE Federal Decree-Law No. 8 of 2017
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              CIT Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Standard Rate:</span>
                <span className="font-semibold">9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Small Business Relief:</span>
                <span className="font-semibold">0% on first AED 375,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">QFZP Rate:</span>
                <span className="font-semibold">0% (qualifying Free Zone)</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Based on UAE Federal Decree-Law No. 47 of 2022
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      {(vatResult || citResult) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-green-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Review Calculations</p>
                  <p className="text-sm text-gray-600">Verify the calculated amounts match your expectations</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Generate Reports</p>
                  <p className="text-sm text-gray-600">Create detailed reports for record keeping and submission</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/reports'}>
                    Go to Reports
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-purple-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Prepare for Filing</p>
                  <p className="text-sm text-gray-600">Ready your returns for FTA submission</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/taxes'}>
                    Go to Tax Returns
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}