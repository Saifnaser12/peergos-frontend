import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Scan, Shield, Zap, PenTool, CreditCard } from 'lucide-react';

const roadmapItems = [
  {
    icon: CreditCard,
    title: 'Bank & POS Feeds',
    description: 'Automatic transaction import from banks and payment processors',
    timeline: 'Q4 2025',
    status: 'planned'
  },
  {
    icon: Scan,
    title: 'Invoice Scan & OCR',
    description: 'Upload receipt photos and extract transaction data automatically',
    timeline: 'Q4 2025',
    status: 'planned'
  },
  {
    icon: Shield,
    title: 'UAE Pass SSO',
    description: 'Single sign-on integration with UAE Pass for seamless authentication',
    timeline: 'Q1 2026',
    status: 'planned'
  },
  {
    icon: Zap,
    title: 'FTA Live API',
    description: 'Direct submission to FTA systems with real-time status updates',
    timeline: 'Q1 2026',
    status: 'planned'
  },
  {
    icon: PenTool,
    title: 'E-invoice Signature',
    description: 'Digital signature capabilities for enhanced e-invoicing compliance',
    timeline: 'Q2 2026',
    status: 'planned'
  }
];

export default function ComingSoonPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Product Roadmap</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See what's coming next to Peergos. We're continuously working to add new features 
          that make UAE tax compliance even easier for SMEs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roadmapItems.map((item, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {item.timeline}
                </Badge>
              </div>
              <CardDescription className="mt-2">
                {item.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Stay Updated
          </CardTitle>
          <CardDescription>
            Want to be notified when these features are available? We'll keep you informed 
            about new releases and feature updates through your notification preferences.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}