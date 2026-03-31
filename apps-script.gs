// ============================================================
//  OLD 33 BEER & BURGER GRILL — Order Handler
//  Deploy this at: script.google.com
//  Steps at bottom of this file
// ============================================================

const RESTAURANT_EMAIL = 'cesardom200714@gmail.com';
const SHEET_NAME       = 'Orders'; // tab name in your Google Sheet

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'reservation') {
      logReservation(data);
      try { emailReservation(data); } catch(e) { Logger.log('Res email failed: ' + e); }
      try { if (data.email) emailReservationCustomer(data); } catch(e) { Logger.log('Res customer email failed: ' + e); }
      return jsonResponse({ success: true });
    }

    // Default: order
    logToSheet(data);
    try { emailRestaurant(data); } catch(e) { Logger.log('Restaurant email failed: ' + e); }
    try { if (data.email) emailCustomer(data); } catch(e) { Logger.log('Customer email failed: ' + e); }
    return jsonResponse({ success: true, orderNum: data.orderNum });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// Needed for CORS preflight (OPTIONS request)
function doGet(e) {
  return jsonResponse({ status: 'Old 33 Order API active' });
}

// ─────────────────────────────────────────
//  LOG TO GOOGLE SHEET
// ─────────────────────────────────────────
function logToSheet(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);

  // Auto-create sheet + header row if it doesn't exist yet
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Order #','Date & Time','Customer Name','Phone','Email',
      'Items & Customizations','Subtotal','Tax (12.3%)','Tip','Total',
      'Notes / Special Requests','Status'
    ]);
    // Bold + freeze header
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const itemsSummary = data.items.map(i =>
    i.name + ' x' + i.qty + ' — $' + i.price + (i.mods ? ' (' + i.mods + ')' : '')
  ).join('\n');

  sheet.appendRow([
    data.orderNum,
    data.timestamp,
    data.name,
    data.phone,
    data.email || '',
    itemsSummary,
    '$' + data.subtotal,
    '$' + data.tax,
    '$' + data.tip,
    '$' + data.total,
    data.notes || '',
    'New'
  ]);
}

