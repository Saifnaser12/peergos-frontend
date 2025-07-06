import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRightLeft, 
  Upload, 
  FileText, 
  AlertCircle, 
  Building2,
  TrendingUp,
  Shield,
  Flag,
  CheckCircle,
  Info,
  Calculator,
  DollarSign,
  Users,
  Download,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/i18n';
import { apiRequest } from '@/lib/queryClient';

interface RelatedPartyTransaction {
  id: number;
  relatedPartyName: string;
  relationship: string;
  transactionType: 'goods' | 'services' | 'financing' | 'ip' | 'other';
  amount: number;
  armLengthPrice: number;
  methodology: string;
  documentation: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface TransferPricingMethod {
  name: string;
  description: string;
  applicability: string;
  advantages: string[];
  requirements: string[];
}

export default function TransferPricing() {
  const { user, company } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    relatedPartyName: '',
    relationship: '',
    transactionType: 'services' as const,
    amount: 0,
    armLengthPrice: 0,
    methodology: '',
    documentation: ''
  });

  // Mock data for demonstration (in real app, this would come from API)
  const relatedPartyTransactions: RelatedPartyTransaction[] = [
    {
      id: 1,
      relatedPartyName: 'Global Tech DMCC',
      relationship: 'Parent Company',
      transactionType: 'services',
      amount: 250000,
      armLengthPrice: 245000,
      methodology: 'Comparable Uncontrolled Price (CUP)',
      documentation: 'Management Service Agreement.pdf',
      riskLevel: 'low',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      relatedPartyName: 'Tech Solutions Ltd',
      relationship: 'Subsidiary',
      transactionType: 'ip',
      amount: 150000,
      armLengthPrice: 155000,
      methodology: 'Profit Split Method',
      documentation: 'IP License Agreement.pdf',
      riskLevel: 'medium',
      createdAt: '2024-02-20'
    }
  ];

  // FTA-approved transfer pricing methods
  const transferPricingMethods: TransferPricingMethod[] = [
    {
      name: 'Comparable Uncontrolled Price (CUP)',
      description: 'Compares the price charged in a controlled transaction with the price charged in a comparable uncontrolled transaction',
      applicability: 'Goods and services with comparable market transactions',
      advantages: ['Most direct method', 'Generally reliable', 'Easy to apply when comparables exist'],
      requirements: ['Comparable transactions', 'Similar circumstances', 'Minimal adjustments needed']
    },
    {
      name: 'Resale Price Method (RPM)',
      description: 'Based on the price at which a product purchased from a related enterprise is resold to an independent enterprise',
      applicability: 'Distribution and marketing operations',
      advantages: ['Suitable for distributors', 'Uses internal data', 'Good for routine operations'],
      requirements: ['Gross margin data', 'Functional analysis', 'Comparable gross margins']
    },
    {
      name: 'Cost Plus Method (CPM)',
      description: 'Uses the costs incurred by the supplier of property in a controlled transaction',
      applicability: 'Manufacturing and service providers',
      advantages: ['Good for cost centers', 'Uses internal data', 'Suitable for contract manufacturers'],
      requirements: ['Reliable cost data', 'Appropriate markup', 'Functional comparability']
    },
    {
      name: 'Transactional Net Margin Method (TNMM)',
      description: 'Examines the net profit margin relative to an appropriate base from controlled transactions',
      applicability: 'Complex transactions where traditional methods are difficult to apply',
      advantages: ['Less sensitive to differences', 'Uses net margins', 'Widely accepted'],
      requirements: ['Operating level indicators', 'Multi-year data', 'Economic analysis']
    },
    {
      name: 'Profit Split Method',
      description: 'Identifies the combined profit to be split from controlled transactions and divides it between related enterprises',
      applicability: 'Highly integrated operations with unique intangibles',
      advantages: ['Suitable for unique transactions', 'Considers both parties', 'Good for intangibles'],
      requirements: ['Combined profit calculation', 'Allocation keys', 'Detailed functional analysis']
    }
  ];

  const calculateComplianceScore = () => {
    const totalTransactions = relatedPartyTransactions.length;
    const documentedTransactions = relatedPartyTransactions.filter(t => t.documentation).length;
    const lowRiskTransactions = relatedPartyTransactions.filter(t => t.riskLevel === 'low').length;
    
    if (totalTransactions === 0) return 0;
    
    const documentationScore = (documentedTransactions / totalTransactions) * 50;
    const riskScore = (lowRiskTransactions / totalTransactions) * 50;
    
    return Math.round(documentationScore + riskScore);
  };

  const complianceScore = calculateComplianceScore();

  const addTransaction = () => {
    // In real app, this would call API
    console.log('Adding transaction:', newTransaction);
    setNewTransaction({
      relatedPartyName: '',
      relationship: '',
      transactionType: 'services',
      amount: 0,
      armLengthPrice: 0,
      methodology: '',
      documentation: ''
    });
    setShowAddTransaction(false);
    toast({
      title: 'Success',
      description: 'Related party transaction added successfully',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* UAE FTA Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-6 w-6 text-green-600" />
              <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
                UAE FTA
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">Transfer Pricing</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
          <div>
            <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">SME Transfer Pricing</h1>
              <Badge className="bg-green-100 text-green-800">
                <Shield size={14} className="mr-1" />
                FTA Compliant
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Manage related party transactions and arm's length pricing per UAE FTA requirements
            </p>
          </div>
        </div>

        {/* Compliance Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Compliance Score</p>
                  <p className="text-2xl font-bold text-blue-900">{complianceScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <Progress value={complianceScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Transactions</p>
                  <p className="text-2xl font-bold text-green-900">{relatedPartyTransactions.length}</p>
                </div>
                <ArrowRightLeft className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Value</p>
                  <p className="text-xl font-bold text-purple-900">
                    {formatCurrency(
                      relatedPartyTransactions.reduce((sum, t) => sum + t.amount, 0),
                      'AED',
                      'en-AE'
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Documentation</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {relatedPartyTransactions.filter(t => t.documentation).length}/
                    {relatedPartyTransactions.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="methods">Methods</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    FTA Transfer Pricing Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Small & Medium Businesses</h4>
                        <p className="text-sm text-gray-600">
                          Revenue &lt; AED 150M and employees &lt; 250 FTE
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Related Party Disclosure</h4>
                        <p className="text-sm text-gray-600">
                          Annual disclosure required in CIT return if total transactions exceed AED 1M
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Documentation Requirements</h4>
                        <p className="text-sm text-gray-600">
                          Maintain documentation demonstrating arm's length nature
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Audit Defense</h4>
                        <p className="text-sm text-gray-600">
                          Be ready to provide supporting documents upon FTA request
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-900">Low Risk Transactions</span>
                      <Badge className="bg-green-100 text-green-800">
                        {relatedPartyTransactions.filter(t => t.riskLevel === 'low').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-yellow-900">Medium Risk Transactions</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {relatedPartyTransactions.filter(t => t.riskLevel === 'medium').length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-900">High Risk Transactions</span>
                      <Badge className="bg-red-100 text-red-800">
                        {relatedPartyTransactions.filter(t => t.riskLevel === 'high').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>SME Simplification:</strong> For small and medium businesses, UAE FTA focuses on substance over form. 
                Maintain proper documentation and ensure transactions reflect commercial rationale and arm's length pricing.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Related Party Transactions</h3>
              <Button 
                onClick={() => setShowAddTransaction(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Transaction
              </Button>
            </div>

            {showAddTransaction && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>Add Related Party Transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="partyName">Related Party Name</Label>
                      <Input
                        id="partyName"
                        value={newTransaction.relatedPartyName}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, relatedPartyName: e.target.value }))}
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship</Label>
                      <Input
                        id="relationship"
                        value={newTransaction.relationship}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, relationship: e.target.value }))}
                        placeholder="e.g., Parent Company, Subsidiary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Transaction Amount (AED)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="armLength">Arm's Length Price (AED)</Label>
                      <Input
                        id="armLength"
                        type="number"
                        value={newTransaction.armLengthPrice}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, armLengthPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="methodology">Transfer Pricing Method</Label>
                    <Input
                      id="methodology"
                      value={newTransaction.methodology}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, methodology: e.target.value }))}
                      placeholder="e.g., Comparable Uncontrolled Price"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addTransaction} className="bg-green-600 hover:bg-green-700">
                      Add Transaction
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Related Party</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedPartyTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.relatedPartyName}</TableCell>
                        <TableCell>{transaction.relationship}</TableCell>
                        <TableCell className="capitalize">{transaction.transactionType}</TableCell>
                        <TableCell>{formatCurrency(transaction.amount, 'AED', 'en-AE')}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              transaction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              transaction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {transaction.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Methods Tab */}
          <TabsContent value="methods" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">FTA-Approved Transfer Pricing Methods</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {transferPricingMethods.map((method, index) => (
                  <Card key={index} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{method.description}</p>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2">Applicability:</h5>
                        <p className="text-sm text-gray-600">{method.applicability}</p>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2">Advantages:</h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {method.advantages.map((advantage, i) => (
                            <li key={i}>{advantage}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2">Requirements:</h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {method.requirements.map((requirement, i) => (
                            <li key={i}>{requirement}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Required Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Organizational Structure</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Business Strategy</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Controlled Transactions</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Financial & Tax Position</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Benchmarking Studies</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Upload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 mb-2">Upload Documents</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag and drop files or click to browse
                    </p>
                    <Button variant="outline">Choose Files</Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Management Service Agreement.pdf</span>
                      <Button variant="ghost" size="sm">
                        <Download size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">IP License Agreement.pdf</span>
                      <Button variant="ghost" size="sm">
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Documentation Retention:</strong> UAE FTA requires maintaining transfer pricing documentation 
                for at least 7 years. Ensure all documents are readily available for potential audit requests.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Peergos Solutions • FTA Transfer Pricing Compliance • SME Focused Solution</p>
        </div>
      </div>
    </div>
  );
}