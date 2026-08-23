FROM node:22-alpine AS base
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate

# ─── Dependencies ──────────────────────────────────────────
FROM base AS deps
ENV HUSKY=0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts
RUN pnpm rebuild

# ─── Build ─────────────────────────────────────────────────
FROM base AS builder
ENV HUSKY=0
ENV BETTER_AUTH_SECRET=build-placeholder
ENV BETTER_AUTH_URL=http://localhost:3000
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# ─── Production ────────────────────────────────────────────
FROM node:22-alpine AS runner
ENV HUSKY=0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server (includes bundled server.js + minimal node_modules)
COPY --from=builder /app/.next/standalone ./
# Copy static assets into the standalone .next directory
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy prisma schema + migrate engine for runtime migrations
COPY --from=builder /app/prisma ./prisma
# Copy full node_modules for prisma client
COPY --from=deps /app/node_modules ./node_modules

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && node server.js"]
