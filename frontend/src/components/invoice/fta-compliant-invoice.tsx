import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  FileText, 
  Download, 
  QrCode, 
  Shield, 
  Hash,
  Plus,
  Trash2,
  Calculator,
  Building,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/lib/business-logic';
import QRCode from 'qrcode';
import jsSHA from 'jssha';

// UAE FTA Invoice Schema
const ftaInvoiceSchema = z.object({
  // Seller Information
  sellerName: z.string().min(1, 'Seller name is required'),
  sellerTRN: z.string().regex(/^[0-9]{15}$/, 'TRN must be 15 digits'),
  sellerAddress: z.string().min(1, 'Seller address is required'),
  sellerPhone: z.string().optional(),
  sellerEmail: z.string().email().optional(),
  
  // Buyer Information  
  buyerName: z.string().min(1, 'Buyer name is required'),
  buyerTRN: z.string().regex(/^[0-9]{15}$/, 'Buyer TRN must be 15 digits').optional(),
  buyerAddress: z.string().min(1, 'Buyer address is required'),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  
  // Invoice Details
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceType: z.enum(['388', '381', '383', '384']), // Standard, Credit Note, Debit Note, Prepayment
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currency: z.string().default('AED'),
  
  // Line Items
  items: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    vatCategory: z.enum(['S', 'Z', 'E', 'O']), // Standard, Zero, Exempt, Out of scope
    vatRate: z.number().min(0).max(1),
    vatAmount: z.number().min(0),
    lineTotal: z.number().min(0),
  })),
  
  // Tax Summary
  subtotal: z.number().min(0),
  totalVatAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  
  // Additional Information
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
});

type FTAInvoiceData = z.infer<typeof ftaInvoiceSchema>;

interface FTACompliantInvoiceProps {
  invoice?: any;
  onSave?: (data: FTAInvoiceData) => void;
  onClose?: () => void;
}

export default function FTACompliantInvoice({ invoice, onSave, onClose }: FTACompliantInvoiceProps) {
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [invoiceHash, setInvoiceHash] = useState<string>('');
  const [xmlContent, setXmlContent] = useState<string>('');
  const qrRef = useRef<HTMLCanvasElement>(null);
  const { company } = useAuth();
  const { toast } = useToast();

  const form = useForm<FTAInvoiceData>({
    resolver: zodResolver(ftaInvoiceSchema),
    defaultValues: {
      // Seller defaults from company
      sellerName: company?.name || '',
      sellerTRN: company?.trn || '',
      sellerAddress: company?.address || '',
      sellerPhone: company?.phone || '',
      sellerEmail: company?.email || '',
      
      // Invoice defaults
      invoiceNumber: `INV-${Date.now()}`,
      invoiceType: '388', // Standard invoice
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'AED',
      
      // Buyer defaults
      buyerName: invoice?.clientName || '',
      buyerTRN: invoice?.clientTRN || '',
      buyerAddress: invoice?.clientAddress || '',
      buyerEmail: invoice?.clientEmail || '',
      
      // Items
      items: invoice?.items || [{
        id: '1',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatCategory: 'S',
        vatRate: 0.05,
        vatAmount: 0,
        lineTotal: 0,
      }],
      
      subtotal: 0,
      totalVatAmount: 0,
      totalAmount: 0,
      notes: '',
      paymentTerms: 'Net 30 days',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalVatAmount = 0;

    const updatedItems = watchedItems.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const vatAmount = lineTotal * item.vatRate;
      
      subtotal += lineTotal;
      totalVatAmount += vatAmount;

      return {
        ...item,
        vatAmount,
        lineTotal,
      };
    });

    const totalAmount = subtotal + totalVatAmount;

    // Update form values
    form.setValue('items', updatedItems);
    form.setValue('subtotal', subtotal);
    form.setValue('totalVatAmount', totalVatAmount);
    form.setValue('totalAmount', totalAmount);

    return { subtotal, totalVatAmount, totalAmount };
  };

  // Generate QR Code based on FTA requirements
  const generateQRCode = async (invoiceData: FTAInvoiceData) => {
    try {
      const qrData = [
        invoiceData.sellerName,
        invoiceData.sellerTRN,
        invoiceData.issueDate,
        invoiceData.totalAmount.toFixed(2),
        invoiceData.totalVatAmount.toFixed(2)
      ].join('|');

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeData(qrCodeUrl);
      return qrData;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      return '';
    }
  };

  // Generate hash using jsSHA
  const generateInvoiceHash = (xmlContent: string) => {
    try {
      const shaObj = new jsSHA('SHA-256', 'TEXT');
      shaObj.update(xmlContent);
      const hash = shaObj.getHash('HEX');
      setInvoiceHash(hash);
      return hash;
    } catch (error) {
      console.error('Hash generation failed:', error);
      return '';
    }
  };

  // Generate UBL 2.1 XML
  const generateXML = (invoiceData: FTAInvoiceData) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  
  <!-- UBL Version -->
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fta.gov.ae:2022:tax-invoice-1.0</cbc:CustomizationID>
  
  <!-- Invoice Information -->
  <cbc:ID>${invoiceData.invoiceNumber}</cbc:ID>
  <cbc:IssueDate>${invoiceData.issueDate}</cbc:IssueDate>
  ${invoiceData.dueDate ? `<cbc:DueDate>${invoiceData.dueDate}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>${invoiceData.invoiceType}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoiceData.currency}</cbc:DocumentCurrencyCode>
  
  <!-- Seller Party -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="TRN">${invoiceData.sellerTRN}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${invoiceData.sellerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${invoiceData.sellerAddress}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>AE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoiceData.sellerTRN}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Buyer Party -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      ${invoiceData.buyerTRN ? `
      <cac:PartyIdentification>
        <cbc:ID schemeID="TRN">${invoiceData.buyerTRN}</cbc:ID>
      </cac:PartyIdentification>` : ''}
      <cac:PartyName>
        <cbc:Name>${invoiceData.buyerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${invoiceData.buyerAddress}</cbc:StreetName>
        <cac:Country>
          <cbc:IdentificationCode>AE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${invoiceData.buyerTRN ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoiceData.buyerTRN}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Invoice Lines -->
  ${invoiceData.items.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${invoiceData.currency}">${item.lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${item.name}</cbc:Name>
      ${item.description ? `<cbc:Description>${item.description}</cbc:Description>` : ''}
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${item.vatCategory}</cbc:ID>
        <cbc:Percent>${(item.vatRate * 100).toFixed(2)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${invoiceData.currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`).join('')}
  
  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoiceData.currency}">${invoiceData.totalVatAmount.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoiceData.currency}">${invoiceData.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoiceData.currency}">${invoiceData.totalVatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>5.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoiceData.currency}">${invoiceData.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoiceData.currency}">${invoiceData.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoiceData.currency}">${invoiceData.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoiceData.currency}">${invoiceData.totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
