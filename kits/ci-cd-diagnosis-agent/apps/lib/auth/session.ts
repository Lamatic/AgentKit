import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "__Host-agentkit-session";
const STATE_COOKIE = "__Host-gh-oauth-state";

// Default secret for dev fallback if env var is missing
const DEFAULT_SECRET = "agentkit_github_oauth_session_secret_32_chars_min!";

function getSecretKey(): Buffer {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.SESSION_SECRET ||
      process.env.SESSION_SECRET === DEFAULT_SECRET ||
      process.env.SESSION_SECRET.trim() === "")
  ) {
    throw new Error(
      "SESSION_SECRET must be configured with a secure, unique 32+ char secret in production."
    );
  }
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

export interface SessionData {
  accessToken?: string;
  user?: {
    login: string;
    avatarUrl: string;
    email?: string;
    name?: string;
  };
}

/**
 * Encrypts a JavaScript object using AES-256-GCM
 */
export function encryptData(data: Record<string, unknown>): string {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string
 */
export function decryptData<T>(encryptedString: string): T | null {
  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, tagHex, encryptedHex] = parts;
    const key = getSecretKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

/**
 * Get current session from HTTP-only cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE) || cookieStore.get("__agentkit-session");
  if (!cookie?.value) return null;

  return decryptData<SessionData>(cookie.value);
}

/**
 * Set encrypted session cookie
 */
export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encryptData(data as Record<string, unknown>);
  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? SESSION_COOKIE : "__agentkit-session";

  cookieStore.set(cookieName, encrypted, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? SESSION_COOKIE : "__agentkit-session";

  cookieStore.delete(cookieName);
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("__agentkit-session");
}

/**
 * Store OAuth CSRF state temporarily (10 minute expiry)
 */
export async function setOAuthState(state: string): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? STATE_COOKIE : "__gh-oauth-state";

  cookieStore.set(cookieName, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });
}

/**
 * Validate and clear OAuth CSRF state
 */
export async function popOAuthState(): Promise<string | null> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? STATE_COOKIE : "__gh-oauth-state";
  
  const cookie = cookieStore.get(cookieName) || cookieStore.get("__gh-oauth-state");
  if (!cookie?.value) return null;

  cookieStore.delete(cookieName);
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete("__gh-oauth-state");
  return cookie.value;
}
