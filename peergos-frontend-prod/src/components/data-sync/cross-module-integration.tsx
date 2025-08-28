import { useState, useEffect } from 'react';
import { ArrowRight, Calculator, Receipt, Building2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataSync } from '@/context/data-sync-context';
import { cn } from '@/lib/utils';

interface IntegrationMapping {
  id: string;
  sourceModule: string;
  targetModule: string;
  dataType: string;
  description: string;
  isAutomatic: boolean;
  lastSync?: Date;
  status: 'synced' | 'pending' | 'error' | 'outdated';
  recordCount?: number;
}

interface CrossModuleIntegrationProps {
  currentModule?: string;
  className?: string;
}

export function CrossModuleIntegration({ currentModule, className }: CrossModuleIntegrationProps) {
  const { crossModuleData, syncData, syncState, getValidationErrors } = useDataSync();
  const [integrationMappings, setIntegrationMappings] = useState<IntegrationMapping[]>([]);

  useEffect(() => {
    const mappings: IntegrationMapping[] = [
      {
        id: 'transactions-vat',
        sourceModule: 'Data Entry',
        targetModule: 'VAT Calculations',
        dataType: 'Transactions',
        description: 'VAT calculations auto-populated from recorded transactions',
        isAutomatic: true,
        status: crossModuleData?.transactions?.length > 0 ? 'synced' : 'pending',
        recordCount: crossModuleData?.transactions?.length || 0,
        lastSync: syncState.lastUpdated['transactions'] ? new Date(syncState.lastUpdated['transactions']) : undefined
      },
      {
        id: 'bookkeeping-cit',
        sourceModule: 'Bookkeeping',
        targetModule: 'CIT Calculations',
        dataType: 'Financial Records',
        description: 'Corporate Income Tax calculations from bookkeeping data',
        isAutomatic: true,
        status: crossModuleData?.transactions?.length > 0 ? 'synced' : 'pending',
        recordCount: crossModuleData?.transactions?.length || 0,
        lastSync: syncState.lastUpdated['transactions'] ? new Date(syncState.lastUpdated['transactions']) : undefined
      },
      {
        id: 'company-settings',
        sourceModule: 'Setup',
        targetModule: 'All Modules',
        dataType: 'Company Config',
        description: 'Company settings synchronized across all tax modules',
        isAutomatic: true,
        status: crossModuleData?.company?.setupCompleted ? 'synced' : 'pending',
        recordCount: 1,
        lastSync: syncState.lastUpdated['company'] ? new Date(syncState.lastUpdated['company']) : undefined
      },
      {
        id: 'vat-reports',
        sourceModule: 'VAT Calculations',
        targetModule: 'Reports',
        dataType: 'VAT Returns',
        description: 'VAT return data flows into financial reports',
        isAutomatic: true,
        status: crossModuleData?.vatCalculations ? 'synced' : 'pending',
        recordCount: crossModuleData?.vatCalculations ? 1 : 0,
        lastSync: syncState.lastUpdated['vat-calculations'] ? new Date(syncState.lastUpdated['vat-calculations']) : undefined
      },
      {
        id: 'cit-reports',
        sourceModule: 'CIT Calculations',
        targetModule: 'Reports',
        dataType: 'CIT Returns',
        description: 'Corporate Income Tax data integrated into reports',
        isAutomatic: true,
        status: crossModuleData?.citCalculations ? 'synced' : 'pending',
        recordCount: crossModuleData?.citCalculations ? 1 : 0,
        lastSync: syncState.lastUpdated['cit-calculations'] ? new Date(syncState.lastUpdated['cit-calculations']) : undefined
      }
    ];

    // Filter mappings based on current module if specified
    const filteredMappings = currentModule 
      ? mappings.filter(m => 
          m.sourceModule.toLowerCase().includes(currentModule.toLowerCase()) ||
          m.targetModule.toLowerCase().includes(currentModule.toLowerCase())
        )
      : mappings;

    setIntegrationMappings(filteredMappings);
  }, [crossModuleData, syncState, currentModule]);

  const getStatusIcon = (status: IntegrationMapping['status']) => {
    switch (status) {
      case 'synced': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'outdated': return RefreshCw;
      default: return Calculator;
    }
  };

  const getStatusColor = (status: IntegrationMapping['status']) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100 border-green-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      case 'outdated': return 'text-amber-600 bg-amber-100 border-amber-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getModuleIcon = (moduleName: string) => {
    if (moduleName.toLowerCase().includes('vat') || moduleName.toLowerCase().includes('cit')) {
      return Calculator;
    }
    if (moduleName.toLowerCase().includes('data') || moduleName.toLowerCase().includes('bookkeeping')) {
      return Receipt;
    }
    if (moduleName.toLowerCase().includes('setup') || moduleName.toLowerCase().includes('company')) {
      return Building2;
    }
    return Calculator;
  };

  const handleSyncMapping = async (mapping: IntegrationMapping) => {
    const modules = [
      mapping.sourceModule.toLowerCase().replace(' ', '-'),
      mapping.targetModule.toLowerCase().replace(' ', '-')
    ];
    await syncData(modules);
  };

  const syncedMappings = integrationMappings.filter(m => m.status === 'synced').length;
  const totalMappings = integrationMappings.length;

  const validationErrors = getValidationErrors();
  const hasIntegrationIssues = validationErrors.some(error => 
    error.affectedModules.length > 1
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            Cross-Module Data Flow
          </div>
          <Badge variant="outline">
            {syncedMappings}/{totalMappings} synced
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasIntegrationIssues && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              Data inconsistencies detected between modules. Some auto-population may be affected.
            </AlertDescription>
          </Alert>
        )}

        {integrationMappings.map((mapping) => {
          const StatusIcon = getStatusIcon(mapping.status);
          const SourceIcon = getModuleIcon(mapping.sourceModule);
          const TargetIcon = getModuleIcon(mapping.targetModule);
          
          return (
            <div
              key={mapping.id}
              className={cn(
                "border rounded-lg p-4 transition-all hover:shadow-sm",
                mapping.status === 'error' ? "border-red-200 bg-red-50/30" :
                mapping.status === 'synced' ? "border-green-200 bg-green-50/30" :
                "border-gray-200"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <StatusIcon className={cn(
                    "w-4 h-4",
                    mapping.status === 'synced' ? "text-green-600" :
                    mapping.status === 'error' ? "text-red-600" :
                    "text-blue-600"
                  )} />
                  <span className="font-medium text-sm">{mapping.dataType}</span>
                  {mapping.isAutomatic && (
                    <Badge variant="outline" className="text-xs">
                      Auto
                    </Badge>
                  )}
                </div>

                <Badge variant="outline" className={getStatusColor(mapping.status)}>
                  {mapping.status}
                </Badge>
              </div>

              {/* Data Flow Visualization */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <SourceIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{mapping.sourceModule}</span>
                </div>
                
                <ArrowRight className="w-4 h-4 text-gray-400" />
                
                <div className="flex items-center gap-2 text-sm">
                  <TargetIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{mapping.targetModule}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-3">{mapping.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {mapping.recordCount !== undefined && (
                    <span>{mapping.recordCount} records</span>
                  )}
                  {mapping.lastSync && (
                    <span>
                      Last sync: {mapping.lastSync.toLocaleDateString()} {mapping.lastSync.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSyncMapping(mapping)}
                  disabled={syncState.syncStatus === 'syncing'}
                  className="h-6 px-2"
                >
                  <RefreshCw className={cn(
                    "w-3 h-3",
                    syncState.syncStatus === 'syncing' && "animate-spin"
                  )} />
                </Button>
              </div>
            </div>
          );
        })}

        {integrationMappings.length === 0 && (
          <div className="text-center py-6">
            <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No data flow configured for this module</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}