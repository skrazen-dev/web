import { useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type SlipOcrResult = {
  amount: number | null;
  time: string | null;
  bankName: string | null;
  ref: string | null;
};

/**
 * AI OCR — อัปโหลดสลิป → AI อ่านยอดเงิน/เวลา/ธนาคาร → ส่งกลับผ่าน onResult
 * ใช้เติมฟอร์มอัตโนมัติ (เช่น AddOrderModal: set amount, date จากผลลัพธ์)
 *
 *   <SlipOcrButton onResult={(r) => {
 *     if (r.amount) setAmount(String(r.amount));
 *     if (r.time) setDate(...);
 *   }} />
 */
export function SlipOcrButton({
  onResult,
}: {
  onResult: (result: SlipOcrResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const readSlip = trpc.grok.readSlip.useMutation();

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await readSlip.mutateAsync({
        imageBase64: base64,
        mimeType: file.type || 'image/jpeg',
      });

      onResult(result);
      const parts = [
        result.amount != null ? `฿${result.amount.toLocaleString()}` : null,
        result.bankName,
        result.time,
      ].filter(Boolean);
      toast.success(`อ่านสลิปสำเร็จ: ${parts.join(' · ') || 'ไม่พบข้อมูล'}`);
    } catch (err) {
      toast.error(`อ่านสลิปไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="border-[#A855F7]/30 text-[#C084FC] hover:bg-[#A855F7]/10"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={16} className="mr-1.5 animate-spin" />
        ) : (
          <ScanLine size={16} className="mr-1.5" />
        )}
        {loading ? 'กำลังอ่าน...' : 'สแกนสลิป'}
      </Button>
    </>
  );
}
