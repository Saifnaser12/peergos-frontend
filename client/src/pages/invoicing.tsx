import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvoiceForm from '@/components/invoice/invoice-form';
import UBLInvoiceGenerator from '@/components/invoice/ubl-invoice-generator';
import { Plus, Receipt, Search, Download, Eye, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/i18n';

export default function Invoicing() {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const { company } = useAuth();
  const { language, t } = useLanguage();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['/api/invoices', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const typedInvoices = invoices as any[];

  // PDF Download function
  const downloadInvoicePDF = (invoice: any) => {
    const printContent = generateInvoicePrintHTML(invoice);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateInvoicePrintHTML = (invoice: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .invoice-details { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { text-align: right; }
          .company-info { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TAX INVOICE</h1>
          <p>Invoice No: ${invoice.invoiceNumber}</p>
          <p>Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
        </div>
        
        <div class="company-info">
          <h3>${company?.name || 'Demo Company'}</h3>
          <p>TRN: ${company?.trn || 'TRN123456789'}</p>
          <p>${company?.address || 'Address not available'}</p>
        </div>
        
        <div class="invoice-details">
          <h4>Bill To:</h4>
          <p><strong>${invoice.clientName}</strong></p>
          <p>${invoice.clientAddress}</p>
          ${invoice.clientEmail ? `<p>Email: ${invoice.clientEmail}</p>` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>VAT Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>AED ${item.unitPrice}</td>
                <td>${(item.vatRate * 100).toFixed(1)}%</td>
                <td>AED ${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>Subtotal: AED ${invoice.subtotal}</strong></p>
          <p><strong>VAT: AED ${invoice.vatAmount}</strong></p>
          <p><strong>Total: AED ${invoice.total}</strong></p>
        </div>
      </body>
      </html>
    `;
  };

  const filteredInvoices = typedInvoices?.filter((invoice: any) => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || invoice.status.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  const totalInvoiced = typedInvoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0) || 0;
  const paidInvoices = typedInvoices?.filter((inv: any) => inv.status === 'PAID') || [];
  const totalPaid = paidInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);
  const overdueInvoices = typedInvoices?.filter((inv: any) => 
    inv.status === 'OVERDUE' || (inv.status === 'SENT' && new Date(inv.dueDate) < new Date())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-success-100 text-success-800';
      case 'SENT': return 'bg-primary-100 text-primary-800';
      case 'OVERDUE': return 'bg-error-100 text-error-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoicing</h1>
          <p className="text-gray-600">Create and manage your invoices</p>
        </div>
        <Button 
          onClick={() => setShowInvoiceForm(true)}
          className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}
        >
          <Plus size={16} />
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalInvoiced, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Receipt size={20} className="text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-success-600">
                  {formatCurrency(totalPaid, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Receipt size={20} className="text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-warning-600">
                  {formatCurrency(totalInvoiced - totalPaid, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                </p>
              </div>
              <Receipt size={20} className="text-warning-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-error-600">{overdueInvoices.length}</p>
                <p className="text-xs text-gray-500">invoices</p>
              </div>
              <Receipt size={20} className="text-error-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="material-elevation-1">
        <CardHeader>
          <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
            <CardTitle>Invoice Management</CardTitle>
            <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
              <div className="relative">
                <Search size={16} className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", language === 'ar' && "rtl:left-auto rtl:right-3")} />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn("pl-10 w-64", language === 'ar' && "rtl:pl-3 rtl:pr-10")}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Invoices</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading invoices...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No invoices found' : 'No invoices yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search criteria' : 'Create your first invoice to get started'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowInvoiceForm(true)}>
                      Create Invoice
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <Card key={invoice.id} className="border hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                          <div className="flex-1">
                            <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
                              <div>
                                <h4 className="font-medium text-gray-900">{invoice.invoiceNumber}</h4>
                                <p className="text-sm text-gray-600">{invoice.clientName}</p>
                              </div>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </div>
                            <div className={cn("flex items-center gap-6 mt-2 text-sm text-gray-500", language === 'ar' && "rtl:flex-row-reverse")}>
                              <span>
                                Issue Date: {formatDate(new Date(invoice.issueDate), language === 'ar' ? 'ar-AE' : 'en-AE')}
                              </span>
                              <span>
                                Due Date: {formatDate(new Date(invoice.dueDate), language === 'ar' ? 'ar-AE' : 'en-AE')}
                              </span>
                            </div>
                          </div>
                          
                          <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
                            <div className={cn("text-right", language === 'ar' && "rtl:text-left")}>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(parseFloat(invoice.total), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                              </p>
                              <p className="text-sm text-gray-500">
                                VAT: {formatCurrency(parseFloat(invoice.vatAmount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                              </p>
                            </div>
                            
                            <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedInvoice(invoice)}
                                title="Preview Invoice"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingInvoice(invoice);
                                  setShowInvoiceForm(true);
                                }}
                                title="Edit Invoice"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => downloadInvoicePDF(invoice)}
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          isOpen={showInvoiceForm}
          onClose={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(null);
          }}
          invoice={editingInvoice}
        />
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <UBLInvoiceGenerator
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
