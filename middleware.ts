import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Redirect / to /admin
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionToken = request.cookies.get('admin-session')?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  const response = NextResponse.next();

  // Cache control for admin/api routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
