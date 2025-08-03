import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calculator, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import { 
  EnhancedVATProcessor, 
  UAE_SUPPLY_TYPES, 
  INPUT_VAT_RECOVERY_RULES,
  enhancedVATValidationSchema
} from '@/lib/enhanced-vat-calculations';
import { formatCurrency } from '@/lib/business-logic';
import { cn } from '@/lib/utils';

// Enhanced validation schema for the form
const vatFormSchema = z.object({
  // Standard-rated supplies with enhanced validation
  standardRatedValue: z.number()
    .min(0, 'Supply value cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  standardRatedVAT: z.number()
    .min(0, 'VAT amount cannot be negative'),
  
  // Zero-rated supplies
  zeroRatedValue: z.number()
    .min(0, 'Supply value cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  
  // Exempt supplies
  exemptValue: z.number()
    .min(0, 'Supply value cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  
  // Reverse charge
  reverseChargeValue: z.number()
    .min(0, 'Supply value cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  reverseChargeVAT: z.number()
    .min(0, 'VAT amount cannot be negative'),
  
  // Input VAT
  inputVATStandard: z.number()
    .min(0, 'Input VAT cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  inputVATCapital: z.number()
    .min(0, 'Input VAT cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  inputVATCorrections: z.number()
    .min(-999999999, 'Correction value too low')
    .max(999999999, 'Correction value too high'),
    
  // Adjustments
  increaseInVAT: z.number()
    .min(0, 'Increase cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
  decreaseInVAT: z.number()
    .min(0, 'Decrease cannot be negative')
    .max(999999999, 'Value exceeds maximum limit'),
}).refine((data) => {
  // Validate standard-rated VAT calculation
  const expectedVAT = Math.round(data.standardRatedValue * 0.05 * 100) / 100;
  return Math.abs(data.standardRatedVAT - expectedVAT) <= 0.01;
}, {
  message: 'Standard-rated VAT must be exactly 5% of supply value',
  path: ['standardRatedVAT']
}).refine((data) => {
  // Validate reverse charge VAT calculation
  if (data.reverseChargeValue > 0) {
    const expectedVAT = Math.round(data.reverseChargeValue * 0.05 * 100) / 100;
    return Math.abs(data.reverseChargeVAT - expectedVAT) <= 0.01;
  }
  return data.reverseChargeVAT === 0;
}, {
  message: 'Reverse charge VAT must be exactly 5% of supply value when applicable',
  path: ['reverseChargeVAT']
});

type VATFormData = z.infer<typeof vatFormSchema>;

interface EnhancedVATCalculatorProps {
  onSubmit?: (data: any) => void;
  initialData?: Partial<VATFormData>;
  className?: string;
}

function EnhancedVATCalculator({ 
  onSubmit,
  initialData = {},
  className = ''
}: EnhancedVATCalculatorProps) {
  const [calculationBreakdown, setCalculationBreakdown] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);

  const form = useForm<VATFormData>({
    resolver: zodResolver(vatFormSchema),
    defaultValues: {
      standardRatedValue: 0,
      standardRatedVAT: 0,
      zeroRatedValue: 0,
      exemptValue: 0,
      reverseChargeValue: 0,
      reverseChargeVAT: 0,
      inputVATStandard: 0,
      inputVATCapital: 0,
      inputVATCorrections: 0,
      increaseInVAT: 0,
      decreaseInVAT: 0,
      ...initialData
    }
  });

  const { watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-calculate VAT amounts when supply values change
  useEffect(() => {
    const standardVAT = Math.round(watchedValues.standardRatedValue * 0.05 * 100) / 100;
    if (watchedValues.standardRatedVAT !== standardVAT) {
      setValue('standardRatedVAT', standardVAT);
    }
  }, [watchedValues.standardRatedValue, setValue]);

  useEffect(() => {
    const reverseVAT = Math.round(watchedValues.reverseChargeValue * 0.05 * 100) / 100;
    if (watchedValues.reverseChargeVAT !== reverseVAT) {
      setValue('reverseChargeVAT', reverseVAT);
    }
  }, [watchedValues.reverseChargeValue, setValue]);

  // Calculate real-time breakdown
  useEffect(() => {
    const breakdown = calculateRealTimeBreakdown(watchedValues);
    setCalculationBreakdown(breakdown);
    
    const validation = EnhancedVATProcessor.validateReturnCompleteness(breakdown);
    setValidationResults(validation);
  }, [watchedValues]);

  const calculateRealTimeBreakdown = (data: VATFormData) => {
    const outputVAT = data.standardRatedVAT + data.reverseChargeVAT + data.increaseInVAT - data.decreaseInVAT;
    const inputVAT = data.inputVATStandard + data.inputVATCapital + data.inputVATCorrections;
    const netVAT = outputVAT - inputVAT;

    return {
      outputVAT,
      inputVAT,
      netVAT,
      isRefund: netVAT < 0,
      breakdown: {
        standardRated: {
          value: data.standardRatedValue,
          vat: data.standardRatedVAT,
          rate: 5
        },
        zeroRated: {
          value: data.zeroRatedValue,
          vat: 0,
          rate: 0
        },
        exempt: {
          value: data.exemptValue,
          vat: 0,
          rate: null
        },
        reverseCharge: {
          value: data.reverseChargeValue,
          vat: data.reverseChargeVAT,
          rate: 5
        }
      },
      adjustments: {
        increase: data.increaseInVAT,
        decrease: data.decreaseInVAT,
        net: data.increaseInVAT - data.decreaseInVAT
      },
      inputBreakdown: {
        standard: data.inputVATStandard,
        capital: data.inputVATCapital,
        corrections: data.inputVATCorrections,
        total: inputVAT
      }
    };
  };

  const handleSubmit = (data: VATFormData) => {
    if (onSubmit) {
      onSubmit({
        formData: data,
        breakdown: calculationBreakdown,
        validation: validationResults
      });
    }
  };

  const renderTooltip = (content: { title: string; explanation: string; calculation: string; example: string; ftaGuidance: string }) => (
    <TooltipContent className="max-w-sm p-4">
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">{content.title}</h4>
        <p className="text-xs text-gray-600">{content.explanation}</p>
        <div className="bg-blue-50 p-2 rounded text-xs">
          <strong>Calculation:</strong> {content.calculation}
        </div>
        <div className="bg-green-50 p-2 rounded text-xs">
          <strong>Example:</strong> {content.example}
        </div>
        <div className="text-xs text-blue-600">
          <strong>FTA Guidance:</strong> {content.ftaGuidance}
        </div>
      </div>
    </TooltipContent>
  );

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Enhanced VAT Calculator</CardTitle>
                <p className="text-sm text-gray-600">
                  UAE FTA compliant VAT calculation with real-time validation
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {showBreakdown ? 'Hide' : 'Show'} Breakdown
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Standard-rated supplies section */}
            <Card className="border border-green-200 bg-green-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <CardTitle className="text-lg">Standard-rated supplies (5%)</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    {renderTooltip(EnhancedVATProcessor.getFieldExplanations().standardRatedSupplies)}
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-600">
                  {UAE_SUPPLY_TYPES.STANDARD.description}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="standardRatedValue">Total supply value (AED)</Label>
                  <Input
                    id="standardRatedValue"
                    type="number"
                    step="0.01"
                    {...form.register('standardRatedValue', { valueAsNumber: true })}
                    className={errors.standardRatedValue ? 'border-red-500' : ''}
                  />
                  {errors.standardRatedValue && (
                    <p className="text-sm text-red-600 mt-1">{errors.standardRatedValue.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: Commercial rent, professional services, goods sales
                  </p>
                </div>
                <div>
                  <Label htmlFor="standardRatedVAT">VAT amount (AED)</Label>
                  <Input
                    id="standardRatedVAT"
                    type="number"
                    step="0.01"
                    {...form.register('standardRatedVAT', { valueAsNumber: true })}
                    className={errors.standardRatedVAT ? 'border-red-500' : ''}
                    readOnly
                  />
                  {errors.standardRatedVAT && (
                    <p className="text-sm text-red-600 mt-1">{errors.standardRatedVAT.message}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    Auto-calculated: {formatCurrency(watchedValues.standardRatedValue * 0.05, 'AED', 'en-AE')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Zero-rated supplies section */}
            <Card className="border border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <CardTitle className="text-lg">Zero-rated supplies (0%)</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    {renderTooltip(EnhancedVATProcessor.getFieldExplanations().zeroRatedSupplies)}
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-600">
                  {UAE_SUPPLY_TYPES.ZERO_RATED.description}
                </p>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="zeroRatedValue">Total supply value (AED)</Label>
                  <Input
                    id="zeroRatedValue"
                    type="number"
                    step="0.01"
                    {...form.register('zeroRatedValue', { valueAsNumber: true })}
                    className={errors.zeroRatedValue ? 'border-red-500' : ''}
                  />
                  {errors.zeroRatedValue && (
                    <p className="text-sm text-red-600 mt-1">{errors.zeroRatedValue.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: Exports, international transport, investment precious metals
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Exempt supplies section */}
            <Card className="border border-gray-200 bg-gray-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <CardTitle className="text-lg">Exempt supplies</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    {renderTooltip(EnhancedVATProcessor.getFieldExplanations().exemptSupplies)}
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-600">
                  {UAE_SUPPLY_TYPES.EXEMPT.description}
                </p>
                {watchedValues.exemptValue > INPUT_VAT_RECOVERY_RULES.PARTIALLY_EXEMPT.deMinimisLimit && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Exempt supplies exceed AED {INPUT_VAT_RECOVERY_RULES.PARTIALLY_EXEMPT.deMinimisLimit.toLocaleString()}. 
                      Partial exemption rules may apply for input VAT recovery.
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="exemptValue">Total supply value (AED)</Label>
                  <Input
                    id="exemptValue"
                    type="number"
                    step="0.01"
                    {...form.register('exemptValue', { valueAsNumber: true })}
                    className={errors.exemptValue ? 'border-red-500' : ''}
                  />
                  {errors.exemptValue && (
                    <p className="text-sm text-red-600 mt-1">{errors.exemptValue.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: Financial services, residential rent, life insurance
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reverse charge section */}
            <Card className="border border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <CardTitle className="text-lg">Reverse charge supplies</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    {renderTooltip(EnhancedVATProcessor.getFieldExplanations().reverseCharge)}
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-600">
                  {UAE_SUPPLY_TYPES.REVERSE_CHARGE.description}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reverseChargeValue">Total supply value (AED)</Label>
                  <Input
                    id="reverseChargeValue"
                    type="number"
                    step="0.01"
                    {...form.register('reverseChargeValue', { valueAsNumber: true })}
                    className={errors.reverseChargeValue ? 'border-red-500' : ''}
                  />
                  {errors.reverseChargeValue && (
                    <p className="text-sm text-red-600 mt-1">{errors.reverseChargeValue.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Examples: Digital services from abroad, imported services
                  </p>
                </div>
                <div>
                  <Label htmlFor="reverseChargeVAT">VAT amount (AED)</Label>
                  <Input
                    id="reverseChargeVAT"
                    type="number"
                    step="0.01"
                    {...form.register('reverseChargeVAT', { valueAsNumber: true })}
                    className={errors.reverseChargeVAT ? 'border-red-500' : ''}
                    readOnly
                  />
                  {errors.reverseChargeVAT && (
                    <p className="text-sm text-red-600 mt-1">{errors.reverseChargeVAT.message}</p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    Auto-calculated: {formatCurrency(watchedValues.reverseChargeValue * 0.05, 'AED', 'en-AE')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Input VAT section */}
            <Card className="border border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                  <CardTitle className="text-lg">Input VAT recovery</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    {renderTooltip(EnhancedVATProcessor.getFieldExplanations().inputVAT)}
                  </Tooltip>
                </div>
                <p className="text-sm text-gray-600">
                  {INPUT_VAT_RECOVERY_RULES.FULLY_TAXABLE.description}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="inputVATStandard">Standard purchases VAT (AED)</Label>
                  <Input
                    id="inputVATStandard"
                    type="number"
                    step="0.01"
                    {...form.register('inputVATStandard', { valueAsNumber: true })}
                    className={errors.inputVATStandard ? 'border-red-500' : ''}
                  />
                  {errors.inputVATStandard && (
                    <p className="text-sm text-red-600 mt-1">{errors.inputVATStandard.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="inputVATCapital">Capital goods VAT (AED)</Label>
                  <Input
                    id="inputVATCapital"
                    type="number"
                    step="0.01"
                    {...form.register('inputVATCapital', { valueAsNumber: true })}
                    className={errors.inputVATCapital ? 'border-red-500' : ''}
                  />
                  {errors.inputVATCapital && (
                    <p className="text-sm text-red-600 mt-1">{errors.inputVATCapital.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Assets over AED {INPUT_VAT_RECOVERY_RULES.CAPITAL_GOODS.threshold.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label htmlFor="inputVATCorrections">Corrections (AED)</Label>
                  <Input
                    id="inputVATCorrections"
                    type="number"
                    step="0.01"
                    {...form.register('inputVATCorrections', { valueAsNumber: true })}
                    className={errors.inputVATCorrections ? 'border-red-500' : ''}
                  />
                  {errors.inputVATCorrections && (
                    <p className="text-sm text-red-600 mt-1">{errors.inputVATCorrections.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Adjustments from previous periods
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Adjustments section */}
            <Card className="border border-yellow-200 bg-yellow-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold">6</span>
                  <CardTitle className="text-lg">VAT adjustments</CardTitle>
                </div>
                <p className="text-sm text-gray-600">
                  Corrections and adjustments from previous periods
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="increaseInVAT">Increase in VAT (AED)</Label>
                  <Input
                    id="increaseInVAT"
                    type="number"
                    step="0.01"
                    {...form.register('increaseInVAT', { valueAsNumber: true })}
                    className={errors.increaseInVAT ? 'border-red-500' : ''}
                  />
                  {errors.increaseInVAT && (
                    <p className="text-sm text-red-600 mt-1">{errors.increaseInVAT.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="decreaseInVAT">Decrease in VAT (AED)</Label>
                  <Input
                    id="decreaseInVAT"
                    type="number"
                    step="0.01"
                    {...form.register('decreaseInVAT', { valueAsNumber: true })}
                    className={errors.decreaseInVAT ? 'border-red-500' : ''}
                  />
                  {errors.decreaseInVAT && (
                    <p className="text-sm text-red-600 mt-1">{errors.decreaseInVAT.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-time calculation summary */}
            {calculationBreakdown && (
              <Card className={cn(
                "border-2",
                calculationBreakdown.isRefund ? "border-green-200 bg-green-50/30" : "border-blue-200 bg-blue-50/30"
              )}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    VAT Calculation Summary
                    {calculationBreakdown.isRefund ? (
                      <Badge className="bg-green-100 text-green-800">Refund Due</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">Payment Due</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculationBreakdown.outputVAT, 'AED', 'en-AE')}
                      </div>
                      <div className="text-sm text-gray-600">Total Output VAT</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(calculationBreakdown.inputVAT, 'AED', 'en-AE')}
                      </div>
                      <div className="text-sm text-gray-600">Total Input VAT</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={cn(
                        "text-2xl font-bold",
                        calculationBreakdown.isRefund ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(Math.abs(calculationBreakdown.netVAT), 'AED', 'en-AE')}
                      </div>
                      <div className="text-sm text-gray-600">
                        Net VAT {calculationBreakdown.isRefund ? 'Refund' : 'Payable'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed breakdown section */}
            {showBreakdown && calculationBreakdown && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detailed Calculation Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Output VAT breakdown */}
                  <div>
                    <h4 className="font-semibold mb-2">Output VAT Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(calculationBreakdown.breakdown).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(data.vat, 'AED', 'en-AE')}</div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(data.value, 'AED', 'en-AE')} × {data.rate ? `${data.rate}%` : 'Exempt'}
                            </div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between items-center font-semibold">
                        <span>Subtotal Output VAT</span>
                        <span>{formatCurrency(
                          Object.values(calculationBreakdown.breakdown).reduce((sum: number, data: any) => sum + data.vat, 0),
                          'AED', 'en-AE'
                        )}</span>
                      </div>
                      {calculationBreakdown.adjustments.net !== 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span>Net Adjustments</span>
                          <span className={calculationBreakdown.adjustments.net > 0 ? 'text-red-600' : 'text-green-600'}>
                            {calculationBreakdown.adjustments.net > 0 ? '+' : ''}
                            {formatCurrency(calculationBreakdown.adjustments.net, 'AED', 'en-AE')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                        <span>Total Output VAT</span>
                        <span>{formatCurrency(calculationBreakdown.outputVAT, 'AED', 'en-AE')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Input VAT breakdown */}
                  <div>
                    <h4 className="font-semibold mb-2">Input VAT Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>Standard purchases</span>
                        <span>{formatCurrency(calculationBreakdown.inputBreakdown.standard, 'AED', 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>Capital goods</span>
                        <span>{formatCurrency(calculationBreakdown.inputBreakdown.capital, 'AED', 'en-AE')}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>Corrections</span>
                        <span className={calculationBreakdown.inputBreakdown.corrections >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {calculationBreakdown.inputBreakdown.corrections >= 0 ? '+' : ''}
                          {formatCurrency(calculationBreakdown.inputBreakdown.corrections, 'AED', 'en-AE')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                        <span>Total Input VAT</span>
                        <span>{formatCurrency(calculationBreakdown.inputVAT, 'AED', 'en-AE')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validation results */}
            {validationResults && (!validationResults.isComplete || validationResults.calculationErrors.length > 0) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    {validationResults.missingFields.length > 0 && (
                      <div>
                        <strong>Missing fields:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {validationResults.missingFields.map((field: string, index: number) => (
                            <li key={index}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResults.calculationErrors.length > 0 && (
                      <div>
                        <strong>Calculation errors:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {validationResults.calculationErrors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 pt-6">
              <Button type="submit" className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate VAT Return
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default EnhancedVATCalculator;