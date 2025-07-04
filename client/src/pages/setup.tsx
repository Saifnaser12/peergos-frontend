import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UAEComplianceDashboard from '@/components/compliance/uae-compliance-dashboard';
import UBLInvoiceGenerator from '@/components/invoice/ubl-invoice-generator';
import SetupWizard from '@/components/setup/setup-wizard';
import CitValidator from '@/components/testing/cit-validator';
import InvoiceScanner from '@/components/invoice/invoice-scanner';
import SmartComplianceDashboard from '@/components/compliance/smart-compliance-dashboard';
import SMESimplifiedDashboard from '@/components/sme/sme-simplified-dashboard';
import EndToEndTaxWorkflow from '@/components/workflow/end-to-end-tax-workflow';
import RevenueExpenseCategories from '@/components/financial/revenue-expense-categories';
import BalanceSheetGenerator from '@/components/financial/balance-sheet-generator';
import TRNManagement from '@/components/setup/trn-management';
import { 
  Settings, 
  Shield, 
  FileX, 
  Building2, 
  Palette,
  Globe,
  Bell,
  Download,
  Calculator,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Setup() {
  const [activeTab, setActiveTab] = useState('workflow');
  const { user, company } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Sample invoice for UBL testing
  const sampleInvoice = {
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: 'Sample Customer LLC',
    clientAddress: 'Dubai, UAE',
    clientTRN: '100987654321001',
    items: [
      {
        description: 'Professional Services',
        quantity: 1,
        unitPrice: 10000,
        vatRate: 0.05
      }
    ],
    subtotal: 10000,
    vatAmount: 500,
    total: 10500
  };

  const complianceFeatures = [
    {
      title: 'TRN Verification',
      description: 'Validate Tax Registration Numbers against FTA registry',
      status: 'Active',
      icon: Shield
    },
    {
      title: 'UBL 2.1 E-Invoicing',
      description: 'Generate FTA-compliant XML invoices with digital signatures',
      status: 'Beta',
      icon: FileX
    },
    {
      title: 'QFZP Assessment',
      description: 'Qualified Free Zone Person eligibility evaluation',
      status: 'Active',
      icon: Building2
    },
    {
      title: 'Automatic Filings',
      description: 'Submit VAT and CIT returns to FTA portal',
      status: 'Coming Soon',
      icon: Download
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Setup & Compliance</h1>
            <p className="text-gray-600 mt-1">
              Configure UAE tax compliance features and regulatory settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield size={14} />
              UAE FTA Certified
            </Badge>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="workflow">Complete Workflow</TabsTrigger>
            <TabsTrigger value="sme">SME Hub</TabsTrigger>
            <TabsTrigger value="wizard">Setup</TabsTrigger>
            <TabsTrigger value="trn">TRN</TabsTrigger>
            <TabsTrigger value="smart">Smart Compliance</TabsTrigger>
            <TabsTrigger value="einvoicing">E-Invoice</TabsTrigger>
            <TabsTrigger value="scanner">OCR</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="preferences">Settings</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          {/* Complete End-to-End Workflow */}
          <TabsContent value="workflow" className="space-y-6">
            <EndToEndTaxWorkflow />
          </TabsContent>

          {/* SME Simplified Dashboard */}
          <TabsContent value="sme" className="space-y-6">
            <SMESimplifiedDashboard />
          </TabsContent>

          {/* Setup Wizard */}
          <TabsContent value="wizard" className="space-y-6">
            <SetupWizard 
              onComplete={(data) => {
                console.log('Setup completed:', data);
                // Here we would typically save the setup data
                setActiveTab('compliance');
              }} 
            />
          </TabsContent>

          {/* TRN Management */}
          <TabsContent value="trn" className="space-y-6">
            <TRNManagement />
          </TabsContent>

          {/* Smart Compliance Dashboard */}
          <TabsContent value="smart" className="space-y-6">
            <SmartComplianceDashboard />
          </TabsContent>

          {/* E-Invoicing UBL Generator */}
          <TabsContent value="einvoicing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                  <FileX size={20} className="text-primary-500" />
                  UAE E-Invoicing (Phase 2)
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Test UBL 2.1 XML generation for FTA compliance
                </p>
              </CardHeader>
              <CardContent>
                <UBLInvoiceGenerator invoice={sampleInvoice} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Scanner & OCR */}
          <TabsContent value="scanner" className="space-y-6">
            <InvoiceScanner />
          </TabsContent>

          {/* CIT Testing & Validation */}
          <TabsContent value="testing" className="space-y-6">
            <CitValidator />
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Company Name</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        {company?.name || 'Not Set'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tax Registration Number (TRN)</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        {company?.trn || 'Not Set'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">VAT Registration</label>
                      <div className="mt-1">
                        <Badge variant={company?.vatRegistered ? "default" : "secondary"}>
                          {company?.vatRegistered ? 'Registered' : 'Not Registered'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Free Zone Status</label>
                      <div className="mt-1">
                        <Badge variant={company?.freeZone ? "default" : "secondary"}>
                          {company?.freeZone ? 'Free Zone Entity' : 'Mainland Entity'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Address Information</h4>
                    <div className="p-3 bg-gray-50 rounded border text-sm">
                      {company?.address || 'Address not specified'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe size={18} />
                    Language & Region
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Interface Language
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={language === 'en' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage('en')}
                      >
                        English
                      </Button>
                      <Button
                        variant={language === 'ar' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLanguage('ar')}
                      >
                        العربية
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Currency
                    </label>
                    <Badge variant="outline">AED (UAE Dirham)</Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Timezone
                    </label>
                    <Badge variant="outline">UTC+4 (Gulf Standard Time)</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell size={18} />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tax deadline reminders</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">FTA compliance alerts</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Invoice generation</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System updates</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Available Features */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>UAE Tax Compliance Features</CardTitle>
                <p className="text-sm text-gray-600">
                  Advanced regulatory compliance tools for UAE businesses
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {complianceFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <Icon size={18} className="text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{feature.title}</h4>
                              <Badge 
                                variant={
                                  feature.status === 'Active' ? "default" : 
                                  feature.status === 'Beta' ? "secondary" : 
                                  "outline"
                                }
                                className="text-xs"
                              >
                                {feature.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Regulatory Information */}
            <Card className="border-info-200 bg-info-50">
              <CardHeader>
                <CardTitle className="text-info-900">Regulatory Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-info-800">
                  <h5 className="font-medium">Current UAE Tax Obligations:</h5>
                  <ul className="space-y-1 ml-4">
                    <li>✓ Corporate Income Tax (CIT) - 0% rate with Small Business Relief</li>
                    <li>✓ Value Added Tax (VAT) - 5% standard rate</li>
                    <li>✓ E-Invoicing Phase 2 - UBL 2.1 XML compliance</li>
                    <li>✓ Transfer Pricing documentation requirements</li>
                    <li>✓ Economic Substance Regulations (ESR)</li>
                    <li>✓ Country-by-Country Reporting (CbCR)</li>
                  </ul>
                  
                  <div className="pt-3 border-t border-info-200">
                    <p className="text-xs text-info-700">
                      Last updated: {new Date().toLocaleDateString()} | 
                      Compliance framework based on UAE Federal Tax Authority guidelines
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}