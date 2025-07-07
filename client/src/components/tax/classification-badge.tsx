import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Calculator, 
  TrendingUp, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useTaxClassification } from '@/context/tax-classification-context';
import { formatCurrency } from '@/lib/business-logic';
import { cn } from '@/lib/utils';

interface ClassificationBadgeProps {
  showDetails?: boolean;
  className?: string;
}

export default function ClassificationBadge({ 
  showDetails = false, 
  className 
}: ClassificationBadgeProps) {
  const { classification, isClassified } = useTaxClassification();

  if (!isClassified || !classification) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <AlertTriangle className="h-3 w-3" />
        Not Classified
      </Badge>
    );
  }

  const getBadgeColor = () => {
    switch (classification.category) {
      case 'MICRO':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'SMALL':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'MEDIUM':
        return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
  };

  if (!showDetails) {
    return (
      <Badge className={cn(getBadgeColor(), "gap-1", className)}>
        <Shield className="h-3 w-3" />
        {classification.badge}
      </Badge>
    );
  }

  return (
    <Card className={cn("border-2", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Tax Classification</h3>
          </div>
          <Badge className={getBadgeColor()}>
            {classification.badge}
          </Badge>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">{classification.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calculator className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">CIT Rate</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {classification.citRate}%
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-gray-700">VAT Rate</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {classification.vatRequired ? `${classification.vatRate}%` : 'N/A'}
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="h-3 w-3 text-purple-600" />
                <span className="text-xs font-medium text-gray-700">Basis</span>
              </div>
              <div className="text-sm font-bold text-purple-600">
                {classification.financialBasis}
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-medium text-gray-700">Revenue</span>
              </div>
              <div className="text-xs font-bold text-orange-600">
                {formatCurrency(classification.annualRevenue)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>•</span>
            <span>{classification.citRequired ? 'CIT Registration Required' : 'No CIT Required'}</span>
            <span>•</span>
            <span>{classification.vatRequired ? 'VAT Registration Required' : 'No VAT Required'}</span>
            {classification.transferPricingRequired && (
              <>
                <span>•</span>
                <span>Transfer Pricing Applicable</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}