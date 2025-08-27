import { useEffect, useState } from 'react';
import { ArrowRight, Database, Calculator, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDataSync } from '@/context/data-sync-context';
import { cn } from '@/lib/utils';

interface AutoPopulationItem {
  id: string;
  title: string;
  source: string;
  target: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  lastSync?: string;
  recordCount?: number;
  description: string;
}

interface AutoPopulationStatusProps {
  className?: string;
}

export function AutoPopulationStatus({ className }: AutoPopulationStatusProps) {
  const { syncData, syncState, crossModuleData } = useDataSync();
  const [autoPopulationItems, setAutoPopulationItems] = useState<AutoPopulationItem[]>([]);

  useEffect(() => {
    // Initialize auto-population items based on current data state
    const items: AutoPopulationItem[] = [
      {
        id: 'transactions-to-vat',
        title: 'VAT Calculations',
        source: 'Data Entry Transactions',
        target: 'VAT Module',
        status: crossModuleData?.transactions?.length > 0 ? 'completed' : 'pending',
        lastSync: syncState.lastUpdated['transactions'],
        recordCount: crossModuleData?.transactions?.length || 0,
        description: 'Auto-populate VAT calculations from recorded transactions'
      },
      {
        id: 'transactions-to-cit',
        title: 'CIT Calculations',
        source: 'Bookkeeping Data',
        target: 'CIT Module',
        status: crossModuleData?.transactions?.length > 0 ? 'completed' : 'pending',
        lastSync: syncState.lastUpdated['transactions'],
        recordCount: crossModuleData?.transactions?.length || 0,
        description: 'Auto-populate Corporate Income Tax from bookkeeping records'
      },
      {
        id: 'company-to-modules',
        title: 'Company Settings',
        source: 'Setup Module',
        target: 'All Tax Modules',
        status: crossModuleData?.company?.setupCompleted ? 'completed' : 'pending',
        lastSync: syncState.lastUpdated['company'],
        recordCount: 1,
        description: 'Sync company configuration across all compliance modules'
      }
    ];

    setAutoPopulationItems(items);
  }, [crossModuleData, syncState]);

  const handleSyncItem = async (item: AutoPopulationItem) => {
    const modules = getModulesForItem(item.id);
    await syncData(modules);
  };

  const handleSyncAll = async () => {
    await syncData(['transactions', 'company', 'tax-settings']);
  };

  const getModulesForItem = (itemId: string): string[] => {
    switch (itemId) {
      case 'transactions-to-vat':
        return ['transactions', 'vat-calculations'];
      case 'transactions-to-cit':
        return ['transactions', 'cit-calculations'];
      case 'company-to-modules':
        return ['company', 'tax-settings'];
      default:
        return [];
    }
  };

  const getStatusColor = (status: AutoPopulationItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'syncing':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-amber-600 bg-amber-100';
    }
  };

  const getStatusIcon = (status: AutoPopulationItem['status']) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'syncing':
        return RefreshCw;
      case 'error':
        return AlertTriangle;
      default:
        return Database;
    }
  };

  const completedItems = autoPopulationItems.filter(item => item.status === 'completed').length;
  const totalItems = autoPopulationItems.length;
  const completionPercentage = (completedItems / totalItems) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Auto-Population Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncState.syncStatus === 'syncing'}
          >
            <RefreshCw className={cn(
              "w-4 h-4 mr-2",
              syncState.syncStatus === 'syncing' && "animate-spin"
            )} />
            Sync All
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{completedItems}/{totalItems}</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {autoPopulationItems.map((item) => {
          const StatusIcon = getStatusIcon(item.status);
          
          return (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn(
                    "w-4 h-4",
                    item.status === 'syncing' && "animate-spin"
                  )} />
                  <h4 className="font-medium">{item.title}</h4>
                </div>
                
                <Badge variant="outline" className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-2">
                  <span>{item.source}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{item.target}</span>
                </div>
                
                {item.recordCount !== undefined && (
                  <span>{item.recordCount} records</span>
                )}
              </div>
              
              {item.lastSync && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Last sync: {new Date(item.lastSync).toLocaleString()}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSyncItem(item)}
                    disabled={syncState.syncStatus === 'syncing'}
                    className="h-6 px-2"
                  >
                    <RefreshCw className={cn(
                      "w-3 h-3",
                      syncState.syncStatus === 'syncing' && "animate-spin"
                    )} />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        
        {autoPopulationItems.length === 0 && (
          <div className="text-center py-6">
            <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No auto-population items configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}