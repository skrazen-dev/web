import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Daily Summary — สรุปรายวัน (รายรับ/รายจ่าย/กำไร/งานค้าง) แบบกดเอง
 * การส่งอัตโนมัติทุกคืนทำผ่าน cron ฝั่ง server (ดู ai-features/server/cron/dailySummaryCron.ts)
 */
export function DailySummaryButton() {
  const [summary, setSummary] = useState('');

  const status = trpc.grok.status.useQuery();
  const run = trpc.grok.dailySummary.useMutation({
    onSuccess: (data) => {
      setSummary(data.summary);
      toast[data.sent ? 'success' : 'message'](
        data.sent ? 'สรุปวันนี้ส่งเข้า Telegram แล้ว' : 'สร้างสรุปแล้ว (ยังไม่ได้ส่ง TG — ตรวจการตั้งค่า)'
      );
    },
    onError: (err) => toast.error(`สรุปไม่สำเร็จ: ${err.message}`),
  });

  if (!status.data?.configured) return null;

  return (
    <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#C084FC]" />
          <span className="text-sm font-semibold text-white">สรุปรายวัน</span>
        </div>
        <Button
          size="sm"
          className="bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#C084FC] border border-[#A855F7]/30 text-xs"
          onClick={() => run.mutate({ sendToTelegram: true })}
          disabled={run.isPending}
        >
          {run.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
          {run.isPending ? 'กำลังสรุป...' : 'สรุป + ส่ง Telegram'}
        </Button>
      </div>
      {summary && (
        <pre className="text-xs text-[#D0D0D0] whitespace-pre-wrap leading-relaxed font-sans bg-[#0F1419] rounded-xl p-3 max-h-80 overflow-y-auto">
          {summary}
        </pre>
      )}
    </div>
  );
}
