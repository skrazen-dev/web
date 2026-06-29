import { LayoutDashboard, CreditCard, Receipt, Users, CheckCircle2, Image, X, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { PageId } from '@/lib/types';

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663690140697/LEwiJDTkxh7Zpu9QQSN3Ab/ce-empire-favicon-huVwYnigudxF9CKVaHQtCS.webp';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'บัญชี', icon: CreditCard },
  { id: 'expenses', label: 'ค่าใช้จ่าย', icon: Receipt },
  { id: 'agents', label: 'Agent', icon: Users },
  { id: 'status', label: 'สถานะ', icon: CheckCircle2 },
  { id: 'proof', label: 'หลักฐาน', icon: Image },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { currentPage, setPage } = useStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <nav className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0F1419] border-r border-[rgba(255,255,255,0.08)] p-5 animate-slide-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="CE Empire" className="w-9 h-9 rounded-xl" />
            <div>
              <span className="font-bold text-sm text-white block">CE Empire</span>
              <span className="text-[10px] text-[#A0A0A0]">Banking Dashboard</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1E2730] text-[#A0A0A0] active:scale-95 transition-transform" aria-label="ปิดเมนู">
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); onClose(); }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left w-full active:scale-[0.97]',
                  active
                    ? 'bg-[#1E2730] text-white border border-[#00D4FF]/20'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-[#1E2730]/50 border border-transparent'
                )}
              >
                <Icon size={18} className={active ? 'text-[#00D4FF]' : ''} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grok AI Button */}
        <div className="mt-auto pt-4">
          <button className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF]/10 to-[#0099CC]/10 border border-[#00D4FF]/20 active:scale-[0.97] transition-transform">
            <Sparkles size={16} className="text-[#00D4FF]" />
            <span className="text-sm font-semibold text-[#00D4FF]">Grok AI</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
