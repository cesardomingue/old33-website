/* ============================================
   OLD 33 — CART SYSTEM v2
   Elkton VA Meals Tax: 12.3%
   ============================================ */

const TAX_RATE = 0.123;

/* ---------- Item Definitions ---------- */
const BURGERS = ['Classic Cheeseburger','Rodeo Burger','Tex Mex','Shenandoah','Route 33','Rockingham','The Valley','Vegan Burger','The Meat Lover','Country Road','Hawaiian Burger','Brisket Burger'];
const WINGS   = ['Traditional Wings (Small 6pc)','Traditional Wings (Large 12pc)','Boneless Wings (Small)','Boneless Wings (Large)','Kids Four Piece Boneless Wings'];
const MYOB    = ['MYOB Beef Patty','MYOB Chicken Patty','MYOB Veggie Patty'];

const WING_SAUCES = ['Buffalo','Sweet & Bold BBQ','Spicy','Honey','Sweet Chili','Carolina Reaper (Hot)','Lemon Pepper','Garlic Parmesan','Mango Habanero'];

const BUN_OPTIONS = [
  { name:'Brioche Bun',        price:0    },
  { name:'Potato Bread',       price:0    },
  { name:'Wrapped In Lettuce', price:0    },
  { name:'Multi Grain',        price:0    },
  { name:'Gluten Free',        price:2.00 },
  { name:'No Bun',             price:0    },
];

const BURGER_SIDES = [
  { name:'French Fries',          price:0    },
  { name:'Curly Fries',           price:0    },
  { name:'Sweet Potato Fries',    price:0    },
  { name:'Onion Rings',           price:0    },
  { name:'Side of Mac & Cheese',  price:0    },
  { name:'Potato Salad',          price:0    },
  { name:'Side Salad',            price:0    },
  { name:'Side of Coleslaw',      price:0    },
  { name:'Kids Fruit Cup',        price:0    },
  { name:'No Side',               price:0    },
  { name:'Hush Puppies',          price:1.50 },
  { name:'Fried Pickles as Side', price:2.00 },
  { name:'Cheese Fries',          price:1.00 },
  { name:'Bacon Cheese Fries',    price:2.00 },
  { name:'Loaded Fries',          price:3.00 },
];

const BURGER_TOPPINGS = [
  { group:'Veggies', items:[
    { name:'Lettuce',            price:0.40 },
    { name:'Tomato',             price:0.40 },
    { name:'Raw Onion',          price:0.40 },
    { name:'Grilled Onions',     price:1.20 },
    { name:'Onion Straws',       price:1.20 },
    { name:'Grilled Mushroom',   price:0.70 },
    { name:'Pickles',            price:0.40 },
    { name:'Jalapeno',           price:0.70 },
    { name:'Avocado',            price:1.20 },
    { name:'Grilled Pineapple',  price:0.70 },
    { name:'Pickled Red Onions', price:0.70 },
    { name:'Spinach',            price:0.70 },
    { name:'Cucumber',           price:0.70 },
    { name:'Coleslaw',           price:1.20 },
  ]},
  { group:'Cheese', items:[
    { name:'American Cheese', price:1.20 },
    { name:'Cheddar Cheese',  price:1.20 },
    { name:'Pepper Jack',     price:1.20 },
    { name:'Blue Cheese',     price:1.20 },
    { name:'Swiss Cheese',    price:1.20 },
  ]},
  { group:'Proteins & Specials', items:[
    { name:'Bacon',                      price:1.20 },
    { name:'Mac & Cheese on Burger',     price:1.20 },
    { name:'Chili on Burger',            price:1.20 },
    { name:'Fried Egg',                  price:2.30 },
    { name:'Chorizo',                    price:2.30 },
    { name:'Copperhead Bites on Burger', price:5.50 },
    { name:'Beef Patty',                 price:4.50 },
    { name:'Grilled Chicken',            price:4.50 },
    { name:'Veggie Patty',               price:5.50 },
    { name:'Brisket',                    price:4.00 },
  ]},
  { group:'Sauces', items:[
    { name:'Ketchup',       price:0 },
    { name:'Mustard',       price:0 },
    { name:'Mayo',          price:0 },
    { name:'Chipotle Mayo', price:0 },
    { name:'House Sauce',   price:0 },
    { name:'BBQ',           price:0 },
    { name:'Ranch',         price:0 },
    { name:'A1 Sauce',      price:0 },
    { name:'Buffalo Sauce', price:0 },
  ]},
];

