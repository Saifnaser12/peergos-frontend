import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { revenueDeclarationSchema, RevenueDeclaration, REVENUE_CATEGORIES, BUSINESS_MODELS } from '@/lib/setup-validation';
import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Globe, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RevenueDeclarationStep() {
  const { revenueDeclaration, updateRevenueDeclaration, updateStepValidation } = useSetup();
  const { language } = useLanguage();

  const form = useForm<RevenueDeclaration>({
    resolver: zodResolver(revenueDeclarationSchema),
    defaultValues: {
      expectedAnnualRevenue: revenueDeclaration.expectedAnnualRevenue || 0,
      revenueCategory: revenueDeclaration.revenueCategory || undefined,
      mainRevenueSource: revenueDeclaration.mainRevenueSource || '',
      businessModel: revenueDeclaration.businessModel || undefined,
      hasInternationalSales: false,
      internationalSalesPercentage: revenueDeclaration.internationalSalesPercentage || undefined,
    } as RevenueDeclaration,
    mode: 'onChange',
  });

  const { register, watch, setValue, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Initialize hasInternationalSales to false on mount
  useEffect(() => {
    setValue('hasInternationalSales', false);
    form.trigger();
  }, [setValue, form]);

  // Update context when form data changes
  useEffect(() => {
    updateRevenueDeclaration(watchedData);
    
    // Enhanced validation - ensure required fields are filled
    const formIsValid = isValid && 
      watchedData.expectedAnnualRevenue !== undefined && 
      watchedData.expectedAnnualRevenue >= 0 &&
      !!watchedData.revenueCategory &&
      !!watchedData.mainRevenueSource?.trim() &&
      !!watchedData.businessModel;
    
    updateStepValidation(2, formIsValid);
    
    // Debug log to see validation status
    console.log('Revenue Declaration Form State:', {
      isValid,
      formIsValid,
      errors,
      formData: watchedData
    });
  }, [watchedData, isValid, updateRevenueDeclaration, updateStepValidation, errors]);

  // Auto-select revenue category based on expected revenue
  useEffect(() => {
    if (watchedData.expectedAnnualRevenue !== undefined) {
      let category: 'BELOW_375K' | 'BETWEEN_375K_3M' | 'ABOVE_3M';
      
      if (watchedData.expectedAnnualRevenue < 375000) {
        category = 'BELOW_375K';
      } else if (watchedData.expectedAnnualRevenue <= 3000000) {
        category = 'BETWEEN_375K_3M';
      } else {
        category = 'ABOVE_3M';
      }
      
      if (watchedData.revenueCategory !== category) {
        setValue('revenueCategory', category);
      }
    }
  }, [watchedData.expectedAnnualRevenue, watchedData.revenueCategory, setValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedCategory = REVENUE_CATEGORIES.find(cat => cat.value === watchedData.revenueCategory);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          {language === 'ar' ? 'إقرار الإيرادات' : 'Revenue Declaration'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar' 
            ? 'حدد الإيرادات المتوقعة ونموذج الأعمال لتحديد الفئة الضريبية المناسبة'
            : 'Declare expected revenue and business model to determine appropriate tax category'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Expected Annual Revenue */}
        <div className="space-y-2">
          <Label htmlFor="expectedAnnualRevenue" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {language === 'ar' ? 'الإيرادات السنوية المتوقعة (درهم إماراتي)' : 'Expected Annual Revenue (AED)'} *
          </Label>
          <Input
            id="expectedAnnualRevenue"
            type="number"
            min="0"
            step="1000"
            {...register('expectedAnnualRevenue', { valueAsNumber: true })}
            placeholder={language === 'ar' ? 'مثال: 500000' : 'e.g., 500000'}
            className={cn(errors.expectedAnnualRevenue && "border-red-500")}
          />
          {errors.expectedAnnualRevenue && (
            <p className="text-sm text-red-600">{errors.expectedAnnualRevenue.message}</p>
          )}
          {watchedData.expectedAnnualRevenue && (
            <p className="text-sm text-gray-600">
              {formatCurrency(watchedData.expectedAnnualRevenue)} {' '}
              {language === 'ar' ? 'سنوياً' : 'annually'}
            </p>
          )}
        </div>

        {/* Revenue Category (Auto-selected) */}
        {selectedCategory && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                {language === 'ar' ? 'الفئة الضريبية المحددة تلقائياً' : 'Auto-Selected Tax Category'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">
                  {selectedCategory.label}
                </Badge>
                <Badge className="bg-green-100 text-green-800">
                  CIT: {selectedCategory.citRate}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{selectedCategory.description}</p>
              <div className="text-xs text-gray-600">
                <strong>{language === 'ar' ? 'المزايا:' : 'Benefits:'}</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {selectedCategory.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Main Revenue Source */}
        <div className="space-y-2">
          <Label htmlFor="mainRevenueSource">
            {language === 'ar' ? 'مصدر الإيرادات الرئيسي' : 'Main Revenue Source'} *
          </Label>
          <Input
            id="mainRevenueSource"
            {...register('mainRevenueSource')}
            placeholder={language === 'ar' ? 'مثال: بيع المنتجات، تقديم الخدمات' : 'e.g., Product sales, Service provision'}
            className={cn(errors.mainRevenueSource && "border-red-500")}
            onChange={(e) => {
              setValue('mainRevenueSource', e.target.value);
              form.trigger('mainRevenueSource');
            }}
            autoComplete="off"
          />
          {errors.mainRevenueSource && (
            <p className="text-sm text-red-600">{errors.mainRevenueSource.message}</p>
          )}
        </div>

        {/* Business Model */}
        <div className="space-y-3">
          <Label>
            {language === 'ar' ? 'نموذج الأعمال' : 'Business Model'} *
          </Label>
          <div className="grid gap-3">
            {BUSINESS_MODELS.map((model) => (
              <div 
                key={model.value}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all",
                  watchedData.businessModel === model.value 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Business model clicked:', model.value);
                  setValue('businessModel', model.value as 'B2B' | 'B2C' | 'MIXED');
                  form.trigger('businessModel');
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 transition-colors",
                      watchedData.businessModel === model.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}>
                      {watchedData.businessModel === model.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{model.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      <strong>VAT:</strong> {model.vatImplications}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.businessModel && (
            <p className="text-sm text-red-600">{errors.businessModel.message}</p>
          )}
        </div>

        {/* International Sales */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'المبيعات الدولية' : 'International Sales'}
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hasInternationalSales"
                checked={watchedData.hasInternationalSales || false}
                onCheckedChange={(checked) => {
                  setValue('hasInternationalSales', !!checked);
                  form.trigger('hasInternationalSales');
                }}
              />
              <Label htmlFor="hasInternationalSales" className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {language === 'ar' ? 'لديك مبيعات دولية' : 'I have international sales'}
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {language === 'ar' 
                ? 'اتركها غير محددة إذا لم تكن لديك مبيعات دولية'
                : 'Leave unchecked if you have no international sales'
              }
            </p>
          </div>

          {watchedData.hasInternationalSales && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="internationalSalesPercentage">
                {language === 'ar' ? 'نسبة المبيعات الدولية (%)' : 'International Sales Percentage (%)'}
              </Label>
              <Input
                id="internationalSalesPercentage"
                type="number"
                min="0"
                max="100"
                {...register('internationalSalesPercentage', { valueAsNumber: true })}
                placeholder="e.g., 25"
                className={cn(errors.internationalSalesPercentage && "border-red-500")}
              />
              {errors.internationalSalesPercentage && (
                <p className="text-sm text-red-600">
                  {typeof errors.internationalSalesPercentage.message === 'string' 
                    ? errors.internationalSalesPercentage.message 
                    : 'Invalid percentage value'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {language === 'ar' 
              ? 'يتم تحديد الفئة الضريبية تلقائياً بناءً على الإيرادات المعلنة. يمكن تعديل هذه المعلومات لاحقاً إذا تغيرت ظروف العمل.'
              : 'Tax category is automatically determined based on declared revenue. This information can be updated later if business circumstances change.'
            }
          </AlertDescription>
        </Alert>

        {/* Form Validation Status */}
        {Object.keys(errors).length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              {language === 'ar' 
                ? 'يرجى إكمال جميع الحقول المطلوبة للمتابعة.'
                : 'Please complete all required fields to continue.'
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}