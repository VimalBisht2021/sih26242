# syntax=docker/dockerfile:1

# Stage 1: Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
WORKDIR /app

# Stage 2: Builder
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter=@sih26242/database exec prisma generate

# Build non-web packages and API
RUN pnpm -r --filter=!@sih26242/web build

# Stage 3: Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl postgresql-client su-exec
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy node_modules and manifests for runtime execution and migrations
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --chown=node:node --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/api ./apps/api

COPY --chown=node:node docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN chmod +x /usr/local/bin/api-entrypoint.sh
RUN mkdir -p /app/storage/evidence && chown -R node:node /app/storage

EXPOSE 4000

ENTRYPOINT ["/usr/local/bin/api-entrypoint.sh"]
CMD ["node", "apps/api/dist/main.js"]
