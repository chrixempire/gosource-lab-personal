# Security Checklist

This checklist is the practical follow-up for the current auth/session hardening pass.

## Dependency audit

Run from repo root:

```bash
pnpm audit:deps
pnpm audit:deps:prod
```

Review any high or critical findings before release.

## Environment review

### API

Verify these are set correctly for non-development environments:

- `AUTH_TOKEN_SECRET`
  - at least 32 characters
  - not the development default
- `FRONTEND_APP_ORIGINS`
  - comma-separated list of allowed frontend origins
- `DEV_ADMIN_SEED_ENABLED`
  - `false`
- `DEV_ADMIN_EMAIL`
  - unset unless explicitly needed in development
- `DEV_ADMIN_PASSWORD`
  - unset unless explicitly needed in development

## Auth and authorization test pass

### Customer account

Verify a customer user can:

- sign in
- refresh session
- create branches
- invite members
- view their branch list and branch detail pages

### Employee account

Verify an employee user can:

- sign in
- load only their own branch detail page
- load only members for their own branch
- not access customer-only branch management mutations
- not access another branch by manually changing the URL

## Abuse protection checks

Verify rate limiting returns `429` for repeated requests against:

- `POST /auth/login`
- `POST /auth/resend-otp`
- `POST /auth/verify-otp`
- `POST /auth/send-password-email`
- `POST /auth/verify-password-otp`
- employee invite and resend endpoints

## Invite flow checks

Verify invite links are only generated for:

- allowed origins in `FRONTEND_APP_ORIGINS`
- path `/auth/invite-user`

Reject invites with arbitrary callback origins or paths.

## Session and cookie checks

Verify the customer app:

- does not expose backend `access_token` in browser session state
- can restore authenticated requests via the server proxy
- redirects to `/auth/sign-in` when cookies are gone or refresh fails

## Browser storage checks

Verify onboarding data:

- is stored in `sessionStorage`, not `localStorage`
- expires after a short window
- clears after setup is completed

## Release gate

Before production deployment, confirm:

1. `pnpm build` passes for API and frontends
2. dependency audit is reviewed
3. CORS origins match deployed frontend domains
4. auth secret is rotated and stored securely
5. dev admin seeding is disabled
