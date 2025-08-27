import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { ChartOfAccount } from '@shared/chart-of-accounts';
import { getVatHint, getCITHint } from '@shared/chart-of-accounts';

interface HintBannerProps {
  account: ChartOfAccount;
}

export function HintBanner({ account }: HintBannerProps) {
  if (!account.notes && account.vatCode === 'STANDARD' && account.citDeductible) {
    return null; // No special hints needed for standard accounts
  }

  const getIconAndColor = () => {
    if (!account.citDeductible || account.vatCode === 'BLOCKED') {
      return { icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' };
    }
    if (account.vatCode === 'EXEMPT') {
      return { icon: Info, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    }
    return { icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' };
  };

  const { icon: Icon, color } = getIconAndColor();

  return (
    <div className={`mt-2 rounded-md border p-3 text-sm ${color}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          {account.notes && (
            <p className="font-medium">{account.notes}</p>
          )}
          
          {account.vatCode === 'EXEMPT' && (
            <p>→ Usually no input VAT is reclaimable.</p>
          )}
          
          {account.vatCode === 'BLOCKED' && (
            <p>→ Input VAT is blocked by FTA; will be set to 0.</p>
          )}
          
          {!account.citDeductible && (
            <p>→ Expense will be added back in the CIT computation.</p>
          )}
          
          {account.vatCode === 'STANDARD' && account.citDeductible && account.notes && (
            <p className="text-green-600">→ Standard deductible expense with 5% VAT.</p>
          )}
        </div>
      </div>
    </div>
  );
}