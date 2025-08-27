import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Document categories based on UAE tax compliance requirements
export const DOCUMENT_CATEGORIES = {
  TRN_CERTIFICATE: {
    label: 'TRN Certificate',
    description: 'Tax Registration Number Certificate',
    required: true,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  INVOICES_RECEIPTS: {
    label: 'Invoices & Receipts',
    description: 'Sales invoices, purchase receipts, expense documentation',
    required: false,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.csv']
  },
  VAT_DOCUMENTS: {
    label: 'VAT Documents',
    description: 'VAT returns, VAT certificates, import/export documents',
    required: false,
    acceptedTypes: ['.pdf', '.xlsx', '.csv']
  },
  BANK_STATEMENTS: {
    label: 'Bank Statements',
    description: 'Monthly bank statements and financial records',
    required: false,
    acceptedTypes: ['.pdf', '.xlsx', '.csv']
  },
  CONTRACTS_AGREEMENTS: {
    label: 'Contracts & Agreements',
    description: 'Business contracts, lease agreements, service agreements',
    required: false,
    acceptedTypes: ['.pdf', '.doc', '.docx']
  },
  LICENSES_PERMITS: {
    label: 'Licenses & Permits', 
    description: 'Trade licenses, professional permits, regulatory approvals',
    required: true,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  FINANCIAL_STATEMENTS: {
    label: 'Financial Statements',
    description: 'Audited financial statements, management accounts',
    required: false,
    acceptedTypes: ['.pdf', '.xlsx']
  },
  OTHER: {
    label: 'Other Documents',
    description: 'Miscellaneous business documents',
    required: false,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xlsx', '.csv']
  }
};

const uploadSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface DocumentUploaderProps {
  onUploadComplete?: () => void;
  maxFileSize?: number;
  className?: string;
}

export default function DocumentUploader({ 
  onUploadComplete, 
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  className 
}: DocumentUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const { company, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      category: '',
      description: '',
      tags: '',
      expiryDate: '',
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData & { files: File[] }) => {
      const uploadPromises = data.files.map(async (file) => {
        // Get upload URL
        const uploadUrlResponse = await apiRequest('/api/documents/upload-url', {
          method: 'POST',
          body: {
            fileName: file.name,
            fileType: file.type,
            category: data.category,
            companyId: company?.id,
          },
        });

        // Upload file to object storage
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Create document record
        const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];
        const documentRecord = await apiRequest('/api/documents', {
          method: 'POST',
          body: {
            name: file.name.split('.')[0],
            originalName: file.name,
            size: file.size,
            type: file.type,
            category: data.category,
            companyId: company?.id,
            url: uploadUrlResponse.finalUrl,
            objectPath: uploadUrlResponse.objectPath,
            tags,
            description: data.description,
            expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
          },
        });

        return documentRecord;
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: (results) => {
      toast({
        title: "Upload Successful",
        description: `${results.length} document(s) uploaded successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedFiles([]);
      setUploadProgress({});
      form.reset();
      setIsOpen(false);
      onUploadComplete?.();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the maximum file size of ${Math.round(maxFileSize / 1024 / 1024)}MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleSubmit = (data: UploadFormData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ ...data, files: selectedFiles });
  };

  const selectedCategory = form.watch('category');
  const categoryInfo = selectedCategory ? DOCUMENT_CATEGORIES[selectedCategory as keyof typeof DOCUMENT_CATEGORIES] : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2", className)}>
          <Upload className="h-4 w-4" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Tax Documents</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {category.label}
                            {category.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoryInfo && (
                    <p className="text-sm text-gray-600">{categoryInfo.description}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Area */}
            <div className="space-y-4">
              <Label>Files</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-gray-300",
                  "hover:border-primary hover:bg-primary/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept={categoryInfo?.acceptedTypes.join(',') || '*'}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-600">
                    Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB
                  </p>
                  {categoryInfo && (
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: {categoryInfo.acceptedTypes.join(', ')}
                    </p>
                  )}
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({selectedFiles.length})</Label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadProgress[file.name] !== undefined && (
                          <div className="w-20">
                            <Progress value={uploadProgress[file.name]} className="h-2" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={uploadMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Fields */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description for these documents..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tags separated by commas (e.g., Q1, 2024, urgent)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Date for Certificates */}
            {categoryInfo?.required && (
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expiry Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-600">
                      Set expiry date for certificates and licenses to get renewal reminders
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending || selectedFiles.length === 0}
              >
                {uploadMutation.isPending ? "Uploading..." : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}