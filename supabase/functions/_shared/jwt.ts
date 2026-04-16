// Simple HMAC-SHA256 JWT — no external deps needed
function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(s: string): Uint8Array {
  return Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
  );
}

function getSecret(): string {
  const s = Deno.env.get('JWT_SECRET');
  if (!s) throw new Error('JWT_SECRET env var not set');
  return s;
}

export async function signJWT(
  payload: Record<string, unknown>,
  expiresInSeconds = 3600,
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds };
  const hdr = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const pld = b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const data = `${hdr}.${pld}`;
  const key = await getKey(getSecret());
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

export async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [hdr, pld, sig] = parts;
    const data = `${hdr}.${pld}`;
    const key = await getKey(getSecret());
    const valid = await crypto.subtle.verify(
      'HMAC', key, fromB64url(sig), new TextEncoder().encode(data),
    );
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(pld)));
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function hashStr(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}
