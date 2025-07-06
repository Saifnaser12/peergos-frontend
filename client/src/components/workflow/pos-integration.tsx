import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Scan, 
  Link, 
  CheckCircle, 
  AlertTriangle,
  Camera,
  Upload,
  Zap,
  Receipt,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface POSIntegration {
  id: string;
  name: string;
  status: 'connected' | 'available' | 'coming-soon';
  type: 'restaurant' | 'retail' | 'service' | 'general';
  features: string[];
  setupInstructions: string[];
}

export default function POSIntegration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('direct-pos');
  const [scanMode, setScanMode] = useState<'receipt' | 'invoice' | null>(null);

  const posIntegrations: POSIntegration[] = [
    {
      id: 'omnivore',
      name: 'Omnivore POS',
      status: 'connected',
      type: 'restaurant',
      features: [
        'Real-time transaction sync',
        'Automatic VAT calculation',
        'Menu item categorization',
        'Daily sales reporting'
      ],
      setupInstructions: [
        'Connect to Omnivore API',
        'Configure tax categories',
        'Enable automatic sync',
        'Test transaction flow'
      ]
    },
    {
      id: 'square',
      name: 'Square POS',
      status: 'available',
      type: 'retail',
      features: [
        'Inventory synchronization',
        'Payment processing',
        'Customer management',
        'Sales analytics'
      ],
      setupInstructions: [
        'Install Square integration',
        'Authenticate with Square account',
        'Map product categories',
        'Configure VAT settings'
      ]
    },
    {
      id: 'loyverse',
      name: 'Loyverse POS',
      status: 'available',
      type: 'retail',
      features: [
        'Multi-store support',
        'Inventory tracking',
        'Customer loyalty',
        'FTA-compliant receipts'
      ],
      setupInstructions: [
        'Download Loyverse connector',
        'Connect store locations',
        'Sync product catalog',
        'Enable tax compliance mode'
      ]
    },
    {
      id: 'shopify',
      name: 'Shopify POS',
      status: 'available',
      type: 'retail',
      features: [
        'E-commerce integration',
        'Omnichannel sales',
        'Tax calculation',
        'Customer data sync'
      ],
      setupInstructions: [
        'Install Shopify app',
        'Configure webhooks',
        'Map tax zones',
        'Test order sync'
      ]
    },
    {
      id: 'generic-pos',
      name: 'Generic POS Systems',
      status: 'coming-soon',
      type: 'general',
      features: [
        'CSV import/export',
        'API connectivity',
        'Custom field mapping',
        'Flexible integration'
      ],
      setupInstructions: [
        'Contact support team',
        'Provide POS documentation',
        'Custom integration setup',
        'Testing and validation'
      ]
    }
  ];

  const handlePOSConnect = (posId: string) => {
    const pos = posIntegrations.find(p => p.id === posId);
    if (pos?.status === 'available') {
      toast({
        title: "POS Integration Started",
        description: `Setting up ${pos.name} integration. You'll receive setup instructions via email.`,
      });
    } else if (pos?.status === 'coming-soon') {
      toast({
        title: "Integration Request Submitted",
        description: `We'll notify you when ${pos.name} integration becomes available.`,
      });
    }
  };

  const handleReceiptScan = () => {
    setScanMode('receipt');
    toast({
      title: "Receipt Scanner Activated",
      description: "Use your phone camera to scan receipts. Data will be automatically extracted and categorized.",
    });
  };

  const handleInvoiceScan = () => {
    setScanMode('invoice');
    toast({
      title: "Invoice Scanner Activated", 
      description: "Scan supplier invoices for automatic expense recording and VAT processing.",
    });
  };

  const handleManualEntry = () => {
    toast({
      title: "Manual Entry Mode",
      description: "Enter transaction details manually. Camera backup for proof evidence available.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            POS & Data Collection Integration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Direct integration with Point of Sale systems and automated data collection as per FTA requirements
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="direct-pos">Direct POS Integration</TabsTrigger>
          <TabsTrigger value="scanning">Invoice & Receipt Scanning</TabsTrigger>
          <TabsTrigger value="manual-entry">Manual Entry with Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="direct-pos" className="space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Omnivore POS Integration Active:</strong> Real-time transaction sync enabled for restaurants. 
              All sales data automatically flows into your tax calculations.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posIntegrations.map((pos) => (
              <Card key={pos.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pos.name}</CardTitle>
                    <Badge 
                      variant={
                        pos.status === 'connected' ? 'default' :
                        pos.status === 'available' ? 'secondary' : 'outline'
                      }
                    >
                      {pos.status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {pos.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{pos.type} POS System</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {pos.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pos.status === 'connected' ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Connected & Syncing
                      </span>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handlePOSConnect(pos.id)}
                      className="w-full"
                      variant={pos.status === 'available' ? 'default' : 'outline'}
                      disabled={pos.status === 'coming-soon'}
                    >
                      {pos.status === 'available' ? 'Connect Now' : 'Request Integration'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FTA-Approved Accounting Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">SAP Business One</p>
                    <p className="text-xs text-gray-600">Enterprise Integration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-sm">Oracle NetSuite</p>
                    <p className="text-xs text-gray-600">Cloud ERP Integration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">QuickBooks</p>
                    <p className="text-xs text-gray-600">SME Integration</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanning" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Receipt Scanning
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Scan customer receipts for automated expense recording
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Smart Receipt Scanner</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    AI-powered extraction of amount, date, vendor, and VAT information
                  </p>
                  <Button onClick={handleReceiptScan} className="mb-2">
                    <Scan className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>FTA Requirement:</strong> All manual entries must be backed with proof evidence. 
                    Camera capture satisfies audit documentation requirements.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Invoice Processing
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Automated supplier invoice processing and VAT extraction
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Invoice Scanner</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Extract vendor details, amounts, VAT, and expense categories
                  </p>
                  <Button onClick={handleInvoiceScan} variant="outline" className="mb-2">
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Invoice
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Integration Ready:</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    TAQA (Emirates Water & Electricity)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    WPS (Wage Protection System)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Bank Statement Integration
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scanning Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">Mobile Optimized</h4>
                  <p className="text-xs text-gray-600">Use phone camera for instant capture</p>
                </div>
                <div className="text-center p-4">
                  <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">AI Processing</h4>
                  <p className="text-xs text-gray-600">Automatic data extraction and categorization</p>
                </div>
                <div className="text-center p-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-sm mb-1">FTA Compliant</h4>
                  <p className="text-xs text-gray-600">Meets audit evidence requirements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-entry" className="space-y-6">
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription>
              <strong>Evidence Backup Required:</strong> All manual entries must be supported with proof evidence, 
              which can be captured using your phone camera as per FTA audit requirements.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Manual Entry with Proof Evidence</CardTitle>
              <p className="text-sm text-gray-600">
                For SMEs without POS systems - manual entry with camera evidence backup
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleManualEntry}
                  className="h-auto p-6 flex flex-col items-center"
                  variant="outline"
                >
                  <Receipt className="h-8 w-8 mb-2" />
                  <h3 className="font-medium">Record Revenue</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Manual revenue entry with receipt/invoice photo backup
                  </p>
                </Button>

                <Button 
                  onClick={handleManualEntry}
                  className="h-auto p-6 flex flex-col items-center"
                  variant="outline"
                >
                  <Upload className="h-8 w-8 mb-2" />
                  <h3 className="font-medium">Record Expense</h3>
                  <p className="text-sm text-gray-600 text-center">
                    Manual expense entry with supplier invoice photo
                  </p>
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Evidence Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Clear photo of receipt or invoice</li>
                  <li>• Vendor name and TRN visible</li>
                  <li>• Transaction amount and date readable</li>
                  <li>• VAT amount clearly shown (if applicable)</li>
                  <li>• Payment method documented</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Verification Standards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">FTA Compliance:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Tax invoice format verification</li>
                    <li>• TRN validation against FTA database</li>
                    <li>• VAT calculation accuracy checks</li>
                    <li>• Sequential numbering validation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Data Quality:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Automatic currency detection</li>
                    <li>• Date format standardization</li>
                    <li>• Expense category suggestions</li>
                    <li>• Duplicate transaction detection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}