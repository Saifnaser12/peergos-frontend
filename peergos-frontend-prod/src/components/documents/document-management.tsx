import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Upload, 
  Search, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import DocumentUploader from './document-uploader';
import DocumentList from './document-list';
import { cn } from '@/lib/utils';

export default function DocumentManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const { company } = useAuth();
  const { language, t } = useLanguage();

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Company Setup Required</strong><br />
            Please complete your company profile setup to access document management features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-2">
            Upload, organize, and manage your UAE tax compliance documents
          </p>
        </div>
        <DocumentUploader className="w-full md:w-auto" />
      </div>

      {/* Compliance Status Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">UAE FTA Compliance Status</h3>
                <p className="text-sm text-blue-700">
                  Keep your documents organized and readily available for tax compliance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Required</span>
                </div>
                <p className="text-xs text-gray-600">TRN & Licenses</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <p className="text-xs text-gray-600">VAT Documents</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Archive className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Organized</span>
                </div>
                <p className="text-xs text-gray-600">7-Year Retention</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Browse Documents
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance Guide
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DocumentUploader className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Documents
                </DocumentUploader>
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Search Documents
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  View Archived
                </Button>
              </CardContent>
            </Card>

            {/* Document Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Document Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">TRN Certificate</span>
                    <Badge variant="outline" className="text-xs text-green-600">Required</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Invoices & Receipts</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VAT Documents</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bank Statements</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Licenses & Permits</span>
                    <Badge variant="outline" className="text-xs text-green-600">Required</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Compliance Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert className="border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Document Retention</strong><br />
                    UAE FTA requires 7-year document retention for tax compliance.
                  </AlertDescription>
                </Alert>
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Digital Records</strong><br />
                    Electronic records are accepted for FTA audits and inspections.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Document Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="font-medium">No recent activity</p>
                    <p className="text-sm text-gray-600">Upload your first document to get started</p>
                  </div>
                  <span className="text-xs text-gray-500">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <DocumentList />
        </TabsContent>

        {/* Compliance Guide Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                UAE FTA Document Compliance Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Required Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">Required Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h4 className="font-medium text-green-800">TRN Certificate</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Tax Registration Number certificate issued by FTA. Required for all tax-registered businesses.
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs text-green-600">Mandatory</Badge>
                  </div>
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h4 className="font-medium text-green-800">Trade License</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Valid trade license from relevant authority. Must be renewed before expiry.
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs text-green-600">Mandatory</Badge>
                  </div>
                </div>
              </div>

              {/* Recommended Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Recommended Documents</h3>
                <div className="space-y-3">
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-800">Invoices & Receipts</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      All sales invoices, purchase receipts, and expense documentation. Required for VAT and CIT calculations.
                    </p>
                  </div>
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-800">Bank Statements</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Monthly bank statements showing all business transactions. Essential for financial reconciliation.
                    </p>
                  </div>
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-800">VAT Returns & Documents</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Filed VAT returns, VAT certificates, and supporting documentation for VAT claims and calculations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compliance Tips */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-600">Compliance Best Practices</h3>
                <div className="space-y-3">
                  <Alert className="border-purple-200 bg-purple-50">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>7-Year Retention:</strong> Keep all documents for at least 7 years as required by UAE FTA regulations.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-purple-200 bg-purple-50">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>Digital Acceptance:</strong> Electronic documents and records are fully accepted by FTA for audits.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-purple-200 bg-purple-50">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>Regular Backups:</strong> Maintain secure backups of all tax-related documents and records.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-purple-200 bg-purple-50">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>Easy Access:</strong> Ensure documents can be quickly retrieved for FTA inspections and audits.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}