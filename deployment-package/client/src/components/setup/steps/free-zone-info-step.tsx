import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flag, Shield, Star, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSetup, getConditionalRequirements } from '@/context/setup-context';
import { useEffect } from 'react';

const freeZoneInfoSchema = z.object({
  isFreeZone: z.boolean(),
  freeZoneName: z.string().optional(),
  freeZoneAuthority: z.string().optional(),
  qfzpEligible: z.boolean().optional(),
}).refine((data) => {
  if (data.isFreeZone) {
    return data.freeZoneName && data.freeZoneName.length > 0;
  }
  return true;
}, {
  message: 'Free Zone name is required when Free Zone is selected',
  path: ['freeZoneName'],
});

type FreeZoneInfoData = z.infer<typeof freeZoneInfoSchema>;

const MAJOR_FREE_ZONES = [
  'Dubai International Financial Centre (DIFC)',
  'Abu Dhabi Global Market (ADGM)',
  'Dubai Multi Commodities Centre (DMCC)',
  'Dubai Airport Free Zone (DAFZ)',
  'Jebel Ali Free Zone (JAFZ)',
  'Abu Dhabi Free Zone (ADFZ)',
  'Sharjah Airport International Free Zone (SAIF)',
  'Ras Al Khaimah Economic Zone (RAKEZ)',
  'Dubai South Free Zone',
  'Dubai Silicon Oasis (DSO)',
  'Dubai Internet City (DIC)',
  'Dubai Media City (DMC)',
  'Abu Dhabi Investment Zone',
  'Fujairah Free Zone',
  'Hamriyah Free Zone',
  'Other Free Zone',
];

export default function FreeZoneInfoStep() {
  const { formData, updateFormData } = useSetup();

  const form = useForm<FreeZoneInfoData>({
    resolver: zodResolver(freeZoneInfoSchema),
    defaultValues: formData.freeZoneInfo || {
      isFreeZone: false,
      freeZoneName: '',
      freeZoneAuthority: '',
      qfzpEligible: false,
    },
  });

  const { watch, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-save form data as user types
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData('freeZoneInfo', value);
    });
    return () => subscription.unsubscribe();
  }, [form, updateFormData]);

  // Get conditional requirements based on current form data
  const requirements = getConditionalRequirements(formData);
  const revenue = formData.revenueInfo?.annualRevenue || 0;

  // Determine QFZP eligibility
  const isQFZPEligible = watchedValues.isFreeZone && revenue <= 3000000;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Free Zone Classification:</strong> Free Zone entities may qualify for special tax benefits 
          including 0% Corporate Income Tax on qualifying income under the QFZP regime.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Zone Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Free Zone Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Free Zone Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isFreeZone" className="text-base font-medium">
                  Is your business located in a UAE Free Zone?
                </Label>
                <p className="text-sm text-gray-600">
                  Free Zone entities have special tax benefits and compliance requirements
                </p>
              </div>
              <Switch
                id="isFreeZone"
                checked={watchedValues.isFreeZone}
                onCheckedChange={(checked) => {
                  form.setValue('isFreeZone', checked);
                  if (!checked) {
                    form.setValue('freeZoneName', '');
                    form.setValue('freeZoneAuthority', '');
                    form.setValue('qfzpEligible', false);
                  }
                }}
              />
            </div>

            {/* Free Zone Details - Only show if Free Zone is selected */}
            {watchedValues.isFreeZone && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="space-y-2">
                  <Label htmlFor="freeZoneName">Free Zone Name *</Label>
                  <Select
                    value={watchedValues.freeZoneName}
                    onValueChange={(value) => form.setValue('freeZoneName', value)}
                  >
                    <SelectTrigger className={errors.freeZoneName ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select your Free Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJOR_FREE_ZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.freeZoneName && (
                    <p className="text-sm text-red-600">{errors.freeZoneName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeZoneAuthority">Free Zone Authority</Label>
                  <Input
                    id="freeZoneAuthority"
                    {...form.register('freeZoneAuthority')}
                    placeholder="e.g., DIFC Authority, DMCC, JAFZA"
                  />
                  <p className="text-xs text-gray-600">
                    Name of the authority that issued your Free Zone license
                  </p>
                </div>

                {/* QFZP Eligibility */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="qfzpEligible" className="text-sm font-medium">
                      Apply for Qualifying Free Zone Person (QFZP) Status?
                    </Label>
                    <p className="text-xs text-gray-600">
                      {isQFZPEligible 
                        ? 'Eligible for 0% CIT on qualifying income up to AED 3M'
                        : 'Not eligible (revenue exceeds AED 3M threshold)'
                      }
                    </p>
                  </div>
                  <Switch
                    id="qfzpEligible"
                    checked={watchedValues.qfzpEligible}
                    onCheckedChange={(checked) => form.setValue('qfzpEligible', checked)}
                    disabled={!isQFZPEligible}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Benefits Information */}
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-600" />
              Tax Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchedValues.isFreeZone ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Free Zone Benefits Available
                  </div>
                  
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <Star className="h-3 w-3 mt-1 text-green-600" />
                      <span>Potential 0% Corporate Income Tax on qualifying income</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-3 w-3 mt-1 text-green-600" />
                      <span>QFZP status eligibility (if revenue ≤ AED 3M)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-3 w-3 mt-1 text-green-600" />
                      <span>Specialized compliance procedures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="h-3 w-3 mt-1 text-green-600" />
                      <span>Enhanced tax planning opportunities</span>
                    </li>
                  </ul>
                </div>

                {/* QFZP Status Information */}
                {isQFZPEligible && watchedValues.qfzpEligible && (
                  <Alert className="border-green-300 bg-green-100 p-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-xs">
                      <strong>QFZP Qualified:</strong> You're eligible for 0% CIT on qualifying Free Zone income 
                      up to AED 3,000,000 annually. This significant tax benefit requires strict compliance 
                      with QFZP rules and documentation.
                    </div>
                  </Alert>
                )}

                {!isQFZPEligible && (
                  <Alert className="border-yellow-300 bg-yellow-100 p-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="text-xs">
                      <strong>QFZP Not Eligible:</strong> Revenue above AED 3M disqualifies from QFZP status. 
                      Standard 9% CIT rate applies, but other Free Zone benefits may still apply.
                    </div>
                  </Alert>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Info className="h-4 w-4" />
                  Mainland Business Benefits
                </div>
                
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                    <span>Full UAE market access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                    <span>Standard tax rates apply</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                    <span>Small Business Relief available (revenue ≤ AED 375K)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                    <span>Simplified compliance procedures</span>
                  </li>
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Requirements Summary */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">
                {watchedValues.isFreeZone ? 'Free Zone Compliance Requirements' : 'Mainland Compliance Requirements'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong>CIT Obligations:</strong> 
                  {watchedValues.isFreeZone && isQFZPEligible && watchedValues.qfzpEligible
                    ? ' 0% on qualifying income (QFZP)'
                    : revenue <= 375000 
                    ? ' 0% (Small Business Relief)'
                    : ' 9% standard rate'
                  }
                </div>
                
                <div>
                  <strong>VAT Requirements:</strong> 
                  {requirements.requiresVAT ? ' Registration required (5% rate)' : ' No registration needed'}
                </div>
                
                {watchedValues.isFreeZone && (
                  <div className="md:col-span-2">
                    <strong>Special Documentation:</strong> Free Zone Declaration and activity certificates required
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}