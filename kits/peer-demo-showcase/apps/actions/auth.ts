'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminSession, revokeAdminSession, createJudgeSession, revokeJudgeSession } from '../lib/session';
import { verifyJudgeCredentials } from './orchestrate';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

export async function logout() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  if (sessionCookie?.value) {
    revokeAdminSession(sessionCookie.value);
  }
  cookieStore.delete('admin_session');
  redirect('/admin/login');
}

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
