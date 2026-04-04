import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * When the app is served on the admin hostname, send visitors to /admin/login
 * instead of the public marketing / user routes.
 */
function adminHostMatches(host: string): boolean {
  const h = host.split(':')[0].toLowerCase();
  const configured = process.env.NEXT_PUBLIC_ADMIN_HOST?.toLowerCase().trim();
  if (configured) return h === configured;
  return h.startsWith('admin.');
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  if (!adminHostMatches(host)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  if (pathname === '/favicon.ico' || pathname === '/icon.svg') {
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/wallet')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
