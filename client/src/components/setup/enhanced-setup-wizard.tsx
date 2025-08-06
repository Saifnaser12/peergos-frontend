import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  DollarSign, 
  FileText, 
  Calculator,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Rocket,
  Info,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UAE_EMIRATES } from '@/lib/setup-validation';

interface SetupData {
  companyInfo: {
    name: string;
    trn: string;
    address: string;
    phone: string;
    email: string;
    emirate: string;
    industry: string;
  };
  revenueThreshold: {
    expectedAnnualRevenue: number;
    hasInternationalSales: boolean;
    internationalPercentage: number;
  };
  taxRegistration: {
    vatRegistered: boolean;
    citRegistrationRequired: boolean;
    freeZone: boolean;
    qfzpStatus: boolean;
  };
  accountingBasis: {
    accountingMethod: 'cash' | 'accrual';
    financialYearEnd: string;
    autoConfigured: boolean;
  };
}

const SETUP_STEPS = [
  {
    id: 1,
    title: 'Company Information',
    description: 'Basic company details and contact information',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Revenue Threshold',
    description: 'Expected revenue to determine tax obligations',
    icon: DollarSign,
  },
  {
    id: 3,
    title: 'Tax Registration',
    description: 'VAT and CIT registration requirements',
    icon: FileText,
  },
  {
    id: 4,
    title: 'Accounting Basis',
    description: 'Accounting method and financial year setup',
    icon: Calculator,
  },
];

interface EnhancedSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  canSkip?: boolean;
}