const BURGER_REMOVALS = [
  { name:'No American Cheese', price:0 },
  { name:'No Lettuce',         price:0 },
  { name:'No Tomato',          price:0 },
  { name:'No Onion',           price:0 },
];

const BURGER_XTRA = [
  { name:'Xtra Cheese',            price:1.00 },
  { name:'Xtra Bacon',             price:1.00 },
  { name:'Xtra Lettuce',           price:0.25 },
  { name:'Xtra Tomato',            price:0.25 },
  { name:'Xtra Onions',            price:0    },
  { name:'Xtra Pickles',           price:0.25 },
  { name:'Xtra Jalapeno',          price:0.50 },
  { name:'Xtra Avocado',           price:1.00 },
  { name:'Xtra Fried Egg',         price:2.00 },
  { name:'Xtra Mayo',              price:0    },
  { name:'Xtra Spinach',           price:0.50 },
  { name:'Xtra Mushrooms',         price:0.25 },
  { name:'Xtra Grilled Pineapple', price:0.25 },
  { name:'Xtra Mac & Cheese',      price:2.00 },
  { name:'Xtra Coleslaw',          price:2.00 },
  { name:'Xtra Beef Patty',        price:4.00 },
  { name:'Xtra Chorizo',           price:3.00 },
  { name:'Xtra Veggie Patty',      price:4.00 },
  { name:'Xtra Sauce',             price:0.25 },
];

const TEMP_OPTIONS = ['Rare','Medium Rare','Medium','Med Well','Well Done'];

const SOFT_DRINKS  = ['Soft Drink'];
const JUICE_ITEMS  = ['Juice'];

const SOFT_DRINK_FLAVORS = ['Pepsi','Diet Pepsi','Sierra Mist','Dr. Pepper','Mountain Dew','Pink Lemonade','Root Beer'];
const JUICE_FLAVORS      = ['Cranberry Juice','Orange Juice'];

function getCategory(name) {
  if (BURGERS.includes(name))     return 'burger';
  if (WINGS.includes(name))       return 'wings';
  if (MYOB.includes(name))        return 'myob';
  if (SOFT_DRINKS.includes(name)) return 'softdrink';
  if (JUICE_ITEMS.includes(name)) return 'juice';
  return 'default';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2,5);
}

/* ============================================
   CART MODULE
   ============================================ */
