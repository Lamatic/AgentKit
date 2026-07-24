const SECRET_SALT = 'agentkit-showcase-secret-v1';

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function generateSignature(payload: string): string {
  const secret = (process.env.ADMIN_PASSWORD || process.env.JUDGE_PASSWORD || 'default-key') + SECRET_SALT;
  return simpleHash(payload + secret) + simpleHash(secret + payload);
}

/**
 * Creates a stateless signed admin session token with specified expiration time.
 * @param ttlMs - Time to live in milliseconds (defaults to 2 hours).
 * @returns Signed session token string.
 */
export function createAdminSession(ttlMs: number = 60 * 60 * 2 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', expiresAt })).toString('base64url');
  const sig = generateSignature(payload);
  return `${payload}.${sig}`;
}

/**
 * Validates whether the given token is a valid, unexpired signed admin session token.
 * @param token - Admin session token string to validate.
 * @returns True if valid and unexpired; otherwise false.
 */
export function isValidAdminSession(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;
    const expectedSig = generateSignature(payload);
    if (sig !== expectedSig) return false;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.role !== 'admin') return false;
    if (Date.now() > data.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Revokes an admin session token.
 * @param _token - Admin session token to revoke.
 */
export function revokeAdminSession(_token: string | undefined): void {
  // Stateless session token
}

/**
 * Creates a stateless signed judge session token with specified expiration time.
 * @param ttlMs - Time to live in milliseconds (defaults to 2 hours).
 * @returns Signed session token string.
 */
export function createJudgeSession(ttlMs: number = 60 * 60 * 2 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ role: 'judge', expiresAt })).toString('base64url');
  const sig = generateSignature(payload);
  return `${payload}.${sig}`;
}

/**
 * Validates whether the given token is a valid, unexpired signed judge session token.
 * @param token - Judge session token string to validate.
 * @returns True if valid and unexpired; otherwise false.
 */
export function isValidJudgeSession(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payload, sig] = parts;
    const expectedSig = generateSignature(payload);
    if (sig !== expectedSig) return false;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.role !== 'judge') return false;
    if (Date.now() > data.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Revokes a judge session token.
 * @param _token - Judge session token to revoke.
 */
export function revokeJudgeSession(_token: string | undefined): void {
  // Stateless session token
}
