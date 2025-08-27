import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertTriangle, Shield, Edit, Save, X } from 'lucide-react';

export default function TRNManagement() {
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [trnValue, setTrnValue] = useState(company?.trn || '');

  // UAE TRN validation
  const validateTRN = (trn: string): boolean => {
    // UAE TRN format: 15 digits
    const trnRegex = /^\d{15}$/;
    return trnRegex.test(trn);
  };

  const updateTrnMutation = useMutation({
    mutationFn: async (newTrn: string) => {
      const response = await fetch(`/api/companies/${company?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trn: newTrn }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update TRN');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Success",
        description: "TRN updated successfully",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update TRN",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!validateTRN(trnValue)) {
      toast({
        title: "Invalid TRN",
        description: "TRN must be exactly 15 digits",
        variant: "destructive",
      });
      return;
    }
    updateTrnMutation.mutate(trnValue);
  };

  const handleCancel = () => {
    setTrnValue(company?.trn || '');
    setIsEditing(false);
  };

  const getTrnStatus = () => {
    if (!company?.trn) return 'missing';
    if (validateTRN(company.trn)) return 'valid';
    return 'invalid';
  };

  const trnStatus = getTrnStatus();

  return (
    <div className="space-y-6">
      {/* TRN Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            UAE Tax Registration Number (TRN)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current TRN Display */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {trnStatus === 'valid' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {trnStatus === 'invalid' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                {trnStatus === 'missing' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                
                <div>
                  <div className="font-medium">
                    {trnStatus === 'missing' ? 'No TRN Registered' : 'TRN'}
                  </div>
                  {company?.trn && (
                    <div className="text-lg font-mono">
                      {company.trn.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1-$2-$3-$4-$5')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {trnStatus === 'valid' && (
                  <Badge className="bg-green-100 text-green-800">FTA Registered</Badge>
                )}
                {trnStatus === 'invalid' && (
                  <Badge variant="destructive">Invalid Format</Badge>
                )}
                {trnStatus === 'missing' && (
                  <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                    Registration Required
                  </Badge>
                )}
                
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="trn">Tax Registration Number</Label>
                  <Input
                    id="trn"
                    value={trnValue}
                    onChange={(e) => setTrnValue(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="Enter 15-digit TRN"
                    maxLength={15}
                    className="font-mono"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Format: 15 digits (e.g., 100123456700003)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave}
                    disabled={updateTrnMutation.isPending}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Information Alert */}
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <strong>About TRN:</strong> The Tax Registration Number is required for all UAE businesses 
                engaged in taxable activities. It's used for VAT returns, CIT filings, and all FTA communications.
                Each TRN is unique and consists of exactly 15 digits.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* TRN Features */}
      <Card>
        <CardHeader>
          <CardTitle>TRN Features in Peergos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Automatic Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Appears on all invoices and documents</li>
                <li>• Included in VAT and CIT return submissions</li>
                <li>• Used for FTA API authentication</li>
                <li>• Required for e-invoicing compliance</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Compliance Benefits</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time FTA validation</li>
                <li>• Automatic compliance checking</li>
                <li>• Enhanced document security</li>
                <li>• Simplified audit processes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}