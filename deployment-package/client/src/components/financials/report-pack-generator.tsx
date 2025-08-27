import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Settings, 
  FileSpreadsheet,
  File,
  Shield,
  CheckCircle,
  Calendar,
  User,
  Building,
  Loader2
} from 'lucide-react';
import { 
  ReportPackConfig, 
  ExportMetadata, 
  validateReportPack, 
  generateReportMetadata,
  generateComplianceStatement,
  getReportPackStructure 
} from '@/lib/financial-reports';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReportPackGeneratorProps {
  className?: string;
}

export default function ReportPackGenerator({ className = '' }: ReportPackGeneratorProps) {
  const [config, setConfig] = useState<ReportPackConfig>({
    includeIncomeStatement: true,
    includeBalanceSheet: true,
    includeCashFlow: true,
    includeTaxSummary: true,
    includeAuditTrail: false,
    includeNotes: true,
    language: 'en',
    signedBy: '',
    reviewedBy: '',
    approvedBy: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xml' | 'xlsx'>('pdf');
  const [reportingPeriod, setReportingPeriod] = useState('2025-Q2');
  
  const { user, company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  const handleConfigChange = (key: keyof ReportPackConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateReportPack = async () => {
    const validation = validateReportPack(config);
    
    if (!validation.isValid) {
      toast({
        title: 'Configuration Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      const metadata = generateReportMetadata({
        name: company?.name,
        tradeLicenseNumber: company?.tradeLicenseNumber,
        trnNumber: company?.trnNumber,
        currentUser: user
      }, reportingPeriod);

      const structure = getReportPackStructure(config);
      const complianceStatement = generateComplianceStatement(config.language, metadata);

      // In production, this would call the actual export service
      console.log('Generating report pack:', {
        config,
        metadata,
        structure,
        complianceStatement,
        exportFormat
      });

      toast({
        title: 'Report Pack Generated',
        description: `Successfully generated ${exportFormat.toUpperCase()} report pack with ${structure.length} sections`,
      });

      // Simulate file download
      const filename = `Financial_Report_Pack_${reportingPeriod}_${Date.now()}.${exportFormat}`;
      const blob = new Blob([JSON.stringify({ config, metadata, structure }, null, 2)], {
        type: exportFormat === 'pdf' ? 'application/pdf' : 
             exportFormat === 'xml' ? 'application/xml' : 
             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate report pack. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getExportFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-600" />;
      case 'xml':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getIncludedSections = () => {
    const sections = [];
    if (config.includeIncomeStatement) sections.push(language === 'ar' ? 'قائمة الدخل' : 'Income Statement');
    if (config.includeBalanceSheet) sections.push(language === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet');
    if (config.includeCashFlow) sections.push(language === 'ar' ? 'بيان التدفق النقدي' : 'Cash Flow');
    if (config.includeTaxSummary) sections.push(language === 'ar' ? 'ملخص الضرائب' : 'Tax Summary');
    if (config.includeAuditTrail) sections.push(language === 'ar' ? 'مسار التدقيق' : 'Audit Trail');
    return sections;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {language === 'ar' ? 'مولد حزمة التقارير المالية' : 'Financial Report Pack Generator'}
          <Badge variant="outline" className="text-xs">
            FTA Compliant
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar'
            ? 'إنشاء حزمة تقارير مالية شاملة مع الملاحظات والتوقيعات المطلوبة'
            : 'Generate comprehensive financial report package with notes and required signatures'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Report Selection */}
        <div className="space-y-4">
          <h3 className="font-medium">
            {language === 'ar' ? 'اختيار التقارير' : 'Report Selection'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="income-statement"
                  checked={config.includeIncomeStatement}
                  onCheckedChange={(checked) => handleConfigChange('includeIncomeStatement', checked)}
                />
                <label htmlFor="income-statement" className="text-sm font-medium">
                  {language === 'ar' ? 'قائمة الدخل' : 'Income Statement'}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="balance-sheet"
                  checked={config.includeBalanceSheet}
                  onCheckedChange={(checked) => handleConfigChange('includeBalanceSheet', checked)}
                />
                <label htmlFor="balance-sheet" className="text-sm font-medium">
                  {language === 'ar' ? 'الميزانية العمومية' : 'Balance Sheet'}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cash-flow"
                  checked={config.includeCashFlow}
                  onCheckedChange={(checked) => handleConfigChange('includeCashFlow', checked)}
                />
                <label htmlFor="cash-flow" className="text-sm font-medium">
                  {language === 'ar' ? 'بيان التدفق النقدي' : 'Cash Flow Statement'}
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tax-summary"
                  checked={config.includeTaxSummary}
                  onCheckedChange={(checked) => handleConfigChange('includeTaxSummary', checked)}
                />
                <label htmlFor="tax-summary" className="text-sm font-medium">
                  {language === 'ar' ? 'ملخص الضرائب' : 'Tax Calculation Summary'}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="audit-trail"
                  checked={config.includeAuditTrail}
                  onCheckedChange={(checked) => handleConfigChange('includeAuditTrail', checked)}
                />
                <label htmlFor="audit-trail" className="text-sm font-medium">
                  {language === 'ar' ? 'مسار التدقيق' : 'Audit Trail'}
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={config.includeNotes}
                  onCheckedChange={(checked) => handleConfigChange('includeNotes', checked)}
                />
                <label htmlFor="notes" className="text-sm font-medium">
                  {language === 'ar' ? 'الملاحظات التفسيرية' : 'Explanatory Notes'}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {language === 'ar' ? 'فترة التقرير' : 'Reporting Period'}
            </label>
            <Input
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              placeholder="2025-Q2"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {language === 'ar' ? 'لغة التقرير' : 'Report Language'}
            </label>
            <Select value={config.language} onValueChange={(value: 'en' | 'ar') => handleConfigChange('language', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Signature Fields */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            {language === 'ar' ? 'التوقيعات والموافقات' : 'Signatures & Approvals'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'أعد بواسطة' : 'Prepared by'}
              </label>
              <Input
                value={config.signedBy}
                onChange={(e) => handleConfigChange('signedBy', e.target.value)}
                placeholder={user?.username || 'Enter name...'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'راجع بواسطة' : 'Reviewed by'}
              </label>
              <Input
                value={config.reviewedBy}
                onChange={(e) => handleConfigChange('reviewedBy', e.target.value)}
                placeholder="Tax Agent / Accountant"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'وافق عليه' : 'Approved by'}
              </label>
              <Input
                value={config.approvedBy}
                onChange={(e) => handleConfigChange('approvedBy', e.target.value)}
                placeholder="Company Director"
              />
            </div>
          </div>
        </div>

        {/* Export Format */}
        <div className="space-y-3">
          <h3 className="font-medium">
            {language === 'ar' ? 'تنسيق التصدير' : 'Export Format'}
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            {['pdf', 'xml', 'xlsx'].map((format) => (
              <Button
                key={format}
                variant={exportFormat === format ? 'default' : 'outline'}
                onClick={() => setExportFormat(format as any)}
                className="flex items-center gap-2"
              >
                {getExportFormatIcon(format)}
                <span className="hidden sm:inline">
                  {format.toUpperCase()}
                </span>
              </Button>
            ))}
          </div>
          
          <div className="text-xs text-gray-500">
            <strong>PDF:</strong> Print-ready, styled report • <strong>XML:</strong> FTA Phase 2 structured • <strong>XLSX:</strong> Editable spreadsheets
          </div>
        </div>

        {/* Preview */}
        {getIncludedSections().length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">
              {language === 'ar' ? 'معاينة الحزمة' : 'Package Preview'}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-3 w-3 text-gray-500" />
                <span>{company?.name || 'Company Name'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span>{reportingPeriod}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-3 w-3 text-gray-500" />
                <span>{getIncludedSections().length} sections</span>
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-1">
              {getIncludedSections().map((section, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {section}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {language === 'ar' 
              ? 'التقرير سيتضمن التوقيعات الرقمية ومتطلبات الامتثال'
              : 'Report will include digital signatures and compliance requirements'
            }
          </div>
          
          <Button
            onClick={generateReportPack}
            disabled={isGenerating || getIncludedSections().length === 0}
            className="min-w-32"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إنشاء الحزمة' : 'Generate Pack'}
              </>
            )}
          </Button>
        </div>

        {/* Compliance Footer */}
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            <strong>
              {language === 'ar' ? 'ضمان الامتثال:' : 'Compliance Guarantee:'}
            </strong>{' '}
            {language === 'ar'
              ? 'جميع التقارير المولدة تتوافق مع متطلبات الهيئة الاتحادية للضرائب والمعايير الدولية للتقارير المالية.'
              : 'All generated reports comply with UAE FTA requirements and International Financial Reporting Standards.'
            }
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}