import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Calculator, FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { UAE_CIT_RULES } from '@/constants/taxRates';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// CIT Return Form Schema
const citReturnSchema = z.object({
  // Basic Information
  taxYear: z.string().min(1, 'Tax year is required'),
  filingPeriod: z.string().min(1, 'Filing period is required'),
  
  // Financial Information
  accountingIncome: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Accounting income must be a valid number',
  }),
  
  // Tax Adjustments - Add-backs
  addBacks: z.object({
    nonDeductibleExpenses: z.string().optional(),
    depreciation: z.string().optional(),
    provisionsReversals: z.string().optional(),
    penaltiesFines: z.string().optional(),
    entertainmentExpenses: z.string().optional(),
    excessiveSalaries: z.string().optional(),
    other: z.string().optional(),
  }),
  
  // Tax Adjustments - Deductions
  deductions: z.object({
    acceleratedDepreciation: z.string().optional(),
    researchDevelopment: z.string().optional(),
    capitalAllowances: z.string().optional(),
    businessProvisions: z.string().optional(),
    carryForwardLosses: z.string().optional(),
    other: z.string().optional(),
  }),
  
  // Free Zone Information
  isFreeZone: z.boolean(),
  freeZoneName: z.string().optional(),
  qualifyingIncome: z.string().optional(),
  nonQualifyingIncome: z.string().optional(),
  
  // Quarterly Installments
  installments: z.object({
    q1Paid: z.string().optional(),
    q2Paid: z.string().optional(),
    q3Paid: z.string().optional(),
    q4Paid: z.string().optional(),
  }),
  
  // Withholding Tax Credits
  withholdingCredits: z.string().optional(),
  
  // Penalties and Interest
  penaltiesInterest: z.string().optional(),
  
  // Declaration
  declaration: z.object({
    accurateComplete: z.boolean().refine(val => val === true, {
      message: 'Must confirm information is accurate and complete',
    }),
    authorizedSignatory: z.boolean().refine(val => val === true, {
      message: 'Must confirm authorized signatory',
    }),
  }),
});

type CitReturnFormData = z.infer<typeof citReturnSchema>;

interface CitReturnFormProps {
  initialData?: Partial<CitReturnFormData>;
  onSubmit?: (data: CitReturnFormData) => void;
  mode?: 'draft' | 'submit';
}

