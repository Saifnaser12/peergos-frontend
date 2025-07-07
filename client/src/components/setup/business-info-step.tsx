import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { businessInfoSchema, BusinessInfo, UAE_EMIRATES } from '@/lib/setup-validation';
import { useSetup } from '@/context/setup-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, MapPin, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BusinessInfoStep() {
  const { businessInfo, updateBusinessInfo, updateStepValidation } = useSetup();
  const { language } = useLanguage();

  const form = useForm<BusinessInfo>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: businessInfo as BusinessInfo,
    mode: 'onChange',
  });

  const { register, watch, setValue, formState: { errors, isValid } } = form;
  const watchedData = watch();

  // Update context when form data changes
  useEffect(() => {
    updateBusinessInfo(watchedData);
    updateStepValidation(1, isValid);
  }, [watchedData, isValid, updateBusinessInfo, updateStepValidation]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          {language === 'ar' ? 'معلومات الأعمال' : 'Business Information'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'ar' 
            ? 'أدخل تفاصيل شركتك ومعلومات الاتصال'
            : 'Enter your company details and contact information'
          }
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Company Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {language === 'ar' ? 'اسم الشركة' : 'Company Name'} *
            </Label>
            <Input
              id="companyName"
              {...register('companyName')}
              placeholder={language === 'ar' ? 'أدخل اسم الشركة' : 'Enter company name'}
              className={cn(errors.companyName && "border-red-500")}
            />
            {errors.companyName && (
              <p className="text-sm text-red-600">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tradeLicenseNumber" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {language === 'ar' ? 'رقم الرخصة التجارية' : 'Trade License Number'} *
            </Label>
            <Input
              id="tradeLicenseNumber"
              {...register('tradeLicenseNumber')}
              placeholder={language === 'ar' ? 'مثال: CN-1234567' : 'e.g., CN-1234567'}
              className={cn(errors.tradeLicenseNumber && "border-red-500")}
            />
            {errors.tradeLicenseNumber && (
              <p className="text-sm text-red-600">{errors.tradeLicenseNumber.message}</p>
            )}
          </div>
        </div>

        {/* Business Activity and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessActivity">
              {language === 'ar' ? 'النشاط التجاري' : 'Business Activity'} *
            </Label>
            <Input
              id="businessActivity"
              {...register('businessActivity')}
              placeholder={language === 'ar' ? 'مثال: تجارة التجزئة' : 'e.g., Retail Trading'}
              className={cn(errors.businessActivity && "border-red-500")}
            />
            {errors.businessActivity && (
              <p className="text-sm text-red-600">{errors.businessActivity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="establishmentDate" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {language === 'ar' ? 'تاريخ التأسيس' : 'Establishment Date'} *
            </Label>
            <Input
              id="establishmentDate"
              type="date"
              {...register('establishmentDate')}
              className={cn(errors.establishmentDate && "border-red-500")}
            />
            {errors.establishmentDate && (
              <p className="text-sm text-red-600">{errors.establishmentDate.message}</p>
            )}
          </div>
        </div>

        {/* Address and Emirate */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {language === 'ar' ? 'العنوان الكامل' : 'Complete Address'} *
            </Label>
            <Input
              id="address"
              {...register('address')}
              placeholder={language === 'ar' ? 'أدخل العنوان الكامل' : 'Enter complete address'}
              className={cn(errors.address && "border-red-500")}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emirate">
              {language === 'ar' ? 'الإمارة' : 'Emirate'} *
            </Label>
            <Select 
              value={watchedData.emirate} 
              onValueChange={(value) => setValue('emirate', value as any)}
            >
              <SelectTrigger className={cn(errors.emirate && "border-red-500")}>
                <SelectValue placeholder={language === 'ar' ? 'اختر الإمارة' : 'Select Emirate'} />
              </SelectTrigger>
              <SelectContent>
                {UAE_EMIRATES.map((emirate) => (
                  <SelectItem key={emirate.value} value={emirate.value}>
                    {emirate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.emirate && (
              <p className="text-sm text-red-600">{errors.emirate.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
            </Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder={language === 'ar' ? 'name@company.com' : 'name@company.com'}
              className={cn(errors.contactEmail && "border-red-500")}
            />
            {errors.contactEmail && (
              <p className="text-sm text-red-600">{errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
            </Label>
            <Input
              id="contactPhone"
              {...register('contactPhone')}
              placeholder={language === 'ar' ? '+971 50 123 4567' : '+971 50 123 4567'}
              className={cn(errors.contactPhone && "border-red-500")}
            />
            {errors.contactPhone && (
              <p className="text-sm text-red-600">{errors.contactPhone.message}</p>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Building2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {language === 'ar' 
              ? 'تأكد من دقة المعلومات المدخلة حيث ستستخدم في التسجيل الضريبي والمراسلات الرسمية مع الهيئة الاتحادية للضرائب.'
              : 'Ensure accuracy as this information will be used for tax registration and official correspondence with the Federal Tax Authority.'
            }
          </AlertDescription>
        </Alert>

        {/* Form Validation Status */}
        {Object.keys(errors).length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              {language === 'ar' 
                ? 'يرجى تصحيح الأخطاء أعلاه للمتابعة إلى الخطوة التالية.'
                : 'Please correct the errors above to continue to the next step.'
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}