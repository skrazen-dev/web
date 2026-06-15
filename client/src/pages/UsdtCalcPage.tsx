import { useState, useCallback } from 'react';
import { DollarSign, Copy, RotateCcw, TrendingUp, TrendingDown, Calculator, Trash2, Clock, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { playSound, playNotificationSound } from '@/lib/sound';
import { formatNumber, formatSmart } from '@/lib/format';
import { exportToCSV, exportToJSON, generateFilename, generateSummary } from '@/lib/export';

export default function UsdtCalcPage() {
  const { usdtCalcs, addUsdtCalc, deleteUsdtCalc, clearUsdtCalcs, settings } = useStore();
  const [thb, setThb] = useState('500');
  const [usd, setUsd] = useState('15');
  const [sellRate, setSellRate] = useState('34.5');
  const [showHistory, setShowHistory] = useState(false);

  const thbNum = parseFloat(thb) || 0;
  const usdNum = parseFloat(usd) || 0;
  const sellRateNum = parseFloat(sellRate) || 0;

  const costPerUsd = usdNum > 0 ? thbNum / usdNum : 0;
  const sellTotal = usdNum * sellRateNum;
  const profit = sellTotal - thbNum;
  const profitPercent = thbNum > 0 ? (profit / thbNum) * 100 : 0;
  const isProfit = profit > 0;

  const handleCalculate = useCallback(() => {
    if (thbNum <= 0 || usdNum <= 0 || sellRateNum <= 0) {
      toast.error('กรอกตัวเลขให้ครบและมากกว่า 0');
      if (settings.soundEnabled) playSound('error');
      return;
    }

    addUsdtCalc({
      thb: thbNum,
      usd: usdNum,
      sellRate: sellRateNum,
      costPerUsd,
      sellTotal,
      profit,
      profitPercent,
    });

    if (settings.soundEnabled) {
      if (isProfit) {
        playSound('success');
      } else {
        playSound('warning');
      }
    }

    // Check if profit exceeds threshold for Telegram notification
    if (isProfit && profitPercent >= settings.notificationThreshold && settings.telegramBotToken && settings.telegramChatId) {
      sendTelegramNotification({
        thb: thbNum,
        usd: usdNum,
        sellRate: sellRateNum,
        profit,
        profitPercent,
      });
    }

    toast.success('บันทึกการคำนวณแล้ว');
  }, [thbNum, usdNum, sellRateNum, costPerUsd, sellTotal, profit, profitPercent, isProfit, settings, addUsdtCalc]);

  const handleCopy = useCallback(async () => {
    const text = `ต้นทุน: ${formatNumber(costPerUsd)} THB/USD | ขาย: ${formatSmart(sellRateNum)} THB/USD | กำไร: ${profit >= 0 ? '+' : ''}${formatNumber(profit, 2)} THB (${profitPercent >= 0 ? '+' : ''}${formatNumber(profitPercent, 2)}%)`;
    try {
      await navigator.clipboard.writeText(text);
      if (settings.soundEnabled) playSound('success');
      toast.success('คัดลอกแล้ว');
    } catch {
      toast.error('คัดลอกไม่สำเร็จ');
    }
  }, [costPerUsd, sellRateNum, profit, profitPercent, settings.soundEnabled]);

  const handleClear = () => {
    setThb('');
    setUsd('');
    setSellRate('');
  };

  const sendTelegramNotification = async (calc: any) => {
    try {
      const message = `🎯 CE Empire USDT Alert\n\n💰 ต้นทุน: ${formatNumber(calc.costPerUsd)} THB/USD\n📊 เรทขาย: ${formatSmart(calc.sellRate)} THB/USD\n✅ กำไร: +${formatNumber(calc.profit, 2)} THB (+${formatNumber(calc.profitPercent, 2)}%)`;
      
      await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
        }),
      });

      if (settings.soundEnabled) playNotificationSound();
    } catch (error) {
      console.error('Telegram notification failed:', error);
    }
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign size={20} className="text-[#F59E0B]" />
          คำนวณกำไร USDT
        </h2>
        <p className="text-xs text-[#A0A0A0] mt-0.5">คำนวณต้นทุน เรทขาย และกำไรจากการเทรด USDT</p>
      </div>

      {/* Input Section */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 block">
                ยอดซื้อรวม (THB)
              </label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="เช่น 500"
                value={thb}
                onChange={(e) => setThb(e.target.value)}
                className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white text-base font-semibold placeholder:text-[#A0A0A0]/50 focus:ring-2 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B]/50 h-12"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 block">
                USD ที่ได้
              </label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="เช่น 15"
                value={usd}
                onChange={(e) => setUsd(e.target.value)}
                className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white text-base font-semibold placeholder:text-[#A0A0A0]/50 focus:ring-2 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B]/50 h-12"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 block">
              เรทขาย (THB/USD)
            </label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="เช่น 34.5"
              value={sellRate}
              onChange={(e) => setSellRate(e.target.value)}
              className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white text-base font-semibold placeholder:text-[#A0A0A0]/50 focus:ring-2 focus:ring-[#00D4FF]/30 focus:border-[#00D4FF]/50 h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)] metric-glow-gold animate-scale-in">
          <CardContent className="p-3.5">
            <p className="text-[9px] text-[#A0A0A0] uppercase tracking-wider mb-1">ต้นทุน/1 USD</p>
            <p className="text-lg font-bold text-white">
              {usdNum > 0 ? formatNumber(costPerUsd, 2) : '0.00'}
            </p>
            <p className="text-[9px] text-[#A0A0A0] mt-1">THB</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)] metric-glow-cyan animate-scale-in">
          <CardContent className="p-3.5">
            <p className="text-[9px] text-[#A0A0A0] uppercase tracking-wider mb-1">ยอดขายรวม</p>
            <p className="text-lg font-bold text-white">
              {formatNumber(sellTotal, 2)}
            </p>
            <p className="text-[9px] text-[#A0A0A0] mt-1">THB</p>
          </CardContent>
        </Card>
      </div>

      {/* Profit Card */}
      <Card className={`border animate-scale-in ${isProfit ? 'bg-[#10B981]/5 border-[#10B981]/20 metric-glow-green' : profit < 0 ? 'bg-[#EF4444]/5 border-[#EF4444]/20 metric-glow-red' : 'bg-[#1A1F26] border-[rgba(255,255,255,0.06)]'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#A0A0A0] uppercase tracking-wider mb-1">กำไร / ขาดทุน</p>
              <p className={`text-2xl font-bold ${isProfit ? 'text-[#10B981]' : profit < 0 ? 'text-[#EF4444]' : 'text-white'}`}>
                {profit >= 0 ? '+' : ''}{formatNumber(profit, 2)} THB
              </p>
              <p className={`text-xs mt-1 font-medium ${isProfit ? 'text-[#10B981]' : profit < 0 ? 'text-[#EF4444]' : 'text-[#A0A0A0]'}`}>
                {profitPercent >= 0 ? '+' : ''}{formatNumber(profitPercent, 2)}%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isProfit ? 'bg-[#10B981]/10' : profit < 0 ? 'bg-[#EF4444]/10' : 'bg-[#242B33]'}`}>
              {isProfit ? (
                <TrendingUp size={24} className="text-[#10B981]" />
              ) : profit < 0 ? (
                <TrendingDown size={24} className="text-[#EF4444]" />
              ) : (
                <Calculator size={24} className="text-[#A0A0A0]" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-3.5 space-y-2">
          <p className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wider">สูตรคำนวณ</p>
          <div className="space-y-1.5 text-xs text-[#A0A0A0]">
            <p>ต้นทุน: <span className="text-white font-medium">{formatSmart(thbNum)} ÷ {formatSmart(usdNum)} = {usdNum > 0 ? formatNumber(costPerUsd) : '?'} THB/USD</span></p>
            <p>ยอดขาย: <span className="text-white font-medium">{formatSmart(usdNum)} × {formatSmart(sellRateNum)} = {formatNumber(sellTotal, 2)} THB</span></p>
            <p>กำไร: <span className={`font-medium ${isProfit ? 'text-[#10B981]' : profit < 0 ? 'text-[#EF4444]' : 'text-white'}`}>{formatNumber(sellTotal, 2)} - {formatSmart(thbNum)} = {profit >= 0 ? '+' : ''}{formatNumber(profit, 2)} THB</span></p>
          </div>
          <p className="text-[9px] text-[#A0A0A0]/60 mt-2 pt-2 border-t border-[rgba(255,255,255,0.04)]">
            * ตรวจสอบว่า USD ที่ใส่เป็นยอดสุทธิหลังหัก fee แล้ว
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleCalculate}
          className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1419] font-semibold text-xs h-11 active:scale-95 transition-transform"
        >
          <Calculator size={14} className="mr-1.5" /> บันทึก
        </Button>
        <Button
          onClick={handleCopy}
          className="flex-1 bg-[#00D4FF] hover:bg-[#0099CC] text-[#0F1419] font-semibold text-xs h-11 active:scale-95 transition-transform"
        >
          <Copy size={14} className="mr-1.5" /> คัดลอก
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white hover:bg-[#2A323C] text-xs h-11 active:scale-95 transition-transform"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* Export Buttons */}
      {usdtCalcs.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              exportToCSV(usdtCalcs, generateFilename('csv'));
              toast.success('ส่งออก CSV สำเร็จ');
            }}
            className="flex-1 bg-[#10B981]/20 border border-[#10B981]/30 hover:bg-[#10B981]/30 text-[#10B981] text-xs h-9 transition-colors"
          >
            <Download size={13} className="mr-1" /> CSV
          </Button>
          <Button
            onClick={() => {
              exportToJSON(usdtCalcs, generateFilename('json'));
              toast.success('ส่งออก JSON สำเร็จ');
            }}
            className="flex-1 bg-[#3B82F6]/20 border border-[#3B82F6]/30 hover:bg-[#3B82F6]/30 text-[#3B82F6] text-xs h-9 transition-colors"
          >
            <Download size={13} className="mr-1" /> JSON
          </Button>
        </div>
      )}

      {/* History Toggle */}
      <Button
        onClick={() => setShowHistory(!showHistory)}
        variant="outline"
        className="w-full bg-[#1A1F26] border-[rgba(255,255,255,0.06)] text-white hover:bg-[#242B33] text-xs h-10"
      >
        <Clock size={14} className="mr-1.5" /> {showHistory ? 'ซ่อนประวัติ' : 'แสดงประวัติ'} ({usdtCalcs.length})
      </Button>

      {/* History Section */}
      {showHistory && (
        <div className="space-y-2 animate-fade-up">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs font-semibold text-[#A0A0A0]">ประวัติการคำนวณ</p>
            {usdtCalcs.length > 0 && (
              <Button
                onClick={clearUsdtCalcs}
                size="sm"
                variant="ghost"
                className="text-[10px] text-[#EF4444] hover:bg-[#EF4444]/10 h-6"
              >
                <Trash2 size={12} className="mr-1" /> ล้างทั้งหมด
              </Button>
            )}
          </div>

          {usdtCalcs.length === 0 ? (
            <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#A0A0A0]">ยังไม่มีประวัติการคำนวณ</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {usdtCalcs.map((calc) => (
                <Card key={calc.id} className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">
                        ฿{formatNumber(calc.thb, 0)} → {formatNumber(calc.usd, 2)} USD @ {formatNumber(calc.sellRate, 2)}
                      </p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${calc.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {calc.profit >= 0 ? '+' : ''}{formatNumber(calc.profit, 2)} THB ({calc.profitPercent >= 0 ? '+' : ''}{formatNumber(calc.profitPercent, 2)}%)
                      </p>
                      <p className="text-[9px] text-[#A0A0A0] mt-1">{new Date(calc.createdAt).toLocaleString('th-TH')}</p>
                    </div>
                    <Button
                      onClick={() => deleteUsdtCalc(calc.id)}
                      size="sm"
                      variant="ghost"
                      className="text-[#A0A0A0] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 w-8 p-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
