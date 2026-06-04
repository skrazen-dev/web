import { useState, useMemo } from "react";
import {
  Pin, PinOff, Plus, ChevronDown, ChevronUp,
  Building2, CreditCard, Wallet, AlertTriangle,
  CheckCircle2, Clock, Copy, Edit2, Trash2,
  MessageSquare, TrendingUp, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
import { playSoundIf, playPinSound, playUnpinSound, playClickSound, playCopySound } from "@/lib/sound";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// ── Bank icon colors ──────────────────────────────────────────────────────────
// Bank colors with neon glow (inspired by 1581.png Thai bank icons)
const BANK_COLORS: Record<string, { bg: string; text: string; abbr: string; glow: string }> = {
  KBANK: { bg: "#1BA345",  text: "#fff",    abbr: "K",  glow: "rgba(27,163,69,0.6)" },
  SCB:   { bg: "#4E2A84",  text: "#fff",    abbr: "S",  glow: "rgba(78,42,132,0.65)" },
  KTB:   { bg: "#009FDA",  text: "#fff",    abbr: "KT", glow: "rgba(0,159,218,0.6)" },
  BBL:   { bg: "#1E3A8A",  text: "#fff",    abbr: "B",  glow: "rgba(30,58,138,0.65)" },
  BAY:   { bg: "#FDB813",  text: "#1a1a1a", abbr: "BY", glow: "rgba(253,184,19,0.6)" },
  TTB:   { bg: "#F84B1D",  text: "#fff",    abbr: "T",  glow: "rgba(248,75,29,0.6)" },
  GSB:   { bg: "#EB198D",  text: "#fff",    abbr: "G",  glow: "rgba(235,25,141,0.6)" },
  BAAC:  { bg: "#4CAF50",  text: "#fff",    abbr: "A",  glow: "rgba(76,175,80,0.6)" },
  TMB:   { bg: "#003B8E",  text: "#fff",    abbr: "TM", glow: "rgba(0,59,142,0.65)" },
  TISCO: { bg: "#0066B3",  text: "#fff",    abbr: "TI", glow: "rgba(0,102,179,0.6)" },
  KKP:   { bg: "#F5A623",  text: "#fff",    abbr: "KK", glow: "rgba(245,166,35,0.6)" },
  CIMB:  { bg: "#C8102E",  text: "#fff",    abbr: "CI", glow: "rgba(200,16,46,0.6)" },
};

function BankBadge({ bankCode, bankName, size = "md" }: { bankCode: string; bankName: string; size?: "sm" | "md" }) {
  const color = BANK_COLORS[bankCode] || { bg: "#1E293B", text: "#94A3B8", abbr: bankCode.slice(0, 2).toUpperCase(), glow: "rgba(148,163,184,0.3)" };
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div
      className={`${sz} rounded-xl flex items-center justify-center font-bold shrink-0`}
      style={{
        background: `linear-gradient(145deg, ${color.bg} 0%, ${color.bg}cc 100%)`,
        color: color.text,
        border: `1.5px solid ${color.bg}99`,
        boxShadow: `0 0 12px ${color.glow}, 0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)`,
      }}
      title={bankName}
    >
      {color.abbr}
    </div>
  );
}

function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return `${num.slice(0, 3)}-xxx-${num.slice(-4)}`;
}

// ── Risk level badge ──────────────────────────────────────────────────────────
function RiskBadge({ receivedAmount, balance }: { receivedAmount: number; balance: number }) {
  if (balance <= 0) return null;
  const ratio = receivedAmount / balance;
  if (ratio >= 0.9) return (
    <span className="status-pill status-pill-error">
      <span className="w-1 h-1 rounded-full bg-red-400 inline-block shrink-0" style={{ boxShadow: '0 0 4px rgba(239,68,68,0.9)' }} />
      วิกฤต
    </span>
  );
  if (ratio >= 0.7) return (
    <span className="status-pill status-pill-pending">
      <span className="w-1 h-1 rounded-full bg-amber-400 inline-block shrink-0" style={{ boxShadow: '0 0 4px rgba(245,158,11,0.9)' }} />
      เสี่ยงสูง
    </span>
  );
  if (ratio >= 0.5) return (
    <span className="status-pill status-pill-alert">
      <span className="w-1 h-1 rounded-full bg-purple-400 inline-block shrink-0" style={{ boxShadow: '0 0 4px rgba(168,85,247,0.9)' }} />
      ระวัง
    </span>
  );
  return (
    <span className="status-pill status-pill-success">
      <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block shrink-0" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.9)' }} />
      ปลอดภัย
    </span>
  );
}

