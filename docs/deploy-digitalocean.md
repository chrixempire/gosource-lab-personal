# Deploying to DigitalOcean App Platform

Each app deploys as **its own App Platform app**, so each gets its own domain and
scales independently. The paused `apps/api` is not deployed.

| App            | Type         | How it's built                          | Spec |
|----------------|--------------|-----------------------------------------|------|
| `customer-web` | Nuxt SSR     | Dockerfile (repo-root context)          | [.do/customer-web.app.yaml](../.do/customer-web.app.yaml) |
| `admin-web`    | Nuxt SSR     | Dockerfile (repo-root context)          | [.do/admin-web.app.yaml](../.do/admin-web.app.yaml) |
| `website`      | Static site  | Node buildpack → `nuxt generate` → CDN  | [.do/website.app.yaml](../.do/website.app.yaml) |
| `legacy-api`   | NestJS       | `Dockerfile.dev` (context `apps/legacy-api`) | `.do/legacy-api.app.yaml` (gitignored — contains secrets) |

## legacy-api (NestJS backend)

Deployed from [apps/legacy-api/Dockerfile.dev](../apps/legacy-api/Dockerfile.dev),
which already runs as a non-root user, uses `dumb-init`, and bundles Chromium for
Puppeteer PDF generation. It builds standalone with `npm` from its own directory,
so the spec sets `source_dir: apps/legacy-api`.

```bash
doctl apps create --spec .do/legacy-api.app.yaml
# or, if the app already exists:
doctl apps update <APP_ID> --spec .do/legacy-api.app.yaml
```

Key points for this service:

- **The spec is gitignored** because it holds real secrets (DB, JWT, CDN, Spaces,
  encryption keys). `SECRET`-scoped env vars are encrypted by App Platform on
  create/update. Never commit this file; rotate any secret that leaks.
- **Listens on `PORT` (8000)** → `http_port: 8000`.
- **Memory:** runs at `apps-s-1vcpu-2gb` — Chromium PDF rendering tends to OOM on
  1 GB.
- **Redis:** the app reads `REDIS_URL` for both the cache store and Bull queues
  (`REDIS_HOST`/`REDIS_PORT` are unused). It must point at a reachable managed
  Redis/Valkey (`rediss://…`), not `localhost`.
- **MongoDB:** `DB_URL` is an external Atlas cluster — reachable from App Platform
  as-is.
- **CORS:** add the deployed frontend origins to `FRONTEND_APP_ORIGINS`
  (comma-separated) or browsers calling the API directly will be blocked.

## Why Dockerfiles for the SSR apps

`customer-web` and `admin-web` import workspace packages (`@gosource/api-client`,
`icons`, `shared`, `ui`) via `workspace:*`. App Platform buildpacks build from a
single `source_dir` and don't resolve pnpm `workspace:*` cleanly, so those two
build from a **Dockerfile with the repo root as context**. The Dockerfile runs a
filtered install (`--filter "@gosource/<app>..."`) so only that app and its
workspace deps are installed — `legacy-api`/`api` (incl. Puppeteer/Chromium) are
skipped.

Nuxt's default `node-server` preset emits a self-contained `.output/`, so the
runtime image is just Node + `.output` and starts with
`node .output/server/index.mjs`.

`website` has no workspace deps and can be fully prerendered, so it runs as a
cheaper static-site component on the buildpack.

## One-time setup

1. Install and authenticate the CLI:
   ```bash
   brew install doctl
   doctl auth init
   ```
2. Connect the GitHub repo (`ipcafrica/gosource-lab-v2`) to DigitalOcean once, in
   the App Platform UI, so `deploy_on_push` works:
   **Apps → Settings → GitHub → Authorize**.

## Before first deploy — fill in the specs

Edit each `.do/*.app.yaml` and replace the `REPLACE…` placeholders:

- **customer-web** — `NUXT_LEGACY_API_BASE_URL` (your API host),
  `NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (live `pk_live_…`),
  `NUXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **admin-web** — `NUXT_PUBLIC_LEGACY_API_BASE_URL` (your API host).
- Optionally set `region` (default `sfo`) and uncomment the `domains:` block.

> Public `NUXT_PUBLIC_*` values are baked into the client bundle, so they're set
> at `RUN_AND_BUILD_TIME`. Treat secret-bearing values as App Platform encrypted
> env vars (set `type: SECRET` or add them in the UI) rather than committing them.

## Deploy

Create each app once:

```bash
doctl apps create --spec .do/customer-web.app.yaml
doctl apps create --spec .do/admin-web.app.yaml
doctl apps create --spec .do/website.app.yaml
```

After that, pushes to `dev` auto-deploy (`deploy_on_push: true`). To push a spec
change manually:

```bash
doctl apps list                                   # find the APP_ID
doctl apps update <APP_ID> --spec .do/customer-web.app.yaml
```

Watch a deploy:

```bash
doctl apps list-deployments <APP_ID>
doctl apps logs <APP_ID> --type build --follow
doctl apps logs <APP_ID> --type run   --follow
```

## Verifying the Docker build locally

Build from the **repo root** (the context the spec uses):

```bash
docker build -f apps/customer-web/Dockerfile -t gosource-customer-web .
docker run --rm -p 8080:8080 \
  -e NUXT_LEGACY_API_BASE_URL=https://your-api-host \
  gosource-customer-web
# → http://localhost:8080
```

## Notes / gotchas

- **Backend not included.** Both SSR apps call `legacy-api`; deploy it separately
  (it already has [apps/legacy-api/Dockerfile](../apps/legacy-api/Dockerfile) and
  needs Postgres + Redis) and point the `*_LEGACY_API_BASE_URL` vars at it.
- **Branch is `dev`.** Change `github.branch` in each spec when you cut a
  production branch.
- **Region.** Default is `sfo` (near the existing `sfo3` Spaces bucket). Valid
  slugs: `nyc ams fra lon sfo sgp blr tor syd`.
- **Lockfile.** Installs use `--frozen-lockfile`; keep `pnpm-lock.yaml` committed
  and in sync or builds fail.
