import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    '/auth/sign-in', 
    '/auth/sign-up', 
    '/_next', 
    '/api',
    '/_error',
    '/404',
    '/500',
    '/favicon.ico'
  ];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token');
  const isAuthenticated = !!token?.value;

  if (!isAuthenticated) {
    const loginUrl = new URL('/auth/sign-in', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};