import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Banknote, 
  Link, 
  RefreshCw, 
  Search,
  AlertTriangle,
  CheckCircle,
  Eye,
  ArrowUpDown,
  Info,
  Shield,
  Loader2
} from 'lucide-react';
import { 
  UAE_BANKS,
  BankTransaction, 
  ExpenseRecord,
  generateMockBankTransactions,
  generateMockExpenseRecords,
  mockBankSync,
  getMatchStatusColor,
  getMatchStatusIcon,
  findPotentialMatches
} from '@/lib/bank-integration';
import { formatCurrency } from '@/lib/business-logic';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BankFeedPanelProps {
  className?: string;
}

export default function BankFeedPanel({ className = '' }: BankFeedPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const { toast } = useToast();

  // Load mock expense records
  useEffect(() => {
    setExpenseRecords(generateMockExpenseRecords());
  }, []);

  const handleConnectBank = async () => {
    if (!selectedBank) {
      toast({
        title: 'Select Bank',
        description: 'Please select a bank to connect',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const result = await mockBankSync(selectedBank);
      
      if (result.success) {
        setIsConnected(true);
        setBankTransactions(result.transactions);
        setLastSync(new Date().toISOString());
        
        toast({
          title: 'Bank Connected',
          description: `Successfully connected to ${UAE_BANKS.find(b => b.id === selectedBank)?.name}`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to bank',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'An error occurred while connecting to the bank',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!isConnected || !selectedBank) return;
    
    setIsLoading(true);
    try {
      const result = await mockBankSync(selectedBank);
      
      if (result.success) {
        setBankTransactions(result.transactions);
        setLastSync(new Date().toISOString());
        
        toast({
          title: 'Sync Successful',
          description: `Imported ${result.transactions.length} transactions`,
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync bank data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: 'An error occurred while syncing bank data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualMatch = (bankTransaction: BankTransaction, expenseRecord: ExpenseRecord) => {
    setBankTransactions(prev => prev.map(t => 
      t.id === bankTransaction.id 
        ? { ...t, linkedExpenseId: expenseRecord.id, matchStatus: 'MATCHED', confidence: 1.0 }
        : t
    ));
    
    toast({
      title: 'Match Created',
      description: `Transaction matched with ${expenseRecord.description}`,
    });
  };

  const getMatchSummary = () => {
    const matched = bankTransactions.filter(t => t.matchStatus === 'MATCHED').length;
    const total = bankTransactions.length;
    return { matched, total, percentage: total > 0 ? Math.round((matched / total) * 100) : 0 };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-green-600" />
          Bank Feed Integration
          <Badge variant="outline" className="text-xs">
            Open Banking
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Connect your bank account for automatic transaction import and reconciliation
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isConnected ? (
          <>
            {/* Bank Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Your Bank</label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your bank..." />
                </SelectTrigger>
                <SelectContent>
                  {UAE_BANKS.map(bank => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex items-center gap-2">
                        <span>{bank.logo}</span>
                        <span>{bank.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            bank.openBankingStatus === 'AVAILABLE' && "border-green-500 text-green-700",
                            bank.openBankingStatus === 'BETA' && "border-yellow-500 text-yellow-700",
                            bank.openBankingStatus === 'COMING_SOON' && "border-gray-500 text-gray-700"
                          )}
                        >
                          {bank.openBankingStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Connect Button */}
            <Button 
              onClick={handleConnectBank}
              disabled={!selectedBank || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Connect Bank Feed
                </>
              )}
            </Button>

            {/* Security Notice */}
            <Alert className="border-green-200 bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                <strong>Secure Connection:</strong> Bank integration uses encrypted Open Banking APIs 
                with read-only access. Your login credentials are never stored.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            {/* Connection Status */}
            <div className="border rounded-lg p-4 bg-green-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Connected to {UAE_BANKS.find(b => b.id === selectedBank)?.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Last Sync:</span>
                  <p className="font-medium">
                    {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Transactions:</span>
                  <p className="font-medium">{bankTransactions.length} imported</p>
                </div>
              </div>
            </div>

            {/* Match Summary */}
            {bankTransactions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <ArrowUpDown className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">
                    {bankTransactions.length}
                  </p>
                  <p className="text-sm text-blue-600">Total Transactions</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">
                    {getMatchSummary().matched}
                  </p>
                  <p className="text-sm text-green-600">Matched</p>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                  <Search className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-yellow-700">
                    {getMatchSummary().percentage}%
                  </p>
                  <p className="text-sm text-yellow-600">Match Rate</p>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {bankTransactions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Imported Transactions
                </h4>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Description</th>
                          <th className="text-right p-3 font-medium">Amount</th>
                          <th className="text-center p-3 font-medium">Match Status</th>
                          <th className="text-center p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankTransactions.slice(0, 10).map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-xs text-gray-500">{transaction.reference}</p>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className={cn(
                                "font-medium",
                                transaction.debitAmount ? "text-red-600" : "text-green-600"
                              )}>
                                {transaction.debitAmount 
                                  ? `-${formatCurrency(transaction.debitAmount)}`
                                  : `+${formatCurrency(transaction.creditAmount)}`
                                }
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge className={getMatchStatusColor(transaction.matchStatus)}>
                                {getMatchStatusIcon(transaction.matchStatus)} {transaction.matchStatus.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedTransaction(transaction)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {transaction.matchStatus === 'UNMATCHED' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const matches = findPotentialMatches(transaction, expenseRecords);
                                      if (matches.length > 0) {
                                        handleManualMatch(transaction, matches[0]);
                                      }
                                    }}
                                  >
                                    <Link className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {bankTransactions.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 10 of {bankTransactions.length} transactions
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions found</p>
                <p className="text-sm">Sync with your bank to import transaction data</p>
              </div>
            )}
          </>
        )}

        {/* Integration Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Future Integration:</strong> This feature will connect with UAE Central Bank 
            approved Open Banking APIs for secure, real-time transaction import and automatic 
            expense matching. Currently in sandbox mode with mock data.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}