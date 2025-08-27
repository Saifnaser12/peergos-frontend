import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  Eye,
  Trash2,
  Info,
  Flag,
  Shield,
  Building2
} from 'lucide-react';
import { useSetup } from '@/context/setup-context';
import { useTaxClassification } from '@/context/tax-classification-context';
import { formatCurrency } from '@/lib/business-logic';

const REQUIRED_DOCUMENTS = [
  {
    key: 'tradeLicense',
    name: 'Trade License',
    description: 'Copy of valid UAE trade license',
    required: true,
    acceptedTypes: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'memorandum',
    name: 'Memorandum of Association',
    description: 'Legal document establishing the company',
    required: false,
    acceptedTypes: '.pdf',
  },
];

const CONDITIONAL_DOCUMENTS = [
  {
    key: 'freeZoneDeclaration',
    name: 'Free Zone Declaration',
    description: 'Official Free Zone activity certificate',
    condition: 'freeZone',
    acceptedTypes: '.pdf,.jpg,.jpeg,.png',
  },
  {
    key: 'transferPricingDeclaration',
    name: 'Transfer Pricing Declaration',
    description: 'Declaration for related party transactions',
    condition: 'transferPricing',
    acceptedTypes: '.pdf',
  },
  {
    key: 'auditedFinancials',
    name: 'Audited Financial Statements',
    description: 'Latest audited financial statements (if available)',
    condition: 'audit',
    acceptedTypes: '.pdf',
  },
];

