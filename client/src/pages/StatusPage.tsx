import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { money, formatDate } from '@/lib/format';
import { getBankByCode } from '@/lib/banks';
import { Card, CardContent } from '@/components/ui/card';

export default function StatusPage() {
  const { expenses, accounts } = useStore();
  const paid = expenses.filter((e) => e.type === 'paid');
  const pending = expenses.filter((e) => e.type === 'pending');

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">สถานะ</h2>
        <p className="text-xs text-[#A0A0A0]">ภาพรวมสถานะการชำระเงิน</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#1A1F26] border-[#10B981]/20 metric-glow-green">
          <CardContent className="p-4 text-center">
            <CheckCircle2 size={24} className="mx-auto text-[#10B981] mb-2" />
            <p className="text-2xl font-bold text-white">{paid.length}</p>
            <p className="text-[10px] text-[#A0A0A0]">จ่ายแล้ว</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1F26] border-[#F59E0B]/20 metric-glow-gold">
          <CardContent className="p-4 text-center">
            <Clock size={24} className="mx-auto text-[#F59E0B] mb-2" />
            <p className="text-2xl font-bold text-white">{pending.length}</p>
            <p className="text-[10px] text-[#A0A0A0]">ค้างจ่าย</p>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#F59E0B] flex items-center gap-2 mb-3">
            <AlertCircle size={14} /> รายการค้างจ่าย
          </h3>
          <div className="space-y-2">
            {pending.map((exp) => {
              const acc = accounts.find((a) => a.id === exp.accountId);
              const bank = acc ? getBankByCode(acc.bankCode) : undefined;
              return (
                <Card key={exp.id} className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    {bank && <img src={bank.icon} alt={bank.name} className="w-7 h-7 rounded-lg object-contain bg-white/5 p-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">{exp.description}</p>
                      <p className="text-[9px] text-[#A0A0A0]">{formatDate(exp.createdAt)}</p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#F59E0B]">฿{money(exp.amount)}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {paid.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#10B981] flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} /> รายการจ่ายแล้ว
          </h3>
          <div className="space-y-2">
            {paid.map((exp) => {
              const acc = accounts.find((a) => a.id === exp.accountId);
              const bank = acc ? getBankByCode(acc.bankCode) : undefined;
              return (
                <Card key={exp.id} className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    {bank && <img src={bank.icon} alt={bank.name} className="w-7 h-7 rounded-lg object-contain bg-white/5 p-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">{exp.description}</p>
                      <p className="text-[9px] text-[#A0A0A0]">{formatDate(exp.createdAt)}</p>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[#10B981]">฿{money(exp.amount)}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {expenses.length === 0 && (
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 size={36} className="text-[#A0A0A0]/30 mb-3" />
            <p className="text-sm text-[#A0A0A0]">ยังไม่มีรายการ</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
