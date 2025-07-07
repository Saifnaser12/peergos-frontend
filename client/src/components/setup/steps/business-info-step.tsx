import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Phone, Mail, MapPin, Briefcase, Info } from 'lucide-react';
import { useSetup } from '@/context/setup-context';
import { useEffect } from 'react';

const businessInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  trn: z.string().regex(/^[0-9]{15}$/, 'TRN must be exactly 15 digits'),
  businessLicense: z.string().min(1, 'Business license number is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  phone: z.string().regex(/^\+971[0-9]{8,9}$/, 'Phone must be valid UAE number (+971xxxxxxxx)'),
  email: z.string().email('Invalid email address'),
  industry: z.string().min(1, 'Industry is required'),
});

type BusinessInfoData = z.infer<typeof businessInfoSchema>;

const UAE_INDUSTRIES = [
  'Information Technology',
  'Trading & Distribution',
  'Construction & Real Estate',
  'Financial Services',
  'Healthcare & Medical',
  'Education & Training',
  'Hospitality & Tourism',
  'Manufacturing',
  'Transportation & Logistics',
  'Professional Services',
  'Retail & E-commerce',
  'Food & Beverage',
  'Energy & Utilities',
  'Media & Entertainment',
  'Agriculture',
  'Other',
];

export default function BusinessInfoStep() {
  const { formData, updateFormData } = useSetup();

  const form = useForm<BusinessInfoData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: formData.businessInfo || {
      companyName: '',
      trn: '',
      businessLicense: '',
      address: '',
      phone: '+971',
      email: '',
      industry: '',
    },
  });

  const { watch, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-save form data as user types
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData('businessInfo', value);
    });
    return () => subscription.unsubscribe();
  }, [form, updateFormData]);

  const formatTRN = (value: string) => {
    // Remove non-digits and limit to 15 characters
    const digits = value.replace(/\D/g, '').slice(0, 15);
    return digits;
  };

  const formatPhone = (value: string) => {
    // Ensure it starts with +971 and format properly
    let phone = value.replace(/\D/g, '');
    if (!phone.startsWith('971')) {
      phone = '971' + phone.replace(/^971/, '');
    }
    return '+' + phone.slice(0, 12); // +971 + 8-9 digits
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Required Information:</strong> Please provide accurate business details as they appear on your official documents. 
          This information will be used for FTA registration and compliance reporting.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                {...form.register('companyName')}
                placeholder="ABC Trading LLC"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trn">Tax Registration Number (TRN) *</Label>
              <Input
                id="trn"
                {...form.register('trn', {
                  onChange: (e) => {
                    e.target.value = formatTRN(e.target.value);
                  }
                })}
                placeholder="100123456700003"
                maxLength={15}
                className={errors.trn ? 'border-red-500' : ''}
              />
              {errors.trn && (
                <p className="text-sm text-red-600">{errors.trn.message}</p>
              )}
              <p className="text-xs text-gray-600">
                15-digit number issued by UAE Federal Tax Authority
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessLicense">Business License Number *</Label>
              <Input
                id="businessLicense"
                {...form.register('businessLicense')}
                placeholder="CN-1234567"
                className={errors.businessLicense ? 'border-red-500' : ''}
              />
              {errors.businessLicense && (
                <p className="text-sm text-red-600">{errors.businessLicense.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry Sector *</Label>
              <Select
                value={watchedValues.industry}
                onValueChange={(value) => form.setValue('industry', value)}
              >
                <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {UAE_INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-red-600">{errors.industry.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...form.register('phone', {
                  onChange: (e) => {
                    e.target.value = formatPhone(e.target.value);
                  }
                })}
                placeholder="+971501234567"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="info@company.ae"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address *</Label>
              <Textarea
                id="address"
                {...form.register('address')}
                placeholder="Office 123, Building Name, Street, Area, Dubai, UAE"
                rows={4}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
              <p className="text-xs text-gray-600">
                Complete business address including emirate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TRN Validation Helper */}
      {watchedValues.trn && watchedValues.trn.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">TRN Validation</h4>
                <p className="text-sm text-blue-800">
                  {watchedValues.trn.length === 15 ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Valid TRN format (15 digits)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      TRN must be exactly 15 digits ({watchedValues.trn.length}/15)
                    </span>
                  )}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  The TRN will be verified against FTA records during final registration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}