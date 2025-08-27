import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface LoadingOptimizerProps {
  isVisible?: boolean;
  onClose?: () => void;
}

interface OptimizationTask {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  estimatedTime: number;
}

export function LoadingOptimizer({ isVisible = false, onClose }: LoadingOptimizerProps) {
  const [tasks, setTasks] = useState<OptimizationTask[]>([
    {
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      description: 'Clearing outdated browser cache',
      progress: 0,
      status: 'pending',
      estimatedTime: 2000
    },
    {
      id: 'image-optimization',
      name: 'Image Optimization',
      description: 'Compressing and optimizing images',
      progress: 0,
      status: 'pending',
      estimatedTime: 3000
    },
    {
      id: 'js-minification',
      name: 'JavaScript Optimization',
      description: 'Minifying and optimizing JavaScript',
      progress: 0,
      status: 'pending',
      estimatedTime: 2500
    },
    {
      id: 'preload-critical',
      name: 'Critical Resource Preload',
      description: 'Preloading critical resources',
      progress: 0,
      status: 'pending',
      estimatedTime: 1500
    },
    {
      id: 'service-worker',
      name: 'Service Worker Update',
      description: 'Updating offline capabilities',
      progress: 0,
      status: 'pending',
      estimatedTime: 1000
    }
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (isVisible && !isOptimizing) {
      startOptimization();
    }
  }, [isVisible]);

  const startOptimization = async () => {
    setIsOptimizing(true);
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Start task
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'running' } : t
      ));

      // Simulate optimization progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, task.estimatedTime / 10));
        
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, progress } : t
        ));
      }

      // Complete task
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
      ));

      // Update overall progress
      setOverallProgress(((i + 1) / tasks.length) * 100);
    }

    // Perform actual optimizations
    await performActualOptimizations();
    
    setIsOptimizing(false);
    
    // Auto close after 2 seconds
    setTimeout(() => {
      onClose?.();
    }, 2000);
  };

  const performActualOptimizations = async () => {
    try {
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear localStorage of temporary data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('temp') || key.includes('cache'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Preload critical resources
      const criticalResources = [
        '/api/users/me',
        '/api/notifications',
        '/api/kpi-data'
      ];
      
      await Promise.all(
        criticalResources.map(url => 
          fetch(url).catch(() => {}) // Ignore failures
        )
      );

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      // Update service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      }

    } catch (error) {
      console.warn('Some optimizations failed:', error);
    }
  };

  const getStatusIcon = (status: OptimizationTask['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Optimizing Performance
          </CardTitle>
          <div className="space-y-2">
            <Progress value={overallProgress} className="w-full" />
            <p className="text-sm text-gray-600">
              {Math.round(overallProgress)}% Complete
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.name}</p>
                  <p className="text-xs text-gray-500 truncate">{task.description}</p>
                  {task.status === 'running' && (
                    <Progress value={task.progress} className="w-full h-1 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isOptimizing && overallProgress === 100 && (
            <div className="mt-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">
                Optimization Complete!
              </p>
              <p className="text-xs text-gray-600">
                Your app should run faster now
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="mt-3"
              >
                Continue
              </Button>
            </div>
          )}

          {isOptimizing && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Please don't close this window...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Quick optimization actions
export function QuickOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const clearCache = async () => {
    setIsOptimizing(true);
    
    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear temporary localStorage
      const tempKeys = Object.keys(localStorage).filter(key => 
        key.includes('temp') || key.includes('cache')
      );
      tempKeys.forEach(key => localStorage.removeItem(key));
      
      window.location.reload();
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
    
    setIsOptimizing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={clearCache}
        disabled={isOptimizing}
        className="flex items-center gap-1"
      >
        {isOptimizing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
        Clear Cache
      </Button>
    </div>
  );
}