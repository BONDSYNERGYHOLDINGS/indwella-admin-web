// Small in-content loading indicator for route transitions and data fetches,
// as opposed to <SplashScreen />, which is the full-screen app-start screen.
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-400"
    >
      <div className="h-8 w-8 rounded-full border-[3px] border-brand-100 border-t-brand-500 motion-safe:animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
