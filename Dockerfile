# ── CE Empire — production image (persistent Node server) ──
# ใช้ได้กับ Railway / Render / Fly.io / any container host

# Stage 1: build
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
# ติดตั้ง deps (ใช้ lockfile แบบ frozen เพื่อความ reproducible)
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile
# build client (dist/public) + server (dist/index.js)
COPY . .
RUN pnpm build

# Stage 2: runtime (เฉพาะ prod deps + ผลลัพธ์ build)
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod
# ผลลัพธ์ build จาก stage แรก
COPY --from=build /app/dist ./dist
# drizzle schema/migrations (เผื่อรัน db:push)
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

# host จะ inject PORT เอง (default 3000)
EXPOSE 3000
CMD ["node", "dist/index.js"]
