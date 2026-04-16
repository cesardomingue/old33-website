// admin-login — verifies credentials server-side against environment variables.
// No credentials or hashes are ever sent to the browser.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { signJWT, hashStr } from '../_shared/jwt.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_ATT  = 5;
const LOCK_MS  = 15 * 60 * 1000;
const PG       = 'admin';

async function getAttempts(ip: string): Promise<unknown[]> {
  const since = new Date(Date.now() - LOCK_MS).toISOString();
  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/pin_attempts?ip=eq.${encodeURIComponent(ip)}&page=eq.${PG}&attempted_at=gte.${encodeURIComponent(since)}&order=attempted_at.asc`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
    );
    return r.ok ? await r.json() : [];
  } catch { return []; }
}

async function logAttempt(ip: string) {
  await fetch(`${SUPA_URL}/rest/v1/pin_attempts`, {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ page: PG, ip }),
  }).catch(() => {});
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req);

  // Get client IP from Cloudflare/forwarded headers
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || req.headers.get('x-real-ip')
          || 'unknown';

  let body: { username?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const username = (body.username || '').trim();
  const password = body.password || '';

  if (!username || !password) {
    return json({ success: false, error: 'Username and password required.' }, 400, req);
  }

  // Check lockout
  const atts = await getAttempts(ip);
  if (atts.length >= MAX_ATT) {
    const lastAtt = atts[MAX_ATT - 1] as { attempted_at: string };
    const exp = new Date(lastAtt.attempted_at).getTime() + LOCK_MS;
    if (Date.now() < exp) {
      return json({ success: false, locked: true, unlocksAt: new Date(exp).toISOString() }, 429, req);
    }
  }

  // Compare credentials against env vars (server-side only — never exposed to client)
  const expectedUser = Deno.env.get('ADMIN_USERNAME') || '';
  const expectedPass = Deno.env.get('ADMIN_PASSWORD') || '';

  // Hash both sides so comparison is constant-time and strings aren't short-circuit-compared
  const [uh, ph, euh, eph] = await Promise.all([
    hashStr(username), hashStr(password),
    hashStr(expectedUser), hashStr(expectedPass),
  ]);

  if (uh === euh && ph === eph) {
    // Success — sign a 12-hour admin JWT
    const token = await signJWT({ role: 'admin', sub: 'admin' }, 12 * 3600);
    return json({ success: true, token }, 200, req);
  }

  // Failed — log attempt
  await logAttempt(ip);
  const newAtts = await getAttempts(ip);
  const remaining = Math.max(0, MAX_ATT - newAtts.length);
  return json({ success: false, remaining }, 200, req);
});
