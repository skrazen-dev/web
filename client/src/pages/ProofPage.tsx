import { Image as ImageIcon, Upload } from 'lucide-react';
import { useStore } from '@/lib/store';
import { money, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';

export default function ProofPage() {
  const { expenses } = useStore();
  const withSlip = expenses.filter((e) => e.slipImage);

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">หลักฐาน</h2>
        <p className="text-xs text-[#A0A0A0]">สลิปและหลักฐานการชำระเงิน</p>
      </div>

      {withSlip.length === 0 ? (
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon size={36} className="text-[#A0A0A0]/30 mb-3" />
            <p className="text-sm text-[#A0A0A0]">ยังไม่มีหลักฐาน</p>
            <p className="text-xs text-[#A0A0A0]/60 mt-1">แนบสลิปเมื่อเพิ่มค่าใช้จ่ายเพื่อเก็บเป็นหลักฐาน</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {withSlip.map((exp) => (
            <Card key={exp.id} className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)] overflow-hidden group hover:border-[#00D4FF]/20 transition-colors">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={exp.slipImage}
                  alt="สลิป"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div>
                    <p className="text-xs font-medium text-white truncate">{exp.description}</p>
                    <p className="text-[9px] text-[#A0A0A0]">{formatDate(exp.createdAt)}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-white truncate">{exp.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-[#A0A0A0]">{formatDate(exp.createdAt)}</span>
                  <span className="text-xs font-bold text-white">฿{money(exp.amount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload hint */}
      <Card className="bg-[#1A1F26] border-dashed border-[rgba(255,255,255,0.12)] hover:border-[#00D4FF]/30 transition-colors cursor-pointer">
        <CardContent className="flex items-center justify-center gap-3 py-8">
          <Upload size={20} className="text-[#A0A0A0]" />
          <div>
            <p className="text-xs font-medium text-[#A0A0A0]">อัปโหลดหลักฐาน</p>
            <p className="text-[9px] text-[#A0A0A0]/60">รองรับ JPG, PNG (ฟีเจอร์เร็วๆ นี้)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
