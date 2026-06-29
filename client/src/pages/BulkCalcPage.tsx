import { useState, useCallback } from 'react';
import { Upload, Download, Copy, Trash2, Plus, TrendingUp, TrendingDown, AlertCircle, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { playSound } from '@/lib/sound';
import { formatNumber, formatSmart } from '@/lib/format';
import { exportToCSV, generateFilename } from '@/lib/export';
import { formatBulkSummaryForTelegram, sendTelegramMessage } from '@/lib/telegram';
import type { UsdtCalc } from '@/lib/types';

interface BulkItem {
  id: string;
  thb: number;
  usd: number;
  sellRate: number;
  costPerUsd: number;
  sellTotal: number;
  profit: number;
  profitPercent: number;
}

const TEMPLATE_CSV = `ยอดซื้อ (THB),USD ที่ได้,เรทขาย (THB/USD)
500,15,34.5
1000,30,34.2
750,22,34.8
2000,60,34.1`;

export default function BulkCalcPage() {
  const { settings } = useStore();
  const [csvInput, setCsvInput] = useState('');
  const [results, setResults] = useState<BulkItem[]>([]);
  const [showTemplate, setShowTemplate] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);

  const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
  const totalInvested = results.reduce((sum, r) => sum + r.thb, 0);
  const totalRevenue = results.reduce((sum, r) => sum + r.sellTotal, 0);
  const avgProfitPercent = results.length > 0 ? results.reduce((sum, r) => sum + r.profitPercent, 0) / results.length : 0;
  const winCount = results.filter(r => r.profit > 0).length;
  const winRate = results.length > 0 ? (winCount / results.length) * 100 : 0;

  const calculateBulk = useCallback(() => {
    const lines = csvInput.trim().split('\n');
    if (lines.length < 2) {
      toast.error('กรุณาใส่ข้อมูลอย่างน้อย 1 แถว (นอกเหนือจากหัวตาราง)');
      if (settings.soundEnabled) playSound('error');
      return;
    }

    const newResults: BulkItem[] = [];
    let errorCount = 0;

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => parseFloat(v.trim()));
      if (values.length < 3 || values.some(v => isNaN(v) || v <= 0)) {
        errorCount++;
        continue;
      }

      const [thb, usd, sellRate] = values;
      const costPerUsd = usd > 0 ? thb / usd : 0;
      const sellTotal = usd * sellRate;
      const profit = sellTotal - thb;
      const profitPercent = thb > 0 ? (profit / thb) * 100 : 0;

      newResults.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        thb,
        usd,
        sellRate,
        costPerUsd,
        sellTotal,
        profit,
        profitPercent,
      });
    }

    if (newResults.length === 0) {
      toast.error('ไม่พบข้อมูลที่ถูกต้อง');
      if (settings.soundEnabled) playSound('error');
      return;
    }

    setResults(newResults);
    toast.success(`คำนวณสำเร็จ ${newResults.length} รายการ${errorCount > 0 ? ` (ข้ามไป ${errorCount} แถว)` : ''}`);
    if (settings.soundEnabled) playSound('success');
    setCsvInput('');
  }, [csvInput, settings]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCsvInput(text);
      toast.success('วางข้อมูลจากคลิปบอร์ดสำเร็จ');
    } catch {
      toast.error('ไม่สามารถอ่านคลิปบอร์ด');
    }
  }, []);

  const handleCopyResults = useCallback(() => {
    const csv = results
      .map(r => `${r.thb},${r.usd},${r.sellRate},${r.costPerUsd.toFixed(2)},${r.sellTotal.toFixed(0)},${r.profit.toFixed(0)},${r.profitPercent.toFixed(1)}`)
      .join('\n');
    
    const header = 'ยอดซื้อ (THB),USD,เรท,ต้นทุน/USD,ยอดขาย,กำไร,กำไร%';
    navigator.clipboard.writeText(header + '\n' + csv);
    toast.success('คัดลอกผลลัพธ์สำเร็จ');
  }, [results]);

  const handleExport = useCallback(() => {
    if (results.length === 0) {
      toast.error('ไม่มีผลลัพธ์ที่จะส่งออก');
      return;
    }

    const bulkCalcs: UsdtCalc[] = results.map(r => ({
      id: r.id,
      thb: r.thb,
      usd: r.usd,
      sellRate: r.sellRate,
      costPerUsd: r.costPerUsd,
      sellTotal: r.sellTotal,
      profit: r.profit,
      profitPercent: r.profitPercent,
      createdAt: new Date().toISOString(),
    }));

    exportToCSV(bulkCalcs, generateFilename('csv'));
    toast.success('ส่งออก CSV สำเร็จ');
  }, [results]);
  const handleSendTelegram = useCallback(async () => {
    if (results.length === 0) {
      toast.error("ไม่มีผลลัพธ์ที่จะส่ง");
      return;
    }
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      toast.error("กรุณาตั้งค่า Telegram Bot Token และ Chat ID ก่อน");
      return;
    }
    setIsSendingTelegram(true);
    const summary = {
      totalItems: results.length,
      totalInvested,
      totalRevenue,
      totalProfit,
      profitRate: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0,
      winRate,
      avgProfitPercent,
    };
    const message = formatBulkSummaryForTelegram(summary);
    const result = await sendTelegramMessage(
      settings.telegramBotToken,
      settings.telegramChatId,
      message
    );
    setIsSendingTelegram(false);
    if (result.success) {
      setTelegramSent(true);
      toast.success("ส่งไป Telegram สำเร็จ");
      if (settings.soundEnabled) playSound("success");
      setTimeout(() => setTelegramSent(false), 3000);
    } else {
      toast.error(result.error || "ไม่สามารถส่งไป Telegram");
      if (settings.soundEnabled) playSound("error");
    }
  }, [results, totalProfit, totalInvested, totalRevenue, winRate, avgProfitPercent, settings]);


  return (
    <div className="space-y-4 pb-24 md:pb-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white">คำนวณกำไร Bulk</h1>
        <p className="text-xs text-[#A0A0A0]">คำนวณกำไรหลายรายการพร้อมกันจากข้อมูล CSV</p>
      </div>

      {/* Input Section */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider block mb-2">
              วางข้อมูล CSV (ยอดซื้อ, USD, เรท)
            </label>
            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="ยอดซื้อ (THB),USD ที่ได้,เรทขาย&#10;500,15,34.5&#10;1000,30,34.2"
              className="w-full h-24 bg-[#242B33] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 text-xs text-white placeholder-[#A0A0A0]/40 focus:outline-none focus:border-[#00D4FF]/50 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handlePaste}
              className="flex-1 bg-[#3B82F6]/20 border border-[#3B82F6]/30 hover:bg-[#3B82F6]/30 text-[#3B82F6] text-xs h-9 transition-colors"
            >
              <Copy size={13} className="mr-1" /> วาง
            </Button>
            <Button
              onClick={() => setShowTemplate(!showTemplate)}
              className="flex-1 bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/30 text-[#8B5CF6] text-xs h-9 transition-colors"
            >
              <Plus size={13} className="mr-1" /> Template
            </Button>
            <Button
              onClick={() => setCsvInput('')}
              className="flex-1 bg-[#EF4444]/20 border border-[#EF4444]/30 hover:bg-[#EF4444]/30 text-[#EF4444] text-xs h-9 transition-colors"
            >
              <Trash2 size={13} className="mr-1" /> ล้าง
            </Button>
          </div>

          {/* Template */}
          {showTemplate && (
            <div className="bg-[#242B33] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase">Template ตัวอย่าง</p>
              <pre className="text-[10px] text-[#00D4FF] overflow-x-auto whitespace-pre-wrap break-words font-mono">{TEMPLATE_CSV}</pre>
              <Button
                onClick={() => {
                  setCsvInput(TEMPLATE_CSV);
                  setShowTemplate(false);
                  toast.success('โหลด Template สำเร็จ');
                }}
                className="w-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:bg-[#00D4FF]/30 text-[#00D4FF] text-xs h-8 transition-colors"
              >
                ใช้ Template นี้
              </Button>
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={calculateBulk}
            disabled={!csvInput.trim()}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#A0A0A0]/30 disabled:cursor-not-allowed text-[#0F1419] font-semibold text-xs h-11 active:scale-95 transition-transform"
          >
            <Upload size={14} className="mr-1.5" /> คำนวณ ({csvInput.trim().split('\n').length - 1} แถว)
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-3 space-y-1">
              <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase">รวมกำไร</p>
              <p className={`text-sm font-bold ${totalProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {totalProfit >= 0 ? '+' : ''}{formatNumber(totalProfit, 0)} ฿
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-3 space-y-1">
              <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase">Win Rate</p>
              <p className="text-sm font-bold text-[#00D4FF]">{winRate.toFixed(1)}% ({winCount}/{results.length})</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-3 space-y-1">
              <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase">ต้นทุนรวม</p>
              <p className="text-sm font-bold text-white">{formatNumber(totalInvested, 0)} ฿</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
            <CardContent className="p-3 space-y-1">
              <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase">เฉลี่ยกำไร %</p>
              <p className={`text-sm font-bold ${avgProfitPercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {avgProfitPercent >= 0 ? '+' : ''}{avgProfitPercent.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#A0A0A0] uppercase">ผลลัพธ์ ({results.length})</h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyResults}
                  className="bg-[#00D4FF]/20 border border-[#00D4FF]/30 hover:bg-[#00D4FF]/30 text-[#00D4FF] text-xs h-7 px-2 transition-colors"
                >
                  <Copy size={11} className="mr-1" /> คัดลอก
                </Button>
                <Button
                  onClick={handleExport}
                  className="bg-[#10B981]/20 border border-[#10B981]/30 hover:bg-[#10B981]/30 text-[#10B981] text-xs h-7 px-2 transition-colors"
                >
                  <Download size={11} className="mr-1" /> CSV
                </Button>
              </div>
                <Button
                  onClick={handleSendTelegram}
                  disabled={isSendingTelegram || telegramSent}
                  className={`text-xs h-7 px-2 transition-colors ${
                    telegramSent
                      ? "bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981]"
                      : "bg-[#3B82F6]/20 border border-[#3B82F6]/30 hover:bg-[#3B82F6]/30 text-[#3B82F6] disabled:opacity-50"
                  }`}
                >
                  <Send size={11} className="mr-1" /> {isSendingTelegram ? "กำลังส่ง..." : telegramSent ? "ส่งแล้ว" : "Telegram"}
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">ยอดซื้อ</th>
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">USD</th>
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">เรท</th>
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">ต้นทุน</th>
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">ยอดขาย</th>
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">กำไร</th>
                    <th className="text-left py-2 px-2 text-[#A0A0A0] font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-[rgba(255,255,255,0.04)] ${idx % 2 === 0 ? 'bg-[#242B33]/30' : ''}`}>
                      <td className="py-2 px-2 text-white">{formatNumber(row.thb, 0)}</td>
                      <td className="py-2 px-2 text-white">{formatNumber(row.usd, 2)}</td>
                      <td className="py-2 px-2 text-white">{formatNumber(row.sellRate, 2)}</td>
                      <td className="py-2 px-2 text-white">{formatNumber(row.costPerUsd, 2)}</td>
                      <td className="py-2 px-2 text-white">{formatNumber(row.sellTotal, 0)}</td>
                      <td className={`py-2 px-2 font-semibold ${row.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {row.profit >= 0 ? '+' : ''}{formatNumber(row.profit, 0)}
                      </td>
                      <td className={`py-2 px-2 font-semibold ${row.profitPercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {row.profitPercent >= 0 ? '+' : ''}{row.profitPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 bg-[#242B33] border border-[rgba(255,255,255,0.08)] rounded-lg p-2">
              <AlertCircle size={14} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#A0A0A0]">
                ข้อมูลนี้จะบันทึกลงในประวัติเมื่อคุณกดบันทึกจากหน้า "คำนวณ USDT" ทีละรายการ
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && csvInput.trim() === '' && (
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
          <CardContent className="p-8 text-center space-y-2">
            <Upload size={32} className="mx-auto text-[#A0A0A0]/40" />
            <p className="text-sm text-[#A0A0A0]">วางข้อมูล CSV หรือใช้ Template ตัวอย่าง</p>
            <p className="text-[10px] text-[#A0A0A0]/60">รูปแบบ: ยอดซื้อ (THB), USD ที่ได้, เรทขาย</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

}
