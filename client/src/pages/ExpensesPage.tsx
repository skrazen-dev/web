import { useState } from 'react';
import { Plus, Receipt, Filter } from 'lucide-react';
import { useStore } from '@/lib/store';
import { money, formatDate } from '@/lib/format';
import { getBankByCode } from '@/lib/banks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'paid' | 'pending';

export default function ExpensesPage() {
  const { expenses, accounts, agents } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);

  const filtered = expenses.filter((e) => {
    if (filter === 'paid') return e.type === 'paid';
    if (filter === 'pending') return e.type === 'pending';
    return true;
  });

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">ค่าใช้จ่าย</h2>
          <p className="text-xs text-[#A0A0A0]">{filtered.length} รายการ</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-[#00D4FF] hover:bg-[#0099CC] text-[#0F1419] font-semibold text-xs active:scale-95 transition-transform">
          <Plus size={14} /> เพิ่มรายการ
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter size={13} className="text-[#A0A0A0] shrink-0" />
        {(['all', 'paid', 'pending'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border whitespace-nowrap active:scale-95',
              filter === f
                ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30'
                : 'text-[#A0A0A0] border-transparent hover:bg-[#1E2730]'
            )}
          >
            {f === 'all' ? 'ทั้งหมด' : f === 'paid' ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt size={36} className="text-[#A0A0A0]/30 mb-3" />
            <p className="text-sm text-[#A0A0A0]">ยังไม่มีรายการค่าใช้จ่าย</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((exp) => {
            const acc = accounts.find((a) => a.id === exp.accountId);
            const bank = acc ? getBankByCode(acc.bankCode) : undefined;
            const agent = agents.find((a) => a.id === exp.agentId);
            return (
              <Card key={exp.id} className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)] hover:border-[#00D4FF]/15 transition-colors">
                <CardContent className="p-3.5 flex items-center gap-3">
                  {bank && <img src={bank.icon} alt={bank.name} className="w-8 h-8 rounded-lg object-contain bg-white/5 p-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">{exp.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', exp.type === 'paid' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]')}>
                        {exp.type === 'paid' ? 'จ่ายแล้ว' : 'ค้างจ่าย'}
                      </span>
                      {agent && <span className="text-[9px] text-[#A0A0A0]">{agent.name}</span>}
                      <span className="text-[9px] text-[#A0A0A0]">{formatDate(exp.createdAt)}</span>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">฿{money(exp.amount)}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ExpenseFormDialog open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}

function ExpenseFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addExpense, accounts, agents } = useStore();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'paid' | 'pending'>('pending');
  const [accountId, setAccountId] = useState('');
  const [agentId, setAgentId] = useState('');

  const reset = () => { setDesc(''); setAmount(''); setType('pending'); setAccountId(''); setAgentId(''); };

  const handleSubmit = () => {
    if (!desc || !amount) return;
    addExpense({
      description: desc,
      amount: parseFloat(amount) || 0,
      type,
      accountId: accountId || undefined,
      agentId: agentId || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md bg-[#1A1F26] border-[rgba(255,255,255,0.08)]">
        <DialogHeader>
          <DialogTitle className="text-white">เพิ่มค่าใช้จ่าย</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="desc" className="text-[#A0A0A0]">รายละเอียด</Label>
            <Input id="desc" placeholder="ค่าอะไร..." value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount" className="text-[#A0A0A0]">จำนวนเงิน</Label>
              <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white" />
            </div>
            <div>
              <Label className="text-[#A0A0A0]">สถานะ</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'paid' | 'pending')}>
                <SelectTrigger className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#242B33] border-[rgba(255,255,255,0.08)]">
                  <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                  <SelectItem value="pending">ค้างจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {accounts.length > 0 && (
            <div>
              <Label className="text-[#A0A0A0]">บัญชี (ไม่บังคับ)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white"><SelectValue placeholder="เลือกบัญชี" /></SelectTrigger>
                <SelectContent className="bg-[#242B33] border-[rgba(255,255,255,0.08)]">
                  {accounts.map((a) => {
                    const bank = getBankByCode(a.bankCode);
                    return <SelectItem key={a.id} value={a.id}>{bank?.name} - {a.accountNo}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          {agents.length > 0 && (
            <div>
              <Label className="text-[#A0A0A0]">Agent (ไม่บังคับ)</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white"><SelectValue placeholder="เลือก Agent" /></SelectTrigger>
                <SelectContent className="bg-[#242B33] border-[rgba(255,255,255,0.08)]">
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { reset(); onClose(); }} className="border-[rgba(255,255,255,0.08)] text-[#A0A0A0]">ยกเลิก</Button>
            <Button onClick={handleSubmit} disabled={!desc || !amount} className="bg-[#00D4FF] hover:bg-[#0099CC] text-[#0F1419] font-semibold">เพิ่มรายการ</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
