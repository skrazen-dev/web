import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";

const SUGGESTED_PROMPTS = [
  "เขียน React component ตารางบัญชีพร้อม sort/filter",
  "สร้างฟังก์ชัน TypeScript คำนวณกำไร USDT",
  "เขียน SQL query สรุปยอดรายวันต่อธนาคาร",
  "Refactor โค้ดนี้ให้อ่านง่ายขึ้น",
];

/**
 * Grok AI code-generator panel — a chat-style assistant focused on producing
 * code. Opened from the "Grok AI" buttons in the sidebar / mobile nav.
 */
export function GrokPanel() {
  const open = useStore((s) => s.grokOpen);
  const setOpen = useStore((s) => s.setGrokOpen);
  const [messages, setMessages] = useState<Message[]>([]);

  const grok = trpc.ai.grok.useMutation({
    onSuccess: ({ text }) => {
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ ขออภัย เรียก Grok ไม่สำเร็จ — ตรวจสอบการตั้งค่า API ของระบบ\n\n```\n" +
            error.message +
            "\n```",
        },
      ]);
      toast.error("เรียก Grok ไม่สำเร็จ");
    },
  });

  const handleSend = (content: string) => {
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    // Keep the full history on screen but only send a recent window to the
    // server (its input is capped at 40), so long conversations never start
    // failing with a 400.
    grok.mutate({ messages: next.slice(-30) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl gap-0 border-[#00D4FF]/20 bg-[#0F1419] p-0">
        <DialogHeader className="border-b border-white/[0.06] p-4">
          <DialogTitle className="flex items-center gap-2 text-white">
            <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[#00D4FF]/20 to-[#0099CC]/20 border border-[#00D4FF]/30">
              <Sparkles size={15} className="text-[#00D4FF]" />
            </span>
            Grok AI · Code Generator
          </DialogTitle>
          <DialogDescription className="text-xs text-[#A0A0A0]">
            ผู้ช่วยเขียนโค้ดของ CE Empire — พิมพ์โจทย์แล้วให้ Grok สร้างโค้ดให้
          </DialogDescription>
        </DialogHeader>
        <AIChatBox
          messages={messages}
          onSendMessage={handleSend}
          isLoading={grok.isPending}
          height="60vh"
          placeholder="อธิบายโค้ดที่ต้องการ เช่น 'เขียนฟังก์ชันคำนวณกำไร'..."
          emptyStateMessage="เริ่มสร้างโค้ดกับ Grok"
          suggestedPrompts={SUGGESTED_PROMPTS}
          className="rounded-none border-0"
        />
      </DialogContent>
    </Dialog>
  );
}
