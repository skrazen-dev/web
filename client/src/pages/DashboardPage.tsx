import { CreditCard, TrendingUp, TrendingDown, Receipt, Wallet, Activity } from 'lucide-react';
import { useStore } from '@/lib/store';
import { money } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import PinnedAccountsWidget from '@/components/PinnedAccountsWidget';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663690140697/LEwiJDTkxh7Zpu9QQSN3Ab/ce-empire-dashboard-hero-EsRJuHYLV27xj9LXu6NAhm.webp';

// Sample data for chart
const MONTHLY_DATA = [
  { month: 'ม.ค.', amount: 12500 },
  { month: 'ก.พ.', amount: 18200 },
  { month: 'มี.ค.', amount: 15800 },
  { month: 'เม.ย.', amount: 22400 },
  { month: 'พ.ค.', amount: 19600 },
  { month: 'มิ.ย.', amount: 28900 },
  { month: 'ก.ค.', amount: 24300 },
  { month: 'ส.ค.', amount: 31200 },
  { month: 'ก.ย.', amount: 27500 },
  { month: 'ต.ค.', amount: 35800 },
  { month: 'พ.ย.', amount: 29400 },
  { month: 'ธ.ค.', amount: 42100 },
];

const CATEGORIES = [
  { name: 'ค่าโฆษณา', amount: 45230, percent: 35, color: '#2563EB' },
  { name: 'ค่าจ้าง Agent', amount: 32100, percent: 25, color: '#EC4899' },
  { name: 'ค่าระบบ/เครื่องมือ', amount: 25800, percent: 20, color: '#10B981' },
  { name: 'ค่าขนส่ง', amount: 15400, percent: 12, color: '#F59E0B' },
  { name: 'อื่นๆ', amount: 10250, percent: 8, color: '#00D4FF' },
];

const RECENT_TRANSACTIONS = [
  { id: '1', desc: 'ค่าโฆษณา Facebook', amount: 5500, type: 'paid', date: '04/06/2026', bank: 'กสิกร' },
  { id: '2', desc: 'ค่าจ้าง Agent สมชาย', amount: 8200, type: 'pending', date: '03/06/2026', bank: 'SCB' },
  { id: '3', desc: 'ค่า Server รายเดือน', amount: 2990, type: 'paid', date: '02/06/2026', bank: 'กรุงไทย' },
  { id: '4', desc: 'ค่าโฆษณา TikTok', amount: 12000, type: 'pending', date: '01/06/2026', bank: 'กสิกร' },
  { id: '5', desc: 'ค่าขนส่ง Flash', amount: 3450, type: 'paid', date: '31/05/2026', bank: 'PromptPay' },
];

