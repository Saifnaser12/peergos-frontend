import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  Upload,
  Star,
  Flag,
  Shield,
  FileText,
  Calculator,
  Globe,
  TrendingUp,
  Building,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';

interface SetupFormData {
  // Company Basic Info
  companyName: string;
  trn: string;
  businessLicense: string;
  address: string;
  phone: string;
  email: string;
  
  // SME Categorization (per FTA requirements)
  entityType: 'mainland' | 'freezone' | 'individual';
  annualRevenue: number;
  employeeCount: number;
  isVatRegistered: boolean;
  
  // Business Classification
  industry: string;
  businessActivities: string[];
  hasRelatedParties: boolean;
  
  // Documents
  licenseDocument: File | null;
  auditedFinancials: File | null;
  
  // UAE Integration
  uaePassConsent: boolean;
  ftaIntegrationConsent: boolean;
}

export default function Setup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SetupFormData>({
    companyName: '',
    trn: '',
    businessLicense: '',
    address: '',
    phone: '',
    email: '',
    entityType: 'mainland',
    annualRevenue: 0,
    employeeCount: 0,
    isVatRegistered: false,
    industry: '',
    businessActivities: [],
    hasRelatedParties: false,
    licenseDocument: null,
    auditedFinancials: null,
    uaePassConsent: false,
    ftaIntegrationConsent: false,
  });
  
  const { user, company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // SME Categorization based on exact PDF workflow flowchart
  const getSMECategory = () => {
    const { annualRevenue, employeeCount, entityType } = formData;
    
    // PDF Workflow: SMEs Decision Tree
    if (annualRevenue < 3000000) {
      if (annualRevenue < 375000) {
        return {
          category: 'SME - Micro (< AED 375k)',
          citRate: '0%',
          vatRequired: false,
          citRegistration: 'Required',
          financialStatements: 'Cash basis F.S (with notes)',
          transferPricing: false,
          obligations: ['No VAT invoices and submissions', 'Required CIT Registration and filing 0% tax', 'Cash basis F.S (with notes)'],
          color: 'green'
        };
      } else {
        return {
          category: 'SME - Small (> AED 375k, < AED 3m)',
          citRate: '0%',
          vatRequired: true,
          citRegistration: 'Required',
          financialStatements: 'Cash basis F.S (with notes)',
          transferPricing: false,
          obligations: ['Required VAT invoices and submissions', 'Required CIT Registration and filing 0% tax', 'Cash basis F.S (with notes)'],
          color: 'orange'
        };
      }
    } else {
      // Revenue > AED 3m
      if (employeeCount < 100 && annualRevenue < 25000000) {
        return {
          category: 'Small Business (> AED 3m, < 100 FTE, < 25m Rev)',
          citRate: '9%',
          vatRequired: true,
          citRegistration: 'Required',
          financialStatements: 'Accrual basis F.S (with notes)',
          transferPricing: true,
          obligations: ['Required VAT invoices and submissions', 'Required CIT Registration and filing', 'Accrual basis F.S (with notes)', 'Transfer pricing requirements'],
          color: 'purple'
        };
      } else if (employeeCount < 250 && annualRevenue < 150000000) {
        return {
          category: 'Medium Business (< 250 FTE, < 150m Rev)',
          citRate: '9%',
          vatRequired: true,
          citRegistration: 'Required',
          financialStatements: 'Accrual basis F.S (with notes)',
          transferPricing: true,
          obligations: ['Required VAT invoices and submissions', 'Required CIT Registration and filing', 'Accrual basis F.S (with notes)', 'Transfer pricing requirements'],
          color: 'red'
        };
      }
    }
    
    return {
      category: 'Large Business',
      citRate: '9%',
      vatRequired: true,
      citRegistration: 'Required',
      financialStatements: 'Accrual basis F.S (with notes)',
      transferPricing: true,
      obligations: ['Full compliance requirements'],
      color: 'gray'
    };
  };

  const smeCategory = getSMECategory();

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/companies/${company?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: 'Success',
        description: 'Company setup completed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company',
        variant: 'destructive',
      });
    },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const companyData = {
      name: formData.companyName,
      trn: formData.trn,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      industry: formData.industry,
      freeZone: formData.entityType === 'freezone',
      vatRegistered: formData.isVatRegistered,
      // Store SME categorization results
      smeCategory: smeCategory.category,
      annualRevenue: formData.annualRevenue,
      employeeCount: formData.employeeCount,
    };
    
    updateCompanyMutation.mutate(companyData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* UAE FTA Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
                UAE FTA
              </span>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Peergos</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            SME Tax Compliance Setup
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            FTA's Reliable Partner for Automated Tax Management • Complete UAE Compliance Solution
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            {/* Step 1: Welcome & Overview */}
            {currentStep === 1 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="h-24 w-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Welcome to UAE FTA Compliance
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Peergos will help you set up complete tax compliance for your business according to FTA requirements. 
                    We'll determine your SME category and configure appropriate tax obligations.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-900">Automated Setup</h3>
                    <p className="text-sm text-green-700">SME category detection & tax configuration</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-900">FTA Integration</h3>
                    <p className="text-sm text-blue-700">Direct connection to FTA systems</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <Calculator className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-900">Real-time Calculations</h3>
                    <p className="text-sm text-purple-700">Automatic VAT & CIT computations</p>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50 text-left">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>FTA Compliance:</strong> This setup ensures your business meets all Federal Tax Authority requirements 
                    including CIT registration, VAT obligations, and transfer pricing (where applicable).
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Company Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
                  <p className="text-gray-600">Enter your business details as registered with UAE authorities</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="flex items-center gap-2">
                      <Building2 size={16} />
                      Company Name *
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter company name as per trade license"
                      className="text-base p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trn" className="flex items-center gap-2">
                      <Shield size={16} />
                      Tax Registration Number (TRN)
                    </Label>
                    <Input
                      id="trn"
                      value={formData.trn}
                      onChange={(e) => setFormData(prev => ({ ...prev, trn: e.target.value }))}
                      placeholder="100123456789001"
                      className="text-base p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessLicense" className="flex items-center gap-2">
                      <FileText size={16} />
                      Business License Number *
                    </Label>
                    <Input
                      id="businessLicense"
                      value={formData.businessLicense}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessLicense: e.target.value }))}
                      placeholder="Enter trade license number"
                      className="text-base p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Globe size={16} />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+971 50 123 4567"
                      className="text-base p-3"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin size={16} />
                      Business Address *
                    </Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter complete business address"
                      rows={3}
                      className="text-base p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Globe size={16} />
                      Business Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contact@company.ae"
                      className="text-base p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="flex items-center gap-2">
                      <Building2 size={16} />
                      Industry Sector *
                    </Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      placeholder="e.g., Information Technology, Trading, Services"
                      className="text-base p-3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: SME Categorization */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">SME Categorization</h2>
                  <p className="text-gray-600">Help us determine your tax obligations based on FTA requirements</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Entity Type</Label>
                    <RadioGroup
                      value={formData.entityType}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, entityType: value }))}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="mainland" id="mainland" />
                        <Label htmlFor="mainland" className="font-medium">UAE Mainland</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="freezone" id="freezone" />
                        <Label htmlFor="freezone" className="font-medium">Free Zone</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="font-medium">Individual with License</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="annualRevenue" className="flex items-center gap-2">
                        <DollarSign size={16} />
                        Annual Revenue (AED) *
                      </Label>
                      <Input
                        id="annualRevenue"
                        type="number"
                        value={formData.annualRevenue}
                        onChange={(e) => setFormData(prev => ({ ...prev, annualRevenue: parseInt(e.target.value) || 0 }))}
                        placeholder="1000000"
                        className="text-base p-3"
                      />
                      <p className="text-sm text-gray-500">Enter your expected or actual annual revenue</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCount" className="flex items-center gap-2">
                        <Users size={16} />
                        Number of Employees *
                      </Label>
                      <Input
                        id="employeeCount"
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 0 }))}
                        placeholder="5"
                        className="text-base p-3"
                      />
                      <p className="text-sm text-gray-500">Full-time equivalent employees</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vatRegistered"
                      checked={formData.isVatRegistered}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVatRegistered: !!checked }))}
                    />
                    <Label htmlFor="vatRegistered" className="text-base">
                      Already registered for VAT
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasRelatedParties"
                      checked={formData.hasRelatedParties}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasRelatedParties: !!checked }))}
                    />
                    <Label htmlFor="hasRelatedParties" className="text-base">
                      Has related party transactions (affects transfer pricing requirements)
                    </Label>
                  </div>
                </div>

                {/* PDF Workflow Visualization */}
                <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Setup Workflow (From PDF Requirements)</h3>
                  <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-6">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Building className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-900">SMEs</p>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 text-center">Revenue<br/>Check</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <TrendingUp className="h-10 w-10 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-900">Revenue Thresholds</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-xs bg-green-200 px-2 py-1 rounded">Under 375k AED</div>
                        <div className="text-xs bg-orange-200 px-2 py-1 rounded">Over 375k AED</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 text-center">Tax<br/>Category</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
                        <Shield className="h-10 w-10 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-purple-900">Classification</p>
                    </div>
                  </div>
                </div>

                {/* Live SME Category Preview */}
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your SME Category & Tax Obligations</h3>
                  
                  <div className="mb-4">
                    <Badge className={`text-base px-4 py-2 ${smeCategory.color === 'green' ? 'bg-green-100 text-green-800 border-green-300' : 
                      smeCategory.color === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                      smeCategory.color === 'orange' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                      smeCategory.color === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                      'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      {smeCategory.category}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">CIT Rate</span>
                      </div>
                      <span className="text-xl font-bold text-blue-700">{smeCategory.citRate}</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">VAT Required</span>
                      </div>
                      <span className={`text-xl font-bold ${smeCategory.vatRequired ? 'text-red-600' : 'text-green-600'}`}>
                        {smeCategory.vatRequired ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold">Registration</span>
                      </div>
                      <span className="text-xl font-bold text-purple-700">{smeCategory.citRegistration}</span>
                    </div>
                  </div>

                  {smeCategory.obligations && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Tax Obligations (Per PDF Requirements):</h4>
                      <ul className="space-y-2">
                        {smeCategory.obligations.map((obligation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{obligation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Financial Statements</h4>
                      <p className="text-sm text-gray-700">{smeCategory.financialStatements}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Transfer Pricing</h4>
                      <p className="text-sm text-gray-700">{smeCategory.transferPricing ? 'Required' : 'Not Required'}</p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="mb-2"><strong>Classification Based On:</strong></p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <span>Revenue: {formatCurrency(formData.annualRevenue, 'AED', 'en-AE')}</span>
                      <span>Employees: {formData.employeeCount}</span>
                      <span>Entity: {formData.entityType}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: UAE Integration */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">UAE Government Integration</h2>
                  <p className="text-gray-600">Connect with UAE Pass and FTA systems for seamless compliance</p>
                </div>

                <div className="space-y-6">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <Flag size={20} />
                        UAE Pass Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="uaePassConsent"
                          checked={formData.uaePassConsent}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, uaePassConsent: !!checked }))}
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="uaePassConsent" className="text-base font-medium text-green-900">
                            Connect with UAE Pass
                          </Label>
                          <p className="text-sm text-green-700 mt-1">
                            Authorize Peergos to integrate with your UAE Pass account for secure government services access. 
                            This enables automatic document verification and streamlined compliance processes.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Shield size={20} />
                        FTA Direct Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="ftaIntegrationConsent"
                          checked={formData.ftaIntegrationConsent}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ftaIntegrationConsent: !!checked }))}
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="ftaIntegrationConsent" className="text-base font-medium text-blue-900">
                            Authorize FTA Data Access
                          </Label>
                          <p className="text-sm text-blue-700 mt-1">
                            Grant FTA read-only access to your business data via TRN number. This ensures real-time compliance 
                            monitoring and automatic filing capabilities as required by UAE tax regulations.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Privacy & Security:</strong> All integrations use secure, encrypted connections. 
                      Your data remains protected and is only shared as required by UAE tax regulations.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Step 5: Document Upload */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Supporting Documents</h2>
                  <p className="text-gray-600">Upload required documents for compliance verification</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
                      <CardContent className="p-6 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">Trade License</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Upload your business trade license (required for verification)
                        </p>
                        <Button variant="outline" className="w-full">
                          Choose File
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
                      <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">Financial Statements</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Upload recent financial statements (optional but recommended)
                        </p>
                        <Button variant="outline" className="w-full">
                          Choose File
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Document Security:</strong> All uploaded documents are encrypted and stored securely in UAE cloud infrastructure. 
                      FTA will have access as required by regulations for compliance verification.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Step 6: Review & Complete */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete</h2>
                  <p className="text-gray-600">Review your configuration before finalizing</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="font-medium">{formData.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">TRN</p>
                        <p className="font-medium">{formData.trn || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Entity Type</p>
                        <p className="font-medium capitalize">{formData.entityType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Industry</p>
                        <p className="font-medium">{formData.industry}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tax Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">SME Category</p>
                        <Badge className={`${smeCategory.color === 'green' ? 'bg-green-100 text-green-800' : 
                          smeCategory.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          smeCategory.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          smeCategory.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'}`}>
                          {smeCategory.category}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">CIT Rate</p>
                        <p className="font-medium">{smeCategory.citRate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">VAT Registration</p>
                        <p className="font-medium">{smeCategory.vatRequired ? 'Required' : 'Not Required'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Transfer Pricing</p>
                        <p className="font-medium">{smeCategory.transferPricing ? 'Required' : 'Not Required'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">UAE Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className={formData.uaePassConsent ? "text-green-600" : "text-gray-400"} />
                        <span className={formData.uaePassConsent ? "text-green-900" : "text-gray-600"}>
                          UAE Pass Integration
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className={formData.ftaIntegrationConsent ? "text-green-600" : "text-gray-400"} />
                        <span className={formData.ftaIntegrationConsent ? "text-green-900" : "text-gray-600"}>
                          FTA Data Access
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Star size={16} className="text-yellow-500" />
                        <span>Automatic CIT registration setup</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star size={16} className="text-yellow-500" />
                        <span>VAT invoicing system activation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star size={16} className="text-yellow-500" />
                        <span>Financial statements automation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star size={16} className="text-yellow-500" />
                        <span>FTA compliance monitoring</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Ready for Launch:</strong> Your Peergos system is configured according to FTA requirements. 
                    Click "Complete Setup" to activate your automated tax compliance solution.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 2 && (!formData.companyName || !formData.businessLicense)) ||
                      (currentStep === 3 && !formData.annualRevenue)
                    }
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={updateCompanyMutation.isPending}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {updateCompanyMutation.isPending ? 'Setting up...' : 'Complete Setup'}
                    <CheckCircle size={16} />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Peergos Solutions • FTA's Reliable Partner for Tax Management</p>
          <p className="mt-1">Fully compliant with UAE Federal Tax Authority requirements</p>
        </div>
      </div>
    </div>
  );
}