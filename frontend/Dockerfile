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

RUN npx prisma generate

ARG AUTH_SECRET="build-time-placeholder"
ARG NEXTAUTH_URL="http://localhost:3002"
ENV AUTH_SECRET=${AUTH_SECRET}
ENV NEXTAUTH_SECRET=${AUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV DOCKER_BUILD=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

# Install prisma CLI for migrate at runtime
RUN npm install -g prisma

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public
COPY --from=builder /app/prisma           ./prisma
COPY --from=builder /app/scripts          ./scripts
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
# bcryptjs needed by seed script
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["/entrypoint.sh"]
