import { AlertTriangle, RefreshCw, X, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataSync } from '@/context/data-sync-context';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ValidationWarningsProps {
  module?: string;
  className?: string;
  compact?: boolean;
}

export function ValidationWarnings({ module, className, compact = false }: ValidationWarningsProps) {
  const { getValidationErrors, syncData, syncState } = useDataSync();
  const [dismissedErrors, setDismissedErrors] = useState<string[]>([]);
  
  const errors = getValidationErrors(module).filter(error => 
    !dismissedErrors.includes(error.id)
  );

  const handleSync = async () => {
    const affectedModules = Array.from(new Set(
      errors.flatMap(error => [error.module, ...error.affectedModules])
    ));
    await syncData(affectedModules);
  };

  const dismissError = (errorId: string) => {
    setDismissedErrors(prev => [...prev, errorId]);
  };

  const getSeverityColor = (severity: 'warning' | 'error') => {
    return severity === 'error' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const getModuleLink = (moduleName: string) => {
    const moduleRoutes: { [key: string]: string } = {
      'transactions': '/accounting',
      'vat-calculations': '/tax-calculations',
      'cit-calculations': '/tax-calculations',
      'company': '/setup',
      'tax-settings': '/admin/tax-settings',
      'reports': '/reports'
    };
    return moduleRoutes[moduleName] || '/';
  };

  if (errors.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Alert className={cn("border-amber-200 bg-amber-50", className)}>
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <div className="flex items-center justify-between">
            <span>
              {errors.length} data validation {errors.length === 1 ? 'issue' : 'issues'} detected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSync}>
                <RefreshCw className={cn(
                  "w-3 h-3 mr-1",
                  syncState.syncStatus === 'syncing' && "animate-spin"
                )} />
                Sync
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={cn("border-amber-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-4 w-4 text-amber-600" />
          Data Validation Issues
          <Badge variant="outline" className="ml-auto">
            {errors.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {errors.map((error) => (
          <div
            key={error.id}
            className={cn(
              "border rounded-lg p-3 transition-colors",
              error.severity === 'error' ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={getSeverityColor(error.severity)}>
                    {error.severity}
                  </Badge>
                  <span className="text-xs text-gray-600 capitalize">
                    {error.module.replace('-', ' ')}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {error.message}
                </p>
                
                {error.field && (
                  <p className="text-xs text-gray-600">
                    Field: <code className="bg-gray-100 px-1 rounded">{error.field}</code>
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissError(error.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            {error.affectedModules.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600">Affects:</span>
                <div className="flex gap-1">
                  {error.affectedModules.map((affectedModule) => (
                    <Link key={affectedModule} href={getModuleLink(affectedModule)}>
                      <Badge variant="ghost" className="text-xs cursor-pointer hover:bg-gray-100">
                        {affectedModule.replace('-', ' ')}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Link href={getModuleLink(error.module)}>
                <Button variant="outline" size="sm" className="text-xs h-6">
                  Fix in {error.module.replace('-', ' ')}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <Button 
            onClick={handleSync}
            disabled={syncState.syncStatus === 'syncing'}
            className="w-full"
            size="sm"
          >
            <RefreshCw className={cn(
              "w-4 h-4 mr-2",
              syncState.syncStatus === 'syncing' && "animate-spin"
            )} />
            {syncState.syncStatus === 'syncing' ? 'Syncing...' : 'Sync All Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}