export default function CitReturnForm({ initialData, onSubmit, mode = 'draft' }: CitReturnFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CitReturnFormData>({
    resolver: zodResolver(citReturnSchema),
    defaultValues: {
      taxYear: new Date().getFullYear().toString(),
      filingPeriod: 'FY_2024',
      accountingIncome: initialData?.accountingIncome || '',
      addBacks: {
        nonDeductibleExpenses: '',
        depreciation: '',
        provisionsReversals: '',
        penaltiesFines: '',
        entertainmentExpenses: '',
        excessiveSalaries: '',
        other: '',
      },
      deductions: {
        acceleratedDepreciation: '',
        researchDevelopment: '',
        capitalAllowances: '',
        businessProvisions: '',
        carryForwardLosses: '',
        other: '',
      },
      isFreeZone: company?.freeZone || false,
      freeZoneName: '',
      qualifyingIncome: '',
      nonQualifyingIncome: '',
      installments: {
        q1Paid: '',
        q2Paid: '',
        q3Paid: '',
        q4Paid: '',
      },
      withholdingCredits: '',
      penaltiesInterest: '',
      declaration: {
        accurateComplete: false,
        authorizedSignatory: false,
      },
      ...initialData,
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;
  const watchedData = watch();

  // Calculate taxable income in real-time
  const calculateTaxableIncome = () => {
    const accountingIncome = parseFloat(watchedData.accountingIncome || '0');
    
    // Add-backs
    const totalAddBacks = Object.values(watchedData.addBacks || {})
      .reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    
    // Deductions
    const totalDeductions = Object.values(watchedData.deductions || {})
      .reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    
    const taxableIncome = accountingIncome + totalAddBacks - totalDeductions;
    
    // Apply Small Business Relief
    let citLiability = 0;
    let applicableRate = 0;
    let reliefApplied = 0;
    
    if (watchedData.isFreeZone && parseFloat(watchedData.qualifyingIncome || '0') <= 3000000) {
      // Free Zone Qualifying Person - 0% rate
      citLiability = 0;
      applicableRate = 0;
      reliefApplied = taxableIncome;
    } else if (taxableIncome <= UAE_CIT_RULES.smallBusinessReliefThreshold) {
      // Small Business Relief - 0% rate
      citLiability = 0;
      applicableRate = 0;
      reliefApplied = taxableIncome;
    } else {
      // Standard 9% rate on amount above threshold
      const taxableAboveThreshold = taxableIncome - UAE_CIT_RULES.smallBusinessReliefThreshold;
      citLiability = taxableAboveThreshold * UAE_CIT_RULES.standardRate;
      applicableRate = UAE_CIT_RULES.standardRate * 100;
      reliefApplied = UAE_CIT_RULES.smallBusinessReliefThreshold;
    }
    
    // Calculate installments paid and net tax due
    const installmentsPaid = Object.values(watchedData.installments || {})
      .reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    
    const withholdingCredits = parseFloat(watchedData.withholdingCredits || '0');
    const penaltiesInterest = parseFloat(watchedData.penaltiesInterest || '0');
    
    const netTaxDue = Math.max(0, citLiability - installmentsPaid - withholdingCredits + penaltiesInterest);
    const refundDue = Math.max(0, installmentsPaid + withholdingCredits - citLiability - penaltiesInterest);
    
    return {
      accountingIncome,
      totalAddBacks,
      totalDeductions,
      taxableIncome,
      citLiability,
      applicableRate,
      reliefApplied,
      installmentsPaid,
      withholdingCredits,
      penaltiesInterest,
      netTaxDue,
      refundDue,
    };
  };

  const calculation = calculateTaxableIncome();

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: CitReturnFormData) => {
      return apiRequest('/api/tax-filings', {
        method: 'POST',
        body: {
          companyId: company?.id,
          type: 'CIT',
          period: data.filingPeriod,
          startDate: `${data.taxYear}-01-01`,
          endDate: `${data.taxYear}-12-31`,
          dueDate: `${parseInt(data.taxYear) + 1}-03-31`, // CIT due date
          status: 'DRAFT',
          calculations: {
            ...data,
            calculation,
          },
          totalTax: calculation.citLiability.toString(),
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "CIT return draft has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tax-filings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save CIT return draft.",
        variant: "destructive",
      });
    },
  });

  // Submit return mutation
  const submitReturnMutation = useMutation({
    mutationFn: async (data: CitReturnFormData) => {
      return apiRequest('/api/tax-filings', {
        method: 'POST',
        body: {
          companyId: company?.id,
          type: 'CIT',
          period: data.filingPeriod,
          startDate: `${data.taxYear}-01-01`,
          endDate: `${data.taxYear}-12-31`,
          dueDate: `${parseInt(data.taxYear) + 1}-03-31`,
          status: 'SUBMITTED',
          calculations: {
            ...data,
            calculation,
          },
          totalTax: calculation.citLiability.toString(),
          submittedAt: new Date().toISOString(),
          submittedBy: company?.id,
          ftaReference: `CIT-${company?.trn}-${data.taxYear}-${Date.now()}`,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "CIT Return Submitted",
        description: "Your CIT return has been submitted to FTA successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tax-filings'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit CIT return. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: CitReturnFormData) => {
    if (mode === 'draft') {
      saveDraftMutation.mutate(data);
    } else {
      submitReturnMutation.mutate(data);
    }
    
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const isFreeZone = watchedData.isFreeZone;
  const isQFZP = isFreeZone && parseFloat(watchedData.qualifyingIncome || '0') <= 3000000;

  return (
    <div className="space-y-6">
      {/* Calculation Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            CIT Calculation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Accounting Income</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(calculation.accountingIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Taxable Income</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(calculation.taxableIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">CIT Liability</p>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(calculation.citLiability, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
              {calculation.applicableRate === 0 && (
                <Badge variant="outline" className="text-xs mt-1">
                  {isQFZP ? 'QFZP Relief' : 'Small Business Relief'}
                </Badge>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Tax Due</p>
              <p className={cn("text-lg font-bold", 
                calculation.netTaxDue > 0 ? "text-red-600" : "text-green-600"
              )}>
                {calculation.netTaxDue > 0 
                  ? formatCurrency(calculation.netTaxDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')
                  : calculation.refundDue > 0
                    ? `+${formatCurrency(calculation.refundDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}`
                    : formatCurrency(0, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')
                }
              </p>
              {calculation.refundDue > 0 && (
                <Badge variant="outline" className="text-xs mt-1 text-green-600">
                  Refund Due
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
              <TabsTrigger value="freezone">Free Zone</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="declaration">Declaration</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Year</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tax year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="2023">2023</SelectItem>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filingPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Filing Period</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select filing period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FY_2024">Financial Year 2024</SelectItem>
                              <SelectItem value="FY_2023">Financial Year 2023</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="accountingIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accounting Income/Loss (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter accounting income or loss"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Net income/loss as per your audited financial statements
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tax Adjustments Tab */}
            <TabsContent value="adjustments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Add-backs (Increase Taxable Income)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="addBacks.nonDeductibleExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Non-deductible Expenses</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addBacks.penaltiesFines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalties & Fines</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addBacks.entertainmentExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entertainment Expenses</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addBacks.other"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Add-backs</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">
                      Total Add-backs: {formatCurrency(calculation.totalAddBacks, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Deductions (Decrease Taxable Income)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deductions.acceleratedDepreciation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accelerated Depreciation</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deductions.researchDevelopment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>R&D Expenses</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deductions.carryForwardLosses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carry Forward Losses</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deductions.other"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Deductions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Total Deductions: {formatCurrency(calculation.totalDeductions, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Free Zone Tab */}
            <TabsContent value="freezone" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Free Zone Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isFreeZone"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Free Zone Entity</FormLabel>
                          <FormDescription>
                            Is your company a Free Zone entity?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {isFreeZone && (
                    <>
                      <FormField
                        control={form.control}
                        name="freeZoneName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Free Zone Name</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select free zone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DIFC">Dubai International Financial Centre (DIFC)</SelectItem>
                                <SelectItem value="ADGM">Abu Dhabi Global Market (ADGM)</SelectItem>
                                <SelectItem value="JAFZA">Jebel Ali Free Zone (JAFZA)</SelectItem>
                                <SelectItem value="DMCC">Dubai Multi Commodities Centre (DMCC)</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="qualifyingIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualifying Income (AED)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Income from qualifying activities in the Free Zone
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="nonQualifyingIncome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Non-qualifying Income (AED)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Income from non-qualifying activities
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {isQFZP && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <strong>QFZP Status Qualified:</strong> Your qualifying income is below AED 3,000,000. 
                            You may be eligible for 0% CIT rate on qualifying income.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quarterly Installment Payments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="installments.q1Paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q1 Payment (AED)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installments.q2Paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q2 Payment (AED)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installments.q3Paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q3 Payment (AED)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installments.q4Paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q4 Payment (AED)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Total Installments Paid: {formatCurrency(calculation.installmentsPaid, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Tax Credits & Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="withholdingCredits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withholding Tax Credits (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Tax withheld by third parties on your behalf
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="penaltiesInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Penalties & Interest (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Any penalties or interest charges
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Declaration Tab */}
            <TabsContent value="declaration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Declaration & Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      By submitting this CIT return, you are declaring that the information provided is 
                      accurate and complete to the best of your knowledge.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="declaration.accurateComplete"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I declare that the information provided is accurate and complete
                            </FormLabel>
                            <FormDescription>
                              This declaration is required for CIT return submission
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="declaration.authorizedSignatory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I am an authorized signatory for this entity
                            </FormLabel>
                            <FormDescription>
                              Confirm you have authority to file this return
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Final calculation summary */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Final Tax Calculation</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span>Accounting Income:</span>
                        <span className="font-medium">
                          {formatCurrency(calculation.accountingIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Add-backs:</span>
                        <span className="font-medium text-red-600">
                          +{formatCurrency(calculation.totalAddBacks, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(calculation.totalDeductions, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Taxable Income:</span>
                        <span>
                          {formatCurrency(calculation.taxableIncome, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>CIT Rate:</span>
                        <span>{calculation.applicableRate}%</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>CIT Liability:</span>
                        <span className="text-primary-600">
                          {formatCurrency(calculation.citLiability, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Installments Paid:</span>
                        <span>
                          -{formatCurrency(calculation.installmentsPaid, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Withholding Credits:</span>
                        <span>
                          -{formatCurrency(calculation.withholdingCredits, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                        </span>
                      </div>
                      {calculation.penaltiesInterest > 0 && (
                        <div className="flex justify-between">
                          <span>Penalties & Interest:</span>
                          <span className="text-red-600">
                            +{formatCurrency(calculation.penaltiesInterest, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
                          </span>
                        </div>
                      )}
                      <Separator className="bg-gray-300" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>
                          {calculation.netTaxDue > 0 ? 'Net Tax Due:' : 'Refund Due:'}
                        </span>
                        <span className={calculation.netTaxDue > 0 ? 'text-red-600' : 'text-green-600'}>
                          {calculation.netTaxDue > 0 
                            ? formatCurrency(calculation.netTaxDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')
                            : formatCurrency(calculation.refundDue, 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => saveDraftMutation.mutate(form.getValues())}
              disabled={saveDraftMutation.isPending}
            >
              {saveDraftMutation.isPending ? 'Saving...' : 'Save as Draft'}
            </Button>

            <Button
              type="submit"
              disabled={
                !form.formState.isValid || 
                !watchedData.declaration?.accurateComplete || 
                !watchedData.declaration?.authorizedSignatory ||
                submitReturnMutation.isPending
              }
            >
              {mode === 'submit' ? (
                submitReturnMutation.isPending ? 'Submitting...' : 'Submit CIT Return'
              ) : (
                'Save Return'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}