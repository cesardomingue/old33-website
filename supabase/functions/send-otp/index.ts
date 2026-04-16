// send-otp — generates a 6-digit OTP server-side, stores it in Supabase,
// and fires it off via Google Apps Script email. The code NEVER reaches the client.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EMAIL_URL = Deno.env.get('EMAIL_SCRIPT_URL')!;

// Rate limit: max 3 sends per email per 10 minutes
const MAX_SENDS = 3;
const WINDOW_MS = 10 * 60 * 1000;

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req);

  let body: { email?: string; name?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const email = (body.email || '').trim().toLowerCase();
  const name  = (body.name  || 'Member').trim().slice(0, 80);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400, req);
  }

  // Rate limit check
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const countRes = await fetch(
    `${SUPA_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(email)}&created_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
  );
  const existing = countRes.ok ? await countRes.json() : [];
  if (existing.length >= MAX_SENDS) {
    return json({ error: 'Too many codes sent. Please wait a few minutes.' }, 429, req);
  }

  // Generate code server-side
  const code = String(Math.floor(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Store in Supabase (service_role — no RLS restrictions)
  const insertRes = await fetch(`${SUPA_URL}/rest/v1/otp_codes`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ email, code, expires_at, used: false }),
  });
  if (!insertRes.ok) {
    console.error('OTP insert failed:', await insertRes.text());
    return json({ error: 'Could not create code. Try again.' }, 500, req);
  }

  // Send email via Google Apps Script (fire-and-forget — no-cors)
  fetch(EMAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ type: 'otp', email, name, code }),
  }).catch(e => console.error('Email send failed:', e));

  return json({ success: true }, 200, req);
});
