'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminSession, revokeAdminSession, createJudgeSession, revokeJudgeSession } from '../lib/session';
import { verifyJudgeCredentials } from './orchestrate';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Authenticates an admin user against the environment ADMIN_PASSWORD.
 * Creates a server-side signed session token and sets an HTTP-only cookie.
 * @param password - Password string entered by admin.
 * @returns Promise resolving to an object indicating authentication success or error message.
 */
export async function login(password: string) {
  if (!ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD environment variable is not set.');
  }

  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    const sessionToken = createAdminSession(60 * 60 * 2 * 1000);
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2 // 2 hours auto-expire
    });
    return { success: true };
  }

  return { success: false, error: 'Invalid password' };
}

/**
 * Logs out the active admin session by revoking the session token and removing session cookies.
 */
export async function logout() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  if (sessionCookie?.value) {
    revokeAdminSession(sessionCookie.value);
  }
  cookieStore.delete('admin_session');
  redirect('/admin/login');
}

/**
 * Authenticates a judge user against configured judge credentials.
 * @param password - Judge access code or password string.
 * @param name - Optional judge display name.
 * @returns Promise resolving to an object indicating authentication success or error message.
 */
export async function judgeLogin(password: string, name?: string) {
  if (!password) {
    return { success: false, error: 'Password is required' };
  }

  const { valid, judgeName } = await verifyJudgeCredentials(password, name);
  if (!valid) {
    return { success: false, error: 'Invalid judge credentials' };
  }

  const cookieStore = await cookies();
  const sessionToken = createJudgeSession(60 * 60 * 2 * 1000);
  
  cookieStore.set('judge_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2 // 2 hours auto-expire
  });

  cookieStore.set('judge_name', judgeName, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2 // 2 hours auto-expire
  });

  return { success: true };
}

/**
 * Logs out the active judge session and removes judge session cookies.
 */
export async function judgeLogout() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('judge_session');
  if (sessionCookie?.value) {
    revokeJudgeSession(sessionCookie.value);
  }
  cookieStore.delete('judge_session');
  cookieStore.delete('judge_name');
  redirect('/judge/login');
}
