# CE Empire — Grok AI Features

โค้ดฟีเจอร์ AI (xAI Grok ผ่าน **Vercel AI Gateway**) 3 อย่าง:

1. **AI Assistant** — ถามข้อมูลในระบบเป็นภาษาธรรมชาติ (เช่น "วันนี้กำไรเท่าไร", "SCB เหลือวงเงินเท่าไร", "รายการไหนยังไม่มีสลิป")
2. **AI OCR** — อัปโหลดสลิป → AI อ่าน ยอดเงิน / เวลา / ธนาคาร → เติมฟอร์มอัตโนมัติ
3. **Daily Summary** — สรุปรายวัน (รายรับ / รายจ่าย / กำไร / งานค้าง) ส่งเข้า Telegram ทุกคืน

> ไฟล์เหล่านี้แยกไว้ในโฟลเดอร์ `ai-features/` เพื่อไม่แตะ layout เดิม
> **นำไปวางใน project (source ที่แตกจาก zip) ตาม path ด้านล่าง** แล้ว wire ตามขั้นตอน

---

## 1. ไฟล์และตำแหน่งที่ต้องวาง

| ไฟล์ใน ai-features/ | วางที่ (ใน project) | ชนิด |
|---|---|---|
| `server/_core/aiGateway.ts` | `server/_core/aiGateway.ts` | ใหม่ |
| `server/routers/grok.ts` | `server/routers/grok.ts` | ใหม่ |
| `server/cron/dailySummaryCron.ts` | `server/cron/dailySummaryCron.ts` | ใหม่ |
| `client/src/components/AIAssistantPanel.tsx` | `client/src/components/AIAssistantPanel.tsx` | ใหม่ |
| `client/src/components/SlipOcrButton.tsx` | `client/src/components/SlipOcrButton.tsx` | ใหม่ |
| `client/src/components/DailySummaryButton.tsx` | `client/src/components/DailySummaryButton.tsx` | ใหม่ |

---

## 2. การแก้ไฟล์เดิม (3 จุด)

### `server/_core/env.ts` — เพิ่ม key
```ts
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Vercel AI Gateway — used for Grok-powered features
  aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  aiGatewayBaseUrl:
    process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1",
};
```

### `server/routers.ts` — register router
```ts
import { grokRouter } from "./routers/grok";
// ...
export const appRouter = router({
  // ...
  risk: riskRouter,
  grok: grokRouter,   // 👈 เพิ่ม
});
```

### `server/_core/index.ts` — เปิด cron กลางคืน (หลัง server.listen)
```ts
import { startDailySummaryCron } from "../cron/dailySummaryCron";
// ...
startDailySummaryCron();
```

---

## 3. Environment / Secret

ตั้งค่า secret ตัวเดียวก็เรียกได้ทั้ง Grok (และ Claude) ผ่าน gateway:

```
AI_GATEWAY_API_KEY=...     # จาก vercel.com/d/ai/api-keys
# (ออปชัน) ปรับเวลาส่งสรุปรายวัน — ดีฟอลต์ 22:00 ตามเวลาเซิร์ฟเวอร์
DAILY_SUMMARY_HOUR=22
DAILY_SUMMARY_MINUTE=0
```

---

## 4. วิธีใช้ฝั่ง UI

```tsx
// AI Assistant — วางในหน้า Dashboard
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
<AIAssistantPanel />

// Daily Summary (กดเอง) — วางในหน้า Dashboard หรือ Settings
import { DailySummaryButton } from "@/components/DailySummaryButton";
<DailySummaryButton />

// AI OCR — วางใน AddOrderModal เพื่อเติมยอด/เวลา จากสลิป
import { SlipOcrButton } from "@/components/SlipOcrButton";
<SlipOcrButton onResult={(r) => {
  if (r.amount != null) setAmount(String(r.amount));
  if (r.time) {
    // ถ้าได้ ISO เต็มให้ใส่ลง datetime-local ได้เลย
    const d = new Date(r.time);
    if (!isNaN(d.getTime())) setDate(d.toISOString().slice(0, 16));
  }
}} />
```

---

## 5. โมเดลที่ใช้

| ฟีเจอร์ | โมเดล |
|---|---|
| Assistant / Daily Summary | `xai/grok-4` |
| OCR (vision) | `xai/grok-2-vision-1212` |

ปรับได้ที่ค่าคงที่ `GROK_MODEL` / `GROK_VISION_MODEL` ใน `server/routers/grok.ts`

---

## หมายเหตุ
- ทุก procedure เป็น `protectedProcedure` (ต้องล็อกอิน) และดึงข้อมูลเฉพาะของ user นั้น
- AI Assistant ป้อนเฉพาะข้อมูลสรุป (ยอด, วงเงิน, รายการไม่มีสลิป) ให้โมเดล — ไม่หลุดข้อมูลดิบเกินจำเป็น และสั่งห้ามแต่งตัวเลข
- ต้องตั้ง `AI_GATEWAY_API_KEY` ก่อน ปุ่ม AI ทั้งหมดจะซ่อนไว้ถ้ายังไม่ได้ตั้งค่า (`grok.status.configured`)
