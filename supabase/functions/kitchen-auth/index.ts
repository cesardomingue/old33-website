// kitchen-auth — verifies the kitchen PIN server-side against an env var.
// The PIN hash is never sent to the browser.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { signJWT, hashStr } from '../_shared/jwt.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_ATT = 5;
const LOCK_MS = 15 * 60 * 1000;
const PG      = 'kitchen';

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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || req.headers.get('x-real-ip')
          || 'unknown';

  let body: { pin?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const pin = (body.pin || '').trim();
  if (!pin || !/^\d{4}$/.test(pin)) {
    return json({ success: false, error: 'Invalid PIN format' }, 400, req);
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

  // Compare against env var (server-side only)
  const expectedPin = Deno.env.get('KITCHEN_PIN') || '';
  const [ph, eph] = await Promise.all([hashStr(pin), hashStr(expectedPin)]);

  if (ph === eph) {
    const token = await signJWT({ role: 'kitchen', sub: 'kds' }, 24 * 3600);
    return json({ success: true, token }, 200, req);
  }

  await logAttempt(ip);
  const newAtts = await getAttempts(ip);
  const remaining = Math.max(0, MAX_ATT - newAtts.length);
  return json({ success: false, remaining }, 200, req);
});
