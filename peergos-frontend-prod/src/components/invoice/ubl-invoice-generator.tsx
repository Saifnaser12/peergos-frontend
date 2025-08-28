import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { generateUBLXML, generateInvoiceQRCode, validateUBLXML } from '@/utils/invoiceXml';
import { 
  FileX, 
  Download, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  Code,
  Eye,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

interface UBLInvoiceGeneratorProps {
  invoice: any;
  onClose?: () => void;
}

export interface UBLInvoiceData {
  // Invoice Header
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  invoiceTypeCode: string;
  currencyCode: string;
  
  // Supplier Information
  supplier: {
    name: string;
    trn: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    contact?: {
      telephone?: string;
      email?: string;
    };
  };
  
  // Customer Information
  customer: {
    name: string;
    trn?: string;
    address: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  
  // Invoice Lines
  invoiceLines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    vatCategoryCode: string;
    vatRate: number;
    vatAmount: number;
  }>;
  
  // Totals
  lineExtensionAmount: number;
  taxExclusiveAmount: number;
  taxInclusiveAmount: number;
  allowanceTotalAmount?: number;
  chargeTotalAmount?: number;
  payableAmount: number;
  
  // VAT Breakdown
  vatBreakdown: Array<{
    categoryCode: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  
  // Payment Terms
  paymentTerms?: string;
  paymentMeans?: string;
}

export default function UBLInvoiceGenerator({ invoice, onClose }: UBLInvoiceGeneratorProps) {
  const [generatedXML, setGeneratedXML] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  
  const { company } = useAuth();
  const { language } = useLanguage();

  // Convert invoice data to UBL format
  const prepareUBLData = (): UBLInvoiceData => {
    const ublData: UBLInvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : undefined,
      invoiceTypeCode: '388', // Standard commercial invoice
      currencyCode: 'AED',
      
      supplier: {
        name: company?.name || 'Demo Company LLC',
        trn: company?.trn || '100123456789001',
        address: {
          street: company?.address || 'Sheikh Zayed Road',
          city: 'Dubai',
          postalCode: '00000',
          country: 'AE'
        },
        contact: {
          telephone: '+971-4-123-4567',
          email: 'info@democompany.ae'
        }
      },
      
      customer: {
        name: invoice.clientName,
        trn: invoice.clientTRN,
        address: {
          street: invoice.clientAddress || 'Business Bay',
          city: 'Dubai',
          postalCode: '00000',
          country: 'AE'
        }
      },
      
      invoiceLines: (invoice.items || []).map((item: any, index: number) => ({
        id: (index + 1).toString(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        vatCategoryCode: item.vatRate > 0 ? 'S' : 'Z', // S = Standard, Z = Zero-rated
        vatRate: item.vatRate || 0.05,
        vatAmount: (item.quantity * item.unitPrice) * (item.vatRate || 0.05)
      })),
      
      lineExtensionAmount: invoice.subtotal || 0,
      taxExclusiveAmount: invoice.subtotal || 0,
      taxInclusiveAmount: invoice.total || 0,
      payableAmount: invoice.total || 0,
      
      vatBreakdown: [
        {
          categoryCode: 'S',
          rate: 0.05,
          taxableAmount: invoice.subtotal || 0,
          taxAmount: invoice.vatAmount || 0
        }
      ],
      
      paymentTerms: `Payment due within 30 days of invoice date`,
      paymentMeans: 'Bank Transfer'
    };
    
    return ublData;
  };

  const handleGenerateXML = async () => {
    setIsGenerating(true);
    try {
      const ublData = prepareUBLData();
      
      // Generate UBL XML
      const xml = await generateUBLXML(ublData);
      setGeneratedXML(xml);
      
      // Generate QR Code
      const qrData = await generateInvoiceQRCode(ublData);
      setQrCodeData(qrData);
      
      // Validate XML
      const validation = await validateUBLXML(xml);
      setValidationResult(validation);
      
      setActiveTab('xml');
    } catch (error) {
      console.error('Error generating UBL XML:', error);
      setValidationResult({
        isValid: false,
        errors: [{ message: 'Failed to generate UBL XML', type: 'GENERATION_ERROR' }],
        warnings: []
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadXML = () => {
    if (generatedXML) {
      const blob = new Blob([generatedXML], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}_UBL.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const getValidationColor = (isValid: boolean) => {
    return isValid ? 'text-success-600' : 'text-error-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            UBL 2.1 E-Invoice Generator
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate FTA-compliant XML invoice with digital signature
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FileX size={12} />
            UBL 2.1
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle size={12} />
            FTA Compliant
          </Badge>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card className="border-primary-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 mb-1">Invoice Number</div>
              <div className="font-medium">{invoice.invoiceNumber}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Issue Date</div>
              <div className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Customer</div>
              <div className="font-medium">{invoice.clientName}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Total Amount</div>
              <div className="font-medium">
                {formatCurrency(
                  invoice.total,
                  'AED',
                  language === 'ar' ? 'ar-AE' : 'en-AE'
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Controls */}
      <div className="flex items-center gap-3">
        <Button 
          onClick={handleGenerateXML}
          disabled={isGenerating}
          className="gap-2"
        >
          <FileX size={16} />
          {isGenerating ? 'Generating...' : 'Generate UBL XML'}
        </Button>
        
        {generatedXML && (
          <>
            <Button 
              variant="outline" 
              onClick={handleDownloadXML}
              className="gap-2"
            >
              <Download size={16} />
              Download XML
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handlePrintInvoice}
              className="gap-2"
            >
              <Printer size={16} />
              Print Invoice
            </Button>
          </>
        )}
      </div>

      {/* Progress Indicator */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Generating UBL XML...</span>
                <span>Processing</span>
              </div>
              <Progress value={66} className="h-2" />
              <div className="text-xs text-gray-500">
                Creating XML structure, calculating totals, generating QR code
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      {(generatedXML || validationResult) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="xml">XML Source</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye size={18} />
                  Invoice Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-2xl">
                  {/* Header */}
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-bold">TAX INVOICE</h2>
                    <div className="mt-2 text-sm text-gray-600">
                      Invoice No: {invoice.invoiceNumber} | Date: {new Date(invoice.issueDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Parties */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">From:</h4>
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{company?.name || 'Demo Company LLC'}</div>
                        <div>TRN: {company?.trn || '100123456789001'}</div>
                        <div>{company?.address || 'Sheikh Zayed Road, Dubai, UAE'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">To:</h4>
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{invoice.clientName}</div>
                        {invoice.clientTRN && <div>TRN: {invoice.clientTRN}</div>}
                        <div>{invoice.clientAddress}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-3">Items:</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3">Description</th>
                            <th className="text-right p-3">Qty</th>
                            <th className="text-right p-3">Rate</th>
                            <th className="text-right p-3">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(invoice.items || []).map((item: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="p-3">{item.description}</td>
                              <td className="text-right p-3">{item.quantity}</td>
                              <td className="text-right p-3">
                                {formatCurrency(item.unitPrice, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                              </td>
                              <td className="text-right p-3">
                                {formatCurrency(item.quantity * item.unitPrice, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Totals */}
                  <div className="border-t pt-4">
                    <div className="space-y-2 max-w-xs ml-auto text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(invoice.subtotal, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (5%):</span>
                        <span>{formatCurrency(invoice.vatAmount, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(invoice.total, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="xml" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code size={18} />
                  UBL 2.1 XML Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedXML}
                  readOnly
                  className="min-h-[400px] font-mono text-xs"
                  placeholder="XML will appear here after generation..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResult?.isValid ? (
                    <CheckCircle size={18} className="text-success-500" />
                  ) : (
                    <AlertTriangle size={18} className="text-error-500" />
                  )}
                  XML Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {validationResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={validationResult.isValid ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {validationResult.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                      <span className={cn("text-sm font-medium", getValidationColor(validationResult.isValid))}>
                        {validationResult.isValid 
                          ? 'UBL XML is valid and FTA compliant' 
                          : 'UBL XML has validation errors'
                        }
                      </span>
                    </div>
                    
                    {validationResult.errors?.length > 0 && (
                      <div>
                        <h5 className="font-medium text-error-900 mb-2">Errors:</h5>
                        <ul className="space-y-1">
                          {validationResult.errors.map((error: any, index: number) => (
                            <li key={index} className="text-sm text-error-700 flex items-start gap-2">
                              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                              {error.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {validationResult.warnings?.length > 0 && (
                      <div>
                        <h5 className="font-medium text-warning-900 mb-2">Warnings:</h5>
                        <ul className="space-y-1">
                          {validationResult.warnings.map((warning: any, index: number) => (
                            <li key={index} className="text-sm text-warning-700 flex items-start gap-2">
                              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                              {warning.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No validation results available. Generate XML first.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qrcode" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode size={18} />
                  Invoice QR Code
                </CardTitle>
                <p className="text-sm text-gray-600">
                  FTA-required QR code for e-invoice verification
                </p>
              </CardHeader>
              <CardContent>
                {qrCodeData ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <QrCode size={48} className="text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-2 text-sm">
                        <div>
                          <span className="font-medium">QR Code Data:</span>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                            {qrCodeData}
                          </div>
                        </div>
                        <div className="text-gray-600">
                          This QR code contains the invoice hash, seller name, VAT registration number, 
                          timestamp, and VAT amount as required by FTA regulations.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    QR code will be generated after XML creation.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}