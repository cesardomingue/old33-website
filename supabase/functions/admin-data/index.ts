// admin-data — all admin queries/mutations go through here after JWT verification.
// The anon key is never used for admin operations.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/jwt.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };

async function requireAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const claims = token ? await verifyJWT(token) : null;
  return !!(claims && claims.role === 'admin');
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (!await requireAdmin(req)) return json({ error: 'Unauthorized' }, 401, req);

  let body: { action?: string; params?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const { action, params = {} } = body;

  // ── GET ORDERS ──────────────────────────────────────────────────
  if (action === 'get_orders') {
    const limit = Math.min(Number(params.limit) || 1000, 5000);
    const r = await fetch(
      `${SUPA_URL}/rest/v1/orders?order=created_at.desc&limit=${limit}`,
      { headers: H },
    );
    return json(r.ok ? await r.json() : [], 200, req);
  }

  // ── UPDATE ORDER STATUS ─────────────────────────────────────────
  if (action === 'update_order') {
    const id     = String(params.id || '');
    const status = String(params.status || '');
    if (!id || !['pending', 'done'].includes(status)) {
      return json({ error: 'Invalid id or status' }, 400, req);
    }
    const r = await fetch(`${SUPA_URL}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
    });
    return json({ success: r.ok }, r.ok ? 200 : 500, req);
  }

  // ── GET CONTACTS ────────────────────────────────────────────────
  if (action === 'get_contacts') {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/contacts?order=created_at.desc&limit=200`,
      { headers: H },
    );
    return json(r.ok ? await r.json() : [], 200, req);
  }

  // ── UPDATE CONTACT ──────────────────────────────────────────────
  if (action === 'update_contact') {
    const id     = String(params.id || '');
    const status = String(params.status || '');
    if (!id) return json({ error: 'Invalid id' }, 400, req);
    const r = await fetch(`${SUPA_URL}/rest/v1/contacts?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
    });
    return json({ success: r.ok }, r.ok ? 200 : 500, req);
  }

  // ── GET MEMBERS ─────────────────────────────────────────────────
  if (action === 'get_members') {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/members?order=created_at.desc&limit=500`,
      { headers: H },
    );
    return json(r.ok ? await r.json() : [], 200, req);
  }

  return json({ error: 'Unknown action' }, 400, req);
});
