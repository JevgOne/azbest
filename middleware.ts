import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect / to /admin
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Redirect /admin to /admin/dashboard or /admin/login
  if (pathname === '/admin') {
    const sessionToken = request.cookies.get('admin-session')?.value;
    if (sessionToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin/') && pathname !== '/admin/login') {
    const sessionToken = request.cookies.get('admin-session')?.value;
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin', '/admin/:path*'],
};
