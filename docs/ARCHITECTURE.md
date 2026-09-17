# Admin Web — Architecture

## Folder structure (App Router)

```text
indwella-admin-web/
├── next.config.js                 # Same-origin API proxy: /api/* → API_PROXY_TARGET (server-side rewrite)
├── src/
│   ├── middleware.ts               # Edge middleware: coarse /dashboard/* guard on the auth-flag cookie
│   ├── app/
│   │   ├── layout.tsx               # Root layout: <AuthProvider> wraps everything
│   │   ├── page.tsx                 # "/" — redirects to /dashboard or /login based on auth state
│   │   ├── login/page.tsx            # Admin/superadmin login (superadmin toggle commented out)
│   │   ├── forgot-password/page.tsx
│   │   ├── verify-otp/page.tsx        # Has the known next-build Suspense issue
│   │   ├── reset-password/page.tsx    # Broken flow — see AUTHENTICATION.md
│   │   ├── globals.css               # Tailwind base + custom utility classes (card, input-field, btn-primary, btn-secondary)
│   │   └── dashboard/
│   │       ├── layout.tsx             # Client-side auth guard + <Sidebar> + main content area
│   │       ├── page.tsx               # Overview — stat cards, quick actions
│   │       ├── residents/page.tsx
│   │       ├── security/page.tsx
│   │       ├── service-charges/page.tsx   # "Canonical pattern" page per the app's own README
│   │       ├── resident-payments/page.tsx
│   │       ├── wallet/page.tsx
│   │       ├── electricity/page.tsx
│   │       ├── estates/page.tsx          # Superadmin-only, unreachable via login UI
│   │       ├── notifications/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx               # Nav + role-based item filtering + logout
│   │   ├── DataTable.tsx              # Generic typed table (columns/rows/loading/empty)
│   │   ├── Badge.tsx                  # Status-colored pill (approved/pending/rejected/etc.)
│   │   ├── PageHeader.tsx             # title/subtitle/action-slot header used on every page
│   │   ├── StatCard.tsx               # Icon + label + value tile
│   │   └── AuthSplitLayout.tsx        # Shared brand-panel layout for login/forgot/verify/reset pages
│   └── lib/
│       ├── apiClient.ts               # createAdminSdk(); exports api/adminApi/superAdminApi/authApi/passwordResetApi/notificationsApi
│       ├── auth-context.tsx           # AuthProvider — isAuthenticated/role/login/logout
│       └── tokenStorage.ts            # localStorage tokens + the readable "auth flag" cookie
└── public/indwella_icon.png
```

## Client vs. server components

Every page and most components reviewed are explicitly `'use client'` —
this app is effectively a client-rendered SPA layered on Next's App Router
for routing/rewrites, not a server-components-heavy app. No `page.tsx`
reviewed does server-side data fetching; every page fetches its own data in a
`useEffect` after mount via the SDK. The one non-trivial server-side piece is
`src/middleware.ts` (Next.js Edge middleware, not a React Server Component)
and the `next.config.js` rewrite.

## The same-origin proxy, in detail

```js
// next.config.js
async rewrites() {
  return [{ source: '/api/:path*', destination: `${API_PROXY_TARGET}/:path*` }];
}
```

The browser only ever calls `NEXT_PUBLIC_API_BASE_URL` (`/api`, same origin
as the Next.js app itself). Next.js's server forwards those requests to the
real backend (`API_PROXY_TARGET`, defaulting to
`https://indwella-server.onrender.com`) and relays the response — including
`Set-Cookie` headers — back to the browser. Because the browser's own request
was same-origin, the `admin_access_token` cookie it receives is first-party
regardless of the cookie's `SameSite` setting. This is the architectural
answer to "how does an httpOnly cross-origin cookie survive in a browser
app" — see `../AUTHENTICATION.md` for why that's a hard problem otherwise.

## Route guards

Two independent layers (see `../AUTHENTICATION.md` for full detail):

1. **`src/middleware.ts`** — Edge middleware matching `/dashboard/:path*` and
   `/login`. Checks the `indwella_admin_authed` cookie only (fast, no network
   call); redirects unauthenticated visitors away from `/dashboard/*` to
   `/login`, and redirects already-authenticated visitors away from `/login`
   to `/dashboard`.
2. **`src/app/dashboard/layout.tsx`** — client-side, checks
   `auth-context`'s `isAuthenticated` and redirects to `/login` if it's
   false once loading completes. Shows a "Loading…" state in between.

Role-based **page** access (e.g. `/dashboard/estates` requiring
`superadmin`) is enforced only inside that specific page component
(`if (role !== 'superadmin') return <"not available"> `) — there's no
centralized route-level role guard equivalent to the auth guards above.

## Middleware config

```ts
export const config = { matcher: ['/dashboard/:path*', '/login'] };
```

Note this means `/forgot-password`, `/verify-otp`, and `/reset-password` are
**not** covered by the middleware guard at all — they're reachable regardless
of auth state, which is correct for `/forgot-password` and `/verify-otp` but
worth double-checking for `/reset-password` if session-fixation-style
concerns ever come up (out of scope for this review; backend-enforced token
validity is the actual security boundary either way).

## Styling

Tailwind CSS with a small set of custom utility classes defined in
`globals.css` (`card`, `input-field`, `btn-primary`, `btn-secondary`) that
every page composes from — not read in full during this review, but their
usage is completely consistent across every page and component checked. A
`brand-*` and `ink-*` color palette is used throughout
(`bg-brand-500`, `text-ink-900`, etc.), implying a Tailwind theme
extension in `tailwind.config.ts` (not read in full — **Unknown / Requires
Confirmation** on the exact palette values, but the naming convention is
consistent everywhere it's used).

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Browser-facing API base — should stay `/api` so the cookie stays first-party (see above) |
| `API_PROXY_TARGET` | Server-side-only; the real backend URL the Next.js rewrite forwards to |

No other environment variables were found configured in this app.
