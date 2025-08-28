import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Shield, 
  FileText, 
  CreditCard,
  AlertCircle,
  Users,
  DollarSign,
  Calculator
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ComplianceDeadline {
  id: string;
  type: 'VAT' | 'CIT' | 'REGISTRATION' | 'AUDIT';
  title: string;
  dueDate: Date;
  status: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
  description: string;
  penalty?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface SMESupport {
  id: string;
  category: 'THRESHOLD' | 'FILING' | 'REGISTRATION' | 'PAYMENT';
  title: string;
  description: string;
  actionRequired: boolean;
  deadline?: Date;
  automationAvailable: boolean;
}

interface TaxAgentReview {
  id: string;
  agentName: string;
  license: string;
  specialization: string[];
  rating: number;
  reviewCount: number;
  status: 'AVAILABLE' | 'BUSY' | 'PREFERRED';
  estimatedCost: string;
}

export default function SmartComplianceDashboard() {
  const [activeDeadlines, setActiveDeadlines] = useState<ComplianceDeadline[]>([]);
  const [smeSupports, setSmeSupports] = useState<SMESupport[]>([]);
  const [taxAgents, setTaxAgents] = useState<TaxAgentReview[]>([]);
  const [complianceScore, setComplianceScore] = useState(0);

  // Simulate API calls - in production, these would fetch real data
  useEffect(() => {
    // Mock compliance deadlines based on UAE FTA requirements
    const deadlines: ComplianceDeadline[] = [
      {
        id: '1',
        type: 'VAT',
        title: 'Q4 2024 VAT Return',
        dueDate: new Date('2025-01-28'),
        status: 'DUE_SOON',
        description: 'Quarterly VAT return for October-December 2024',
        penalty: 'AED 1,000 for first violation, AED 2,000 for multiple violations',
        priority: 'HIGH'
      },
      {
        id: '2',
        type: 'CIT',
        title: 'Corporate Tax Registration',
        dueDate: new Date('2025-03-31'),
        status: 'UPCOMING',
        description: 'Final deadline for CT registration if not completed',
        penalty: 'AED 10,000 fixed penalty for late registration',
        priority: 'HIGH'
      },
      {
        id: '3',
        type: 'CIT',
        title: 'FY2024 Corporate Tax Return',
        dueDate: new Date('2025-09-30'),
        status: 'UPCOMING',
        description: 'Annual CIT return for financial year ending Dec 31, 2024',
        penalty: 'Penalties apply for late filing and payment',
        priority: 'MEDIUM'
      },
      {
        id: '4',
        type: 'AUDIT',
        title: 'Financial Statement Audit',
        dueDate: new Date('2025-06-30'),
        status: 'UPCOMING',
        description: 'Required if revenue > AED 50 million or Qualified Free Zone Person',
        priority: 'LOW'
      }
    ];

    // SME-specific support items
    const supports: SMESupport[] = [
      {
        id: '1',
        category: 'THRESHOLD',
        title: 'Revenue Monitoring Alert',
        description: 'You are approaching the AED 375,000 VAT registration threshold',
        actionRequired: true,
        deadline: new Date('2025-02-28'),
        automationAvailable: true
      },
      {
        id: '2',
        category: 'FILING',
        title: 'Cash Basis Accounting',
        description: 'You qualify for simplified cash-basis accounting (revenue < AED 3M)',
        actionRequired: false,
        automationAvailable: true
      },
      {
        id: '3',
        category: 'REGISTRATION',
        title: 'TRN Verification Setup',
        description: 'Real-time TRN verification for all transactions',
        actionRequired: true,
        automationAvailable: true
      },
      {
        id: '4',
        category: 'PAYMENT',
        title: 'FTA Payment Gateway',
        description: 'Direct payment integration with FTA portal',
        actionRequired: false,
        automationAvailable: true
      }
    ];

    // Mock pre-approved tax agents
    const agents: TaxAgentReview[] = [
      {
        id: '1',
        agentName: 'Ahmed Al-Mansouri Tax Consultancy',
        license: 'FTA-LIC-2024-001',
        specialization: ['VAT', 'CIT', 'SME Services'],
        rating: 4.8,
        reviewCount: 156,
        status: 'AVAILABLE',
        estimatedCost: 'AED 2,500 - 5,000/year'
      },
      {
        id: '2',
        agentName: 'Emirates Tax Advisory',
        license: 'FTA-LIC-2024-045',
        specialization: ['CIT', 'Transfer Pricing', 'Free Zone'],
        rating: 4.6,
        reviewCount: 89,
        status: 'PREFERRED',
        estimatedCost: 'AED 3,000 - 7,000/year'
      },
      {
        id: '3',
        agentName: 'Gulf Compliance Partners',
        license: 'FTA-LIC-2024-078',
        specialization: ['VAT', 'E-invoicing', 'Audit Support'],
        rating: 4.9,
        reviewCount: 234,
        status: 'BUSY',
        estimatedCost: 'AED 4,000 - 8,500/year'
      }
    ];

    setActiveDeadlines(deadlines);
    setSmeSupports(supports);
    setTaxAgents(agents);
    
    // Calculate compliance score
    const completedTasks = deadlines.filter(d => d.status === 'COMPLETED').length;
    const score = Math.round((completedTasks / deadlines.length) * 100);
    setComplianceScore(score);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DUE_SOON': return 'text-orange-600 bg-orange-50';
      case 'OVERDUE': return 'text-red-600 bg-red-50';
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-green-600">{complianceScore}%</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={complianceScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deadlines</p>
                <p className="text-2xl font-bold">{activeDeadlines.filter(d => d.status !== 'COMPLETED').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">SME Benefits</p>
                <p className="text-2xl font-bold">{smeSupports.filter(s => s.automationAvailable).length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tax Agents</p>
                <p className="text-2xl font-bold">{taxAgents.filter(a => a.status === 'AVAILABLE').length}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="deadlines" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deadlines">Tax Deadlines</TabsTrigger>
          <TabsTrigger value="sme-support">SME Support</TabsTrigger>
          <TabsTrigger value="tax-agents">Tax Agents</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        {/* Tax Deadlines */}
        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Upcoming Tax Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityBadge(deadline.priority)}>
                        {deadline.priority}
                      </Badge>
                      <Badge className={getStatusColor(deadline.status)}>
                        {deadline.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {getDaysUntil(deadline.dueDate)} days remaining
                      </span>
                    </div>
                    <h4 className="font-semibold">{deadline.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{deadline.description}</p>
                    <p className="text-xs text-gray-500">Due: {formatDate(deadline.dueDate)}</p>
                    {deadline.penalty && (
                      <p className="text-xs text-red-600 mt-1">Penalty: {deadline.penalty}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm">
                      Complete Now
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SME Support */}
        <TabsContent value="sme-support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                SME-Specific Support & Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {smeSupports.map((support) => (
                <div key={support.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{support.category}</Badge>
                      {support.automationAvailable && (
                        <Badge variant="secondary">Automated</Badge>
                      )}
                      {support.actionRequired && (
                        <Badge variant="destructive">Action Required</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold">{support.title}</h4>
                    <p className="text-sm text-gray-600">{support.description}</p>
                    {support.deadline && (
                      <p className="text-xs text-gray-500 mt-1">
                        Deadline: {formatDate(support.deadline)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {support.automationAvailable && (
                      <Button size="sm" variant="outline">
                        Enable Auto
                      </Button>
                    )}
                    <Button size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              ))}

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  As an SME, you benefit from simplified compliance requirements:
                  • Cash basis accounting if revenue {`<`} AED 3M
                  • Small Business Relief: 0% CIT on first AED 375,000
                  • Quarterly VAT filing instead of monthly
                  • Simplified financial statement requirements
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pre-Approved Tax Agents */}
        <TabsContent value="tax-agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                FTA Pre-Approved Tax Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {taxAgents.map((agent) => (
                <div key={agent.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={agent.status === 'AVAILABLE' ? 'default' : 
                                agent.status === 'PREFERRED' ? 'secondary' : 'outline'}
                      >
                        {agent.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span 
                            key={i} 
                            className={`text-xs ${i < Math.floor(agent.rating) ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-gray-500">
                          {agent.rating} ({agent.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold">{agent.agentName}</h4>
                    <p className="text-sm text-gray-600 mb-1">License: {agent.license}</p>
                    <p className="text-sm text-gray-600 mb-1">
                      Specialization: {agent.specialization.join(', ')}
                    </p>
                    <p className="text-sm text-green-600">{agent.estimatedCost}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={agent.status === 'BUSY'}
                    >
                      {agent.status === 'BUSY' ? 'Unavailable' : 'Select Agent'}
                    </Button>
                  </div>
                </div>
              ))}

              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  All listed tax agents are pre-approved by FTA and specialize in SME compliance. 
                  They have direct access to submit your filings and can provide real-time compliance monitoring.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Features */}
        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Real-Time Tax Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VAT Auto-Calculation</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CIT Monitoring</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threshold Alerts</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Small Business Relief</span>
                    <Badge variant="default">Auto-Applied</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  FTA Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time TRN Verification</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">E-invoicing Phase 2 Ready</span>
                    <Badge variant="secondary">Preparing</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-submission to FTA</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">7-Year Data Retention</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Automation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">FTA Payment Gateway</span>
                    <Badge variant="outline">Setup Required</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Automatic Bank Debit</span>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Reminders</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Installment Plans</span>
                    <Badge variant="secondary">SME Benefit</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Smart Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Deadline Alerts</span>
                    <Badge variant="default">30/7/1 Days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threshold Monitoring</span>
                    <Badge variant="default">Real-time</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Regulation Updates</span>
                    <Badge variant="default">Instant</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mobile Notifications</span>
                    <Badge variant="outline">Setup Required</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}