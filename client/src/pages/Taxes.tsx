import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calculator, Building2, AlertCircle } from 'lucide-react';

import VATReturn from './vat';
import CITReturn from './cit';

export default function Taxes() {
  const [activeTab, setActiveTab] = useState('vat');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Tax Compliance</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          Manage your VAT returns, CIT filings, and transfer pricing documentation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-gray-100/70 p-1 rounded-xl h-auto">
          <TabsTrigger value="vat" className="flex items-center gap-1.5 rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">
            <FileText className="h-3.5 w-3.5" /> VAT Return
          </TabsTrigger>
          <TabsTrigger value="cit" className="flex items-center gap-1.5 rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">
            <Calculator className="h-3.5 w-3.5" /> CIT Return
          </TabsTrigger>
          <TabsTrigger value="transfer-pricing" className="flex items-center gap-1.5 rounded-lg text-[13px] data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0A3A5C] data-[state=active]:font-semibold px-4 py-2">
            <Building2 className="h-3.5 w-3.5" /> Transfer Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vat" className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5EAF0]">
            <VATReturn />
          </div>
        </TabsContent>

        <TabsContent value="cit" className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5EAF0]">
            <CITReturn />
          </div>
        </TabsContent>

        <TabsContent value="transfer-pricing">
          <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
            <CardHeader className="px-5 pt-5 pb-3">
              <CardTitle className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                Transfer Pricing Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Alert className="border-[#E5EAF0] bg-[#F6F8FA]">
                <AlertCircle className="h-4 w-4 text-gray-400" />
                <AlertDescription className="text-[13px] text-gray-600">
                  <strong className="text-gray-800">Phase 2 Feature</strong> — Transfer pricing documentation and compliance tools will be available in the next major release, including automated benchmarking, documentation templates, and FTA submission capabilities.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
