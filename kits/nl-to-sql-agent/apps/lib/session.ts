import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { resolveDemoRestriction } from '@/lib/demo-questions';

export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
  /** Marks a session as a restricted demo session (limited to approved questions). */
  isDemo?: boolean;
}

/**
 * Session signing secret. It must be explicitly configured; there is NO
 * public fallback. A missing secret fails closed so sessions can never be
 * forged with a predictable default value.
 */
function getSessionPassword(): string {
  const password = process.env.SESSION_PASSWORD;
  if (!password) {
    throw new Error(
      "SESSION_PASSWORD is not set. Set a strong secret (at least 32 characters) in your environment configuration."
    );
  }
  if (password.length < 32) {
    throw new Error(
      "SESSION_PASSWORD is too short. Use a strong secret of at least 32 characters."
    );
  }
  return password;
}

function getSessionOptions() {
  return {
    password: getSessionPassword(),
    cookieName: 'nl-to-sql-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
    },
  };
}

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());

  if (!session || !session.isLoggedIn) {
    return { isLoggedIn: false };
  }

  return {
    isLoggedIn: true,
    userId: session.userId,
    // Fail-closed: a logged-in session whose isDemo is missing/undefined
    // (e.g. a legacy session created before the field existed) is resolved to
    // demo-restricted, never to an unrestricted non-demo session.
    isDemo: resolveDemoRestriction(session.isDemo),
  };
}

export async function setSession(sessionData: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());

  Object.assign(session, sessionData);
  await session.save();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());
  session.destroy();
}
