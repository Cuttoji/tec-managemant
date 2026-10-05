# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runner ────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

# prisma CLI for migrate deploy at runtime
RUN npm install -g prisma

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
