import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Bell,
  ChevronRight,
  Cpu,
  Crown,
  LineChart,
  Lock,
  Moon,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { CommandCenterBackground } from "@/components/landing/CommandCenterBackground";
import { useCountUp } from "@/hooks/useCountUp";
import { useStore } from "@/lib/store";
import { playWealthChime } from "@/lib/wealthChime";
import { cn } from "@/lib/utils";

/** Live operational figures for the command-center cover (mock telemetry). */
const TELEMETRY = {
  volume: 12_582_450,
  volumeDelta: 18.72,
  profit: 185_920,
  profitDelta: 32.54,
  usdt: 42_590,
  usdtDelta: 21.31,
  ai: { processing: 23, alerts: 3, critical: 0 },
  team: { online: 7, busy: 2, offline: 1 },
  margin: 1.48,
  transactions: 126,
  banks: 8,
  pending: 18,
  slips: 7,
};

const ALERTS = [
  { tone: "gold", text: "SCB · วงเงินใกล้เต็ม 85%", time: "2 นาทีที่แล้ว" },
  { tone: "chrome", text: "รายการรอการตรวจสอบ 7 รายการ", time: "5 นาทีที่แล้ว" },
  { tone: "green", text: "กำไรวันนี้สูงกว่าเป้าหมาย 32%", time: "15 นาทีที่แล้ว" },
];

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

function useThaiClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [now]
  );
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now),
    [now]
  );
  return { date, time };
}

