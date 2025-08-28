import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesUpload: (files: File[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesUpload,
  acceptedFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension && !acceptedFileTypes.includes(fileExtension)) {
      return `File "${file.name}" has an unsupported format. Accepted formats: ${acceptedFileTypes.join(', ')}.`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setUploadErrors(errors);

    if (validFiles.length > 0) {
      onFilesUpload(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver
            ? "border-primary-400 bg-primary-50"
            : "border-gray-300 hover:border-gray-400"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <CardContent className="p-8 text-center">
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4",
            isDragOver ? "text-primary-500" : "text-gray-400"
          )} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload Supporting Documents
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <div className="text-sm text-gray-500">
            <p>Supported formats: {acceptedFileTypes.join(', ').toUpperCase()}</p>
            <p>Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB</p>
            {multiple && <p>Multiple files allowed</p>}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.map(type => `.${type}`).join(',')}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {uploadErrors.length > 0 && (
        <div className="space-y-2">
          {uploadErrors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadErrors(prev => prev.filter((_, i) => i !== index))}
                className="ml-auto p-1 h-auto"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}