import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  Calculator, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  CreditCard,
  Building2,
  Info,
  Eye,
  Edit3
} from 'lucide-react';
import { formatCurrency } from '@/lib/business-logic';
import { VAT201Data, VAT201Calculator } from '@/lib/vat-calculations';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import AgentSelectionWidget from '@/components/tax-agent/agent-selection-widget';
import CertificateUploader from '@/components/tax-agent/certificate-uploader';
import { TaxAgent } from '@/lib/tax-agents';
import { cn } from '@/lib/utils';

const vat201Schema = z.object({
  // Standard-rated supplies
  standardRatedValue: z.number().min(0, 'Value cannot be negative'),
  standardRatedVAT: z.number().min(0, 'VAT cannot be negative'),
  
  // Zero-rated supplies
  zeroRatedValue: z.number().min(0, 'Value cannot be negative'),
  
  // Exempt supplies
  exemptValue: z.number().min(0, 'Value cannot be negative'),
  
  // Reverse charge
  reverseChargeValue: z.number().min(0, 'Value cannot be negative'),
  reverseChargeVAT: z.number().min(0, 'VAT cannot be negative'),
  
  // Adjustments
  increaseInVAT: z.number().min(0, 'Increase cannot be negative'),
  decreaseInVAT: z.number().min(0, 'Decrease cannot be negative'),
  
  // Input VAT
  inputVATStandard: z.number().min(0, 'Input VAT cannot be negative'),
  inputVATCapital: z.number().min(0, 'Input VAT cannot be negative'),
  inputVATCorrections: z.number(),
});

type VAT201FormData = z.infer<typeof vat201Schema>;

interface VAT201FormProps {
  initialData?: Partial<VAT201Data>;
  onSubmit: (data: VAT201Data, selectedAgent?: TaxAgent, certificates?: any[]) => void;
  onSaveDraft: (data: VAT201Data) => void;
  onExport: (format: 'pdf' | 'xml') => void;
  isSubmitting?: boolean;
  className?: string;
}

