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
| `dashboard/notifications/page.tsx` | `notificationsApi.list()`, `.broadcast()` |
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

Same repeated pattern as the mobile apps, but slightly more consistently
typed:

```ts
} catch (err: any) {
  setError(err?.response?.data?.detail || 'Fallback message');
}
```

rendered inline as a red bordered banner
(`rounded-lg border border-red-200 bg-red-50 ...`) — this exact class string
is copy-pasted across every form in the app rather than extracted into a
shared `<ErrorBanner>` component, despite the app otherwise having a
well-factored shared component set (`DataTable`, `Badge`, `PageHeader`,
`StatCard`).

## Idempotency

The **only** correct usage of the SDK's `generateIdempotencyKey()` utility on
the whole platform is in `dashboard/wallet/page.tsx`'s withdrawal form — see
`FEATURES.md`. Every other money-moving flow either doesn't use idempotency
keys at all, or (the resident app's wallet funding screen) reimplements the
same logic locally instead of importing the SDK's version.
