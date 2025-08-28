import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  Calendar,
  Shield,
  Building,
  FileText,
  CreditCard,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FTAComplianceItem {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'critical' | 'high' | 'medium';
  category: 'registration' | 'filing' | 'payment' | 'update';
  action: string;
  isCompleted: boolean;
  applicableRevenue?: number;
}

interface UAEFTAAlertsProps {
  revenue: number;
  isNaturalPerson?: boolean;
  isMultinational?: boolean;
  isFreeZone?: boolean;
}

export default function UAEFTA2025Alerts({ 
  revenue, 
  isNaturalPerson = false, 
  isMultinational = false,
  isFreeZone = false 
}: UAEFTAAlertsProps) {
  const { toast } = useToast();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Generate 2025 FTA compliance requirements based on business profile
  const generate2025Requirements = (): FTAComplianceItem[] => {
    const requirements: FTAComplianceItem[] = [];

    // Critical 2025 Requirements
    if (isNaturalPerson) {
      requirements.push({
        id: 'natural-person-ct-registration',
        title: 'Natural Person CT Registration - URGENT',
        description: 'Final deadline for natural persons to register for Corporate Tax. Penalty: AED 10,000 for late registration.',
        deadline: '2025-03-31',
        priority: 'critical',
        category: 'registration',
        action: 'Register Now via EmaraTax',
        isCompleted: false
      });
    }

    // DMTT for Large Multinationals
    if (isMultinational && revenue >= 750000000) {
      requirements.push({
        id: 'dmtt-implementation',
        title: '15% DMTT Implementation Required',
        description: 'Domestic Minimum Top-Up Tax (15%) now applicable for large multinationals with global revenues €750M+.',
        deadline: '2025-01-01',
        priority: 'critical',
        category: 'filing',
        action: 'Implement DMTT Calculations',
        isCompleted: false,
        applicableRevenue: 750000000
      });
    }

    // VAT Registration Threshold
    if (revenue > 375000) {
      requirements.push({
        id: 'vat-registration-required',
        title: 'VAT Registration Required',
        description: 'Revenue exceeds AED 375,000 threshold. Must register for VAT and file quarterly returns.',
        deadline: '2025-01-30',
        priority: 'high',
        category: 'registration',
        action: 'Complete VAT Registration',
        isCompleted: false,
        applicableRevenue: 375000
      });
    }

    // E-invoicing Preparation
    requirements.push({
      id: 'e-invoicing-preparation',
      title: 'E-invoicing B2B/B2G Preparation',
      description: 'Mandatory B2B/B2G e-invoicing starts July 2026. Prepare UBL 2.1 systems now for phased rollout.',
      deadline: '2026-07-01',
      priority: 'medium',
      category: 'update',
      action: 'Prepare E-invoicing System',
      isCompleted: false
    });

    // QFZP Status Assessment for Free Zone
    if (isFreeZone) {
      requirements.push({
        id: 'qfzp-status-assessment',
        title: 'QFZP Status Assessment',
        description: 'Free zone entities must assess Qualified Free Zone Person status for tax exemption eligibility.',
        deadline: '2025-06-30',
        priority: 'high',
        category: 'filing',
        action: 'Complete QFZP Assessment',
        isCompleted: false
      });
    }

    // Corporate Tax Filing
    if (revenue > 375000) {
      requirements.push({
        id: 'corporate-tax-filing',
        title: 'Corporate Tax Return Filing',
        description: 'Annual CT return due within 9 months of fiscal year-end. IFRS-compliant financial statements required.',
        deadline: '2025-09-30',
        priority: 'high',
        category: 'filing',
        action: 'Prepare CT Return',
        isCompleted: false
      });
    }

    // Enhanced Export Documentation
    requirements.push({
      id: 'export-documentation',
      title: 'Enhanced Export Documentation',
      description: 'Stricter export documentation requirements for VAT zero-rating claims. Update procedures.',
      deadline: '2025-04-01',
      priority: 'medium',
      category: 'update',
      action: 'Update Export Procedures',
      isCompleted: false
    });

    return requirements.filter(req => !dismissedAlerts.includes(req.id));
  };

  const requirements = generate2025Requirements();
  const criticalRequirements = requirements.filter(req => req.priority === 'critical');
  const upcomingDeadlines = requirements.filter(req => {
    const deadline = new Date(req.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'registration': return <Building className="h-4 w-4" />;
      case 'filing': return <FileText className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'update': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    toast({
      title: "Alert Dismissed",
      description: "You can re-enable this alert in compliance settings.",
    });
  };

  const handleTakeAction = (requirement: FTAComplianceItem) => {
    toast({
      title: "Compliance Action",
      description: `Opening ${requirement.action} workflow for: ${requirement.title}`,
    });
  };

  if (requirements.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">UAE FTA Compliance Current</h3>
              <p className="text-sm text-green-700">All 2025 FTA requirements are up to date for your business profile.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts Summary */}
      {criticalRequirements.length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <strong className="text-red-900">
                  {criticalRequirements.length} Critical FTA Requirements
                </strong>
                <p className="text-red-800">Immediate action required to avoid penalties</p>
              </div>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto"
                onClick={() => {
                  toast({
                    title: "Critical Compliance Review",
                    description: "Opening comprehensive compliance checklist.",
                  });
                }}
              >
                Review All Critical Items
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Clock className="h-5 w-5" />
              Upcoming Deadlines (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDeadlines.map((req) => {
              const deadline = new Date(req.deadline);
              const daysUntil = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={req.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2 flex-1">
                    {getCategoryIcon(req.category)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{req.title}</p>
                      <p className="text-xs text-gray-600">{daysUntil} days remaining</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {deadline.toLocaleDateString()}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Detailed Requirements */}
      <div className="space-y-3">
        {requirements.map((requirement) => (
          <Card key={requirement.id} className={`${getPriorityColor(requirement.priority)} border-l-4`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(requirement.category)}
                    <h4 className="font-medium text-gray-900">{requirement.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        requirement.priority === 'critical' ? 'border-red-400 text-red-700' :
                        requirement.priority === 'high' ? 'border-orange-400 text-orange-700' :
                        'border-yellow-400 text-yellow-700'
                      }`}
                    >
                      {requirement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{requirement.description}</p>
                  
                  {requirement.applicableRevenue && (
                    <p className="text-xs text-gray-600 mb-2">
                      Applies to revenue above: AED {requirement.applicableRevenue.toLocaleString()}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleTakeAction(requirement)}
                    >
                      {requirement.action}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDismissAlert(requirement.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {new Date(requirement.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* FTA Resources */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">UAE FTA Official Resources</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <ExternalLink className="h-3 w-3 mr-2" />
              EmaraTax Portal
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <ExternalLink className="h-3 w-3 mr-2" />
              FTA Guides & Clarifications
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <ExternalLink className="h-3 w-3 mr-2" />
              Corporate Tax Calculator
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <ExternalLink className="h-3 w-3 mr-2" />
              E-invoicing Standards
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}