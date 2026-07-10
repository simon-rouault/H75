// Jeton d'auth signé (HMAC-SHA256) — empêche de forger le cookie utilisateur.
// Fonctionne en edge (middleware) et en node (routes) via Web Crypto.

const VALID_USERS = ['simon', 'emma'];
const enc = new TextEncoder();

function secret(): string {
  return process.env.AUTH_SECRET || 'dev-secret-change-me';
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function signToken(userId: string): Promise<string> {
  return `${userId}.${await hmac(userId)}`;
}

export async function verifyToken(token?: string | null): Promise<string | null> {
  if (!token) return null;
  const [userId, sig] = token.split('.');
  if (!userId || !sig || !VALID_USERS.includes(userId)) return null;
  const expected = await hmac(userId);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? userId : null;
}