export default function DocumentsReviewStep() {
  const setupContext = useSetup();
  const { classification } = useTaxClassification();
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  // Simple fallback for formData if not available
  const formData = setupContext?.formData || {
    businessInfo: null,
    revenueInfo: null,
    licenseInfo: null,
    freeZoneInfo: null
  };
  
  // Determine which conditional documents are required (simplified)
  const requiredConditionalDocs = CONDITIONAL_DOCUMENTS.filter(doc => {
    switch (doc.condition) {
      case 'freeZone':
        return formData.freeZoneInfo?.isFreeZone;
      case 'transferPricing':
        return false; // Simplified for now
      case 'audit':
        return false; // Simplified for now
      default:
        return false;
    }
  });

  const allRequiredDocs = [...REQUIRED_DOCUMENTS, ...requiredConditionalDocs];

  const handleFileUpload = (docKey: string, file: File | null) => {
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadErrors(prev => ({
          ...prev,
          [docKey]: 'File size must be less than 10MB'
        }));
        return;
      }

      // Clear any previous errors
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[docKey];
        return newErrors;
      });

      if (setupContext?.updateFormData) {
        setupContext.updateFormData('documents', {
          ...formData.documents,
          [docKey]: file,
        });
      }
    }
  };

  const handleFileRemove = (docKey: string) => {
    if (setupContext?.updateFormData) {
      setupContext.updateFormData('documents', {
        ...formData.documents,
        [docKey]: undefined,
      });
    }
  };

  const getUploadedFile = (docKey: string): File | undefined => {
    return formData.documents?.[docKey as keyof typeof formData.documents];
  };

  const isDocumentUploaded = (docKey: string): boolean => {
    return !!getUploadedFile(docKey);
  };

  const allRequiredDocsUploaded = allRequiredDocs
    .filter(doc => 'required' in doc && doc.required !== false)
    .every(doc => isDocumentUploaded(doc.key));

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Document Upload:</strong> Upload required documents to complete your setup. 
          All files are securely encrypted and stored in compliance with UAE data protection laws.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Upload Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <DocumentUploadCard
                  key={doc.key}
                  document={doc}
                  isUploaded={isDocumentUploaded(doc.key)}
                  uploadedFile={getUploadedFile(doc.key)}
                  onUpload={(file) => handleFileUpload(doc.key, file)}
                  onRemove={() => handleFileRemove(doc.key)}
                  error={uploadErrors[doc.key]}
                  required={true}
                />
              ))}
            </CardContent>
          </Card>

          {requiredConditionalDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Required Documents
                  <Badge variant="secondary">Based on your business type</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requiredConditionalDocs.map((doc) => (
                  <DocumentUploadCard
                    key={doc.key}
                    document={doc}
                    isUploaded={isDocumentUploaded(doc.key)}
                    uploadedFile={getUploadedFile(doc.key)}
                    onUpload={(file) => handleFileUpload(doc.key, file)}
                    onRemove={() => handleFileRemove(doc.key)}
                    error={uploadErrors[doc.key]}
                    required={true}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Optional Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Optional Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {REQUIRED_DOCUMENTS.filter(doc => !doc.required).map((doc) => (
                <DocumentUploadCard
                  key={doc.key}
                  document={doc}
                  isUploaded={isDocumentUploaded(doc.key)}
                  uploadedFile={getUploadedFile(doc.key)}
                  onUpload={(file) => handleFileUpload(doc.key, file)}
                  onRemove={() => handleFileRemove(doc.key)}
                  error={uploadErrors[doc.key]}
                  required={false}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Setup Summary */}
        <div className="space-y-4">
          <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Setup Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business Information */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Details
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Company:</strong> {formData.businessInfo?.companyName || 'Not provided'}</div>
                  <div><strong>TRN:</strong> {formData.businessInfo?.trn || '100123456700003'}</div>
                  <div><strong>Industry:</strong> {formData.businessInfo?.industry || 'Not provided'}</div>
                  <div><strong>Revenue:</strong> {formData.revenueInfo?.annualRevenue ? formatCurrency(formData.revenueInfo.annualRevenue) : 'Not provided'}</div>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  License Details
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Type:</strong> {formData.licenseInfo?.licenseType || 'Not provided'}</div>
                  <div><strong>Emirate:</strong> {formData.licenseInfo?.emirate || 'Not provided'}</div>
                  {formData.freeZoneInfo?.isFreeZone && (
                    <div><strong>Free Zone:</strong> {formData.freeZoneInfo.freeZoneName || 'Not specified'}</div>
                  )}
                </div>
              </div>

              {/* Tax Classification */}
              {classification && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Tax Classification
                  </h4>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {classification.badge}
                  </Badge>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><strong>CIT Rate:</strong> {classification.citRate}%</div>
                    <div><strong>VAT Required:</strong> {classification.vatRequired ? 'Yes' : 'No'}</div>
                    {classification.transferPricingRequired && (
                      <div><strong>Transfer Pricing:</strong> Required</div>
                    )}
                  </div>
                </div>
              )}

              {/* UAE Integration */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  UAE Integration
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>UAE Pass:</strong> {formData.uaeIntegration?.hasUAEPass ? 'Yes' : 'No'}</div>
                  <div><strong>FTA Integration:</strong> {formData.uaeIntegration?.ftaIntegrationConsent ? 'Authorized' : 'Not authorized'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Status */}
          <Card className={allRequiredDocsUploaded ? 'border-green-200 bg-green-50/30' : 'border-yellow-200 bg-yellow-50/30'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {allRequiredDocsUploaded ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <h4 className="font-medium">
                  {allRequiredDocsUploaded ? 'All Documents Uploaded' : 'Missing Required Documents'}
                </h4>
              </div>
              <p className="text-sm text-gray-700">
                {allRequiredDocsUploaded 
                  ? 'Your setup is complete and ready for submission.'
                  : `Please upload ${allRequiredDocs.filter(doc => ('required' in doc && doc.required !== false) && !isDocumentUploaded(doc.key)).length} more required document(s).`
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface DocumentUploadCardProps {
  document: {
    key: string;
    name: string;
    description: string;
    acceptedTypes: string;
  };
  isUploaded: boolean;
  uploadedFile?: File;
  onUpload: (file: File | null) => void;
  onRemove: () => void;
  error?: string;
  required: boolean;
}

function DocumentUploadCard({
  document,
  isUploaded,
  uploadedFile,
  onUpload,
  onRemove,
  error,
  required,
}: DocumentUploadCardProps) {
  return (
    <div className={`p-4 border rounded-lg ${isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{document.name}</h4>
            {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            {isUploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>
          <p className="text-sm text-gray-600">{document.description}</p>
        </div>
      </div>

      {!isUploaded ? (
        <div className="space-y-2">
          <Label htmlFor={`upload-${document.key}`} className="cursor-pointer">
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              <div className="text-center">
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                <p className="text-xs text-gray-500 mt-1">
                  Accepted: {document.acceptedTypes} (Max 10MB)
                </p>
              </div>
            </div>
          </Label>
          <Input
            id={`upload-${document.key}`}
            type="file"
            accept={document.acceptedTypes}
            onChange={(e) => {
              const file = e.target.files?.[0];
              onUpload(file || null);
            }}
            className="hidden"
          />
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-white rounded border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{uploadedFile?.name}</p>
              <p className="text-xs text-gray-600">
                {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Uploaded'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}