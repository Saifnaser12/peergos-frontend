import { useState, useRef, useEffect } from 'react';
import { X, Send, Star, ThumbsUp, ThumbsDown, Globe, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatAI, type ChatMessage } from '@/hooks/use-chat-ai';
import { useLanguage } from '@/context/language-context';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

export default function ChatModal({ isOpen, onClose, onNewMessage }: ChatModalProps) {
  const [message, setMessage] = useState('');
  const [chatLanguage, setChatLanguage] = useState<'en' | 'ar'>('en');
  const [showRating, setShowRating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { language } = useLanguage();
  const { 
    currentSession, 
    isLoading, 
    createNewSession, 
    sendMessage, 
    rateSession, 
    clearSession 
  } = useChatAI();

  // Initialize session on first open
  useEffect(() => {
    if (isOpen && !currentSession) {
      createNewSession();
    }
  }, [isOpen, currentSession, createNewSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isLoading || !currentSession) return;

    const messageText = message.trim();
    setMessage('');
    
    await sendMessage(messageText, chatLanguage);
    onNewMessage?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRating = (rating: number) => {
    if (currentSession) {
      rateSession(currentSession.id, rating);
      setShowRating(false);
    }
  };

  const handleNewChat = () => {
    clearSession();
    createNewSession();
    setShowRating(false);
  };

  const quickQuestions = {
    en: [
      "What expenses are deductible for VAT?",
      "Do I qualify for 0% Corporate Income Tax?",
      "When are my tax filing deadlines?",
      "How to register for VAT in UAE?",
      "What are the penalties for late filing?"
    ],
    ar: [
      "ما هي المصاريف المخصومة لضريبة القيمة المضافة؟",
      "هل أستحق ضريبة دخل الشركات بنسبة 0%؟",
      "متى مواعيد تقديم الإقرارات الضريبية؟",
      "كيفية التسجيل في ضريبة القيمة المضافة في الإمارات؟",
      "ما هي غرامات التقديم المتأخر؟"
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-2xl h-[600px] mx-4 shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Peergos AI Assistant</CardTitle>
                <p className="text-blue-100 text-sm">UAE Tax Compliance Expert</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <div className="flex items-center gap-1 bg-white/20 rounded-lg p-1">
                <Button
                  variant={chatLanguage === 'en' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setChatLanguage('en')}
                  className={cn(
                    "h-7 text-xs",
                    chatLanguage === 'en' 
                      ? 'bg-white text-blue-600 hover:bg-white/90' 
                      : 'text-white hover:bg-white/10'
                  )}
                >
                  🇬🇧 EN
                </Button>
                <Button
                  variant={chatLanguage === 'ar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setChatLanguage('ar')}
                  className={cn(
                    "h-7 text-xs",
                    chatLanguage === 'ar' 
                      ? 'bg-white text-blue-600 hover:bg-white/90' 
                      : 'text-white hover:bg-white/10'
                  )}
                >
                  🇸🇦 AR
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-full">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {!currentSession?.messages.length ? (
              <div className="space-y-4">
                {/* Welcome Message */}
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {chatLanguage === 'ar' ? 'مرحباً بك في مساعد بيرجوس الذكي!' : 'Welcome to Peergos AI Assistant!'}
                  </h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    {chatLanguage === 'ar' 
                      ? 'أسأل عن أي شيء متعلق بالامتثال الضريبي في دولة الإمارات العربية المتحدة'
                      : 'Ask me anything about UAE tax compliance, VAT, CIT, and FTA regulations'
                    }
                  </p>
                </div>

                {/* Quick Questions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    {chatLanguage === 'ar' ? 'أسئلة شائعة:' : 'Quick Questions:'}
                  </h4>
                  <div className="space-y-2">
                    {quickQuestions[chatLanguage].map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full text-left justify-start h-auto p-3 text-sm"
                        onClick={() => setMessage(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        msg.role === 'user' ? 'prose-invert' : ''
                      )}>
                        {msg.content.split('\n').map((line, index) => (
                          <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                      <div className={cn(
                        "text-xs mt-2 opacity-70",
                        msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      )}>
                        {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm text-gray-600">
                        {chatLanguage === 'ar' ? 'جاري الكتابة...' : 'Typing...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Rating Section */}
          {currentSession?.messages.length > 0 && !currentSession.rating && !isLoading && (
            <div className="border-t p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {chatLanguage === 'ar' ? 'كيف كانت المحادثة؟' : 'How was this conversation?'}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRating(rating)}
                      className="h-8 w-8 p-0 hover:bg-yellow-100"
                    >
                      <Star 
                        size={16} 
                        className="fill-gray-300 text-gray-300 hover:fill-yellow-400 hover:text-yellow-400" 
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4 bg-white">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    chatLanguage === 'ar' 
                      ? 'اسأل عن ضريبة القيمة المضافة، ضريبة دخل الشركات، أو أي سؤال ضريبي...'
                      : 'Ask about VAT, CIT, tax deadlines, or any compliance question...'
                  }
                  className="min-h-[44px] max-h-32 resize-none"
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  className="h-11 w-11 p-0"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="text-xs h-8"
                >
                  {chatLanguage === 'ar' ? 'جديد' : 'New'}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>
                {chatLanguage === 'ar' 
                  ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد'
                  : 'Press Enter to send, Shift+Enter for new line'
                }
              </span>
              <Badge variant="outline" className="text-xs">
                {chatLanguage === 'ar' ? 'مساعد ذكي' : 'AI Assistant'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}