# Admin Web

Next.js 14 (App Router) web console for estate admins, and (code-complete but
not reachable via the shipped UI) superadmins.

- **Path:** `indwella-admin-web/`
- **Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, `@indwella/sdk`
- **Roles served:** `admin` (fully reachable), `superadmin` (SDK/backend-ready,
  UI toggle to log in as this role is commented out — see
  `../USER-ROLES.md`)
- **Auth model:** httpOnly cookie, same-origin proxied — see
  `AUTHENTICATION.md` and `../AUTHENTICATION.md`

## Where to look for what

| Doc | Covers |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | App Router structure, middleware, the cookie/proxy setup |
| [`FEATURES.md`](./FEATURES.md) | Every dashboard page, traced UI → SDK → API |
| [`API-USAGE.md`](./API-USAGE.md) | Call-site map (this app uses the typed SDK consistently) |
| [`AUTHENTICATION.md`](./AUTHENTICATION.md) | Cookie login, the flag-cookie pattern, the broken password-reset flow |
| [`NAVIGATION.md`](./NAVIGATION.md) | Full route tree + sidebar role gating |
| [`STATE-MANAGEMENT.md`](./STATE-MANAGEMENT.md) | auth-context, local page state, no global store |
| [`HANDOFF.md`](./HANDOFF.md) | App-specific bugs and next steps |

## Quick start

```bash
cd indwella-sdk && yarn install && yarn build
cd ../indwella-admin-web
yarn install
cp .env.example .env
# NEXT_PUBLIC_API_BASE_URL=/api
# API_PROXY_TARGET=<your-backend-url>
yarn dev            # http://localhost:3000
yarn build          # next build — now a clean deploy gate, see below
```

**`yarn typecheck` and `yarn build` are both meaningful gates.** `/verify-otp`
used to fail `next build`'s static prerender (a `<Suspense>` boundary
requirement for `useSearchParams()`) — this is fixed (see `HANDOFF.md`), so
`next build` completing is now a real signal, not something to ignore.

## Distinguishing trait vs. the mobile apps

This is the **one app in the platform that consistently uses the SDK's typed
methods** (`adminApi.*`, `superAdminApi.*`, `authApi.*`, etc.) rather than
raw axios calls — see `API-USAGE.md`. It's also the only app with a real
type-checking CI gate (`yarn typecheck`), and the two facts are related: the
typed-method discipline here is what makes that gate meaningful.

## What works today vs. what's SDK-ready but unbuilt

Fully working: admin login, resident management, security device management,
service charge CRUD, resident payments view, estate wallet + payouts,
electricity tariff, notification broadcast, own password change. Not
reachable through the shipped UI: essentially all superadmin functionality
(admin creation, platform fees, meter vendor config, ledger, platform
wallet). See [`../FEATURE-MATRIX.md`](../FEATURE-MATRIX.md) for the complete
breakdown.