// ── Add Pin Dialog ────────────────────────────────────────────────────────────
function AddPinDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { settings } = useStore();
  const [accountId, setAccountId] = useState("");
  const [telegramGroup, setTelegramGroup] = useState("");
  const [note, setNote] = useState("");

  const accountsQuery = trpc.accounts.list.useQuery(undefined, { enabled: open });
  const pinMutation = trpc.pinned.pin.useMutation({
    onSuccess: () => {
      playSoundIf(settings.soundEnabled, playPinSound);
      toast.success("ปักหมุดบัญชีสำเร็จ");
      onSuccess();
      onClose();
      setAccountId(""); setTelegramGroup(""); setNote("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !telegramGroup.trim()) return;
    pinMutation.mutate({
      accountId: parseInt(accountId),
      telegramGroup: telegramGroup.trim(),
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] border-[rgba(148,163,184,0.12)] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Pin size={16} className="text-blue-400" />
            ปักหมุดบัญชีใหม่
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">เลือกบัญชี</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-[#1E293B] border-[rgba(148,163,184,0.12)] text-white">
                <SelectValue placeholder="เลือกบัญชีธนาคาร..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1E293B] border-[rgba(148,163,184,0.12)]">
                {accountsQuery.data?.map((acc) => (
                  <SelectItem key={acc.id} value={String(acc.id)} className="text-white">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-medium">{acc.bankName}</span>
                      <span className="text-slate-400 text-xs">{acc.accountName}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">กลุ่ม Telegram</Label>
            <Input
              value={telegramGroup}
              onChange={(e) => setTelegramGroup(e.target.value)}
              placeholder="เช่น กลุ่ม VIP A, กลุ่ม B2"
              className="bg-[#1E293B] border-[rgba(148,163,184,0.12)] text-white placeholder:text-slate-500"
              required
            />
          </div>

          <div>
            <Label className="text-xs text-slate-400 mb-1.5 block">หมายเหตุ (ไม่บังคับ)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
              className="bg-[#1E293B] border-[rgba(148,163,184,0.12)] text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[rgba(148,163,184,0.15)] text-slate-400 hover:text-white"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={!accountId || !telegramGroup.trim() || pinMutation.isPending}
              className="flex-1 btn-primary text-white font-semibold"
            >
              {pinMutation.isPending ? "กำลังปักหมุด..." : "ปักหมุด"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function PinnedAccountsWidget() {
  const { settings } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const pinnedQuery = trpc.pinned.list.useQuery();

  const unpinMutation = trpc.pinned.unpin.useMutation({
    onSuccess: () => {
      playSoundIf(settings.soundEnabled, playUnpinSound);
      toast.success("ถอนหมุดแล้ว");
      utils.pinned.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // จัดกลุ่มตาม telegramGroup
  const groupedPins = useMemo(() => {
    if (!pinnedQuery.data) return {};
    return pinnedQuery.data.reduce<Record<string, typeof pinnedQuery.data>>((acc, pin) => {
      const g = pin.telegramGroup;
      if (!acc[g]) acc[g] = [];
      acc[g].push(pin);
      return acc;
    }, {});
  }, [pinnedQuery.data]);

  const totalPinned = pinnedQuery.data?.length ?? 0;
  const totalBalance = useMemo(() =>
    pinnedQuery.data?.reduce((s, p) => s + parseFloat(p.balance ?? "0"), 0) ?? 0,
    [pinnedQuery.data]
  );

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text).then(() => {
      playSoundIf(settings.soundEnabled, playCopySound);
      setCopiedId(id);
      toast.success("คัดลอกแล้ว");
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleUnpin = (id: number) => {
    playSoundIf(settings.soundEnabled, playClickSound);
    unpinMutation.mutate({ id });
  };

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(236,72,153,0.08) 100%)" }}
          onClick={() => {
            playSoundIf(settings.soundEnabled, playClickSound);
            setExpanded(!expanded);
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20">
              <Pin size={14} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-semibold text-white leading-none">บัญชีที่ปักหมุด</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {totalPinned} บัญชี · วงเงินรวม ฿{money(totalBalance)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playSoundIf(settings.soundEnabled, playClickSound);
                setShowAddDialog(true);
              }}
              className="neon-icon-btn neon-icon-btn-sm"
              title="ปักหมุดบัญชีใหม่"
            >
              <Plus size={13} />
            </button>
            <div className="text-slate-500 transition-transform duration-200" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {expanded && (
          <div className="px-3 pb-3 pt-1 space-y-2">
            {pinnedQuery.isLoading && (
              <div className="space-y-2 py-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-shimmer" />
                ))}
              </div>
            )}

            {!pinnedQuery.isLoading && totalPinned === 0 && (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center mx-auto mb-2">
                  <Pin size={18} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">ยังไม่มีบัญชีปักหมุด</p>
                <button
                  onClick={() => setShowAddDialog(true)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + ปักหมุดบัญชีแรก
                </button>
              </div>
            )}

            {Object.entries(groupedPins).map(([group, pins]) => (
              <div key={group} className="space-y-1.5">
                {/* Group Header */}
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  <MessageSquare size={10} className="text-slate-500" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{group}</span>
                  <div className="flex-1 h-px bg-slate-700/50" />
                  <span className="text-[9px] text-slate-500">{pins.length} บช.</span>
                </div>

                {/* Account Cards */}
                {pins.map((pin, idx) => {
                  const received = parseFloat(pin.receivedAmount ?? "0");
                  const balance = parseFloat(pin.balance ?? "0");
                  const remaining = balance - received;
                  const usedPct = balance > 0 ? Math.min((received / balance) * 100, 100) : 0;
                  const isHighRisk = usedPct >= 70;
                  const isCritical = usedPct >= 90;

                  return (
                    <div
                      key={pin.id}
                      className={`pinned-card rounded-xl p-3 animate-fade-up ${isCritical ? "pinned-card-active" : ""}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Row 1: Bank + Name + Risk */}
                      <div className="flex items-start gap-2.5">
                        <BankBadge bankCode={pin.bankCode} bankName={pin.bankName} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-white font-heading truncate">{pin.accountName}</span>
                            <RiskBadge receivedAmount={received} balance={balance} />
                            {isCritical && (
                              <div className="status-pulse-red w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                            {isHighRisk && !isCritical && (
                              <div className="status-pulse-amber w-1.5 h-1.5 rounded-full bg-amber-500" />
                            )}
                            {!isHighRisk && (
                              <div className="status-pulse-green w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-400">{pin.bankName}</span>
                            <span className="text-[10px] text-slate-600">·</span>
                            <span className="text-[10px] text-slate-400 font-mono">{maskAccountNumber(pin.accountNumber)}</span>
                            <button
                              onClick={() => handleCopy(pin.accountNumber, pin.id)}
                              className="ml-0.5 text-slate-600 hover:text-blue-400 transition-colors active:scale-90"
                              title="คัดลอกเลขบัญชี"
                            >
                              {copiedId === pin.id
                                ? <CheckCircle2 size={10} className="text-emerald-400" />
                                : <Copy size={10} />
                              }
                            </button>
                          </div>
                        </div>

                        {/* Unpin button */}
                        <button
                          onClick={() => handleUnpin(pin.id)}
                          disabled={unpinMutation.isPending}
                          className="neon-icon-btn neon-icon-btn-sm neon-icon-btn-red"
                          title="ถอนหมุด"
                        >
                          <PinOff size={12} />
                        </button>
                      </div>

                      {/* Row 2: Balance progress */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">รับยอดแล้ว</span>
                          <span className={`font-semibold ${isCritical ? "text-red-400" : isHighRisk ? "text-amber-400" : "text-emerald-400"}`}>
                            ฿{money(received)}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${usedPct}%`,
                              background: isCritical
                                ? "linear-gradient(90deg, #EF4444, #F87171)"
                                : isHighRisk
                                ? "linear-gradient(90deg, #F59E0B, #FCD34D)"
                                : "linear-gradient(90deg, #10B981, #34D399)",
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-600">วงเงินคงเหลือ</span>
                          <span className="text-slate-300 font-mono">฿{money(remaining)} / ฿{money(balance)}</span>
                        </div>
                      </div>

                      {/* Row 3: Note */}
                      {pin.note && (
                        <div className="mt-2 px-2 py-1 rounded-lg bg-slate-800/40 text-[10px] text-slate-400">
                          {pin.note}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddPinDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => utils.pinned.list.invalidate()}
      />
    </>
  );
}
