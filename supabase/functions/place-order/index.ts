// place-order — recalculates the entire order total server-side using canonical prices,
// verifies member discount by checking Supabase, saves the order, and sends emails.
// The client can never manipulate prices or discount amounts.
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/jwt.ts';
import { priceCart, type OrderItem } from '../_shared/prices.ts';

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EMAIL_URL = Deno.env.get('EMAIL_SCRIPT_URL')!;

// Business hours (America/New_York) — must match checkout.js
const BIZ_HOURS: Record<number, { open: number; close: number } | null> = {
  0: { open: 12, close: 22 }, // Sun
  1: { open: 11, close: 22 }, // Mon
  2: { open: 11, close: 22 }, // Tue
  3: null,                    // Wed CLOSED
  4: { open: 11, close: 22 }, // Thu
  5: { open: 11, close: 23 }, // Fri
  6: { open: 11, close: 23 }, // Sat
};
const PREP_MINS = 20;

function isOpen(): boolean {
  const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h = BIZ_HOURS[ny.getDay()];
  if (!h) return false;
  const mins = ny.getHours() * 60 + ny.getMinutes();
  return mins >= h.open * 60 && mins < h.close * 60 - PREP_MINS;
}

function genOrderNum(): string {
  return 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6);
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, req);

  if (!isOpen()) {
    return json({ error: 'Restaurant is currently closed.' }, 400, req);
  }

  let body: {
    items?: OrderItem[];
    tip?: number;
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    memberToken?: string;
  };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400, req); }

  // Sanitize customer info
  const name  = (body.name  || '').trim().slice(0, 80);
  const phone = (body.phone || '').trim().slice(0, 20);
  const email = (body.email || '').trim().toLowerCase().slice(0, 120);
  const notes = (body.notes || '').trim().slice(0, 300);
  const items = body.items;
  const tip   = Math.max(0, parseFloat(String(body.tip || 0)) || 0);

  if (!name || !phone) return json({ error: 'Name and phone are required.' }, 400, req);
  if (!Array.isArray(items) || !items.length) return json({ error: 'No items in order.' }, 400, req);

  // Verify member status server-side — never trust the client
  let isMember = false;
  let memberEmail = '';
  if (body.memberToken) {
    const claims = await verifyJWT(body.memberToken);
    if (claims && claims.role === 'member' && claims.email) {
      // Double-check email exists in members table
      const mRes = await fetch(
        `${SUPA_URL}/rest/v1/members?email=eq.${encodeURIComponent(claims.email as string)}&select=id`,
        { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } },
      );
      const mRows = mRes.ok ? await mRes.json() : [];
      if (mRows.length) { isMember = true; memberEmail = claims.email as string; }
    }
  }

  // Recalculate totals server-side
  const result = priceCart(items, tip, isMember);
  if ('error' in result) return json({ error: result.error }, 400, req);

  const { subtotal, tax, discount, total } = result;
  const orderNum = genOrderNum();

  const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const orderTime = nyNow.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const readyTime = new Date(Date.now() + PREP_MINS * 60000)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

  // Format items for storage
  const storedItems = result.items.map(i => ({
    name: i.name,
    qty: i.qty,
    price: i.lineTotal.toFixed(2),
    mods: i.mods.join(', '),
  }));

  // Save to Supabase
  const insertRes = await fetch(`${SUPA_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      order_num: orderNum,
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      notes: notes || null,
      items: storedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: discount > 0 ? parseFloat(discount.toFixed(2)) : null,
      tax: parseFloat(tax.toFixed(2)),
      tip: parseFloat(tip.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      is_member: isMember || null,
      order_time: orderTime,
      ready_time: readyTime,
      status: 'pending',
    }),
  });

  if (!insertRes.ok) {
    console.error('Order insert failed:', await insertRes.text());
    return json({ error: 'Could not save order. Please call (540) 713-9050.' }, 500, req);
  }

  // Send emails (fire-and-forget — don't block the response)
  const emailPayload = {
    name, email, orderNum,
    items: storedItems,
    subtotal: subtotal.toFixed(2),
    discount: discount > 0 ? discount.toFixed(2) : null,
    tax: tax.toFixed(2),
    tip: tip.toFixed(2),
    total: total.toFixed(2),
    readyTime, orderTime,
    isMember,
  };
  fetch(EMAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(emailPayload),
  }).catch(() => {});

  return json({ success: true, orderNum, readyTime, orderTime, total: total.toFixed(2) }, 200, req);
});
