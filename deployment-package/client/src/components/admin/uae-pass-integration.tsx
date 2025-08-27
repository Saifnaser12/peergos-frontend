import { useState } from 'react';
import { Shield, User, Key, Clock, CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UAEPassUser {
  id: string;
  emiratesId: string;
  fullNameAr: string;
  fullNameEn: string;
  email?: string;
  phoneNumber?: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  profilePicture?: string;
  isVerified: boolean;
  lastLogin?: string;
  connectedAt: string;
}

interface UAEPassConfig {
  isEnabled: boolean;
  clientId?: string;
  environment: 'sandbox' | 'production';
  autoUserCreation: boolean;
  requireVerification: boolean;
  allowedNationalities: string[];
}

export function UAEPassIntegration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch UAE Pass configuration
  const { data: uaePassConfig, refetch: refetchConfig } = useQuery<UAEPassConfig>({
    queryKey: ['/api/admin/uae-pass/config'],
    staleTime: 60 * 1000,
  });

  // Fetch UAE Pass connected users
  const { data: uaePassUsers = [] } = useQuery<UAEPassUser[]>({
    queryKey: ['/api/admin/uae-pass/users'],
    staleTime: 30 * 1000,
  });

  // Test UAE Pass connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/uae-pass/test-connection', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "UAE Pass Connection Test",
        description: data.success ? "Connection successful!" : "Connection failed - check configuration",
        variant: data.success ? "default" : "destructive"
      });
      refetchConfig();
    },
    onError: () => {
      toast({
        title: "Connection Test Failed",
        description: "Unable to test UAE Pass integration",
        variant: "destructive"
      });
    }
  });

  // Mock UAE Pass login simulation
  const mockLoginMutation = useMutation({
    mutationFn: async () => {
      // Simulate UAE Pass OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { 
        success: Math.random() > 0.2, // 80% success rate
        user: {
          emiratesId: '784-1985-' + Math.floor(Math.random() * 9999999).toString().padStart(7, '0'),
          fullNameEn: 'Ahmad Ali Mohammed',
          fullNameAr: 'أحمد علي محمد',
          email: 'ahmad.ali@example.ae',
          nationality: 'UAE',
          isVerified: true
        }
      };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "UAE Pass Login Simulation",
          description: "Mock user authentication successful",
          variant: "default"
        });
      } else {
        toast({
          title: "UAE Pass Login Failed",
          description: "User cancelled or authentication failed",
          variant: "destructive"
        });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">UAE Pass Integration</h3>
          <p className="text-gray-600 mt-1">Single Sign-On integration with UAE Pass digital identity</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => mockLoginMutation.mutate()}
            disabled={mockLoginMutation.isPending}
            variant="outline"
            size="sm"
          >
            {mockLoginMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <User className="w-4 h-4 mr-2" />
            )}
            Test Login
          </Button>
          
          <Button
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            variant="outline"
            size="sm"
          >
            {testConnectionMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>
      </div>

      {/* Coming Soon Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Coming Soon:</strong> UAE Pass integration is currently under development. 
          All functionality below is for testing and demonstration purposes only.
        </AlertDescription>
      </Alert>

      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">UAE Pass SSO</span>
              <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                Coming Soon
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Environment</span>
                <span className="font-medium">{uaePassConfig?.environment || 'Sandbox'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Auto User Creation</span>
                <span className="font-medium">{uaePassConfig?.autoUserCreation ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Verification Required</span>
                <span className="font-medium">{uaePassConfig?.requireVerification ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Connected Users</span>
                <span className="font-medium">{uaePassUsers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              User Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mock Login Button */}
            <div className="space-y-3">
              <Button 
                className="w-full opacity-60 pointer-events-none" 
                disabled
                variant="outline"
              >
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzAwODA0MCIvPgo8cGF0aCBkPSJNMTIgN0w5IDEySDEyTDE1IDEySDE4TDE1IDE3SDEyTDkgMTdINkw5IDEySDZMOSA3SDEyWiIgZmlsbD0iIzAwNDA0MCIvPgo8L3N2Zz4K"
                  alt="UAE Pass"
                  className="w-5 h-5 mr-2"
                />
                Login with UAE Pass (Coming Soon)
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Secure authentication using Emirates ID digital identity
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Mock Login for Testing</h4>
              <Button
                onClick={() => mockLoginMutation.mutate()}
                disabled={mockLoginMutation.isPending}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                {mockLoginMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Simulate UAE Pass Login
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            UAE Pass Connected Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uaePassUsers.length > 0 ? (
            <div className="space-y-3">
              {uaePassUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full" />
                        ) : (
                          <User className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{user.fullNameEn}</h4>
                        <p className="text-sm text-gray-600">{user.fullNameAr}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.isVerified && (
                        <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {user.nationality}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Emirates ID:</span> {user.emiratesId}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {user.email || 'Not provided'}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {user.phoneNumber || 'Not provided'}
                    </div>
                    <div>
                      <span className="font-medium">Connected:</span> {new Date(user.connectedAt).toLocaleDateString()}
                    </div>
                    {user.lastLogin && (
                      <div className="col-span-2">
                        <span className="font-medium">Last Login:</span> {new Date(user.lastLogin).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No UAE Pass users connected</p>
              <p className="text-xs text-gray-500">Users will appear here once UAE Pass integration is active</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              UAE Pass configuration will be available once the integration is live. 
              Contact UAE Pass support for client credentials and integration approval.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4 opacity-60 pointer-events-none">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Environment</Label>
                <select className="w-full mt-1 p-2 border rounded-md bg-gray-100" disabled>
                  <option>Sandbox</option>
                  <option>Production</option>
                </select>
              </div>
              <div>
                <Label>Client ID</Label>
                <input 
                  type="text" 
                  className="w-full mt-1 p-2 border rounded-md bg-gray-100" 
                  placeholder="UAE Pass Client ID"
                  disabled
                />
              </div>
            </div>
            
            <div>
              <Label>Client Secret</Label>
              <input 
                type="password" 
                className="w-full mt-1 p-2 border rounded-md bg-gray-100" 
                placeholder="••••••••••••••••"
                disabled
              />
            </div>
            
            <div>
              <Label>Redirect URI</Label>
              <input 
                type="url" 
                className="w-full mt-1 p-2 border rounded-md bg-gray-100" 
                placeholder="https://your-domain.com/auth/uaepass/callback"
                disabled
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-create user accounts</Label>
                  <p className="text-xs text-gray-500">Automatically create accounts for new UAE Pass users</p>
                </div>
                <Switch disabled />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Emirates ID verification</Label>
                  <p className="text-xs text-gray-500">Only allow verified Emirates ID holders</p>
                </div>
                <Switch disabled />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable single sign-out</Label>
                  <p className="text-xs text-gray-500">Log out from UAE Pass when logging out locally</p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Resources & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">UAE Pass Developer Portal</h4>
              <p className="text-sm text-gray-600">Official documentation and integration guides</p>
              <Button variant="ghost" size="sm" className="h-8 px-2 opacity-60 pointer-events-none">
                <ExternalLink className="w-3 h-3 mr-1" />
                Visit Portal
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Integration Support</h4>
              <p className="text-sm text-gray-600">Technical support for UAE Pass integration</p>
              <Button variant="ghost" size="sm" className="h-8 px-2 opacity-60 pointer-events-none">
                <ExternalLink className="w-3 h-3 mr-1" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}