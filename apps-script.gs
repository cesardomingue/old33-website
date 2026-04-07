// ============================================================
//  OLD 33 BEER & BURGER GRILL — Order Handler
//  Deploy this at: script.google.com
//  Steps at bottom of this file
// ============================================================

const RESTAURANT_EMAIL = 'cesardom200714@gmail.com';
const SHEET_NAME       = 'Orders'; // tab name in your Google Sheet

function escHtml(s) {
  return String(s || '').replace(/[<>&"']/g, function(c) {
    return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'otp') {
      emailOTP(data);
      return jsonResponse({ success: true });
    }

    if (data.type === 'welcome') {
      emailWelcome(data);
      return jsonResponse({ success: true });
    }

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
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-bottom:2px solid #d4941a;padding-bottom:20px;">
      <tr>
        <td>
          <img src="https://cesardomingue.github.io/old33-website/images/logo-clean.png" alt="Old 33" width="40" height="40" style="border-radius:50%;border:1px solid #d4941a;vertical-align:middle;margin-right:12px;">
          <span style="font-size:18px;font-weight:700;color:#d4941a;letter-spacing:2px;vertical-align:middle;">OLD 33</span>
          <span style="font-size:11px;color:#686868;letter-spacing:2px;text-transform:uppercase;vertical-align:middle;margin-left:8px;">Beer &amp; Burger Grill</span>
        </td>
      </tr>
    </table>

    <div style="background:#181818;border-radius:6px;padding:20px;margin-bottom:20px;">
      <div style="font-size:11px;color:#686868;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">New Order</div>
      <div style="font-size:24px;font-weight:700;color:#d4941a;">${escHtml(data.orderNum)}</div>
      <div style="font-size:14px;color:#a8a8a8;margin-top:4px;">${escHtml(data.timestamp)}</div>
    </div>

    <div style="background:#181818;border-radius:6px;padding:20px;margin-bottom:20px;">
      <div style="font-size:11px;color:#686868;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Customer</div>
      <div style="font-size:16px;font-weight:600;margin-bottom:4px;">${escHtml(data.name)}</div>
      <div style="font-size:14px;color:#d4941a;margin-bottom:4px;"><a href="tel:${escHtml(data.phone)}" style="color:#d4941a;">${escHtml(data.phone)}</a></div>
      ${data.email ? `<div style="font-size:13px;color:#686868;">${escHtml(data.email)}</div>` : ''}
    </div>

    <div style="background:#d4941a;color:#000;border-radius:6px;padding:16px 20px;margin-bottom:20px;font-weight:700;font-size:16px;">
      Ready ~ ${escHtml(data.readyTime || data.pickupLabel || 'ASAP')}
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

    ${data.notes ? `<div style="background:#181818;border-radius:6px;padding:16px 20px;margin-bottom:20px;border-left:3px solid #d4941a;"><div style="font-size:11px;color:#686868;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Order Notes</div><div style="font-size:14px;color:#f5f2ec;">${escHtml(data.notes)}</div></div>` : ''}

    <div style="text-align:center;font-size:12px;color:#444;margin-top:24px;">
      Payment at pickup — cash or card<br>
      <a href="mailto:Route33bbg@gmail.com" style="color:#444;">Route33bbg@gmail.com</a>
    </div>
  </div>`;

  MailApp.sendEmail({
    to:      RESTAURANT_EMAIL,
    subject: `🧾 Order ${escHtml(data.orderNum)} — ${escHtml(data.name)} | Ready ~${escHtml(data.readyTime || data.pickupLabel || 'ASAP')}`,
    htmlBody: html
  });
}

// ─────────────────────────────────────────
//  WELCOME EMAIL — 33 Club new member
// ─────────────────────────────────────────
function emailWelcome(data) {
  const name = escHtml(data.name || 'Member');
  const html =
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2ece0;padding:32px 0;">' +
    '<tr><td align="center">' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">' +
    '<tr><td style="background:#1a1a1a;padding:28px 32px;text-align:center;">' +
    '<div style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:#c8951a;letter-spacing:3px;">OLD 33</div>' +
    '<div style="font-family:Arial,sans-serif;font-size:10px;color:#666;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Beer &amp; Burger Grill</div>' +
    '</td></tr>' +
    '<tr><td style="background:#c8951a;padding:12px 32px;text-align:center;">' +
    '<div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#000;letter-spacing:2.5px;text-transform:uppercase;">Welcome to the 33 Club</div>' +
    '</td></tr>' +
    '<tr><td style="padding:36px 32px 28px;text-align:center;">' +
    '<p style="font-family:Arial,sans-serif;font-size:16px;color:#1a1a1a;margin:0 0 8px;">Hey <strong>' + name + '</strong>,</p>' +
    '<p style="font-family:Arial,sans-serif;font-size:14px;color:#666;line-height:1.7;margin:0 0 24px;">You\'re officially a 33 Club member. Here\'s what you get starting right now:</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf8ef;border-radius:10px;padding:0;margin-bottom:24px;">' +
    '<tr><td style="padding:14px 20px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:13px;color:#333;">&#10003;&nbsp; <strong>10% off</strong> every online order, applied automatically</td></tr>' +
    '<tr><td style="padding:14px 20px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:13px;color:#333;">&#10003;&nbsp; <strong>1 point per $1</strong> spent toward future rewards</td></tr>' +
    '<tr><td style="padding:14px 20px;border-bottom:1px solid #f0e8d8;font-family:Arial,sans-serif;font-size:13px;color:#333;">&#10003;&nbsp; <strong>$5 reward</strong> every 500 points</td></tr>' +
    '<tr><td style="padding:14px 20px;font-family:Arial,sans-serif;font-size:13px;color:#333;">&#10003;&nbsp; <strong>Free fountain drink</strong> on your very first order</td></tr>' +
    '</table>' +
    '<a href="https://old33bbg.com/menu.html" style="display:inline-block;background:#c8951a;color:#000;font-family:Arial,sans-serif;font-size:13px;font-weight:800;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">Order Now &amp; Save 10%</a>' +
    '</td></tr>' +
    '<tr><td style="background:#1a1a1a;padding:18px 32px;text-align:center;">' +
    '<div style="font-family:Arial,sans-serif;font-size:11px;color:#555;">Old 33 Beer &amp; Burger Grill &middot; 159 W Rockingham St, Elkton VA</div>' +
    '</td></tr>' +
    '</table>' +
    '</td></tr></table>';

  GmailApp.sendEmail(data.email, 'Welcome to the 33 Club — Old 33 Beer & Burger Grill', '', { htmlBody: html });
}

// ─────────────────────────────────────────
//  OTP EMAIL — 33 Club verification
// ─────────────────────────────────────────
function emailOTP(data) {
  const name = escHtml(data.name || 'Member');
  const code = escHtml(data.code || '------');
  const html = `<!DOCTYPE html>
<html><head><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:#f2ece0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2ece0;padding:32px 0;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

      <!-- Header -->
      <tr><td style="background:#1a1a1a;padding:28px 32px;text-align:center;">
        <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:#c8951a;letter-spacing:3px;">OLD 33</div>
        <div style="font-family:Arial,sans-serif;font-size:10px;color:#666;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Beer &amp; Burger Grill</div>
      </td></tr>

      <!-- Gold bar -->
      <tr><td style="background:#c8951a;padding:12px 32px;text-align:center;">
        <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#000;letter-spacing:2.5px;text-transform:uppercase;">33 Club — Sign In Verification</div>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 32px 28px;text-align:center;">
        <p style="font-family:Arial,sans-serif;font-size:16px;color:#1a1a1a;margin:0 0 8px;">Hey <strong>${name}</strong>,</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#666;line-height:1.7;margin:0 0 28px;">Use the code below to verify your email and access your 33 Club account. This code expires in <strong>15 minutes</strong>.</p>

        <!-- Code box -->
        <div style="background:#1a1a1a;border-radius:10px;padding:24px;margin:0 auto 28px;display:inline-block;min-width:220px;">
          <div style="font-family:'Courier New',monospace;font-size:38px;font-weight:900;color:#c8951a;letter-spacing:10px;">${code}</div>
        </div>

        <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;margin:0;">If you didn't request this, you can safely ignore this email.</p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#1a1a1a;padding:18px 32px;text-align:center;">
        <div style="font-family:Arial,sans-serif;font-size:11px;color:#555;">Old 33 Beer &amp; Burger Grill · 159 W Rockingham St, Elkton VA</div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  MailApp.sendEmail({
    to:       data.email,
    subject:  'Your 33 Club verification code: ' + data.code,
    htmlBody: html
  });
}

function emailCustomer(data) {
  const logoUrl = 'https://cesardomingue.github.io/old33-website/images/logo-clean.png';

  const itemsRows = data.items.map(i => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f0ece4;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:32px;vertical-align:top;padding-right:12px;">
              <div style="background:#fdf6e8;border:1px solid #e8d49a;border-radius:4px;width:32px;height:32px;text-align:center;line-height:32px;font-size:12px;font-weight:700;color:#a07010;">${i.qty}x</div>
            </td>
            <td style="vertical-align:top;">
              <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:2px;">${i.name}</div>
              ${i.mods ? `<div style="font-size:12px;color:#888;line-height:1.5;">${i.mods}</div>` : ''}
            </td>
            <td style="text-align:right;vertical-align:top;white-space:nowrap;">
              <div style="font-size:14px;font-weight:700;color:#1a1a1a;">$${i.price}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1eb;">
  <tr><td align="center" style="padding:32px 16px;">

    <!-- Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td align="center" style="padding:36px 32px 28px;border-bottom:1px solid #f0ece4;">
          <img src="${logoUrl}" alt="Old 33" width="72" height="72" style="display:block;margin:0 auto 16px;border-radius:50%;border:2px solid #e8d49a;">
          <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#a07010;margin-bottom:18px;">OLD 33 BEER &amp; BURGER GRILL</div>
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#1a1a1a;margin-bottom:10px;">Order Confirmed</div>
          <div style="width:40px;height:2px;background:#c8951a;margin:0 auto;"></div>
        </td>
      </tr>

      <!-- Order Info Bar -->
      <tr>
        <td style="background:#c8951a;padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:16px 24px;width:50%;">
                <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(0,0,0,0.6);margin-bottom:4px;">Order</div>
                <div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#000;">${escHtml(data.orderNum)}</div>
              </td>
              <td style="padding:16px 24px;text-align:right;">
                <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(0,0,0,0.6);margin-bottom:4px;">Ready Around</div>
                <div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#000;">${escHtml(data.readyTime || data.pickupLabel || 'ASAP')}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Greeting -->
      <tr>
        <td style="padding:28px 32px 8px;">
          <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;">Hey <strong>${escHtml(data.name.split(' ')[0])}</strong>,</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:#666;line-height:1.7;margin:0;">Your order has been received and is being prepared. Come pick it up at the counter &mdash; we&rsquo;ll have it waiting for you.</p>
        </td>
      </tr>

      <!-- Order Items -->
      <tr>
        <td style="padding:20px 32px 0;">
          <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:4px;">Your Order</div>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${itemsRows}
          </table>
        </td>
      </tr>

      <!-- Totals -->
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f0ece4;margin-top:4px;">
            <tr>
              <td style="padding:8px 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#888;">Subtotal</td>
              <td style="padding:8px 0 4px;text-align:right;font-family:Arial,sans-serif;font-size:13px;color:#888;">$${data.subtotal}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;">Tax</td>
              <td style="padding:4px 0;text-align:right;font-family:Arial,sans-serif;font-size:13px;color:#888;">$${data.tax}</td>
            </tr>
            ${parseFloat(data.tip) > 0 ? `<tr><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:13px;color:#888;">Tip</td><td style="padding:4px 0;text-align:right;font-family:Arial,sans-serif;font-size:13px;color:#888;">$${data.tip}</td></tr>` : ''}
            <tr>
              <td style="padding:12px 0 0;border-top:1px solid #f0ece4;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;">Total</td>
              <td style="padding:12px 0 0;border-top:1px solid #f0ece4;text-align:right;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#c8951a;">$${data.total}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:6px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#aaa;text-align:right;">Pay at pickup &mdash; cash or card</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Location -->
      <tr>
        <td style="padding:0 32px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf6e8;border:1px solid #eddfa0;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:13px;color:#666;line-height:1.8;">
                <strong style="color:#1a1a1a;display:block;margin-bottom:4px;">Old 33 Beer &amp; Burger Grill</strong>
                159 W Rockingham St, Elkton VA 22827<br>
                <a href="tel:5407139050" style="color:#c8951a;text-decoration:none;">(540) 713-9050</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#1a1a1a;padding:20px 32px;text-align:center;">
          <div style="font-family:Arial,sans-serif;font-size:11px;color:#555;letter-spacing:1px;">Questions? Call or text <a href="tel:5407139050" style="color:#c8951a;text-decoration:none;">(540) 713-9050</a></div>
        </td>
      </tr>

    </table>
    <!-- /Card -->

  </td></tr>
</table>
</body>
</html>`;

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
