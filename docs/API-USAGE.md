# Admin Web — API/SDK Usage

Unlike both mobile apps, admin-web consistently uses the SDK's typed methods
(`adminApi.*`, `superAdminApi.*`, `authApi.*`, `passwordResetApi.*`,
`notificationsApi.*`) rather than the raw `api` axios export. `api` is
exported from `apiClient.ts` but was not observed being called directly
anywhere in the reviewed pages — every call goes through a typed facade
method.

## Call-site map

| Page | SDK methods called |
|---|---|
| `login/page.tsx` | `authApi.login()`, `authApi.superAdminLogin()` |
| `forgot-password/page.tsx` | `passwordResetApi.requestReset()` |
| `verify-otp/page.tsx` | `passwordResetApi.verifyOtpAdmin()` |
| `reset-password/page.tsx` | `passwordResetApi.resetPassword()` |
| `dashboard/page.tsx` | `adminApi.getResidentsCount()`, `.getSecurityDevices()`, `.listServiceCharges()`, `.getEstateWallet()` |
| `dashboard/residents/page.tsx` | `adminApi.searchResident()`, `.getResidentsInfo()`, `.setResidentApproval()`, `.deleteResident()` |
| `dashboard/security/page.tsx` | `adminApi.getSecurityDevices()`, `.getSecurityCode()`, `.generateSecurityCode()`, `.removeSecurityDevice()` |
| `dashboard/service-charges/page.tsx` | `adminApi.listServiceCharges()`, `.searchServiceCharges()`, `.createServiceCharge()`, `.updateServiceCharge()`, `.deleteServiceCharge()` |
| `dashboard/resident-payments/page.tsx` | `adminApi.getResidentPayments()` |
| `dashboard/wallet/page.tsx` | `adminApi.getEstateWallet()`, `.getEstateWalletTransactions()`, `.getEstateBankAccount()`, `.setEstateBankAccount()`, `.withdrawFromEstateWallet()`; SDK util `generateIdempotencyKey()` |
| `dashboard/electricity/page.tsx` | `adminApi.getElectricityTariff()`, `.setElectricityTariff()` |
| `dashboard/estates/page.tsx` | `superAdminApi.listEstates()` |
| `dashboard/notifications/page.tsx` | `notificationsApi.list()`, `.broadcast()`, `.markRead()` |
| `dashboard/settings/page.tsx` | `authApi.changePassword()` |
| `auth-context.tsx` | `authApi.logout()`, `authApi.superAdminLogout()` |

## What is never called from this app

Every `superAdminApi.*` method except `listEstates()` has no call site:
`assignEstate`, `unassignEstate`, `reassignEstate`, `createAdmin`,
`updateAdmin`, `getMeterVendorTypes`, `listEstateMeterVendors`,
`createEstateMeterVendor`, `updateEstateMeterVendor`,
`deleteEstateMeterVendor`, `setLicenseFee`, `getPlatformFees`,
`setPlatformFees`, `setPlatformBankAccount`, `getPlatformWallet`,
`getEstateWallets`, `getLedger`, `getLedgerEntries`,
`getWalletFundingReconciliationSummary`, `withdrawFromPlatformWallet`. Also
unused: `authApi.updateFcmToken()` (admin FCM token registration has no push
notification counterpart built in this app at all — no
`@react-native-firebase`-equivalent web push integration exists here either).

## Error handling

Message *extraction* is centralized; the banner *markup* is not.

`src/lib/errorMessage.ts` exports `getApiErrorMessage(err, fallback)`, used
in every page's forms except the read-only Overview page (`dashboard/page.tsx`,
which uses `Promise.allSettled` and quietly defaults to empty/zero rather
than surfacing a per-widget error):

```ts
} catch (err) {
  setError(getApiErrorMessage(err, 'Fallback message'));
}
```

This exists to fix a real crash, not just to be tidy: FastAPI returns
`detail` as a plain string for most errors but as an **array** of Pydantic
validation-error objects (`{type, loc, msg, input, ctx}`) on a 422. Every
form used to do `err?.response?.data?.detail || fallback` and render the
result directly as JSX — a validation-error array is truthy, so React
received an array of objects as a child and crashed with `"Objects are not
valid as a React child"`. `getApiErrorMessage` normalizes both shapes to a
plain string (joining `.msg` values when it's an array), and also
special-cases an axios `ECONNABORTED` timeout with a cold-start-aware
message (see `AUTHENTICATION.md`).

**What's still duplicated:** the banner *markup* itself —
`rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700`
— is copy-pasted into every form's JSX rather than extracted into a shared
`<ErrorBanner>` component, despite the app otherwise having a well-factored
shared component set (`DataTable`, `Badge`, `PageHeader`, `StatCard`). The
notifications page renders its message differently again (`text-sm
text-ink-600`, no red banner at all, used for both success and error text) —
a minor inconsistency worth knowing before copying that page as a template.

## Idempotency

The **only** correct usage of the SDK's `generateIdempotencyKey()` utility on
the whole platform is in `dashboard/wallet/page.tsx`'s withdrawal form — see
`FEATURES.md`. Every other money-moving flow either doesn't use idempotency
keys at all, or (the resident app's wallet funding screen) reimplements the
same logic locally instead of importing the SDK's version.
