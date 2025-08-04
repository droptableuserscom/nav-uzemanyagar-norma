FROM node:22-alpine AS base

FROM base AS builder
RUN apk add --no-cache gcompat
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

RUN npm install -g tsx

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/src /app/src
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json
COPY --from=builder --chown=hono:nodejs /app/tsconfig.json /app/tsconfig.json
COPY --from=builder --chown=hono:nodejs /app/dtu-crawler.pem /app/dtu-crawler.pem

USER hono
EXPOSE 3000

CMD ["tsx", "src/index.ts"]