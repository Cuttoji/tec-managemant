# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY .npmrc* ./
RUN npm ci

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build-time env vars required by NextAuth v5
ARG AUTH_SECRET="build-time-placeholder"
ARG NEXTAUTH_URL="http://localhost:3002"
ENV AUTH_SECRET=${AUTH_SECRET}
ENV NEXTAUTH_SECRET=${AUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV DOCKER_BUILD=1
# Prisma needs a valid DATABASE_URL at build time for client generation
# (actual connection happens at runtime via docker-compose env)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma client for runtime queries
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3002

CMD ["node", "server.js"]
