import { LayoutDashboard, CreditCard, Receipt, Users, CheckCircle2, Image, DollarSign, Settings, Calculator, ShieldAlert } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { PageId } from '@/lib/types';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'หน้าหลัก', icon: LayoutDashboard },
  { id: 'accounts', label: 'บัญชี', icon: CreditCard },
  { id: 'expenses', label: 'รายจ่าย', icon: Receipt },
  { id: 'agents', label: 'Agent', icon: Users },
  { id: 'status', label: 'สถานะ', icon: CheckCircle2 },
  { id: 'proof', label: 'หลักฐาน', icon: Image },
  { id: 'usdt-calc', label: 'USDT', icon: DollarSign },
  { id: 'bulk-calc', label: 'Bulk', icon: Calculator },
  { id: 'risk-analysis', label: 'เสี่ยง', icon: ShieldAlert },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

export function BottomNav() {
  const { currentPage, setPage } = useStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="glass border-t border-[rgba(255,255,255,0.08)] px-1 py-1.5 safe-area-bottom">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all active:scale-90 min-w-[48px]',
                  active ? 'text-[#00D4FF]' : 'text-[#A0A0A0]'
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span className={cn('text-[9px] font-medium', active ? 'text-[#00D4FF]' : 'text-[#A0A0A0]')}>
                  {item.label}
                </span>
                {active && <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[#00D4FF]" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
