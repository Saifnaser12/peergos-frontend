import { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDataSync } from '@/context/data-sync-context';
import { cn } from '@/lib/utils';

interface RealTimeIndicatorProps {
  module?: string;
  className?: string;
  showDetails?: boolean;
}

export function RealTimeIndicator({ module, className, showDetails = false }: RealTimeIndicatorProps) {
  const { syncState, isDataStale, syncData, getValidationErrors } = useDataSync();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const moduleErrors = module ? getValidationErrors(module) : [];
  const hasErrors = moduleErrors.length > 0;
  const isStale = module ? isDataStale(module) : false;

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        text: 'Offline',
        description: 'Connection lost. Changes will sync when back online.'
      };
    }

    if (syncState.syncStatus === 'syncing') {
      return {
        icon: RefreshCw,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: 'Syncing',
        description: 'Synchronizing data across modules...',
        animate: true
      };
    }

    if (hasErrors) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        text: `${moduleErrors.length} Issue${moduleErrors.length !== 1 ? 's' : ''}`,
        description: 'Data validation issues detected'
      };
    }

    if (isStale) {
      return {
        icon: RefreshCw,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        text: 'Stale',
        description: 'Data may be outdated. Click to refresh.'
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: 'Synced',
      description: 'All data is up to date'
    };
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  const handleRefresh = async () => {
    if (module) {
      await syncData([module]);
    } else {
      await syncData(['transactions', 'company', 'tax-settings']);
    }
  };

  const getLastSyncTime = () => {
    if (!module) return null;
    const lastSync = syncState.lastUpdated[module];
    if (!lastSync) return 'Never';
    
    const timeDiff = Date.now() - new Date(lastSync).getTime();
    if (timeDiff < 60000) return 'Just now';
    if (timeDiff < 3600000) return `${Math.floor(timeDiff / 60000)}m ago`;
    return `${Math.floor(timeDiff / 3600000)}h ago`;
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "flex items-center gap-1 cursor-pointer transition-colors",
                statusInfo.bgColor,
                statusInfo.color,
                className
              )}
              onClick={handleRefresh}
            >
              <IconComponent className={cn(
                "w-3 h-3",
                statusInfo.animate && "animate-spin"
              )} />
              {statusInfo.text}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p>{statusInfo.description}</p>
              {module && (
                <p className="text-gray-500">Last sync: {getLastSyncTime()}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 border rounded-lg", className)}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full",
        statusInfo.bgColor
      )}>
        <IconComponent className={cn(
          "w-4 h-4",
          statusInfo.color,
          statusInfo.animate && "animate-spin"
        )} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{statusInfo.text}</span>
          {!isOnline && <WifiOff className="w-3 h-3 text-gray-400" />}
        </div>
        <p className="text-xs text-gray-600">{statusInfo.description}</p>
        {module && (
          <p className="text-xs text-gray-500">Last sync: {getLastSyncTime()}</p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={syncState.syncStatus === 'syncing' || !isOnline}
        className="h-8 px-3"
      >
        <RefreshCw className={cn(
          "w-3 h-3",
          syncState.syncStatus === 'syncing' && "animate-spin"
        )} />
      </Button>
    </div>
  );
}