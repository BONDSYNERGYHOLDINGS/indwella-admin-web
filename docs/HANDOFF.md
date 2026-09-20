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
4. ~~`next build` broke on `/verify-otp`~~ **Fixed** — `useSearchParams()`
   opts a page out of static prerendering unless it's isolated inside a
   `<Suspense>` boundary; `next dev`/`next start` never surfaced this
   because only the static-export step during `next build` triggers the
   prerender, which is what made it look like an unrelated/pre-existing
   quirk rather than a real, fixable bug. `verify-otp/page.tsx` now wraps
   its `useSearchParams()`-dependent form in a dedicated inner component and
   wraps *that* in `<Suspense>` from the page's default export, with the
   same `AuthSplitLayout` shell as the fallback so there's no layout flash.
   `next build` now completes cleanly end-to-end — it is no longer only
   `yarn typecheck` that gates this app; a red `next build` should be
   treated as a real regression again.
5. ~~Every form crashed React on a 422 validation error~~ **Fixed** —
   FastAPI returns `detail` as an array of Pydantic error objects on a 422,
   not a string; every form used to render that array directly as JSX and
   crash with "Objects are not valid as a React child." A new shared
   `getApiErrorMessage()` (`src/lib/errorMessage.ts`) normalizes both shapes
   to a string and is now used in every form's catch block except the
   Overview page. See `API-USAGE.md`.
6. ~~Netlify build failed installing dependencies~~ **Fixed** — this app
   depended on the SDK via `"@indwella/sdk": "file:../indwella-sdk"`, a
   relative path to a sibling folder that only exists in a local checkout
   where all four repos sit side by side. Netlify clones only this repo, so
   there was no `../indwella-sdk` to resolve and `yarn install` failed with
   `Package "" refers to a non-existing file`. Fixed by switching to a git
   dependency pointing at the SDK's own (private) repo:
   `"@indwella/sdk": "git+https://github.com/BONDSYNERGYHOLDINGS/indwella-sdk.git#main"`.
   See `../../indwella-sdk/docs/HANDOFF.md` → "Dependency model" for the
   full mechanism (the SDK's `prepare` script, `yarn link` for local dev).

   **Netlify-specific setup required (one-time):** because the SDK repo is
   private, Netlify's build container has no GitHub credentials of its own.
   `scripts/ci-git-auth.js` (wired up as this app's `preinstall` script)
   configures a token-based git URL rewrite, but only when a `SDK_GIT_TOKEN`
   environment variable is present:
   1. On GitHub, create a **fine-grained personal access token** scoped to
      *only* the `indwella-sdk` repository, with read-only **Contents**
      permission.
   2. In Netlify: Site configuration → Environment variables → add
      `SDK_GIT_TOKEN` with that token as the value.
   3. Trigger a new deploy. No build-command changes needed — the
      `preinstall` script picks up the env var automatically, before
      `yarn install` tries to fetch the SDK.

   This is a no-op on every local developer machine (no `SDK_GIT_TOKEN` set
   there), since local devs already have their own cached GitHub
   credentials.

## Limitations worth knowing before extending this app

- **No shared `<ErrorBanner>` component** despite a well-factored shared
  component set otherwise (`DataTable`, `Badge`, `PageHeader`, `StatCard`) —
  the red error-banner markup is copy-pasted into every form. (Error
  *message extraction* is centralized via `getApiErrorMessage()`; only the
  banner JSX/classes are duplicated — see `API-USAGE.md`.)
- **Cold-start retry only covers login.** `withColdStartRetry()` in
  `login/page.tsx` (see `AUTHENTICATION.md`) is a one-off wrapper, not a
  reusable utility — if the same Render cold-start failure mode shows up on
  another mutating request (most likely the first action of a session right
  after login), it isn't automatically retried there yet.
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
6. If cold-start failures are observed anywhere beyond login, extract
   `withColdStartRetry()`/`isLikelyColdStartError()` out of `login/page.tsx`
   into `src/lib/` (alongside `errorMessage.ts`) so other mutating calls can
   reuse it instead of copy-pasting.
