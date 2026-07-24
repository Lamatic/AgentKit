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

export function createAdminSession(ttlMs: number = 60 * 60 * 2 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', expiresAt })).toString('base64url');
  const sig = generateSignature(payload);
  return `${payload}.${sig}`;
}

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

export function revokeAdminSession(_token: string | undefined): void {
  // Stateless session token
}

export function createJudgeSession(ttlMs: number = 60 * 60 * 2 * 1000): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = Buffer.from(JSON.stringify({ role: 'judge', expiresAt })).toString('base64url');
  const sig = generateSignature(payload);
  return `${payload}.${sig}`;
}

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

export function revokeJudgeSession(_token: string | undefined): void {
  // Stateless session token
}
