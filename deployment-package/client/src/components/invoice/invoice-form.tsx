import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Trash2, Eye, FileX, Calculator, HelpCircle, CheckCircle, User, Mail, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UBLInvoiceGenerator from './ubl-invoice-generator';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Unit price must be a positive number',
  }),
  vatRate: z.number().min(0).max(1).default(0.05),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  clientAddress: z.string().min(1, 'Client address is required'),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
}

export default function InvoiceForm({ isOpen, onClose, invoice }: InvoiceFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [showUBLGenerator, setShowUBLGenerator] = useState(false);
  const { user, company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now()}`,
      clientName: invoice?.clientName || '',
      clientEmail: invoice?.clientEmail || '',
      clientAddress: invoice?.clientAddress || '',
      issueDate: invoice?.issueDate 
        ? new Date(invoice.issueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      dueDate: invoice?.dueDate 
        ? new Date(invoice.dueDate).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      items: invoice?.items || [
        { description: '', quantity: '1', unitPrice: '0', vatRate: 0.05 }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/invoices', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invoice Created',
        description: 'Invoice has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const watchedItems = form.watch('items');

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    watchedItems.forEach((item) => {
      const quantity = parseFloat(item.quantity || '0');
      const unitPrice = parseFloat(item.unitPrice || '0');
      const itemTotal = quantity * unitPrice;
      const itemVat = itemTotal * item.vatRate;
      
      subtotal += itemTotal;
      totalVat += itemVat;
    });

    return {
      subtotal,
      vatAmount: totalVat,
      total: subtotal + totalVat,
    };
  };

  const totals = calculateTotals();

  const onSubmit = (data: InvoiceFormData) => {
    const items = data.items.map(item => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unitPrice),
      vatRate: item.vatRate,
      total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
    }));

    const invoiceData = {
      companyId: company?.id,
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail || null,
      clientAddress: data.clientAddress,
      issueDate: new Date(data.issueDate).toISOString(),
      dueDate: new Date(data.dueDate).toISOString(),
      items,
      subtotal: totals.subtotal.toFixed(2),
      vatAmount: totals.vatAmount.toFixed(2),
      total: totals.total.toFixed(2),
      status: 'DRAFT',
      xmlGenerated: false,
      qrCode: null,
      createdBy: user?.id,
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const addItem = () => {
    append({ description: '', quantity: '1', unitPrice: '0', vatRate: 0.05 });
  };

  if (previewMode) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn("sm:max-w-4xl max-h-[90vh] overflow-y-auto", language === 'ar' && "rtl:text-right")}>
          <DialogHeader>
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <DialogTitle>Invoice Preview</DialogTitle>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Edit Invoice
              </Button>
            </div>
          </DialogHeader>

          {/* Invoice Preview */}
          <div className="space-y-6 bg-white p-6 rounded-lg border">
            {/* Header */}
            <div className={cn("flex justify-between items-start", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company?.name || 'Your Company'}</h1>
                <div className="text-sm text-gray-600 mt-2">
                  <p>{company?.address}</p>
                  <p>{company?.phone}</p>
                  <p>{company?.email}</p>
                  {company?.trn && <p>TRN: {company.trn}</p>}
                </div>
              </div>
              <div className={cn("text-right", language === 'ar' && "rtl:text-left")}>
                <h2 className="text-xl font-semibold text-gray-900">INVOICE</h2>
                <p className="text-sm text-gray-600 mt-1">#{form.watch('invoiceNumber')}</p>
              </div>
            </div>

            <Separator />

            {/* Client & Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Bill To:</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{form.watch('clientName')}</p>
                  <p>{form.watch('clientAddress')}</p>
                  {form.watch('clientEmail') && <p>{form.watch('clientEmail')}</p>}
                </div>
              </div>
              <div className={cn("text-left", language === 'ar' && "rtl:text-right")}>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Issue Date:</span>
                    <span>{new Date(form.watch('issueDate')).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span>{new Date(form.watch('dueDate')).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchedItems.map((item, index) => {
                    const quantity = parseFloat(item.quantity || '0');
                    const unitPrice = parseFloat(item.unitPrice || '0');
                    const itemTotal = quantity * unitPrice;
                    const itemVat = itemTotal * item.vatRate;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(unitPrice, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(itemVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(itemTotal + itemVat, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT (5%):</span>
                  <span>{formatCurrency(totals.vatAmount, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <Separator />
            <div className="text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
              {company?.vatRegistered && (
                <p className="mt-1">This is a VAT invoice. Please retain for your records.</p>
              )}
            </div>
          </div>

          <div className={cn("flex gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
            <Button variant="outline" onClick={() => setPreviewMode(false)} className="flex-1">
              Edit Invoice
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} className="flex-1">
              Create Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-4xl max-h-[90vh] overflow-y-auto", language === 'ar' && "rtl:text-right")}>
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
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
                <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                  <CardTitle className="text-lg">Invoice Items</CardTitle>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus size={16} className={cn("mr-1", language === 'ar' && "rtl:mr-0 rtl:ml-1")} />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qty</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm">
                          <p className="font-medium">Total</p>
                          <p className="text-gray-600">
                            {formatCurrency(
                              (parseFloat(watchedItems[index]?.quantity || '0') * 
                               parseFloat(watchedItems[index]?.unitPrice || '0')),
                              'AED',
                              language === 'ar' ? 'ar-AE' : 'en-AE'
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(totals.subtotal, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (5%):</span>
                      <span>{formatCurrency(totals.vatAmount, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className={cn("flex gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPreviewMode(true)} 
                className="flex-1"
              >
                <Eye size={16} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
                Preview
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createInvoiceMutation.isPending}
              >
                {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