/* ── Left column: live metric card ──────────────────────────── */
function MetricCard({
  icon,
  label,
  prefix,
  suffix,
  value,
  digits,
  delta,
  riseClass,
  arrow,
}: {
  icon: React.ReactNode;
  label: string;
  prefix?: string;
  suffix?: string;
  value: number;
  digits?: number;
  delta: number;
  riseClass: string;
  arrow?: boolean;
}) {
  const animated = useCountUp(value, 1800, 600);
  return (
    <div className={cn("ce-panel ce-panel-hover rounded-2xl p-5", riseClass)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-white/55">
          <span className="ce-gold-text [&>svg]:size-4">{icon}</span>
          <span>{label}</span>
        </div>
        {arrow && <ArrowUpRight className="size-4 text-white/30" />}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-[28px] font-semibold leading-none tracking-tight text-white tabular-nums">
          {prefix}
          {fmt(animated, digits)}
          {suffix && <span className="ml-1 text-lg text-white/60">{suffix}</span>}
        </span>
        <span className="mb-0.5 text-sm font-medium text-emerald-400">
          +{delta}%
        </span>
      </div>
      <div className="mt-2 text-xs text-white/35">เทียบกับเมื่อวาน</div>
    </div>
  );
}

/* ── Center: 7-day profit line chart (SVG) ──────────────────── */
function ProfitChart() {
  const pts = [
    0.18, 0.26, 0.2, 0.34, 0.3, 0.31, 0.44, 0.4, 0.52, 0.48, 0.6, 0.56, 0.68,
    0.64, 0.78, 0.74, 0.86, 0.96,
  ];
  const W = 100;
  const H = 42;
  const coords = pts.map((v, i) => ({
    x: (i / (pts.length - 1)) * W,
    y: H - v * (H - 6) - 3,
  }));
  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = coords[coords.length - 1];

  return (
    <div className="ce-rise-4 relative mt-2 px-2">
      <div className="absolute left-3 top-0 text-xs">
        <div className="text-white/70">กำไรสุทธิ</div>
        <div className="text-white/35">7 วันล่าสุด</div>
      </div>
      <div className="absolute right-3 top-0 text-right text-xs">
        <div className="font-semibold text-emerald-400">+{TELEMETRY.profitDelta}%</div>
        <div className="text-white/35">เทียบกับ 7 วันที่แล้ว</div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="mt-9 h-36 w-full"
      >
        <defs>
          <linearGradient id="ce-profit-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9c7b22" />
            <stop offset="55%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#f5d272" />
          </linearGradient>
          <linearGradient id="ce-profit-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(212,175,55,0.30)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </linearGradient>
        </defs>
        {/* faint vertical gridlines (ticker columns) */}
        {coords.map((c, i) => (
          <line
            key={i}
            x1={c.x}
            y1={c.y}
            x2={c.x}
            y2={H}
            stroke="rgba(212,175,55,0.10)"
            strokeWidth="0.25"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill="url(#ce-profit-fill)" />
        <path
          d={line}
          fill="none"
          stroke="url(#ce-profit-line)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="1.3" fill="#f5d272" />
      </svg>
    </div>
  );
}

/* ── Right: team-online donut ───────────────────────────────── */
function TeamDonut() {
  const { online, busy, offline } = TELEMETRY.team;
  const total = online + busy + offline;
  const R = 30;
  const C = 2 * Math.PI * R;
  const seg = (n: number) => (n / total) * C;
  const gap = 3;
  return (
    <div className="relative grid size-[88px] shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={R} fill="none" stroke="#10b981" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${seg(online) - gap} ${C - seg(online) + gap}`}
          strokeDashoffset={0}
        />
        <circle
          cx="40" cy="40" r={R} fill="none" stroke="#f59e0b" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${seg(busy) - gap} ${C - seg(busy) + gap}`}
          strokeDashoffset={-seg(online)}
        />
        <circle
          cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${seg(offline) - gap} ${C - seg(offline) + gap}`}
          strokeDashoffset={-seg(online) - seg(busy)}
        />
      </svg>
      <div className="absolute text-center leading-none">
        <span className="block text-xl font-bold text-white">{total}</span>
        <span className="block text-[10px] text-white/45">ทั้งหมด</span>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone = "chrome",
}: {
  label: string;
  value: number | string;
  tone?: "gold" | "green" | "chrome" | "amber";
}) {
  const dot =
    tone === "green"
      ? "bg-emerald-400"
      : tone === "amber"
        ? "bg-amber-400"
        : tone === "gold"
          ? "bg-[#d4af37]"
          : "bg-white/40";
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5 text-sm text-white/65">
        <span className={cn("size-2 rounded-full", dot)} />
        {label}
      </div>
      <span className="text-sm font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

export default function Home({ onEnter }: { onEnter?: () => void }) {
  const { date, time } = useThaiClock();
  const soundEnabled = useStore((s) => s.settings.soundEnabled);
  const setPage = useStore((s) => s.setPage);

  // Premium wealth chime — once, only after the user's first click/tap.
  useEffect(() => {
    if (!soundEnabled) return;
    const onFirstGesture = () => playWealthChime();
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, [soundEnabled]);

  const enter = () => {
    setPage("dashboard");
    onEnter?.();
  };

  return (
    <div className="ce-empire relative min-h-screen overflow-hidden font-sans">
      <CommandCenterBackground />
      {/* flowing gold light ribbons (right side) */}
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[60vh] w-[60vw] -rotate-12 rounded-[50%] bg-[radial-gradient(closest-side,rgba(212,175,55,0.12),transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-px w-2/3 origin-right -rotate-6 bg-gradient-to-l from-[#d4af37]/40 via-[#d4af37]/10 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-[58%] h-px w-1/2 origin-right -rotate-3 bg-gradient-to-l from-[#f5d272]/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-5%,transparent_38%,rgba(0,0,0,0.62)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-4 sm:px-6">
        {/* ── Top status bar ───────────────────────────────── */}
        <header className="ce-rise-1 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg ce-panel">
              <Crown className="size-5 ce-gold-text" />
            </span>
            <div className="leading-tight">
              <span className="text-sm font-semibold tracking-[0.16em] text-white">
                CE EMPIRE
              </span>
              <span className="ml-2 text-xs tracking-[0.18em] text-white/40">
                COMMAND CENTER
              </span>
            </div>
            <span className="ml-2 hidden items-center gap-1.5 text-xs text-emerald-400 sm:flex">
              <Activity className="size-3.5 text-white/40" />
              <span className="ce-status-dot size-2 rounded-full bg-emerald-400" />
              ระบบทำงานปกติ
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-xs text-white/55">
              <span>{date}</span>
              <span className="mx-2 text-white/20">|</span>
              <span className="tabular-nums text-white/80">{time}</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
              <Moon className="size-3.5" /> โหมดกลางคืน
            </span>
          </div>
        </header>

        {/* ── Main 3-column command grid ───────────────────── */}
        <div className="grid flex-1 grid-cols-1 gap-4 py-4 lg:grid-cols-12">
          {/* Left column */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <MetricCard
              icon={<TrendingUp />}
              label="มูลค่าการซื้อขายวันนี้"
              prefix="฿ "
              value={TELEMETRY.volume}
              delta={TELEMETRY.volumeDelta}
              riseClass="ce-rise-2"
              arrow
            />
            <MetricCard
              icon={<LineChart />}
              label="กำไรสุทธิวันนี้"
              prefix="฿ "
              value={TELEMETRY.profit}
              delta={TELEMETRY.profitDelta}
              riseClass="ce-rise-3"
            />
            <MetricCard
              icon={<Activity />}
              label="ปริมาณ USDT วันนี้"
              value={TELEMETRY.usdt}
              digits={2}
              suffix="U"
              delta={TELEMETRY.usdtDelta}
              riseClass="ce-rise-4"
            />
            {/* Daily quote */}
            <div className="ce-panel ce-rise-5 flex flex-1 flex-col justify-center rounded-2xl p-5 text-center">
              <div className="text-xs tracking-[0.28em] text-white/35">คำคมประจำวัน</div>
              <div className="mt-3 text-4xl leading-none ce-gold-text">&ldquo;</div>
              <p className="mt-1 text-lg font-semibold text-white">
                วินัยสร้างเงิน
                <br />
                ระบบสร้างอาณาจักร
              </p>
              <div className="mx-auto mt-4 w-10 ce-divider" />
              <p className="mt-4 text-[11px] tracking-[0.3em] ce-gold-text">
                DISCIPLINE CREATES WEALTH
              </p>
            </div>
          </div>

          {/* Center column — hero */}
          <div className="relative flex flex-col items-center lg:col-span-6">
            {/* golden glow behind the wordmark */}
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-[34rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,175,55,0.20),rgba(212,175,55,0.06)_45%,transparent_72%)] blur-[2px]" />
            <Crown className="ce-anim-crown size-14 ce-gold-text drop-shadow-[0_8px_24px_rgba(212,175,55,0.6)] sm:size-16" />
            <h1 className="ce-anim-logo -mt-1 select-none text-[7rem] font-black leading-[0.85] tracking-tight sm:text-[10rem]">
              <span className="ce-chrome-text">CE</span>
            </h1>
            <div className="ce-anim-logo -mt-2 text-3xl font-light tracking-[0.5em] ce-gold-text sm:text-4xl">
              EMPIRE
            </div>
            <div className="ce-rise-2 mt-5 flex w-48 items-center justify-center">
              <span className="ce-divider w-full" />
              <span className="mx-2 size-1 shrink-0 rounded-full bg-[#d4af37]" />
              <span className="ce-divider w-full" />
            </div>
            <h2 className="ce-rise-2 mt-4 text-2xl font-semibold tracking-wide ce-gold-text sm:text-3xl">
              ศูนย์บัญชาการการเงิน
            </h2>
            <p className="ce-rise-3 ce-sheen mt-2 text-[11px] font-medium tracking-[0.4em] text-white/55 sm:text-xs">
              EVERY TRANSACTION BUILDS THE EMPIRE
            </p>

            <ProfitChart />

            <button
              onClick={enter}
              className="ce-cta ce-rise-4 group mt-6 flex w-full max-w-md items-center gap-4 rounded-2xl px-7 py-4"
            >
              <span className="grid size-11 place-items-center rounded-xl border border-[#d4af37]/40 bg-black/40">
                <ShieldCheck className="size-5 ce-gold-text" />
              </span>
              <span className="flex-1 text-center leading-tight">
                <span className="block text-base font-semibold tracking-wide text-white">
                  ENTER COMMAND CENTER
                </span>
                <span className="block text-xs text-white/55">เข้าสู่ศูนย์บัญชาการ</span>
              </span>
              <ArrowRight className="size-5 text-[#d4af37] transition-transform group-hover:translate-x-1" />
            </button>

            {/* marble podium */}
            <div className="ce-rise-5 relative mt-6 h-24 w-full max-w-md">
              {/* cylinder body */}
              <div className="absolute left-1/2 top-3 h-14 w-72 -translate-x-1/2 rounded-[50%/22%] bg-[linear-gradient(180deg,#26282e_0%,#15161a_55%,#0c0c0f_100%)]" />
              {/* top face (marble) with gold rim */}
              <div className="absolute left-1/2 top-1 h-9 w-72 -translate-x-1/2 rounded-[50%] border border-[#d4af37]/45 bg-[radial-gradient(closest-side,#2c2e34,#17181c)] shadow-[0_0_24px_-6px_rgba(212,175,55,0.45)]" />
              <div className="absolute left-1/2 top-[0.85rem] h-6 w-56 -translate-x-1/2 rounded-[50%] border border-white/5 bg-[radial-gradient(closest-side,rgba(212,175,55,0.10),transparent)]" />
              {/* reflection / floor glow */}
              <div className="absolute left-1/2 top-16 h-7 w-80 -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(212,175,55,0.10),transparent)] blur-[3px]" />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            {/* AI system status */}
            <div className="ce-panel ce-panel-hover ce-rise-3 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Cpu className="size-4 ce-gold-text" /> สถานะระบบ AI
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-400">
                <BrainCircuit className="size-4" />
                AI SYSTEM ONLINE
              </div>
              <div className="mt-3">
                <StatusRow label="งานที่กำลังประมวลผล" value={TELEMETRY.ai.processing} tone="gold" />
                <StatusRow label="การแจ้งเตือน" value={TELEMETRY.ai.alerts} tone="amber" />
                <StatusRow label="ปัญหาสำคัญ" value={TELEMETRY.ai.critical} tone="green" />
              </div>
              <div className="mt-2 border-t border-white/[0.06] pt-2 text-right text-[11px] text-white/30">
                อัปเดตล่าสุด {time}
              </div>
            </div>

            {/* Team online */}
            <div className="ce-panel ce-panel-hover ce-rise-4 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Users className="size-4 ce-gold-text" /> ทีมงานออนไลน์
              </div>
              <div className="mt-3 flex items-center gap-4">
                <TeamDonut />
                <div className="flex-1">
                  <StatusRow label="ออนไลน์" value={TELEMETRY.team.online} tone="green" />
                  <StatusRow label="ไม่ว่าง" value={TELEMETRY.team.busy} tone="amber" />
                  <StatusRow label="ออฟไลน์" value={TELEMETRY.team.offline} tone="chrome" />
                </div>
              </div>
            </div>

            {/* News & alerts */}
            <div className="ce-panel ce-panel-hover ce-rise-5 flex flex-1 flex-col rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Bell className="size-4 ce-gold-text" /> ข่าวสาร &amp; การแจ้งเตือน
              </div>
              <div className="mt-3 flex-1 space-y-3">
                {ALERTS.map((a) => (
                  <div key={a.text} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        a.tone === "gold"
                          ? "bg-[#d4af37]"
                          : a.tone === "green"
                            ? "bg-emerald-400"
                            : "bg-sky-400"
                      )}
                    />
                    <div className="flex flex-1 items-start justify-between gap-2">
                      <p className="text-sm text-white/80">{a.text}</p>
                      <p className="shrink-0 text-[11px] text-white/30">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 flex items-center justify-end gap-1 text-xs text-white/45 hover:text-white/70">
                ดูทั้งหมด <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom stat strip ────────────────────────────── */}
        <section className="ce-rise-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] sm:grid-cols-5">
          {[
            { label: "อัตรากำไรเฉลี่ย", value: `${TELEMETRY.margin}%`, gold: true },
            { label: "จำนวนรายการวันนี้", value: `${fmt(TELEMETRY.transactions)} รายการ` },
            { label: "ธนาคารที่ใช้งาน", value: `${TELEMETRY.banks} บัญชี` },
            { label: "งานที่ค้างอยู่", value: `${TELEMETRY.pending} รายการ` },
            { label: "สลิปที่รอตรวจสอบ", value: `${TELEMETRY.slips} รายการ` },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.02] px-4 py-4 text-center">
              <div
                className={cn(
                  "text-lg font-bold tabular-nums",
                  s.gold ? "text-emerald-400" : "text-white"
                )}
              >
                {s.value}
              </div>
              <div className="mt-1 text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-xs text-white/35">
          <div>
            © CE Empire 2024
            <br className="hidden sm:block" /> All Rights Reserved
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="size-3.5" /> ข้อมูลทั้งหมดเข้ารหัสระดับสูง
          </div>
          <div className="text-right ce-gold-text">
            Build an Empire.
            <br /> Leave a Legacy.
          </div>
        </footer>
      </div>
    </div>
  );
}
