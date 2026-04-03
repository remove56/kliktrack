import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only protect the dashboard route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const password = process.env.DASHBOARD_PASSWORD;

    // If no password is set, allow access (backwards compatible)
    if (!password) return NextResponse.next();

    // Check for auth cookie
    const authCookie = request.cookies.get('kliktrack_auth');
    if (authCookie?.value === password) {
      return NextResponse.next();
    }

    // Check for password in query param (login form submission)
    const inputPassword = request.nextUrl.searchParams.get('pw');
    if (inputPassword === password) {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      response.cookies.set('kliktrack_auth', password, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }

    // Redirect to login page
    return NextResponse.rewrite(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
