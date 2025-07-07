import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/context/language-context';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Calendar,
  User,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxFiling {
  id: number;
  type: 'CIT' | 'VAT';
  period: string;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'ACCEPTED' | 'REJECTED';
  totalTax: string;
  submittedAt?: string;
  dueDate: string;
  taxAgentName?: string;
  reference?: string;
  attachments?: {
    taxAgentCertificate?: string;
    paymentProof?: string;
  };
}

interface TaxFilingStatusProps {
  filing: TaxFiling;
  canResubmit?: boolean;
  onResubmit?: () => void;
  className?: string;
}

export default function TaxFilingStatus({ 
  filing, 
  canResubmit = false, 
  onResubmit, 
  className = '' 
}: TaxFilingStatusProps) {
  const { language } = useLanguage();

  const getStatusIcon = (status: TaxFiling['status']) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'SUBMITTED':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TaxFiling['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: TaxFiling['status']) => {
    switch (status) {
      case 'DRAFT':
        return language === 'ar' ? 'مسودة' : 'Draft';
      case 'SUBMITTED':
        return language === 'ar' ? 'تم التقديم' : 'Submitted';
      case 'VERIFIED':
        return language === 'ar' ? 'تم التحقق' : 'Verified';
      case 'ACCEPTED':
        return language === 'ar' ? 'مقبول' : 'Accepted';
      case 'REJECTED':
        return language === 'ar' ? 'مرفوض' : 'Rejected';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'ar' ? 'ar-AE' : 'en-AE',
      { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }
    );
  };

  const isOverdue = new Date(filing.dueDate) < new Date() && 
                   !['ACCEPTED', 'VERIFIED'].includes(filing.status);

  return (
    <Card className={cn("border", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{filing.type} Return - {filing.period}</span>
          </div>
          <Badge className={getStatusColor(filing.status)}>
            {getStatusIcon(filing.status)}
            <span className="ml-1">{getStatusText(filing.status)}</span>
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filing Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700">
              {formatCurrency(filing.totalTax)}
            </p>
            <p className="text-sm text-gray-600">{filing.type} Amount</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-sm font-medium">
              {formatDate(filing.dueDate)}
            </p>
            <p className="text-sm text-gray-600">Due Date</p>
          </div>

          {filing.submittedAt && (
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium">
                {formatDate(filing.submittedAt)}
              </p>
              <p className="text-sm text-gray-600">Submitted</p>
            </div>
          )}
        </div>

        {/* Tax Agent Information */}
        {filing.taxAgentName && (
          <div className="border rounded-lg p-3 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Tax Agent</span>
            </div>
            <p className="text-sm text-blue-700">{filing.taxAgentName}</p>
          </div>
        )}

        {/* Reference Number */}
        {filing.reference && (
          <div className="border rounded-lg p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Reference Number</span>
            </div>
            <p className="text-sm font-mono text-green-700">{filing.reference}</p>
          </div>
        )}

        {/* Attached Documents */}
        {filing.attachments && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Attached Documents</h4>
            <div className="space-y-2">
              {filing.attachments.taxAgentCertificate && (
                <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Tax Agent Certificate</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
              {filing.attachments.paymentProof && (
                <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Payment Proof</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status-specific alerts */}
        {isOverdue && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>Overdue:</strong> This return is past its due date. 
              Please submit immediately to avoid penalties.
            </AlertDescription>
          </Alert>
        )}

        {filing.status === 'REJECTED' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>Return Rejected:</strong> Please review the comments and resubmit 
              with corrected information before the deadline.
            </AlertDescription>
          </Alert>
        )}

        {filing.status === 'SUBMITTED' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Under Review:</strong> Your return has been submitted to the FTA 
              and is currently being processed. You will be notified of any updates.
            </AlertDescription>
          </Alert>
        )}

        {filing.status === 'ACCEPTED' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>Return Accepted:</strong> Your {filing.type} return has been 
              successfully processed and accepted by the FTA.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canResubmit && onResubmit && (
            <Button variant="outline" onClick={onResubmit} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Resubmit Return
            </Button>
          )}
          
          <Button variant="outline" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}