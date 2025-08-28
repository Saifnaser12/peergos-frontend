import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Smartphone, Database, ExternalLink, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSetup } from '@/context/setup-context';
import { useEffect } from 'react';

const uaeIntegrationSchema = z.object({
  hasUAEPass: z.boolean(),
  uaePassId: z.string().optional(),
  ftaIntegrationConsent: z.boolean(),
  dataProcessingConsent: z.boolean(),
});

type UAEIntegrationData = z.infer<typeof uaeIntegrationSchema>;

export default function UAEIntegrationStep() {
  const { formData, updateFormData } = useSetup();

  const form = useForm<UAEIntegrationData>({
    resolver: zodResolver(uaeIntegrationSchema),
    defaultValues: formData.uaeIntegration || {
      hasUAEPass: false,
      uaePassId: '',
      ftaIntegrationConsent: false,
      dataProcessingConsent: false,
    },
  });

  const { watch, formState: { errors } } = form;
  const watchedValues = watch();

  // Auto-save form data as user types
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateFormData('uaeIntegration', value);
    });
    return () => subscription.unsubscribe();
  }, [form, updateFormData]);

  const canProceed = watchedValues.ftaIntegrationConsent && watchedValues.dataProcessingConsent;

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>UAE Government Integration:</strong> Connect with UAE Pass and FTA systems for seamless 
          compliance and automated reporting. This integration enhances your tax management experience.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UAE Pass Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              UAE Pass Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="hasUAEPass" className="text-base font-medium">
                  Do you have UAE Pass?
                </Label>
                <p className="text-sm text-gray-600">
                  UAE Pass provides secure digital identity for government services
                </p>
              </div>
              <Switch
                id="hasUAEPass"
                checked={watchedValues.hasUAEPass}
                onCheckedChange={(checked) => {
                  form.setValue('hasUAEPass', checked);
                  if (!checked) {
                    form.setValue('uaePassId', '');
                  }
                }}
              />
            </div>

            {watchedValues.hasUAEPass && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="uaePassId">UAE Pass ID (Optional)</Label>
                  <Input
                    id="uaePassId"
                    {...form.register('uaePassId')}
                    placeholder="784-XXXX-XXXXXXX-X"
                  />
                  <p className="text-xs text-gray-600">
                    Your UAE Pass number for enhanced integration
                  </p>
                </div>

                <Alert className="border-green-200 bg-green-50 p-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="text-xs">
                    <strong>UAE Pass Benefits:</strong> Simplified government interactions, 
                    automated data prefilling, and enhanced security for tax submissions.
                  </div>
                </Alert>
              </div>
            )}

            {!watchedValues.hasUAEPass && (
              <Alert className="border-yellow-200 bg-yellow-50 p-3">
                <Info className="h-4 w-4 text-yellow-600" />
                <div className="text-xs space-y-2">
                  <div>
                    <strong>Get UAE Pass:</strong> Download the UAE Pass app and register 
                    for enhanced government service access.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => window.open('https://www.uaepass.ae/', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit UAE Pass
                  </Button>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* FTA Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              FTA System Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Integration Benefits</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Real-time TRN validation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Automated tax return submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Compliance status monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Official FTA correspondence
                  </li>
                </ul>
              </div>

              <Alert className="border-blue-200 bg-blue-50 p-3">
                <Database className="h-4 w-4 text-blue-600" />
                <div className="text-xs">
                  <strong>Secure Integration:</strong> All data exchanges with FTA systems 
                  use encrypted connections and comply with UAE data protection requirements.
                </div>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consent and Terms */}
      <Card className="border-2 border-orange-200 bg-orange-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Required Consents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-white">
              <Checkbox
                id="ftaIntegrationConsent"
                checked={watchedValues.ftaIntegrationConsent}
                onCheckedChange={(checked: boolean) => {
                  form.setValue('ftaIntegrationConsent', checked);
                }}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="ftaIntegrationConsent" 
                  className="text-sm font-medium cursor-pointer"
                >
                  I consent to FTA system integration *
                </Label>
                <p className="text-xs text-gray-600">
                  Allow Peergos to connect with UAE Federal Tax Authority systems for automated 
                  compliance reporting, TRN validation, and tax return submissions on your behalf.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-white">
              <Checkbox
                id="dataProcessingConsent"
                checked={watchedValues.dataProcessingConsent}
                onCheckedChange={(checked: boolean) => {
                  form.setValue('dataProcessingConsent', checked);
                }}
                className="mt-1"
              />
              <div className="space-y-1">
                <Label 
                  htmlFor="dataProcessingConsent" 
                  className="text-sm font-medium cursor-pointer"
                >
                  I consent to secure data processing *
                </Label>
                <p className="text-xs text-gray-600">
                  Authorize secure processing of your business data for tax compliance, 
                  financial reporting, and integration with UAE government systems. 
                  Data is encrypted and stored according to UAE data protection laws.
                </p>
              </div>
            </div>
          </div>

          {!canProceed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Both consents are required to proceed with the setup and ensure proper 
                UAE tax compliance functionality.
              </AlertDescription>
            </Alert>
          )}

          {canProceed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                <strong>Ready to proceed:</strong> All required consents provided. 
                Your setup will include full UAE FTA integration capabilities.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Privacy and Security Information */}
      <Card className="border-gray-200 bg-gray-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Privacy & Security</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• All data is encrypted in transit and at rest using industry-standard AES-256 encryption</p>
                <p>• UAE data residency requirements are fully met with local data storage</p>
                <p>• Access controls ensure only authorized personnel can view your information</p>
                <p>• Regular security audits and compliance checks are performed</p>
                <p>• You maintain full control over your data and can revoke access at any time</p>
              </div>
              <div className="flex gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => {
                    // Open privacy policy
                    console.log('Open privacy policy');
                  }}
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => {
                    // Open terms of service
                    console.log('Open terms of service');
                  }}
                >
                  Terms of Service
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}