import { Search, Bell, Menu } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import { MobileNav } from './MobileNav';

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663690140697/LEwiJDTkxh7Zpu9QQSN3Ab/ce-empire-favicon-huVwYnigudxF9CKVaHQtCS.webp';

export function TopBar() {
  const { searchQuery, setSearchQuery } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full px-3 pt-2">
        <div className="glass rounded-2xl px-3 sm:px-4 py-2.5 flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[#1E2730] text-[#A0A0A0] active:scale-95 transition-transform"
            onClick={() => setMobileNavOpen(true)}
            aria-label="เปิดเมนู"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={LOGO_URL} alt="CE Empire" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white leading-tight">CE Empire</h1>
              <p className="text-[10px] text-[#A0A0A0] font-medium">Banking Dashboard</p>
            </div>
          </div>

          {/* Search - hidden on very small mobile */}
          <div className="flex-1 max-w-md mx-auto hidden sm:block">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
              <input
                type="text"
                placeholder="ค้นหาบัญชี, รายการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-[#1A1F26] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/30 focus:border-[#00D4FF]/50 transition-all"
                aria-label="ค้นหา"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Mobile search icon */}
            <button className="sm:hidden p-2 rounded-lg hover:bg-[#1E2730] text-[#A0A0A0]" aria-label="ค้นหา">
              <Search size={18} />
            </button>
            <button
              className="p-2 rounded-xl hover:bg-[#1E2730] text-[#A0A0A0] hover:text-white transition-colors relative"
              aria-label="การแจ้งเตือน"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#0099CC] flex items-center justify-center text-[#0F1419] text-xs font-bold">
              A
            </div>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