// ─────────────────────────────────────────
//  EMAIL TO RESTAURANT
// ─────────────────────────────────────────
function emailRestaurant(data) {
  const itemsHtml = data.items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #222;">${i.name} ×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;color:#888;font-size:13px;">${i.mods || '—'}</td>
      <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right;font-weight:600;">$${i.price}</td>
    </tr>`).join('');

  const html = `
  <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f2ec;padding:32px;max-width:560px;margin:0 auto;border-radius:8px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;border-bottom:2px solid #d4941a;padding-bottom:20px;">
      <div>
        <div style="font-size:22px;font-weight:700;color:#d4941a;letter-spacing:2px;">OLD 33</div>
        <div style="font-size:11px;color:#686868;letter-spacing:3px;text-transform:uppercase;">Beer & Burger Grill</div>
      </div>
    </div>

    <div style="background:#181818;border-radius:6px;padding:20px;margin-bottom:20px;">
      <div style="font-size:11px;color:#686868;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">New Order</div>
      <div style="font-size:24px;font-weight:700;color:#d4941a;">${data.orderNum}</div>
      <div style="font-size:14px;color:#a8a8a8;margin-top:4px;">${data.timestamp}</div>
    </div>

    <div style="background:#181818;border-radius:6px;padding:20px;margin-bottom:20px;">
      <div style="font-size:11px;color:#686868;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Customer</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:4px;">${data.name}</div>
      <div style="font-size:14px;color:#d4941a;margin-bottom:4px;"><a href="tel:${data.phone}" style="color:#d4941a;">${data.phone}</a></div>
      ${data.email ? `<div style="font-size:13px;color:#686868;">${data.email}</div>` : ''}
    </div>

    <div style="background:#d4941a;color:#000;border-radius:6px;padding:16px 20px;margin-bottom:20px;font-weight:700;font-size:16px;">
      ⏰ Ready ~ ${data.readyTime || data.pickupLabel || "ASAP"}
    </div>

    <div style="background:#181818;border-radius:6px;padding:20px;margin-bottom:20px;">
      <div style="font-size:11px;color:#686868;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Items</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="font-size:11px;color:#686868;text-transform:uppercase;">
            <th style="text-align:left;padding-bottom:8px;">Item</th>
            <th style="text-align:left;padding-bottom:8px;">Mods</th>
            <th style="text-align:right;padding-bottom:8px;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #333;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#686868;margin-bottom:4px;">
          <span>Subtotal</span><span>$${data.subtotal}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#686868;margin-bottom:4px;">
          <span>Tax (12.3%)</span><span>$${data.tax}</span>
        </div>
        ${parseFloat(data.tip) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#686868;margin-bottom:4px;"><span>Tip</span><span>$${data.tip}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:#d4941a;margin-top:8px;padding-top:8px;border-top:1px solid #333;">
          <span>TOTAL</span><span>$${data.total}</span>
        </div>
      </div>
    </div>

    ${data.notes ? `<div style="background:#181818;border-radius:6px;padding:16px 20px;margin-bottom:20px;border-left:3px solid #d4941a;"><div style="font-size:11px;color:#686868;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Order Notes</div><div style="font-size:14px;color:#f5f2ec;">${data.notes}</div></div>` : ''}

    <div style="text-align:center;font-size:12px;color:#444;margin-top:24px;">
      Payment at pickup — cash or card<br>
      <a href="mailto:Route33bbg@gmail.com" style="color:#444;">Route33bbg@gmail.com</a>
    </div>
  </div>`;

  MailApp.sendEmail({
    to:      RESTAURANT_EMAIL,
    subject: `🧾 Order ${data.orderNum} — ${data.name} | Ready ~${data.readyTime || data.pickupLabel || "ASAP"}`,
    htmlBody: html
  });
}

// ─────────────────────────────────────────
//  CONFIRMATION EMAIL TO CUSTOMER
// ─────────────────────────────────────────
function emailCustomer(data) {
  const itemsList = data.items.map(i =>
    `<li style="padding:6px 0;border-bottom:1px solid #222;font-size:14px;">${i.name} ×${i.qty} — <strong>$${i.price}</strong>${i.mods ? `<br><span style="font-size:12px;color:#888;">${i.mods}</span>` : ''}</li>`
  ).join('');

  const html = `
  <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f2ec;padding:32px;max-width:480px;margin:0 auto;border-radius:8px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:28px;font-weight:700;color:#d4941a;letter-spacing:4px;">OLD 33</div>
      <div style="font-size:11px;color:#686868;letter-spacing:3px;">BEER &amp; BURGER GRILL</div>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;margin-bottom:8px;">✅</div>
      <h2 style="font-size:22px;font-weight:700;color:#f5f2ec;margin-bottom:4px;">You're all set, ${data.name.split(' ')[0]}!</h2>
      <p style="font-size:14px;color:#686868;">We got your order and we're already on it.</p>
    </div>

    <div style="background:#d4941a;color:#000;border-radius:6px;padding:16px;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Ready Time</div>
      <div style="font-size:20px;font-weight:700;">${data.readyTime || data.pickupLabel || "ASAP"}</div>
    </div>

    <div style="background:#181818;border-radius:6px;padding:20px;margin-bottom:20px;">
      <div style="font-size:11px;color:#686868;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Your Order — ${data.orderNum}</div>
      <ul style="list-style:none;padding:0;margin:0;">${itemsList}</ul>
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #333;display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:#d4941a;">
        <span>Total</span><span>$${data.total}</span>
      </div>
      <div style="margin-top:6px;font-size:12px;color:#686868;text-align:right;">Pay at pickup — cash or card</div>
    </div>

    <div style="background:#181818;border-radius:6px;padding:16px 20px;margin-bottom:20px;font-size:13px;color:#686868;line-height:1.7;">
      <strong style="color:#f5f2ec;">Old 33 Beer &amp; Burger Grill</strong><br>
      159 W Rockingham St, Elkton VA 22827<br>
      <a href="tel:5407139050" style="color:#d4941a;">(540) 713-9050</a>
    </div>

    <p style="font-size:12px;color:#444;text-align:center;">Questions? Call or text us at (540) 713-9050</p>
  </div>`;

  MailApp.sendEmail({
    to:       data.email,
    subject:  `Order Confirmed — Old 33 | Ready ~${data.readyTime || data.pickupLabel || "ASAP"}`,
    htmlBody: html
  });
}

// ─────────────────────────────────────────
//  RESERVATIONS
// ─────────────────────────────────────────
function logReservation(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName('Reservations');
  if (!sheet) {
    sheet = ss.insertSheet('Reservations');
    sheet.appendRow(['Timestamp','Status','Name','Phone','Email','Date','Time','Party','Notes']);
    sheet.getRange(1,1,1,9).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([data.timestamp,'PENDING',data.name,data.phone,data.email||'',data.date,data.time,data.party,data.notes||'']);
}

function emailReservation(data) {
  const html = `
  <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f2ec;padding:32px;max-width:480px;margin:0 auto;border-radius:8px;">
    <div style="font-size:22px;font-weight:700;color:#d4941a;letter-spacing:2px;margin-bottom:4px;">OLD 33</div>
    <div style="font-size:11px;color:#686868;letter-spacing:3px;margin-bottom:24px;">BEER & BURGER GRILL</div>
    <div style="background:#181818;border-radius:6px;padding:16px 20px;margin-bottom:16px;border-left:3px solid #d4941a;">
      <div style="font-size:11px;color:#686868;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">New Reservation Request</div>
    </div>
    <div style="background:#d4941a;color:#000;border-radius:6px;padding:16px 20px;margin-bottom:16px;font-weight:700;font-size:16px;">
      📅 ${data.date} at ${data.time} — ${data.party} Guests
    </div>
    <div style="background:#181818;border-radius:6px;padding:16px 20px;margin-bottom:16px;">
      <div style="font-size:16px;font-weight:600;margin-bottom:4px;">${data.name}</div>
      <div style="color:#d4941a;margin-bottom:4px;"><a href="tel:${data.phone}" style="color:#d4941a;">${data.phone}</a></div>
      ${data.email ? `<div style="color:#686868;font-size:13px;">${data.email}</div>` : ''}
    </div>
    ${data.notes ? `<div style="background:#181818;border-radius:6px;padding:14px 20px;border-left:3px solid #d4941a;"><div style="font-size:11px;color:#686868;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Notes</div><div>${data.notes}</div></div>` : ''}
    <p style="font-size:12px;color:#444;margin-top:24px;text-align:center;">Call to confirm: <a href="tel:5407139050" style="color:#686868;">(540) 713-9050</a></p>
  </div>`;
  MailApp.sendEmail({ to: RESTAURANT_EMAIL, subject: `📅 Reservation — ${data.name} | ${data.date} ${data.time} (${data.party} guests)`, htmlBody: html });
}

function emailReservationCustomer(data) {
  const html = `
  <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f2ec;padding:32px;max-width:480px;margin:0 auto;border-radius:8px;text-align:center;">
    <div style="font-size:28px;font-weight:700;color:#d4941a;letter-spacing:4px;">OLD 33</div>
    <div style="font-size:11px;color:#686868;letter-spacing:3px;margin-bottom:28px;">BEER & BURGER GRILL</div>
    <div style="font-size:36px;margin-bottom:12px;">🎉</div>
    <h2 style="font-size:22px;color:#f5f2ec;margin-bottom:6px;">Request Received, ${data.name.split(' ')[0]}!</h2>
    <p style="color:#686868;font-size:14px;margin-bottom:24px;">We'll call to confirm your table shortly.</p>
    <div style="background:#d4941a;color:#000;border-radius:6px;padding:16px;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Your Request</div>
      <div style="font-size:20px;font-weight:700;">${data.date}</div>
      <div style="font-size:18px;">${data.time} · ${data.party} Guests</div>
    </div>
    <div style="background:#181818;border-radius:6px;padding:14px 20px;font-size:13px;color:#686868;line-height:1.7;margin-bottom:16px;">
      <strong style="color:#f5f2ec;">Old 33 Beer & Burger Grill</strong><br>
      159 W Rockingham St, Elkton VA<br>
      <a href="tel:5407139050" style="color:#d4941a;">(540) 713-9050</a>
    </div>
    <p style="font-size:12px;color:#444;">Questions? Call us at (540) 713-9050</p>
  </div>`;
  MailApp.sendEmail({ to: data.email, subject: `Reservation Request — Old 33 | ${data.date} at ${data.time}`, htmlBody: html });
}

// ─────────────────────────────────────────
//  FORMAT SHEET (run once manually)
// ─────────────────────────────────────────
function formatOrdersSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Orders');
  if (!sheet) { SpreadsheetApp.getUi().alert('No Orders tab found yet — place an order first.'); return; }

  const lastRow = Math.max(sheet.getLastRow(), 1);

  // ── Header row styling ──
  const header = sheet.getRange(1, 1, 1, 12);
  header.setBackground('#1a1a1a');
  header.setFontColor('#d4941a');
  header.setFontWeight('bold');
  header.setFontSize(11);
  header.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);

  // ── Freeze header + first column ──
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  // ── Data rows ──
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, 12);
    data.setBackground('#ffffff');
    data.setFontColor('#222222');
    data.setFontSize(10);
    data.setVerticalAlignment('top');

    // Alternate row shading
    for (let r = 2; r <= lastRow; r++) {
      sheet.getRange(r, 1, 1, 12).setBackground(r % 2 === 0 ? '#f9f9f9' : '#ffffff');
    }

    // Status column (L = col 12) — color by value
    for (let r = 2; r <= lastRow; r++) {
      const statusCell = sheet.getRange(r, 12);
      const val = statusCell.getValue();
      if (val === 'New')  { statusCell.setBackground('#fff3cd'); statusCell.setFontColor('#856404'); }
      if (val === 'Ready') { statusCell.setBackground('#d1e7dd'); statusCell.setFontColor('#0f5132'); }
      if (val === 'Done')  { statusCell.setBackground('#e2e3e5'); statusCell.setFontColor('#41464b'); }
    }

    // Wrap items column (F = col 6)
    sheet.getRange(2, 6, lastRow - 1, 1).setWrap(true);
  }

  // ── Column widths ──
  sheet.setColumnWidth(1, 120);  // Order #
  sheet.setColumnWidth(2, 160);  // Date & Time
  sheet.setColumnWidth(3, 150);  // Customer Name
  sheet.setColumnWidth(4, 130);  // Phone
  sheet.setColumnWidth(5, 190);  // Email
  sheet.setColumnWidth(6, 280);  // Items
  sheet.setColumnWidth(7, 80);   // Subtotal
  sheet.setColumnWidth(8, 90);   // Tax
  sheet.setColumnWidth(9, 70);   // Tip
  sheet.setColumnWidth(10, 80);  // Total
  sheet.setColumnWidth(11, 180); // Notes
  sheet.setColumnWidth(12, 80);  // Status

  // ── Tab color ──
  sheet.setTabColor('#d4941a');

  SpreadsheetApp.getUi().alert('✅ Sheet formatted!');
}

// ─────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/*
 ============================================================
  HOW TO DEPLOY (5 steps, ~3 minutes)
 ============================================================

  1. Go to https://script.google.com
     → click "New project"

  2. Delete the empty function, paste ALL of this code in

  3. Click the spreadsheet icon on the left (or go to
     script.google.com and open a Google Sheet first,
     then Extensions → Apps Script — it auto-links)

     OR: open any Google Sheet, go to:
     Extensions → Apps Script → paste this code there.
     That sheet becomes your order dashboard.

  4. Click "Deploy" → "New deployment"
     - Type:          Web app
     - Execute as:    Me
     - Who has access: Anyone
     → Click "Deploy" → Authorize → Copy the URL

  5. Open js/checkout.js and replace:
     const SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
     with your copied URL.

  Done. Orders now go to:
  - Google Sheet (order log / dashboard)
  - cesardom200714@gmail.com (restaurant alert)
  - Customer's email (confirmation)
 ============================================================
*/
