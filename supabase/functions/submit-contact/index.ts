// submit-contact — saves a contact form submission server-side.
// Rate-limited by IP to prevent spam.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_PER_HOUR = 5;

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  let body: { name?: string; email?: string; phone?: string; subject?: string; message?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const name    = (body.name    || '').trim().slice(0, 80);
  const email   = (body.email   || '').trim().toLowerCase().slice(0, 120);
  const phone   = (body.phone   || '').trim().slice(0, 20);
  const subject = (body.subject || '').trim().slice(0, 100);
  const message = (body.message || '').trim().slice(0, 2000);

  if (!name || !email || !message) {
    return json({ error: 'Name, email, and message are required.' }, 400, req);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email address.' }, 400, req);
  }

  // Rate limit: max 5 submissions per IP per hour
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const countRes = await fetch(
    `${SUPA_URL}/rest/v1/contacts?ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
  ).catch(() => null);
  if (countRes?.ok) {
    const rows = await countRes.json().catch(() => []);
    if (Array.isArray(rows) && rows.length >= MAX_PER_HOUR) {
      return json({ error: 'Too many submissions. Please try again later.' }, 429, req);
    }
  }

  const res = await fetch(`${SUPA_URL}/rest/v1/contacts`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ name, email, phone: phone || null, subject: subject || null, message, ip }),
  });

  if (!res.ok) {
    console.error('Contact insert failed:', await res.text());
    return json({ error: 'Could not submit. Please try again.' }, 500, req);
  }

  return json({ success: true }, 200, req);
});
