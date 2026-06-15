import { useState } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AgentsPage() {
  const { agents, addAgent, deleteAgent, expenses } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addAgent(name.trim());
    setName('');
    setShowForm(false);
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Agent</h2>
          <p className="text-xs text-[#A0A0A0]">{agents.length} คน</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 bg-[#00D4FF] hover:bg-[#0099CC] text-[#0F1419] font-semibold text-xs active:scale-95 transition-transform">
          <Plus size={14} /> เพิ่ม Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users size={36} className="text-[#A0A0A0]/30 mb-3" />
            <p className="text-sm text-[#A0A0A0]">ยังไม่มี Agent</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {agents.map((agent) => {
            const agentExpenses = expenses.filter((e) => e.agentId === agent.id);
            const totalAmount = agentExpenses.reduce((s, e) => s + e.amount, 0);
            return (
              <Card key={agent.id} className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)] group hover:border-[#00D4FF]/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF]/20 to-[#0099CC]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#00D4FF]">{agent.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{agent.name}</p>
                        <p className="text-[10px] text-[#A0A0A0]">เพิ่มเมื่อ {formatDate(agent.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-[#EF4444]/10 text-[#EF4444] transition-all active:scale-90"
                      aria-label="ลบ Agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#A0A0A0]">
                    <span>{agentExpenses.length} รายการ</span>
                    <span>฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(v) => { if (!v) setShowForm(false); }}>
        <DialogContent className="max-w-sm bg-[#1A1F26] border-[rgba(255,255,255,0.08)]">
          <DialogHeader>
            <DialogTitle className="text-white">เพิ่ม Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentName" className="text-[#A0A0A0]">ชื่อ Agent</Label>
              <Input id="agentName" placeholder="ชื่อ..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-[rgba(255,255,255,0.08)] text-[#A0A0A0]">ยกเลิก</Button>
              <Button onClick={handleAdd} disabled={!name.trim()} className="bg-[#00D4FF] hover:bg-[#0099CC] text-[#0F1419] font-semibold">เพิ่ม</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
