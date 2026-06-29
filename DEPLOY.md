# Deploy — CE Empire

แอปนี้เป็น **Express server แบบ long-running** (`node dist/index.js`) จึง deploy บน
persistent Node host ได้เลย — ไม่เหมาะกับ serverless (Vercel) เพราะ backend ต้องรันค้าง
และมี cron (`setInterval`) สำหรับ Daily Summary ที่ต้องการ process ที่อยู่ตลอด

มี `Dockerfile` ให้แล้ว ใช้ได้กับทุก container host

## Required environment variables (runtime)

| ENV | ใช้ทำอะไร |
|---|---|
| `DATABASE_URL` | MySQL connection (drizzle) |
| `JWT_SECRET` | เซ็น session cookie |
| `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `VITE_APP_ID` | auth/OAuth |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | LLM/image ของเดิม (Manus forge) |
| `AI_GATEWAY_API_KEY` | **ฟีเจอร์ Grok ใหม่** (assistant / OCR / daily summary) |
| `PORT` | host มักจะ inject ให้เอง (default 3000) |
| `DAILY_SUMMARY_HOUR`, `DAILY_SUMMARY_MINUTE` | (ออปชัน) เวลาส่งสรุปรายวัน — default 22:00 |

## Railway
1. New Project → Deploy from GitHub repo → เลือก branch
2. Railway ตรวจเจอ `Dockerfile` และ build ให้อัตโนมัติ
3. ใส่ env ตามตารางใน Variables
4. (ครั้งแรก) รัน `pnpm db:push` ผ่าน Railway shell เพื่อสร้างตาราง

## Render
1. New → Web Service → เชื่อม repo
2. Runtime: **Docker** (ใช้ `Dockerfile`)
3. ใส่ env ใน Environment
4. Health check path: `/`

## Fly.io
```bash
fly launch --no-deploy        # ตรวจเจอ Dockerfile
fly secrets set DATABASE_URL=... JWT_SECRET=... AI_GATEWAY_API_KEY=...
fly deploy
```

## รัน local ด้วย Docker
```bash
docker build -t ce-empire .
docker run -p 3000:3000 --env-file .env ce-empire
```
