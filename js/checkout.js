/* ============================================
   OLD 33 — CHECKOUT v1
   Backend: Google Apps Script (free)
   Data:    Google Sheets (order log)
   Email:   Gmail via Apps Script
   ============================================ */


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

/* --- Member discount --- */
function getMemberDiscount() {
  try {
    var m = JSON.parse(localStorage.getItem('ol33_member') || 'null');
    if (!m || !m.email) return { member: null, pct: 0 };
    // Always 10% — never trust client-supplied discount rate
    return { member: m, pct: 10 };
  } catch(e) { return { member: null, pct: 0 }; }
}

/* --- Is the restaurant open right now? --- */
function getOpenStatus() {
  const now    = new Date();
  const nyNow  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day    = nyNow.getDay();
  const hour   = nyNow.getHours();
  const minute = nyNow.getMinutes();
  const nowMins = hour * 60 + minute;
  const hours  = BIZ_HOURS[day];

  const orderStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

  // Block orders if ready time would go past closing (last order = close - prep time)
  const lastOrderMins = hours ? hours.close * 60 - PREP_MINS : 0;

  if (!hours || nowMins < hours.open * 60 || nowMins >= hours.close * 60 || nowMins >= lastOrderMins) {
    // Find next open day/time
    let nextDay = null, daysAhead = 0;
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (BIZ_HOURS[d]) { nextDay = d; daysAhead = i; break; }
    }
    const nextHours = BIZ_HOURS[nextDay];
    const nextLabel = daysAhead === 1 ? 'Tomorrow' : DAY_NAMES[nextDay];
    const nextTime  = (nextHours.open > 12 ? nextHours.open - 12 : nextHours.open) +
                      ':00 ' + (nextHours.open >= 12 ? 'PM' : 'AM');
    return { open: false, nextLabel, nextTime, reason: `We\'re closed right now. Opens ${nextLabel} at ${nextTime}.` };
  }

  const readyTime = new Date(now.getTime() + PREP_MINS * 60000);
  const readyStr  = readyTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
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
    const { member: ckMember, pct: discountPct } = getMemberDiscount();
    const discountAmt = discountPct > 0 ? sub * (discountPct / 100) : 0;
    const total  = sub - discountAmt + tax + tip;

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

    const saved = (() => { try { return JSON.parse(localStorage.getItem('ol33_info') || '{}'); } catch(e) { return {}; } })();

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
            ${ckMember ? `<div style="display:flex;align-items:center;gap:8px;background:rgba(200,168,75,.08);border:1px solid rgba(200,168,75,.2);border-radius:8px;padding:8px 12px;margin-bottom:10px;"><svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="color:var(--gold);flex-shrink:0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span style="font-size:12px;color:var(--gold);font-weight:700;">33 Club member — ${discountPct}% discount applied</span></div>` : ''}
            <div class="ck-totals">
              <div class="ck-tot-row"><span>Subtotal</span><span>$${sub.toFixed(2)}</span></div>
              ${discountAmt > 0 ? `<div class="ck-tot-row" style="color:var(--gold)"><span>33 Club Discount (${discountPct}% off)</span><span>−$${discountAmt.toFixed(2)}</span></div>` : ''}
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
                <input type="text"  id="ckName"  class="ck-input" placeholder="First & Last Name" autocomplete="name" value="${sanitize(saved.name||'')}" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Phone <span class="ck-tag-req">Required</span></label>
                <input type="tel"   id="ckPhone" class="ck-input" placeholder="(540) 000-0000" autocomplete="tel" value="${sanitize(saved.phone||'')}" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Email <span class="ck-tag-opt">Optional — for confirmation</span></label>
                <input type="email" id="ckEmail" class="ck-input" placeholder="you@email.com" autocomplete="email" value="${sanitize(saved.email||'')}" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Order Notes <span class="ck-tag-opt">Optional</span></label>
                <textarea id="ckNotes" class="ck-textarea" placeholder="Allergies, special requests for the whole order…" maxlength="300"></textarea>
              </div>
              <div class="ck-field" style="flex-direction:row;align-items:center;gap:10px;padding-top:4px;">
                <input type="checkbox" id="ckRemember" style="width:16px;height:16px;accent-color:var(--gold);cursor:pointer;flex-shrink:0;" ${saved.name ? 'checked' : ''} />
                <label for="ckRemember" style="font-size:13px;color:var(--dim);cursor:pointer;font-weight:400;margin:0;">Remember my info for next time</label>
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

    const cart  = Cart.load();
    const tip   = Cart.getTipAmt();

    // Build item list to send — server recalculates all prices
    const items = cart.items.map(item => ({
      name:   item.name,
      qty:    item.qty,
      bun:    item.bun   || undefined,
      side:   item.side  || undefined,
      extras: item.extras?.length ? item.extras : undefined,
    }));

    // Save info to localStorage if "remember me" checked
    const remember = document.getElementById('ckRemember')?.checked;
    if (remember) {
      localStorage.setItem('ol33_info', JSON.stringify({ name, phone, email }));
    } else {
      localStorage.removeItem('ol33_info');
    }

    const btn = document.getElementById('ckSubmit');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending order…'; }

    // Send to edge function — server validates prices, verifies member, saves order, sends emails
    const EDGE_URL  = 'https://nfanxvqfyfqcbsdgxowq.supabase.co/functions/v1';
    const memberToken = localStorage.getItem('ol33_token') || undefined;

    let data;
    try {
      const res = await fetch(EDGE_URL + '/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, tip, name, phone, email, notes, memberToken })
      });
      data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Order failed');
    } catch(e) {
      console.error('Order failed:', e);
      if (btn) { btn.disabled = false; btn.textContent = 'Confirm Order'; }
      showError(e.message && e.message !== 'Order failed'
        ? e.message
        : 'Could not send your order. Please call us at (540) 713-9050 to place it.');
      return;
    }

    Cart.clear();
    showSuccess({
      orderNum:  data.orderNum,
      orderTime: data.orderTime,
      readyTime: data.readyTime,
      total:     data.total,
      name,
      email,
    });
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
