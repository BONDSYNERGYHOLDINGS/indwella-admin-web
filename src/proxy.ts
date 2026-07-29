import { NextRequest, NextResponse } from 'next/server';

const AUTH_FLAG_COOKIE = 'indwella_admin_authed';

export function proxy(request: NextRequest) {
  const isAuthed = request.cookies.get(AUTH_FLAG_COOKIE)?.value === '1';
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/dashboard');
  const isLoginPage = pathname === '/login';

  if (isProtected && !isAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
