import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatNumber } from '@/lib/format';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: typeof ShieldCheck }> = {
  low: { label: 'ต่ำ', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', icon: ShieldCheck },
  medium: { label: 'ปานกลาง', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', icon: AlertTriangle },
  high: { label: 'สูง', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', icon: ShieldAlert },
  critical: { label: 'วิกฤต', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', icon: ShieldAlert },
};

const RISK_TYPE_LABEL: Record<string, string> = {
  balance_utilization: 'วงเงินคงเหลือ',
  order_frequency: 'ความถี่ออเดอร์',
  time_overlap: 'เวลาซ้อนทับ',
  daily_volume: 'ยอดสะสมรายวัน',
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = LEVEL_CONFIG[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      <cfg.icon size={12} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score, level }: { score: number; level: RiskLevel }) {
  const cfg = LEVEL_CONFIG[level];
  const barColor = level === 'critical' ? 'bg-red-500' : level === 'high' ? 'bg-orange-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#1E2730] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${cfg.color}`}>{score}</span>
    </div>
  );
}

// ─── Add Order Modal ──────────────────────────────────────────────────────────

function AddOrderModal({
  accountId,
  accountName,
  onClose,
  onSuccess,
}: {
  accountId: number;
  accountName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [telegramGroup, setTelegramGroup] = useState('');
  const [note, setNote] = useState('');

  const addOrder = trpc.risk.addOrder.useMutation({
    onSuccess: (data) => {
      if (data.risk && data.risk.shouldNotify) {
        toast.warning(`⚠️ ความเสี่ยง ${data.risk.overallLevel.toUpperCase()} — ${data.risk.recommendation}`, {
          duration: 8000,
        });
      } else {
        toast.success('เพิ่มออเดอร์สำเร็จ');
      }
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('กรุณาระบุยอดออเดอร์ที่ถูกต้อง');
      return;
    }
    addOrder.mutate({
      accountId,
      orderAmount: amountNum,
      scheduledAt: new Date(date),
      telegramGroup: telegramGroup || undefined,
      note: note || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-[#2A3441]">
          <h3 className="text-white font-bold text-lg">เพิ่มออเดอร์ใหม่</h3>
          <p className="text-[#A0A0A0] text-sm mt-0.5">{accountName}</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-[#A0A0A0] mb-1.5 block">ยอดออเดอร์ (บาท) *</label>
            <Input
              type="number"
              placeholder="เช่น 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#0F1419] border-[#2A3441] text-white"
            />
          </div>
          <div>
            <label className="text-xs text-[#A0A0A0] mb-1.5 block">เวลาที่ออเดอร์จะเข้า *</label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#0F1419] border-[#2A3441] text-white"
            />
          </div>
          <div>
            <label className="text-xs text-[#A0A0A0] mb-1.5 block">กลุ่ม Telegram (ถ้ามี)</label>
            <Input
              placeholder="เช่น @mygroup"
              value={telegramGroup}
              onChange={(e) => setTelegramGroup(e.target.value)}
              className="bg-[#0F1419] border-[#2A3441] text-white"
            />
          </div>
          <div>
            <label className="text-xs text-[#A0A0A0] mb-1.5 block">หมายเหตุ</label>
            <Input
              placeholder="หมายเหตุเพิ่มเติม"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-[#0F1419] border-[#2A3441] text-white"
            />
          </div>
        </div>
        <div className="p-5 border-t border-[#2A3441] flex gap-3">
          <Button variant="outline" className="flex-1 border-[#2A3441] text-[#A0A0A0]" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            className="flex-1 bg-[#00D4FF] hover:bg-[#00B8D9] text-black font-semibold"
            onClick={handleSubmit}
            disabled={addOrder.isPending}
          >
            {addOrder.isPending ? 'กำลังบันทึก...' : 'บันทึกและวิเคราะห์'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Risk Card ────────────────────────────────────────────────────────

function AccountRiskCard({
  result,
  botToken,
  chatId,
  onAddOrder,
  onRefresh,
}: {
  result: {
    accountId: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
    overallLevel: RiskLevel;
    overallScore: number;
    factors: Array<{ type: string; level: RiskLevel; message: string; details: string; score: number }>;
    recommendation: string;
    shouldNotify: boolean;
  };
  botToken: string;
  chatId: string;
  onAddOrder: (accountId: number, accountName: string) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(result.overallLevel !== 'low');
  const cfg = LEVEL_CONFIG[result.overallLevel];

  const sendAlert = trpc.risk.sendRiskAlert.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('ส่งแจ้งเตือนไป Telegram สำเร็จ');
      } else {
        toast.error('ส่ง Telegram ไม่สำเร็จ — ตรวจสอบ Bot Token และ Chat ID');
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSendTelegram = () => {
    if (!botToken || !chatId) {
      toast.error('กรุณาตั้งค่า Telegram Bot Token และ Chat ID ในหน้าตั้งค่าก่อน');
      return;
    }
    sendAlert.mutate({ accountId: result.accountId, botToken, chatId });
  };

  const listOrders = trpc.risk.listOrders.useQuery(
    { accountId: result.accountId },
    { enabled: expanded }
  );

  const updateStatus = trpc.risk.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success('อัปเดตสถานะออเดอร์แล้ว');
      listOrders.refetch();
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card className={`bg-[#1A2332] border ${cfg.border} rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`p-4 ${cfg.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-bold text-base truncate">{result.accountName}</span>
              <RiskBadge level={result.overallLevel} />
            </div>
            <p className="text-[#A0A0A0] text-xs mt-0.5">{result.bankName} · {result.accountNumber}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 border-[#2A3441] text-[#A0A0A0] hover:text-white text-xs"
              onClick={() => onAddOrder(result.accountId, result.accountName)}
            >
              <Plus size={13} className="mr-1" />
              ออเดอร์
            </Button>
            {result.shouldNotify && (
              <Button
                size="sm"
                className="h-8 px-3 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] border border-[#00D4FF]/30 text-xs"
                onClick={handleSendTelegram}
                disabled={sendAlert.isPending}
              >
                <Send size={13} className="mr-1" />
                {sendAlert.isPending ? '...' : 'แจ้ง TG'}
              </Button>
            )}
          </div>
        </div>

        {/* Score Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#A0A0A0]">Risk Score</span>
            <span className={`font-bold ${cfg.color}`}>{result.overallScore}/100</span>
          </div>
          <ScoreBar score={result.overallScore} level={result.overallLevel} />
        </div>
      </div>

      {/* Recommendation */}
      <div className="px-4 py-3 border-b border-[#2A3441]">
        <p className="text-sm text-white leading-relaxed">{result.recommendation}</p>
      </div>

      {/* Toggle Factors */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-[#1E2730] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span>ปัจจัยความเสี่ยง ({result.factors.filter(f => f.level !== 'low').length} รายการที่ต้องระวัง)</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <CardContent className="p-4 pt-0 space-y-3">
          {/* Risk Factors */}
          {result.factors.map((factor) => {
            const fCfg = LEVEL_CONFIG[factor.level];
            return (
              <div key={factor.type} className={`p-3 rounded-xl border ${fCfg.border} ${fCfg.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#A0A0A0]">{RISK_TYPE_LABEL[factor.type] ?? factor.type}</span>
                  <RiskBadge level={factor.level} />
                </div>
                <p className="text-sm text-white">{factor.message}</p>
                {factor.details && factor.level !== 'low' && (
                  <p className="text-xs text-[#A0A0A0] mt-1">{factor.details}</p>
                )}
                <div className="mt-2">
                  <ScoreBar score={factor.score} level={factor.level} />
                </div>
              </div>
            );
          })}

          {/* Orders List */}
          {listOrders.data && listOrders.data.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-[#A0A0A0] mb-2">ออเดอร์ล่าสุด</p>
              <div className="space-y-2">
                {listOrders.data.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2.5 bg-[#0F1419] rounded-xl border border-[#2A3441]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-semibold">฿{formatNumber(parseFloat(order.orderAmount))}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          order.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                          order.status === 'cancelled' ? 'bg-red-400/10 text-red-400' :
                          'bg-yellow-400/10 text-yellow-400'
                        }`}>
                          {order.status === 'completed' ? 'เสร็จ' : order.status === 'cancelled' ? 'ยกเลิก' : 'รอ'}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A0A0] mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(order.scheduledAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        {order.telegramGroup && <span className="ml-1">· {order.telegramGroup}</span>}
                      </p>
                    </div>
                    {order.status === 'pending' && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => updateStatus.mutate({ orderId: order.id, status: 'completed' })}
                          className="p-1.5 rounded-lg hover:bg-green-400/10 text-green-400 transition-colors"
                          title="ทำเครื่องหมายว่าเสร็จ"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                        <button
                          onClick={() => updateStatus.mutate({ orderId: order.id, status: 'cancelled' })}
                          className="p-1.5 rounded-lg hover:bg-red-400/10 text-red-400 transition-colors"
                          title="ยกเลิก"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiskAnalysisPage() {
  const [addOrderModal, setAddOrderModal] = useState<{ accountId: number; accountName: string } | null>(null);

  const settingsQuery = trpc.settings.get.useQuery();
  const riskQuery = trpc.risk.analyzeAll.useQuery(undefined, {
    refetchInterval: 60_000, // refresh ทุก 1 นาที
  });
  const alertsQuery = trpc.risk.listAlerts.useQuery({ unreadOnly: true, limit: 20 });
  const markRead = trpc.risk.markAlertRead.useMutation({
    onSuccess: () => alertsQuery.refetch(),
  });

  const botToken = settingsQuery.data?.telegramBotToken ?? '';
  const chatId = settingsQuery.data?.telegramChatId ?? '';

  const results = (riskQuery.data ?? []).filter(Boolean) as NonNullable<typeof riskQuery.data>[number][];
  const criticalCount = results.filter(r => r?.overallLevel === 'critical').length;
  const highCount = results.filter(r => r?.overallLevel === 'high').length;
  const unreadAlerts = alertsQuery.data ?? [];

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert size={22} className="text-[#00D4FF]" />
            วิเคราะห์ความเสี่ยงบัญชี
          </h1>
          <p className="text-xs text-[#A0A0A0] mt-0.5">ตรวจสอบวงเงิน ความถี่ออเดอร์ และเวลาซ้อนทับ</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[#2A3441] text-[#A0A0A0] hover:text-white"
          onClick={() => riskQuery.refetch()}
          disabled={riskQuery.isFetching}
        >
          <RefreshCw size={14} className={riskQuery.isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#1A2332] border-[#2A3441] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#00D4FF]" />
            <span className="text-xs text-[#A0A0A0]">บัญชีทั้งหมด</span>
          </div>
          <p className="text-2xl font-bold text-white">{results.length}</p>
        </Card>
        <Card className={`rounded-xl p-3 border ${criticalCount > 0 ? 'bg-red-400/10 border-red-400/30' : 'bg-[#1A2332] border-[#2A3441]'}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={14} className="text-red-400" />
            <span className="text-xs text-[#A0A0A0]">วิกฤต</span>
          </div>
          <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-white'}`}>{criticalCount}</p>
        </Card>
        <Card className={`rounded-xl p-3 border ${highCount > 0 ? 'bg-orange-400/10 border-orange-400/30' : 'bg-[#1A2332] border-[#2A3441]'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-orange-400" />
            <span className="text-xs text-[#A0A0A0]">เสี่ยงสูง</span>
          </div>
          <p className={`text-2xl font-bold ${highCount > 0 ? 'text-orange-400' : 'text-white'}`}>{highCount}</p>
        </Card>
        <Card className="bg-[#1A2332] border-[#2A3441] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-yellow-400" />
            <span className="text-xs text-[#A0A0A0]">แจ้งเตือนใหม่</span>
          </div>
          <p className="text-2xl font-bold text-white">{unreadAlerts.length}</p>
        </Card>
      </div>

      {/* Unread Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[#A0A0A0]">การแจ้งเตือนที่ยังไม่อ่าน</h2>
          {unreadAlerts.map((alert) => {
            const cfg = LEVEL_CONFIG[alert.riskLevel as RiskLevel];
            return (
              <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                <cfg.icon size={16} className={`${cfg.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{alert.message}</p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5">
                    {new Date(alert.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                    {alert.telegramSent === 'yes' && <span className="ml-2 text-[#00D4FF]">· ส่ง TG แล้ว</span>}
                  </p>
                </div>
                <button
                  onClick={() => markRead.mutate({ alertId: alert.id })}
                  className="text-xs text-[#A0A0A0] hover:text-white px-2 py-1 rounded-lg hover:bg-[#2A3441] transition-colors shrink-0"
                >
                  อ่านแล้ว
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Risk Cards */}
      {riskQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-[#1A2332] rounded-2xl animate-pulse border border-[#2A3441]" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card className="bg-[#1A2332] border-[#2A3441] rounded-2xl p-8 text-center">
          <ShieldCheck size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">ยังไม่มีบัญชีที่ active</p>
          <p className="text-[#A0A0A0] text-sm mt-1">เพิ่มบัญชีในหน้า "บัญชี" ก่อน แล้วกลับมาวิเคราะห์ความเสี่ยง</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Sort: critical first, then high, medium, low */}
          {[...results]
            .sort((a, b) => {
              const order: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
              return order[a!.overallLevel as RiskLevel] - order[b!.overallLevel as RiskLevel];
            })
            .map((result) =>
              result ? (
                <AccountRiskCard
                  key={result.accountId}
                  result={result as Parameters<typeof AccountRiskCard>[0]['result']}
                  botToken={botToken}
                  chatId={chatId}
                  onAddOrder={(id, name) => setAddOrderModal({ accountId: id, accountName: name })}
                  onRefresh={() => riskQuery.refetch()}
                />
              ) : null
            )}
        </div>
      )}

      {/* Add Order Modal */}
      {addOrderModal && (
        <AddOrderModal
          accountId={addOrderModal.accountId}
          accountName={addOrderModal.accountName}
          onClose={() => setAddOrderModal(null)}
          onSuccess={() => {
            riskQuery.refetch();
            alertsQuery.refetch();
          }}
        />
      )}
    </div>
  );
}
