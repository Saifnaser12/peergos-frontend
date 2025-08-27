import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calculator, Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Direct imports to avoid suspension issues
import VATReturn from './vat';
import CITReturn from './cit';

export default function Taxes() {
  const [activeTab, setActiveTab] = useState('vat');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Compliance</h1>
        <p className="text-muted-foreground">
          Manage your VAT returns, CIT filings, and transfer pricing documentation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vat" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            VAT Return
          </TabsTrigger>
          <TabsTrigger value="cit" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            CIT Return
          </TabsTrigger>
          <TabsTrigger value="transfer-pricing" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Transfer Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vat" className="space-y-6">
          <div className="bg-white rounded-lg border">
            <VATReturn />
          </div>
        </TabsContent>

        <TabsContent value="cit" className="space-y-6">
          <div className="bg-white rounded-lg border">
            <CITReturn />
          </div>
        </TabsContent>

        <TabsContent value="transfer-pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Transfer Pricing Documentation
              </CardTitle>
              <CardDescription>
                Prepare and manage transfer pricing documentation for related party transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Phase 2 Feature</strong> - Transfer pricing documentation and compliance 
                  tools will be available in the next major release. This will include automated 
                  benchmarking, documentation templates, and FTA submission capabilities.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}