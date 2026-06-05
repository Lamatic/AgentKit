import { ForgeSession } from './types';

const KEY = 'forge_session';

export function getSession(): Partial<ForgeSession> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

export function updateSession(patch: Partial<ForgeSession>) {
  const current = getSession();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
