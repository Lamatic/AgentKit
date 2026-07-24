const ADMIN_SESSIONS_KEY = Symbol.for('admin_sessions_store');
const JUDGE_SESSIONS_KEY = Symbol.for('judge_sessions_store');

interface SessionData {
  expiresAt: number;
}

type SessionStore = Map<string, SessionData>;

const globalStore = globalThis as unknown as {
  [ADMIN_SESSIONS_KEY]?: SessionStore;
  [JUDGE_SESSIONS_KEY]?: SessionStore;
};

if (!globalStore[ADMIN_SESSIONS_KEY]) {
  globalStore[ADMIN_SESSIONS_KEY] = new Map<string, SessionData>();
}
if (!globalStore[JUDGE_SESSIONS_KEY]) {
  globalStore[JUDGE_SESSIONS_KEY] = new Map<string, SessionData>();
}

const adminSessions: SessionStore = globalStore[ADMIN_SESSIONS_KEY]!;
const judgeSessions: SessionStore = globalStore[JUDGE_SESSIONS_KEY]!;

export function createAdminSession(ttlMs: number = 60 * 60 * 2 * 1000): string {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + ttlMs;
  adminSessions.set(token, { expiresAt });
  return token;
}

export function isValidAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

export function revokeAdminSession(token: string | undefined): void {
  if (token) {
    adminSessions.delete(token);
  }
}

export function createJudgeSession(ttlMs: number = 60 * 60 * 2 * 1000): string {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + ttlMs;
  judgeSessions.set(token, { expiresAt });
  return token;
}

export function isValidJudgeSession(token: string | undefined): boolean {
  if (!token) return false;
  const session = judgeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    judgeSessions.delete(token);
    return false;
  }
  return true;
}

export function revokeJudgeSession(token: string | undefined): void {
  if (token) {
    judgeSessions.delete(token);
  }
}
