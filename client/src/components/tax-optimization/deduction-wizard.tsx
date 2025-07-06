import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  TrendingUp, 
  Calculator, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  Star,
  Target,
  PiggyBank,
  AlertCircle
} from 'lucide-react';

interface DeductionOpportunity {
  category: string;
  description: string;
  potentialSaving: number;
  difficulty: 'easy' | 'medium' | 'advanced';
  requirements: string[];
  actionSteps: string[];
  uaeSpecific: boolean;
}

interface DeductionWizardProps {
  revenue: number;
  expenses: number;
  businessType: string;
}

export default function DeductionWizard({ revenue, expenses, businessType }: DeductionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);

  // UAE-specific deduction opportunities for SMEs
  const deductionOpportunities: DeductionOpportunity[] = [
    {
      category: 'Home Office Deduction',
      description: 'Deduct portion of home expenses if you work from home',
      potentialSaving: Math.min(revenue * 0.02, 15000),
      difficulty: 'easy',
      requirements: ['Dedicated workspace at home', 'Regular business use'],
      actionSteps: [
        'Measure your office space square footage',
        'Calculate percentage of total home area',
        'Gather utility bills and rent/mortgage statements',
        'Keep monthly expense records'
      ],
      uaeSpecific: true
    },
    {
      category: 'Business Vehicle Expenses',
      description: 'Deduct vehicle costs for business use in UAE',
      potentialSaving: Math.min(revenue * 0.03, 25000),
      difficulty: 'medium',
      requirements: ['Vehicle used for business', 'Detailed mileage logs'],
      actionSteps: [
        'Track business vs personal mileage',
        'Keep fuel receipts and maintenance records',
        'Document business trip purposes',
        'Consider actual expense vs standard mileage rate'
      ],
      uaeSpecific: true
    },
    {
      category: 'Professional Development',
      description: 'Training, courses, and skill development expenses',
      potentialSaving: Math.min(revenue * 0.015, 12000),
      difficulty: 'easy',
      requirements: ['Business-related training', 'Receipts and certificates'],
      actionSteps: [
        'Identify business-relevant courses',
        'Keep training receipts and certificates',
        'Document how training benefits business',
        'Include online courses and workshops'
      ],
      uaeSpecific: false
    },
    {
      category: 'UAE Business License & Permits',
      description: 'License renewal, permit fees, and regulatory costs',
      potentialSaving: Math.min(revenue * 0.01, 8000),
      difficulty: 'easy',
      requirements: ['Valid business license', 'Permit documentation'],
      actionSteps: [
        'Track license renewal fees',
        'Document permit and regulatory costs',
        'Include visa and labor card expenses',
        'Keep official receipts from authorities'
      ],
      uaeSpecific: true
    },
    {
      category: 'Technology & Software',
      description: 'Business software, apps, and technology expenses',
      potentialSaving: Math.min(revenue * 0.025, 18000),
      difficulty: 'easy',
      requirements: ['Business-use software', 'Subscription receipts'],
      actionSteps: [
        'List all business software subscriptions',
        'Document technology purchases',
        'Track cloud storage and hosting costs',
        'Include mobile business apps'
      ],
      uaeSpecific: false
    },
    {
      category: 'Marketing & Advertising',
      description: 'Digital marketing, social media ads, business promotion',
      potentialSaving: Math.min(revenue * 0.04, 30000),
      difficulty: 'medium',
      requirements: ['Marketing expenses', 'Campaign documentation'],
      actionSteps: [
        'Track social media advertising costs',
        'Document website and SEO expenses',
        'Keep receipts for promotional materials',
        'Include networking event costs'
      ],
      uaeSpecific: false
    }
  ];

  // Filter opportunities based on business type and revenue
  const relevantOpportunities = deductionOpportunities.filter(opp => {
    if (revenue < 100000 && opp.potentialSaving > 20000) return false;
    if (businessType === 'service' && opp.category === 'Business Vehicle Expenses') {
      return revenue > 200000; // Only for higher-revenue service businesses
    }
    return true;
  });

  const totalPotentialSaving = selectedOpportunities.reduce((sum, category) => {
    const opp = relevantOpportunities.find(o => o.category === category);
    return sum + (opp?.potentialSaving || 0);
  }, 0);

  const toggleOpportunity = (category: string) => {
    setSelectedOpportunities(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const wizardSteps = [
    'Tax Optimization Assessment',
    'Deduction Opportunities',
    'Implementation Plan',
    'Tracking Setup'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          UAE SME Tax Optimization Wizard
        </CardTitle>
        <div className="flex items-center justify-between">
          <Progress value={(currentStep / (wizardSteps.length - 1)) * 100} className="flex-1 mr-4" />
          <Badge variant="outline">{currentStep + 1} of {wizardSteps.length}</Badge>
        </div>
        <p className="text-sm text-gray-600">
          Step {currentStep + 1}: {wizardSteps[currentStep]}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Tax Optimization Analysis</strong> - Based on your business profile, we've identified potential tax savings opportunities.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Current Tax Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {revenue > 375000 ? '9%' : '0%'} CIT
                  </p>
                  <p className="text-sm text-green-600">
                    {revenue > 375000 ? '+5% VAT' : 'VAT exempt'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Optimization Potential</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    AED {Math.round(relevantOpportunities.reduce((sum, opp) => sum + opp.potentialSaving, 0)).toLocaleString()}
                  </p>
                  <p className="text-sm text-purple-600">Annual tax savings</p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <span className="font-medium">Efficiency Score</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {revenue > 0 ? Math.round((expenses / revenue) * 100) : 0}%
                  </p>
                  <p className="text-sm text-amber-600">Expense ratio</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Deduction Opportunities</h3>
            <div className="grid gap-4">
              {relevantOpportunities.map((opportunity) => (
                <Card 
                  key={opportunity.category}
                  className={`cursor-pointer transition-all ${
                    selectedOpportunities.includes(opportunity.category) 
                      ? 'border-green-500 bg-green-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => toggleOpportunity(opportunity.category)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{opportunity.category}</h4>
                          {opportunity.uaeSpecific && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                              UAE Specific
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${
                            opportunity.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            opportunity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {opportunity.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                        <p className="text-lg font-semibold text-green-600">
                          Potential saving: AED {opportunity.potentialSaving.toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        {selectedOpportunities.includes(opportunity.category) ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                          <div className="h-6 w-6 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedOpportunities.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <PiggyBank className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Total Potential Savings: AED {totalPotentialSaving.toLocaleString()}</strong> per year
                  <br />
                  You've selected {selectedOpportunities.length} optimization opportunities.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Implementation Plan</h3>
            {selectedOpportunities.map((category) => {
              const opportunity = relevantOpportunities.find(o => o.category === category);
              if (!opportunity) return null;

              return (
                <Card key={category} className="border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">{opportunity.category}</h4>
                    
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Requirements:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {opportunity.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Action Steps:</h5>
                      <ol className="text-sm text-gray-600 space-y-1">
                        {opportunity.actionSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Setup Complete!</strong> Your tax optimization plan is ready. We'll help you track these deductions throughout the year.
              </AlertDescription>
            </Alert>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Annual Tax Savings Summary</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  AED {totalPotentialSaving.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Estimated annual savings from {selectedOpportunities.length} optimization strategies
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600">{selectedOpportunities.length}</p>
                    <p className="text-xs text-gray-600">Active Strategies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-purple-600">
                      {revenue > 0 ? Math.round((totalPotentialSaving / revenue) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-600">Tax Rate Reduction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">Auto</p>
                    <p className="text-xs text-gray-600">Tracking Enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < wizardSteps.length - 1 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 1 && selectedOpportunities.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button className="bg-green-600 hover:bg-green-700">
              Start Tracking
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}