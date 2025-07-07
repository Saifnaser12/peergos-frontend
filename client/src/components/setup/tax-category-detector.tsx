import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  Info, 
  CheckCircle, 
  Building2, 
  TrendingUp,
  FileText,
  ExternalLink,
  AlertTriangle,
  Zap
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business-logic';

export interface TaxClassification {
  category: 'MICRO' | 'SMALL' | 'MEDIUM';
  citRequired: boolean;
  citRate: number;
  vatRequired: boolean;
  vatRate: number;
  financialBasis: 'CASH' | 'ACCRUAL';
  transferPricingRequired: boolean;
  badge: string;
  description: string;
  obligations: string[];
  ftaReferences: {
    title: string;
    url: string;
    description: string;
  }[];
}

interface TaxCategoryDetectorProps {
  onClassificationChange?: (classification: TaxClassification) => void;
  initialRevenue?: number;
  className?: string;
}

export default function TaxCategoryDetector({ 
  onClassificationChange, 
  initialRevenue = 0,
  className 
}: TaxCategoryDetectorProps) {
  const [annualRevenue, setAnnualRevenue] = useState<string>(initialRevenue.toString());
  const [classification, setClassification] = useState<TaxClassification | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // UAE FTA Tax Category Classification Logic
  const classifyBusiness = (revenue: number): TaxClassification => {
    if (revenue < 375000) {
      return {
        category: 'MICRO',
        citRequired: true,
        citRate: 0,
        vatRequired: false,
        vatRate: 0,
        financialBasis: 'CASH',
        transferPricingRequired: false,
        badge: '0% CIT Only',
        description: 'Micro Business - CIT registration required, no VAT obligations',
        obligations: [
          'CIT registration within 3 months of exceeding threshold',
          'Annual CIT return filing (0% rate due to Small Business Relief)',
          'Cash basis financial statements acceptable',
          'Basic bookkeeping requirements',
          'No VAT registration required'
        ],
        ftaReferences: [
          {
            title: 'Corporate Tax Law - Small Business Relief',
            url: 'https://tax.gov.ae/en/corporate-tax',
            description: 'Small Business Relief provides 0% CIT rate for businesses with taxable income ≤ AED 375,000'
          },
          {
            title: 'CIT Registration Requirements',
            url: 'https://tax.gov.ae/en/corporate-tax/registration',
            description: 'All UAE companies must register for Corporate Tax regardless of revenue'
          }
        ]
      };
    } else if (revenue < 3000000) {
      return {
        category: 'SMALL',
        citRequired: true,
        citRate: 0,
        vatRequired: true,
        vatRate: 5,
        financialBasis: 'CASH',
        transferPricingRequired: false,
        badge: 'Small Business - Full Compliance',
        description: 'Small Business - VAT + CIT obligations with cash basis accounting',
        obligations: [
          'VAT registration mandatory (revenue > AED 375,000)',
          'Quarterly VAT returns filing',
          'CIT registration and annual returns (0% rate applies)',
          'Cash basis financial statements permitted',
          'VAT-compliant invoicing with QR codes',
          'Monthly/quarterly bookkeeping requirements'
        ],
        ftaReferences: [
          {
            title: 'VAT Registration Thresholds',
            url: 'https://tax.gov.ae/en/vat/registration',
            description: 'Mandatory VAT registration for businesses with annual revenue > AED 375,000'
          },
          {
            title: 'Small Business Relief - CIT',
            url: 'https://tax.gov.ae/en/corporate-tax/rates',
            description: '0% CIT rate applies to taxable income up to AED 375,000 annually'
          },
          {
            title: 'Cash Basis Accounting',
            url: 'https://tax.gov.ae/en/corporate-tax/accounting-standards',
            description: 'Small businesses may use cash basis accounting for CIT purposes'
          }
        ]
      };
    } else {
      return {
        category: 'MEDIUM',
        citRequired: true,
        citRate: 9,
        vatRequired: true,
        vatRate: 5,
        financialBasis: 'ACCRUAL',
        transferPricingRequired: true,
        badge: 'Medium Business - Enhanced Compliance',
        description: 'Medium Business - Full tax obligations with accrual accounting and transfer pricing',
        obligations: [
          'VAT registration and quarterly returns mandatory',
          'CIT registration with 9% rate (after AED 375K relief)',
          'Accrual basis financial statements required',
          'Transfer pricing documentation (if applicable)',
          'Enhanced bookkeeping and audit requirements',
          'Potential substance requirements for certain entities',
          'Country-by-Country reporting (if part of multinational group)'
        ],
        ftaReferences: [
          {
            title: 'Corporate Tax Rates',
            url: 'https://tax.gov.ae/en/corporate-tax/rates',
            description: '9% CIT rate applies to taxable income above AED 375,000'
          },
          {
            title: 'Transfer Pricing Rules',
            url: 'https://tax.gov.ae/en/corporate-tax/transfer-pricing',
            description: 'Transfer pricing documentation required for related party transactions'
          },
          {
            title: 'Accrual Accounting Requirements',
            url: 'https://tax.gov.ae/en/corporate-tax/accounting-standards',
            description: 'Medium and large businesses must use accrual basis accounting'
          },
          {
            title: 'Substance Requirements',
            url: 'https://tax.gov.ae/en/corporate-tax/substance',
            description: 'Economic substance requirements for certain business activities'
          }
        ]
      };
    }
  };

  // Update classification when revenue changes
  useEffect(() => {
    const revenue = parseFloat(annualRevenue) || 0;
    if (revenue > 0) {
      const newClassification = classifyBusiness(revenue);
      setClassification(newClassification);
      if (onClassificationChange) {
        onClassificationChange(newClassification);
      }
    } else {
      setClassification(null);
    }
  }, [annualRevenue, onClassificationChange]);

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'MICRO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SMALL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (category: string) => {
    switch (category) {
      case 'MICRO':
        return 'bg-blue-500';
      case 'SMALL':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Revenue Input */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Automated Tax Category Detection
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter your expected annual revenue to automatically determine your UAE tax obligations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="revenue">Expected Annual Revenue (AED)</Label>
              <Input
                id="revenue"
                type="number"
                placeholder="0"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Based on UAE FTA thresholds:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• &lt; AED 375K: CIT only (0%)</li>
                    <li>• AED 375K - 3M: VAT + CIT</li>
                    <li>• &gt; AED 3M: Full compliance</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Revenue Threshold Visualization */}
          {parseFloat(annualRevenue) > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>AED 0</span>
                <span>AED 375K</span>
                <span>AED 3M</span>
                <span>AED 10M+</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/4 bg-blue-400"></div>
                <div className="absolute inset-y-0 left-1/4 w-1/2 bg-green-400"></div>
                <div className="absolute inset-y-0 right-0 w-1/4 bg-purple-400"></div>
                
                {/* Current position marker */}
                {classification && (
                  <div 
                    className="absolute inset-y-0 w-1 bg-red-600 border border-red-800"
                    style={{
                      left: `${Math.min(
                        (parseFloat(annualRevenue) / 10000000) * 100, 
                        95
                      )}%`
                    }}
                  ></div>
                )}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">CIT Only</span>
                <span className="text-green-600">Small Business</span>
                <span className="text-purple-600">Medium Business</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classification Result */}
      {classification && (
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Tax Classification Result
              </CardTitle>
              <Badge className={getBadgeColor(classification.category)}>
                {classification.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <strong>{classification.description}</strong>
                <br />
                Annual Revenue: {formatCurrency(parseFloat(annualRevenue))}
              </AlertDescription>
            </Alert>

            {/* Tax Obligations Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {classification.citRate}%
                </div>
                <div className="text-sm font-medium text-gray-700">Corporate Tax</div>
                <div className="text-xs text-gray-600">
                  {classification.citRate === 0 ? 'Small Business Relief' : 'Standard Rate'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {classification.vatRequired ? `${classification.vatRate}%` : 'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-700">VAT Rate</div>
                <div className="text-xs text-gray-600">
                  {classification.vatRequired ? 'Registration Required' : 'Not Required'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {classification.financialBasis}
                </div>
                <div className="text-sm font-medium text-gray-700">Accounting Basis</div>
                <div className="text-xs text-gray-600">
                  Financial Statements
                </div>
              </div>
            </div>

            {/* Detailed Obligations */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                {showDetails ? 'Hide' : 'Show'} Detailed Obligations
                {showDetails ? ' ↑' : ' ↓'}
              </Button>

              {showDetails && (
                <div className="space-y-4 p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900">Required Compliance Actions:</h4>
                  <ul className="space-y-2">
                    {classification.obligations.map((obligation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{obligation}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Transfer Pricing Warning */}
                  {classification.transferPricingRequired && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Transfer Pricing Alert:</strong> Your business size may require transfer pricing 
                        documentation for related party transactions exceeding AED 40 million annually.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* FTA Reference Links */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">FTA Reference Articles:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {classification.ftaReferences.map((ref, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-gray-900">{ref.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{ref.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={ref.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button className="flex-1" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Start CIT Registration
              </Button>
              {classification.vatRequired && (
                <Button className="flex-1" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Start VAT Registration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Automatic Detection:</strong> This classification is based on current UAE FTA regulations. 
          Your tax obligations will be automatically applied across CIT and VAT workflows in the system. 
          You can update your revenue estimate anytime to recalculate your obligations.
        </AlertDescription>
      </Alert>
    </div>
  );
}