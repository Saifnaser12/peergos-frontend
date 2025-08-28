import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Filter,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import type { TaxFiling } from '../../shared/schema';

interface FilingHistoryTableProps {
  taxType: 'CIT' | 'VAT';
  companyId: number;
  className?: string;
}

interface FilingWithStatus extends TaxFiling {
  isOverdue?: boolean;
  daysPastDue?: number;
}

export default function FilingHistoryTable({ taxType, companyId, className = '' }: FilingHistoryTableProps) {
  const { language } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch tax filings data
  const { data: filings = [], isLoading, error } = useQuery({
    queryKey: ['/api/tax-filings', companyId, taxType],
    queryFn: async () => {
      const response = await fetch(`/api/tax-filings?companyId=${companyId}&type=${taxType}`);
      if (!response.ok) throw new Error('Failed to fetch tax filings');
      return response.json() as TaxFiling[];
    },
  });

  // Process filings with overdue status
  const processedFilings: FilingWithStatus[] = filings.map(filing => {
    const dueDate = new Date(filing.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now && filing.status !== 'ACCEPTED' && filing.status !== 'SUBMITTED';
    const daysPastDue = isOverdue ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      ...filing,
      isOverdue,
      daysPastDue
    };
  });

  // Filter filings based on year, status, and search
  const filteredFilings = processedFilings.filter(filing => {
    const filingYear = new Date(filing.dueDate).getFullYear().toString();
    const matchesYear = selectedYear === 'ALL' || filingYear === selectedYear;
    const matchesStatus = statusFilter === 'ALL' || filing.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      filing.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      filing.ftaReference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesYear && matchesStatus && matchesSearch;
  });

  // Get available years from filings
  const availableYears = Array.from(new Set(
    filings.map(filing => new Date(filing.dueDate).getFullYear().toString())
  )).sort((a, b) => parseInt(b) - parseInt(a));

  // Status badge configuration
  const getStatusBadge = (status: string, isOverdue?: boolean) => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {language === 'ar' ? 'متأخر' : 'Overdue'}
        </Badge>
      );
    }

    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <FileText className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مسودة' : 'Draft'}
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مُقدم' : 'Submitted'}
          </Badge>
        );
      case 'VERIFIED':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <FileCheck className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'تم التحقق' : 'Verified'}
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مقبول' : 'Accepted'}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مرفوض' : 'Rejected'}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  // Download handler
  const handleDownload = async (filing: TaxFiling) => {
    try {
      const response = await fetch(`/api/tax-filings/${filing.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${taxType}_Return_${filing.period}_${filing.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // You might want to show a toast notification here
    }
  };

  // Get overdue periods
  const overdueFilings = processedFilings.filter(filing => filing.isOverdue);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading filing history...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {language === 'ar' 
                ? 'فشل في تحميل سجل الإقرارات. يرجى المحاولة مرة أخرى.'
                : 'Failed to load filing history. Please try again.'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          {language === 'ar' ? `سجل إقرارات ${taxType}` : `${taxType} Filing History`}
        </CardTitle>
        
        {/* Overdue Alerts */}
        {overdueFilings.length > 0 && (
          <Alert className="border-red-200 bg-red-50 mt-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>
                {language === 'ar' ? 'تحذير: إقرارات متأخرة' : 'Warning: Overdue Returns'}
              </strong>
              <br />
              {language === 'ar' 
                ? `لديك ${overdueFilings.length} إقرار(ات) متأخرة. يرجى تقديمها في أقرب وقت ممكن لتجنب الغرامات.`
                : `You have ${overdueFilings.length} overdue return(s). Please submit them as soon as possible to avoid penalties.`
              }
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year-filter">
              {language === 'ar' ? 'السنة' : 'Year'}
            </Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر السنة' : 'Select Year'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {language === 'ar' ? 'جميع السنوات' : 'All Years'}
                </SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Select Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {language === 'ar' ? 'جميع الحالات' : 'All Statuses'}
                </SelectItem>
                <SelectItem value="DRAFT">
                  {language === 'ar' ? 'مسودة' : 'Draft'}
                </SelectItem>
                <SelectItem value="SUBMITTED">
                  {language === 'ar' ? 'مُقدم' : 'Submitted'}
                </SelectItem>
                <SelectItem value="VERIFIED">
                  {language === 'ar' ? 'تم التحقق' : 'Verified'}
                </SelectItem>
                <SelectItem value="ACCEPTED">
                  {language === 'ar' ? 'مقبول' : 'Accepted'}
                </SelectItem>
                <SelectItem value="REJECTED">
                  {language === 'ar' ? 'مرفوض' : 'Rejected'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="search">
              {language === 'ar' ? 'البحث' : 'Search'}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder={language === 'ar' ? 'ابحث بالفترة أو المرجع...' : 'Search by period or reference...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Filing History Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-medium">
                  {language === 'ar' ? 'الفترة' : 'Period'}
                </TableHead>
                <TableHead className="font-medium">
                  {language === 'ar' ? 'نوع الضريبة' : 'Tax Type'}
                </TableHead>
                <TableHead className="font-medium text-right">
                  {language === 'ar' ? 'صافي الضريبة' : 'Net Tax'}
                </TableHead>
                <TableHead className="font-medium">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </TableHead>
                <TableHead className="font-medium">
                  {language === 'ar' ? 'تاريخ التقديم' : 'Submitted On'}
                </TableHead>
                <TableHead className="font-medium">
                  {language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
                </TableHead>
                <TableHead className="font-medium text-center">
                  {language === 'ar' ? 'الإجراءات' : 'Actions'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFilings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {language === 'ar' 
                          ? 'لا توجد إقرارات ضريبية للمعايير المحددة'
                          : 'No tax filings found for the selected criteria'
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFilings.map((filing) => (
                  <TableRow key={filing.id} className={cn(
                    filing.isOverdue && "bg-red-50 border-red-100"
                  )}>
                    <TableCell className="font-medium">
                      {filing.period}
                      {filing.isOverdue && (
                        <div className="text-xs text-red-600 mt-1">
                          {language === 'ar' 
                            ? `متأخر ${filing.daysPastDue} يوم`
                            : `${filing.daysPastDue} days overdue`
                          }
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {filing.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(parseFloat(filing.totalTax), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(filing.status, filing.isOverdue)}
                    </TableCell>
                    <TableCell>
                      {filing.submittedAt ? (
                        new Date(filing.submittedAt).toLocaleDateString(
                          language === 'ar' ? 'ar-AE' : 'en-AE'
                        )
                      ) : (
                        <span className="text-gray-400">
                          {language === 'ar' ? 'لم يُقدم' : 'Not submitted'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        filing.isOverdue && "text-red-600 font-medium"
                      )}>
                        {new Date(filing.dueDate).toLocaleDateString(
                          language === 'ar' ? 'ar-AE' : 'en-AE'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(filing)}
                          disabled={!filing.submittedAt}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {filing.ftaReference && (
                          <div className="text-xs text-gray-500">
                            Ref: {filing.ftaReference}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredFilings.filter(f => f.status === 'ACCEPTED').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'مقبولة' : 'Accepted'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredFilings.filter(f => f.status === 'SUBMITTED').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'قيد المراجعة' : 'Under Review'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {filteredFilings.filter(f => f.status === 'DRAFT').length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'مسودات' : 'Drafts'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {overdueFilings.length}
            </div>
            <div className="text-sm text-gray-600">
              {language === 'ar' ? 'متأخرة' : 'Overdue'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}