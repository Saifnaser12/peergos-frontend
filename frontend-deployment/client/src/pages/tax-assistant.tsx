import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import DeductionWizard from '@/components/tax-optimization/deduction-wizard';
import SmartExpenseTracker from '@/components/tax-optimization/smart-expense-tracker';
import TaxHealthChecker from '@/components/tax-optimization/tax-health-checker';
import { 
  Brain, 
  Calculator, 
  TrendingUp, 
  Target, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  PieChart,
  FileText,
  Calendar,
  Zap,
  Star,
  Shield,
  Bot,
  Send,
  MessageCircle,
  Info
} from 'lucide-react';

interface TaxInsight {
  type: 'opportunity' | 'warning' | 'info';
  title: string;
  description: string;
  impact: number;
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
}

interface ChatMessage {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TaxAssistant() {
  const { user, company } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your UAE Tax Assistant. I can help you with questions about VAT, Corporate Income Tax, and general tax compliance in the UAE. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch business data for analysis
  const { data: kpiData } = useQuery({
    queryKey: ['/api/kpi-data'],
    enabled: !!company?.id
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!company?.id
  });

  // Calculate key metrics
  const currentData = Array.isArray(kpiData) && kpiData.length > 0 ? kpiData[0] : null;
  const revenue = currentData?.revenue || 0;
  const expenses = currentData?.expenses || 0;
  const netIncome = revenue - expenses;
  const vatDue = currentData?.vatDue || 0;
  const citDue = currentData?.citDue || 0;

  // Smart tax insights based on business data
  const generateTaxInsights = (): TaxInsight[] => {
    const insights: TaxInsight[] = [];

    // Revenue threshold insights
    if (revenue > 350000 && revenue < 375000) {
      insights.push({
        type: 'warning',
        title: 'Approaching VAT Registration Threshold',
        description: 'You are close to the AED 375,000 VAT registration threshold. Plan for potential VAT obligations.',
        impact: 18750, // 5% of threshold
        priority: 'high',
        actionRequired: true
      });
    }

    if (revenue > 375000 && vatDue === 0) {
      insights.push({
        type: 'warning',
        title: 'VAT Registration Required',
        description: 'Your revenue exceeds AED 375k. You must register for VAT and file quarterly returns.',
        impact: revenue * 0.05,
        priority: 'high',
        actionRequired: true
      });
    }

    // Expense optimization opportunities
    if (revenue > 0 && (expenses / revenue) < 0.3) {
      insights.push({
        type: 'opportunity',
        title: 'Expense Optimization Opportunity',
        description: 'Your expense ratio is low. Consider reviewing deductible business expenses to optimize your tax position.',
        impact: revenue * 0.1,
        priority: 'medium',
        actionRequired: false
      });
    }

    // CIT threshold insights
    if (revenue > 3000000) {
      insights.push({
        type: 'info',
        title: 'Transfer Pricing Requirements',
        description: 'As your revenue exceeds AED 3M, ensure transfer pricing documentation is maintained for related party transactions.',
        impact: 0,
        priority: 'medium',
        actionRequired: true
      });
    }

    // Cash flow insights
    if (netIncome < 0) {
      insights.push({
        type: 'opportunity',
        title: 'Loss Carry Forward Benefit',
        description: 'Current year losses can be carried forward to offset future profits for up to 20 years in UAE.',
        impact: Math.abs(netIncome) * 0.09,
        priority: 'medium',
        actionRequired: false
      });
    }

    // Quarterly filing reminders
    const currentMonth = new Date().getMonth() + 1;
    if ([3, 6, 9, 12].includes(currentMonth)) {
      insights.push({
        type: 'warning',
        title: 'Quarterly Filing Due',
        description: 'VAT return filing is due this month. Ensure all transactions are recorded and reviewed.',
        impact: 0,
        priority: 'high',
        actionRequired: true
      });
    }

    return insights;
  };

  const taxInsights = generateTaxInsights();
  const highPriorityInsights = taxInsights.filter(insight => insight.priority === 'high');
  const totalPotentialSavings = taxInsights.reduce((sum, insight) => sum + insight.impact, 0);

  // Handle AI chat functionality
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: chatMessages.length + 2,
        type: 'assistant',
        content: getAIResponse(inputMessage),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getAIResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('vat rate') || lowerQ.includes('vat percentage')) {
      return 'The UAE VAT rate is 5% on most goods and services. Some items are zero-rated (like basic food items) or exempt (like healthcare and education).';
    }
    
    if (lowerQ.includes('vat registration') || lowerQ.includes('register for vat')) {
      return 'You must register for VAT if your annual taxable supplies exceed AED 375,000. You can voluntarily register if your supplies are between AED 187,500 and AED 375,000.';
    }
    
    if (lowerQ.includes('cit') || lowerQ.includes('corporate income tax')) {
      return 'UAE Corporate Income Tax rate is 9% for businesses with profits above AED 375,000. Small Business Relief provides 0% rate for the first AED 375,000 of profits.';
    }
    
    if (lowerQ.includes('deadline') || lowerQ.includes('filing')) {
      return 'VAT returns are due 28 days after the end of each tax period. CIT returns are due within 9 months of your financial year-end.';
    }
    
