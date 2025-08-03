import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  File, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { formatFileSize } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Document categories for UAE tax compliance
export const DOCUMENT_CATEGORIES = {
  TRN_CERTIFICATE: {
    label: 'TRN Certificate',
    description: 'Tax Registration Number certificate from FTA',
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    required: true
  },
  INVOICES_RECEIPTS: {
    label: 'Invoices & Receipts',
    description: 'Sales invoices, purchase receipts, and supporting documents',
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 25 * 1024 * 1024, // 25MB
    required: false
  },
  BANK_STATEMENTS: {
    label: 'Bank Statements',
    description: 'Monthly bank statements for reconciliation',
    allowedTypes: ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 50 * 1024 * 1024, // 50MB
    required: false
  },
  AUDIT_TRAIL: {
    label: 'Audit Trail Documents',
    description: 'Supporting documents for audit and compliance',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 100 * 1024 * 1024, // 100MB
    required: false
  },
  CIT_SUPPORTING: {
    label: 'CIT Supporting Documents',
    description: 'Corporate Income Tax supporting documentation',
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 50 * 1024 * 1024, // 50MB
    required: false
  },
  TRANSFER_PRICING: {
    label: 'Transfer Pricing Documents',
    description: 'Transfer pricing documentation and studies',
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 200 * 1024 * 1024, // 200MB
    required: false
  }
} as const;

type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES;

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: DocumentCategory;
  uploadedAt: string;
  url?: string;
  status: 'uploading' | 'completed' | 'failed';
  progress: number;
}

interface DocumentUploaderProps {
  category: DocumentCategory;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  className?: string;
}

export default function DocumentUploader({
  category,
  onUploadComplete,
  maxFiles = 10,
  className = ''
}: DocumentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoryConfig = DOCUMENT_CATEGORIES[category];

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setIsUploading(true);
      const uploadPromises = files.map(async (file) => {
        // Create file record
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          category,
          uploadedAt: new Date().toISOString(),
          status: 'uploading',
          progress: 0
        };

        setUploadedFiles(prev => [...prev, newFile]);

        try {
          // Get upload URL from backend
          const uploadResponse = await apiRequest('/api/documents/upload-url', {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              category,
              companyId: company?.id
            })
          });

          // Upload file to storage
          const formData = new FormData();
          formData.append('file', file);

          const uploadResult = await fetch(uploadResponse.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          if (!uploadResult.ok) {
            throw new Error('Upload failed');
          }

          // Update file record with completion
          const completeResponse = await apiRequest('/api/documents', {
            method: 'POST',
            body: JSON.stringify({
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.type,
              category,
              companyId: company?.id,
              url: uploadResponse.finalUrl
            })
          });

          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'completed' as const, progress: 100, url: completeResponse.url }
              : f
          ));

          return completeResponse;
        } catch (error) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'failed' as const }
              : f
          ));
          throw error;
        }
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: (results) => {
      toast({
        title: 'Upload Successful',
        description: `${results.length} file(s) uploaded successfully.`
      });
      onUploadComplete?.(uploadedFiles.filter(f => f.status === 'completed'));
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload files.',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiRequest(`/api/documents/${fileId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, fileId) => {
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: 'File Deleted',
        description: 'Document removed successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete file.',
        variant: 'destructive'
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => 
        `${rejection.file.name}: ${rejection.errors.map((e: any) => e.message).join(', ')}`
      );
      toast({
        title: 'Invalid Files',
        description: errors.join('\n'),
        variant: 'destructive'
      });
    }

    // Check total file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast({
        title: 'Too Many Files',
        description: `Maximum ${maxFiles} files allowed per category.`,
        variant: 'destructive'
      });
      return;
    }

    // Upload accepted files
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles);
    }
  }, [uploadedFiles.length, maxFiles, uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: categoryConfig.allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: categoryConfig.maxSize,
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: isUploading
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Uploading</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Failed</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {categoryConfig.label}
              {categoryConfig.required && (
                <Badge variant="outline" className="bg-red-50 text-red-700">Required</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {categoryConfig.description}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {uploadedFiles.length} / {maxFiles} files
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File format requirements */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div><strong>Allowed formats:</strong> {categoryConfig.allowedTypes.map(type => {
                const ext = type.split('/')[1];
                return ext.toUpperCase();
              }).join(', ')}</div>
              <div><strong>Maximum size:</strong> {formatFileSize(categoryConfig.maxSize)}</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600">Drop files here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                {categoryConfig.allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} files up to {formatFileSize(categoryConfig.maxSize)}
              </p>
            </div>
          )}
        </div>

        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-medium">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        {getStatusBadge(file.status)}
                      </div>
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="w-full mt-2 h-2" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && file.url && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url!;
                            link.download = file.name;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {file.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => uploadMutation.mutate([new File([], file.name)])}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(file.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload status */}
        {isUploading && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Uploading files... Please don't close this window.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}