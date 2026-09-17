# Admin Web — State Management

## `auth-context.tsx` — the one global store

```ts
type AuthContextType = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  role: 'admin' | 'superadmin' | null;
  login: (token, refreshToken, role) => Promise<void>;
  logout: () => Promise<void>;
};
```

- On mount: checks `hasAuthFlag()` (the readable `indwella_admin_authed`
  cookie) **or** a localStorage token as the "am I logged in" signal (see
  `AUTHENTICATION.md` for why neither can read the real httpOnly cookie
  directly), and restores `role` from `localStorage`'s
  `indwella_admin_role` key.
- `login()` persists whatever tokens were returned (tolerating none, in the
  cookie-only flow), sets the auth-flag cookie, and stores `role`.
- `logout()` calls `authApi.superAdminLogout()` or `authApi.logout()`
  depending on the current `role`, clears storage, and redirects to
  `/login`.
- Registers with the SDK's `setSessionExpiredHandler` to flip
  `isAuthenticated` false and redirect to `/login` on a failed refresh —
  same pattern as both mobile apps.

## No global data store beyond auth

`zustand` is a declared dependency but **not imported anywhere** in the
reviewed source — every dashboard page manages its own data as local
`useState`/`useEffect`, exactly like the mobile apps. If a genuine shared-state
need arises (e.g. caching the resident list across pages), `zustand` is
already installed and would be the natural choice, but nothing currently uses
it.

## Data-fetching pattern

Every page follows the same shape:

```tsx
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(true);
useEffect(() => { load(); }, []);
const load = async () => { setLoading(true); try { ... } finally { setLoading(false); } };
```

Search-driven pages (`residents`, `service-charges`) add a debounced
`useEffect` on the search query (~350ms) that re-runs `load(query)` — a
hand-rolled debounce (`setTimeout`/`clearTimeout`), not a library.

`Promise.allSettled` is used on the Overview page and the Wallet page to
fetch multiple independent resources in parallel without one failure blocking
the others from rendering.

## Forms

Every create/edit form (service charges, wallet withdrawal, bank account,
electricity tariff, notification broadcast) uses plain per-field `useState`
— no form library, same as both mobile apps. The `service-charges` page's
form is explicitly documented in the app's own README as the canonical
pattern to copy for new pages.
