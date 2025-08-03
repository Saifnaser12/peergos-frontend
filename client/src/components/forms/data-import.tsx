import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Eye,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { formatFileSize } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface ImportTemplate {
  type: string;
  label: string;
  description: string;
  downloadUrl: string;
  requiredColumns: string[];
  exampleData: Record<string, any>[];
}

const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    type: 'transactions',
    label: 'Financial Transactions',
    description: 'Import revenue and expense transactions in bulk',
    downloadUrl: '/templates/transactions-template.csv',
    requiredColumns: ['date', 'description', 'amount', 'type', 'category'],
    exampleData: [
      { date: '2025-01-15', description: 'Software License Revenue', amount: '5000.00', type: 'REVENUE', category: 'Services' },
      { date: '2025-01-16', description: 'Office Rent', amount: '2500.00', type: 'EXPENSE', category: 'Rent' },
      { date: '2025-01-17', description: 'Client Consulting', amount: '8000.00', type: 'REVENUE', category: 'Consulting' }
    ]
  },
  {
    type: 'invoices',
    label: 'Customer Invoices',
    description: 'Import customer invoices and billing data',
    downloadUrl: '/templates/invoices-template.csv',
    requiredColumns: ['invoice_number', 'client_name', 'issue_date', 'due_date', 'amount', 'vat_amount'],
    exampleData: [
      { invoice_number: 'INV-2025-001', client_name: 'ABC Trading LLC', issue_date: '2025-01-15', due_date: '2025-02-15', amount: '10000.00', vat_amount: '500.00' },
      { invoice_number: 'INV-2025-002', client_name: 'XYZ Services', issue_date: '2025-01-16', due_date: '2025-02-16', amount: '7500.00', vat_amount: '375.00' }
    ]
  },
  {
    type: 'expenses',
    label: 'Business Expenses',
    description: 'Import business expense records and receipts',
    downloadUrl: '/templates/expenses-template.csv',
    requiredColumns: ['date', 'vendor', 'description', 'amount', 'category', 'vat_amount'],
    exampleData: [
      { date: '2025-01-15', vendor: 'Emirates NBD', description: 'Bank charges', amount: '50.00', category: 'Banking', vat_amount: '2.50' },
      { date: '2025-01-16', vendor: 'DEWA', description: 'Electricity bill', amount: '800.00', category: 'Utilities', vat_amount: '40.00' }
    ]
  },
  {
    type: 'chart_of_accounts',
    label: 'Chart of Accounts',
    description: 'Import custom chart of accounts structure',
    downloadUrl: '/templates/chart-of-accounts-template.csv',
    requiredColumns: ['account_code', 'account_name', 'account_type', 'parent_code'],
    exampleData: [
      { account_code: '1000', account_name: 'Cash in Bank', account_type: 'ASSET', parent_code: '' },
      { account_code: '4000', account_name: 'Revenue from Services', account_type: 'REVENUE', parent_code: '' },
      { account_code: '5000', account_name: 'Operating Expenses', account_type: 'EXPENSE', parent_code: '' }
    ]
  }
];

interface DataImportProps {
  onImportComplete?: (result: any) => void;
}

export default function DataImport({ onImportComplete }: DataImportProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate>(IMPORT_TEMPLATES[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/data-import/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setImportResults(data);
      toast({
        title: "Import successful",
        description: `Successfully imported ${data.imported} records. ${data.skipped} records skipped.`,
      });
      onImportComplete?.(data);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed", 
        description: error.message || "Failed to import data. Please check your file format.",
        variant: "destructive",
      });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/data-import/preview', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data.preview || []);
      setShowPreview(true);
    },
    onError: (error: any) => {
      toast({
        title: "Preview failed",
        description: error.message || "Failed to preview data.",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setImportResults(null);
      setShowPreview(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handlePreview = () => {
    if (!uploadedFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('type', selectedTemplate.type);
    
    previewMutation.mutate(formData);
  };

  const handleImport = () => {
    if (!uploadedFile) return;
    
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('type', selectedTemplate.type);
    
    uploadMutation.mutate(formData);
  };

  const downloadTemplate = (template: ImportTemplate) => {
    // Create CSV content from example data
    const headers = template.requiredColumns.join(',');
    const rows = template.exampleData.map(row => 
      template.requiredColumns.map(col => row[col] || '').join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.type}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTemplate.type} onValueChange={(value) => {
            const template = IMPORT_TEMPLATES.find(t => t.type === value);
            if (template) setSelectedTemplate(template);
          }}>
            <TabsList className="grid w-full grid-cols-4">
              {IMPORT_TEMPLATES.map((template) => (
                <TabsTrigger key={template.type} value={template.type} className="text-xs">
                  {template.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {IMPORT_TEMPLATES.map((template) => (
              <TabsContent key={template.type} value={template.type} className="space-y-4">
                <div>
                  <h3 className="font-medium">{template.label}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>

                {/* Template Download */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Download Template</h4>
                      <p className="text-sm text-blue-700">
                        Get the correct format with example data
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadTemplate(template)}
                      className="border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-blue-600 font-medium mb-2">Required columns:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.requiredColumns.map((col) => (
                        <Badge key={col} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  {isDragActive ? (
                    <p className="text-blue-600">Drop your file here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600">Drag & drop your file here, or click to browse</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Supports CSV, XLS, XLSX files up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Uploaded File Info */}
                {uploadedFile && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">{uploadedFile.name}</p>
                          <p className="text-sm text-green-700">{formatFileSize(uploadedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        disabled={previewMutation.isPending}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Data
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={uploadMutation.isPending}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadMutation.isPending ? 'Importing...' : 'Import Data'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Import Progress */}
                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing data...</span>
                      <span>Processing</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                )}

                {/* Import Results */}
                {importResults && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      <div className="space-y-1">
                        <p className="font-medium">Import completed successfully!</p>
                        <div className="text-sm">
                          <p>• {importResults.imported} records imported</p>
                          <p>• {importResults.skipped} records skipped</p>
                          {importResults.errors?.length > 0 && (
                            <p>• {importResults.errors.length} errors encountered</p>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview Data */}
                {showPreview && previewData.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-medium">Data Preview ({previewData.length} rows)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            {template.requiredColumns.map((col) => (
                              <th key={col} className="px-3 py-2 text-left font-medium text-gray-700">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b">
                              {template.requiredColumns.map((col) => (
                                <td key={col} className="px-3 py-2 text-gray-600">
                                  {row[col] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewData.length > 5 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                        ... and {previewData.length - 5} more rows
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}