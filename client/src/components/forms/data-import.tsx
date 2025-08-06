import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Eye,
  FileText,
  BarChart3
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{ row: number; error: string }>;
  summary: {
    transactions: number;
    invoices: number;
    customers: number;
  };
}

interface DataImportProps {
  onImportComplete?: (result: ImportResult) => void;
}

const IMPORT_TEMPLATES = {
  transactions: {
    name: 'Transactions',
    description: 'Import accounting transactions',
    requiredColumns: ['date', 'description', 'amount', 'type', 'category'],
    optionalColumns: ['vat_amount', 'reference', 'notes'],
    sampleData: [
      ['2025-01-15', 'Office supplies', '500.00', 'EXPENSE', 'Office Supplies', '25.00', 'REF001', 'Monthly supplies'],
      ['2025-01-16', 'Client payment', '5000.00', 'REVENUE', 'Sales Revenue', '250.00', 'INV001', 'Payment received']
    ]
  },
  invoices: {
    name: 'Invoices',
    description: 'Import customer invoices',
    requiredColumns: ['invoice_number', 'customer_name', 'issue_date', 'due_date', 'amount'],
    optionalColumns: ['customer_email', 'customer_address', 'vat_amount', 'description'],
    sampleData: [
      ['INV-001', 'ABC Company', '2025-01-15', '2025-02-15', '5000.00', 'abc@company.com', 'Dubai, UAE', '250.00', 'Consulting services'],
      ['INV-002', 'XYZ Corp', '2025-01-16', '2025-02-16', '3000.00', 'contact@xyz.com', 'Abu Dhabi, UAE', '150.00', 'Software development']
    ]
  },
  customers: {
    name: 'Customers',
    description: 'Import customer database',
    requiredColumns: ['name', 'email'],
    optionalColumns: ['phone', 'address', 'company', 'trn'],
    sampleData: [
      ['John Doe', 'john@example.com', '+971501234567', 'Dubai, UAE', 'ABC Trading', '100123456700003'],
      ['Jane Smith', 'jane@company.com', '+971509876543', 'Abu Dhabi, UAE', 'XYZ Corp', '100987654300001']
    ]
  }
};

export default function DataImport({ onImportComplete }: DataImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('transactions');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<ImportResult, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/data-import/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/kpi-data'] });
      
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successfulRows} of ${result.totalRows} rows`,
      });
      
      onImportComplete?.(result);
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import data',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV or Excel file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      setPreviewData(null);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('template', selectedTemplate);
      formData.append('preview', 'true');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const response = await fetch('/api/data-import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Preview failed');
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setPreviewData(result.data);
      setShowPreview(true);
      
      toast({
        title: 'Preview Ready',
        description: `Loaded ${result.data.length} rows for preview`,
      });
    } catch (error: any) {
      toast({
        title: 'Preview Failed',
        description: error.message || 'Failed to preview data',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('template', selectedTemplate);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      await uploadMutation.mutateAsync(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = (templateKey: string) => {
    const template = IMPORT_TEMPLATES[templateKey as keyof typeof IMPORT_TEMPLATES];
    if (!template) return;

    const headers = [...template.requiredColumns, ...template.optionalColumns];
    const csvContent = [
      headers.join(','),
      ...template.sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.toLowerCase()}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: `${template.name} template has been downloaded`,
    });
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(IMPORT_TEMPLATES).map(([key, template]) => (
              <Card 
                key={key} 
                className={`cursor-pointer transition-colors ${
                  selectedTemplate === key ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplate(key)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(key);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.requiredColumns.slice(0, 3).map((col) => (
                        <Badge key={col} variant="secondary" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                      {template.requiredColumns.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.requiredColumns.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Data File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-600">
                  Supports CSV, XLS, and XLSX files (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetImport}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Action Buttons */}
            {selectedFile && !isUploading && (
              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview Data
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={uploadMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      {showPreview && previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Showing first 10 rows. Review the data before importing.
                </AlertDescription>
              </Alert>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {previewData[0] && Object.keys(previewData[0]).map((header) => (
                        <th key={header} className="border border-gray-300 px-4 py-2 text-left">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((cell: any, cellIndex) => (
                          <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.successfulRows}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failedRows}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.totalRows}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>

              {/* Success Alert */}
              {importResult.success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Import completed successfully! {importResult.successfulRows} records imported.
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    <div className="space-y-2">
                      <p className="font-medium">Import Errors:</p>
                      <ul className="text-sm space-y-1">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>
                            Row {error.row}: {error.error}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>... and {importResult.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}