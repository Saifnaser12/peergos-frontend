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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/ui/file-upload';
import { Building2, FileText, Upload, Globe, AlertTriangle, CheckCircle, Info, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Transfer Pricing Form Schema
const transferPricingSchema = z.object({
  // Basic Information
  reportingYear: z.string().min(1, 'Reporting year is required'),
  reportingPeriod: z.string().min(1, 'Reporting period is required'),
  
  // Entity Information
  entityType: z.string().min(1, 'Entity type is required'),
  totalRevenue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Total revenue must be a valid positive number',
  }),
  
  // Related Party Transactions
  hasRelatedPartyTransactions: z.boolean(),
  relatedPartyTransactions: z.array(z.object({
    counterpartyName: z.string().min(1, 'Counterparty name is required'),
    counterpartyCountry: z.string().min(1, 'Counterparty country is required'),
    transactionType: z.string().min(1, 'Transaction type is required'),
    transactionAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: 'Transaction amount must be a valid positive number',
    }),
    transferPricingMethod: z.string().min(1, 'Transfer pricing method is required'),
    description: z.string().min(1, 'Description is required'),
  })).optional(),
  
  // Transfer Pricing Methods
  primaryMethod: z.string().optional(),
  methodJustification: z.string().optional(),
  
  // Economic Analysis
  hasEconomicAnalysis: z.boolean(),
  economicAnalysisDescription: z.string().optional(),
  benchmarkingStudy: z.boolean(),
  
  // Country-by-Country Reporting
  isMultinationalGroup: z.boolean(),
  isParentEntity: z.boolean(),
  groupRevenue: z.string().optional(),
  requiresCbCReporting: z.boolean(),
  
  // Master File and Local File
  requiresMasterFile: z.boolean(),
  requiresLocalFile: z.boolean(),
  masterFilePreparationStatus: z.string().optional(),
  localFilePreparationStatus: z.string().optional(),
  
  // Documentation
  documentationLevel: z.string().min(1, 'Documentation level is required'),
  supportingDocuments: z.array(z.object({
    fileName: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    uploadDate: z.string(),
  })).optional(),
  
  // Compliance Declaration
  declaration: z.object({
    armLengthPrinciple: z.boolean().refine(val => val === true, {
      message: 'Must confirm arm\'s length principle compliance',
    }),
    accurateDocumentation: z.boolean().refine(val => val === true, {
      message: 'Must confirm accurate documentation',
    }),
    regulatoryCompliance: z.boolean().refine(val => val === true, {
      message: 'Must confirm regulatory compliance',
    }),
  }),
});

type TransferPricingFormData = z.infer<typeof transferPricingSchema>;

interface TransferPricingFormProps {
  initialData?: Partial<TransferPricingFormData>;
  onSubmit?: (data: TransferPricingFormData) => void;
  mode?: 'draft' | 'submit';
}

const TRANSFER_PRICING_METHODS = [
  { value: 'CUP', label: 'Comparable Uncontrolled Price (CUP)' },
  { value: 'RPM', label: 'Resale Price Method (RPM)' },
  { value: 'CPM', label: 'Cost Plus Method (CPM)' },
  { value: 'TNMM', label: 'Transactional Net Margin Method (TNMM)' },
  { value: 'PSM', label: 'Profit Split Method (PSM)' },
  { value: 'OTHER', label: 'Other Method' },
];

const TRANSACTION_TYPES = [
  'Sale of Goods',
  'Provision of Services',
  'Licensing of Intangibles',
  'Financial Transactions',
  'Cost Sharing Arrangements',
  'Other',
];

