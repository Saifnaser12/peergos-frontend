import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateAgentCertificate } from '@/lib/tax-agents';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  id: string;
  uploadedAt: Date;
  previewUrl?: string;
}

interface CertificateUploaderProps {
  title?: string;
  description?: string;
  onFileUploaded: (file: UploadedFile) => void;
  onFileRemoved: (fileId: string) => void;
  uploadedFiles: UploadedFile[];
  maxFiles?: number;
  required?: boolean;
  className?: string;
}

export default function CertificateUploader({
  title = 'Tax Agent Certificate',
  description = 'Upload your tax agent certificate (PDF or JPG format)',
  onFileUploaded,
  onFileRemoved,
  uploadedFiles,
  maxFiles = 1,
  required = false,
  className = ''
}: CertificateUploaderProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { language } = useLanguage();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      for (const file of acceptedFiles) {
        // Validate file
        const validation = validateAgentCertificate(file);
        if (!validation.isValid) {
          setUploadError(validation.error || 'Invalid file');
          continue;
        }

        // Create preview URL for images
        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const uploadedFile: UploadedFile = {
          file,
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date(),
          previewUrl,
        };

        onFileUploaded(uploadedFile);
      }
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploadedFiles.length >= maxFiles || isUploading,
  });

  const handleRemoveFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    onFileRemoved(fileId);
    setUploadError(null);
  };

  const handlePreviewFile = (file: UploadedFile) => {
    if (file.previewUrl) {
      window.open(file.previewUrl, '_blank');
    } else if (file.file.type === 'application/pdf') {
      const url = URL.createObjectURL(file.file);
      window.open(url, '_blank');
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUploadMore = uploadedFiles.length < maxFiles;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          {title}
          {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canUploadMore && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-3">
              <div className="flex justify-center">
                {isUploading ? (
                  <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isUploading 
                    ? 'Uploading...' 
                    : isDragActive 
                    ? 'Drop your certificate here' 
                    : 'Upload tax agent certificate'
                  }
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'ar' 
                    ? 'اسحب وأفلت الملفات أو انقر للتصفح'
                    : 'Drag & drop files or click to browse'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, JPG, PNG up to 5MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {uploadError}
            </AlertDescription>
          </Alert>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">
              {language === 'ar' ? 'الملفات المرفوعة:' : 'Uploaded Files:'}
            </h4>
            
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{formatFileSize(uploadedFile.file.size)}</span>
                      <span>•</span>
                      <span>
                        {language === 'ar' ? 'رُفع في' : 'Uploaded'} {uploadedFile.uploadedAt.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'مُرفق' : 'Uploaded'}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewFile(uploadedFile)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(uploadedFile.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* File Limit Info */}
        {maxFiles > 1 && (
          <div className="text-xs text-gray-500 text-center">
            {uploadedFiles.length} of {maxFiles} files uploaded
          </div>
        )}

        {/* Compliance Note */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>
              {language === 'ar' 
                ? 'ملاحظة امتثال:' 
                : 'Compliance Note:'
              }
            </strong>{' '}
            {language === 'ar'
              ? 'وفقاً للمادة 10 من قانون الإجراءات الضريبية الإماراتي، يجب أن تكون شهادة وكيل الضرائب سارية المفعول ومُحدثة.'
              : 'As per Article 10 of the UAE Tax Procedures Law, tax agent certificates must be current and valid for representation purposes.'
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}