    return 'Thank you for your question about UAE tax matters. For specific advice tailored to your situation, I recommend consulting with a qualified tax professional or reviewing the official FTA guidelines. Is there a particular aspect of UAE taxation you\'d like to know more about?';
  };

  const quickQuestions = [
    'What is the VAT rate in UAE?',
    'When do I need to register for VAT?', 
    'What is the CIT small business relief?',
    'What are the CIT filing deadlines?',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Tax Assistant</h1>
          <p className="text-gray-600">Smart tax optimization and compliance guidance for UAE SMEs</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          Powered by AI
        </Badge>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Compliance Score</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {highPriorityInsights.length === 0 ? '95%' : '75%'}
            </p>
            <p className="text-sm text-green-600">
              {highPriorityInsights.length === 0 ? 'Excellent' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Tax Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {revenue > 375000 ? '9%' : '0%'}
            </p>
            <p className="text-sm text-blue-600">
              CIT + {revenue > 375000 ? '5%' : '0%'} VAT
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Savings Potential</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              AED {Math.round(totalPotentialSavings).toLocaleString()}
            </p>
            <p className="text-sm text-purple-600">Annual optimization</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Action Items</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {taxInsights.filter(i => i.actionRequired).length}
            </p>
            <p className="text-sm text-orange-600">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Alerts */}
      {highPriorityInsights.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Urgent Tax Matters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPriorityInsights.map((insight, index) => (
              <Alert key={index} className="border-red-200 bg-white">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-red-900">{insight.title}</strong>
                      <p className="text-red-700">{insight.description}</p>
                    </div>
                    {insight.impact > 0 && (
                      <Badge variant="destructive">
                        AED {insight.impact.toLocaleString()} impact
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">Smart Insights</span>
            <span className="md:hidden">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">Health Check</span>
            <span className="md:hidden">Health</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">Ask AI</span>
            <span className="md:hidden">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="deductions" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">Tax Optimizer</span>
            <span className="md:hidden">Optimizer</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">Smart Tracking</span>
            <span className="md:hidden">Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">Tax Planning</span>
            <span className="md:hidden">Planning</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI-Powered Tax Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taxInsights.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellent Tax Health!</h3>
                  <p className="text-gray-600">No urgent tax matters detected. Your business is well-positioned for optimal tax efficiency.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {taxInsights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'opportunity' ? 'border-green-200 bg-green-50' :
                        insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {insight.type === 'opportunity' ? (
                            <Lightbulb className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : insight.type === 'warning' ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                          )}
                          <div>
                            <h4 className={`font-semibold ${
                              insight.type === 'opportunity' ? 'text-green-900' :
                              insight.type === 'warning' ? 'text-yellow-900' :
                              'text-blue-900'
                            }`}>
                              {insight.title}
                            </h4>
                            <p className={`text-sm ${
                              insight.type === 'opportunity' ? 'text-green-700' :
                              insight.type === 'warning' ? 'text-yellow-700' :
                              'text-blue-700'
                            }`}>
                              {insight.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`${
                            insight.priority === 'high' ? 'border-red-300 text-red-700' :
                            insight.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-green-300 text-green-700'
                          }`}>
                            {insight.priority} priority
                          </Badge>
                          {insight.impact > 0 && (
                            <p className="text-sm font-semibold text-gray-900 mt-1">
                              AED {insight.impact.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <TaxHealthChecker
            revenue={revenue}
            expenses={expenses}
            vatDue={vatDue}
            citDue={citDue}
            hasValidLicense={true}
            lastFilingDate={new Date().toISOString()}
          />
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Ask AI Tax Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quick Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question)}
                      className="text-left justify-start h-auto p-3 text-wrap"
                    >
                      {question}
                    </Button>
                  ))}
                </div>

                {/* Chat Messages */}
                <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-3">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.type === 'assistant' && <Bot className="h-4 w-4" />}
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs opacity-70">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about UAE tax regulations..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Disclaimer */}
                <Alert className="border-amber-200 bg-amber-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-amber-700">
                    This AI assistant provides general information only. For specific tax advice, 
                    please consult with a qualified tax professional or refer to official FTA guidelines.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <DeductionWizard 
            revenue={revenue} 
            expenses={expenses} 
            businessType={company?.industry || 'service'} 
          />
        </TabsContent>

        <TabsContent value="expenses">
          <SmartExpenseTracker />
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Strategic Tax Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Annual Tax Calendar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">2025 Tax Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-sm">Q1 VAT Return</span>
                      <Badge variant="outline">Apr 28</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-sm">Q2 VAT Return</span>
                      <Badge variant="outline">Jul 28</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-sm">Q3 VAT Return</span>
                      <Badge variant="outline">Oct 28</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-sm">Annual CIT Return</span>
                      <Badge variant="outline">Dec 31</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Year-End Planning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-white rounded">
                      <h4 className="font-medium mb-2">Equipment Purchases</h4>
                      <p className="text-sm text-gray-600">
                        Consider accelerated depreciation for new equipment purchases before year-end.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded">
                      <h4 className="font-medium mb-2">Expense Timing</h4>
                      <p className="text-sm text-gray-600">
                        Defer income and accelerate deductible expenses where possible.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded">
                      <h4 className="font-medium mb-2">Retirement Planning</h4>
                      <p className="text-sm text-gray-600">
                        Maximize contributions to approved pension schemes for additional deductions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Projected Tax Liability */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg">2025 Tax Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Projected Revenue</p>
                      <p className="text-2xl font-bold text-purple-700">
                        AED {(revenue * 1.1).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">10% growth assumed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Estimated CIT</p>
                      <p className="text-2xl font-bold text-blue-700">
                        AED {revenue > 375000 ? Math.round((revenue * 1.1 - expenses) * 0.09).toLocaleString() : '0'}
                      </p>
                      <p className="text-xs text-gray-500">9% on taxable income</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Tax Burden</p>
                      <p className="text-2xl font-bold text-red-700">
                        AED {revenue > 375000 ? Math.round(((revenue * 1.1 - expenses) * 0.09) + (revenue * 1.1 * 0.05)).toLocaleString() : '0'}
                      </p>
                      <p className="text-xs text-gray-500">CIT + VAT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}