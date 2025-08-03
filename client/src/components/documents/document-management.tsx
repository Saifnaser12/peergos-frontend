import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { formatFileSize } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import DocumentUploader, { DOCUMENT_CATEGORIES } from './document-uploader';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  category: keyof typeof DOCUMENT_CATEGORIES;
  companyId: number;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  status: 'active' | 'archived' | 'deleted';
  tags?: string[];
  description?: string;
}

interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  byCategory: Record<string, number>;
  compliance: {
    requiredDocuments: string[];
    missingDocuments: string[];
    completionRate: number;
  };
}

export default function DocumentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/documents', company?.id, selectedCategory, searchTerm, sortBy, sortOrder],
    enabled: !!company?.id,
  });

  // Fetch document statistics
  const { data: stats } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats', company?.id],
    enabled: !!company?.id,
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Deleted',
        description: 'Document removed successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete document.',
        variant: 'destructive'
      });
    }
  });

  // Archive document mutation
  const archiveMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/archive`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to archive document');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Archived',
        description: 'Document archived successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Archive Failed',
        description: error.message || 'Failed to archive document.',
        variant: 'destructive'
      });
    }
  });

  const filteredDocuments = (documents as Document[]).filter((doc: Document) => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }).sort((a: Document, b: Document) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType === 'application/pdf') return '📄';
    return '📁';
  };

  const getCategoryBadgeColor = (category: keyof typeof DOCUMENT_CATEGORIES) => {
    const colors = {
      TRN_CERTIFICATE: 'bg-red-100 text-red-800',
      INVOICES_RECEIPTS: 'bg-blue-100 text-blue-800',
      BANK_STATEMENTS: 'bg-green-100 text-green-800',
      AUDIT_TRAIL: 'bg-purple-100 text-purple-800',
      CIT_SUPPORTING: 'bg-orange-100 text-orange-800',
      TRANSFER_PRICING: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Document Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Storage</p>
                  <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold">{Math.round(stats.compliance.completionRate)}%</p>
                </div>
                {stats.compliance.completionRate >= 80 ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Missing Documents</p>
                  <p className="text-2xl font-bold">{stats.compliance.missingDocuments.length}</p>
                </div>
                <Info className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Alert */}
      {stats && stats.compliance.missingDocuments.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p><strong>Missing Required Documents:</strong></p>
              <ul className="list-disc list-inside ml-4">
                {stats.compliance.missingDocuments.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="manage">Manage Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => (
              <DocumentUploader
                key={key}
                category={key as keyof typeof DOCUMENT_CATEGORIES}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/documents/stats'] });
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(DOCUMENT_CATEGORIES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'size') => setSortBy(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No documents match your search.' : 'No documents uploaded yet.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc: Document) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{getFileIcon(doc.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{doc.name}</p>
                            <Badge className={getCategoryBadgeColor(doc.category)}>
                              {DOCUMENT_CATEGORIES[doc.category].label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span>{formatFileSize(doc.size)}</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            <span>Uploaded by {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.url;
                            link.download = doc.name;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveMutation.mutate(doc.id)}
                          disabled={archiveMutation.isPending}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}