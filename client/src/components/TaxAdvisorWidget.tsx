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
        const fallbackText = isRTL
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
      {/* Floating button — navy with emerald ring on focus */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#0A3A5C' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0D4A75')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0A3A5C')}
        aria-label={title}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-[#E5EAF0] flex flex-col overflow-hidden"
        >
          {/* Header — navy gradient matching sidebar */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0A3A5C 0%, #0D4A75 100%)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(14,159,110,0.25)' }}>
              <Bot className="w-4 h-4" style={{ color: '#0E9F6E' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[13px] leading-tight">{title}</p>
              <p className="text-white/50 text-[10px] leading-tight tracking-wide">PEERGOS · UAE Tax Compliance</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ backgroundColor: '#F6F8FA' }}>
            {messages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div
                      className="max-w-[80%] text-white text-[13px] rounded-2xl rounded-tr-sm px-3 py-2 whitespace-pre-wrap"
                      style={{ backgroundColor: '#0A3A5C' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }
              if (msg.isWarning) {
                return (
                  <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    <p className="text-[13px] text-amber-800">{msg.content}</p>
                  </div>
                );
              }
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[80%] bg-white text-gray-800 text-[13px] rounded-2xl rounded-tl-sm px-3 py-2 whitespace-pre-wrap shadow-sm border border-[#E5EAF0]">
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E5EAF0] rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0A3A5C' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer disclaimer */}
          <div className="px-4 py-1.5 text-center text-[10px] text-gray-400 border-t border-[#E5EAF0]">
            {footer}
          </div>

          {/* Input area */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-[#E5EAF0] bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 text-[13px] border border-[#E5EAF0] rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:border-[#0A3A5C] disabled:opacity-50 bg-[#F6F8FA]"
              style={{ '--tw-ring-color': '#0A3A5C' } as any}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{ backgroundColor: '#0A3A5C' }}
              onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.backgroundColor = '#0D4A75'; }}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0A3A5C')}
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
