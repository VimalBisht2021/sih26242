# syntax=docker/dockerfile:1

# Stage 1: Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
WORKDIR /app

# Stage 2: Builder
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY apps/api/package.json ./apps/api/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm config set fetch-retries 5 && \
    pnpm install --frozen-lockfile

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build dependencies required by web
RUN pnpm --filter=@sih26242/contracts build
RUN pnpm --filter=@sih26242/domain build
RUN pnpm --filter=@sih26242/shared build
RUN pnpm --filter=@sih26242/qualification build

# Build Next.js application
RUN pnpm --filter=@sih26242/web build

# Stage 3: Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package manifests & dependencies for runtime
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --chown=node:node --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/web ./apps/web

USER node

EXPOSE 3000

CMD ["/app/apps/web/node_modules/.bin/next", "start", "/app/apps/web", "-p", "3000"]
