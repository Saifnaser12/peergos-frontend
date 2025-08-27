import { useState } from 'react';
import { Link, Clock, CheckCircle, AlertTriangle, Wifi, WifiOff, RefreshCw, Eye, Send, History, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FTAConnectionStatus {
  isConnected: boolean;
  lastConnectionTest: string;
  status: 'active' | 'inactive' | 'testing' | 'error';
  environment: 'sandbox' | 'production';
  apiVersion: string;
  lastSuccessfulSubmission?: string;
}

interface FTASubmissionLog {
  id: string;
  submissionType: 'vat-return' | 'cit-return' | 'e-invoice';
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'error';
  submittedAt: string;
  responseTime?: number;
  ftaReferenceNumber?: string;
  errorMessage?: string;
  documentId?: string;
}

interface FTANotification {
  id: string;
  type: 'submission_success' | 'submission_error' | 'api_status' | 'compliance_alert';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export function FTAIntegrationStatus() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('status');

  // Fetch FTA connection status
  const { data: ftaStatus, refetch: refetchStatus } = useQuery<FTAConnectionStatus>({
    queryKey: ['/api/fta/status'],
    staleTime: 30 * 1000,
  });

  // Fetch submission logs
  const { data: submissionLogs = [] } = useQuery<FTASubmissionLog[]>({
    queryKey: ['/api/fta/submissions'],
    staleTime: 60 * 1000,
  });

  // Fetch FTA notifications
  const { data: ftaNotifications = [] } = useQuery<FTANotification[]>({
    queryKey: ['/api/fta/notifications'],
    staleTime: 30 * 1000,
  });

  // Test FTA connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/fta/test-connection', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "FTA Connection Test",
        description: data.success ? "Connection successful!" : "Connection failed",
        variant: data.success ? "default" : "destructive"
      });
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Connection Test Failed",
        description: "Unable to test FTA API connection",
        variant: "destructive"
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'testing': return RefreshCw;
      case 'error': return AlertTriangle;
      default: return WifiOff;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-200';
      case 'testing': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'error': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'submitted': return 'text-blue-600 bg-blue-100';
      case 'rejected': case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-amber-600 bg-amber-100';
    }
  };

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-amber-500';
      default: return 'border-l-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">FTA Integration</h2>
          <p className="text-gray-600 mt-1">Federal Tax Authority API connection and submission management</p>
        </div>
        
        <Button
          onClick={() => testConnectionMutation.mutate()}
          disabled={testConnectionMutation.isPending}
          variant="outline"
        >
          {testConnectionMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wifi className="w-4 h-4 mr-2" />
          )}
          Test Connection
        </Button>
      </div>

      {/* Coming Soon Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Coming Soon:</strong> FTA Live API Integration is currently under development. 
          All functionality below is for testing and demonstration purposes only.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Connection Status</TabsTrigger>
          <TabsTrigger value="submissions">Submission Logs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Connection Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-blue-600" />
                  API Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge variant="outline" className={getStatusColor(ftaStatus?.status || 'inactive')}>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const StatusIcon = getStatusIcon(ftaStatus?.status || 'inactive');
                        return <StatusIcon className={`w-3 h-3 ${ftaStatus?.status === 'testing' ? 'animate-spin' : ''}`} />;
                      })()}
                      {ftaStatus?.status === 'active' ? 'Connected' : 
                       ftaStatus?.status === 'testing' ? 'Testing...' : 
                       ftaStatus?.status === 'error' ? 'Error' : 'Disconnected'}
                    </div>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Environment</span>
                    <span className="font-medium">{ftaStatus?.environment || 'Sandbox'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">API Version</span>
                    <span className="font-medium">{ftaStatus?.apiVersion || 'v2.0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Test</span>
                    <span className="font-medium">
                      {ftaStatus?.lastConnectionTest ? 
                        new Date(ftaStatus.lastConnectionTest).toLocaleString() : 
                        'Never tested'
                      }
                    </span>
                  </div>
                  {ftaStatus?.lastSuccessfulSubmission && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Submission</span>
                      <span className="font-medium">
                        {new Date(ftaStatus.lastSuccessfulSubmission).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-green-600" />
                  Submission Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {submissionLogs.filter(log => log.status === 'accepted').length}
                    </div>
                    <div className="text-xs text-green-700">Accepted</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {submissionLogs.filter(log => log.status === 'pending').length}
                    </div>
                    <div className="text-xs text-blue-700">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {submissionLogs.filter(log => log.status === 'rejected' || log.status === 'error').length}
                    </div>
                    <div className="text-xs text-red-700">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {submissionLogs.length}
                    </div>
                    <div className="text-xs text-gray-700">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Submission Logs Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissionLogs.length > 0 ? (
                  submissionLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.submissionType.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            Document #{log.documentId || log.id.slice(-6)}
                          </span>
                        </div>
                        <Badge variant="outline" className={getSubmissionStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Submitted:</span> {new Date(log.submittedAt).toLocaleString()}
                        </div>
                        {log.responseTime && (
                          <div>
                            <span className="font-medium">Response Time:</span> {log.responseTime}ms
                          </div>
                        )}
                        {log.ftaReferenceNumber && (
                          <div>
                            <span className="font-medium">FTA Ref:</span> {log.ftaReferenceNumber}
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="col-span-2 text-red-600">
                            <span className="font-medium">Error:</span> {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No submissions found</p>
                    <p className="text-xs text-gray-500">Submission logs will appear here once FTA integration is active</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                FTA Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ftaNotifications.length > 0 ? (
                  ftaNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`border-l-4 p-4 bg-white rounded-r-lg ${getNotificationColor(notification.severity)} ${!notification.isRead ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No notifications</p>
                    <p className="text-xs text-gray-500">FTA status updates will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>FTA Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  FTA API configuration will be available once the integration is live. 
                  Contact support for early access to production API credentials.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 opacity-60 pointer-events-none">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Environment</label>
                    <select className="w-full p-2 border rounded-md bg-gray-100" disabled>
                      <option>Sandbox</option>
                      <option>Production</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">API Version</label>
                    <select className="w-full p-2 border rounded-md bg-gray-100" disabled>
                      <option>v2.0</option>
                      <option>v1.0</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input 
                    type="password" 
                    className="w-full p-2 border rounded-md bg-gray-100" 
                    placeholder="••••••••••••••••"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Client Certificate</label>
                  <input 
                    type="file" 
                    className="w-full p-2 border rounded-md bg-gray-100" 
                    disabled
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled className="opacity-50" />
                  <label className="text-sm text-gray-600">Enable automatic retry on submission failure</label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input type="checkbox" disabled className="opacity-50" />
                  <label className="text-sm text-gray-600">Send notification emails for submission status</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}