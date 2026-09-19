# Admin Web — Authentication

See `../AUTHENTICATION.md` for the full platform-wide cookie/CSRF model. This
document covers admin-web-specific implementation detail.

## Login (`src/app/login/page.tsx`)

- A `role` toggle exists in component state (`useState<AdminRole>('admin')`)
  and the JSX for switching to `'superadmin'` is **present but commented
  out** — only the "Estate Admin" button actually renders. This is the root
  cause of superadmin being unreachable platform-wide; see
  `../USER-ROLES.md`.
- Submit calls `authApi.login({ email, password })` or (dead code path today)
  `authApi.superAdminLogin({ email, password })` depending on `role`.
- On success, calls `login(data?.access_token, data?.refresh_token, role)` —
  tolerant of both tokens being `undefined` (pure cookie flow) since the real
  authorization already happened via the `Set-Cookie` header on the response.
- Comment in source is explicit about the model: *"The backend authenticates
  the admin via the httpOnly `admin_access_token` cookie it sets on this
  response... Body tokens are optional - pass them through if present
  (enables silent refresh) but don't depend on them."*

## The auth-flag cookie pattern (`src/lib/tokenStorage.ts`)

```ts
const AUTH_FLAG_COOKIE = 'indwella_admin_authed';
```

Because the real `admin_access_token` cookie is httpOnly (invisible to JS by
design), this app can't just "check for a cookie" the normal way. It sets a
**second, deliberately non-sensitive** cookie at login
(`document.cookie = 'indwella_admin_authed=1; ...; samesite=lax'`) purely as
a client-readable signal that a session *might* exist. `hasAuthFlag()`
checks for this and is what both `auth-context.tsx` (on mount) and
`middleware.ts` (on every request to a guarded route) rely on. It carries no
authorization weight itself — a forged flag cookie without the real httpOnly
cookie would still get rejected by the backend on the first real API call;
it only ever short-circuits the *UI's* routing decision, not actual API
access.

`localStorage` tokens (`indwella_admin_access_token` /
`_refresh_token`) are populated **only if** the backend's login response
happens to also include body tokens — explicitly documented in source as a
"compatibility fallback," not the source of truth.

## CSRF — see `../AUTHENTICATION.md`

Nothing admin-web-specific to add beyond the platform-wide writeup: this app
doesn't handle CSRF itself — it's handled once, for every role that uses
cookie auth, inside `indwella-sdk/src/client/httpClient.ts`'s request
interceptor (reads `admin_csrf_token`, attaches `X-CSRF-Token`). This app
just needs to keep going through `adminApi`/`authApi`/etc. (from
`src/lib/apiClient.ts`) rather than constructing a separate axios instance,
or it would bypass the fix.

## Password reset flow — broken

```text
forgot-password/page.tsx  --passwordResetApi.requestReset({email})-->
  router.push('/verify-otp?email=...')
    verify-otp/page.tsx  --passwordResetApi.verifyOtpAdmin({email, otp})-->
      router.push('/reset-password?email=...')     ← response's reset token, if any, is discarded here
        reset-password/page.tsx  --passwordResetApi.resetPassword({new_password, confirm_password})-->
          (NO Authorization header, NO email, NO token sent at all)
```

Compare this to the resident app's equivalent
(`../resident/AUTHENTICATION.md`), which correctly threads a `reset_token`
from the OTP-verify response through to the reset call's `Authorization:
Bearer <resetToken>` header. This app's `verify-otp` page never even reads
`res.data.reset_token` — it's discarded. Since both flows call the exact same
backend route (`POST /reset-password`, documented in `API.md` as "Public with
reset token"), and the resident app's version demonstrably needs a token,
this admin flow is very likely to fail with an auth error at the final step.
**Requires confirmation against the live backend** before treating this as
100% certain, but the asymmetry between two implementations of the same
backend contract in the same codebase is a strong signal. See
`../ENGINEERING-HANDOFF.md` (P0).

## Login timeouts on Render cold starts — fixed

`API_PROXY_TARGET` (`.env.example`) points at
`https://indwella-server.onrender.com`. Render web services on the free/
starter tiers spin down after a period of inactivity; the *next* request
triggers a cold start that can take 30-60+ seconds before the app responds.
Admin login is usually that first request of a session, so it's the request
most likely to be in flight during a cold start.

`createHttpClient` (`indwella-sdk/src/client/httpClient.ts`) defaults
`timeoutMs` to `20000` (20s) — comfortably less than a Render cold start.
`apiClient.ts` previously didn't override this, so `authApi.login()` would
abort client-side with `"timeout of 20000ms exceeded"` before the backend
had finished waking up. Because the cold start typically completes shortly
after, the backend looks "active" moments later, which made this look like a
flaky/intermittent bug rather than a fixed, reproducible timeout race.

**Fix, part 1 (timeout):** `apiClient.ts` now passes an explicit longer
`timeoutMs` (45s — see the constant at the top of the file) when constructing
`createAdminSdk`, and the shared `getApiErrorMessage()` helper
(`src/lib/errorMessage.ts`, used across the app — see `API-USAGE.md`)
special-cases a timeout (`err.code === 'ECONNABORTED'`) with a message that
tells the admin the server may be waking up and to retry, instead of
surfacing the raw axios message.

**Fix, part 2 (connection reset mid-boot):** a longer timeout alone wasn't
enough — a cold Render backend doesn't just respond slowly, its connection to
the Next.js rewrite proxy can reset outright partway through the boot window
(observed: `ECONNRESET`/"socket hang up" roughly 30s in, surfaced to the
browser as a 5xx or a network error), independent of the client-side axios
timeout. `login/page.tsx` now wraps the login call in
`withColdStartRetry()`: if the first attempt fails with either an
`ECONNABORTED` timeout or an HTTP 5xx (`isLikelyColdStartError()`), it waits
1.5s and retries **once** more, flipping the submit button's label to
"Server is waking up, retrying…" in the meantime. A retry shortly after
almost always succeeds because the backend has finished waking up by then.

Neither fix eliminates the underlying cold start — only backend infra
changes (a paid Render tier, or a keep-warm ping) can do that. Together they
give the request enough time and one automatic retry to survive one, and
give the user an accurate explanation when it still doesn't. The retry
wrapper currently only wraps the login call, not every mutating request
across the app — if the same cold-start failure mode is observed elsewhere
(e.g. the first service-charge create of a session), the same
`withColdStartRetry` pattern is the one to copy rather than inventing a new
one.

If login timeouts or resets come back, check first whether `API_PROXY_TARGET`
is still a Render free/starter-tier URL before assuming a frontend
regression.

## Superadmin login — code-complete, UI-unreachable

`authApi.superAdminLogin()`, the `role: 'superadmin'` state, and
`authApi.superAdminLogout()` (used correctly in `auth-context.tsx`'s
`logout()` when `role === 'superadmin'`) are all implemented correctly. The
only missing piece is a way to actually select that role at the login form —
see the commented-out JSX above. See `../USER-ROLES.md` for the full
consequence chain (the one superadmin-gated page, `/dashboard/estates`,
inherits this same unreachability).
