import { useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, BookOpen, Calculator, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your UAE Tax Assistant. I can help you with questions about VAT, Corporate Income Tax, and general tax compliance in the UAE. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { language, t } = useLanguage();

  const quickQuestions = [
    'What is the VAT rate in UAE?',
    'When do I need to register for VAT?',
    'What is the CIT small business relief?',
    'How do I calculate VAT on imports?',
    'What are the CIT filing deadlines?',
    'Do I need transfer pricing documentation?',
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response - in production this would call an AI service
    setTimeout(() => {
      const response = generateResponse(inputMessage);
      const assistantMessage: Message = {
        id: messages.length + 2,
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('vat rate')) {
      return 'The standard VAT rate in the UAE is 5%. This applies to most goods and services. Some items are zero-rated (0%) or exempt from VAT.';
    }
    
    if (lowerQuestion.includes('vat registration')) {
      return 'VAT registration is mandatory if your taxable supplies exceed AED 375,000 in any 12-month period. Voluntary registration is available if your taxable supplies exceed AED 187,500.';
    }
    
    if (lowerQuestion.includes('small business relief') || lowerQuestion.includes('cit relief')) {
      return 'The UAE offers Small Business Relief for Corporate Income Tax. The first AED 375,000 of taxable income is subject to 0% CIT rate. Income above this threshold is taxed at 9%.';
    }
    
    if (lowerQuestion.includes('cit filing') || lowerQuestion.includes('filing deadline')) {
      return 'CIT returns must be filed within 9 months from the end of the tax period. For calendar year companies, this means filing by September 30th of the following year.';
    }
    
    return 'Thank you for your question. This is a complex area of UAE tax law. I recommend consulting with a qualified tax advisor for specific advice related to your situation. You can also refer to the official FTA website for the most current regulations.';
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className={cn("space-y-6", language === 'ar' && "rtl:text-right")}>
      {/* Header */}
      <div className={cn("flex items-center justify-between", language === 'ar' && "rtl:flex-row-reverse")}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Tax Assistant</h1>
          <p className="text-gray-600">Get instant answers to your UAE tax questions</p>
        </div>
        <div className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
          <Bot size={20} className="text-primary-500" />
          <Badge className="bg-primary-100 text-primary-800">Beta</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <Card className="lg:col-span-3 material-elevation-1">
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
              <Bot size={20} />
              Tax Assistant Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === 'user' ? 
                        (language === 'ar' ? "rtl:flex-row-reverse justify-start" : "justify-end") :
                        (language === 'ar' ? "rtl:flex-row-reverse" : "")
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.type === 'user' ? "bg-primary-500" : "bg-gray-200"
                    )}>
                      {message.type === 'user' ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-gray-600" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-xs lg:max-w-md p-3 rounded-lg",
                      message.type === 'user' ? 
                        "bg-primary-500 text-white" : 
                        "bg-gray-100 text-gray-900"
                    )}>
                      <p className="text-sm">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        language === 'ar' && "rtl:text-left"
                      )}>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className={cn("flex gap-3", language === 'ar' && "rtl:flex-row-reverse")}>
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-gray-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className={cn("flex gap-2", language === 'ar' && "rtl:flex-row-reverse")}>
                <Input
                  placeholder="Ask me about UAE tax laws..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Questions */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left justify-start h-auto p-2 text-sm"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Help Topics */}
          <Card className="material-elevation-1">
            <CardHeader>
              <CardTitle className="text-lg">Help Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={cn("flex items-center gap-3 text-sm", language === 'ar' && "rtl:flex-row-reverse")}>
                  <Calculator size={16} className="text-primary-500" />
                  <span>VAT Calculations</span>
                </div>
                <div className={cn("flex items-center gap-3 text-sm", language === 'ar' && "rtl:flex-row-reverse")}>
                  <FileText size={16} className="text-success-500" />
                  <span>CIT Compliance</span>
                </div>
                <div className={cn("flex items-center gap-3 text-sm", language === 'ar' && "rtl:flex-row-reverse")}>
                  <BookOpen size={16} className="text-warning-500" />
                  <span>Registration Requirements</span>
                </div>
                <div className={cn("flex items-center gap-3 text-sm", language === 'ar' && "rtl:flex-row-reverse")}>
                  <FileText size={16} className="text-error-500" />
                  <span>Filing Deadlines</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="material-elevation-1 border-warning-200 bg-warning-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-warning-900 mb-2">Important Notice</h4>
              <p className="text-sm text-warning-700">
                This AI assistant provides general information only. For specific tax advice, 
                please consult with a qualified tax professional or refer to official FTA guidelines.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