export default function TransferPricingForm({ initialData, onSubmit, mode = 'draft' }: TransferPricingFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { company } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TransferPricingFormData>({
    resolver: zodResolver(transferPricingSchema),
    defaultValues: {
      reportingYear: new Date().getFullYear().toString(),
      reportingPeriod: 'FY_2024',
      entityType: 'Operating Company',
      totalRevenue: '',
      hasRelatedPartyTransactions: false,
      relatedPartyTransactions: [],
      primaryMethod: '',
      methodJustification: '',
      hasEconomicAnalysis: false,
      economicAnalysisDescription: '',
      benchmarkingStudy: false,
      isMultinationalGroup: false,
      isParentEntity: false,
      groupRevenue: '',
      requiresCbCReporting: false,
      requiresMasterFile: false,
      requiresLocalFile: false,
      masterFilePreparationStatus: 'Not Required',
      localFilePreparationStatus: 'Not Required',
      documentationLevel: 'Basic',
      supportingDocuments: [],
      declaration: {
        armLengthPrinciple: false,
        accurateDocumentation: false,
        regulatoryCompliance: false,
      },
      ...initialData,
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;
  const watchedData = watch();

  // Calculate Transfer Pricing compliance requirements
  const calculateComplianceRequirements = () => {
    const revenue = parseFloat(watchedData.totalRevenue || '0');
    const groupRevenue = parseFloat(watchedData.groupRevenue || '0');
    
    // UAE Transfer Pricing thresholds (AED 200M for documentation)
    const documentationThreshold = 200000000; // AED 200 million
    const cbcReportingThreshold = 3150000000; // AED 3.15 billion (EUR 750M equivalent)
    
    const requiresDocumentation = revenue >= documentationThreshold;
    const requiresCbCReporting = watchedData.isMultinationalGroup && groupRevenue >= cbcReportingThreshold;
    
    // Update form values based on calculations
    if (requiresDocumentation) {
      setValue('requiresMasterFile', true);
      setValue('requiresLocalFile', true);
      setValue('masterFilePreparationStatus', 'Required');
      setValue('localFilePreparationStatus', 'Required');
    }
    
    if (requiresCbCReporting) {
      setValue('requiresCbCReporting', true);
    }
    
    return {
      requiresDocumentation,
      requiresCbCReporting,
      documentationThreshold,
      cbcReportingThreshold,
    };
  };

  const compliance = calculateComplianceRequirements();

  // Add Related Party Transaction
  const addRelatedPartyTransaction = () => {
    const currentTransactions = watchedData.relatedPartyTransactions || [];
    setValue('relatedPartyTransactions', [
      ...currentTransactions,
      {
        counterpartyName: '',
        counterpartyCountry: '',
        transactionType: '',
        transactionAmount: '',
        transferPricingMethod: '',
        description: '',
      },
    ]);
  };

  // Remove Related Party Transaction
  const removeRelatedPartyTransaction = (index: number) => {
    const currentTransactions = watchedData.relatedPartyTransactions || [];
    setValue('relatedPartyTransactions', currentTransactions.filter((_, i) => i !== index));
  };

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: TransferPricingFormData) => {
      return apiRequest('/api/transfer-pricing', {
        method: 'POST',
        body: {
          companyId: company?.id,
          reportingYear: data.reportingYear,
          reportingPeriod: data.reportingPeriod,
          status: 'DRAFT',
          data: {
            ...data,
            compliance,
          },
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "Transfer pricing documentation draft has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transfer-pricing'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save transfer pricing draft.",
        variant: "destructive",
      });
    },
  });

  // Submit documentation mutation
  const submitDocumentationMutation = useMutation({
    mutationFn: async (data: TransferPricingFormData) => {
      return apiRequest('/api/transfer-pricing', {
        method: 'POST',
        body: {
          companyId: company?.id,
          reportingYear: data.reportingYear,
          reportingPeriod: data.reportingPeriod,
          status: 'SUBMITTED',
          data: {
            ...data,
            compliance,
          },
          submittedAt: new Date().toISOString(),
          submittedBy: company?.id,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Documentation Submitted",
        description: "Your transfer pricing documentation has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transfer-pricing'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit transfer pricing documentation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: TransferPricingFormData) => {
    if (mode === 'draft') {
      saveDraftMutation.mutate(data);
    } else {
      submitDocumentationMutation.mutate(data);
    }
    
    if (onSubmit) {
      onSubmit(data);
    }
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles = files.map(file => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
    }));
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setValue('supportingDocuments', [...(watchedData.supportingDocuments || []), ...newFiles]);
  };

  return (
    <div className="space-y-6">
      {/* Compliance Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            UAE Transfer Pricing Compliance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Entity Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(watchedData.totalRevenue || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
              <Badge variant={compliance.requiresDocumentation ? "default" : "outline"} className="text-xs mt-1">
                {compliance.requiresDocumentation ? 'Documentation Required' : 'Below Threshold'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Group Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(watchedData.groupRevenue || '0'), 'AED', language === 'ar' ? 'ar-AE' : 'en-AE')}
              </p>
              <Badge variant={compliance.requiresCbCReporting ? "default" : "outline"} className="text-xs mt-1">
                {compliance.requiresCbCReporting ? 'CbC Reporting Required' : 'Below Threshold'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Related Party Transactions</p>
              <p className="text-lg font-bold text-purple-600">
                {watchedData.relatedPartyTransactions?.length || 0}
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                Transactions Documented
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="transactions">Related Parties</TabsTrigger>
              <TabsTrigger value="methods">TP Methods</TabsTrigger>
              <TabsTrigger value="analysis">Economic Analysis</TabsTrigger>
              <TabsTrigger value="reporting">CbC Reporting</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
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
                      name="reportingYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reporting Year</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reporting year" />
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
                      name="entityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entity Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Operating Company">Operating Company</SelectItem>
                              <SelectItem value="Holding Company">Holding Company</SelectItem>
                              <SelectItem value="Service Company">Service Company</SelectItem>
                              <SelectItem value="Free Zone Entity">Free Zone Entity</SelectItem>
                              <SelectItem value="Branch">Branch</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="totalRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Revenue (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter total revenue"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Annual revenue for determining documentation requirements (AED 200M threshold)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {compliance.requiresDocumentation && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Documentation Required:</strong> Your entity revenue exceeds AED 200M. 
                        Master File and Local File documentation are required.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Party Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Related Party Transactions
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRelatedPartyTransaction}
                    >
                      Add Transaction
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasRelatedPartyTransactions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Related Party Transactions</FormLabel>
                          <FormDescription>
                            Does your entity have transactions with related parties?
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

                  {watchedData.hasRelatedPartyTransactions && (
                    <div className="space-y-4">
                      {watchedData.relatedPartyTransactions?.map((transaction, index) => (
                        <Card key={index} className="border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                              Transaction {index + 1}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRelatedPartyTransaction(index)}
                              >
                                Remove
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`relatedPartyTransactions.${index}.counterpartyName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Counterparty Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Related party name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`relatedPartyTransactions.${index}.counterpartyCountry`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Country</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Country of counterparty" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`relatedPartyTransactions.${index}.transactionType`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Transaction Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select transaction type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {TRANSACTION_TYPES.map(type => (
                                          <SelectItem key={type} value={type}>{type}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`relatedPartyTransactions.${index}.transactionAmount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Amount (AED)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Transaction amount"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`relatedPartyTransactions.${index}.transferPricingMethod`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Transfer Pricing Method</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select TP method" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {TRANSFER_PRICING_METHODS.map(method => (
                                          <SelectItem key={method.value} value={method.value}>
                                            {method.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name={`relatedPartyTransactions.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Describe the transaction and its commercial rationale"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      )) || <p className="text-gray-500 text-center py-4">No transactions added yet.</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transfer Pricing Methods Tab */}
            <TabsContent value="methods" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Pricing Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="primaryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Transfer Pricing Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select primary method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TRANSFER_PRICING_METHODS.map(method => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the most appropriate method based on the nature of transactions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="methodJustification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method Selection Justification</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain why this method is the most appropriate for your transactions"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed reasoning for method selection per UAE TP regulations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Economic Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Economic Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasEconomicAnalysis"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Economic Analysis Performed</FormLabel>
                          <FormDescription>
                            Has an economic analysis been conducted to support transfer pricing?
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

                  {watchedData.hasEconomicAnalysis && (
                    <FormField
                      control={form.control}
                      name="economicAnalysisDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Economic Analysis Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the economic analysis performed, including methodology and key findings"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="benchmarkingStudy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Benchmarking Study</FormLabel>
                          <FormDescription>
                            Has a benchmarking study been conducted using external comparables?
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Country-by-Country Reporting Tab */}
            <TabsContent value="reporting" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Country-by-Country Reporting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isMultinationalGroup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Multinational Enterprise Group</FormLabel>
                          <FormDescription>
                            Is your entity part of a multinational enterprise group?
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

                  {watchedData.isMultinationalGroup && (
                    <>
                      <FormField
                        control={form.control}
                        name="isParentEntity"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Ultimate Parent Entity</FormLabel>
                              <FormDescription>
                                Is this entity the ultimate parent entity of the group?
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

                      <FormField
                        control={form.control}
                        name="groupRevenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group Consolidated Revenue (AED)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter group consolidated revenue"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Annual consolidated group revenue for CbC reporting threshold (AED 3.15B)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {compliance.requiresCbCReporting && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800">
                            <strong>CbC Reporting Required:</strong> Your group revenue exceeds AED 3.15B. 
                            Country-by-Country Reporting is mandatory.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Master File and Local File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="masterFilePreparationStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Master File Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Not Required">Not Required</SelectItem>
                              <SelectItem value="Required">Required</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Filed">Filed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="localFilePreparationStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local File Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Not Required">Not Required</SelectItem>
                              <SelectItem value="Required">Required</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Filed">Filed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="documentationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documentation Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select documentation level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic">Basic Documentation</SelectItem>
                            <SelectItem value="Standard">Standard Documentation</SelectItem>
                            <SelectItem value="Comprehensive">Comprehensive Documentation</SelectItem>
                            <SelectItem value="Advanced">Advanced with Economic Analysis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Supporting Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    onFilesUpload={handleFileUpload}
                    acceptedFileTypes={['pdf', 'doc', 'docx', 'xls', 'xlsx']}
                    maxFileSize={10 * 1024 * 1024} // 10MB
                    multiple={true}
                  />

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.fileName}</span>
                          <Badge variant="outline" className="text-xs">
                            {(file.fileSize / 1024 / 1024).toFixed(2)}MB
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Upload supporting documentation including: organizational charts, financial statements, 
                      intercompany agreements, economic analysis reports, and benchmarking studies.
                    </AlertDescription>
                  </Alert>

                  {/* Declaration Section */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold">Compliance Declaration</h3>
                    
                    <FormField
                      control={form.control}
                      name="declaration.armLengthPrinciple"
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
                              Arm's Length Principle Compliance
                            </FormLabel>
                            <FormDescription>
                              I confirm that all related party transactions are conducted at arm's length
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="declaration.accurateDocumentation"
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
                              Accurate Documentation
                            </FormLabel>
                            <FormDescription>
                              I confirm that all documentation is accurate and complete
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="declaration.regulatoryCompliance"
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
                              Regulatory Compliance
                            </FormLabel>
                            <FormDescription>
                              I confirm compliance with UAE Transfer Pricing regulations
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
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
                !watchedData.declaration?.armLengthPrinciple || 
                !watchedData.declaration?.accurateDocumentation ||
                !watchedData.declaration?.regulatoryCompliance ||
                submitDocumentationMutation.isPending
              }
            >
              {mode === 'submit' ? (
                submitDocumentationMutation.isPending ? 'Submitting...' : 'Submit Documentation'
              ) : (
                'Save Documentation'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}