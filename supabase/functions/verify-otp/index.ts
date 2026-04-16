// verify-otp — looks up the OTP server-side, marks it used, creates/fetches the member,
// and returns a signed JWT the client stores in localStorage.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { signJWT } from '../_shared/jwt.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EMAIL_URL = Deno.env.get('EMAIL_SCRIPT_URL')!;

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req);

  let body: { email?: string; code?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const email = (body.email || '').trim().toLowerCase();
  const code  = (body.code  || '').trim();

  if (!email || !code || !/^\d{6}$/.test(code)) {
    return json({ success: false, error: 'Invalid request' }, 400, req);
  }

  const now = new Date().toISOString();

  // Look up a valid, unused, non-expired code
  const lookupRes = await fetch(
    `${SUPA_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(email)}&code=eq.${encodeURIComponent(code)}&used=eq.false&expires_at=gte.${encodeURIComponent(now)}&order=created_at.desc&limit=1`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
  );
  const rows = lookupRes.ok ? await lookupRes.json() : [];

  if (!rows.length) {
    return json({ success: false, error: 'Incorrect or expired code. Try again or resend.' }, 200, req);
  }

  // Mark code as used
  await fetch(`${SUPA_URL}/rest/v1/otp_codes?id=eq.${rows[0].id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({ used: true }),
  });

  // Get or create member
  const memberRes = await fetch(
    `${SUPA_URL}/rest/v1/members?email=eq.${encodeURIComponent(email)}&select=id,name,email,created_at`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
  );
  let members = memberRes.ok ? await memberRes.json() : [];
  let isNew = false;

  if (!members.length) {
    // New member — get name from otp_codes or use email prefix as fallback
    const memberName = rows[0].name || email.split('@')[0];
    const createRes = await fetch(`${SUPA_URL}/rest/v1/members`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=representation',
      },
      body: JSON.stringify({ email, name: memberName }),
    });
    members = createRes.ok ? await createRes.json() : [];
    isNew = true;

    // Welcome email (fire-and-forget)
    if (members.length) {
      fetch(EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'welcome', email, name: memberName }),
      }).catch(() => {});
    }
  }

  if (!members.length) {
    return json({ success: false, error: 'Could not create account. Please try again.' }, 500, req);
  }

  const member = members[0];

  // Sign a JWT the client stores (8 hours)
  const token = await signJWT(
    { sub: member.id, email: member.email, name: member.name, role: 'member' },
    8 * 3600,
  );

  return json({ success: true, isNew, token, member: { id: member.id, name: member.name, email: member.email } }, 200, req);
});
