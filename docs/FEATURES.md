# Admin Web — Features

Every major page, traced per the required structure. Status labels match
`../FEATURE-MATRIX.md`.

## Login — `/login` — Complete (admin only)

```text
Feature: Admin login
├── Route: /login
├── UI components: AuthSplitLayout (shared with forgot/verify/reset)
├── State: local (email, password, role, loading, error)
├── SDK methods: authApi.login(), authApi.superAdminLogin() (dead code path — see AUTHENTICATION.md)
├── API operations: POST /admin/login, POST /superadmin/login
├── Permissions: public
├── Dependencies: auth-context (login())
└── Current status: Complete for admin; superadmin path is implemented but unreachable in the UI
```

## Dashboard Overview — `/dashboard` — Complete

```text
Feature: Overview stat cards
├── Route: /dashboard
├── UI components: PageHeader, StatCard ×4
├── State: local; Promise.allSettled to fetch 4 resources independently
├── SDK methods: adminApi.getResidentsCount(), .getSecurityDevices(),
│                 .listServiceCharges(), .getEstateWallet()
├── API operations: GET /admin/dashboard/residents-count,
│                    /admin/registered-security-devices, /admin/service-charges,
│                    /admin/estate-wallet
├── Permissions: admin, superadmin
├── Dependencies: none beyond adminApi
└── Current status: Complete. Note: residents-count response shape is read
    defensively (tolerates {total}, {count}, or a bare number) because the
    exact backend shape wasn't confirmed at authoring time (source comment).
```

## Residents — `/dashboard/residents` — Complete

```text
Feature: Resident management
├── Route: /dashboard/residents
├── UI components: PageHeader (search input in action slot), DataTable, Badge
├── State: local; 350ms-debounced search-driven refetch
├── SDK methods: adminApi.searchResident() / .getResidentsInfo(),
│                 .setResidentApproval(), .deleteResident()
├── API operations: GET /admin/search-resident, GET /admin/residents-info,
│                    PUT /admin/resident-approval, DELETE /admin/delete-resident/{id}
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Complete. Approve/Reject buttons only render for
    status === 'pending' rows; Delete is always available and confirms via
    window.confirm.
```

## Security — `/dashboard/security` — Complete

```text
Feature: Security device management
├── Route: /dashboard/security
├── UI components: PageHeader, DataTable, inline "current code" + "new code" cards
├── State: local (devices, currentCode, newCode, generating/removing flags)
├── SDK methods: adminApi.getSecurityDevices(), .getSecurityCode(),
│                 .generateSecurityCode(), .removeSecurityDevice()
├── API operations: GET /admin/registered-security-devices,
│                    GET /admin/get-security-code, POST /generate-security-code,
│                    DELETE /admin/remove-security-device/{id}
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Complete. This is where the codes the security app's
    Login screen consumes are generated — see ../security/AUTHENTICATION.md.
```

## Service Charges — `/dashboard/service-charges` — Complete

```text
Feature: Service charge CRUD
├── Route: /dashboard/service-charges
├── UI components: PageHeader, DataTable, Badge, an inline create/edit <form>
│                   (toggled, not a modal), a <select> of the two valid
│                   charge_type values (recurring / one_off)
├── State: local; separate create-form and edit-form state; 350ms-debounced search
├── SDK methods: adminApi.listServiceCharges() / .searchServiceCharges(),
│                 .createServiceCharge(), .updateServiceCharge(), .deleteServiceCharge()
├── API operations: GET /admin/service-charges, GET /admin/search-service-charges,
│                    POST /admin/create-service-charge,
│                    PUT /admin/update-service-charge/{id},
│                    DELETE /admin/service-charge/{id}
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Complete. Documented in the app's own README as the
    "canonical pattern" new pages should copy. charge_type is a two-value
    enum (recurring / one_off) — a stale API.md example previously led the
    form to offer free-text category suggestions ("security", etc.) that the
    live backend rejects; see ../ENGINEERING-HANDOFF.md.
```

## Resident Payments — `/dashboard/resident-payments` — Complete (read-only)

```text
Feature: Resident payment history
├── Route: /dashboard/resident-payments
├── UI components: PageHeader, DataTable, Badge
├── State: local
├── SDK methods: adminApi.getResidentPayments()
├── API operations: GET /admin/resident-payments
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Complete, view-only — no create/edit/delete actions exist
    or would make sense here (payments are a derived record of wallet activity).
```

## Wallet — `/dashboard/wallet` — Complete

