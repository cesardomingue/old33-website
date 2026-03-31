/* ============================================
   OLD 33 — RESERVATION SYSTEM
   Same Google Apps Script backend as orders
   ============================================ */

const RES_HOURS = {
  0: { open: 12, close: 21 }, // Sun  12PM–9PM (last seating 1hr before close)
  1: { open: 11, close: 21 }, // Mon
  2: { open: 11, close: 21 }, // Tue
  3: null,                     // Wed CLOSED
  4: { open: 11, close: 21 }, // Thu
  5: { open: 11, close: 22 }, // Fri
  6: { open: 11, close: 22 }, // Sat
};
const RES_DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getResSlots() {
  // Returns available date+time slots for next 30 days
  const slots = [];
  const now   = new Date();

  for (let d = 0; d < 30; d++) {
    const day = new Date();
    day.setDate(day.getDate() + d);
    const dow = day.getDay();
    const h   = RES_HOURS[dow];
    if (!h) continue;

    const start = new Date(day); start.setHours(h.open,  0, 0, 0);
    const end   = new Date(day); end.setHours(h.close,   0, 0, 0);

    // For today, don't show times in the past (need 1hr notice)
    const earliest = d === 0 ? new Date(now.getTime() + 60 * 60000) : start;

    const times = [];
    let t = new Date(start);
    while (t < end) {
      if (t >= earliest) {
        times.push(t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
      }
      t = new Date(t.getTime() + 30 * 60000);
    }
    if (!times.length) continue;

    const dateLabel = day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const dateValue = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    slots.push({ dateLabel, dateValue, dow, times });
  }
  return slots;
}

/* ============================================
   RESERVATION MODULE
   ============================================ */
const Reservation = (() => {

  function sanitize(s) {
    return String(s).replace(/[<>&"'`]/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
  }

  function open() {
    renderForm();
    document.getElementById('resModal')?.classList.add('open');
    document.getElementById('resOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('resModal')?.classList.remove('open');
    document.getElementById('resOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderForm() {
    const slots = getResSlots();

    const dayTabs = slots.map((s, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      // Find correct slot index matching this day
      const isToday = i === 0;
      const dayAbbr = s.dateValue.split(',')[0]; // "Tue", "Wed", etc.
      const monthDay = s.dateValue.split(', ')[1] || ''; // "Mar 25"
      return `<button class="res-day-tab${i === 0 ? ' active' : ''}" data-idx="${slots.indexOf(s)}" onclick="Reservation.selectDay(${slots.indexOf(s)})">
        <span class="res-day-name">${isToday ? 'Today' : dayAbbr}</span>
        <span class="res-day-date">${monthDay}</span>
      </button>`;
    }).join('');

    document.getElementById('resModal').innerHTML = `
      <div class="res-inner">
        <div class="res-hdr">
          <div class="res-hdr-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color:var(--gold)">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3>Reserve a Table</h3>
          </div>
          <button class="cart-close" onclick="Reservation.close()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="res-body">

          ${slots.length === 0 ? `
            <div class="ck-closed-msg" style="margin:24px;">
              No available times in the next 30 days. Please call us at
              <a href="tel:5407139050">(540) 713-9050</a>
            </div>` : `

          <div class="res-section">
            <div class="res-sec-lbl">Date <span class="ck-tag-req">Required</span></div>
            <div class="res-day-tabs" id="resDayTabs">${dayTabs}</div>
          </div>

          <div class="res-section">
            <div class="res-sec-lbl">Time <span class="ck-tag-req">Required</span></div>
            <div class="res-time-grid" id="resTimeGrid"></div>
          </div>

          <div class="res-section">
            <div class="res-sec-lbl">Party Size <span class="ck-tag-req">Required</span></div>
            <div class="res-party-grid" id="resPartyGrid">
              ${[1,2,3,4,5,6,7,8,9,10].map(n =>
                `<button class="res-party-btn${n===2?' active':''}" onclick="Reservation.selectParty(this,'${n}')">${n} ${n===1?'Guest':'Guests'}</button>`
              ).join('')}
              <button class="res-party-btn res-party-call" onclick="Reservation.selectParty(this,'11+')">11+ <span style="font-size:10px">Call us</span></button>
            </div>
          </div>

          <div class="res-section">
            <div class="res-sec-lbl">Your Info</div>
            <div class="res-fields">
              <div class="res-field">
                <label class="res-label">Name <span class="ck-tag-req">Required</span></label>
                <input type="text"  id="resName"  class="ck-input" placeholder="First & Last Name" autocomplete="name" />
              </div>
              <div class="res-field">
                <label class="res-label">Phone <span class="ck-tag-req">Required</span></label>
                <input type="tel"   id="resPhone" class="ck-input" placeholder="(540) 000-0000" autocomplete="tel" />
              </div>
              <div class="res-field">
                <label class="res-label">Email <span class="ck-tag-opt">Optional — for confirmation</span></label>
                <input type="email" id="resEmail" class="ck-input" placeholder="you@email.com" autocomplete="email" />
              </div>
              <div class="res-field">
                <label class="res-label">Special Requests <span class="ck-tag-opt">Optional</span></label>
                <textarea id="resNotes" class="ck-textarea" placeholder="Birthday, anniversary, dietary needs, high chair…" maxlength="300"></textarea>
              </div>
            </div>
            <input type="text" id="resHp" tabindex="-1" autocomplete="off" style="opacity:0;position:absolute;height:0;pointer-events:none;" />
          </div>

          <div id="resError" class="ck-error" style="display:none;margin:0 24px 16px;"></div>
          `}

        </div>

        <div class="res-ftr">
          <div class="ck-pay-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--gold);flex-shrink:0"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.35a16 16 0 006.29 6.29l1.58-1.16a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            We'll confirm your reservation by phone
          </div>
          <button class="btn btn-red ck-submit" id="resSubmit" onclick="Reservation.submit()" ${slots.length === 0 ? 'disabled' : ''}>
            Request Reservation
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>`;

    // Populate times for first date
    window._resSlots = slots;
    window._resSelectedDay = 0;
    window._resSelectedTime = null;
    window._resSelectedParty = '2';
    if (slots.length) setTimeout(() => renderTimes(0), 0);
  }

  function renderTimes(idx) {
    const slots = window._resSlots || [];
    const times = slots[idx]?.times || [];
    const grid  = document.getElementById('resTimeGrid');
    if (!grid) return;
    window._resSelectedTime = null;
    grid.innerHTML = times.map(t =>
      `<button class="res-time-btn" onclick="Reservation.selectTime(this,'${t}')">${t}</button>`
    ).join('');
  }

  function selectDay(idx) {
    window._resSelectedDay = idx;
    document.querySelectorAll('.res-day-tab').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
    });
    renderTimes(idx);
  }

  function selectTime(btn, time) {
    window._resSelectedTime = time;
    document.querySelectorAll('.res-time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function selectParty(btn, val) {
    window._resSelectedParty = val;
    document.querySelectorAll('.res-party-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function updateTimes() { /* kept for backward compat */ }

  function showError(msg) {
    const el = document.getElementById('resError');
    if (!el) return;
    el.textContent = msg; el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function submit() {
    if (document.getElementById('resHp')?.value) return;

    const slots    = window._resSlots || [];
    const dateIdx  = window._resSelectedDay || 0;
    const dateStr  = slots[dateIdx]?.dateLabel || '';
    const time     = window._resSelectedTime || '';
    const party    = window._resSelectedParty || '2';
    const name     = document.getElementById('resName')?.value.trim()  || '';
    const phone    = document.getElementById('resPhone')?.value.trim() || '';
    const email    = document.getElementById('resEmail')?.value.trim() || '';
    const notes    = document.getElementById('resNotes')?.value.trim() || '';

    if (!time)                               { showError('Please select a time.'); return; }
    if (!name)                               { showError('Please enter your name.'); return; }
    if (phone.replace(/\D/g,'').length < 10) { showError('Please enter a valid phone number.'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email.'); return; }

    const payload = {
      type: 'reservation',
      name, phone, email, notes,
      date: dateStr, time, party,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    };

    const btn = document.getElementById('resSubmit');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const scriptUrl = typeof SCRIPT_URL !== 'undefined' ? SCRIPT_URL : '';
      const res  = await fetch(scriptUrl, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain' } });
      const json = await res.json();
      if (json.success) {
        showSuccess(payload);
      } else {
        throw new Error(json.error || 'Error');
      }
    } catch {
      if (btn) { btn.disabled = false; btn.innerHTML = `Request Reservation <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`; }
      showError('Could not send. Please call us at (540) 713-9050.');
    }
  }

  function showSuccess(data) {
    document.getElementById('resModal').innerHTML = `
      <div class="res-inner ck-success-wrap">
        <div class="ck-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="44" height="44" style="color:var(--gold)">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 class="ck-success-ttl">Request Sent!</h3>
        <p style="font-size:13px;color:var(--dim);margin-bottom:20px;">We'll call to confirm your table.</p>
        <div class="ck-success-rows">
          <div class="ck-sr"><span>Date</span><strong>${sanitize(data.date)}</strong></div>
          <div class="ck-sr"><span>Time</span><strong style="color:var(--gold)">${sanitize(data.time)}</strong></div>
          <div class="ck-sr"><span>Party</span><strong>${sanitize(data.party)} Guests</strong></div>
          <div class="ck-sr"><span>Name</span><strong>${sanitize(data.name)}</strong></div>
          <div class="ck-sr"><span>Phone</span><strong>${sanitize(data.phone)}</strong></div>
        </div>
        <button class="btn btn-outline" onclick="Reservation.close()" style="width:100%;justify-content:center;margin-top:28px;">Done</button>
      </div>`;
  }

  function inject() {
    const ov = document.createElement('div');
    ov.id = 'resOverlay'; ov.className = 'ck-overlay';
    ov.addEventListener('click', close);
    document.body.appendChild(ov);

    const modal = document.createElement('div');
    modal.id = 'resModal'; modal.className = 'res-modal';
    document.body.appendChild(modal);
  }

  return { open, close, submit, updateTimes, selectDay, selectTime, selectParty, inject };
})();

document.addEventListener('DOMContentLoaded', () => Reservation.inject());
