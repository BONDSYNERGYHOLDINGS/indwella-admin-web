// Full-screen branded splash, shown while the auth session is being resolved
// (see app/page.tsx and app/dashboard/layout.tsx). Mirrors the splash in the
// resident and security mobile apps: brand purple, white Indwella mark.
//
// Respects prefers-reduced-motion: the animation classes use Tailwind's
// `motion-safe:` variant, so users who opt out just see the static logo.
export function SplashScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Indwella"
      className="flex min-h-screen flex-col items-center justify-center bg-brand-500"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/splash_logo.png"
        alt=""
        width={96}
        height={96}
        className="motion-safe:animate-splash-in"
      />
      <div className="mt-8 h-1 w-28 overflow-hidden rounded-full bg-white/25">
        <div className="h-full w-1/3 rounded-full bg-white motion-safe:animate-splash-bar" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
