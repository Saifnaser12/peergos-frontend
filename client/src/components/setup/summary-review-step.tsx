import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { summaryReviewSchema, SummaryReview, calculateTaxCategory } from '@/lib/setup-validation';
import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Bell, FileCheck, Rocket, Info, Building2, DollarSign, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SummaryReviewStep() {
  const { 
    summaryReview, 
    updateSummaryReview, 
    updateStepValidation,
    businessInfo,
    revenueDeclaration,
    freeZoneLicense,
    trnUpload,
    getCompleteSetup
  } = useSetup();
  const { language } = useLanguage();

  // Get current financial year end (December 31st by default)
  const currentYear = new Date().getFullYear();
  const defaultYearEnd = `${currentYear}-12-31`;

  const form = useForm<SummaryReview>({
    resolver: zodResolver(summaryReviewSchema),
    defaultValues: {
      confirmFinancialYearEnd: summaryReview.confirmFinancialYearEnd || defaultYearEnd,
      wantsSmartReminders: summaryReview.wantsSmartReminders ?? true,
      agreeToTerms: summaryReview.agreeToTerms || false,
      readyToStart: summaryReview.readyToStart || false,
    } as SummaryReview,
    mode: 'onChange',
  });

  const { register, watch, setValue, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Update context when form data changes
  useEffect(() => {
    updateSummaryReview(watchedData);
    
    // Form is valid when all required fields are complete
    const formIsValid = isValid && 
      watchedData.confirmFinancialYearEnd && 
      watchedData.agreeToTerms && 
      watchedData.readyToStart;
    
    updateStepValidation(5, formIsValid);
    
    // Debug log to see validation status
    console.log('Summary Review Form State:', {
      isValid,
      formIsValid,
      errors,
      formData: watchedData
    });
  }, [watchedData, isValid, updateSummaryReview, updateStepValidation, errors]);

  // Calculate tax category based on complete setup
  const completeSetup = getCompleteSetup();
  const taxCategory = completeSetup ? calculateTaxCategory(completeSetup) : null;

  // Ensure financial year end is set on mount and trigger validation
  useEffect(() => {
    if (!watchedData.confirmFinancialYearEnd) {
      setValue('confirmFinancialYearEnd', defaultYearEnd, { shouldValidate: true });
    }
  }, [setValue, watchedData.confirmFinancialYearEnd, defaultYearEnd]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-green-600" />
          {language === 'ar' ? 'ملخص والمراجعة' : 'Summary & Review'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar' 
            ? 'راجع معلومات الإعداد وأكمل التكوين النهائي'
            : 'Review your setup information and complete final configuration'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Setup Summary */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'ملخص الإعداد' : 'Setup Summary'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">
                  {language === 'ar' ? 'معلومات الشركة' : 'Business Information'}
                </h4>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <p><strong>Company:</strong> {businessInfo.companyName}</p>
                <p><strong>License:</strong> {businessInfo.tradeLicenseNumber}</p>
                <p><strong>Emirate:</strong> {businessInfo.emirate}</p>
                <p><strong>Activity:</strong> {businessInfo.businessActivity}</p>
              </div>
            </div>

            {/* Revenue Declaration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-gray-900">
                  {language === 'ar' ? 'إقرار الإيرادات' : 'Revenue Declaration'}
                </h4>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <p><strong>Expected Revenue:</strong> AED {revenueDeclaration.expectedAnnualRevenue?.toLocaleString()}</p>
                <p><strong>Category:</strong> {revenueDeclaration.revenueCategory}</p>
                <p><strong>Business Model:</strong> {revenueDeclaration.businessModel}</p>
                <p><strong>International Sales:</strong> {revenueDeclaration.hasInternationalSales ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* License Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-gray-900">
                  {language === 'ar' ? 'تفاصيل الترخيص' : 'License Details'}
                </h4>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <p><strong>Type:</strong> {freeZoneLicense.licenseType}</p>
                {freeZoneLicense.licenseType === 'FreeZone' && (
                  <>
                    <p><strong>Free Zone:</strong> {freeZoneLicense.freeZoneName}</p>
                    <p><strong>QFZP Status:</strong> {freeZoneLicense.isQFZP ? 'Yes' : 'No'}</p>
                  </>
                )}
                <p><strong>License Number:</strong> {freeZoneLicense.licenseNumber}</p>
              </div>
            </div>

            {/* Tax Registration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium text-gray-900">
                  {language === 'ar' ? 'التسجيل الضريبي' : 'Tax Registration'}
                </h4>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="pl-6 space-y-1 text-sm">
                <p><strong>TRN Status:</strong> {trnUpload.hasTRN ? 'Registered (100123456700003)' : 'Pending Registration'}</p>
                {trnUpload.hasTRN && <p><strong>TRN:</strong> {trnUpload.trnNumber}</p>}
                <p><strong>CIT Required:</strong> {trnUpload.citRegistrationRequired ? 'Yes' : 'No'}</p>
                <p><strong>Tax Agent:</strong> {trnUpload.taxAgentAppointed ? trnUpload.taxAgentName : 'None'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Category Analysis */}
        {taxCategory && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">
                {language === 'ar' ? 'تحليل الفئة الضريبية' : 'Tax Category Analysis'}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Badge variant="outline" className="bg-white mb-2">
                  {taxCategory.category}
                </Badge>
                <p className="text-sm"><strong>CIT Rate:</strong> {taxCategory.citRate}</p>
              </div>
              <div>
                <p className="text-sm"><strong>Estimated Annual CIT:</strong> AED {taxCategory.estimatedAnnualCIT.toLocaleString()}</p>
                <p className="text-sm"><strong>Estimated Annual VAT:</strong> AED {taxCategory.estimatedAnnualVAT.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">
                  <strong>Key Benefits:</strong>
                </p>
                <ul className="text-xs text-gray-600 list-disc list-inside">
                  {taxCategory.benefits.slice(0, 2).map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Final Configuration */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {language === 'ar' ? 'التكوين النهائي' : 'Final Configuration'}
          </h3>

          {/* Financial Year End */}
          <div className="space-y-2">
            <Label htmlFor="confirmFinancialYearEnd" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {language === 'ar' ? 'نهاية السنة المالية' : 'Financial Year End'} *
            </Label>
            <Input
              id="confirmFinancialYearEnd"
              type="date"
              {...register('confirmFinancialYearEnd')}
              className={cn(errors.confirmFinancialYearEnd && "border-red-500")}
            />
            {errors.confirmFinancialYearEnd && (
              <p className="text-sm text-red-600">{errors.confirmFinancialYearEnd.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {language === 'ar' 
                ? 'تحديد نهاية السنة المالية لشركتك (افتراضي: 31 ديسمبر)'
                : 'Specify your company financial year end (default: December 31st)'
              }
            </p>
          </div>

          {/* Smart Reminders */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'التذكيرات الذكية' : 'Smart Reminders'}
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="wantsSmartReminders"
                checked={watchedData.wantsSmartReminders || false}
                onCheckedChange={(checked) => setValue('wantsSmartReminders', !!checked)}
              />
              <Label htmlFor="wantsSmartReminders" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {language === 'ar' ? 'تفعيل التذكيرات الذكية' : 'Enable smart reminders'}
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {language === 'ar' 
                ? 'احصل على تذكيرات بالمواعيد النهائية والامتثال الضريبي'
                : 'Get reminders for tax deadlines and compliance requirements'
              }
            </p>
          </div>

          {/* Terms Agreement */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agreeToTerms"
                checked={watchedData.agreeToTerms || false}
                onCheckedChange={(checked) => setValue('agreeToTerms', !!checked)}
              />
              <Label htmlFor="agreeToTerms" className="text-sm">
                {language === 'ar' 
                  ? 'أوافق على الشروط والأحكام وسياسة الخصوصية'
                  : 'I agree to the Terms & Conditions and Privacy Policy'
                } *
              </Label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
            )}
          </div>

          {/* Ready to Start */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="readyToStart"
                checked={watchedData.readyToStart || false}
                onCheckedChange={(checked) => setValue('readyToStart', !!checked)}
              />
              <Label htmlFor="readyToStart" className="flex items-center gap-1">
                <Rocket className="h-3 w-3" />
                {language === 'ar' 
                  ? 'جاهز لبدء استخدام Peergos'
                  : 'Ready to start using Peergos'
                } *
              </Label>
            </div>
            {errors.readyToStart && (
              <p className="text-sm text-red-600">{errors.readyToStart.message}</p>
            )}
            <p className="text-xs text-gray-500 ml-6">
              {language === 'ar' 
                ? 'تأكيد الاستعداد لبدء إدارة الامتثال الضريبي'
                : 'Confirm readiness to begin tax compliance management'
              }
            </p>
          </div>
        </div>

        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {language === 'ar' 
              ? 'بعد إكمال الإعداد، ستتمكن من الوصول إلى جميع ميزات إدارة الضرائب والامتثال. يمكن تحديث أي من هذه المعلومات لاحقاً من خلال قسم الإعدادات.'
              : 'After completing setup, you\'ll have access to all tax management and compliance features. Any of this information can be updated later through the settings section.'
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
              <div className="mt-2 text-xs">
                <strong>Missing:</strong>
                {!watchedData.confirmFinancialYearEnd && " Financial Year End,"}
                {!watchedData.agreeToTerms && " Terms Agreement,"}
                {!watchedData.readyToStart && " Ready to Start confirmation"}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {isValid && watchedData.agreeToTerms && watchedData.readyToStart && (
          <Alert className="border-green-200 bg-green-50">
            <Rocket className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>
                {language === 'ar' 
                  ? 'إعداد مكتمل! جاهز لبدء رحلة الامتثال الضريبي.'
                  : 'Setup Complete! Ready to begin your tax compliance journey.'
                }
              </strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}