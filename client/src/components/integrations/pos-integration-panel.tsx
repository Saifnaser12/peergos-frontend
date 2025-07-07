import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store, 
  Wifi, 
  RefreshCw, 
  Calendar, 
  ShoppingCart,
  CreditCard,
  DollarSign,
  Info,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  POS_VENDORS, 
  POSTransaction, 
  POSConfig, 
  generateMockPOSTransactions, 
  mockPOSSync,
  formatPaymentMethod,
  getPaymentMethodColor 
} from '@/lib/pos-integration';
import { formatCurrency } from '@/lib/business-logic';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface POSIntegrationPanelProps {
  className?: string;
}

export default function POSIntegrationPanel({ className = '' }: POSIntegrationPanelProps) {
  const [config, setConfig] = useState<POSConfig>({
    enabled: false,
    vendor: POS_VENDORS[0],
    autoSyncInterval: 60,
  });
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { toast } = useToast();

  // Load initial mock data
  useEffect(() => {
    if (config.enabled) {
      setTransactions(generateMockPOSTransactions(5));
      setLastSync(new Date().toISOString());
    }
  }, [config.enabled]);

  const handleTogglePOS = (enabled: boolean) => {
    setConfig(prev => ({ ...prev, enabled }));
    
    if (!enabled) {
      setTransactions([]);
      setLastSync(null);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = POS_VENDORS.find(v => v.id === vendorId);
    if (vendor) {
      setConfig(prev => ({ ...prev, vendor }));
    }
  };

  const handleSync = async () => {
    if (!config.enabled) return;
    
    setIsLoading(true);
    try {
      const result = await mockPOSSync(config.vendor.id);
      
      if (result.success) {
        setTransactions(result.transactions);
        setLastSync(new Date().toISOString());
        setConfig(prev => ({ ...prev, lastSyncDate: new Date().toISOString() }));
        
        toast({
          title: 'POS Sync Successful',
          description: `Imported ${result.transactions.length} transactions from ${config.vendor.name}`,
        });
      } else {
        toast({
          title: 'POS Sync Failed',
          description: result.error || 'Failed to sync with POS system',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: 'An error occurred while syncing with POS system',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalRevenue = () => {
    return transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const getTodayTransactions = () => {
    const today = new Date().toDateString();
    return transactions.filter(t => new Date(t.date).toDateString() === today);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-600" />
          POS Integration
          <Badge variant="outline" className="text-xs">
            Beta
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Automatically sync sales data from your Point of Sale system
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Enable POS Auto-Sync</label>
            <p className="text-xs text-gray-500">Automatically import sales transactions</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleTogglePOS}
          />
        </div>

        {config.enabled && (
          <>
            {/* Vendor Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">POS Vendor</label>
              <Select value={config.vendor.id} onValueChange={handleVendorChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POS_VENDORS.map(vendor => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <div className="flex items-center gap-2">
                        <span>{vendor.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            vendor.integrationStatus === 'AVAILABLE' && "border-green-500 text-green-700",
                            vendor.integrationStatus === 'BETA' && "border-yellow-500 text-yellow-700",
                            vendor.integrationStatus === 'COMING_SOON' && "border-gray-500 text-gray-700"
                          )}
                        >
                          {vendor.integrationStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-gray-500">
                {config.vendor.description}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {config.vendor.features.map(feature => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sync Status */}
            <div className="border rounded-lg p-4 bg-blue-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Sync Status</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isLoading || config.vendor.integrationStatus !== 'AVAILABLE'}
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
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium flex items-center gap-1">
                    {config.vendor.integrationStatus === 'AVAILABLE' ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        {config.vendor.integrationStatus.replace('_', ' ')}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Summary */}
            {transactions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(getTotalRevenue())}
                  </p>
                  <p className="text-sm text-green-600">Total Revenue</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <ShoppingCart className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">
                    {transactions.length}
                  </p>
                  <p className="text-sm text-blue-600">Total Transactions</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border">
                  <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-700">
                    {getTodayTransactions().length}
                  </p>
                  <p className="text-sm text-purple-600">Today's Sales</p>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {transactions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Recent Sales Entries
                </h4>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Item</th>
                          <th className="text-right p-3 font-medium">Net Amount</th>
                          <th className="text-right p-3 font-medium">VAT</th>
                          <th className="text-center p-3 font-medium">Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              {new Date(transaction.date).toLocaleDateString()}
                              <br />
                              <span className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleTimeString()}
                              </span>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{transaction.itemName}</p>
                                <p className="text-xs text-gray-500">
                                  Qty: {transaction.quantity} × {formatCurrency(transaction.unitPrice)}
                                </p>
                              </div>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {formatCurrency(transaction.netAmount)}
                            </td>
                            <td className="p-3 text-right font-medium text-blue-600">
                              {formatCurrency(transaction.vatAmount)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge className={getPaymentMethodColor(transaction.paymentMethod)}>
                                {formatPaymentMethod(transaction.paymentMethod)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {transactions.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 5 of {transactions.length} recent transactions
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions found</p>
                <p className="text-sm">Sync with your POS to import sales data</p>
              </div>
            )}
          </>
        )}

        {/* Integration Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Future Integration:</strong> This feature will connect with encrypted POS APIs 
            and FTA-approved connectors for real-time sales data synchronization. 
            Currently in sandbox mode with mock data.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}