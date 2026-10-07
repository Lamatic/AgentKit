import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST(request: Request) {
  await destroySession();
  // 303 See Other forces the browser to follow the redirect with GET after the POST.
  return NextResponse.redirect(new URL('/login', request.url), 303);
}