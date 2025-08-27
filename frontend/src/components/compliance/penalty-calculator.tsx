import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/business-logic';
import { 
  Calculator, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  FileText,
  TrendingUp,
  Eye,
  Download,
  Plus
} from 'lucide-react';

interface Penalty {
  id: string;
  type: 'late_filing' | 'late_payment' | 'non_compliance' | 'incorrect_return';
  description: string;
  amount: number;
  baseAmount?: number;
  dailyRate?: number;
  daysOverdue: number;
  deadline: Date;
  status: 'calculated' | 'assessed' | 'paid' | 'disputed';
  taxType: 'vat' | 'cit' | 'excise' | 'regulatory';
  reference?: string;
  paymentDue?: Date;
}

interface PenaltyCalculatorProps {
  penalties: any[];
  complianceItems: any[];
}

export function PenaltyCalculator({ penalties, complianceItems }: PenaltyCalculatorProps) {
  const [calculatorMode, setCalculatorMode] = useState<'overview' | 'calculate' | 'track'>('overview');
  const [newPenalty, setNewPenalty] = useState({
    type: 'late_filing',
    baseAmount: '',
    daysOverdue: '',
    taxType: 'vat',
    description: ''
  });

  // Generate penalty data based on compliance items
  const generatePenalties = (): Penalty[] => {
    const currentPenalties: Penalty[] = [
      {
        id: 'penalty-1',
        type: 'late_filing',
        description: 'Late VAT return submission for Q4 2024',
        amount: 5000,
        baseAmount: 5000,
        daysOverdue: 15,
        deadline: new Date('2025-01-28'),
        status: 'assessed',
        taxType: 'vat',
        reference: 'VAT-2024-Q4-001',
        paymentDue: new Date('2025-03-15')
      },
      {
        id: 'penalty-2',
        type: 'late_payment',
        description: 'Late VAT payment for February 2025',
        amount: 2750,
        baseAmount: 25000,
        dailyRate: 0.05,
        daysOverdue: 22,
        deadline: new Date('2025-02-20'),
        status: 'calculated',
        taxType: 'vat',
        reference: 'VAT-2025-FEB-002'
      },
      {
        id: 'penalty-3',
        type: 'non_compliance',
        description: 'Trade license renewal penalty',
        amount: 5000,
        baseAmount: 5000,
        daysOverdue: 30,
        deadline: new Date('2025-01-15'),
        status: 'assessed',
        taxType: 'regulatory',
        reference: 'REG-2025-001',
        paymentDue: new Date('2025-03-30')
      }
    ];

    return currentPenalties;
  };

  const allPenalties = generatePenalties();

  // UAE FTA penalty calculation rules
  const calculatePenalty = (type: string, baseAmount: number, daysOverdue: number, taxType: string) => {
    let penalty = 0;
    
    switch (type) {
      case 'late_filing':
        // VAT late filing: AED 5,000 fixed penalty
        if (taxType === 'vat') {
          penalty = 5000;
        }
        // CIT late filing: 5% of tax due or AED 20,000, whichever is higher
        else if (taxType === 'cit') {
          penalty = Math.max(baseAmount * 0.05, 20000);
        }
        break;
        
      case 'late_payment':
        // Late payment: 5% annual interest (calculated daily)
        const dailyRate = 0.05 / 365;
        penalty = baseAmount * dailyRate * daysOverdue;
        break;
        
      case 'incorrect_return':
        // Incorrect return: 50% of additional tax or AED 50,000, whichever is higher
        penalty = Math.max(baseAmount * 0.5, 50000);
        break;
        
      case 'non_compliance':
        // Non-compliance penalties vary by regulation
        penalty = baseAmount; // Use provided base amount
        break;
        
      default:
        penalty = baseAmount;
    }
    
    return Math.round(penalty);
  };

  const totalPenalties = allPenalties.reduce((sum, penalty) => sum + penalty.amount, 0);
  const unpaidPenalties = allPenalties.filter(p => p.status !== 'paid').reduce((sum, penalty) => sum + penalty.amount, 0);

  const getPenaltyTypeLabel = (type: string) => {
    switch (type) {
      case 'late_filing':
        return 'Late Filing';
      case 'late_payment':
        return 'Late Payment';
      case 'non_compliance':
        return 'Non-Compliance';
      case 'incorrect_return':
        return 'Incorrect Return';
      default:
        return 'Other';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calculated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assessed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCalculate = () => {
    const penalty = calculatePenalty(
      newPenalty.type,
      parseFloat(newPenalty.baseAmount) || 0,
      parseInt(newPenalty.daysOverdue) || 0,
      newPenalty.taxType
    );
    
    alert(`Calculated penalty: ${formatCurrency(penalty, 'AED')}`);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Penalty Calculator & Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'calculate', label: 'Calculate' },
              { key: 'track', label: 'Track Penalties' }
            ].map(mode => (
              <Button
                key={mode.key}
                variant={calculatorMode === mode.key ? "default" : "outline"}
                size="sm"
                onClick={() => setCalculatorMode(mode.key as any)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {calculatorMode === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalPenalties, 'AED')}
                </p>
                <p className="text-sm text-gray-600">Total Penalties</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(unpaidPenalties, 'AED')}
                </p>
                <p className="text-sm text-gray-600">Outstanding</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{allPenalties.length}</p>
                <p className="text-sm text-gray-600">Total Cases</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Penalties */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Penalties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allPenalties.slice(0, 3).map((penalty) => (
                  <div key={penalty.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{penalty.description}</h4>
                      <p className="text-sm text-gray-500">
                        {getPenaltyTypeLabel(penalty.type)} • {penalty.daysOverdue} days overdue
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(penalty.amount, 'AED')}
                      </p>
                      <Badge variant="outline" className={getStatusColor(penalty.status)}>
                        {penalty.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {calculatorMode === 'calculate' && (
        <Card>
          <CardHeader>
            <CardTitle>Calculate Penalty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="penalty-type">Penalty Type</Label>
                <select
                  id="penalty-type"
                  className="w-full mt-1 rounded border border-gray-300 px-3 py-2"
                  value={newPenalty.type}
                  onChange={(e) => setNewPenalty(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="late_filing">Late Filing</option>
                  <option value="late_payment">Late Payment</option>
                  <option value="non_compliance">Non-Compliance</option>
                  <option value="incorrect_return">Incorrect Return</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="tax-type">Tax Type</Label>
                <select
                  id="tax-type"
                  className="w-full mt-1 rounded border border-gray-300 px-3 py-2"
                  value={newPenalty.taxType}
                  onChange={(e) => setNewPenalty(prev => ({ ...prev, taxType: e.target.value }))}
                >
                  <option value="vat">VAT</option>
                  <option value="cit">Corporate Income Tax</option>
                  <option value="excise">Excise Tax</option>
                  <option value="regulatory">Regulatory</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base-amount">Base Amount (AED)</Label>
                <Input
                  id="base-amount"
                  type="number"
                  placeholder="Enter base amount"
                  value={newPenalty.baseAmount}
                  onChange={(e) => setNewPenalty(prev => ({ ...prev, baseAmount: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="days-overdue">Days Overdue</Label>
                <Input
                  id="days-overdue"
                  type="number"
                  placeholder="Enter days overdue"
                  value={newPenalty.daysOverdue}
                  onChange={(e) => setNewPenalty(prev => ({ ...prev, daysOverdue: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter penalty description"
                value={newPenalty.description}
                onChange={(e) => setNewPenalty(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleCalculate} className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculate Penalty
              </Button>
              <Button variant="outline">Save Calculation</Button>
            </div>
            
            {/* Penalty Calculation Rules Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">UAE FTA Penalty Rules</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• VAT Late Filing: AED 5,000 fixed penalty</li>
                <li>• CIT Late Filing: 5% of tax due or AED 20,000 (whichever is higher)</li>
                <li>• Late Payment: 5% annual interest (calculated daily)</li>
                <li>• Incorrect Return: 50% of additional tax or AED 50,000 (whichever is higher)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {calculatorMode === 'track' && (
        <div className="space-y-4">
          {allPenalties.map((penalty) => (
            <Card key={penalty.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{penalty.description}</h3>
                      <Badge variant="outline" className={getStatusColor(penalty.status)}>
                        {penalty.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Type:</span> {getPenaltyTypeLabel(penalty.type)}
                      </div>
                      <div>
                        <span className="font-medium">Tax Type:</span> {penalty.taxType.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Days Overdue:</span> {penalty.daysOverdue}
                      </div>
                      <div>
                        <span className="font-medium">Reference:</span> {penalty.reference || 'N/A'}
                      </div>
                    </div>
                    
                    {penalty.paymentDue && (
                      <div className="text-sm text-orange-600 mb-3">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Payment due: {penalty.paymentDue.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600 mb-2">
                      {formatCurrency(penalty.amount, 'AED')}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      {penalty.status !== 'paid' && (
                        <Button size="sm">Pay Now</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}