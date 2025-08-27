import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  FileImage, 
  Scan, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Edit3,
  Save,
  Loader2,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/business-logic';
import { ExtractedInvoiceData, UAE_BusinessRules, expenseRecognitionService } from '@/lib/ocr-service';
import { cn } from '@/lib/utils';

interface ExpenseScannerProps {
  onExpenseExtracted: (expense: ProcessedExpenseData) => void;
  className?: string;
}

export interface ProcessedExpenseData {
  extractedData: ExtractedInvoiceData;
  businessRules: UAE_BusinessRules;
  originalFile: File;
  finalData: {
    supplierName: string;
    category: string;
    amount: number;
    vatAmount: number;
    netAmount: number;
    date: string;
    description: string;
    vatEligible: boolean;
    trn?: string;
    invoiceNumber?: string;
  };
}

export default function ExpenseScanner({ onExpenseExtracted, className = '' }: ExpenseScannerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [businessRules, setBusinessRules] = useState<UAE_BusinessRules | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ExtractedInvoiceData>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
      setBusinessRules(null);
      setIsEditing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleScan = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    try {
      await expenseRecognitionService.initialize();
      
      let extracted: ExtractedInvoiceData;
      if (uploadedFile.type === 'application/pdf') {
        extracted = await expenseRecognitionService.extractFromPDF(uploadedFile);
      } else {
        extracted = await expenseRecognitionService.extractFromImage(uploadedFile);
      }

      const rules = expenseRecognitionService.applyBusinessRules(extracted.supplierName, extracted);
      
      setExtractedData(extracted);
      setBusinessRules(rules);
      setEditedData(extracted);
    } catch (error) {
      console.error('Scanning failed:', error);
      // Show error state
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!extractedData || !businessRules || !uploadedFile) return;

    const finalExtracted = { ...extractedData, ...editedData };
    
    const processedExpense: ProcessedExpenseData = {
      extractedData: finalExtracted,
      businessRules,
      originalFile: uploadedFile,
      finalData: {
        supplierName: finalExtracted.supplierName,
        category: businessRules.category,
        amount: finalExtracted.totalAmount || 0,
        vatAmount: finalExtracted.vatAmount || 0,
        netAmount: finalExtracted.netAmount || (finalExtracted.totalAmount || 0) - (finalExtracted.vatAmount || 0),
        date: finalExtracted.invoiceDate || new Date().toISOString().split('T')[0],
        description: finalExtracted.description || 'Scanned expense',
        vatEligible: businessRules.vatEligible,
        trn: finalExtracted.trn,
        invoiceNumber: finalExtracted.invoiceNumber,
      },
    };

    onExpenseExtracted(processedExpense);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-blue-600" />
          AI Expense Scanner
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload receipts and invoices for automatic data extraction and categorization
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Upload */}
        {!uploadedFile && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive && "border-blue-500 bg-blue-50",
              "hover:border-gray-400"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your receipt here' : 'Upload receipt or invoice'}
              </p>
              <p className="text-sm text-gray-600">
                Drag & drop files or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, PDF (max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Uploaded File Preview */}
        {uploadedFile && (
          <Card className="border border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileImage className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {previewUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  )}
                  <Button
                    onClick={handleScan}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-1" />
                        Scan Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Data Display */}
        {extractedData && businessRules && (
          <div className="space-y-6">
            {/* Confidence and Category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getConfidenceColor(extractedData.confidence)}>
                  {getConfidenceLabel(extractedData.confidence)} Confidence
                </Badge>
                <Badge className="bg-purple-100 text-purple-800">
                  {businessRules.category}
                </Badge>
                {businessRules.vatEligible ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    VAT Eligible
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">
                    VAT Exempt
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                {isEditing ? 'View' : 'Edit'}
              </Button>
            </div>

            {/* Business Rules Insight */}
            {businessRules.confidence > 0.5 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Auto-categorized:</strong> Detected as {businessRules.category} 
                  {businessRules.keywords.length > 0 && (
                    <span> (matched: {businessRules.keywords.join(', ')})</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Extracted Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Supplier Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Supplier Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedData.supplierName || extractedData.supplierName}
                        onChange={(e) => setEditedData(prev => ({ ...prev, supplierName: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{extractedData.supplierName}</p>
                    )}
                  </div>
                  
                  {extractedData.trn && (
                    <div>
                      <Label>TRN</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.trn || extractedData.trn}
                          onChange={(e) => setEditedData(prev => ({ ...prev, trn: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-mono mt-1">{extractedData.trn}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extractedData.invoiceNumber && (
                    <div>
                      <Label>Invoice Number</Label>
                      {isEditing ? (
                        <Input
                          value={editedData.invoiceNumber || extractedData.invoiceNumber}
                          onChange={(e) => setEditedData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">{extractedData.invoiceNumber}</p>
                      )}
                    </div>
                  )}
                  
                  {extractedData.invoiceDate && (
                    <div>
                      <Label>Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedData.invoiceDate || extractedData.invoiceDate}
                          onChange={(e) => setEditedData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-medium mt-1">
                          {new Date(extractedData.invoiceDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Total Amount</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.totalAmount || extractedData.totalAmount || ''}
                          onChange={(e) => setEditedData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-lg font-bold text-green-600 mt-1">
                          {extractedData.totalAmount ? formatCurrency(extractedData.totalAmount) : 'Not detected'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>VAT Amount</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.vatAmount || extractedData.vatAmount || ''}
                          onChange={(e) => setEditedData(prev => ({ ...prev, vatAmount: parseFloat(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {extractedData.vatAmount ? formatCurrency(extractedData.vatAmount) : 'Not detected'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Net Amount</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedData.netAmount || extractedData.netAmount || ''}
                          onChange={(e) => setEditedData(prev => ({ ...prev, netAmount: parseFloat(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {extractedData.netAmount ? formatCurrency(extractedData.netAmount) : 'Not detected'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={editedData.description || extractedData.description || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter expense description"
                    />
                  ) : (
                    <p className="text-sm">{extractedData.description || 'No description detected'}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Raw Text (for debugging) */}
            {extractedData.confidence < 0.7 && (
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  View Raw Extracted Text (for debugging)
                </summary>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {extractedData.rawText}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setPreviewUrl(null);
                  setExtractedData(null);
                  setBusinessRules(null);
                  setIsEditing(false);
                }}
              >
                Start Over
              </Button>
              
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Expense
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}