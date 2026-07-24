import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidAdminSession, isValidJudgeSession } from './lib/session';

export function proxy(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Only protect the /admin routes, but allow access to /admin/login
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get('admin_session');

    // If there's no password set in env, we might want to block access entirely in prod, 
    // but for the template let's just enforce the check if the env is present.
    if (!adminPassword) {
      console.warn("ADMIN_PASSWORD is not set in environment variables.");
    }

    // Verify the session cookie is a valid active server-side session token
    if (!sessionCookie || !isValidAdminSession(sessionCookie.value)) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect /judge routes, but allow /judge/login
  if (request.nextUrl.pathname.startsWith('/judge') && request.nextUrl.pathname !== '/judge/login') {
    const judgeSessionCookie = request.cookies.get('judge_session');
    if (!judgeSessionCookie || !isValidJudgeSession(judgeSessionCookie.value)) {
      return NextResponse.redirect(new URL('/judge/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes under /admin and /judge
  matcher: ['/admin/:path*', '/judge/:path*'],
};
