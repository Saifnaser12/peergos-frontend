import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Bot, X, Send, Loader2, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isWarning?: boolean;
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    'Hello! I can help with UAE Corporate Tax, VAT, registration thresholds, deadlines and e-invoicing. Ask me in English or Arabic.\n\nأهلاً! يمكنني مساعدتك في ضريبة الشركات الإماراتية، وضريبة القيمة المضافة، وعتبات التسجيل، والمواعيد النهائية والفوترة الإلكترونية.',
};

export function TaxAdvisorWidget() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!user) return null;

  const visibleHistory = messages
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && !m.isWarning))
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...visibleHistory, { role: 'user', content: text }] }),
      });
      const data = await res.json();
      if (data.aiAvailable && data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const fallbackText =
          isRTL
            ? data.fallback?.ar ?? 'المساعد الذكي غير متاح مؤقتًا.'
            : data.fallback?.en ?? 'The AI assistant is temporarily unavailable.';
        setMessages((prev) => [...prev, { role: 'assistant', content: fallbackText, isWarning: true }]);
      }
    } catch {
      const msg = isRTL
        ? 'تعذّر الاتصال بالمساعد الذكي. يرجى المحاولة لاحقًا.'
        : 'Could not reach the AI assistant. Please try again later.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg, isWarning: true }]);
    } finally {
      setLoading(false);
    }
  }

  const title = isRTL ? 'المستشار الضريبي الذكي' : 'AI Tax Advisor';
  const footer = isRTL
    ? 'معلومات عامة فقط — ليست استشارة قانونية أو ضريبية.'
    : 'General information only — not legal or tax advice.';
  const placeholder = isRTL ? 'اكتب سؤالك...' : 'Ask a tax question...';

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={title}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white">
            <Bot className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-sm flex-1">{title}</span>
            <button
              onClick={() => setOpen(false)}
              className="hover:bg-blue-500 rounded-full p-1 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] bg-blue-600 text-white text-sm rounded-2xl rounded-tr-sm px-3 py-2 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                );
              }
              if (msg.isWarning) {
                return (
                  <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{msg.content}</p>
                  </div>
                );
              }
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-tl-sm px-3 py-2 whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer caption */}
          <div className="px-4 py-1 text-center text-[11px] text-gray-400 border-t border-gray-100">
            {footer}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
