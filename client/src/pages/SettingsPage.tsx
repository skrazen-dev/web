import { useState } from 'react';
import { Settings, Bell, MessageSquare, Volume2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('บันทึกการตั้งค่าแล้ว');
  };

  const handleTestTelegram = async () => {
    if (!localSettings.telegramBotToken || !localSettings.telegramChatId) {
      toast.error('กรอก Bot Token และ Chat ID ให้ครบ');
      return;
    }

    setTestingTelegram(true);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${localSettings.telegramBotToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: localSettings.telegramChatId,
            text: '✅ CE Empire - ทดสอบการเชื่อมต่อสำเร็จ',
          }),
        }
      );

      if (response.ok) {
        toast.success('ส่งข้อความ Telegram สำเร็จ');
      } else {
        toast.error('ส่งข้อความ Telegram ไม่สำเร็จ');
      }
    } catch (error) {
      toast.error('เชื่อมต่อ Telegram ไม่สำเร็จ');
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings size={20} className="text-[#00D4FF]" />
          ตั้งค่าระบบ
        </h2>
        <p className="text-xs text-[#A0A0A0] mt-0.5">ปรับแต่งการแจ้งเตือน เสียง และการเชื่อมต่อ</p>
      </div>

      {/* Sound Settings */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={18} className="text-[#00D4FF]" />
              <div>
                <p className="text-sm font-semibold text-white">เสียงเตือน</p>
                <p className="text-xs text-[#A0A0A0]">เปิด/ปิดเสียงแจ้งเตือนเมื่อคำนวณเสร็จ</p>
              </div>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, soundEnabled: !localSettings.soundEnabled })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                localSettings.soundEnabled ? 'bg-[#00D4FF]' : 'bg-[#242B33]'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  localSettings.soundEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Threshold */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-[#F59E0B]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">เกณฑ์แจ้งเตือน</p>
              <p className="text-xs text-[#A0A0A0]">แจ้งเตือนเมื่อกำไรเกิน % นี้</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={localSettings.notificationThreshold}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  notificationThreshold: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white text-sm flex-1 focus:ring-2 focus:ring-[#F59E0B]/30"
            />
            <span className="text-sm font-semibold text-white">%</span>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Settings */}
      <Card className="bg-[#1A1F26] border-[rgba(255,255,255,0.06)]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare size={18} className="text-[#10B981]" />
            <div>
              <p className="text-sm font-semibold text-white">Telegram Bot</p>
              <p className="text-xs text-[#A0A0A0]">รับแจ้งเตือนผ่าน Telegram เมื่อมีกำไรดี</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 block">
              Bot Token
            </label>
            <Input
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={localSettings.telegramBotToken}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  telegramBotToken: e.target.value,
                })
              }
              className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white text-xs placeholder:text-[#A0A0A0]/30 focus:ring-2 focus:ring-[#10B981]/30"
            />
            <p className="text-[9px] text-[#A0A0A0]/60 mt-1">
              สร้างจาก @BotFather บน Telegram
            </p>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-wider mb-1.5 block">
              Chat ID
            </label>
            <Input
              type="text"
              placeholder="123456789"
              value={localSettings.telegramChatId}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  telegramChatId: e.target.value,
                })
              }
              className="bg-[#242B33] border-[rgba(255,255,255,0.08)] text-white text-xs placeholder:text-[#A0A0A0]/30 focus:ring-2 focus:ring-[#10B981]/30"
            />
            <p className="text-[9px] text-[#A0A0A0]/60 mt-1">
              ส่ง /start ให้ bot เพื่อรับ Chat ID
            </p>
          </div>

          <Button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            className="w-full bg-[#10B981]/20 border border-[#10B981]/30 hover:bg-[#10B981]/30 text-[#10B981] text-xs h-9 transition-colors"
          >
            {testingTelegram ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#242B33]/50 border border-[#00D4FF]/20">
        <CardContent className="p-3.5">
          <p className="text-[10px] text-[#A0A0A0] leading-relaxed">
            <span className="text-[#00D4FF] font-semibold">วิธีการตั้งค่า Telegram:</span><br/>
            1. ค้นหา @BotFather บน Telegram<br/>
            2. ส่ง /newbot และตั้งชื่อ bot<br/>
            3. คัดลอก Bot Token ที่ได้<br/>
            4. ส่ง /start ให้ bot เพื่อรับ Chat ID<br/>
            5. วาง Token และ Chat ID ที่นี่
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full bg-[#00D4FF] hover:bg-[#0099CC] text-[#0F1419] font-semibold text-sm h-11 active:scale-95 transition-transform"
      >
        <Save size={16} className="mr-2" /> บันทึกการตั้งค่า
      </Button>
    </div>
  );
}
