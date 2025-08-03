import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { freeZoneLicenseSchema, FreeZoneLicense } from '@/lib/setup-validation';
import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { UAE_FREE_ZONES } from '@/constants/freeZones';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2, Calendar, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FreeZoneLicenseStep() {
  const { freeZoneLicense, updateFreeZoneLicense, updateStepValidation } = useSetup();
  const { language } = useLanguage();

  const form = useForm<FreeZoneLicense>({
    resolver: zodResolver(freeZoneLicenseSchema),
    defaultValues: {
      licenseType: freeZoneLicense.licenseType || 'Mainland',
      freeZoneName: freeZoneLicense.freeZoneName || '',
      licenseNumber: freeZoneLicense.licenseNumber || '',
      licenseIssueDate: freeZoneLicense.licenseIssueDate || '',
      licenseExpiryDate: freeZoneLicense.licenseExpiryDate || '',
      isQFZP: freeZoneLicense.isQFZP || false,
      docs: freeZoneLicense.docs || [],
    } as FreeZoneLicense,
    mode: 'onChange',
  });

  const { register, watch, setValue, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Update context when form data changes
  useEffect(() => {
    updateFreeZoneLicense(watchedData);
    updateStepValidation(3, isValid);
    
    // Debug log to see validation status
    console.log('Free Zone License Form State:', {
      isValid,
      errors,
      formData: watchedData
    });
  }, [watchedData, isValid, updateFreeZoneLicense, updateStepValidation, errors]);

  // Clear free zone name when switching to Mainland
  useEffect(() => {
    if (watchedData.licenseType === 'Mainland') {
      setValue('freeZoneName', '');
    }
  }, [watchedData.licenseType, setValue]);

  const isFreeZone = watchedData.licenseType === 'FreeZone';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          {language === 'ar' ? 'ترخيص المنطقة الحرة' : 'Free Zone & License'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar' 
            ? 'حدد نوع الترخيص وتفاصيل المنطقة الحرة إن أمكن'
            : 'Specify license type and free zone details if applicable'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* License Type */}
        <div className="space-y-3">
          <Label>
            {language === 'ar' ? 'نوع الترخيص' : 'License Type'} *
          </Label>
          <div className="grid gap-3">
            {[
              { value: 'Mainland', label: 'Mainland License', description: 'Regular UAE mainland business license' },
              { value: 'FreeZone', label: 'Free Zone License', description: 'Free zone business license with special benefits' }
            ].map((type) => (
              <div 
                key={type.value}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all",
                  watchedData.licenseType === type.value 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setValue('licenseType', type.value as 'Mainland' | 'FreeZone')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 transition-colors",
                      watchedData.licenseType === type.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}>
                      {watchedData.licenseType === type.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.licenseType && (
            <p className="text-sm text-red-600">{errors.licenseType.message}</p>
          )}
        </div>

        {/* Free Zone Name - Only show if Free Zone is selected */}
        {isFreeZone && (
          <div className="space-y-2">
            <Label htmlFor="freeZoneName">
              {language === 'ar' ? 'اسم المنطقة الحرة' : 'Free Zone Name'} *
            </Label>
            <Select value={watchedData.freeZoneName} onValueChange={(value) => setValue('freeZoneName', value)}>
              <SelectTrigger className={cn(errors.freeZoneName && "border-red-500")}>
                <SelectValue placeholder={language === 'ar' ? 'اختر المنطقة الحرة' : 'Select Free Zone'} />
              </SelectTrigger>
              <SelectContent>
                {UAE_FREE_ZONES.map((zone) => (
                  <SelectItem key={zone.value} value={zone.value}>
                    {zone.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.freeZoneName && (
              <p className="text-sm text-red-600">{errors.freeZoneName.message}</p>
            )}
          </div>
        )}

        {/* License Number */}
        <div className="space-y-2">
          <Label htmlFor="licenseNumber" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {language === 'ar' ? 'رقم الترخيص' : 'License Number'} *
          </Label>
          <Input
            id="licenseNumber"
            {...register('licenseNumber')}
            placeholder={language === 'ar' ? 'مثال: CN-1234567' : 'e.g., CN-1234567'}
            className={cn(errors.licenseNumber && "border-red-500")}
          />
          {errors.licenseNumber && (
            <p className="text-sm text-red-600">{errors.licenseNumber.message}</p>
          )}
        </div>

        {/* License Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="licenseIssueDate" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {language === 'ar' ? 'تاريخ إصدار الترخيص' : 'License Issue Date'} *
            </Label>
            <Input
              id="licenseIssueDate"
              type="date"
              {...register('licenseIssueDate')}
              className={cn(errors.licenseIssueDate && "border-red-500")}
            />
            {errors.licenseIssueDate && (
              <p className="text-sm text-red-600">{errors.licenseIssueDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseExpiryDate" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {language === 'ar' ? 'تاريخ انتهاء الترخيص' : 'License Expiry Date'} *
            </Label>
            <Input
              id="licenseExpiryDate"
              type="date"
              {...register('licenseExpiryDate')}
              className={cn(errors.licenseExpiryDate && "border-red-500")}
            />
            {errors.licenseExpiryDate && (
              <p className="text-sm text-red-600">{errors.licenseExpiryDate.message}</p>
            )}
          </div>
        </div>

        {/* QFZP Checkbox - Only show for Free Zone */}
        {isFreeZone && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ar' ? 'شخص المنطقة الحرة المؤهل' : 'Qualifying Free Zone Person (QFZP)'}
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isQFZP"
                  checked={watchedData.isQFZP || false}
                  onCheckedChange={(checked) => setValue('isQFZP', !!checked)}
                />
                <Label htmlFor="isQFZP" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {language === 'ar' ? 'نعم، مؤهل كشخص منطقة حرة' : 'Yes, qualifying as QFZP'}
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                {language === 'ar' 
                  ? 'ينطبق نظام ضريبة الشركات 0% للدخل المؤهل'
                  : 'Applies 0% corporate tax regime for qualifying income'
                }
              </p>
            </div>

            {watchedData.isQFZP && (
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  <strong>QFZP Benefits:</strong> 0% corporate income tax on qualifying activities under AED 3,000,000 annually
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Information Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {isFreeZone ? (
              language === 'ar' 
                ? 'شركات المنطقة الحرة: وضع علامة على QFZP سيطبق نظام ضريبة الشركات 0%.'
                : 'Free-zone companies: ticking QFZP will apply the 0% corporate-tax regime.'
            ) : (
              language === 'ar' 
                ? 'شركات البر الرئيسي تخضع لمعدل ضريبة الشركات العادي 9% للدخل الذي يزيد عن 375,000 درهم.'
                : 'Mainland companies are subject to standard 9% corporate tax rate on income above AED 375,000.'
            )}
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