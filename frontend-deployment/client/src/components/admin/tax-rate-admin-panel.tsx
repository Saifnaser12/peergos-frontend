import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Shield,
  DollarSign
} from 'lucide-react';
import { UAE_TAX_CONFIG } from '@/constants/taxRates';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

interface TaxRateAdminPanelProps {
  className?: string;
}

export default function TaxRateAdminPanel({ className = '' }: TaxRateAdminPanelProps) {
  const { language } = useLanguage();
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Current tax rates (in a real implementation, these would be fetched from API)
  const [citRates, setCitRates] = useState({
    standardRate: UAE_TAX_CONFIG.CIT.standardRate * 100, // Convert to percentage
    exemptionThreshold: UAE_TAX_CONFIG.CIT.exemptionThreshold,
    freeZoneRate: UAE_TAX_CONFIG.CIT.freeZoneRate * 100,
    smallBusinessReliefThreshold: UAE_TAX_CONFIG.CIT.smallBusinessReliefThreshold,
  });

  const [vatRates, setVatRates] = useState({
    standardRate: UAE_TAX_CONFIG.VAT.standardRate * 100,
    registrationThreshold: UAE_TAX_CONFIG.VAT.registrationThreshold,
    zeroRatedCategories: UAE_TAX_CONFIG.VAT.zeroRatedCategories.join(', '),
    exemptCategories: UAE_TAX_CONFIG.VAT.exemptCategories.join(', '),
  });

  const [freeZoneRules, setFreeZoneRules] = useState({
    qualifyingPersonThreshold: UAE_TAX_CONFIG.FREE_ZONE.qualifyingPersonThreshold,
    qualifyingIncomeRate: UAE_TAX_CONFIG.FREE_ZONE.qualifyingIncomeRate * 100,
    nonQualifyingIncomeRate: UAE_TAX_CONFIG.FREE_ZONE.nonQualifyingIncomeRate * 100,
  });

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would make an API call to update the tax rates
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      console.log('Tax rates updated:', {
        citRates,
        vatRates,
        freeZoneRules
      });
      
      setHasChanges(false);
      
      // Show success message
      alert('Tax rates updated successfully!');
    } catch (error) {
      console.error('Failed to update tax rates:', error);
      alert('Failed to update tax rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChanges = () => {
    setCitRates({
      standardRate: UAE_TAX_CONFIG.CIT.standardRate * 100,
      exemptionThreshold: UAE_TAX_CONFIG.CIT.exemptionThreshold,
      freeZoneRate: UAE_TAX_CONFIG.CIT.freeZoneRate * 100,
      smallBusinessReliefThreshold: UAE_TAX_CONFIG.CIT.smallBusinessReliefThreshold,
    });
    setVatRates({
      standardRate: UAE_TAX_CONFIG.VAT.standardRate * 100,
      registrationThreshold: UAE_TAX_CONFIG.VAT.registrationThreshold,
      zeroRatedCategories: UAE_TAX_CONFIG.VAT.zeroRatedCategories.join(', '),
      exemptCategories: UAE_TAX_CONFIG.VAT.exemptCategories.join(', '),
    });
    setFreeZoneRules({
      qualifyingPersonThreshold: UAE_TAX_CONFIG.FREE_ZONE.qualifyingPersonThreshold,
      qualifyingIncomeRate: UAE_TAX_CONFIG.FREE_ZONE.qualifyingIncomeRate * 100,
      nonQualifyingIncomeRate: UAE_TAX_CONFIG.FREE_ZONE.nonQualifyingIncomeRate * 100,
    });
    setHasChanges(false);
  };

  const updateCitRates = (field: string, value: string | number) => {
    setCitRates(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateVatRates = (field: string, value: string | number) => {
    setVatRates(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateFreeZoneRules = (field: string, value: string | number) => {
    setFreeZoneRules(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            {language === 'ar' ? 'إدارة معدلات الضرائب' : 'Tax Rate Administration'}
          </CardTitle>
          <p className="text-sm text-blue-800">
            {language === 'ar' 
              ? 'إدارة وتحديث معدلات الضرائب وحدود الإعفاء للإمارات العربية المتحدة'
              : 'Manage and update UAE tax rates and exemption thresholds'
            }
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Admin Access Required:</strong> Changes to tax rates require administrator privileges and will affect all system calculations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetChanges}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <Save className="h-3 w-3" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tax Rate Configuration */}
      <Tabs defaultValue="cit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cit" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Corporate Income Tax
          </TabsTrigger>
          <TabsTrigger value="vat" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Value Added Tax
          </TabsTrigger>
          <TabsTrigger value="freezone" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Free Zone Rules
          </TabsTrigger>
        </TabsList>

        {/* CIT Configuration */}
        <TabsContent value="cit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Income Tax Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure CIT rates and thresholds as per Federal Decree-Law No. 47 of 2022
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cit-standard-rate">Standard CIT Rate (%)</Label>
                  <Input
                    id="cit-standard-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={citRates.standardRate}
                    onChange={(e) => updateCitRates('standardRate', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: 9% (standard rate)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cit-exemption-threshold">Small Business Relief Threshold (AED)</Label>
                  <Input
                    id="cit-exemption-threshold"
                    type="number"
                    min="0"
                    value={citRates.exemptionThreshold}
                    onChange={(e) => updateCitRates('exemptionThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: AED 375,000 (0% rate threshold)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cit-freezone-rate">Free Zone CIT Rate (%)</Label>
                  <Input
                    id="cit-freezone-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={citRates.freeZoneRate}
                    onChange={(e) => updateCitRates('freeZoneRate', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: 0% (qualifying free zone persons)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cit-small-business-threshold">Small Business Threshold (AED)</Label>
                  <Input
                    id="cit-small-business-threshold"
                    type="number"
                    min="0"
                    value={citRates.smallBusinessReliefThreshold}
                    onChange={(e) => updateCitRates('smallBusinessReliefThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: AED 375,000 (small business relief)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VAT Configuration */}
        <TabsContent value="vat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Value Added Tax Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure VAT rates and thresholds as per Federal Law No. 8 of 2017
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vat-standard-rate">Standard VAT Rate (%)</Label>
                  <Input
                    id="vat-standard-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={vatRates.standardRate}
                    onChange={(e) => updateVatRates('standardRate', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: 5% (standard rate)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat-registration-threshold">Registration Threshold (AED)</Label>
                  <Input
                    id="vat-registration-threshold"
                    type="number"
                    min="0"
                    value={vatRates.registrationThreshold}
                    onChange={(e) => updateVatRates('registrationThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: AED 375,000 (mandatory registration)</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vat-zero-rated">Zero-Rated Categories</Label>
                  <Input
                    id="vat-zero-rated"
                    value={vatRates.zeroRatedCategories}
                    onChange={(e) => updateVatRates('zeroRatedCategories', e.target.value)}
                    placeholder="exports, education, healthcare..."
                  />
                  <p className="text-xs text-gray-500">Comma-separated list of zero-rated categories</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vat-exempt">Exempt Categories</Label>
                  <Input
                    id="vat-exempt"
                    value={vatRates.exemptCategories}
                    onChange={(e) => updateVatRates('exemptCategories', e.target.value)}
                    placeholder="residential_rent, life_insurance..."
                  />
                  <p className="text-xs text-gray-500">Comma-separated list of exempt categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Free Zone Configuration */}
        <TabsContent value="freezone" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Free Zone Rules Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Configure Free Zone Person qualification rules and rates
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fz-qualifying-threshold">Qualifying Income Threshold (AED)</Label>
                  <Input
                    id="fz-qualifying-threshold"
                    type="number"
                    min="0"
                    value={freeZoneRules.qualifyingPersonThreshold}
                    onChange={(e) => updateFreeZoneRules('qualifyingPersonThreshold', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: AED 3,000,000 (QFZP threshold)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fz-qualifying-rate">Qualifying Income Rate (%)</Label>
                  <Input
                    id="fz-qualifying-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={freeZoneRules.qualifyingIncomeRate}
                    onChange={(e) => updateFreeZoneRules('qualifyingIncomeRate', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: 0% (qualifying income)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fz-non-qualifying-rate">Non-Qualifying Income Rate (%)</Label>
                  <Input
                    id="fz-non-qualifying-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={freeZoneRules.nonQualifyingIncomeRate}
                    onChange={(e) => updateFreeZoneRules('nonQualifyingIncomeRate', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Current: 9% (non-qualifying income)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Current Tax Configuration Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Corporate Income Tax</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Standard Rate:</span>
                  <Badge variant="outline">{citRates.standardRate}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Relief Threshold:</span>
                  <Badge variant="outline">AED {citRates.exemptionThreshold.toLocaleString()}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Value Added Tax</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Standard Rate:</span>
                  <Badge variant="outline">{vatRates.standardRate}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Registration:</span>
                  <Badge variant="outline">AED {vatRates.registrationThreshold.toLocaleString()}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Free Zone</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>QFZP Threshold:</span>
                  <Badge variant="outline">AED {freeZoneRules.qualifyingPersonThreshold.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Qualifying Rate:</span>
                  <Badge variant="outline">{freeZoneRules.qualifyingIncomeRate}%</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}