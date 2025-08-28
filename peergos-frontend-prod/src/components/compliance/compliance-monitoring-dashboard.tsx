import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business-logic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceChecklist } from './compliance-checklist';
import { DeadlineTracker } from './deadline-tracker';
import { ComplianceStatusWidget } from './compliance-status-widget';
import { RegulatoryUpdates } from './regulatory-updates';
import { PenaltyCalculator } from './penalty-calculator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Calendar,
  Calculator,
  FileText,
  Bell,
  TrendingUp,
  Target,
  AlertCircle,
  Settings
} from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  category: 'vat' | 'cit' | 'regulatory' | 'filing';
  status: 'compliant' | 'pending' | 'overdue' | 'warning';
  deadline?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completedSteps: number;
  totalSteps: number;
  lastUpdated: Date;
  penalties?: {
    amount: number;
    type: string;
    daysOverdue: number;
  };
}

export default function ComplianceMonitoringDashboard() {
  const { language } = useLanguage();
  const { company, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch compliance data
  const { data: complianceData = [] } = useQuery({
    queryKey: ['/api/compliance/items'],
    enabled: !!company?.id,
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['/api/compliance/deadlines'],
    enabled: !!company?.id,
  });

  const { data: penalties = [] } = useQuery({
    queryKey: ['/api/compliance/penalties'],
    enabled: !!company?.id,
  });

  const { data: regulatoryUpdates = [] } = useQuery({
    queryKey: ['/api/compliance/regulatory-updates'],
    enabled: !!company?.id,
  });

  // Calculate compliance metrics
  const generateComplianceMetrics = () => {
    const mockComplianceItems: ComplianceItem[] = [
      {
        id: 'vat-filing-q1',
        title: 'VAT Return Q1 2025',
        description: 'Submit quarterly VAT return for Q1 2025',
        category: 'vat',
        status: 'pending',
        deadline: new Date('2025-04-28'),
        priority: 'high',
        completedSteps: 3,
        totalSteps: 5,
        lastUpdated: new Date(),
      },
      {
        id: 'cit-annual-2024',
        title: 'CIT Annual Return 2024',
        description: 'File annual Corporate Income Tax return',
        category: 'cit',
        status: 'compliant',
        deadline: new Date('2025-09-30'),
        priority: 'medium',
        completedSteps: 5,
        totalSteps: 5,
        lastUpdated: new Date(),
      },
      {
        id: 'financial-statements',
        title: 'Audited Financial Statements',
        description: 'Submit audited financial statements to FTA',
        category: 'filing',
        status: 'warning',
        deadline: new Date('2025-06-30'),
        priority: 'critical',
        completedSteps: 2,
        totalSteps: 6,
        lastUpdated: new Date(),
      },
      {
        id: 'regulatory-compliance',
        title: 'UAE Commercial License Renewal',
        description: 'Renew commercial license with DED',
        category: 'regulatory',
        status: 'overdue',
        deadline: new Date('2025-02-15'),
        priority: 'critical',
        completedSteps: 1,
        totalSteps: 4,
        lastUpdated: new Date(),
        penalties: {
          amount: 5000,
          type: 'Late renewal penalty',
          daysOverdue: 15
        }
      }
    ];

    const total = mockComplianceItems.length;
    const compliant = mockComplianceItems.filter(item => item.status === 'compliant').length;
    const pending = mockComplianceItems.filter(item => item.status === 'pending').length;
    const overdue = mockComplianceItems.filter(item => item.status === 'overdue').length;
    const warnings = mockComplianceItems.filter(item => item.status === 'warning').length;
    
    const complianceScore = total > 0 ? Math.round((compliant / total) * 100) : 0;
    const totalPenalties = mockComplianceItems.reduce((sum, item) => 
      sum + (item.penalties?.amount || 0), 0
    );

    return {
      items: mockComplianceItems,
      metrics: {
        total,
        compliant,
        pending,
        overdue,
        warnings,
        complianceScore,
        totalPenalties
      }
    };
  };

  const { items: complianceItems, metrics } = generateComplianceMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return CheckCircle2;
      case 'pending':
        return Clock;
      case 'warning':
        return AlertTriangle;
      case 'overdue':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Compliance Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage your tax compliance requirements
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`text-lg px-4 py-2 ${
              metrics.complianceScore >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
              metrics.complianceScore >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            Compliance Score: {metrics.complianceScore}%
          </Badge>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliant</p>
                <p className="text-3xl font-bold text-green-600">{metrics.compliant}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={(metrics.compliant / metrics.total) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={(metrics.pending / metrics.total) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{metrics.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <Progress value={(metrics.overdue / metrics.total) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Penalties</p>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(metrics.totalPenalties, 'AED')}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Accrued penalties</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Deadlines
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="penalties" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Penalties
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceStatusWidget complianceItems={complianceItems} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compliance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceItems.slice(0, 3).map((item) => {
                    const StatusIcon = getStatusIcon(item.status);
                    const progress = (item.completedSteps / item.totalSteps) * 100;
                    
                    return (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {item.completedSteps} of {item.totalSteps} steps completed
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <ComplianceChecklist items={complianceItems} />
        </TabsContent>

        <TabsContent value="deadlines">
          <DeadlineTracker deadlines={deadlines} />
        </TabsContent>

        <TabsContent value="updates">
          <RegulatoryUpdates updates={regulatoryUpdates} />
        </TabsContent>

        <TabsContent value="penalties">
          <PenaltyCalculator penalties={penalties} complianceItems={complianceItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}