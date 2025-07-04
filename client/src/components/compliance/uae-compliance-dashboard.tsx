import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateTRN, getFTADeadlines, generateComplianceReport } from '@/utils/ftaApi';
import { assessQFZPEligibility, generateFreeZoneComplianceReport, type QFZPEligibilityData } from '@/utils/freeZoneCompliance';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp,
  Building2,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';

export default function UAEComplianceDashboard() {
  const [trnStatus, setTrnStatus] = useState<any>(null);
  const [ftaDeadlines, setFtaDeadlines] = useState<any[]>([]);
  const [qfzpAssessment, setQfzpAssessment] = useState<any>(null);
  const [complianceScore, setComplianceScore] = useState<number>(0);
  
  const { company } = useAuth();
  const { language } = useLanguage();

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  const { data: taxFilings = [] } = useQuery({
    queryKey: ['/api/tax-filings', { companyId: company?.id }],
    enabled: !!company?.id,
  });

  useEffect(() => {
    if (company?.trn) {
      // Validate TRN status
      validateTRN(company.trn).then(setTrnStatus);
      
      // Get FTA deadlines
      getFTADeadlines(company.trn).then(setFtaDeadlines);
      
      // Assess QFZP eligibility if free zone company
      if (company.freeZone) {
        const qfzpData: QFZPEligibilityData = {
          companyName: company.name,
          trn: company.trn,
          freeZoneLicense: 'DEMO-123456', // TODO: Add to company schema
          freeZoneAuthority: 'JAFZA', // TODO: Add to company schema
          qualifyingActivities: ['trading', 'distribution'],
          excludedActivities: [],
          qualifyingIncome: transactions
            .filter(t => t.type === 'REVENUE')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          excludedIncome: 0,
          connectedPersonTransactions: 0,
          naturalPersonOwnership: 100,
          financialYear: new Date().getFullYear().toString()
        };
        
        const assessment = assessQFZPEligibility(qfzpData);
        setQfzpAssessment(assessment);
      }
    }
  }, [company, transactions]);

  // Calculate overall compliance score
  useEffect(() => {
    let score = 0;
    
    if (trnStatus?.isValid) score += 25;
    if (company?.vatRegistered && company.vatRegistered) score += 25;
    if (taxFilings.length > 0) score += 25;
    if (qfzpAssessment?.isEligible || !company?.freeZone) score += 25;
    
    setComplianceScore(score);
  }, [trnStatus, company, taxFilings, qfzpAssessment]);

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 70) return 'text-warning-600';
    return 'text-error-600';
  };

  const upcomingDeadlines = ftaDeadlines.filter(deadline => 
    new Date(deadline.dueDate) > new Date()
  ).slice(0, 3);

  const overdueItems = ftaDeadlines.filter(deadline => 
    new Date(deadline.dueDate) < new Date() && deadline.status !== 'COMPLETED'
  );

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card className="border-primary-200">
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
            <Shield size={20} className="text-primary-500" />
            UAE Tax Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Compliance Score</span>
              <span className={cn("text-2xl font-bold", getComplianceColor(complianceScore))}>
                {complianceScore}%
              </span>
            </div>
            <Progress value={complianceScore} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="flex items-center gap-2">
                {trnStatus?.isValid ? (
                  <CheckCircle size={16} className="text-success-500" />
                ) : (
                  <AlertTriangle size={16} className="text-error-500" />
                )}
                <span className="text-sm">TRN Valid</span>
              </div>
              
              <div className="flex items-center gap-2">
                {company?.vatRegistered ? (
                  <CheckCircle size={16} className="text-success-500" />
                ) : (
                  <AlertTriangle size={16} className="text-warning-500" />
                )}
                <span className="text-sm">VAT Registered</span>
              </div>
              
              <div className="flex items-center gap-2">
                {taxFilings.length > 0 ? (
                  <CheckCircle size={16} className="text-success-500" />
                ) : (
                  <Clock size={16} className="text-warning-500" />
                )}
                <span className="text-sm">Tax Filings</span>
              </div>
              
              <div className="flex items-center gap-2">
                {qfzpAssessment?.isEligible || !company?.freeZone ? (
                  <CheckCircle size={16} className="text-success-500" />
                ) : (
                  <AlertTriangle size={16} className="text-warning-500" />
                )}
                <span className="text-sm">QFZP Status</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue Items */}
        {overdueItems.length > 0 && (
          <Card className="border-error-200 bg-error-50">
            <CardHeader>
              <CardTitle className="text-error-900 flex items-center gap-2">
                <AlertTriangle size={18} />
                Overdue Items ({overdueItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-error-800">{item.description}</span>
                    <Badge variant="destructive">{item.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        <Card className="border-warning-200 bg-warning-50">
          <CardHeader>
            <CardTitle className="text-warning-900 flex items-center gap-2">
              <Calendar size={18} />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-warning-800">{deadline.description}</span>
                  <span className="text-warning-700">{new Date(deadline.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Compliance Tabs */}
      <Tabs defaultValue="trn" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trn">TRN Status</TabsTrigger>
          <TabsTrigger value="vat">VAT Compliance</TabsTrigger>
          <TabsTrigger value="cit">CIT Obligations</TabsTrigger>
          <TabsTrigger value="qfzp" disabled={!company?.freeZone}>QFZP Status</TabsTrigger>
        </TabsList>

        <TabsContent value="trn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Registration Number (TRN) Verification</CardTitle>
            </CardHeader>
            <CardContent>
              {trnStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={trnStatus.isValid ? "default" : "destructive"}>
                      {trnStatus.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      TRN: {company?.trn}
                    </span>
                  </div>
                  
                  {trnStatus.isValid && (
                    <div className="space-y-2 text-sm">
                      <div><strong>Company:</strong> {trnStatus.companyName}</div>
                      <div><strong>Status:</strong> {trnStatus.status}</div>
                      <div><strong>Registration Date:</strong> {trnStatus.registrationDate}</div>
                      <div><strong>VAT Registered:</strong> {trnStatus.vatRegistered ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                  
                  {!trnStatus.isValid && (
                    <div className="text-sm text-error-600">
                      Error: {trnStatus.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Loading TRN verification...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VAT Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Registration Status</div>
                    <Badge variant={company?.vatRegistered ? "default" : "secondary"}>
                      {company?.vatRegistered ? 'Registered' : 'Not Registered'}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last Filing</div>
                    <span className="text-sm">
                      {taxFilings.filter(f => f.type === 'VAT').length > 0 ? 'Recent' : 'No filings'}
                    </span>
                  </div>
                </div>
                
                {!company?.vatRegistered && (
                  <div className="p-3 bg-info-50 border border-info-200 rounded-lg">
                    <p className="text-sm text-info-800">
                      VAT registration is mandatory for businesses with taxable supplies exceeding AED 375,000 annually.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Income Tax Obligations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        transactions
                          .filter(t => t.type === 'REVENUE')
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
                        'AED',
                        language === 'ar' ? 'ar-AE' : 'en-AE'
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Annual Revenue</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">0%</div>
                    <div className="text-sm text-gray-600">Current CIT Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">Sep 30</div>
                    <div className="text-sm text-gray-600">Filing Deadline</div>
                  </div>
                </div>
                
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                  <p className="text-sm text-success-800">
                    Your business qualifies for Small Business Relief (0% CIT rate on first AED 375,000).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qfzp" className="space-y-4">
          {company?.freeZone && qfzpAssessment && (
            <Card>
              <CardHeader>
                <CardTitle>Qualified Free Zone Person (QFZP) Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">QFZP Eligibility</span>
                    <Badge variant={qfzpAssessment.isEligible ? "default" : "destructive"}>
                      {qfzpAssessment.isEligible ? 'Eligible' : 'Not Eligible'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Eligibility Score</span>
                      <span className="font-medium">{qfzpAssessment.eligibilityScore.toFixed(1)}%</span>
                    </div>
                    <Progress value={qfzpAssessment.eligibilityScore} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Qualifying Income Test:</strong>
                      <div className={cn("ml-2", qfzpAssessment.assessmentDetails.incomeTest.passed ? "text-success-600" : "text-error-600")}>
                        {formatCurrency(qfzpAssessment.assessmentDetails.incomeTest.qualifyingIncome, 'AED')} / {formatCurrency(qfzpAssessment.assessmentDetails.incomeTest.threshold, 'AED')}
                      </div>
                    </div>
                    
                    <div>
                      <strong>CIT Liability:</strong>
                      <div className="ml-2 text-gray-900">
                        {formatCurrency(qfzpAssessment.citLiability.totalCIT, 'AED')} 
                        <span className="text-gray-600"> ({qfzpAssessment.citLiability.effectiveRate.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                  
                  {qfzpAssessment.recommendations.length > 0 && (
                    <div>
                      <strong className="text-sm">Recommendations:</strong>
                      <ul className="mt-1 text-sm text-gray-600 space-y-1">
                        {qfzpAssessment.recommendations.slice(0, 3).map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}