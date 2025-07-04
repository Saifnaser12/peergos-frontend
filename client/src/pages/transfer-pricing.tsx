import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransferPricing() {
  const { language, t } = useLanguage();

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
            <h1 className="text-3xl font-bold text-gray-900">Transfer Pricing</h1>
            <Badge className="bg-warning-100 text-warning-800">Coming Soon</Badge>
          </div>
          <p className="text-gray-600">Manage your transfer pricing documentation and compliance</p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card className="material-elevation-1 border-primary-200 bg-primary-50">
        <CardContent className="p-6">
          <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <ArrowRightLeft size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-primary-900 mb-2">Transfer Pricing Module</h3>
              <p className="text-primary-700 mb-3">
                This feature is currently under development and will be available in the next release. 
                It will include comprehensive transfer pricing documentation, analysis tools, and compliance reporting.
              </p>
              <div className="text-sm text-primary-600">
                <p>Expected features:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Transfer pricing documentation upload</li>
                  <li>Economic analysis tools</li>
                  <li>Benchmarking studies</li>
                  <li>Master file and local file preparation</li>
                  <li>Country-by-country reporting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="material-elevation-1">
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
              <Upload size={20} />
              Document Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Upload size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload TP Documentation</h3>
              <p className="text-gray-500 mb-4">
                Upload your transfer pricing studies, agreements, and supporting documentation
              </p>
              <Button disabled className="cursor-not-allowed">
                Upload Documents
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
              <FileText size={20} />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                  <AlertCircle size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Master File</span>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                  <AlertCircle size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Local File</span>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                  <AlertCircle size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">CbC Report</span>
                </div>
                <Badge variant="secondary">Not Required</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="material-elevation-1">
          <CardHeader>
            <CardTitle>UAE Transfer Pricing Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Threshold:</strong> Transfer pricing documentation required for related party 
                transactions exceeding AED 200 million annually.
              </p>
              <p>
                <strong>Master File:</strong> Required for MNE groups with consolidated group revenue 
                exceeding AED 3.15 billion.
              </p>
              <p>
                <strong>Local File:</strong> Required for UAE entities that are part of MNE groups 
                exceeding the master file threshold.
              </p>
              <p>
                <strong>Deadline:</strong> Documentation must be submitted within 30 days of FTA request.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="material-elevation-1">
          <CardHeader>
            <CardTitle>Documentation Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <FileText size={14} />
                <span>Transfer pricing policy</span>
              </div>
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <FileText size={14} />
                <span>Economic analysis and benchmarking</span>
              </div>
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <FileText size={14} />
                <span>Related party agreements</span>
              </div>
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <FileText size={14} />
                <span>Financial statements</span>
              </div>
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <FileText size={14} />
                <span>Organizational structure</span>
              </div>
              <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <FileText size={14} />
                <span>Business description</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribe for Updates */}
      <Card className="material-elevation-1 border-primary-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Stay Updated</h3>
            <p className="text-gray-600 mb-4">
              Get notified when the Transfer Pricing module becomes available
            </p>
            <Button disabled className="cursor-not-allowed">
              Notify Me When Available
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
