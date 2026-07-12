import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import {
  TrendingUp,
  Receipt,
  Building2,
  ShieldCheck,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatAED(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAEDFull(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── skeleton shimmer ────────────────────────────────────────────────────────

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-gray-200/80', className)} />
  );
}

// ─── chart helpers ───────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_COLORS = [
  '#0A3A5C', '#1E6B9E', '#0E9F6E', '#34D399', '#B45309',
  '#F59E0B', '#7C3AED', '#EC4899',
];

function buildMonthlyData(transactions: any[]): { month: string; revenue: number; expenses: number }[] {
  const now = new Date();
  const result = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      month: MONTH_SHORT[d.getMonth()],
      _year: d.getFullYear(),
      _month: d.getMonth(),
      revenue: 0,
      expenses: 0,
    };
  });

  for (const tx of transactions) {
    const d = new Date(tx.date || tx.transactionDate || tx.createdAt);
    if (isNaN(d.getTime())) continue;
    const slot = result.find(r => r._year === d.getFullYear() && r._month === d.getMonth());
    if (!slot) continue;
    const amt = Math.abs(Number(tx.amount || 0));
    const type = (tx.type || '').toLowerCase();
    if (type === 'income' || type === 'revenue' || type === 'sale') {
      slot.revenue += amt;
    } else if (type === 'expense' || type === 'cost' || type === 'purchase') {
      slot.expenses += amt;
    }
  }

  return result.map(({ month, revenue, expenses }) => ({ month, revenue, expenses }));
}

function buildCategoryData(transactions: any[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const tx of transactions) {
    const type = (tx.type || '').toLowerCase();
    if (type !== 'expense' && type !== 'cost' && type !== 'purchase') continue;
    const cat = tx.category || tx.description?.split(' ')[0] || 'Other';
    map[cat] = (map[cat] || 0) + Math.abs(Number(tx.amount || 0));
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([name, value]) => ({ name, value }));
}

