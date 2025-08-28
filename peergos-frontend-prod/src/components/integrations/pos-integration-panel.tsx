import { useState } from 'react';
import { Store, Wifi, Download, RefreshCw, CheckCircle, AlertTriangle, Clock, ExternalLink, CreditCard, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface POSSystem {
  id: string;
  name: string;
  logo?: string;
  description: string;
  isConnected: boolean;
  lastSync?: string;
  transactionCount?: number;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  supportedFeatures: string[];
}

interface POSTransaction {
  id: string;
  posSystemId: string;
  transactionDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>;
  vatAmount: number;
  receiptNumber: string;
  customerId?: string;
  location?: string;
}

export default function POSIntegrationPanel() {
  const { toast } = useToast();
  const [selectedPOS, setSelectedPOS] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // Fetch POS systems
  const { data: posSystems = [], refetch: refetchSystems } = useQuery<POSSystem[]>({
    queryKey: ['/api/pos/systems'],
    staleTime: 60 * 1000,
  });

  // Fetch recent POS transactions
  const { data: posTransactions = [] } = useQuery<POSTransaction[]>({
    queryKey: ['/api/pos/transactions'],
    staleTime: 30 * 1000,
  });

  // Connect POS system
  const connectPOSMutation = useMutation({
    mutationFn: async (posSystemId: string) => {
      return await apiRequest('/api/pos/connect', {
        method: 'POST',
        body: { posSystemId }
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "POS Connection",
        description: data.success ? "POS system connected successfully" : "Failed to connect POS system",
        variant: data.success ? "default" : "destructive"
      });
      refetchSystems();
    }
  });

  // Sync POS transactions
  const syncTransactionsMutation = useMutation({
    mutationFn: async (posSystemId: string) => {
      setSyncProgress(0);
      const interval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 20, 90));
      }, 500);

      const result = await apiRequest('/api/pos/sync', {
        method: 'POST',
        body: { posSystemId }
      });

      clearInterval(interval);
      setSyncProgress(100);
      
      setTimeout(() => setSyncProgress(0), 2000);
      return result;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Transaction Sync",
        description: `Successfully synced ${data.transactionCount || 0} transactions`,
        variant: "default"
      });
      refetchSystems();
    },
    onError: () => {
      setSyncProgress(0);
      toast({
        title: "Sync Failed",
        description: "Unable to sync POS transactions",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">POS Integration</h3>
          <p className="text-gray-600 mt-1">Connect your Point of Sale systems for automated transaction import</p>
        </div>
        
        <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          Coming Soon
        </Badge>
      </div>

      {/* Coming Soon Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Store className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Coming Soon:</strong> POS integrations are currently under development. 
          All functionality below is for testing and demonstration purposes only.
        </AlertDescription>
      </Alert>

      {/* POS Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posSystems.map((pos) => (
          <Card key={pos.id} className={`transition-all duration-200 ${selectedPOS === pos.id ? 'ring-2 ring-primary-500' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pos.name}</CardTitle>
                    <p className="text-sm text-gray-500">{pos.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {pos.status === 'connected' && (
                    <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  {pos.status === 'error' && (
                    <Badge variant="outline" className="text-red-600 bg-red-100 border-red-200">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Error
                    </Badge>
                  )}
                  {pos.status === 'syncing' && (
                    <Badge variant="outline" className="text-blue-600 bg-blue-100 border-blue-200">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Syncing
                    </Badge>
                  )}
                  {pos.status === 'disconnected' && (
                    <Badge variant="outline" className="text-gray-600">
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {pos.isConnected && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium">
                      {pos.lastSync ? new Date(pos.lastSync).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-medium">{pos.transactionCount || 0}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Supported Features</Label>
                <div className="flex flex-wrap gap-1">
                  {pos.supportedFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {syncProgress > 0 && selectedPOS === pos.id && (
                <div className="space-y-2">
                  <Label className="text-xs">Syncing transactions...</Label>
                  <Progress value={syncProgress} className="h-2" />
                </div>
              )}
              
              <div className="flex gap-2">
                {pos.isConnected ? (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedPOS(pos.id);
                        syncTransactionsMutation.mutate(pos.id);
                      }}
                      disabled={syncTransactionsMutation.isPending || syncProgress > 0}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {syncTransactionsMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="opacity-60 pointer-events-none"
                      disabled
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => connectPOSMutation.mutate(pos.id)}
                    disabled={connectPOSMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="flex-1 opacity-60 pointer-events-none"
                  >
                    {connectPOSMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Wifi className="w-4 h-4 mr-1" />
                    )}
                    Connect (Coming Soon)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent POS Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posTransactions.length > 0 ? (
            <div className="space-y-3">
              {posTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Receipt #{transaction.receiptNumber}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.transactionDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {transaction.currency} {transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        VAT: {transaction.currency} {transaction.vatAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Payment:</span> {transaction.paymentMethod}
                    </div>
                    <div>
                      <span className="font-medium">Items:</span> {transaction.items.length}
                    </div>
                    {transaction.location && (
                      <div>
                        <span className="font-medium">Location:</span> {transaction.location}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">POS:</span> {posSystems.find(p => p.id === transaction.posSystemId)?.name || 'Unknown'}
                    </div>
                  </div>
                  
                  {transaction.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium text-gray-700">View Items</summary>
                        <div className="mt-2 space-y-1">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{transaction.currency} {(item.quantity * item.unitPrice).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No POS transactions found</p>
              <p className="text-xs text-gray-500">Transactions will appear here once POS systems are connected</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Sync Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Connected Systems</span>
                <span className="font-medium">{posSystems.filter(p => p.isConnected).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Transactions</span>
                <span className="font-medium">{posTransactions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Sync</span>
                <span className="font-medium">
                  {posSystems.some(p => p.lastSync) ? 'Today' : 'Never'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-green-600" />
              Available Systems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {posSystems.slice(0, 3).map((pos) => (
                <div key={pos.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{pos.name}</span>
                  <Badge variant={pos.isConnected ? "default" : "secondary"} className="text-xs">
                    {pos.isConnected ? "Connected" : "Available"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start opacity-60 pointer-events-none" disabled>
                <Download className="w-4 h-4 mr-2" />
                Export Transactions
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start opacity-60 pointer-events-none" disabled>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All Systems
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start opacity-60 pointer-events-none" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            POS Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              POS integration settings will be available once integrations go live. 
              Configuration includes sync frequency, transaction mapping, and VAT handling.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4 opacity-60 pointer-events-none">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-sync transactions</Label>
                <p className="text-xs text-gray-500">Automatically import new transactions every hour</p>
              </div>
              <Switch disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Include cash transactions</Label>
                <p className="text-xs text-gray-500">Import cash payments along with card transactions</p>
              </div>
              <Switch disabled />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-categorize items</Label>
                <p className="text-xs text-gray-500">Automatically assign tax categories to products</p>
              </div>
              <Switch disabled />
            </div>
            
            <div>
              <Label>Default VAT rate for POS items</Label>
              <select className="w-full mt-1 p-2 border rounded-md bg-gray-100" disabled>
                <option>5% - Standard Rate</option>
                <option>0% - Zero Rate</option>
                <option>Exempt</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}