import { CreditCard, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { useStore } from '@/lib/store';
import { money } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';

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
  { name: 'ค่าโฆษณา', amount: 45230, percent: 35, color: '#00D4FF' },
  { name: 'ค่าจ้าง Agent', amount: 32100, percent: 25, color: '#0099CC' },
  { name: 'ค่าระบบ/เครื่องมือ', amount: 25800, percent: 20, color: '#FFD700' },
  { name: 'ค่าขนส่ง', amount: 15400, percent: 12, color: '#10B981' },
  { name: 'อื่นๆ', amount: 10250, percent: 8, color: '#F59E0B' },
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
  
  // Use sample data if no real data
  const totalAccounts = accounts.length || 24;
  const totalPaid = accounts.reduce((s, a) => s + a.paidAmount, 0) || 125450;
  const totalDue = accounts.reduce((s, a) => s + a.dueAmount, 0) || 45230;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) || 170680;

  const maxAmount = Math.max(...MONTHLY_DATA.map(d => d.amount));

  const metrics = [
    { label: 'บัญชีทั้งหมด', value: totalAccounts.toString(), icon: CreditCard, color: '#00D4FF', glowClass: 'metric-glow-cyan' },
    { label: 'จ่ายแล้ว', value: `฿${money(totalPaid)}`, icon: TrendingUp, color: '#10B981', glowClass: 'metric-glow-green' },
    { label: 'ค้างจ่าย', value: `฿${money(totalDue)}`, icon: TrendingDown, color: '#EF4444', glowClass: 'metric-glow-red' },
    { label: 'ค่าใช้จ่ายรวม', value: `฿${money(totalExpenses)}`, icon: Receipt, color: '#FFD700', glowClass: 'metric-glow-gold' },
  ];

  return (
    <div className="animate-fade-up space-y-4 sm:space-y-5">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl p-5 sm:p-6" style={{ background: `url(${HERO_BG}) center/cover no-repeat` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1419]/90 to-[#0F1419]/60" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-[#00D4FF] tracking-[0.2em] uppercase mb-1.5">Overview</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">CE Empire</h2>
          <p className="text-xs text-[#A0A0A0] mt-1">ระบบจัดการบัญชีและค่าใช้จ่ายแบบครบวงจร</p>
        </div>
      </section>

      {/* Metrics Cards */}
      <section className="grid grid-cols-2 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className={`${m.glowClass} bg-[#1A1F26] border-[rgba(255,255,255,0.06)] hover:scale-[1.02] transition-transform duration-200`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-[#A0A0A0] mb-1">{m.label}</p>
                    <p className="text-lg sm:text-xl font-bold tracking-tight text-white">{m.value}</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${m.color}15` }}>
                    <Icon size={18} style={{ color: m.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Bar Chart - Monthly Expenses */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-4">ค่าใช้จ่ายรายเดือน</h3>
          <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: '160px' }}>
            {MONTHLY_DATA.map((d, i) => {
              const heightPercent = (d.amount / maxAmount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-end justify-end h-full">
                  <div className="relative group w-full flex justify-center">
                    <div
                      className="w-[70%] sm:w-[60%] rounded-t-md transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${heightPercent * 1.4}px`,
                        background: `linear-gradient(180deg, #00D4FF 0%, #0099CC 100%)`,
                      }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#242B33] text-[9px] text-white px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                      ฿{d.amount.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-[#A0A0A0] mt-1.5 text-center w-full">{d.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars - Category Distribution */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-4">การกระจายตามหมวดหมู่</h3>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#A0A0A0]">{cat.name}</span>
                  <span className="text-xs font-semibold text-white">฿{cat.amount.toLocaleString()} ({cat.percent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-[#242B33] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-4">รายการล่าสุด</h3>
          <div className="space-y-2">
            {RECENT_TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#242B33]/50 border border-[rgba(255,255,255,0.04)] hover:bg-[#242B33] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${tx.type === 'paid' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{tx.desc}</p>
                  <p className="text-[10px] text-[#A0A0A0]">{tx.bank} • {tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-white">฿{tx.amount.toLocaleString()}</p>
                  <p className={`text-[9px] font-medium ${tx.type === 'paid' ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                    {tx.type === 'paid' ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
