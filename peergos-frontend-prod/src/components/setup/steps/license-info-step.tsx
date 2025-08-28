import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, MapPin, Building, Info } from 'lucide-react';
import { useSetup } from '@/context/setup-context';
import { useEffect } from 'react';

const licenseInfoSchema = z.object({
  licenseType: z.enum(['mainland', 'freezone', 'individual'], {
    required_error: 'License type is required',
  }),
  emirate: z.string().min(1, 'Emirate is required'),
  authority: z.string().min(1, 'Licensing authority is required'),
});

type LicenseInfoData = z.infer<typeof licenseInfoSchema>;

const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

const LICENSING_AUTHORITIES = {
  mainland: [
    'Department of Economic Development (DED) - Dubai',
    'Department of Economic Development (DED) - Abu Dhabi',
    'Department of Economic Development (DED) - Sharjah',
    'Department of Economic Development (DED) - Ajman',
    'Department of Economic Development (DED) - UAQ',
    'Department of Economic Development (DED) - RAK',
    'Department of Economic Development (DED) - Fujairah',
    'Ministry of Economy (MOE)',
  ],
  freezone: [
    'Dubai International Financial Centre (DIFC)',
    'Abu Dhabi Global Market (ADGM)',
    'Dubai Multi Commodities Centre (DMCC)',
    'Dubai Airport Free Zone (DAFZ)',
    'Jebel Ali Free Zone (JAFZ)',
    'Abu Dhabi Free Zone (ADFZ)',
    'Sharjah Airport International Free Zone (SAIF)',
    'Ras Al Khaimah Economic Zone (RAKEZ)',
    'Fujairah Free Zone',
    'Other Free Zone',
  ],
  individual: [
    'Department of Economic Development (DED) - Individual License',
    'Ministry of Economy (MOE) - Individual License',
    'Freelance Permit - Dubai',
    'Freelance Permit - Abu Dhabi',
    'Other Individual License',
  ],
};

export default function LicenseInfoStep() {
  const { formData, updateFormData } = useSetup();

  const form = useForm<LicenseInfoData>({
    resolver: zodResolver(licenseInfoSchema),
    defaultValues: formData.licenseInfo || {
      licenseType: 'mainland',
      emirate: '',
      authority: '',
    },
  });

  const { watch, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-save form data as user types
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData('licenseInfo', value);
    });
    return () => subscription.unsubscribe();
  }, [form, updateFormData]);

  const getLicenseTypeInfo = (type: string) => {
    switch (type) {
      case 'mainland':
        return {
          title: 'UAE Mainland License',
          description: 'Standard business license issued by local DED',
          features: ['Can trade anywhere in UAE', 'Full market access', 'Standard CIT and VAT obligations'],
          color: 'blue',
        };
      case 'freezone':
        return {
          title: 'Free Zone License',
          description: 'Special economic zone license with benefits',
          features: ['Tax advantages available', 'QFZP eligibility possible', 'Special compliance requirements'],
          color: 'green',
        };
      case 'individual':
        return {
          title: 'Individual License',
          description: 'Personal business license for freelancers/professionals',
          features: ['Natural person CT applicable', 'Simplified compliance', 'Professional services focus'],
          color: 'purple',
        };
      default:
        return null;
    }
  };

  const licenseInfo = getLicenseTypeInfo(watchedValues.licenseType);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>License Information:</strong> Your business license type determines specific UAE tax obligations 
          and compliance requirements. Select the correct type as per your official documentation.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* License Type Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Business License Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Your License Type *</Label>
              <RadioGroup
                value={watchedValues.licenseType}
                onValueChange={(value: any) => {
                  form.setValue('licenseType', value);
                  // Reset authority when license type changes
                  form.setValue('authority', '');
                }}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="mainland" id="mainland" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="mainland" className="font-medium cursor-pointer">
                      UAE Mainland License
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Standard business license issued by Department of Economic Development (DED)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="freezone" id="freezone" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="freezone" className="font-medium cursor-pointer">
                      Free Zone License
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Special economic zone license with potential tax advantages and QFZP eligibility
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="individual" id="individual" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="individual" className="font-medium cursor-pointer">
                      Individual/Freelance License
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Personal business license for freelancers and individual professionals
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emirate">Emirate *</Label>
                <Select
                  value={watchedValues.emirate}
                  onValueChange={(value) => form.setValue('emirate', value)}
                >
                  <SelectTrigger className={errors.emirate ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    {UAE_EMIRATES.map((emirate) => (
                      <SelectItem key={emirate} value={emirate}>
                        {emirate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.emirate && (
                  <p className="text-sm text-red-600">{errors.emirate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="authority">Licensing Authority *</Label>
                <Select
                  value={watchedValues.authority}
                  onValueChange={(value) => form.setValue('authority', value)}
                >
                  <SelectTrigger className={errors.authority ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSING_AUTHORITIES[watchedValues.licenseType]?.map((authority) => (
                      <SelectItem key={authority} value={authority}>
                        {authority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.authority && (
                  <p className="text-sm text-red-600">{errors.authority.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Type Information */}
        {licenseInfo && (
          <Card className={`border-2 border-${licenseInfo.color}-200 bg-${licenseInfo.color}-50/30`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5" />
                {licenseInfo.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                {licenseInfo.description}
              </p>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {licenseInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specific Warnings/Information */}
              {watchedValues.licenseType === 'freezone' && (
                <Alert className="border-yellow-200 bg-yellow-50 p-3">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <div className="text-xs">
                    <strong>Free Zone Benefits:</strong> You may be eligible for Qualifying Free Zone Person (QFZP) 
                    status with 0% CIT on qualifying income up to AED 3M.
                  </div>
                </Alert>
              )}

              {watchedValues.licenseType === 'individual' && (
                <Alert className="border-purple-200 bg-purple-50 p-3">
                  <Info className="h-4 w-4 text-purple-600" />
                  <div className="text-xs">
                    <strong>Natural Person CT:</strong> As an individual, you're subject to Natural Person Corporate Tax 
                    rules with special registration deadlines (March 31, 2025).
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Authority Information */}
      {watchedValues.authority && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Selected Authority</h4>
                <p className="text-sm text-blue-800 mb-2">{watchedValues.authority}</p>
                <p className="text-xs text-blue-700">
                  Ensure your business license and TRN are issued by this authority for accurate compliance setup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}