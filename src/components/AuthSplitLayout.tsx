export function AuthSplitLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-500 to-brand-400 p-12 text-white lg:flex">
        <div className="relative z-10 text-2xl font-bold tracking-tight">Indwella</div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Run your estate from one dashboard.</h1>
        </div>
        <div className="relative z-10 text-sm text-brand-50/70">© {new Date().getFullYear()} Indwella</div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/10" />
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