```text
Feature: Estate wallet balance, transactions, withdrawal, payout bank account
├── Route: /dashboard/wallet
├── UI components: PageHeader, StatCard, DataTable, Badge, two inline forms
│                   (withdraw, bank account)
├── State: local; a ref (not state) tracks the current withdrawal's idempotency
│           key so retries of the SAME attempt reuse it, while a changed
│           amount/reason or a completed submission generates a fresh one
├── SDK methods: adminApi.getEstateWallet(), .getEstateWalletTransactions(),
│                 .getEstateBankAccount(), .setEstateBankAccount(),
│                 .withdrawFromEstateWallet(); generateIdempotencyKey() from
│                 the SDK's util module
├── API operations: GET /admin/estate-wallet, GET /admin/estate-wallet/transactions,
│                    GET/PUT /admin/estate-bank-account,
│                    POST /admin/estate-wallet/withdraw (with Idempotency-Key header)
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Complete, and the ONE place in the entire platform that
    correctly uses the SDK's shared generateIdempotencyKey() utility rather
    than a local reimplementation (contrast: the resident app's wallet-funding
    screen — see ../resident/FEATURES.md).
```

## Electricity — `/dashboard/electricity` — Complete

```text
Feature: Electricity tariff configuration
├── Route: /dashboard/electricity
├── UI components: PageHeader, a single inline <form>
├── State: local (pricePerKwh, currency, loading, saving, message)
├── SDK methods: adminApi.getElectricityTariff(), .setElectricityTariff()
├── API operations: GET/PUT /admin/electricity-tariff
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Complete. This is the admin-side half of electricity
    vending — the resident-side purchase UI doesn't exist yet (see
    ../resident/FEATURES.md and ../DATA-MODEL.md).
```

## Estates — `/dashboard/estates` — Not Implemented (unreachable)

```text
Feature: Cross-estate list (superadmin)
├── Route: /dashboard/estates
├── UI components: PageHeader, DataTable
├── State: local; effect only runs `if (role !== 'superadmin') return`
├── SDK methods: superAdminApi.listEstates()
├── API operations: GET /superadmin/estates
├── Permissions: superadmin only (self-gated in-component; also hidden from
│                 the Sidebar for non-superadmin roles)
├── Dependencies: auth-context's `role`
└── Current status: Code-complete but practically unreachable — no UI path
    sets role to 'superadmin' (see AUTHENTICATION.md). Renders a static
    "This section is only available to super admins" message for every real
    user of the shipped app.
```

## Notifications — `/dashboard/notifications` — Broadcast is broken (backend-side); history list is fine

```text
Feature: Broadcast + sent-notification history
├── Route: /dashboard/notifications
├── UI components: PageHeader, an inline broadcast <form>, a manually-mapped list
│                   of past notifications (no DataTable — a bespoke card list)
├── State: local (title, body, sending, message, notifications, loading)
├── SDK methods: notificationsApi.list(), notificationsApi.broadcast()
├── API operations: GET /notifications/admin, POST /notifications/admin/broadcast
├── Permissions: admin, superadmin
├── Dependencies: none
└── Current status: Broadcast is broken end-to-end — every attempt 422s
    "Field required" on subject/message. BroadcastNotificationRequest's
    fields were previously named title/body (matching NotificationOut's
    read-side fields); renamed to subject/message to match the error's own
    field names, and verified on the wire (DevTools) that the browser now
    sends exactly {"subject":...,"message":...,"target":...} with correct
    Content-Type/Content-Length/auth/CSRF — the 422 still comes back from
    the live backend regardless. This is now believed to be a backend-side
    issue, not fixable from this workspace; see ../ENGINEERING-HANDOFF.md.
    Broadcast target is separately hardcoded to 'estate_residents' — the SDK
    type also supports 'all_residents' | 'all_security' | 'single_resident',
    none of which this UI exposes a way to choose. The form's own local
    state and labels ("Title"/"Message") are unchanged, only the outgoing
    payload's field names. The notification history list (GET
    /notifications/admin) is unaffected by any of this.
```

## Settings — `/dashboard/settings` — Complete (partial scope)

```text
Feature: Own-account settings
├── Route: /dashboard/settings
├── UI components: PageHeader, a "signed in as <role>" card, a change-password form
├── State: local (oldPassword, newPassword, saving, message, error)
├── SDK methods: authApi.changePassword()
├── API operations: PUT /admin/change-password
├── Permissions: admin, superadmin
├── Dependencies: auth-context's `role` (display only)
└── Current status: Complete for its scope, but scope is narrow — no
    FCM-token management UI (authApi.updateFcmToken() exists in the SDK with
    no call site anywhere in this app), no profile-editing (email, name), no
    session/device management view.
```

## Forgot Password / Verify OTP / Reset Password — `/forgot-password`, `/verify-otp`, `/reset-password` — Broken

See `AUTHENTICATION.md` for the full trace of why the reset step is very
likely broken (missing token forwarding). `forgot-password` and `verify-otp`
themselves work correctly in isolation.
