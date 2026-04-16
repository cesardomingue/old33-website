// kitchen-data — proxies kitchen display queries after JWT verification.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/jwt.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' };

async function requireKitchen(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const claims = token ? await verifyJWT(token) : null;
  return !!(claims && (claims.role === 'kitchen' || claims.role === 'admin'));
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (!await requireKitchen(req)) return json({ error: 'Unauthorized' }, 401, req);

  let body: { action?: string; params?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  const { action, params = {} } = body;

  // ── GET PENDING ORDERS ──────────────────────────────────────────
  if (action === 'get_orders') {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/orders?or=(status.eq.pending,status.is.null)&order=created_at.asc&limit=50`,
      { headers: H },
    );
    return json(r.ok ? await r.json() : [], 200, req);
  }

  // ── MARK ORDER DONE ─────────────────────────────────────────────
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

  return json({ error: 'Unknown action' }, 400, req);
});
