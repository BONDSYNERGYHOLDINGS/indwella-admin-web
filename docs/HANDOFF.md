# Admin Web — Handoff Notes

App-specific bugs, limitations, and next steps. Platform-wide items are in
`../ENGINEERING-HANDOFF.md`.

## Bugs specific to this app

1. **Password reset is very likely broken end-to-end.** See
   `AUTHENTICATION.md` — the `verify-otp` page discards the reset token, and
   `reset-password` sends no auth at all. This is the single most
   user-impacting bug in this app: a locked-out admin has no working
   self-service recovery path.
2. ~~No CSRF token handling anywhere~~ **Fixed** — the backend's CSRF
   enforcement was confirmed live (a service-charge create returned
   `{"detail":"CSRF validation failed"}`) and `indwella-sdk`'s
   `httpClient.ts` now reads `admin_csrf_token` and attaches `X-CSRF-Token`
   on every mutating request. See `AUTHENTICATION.md` and
   `../ENGINEERING-HANDOFF.md`. Fixed once in the shared `httpClient` layer,
   so every mutation page in this app (Residents, Security, Service Charges,
   Wallet, Electricity, Notifications, Settings) picked it up without a
   per-page change.
3. **Superadmin is unreachable** — the login page's role toggle is commented
   out, so `/dashboard/estates` and every `superAdminApi.*` method beyond
   `listEstates()` are dead code paths from a real-user perspective. Not a
   "bug" in the sense of broken behavior, but worth surfacing clearly: if
   product intent is for superadmins to actually use this app, this is a
   one-line fix (uncomment the button) blocking an entire role.
4. **`next build` has a known pre-existing break** on `/verify-otp` (a
   `<Suspense>` boundary requirement for `useSearchParams()`), per the app's
   own README. Not something this review discovered independently — flagged
   here because it's easy for a new engineer to mistake for a regression
   they caused. `yarn typecheck` is the real gate.

## Limitations worth knowing before extending this app

- **No shared `<ErrorBanner>` component** despite a well-factored shared
  component set otherwise (`DataTable`, `Badge`, `PageHeader`, `StatCard`) —
  the red error-banner markup is copy-pasted into every form.
- **`zustand` is installed but unused** — if a cross-page shared-state need
  ever arises (e.g. caching the resident list so the Overview page and the
  Residents page don't both fetch it independently), this is already
  available.
- **`recharts` is installed but unused** — no chart/analytics view exists
  anywhere in the app despite this dependency's presence, suggesting one was
  planned. The Overview page's stat cards are the closest thing to analytics
  today.
- **Broadcast notifications are hardcoded to `target: 'estate_residents'`**
  — the backend/SDK support three other targets
  (`all_residents`/`all_security`/`single_resident`) with no UI to choose
  them.
- **No FCM/push integration** — `authApi.updateFcmToken()` exists in the SDK
  with no call site; if admin-web is ever meant to receive push-style alerts
  (e.g. browser push for new resident signups), this would need to be built
  from scratch, not just wired up.
- **Every list page fetches fresh on every mount** — navigating away and
  back to, say, `/dashboard/residents` always refetches, with no cross-page
  cache. Acceptable at this app's current scale; worth revisiting if
  `zustand` (or React Query) is ever introduced.

## Suggested next steps, app-specific

1. Fix the password-reset token-forwarding gap (P0, shared priority with
   the platform-wide list).
2. ~~Decide and act on the CSRF gap (P0, shared priority).~~ Done — see
   above.
3. Either re-enable superadmin login (uncomment the toggle in
   `login/page.tsx`) and build out the missing superadmin pages (admin
   management, platform fees, meter vendors, ledger, platform wallet — all
   have ready SDK methods per `../API-SDK.md`), or explicitly remove the
   half-built `/dashboard/estates` page and its Sidebar entry to avoid
   carrying dead-looking-but-not-actually-dead code.
4. Extract a shared `<ErrorBanner>` component from the repeated inline
   markup.
5. If a broadcast-target picker is wanted, it's a small addition to
   `dashboard/notifications/page.tsx` — the SDK type already supports it.
