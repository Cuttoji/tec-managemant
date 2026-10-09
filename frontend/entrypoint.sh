#!/bin/sh
set -e

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding demo data..."
node scripts/seedDemo.js || echo "⚠️  Seed skipped (data may already exist)"

echo "🚀 Starting app..."
exec node server.js
