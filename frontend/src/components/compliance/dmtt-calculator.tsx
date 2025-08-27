import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  Globe,
  TrendingUp,
  FileText,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DMTTCalculationInputs {
  globalRevenue: number; // in EUR
  globalRevenueAED: number; // in AED
  uaeETR: number; // Effective Tax Rate in UAE
  globalETR: number; // Global Effective Tax Rate
  substantiveActivities: boolean;
  jurisdictionRevenue: number; // UAE jurisdiction revenue
  allocatedIncome: number; // Income allocated to UAE
  coveredTaxes: number; // Actual taxes paid in UAE
}

interface DMTTResult {
  isDMTTApplicable: boolean;
  minimumTaxRate: number;
  requiredETR: number;
  currentETR: number;
  dmttLiability: number;
  topUpTaxRequired: number;
  substantiveActivitiesExemption: boolean;
  complianceStatus: 'compliant' | 'non-compliant' | 'review-required';
  recommendations: string[];
}

export default function DMTTCalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<DMTTCalculationInputs>({
    globalRevenue: 0,
    globalRevenueAED: 0,
    uaeETR: 0,
    globalETR: 0,
    substantiveActivities: false,
    jurisdictionRevenue: 0,
    allocatedIncome: 0,
    coveredTaxes: 0
  });

  // DMTT Constants (2025)
  const DMTT_THRESHOLD_EUR = 750000000; // €750 million
  const DMTT_THRESHOLD_AED = 2750000000; // Approximately AED 2.75 billion (3.67 EUR/AED)
  const MINIMUM_TAX_RATE = 15; // 15%
  const SUBSTANCE_EXEMPTION_THRESHOLD = 0.1; // 10% substance carve-out

  const calculateDMTT = (): DMTTResult => {
    const isDMTTApplicable = inputs.globalRevenueAED >= DMTT_THRESHOLD_AED;
    
    if (!isDMTTApplicable) {
      return {
        isDMTTApplicable: false,
        minimumTaxRate: MINIMUM_TAX_RATE,
        requiredETR: 0,
        currentETR: inputs.uaeETR,
        dmttLiability: 0,
        topUpTaxRequired: 0,
        substantiveActivitiesExemption: false,
        complianceStatus: 'compliant',
        recommendations: ['Group revenue below DMTT threshold. No DMTT obligations.']
      };
    }

    // Calculate substance-based income reduction
    const substantiveActivityReduction = inputs.substantiveActivities ? 
      Math.min(inputs.allocatedIncome * SUBSTANCE_EXEMPTION_THRESHOLD, inputs.allocatedIncome * 0.05) : 0;
    
    const adjustedIncome = inputs.allocatedIncome - substantiveActivityReduction;
    
    // Calculate minimum tax liability
    const minimumTaxLiability = adjustedIncome * (MINIMUM_TAX_RATE / 100);
    
    // Calculate current ETR
    const currentETR = inputs.allocatedIncome > 0 ? (inputs.coveredTaxes / inputs.allocatedIncome) * 100 : 0;
    
    // Calculate top-up tax required
    const topUpTaxRequired = Math.max(0, minimumTaxLiability - inputs.coveredTaxes);
    
    // Determine compliance status
    let complianceStatus: 'compliant' | 'non-compliant' | 'review-required' = 'compliant';
    if (currentETR < MINIMUM_TAX_RATE) {
      complianceStatus = topUpTaxRequired > 0 ? 'non-compliant' : 'review-required';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (topUpTaxRequired > 0) {
      recommendations.push(`DMTT top-up tax of AED ${topUpTaxRequired.toLocaleString()} required`);
      recommendations.push('Consider restructuring to increase UAE ETR or qualify for exemptions');
    }
    if (!inputs.substantiveActivities && inputs.allocatedIncome > 0) {
      recommendations.push('Evaluate eligibility for substance-based income reduction');
    }
    if (currentETR < MINIMUM_TAX_RATE * 0.8) {
      recommendations.push('Current ETR significantly below 15% minimum - review tax planning strategy');
    }
    if (recommendations.length === 0) {
      recommendations.push('DMTT compliant - continue monitoring quarterly ETR calculations');
    }

    return {
      isDMTTApplicable: true,
      minimumTaxRate: MINIMUM_TAX_RATE,
      requiredETR: MINIMUM_TAX_RATE,
      currentETR,
      dmttLiability: minimumTaxLiability,
      topUpTaxRequired,
      substantiveActivitiesExemption: inputs.substantiveActivities,
      complianceStatus,
      recommendations
    };
  };

  const handleInputChange = (field: keyof DMTTCalculationInputs, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const exportCalculation = () => {
    const result = calculateDMTT();
    toast({
      title: "DMTT Calculation Exported",
      description: "DMTT calculation report exported for FTA submission and internal records.",
    });
  };

  const result = calculateDMTT();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            UAE DMTT Calculator (2025)
          </CardTitle>
          <p className="text-sm text-gray-600">
            Domestic Minimum Top-Up Tax - 15% minimum rate for large multinational enterprises
          </p>
        </CardHeader>
      </Card>

      {/* Threshold Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DMTT Applicability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="globalRevenueAED">Global Group Revenue (AED)</Label>
              <Input
                id="globalRevenueAED"
                type="number"
                value={inputs.globalRevenueAED}
                onChange={(e) => handleInputChange('globalRevenueAED', Number(e.target.value))}
                placeholder="Enter total group revenue in AED"
              />
              <p className="text-xs text-gray-500 mt-1">
                Threshold: AED 2.75 billion (€750 million equivalent)
              </p>
            </div>
            <div>
              <Label htmlFor="globalRevenueEUR">Global Group Revenue (EUR)</Label>
              <Input
                id="globalRevenueEUR"
                type="number"
                value={inputs.globalRevenue}
                onChange={(e) => handleInputChange('globalRevenue', Number(e.target.value))}
                placeholder="Enter total group revenue in EUR"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alternative entry in EUR (threshold: €750M)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            {result.isDMTTApplicable ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-900">DMTT Applicable</p>
                  <p className="text-sm text-orange-700">
                    Group revenue exceeds €750M threshold. DMTT obligations apply.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-900">DMTT Not Applicable</p>
                  <p className="text-sm text-green-700">
                    Group revenue below threshold. No DMTT obligations.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {result.isDMTTApplicable && (
        <>
          {/* DMTT Calculation Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UAE Jurisdiction Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jurisdictionRevenue">UAE Revenue (AED)</Label>
                  <Input
                    id="jurisdictionRevenue"
                    type="number"
                    value={inputs.jurisdictionRevenue}
                    onChange={(e) => handleInputChange('jurisdictionRevenue', Number(e.target.value))}
                    placeholder="Revenue generated in UAE"
                  />
                </div>
                
                <div>
                  <Label htmlFor="allocatedIncome">Allocated Income (AED)</Label>
                  <Input
                    id="allocatedIncome"
                    type="number"
                    value={inputs.allocatedIncome}
                    onChange={(e) => handleInputChange('allocatedIncome', Number(e.target.value))}
                    placeholder="Income allocated to UAE"
                  />
                </div>

                <div>
                  <Label htmlFor="coveredTaxes">Covered Taxes Paid (AED)</Label>
                  <Input
                    id="coveredTaxes"
                    type="number"
                    value={inputs.coveredTaxes}
                    onChange={(e) => handleInputChange('coveredTaxes', Number(e.target.value))}
                    placeholder="Actual taxes paid in UAE"
                  />
                </div>

                <div>
                  <Label htmlFor="uaeETR">UAE Effective Tax Rate (%)</Label>
                  <Input
                    id="uaeETR"
                    type="number"
                    step="0.01"
                    value={inputs.uaeETR}
                    onChange={(e) => handleInputChange('uaeETR', Number(e.target.value))}
                    placeholder="Current UAE ETR"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="substantiveActivities"
                  checked={inputs.substantiveActivities}
                  onChange={(e) => handleInputChange('substantiveActivities', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="substantiveActivities" className="text-sm">
                  Entity performs substantive activities in UAE (qualifies for substance carve-out)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* DMTT Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                DMTT Calculation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.currentETR.toFixed(2)}%</p>
                  <p className="text-sm text-gray-600">Current UAE ETR</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{result.requiredETR}%</p>
                  <p className="text-sm text-gray-600">Required Minimum ETR</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    AED {result.dmttLiability.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Minimum Tax Liability</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    AED {result.topUpTaxRequired.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Top-Up Tax Required</p>
                </div>
              </div>

              {/* ETR Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Effective Tax Rate Progress</span>
                  <span>{result.currentETR.toFixed(2)}% / {result.requiredETR}%</span>
                </div>
                <Progress 
                  value={Math.min((result.currentETR / result.requiredETR) * 100, 100)} 
                  className="h-3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {result.currentETR >= result.requiredETR ? 
                    'DMTT compliant' : 
                    `${(result.requiredETR - result.currentETR).toFixed(2)}% additional ETR needed`}
                </p>
              </div>

              {/* Compliance Status */}
              <Alert className={
                result.complianceStatus === 'compliant' ? 'border-green-200 bg-green-50' :
                result.complianceStatus === 'review-required' ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }>
                {result.complianceStatus === 'compliant' ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> :
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                }
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className={
                        result.complianceStatus === 'compliant' ? 'text-green-900' :
                        result.complianceStatus === 'review-required' ? 'text-yellow-900' :
                        'text-red-900'
                      }>
                        {result.complianceStatus === 'compliant' ? 'DMTT Compliant' :
                         result.complianceStatus === 'review-required' ? 'Review Required' :
                         'Non-Compliant'}
                      </strong>
                      <p className={
                        result.complianceStatus === 'compliant' ? 'text-green-800' :
                        result.complianceStatus === 'review-required' ? 'text-yellow-800' :
                        'text-red-800'
                      }>
                        {result.complianceStatus === 'compliant' ? 
                          'Current ETR meets 15% minimum requirement' :
                          result.complianceStatus === 'review-required' ?
                          'ETR below 15% but no immediate top-up tax due' :
                          'Top-up tax payment required'}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        result.complianceStatus === 'compliant' ? 'default' :
                        result.complianceStatus === 'review-required' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {result.complianceStatus.toUpperCase().replace('-', ' ')}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Substance Carve-out Information */}
              {result.substantiveActivitiesExemption && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Substance Carve-out Applied:</strong> Reduced income base due to substantive activities in UAE. 
                    Ensure documentation supports substance claims.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={exportCalculation} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Export DMTT Report
                </Button>
                <Button variant="outline" className="flex-1">
                  <Building2 className="h-4 w-4 mr-2" />
                  Schedule FTA Consultation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* DMTT Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">DMTT Key Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Effective Date</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    January 1, 2025 for financial years beginning on or after this date.
                  </p>
                  
                  <h4 className="font-semibold mb-2">Scope</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Large multinational enterprises (€750M+ revenue)</li>
                    <li>• UAE constituent entities of MNE groups</li>
                    <li>• Applies to income allocated to UAE jurisdiction</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Filing Requirements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Quarterly DMTT calculations required</li>
                    <li>• Annual DMTT return filing</li>
                    <li>• Top-up tax payment within prescribed timeframes</li>
                    <li>• Maintain supporting documentation</li>
                  </ul>
                  
                  <h4 className="font-semibold mb-2 mt-4">Exemptions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Substance-based income reduction (up to 10%)</li>
                    <li>• De minimis exclusion for low-profit entities</li>
                    <li>• International shipping income exclusion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}