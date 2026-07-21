'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function login(password: string) {
  if (!ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD environment variable is not set.');
  }

  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    // Simple obscuration so the raw password isn't visible in the DevTools Cookies tab
    const obscuredToken = btoa(password).split('').reverse().join('');
    cookieStore.set('admin_session', obscuredToken, {
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
  cookieStore.delete('admin_session');
  redirect('/admin/login');
}

export async function judgeLogin(password: string, name?: string) {
  const cookieStore = await cookies();
  const obscuredToken = btoa(password).split('').reverse().join('');
  
  cookieStore.set('judge_session', obscuredToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 2 // 2 hours auto-expire
  });

  if (name) {
    cookieStore.set('judge_name', name, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2 // 2 hours auto-expire
    });
  }

  return { success: true };
}

export async function judgeLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('judge_session');
  cookieStore.delete('judge_name');
  redirect('/judge/login');
}
