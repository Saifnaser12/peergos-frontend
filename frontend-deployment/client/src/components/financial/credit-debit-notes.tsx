import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Receipt, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';

interface CreditDebitNoteFormData {
  type: 'credit' | 'debit';
  originalInvoiceId?: number;
  clientName: string;
  clientEmail?: string;
  clientAddress: string;
  issueDate: string;
  reason: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    total: number;
  }>;
  subtotal: string;
  vatAmount: string;
  total: string;
}

export default function CreditDebitNotes() {
  const [showForm, setShowForm] = useState(false);
  const [noteType, setNoteType] = useState<'credit' | 'debit'>('credit');
  const [activeTab, setActiveTab] = useState('credit');
  const [searchTerm, setSearchTerm] = useState('');
  const { company, user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch credit notes
  const { data: creditNotes = [], isLoading: creditLoading } = useQuery({
    queryKey: ['/api/credit-notes', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Fetch debit notes
  const { data: debitNotes = [], isLoading: debitLoading } = useQuery({
    queryKey: ['/api/debit-notes', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  // Fetch invoices for reference
  const { data: invoices = [] } = useQuery({
    queryKey: ['/api/invoices', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const [formData, setFormData] = useState<CreditDebitNoteFormData>({
    type: 'credit',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    reason: '',
    items: [
      { description: '', quantity: 1, unitPrice: 0, vatRate: 0.05, total: 0 }
    ],
    subtotal: '0.00',
    vatAmount: '0.00',
    total: '0.00'
  });

  // Create credit note mutation
  const createCreditNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/credit-notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
      setShowForm(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Credit note created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create credit note',
        variant: 'destructive',
      });
    },
  });

  // Create debit note mutation
  const createDebitNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/debit-notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
      setShowForm(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Debit note created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create debit note',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'credit',
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      reason: '',
      items: [
        { description: '', quantity: 1, unitPrice: 0, vatRate: 0.05, total: 0 }
      ],
      subtotal: '0.00',
      vatAmount: '0.00',
      total: '0.00'
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = formData.items.reduce((sum, item) => sum + (item.total * item.vatRate), 0);
    const total = subtotal + vatAmount;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2)
    }));
  };

  const updateItemTotal = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setTimeout(calculateTotals, 0);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, vatRate: 0.05, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: updatedItems }));
      setTimeout(calculateTotals, 0);
    }
  };

  const handleSubmit = async () => {
    if (!company || !user) return;

    const noteData = {
      companyId: company.id,
      creditNoteNumber: noteType === 'credit' ? `CN-${Date.now()}` : undefined,
      debitNoteNumber: noteType === 'debit' ? `DN-${Date.now()}` : undefined,
      originalInvoiceId: formData.originalInvoiceId,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail || null,
      clientAddress: formData.clientAddress,
      issueDate: formData.issueDate,
      reason: formData.reason,
      items: formData.items,
      subtotal: formData.subtotal,
      vatAmount: formData.vatAmount,
      total: formData.total,
      status: 'DRAFT',
      createdBy: user.id
    };

    if (noteType === 'credit') {
      createCreditNoteMutation.mutate(noteData);
    } else {
      createDebitNoteMutation.mutate(noteData);
    }
  };

  const openCreateForm = (type: 'credit' | 'debit') => {
    setNoteType(type);
    setFormData(prev => ({ ...prev, type }));
    setShowForm(true);
  };

  const typedCreditNotes = creditNotes as any[];
  const typedDebitNotes = debitNotes as any[];

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit & Debit Notes</h1>
          <p className="text-gray-600">Manage credit and debit notes for adjustments</p>
        </div>
        <div className={cn("flex gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
          <Button 
            onClick={() => openCreateForm('credit')}
            className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}
          >
            <Plus size={16} />
            Credit Note
          </Button>
          <Button 
            variant="outline"
            onClick={() => openCreateForm('debit')}
            className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}
          >
            <Plus size={16} />
            Debit Note
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credit Notes</p>
                <p className="text-2xl font-bold text-green-600">{typedCreditNotes.length}</p>
              </div>
              <FileText size={20} className="text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debit Notes</p>
                <p className="text-2xl font-bold text-orange-600">{typedDebitNotes.length}</p>
              </div>
              <Receipt size={20} className="text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    typedCreditNotes.reduce((sum, cn) => sum + parseFloat(cn.total || 0), 0),
                    'AED', language === 'ar' ? 'ar-AE' : 'en-AE'
                  )}
                </p>
              </div>
              <FileText size={20} className="text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
              <div>
                <p className="text-sm font-medium text-gray-600">Debit Amount</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    typedDebitNotes.reduce((sum, dn) => sum + parseFloat(dn.total || 0), 0),
                    'AED', language === 'ar' ? 'ar-AE' : 'en-AE'
                  )}
                </p>
              </div>
              <Receipt size={20} className="text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
            <CardTitle>All Notes</CardTitle>
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="credit">Credit Notes</TabsTrigger>
              <TabsTrigger value="debit">Debit Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="credit" className="mt-6">
              {creditLoading ? (
                <div className="text-center py-8">Loading credit notes...</div>
              ) : typedCreditNotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No credit notes yet</h3>
                  <p className="text-gray-500 mb-4">Create your first credit note to get started</p>
                  <Button onClick={() => openCreateForm('credit')}>Create Credit Note</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {typedCreditNotes.map((note: any) => (
                    <Card key={note.id} className="border hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                          <div className="flex-1">
                            <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
                              <div>
                                <p className="font-semibold text-gray-900">{note.creditNoteNumber}</p>
                                <p className="text-sm text-gray-500">{note.clientName}</p>
                                <p className="text-xs text-gray-400">{formatDate(new Date(note.issueDate), language === 'ar' ? 'ar-AE' : 'en-AE')}</p>
                              </div>
                              <Badge variant="secondary">Credit</Badge>
                            </div>
                          </div>
                          <div className={cn("text-right", language === 'ar' && "rtl:text-left")}>
                            <p className="font-semibold text-green-600">
                              -{formatCurrency(parseFloat(note.total), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
                            <p className="text-sm text-gray-500">
                              VAT: {formatCurrency(parseFloat(note.vatAmount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="debit" className="mt-6">
              {debitLoading ? (
                <div className="text-center py-8">Loading debit notes...</div>
              ) : typedDebitNotes.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No debit notes yet</h3>
                  <p className="text-gray-500 mb-4">Create your first debit note to get started</p>
                  <Button onClick={() => openCreateForm('debit')}>Create Debit Note</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {typedDebitNotes.map((note: any) => (
                    <Card key={note.id} className="border hover:border-gray-300 transition-colors">
                      <CardContent className="p-4">
                        <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                          <div className="flex-1">
                            <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
                              <div>
                                <p className="font-semibold text-gray-900">{note.debitNoteNumber}</p>
                                <p className="text-sm text-gray-500">{note.clientName}</p>
                                <p className="text-xs text-gray-400">{formatDate(new Date(note.issueDate), language === 'ar' ? 'ar-AE' : 'en-AE')}</p>
                              </div>
                              <Badge variant="outline">Debit</Badge>
                            </div>
                          </div>
                          <div className={cn("text-right", language === 'ar' && "rtl:text-left")}>
                            <p className="font-semibold text-orange-600">
                              +{formatCurrency(parseFloat(note.total), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
                            <p className="text-sm text-gray-500">
                              VAT: {formatCurrency(parseFloat(note.vatAmount), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                            </p>
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

      {/* Create Form Modal */}
      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Create {noteType === 'credit' ? 'Credit' : 'Debit'} Note
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="Enter client email"
                  />
                </div>
                <div>
                  <Label htmlFor="clientAddress">Client Address *</Label>
                  <Input
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="Enter client address"
                  />
                </div>
                <div>
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="reason">Reason for {noteType === 'credit' ? 'Credit' : 'Debit'} Note *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder={`Enter reason for ${noteType} note`}
                    rows={3}
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Items</Label>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-3 p-4 border rounded-lg">
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItemTotal(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemTotal(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemTotal(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>VAT Rate</Label>
                        <Select 
                          value={item.vatRate.toString()} 
                          onValueChange={(value) => updateItemTotal(index, 'vatRate', parseFloat(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="0.05">5%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Total</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={`AED ${item.total.toFixed(2)}`}
                            disabled
                            className="bg-gray-50"
                          />
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>AED {formData.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT:</span>
                      <span>AED {formData.vatAmount}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>AED {formData.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createCreditNoteMutation.isPending || createDebitNoteMutation.isPending}
                >
                  {(createCreditNoteMutation.isPending || createDebitNoteMutation.isPending) ? 'Creating...' : `Create ${noteType === 'credit' ? 'Credit' : 'Debit'} Note`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}