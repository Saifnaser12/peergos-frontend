import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EnhancedButton, PrimaryButton, SecondaryButton, DangerButton } from '@/components/ui/enhanced-button';
import { Typography, PageTitle, SectionTitle, GradientText } from '@/components/ui/enhanced-typography';
import { FadeIn, SlideIn, ScaleIn, StaggeredChildren, HoverLift } from '@/components/ui/animations';
import ExpenseBreakdownChart from '@/components/charts/expense-breakdown-chart';
import TrendAnalysisChart from '@/components/charts/trend-analysis-chart';
import PeriodComparisonChart from '@/components/charts/period-comparison-chart';
import TaxFilingProgressGauge from '@/components/charts/tax-filing-progress-gauge';
import { 
  Download, 
  Upload, 
  Settings, 
  Trash2, 
  Save, 
  Send,
  BarChart3,
  TrendingUp,
  DollarSign
} from 'lucide-react';

// Sample data for charts
const expenseData = [
  { category: 'Office Supplies', amount: 5000, color: '#3b82f6' },
  { category: 'Marketing', amount: 8000, color: '#ef4444' },
  { category: 'Travel', amount: 3000, color: '#22c55e' },
  { category: 'Utilities', amount: 2000, color: '#f59e0b' },
  { category: 'Software', amount: 4500, color: '#8b5cf6' },
  { category: 'Equipment', amount: 7500, color: '#06b6d4' },
];

const trendData = [
  {
    name: 'Revenue',
    data: [
      { label: 'Jan', value: 45000, period: '2024-01' },
      { label: 'Feb', value: 52000, period: '2024-02' },
      { label: 'Mar', value: 48000, period: '2024-03' },
      { label: 'Apr', value: 58000, period: '2024-04' },
      { label: 'May', value: 65000, period: '2024-05' },
      { label: 'Jun', value: 72000, period: '2024-06' },
    ],
    color: '#22c55e',
    fillColor: 'rgba(34, 197, 94, 0.1)'
  },
  {
    name: 'Expenses',
    data: [
      { label: 'Jan', value: 35000, period: '2024-01' },
      { label: 'Feb', value: 38000, period: '2024-02' },
      { label: 'Mar', value: 36000, period: '2024-03' },
      { label: 'Apr', value: 42000, period: '2024-04' },
      { label: 'May', value: 45000, period: '2024-05' },
      { label: 'Jun', value: 48000, period: '2024-06' },
    ],
    color: '#ef4444',
    fillColor: 'rgba(239, 68, 68, 0.1)'
  }
];

const periodData = [
  { period: 'Q1 2024', revenue: 145000, expenses: 109000, profit: 36000, taxes: 7200 },
  { period: 'Q2 2024', revenue: 195000, expenses: 135000, profit: 60000, taxes: 12000 },
  { period: 'Q3 2024', revenue: 210000, expenses: 150000, profit: 60000, taxes: 12000 },
  { period: 'Q4 2024', revenue: 240000, expenses: 165000, profit: 75000, taxes: 15000 },
];

const filingSteps = [
  {
    id: '1',
    name: 'Prepare Financial Statements',
    status: 'completed' as const,
    dueDate: '2024-01-15',
    completedDate: '2024-01-10'
  },
  {
    id: '2',
    name: 'Calculate Corporate Income Tax',
    status: 'completed' as const,
    dueDate: '2024-01-20',
    completedDate: '2024-01-18'
  },
  {
    id: '3',
    name: 'Prepare VAT Return',
    status: 'in_progress' as const,
    dueDate: '2024-01-25'
  },
  {
    id: '4',
    name: 'Submit to FTA',
    status: 'pending' as const,
    dueDate: '2024-01-30'
  },
  {
    id: '5',
    name: 'Pay Tax Liabilities',
    status: 'pending' as const,
    dueDate: '2024-02-05'
  }
];

