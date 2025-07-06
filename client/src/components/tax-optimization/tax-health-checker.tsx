import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Calculator,
  Clock,
  DollarSign,
  FileText,
  Zap
} from 'lucide-react';

interface TaxHealthMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

interface TaxHealthCheckerProps {
  revenue: number;
  expenses: number;
  vatDue: number;
  citDue: number;
  hasValidLicense: boolean;
  lastFilingDate?: string;
}

export default function TaxHealthChecker({
  revenue,
  expenses,
  vatDue,
  citDue,
  hasValidLicense,
  lastFilingDate
}: TaxHealthCheckerProps) {
  
  // Calculate tax health metrics
  const calculateTaxHealth = (): TaxHealthMetric[] => {
    const metrics: TaxHealthMetric[] = [];
    
    // Compliance Score
    const complianceIssues = [
      !hasValidLicense,
      revenue > 375000 && vatDue === 0,
      lastFilingDate && new Date(lastFilingDate) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ].filter(Boolean).length;
    
    metrics.push({
      name: 'Compliance Status',
      score: Math.max(0, 100 - (complianceIssues * 25)),
      status: complianceIssues === 0 ? 'excellent' : complianceIssues === 1 ? 'good' : complianceIssues === 2 ? 'needs_attention' : 'critical',
      description: `${complianceIssues} compliance issues detected`,
      recommendation: complianceIssues === 0 ? 'Maintain current compliance standards' : 'Address compliance gaps immediately',
      impact: 'high'
    });

    // Expense Optimization
    const expenseRatio = revenue > 0 ? (expenses / revenue) * 100 : 0;
    const expenseScore = expenseRatio < 30 ? 60 : expenseRatio < 50 ? 80 : expenseRatio < 70 ? 95 : 100;
    
    metrics.push({
      name: 'Expense Optimization',
      score: expenseScore,
      status: expenseScore >= 90 ? 'excellent' : expenseScore >= 75 ? 'good' : expenseScore >= 60 ? 'needs_attention' : 'critical',
      description: `${expenseRatio.toFixed(1)}% expense-to-revenue ratio`,
      recommendation: expenseScore < 75 ? 'Review and categorize all business expenses' : 'Expense tracking is well optimized',
      impact: 'medium'
    });

    // Tax Efficiency
    const totalTax = vatDue + citDue;
    const taxRate = revenue > 0 ? (totalTax / revenue) * 100 : 0;
    const taxScore = taxRate > 15 ? 50 : taxRate > 10 ? 70 : taxRate > 5 ? 85 : 95;
    
    metrics.push({
      name: 'Tax Efficiency',
      score: taxScore,
      status: taxScore >= 85 ? 'excellent' : taxScore >= 70 ? 'good' : taxScore >= 50 ? 'needs_attention' : 'critical',
      description: `${taxRate.toFixed(1)}% effective tax rate`,
      recommendation: taxScore < 70 ? 'Explore additional deduction opportunities' : 'Tax rate is well optimized',
      impact: 'high'
    });

    // Cash Flow Health
    const netIncome = revenue - expenses;
    const cashFlowScore = netIncome <= 0 ? 30 : netIncome < revenue * 0.1 ? 60 : netIncome < revenue * 0.2 ? 80 : 95;
    
    metrics.push({
      name: 'Cash Flow Health',
      score: cashFlowScore,
      status: cashFlowScore >= 80 ? 'excellent' : cashFlowScore >= 60 ? 'good' : cashFlowScore >= 30 ? 'needs_attention' : 'critical',
      description: `AED ${netIncome.toLocaleString()} net income`,
      recommendation: cashFlowScore < 60 ? 'Review pricing and cost structure' : 'Strong cash flow management',
      impact: 'high'
    });

    // Record Keeping
    const recordScore = hasValidLicense ? 85 : 40; // Simplified scoring
    
    metrics.push({
      name: 'Record Keeping',
      score: recordScore,
      status: recordScore >= 80 ? 'excellent' : recordScore >= 60 ? 'good' : recordScore >= 40 ? 'needs_attention' : 'critical',
      description: 'Digital record management assessment',
      recommendation: recordScore < 60 ? 'Implement systematic record keeping' : 'Maintain current documentation standards',
      impact: 'medium'
    });

    return metrics;
  };

  const metrics = calculateTaxHealth();
  const overallScore = metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;
  const criticalIssues = metrics.filter(m => m.status === 'critical').length;
  const needsAttention = metrics.filter(m => m.status === 'needs_attention').length;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Good</Badge>;
      case 'needs_attention':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Needs Attention</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Tax Health Score
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {Math.round(overallScore)}
              </div>
              <div className="text-sm text-gray-600">out of 100</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallScore} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-lg font-semibold text-green-600">
                  {metrics.filter(m => m.status === 'excellent' || m.status === 'good').length}
                </span>
              </div>
              <div className="text-sm text-gray-600">Healthy Areas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-lg font-semibold text-yellow-600">{needsAttention}</span>
              </div>
              <div className="text-sm text-gray-600">Need Attention</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-lg font-semibold text-red-600">{criticalIssues}</span>
              </div>
              <div className="text-sm text-gray-600">Critical Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Urgent Action Required:</strong> You have {criticalIssues} critical tax health issues that need immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Metrics */}
      <div className="grid gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className={`${
            metric.status === 'critical' ? 'border-red-200 bg-red-50' :
            metric.status === 'needs_attention' ? 'border-yellow-200 bg-yellow-50' :
            metric.status === 'good' ? 'border-blue-200 bg-blue-50' :
            'border-green-200 bg-green-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    {metric.name === 'Compliance Status' && <Shield className="h-6 w-6 text-blue-600" />}
                    {metric.name === 'Expense Optimization' && <TrendingUp className="h-6 w-6 text-purple-600" />}
                    {metric.name === 'Tax Efficiency' && <Calculator className="h-6 w-6 text-green-600" />}
                    {metric.name === 'Cash Flow Health' && <DollarSign className="h-6 w-6 text-blue-600" />}
                    {metric.name === 'Record Keeping' && <FileText className="h-6 w-6 text-gray-600" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    <p className="text-sm text-gray-600">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}
                  </div>
                  {getStatusBadge(metric.status)}
                </div>
              </div>
              
              <Progress value={metric.score} className="mb-3" />
              
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-sm text-gray-700">{metric.recommendation}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${
                  metric.impact === 'high' ? 'border-red-300 text-red-700' :
                  metric.impact === 'medium' ? 'border-yellow-300 text-yellow-700' :
                  'border-green-300 text-green-700'
                }`}>
                  {metric.impact} impact
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Items */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics
            .filter(m => m.status === 'critical' || m.status === 'needs_attention')
            .map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    metric.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900">{metric.name}</p>
                    <p className="text-sm text-gray-600">{metric.recommendation}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Fix Now
                </Button>
              </div>
            ))}
          
          {metrics.filter(m => m.status === 'critical' || m.status === 'needs_attention').length === 0 && (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-green-700 font-medium">All systems look good!</p>
              <p className="text-sm text-green-600">No critical actions required at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}