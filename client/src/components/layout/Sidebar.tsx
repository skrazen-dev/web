import { LayoutDashboard, CreditCard, Receipt, Users, CheckCircle2, Image, Sparkles, DollarSign, Settings, Calculator, ShieldAlert } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { PageId } from '@/lib/types';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'บัญชี', icon: CreditCard },
  { id: 'expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
  { id: 'agents', label: 'Agent', icon: Users },
  { id: 'status', label: 'สถานะ', icon: CheckCircle2 },
  { id: 'proof', label: 'หลักฐาน', icon: Image },
  { id: 'usdt-calc', label: 'คำนวณ USDT', icon: DollarSign },
  { id: 'bulk-calc', label: 'Bulk คำนวณ', icon: Calculator },
  { id: 'risk-analysis', label: 'ความเสี่ยง', icon: ShieldAlert },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

export function Sidebar() {
  const { currentPage, setPage } = useStore();

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-[calc(100vh-72px)] sticky top-[72px] py-4 pr-2">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left w-full',
                active
                  ? 'bg-[#1E2730] text-white border border-[#00D4FF]/20 shadow-[0_0_10px_rgba(0,212,255,0.08)]'
                  : 'text-[#A0A0A0] hover:text-white hover:bg-[#1E2730]/50 border border-transparent'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} className={active ? 'text-[#00D4FF]' : ''} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4">
        <button className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00D4FF]/10 to-[#0099CC]/10 border border-[#00D4FF]/20 hover:border-[#00D4FF]/40 transition-all group">
          <Sparkles size={16} className="text-[#00D4FF]" />
          <span className="text-xs font-semibold text-[#00D4FF]">Grok AI</span>
        </button>
      </div>
    </aside>
  );
}
