# Admin Web — Navigation

```text
/                          → redirects to /dashboard (if authed) or /login (if not)
/login                     Admin/superadmin sign-in (superadmin toggle present in code, commented out in JSX)
/forgot-password
/verify-otp?email=...
/reset-password?email=...   (broken — see AUTHENTICATION.md)

/dashboard                  Overview — stat cards, quick actions
├── /dashboard/residents
├── /dashboard/security
├── /dashboard/service-charges
├── /dashboard/resident-payments
├── /dashboard/wallet
├── /dashboard/electricity
├── /dashboard/estates        (superadmin-only; nav item hidden for admin role, page itself also self-gates)
├── /dashboard/notifications
└── /dashboard/settings
```

## Sidebar role gating (`src/components/Sidebar.tsx`)

```ts
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',                  roles: ['admin', 'superadmin'] },
  { href: '/dashboard/residents',        roles: ['admin', 'superadmin'] },
  { href: '/dashboard/security',         roles: ['admin', 'superadmin'] },
  { href: '/dashboard/service-charges',  roles: ['admin', 'superadmin'] },
  { href: '/dashboard/resident-payments',roles: ['admin', 'superadmin'] },
  { href: '/dashboard/wallet',           roles: ['admin', 'superadmin'] },
  { href: '/dashboard/electricity',      roles: ['admin', 'superadmin'] },
  { href: '/dashboard/estates',          roles: ['superadmin'] },
  { href: '/dashboard/notifications',    roles: ['admin', 'superadmin'] },
  { href: '/dashboard/settings',         roles: ['admin', 'superadmin'] },
];
```

Filtered by `role` from `useAuth()`. Since the UI provides no way to actually
log in as `superadmin` (see `AUTHENTICATION.md`), in practice the "Estates"
item never appears for any real user of the shipped app — it's only visible
if `role` is manually forced (dev tooling, or re-enabling the commented login
toggle).

## Route guard layering

See `ARCHITECTURE.md` for the two-layer guard (`middleware.ts` +
`dashboard/layout.tsx`). The middleware's `matcher` only covers
`/dashboard/:path*` and `/login` — the password-reset pages are unguarded by
middleware (see `ARCHITECTURE.md`'s note on this).

## No deep sub-navigation

Every dashboard page is a single flat view (list + optional inline
create/edit form, e.g. `service-charges`) — there are no nested detail routes
(e.g. no `/dashboard/residents/[id]`); all per-row actions (approve, delete,
edit) happen inline in the `DataTable` via buttons and local modal-less
inline forms, not by navigating to a new page.
