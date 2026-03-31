/* ============================================
   OLD 33 — CHECKOUT v1
   Backend: Google Apps Script (free)
   Data:    Google Sheets (order log)
   Email:   Gmail via Apps Script
   ============================================ */

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8BPTkc_ZRuJr-KqsJF3tYVOl2Y-Ul2gLa20nAujv7KP9i3FWtJ3-sQwLLS1HZcLYm/exec';

/* Business hours — 24hr, America/New_York */
const BIZ_HOURS = {
  0: { open: 12, close: 22 }, // Sun  12PM–10PM
  1: { open: 11, close: 22 }, // Mon  11AM–10PM
  2: { open: 11, close: 22 }, // Tue  11AM–10PM
  3: null,                     // Wed  CLOSED
  4: { open: 11, close: 22 }, // Thu  11AM–10PM
  5: { open: 11, close: 23 }, // Fri  11AM–11PM
  6: { open: 11, close: 23 }, // Sat  11AM–11PM
};
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const PREP_MINS = 20;

function genOrderNum() {
  return 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6);
}

/* --- Is the restaurant open right now? --- */
function getOpenStatus() {
  const now = new Date();
  // Convert to Eastern time
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dow  = et.getDay();
  const h    = BIZ_HOURS[dow];
  if (!h) return { open: false, reason: `We're closed on Wednesdays.` };

  const mins = et.getHours() * 60 + et.getMinutes();
  const openMins  = h.open  * 60;
  const closeMins = h.close * 60;

  if (mins < openMins) {
    const opensAt = new Date(et); opensAt.setHours(h.open, 0, 0, 0);
    const timeStr = opensAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { open: false, reason: `We're not open yet — we open at ${timeStr} today.` };
  }
  if (mins >= closeMins - 30) { // stop orders 30 min before close
    return { open: false, reason: `We've stopped taking orders for tonight. See you tomorrow!` };
  }

  const readyTime = new Date(now.getTime() + PREP_MINS * 60000);
  const readyStr  = readyTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  const orderStr  = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  return { open: true, orderTime: orderStr, readyTime: readyStr };
}

/* ============================================
   CHECKOUT MODULE
   ============================================ */