export default function EnhancedSetupWizard({ onComplete, onSkip, canSkip = false }: EnhancedSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    companyInfo: {
      name: '',
      trn: '',
      address: '',
      phone: '',
      email: '',
      emirate: '',
      industry: '',
    },
    revenueThreshold: {
      expectedAnnualRevenue: 0,
      hasInternationalSales: false,
      internationalPercentage: 0,
    },
    taxRegistration: {
      vatRegistered: false,
      citRegistrationRequired: true,
      freeZone: false,
      qfzpStatus: false,
    },
    accountingBasis: {
      accountingMethod: 'cash',
      financialYearEnd: `${new Date().getFullYear()}-12-31`,
      autoConfigured: false,
    },
  });

  const { company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-configure based on revenue threshold
  useEffect(() => {
    const revenue = setupData.revenueThreshold.expectedAnnualRevenue;
    
    // Auto-configure VAT registration (> AED 375,000)
    const shouldRegisterVAT = revenue > 375000;
    
    // Auto-configure accounting basis (Cash < AED 3M, Accrual >= AED 3M)
    const accountingMethod = revenue < 3000000 ? 'cash' : 'accrual';
    
    setSetupData(prev => ({
      ...prev,
      taxRegistration: {
        ...prev.taxRegistration,
        vatRegistered: shouldRegisterVAT,
      },
      accountingBasis: {
        ...prev.accountingBasis,
        accountingMethod,
        autoConfigured: true,
      },
    }));
  }, [setupData.revenueThreshold.expectedAnnualRevenue]);

  const updateSetupData = (step: keyof SetupData, data: Partial<SetupData[keyof SetupData]>) => {
    setSetupData(prev => ({
      ...prev,
      [step]: { ...prev[step], ...data },
    }));
  };

  const completeMutation = useMutation({
    mutationFn: async (data: SetupData) => {
      const response = await apiRequest('POST', '/api/setup/complete', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Setup Complete!',
        description: 'Your company has been successfully configured for UAE tax compliance.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const progress = (currentStep / SETUP_STEPS.length) * 100;
  const isLastStep = currentStep === SETUP_STEPS.length;
  const isFirstStep = currentStep === 1;

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return setupData.companyInfo.name && setupData.companyInfo.email && setupData.companyInfo.trn;
      case 2:
        return setupData.revenueThreshold.expectedAnnualRevenue > 0;
      case 3:
        return true; // Tax registration auto-configured
      case 4:
        return true; // Accounting basis auto-configured
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    completeMutation.mutate(setupData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep data={setupData.companyInfo} onUpdate={(data) => updateSetupData('companyInfo', data)} />;
      case 2:
        return <RevenueThresholdStep data={setupData.revenueThreshold} onUpdate={(data) => updateSetupData('revenueThreshold', data)} />;
      case 3:
        return <TaxRegistrationStep data={setupData.taxRegistration} onUpdate={(data) => updateSetupData('taxRegistration', data)} />;
      case 4:
        return <AccountingBasisStep data={setupData.accountingBasis} onUpdate={(data) => updateSetupData('accountingBasis', data)} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Setup Wizard</h2>
          <p className="text-gray-600">Get started with UAE tax compliance in minutes</p>
        </div>
        <div className="flex items-center gap-2">
          {canSkip && (
            <Button variant="ghost" onClick={onSkip}>
              <X className="h-4 w-4 mr-1" />
              Skip Setup
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {SETUP_STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {SETUP_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted 
                    ? "bg-green-500 border-green-500 text-white" 
                    : isActive 
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-gray-200 border-gray-300 text-gray-500"
                )}>
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-medium",
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                  )}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 hidden md:block">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="min-h-96">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div>
          {!isFirstStep && (
            <Button variant="outline" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isLastStep ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceedToNext()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={completeMutation.isPending || !canProceedToNext()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Rocket className="h-4 w-4 mr-1" />
              {completeMutation.isPending ? 'Completing...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function CompanyInfoStep({ data, onUpdate }: { data: SetupData['companyInfo']; onUpdate: (data: Partial<SetupData['companyInfo']>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <p className="text-gray-600 mb-6">Enter your company's basic information for tax registration and compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter company name"
          />
        </div>
        
        <div>
          <Label htmlFor="trn">Tax Registration Number (TRN) *</Label>
          <Input
            id="trn"
            value={data.trn}
            onChange={(e) => onUpdate({ trn: e.target.value })}
            placeholder="100123456700003"
            maxLength={15}
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="company@example.com"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+971 50 123 4567"
          />
        </div>
        
        <div>
          <Label htmlFor="emirate">Emirate</Label>
          <Select value={data.emirate} onValueChange={(value) => onUpdate({ emirate: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select emirate" />
            </SelectTrigger>
            <SelectContent>
              {UAE_EMIRATES.map((emirate) => (
                <SelectItem key={emirate.code} value={emirate.code}>
                  {emirate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={data.industry}
            onChange={(e) => onUpdate({ industry: e.target.value })}
            placeholder="e.g., Trading, Consulting, Manufacturing"
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="address">Business Address</Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => onUpdate({ address: e.target.value })}
          placeholder="Full business address including emirate"
        />
      </div>
    </div>
  );
}

function RevenueThresholdStep({ data, onUpdate }: { data: SetupData['revenueThreshold']; onUpdate: (data: Partial<SetupData['revenueThreshold']>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Revenue Threshold Assessment</h3>
        <p className="text-gray-600 mb-6">Your expected annual revenue determines VAT registration requirements and accounting method.</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>UAE Tax Thresholds:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• VAT Registration: Required if annual revenue &gt; AED 375,000</li>
            <li>• Cash Basis: Available if annual revenue &lt; AED 3,000,000</li>
            <li>• Accrual Basis: Required if annual revenue ≥ AED 3,000,000</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="revenue">Expected Annual Revenue (AED) *</Label>
          <Input
            id="revenue"
            type="number"
            value={data.expectedAnnualRevenue}
            onChange={(e) => onUpdate({ expectedAnnualRevenue: Number(e.target.value) })}
            placeholder="0"
            min="0"
            step="1000"
          />
          {data.expectedAnnualRevenue > 0 && (
            <div className="mt-2 space-y-1">
              <Badge variant={data.expectedAnnualRevenue > 375000 ? "default" : "secondary"}>
                VAT Registration: {data.expectedAnnualRevenue > 375000 ? 'Required' : 'Optional'}
              </Badge>
              <Badge variant={data.expectedAnnualRevenue >= 3000000 ? "default" : "secondary"}>
                Accounting Method: {data.expectedAnnualRevenue >= 3000000 ? 'Accrual' : 'Cash Basis Available'}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label htmlFor="international">International Sales</Label>
            <p className="text-sm text-gray-600">Do you expect to have international sales or exports?</p>
          </div>
          <Switch
            id="international"
            checked={data.hasInternationalSales}
            onCheckedChange={(checked) => onUpdate({ hasInternationalSales: checked })}
          />
        </div>

        {data.hasInternationalSales && (
          <div>
            <Label htmlFor="intlPercentage">International Sales Percentage</Label>
            <Input
              id="intlPercentage"
              type="number"
              value={data.internationalPercentage}
              onChange={(e) => onUpdate({ internationalPercentage: Number(e.target.value) })}
              placeholder="0"
              min="0"
              max="100"
              step="1"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TaxRegistrationStep({ data, onUpdate }: { data: SetupData['taxRegistration']; onUpdate: (data: Partial<SetupData['taxRegistration']>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tax Registration Setup</h3>
        <p className="text-gray-600 mb-6">Configure your UAE tax registrations based on your business requirements.</p>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Tax registration requirements have been automatically configured based on your expected revenue.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
          <div>
            <Label>VAT Registration</Label>
            <p className="text-sm text-gray-600">Required for businesses with revenue &gt; AED 375,000</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={data.vatRegistered}
              onCheckedChange={(checked) => onUpdate({ vatRegistered: checked })}
            />
            <Badge variant={data.vatRegistered ? "default" : "secondary"}>
              {data.vatRegistered ? 'Required' : 'Optional'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Corporate Income Tax (CIT) Registration</Label>
            <p className="text-sm text-gray-600">Required for all UAE companies</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={data.citRegistrationRequired}
              onCheckedChange={(checked) => onUpdate({ citRegistrationRequired: checked })}
            />
            <Badge variant="default">Required</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label>Free Zone Entity</Label>
            <p className="text-sm text-gray-600">Company operates in a UAE free zone</p>
          </div>
          <Switch
            checked={data.freeZone}
            onCheckedChange={(checked) => onUpdate({ freeZone: checked })}
          />
        </div>

        {data.freeZone && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-purple-50">
            <div>
              <Label>Qualifying Free Zone Person (QFZP)</Label>
              <p className="text-sm text-gray-600">Eligible for 0% CIT rate on qualifying income</p>
            </div>
            <Switch
              checked={data.qfzpStatus}
              onCheckedChange={(checked) => onUpdate({ qfzpStatus: checked })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AccountingBasisStep({ data, onUpdate }: { data: SetupData['accountingBasis']; onUpdate: (data: Partial<SetupData['accountingBasis']>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Accounting Basis Setup</h3>
        <p className="text-gray-600 mb-6">Configure your accounting method and financial year settings.</p>
      </div>

      {data.autoConfigured && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Your accounting method has been automatically determined based on your expected revenue.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Accounting Method</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-colors",
                data.accountingMethod === 'cash' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onUpdate({ accountingMethod: 'cash' })}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={data.accountingMethod === 'cash'}
                  onChange={() => onUpdate({ accountingMethod: 'cash' })}
                  className="sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2",
                  data.accountingMethod === 'cash' ? "border-blue-500 bg-blue-500" : "border-gray-300"
                )}>
                  {data.accountingMethod === 'cash' && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />}
                </div>
                <Label className="font-medium">Cash Basis</Label>
              </div>
              <p className="text-sm text-gray-600">
                Record transactions when cash is received/paid. Available for revenue &lt; AED 3M.
              </p>
              <Badge className="mt-2" variant={data.accountingMethod === 'cash' ? "default" : "secondary"}>
                Simpler bookkeeping
              </Badge>
            </div>

            <div 
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-colors",
                data.accountingMethod === 'accrual' ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onUpdate({ accountingMethod: 'accrual' })}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  checked={data.accountingMethod === 'accrual'}
                  onChange={() => onUpdate({ accountingMethod: 'accrual' })}
                  className="sr-only"
                />
                <div className={cn(
                  "w-4 h-4 rounded-full border-2",
                  data.accountingMethod === 'accrual' ? "border-blue-500 bg-blue-500" : "border-gray-300"
                )}>
                  {data.accountingMethod === 'accrual' && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />}
                </div>
                <Label className="font-medium">Accrual Basis</Label>
              </div>
              <p className="text-sm text-gray-600">
                Record transactions when they occur. Required for revenue ≥ AED 3M.
              </p>
              <Badge className="mt-2" variant={data.accountingMethod === 'accrual' ? "default" : "secondary"}>
                More comprehensive
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="yearEnd">Financial Year End</Label>
          <Input
            id="yearEnd"
            type="date"
            value={data.financialYearEnd}
            onChange={(e) => onUpdate({ financialYearEnd: e.target.value })}
          />
          <p className="text-sm text-gray-500 mt-1">
            Most UAE companies use December 31st as their financial year end.
          </p>
        </div>
      </div>
    </div>
  );
}