export default function VisualDesignDemo() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="text-center mb-12">
          <PageTitle gradient>Enhanced Visual Design System</PageTitle>
          <Typography variant="body1" color="secondary" className="max-w-2xl mx-auto">
            Showcasing improved typography, interactive data visualizations, consistent button styling, 
            and engaging animations for better user experience.
          </Typography>
        </div>
      </FadeIn>

      {/* Typography Section */}
      <FadeIn delay={200}>
        <Card className="card-hover">
          <CardHeader>
            <SectionTitle>Enhanced Typography</SectionTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Typography variant="h3" weight="bold" className="mb-4">
                  Hierarchy Example
                </Typography>
                <Typography variant="h4" weight="semibold" className="mb-3">
                  Section Heading
                </Typography>
                <Typography variant="h5" weight="medium" className="mb-2">
                  Subsection Title
                </Typography>
                <Typography variant="body1" className="mb-2">
                  This is body text with improved readability and proper line height.
                </Typography>
                <Typography variant="body2" color="secondary">
                  Secondary text with reduced emphasis for supporting information.
                </Typography>
              </div>
              <div>
                <GradientText variant="h3" className="mb-4">
                  Gradient Headlines
                </GradientText>
                <Typography variant="overline" className="mb-2">
                  Overline Text
                </Typography>
                <Typography variant="caption" color="muted">
                  Caption text for additional context and metadata.
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Button Styles Section */}
      <SlideIn direction="left" delay={400}>
        <Card className="card-hover">
          <CardHeader>
            <SectionTitle>Enhanced Button Styling</SectionTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-4">
                <Typography variant="h6" weight="medium">Primary Actions</Typography>
                <div className="space-y-2">
                  <PrimaryButton icon={<Save />} className="w-full">
                    Save Changes
                  </PrimaryButton>
                  <PrimaryButton icon={<Send />} iconPosition="right" className="w-full">
                    Submit Report
                  </PrimaryButton>
                  <PrimaryButton loading className="w-full">
                    Processing...
                  </PrimaryButton>
                </div>
              </div>
              
              <div className="space-y-4">
                <Typography variant="h6" weight="medium">Secondary Actions</Typography>
                <div className="space-y-2">
                  <SecondaryButton icon={<Download />} className="w-full">
                    Download
                  </SecondaryButton>
                  <SecondaryButton icon={<Upload />} iconPosition="right" className="w-full">
                    Upload File
                  </SecondaryButton>
                  <SecondaryButton icon={<Settings />} className="w-full">
                    Settings
                  </SecondaryButton>
                </div>
              </div>
              
              <div className="space-y-4">
                <Typography variant="h6" weight="medium">Danger Actions</Typography>
                <div className="space-y-2">
                  <DangerButton icon={<Trash2 />} className="w-full">
                    Delete Item
                  </DangerButton>
                  <EnhancedButton variant="destructive" icon={<Trash2 />} className="w-full">
                    Remove All
                  </EnhancedButton>
                </div>
              </div>
              
              <div className="space-y-4">
                <Typography variant="h6" weight="medium">Enhanced Effects</Typography>
                <div className="space-y-2">
                  <EnhancedButton gradient icon={<BarChart3 />} className="w-full">
                    View Report
                  </EnhancedButton>
                  <EnhancedButton gradient variant="outline" icon={<TrendingUp />} className="w-full">
                    Analytics
                  </EnhancedButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SlideIn>

      {/* Data Visualizations Section */}
      <StaggeredChildren delay={600} stagger={200}>
        <Card className="card-hover">
          <CardHeader>
            <SectionTitle>Interactive Data Visualizations</SectionTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HoverLift>
                <ExpenseBreakdownChart data={expenseData} />
              </HoverLift>
              <HoverLift>
                <TaxFilingProgressGauge steps={filingSteps} period="Q1 2024" />
              </HoverLift>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <TrendAnalysisChart series={trendData} title="Revenue vs Expenses Trend" />
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <PeriodComparisonChart data={periodData} comparisonMode="quarter" />
          </CardContent>
        </Card>
      </StaggeredChildren>

      {/* Animation Examples */}
      <FadeIn delay={1000}>
        <Card className="card-hover">
          <CardHeader>
            <SectionTitle>Animation & Micro-interactions</SectionTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <FadeIn delay={0}>
                  <div className="p-6 bg-blue-50 rounded-lg mb-4">
                    <DollarSign className="h-12 w-12 mx-auto text-blue-600 animate-float" />
                  </div>
                  <Typography variant="h6" weight="medium">Fade In Animation</Typography>
                  <Typography variant="body2" color="secondary">
                    Smooth fade transitions for better content presentation
                  </Typography>
                </FadeIn>
              </div>
              
              <div className="text-center">
                <SlideIn direction="left" delay={200}>
                  <div className="p-6 bg-green-50 rounded-lg mb-4">
                    <TrendingUp className="h-12 w-12 mx-auto text-green-600 animate-pulse-subtle" />
                  </div>
                  <Typography variant="h6" weight="medium">Slide Animation</Typography>
                  <Typography variant="body2" color="secondary">
                    Directional slides for dynamic content entry
                  </Typography>
                </SlideIn>
              </div>
              
              <div className="text-center">
                <ScaleIn delay={400}>
                  <div className="p-6 bg-purple-50 rounded-lg mb-4 interactive">
                    <BarChart3 className="h-12 w-12 mx-auto text-purple-600" />
                  </div>
                  <Typography variant="h6" weight="medium">Scale & Hover Effects</Typography>
                  <Typography variant="body2" color="secondary">
                    Interactive scaling for engaging user feedback
                  </Typography>
                </ScaleIn>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Design Principles */}
      <FadeIn delay={1200}>
        <Card className="card-hover">
          <CardHeader>
            <SectionTitle>Design Principles Implemented</SectionTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Typography variant="h4" weight="bold" color="primary">1</Typography>
                </div>
                <Typography variant="h6" weight="semibold" className="mb-2">Consistency</Typography>
                <Typography variant="body2" color="secondary">
                  Unified button styles, typography, and color palette throughout the application
                </Typography>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Typography variant="h4" weight="bold" color="success">2</Typography>
                </div>
                <Typography variant="h6" weight="semibold" className="mb-2">Clarity</Typography>
                <Typography variant="body2" color="secondary">
                  Clear visual hierarchy with improved typography and readable content structure
                </Typography>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Typography variant="h4" weight="bold" className="text-purple-600">3</Typography>
                </div>
                <Typography variant="h6" weight="semibold" className="mb-2">Engagement</Typography>
                <Typography variant="body2" color="secondary">
                  Subtle animations and micro-interactions for enhanced user engagement
                </Typography>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Typography variant="h4" weight="bold" className="text-amber-600">4</Typography>
                </div>
                <Typography variant="h6" weight="semibold" className="mb-2">Accessibility</Typography>
                <Typography variant="body2" color="secondary">
                  Proper contrast ratios, readable fonts, and interactive feedback for all users
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}