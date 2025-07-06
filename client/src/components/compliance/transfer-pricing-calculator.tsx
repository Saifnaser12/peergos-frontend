import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Building2,
  Users,
  TrendingUp,
  Shield,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RelatedPartyTransaction {
  id: string;
  counterparty: string;
  relationship: string;
  transactionType: 'goods' | 'services' | 'financing' | 'ip' | 'other';
  amount: number;
  currency: string;
  description: string;
  armLengthBenchmark: number;
  complianceStatus: 'compliant' | 'review' | 'non-compliant';
}

interface TransferPricingAssessment {
  totalRelatedPartyTransactions: number;
  disclosureRequired: boolean;
  masterFileRequired: boolean;
  localFileRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: string[];
}

export default function TransferPricingCalculator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('assessment');
  const [companyRevenue, setCompanyRevenue] = useState<number>(0);
  const [groupRevenue, setGroupRevenue] = useState<number>(0);
  const [transactions, setTransactions] = useState<RelatedPartyTransaction[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    counterparty: '',
    relationship: '',
    transactionType: 'goods' as const,
    amount: 0,
    currency: 'AED',
    description: '',
    armLengthBenchmark: 0
  });

  // UAE Transfer Pricing Thresholds (2025)
  const THRESHOLDS = {
    DISCLOSURE_TOTAL: 40000000, // AED 40M total related party transactions
    DISCLOSURE_CATEGORY: 4000000, // AED 4M per category
    CONNECTED_PERSONS: 500000, // AED 500K connected persons
    MASTER_FILE_REVENUE: 200000000, // AED 200M UAE entity revenue
    MASTER_FILE_GROUP: 3150000000, // AED 3.15B group revenue
    LOCAL_FILE_REVENUE: 200000000, // AED 200M UAE entity revenue
    LOCAL_FILE_GROUP: 3150000000 // AED 3.15B group revenue
  };

  const calculateAssessment = (): TransferPricingAssessment => {
    const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Category totals
    const categoryTotals = transactions.reduce((acc, t) => {
      acc[t.transactionType] = (acc[t.transactionType] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const disclosureRequired = 
      totalTransactions > THRESHOLDS.DISCLOSURE_TOTAL ||
      Object.values(categoryTotals).some(amount => amount > THRESHOLDS.DISCLOSURE_CATEGORY);

    const masterFileRequired = 
      companyRevenue > THRESHOLDS.MASTER_FILE_REVENUE ||
      groupRevenue > THRESHOLDS.MASTER_FILE_GROUP;

    const localFileRequired = 
      companyRevenue > THRESHOLDS.LOCAL_FILE_REVENUE ||
      groupRevenue > THRESHOLDS.LOCAL_FILE_GROUP;

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const nonCompliantTransactions = transactions.filter(t => t.complianceStatus === 'non-compliant');
    const reviewTransactions = transactions.filter(t => t.complianceStatus === 'review');
    
    if (nonCompliantTransactions.length > 0) {
      riskLevel = 'high';
    } else if (reviewTransactions.length > transactions.length * 0.3) {
      riskLevel = 'medium';
    }

    // Recommended actions
    const recommendedActions: string[] = [];
    if (disclosureRequired) {
      recommendedActions.push('Prepare related party transaction disclosure');
    }
    if (masterFileRequired) {
      recommendedActions.push('Prepare Master File documentation');
    }
    if (localFileRequired) {
      recommendedActions.push('Prepare Local File documentation');
    }
    if (nonCompliantTransactions.length > 0) {
      recommendedActions.push('Review non-compliant transactions for arm\'s length compliance');
    }
    if (totalTransactions > THRESHOLDS.DISCLOSURE_TOTAL * 0.8) {
      recommendedActions.push('Consider Advance Pricing Agreement (APA) application');
    }

    return {
      totalRelatedPartyTransactions: totalTransactions,
      disclosureRequired,
      masterFileRequired,
      localFileRequired,
      riskLevel,
      recommendedActions
    };
  };

  const addTransaction = () => {
    if (!newTransaction.counterparty || !newTransaction.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: counterparty and amount.",
        variant: "destructive"
      });
      return;
    }

    // Basic arm's length compliance check
    const deviation = Math.abs(newTransaction.amount - newTransaction.armLengthBenchmark) / newTransaction.armLengthBenchmark;
    let complianceStatus: 'compliant' | 'review' | 'non-compliant' = 'compliant';
    
    if (deviation > 0.15) {
      complianceStatus = 'non-compliant';
    } else if (deviation > 0.05) {
      complianceStatus = 'review';
    }

    const transaction: RelatedPartyTransaction = {
      id: Date.now().toString(),
      ...newTransaction,
      complianceStatus
    };

    setTransactions(prev => [...prev, transaction]);
    setNewTransaction({
      counterparty: '',
      relationship: '',
      transactionType: 'goods',
      amount: 0,
      currency: 'AED',
      description: '',
      armLengthBenchmark: 0
    });

    toast({
      title: "Transaction Added",
      description: `Added ${newTransaction.transactionType} transaction with ${complianceStatus} status.`,
    });
  };

  const generateDocumentation = (type: 'master' | 'local' | 'disclosure') => {
    toast({
      title: "Documentation Generated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} file documentation prepared for FTA submission.`,
    });
  };

  const assessment = calculateAssessment();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            UAE Transfer Pricing Calculator
          </CardTitle>
          <p className="text-sm text-gray-600">
            OECD-aligned transfer pricing compliance for related party transactions
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="apa">APA</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyRevenue">UAE Entity Revenue (AED)</Label>
                  <Input
                    id="companyRevenue"
                    type="number"
                    value={companyRevenue}
                    onChange={(e) => setCompanyRevenue(Number(e.target.value))}
                    placeholder="Enter annual revenue"
                  />
                </div>
                <div>
                  <Label htmlFor="groupRevenue">Group Global Revenue (AED)</Label>
                  <Input
                    id="groupRevenue"
                    type="number"
                    value={groupRevenue}
                    onChange={(e) => setGroupRevenue(Number(e.target.value))}
                    placeholder="Enter group revenue"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Transfer Pricing Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    AED {assessment.totalRelatedPartyTransactions.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Total RP Transactions</p>
                </div>
                
                <div className="text-center">
                  <Badge 
                    variant={assessment.riskLevel === 'high' ? 'destructive' : 
                            assessment.riskLevel === 'medium' ? 'secondary' : 'default'}
                    className="text-sm"
                  >
                    {assessment.riskLevel.toUpperCase()} RISK
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Compliance Risk</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {assessment.disclosureRequired ? 
                      <AlertTriangle className="h-4 w-4 text-orange-500" /> :
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    }
                    <span className="text-sm font-medium">
                      {assessment.disclosureRequired ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Disclosure</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {assessment.masterFileRequired ? 
                      <AlertTriangle className="h-4 w-4 text-orange-500" /> :
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    }
                    <span className="text-sm font-medium">
                      {assessment.masterFileRequired ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Master/Local File</p>
                </div>
              </div>

              {assessment.recommendedActions.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recommended Actions:</strong>
                    <ul className="mt-2 space-y-1">
                      {assessment.recommendedActions.map((action, index) => (
                        <li key={index} className="text-sm">• {action}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Thresholds Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UAE Transfer Pricing Thresholds (2025)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Disclosure Requirements:</h4>
                  <ul className="space-y-1">
                    <li>• Total RP transactions: AED 40M</li>
                    <li>• Per category (goods/services): AED 4M</li>
                    <li>• Connected persons: AED 500K</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Documentation Requirements:</h4>
                  <ul className="space-y-1">
                    <li>• Master File: Revenue &gt; AED 200M or Group &gt; AED 3.15B</li>
                    <li>• Local File: Same thresholds as Master File</li>
                    <li>• Submit within 30 days of FTA request</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Add Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Related Party Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="counterparty">Counterparty</Label>
                  <Input
                    id="counterparty"
                    value={newTransaction.counterparty}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, counterparty: e.target.value }))}
                    placeholder="Related party name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select
                    value={newTransaction.relationship}
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, relationship: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subsidiary">Subsidiary</SelectItem>
                      <SelectItem value="parent">Parent Company</SelectItem>
                      <SelectItem value="associate">Associate</SelectItem>
                      <SelectItem value="joint-venture">Joint Venture</SelectItem>
                      <SelectItem value="connected-person">Connected Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select
                    value={newTransaction.transactionType}
                    onValueChange={(value: any) => setNewTransaction(prev => ({ ...prev, transactionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goods">Goods</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="financing">Financing</SelectItem>
                      <SelectItem value="ip">Intellectual Property</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Transaction Amount (AED)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <Label htmlFor="benchmark">Arm's Length Benchmark (AED)</Label>
                  <Input
                    id="benchmark"
                    type="number"
                    value={newTransaction.armLengthBenchmark}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, armLengthBenchmark: Number(e.target.value) }))}
                    placeholder="Comparable price"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Transaction description"
                  />
                </div>
              </div>
              
              <Button onClick={addTransaction} className="mt-4">
                Add Transaction
              </Button>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Related Party Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{transaction.counterparty}</span>
                          <Badge 
                            variant={transaction.complianceStatus === 'compliant' ? 'default' :
                                   transaction.complianceStatus === 'review' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {transaction.complianceStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {transaction.transactionType} • {transaction.relationship} • AED {transaction.amount.toLocaleString()}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-gray-500 mt-1">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No transactions added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transfer Pricing Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4"
                  onClick={() => generateDocumentation('disclosure')}
                  disabled={!assessment.disclosureRequired}
                >
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2" />
                    <h3 className="font-medium">Disclosure Form</h3>
                    <p className="text-xs text-gray-600">Related party transactions</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4"
                  onClick={() => generateDocumentation('master')}
                  disabled={!assessment.masterFileRequired}
                >
                  <div className="text-center">
                    <Building2 className="h-6 w-6 mx-auto mb-2" />
                    <h3 className="font-medium">Master File</h3>
                    <p className="text-xs text-gray-600">Group organizational structure</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4"
                  onClick={() => generateDocumentation('local')}
                  disabled={!assessment.localFileRequired}
                >
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <h3 className="font-medium">Local File</h3>
                    <p className="text-xs text-gray-600">UAE entity specific information</p>
                  </div>
                </Button>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Documentation must be submitted within 30 days of FTA request. Ensure all related party transactions are properly documented with arm's length benchmarking evidence.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apa" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advance Pricing Agreements (APA)</CardTitle>
              <p className="text-sm text-gray-600">
                Pre-approve transfer pricing methods with FTA (Available Q4 2025)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>APA Benefits:</strong> Certainty over transfer pricing methods, reduced audit risk, and protection from penalties for covered transactions.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Unilateral APA</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Agreement between taxpayer and FTA</li>
                    <li>• Covers UAE tax implications only</li>
                    <li>• Available from Q4 2025</li>
                    <li>• Recommended for significant transactions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Bilateral APA</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Agreement with multiple tax authorities</li>
                    <li>• Eliminates double taxation risk</li>
                    <li>• Timeline to be announced</li>
                    <li>• Ideal for multinational groups</li>
                  </ul>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  toast({
                    title: "APA Application",
                    description: "APA application process will be available from Q4 2025. We'll notify you when applications open.",
                  });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download APA Application Template (Available Q4 2025)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}