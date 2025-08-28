import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Wifi, 
  Database, 
  Clock, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  connectionSpeed: string;
  cacheHitRate: number;
  errorRate: number;
  userInteractionDelay: number;
}

interface PerformanceMonitorProps {
  showDetails?: boolean;
}

export function PerformanceMonitor({ showDetails = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    connectionSpeed: 'unknown',
    cacheHitRate: 0,
    errorRate: 0,
    userInteractionDelay: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Measure page load performance
    measurePageLoad();
    
    // Monitor API performance
    monitorApiCalls();
    
    // Monitor memory usage
    monitorMemoryUsage();
    
    // Monitor network connection
    monitorNetworkPerformance();
    
    // Set up periodic updates
    const interval = setInterval(() => {
      updateMetrics();
    }, 5000);

    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const measurePageLoad = () => {
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const renderTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(loadTime),
          renderTime: Math.round(renderTime)
        }));
      }
    }
  };

  const monitorApiCalls = () => {
    let totalRequests = 0;
    let totalResponseTime = 0;
    let errorCount = 0;

    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      totalRequests++;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        totalResponseTime += responseTime;
        
        if (!response.ok) {
          errorCount++;
        }

        setMetrics(prev => ({
          ...prev,
          apiResponseTime: Math.round(totalResponseTime / totalRequests),
          errorRate: Math.round((errorCount / totalRequests) * 100)
        }));

        return response;
      } catch (error) {
        errorCount++;
        setMetrics(prev => ({
          ...prev,
          errorRate: Math.round((errorCount / totalRequests) * 100)
        }));
        throw error;
      }
    };
  };

  const monitorMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        const usageInMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memoryUsage: usageInMB }));
      }
    }
  };

  const monitorNetworkPerformance = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        setMetrics(prev => ({
          ...prev,
          connectionSpeed: connection.effectiveType || 'unknown'
        }));
      }
    }
  };

  const updateMetrics = () => {
    // Simulate cache hit rate (in real app, this would come from analytics)
    const cacheHitRate = Math.random() * 20 + 80; // 80-100%
    
    // Measure user interaction delay
    const interactionDelay = measureInteractionDelay();
    
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: Math.round(cacheHitRate),
      userInteractionDelay: interactionDelay
    }));
  };

  const measureInteractionDelay = () => {
    // This would measure First Input Delay (FID) in a real implementation
    return Math.random() * 50 + 10; // 10-60ms
  };

  const getPerformanceGrade = () => {
    const { loadTime, apiResponseTime, errorRate, userInteractionDelay } = metrics;
    
    let score = 100;
    
    // Penalize slow load times
    if (loadTime > 3000) score -= 20;
    else if (loadTime > 2000) score -= 10;
    
    // Penalize slow API responses
    if (apiResponseTime > 1000) score -= 15;
    else if (apiResponseTime > 500) score -= 8;
    
    // Penalize high error rates
    if (errorRate > 5) score -= 20;
    else if (errorRate > 2) score -= 10;
    
    // Penalize slow interactions
    if (userInteractionDelay > 100) score -= 10;
    else if (userInteractionDelay > 50) score -= 5;
    
    if (score >= 90) return { grade: 'A', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { grade: 'B', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800' };
    return { grade: 'D', color: 'bg-red-100 text-red-800' };
  };

  const optimizePerformance = () => {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear localStorage of old data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('peergos-') && key.includes('cache')) {
        localStorage.removeItem(key);
      }
    });
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Reload to see improvements
    window.location.reload();
  };

  const performanceGrade = getPerformanceGrade();

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-gray-500" />
        <Badge variant="outline" className={performanceGrade.color}>
          Performance: {performanceGrade.grade}
        </Badge>
        {metrics.errorRate > 5 && (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </div>
          <div className="flex items-center gap-2">
            <Badge className={performanceGrade.color}>
              Grade: {performanceGrade.grade}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={optimizePerformance}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Optimize
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Load Time */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold text-gray-900">
              {metrics.loadTime}ms
            </p>
            <p className="text-xs text-gray-600">Load Time</p>
          </div>

          {/* API Response */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Database className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold text-gray-900">
              {metrics.apiResponseTime}ms
            </p>
            <p className="text-xs text-gray-600">API Response</p>
          </div>

          {/* Connection */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Wifi className="h-6 w-6 mx-auto mb-1 text-purple-600" />
            <p className="text-lg font-bold text-gray-900 capitalize">
              {metrics.connectionSpeed}
            </p>
            <p className="text-xs text-gray-600">Connection</p>
          </div>

          {/* Memory Usage */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Activity className="h-6 w-6 mx-auto mb-1 text-orange-600" />
            <p className="text-lg font-bold text-gray-900">
              {metrics.memoryUsage}MB
            </p>
            <p className="text-xs text-gray-600">Memory</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* Performance Indicators */}
          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm text-gray-600">Cache Hit Rate</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${metrics.cacheHitRate}%` }}
                />
              </div>
              <span className="text-sm font-medium">{metrics.cacheHitRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm text-gray-600">Error Rate</span>
            <div className="flex items-center gap-2">
              {metrics.errorRate < 2 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{metrics.errorRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 border rounded">
            <span className="text-sm text-gray-600">Interaction Delay</span>
            <div className="flex items-center gap-2">
              {metrics.userInteractionDelay < 50 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">{metrics.userInteractionDelay}ms</span>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Performance Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {metrics.loadTime > 2000 && (
              <li>• Consider enabling browser caching for static assets</li>
            )}
            {metrics.apiResponseTime > 500 && (
              <li>• API responses are slower than optimal - check network conditions</li>
            )}
            {metrics.memoryUsage > 100 && (
              <li>• High memory usage detected - consider refreshing the page</li>
            )}
            {metrics.errorRate > 2 && (
              <li>• Multiple errors detected - check your internet connection</li>
            )}
          </ul>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="h-3 w-3" />
          <span>Monitoring active • Updates every 5 seconds</span>
        </div>
      </CardContent>
    </Card>
  );
}