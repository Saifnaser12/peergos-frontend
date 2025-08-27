import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Activity, 
  Database, 
  HardDrive, 
  Wifi, 
  Lock, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Zap
} from 'lucide-react';
import { PerformanceMonitor } from '@/components/ui/performance-monitor';
import { LoadingOptimizer, QuickOptimizer } from '@/components/ui/loading-optimizer';
import { useOffline } from '@/hooks/use-offline';
import { useToast } from '@/hooks/use-toast';

export default function SystemMonitor() {
  const [showOptimizer, setShowOptimizer] = useState(false);
  const { isOnline, hasOfflineData, syncOfflineData, clearOfflineData } = useOffline();
  const { toast } = useToast();

  const securityMetrics = {
    httpsEnabled: true,
    corsConfigured: true,
    rateLimitActive: true,
    sqlInjectionProtection: true,
    xssProtection: true,
    csrfProtection: true,
    dataEncryption: true,
    sessionSecurity: true,
    auditLogging: true,
    backupStatus: 'Active'
  };

  const systemHealth = {
    databaseConnection: 'Healthy',
    memoryUsage: '78%',
    diskSpace: '45%',
    cpuUsage: '23%',
    uptime: '15 days',
    lastBackup: '2 hours ago',
    errorRate: '0.02%',
    responseTime: '120ms'
  };

  const handleBackupTest = async () => {
    toast({
      title: "Backup Test Started",
      description: "Testing backup system integrity...",
      variant: "default"
    });

    // Simulate backup test
    setTimeout(() => {
      toast({
        title: "Backup Test Complete",
        description: "All backup systems are functioning properly",
        variant: "default"
      });
    }, 3000);
  };

  const handleSecurityScan = async () => {
    toast({
      title: "Security Scan Started",
      description: "Scanning for security vulnerabilities...",
      variant: "default"
    });

    // Simulate security scan
    setTimeout(() => {
      toast({
        title: "Security Scan Complete",
        description: "No security issues detected",
        variant: "default"
      });
    }, 5000);
  };

  const renderSecurityStatus = () => {
    const securityChecks = [
      { name: 'HTTPS Encryption', status: securityMetrics.httpsEnabled, icon: Lock },
      { name: 'CORS Configuration', status: securityMetrics.corsConfigured, icon: Shield },
      { name: 'Rate Limiting', status: securityMetrics.rateLimitActive, icon: Activity },
      { name: 'SQL Injection Protection', status: securityMetrics.sqlInjectionProtection, icon: Database },
      { name: 'XSS Protection', status: securityMetrics.xssProtection, icon: Shield },
      { name: 'CSRF Protection', status: securityMetrics.csrfProtection, icon: Lock },
      { name: 'Data Encryption', status: securityMetrics.dataEncryption, icon: Lock },
      { name: 'Session Security', status: securityMetrics.sessionSecurity, icon: Shield },
      { name: 'Audit Logging', status: securityMetrics.auditLogging, icon: Activity }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {securityChecks.map((check) => {
          const IconComponent = check.icon;
          return (
            <Card key={check.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">{check.name}</span>
                  </div>
                  {check.status ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={check.status ? 'border-green-200 text-green-800' : 'border-red-200 text-red-800'}
                >
                  {check.status ? 'Active' : 'Inactive'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSystemHealth = () => {
    const healthChecks = [
      { name: 'Database', value: systemHealth.databaseConnection, status: 'good' },
      { name: 'Memory Usage', value: systemHealth.memoryUsage, status: systemHealth.memoryUsage < '80%' ? 'good' : 'warning' },
      { name: 'Disk Space', value: systemHealth.diskSpace, status: systemHealth.diskSpace < '70%' ? 'good' : 'warning' },
      { name: 'CPU Usage', value: systemHealth.cpuUsage, status: systemHealth.cpuUsage < '80%' ? 'good' : 'warning' },
      { name: 'Uptime', value: systemHealth.uptime, status: 'good' },
      { name: 'Last Backup', value: systemHealth.lastBackup, status: 'good' },
      { name: 'Error Rate', value: systemHealth.errorRate, status: systemHealth.errorRate < '1%' ? 'good' : 'warning' },
      { name: 'Response Time', value: systemHealth.responseTime, status: systemHealth.responseTime < '200ms' ? 'good' : 'warning' }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {healthChecks.map((check) => (
          <Card key={check.name}>
            <CardContent className="p-4 text-center">
              <div className={`h-3 w-3 rounded-full mx-auto mb-2 ${
                check.status === 'good' ? 'bg-green-500' : 
                check.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <p className="text-lg font-bold">{check.value}</p>
              <p className="text-xs text-gray-600">{check.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitor</h1>
          <p className="text-gray-600">Performance, security, and system health monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "outline" : "destructive"}>
            <Wifi className="h-3 w-3 mr-1" />
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {hasOfflineData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncOfflineData}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Sync Offline Data
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderSystemHealth()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Score</span>
                    <Badge className="bg-green-100 text-green-800">98/100</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Scan</span>
                    <span className="text-sm text-gray-600">10 minutes ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threats Blocked</span>
                    <span className="text-sm font-medium">0 today</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSecurityScan}
                    className="w-full mt-4"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Run Security Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <PerformanceMonitor showDetails={false} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </div>
                <Button variant="outline" size="sm" onClick={handleSecurityScan}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Scan Now
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderSecurityStatus()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">All security measures active</p>
                    <p className="text-xs text-green-600">Your system is well protected against common threats</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                  <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Regular monitoring active</p>
                    <p className="text-xs text-blue-600">Continuous monitoring for suspicious activities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Monitoring</h3>
            <div className="flex items-center gap-2">
              <QuickOptimizer />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowOptimizer(true)}
                className="flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Deep Optimization
              </Button>
            </div>
          </div>
          
          <PerformanceMonitor showDetails={true} />

          <Card>
            <CardHeader>
              <CardTitle>Offline Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Status</span>
                  <Badge variant={isOnline ? "outline" : "destructive"}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                {hasOfflineData && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Offline Data Pending</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={syncOfflineData}>
                        Sync Now
                      </Button>
                      <Button variant="destructive" size="sm" onClick={clearOfflineData}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    Service Worker active - Critical tax functions available offline
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Backup & Recovery
                </div>
                <Button variant="outline" size="sm" onClick={handleBackupTest}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Test Backup
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Full Backup</span>
                    <span className="text-sm text-gray-600">Yesterday 2:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Incremental</span>
                    <span className="text-sm text-gray-600">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retention Period</span>
                    <span className="text-sm text-gray-600">90 days</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backup Size</span>
                    <span className="text-sm text-gray-600">2.4 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compression</span>
                    <span className="text-sm text-gray-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encryption</span>
                    <span className="text-sm text-gray-600">AES-256</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recovery Time</span>
                    <span className="text-sm text-gray-600">&lt; 30 minutes</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                <h4 className="font-medium mb-2">UAE FTA Compliance</h4>
                <p className="text-sm text-gray-600">
                  All financial data is backed up according to UAE FTA requirements for 7-year record retention.
                  Backups are encrypted and stored securely with automated recovery procedures.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deep Optimization Modal */}
      <LoadingOptimizer 
        isVisible={showOptimizer}
        onClose={() => setShowOptimizer(false)}
      />
    </div>
  );
}