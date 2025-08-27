import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface CalculationSummaryData {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  calculatedAt: string;
  method: string;
  isValidated: boolean;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
}

interface CalculationSummaryCardProps {
  calculation: CalculationSummaryData;
  onViewDetails: (id: number) => void;
  onExport?: (id: number) => void;
  showActions?: boolean;
}

export default function CalculationSummaryCard({
  calculation,
  onViewDetails,
  onExport,
  showActions = true
}: CalculationSummaryCardProps) {
  
  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VAT':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'CIT':
        return <Calculator className="h-5 w-5 text-green-600" />;
      case 'WITHHOLDING_TAX':
        return <FileText className="h-5 w-5 text-purple-600" />;
      default:
        return <Calculator className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string, isValidated: boolean) => {
    if (isValidated) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Validated
        </Badge>
      );
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'SUPERSEDED':
        return <Badge variant="secondary">Superseded</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getComplianceBadge = (complianceStatus: string) => {
    switch (complianceStatus) {
      case 'COMPLIANT':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Compliant
          </Badge>
        );
      case 'NON_COMPLIANT':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Non-Compliant
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(calculation.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getTypeIcon(calculation.type)}
            <div>
              <CardTitle className="text-lg font-semibold">
                {calculation.type} Calculation
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {calculation.method}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(calculation.status, calculation.isValidated)}
            {getComplianceBadge(calculation.complianceStatus)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Amount Display */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(calculation.amount, calculation.currency)}
            </div>
            <div className="text-sm text-blue-600">Calculated Amount</div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Calculation ID:</span>
              <div className="font-medium">#{calculation.id}</div>
            </div>
            <div>
              <span className="text-gray-600">Calculated:</span>
              <div className="font-medium">{formatDate(calculation.calculatedAt)}</div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(calculation.id);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
              {onExport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(calculation.id);
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}