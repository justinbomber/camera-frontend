# FROM --platform=$BUILDPLATFORM node:18-alpine AS base
FROM node:18-alpine AS base

# 安裝相依套件階段
FROM base AS deps
WORKDIR /app

# 複製 package.json 等檔案
COPY package.json ./
# 安裝相依套件（使用npm install代替npm ci）
RUN npm install

# 構建階段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 構建應用
RUN npm run build

# 運行階段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 創建非 root 用戶以增加安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

ENTRYPOINT []

# 只複製需要的文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# COPY --from=builder /app/server.js ./server.js

# 暴露端口
EXPOSE 3000

# 設置環境變量以允許主機訪問
ENV HOSTNAME="0.0.0.0"
# 增加UDP端口支持（WebRTC需要）
ENV NEXT_WEBSOCKET_COMPRESS=false
# 確保不啟用嚴格同源策略，允許WebRTC連接
ENV NEXT_PUBLIC_ALLOW_EXTERNAL_DOMAINS=true

# 啟動命令
CMD ["node", "server.js"] 