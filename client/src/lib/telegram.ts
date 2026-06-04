import type { BankAccount } from './types';

interface BulkSummary {
  totalItems: number;
  totalInvested: number;
  totalRevenue: number;
  totalProfit: number;
  profitRate: number;
  winRate: number;
  avgProfitPercent: number;
}

export const formatBulkSummaryForTelegram = (summary: BulkSummary): string => {
  const emoji = summary.totalProfit >= 0 ? '📈' : '📉';
  const profitEmoji = summary.totalProfit >= 0 ? '✅' : '❌';

  return `${emoji} *CE Empire - Bulk Calculation Summary*

📊 *ผลลัพธ์การคำนวณ*
• รายการทั้งหมด: ${summary.totalItems} รายการ
• ต้นทุนรวม: ฿${summary.totalInvested.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
• ยอดขายรวม: ฿${summary.totalRevenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}

${profitEmoji} *กำไร/ขาดทุน*
• รวม: ฿${summary.totalProfit >= 0 ? '+' : ''}${summary.totalProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
• อัตรา: ${summary.profitRate >= 0 ? '+' : ''}${summary.profitRate.toFixed(2)}%
• เฉลี่ย: ${summary.avgProfitPercent >= 0 ? '+' : ''}${summary.avgProfitPercent.toFixed(2)}%

🎯 *สถิติ*
• Win Rate: ${summary.winRate.toFixed(1)}%

⏰ _${new Date().toLocaleString('th-TH')}_`;
};

export const formatUsdtCalcForTelegram = (
  thb: number,
  usd: number,
  sellRate: number,
  profit: number,
  profitPercent: number
): string => {
  const emoji = profit >= 0 ? '✅' : '❌';
  const profitEmoji = profit >= 0 ? '📈' : '📉';

  return `${emoji} *CE Empire - USDT Calculation*

💰 *ข้อมูลการคำนวณ*
• ยอดซื้อ: ฿${thb.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
• USD ที่ได้: ${usd.toFixed(2)} USD
• เรทขาย: ฿${sellRate.toFixed(2)}/USD

${profitEmoji} *ผลลัพธ์*
• กำไร/ขาดทุน: ฿${profit >= 0 ? '+' : ''}${profit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
• อัตรา: ${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%

⏰ _${new Date().toLocaleString('th-TH')}_`;
};

export const sendTelegramMessage = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  if (!botToken || !chatId) {
    return {
      success: false,
      error: 'Bot Token หรือ Chat ID ยังไม่ได้ตั้งค่า',
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.description || 'ไม่สามารถส่งข้อความไปยัง Telegram',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งข้อความ',
    };
  }
};

export const testTelegramConnection = async (
  botToken: string,
  chatId: string
): Promise<{ success: boolean; error?: string; botName?: string }> => {
  if (!botToken || !chatId) {
    return {
      success: false,
      error: 'Bot Token หรือ Chat ID ยังไม่ได้ตั้งค่า',
    };
  }

  try {
    // Test bot token
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botData = await botResponse.json();

    if (!botResponse.ok) {
      return {
        success: false,
        error: 'Bot Token ไม่ถูกต้อง',
      };
    }

    // Send test message
    const messageResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✅ CE Empire Telegram Connection Test - สำเร็จ!',
        parse_mode: 'Markdown',
      }),
    });

    if (!messageResponse.ok) {
      return {
        success: false,
        error: 'Chat ID ไม่ถูกต้องหรือ Bot ไม่มีสิทธิ์ส่งข้อความ',
      };
    }

    return {
      success: true,
      botName: botData.result?.username || 'Unknown Bot',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการทดสอบการเชื่อมต่อ',
    };
  }
};
