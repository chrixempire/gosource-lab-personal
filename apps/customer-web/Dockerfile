# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────────────────────
# Build context = repository ROOT. This is a pnpm workspace and customer-web
# depends on packages/* (@gosource/api-client, icons, shared, ui), so the build
# needs the whole workspace — not just apps/customer-web.
#
# DigitalOcean App Platform builds this with the repo root as context via:
#   dockerfile_path: apps/customer-web/Dockerfile   (see .do/customer-web.app.yaml)
# ──────────────────────────────────────────────────────────────────────────────

FROM node:24-slim AS builder
RUN corepack enable
WORKDIR /repo

# Bring in the whole workspace (see /.dockerignore for exclusions).
COPY . .

# Install only customer-web + its workspace dependencies (the trailing "..."),
# then build. Nuxt's default node-server preset emits a self-contained bundle in
# apps/customer-web/.output that already includes its runtime dependencies.
RUN pnpm install --frozen-lockfile --filter "@gosource/customer-web..."
RUN pnpm --filter "@gosource/customer-web" build

# ──────────────────────────────────────────────────────────────────────────────
# Runtime: .output bundles its own deps, so the final image only needs Node +
# the build output.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:24-slim AS runner
ENV NODE_ENV=production

# dumb-init gives us a real PID 1 (clean signal forwarding + zombie reaping).
RUN apt-get update \
    && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder --chown=node:node /repo/apps/customer-web/.output ./.output

# Run as the image's built-in non-root user (uid 1000).
USER node

# App Platform injects PORT (default 8080); Nitro's node-server honours it.
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
