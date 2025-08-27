import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  FileText, 
  Camera, 
  Clock, 
  User,
  CheckCircle,
  AlertTriangle,
  Building2,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '@/lib/business-logic';
import { ProcessedExpenseData } from './expense-scanner';

interface ExpenseAuditTrailProps {
  expenses: ProcessedExpenseData[];
  onViewOriginal: (expense: ProcessedExpenseData) => void;
  className?: string;
}

export default function ExpenseAuditTrail({ 
  expenses, 
  onViewOriginal, 
  className = '' 
}: ExpenseAuditTrailProps) {
  const [selectedExpense, setSelectedExpense] = useState<ProcessedExpenseData | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-3 w-3" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  const downloadExpenseData = (expense: ProcessedExpenseData) => {
    const auditData = {
      timestamp: new Date().toISOString(),
      originalFile: {
        name: expense.originalFile.name,
        size: expense.originalFile.size,
        type: expense.originalFile.type,
      },
      extractedData: expense.extractedData,
      businessRules: expense.businessRules,
      finalData: expense.finalData,
      auditInfo: {
        ocrConfidence: expense.extractedData.confidence,
        categoryConfidence: expense.businessRules.confidence,
        manualOverrides: [], // Would track any manual edits
      }
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-audit-${expense.finalData.supplierName}-${expense.finalData.date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Expense Audit Trail
        </CardTitle>
        <p className="text-sm text-gray-600">
          Complete record of scanned expenses with original documents and AI processing details
        </p>
      </CardHeader>
      
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No scanned expenses yet</p>
            <p className="text-sm text-gray-400">Upload receipts to see audit trail</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense, index) => (
              <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {expense.finalData.supplierName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {expense.finalData.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(expense.finalData.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(expense.finalData.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-purple-100 text-purple-800">
                          {expense.businessRules.category}
                        </Badge>
                        
                        <Badge className={getConfidenceColor(expense.extractedData.confidence)}>
                          {getConfidenceIcon(expense.extractedData.confidence)}
                          <span className="ml-1">
                            {Math.round(expense.extractedData.confidence * 100)}% OCR
                          </span>
                        </Badge>
                        
                        <Badge className={getConfidenceColor(expense.businessRules.confidence)}>
                          {getConfidenceIcon(expense.businessRules.confidence)}
                          <span className="ml-1">
                            {Math.round(expense.businessRules.confidence * 100)}% Category
                          </span>
                        </Badge>

                        {expense.finalData.vatEligible && (
                          <Badge className="bg-green-100 text-green-800">
                            VAT Eligible
                          </Badge>
                        )}

                        {expense.extractedData.trn && (
                          <Badge className="bg-blue-100 text-blue-800">
                            TRN Verified
                          </Badge>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Net Amount:</span>
                          <p className="font-medium">{formatCurrency(expense.finalData.netAmount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">VAT Amount:</span>
                          <p className="font-medium">{formatCurrency(expense.finalData.vatAmount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Invoice #:</span>
                          <p className="font-medium">{expense.finalData.invoiceNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">TRN:</span>
                          <p className="font-medium font-mono text-xs">
                            {expense.finalData.trn || 'Not detected'}
                          </p>
                        </div>
                      </div>

                      {/* Original File Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                        <Camera className="h-3 w-3" />
                        <span>Original: {expense.originalFile.name}</span>
                        <span>•</span>
                        <span>{(expense.originalFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>Scanned: {new Date().toLocaleDateString()}</span>
                      </div>

                      {/* AI Processing Details */}
                      {expense.businessRules.keywords.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">AI Keywords Matched:</span> {expense.businessRules.keywords.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOriginal(expense)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadExpenseData(expense)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedExpense === expense && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Raw OCR Data */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Raw OCR Data</h4>
                          <div className="bg-gray-50 rounded p-3 text-xs space-y-1">
                            <div><strong>Supplier:</strong> {expense.extractedData.supplierName}</div>
                            <div><strong>Amount:</strong> {expense.extractedData.totalAmount || 'Not detected'}</div>
                            <div><strong>VAT:</strong> {expense.extractedData.vatAmount || 'Not detected'}</div>
                            <div><strong>Date:</strong> {expense.extractedData.invoiceDate || 'Not detected'}</div>
                            <div><strong>Currency:</strong> {expense.extractedData.currency || 'AED'}</div>
                          </div>
                        </div>

                        {/* Business Rules Applied */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Business Rules Applied</h4>
                          <div className="bg-blue-50 rounded p-3 text-xs space-y-1">
                            <div><strong>Category:</strong> {expense.businessRules.category}</div>
                            <div><strong>VAT Treatment:</strong> {expense.businessRules.vatEligible ? 'Eligible' : 'Exempt'}</div>
                            <div><strong>Confidence:</strong> {Math.round(expense.businessRules.confidence * 100)}%</div>
                            {expense.businessRules.keywords.length > 0 && (
                              <div><strong>Keywords:</strong> {expense.businessRules.keywords.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Toggle Details */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedExpense(selectedExpense === expense ? null : expense)}
                      className="text-xs"
                    >
                      {selectedExpense === expense ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}