const Checkout = (() => {

  function sanitize(s) {
    return String(s).replace(/[<>&"'`]/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
  }

  function open() {
    if (!Cart.load().items.length) return;
    renderForm();
    document.getElementById('checkoutModal')?.classList.add('open');
    document.getElementById('checkoutOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('checkoutModal')?.classList.remove('open');
    document.getElementById('checkoutOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderForm() {
    const cart   = Cart.load();
    const status = getOpenStatus();
    const sub    = Cart.getSubtotal();
    const tax    = Cart.getTax();
    const tip    = Cart.getTipAmt();
    const total  = Cart.getTotal();

    const itemRows = cart.items.map(item => {
      const mods = [];
      if (item.bun)            mods.push(item.bun + ' bun');
      if (item.sauce)          mods.push(item.sauce);
      if (item.extras?.length) mods.push(...item.extras.map(e => e.name));
      const lineTotal = ((item.basePrice + item.extraPerItem + (item.bunPrice||0) + (item.sidePrice||0)) * item.qty).toFixed(2);
      return `
        <div class="ck-order-item">
          <div class="ck-oi-left">
            <span class="ck-oi-name">${sanitize(item.name)}</span>
            <span class="ck-oi-qty">×${item.qty}</span>
            ${mods.length ? `<span class="ck-oi-mods">${sanitize(mods.join(', '))}</span>` : ''}
          </div>
          <span class="ck-oi-price">$${lineTotal}</span>
        </div>`;
    }).join('');

    /* Ready time banner — open or closed */
    const timeBanner = status.open
      ? `<div class="ck-ready-banner">
           <div class="ck-ready-left">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
             <div>
               <div class="ck-ready-label">Estimated Ready Time</div>
               <div class="ck-ready-time">~${sanitize(status.readyTime)}</div>
             </div>
           </div>
           <div class="ck-ready-right">
             <div class="ck-ready-label">Order Placed</div>
             <div class="ck-order-time">${sanitize(status.orderTime)}</div>
           </div>
         </div>`
      : `<div class="ck-closed-msg">
           ${sanitize(status.reason)}<br>
           <a href="tel:5407139050">(540) 713-9050</a>
         </div>`;

    document.getElementById('checkoutModal').innerHTML = `
      <div class="ck-inner">

        <div class="ck-hdr">
          <div class="ck-hdr-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color:var(--gold)">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <h3>Place Your Order</h3>
          </div>
          <button class="cart-close" onclick="Checkout.close()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="ck-body">

          <!-- Ready time / closed banner -->
          <div class="ck-section">${timeBanner}</div>

          <!-- Order summary -->
          <div class="ck-section">
            <div class="ck-sec-lbl">Order Summary</div>
            <div class="ck-order-items">${itemRows}</div>
            <div class="ck-totals">
              <div class="ck-tot-row"><span>Subtotal</span><span>$${sub.toFixed(2)}</span></div>
              <div class="ck-tot-row"><span>Tax (12.3%)</span><span>$${tax.toFixed(2)}</span></div>
              ${tip > 0 ? `<div class="ck-tot-row"><span>Tip</span><span>$${tip.toFixed(2)}</span></div>` : ''}
              <div class="ck-tot-row ck-grand"><span>Total</span><span>$${total.toFixed(2)}</span></div>
            </div>
          </div>

          <!-- Contact info -->
          <div class="ck-section">
            <div class="ck-sec-lbl">Your Info</div>
            <div class="ck-fields">
              <div class="ck-field">
                <label class="ck-label">Name <span class="ck-tag-req">Required</span></label>
                <input type="text"  id="ckName"  class="ck-input" placeholder="First & Last Name" autocomplete="name" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Phone <span class="ck-tag-req">Required</span></label>
                <input type="tel"   id="ckPhone" class="ck-input" placeholder="(540) 000-0000" autocomplete="tel" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Email <span class="ck-tag-opt">Optional — for confirmation</span></label>
                <input type="email" id="ckEmail" class="ck-input" placeholder="you@email.com" autocomplete="email" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Order Notes <span class="ck-tag-opt">Optional</span></label>
                <textarea id="ckNotes" class="ck-textarea" placeholder="Allergies, special requests for the whole order…" maxlength="300"></textarea>
              </div>
            </div>
            <input type="text" id="ckHp" tabindex="-1" autocomplete="off" style="opacity:0;position:absolute;height:0;pointer-events:none;" />
          </div>

          <div id="ckError" class="ck-error" style="display:none"></div>
        </div>

        <div class="ck-ftr">
          <div class="ck-pay-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--gold);flex-shrink:0">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Pay at pickup — cash or card accepted
          </div>
          <button class="btn btn-red ck-submit" id="ckSubmit" onclick="Checkout.submit()" ${!status.open ? 'disabled' : ''}>
            ${status.open ? `Confirm Order &nbsp;·&nbsp; $${total.toFixed(2)}` : 'Currently Closed'}
            ${status.open ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>` : ''}
          </button>
        </div>

      </div>`;
  }

  function showError(msg) {
    const el = document.getElementById('ckError');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function submit() {
    if (document.getElementById('ckHp')?.value) return;

    const status = getOpenStatus();
    if (!status.open) { showError('We are currently closed.'); return; }

    const name  = document.getElementById('ckName')?.value.trim()  || '';
    const phone = document.getElementById('ckPhone')?.value.trim() || '';
    const email = document.getElementById('ckEmail')?.value.trim() || '';
    const notes = document.getElementById('ckNotes')?.value.trim() || '';

    if (!name)                               { showError('Please enter your name.'); return; }
    if (phone.replace(/\D/g,'').length < 10) { showError('Please enter a valid 10-digit phone number.'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }

    const cart     = Cart.load();
    const sub      = Cart.getSubtotal();
    const tax      = Cart.getTax();
    const tip      = Cart.getTipAmt();
    const total    = Cart.getTotal();
    const orderNum = genOrderNum();

    const items = cart.items.map(item => {
      const mods = [];
      if (item.bun)            mods.push(item.bun + ' bun');
      if (item.side)           mods.push('Side: ' + item.side);
      if (item.temp)           mods.push(item.temp);
      if (item.sauce)          mods.push(item.sauce);
      if (item.extras?.length) mods.push(...item.extras.map(e => e.name));
      if (item.notes)          mods.push('Note: ' + item.notes);
      const linePrice = (item.basePrice + item.extraPerItem + (item.bunPrice||0) + (item.sidePrice||0)) * item.qty;
      return { name: item.name, qty: item.qty, price: linePrice.toFixed(2), mods: mods.join(', ') };
    });

    const payload = {
      orderNum, name, phone, email, notes, items,
      orderTime:  status.orderTime,
      readyTime:  status.readyTime,
      subtotal:   sub.toFixed(2),
      tax:        tax.toFixed(2),
      tip:        tip > 0 ? tip.toFixed(2) : '0.00',
      total:      total.toFixed(2),
      timestamp:  new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    };

    const btn = document.getElementById('ckSubmit');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending order…'; }

    /* Save to Supabase for dashboard */
    const SUPA_URL = 'https://nfanxvqfyfqcbsdgxowq.supabase.co';
    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYW54dnFmeWZxY2JzZGd4b3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Nzk3OTAsImV4cCI6MjA5MDU1NTc5MH0.mdcX5W246-ccjyQTeEXFTupa0lWE1nHXBAWN9r16OCs';
    fetch(SUPA_URL + '/rest/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        order_num: payload.orderNum,
        customer_name: payload.name,
        customer_phone: payload.phone,
        customer_email: payload.email || null,
        notes: payload.notes || null,
        items: payload.items,
        subtotal: parseFloat(payload.subtotal),
        tax: parseFloat(payload.tax),
        tip: parseFloat(payload.tip),
        total: parseFloat(payload.total),
        order_time: payload.orderTime,
        ready_time: payload.readyTime
      })
    }).catch(() => {}); /* silent — don't block order if Supabase fails */

    try {
      const res  = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
      const json = await res.json();
      if (json.success) {
        Cart.clear();
        showSuccess(payload);
      } else {
        throw new Error(json.error || 'Server error');
      }
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Confirm Order &nbsp;·&nbsp; $${total.toFixed(2)} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`;
      }
      showError('Could not send your order. Please call us at (540) 713-9050.');
    }
  }

  function showSuccess(data) {
    document.getElementById('checkoutModal').innerHTML = `
      <div class="ck-inner ck-success-wrap">
        <div class="ck-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="44" height="44" style="color:var(--gold)">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 class="ck-success-ttl">Order Received!</h3>
        <p class="ck-success-num">Order <strong>${sanitize(data.orderNum)}</strong></p>
        <div class="ck-success-rows">
          <div class="ck-sr"><span>Order placed</span><strong>${sanitize(data.orderTime)}</strong></div>
          <div class="ck-sr"><span>Ready around</span><strong style="color:var(--gold)">${sanitize(data.readyTime)}</strong></div>
          <div class="ck-sr"><span>Name</span><strong>${sanitize(data.name)}</strong></div>
          <div class="ck-sr"><span>Total</span><strong style="color:var(--gold)">$${data.total}</strong></div>
          <div class="ck-sr"><span>Payment</span><strong>Cash or card at pickup</strong></div>
        </div>
        ${data.email ? `<p class="ck-success-email">Confirmation sent to ${sanitize(data.email)}</p>` : ''}
        <button class="btn btn-outline" onclick="Checkout.close()" style="width:100%;justify-content:center;margin-top:28px;">Done</button>
      </div>`;
  }

  function inject() {
    const ov = document.createElement('div');
    ov.id = 'checkoutOverlay'; ov.className = 'ck-overlay';
    ov.addEventListener('click', close);
    document.body.appendChild(ov);

    const modal = document.createElement('div');
    modal.id = 'checkoutModal'; modal.className = 'ck-modal';
    document.body.appendChild(modal);
  }

  return { open, close, submit, inject };
})();

document.addEventListener('DOMContentLoaded', () => Checkout.inject());
