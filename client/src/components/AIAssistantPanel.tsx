import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2 } from 'lucide-react';

/**
 * AI Assistant — ถามข้อมูลในระบบเป็นภาษาธรรมชาติ
 * เช่น "วันนี้กำไรเท่าไร", "SCB เหลือวงเงินเท่าไร", "รายการไหนยังไม่มีสลิป"
 *
 * วางไว้ในหน้า Dashboard หรือเป็น panel แยกก็ได้
 */
const SUGGESTIONS = [
  'วันนี้กำไรเท่าไร',
  'SCB เหลือวงเงินเท่าไร',
  'รายการไหนยังไม่มีสลิป',
];

export function AIAssistantPanel() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const status = trpc.grok.status.useQuery();
  const ask = trpc.grok.ask.useMutation({
    onSuccess: (data) => setAnswer(data.answer),
    onError: (err) => setAnswer(`เกิดข้อผิดพลาด: ${err.message}`),
  });

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    ask.mutate({ question: trimmed });
  };

  if (!status.data?.configured) return null;

  return (
    <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[#C084FC]" />
        <span className="text-sm font-semibold text-white">ผู้ช่วย AI</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="flex gap-2"
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="ถามข้อมูลในระบบ..."
          className="bg-[#0F1419] border-[#2A3441] text-white"
        />
        <Button
          type="submit"
          disabled={ask.isPending}
          className="bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#C084FC] border border-[#A855F7]/30 shrink-0"
        >
          {ask.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="text-xs px-2.5 py-1 rounded-full border border-[#2A3441] text-[#A0A0A0] hover:text-white hover:border-[#A855F7]/40 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {answer && (
        <div className="bg-[#0F1419] rounded-xl p-3 text-sm text-white leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