export default function VAT201Form({
  initialData,
  onSubmit,
  onSaveDraft,
  onExport,
  isSubmitting = false,
  className = '',
}: VAT201FormProps) {
  const [calculatedData, setCalculatedData] = useState<VAT201Data | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showRefundFlow, setShowRefundFlow] = useState(false);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<TaxAgent | null>(null);
  const [agentCertificates, setAgentCertificates] = useState<any[]>([]);
  const [bankTransferSlips, setBankTransferSlips] = useState<any[]>([]);

  const form = useForm<VAT201FormData>({
    resolver: zodResolver(vat201Schema),
    defaultValues: {
      standardRatedValue: initialData?.standardRatedSupplies.totalValue || 0,
      standardRatedVAT: initialData?.standardRatedSupplies.vatAmount || 0,
      zeroRatedValue: initialData?.zeroRatedSupplies.totalValue || 0,
      exemptValue: initialData?.exemptSupplies.totalValue || 0,
      reverseChargeValue: initialData?.reverseChargeSupplies.totalValue || 0,
      reverseChargeVAT: initialData?.reverseChargeSupplies.vatAmount || 0,
      increaseInVAT: initialData?.adjustments.increaseInVAT || 0,
      decreaseInVAT: initialData?.adjustments.decreaseInVAT || 0,
      inputVATStandard: initialData?.inputVAT.standardRatedPurchases || 0,
      inputVATCapital: initialData?.inputVAT.capitalGoods || 0,
      inputVATCorrections: initialData?.inputVAT.corrections || 0,
    },
  });

  const { watch, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-calculate VAT amounts and totals
  useEffect(() => {
    const standardVAT = watchedValues.standardRatedValue * 0.05; // 5% UAE VAT rate
    
    // Auto-update standard VAT if supply value changes (only if significant difference)
    if (Math.abs(watchedValues.standardRatedVAT - standardVAT) > 1) {
      form.setValue('standardRatedVAT', Math.round(standardVAT * 100) / 100, { shouldValidate: false });
    }

    // Calculate totals
    const totalOutputVAT = 
      watchedValues.standardRatedVAT + 
      watchedValues.reverseChargeVAT + 
      watchedValues.increaseInVAT - 
      watchedValues.decreaseInVAT;

    const totalInputVAT = 
      watchedValues.inputVATStandard + 
      watchedValues.inputVATCapital + 
      watchedValues.inputVATCorrections;

    const netVATPayable = totalOutputVAT - totalInputVAT;

    const data: VAT201Data = {
      standardRatedSupplies: {
        totalValue: watchedValues.standardRatedValue,
        vatAmount: watchedValues.standardRatedVAT,
      },
      zeroRatedSupplies: {
        totalValue: watchedValues.zeroRatedValue,
        vatAmount: 0,
      },
      exemptSupplies: {
        totalValue: watchedValues.exemptValue,
        vatAmount: 0,
      },
      reverseChargeSupplies: {
        totalValue: watchedValues.reverseChargeValue,
        vatAmount: watchedValues.reverseChargeVAT,
      },
      adjustments: {
        increaseInVAT: watchedValues.increaseInVAT,
        decreaseInVAT: watchedValues.decreaseInVAT,
        netAdjustment: watchedValues.increaseInVAT - watchedValues.decreaseInVAT,
      },
      inputVAT: {
        standardRatedPurchases: watchedValues.inputVATStandard,
        capitalGoods: watchedValues.inputVATCapital,
        corrections: watchedValues.inputVATCorrections,
        totalClaimable: totalInputVAT,
      },
      totalOutputVAT,
      totalInputVAT,
      netVATPayable,
      period: {
        startDate: initialData?.period.startDate || new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0],
        endDate: initialData?.period.endDate || new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
        returnPeriod: initialData?.period.returnPeriod || '2025-Q1',
      },
      status: initialData?.status || 'draft',
    };

    setCalculatedData(data);
    setShowRefundFlow(netVATPayable < 0);
    setShowPaymentFlow(netVATPayable > 0);
  }, [watchedValues, form, initialData]);

  const handleSubmit = (data: VAT201FormData) => {
    if (calculatedData) {
      // Validate required documents
      const requiredDocs = [];
      if (selectedAgent && agentCertificates.length === 0) {
        requiredDocs.push('Tax Agent Certificate');
      }
      if (calculatedData.netVATPayable > 0 && bankTransferSlips.length === 0) {
        requiredDocs.push('Bank Transfer Slip');
      }

      if (requiredDocs.length > 0) {
        alert(`Please upload the following required documents: ${requiredDocs.join(', ')}`);
        return;
      }

      onSubmit(calculatedData, selectedAgent || undefined, [...agentCertificates, ...bankTransferSlips]);
    }
  };

  const handleSaveDraft = () => {
    if (calculatedData) {
      onSaveDraft(calculatedData);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const getStatusBadge = (status: VAT201Data['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      filed: { color: 'bg-green-100 text-green-800', label: 'Filed' },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Overdue' },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>VAT201 Return</CardTitle>
              <p className="text-sm text-gray-600">
                Period: {calculatedData?.period.returnPeriod || 'Current Quarter'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {calculatedData && getStatusBadge(calculatedData.status)}
            <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('xml')}>
              <Download className="h-4 w-4 mr-1" />
              XML
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          
          {/* Section 1: Standard-rated supplies (5%) */}
          <Card className="border border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Standard-rated supplies (5%)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standardRatedValue">Total supply value (AED)</Label>
                <Input
                  id="standardRatedValue"
                  type="number"
                  step="0.01"
                  {...form.register('standardRatedValue', { valueAsNumber: true })}
                  className={errors.standardRatedValue ? 'border-red-500' : ''}
                />
                {errors.standardRatedValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.standardRatedValue.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="standardRatedVAT">VAT amount (AED)</Label>
                <Input
                  id="standardRatedVAT"
                  type="number"
                  step="0.01"
                  {...form.register('standardRatedVAT', { valueAsNumber: true })}
                  className={errors.standardRatedVAT ? 'border-red-500' : ''}
                />
                {errors.standardRatedVAT && (
                  <p className="text-sm text-red-600 mt-1">{errors.standardRatedVAT.message}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Expected: {formatCurrency(watchedValues.standardRatedValue * 0.05)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Zero-rated supplies */}
          <Card className="border border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Zero-rated supplies (0%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:w-1/2">
                <Label htmlFor="zeroRatedValue">Total supply value (AED)</Label>
                <Input
                  id="zeroRatedValue"
                  type="number"
                  step="0.01"
                  {...form.register('zeroRatedValue', { valueAsNumber: true })}
                  className={errors.zeroRatedValue ? 'border-red-500' : ''}
                />
                {errors.zeroRatedValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.zeroRatedValue.message}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Exports, international transport, medicines
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Exempt supplies */}
          <Card className="border border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Exempt supplies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:w-1/2">
                <Label htmlFor="exemptValue">Total supply value (AED)</Label>
                <Input
                  id="exemptValue"
                  type="number"
                  step="0.01"
                  {...form.register('exemptValue', { valueAsNumber: true })}
                  className={errors.exemptValue ? 'border-red-500' : ''}
                />
                {errors.exemptValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.exemptValue.message}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Residential property, financial services, education
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Reverse charge */}
          <Card className="border border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                Reverse charge supplies
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reverseChargeValue">Total supply value (AED)</Label>
                <Input
                  id="reverseChargeValue"
                  type="number"
                  step="0.01"
                  {...form.register('reverseChargeValue', { valueAsNumber: true })}
                  className={errors.reverseChargeValue ? 'border-red-500' : ''}
                />
                {errors.reverseChargeValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.reverseChargeValue.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="reverseChargeVAT">VAT amount (AED)</Label>
                <Input
                  id="reverseChargeVAT"
                  type="number"
                  step="0.01"
                  {...form.register('reverseChargeVAT', { valueAsNumber: true })}
                  className={errors.reverseChargeVAT ? 'border-red-500' : ''}
                />
                {errors.reverseChargeVAT && (
                  <p className="text-sm text-red-600 mt-1">{errors.reverseChargeVAT.message}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Digital services, imported services
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Adjustments */}
          <Card className="border border-yellow-200 bg-yellow-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                Adjustments & corrections
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="increaseInVAT">Increase in VAT (AED)</Label>
                <Input
                  id="increaseInVAT"
                  type="number"
                  step="0.01"
                  {...form.register('increaseInVAT', { valueAsNumber: true })}
                  className={errors.increaseInVAT ? 'border-red-500' : ''}
                />
                {errors.increaseInVAT && (
                  <p className="text-sm text-red-600 mt-1">{errors.increaseInVAT.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="decreaseInVAT">Decrease in VAT (AED)</Label>
                <Input
                  id="decreaseInVAT"
                  type="number"
                  step="0.01"
                  {...form.register('decreaseInVAT', { valueAsNumber: true })}
                  className={errors.decreaseInVAT ? 'border-red-500' : ''}
                />
                {errors.decreaseInVAT && (
                  <p className="text-sm text-red-600 mt-1">{errors.decreaseInVAT.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Input VAT */}
          <Card className="border border-red-200 bg-red-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
                Input VAT claimable
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="inputVATStandard">Standard-rated purchases (AED)</Label>
                <Input
                  id="inputVATStandard"
                  type="number"
                  step="0.01"
                  {...form.register('inputVATStandard', { valueAsNumber: true })}
                  className={errors.inputVATStandard ? 'border-red-500' : ''}
                />
                {errors.inputVATStandard && (
                  <p className="text-sm text-red-600 mt-1">{errors.inputVATStandard.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="inputVATCapital">Capital goods (AED)</Label>
                <Input
                  id="inputVATCapital"
                  type="number"
                  step="0.01"
                  {...form.register('inputVATCapital', { valueAsNumber: true })}
                  className={errors.inputVATCapital ? 'border-red-500' : ''}
                />
                {errors.inputVATCapital && (
                  <p className="text-sm text-red-600 mt-1">{errors.inputVATCapital.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="inputVATCorrections">Corrections (AED)</Label>
                <Input
                  id="inputVATCorrections"
                  type="number"
                  step="0.01"
                  {...form.register('inputVATCorrections', { valueAsNumber: true })}
                  className={errors.inputVATCorrections ? 'border-red-500' : ''}
                />
                {errors.inputVATCorrections && (
                  <p className="text-sm text-red-600 mt-1">{errors.inputVATCorrections.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calculations Summary */}
          {calculatedData && (
            <Card className="border-2 border-blue-500 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  VAT201 Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculatedData.totalOutputVAT)}
                    </div>
                    <div className="text-sm text-gray-600">Total Output VAT</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculatedData.totalInputVAT)}
                    </div>
                    <div className="text-sm text-gray-600">Total Input VAT</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className={cn(
                      "text-2xl font-bold",
                      calculatedData.netVATPayable >= 0 ? "text-red-600" : "text-green-600"
                    )}>
                      {formatCurrency(Math.abs(calculatedData.netVATPayable))}
                    </div>
                    <div className="text-sm text-gray-600">
                      {calculatedData.netVATPayable >= 0 ? "VAT Payable" : "VAT Refund"}
                    </div>
                  </div>
                </div>

                {/* Conditional flows */}
                {showRefundFlow && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>Refund Due:</strong> You have a VAT refund of {formatCurrency(Math.abs(calculatedData.netVATPayable))}. 
                      Upload your bank details to request the refund.
                    </AlertDescription>
                  </Alert>
                )}

                {showPaymentFlow && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      <strong>Payment Required:</strong> VAT payment of {formatCurrency(calculatedData.netVATPayable)} is due. 
                      Make payment through FTA portal and upload proof of payment.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tax Agent Selection */}
          <AgentSelectionWidget
            selectedAgentId={selectedAgent?.id}
            onAgentSelected={setSelectedAgent}
            onAgentRemoved={() => setSelectedAgent(null)}
            filterBySpecialty="VAT"
            showComplianceWarnings={true}
          />

          {/* Tax Agent Certificate Upload */}
          {selectedAgent && (
            <CertificateUploader
              title="Tax Agent Certificate"
              description="Upload the FTA certificate for your selected tax agent"
              onFileUploaded={(file) => setAgentCertificates(prev => [...prev, file])}
              onFileRemoved={(fileId) => setAgentCertificates(prev => prev.filter(f => f.id !== fileId))}
              uploadedFiles={agentCertificates}
              required={true}
            />
          )}

          {/* Bank Transfer Slip Upload */}
          {showPaymentFlow && (
            <CertificateUploader
              title="Bank Transfer Slip"
              description="Upload proof of VAT payment to FTA account"
              onFileUploaded={(file) => setBankTransferSlips(prev => [...prev, file])}
              onFileRemoved={(fileId) => setBankTransferSlips(prev => prev.filter(f => f.id !== fileId))}
              uploadedFiles={bankTransferSlips}
              required={true}
            />
          )}

          {/* Optional Supporting Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Supporting Documents (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-4">
                  Upload invoices, receipts, or other supporting documents
                </div>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="max-w-xs"
                />
              </div>
              {attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Uploaded files:</h4>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span>{file.name}</span>
                        <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(1)} MB</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Edit3 className="h-4 w-4 mr-1" />
                Save Draft
              </Button>
              <Button variant="outline" onClick={() => onExport('pdf')}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
            
            <EnhancedButton
              type="submit"
              navigationType="submit"
              loading={isSubmitting}
              requiresValidation={true}
              validationFn={() => {
                const validation = VAT201Calculator.validateVAT201(calculatedData!);
                return validation.isValid;
              }}
              loadingText="Submitting to FTA..."
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit VAT201 Return
            </EnhancedButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}