export default function DashboardPage() {
  const { accounts, expenses } = useStore();

  const totalAccounts = accounts.length || 24;
  const totalPaid = accounts.reduce((s, a) => s + a.paidAmount, 0) || 125450;
  const totalDue = accounts.reduce((s, a) => s + a.dueAmount, 0) || 45230;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) || 170680;

  const maxAmount = Math.max(...MONTHLY_DATA.map(d => d.amount));

  const metrics = [
    {
      label: 'บัญชีทั้งหมด',
      value: totalAccounts.toString(),
      icon: CreditCard,
      color: '#2563EB',
      glowClass: 'metric-glow-blue',
      gradient: 'from-blue-600/20 to-blue-500/5',
    },
    {
      label: 'จ่ายแล้ว',
      value: `฿${money(totalPaid)}`,
      icon: TrendingUp,
      color: '#10B981',
      glowClass: 'metric-glow-green',
      gradient: 'from-emerald-600/20 to-emerald-500/5',
    },
    {
      label: 'ค้างจ่าย',
      value: `฿${money(totalDue)}`,
      icon: TrendingDown,
      color: '#EF4444',
      glowClass: 'metric-glow-red',
      gradient: 'from-red-600/20 to-red-500/5',
    },
    {
      label: 'ค่าใช้จ่ายรวม',
      value: `฿${money(totalExpenses)}`,
      icon: Receipt,
      color: '#F59E0B',
      glowClass: 'metric-glow-amber',
      gradient: 'from-amber-600/20 to-amber-500/5',
    },
  ];

  return (
    <div className="animate-fade-up space-y-4 sm:space-y-5">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden rounded-2xl p-5 sm:p-6" style={{ background: `url(${HERO_BG}) center/cover no-repeat` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1A]/92 via-[#0A0F1A]/70 to-transparent" />
        {/* Decorative blur orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full bg-pink-500/15 blur-2xl" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-blue-400 tracking-[0.22em] uppercase mb-1.5 font-heading">Overview</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">CE Empire</h2>
          <p className="text-xs text-slate-400 mt-1"></p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="status-pulse-green w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-emerald-400 font-medium">ระบบทำงานปกติ</span>
          </div>
        </div>
      </section>

      {/* ── Metrics Cards ── */}
      <section className="grid grid-cols-2 gap-3">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={`${m.glowClass} glass-card rounded-xl p-3.5 animate-fade-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-400 mb-1">{m.label}</p>
                  <p className="text-base sm:text-lg font-bold tracking-tight text-white font-heading">{m.value}</p>
                </div>
                <div
                  className="p-2 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${m.color}25, ${m.color}10)` }}
                >
                  <Icon size={16} style={{ color: m.color }} />
                </div>
              </div>
              {/* Mini accent bar */}
              <div className="mt-2.5 h-0.5 rounded-full opacity-40" style={{ background: `linear-gradient(90deg, ${m.color}, transparent)` }} />
            </div>
          );
        })}
      </section>

      {/* ── Pinned Accounts Widget ── */}
      <section className="animate-fade-up delay-200">
        <PinnedAccountsWidget />
      </section>

      {/* ── Bar Chart - Monthly Expenses ── */}
      <div className="glass-card rounded-2xl animate-fade-up delay-300">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white font-heading">ค่าใช้จ่ายรายเดือน</h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Activity size={10} />
              <span>2026</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: '140px' }}>
            {MONTHLY_DATA.map((d, i) => {
              const heightPercent = (d.amount / maxAmount) * 100;
              const isMax = d.amount === maxAmount;
              return (
                <div key={i} className="flex-1 flex flex-col items-end justify-end h-full">
                  <div className="relative group w-full flex justify-center">
                    <div
                      className="w-[72%] sm:w-[62%] rounded-t-lg transition-all duration-300 hover:opacity-90 hover:scale-x-105"
                      style={{
                        height: `${heightPercent * 1.3}px`,
                        background: isMax
                          ? `linear-gradient(180deg, #EC4899 0%, #DB2777 100%)`
                          : `linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)`,
                        boxShadow: isMax ? '0 0 12px rgba(236,72,153,0.4)' : '0 0 8px rgba(37,99,235,0.3)',
                      }}
                    />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1E293B] border border-[rgba(148,163,184,0.12)] text-[9px] text-white px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-xl">
                      ฿{d.amount.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 mt-1.5 text-center w-full">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Category Distribution ── */}
      <div className="glass-card rounded-2xl animate-fade-up delay-300">
        <div className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white font-heading mb-4">การกระจายตามหมวดหมู่</h3>
          <div className="space-y-3">
            {CATEGORIES.map((cat, i) => (
              <div key={cat.name} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-slate-400">{cat.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">฿{cat.amount.toLocaleString()} <span className="text-slate-500 font-normal">({cat.percent}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${cat.percent}%`,
                      background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="glass-card rounded-2xl animate-fade-up delay-300">
        <div className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white font-heading mb-4">รายการล่าสุด</h3>
          <div className="space-y-2">
            {RECENT_TRANSACTIONS.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30 border border-[rgba(148,163,184,0.06)] hover:bg-slate-800/50 hover:border-[rgba(148,163,184,0.1)] transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tx.type === 'paid' ? '#10B981' : '#F59E0B' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{tx.desc}</p>
                  <p className="text-[10px] text-slate-500">{tx.bank} · {tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-white">฿{tx.amount.toLocaleString()}</p>
                  <p className="text-[9px] font-medium" style={{ color: tx.type === 'paid' ? '#10B981' : '#F59E0B' }}>
                    {tx.type === 'paid' ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
