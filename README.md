# @indwella/admin-web

The **admin & superadmin web console** for Indwella — a Next.js 14 (App Router)
app that talks directly to the Indwella FastAPI backend through the shared
[`@indwella/sdk`](../indwella-sdk). Nothing here is mocked; every page calls the
real API.

## Prerequisites

- Node.js 18+
- The sibling [`indwella-sdk`](../indwella-sdk) repo checked out next to this one
  (this app depends on it via `"@indwella/sdk": "file:../indwella-sdk"`).

## Setup

```bash
# 1. Build the SDK first (this app consumes its compiled dist/)
cd ../indwella-sdk && npm install && npm run build

# 2. Install this app
cd ../indwella-admin-web && npm install

# 3. Configure the backend URL
cp .env.example .env        # then edit if pointing at a different backend
```

`.env`:

```
# Browser calls this app's own origin; the Next rewrite proxies /api/* to the
# backend so the httpOnly auth cookie stays first-party. See ADMIN_AUTH.md.
NEXT_PUBLIC_API_BASE_URL=/api
API_PROXY_TARGET=https://indwella-server.onrender.com
```

> **Auth is cookie-based.** The admin console does not send Bearer tokens — it
> relies on the httpOnly `admin_access_token` cookie the backend sets at
> `/admin/login`, which requires same-origin calls (hence the `/api` proxy).
> Full details, verification steps, and the cross-origin rationale are in
> [`../ADMIN_AUTH.md`](../ADMIN_AUTH.md).

> After changing SDK **source**, rebuild it (`npm run build` in `indwella-sdk`)
> so this app picks up the new `dist/`. A `file:` dependency does not rebuild
> automatically.

> **Login timing out?** `API_PROXY_TARGET` defaults to a Render-hosted
> backend, which can cold-start (30-60s+) after being idle. `apiClient.ts`
> sets a longer client timeout than the SDK default to survive this — see
> `docs/AUTHENTICATION.md` ("Login timeouts on Render cold starts") before
> assuming a code regression.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server (http://localhost:3000). |
| `npm run typecheck` | `tsc --noEmit` — **the CI gate.** Must be green before merge. |
| `npm run lint` | Next.js ESLint. |
| `npm run build` | `next build`. Now a clean deploy gate — see below. |

### `next build` / static export

`/verify-otp` reads `useSearchParams()`, which opts a page out of static
prerendering unless it's wrapped in a `<Suspense>` boundary — `next build`
used to fail on this route (`next dev`/`next start` never showed it, since
only the static-export step triggers the prerender). Fixed: the page's
`useSearchParams()`-dependent form is isolated in its own component, wrapped
in `<Suspense>` from the page's default export. `next build` now completes
cleanly for all routes — it's a valid deploy/CI gate again, not just
`npm run typecheck`.

## Architecture

- **Auth model:** one app = one role surface. Login stores tokens in
  `localStorage` and sets an `indwella_admin_authed` cookie flag; `src/middleware.ts`
  guards `/dashboard/*` on that flag (coarse defense-in-depth). Fine-grained role
  gating lives in `src/components/Sidebar.tsx` (per-item `roles`) and per-page.
- **Data access:** pages import `adminApi` (and friends) from `src/lib/apiClient.ts`,
  which wraps the role-scoped SDK factory. Never construct `createAdminSdk` inside
  a page.
- **Shared types:** imported from `@indwella/sdk` (there is no separate types
  package).

## Conventions for new pages

Copy `src/app/dashboard/service-charges/page.tsx` — it is the canonical pattern:
typed form state from the SDK request type, `err?.response?.data?.detail` error
handling, the `PageHeader` / `DataTable` / `Badge` / `StatCard` components, and the
`card` / `input-field` / `btn-primary` / `btn-secondary` utility classes. Money
routes must send an `Idempotency-Key` — use `generateIdempotencyKey()` from the SDK.

See the repo-root [`INTEGRATION_STATUS.md`](../INTEGRATION_STATUS.md) for the
live integration tracker.
