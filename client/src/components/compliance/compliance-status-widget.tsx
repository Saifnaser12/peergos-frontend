import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';

interface ComplianceStatusWidgetProps {
  complianceItems: any[];
}

export function ComplianceStatusWidget({ complianceItems }: ComplianceStatusWidgetProps) {
  // Calculate compliance metrics
  const calculateMetrics = () => {
    const total = complianceItems.length;
    const compliant = complianceItems.filter(item => item.status === 'compliant').length;
    const pending = complianceItems.filter(item => item.status === 'pending').length;
    const overdue = complianceItems.filter(item => item.status === 'overdue').length;
    const warnings = complianceItems.filter(item => item.status === 'warning').length;
    
    const complianceScore = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const criticalIssues = complianceItems.filter(item => item.priority === 'critical').length;
    
    // Calculate trend (mock data for demonstration)
    const lastMonthScore = 78; // This would come from historical data
    const trend = complianceScore - lastMonthScore;
    
    return {
      total,
      compliant,
      pending,
      overdue,
      warnings,
      complianceScore,
      criticalIssues,
      trend
    };
  };

  const metrics = calculateMetrics();

  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-green-500', text: 'text-green-600', label: 'Excellent' };
    if (score >= 80) return { bg: 'bg-blue-500', text: 'text-blue-600', label: 'Good' };
    if (score >= 70) return { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'Fair' };
    return { bg: 'bg-red-500', text: 'text-red-600', label: 'Needs Attention' };
  };

  const scoreColor = getScoreColor(metrics.complianceScore);

  const complianceAreas = [
    {
      name: 'VAT Compliance',
      score: 85,
      status: 'good',
      lastCheck: '2 days ago',
      issues: 1
    },
    {
      name: 'CIT Compliance',
      score: 92,
      status: 'excellent',
      lastCheck: '1 week ago',
      issues: 0
    },
    {
      name: 'Filing Requirements',
      score: 75,
      status: 'fair',
      lastCheck: '3 days ago',
      issues: 2
    },
    {
      name: 'Record Keeping',
      score: 88,
      status: 'good',
      lastCheck: '1 day ago',
      issues: 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Compliance Score */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(metrics.complianceScore / 100) * 251.2} 251.2`}
                className={scoreColor.text}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">
                {metrics.complianceScore}%
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Compliance Score
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="outline" className={`${scoreColor.text} border-current`}>
                {scoreColor.label}
              </Badge>
              {metrics.trend !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  metrics.trend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.trend > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{Math.abs(metrics.trend)}% vs last month</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{metrics.compliant}</p>
            <p className="text-xs text-green-700">Compliant</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600">{metrics.pending}</p>
            <p className="text-xs text-blue-700">Pending</p>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-yellow-600">{metrics.warnings}</p>
            <p className="text-xs text-yellow-700">Warnings</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-600">{metrics.overdue}</p>
            <p className="text-xs text-red-700">Overdue</p>
          </div>
        </div>

        {/* Compliance Areas */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Compliance Areas</h4>
          {complianceAreas.map((area, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{area.name}</span>
                <div className="flex items-center gap-2">
                  {area.issues > 0 && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                      {area.issues} issue{area.issues > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <span className="text-sm font-bold text-gray-900">{area.score}%</span>
                </div>
              </div>
              <Progress value={area.score} className="h-2" />
              <p className="text-xs text-gray-500">Last checked: {area.lastCheck}</p>
            </div>
          ))}
        </div>

        {/* Critical Issues Alert */}
        {metrics.criticalIssues > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-red-900">Critical Issues Detected</h4>
            </div>
            <p className="text-sm text-red-700 mb-3">
              {metrics.criticalIssues} critical compliance issue{metrics.criticalIssues > 1 ? 's' : ''} 
              {' '}require{metrics.criticalIssues === 1 ? 's' : ''} immediate attention.
            </p>
            <Button size="sm" variant="outline" className="text-red-700 border-red-300">
              <Eye className="h-3 w-3 mr-1" />
              Review Issues
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              Generate Report
            </Button>
            <Button variant="outline" size="sm">
              Schedule Review
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}