// Custom tooltip for bar chart
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-[#E5EAF0] shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatAED(p.value)}
        </p>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-[#E5EAF0] shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{formatAED(payload[0].value)}</p>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function SimplifiedDashboard() {
  const { company, user } = useAuth();
  const { language } = useLanguage();

  const { data: kpiData = [], isLoading: kpiLoading } = useQuery<any[]>({
    queryKey: ['/api/kpi-data'],
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    enabled: !!company?.id,
  });

  const { data: workflowStatus } = useQuery<any>({
    queryKey: ['/api/workflow-status'],
    enabled: !!company?.id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    enabled: !!company?.id,
  });

  // ── KPI extraction — API returns [{revenue, vatDue, citDue, expenses, ...}]
  const kpi: any = kpiData[0] || {};
  const revenue = parseFloat(kpi.revenue || '0');
  const vatDue  = parseFloat(kpi.vatDue  || '0');
  const citDue  = parseFloat(kpi.citDue  || '0');
  const isCompliant = citDue === 0 && vatDue >= 0;

  // ── Chart data ──────────────────────────────────────────────────────────────
  const monthlyData = buildMonthlyData(transactions);
  const categoryData = buildCategoryData(transactions);

  // ── Workflow / progress ─────────────────────────────────────────────────────
  const progressPct = workflowStatus?.progress ?? 50;
  const progressStep = workflowStatus?.currentStep ?? 2;
  const totalSteps = workflowStatus?.totalSteps ?? 7;

  // ── Next actions ────────────────────────────────────────────────────────────
  const pendingActions = [
    {
      label: 'File VAT Return',
      desc: `VAT of ${formatAEDFull(vatDue)} is due`,
      due: 'Due: 2025-01-28',
      href: '/taxes/vat',
      urgent: true,
    },
    {
      label: 'Review Financial Reports',
      desc: 'Q3 FY 2025-26 reports ready for review',
      due: 'Due: 2026-01-31',
      href: '/financials',
      urgent: false,
    },
  ];

  const today = new Date();

  return (
    <div className="space-y-6">

      {/* ── HERO PANEL ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A3A5C 0%, #0D4A75 100%)' }}
      >
        {/* subtle decorative rings */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.06]"
          style={{ border: '40px solid white' }} />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-[0.04]"
          style={{ border: '28px solid white' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-white/55 text-[13px] font-medium tracking-wide">
              {formatDate(today)}
            </p>
            <h1 className="text-[22px] font-bold mt-1 leading-snug">
              {getGreeting()}, {user?.username || 'there'}
            </h1>
            <p className="text-white/65 text-[14px] mt-0.5">{company?.name}</p>
          </div>
          <div className="flex-shrink-0">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border"
              style={{ borderColor: '#C9A227', color: '#C9A227' }}
            >
              <ShieldCheck size={13} />
              UAE FTA Ready
            </span>
          </div>
        </div>

        {/* 3 mini-stats */}
        <div
          className="relative mt-5 pt-4 grid grid-cols-3 gap-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.10)' }}
        >
          <div>
            <p className="text-white/45 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
              FY Revenue
            </p>
            <p className="text-white font-bold text-[15px] tabular-nums">
              {kpiLoading ? '—' : formatAED(revenue)}
            </p>
          </div>
          <div>
            <p className="text-white/45 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
              Next Deadline
            </p>
            <p className="text-white font-bold text-[15px]">28 Jan 2026</p>
          </div>
          <div>
            <p className="text-white/45 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
              Status
            </p>
            <p className="font-bold text-[15px]" style={{ color: '#0E9F6E' }}>
              Compliant
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-[#E5EAF0] shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Shimmer className="h-3 w-24" />
                  <Shimmer className="h-10 w-10 rounded-xl" />
                </div>
                <Shimmer className="h-8 w-32 mb-2" />
                <Shimmer className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* Annual Revenue */}
            <Card className="rounded-xl border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      Annual Revenue
                    </p>
                    <p className="text-[26px] font-bold text-gray-900 tabular-nums leading-tight mt-1">
                      {formatAEDFull(revenue)}
                    </p>
                    <p className="text-[12px] text-[#0E9F6E] mt-1 font-medium">FY 2025-26</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ backgroundColor: 'rgba(14,159,110,0.10)' }}>
                    <TrendingUp size={20} style={{ color: '#0E9F6E' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VAT Due */}
            <Card className="rounded-xl border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      VAT Due
                    </p>
                    <p className="text-[26px] font-bold text-gray-900 tabular-nums leading-tight mt-1">
                      {formatAEDFull(vatDue)}
                    </p>
                    <p className="text-[12px] text-amber-600 mt-1 font-medium">Due 28 Jan 2026</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ backgroundColor: 'rgba(59,130,246,0.10)' }}>
                    <Receipt size={20} style={{ color: '#2563EB' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CIT Due */}
            <Card className="rounded-xl border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      CIT Due
                    </p>
                    <p className="text-[26px] font-bold text-gray-900 tabular-nums leading-tight mt-1">
                      {formatAEDFull(citDue)}
                    </p>
                    <p className="text-[12px] text-purple-600 mt-1 font-medium">9% Corporate Tax</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ backgroundColor: 'rgba(124,58,237,0.10)' }}>
                    <Building2 size={20} style={{ color: '#7C3AED' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card className="rounded-xl border border-[#E5EAF0] shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                      Compliance
                    </p>
                    <p className="text-[26px] font-bold leading-tight mt-1" style={{ color: '#0E9F6E' }}>
                      Compliant
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1 font-medium">All obligations met</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ backgroundColor: 'rgba(14,159,110,0.10)' }}>
                    <ShieldCheck size={20} style={{ color: '#0E9F6E' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── CHARTS ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses — 2/3 width */}
        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm lg:col-span-2">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Revenue vs Expenses</p>
                <p className="text-[11px] text-gray-400 mt-0.5">12-month rolling</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#0A3A5C' }} />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#93C5FD' }} />
                  Expenses
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {txLoading ? (
              <div className="flex flex-col gap-3 px-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Shimmer key={i} className="h-5" style={{ width: `${60 + i * 7}%` } as any} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <ReTooltip content={<BarTooltip />} cursor={{ fill: '#F6F8FA' }} />
                  <Bar dataKey="revenue" fill="#0A3A5C" radius={[3, 3, 0, 0]} name="Revenue" maxBarSize={28} />
                  <Bar dataKey="expenses" fill="#93C5FD" radius={[3, 3, 0, 0]} name="Expenses" maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense by Category — 1/3 width */}
        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <p className="text-[13px] font-semibold text-gray-900">Expense Breakdown</p>
            <p className="text-[11px] text-gray-400 mt-0.5">By category</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {txLoading ? (
              <div className="flex flex-col gap-3 px-3 mt-2">
                <Shimmer className="h-32 w-32 rounded-full mx-auto" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <Shimmer key={i} className="h-4" />
                ))}
              </div>
            ) : categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-gray-400 text-sm">
                <BarChart3 size={32} className="mb-2 opacity-30" />
                <span>No expense data</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="42%"
                    innerRadius={52}
                    outerRadius={78}
                    dataKey="value"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip content={<DonutTooltip />} />
                  <Legend
                    iconSize={7}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ fontSize: 10, color: '#6B7280' }}>
                        {value.length > 14 ? value.slice(0, 13) + '…' : value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── PROGRESS + ACTIONS + ALERTS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tax Compliance Progress */}
        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Tax Compliance Progress</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Step {progressStep} of {totalSteps}</p>
              </div>
              <span className="text-[22px] font-bold tabular-nums" style={{ color: '#0A3A5C' }}>
                {progressPct}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5EAF0' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(to right, #0A3A5C, #0E9F6E)',
                }}
              />
            </div>
            <div className="flex justify-between mt-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
              <span>Setup</span>
              <span>Data Entry</span>
              <span>Calculations</span>
              <span>Filing</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Actions */}
        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <p className="text-[13px] font-semibold text-gray-900">Next Actions</p>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {pendingActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-[#E5EAF0] hover:border-[#0A3A5C]/20 hover:bg-gray-50/60 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: action.urgent ? '#B45309' : '#0E9F6E' }}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 truncate">{action.label}</p>
                      <p className="text-[11px] text-gray-500 truncate">{action.desc}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{action.due}</p>
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-gray-300 group-hover:text-gray-600 flex-shrink-0 ml-2 transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── TAX ALERTS ──────────────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <Card className="rounded-xl border border-[#E5EAF0] shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <p className="text-[13px] font-semibold text-gray-900 flex items-center gap-2">
              <Bell size={14} className="text-gray-400" />
              Tax Alerts
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {notifications.slice(0, 3).map((n: any, i: number) => (
              <div
                key={i}
                className="p-3 rounded-lg text-[12px]"
                style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}
              >
                <p className="font-semibold text-amber-800">{n.title || 'Reminder'}</p>
                <p className="text-amber-700 mt-0.5">{n.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
