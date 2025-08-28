import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  User,
  Paperclip,
  Loader2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxSubmissionModalProps {
  type: 'CIT' | 'VAT';
  calculationData?: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    taxOwed: number;
    period: string;
  };
  children: React.ReactNode;
}

interface SubmissionData {
  type: 'CIT' | 'VAT';
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  taxOwed: number;
  taxAgentName: string;
  taxAgentCertificate: File | null;
  paymentProof: File | null;
}

export default function TaxSubmissionModal({ type, calculationData, children }: TaxSubmissionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<SubmissionData>({
    type,
    period: calculationData?.period || `${type} Return ${new Date().getFullYear()}`,
    totalRevenue: calculationData?.totalRevenue || 0,
    totalExpenses: calculationData?.totalExpenses || 0,
    netIncome: calculationData?.netIncome || 0,
    taxOwed: calculationData?.taxOwed || 0,
    taxAgentName: '',
    taxAgentCertificate: null,
    paymentProof: null,
  });

  const { company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitReturnMutation = useMutation({
    mutationFn: async (data: SubmissionData) => {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('type', data.type);
      formDataToSend.append('period', data.period);
      formDataToSend.append('totalRevenue', data.totalRevenue.toString());
      formDataToSend.append('totalExpenses', data.totalExpenses.toString());
      formDataToSend.append('netIncome', data.netIncome.toString());
      formDataToSend.append('taxOwed', data.taxOwed.toString());
      formDataToSend.append('taxAgentName', data.taxAgentName);
      
      // Add files
      if (data.taxAgentCertificate) {
        formDataToSend.append('taxAgentCertificate', data.taxAgentCertificate);
      }
      if (data.paymentProof) {
        formDataToSend.append('paymentProof', data.paymentProof);
      }

      const response = await fetch('/api/submit-return', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${type} Return Submitted`,
        description: `Your ${type} return has been successfully submitted with reference ${data.reference}`,
      });
      
      // Refresh tax filings data
      queryClient.invalidateQueries({ queryKey: ['/api/tax-filings'] });
      
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit tax return',
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (field: 'taxAgentCertificate' | 'paymentProof', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.taxAgentName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Tax agent name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.taxAgentCertificate) {
      toast({
        title: 'Missing Document',
        description: 'Tax agent certificate is required',
        variant: 'destructive',
      });
      return;
    }

    submitReturnMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      type,
      period: calculationData?.period || `${type} Return ${new Date().getFullYear()}`,
      totalRevenue: calculationData?.totalRevenue || 0,
      totalExpenses: calculationData?.totalExpenses || 0,
      netIncome: calculationData?.netIncome || 0,
      taxOwed: calculationData?.taxOwed || 0,
      taxAgentName: '',
      taxAgentCertificate: null,
      paymentProof: null,
    });
  };

  const isFormValid = formData.taxAgentName.trim() && formData.taxAgentCertificate;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Submit {type} Return
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              FTA Compliant
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Return Summary */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Return Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Period:</span>
                <p className="font-medium">{formData.period}</p>
              </div>
              <div>
                <span className="text-gray-600">Company:</span>
                <p className="font-medium">{company?.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Revenue:</span>
                <p className="font-medium text-green-700">{formatCurrency(formData.totalRevenue)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Expenses:</span>
                <p className="font-medium text-red-700">{formatCurrency(formData.totalExpenses)}</p>
              </div>
              <div>
                <span className="text-gray-600">Net Income:</span>
                <p className="font-medium">{formatCurrency(formData.netIncome)}</p>
              </div>
              <div>
                <span className="text-gray-600">{type} Owed:</span>
                <p className="font-medium text-blue-700">{formatCurrency(formData.taxOwed)}</p>
              </div>
            </div>
          </div>

          {/* Tax Agent Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Tax Agent Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="taxAgentName">
                Tax Agent Name *
              </Label>
              <Input
                id="taxAgentName"
                value={formData.taxAgentName}
                onChange={(e) => setFormData(prev => ({ ...prev, taxAgentName: e.target.value }))}
                placeholder="Enter tax agent full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxAgentCertificate">
                Tax Agent Certificate * (PDF only)
              </Label>
              <Input
                id="taxAgentCertificate"
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange('taxAgentCertificate', e.target.files?.[0] || null)}
                required
              />
              {formData.taxAgentCertificate && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>{formData.taxAgentCertificate.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Documentation */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Payment Documentation
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="paymentProof">
                Bank Transfer Proof (Optional - PDF or JPG)
              </Label>
              <Input
                id="paymentProof"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('paymentProof', e.target.files?.[0] || null)}
              />
              {formData.paymentProof && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>{formData.paymentProof.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Deadline Warning */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              <strong>Important:</strong> {type === 'VAT' 
                ? 'VAT returns must be filed by the 28th of the following month' 
                : 'CIT returns must be filed within 9 months of financial year-end'
              }. 
              Ensure all documents are accurate before submission.
            </AlertDescription>
          </Alert>

          {/* Compliance Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>FTA Compliance:</strong> This submission will be processed according to UAE Federal Tax Authority 
              requirements. All documents will be securely stored and made available for audit purposes.
            </AlertDescription>
          </Alert>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || submitReturnMutation.isPending}
              className="flex-1"
            >
              {submitReturnMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit {type} Return
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}