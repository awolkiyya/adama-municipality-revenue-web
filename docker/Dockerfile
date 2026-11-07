
# ==========================================
# Base image
# ==========================================
FROM node:22-alpine AS base

WORKDIR /app

# ==========================================
# Install dependencies
# ==========================================
FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci

# ==========================================
# Build Next.js application
# ==========================================
FROM base AS builder

ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

# ==========================================
# Production runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TZ=Africa/Addis_Ababa

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