const Cart = (() => {
  const KEY = 'old33_cart_v2';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { items:[], tipPct:0 }; }
    catch { return { items:[], tipPct:0 }; }
  }
  function save(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    render(); updateBadge();
  }

  function sanitize(str) {
    return String(str).replace(/[<>&"'`]/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
  }

  /* ---------- Actions ---------- */
  function addItem(config) {
    const cart = load();
    const extraPerItem = (config.extras||[]).reduce((s,e) => s + e.price, 0);
    cart.items.push({
      id:           uid(),
      name:         config.name,
      basePrice:    config.basePrice,
      qty:          config.qty || 1,
      category:     config.category,
      bun:          config.bun       || null,
      bunPrice:     config.bunPrice  || 0,
      side:         config.side      || null,
      sidePrice:    config.sidePrice || 0,
      sauce:        config.sauce     || null,
      temp:         config.temp      || null,
      extras:       config.extras    || [],
      notes:        config.notes     || '',
      extraPerItem
    });
    save(cart);
  }

  function remove(id) {
    const cart = load();
    cart.items = cart.items.filter(i => i.id !== id);
    save(cart);
  }

  function setQty(id, qty) {
    const cart = load();
    const item = cart.items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(0, parseInt(qty) || 0);
    if (item.qty === 0) cart.items = cart.items.filter(i => i.id !== id);
    save(cart);
  }

  function setTip(pct) {
    const cart = load();
    cart.tipPct = pct;
    cart.tipCustom = null; // clear any custom dollar tip
    save(cart);
    // hide custom input when a % button is picked
    const inp = document.getElementById('tipCustomInput');
    if (inp) inp.style.display = 'none';
  }

  function setTipCustom() {
    // Called on oninput — update display only, don't save (avoids clobbering input mid-type)
    const inp = document.getElementById('tipCustomInput');
    if (!inp) return;
    const val = Math.max(0, parseFloat(inp.value) || 0);
    const sub   = getSubtotal();
    const total = sub + sub * TAX_RATE + val;
    const tipEl   = document.getElementById('cartTipAmt');
    const totalEl = document.getElementById('cartTotal');
    if (tipEl)   tipEl.textContent   = val > 0 ? `$${val.toFixed(2)}` : '—';
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  function saveTipCustom() {
    // Called on onblur — persist to localStorage
    const inp = document.getElementById('tipCustomInput');
    if (!inp) return;
    const val = Math.max(0, parseFloat(inp.value) || 0);
    const cart = load();
    cart.tipPct    = null;
    cart.tipCustom = Math.round(val * 100) / 100;
    // save without re-rendering the input value
    localStorage.setItem('old33_cart_v2', JSON.stringify(cart));
    updateBadge();
  }

  function showCustomTip() {
    const inp = document.getElementById('tipCustomInput');
    if (!inp) return;
    inp.style.display = 'block';
    inp.focus();
    // mark custom btn active, clear % btns
    document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.tip-btn[data-pct="custom"]')?.classList.add('active');
  }

  function clear() {
    const cart = load();
    cart.items = [];
    save(cart);
  }

  /* ---------- Calculations ---------- */
  function itemPrice(item) {
    return (item.basePrice + item.extraPerItem + (item.bunPrice||0) + (item.sidePrice||0)) * item.qty;
  }
  function getSubtotal() {
    return load().items.reduce((s,i) => s + itemPrice(i), 0);
  }
  function getTax()      { return getSubtotal() * TAX_RATE; }
  function getTipAmt()   {
    const cart = load();
    if (cart.tipCustom != null) return cart.tipCustom;
    return getSubtotal() * (cart.tipPct || 0);
  }
  function getTotal()    { return getSubtotal() + getTax() + getTipAmt(); }
  function getCount()    { return load().items.reduce((s,i) => s + i.qty, 0); }

  /* ---------- Badge ---------- */
  function updateBadge() {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    const c = getCount();
    badge.textContent = c;
    badge.style.display = c > 0 ? 'flex' : 'none';
    badge.classList.add('pop');
    setTimeout(() => badge.classList.remove('pop'), 300);
  }

  /* ---------- Render Drawer ---------- */
  function render() {
    const list    = document.getElementById('cartItems');
    const btnChk  = document.getElementById('checkoutBtn');
    if (!list) return;

    const cart = load();

    /* Items */
    if (cart.items.length === 0) {
      list.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="color:var(--dim)">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p>Your cart is empty</p>
          <span>Add items from the menu to get started</span>
        </div>`;
    } else {
      list.innerHTML = cart.items.map(item => {
        const details = [];
        if (item.bun)   details.push(item.bun + (item.bunPrice > 0 ? ` (+$${item.bunPrice.toFixed(2)})` : ''));
        if (item.side)  details.push('Side: ' + item.side + (item.sidePrice > 0 ? ` (+$${item.sidePrice.toFixed(2)})` : ''));
        if (item.temp)  details.push(item.temp);
        if (item.sauce) details.push(item.sauce);
        if (item.extras?.length) details.push(...item.extras.map(e => e.name));

        return `
        <div class="cart-item">
          <div class="ci-top">
            <div class="ci-left">
              <div class="ci-name">${sanitize(item.name)}</div>
              ${details.length ? `<div class="ci-details">${sanitize(details.join(', '))}</div>` : ''}
              ${item.notes ? `<div class="ci-notes">"${sanitize(item.notes)}"</div>` : ''}
              <div class="ci-unit-price">$${(item.basePrice + item.extraPerItem).toFixed(2)} each</div>
            </div>
            <button class="ci-delete" onclick="Cart.remove('${item.id}')" aria-label="Remove item" title="Remove">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
          <div class="ci-bottom">
            <div class="ci-controls">
              <button class="ci-btn" onclick="Cart.setQty('${item.id}', ${item.qty - 1})">−</button>
              <span class="ci-qty">${item.qty}</span>
              <button class="ci-btn" onclick="Cart.setQty('${item.id}', ${item.qty + 1})">+</button>
            </div>
            <div class="ci-line-price">$${itemPrice(item).toFixed(2)}</div>
          </div>
        </div>`;
      }).join('');
    }

    /* Totals */
    const sub   = getSubtotal();
    const tax   = getTax();
    const tipAmt= getTipAmt();
    const total = getTotal();
    const tipPct= cart.tipPct || 0;

    const subEl   = document.getElementById('cartSubtotal');
    const taxEl   = document.getElementById('cartTax');
    const tipEl   = document.getElementById('cartTipAmt');
    const totalEl = document.getElementById('cartTotal');

    if (subEl)   subEl.textContent   = `$${sub.toFixed(2)}`;
    if (taxEl)   taxEl.textContent   = `$${tax.toFixed(2)}`;
    if (tipEl)   tipEl.textContent   = tipAmt > 0 ? `$${tipAmt.toFixed(2)}` : '—';
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    /* Tip button active state */
    const isCustom = cart.tipCustom != null;
    document.querySelectorAll('.tip-btn').forEach(b => {
      if (b.dataset.pct === 'custom') {
        b.classList.toggle('active', isCustom);
      } else {
        b.classList.toggle('active', !isCustom && parseFloat(b.dataset.pct) === tipPct);
      }
    });
    /* Show/hide custom input (never overwrite value — user controls it) */
    const tipInp = document.getElementById('tipCustomInput');
    if (tipInp) tipInp.style.display = isCustom ? 'block' : 'none';

    if (btnChk) btnChk.disabled = cart.items.length === 0;

    /* Hide entire footer when cart is empty */
    const ftr = document.querySelector('.cart-ftr');
    if (ftr) ftr.style.display = cart.items.length === 0 ? 'none' : '';
  }

  /* ---------- Drawer / Overlay ---------- */
  function openDrawer() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    render();
  }
  function closeDrawer() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- Inject ---------- */
  function inject() {
    /* Navbar cart button */
    const navHam = document.getElementById('navHam');
    if (navHam) {
      const btn = document.createElement('button');
      btn.className = 'nav-cart';
      btn.id = 'navCartBtn';
      btn.setAttribute('aria-label', 'View cart');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span class="cart-count" id="cartCount" style="display:none">0</span>`;
      btn.addEventListener('click', openDrawer);
      navHam.parentNode.insertBefore(btn, navHam);
    }

    /* Overlay */
    const ov = document.createElement('div');
    ov.id = 'cartOverlay'; ov.className = 'cart-overlay';
    ov.addEventListener('click', closeDrawer);
    document.body.appendChild(ov);

    /* Drawer */
    const dr = document.createElement('div');
    dr.id = 'cartDrawer'; dr.className = 'cart-drawer';
    dr.innerHTML = `
      <div class="cart-hdr">
        <div class="cart-hdr-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="color:var(--gold)">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <h3>Your Order</h3>
        </div>
        <button class="cart-close" onclick="Cart.closeDrawer()" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="cart-body" id="cartItems"></div>

      <div class="cart-ftr">
        <div class="cart-save-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="color:var(--gold);flex-shrink:0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Order direct — skip the DoorDash &amp; Toast fees
        </div>

        <div class="cart-totals">
          <div class="ct-row"><span>Subtotal</span><span id="cartSubtotal">$0.00</span></div>
          <div class="ct-row"><span>Tax (12.3%)</span><span id="cartTax">$0.00</span></div>
          <div class="ct-row tip-row">
            <span>Tip</span>
            <div class="tip-btns">
              <button class="tip-btn active" data-pct="0"      onclick="Cart.setTip(0)">None</button>
              <button class="tip-btn"        data-pct="0.10"   onclick="Cart.setTip(0.10)">10%</button>
              <button class="tip-btn"        data-pct="0.15"   onclick="Cart.setTip(0.15)">15%</button>
              <button class="tip-btn"        data-pct="0.20"   onclick="Cart.setTip(0.20)">20%</button>
              <button class="tip-btn"        data-pct="custom" onclick="Cart.showCustomTip()">$</button>
            </div>
          </div>
          <div class="tip-custom-row" id="tipCustomRow">
            <span class="tip-custom-label">Enter custom tip</span>
            <div class="tip-custom-wrap">
              <span class="tip-custom-dollar">$</span>
              <input type="number" id="tipCustomInput" class="tip-custom-input"
                min="0" step="0.01" placeholder="0.00"
                oninput="Cart.setTipCustom()"
                onblur="Cart.saveTipCustom()"
                style="display:none" />
            </div>
          </div>
          <div class="ct-row tip-amt-row"><span></span><span id="cartTipAmt" style="color:var(--dim);font-size:13px;">—</span></div>
          <div class="ct-divider"></div>
          <div class="ct-row ct-total"><span>Total</span><span id="cartTotal">$0.00</span></div>
        </div>

        <button class="btn btn-red cart-checkout-btn" id="checkoutBtn" onclick="Checkout.open()" disabled>
          Place Order
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
        <button class="cart-clear-btn" onclick="Cart.clear()">Clear entire order</button>
      </div>`;
    document.body.appendChild(dr);

    render(); updateBadge();
  }

  return { addItem, remove, setQty, setTip, setTipCustom, saveTipCustom, showCustomTip, clear, getSubtotal, getTax, getTipAmt, getTotal, getCount, load, render, openDrawer, closeDrawer, inject, updateBadge };
})();

/* ============================================
   CUSTOMIZE MODAL
   ============================================ */
const Customize = (() => {
  let _item = null; // { name, basePrice, desc, category }
  let _qty  = 1;

  function sanitize(str) {
    return String(str).replace(/[<>&"'`]/g, c =>
      ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
  }

  function open(btn) {
    const el    = btn.closest('[data-name]');
    const name  = el.dataset.name;
    const price = parseFloat(el.dataset.price);
    const desc  = el.querySelector('.mi-desc')?.textContent || '';
    _item = { name, basePrice: price, desc, category: getCategory(name) };
    _qty  = 1;
    renderModal();
    document.getElementById('customizeModal')?.classList.add('open');
    document.getElementById('customizeOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    document.getElementById('customizeModal')?.classList.remove('open');
    document.getElementById('customizeOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
    _item = null; _qty = 1;
  }

  function updateTotal() {
    if (!_item) return;
    let extra = 0;
    document.querySelectorAll('.cz-extra-cb:checked').forEach(cb => {
      extra += parseFloat(cb.dataset.price || 0);
    });
    extra += parseFloat(document.querySelector('input[name="czBun"]:checked')?.dataset.price  || 0);
    extra += parseFloat(document.querySelector('input[name="czSide"]:checked')?.dataset.price || 0);
    const el = document.getElementById('czItemTotal');
    if (el) el.textContent = `$${((_item.basePrice + extra) * _qty).toFixed(2)}`;
  }

  function setQty(delta) {
    _qty = Math.max(1, _qty + delta);
    const el = document.getElementById('czQty');
    if (el) el.textContent = _qty;
    updateTotal();
  }

  function confirm() {
    if (!_item) return;

    const cat = _item.category;

    /* Validate sauce for wings */
    if (cat === 'wings') {
      const sauce = document.querySelector('input[name="czSauce"]:checked');
      if (!sauce) { showError('Please choose a sauce.'); return; }
    }

    /* Validate bun for burgers/myob */
    if (cat === 'burger' || cat === 'myob') {
      const bun = document.querySelector('input[name="czBun"]:checked');
      if (!bun) { showError('Please choose a bun.'); return; }
    }

    /* Validate temperature for burgers/myob */
    if (cat === 'burger' || cat === 'myob') {
      const temp = document.querySelector('input[name="czTemp"]:checked');
      if (!temp) { showError('Please choose a temperature.'); return; }
    }

    const bunEl  = document.querySelector('input[name="czBun"]:checked');
    const sideEl = document.querySelector('input[name="czSide"]:checked');
    const bun      = bunEl?.value  || null;
    const bunPrice = parseFloat(bunEl?.dataset.price  || 0);
    const side     = sideEl?.value || null;
    const sidePrice= parseFloat(sideEl?.dataset.price || 0);
    const sauce = document.querySelector('input[name="czSauce"]:checked')?.value || null;
    const temp  = document.querySelector('input[name="czTemp"]:checked')?.value  || null;
    const notes = document.getElementById('czNotes')?.value.trim().slice(0, 200) || '';
    const extras = [];
    document.querySelectorAll('.cz-extra-cb:checked').forEach(cb => {
      extras.push({ name: cb.dataset.name, price: parseFloat(cb.dataset.price) });
    });

    Cart.addItem({ name: _item.name, basePrice: _item.basePrice, qty: _qty, category: cat, bun, bunPrice, side, sidePrice, sauce, temp, extras, notes });
    close();

    /* Flash badge */
    const navBtn = document.getElementById('navCartBtn');
    if (navBtn) { navBtn.classList.add('cart-flash'); setTimeout(() => navBtn.classList.remove('cart-flash'), 600); }

  }

  function showError(msg) {
    const el = document.getElementById('czError');
    if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 2500); }
  }

  function renderModal() {
    const cat = _item.category;
    const s   = sanitize;
    let inner = '';

    /* ── BURGERS & MYOB ── */
    if (cat === 'burger' || cat === 'myob') {

      // Bun — required, always open
      inner += `<div class="cz-section cz-section-req">
        <div class="cz-sec-title">Bun Choice <span class="cz-req">Required</span></div>
        <div class="cz-pill-grid">
          ${BUN_OPTIONS.map((b,i) => `
            <label class="cz-pill">
              <input type="radio" name="czBun" value="${s(b.name)}" data-price="${b.price}" ${i===0?'checked':''} onchange="Customize._upd()">
              <span class="cz-pill-txt">${s(b.name)}${b.price>0?` <em>+$${b.price.toFixed(2)}</em>`:''}</span>
            </label>`).join('')}
        </div>
      </div>`;

      // Side — required, always open
      inner += `<div class="cz-section cz-section-req">
        <div class="cz-sec-title">Side Choice <span class="cz-req">Required</span></div>
        <div class="cz-options-grid">
          ${BURGER_SIDES.map((sd,i) => `
            <label class="cz-opt">
              <input type="radio" name="czSide" value="${s(sd.name)}" data-price="${sd.price}" ${i===0?'checked':''} onchange="Customize._upd()">
              <span>${s(sd.name)}${sd.price>0?` <span class="cz-opt-price">+$${sd.price.toFixed(2)}</span>`:''}</span>
            </label>`).join('')}
        </div>
      </div>`;

      // Temperature — required, always open
      inner += `<div class="cz-section cz-section-req">
        <div class="cz-sec-lbl">Temperature <span class="cz-req-star">*</span></div>
        <div class="cz-pill-grid">
          ${TEMP_OPTIONS.map(t => `
            <label class="cz-pill">
              <input type="radio" name="czTemp" value="${s(t)}" onchange="Customize._upd()">
              <span class="cz-pill-txt">${s(t)}</span>
            </label>`).join('')}
        </div>
      </div>`;

      // Toppings — optional accordion, grouped
      let toppingRows = '';
      BURGER_TOPPINGS.forEach(grp => {
        toppingRows += `<div class="cz-group-lbl">${grp.group}</div>
          <div class="cz-extras-grid">
            ${grp.items.map(e => `
              <label class="cz-extra-item">
                <input type="checkbox" class="cz-extra-cb" data-name="${s(e.name)}" data-price="${e.price}" onchange="Customize._upd()">
                <span class="cz-extra-name">${s(e.name)}</span>
                <span class="cz-extra-price">${e.price>0?`+$${e.price.toFixed(2)}`:'Free'}</span>
              </label>`).join('')}
          </div>`;
      });
      inner += `<details class="cz-accordion">
        <summary class="cz-accordion-hdr">
          <span>Add Toppings</span>
          <span class="cz-acc-badge">Optional · 40+ choices</span>
        </summary>
        <div class="cz-accordion-body">${toppingRows}</div>
      </details>`;

      // Remove items — optional accordion
      inner += `<details class="cz-accordion">
        <summary class="cz-accordion-hdr">
          <span>Remove Items</span>
          <span class="cz-acc-badge">Optional</span>
        </summary>
        <div class="cz-accordion-body">
          <div class="cz-extras-grid">
            ${BURGER_REMOVALS.map(e => `
              <label class="cz-extra-item">
                <input type="checkbox" class="cz-extra-cb" data-name="${s(e.name)}" data-price="0" onchange="Customize._upd()">
                <span class="cz-extra-name">${s(e.name)}</span>
                <span class="cz-extra-price cz-free">Free</span>
              </label>`).join('')}
          </div>
        </div>
      </details>`;

      // Extra Options — optional accordion
      inner += `<details class="cz-accordion">
        <summary class="cz-accordion-hdr">
          <span>Extra Options</span>
          <span class="cz-acc-badge">Optional</span>
        </summary>
        <div class="cz-accordion-body">
          <div class="cz-extras-grid">
            ${BURGER_XTRA.map(e => `
              <label class="cz-extra-item">
                <input type="checkbox" class="cz-extra-cb" data-name="${s(e.name)}" data-price="${e.price}" onchange="Customize._upd()">
                <span class="cz-extra-name">${s(e.name)}</span>
                <span class="cz-extra-price">${e.price>0?`+$${e.price.toFixed(2)}`:'Free'}</span>
              </label>`).join('')}
          </div>
        </div>
      </details>`;
    }

    /* ── WINGS ── */
    if (cat === 'wings') {
      inner += `<div class="cz-section cz-section-req">
        <div class="cz-sec-title">Choose Your Sauce <span class="cz-req">Required</span></div>
        <div class="cz-pill-grid">
          ${WING_SAUCES.map(ws => `
            <label class="cz-pill">
              <input type="radio" name="czSauce" value="${s(ws)}" onchange="Customize._upd()">
              <span class="cz-pill-txt">${s(ws)}</span>
            </label>`).join('')}
        </div>
      </div>`;
    }

    /* ── SOFT DRINKS ── */
    if (cat === 'softdrink') {
      inner += `<div class="cz-section cz-section-req">
        <div class="cz-sec-title">Choose Your Flavor <span class="cz-req">Required</span></div>
        <div class="cz-pill-grid">
          ${SOFT_DRINK_FLAVORS.map((f,i) => `
            <label class="cz-pill">
              <input type="radio" name="czSauce" value="${s(f)}" ${i===0?'checked':''} onchange="Customize._upd()">
              <span class="cz-pill-txt">${s(f)}</span>
            </label>`).join('')}
        </div>
      </div>`;
    }

    /* ── JUICE ── */
    if (cat === 'juice') {
      inner += `<div class="cz-section cz-section-req">
        <div class="cz-sec-title">Choose Your Juice <span class="cz-req">Required</span></div>
        <div class="cz-pill-grid">
          ${JUICE_FLAVORS.map((f,i) => `
            <label class="cz-pill">
              <input type="radio" name="czSauce" value="${s(f)}" ${i===0?'checked':''} onchange="Customize._upd()">
              <span class="cz-pill-txt">${s(f)}</span>
            </label>`).join('')}
        </div>
      </div>`;
    }

    /* ── NOTES (all items) ── */
    inner += `<div class="cz-section" style="margin-top:8px;">
      <div class="cz-sec-title">Special Instructions <span class="cz-opt-label">Optional</span></div>
      <textarea id="czNotes" class="cz-notes" placeholder="E.g. no onions, extra crispy, sauce on the side…" maxlength="200"></textarea>
    </div>`;

    const modal = document.getElementById('customizeModal');
    if (!modal) return;
    modal.innerHTML = `
      <div class="cz-modal-inner">
        <div class="cz-modal-hdr">
          <div>
            <div class="cz-modal-name">${sanitize(_item.name)}</div>
            <div class="cz-modal-desc">${sanitize(_item.desc)}</div>
          </div>
          <button class="cart-close" onclick="Customize.close()" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="cz-modal-body">${inner}</div>
        <div class="cz-modal-ftr">
          <div id="czError" class="cz-error" style="display:none"></div>
          <div class="cz-qty-row">
            <span class="cz-qty-label">Quantity</span>
            <div class="cz-qty-ctrl">
              <button class="ci-btn" onclick="Customize.setQty(-1)">−</button>
              <span id="czQty" class="ci-qty">${_qty}</span>
              <button class="ci-btn" onclick="Customize.setQty(1)">+</button>
            </div>
          </div>
          <button class="btn btn-red cz-confirm-btn" onclick="Customize.confirm()">
            Add to Order &nbsp;·&nbsp; <span id="czItemTotal">$${_item.basePrice.toFixed(2)}</span>
          </button>
        </div>
      </div>`;
  }

  function inject() {
    const ov = document.createElement('div');
    ov.id = 'customizeOverlay'; ov.className = 'cz-overlay';
    ov.addEventListener('click', close);
    document.body.appendChild(ov);

    const modal = document.createElement('div');
    modal.id = 'customizeModal'; modal.className = 'cz-modal';
    document.body.appendChild(modal);
  }

  return { open, close, confirm, setQty, _upd: updateTotal, inject };
})();

/* ---------- Wire up Add buttons → Customize modal ---------- */
Cart.add = function(btn) { Customize.open(btn); };


/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Cart.inject();
  Customize.inject();
});