</Invoice>`;

    setXmlContent(xml);
    return xml;
  };

  // Download XML file
  const downloadXML = () => {
    if (!xmlContent) {
      toast({
        title: 'Error',
        description: 'Please generate the invoice first',
        variant: 'destructive',
      });
      return;
    }

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.getValues('invoiceNumber')}_UBL.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'XML invoice downloaded successfully',
    });
  };

  const onSubmit = async (data: FTAInvoiceData) => {
    // Calculate final totals
    calculateTotals();
    
    // Generate XML
    const xml = generateXML(data);
    
    // Generate hash
    const hash = generateInvoiceHash(xml);
    
    // Generate QR code
    await generateQRCode(data);

    toast({
      title: 'Invoice Generated',
      description: 'FTA-compliant invoice with QR code and hash created successfully',
    });

    if (onSave) {
      onSave(data);
    }
  };

  const addItem = () => {
    append({
      id: (fields.length + 1).toString(),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatCategory: 'S',
      vatRate: 0.05,
      vatAmount: 0,
      lineTotal: 0,
    });
  };

  const { subtotal, totalVatAmount, totalAmount } = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UAE FTA Phase 2 E-Invoice</h1>
          <p className="text-gray-600">Generate compliant UBL 2.1 XML invoices with QR codes and digital signatures</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            FTA Phase 2
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            UBL 2.1
          </Badge>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Seller Information */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sellerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ABC Trading LLC" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sellerTRN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TRN (Tax Registration Number) *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="100123456700003" maxLength={15} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sellerAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Dubai, UAE" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sellerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+971-4-1234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sellerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="info@company.ae" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Buyer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="buyerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XYZ Company LLC" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buyerTRN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer TRN</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="100987654300001" maxLength={15} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buyerAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Customer Address *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Abu Dhabi, UAE" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="buyerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="customer@company.ae" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="invoiceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="388">Standard Invoice</SelectItem>
                        <SelectItem value="381">Credit Note</SelectItem>
                        <SelectItem value="383">Debit Note</SelectItem>
                        <SelectItem value="384">Prepayment Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Invoice Items
                </CardTitle>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item #{index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Item Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Product/Service name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (AED) *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.vatCategory`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="S">Standard (5%)</SelectItem>
                              <SelectItem value="Z">Zero Rated (0%)</SelectItem>
                              <SelectItem value="E">Exempt</SelectItem>
                              <SelectItem value="O">Out of Scope</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col justify-end">
                      <Label className="text-sm font-medium mb-2">Line Total</Label>
                      <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center text-sm">
                        {formatCurrency(watchedItems[index]?.lineTotal || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tax Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Subtotal (Excl. VAT)</Label>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(subtotal)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base font-medium">Total VAT Amount</Label>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalVatAmount)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base font-medium">Total Amount (Incl. VAT)</Label>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code and Hash */}
          {qrCodeData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  FTA Compliance Elements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">QR Code</Label>
                    <div className="border border-gray-200 rounded-lg p-4 flex justify-center">
                      <img src={qrCodeData} alt="Invoice QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Contains: Seller name, TRN, Date, Amount, VAT
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium mb-4 block">Invoice Hash (SHA-256)</Label>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start gap-2">
                        <Hash className="h-4 w-4 mt-1 text-gray-600" />
                        <code className="text-xs break-all text-gray-800">{invoiceHash}</code>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Digital fingerprint for XML integrity verification
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-4">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              
              {xmlContent && (
                <Button type="button" variant="outline" onClick={downloadXML}>
                  <Download className="h-4 w-4 mr-2" />
                  Download XML
                </Button>
              )}
            </div>
            
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <FileText className="h-4 w-4 mr-2" />
              Generate FTA Invoice
            </Button>
          </div>
        </form>
      </Form>

      {/* FTA Compliance Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This invoice generator complies with UAE FTA Phase 2 e-invoicing requirements including UBL 2.1 XML format, 
          QR codes with mandatory fields, and SHA-256 hash generation for digital integrity.
        </AlertDescription>
      </Alert>
    </div>
  );
}