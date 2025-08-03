import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trnUploadSchema, TRNUpload } from '@/lib/setup-validation';
import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Shield, UserCheck, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TRNUploadStep() {
  const { trnUpload, updateTRNUpload, updateStepValidation } = useSetup();
  const { language } = useLanguage();

  const form = useForm<TRNUpload>({
    resolver: zodResolver(trnUploadSchema),
    defaultValues: {
      hasTRN: trnUpload.hasTRN || false,
      trnNumber: trnUpload.trnNumber || '',
      trnCertificate: trnUpload.trnCertificate || undefined,
      vatRegistrationDate: trnUpload.vatRegistrationDate || '',
      citRegistrationRequired: trnUpload.citRegistrationRequired || false,
      citRegistrationDate: trnUpload.citRegistrationDate || '',
      taxAgentAppointed: trnUpload.taxAgentAppointed || false,
      taxAgentName: trnUpload.taxAgentName || '',
      taxAgentLicense: trnUpload.taxAgentLicense || '',
    } as TRNUpload,
    mode: 'onChange',
  });

  const { register, watch, setValue, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Update context when form data changes
  useEffect(() => {
    updateTRNUpload(watchedData);
    
    // Enhanced validation - ensure conditional required fields are filled
    const formIsValid = isValid && 
      // If has TRN, TRN number is required and valid
      (!watchedData.hasTRN || (watchedData.hasTRN && !!watchedData.trnNumber?.trim())) &&
      // If tax agent appointed, tax agent name is required
      (!watchedData.taxAgentAppointed || (watchedData.taxAgentAppointed && !!watchedData.taxAgentName?.trim()));
    
    updateStepValidation(4, formIsValid);
    
    // Debug log to see validation status
    console.log('TRN Upload Form State:', {
      isValid,
      formIsValid,
      errors,
      formData: watchedData
    });
  }, [watchedData, isValid, updateTRNUpload, updateStepValidation, errors]);

  const hasTRN = watchedData.hasTRN;
  const citRequired = watchedData.citRegistrationRequired;
  const hasAgent = watchedData.taxAgentAppointed;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          {language === 'ar' ? 'رقم التسجيل الضريبي والتسجيل' : 'TRN & Tax Registration'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar' 
            ? 'قم بتحديد تفاصيل التسجيل الضريبي وتحميل المستندات المطلوبة'
            : 'Specify tax registration details and upload required documents'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* TRN Status */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'حالة رقم التسجيل الضريبي' : 'Tax Registration Number (TRN) Status'}
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hasTRN"
                checked={watchedData.hasTRN || false}
                onCheckedChange={(checked) => setValue('hasTRN', !!checked)}
              />
              <Label htmlFor="hasTRN" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {language === 'ar' ? 'لدي رقم تسجيل ضريبي (TRN)' : 'I have a Tax Registration Number (TRN)'}
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {language === 'ar' 
                ? 'مطلوب للشركات التي تتجاوز عتبة ضريبة القيمة المضافة'
                : 'Required for businesses exceeding VAT threshold'
              }
            </p>
          </div>

          {hasTRN && (
            <div className="ml-6 space-y-4">
              {/* TRN Number */}
              <div className="space-y-2">
                <Label htmlFor="trnNumber">
                  {language === 'ar' ? 'رقم التسجيل الضريبي' : 'TRN Number'}
                </Label>
                <Input
                  id="trnNumber"
                  {...register('trnNumber')}
                  placeholder={language === 'ar' ? 'مثال: 100123456789012' : 'e.g., 100123456789012'}
                  className={cn(errors.trnNumber && "border-red-500")}
                />
                {errors.trnNumber && (
                  <p className="text-sm text-red-600">{errors.trnNumber.message}</p>
                )}
              </div>

              {/* VAT Registration Date */}
              <div className="space-y-2">
                <Label htmlFor="vatRegistrationDate" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {language === 'ar' ? 'تاريخ التسجيل في ضريبة القيمة المضافة' : 'VAT Registration Date'}
                </Label>
                <Input
                  id="vatRegistrationDate"
                  type="date"
                  {...register('vatRegistrationDate')}
                  className={cn(errors.vatRegistrationDate && "border-red-500")}
                />
                {errors.vatRegistrationDate && (
                  <p className="text-sm text-red-600">{errors.vatRegistrationDate.message}</p>
                )}
              </div>

              {/* TRN Certificate Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {language === 'ar' ? 'شهادة التسجيل الضريبي' : 'TRN Certificate'}
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    {language === 'ar' ? 'اسحب وأفلت الملف هنا أو انقر للتحديد' : 'Drag and drop file here or click to select'}
                  </p>
                  <Button variant="outline" size="sm">
                    {language === 'ar' ? 'اختيار ملف' : 'Choose File'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CIT Registration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'تسجيل ضريبة الشركات' : 'Corporate Income Tax (CIT) Registration'}
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="citRegistrationRequired"
                checked={watchedData.citRegistrationRequired || false}
                onCheckedChange={(checked) => setValue('citRegistrationRequired', !!checked)}
              />
              <Label htmlFor="citRegistrationRequired" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {language === 'ar' ? 'مطلوب تسجيل ضريبة الشركات' : 'CIT registration required'}
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {language === 'ar' 
                ? 'مطلوب للشركات التي تتجاوز عتبة الإعفاء'
                : 'Required for businesses exceeding exemption threshold'
              }
            </p>
          </div>

          {citRequired && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="citRegistrationDate" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {language === 'ar' ? 'تاريخ تسجيل ضريبة الشركات' : 'CIT Registration Date'}
              </Label>
              <Input
                id="citRegistrationDate"
                type="date"
                {...register('citRegistrationDate')}
                className={cn(errors.citRegistrationDate && "border-red-500")}
              />
              {errors.citRegistrationDate && (
                <p className="text-sm text-red-600">{errors.citRegistrationDate.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Tax Agent */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'الوكيل الضريبي' : 'Tax Agent'}
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="taxAgentAppointed"
                checked={watchedData.taxAgentAppointed || false}
                onCheckedChange={(checked) => setValue('taxAgentAppointed', !!checked)}
              />
              <Label htmlFor="taxAgentAppointed" className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                {language === 'ar' ? 'تم تعيين وكيل ضريبي' : 'Tax agent appointed'}
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              {language === 'ar' 
                ? 'اختياري - يمكن أن يساعد في إدارة الامتثال الضريبي'
                : 'Optional - can help manage tax compliance'
              }
            </p>
          </div>

          {hasAgent && (
            <div className="ml-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxAgentName">
                  {language === 'ar' ? 'اسم الوكيل الضريبي' : 'Tax Agent Name'}
                </Label>
                <Input
                  id="taxAgentName"
                  {...register('taxAgentName')}
                  placeholder={language === 'ar' ? 'مثال: شركة المراجعة المحدودة' : 'e.g., ABC Auditing LLC'}
                  className={cn(errors.taxAgentName && "border-red-500")}
                />
                {errors.taxAgentName && (
                  <p className="text-sm text-red-600">{errors.taxAgentName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAgentLicense">
                  {language === 'ar' ? 'ترخيص الوكيل الضريبي' : 'Tax Agent License Number'}
                </Label>
                <Input
                  id="taxAgentLicense"
                  {...register('taxAgentLicense')}
                  placeholder={language === 'ar' ? 'مثال: TA-12345' : 'e.g., TA-12345'}
                  className={cn(errors.taxAgentLicense && "border-red-500")}
                />
                {errors.taxAgentLicense && (
                  <p className="text-sm text-red-600">{errors.taxAgentLicense.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {language === 'ar' 
              ? 'يمكن تحديث تفاصيل التسجيل الضريبي لاحقاً من خلال قسم الإعدادات. تأكد من دقة جميع المعلومات المقدمة.'
              : 'Tax registration details can be updated later through the settings section. Ensure all information provided is accurate.'
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