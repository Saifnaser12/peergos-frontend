import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Users, Building2, Palette, Globe, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('company');
  const { user, company } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Company settings form state
  const [companySettings, setCompanySettings] = useState({
    name: company?.name || '',
    trn: company?.trn || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    industry: company?.industry || '',
    freeZone: company?.freeZone || false,
    vatRegistered: company?.vatRegistered || false,
    primaryColor: company?.primaryColor || '#1976d2',
    language: company?.language || 'en',
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (updates: Partial<typeof companySettings>) => {
      const response = await apiRequest('PATCH', `/api/companies/${company?.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Company settings have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveCompanySettings = () => {
    updateCompanyMutation.mutate(companySettings);
  };

  // Check if user has admin role
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to access the administration panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600">Manage system settings and configurations</p>
        </div>
        <Badge className="bg-primary-100 text-primary-800">Admin Panel</Badge>
      </div>

      {/* Main Content */}
      <Card className="material-elevation-1">
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="company" className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <Building2 size={16} />
                Company
              </TabsTrigger>
              <TabsTrigger value="appearance" className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <Palette size={16} />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="localization" className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <Globe size={16} />
                Localization
              </TabsTrigger>
              <TabsTrigger value="users" className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <Users size={16} />
                Users
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="company" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="trn">Tax Registration Number (TRN)</Label>
                      <Input
                        id="trn"
                        value={companySettings.trn}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, trn: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={companySettings.industry}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, industry: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Tax Settings</h3>
                  <div className="space-y-4">
                    <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                      <div>
                        <Label>VAT Registration</Label>
                        <p className="text-sm text-gray-500">Enable if company is registered for VAT</p>
                      </div>
                      <Switch
                        checked={companySettings.vatRegistered}
                        onCheckedChange={(checked) => setCompanySettings(prev => ({ ...prev, vatRegistered: checked }))}
                      />
                    </div>
                    <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                      <div>
                        <Label>Free Zone Entity</Label>
                        <p className="text-sm text-gray-500">Enable if company operates in a UAE free zone</p>
                      </div>
                      <Switch
                        checked={companySettings.freeZone}
                        onCheckedChange={(checked) => setCompanySettings(prev => ({ ...prev, freeZone: checked }))}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveCompanySettings} disabled={updateCompanyMutation.isPending}>
                  {updateCompanyMutation.isPending ? 'Saving...' : 'Save Company Settings'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Brand Customization</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className={cn("flex items-center gap-3 mt-2", language === 'ar' && "rtl:flex-row-reverse")}>
                        <Input
                          id="primary-color"
                          type="color"
                          value={companySettings.primaryColor}
                          onChange={(e) => setCompanySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-20 h-10"
                        />
                        <Input
                          value={companySettings.primaryColor}
                          onChange={(e) => setCompanySettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        This color will be used throughout the application interface
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Logo Upload</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Upload your company logo</p>
                    <p className="text-sm text-gray-500">SVG, PNG, or JPG (max 2MB)</p>
                    <Button variant="outline" className="mt-4">
                      Choose File
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSaveCompanySettings} disabled={updateCompanyMutation.isPending}>
                  Save Appearance Settings
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="localization" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Language & Region</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="default-language">Default Language</Label>
                      <select
                        id="default-language"
                        value={companySettings.language}
                        onChange={(e) => setCompanySettings(prev => ({ ...prev, language: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="en">English</option>
                        <option value="ar">العربية (Arabic)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Currency & Format</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Default Currency</Label>
                      <Input value="AED (UAE Dirham)" disabled />
                      <p className="text-sm text-gray-500 mt-1">Currency cannot be changed for UAE entities</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveCompanySettings} disabled={updateCompanyMutation.isPending}>
                  Save Localization Settings
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              <div className="space-y-6">
                <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                  <h3 className="text-lg font-medium">User Management</h3>
                  <Button>
                    <Users size={16} className={cn("mr-2", language === 'ar' && "rtl:mr-0 rtl:ml-2")} />
                    Add User
                  </Button>
                </div>

                <Card className="border">
                  <CardContent className="p-6">
                    <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
                      <div className={cn("flex items-center gap-4", language === 'ar' && "rtl:flex-row-reverse")}>
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{user?.firstName} {user?.lastName}</h4>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      <div className={cn("flex items-center gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                        <Badge className="bg-primary-100 text-primary-800">{user?.role}</Badge>
                        <Badge className="bg-success-100 text-success-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">User Roles</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Admin:</strong> Full system access and configuration</div>
                    <div><strong>Accountant:</strong> Financial management and tax filing</div>
                    <div><strong>Assistant:</strong> Data entry and basic reporting</div>
                    <div><strong>SME Client:</strong> View-only access to reports and filings</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
