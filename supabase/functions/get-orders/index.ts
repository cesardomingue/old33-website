// get-orders — returns the authenticated member's order history.
// Requires Authorization: Bearer <member_jwt> header.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/jwt.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405, req);

  // Verify member JWT
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const claims = token ? await verifyJWT(token) : null;

  if (!claims || claims.role !== 'member' || !claims.email) {
    return json({ error: 'Unauthorized' }, 401, req);
  }

  const email = claims.email as string;

  const res = await fetch(
    `${SUPA_URL}/rest/v1/orders?customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=50`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
  );

  if (!res.ok) return json({ error: 'Could not load orders' }, 500, req);

  const orders = await res.json();
  return json({ orders }, 200, req);
});
