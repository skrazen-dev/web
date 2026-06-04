import {
  LayoutDashboard, CreditCard, Receipt, Users, CheckCircle2,
  Image, Sparkles, DollarSign, Settings, Calculator, ShieldAlert,
  Home, BarChart2, FileText, Building2, Bell, UserCircle2, Zap
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { PageId } from '@/lib/types';

// Nav items with neon color per icon (inspired by 1580.png Thai UI kit)
const NAV_ITEMS: {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  neonColor: string;
  neonGlow: string;
}[] = [
  { id: 'dashboard',     label: 'หน้าหลัก',     icon: Home,         neonColor: '#60A5FA', neonGlow: 'rgba(37,99,235,0.55)' },
  { id: 'accounts',      label: 'บัญชี',         icon: Building2,    neonColor: '#60A5FA', neonGlow: 'rgba(37,99,235,0.5)' },
  { id: 'expenses',      label: 'ค่าใช้จ่าย',   icon: Receipt,      neonColor: '#F472B6', neonGlow: 'rgba(236,72,153,0.5)' },
  { id: 'agents',        label: 'Agent',          icon: Users,        neonColor: '#34D399', neonGlow: 'rgba(16,185,129,0.5)' },
  { id: 'status',        label: 'สถานะ',         icon: BarChart2,    neonColor: '#60A5FA', neonGlow: 'rgba(37,99,235,0.5)' },
  { id: 'proof',         label: 'หลักฐาน',       icon: FileText,     neonColor: '#FCD34D', neonGlow: 'rgba(245,158,11,0.5)' },
  { id: 'usdt-calc',     label: 'คำนวณ USDT',    icon: DollarSign,   neonColor: '#34D399', neonGlow: 'rgba(16,185,129,0.5)' },
  { id: 'bulk-calc',     label: 'Bulk คำนวณ',    icon: Calculator,   neonColor: '#C4B5FD', neonGlow: 'rgba(139,92,246,0.5)' },
  { id: 'risk-analysis', label: 'ความเสี่ยง',   icon: ShieldAlert,  neonColor: '#F87171', neonGlow: 'rgba(239,68,68,0.5)' },
  { id: 'settings',      label: 'ตั้งค่า',       icon: Settings,     neonColor: '#94A3B8', neonGlow: 'rgba(148,163,184,0.4)' },
];

export function Sidebar() {
  const { currentPage, setPage } = useStore();

  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-[calc(100vh-72px)] sticky top-[72px] py-4 pr-2">
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left w-full relative overflow-hidden',
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              )}
              style={active ? {
                background: `linear-gradient(135deg, rgba(13,24,41,0.95) 0%, rgba(10,16,32,0.9) 100%)`,
                border: `1.5px solid ${item.neonColor}55`,
                boxShadow: `0 0 12px ${item.neonGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
              } : {
                border: '1.5px solid transparent',
              }}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active: left accent bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ background: item.neonColor, boxShadow: `0 0 8px ${item.neonGlow}` }}
                />
              )}

              {/* Icon wrapper with neon glow on active */}
              <span
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 shrink-0',
                  active ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                )}
                style={active ? {
                  background: `${item.neonColor}18`,
                  boxShadow: `0 0 8px ${item.neonGlow}`,
                } : {}}
              >
                <Icon
                  size={15}
                  style={{ color: active ? item.neonColor : 'currentColor' }}
                />
              </span>

              <span className={cn(
                'font-heading text-[13px] tracking-tight transition-colors',
                active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              )}>
                {item.label}
              </span>

              {/* Active: right glow dot */}
              {active && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: item.neonColor,
                    boxShadow: `0 0 6px ${item.neonGlow}`,
                    animation: 'pulse-blue 2s ease-out infinite',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Grok AI button (neon cyan) ── */}
      <div className="mt-auto pt-4">
        <button
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 group"
          style={{
            background: 'linear-gradient(135deg, rgba(13,24,41,0.95) 0%, rgba(10,16,32,0.9) 100%)',
            border: '1.5px solid rgba(0,212,255,0.35)',
            boxShadow: '0 0 12px rgba(0,212,255,0.2), inset 0 1px 0 rgba(0,212,255,0.08)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,212,255,0.4), inset 0 1px 0 rgba(0,212,255,0.12)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(0,212,255,0.2), inset 0 1px 0 rgba(0,212,255,0.08)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.35)';
          }}
        >
          <span
            className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{ background: 'rgba(0,212,255,0.12)', boxShadow: '0 0 8px rgba(0,212,255,0.3)' }}
          >
            <Zap size={14} style={{ color: '#00D4FF' }} />
          </span>
          <span className="text-xs font-bold font-heading" style={{ color: '#00D4FF' }}>Grok AI</span>
          <span
            className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: '#00D4FF', boxShadow: '0 0 6px rgba(0,212,255,0.7)', animation: 'pulse-glow 2s ease-in-out infinite' }}
          />
        </button>
      </div>
    </aside>
  );
}
