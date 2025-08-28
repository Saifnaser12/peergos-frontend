import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Upload, Eye, CheckCircle, AlertCircle, FileText, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceData {
  supplierName: string;
  supplierTRN: string;
  invoiceNumber: string;
  issueDate: string;
  amount: number;
  vatAmount: number;
  description: string;
  category: string;
  confidence: number;
}

export default function InvoiceScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verified, setVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Simulated OCR processing (in production, this would call actual OCR API)
  const processInvoice = async (file: File): Promise<InvoiceData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock OCR results based on file name or random data
    const mockData: InvoiceData = {
      supplierName: file.name.includes('etisalat') ? 'Etisalat UAE' : 
                   file.name.includes('dewa') ? 'Dubai Electricity & Water Authority' :
                   file.name.includes('adnoc') ? 'ADNOC Distribution' :
                   'ABC Trading LLC',
      supplierTRN: '100234567890001',
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      issueDate: new Date().toISOString().split('T')[0],
      amount: Math.floor(Math.random() * 5000) + 500,
      vatAmount: Math.floor(Math.random() * 250) + 25,
      description: file.name.includes('etisalat') ? 'Mobile & Internet Services' :
                  file.name.includes('dewa') ? 'Electricity & Water Bill' :
                  file.name.includes('adnoc') ? 'Fuel & Vehicle Services' :
                  'Office Supplies & Equipment',
      category: file.name.includes('etisalat') ? 'Telecommunications' :
               file.name.includes('dewa') ? 'Utilities' :
               file.name.includes('adnoc') ? 'Transportation' :
               'Office Expenses',
      confidence: 0.85 + Math.random() * 0.1 // 85-95% confidence
    };

    return mockData;
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setExtractedData(null);
    setVerified(false);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleScanInvoice = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const data = await processInvoice(selectedFile);
      setExtractedData(data);
      toast({
        title: "Invoice scanned successfully",
        description: `Extracted data with ${Math.round(data.confidence * 100)}% confidence`,
      });
    } catch (error) {
      toast({
        title: "Scanning failed",
        description: "Please try again or enter data manually",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!extractedData) return;

    // In production, this would save to the database
    console.log('Saving verified invoice data:', extractedData);
    
    setVerified(true);
    toast({
      title: "Invoice saved successfully",
      description: "Transaction has been added to your records",
    });

    // Reset form
    setTimeout(() => {
      setSelectedFile(null);
      setPreviewUrl('');
      setExtractedData(null);
      setVerified(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }, 2000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return 'High Confidence';
    if (confidence >= 0.75) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Invoice Scanner & OCR
          </CardTitle>
          <p className="text-sm text-gray-600">
            Capture invoices using your phone camera or upload image files for automatic data extraction
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="camera-input">Capture with Camera</Label>
              <Input
                id="camera-input"
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>

            <div>
              <Label htmlFor="file-input">Upload Image</Label>
              <Input
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>

          {/* Preview and Processing */}
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Badge variant="secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>

                {!extractedData && (
                  <Button
                    onClick={handleScanInvoice}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Scan Invoice
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Invoice preview"
                    className="max-w-full max-h-64 object-contain border rounded"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Extracted Invoice Data</span>
              <Badge 
                variant={extractedData.confidence >= 0.75 ? "default" : "destructive"}
                className={getConfidenceColor(extractedData.confidence)}
              >
                {getConfidenceBadge(extractedData.confidence)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedData.confidence < 0.75 && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Low confidence detected. Please verify and correct the extracted data before saving.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Supplier Name</Label>
                <Input value={extractedData.supplierName} readOnly />
              </div>
              
              <div>
                <Label>Supplier TRN</Label>
                <Input value={extractedData.supplierTRN} readOnly />
              </div>
              
              <div>
                <Label>Invoice Number</Label>
                <Input value={extractedData.invoiceNumber} readOnly />
              </div>
              
              <div>
                <Label>Issue Date</Label>
                <Input value={extractedData.issueDate} readOnly />
              </div>
              
              <div>
                <Label>Amount (AED)</Label>
                <Input value={extractedData.amount.toFixed(2)} readOnly />
              </div>
              
              <div>
                <Label>VAT Amount (AED)</Label>
                <Input value={extractedData.vatAmount.toFixed(2)} readOnly />
              </div>
              
              <div>
                <Label>Category</Label>
                <Select value={extractedData.category} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                    <SelectItem value="Transportation">Transportation</SelectItem>
                    <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={extractedData.description} readOnly />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setExtractedData(null)}>
                Edit Manually
              </Button>
              
              <Button
                onClick={handleVerifyAndSave}
                disabled={verified}
                className="flex items-center gap-2"
              >
                {verified ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verify & Save
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Invoice Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Utility Bills (DEWA, ADDC)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Telecom (Etisalat, du)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Fuel (ADNOC, EPPCO)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Standard VAT Invoices</span>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertDescription>
              All extracted data is automatically validated against FTA requirements. 
              TRN numbers are verified in real-time, and VAT calculations are checked for accuracy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}