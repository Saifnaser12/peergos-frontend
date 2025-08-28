import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Smartphone, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  FileText, 
  Camera, 
  Upload,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  Bell,
  CreditCard,
  Calculator
} from 'lucide-react';
import { ftaAPI } from '@/utils/fta-real-time-api';
import { calculateVat, calculateCit } from '@/lib/tax-calculations';
import { useToast } from '@/hooks/use-toast';

interface SMEQuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTime: string;
  mobileOptimized: boolean;
  oneClick?: boolean;
}

interface SMEInsight {
  type: 'SAVING' | 'WARNING' | 'OPPORTUNITY' | 'DEADLINE';
  title: string;
  message: string;
  amount?: number;
  actionText?: string;
  daysLeft?: number;
}

export default function SMESimplifiedDashboard() {
  const [revenue, setRevenue] = useState(850000);
  const [expenses, setExpenses] = useState(320000);
  const [quickActions, setQuickActions] = useState<SMEQuickAction[]>([]);
  const [insights, setInsights] = useState<SMEInsight[]>([]);
  const [complianceHealth, setComplianceHealth] = useState(92);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeSMEDashboard();
  }, [revenue, expenses]);

  const initializeSMEDashboard = async () => {
    // Initialize quick actions for SMEs
    const actions: SMEQuickAction[] = [
      {
        id: '1',
        title: 'Scan Receipt',
        description: 'Take photo of expense receipt',
        icon: Camera,
        urgency: 'LOW',
        estimatedTime: '30 seconds',
        mobileOptimized: true,
        oneClick: true
      },
      {
        id: '2',
        title: 'Upload Invoice',
        description: 'Add customer invoice',
        icon: Upload,
        urgency: 'MEDIUM',
        estimatedTime: '1 minute',
        mobileOptimized: true,
        oneClick: true
      },
      {
        id: '3',
        title: 'Check VAT Due',
        description: 'Quick VAT calculation',
        icon: Calculator,
        urgency: 'HIGH',
        estimatedTime: 'Instant',
        mobileOptimized: true,
        oneClick: true
      },
      {
        id: '4',
        title: 'Pay Taxes',
        description: 'Direct FTA payment',
        icon: CreditCard,
        urgency: 'HIGH',
        estimatedTime: '2 minutes',
        mobileOptimized: true
      },
      {
        id: '5',
        title: 'File VAT Return',
        description: 'Submit quarterly return',
        icon: FileText,
        urgency: 'HIGH',
        estimatedTime: '5 minutes',
        mobileOptimized: true
      },
      {
        id: '6',
        title: 'Compliance Check',
        description: 'Real-time FTA status',
        icon: Shield,
        urgency: 'MEDIUM',
        estimatedTime: 'Instant',
        mobileOptimized: true,
        oneClick: true
      }
    ];

    setQuickActions(actions);

    // Generate SME-specific insights
    await generateSMEInsights();
  };

  const generateSMEInsights = async () => {
    const netIncome = revenue - expenses;
    const vatCalc = calculateVat({ sales: revenue, purchases: expenses });
    const citCalc = calculateCit({ revenue, expenses });

    const newInsights: SMEInsight[] = [];

    // Small Business Relief insight
    if (netIncome <= 375000) {
      newInsights.push({
        type: 'SAVING',
        title: 'Small Business Relief Applied',
        message: `You're saving AED ${(netIncome * 0.09).toFixed(0)} in CIT due to Small Business Relief`,
        amount: netIncome * 0.09,
        actionText: 'Learn More'
      });
    }

    // VAT threshold monitoring
    if (revenue > 300000 && revenue < 375000) {
      newInsights.push({
        type: 'WARNING',
        title: 'Approaching VAT Threshold',
        message: `You need AED ${(375000 - revenue).toFixed(0)} more revenue to require VAT registration`,
        actionText: 'Monitor Closely'
      });
    }

    // Upcoming VAT deadline
    const nextVatDeadline = new Date('2025-01-28');
    const daysToVat = Math.ceil((nextVatDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToVat <= 30 && revenue > 375000) {
      newInsights.push({
        type: 'DEADLINE',
        title: 'VAT Return Due Soon',
        message: `Q4 2024 VAT return due in ${daysToVat} days`,
        daysLeft: daysToVat,
        actionText: 'File Now'
      });
    }

    // Cash flow optimization
    if (vatCalc.netVatDue > 0) {
      newInsights.push({
        type: 'OPPORTUNITY',
        title: 'Input VAT Recovery',
        message: `You can claim AED ${vatCalc.inputVat.toFixed(0)} in input VAT`,
        amount: vatCalc.inputVat,
        actionText: 'Optimize'
      });
    }

    // Record keeping reminder
    newInsights.push({
      type: 'OPPORTUNITY',
      title: 'Digital Record Keeping',
      message: 'Switch to 100% digital records for faster tax filing',
      actionText: 'Enable Auto-Sync'
    });

    setInsights(newInsights);
  };

  const handleQuickAction = async (actionId: string) => {
    setIsLoading(true);
    try {
      switch (actionId) {
        case '3': // VAT Calculation
          const vatResult = calculateVat({ sales: revenue, purchases: expenses });
          toast({
            title: "VAT Calculated",
            description: `Net VAT Due: AED ${vatResult.netVatDue.toFixed(2)}`,
          });
          break;
        case '6': // Compliance Check
          const complianceResult = await ftaAPI.getComplianceStatus('100123456700003');
          toast({
            title: "Compliance Status",
            description: `Overall Risk: ${complianceResult.overallRisk} | Trusted Taxpayer: ${complianceResult.trustedTaxpayerStatus ? 'Yes' : 'No'}`,
          });
          break;
        default:
          toast({
            title: "Action Completed",
            description: `${quickActions.find(a => a.id === actionId)?.title} initiated`,
          });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Action failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      default: return 'secondary';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'SAVING': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'OPPORTUNITY': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'DEADLINE': return <Clock className="w-4 h-4 text-red-600" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Mobile-First Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">SME Tax Hub</h1>
            <p className="text-sm text-gray-600">Simplified compliance for small businesses</p>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <Badge variant="secondary">Mobile Ready</Badge>
          </div>
        </div>

        {/* Compliance Health Score */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compliance Health</span>
              <span className="text-2xl font-bold text-green-600">{complianceHealth}%</span>
            </div>
            <Progress value={complianceHealth} className="mb-2" />
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>All requirements met • Next review in 30 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SME Quick Actions Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Card 
              key={action.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction(action.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <action.icon className="w-6 h-6 text-blue-600" />
                  <Badge variant={getUrgencyColor(action.urgency)} className="text-xs">
                    {action.urgency}
                  </Badge>
                </div>
                <h3 className="font-medium text-sm mb-1">{action.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{action.estimatedTime}</span>
                  {action.mobileOptimized && (
                    <Smartphone className="w-3 h-3 text-green-600" />
                  )}
                </div>
                {action.oneClick && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    One-Click
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Revenue Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Business Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Annual Revenue (AED)</label>
              <Input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Annual Expenses (AED)</label>
              <Input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Tax Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Estimated VAT Due</p>
              <p className="text-lg font-bold text-blue-600">
                AED {calculateVat({ sales: revenue, purchases: expenses }).netVatDue.toFixed(0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Estimated CIT Due</p>
              <p className="text-lg font-bold text-green-600">
                AED {calculateCit({ revenue, expenses }).citDue.toFixed(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SME Insights */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Your Business Insights</h2>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <Alert key={index} className="p-4">
              <div className="flex items-start gap-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{insight.message}</p>
                  <div className="flex items-center justify-between">
                    {insight.amount && (
                      <span className="text-sm font-medium text-green-600">
                        AED {insight.amount.toFixed(0)}
                      </span>
                    )}
                    {insight.daysLeft && (
                      <span className="text-sm font-medium text-red-600">
                        {insight.daysLeft} days left
                      </span>
                    )}
                    {insight.actionText && (
                      <Button size="sm" variant="outline" className="text-xs">
                        {insight.actionText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>

      {/* SME Benefits Highlight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Your SME Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Small Business Relief</p>
                <p className="text-xs text-gray-600">0% CIT on first AED 375,000</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Cash Basis Accounting</p>
                <p className="text-xs text-gray-600">Simplified bookkeeping</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Quarterly VAT Filing</p>
                <p className="text-xs text-gray-600">Less frequent submissions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">Mobile-First Platform</p>
                <p className="text-xs text-gray-600">Manage taxes on-the-go</p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              Your business qualifies for simplified compliance procedures. All calculations and filings 
              are automatically optimized for SME benefits including Small Business Relief and cash basis accounting.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}