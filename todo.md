## Grok AI Integration (xAI ผ่าน Vercel AI Gateway)
- [x] ตั้งค่า AI_GATEWAY_API_KEY secret (ดู ai-features/README.md)
- [x] server/_core/aiGateway.ts — client เรียก gateway (chat + JSON + vision)
- [x] server/routers/grok.ts — tRPC router 3 ฟีเจอร์
  - [x] 1. AI Assistant (`grok.ask`) — ถามข้อมูลในระบบ
  - [x] 2. AI OCR (`grok.readSlip`) — อ่านสลิป เติมฟอร์มอัตโนมัติ
  - [x] 3. Daily Summary (`grok.dailySummary`) — สรุปรายวัน ส่ง Telegram
- [x] client components: AIAssistantPanel, SlipOcrButton, DailySummaryButton
- [x] cron กลางคืน: server/cron/dailySummaryCron.ts
- [ ] นำไฟล์จาก ai-features/ ไปวางใน project (ดู README) + ทดสอบ
