FROM node:22-alpine AS dependencies

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate --config prisma7.config.ts
RUN pnpm build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy --config prisma7.config.ts && pnpm db:seed && node server.js"]