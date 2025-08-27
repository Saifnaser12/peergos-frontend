import { useState } from 'react';
import { HelpCircle, X, Lightbulb, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HelpContent {
  title: string;
  description: string;
  tips: string[];
  requirements?: string[];
  commonIssues?: string[];
}

interface ContextualHelpProps {
  module: string;
  step?: string;
  className?: string;
}

const helpContent: { [key: string]: HelpContent } = {
  'setup': {
    title: 'Initial Setup Guide',
    description: 'Configure your company details and tax settings for UAE FTA compliance.',
    tips: [
      'Ensure your TRN (Tax Registration Number) is valid and active',
      'Select the correct business activity code from FTA approved list',
      'Free Zone companies have different tax obligations',
      'Set up your accounting period to match FTA requirements'
    ],
    requirements: [
      'Valid UAE Trade License',
      'Tax Registration Number (TRN)',
      'Business bank account details',
      'Authorized signatory information'
    ],
    commonIssues: [
      'TRN format validation errors - ensure 15 digits',
      'Business activity mismatch with trade license',
      'Incorrect Free Zone selection'
    ]
  },
  'accounting': {
    title: 'Transaction Recording',
    description: 'Record all business transactions accurately for proper tax calculation.',
    tips: [
      'Categorize expenses correctly for CIT deductions',
      'Separate VAT-exempt and VAT-able transactions',
      'Upload supporting documents for each transaction',
      'Review transactions before finalizing monthly records'
    ],
    requirements: [
      'Original invoices and receipts',
      'Bank statements for verification',
      'Proper transaction categorization',
      'Valid supplier/customer information'
    ],
    commonIssues: [
      'Missing VAT information on invoices',
      'Incorrect expense categorization',
      'Duplicate transaction entries'
    ]
  },
  'tax-calculations': {
    title: 'Tax Calculations',
    description: 'Generate accurate VAT and CIT calculations based on your transactions.',
    tips: [
      'Review all transactions before calculating',
      'Check for Small Business Relief eligibility',
      'Verify Free Zone exemptions if applicable',
      'Double-check input tax credit claims'
    ],
    requirements: [
      'Complete transaction records',
      'Valid VAT invoices for input tax',
      'Proper expense categorization',
      'Supporting documentation'
    ],
    commonIssues: [
      'Input tax without valid tax invoices',
      'Incorrect VAT rate application',
      'Missing Small Business Relief claims'
    ]
  },
  'reports': {
    title: 'Financial Reports',
    description: 'Generate comprehensive reports for tax compliance and business analysis.',
    tips: [
      'Review all figures before generating final reports',
      'Ensure consistency with tax calculations',
      'Include all required FTA schedules',
      'Save reports in approved formats'
    ],
    requirements: [
      'Completed tax calculations',
      'Reviewed transaction data',
      'Management approval',
      'Digital signatures where required'
    ],
    commonIssues: [
      'Report figures not matching tax calculations',
      'Missing mandatory schedules',
      'Incorrect reporting period'
    ]
  },
  'filing': {
    title: 'FTA Filing',
    description: 'Submit your tax returns to the UAE Federal Tax Authority.',
    tips: [
      'File before the deadline (28th of next month)',
      'Ensure all supporting documents are attached',
      'Keep copies of submitted returns',
      'Monitor filing status in FTA portal'
    ],
    requirements: [
      'Approved financial reports',
      'Valid digital certificate',
      'All supporting documents',
      'Payment arrangements if tax due'
    ],
    commonIssues: [
      'Certificate expiry during filing',
      'Missing mandatory attachments',
      'Late filing penalties'
    ]
  }
};

export function ContextualHelp({ module, step, className }: ContextualHelpProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const content = helpContent[module];
  
  if (!content) {
    return null;
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={cn("flex items-center gap-2", className)}
      >
        <HelpCircle className="w-4 h-4" />
        Help
      </Button>
    );
  }

  return (
    <Card className={cn("w-80 max-w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            {content.title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{content.description}</p>
        
        {/* Tips */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-medium">Tips</h4>
          </div>
          <ul className="space-y-1">
            {content.tips.map((tip, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        {content.requirements && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <h4 className="text-sm font-medium">Requirements</h4>
            </div>
            <ul className="space-y-1">
              {content.requirements.map((req, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Issues */}
        {content.commonIssues && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="text-sm font-medium">Common Issues</h4>
            </div>
            <ul className="space-y-1">
              {content.commonIssues.map((issue, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}