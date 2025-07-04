import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calculator, FileText, UserCheck } from 'lucide-react';

export default function Dashboard() {
  const { language } = useLanguage();
  const { company } = useAuth();

  return (
    <div className={cn("space-y-8", language === 'ar' && "rtl:text-right")}>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome to Peergos</h1>
        <p className="text-lg opacity-90">
          Complete UAE Tax Compliance Platform for {company?.name || 'Your Business'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VAT Returns</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CIT Filings</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance</p>
                <p className="text-2xl font-bold">100%</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col space-y-2">
              <Calculator className="h-6 w-6" />
              <span>Calculate VAT</span>
            </Button>
            <Button className="h-20 flex flex-col space-y-2" variant="outline">
              <FileText className="h-6 w-6" />
              <span>Generate Invoice</span>
            </Button>
            <Button className="h-20 flex flex-col space-y-2" variant="outline">
              <TrendingUp className="h-6 w-6" />
              <span>View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>End-to-End Tax Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Complete 8-step process from expense scanning to FTA submission
            </p>
            <Button>Start Workflow</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>UAE Compliance Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Real-time compliance monitoring with FTA integration
            </p>
            <Button variant="outline">View Compliance</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
