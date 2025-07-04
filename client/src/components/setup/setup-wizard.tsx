import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/context/language-context';
import { Building2, FileCheck, DollarSign, Shield, CheckCircle } from 'lucide-react';

// SME size detection based on revenue tiers (slide 7)
const smeCategories = [
  { name: 'Micro', revenue: 375000, employees: 5, description: 'Up to AED 375k revenue, ≤5 employees' },
  { name: 'Small', revenue: 3000000, employees: 50, description: 'AED 375k - 3M revenue, ≤50 employees' },
  { name: 'Medium', revenue: 50000000, employees: 250, description: 'AED 3M - 50M revenue, ≤250 employees' },
  { name: 'Large', revenue: Infinity, employees: Infinity, description: 'Above AED 50M revenue' }
];

const setupSchema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  trn: z.string().regex(/^\d{15}$/, 'TRN must be 15 digits'),
  industry: z.string().min(1, 'Industry required'),
  annualRevenue: z.number().min(0, 'Revenue must be positive'),
  employeeCount: z.number().min(1, 'At least 1 employee required'),
  freeZone: z.boolean().default(false),
  vatRegistered: z.boolean().default(false),
  address: z.string().min(5, 'Full address required'),
  bankAccount: z.string().optional(),
  uaePassConsent: z.boolean().refine(val => val, 'UAE PASS consent required'),
  bankConnectConsent: z.boolean().default(false),
  documentUploadConsent: z.boolean().refine(val => val, 'Document upload consent required')
});

type SetupFormData = z.infer<typeof setupSchema>;

interface SetupWizardProps {
  onComplete: (data: SetupFormData & { smeCategory: string; citRate: number }) => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [smeCategory, setSmeCategory] = useState<string>('');
  const { t } = useLanguage();
  
  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      freeZone: false,
      vatRegistered: false,
      uaePassConsent: false,
      bankConnectConsent: false,
      documentUploadConsent: false
    }
  });

  const watchedRevenue = form.watch('annualRevenue');
  const watchedEmployees = form.watch('employeeCount');
  const watchedFreeZone = form.watch('freeZone');

  // Auto-detect SME category based on revenue and employees
  const detectSmeCategory = (revenue: number, employees: number) => {
    for (const category of smeCategories) {
      if (revenue <= category.revenue && employees <= category.employees) {
        return category.name;
      }
    }
    return 'Large';
  };

  // Calculate CIT rate based on SME category and Free Zone status
  const calculateCitRate = (revenue: number, freeZone: boolean) => {
    if (freeZone && revenue < 3000000) return 0; // QFZP logic
    if (revenue <= 375000) return 0; // Small Business Relief
    return 9; // Standard rate
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (data: SetupFormData) => {
    const category = detectSmeCategory(data.annualRevenue, data.employeeCount);
    const citRate = calculateCitRate(data.annualRevenue, data.freeZone);
    
    onComplete({
      ...data,
      smeCategory: category,
      citRate
    });
  };

  // Update SME category when revenue/employees change
  useEffect(() => {
    if (watchedRevenue && watchedEmployees) {
      setSmeCategory(detectSmeCategory(watchedRevenue, watchedEmployees));
    }
  }, [watchedRevenue, watchedEmployees]);

  const progress = (step / 4) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Setup Wizard</h2>
        <p className="text-gray-600">Complete your tax compliance setup in 4 easy steps</p>
        <Progress value={progress} className="mt-4" />
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Step {step} of 4</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Trading LLC" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="trn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Registration Number (TRN)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="100123456700003" maxLength={15} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="services">Professional Services</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full business address in UAE" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Business Size & Tax Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Revenue (AED)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder="1000000" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Employees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          placeholder="10" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {smeCategory && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Auto-Detected Category:</h4>
                    <Badge variant="secondary" className="mb-2">{smeCategory} Business</Badge>
                    <p className="text-sm text-gray-600">
                      {smeCategories.find(c => c.name === smeCategory)?.description}
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="freeZone"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Free Zone Company</FormLabel>
                        <div className="text-sm text-gray-600">
                          QFZP (Qualified Free Zone Person) eligibility
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatRegistered"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>VAT Registered</FormLabel>
                        <div className="text-sm text-gray-600">
                          Required if revenue {`>`} AED 375,000
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchedRevenue && watchedFreeZone !== undefined && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Estimated CIT Rate:</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {calculateCitRate(watchedRevenue, watchedFreeZone)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {watchedRevenue <= 375000 ? 'Small Business Relief applies' : 
                       watchedFreeZone && watchedRevenue < 3000000 ? 'QFZP 0% rate applies' : 
                       'Standard 9% rate applies'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Document Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="AE123456789012345678901" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankConnectConsent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Bank API Integration</FormLabel>
                        <div className="text-sm text-gray-600">
                          Auto-sync transactions from your bank
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Compliance & Consent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="uaePassConsent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>UAE PASS Integration *</FormLabel>
                        <div className="text-sm text-gray-600">
                          Required for FTA submissions
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentUploadConsent"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Document Upload & OCR *</FormLabel>
                        <div className="text-sm text-gray-600">
                          License docs, receipts, invoice scanning
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Data Retention Notice</h4>
                  <p className="text-sm text-gray-600">
                    Records will be stored for 7 years as per FTA requirements. 
                    FTA gets live read-only access via TRN filter for compliance monitoring.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrevious}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 4 ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}