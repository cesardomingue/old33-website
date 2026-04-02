/* ============================================
   OLD 33 BEER & BURGER GRILL — MAIN JS
   ============================================ */

/* --- Loading Screen (index only, once per session unless logo clicked) --- */
const loader = document.getElementById('loader');
if (loader) {
  const forceShow = new URLSearchParams(window.location.search).has('logo');
  const alreadyShown = sessionStorage.getItem('loaderShown');
  if (alreadyShown && !forceShow) {
    loader.classList.add('gone');
  } else {
    sessionStorage.setItem('loaderShown', '1');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      loader.classList.add('gone');
      document.body.style.overflow = '';
    }, 3200);
  }
}

/* --- Navbar Scroll Effect --- */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
  });
}

/* --- Mobile Nav Toggle --- */
const navHam    = document.getElementById('navHam');
const navMobile = document.getElementById('navMobile');

if (navHam && navMobile) {
  navHam.addEventListener('click', () => {
    const open = navHam.classList.toggle('open');
    navMobile.classList.toggle('open', open);
  });

  navMobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navHam.classList.remove('open');
      navMobile.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!navHam.contains(e.target) && !navMobile.contains(e.target)) {
      navHam.classList.remove('open');
      navMobile.classList.remove('open');
    }
  });
}

/* --- Active Nav Link --- */
const page = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === page || (page === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});

/* --- Scroll Reveal --- */
const revEls = document.querySelectorAll('.reveal');
if (revEls.length) {
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        ro.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
  revEls.forEach(el => ro.observe(el));
}

/* --- Photo Card Variant Picker --- */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.pc-variant');
  if (!btn) return;
  const card = btn.closest('.photo-card');

  if (btn.classList.contains('pc-variant-protein')) {
    // Multi-select protein add-ons: toggle
    btn.classList.toggle('active');

  } else if (btn.dataset.multi === '1') {
    // Multi-select dressings: toggle, but keep at least one selected
    const activeDressings = card.querySelectorAll('.pc-variant[data-multi="1"].active');
    if (btn.classList.contains('active') && activeDressings.length <= 1) return;
    btn.classList.toggle('active');
    // Rebuild card name from all active dressings
    const allActive = [...card.querySelectorAll('.pc-variant[data-multi="1"].active')];
    const baseName = btn.dataset.name.split(' — ')[0];
    const dressings = allActive.map(b => b.dataset.name.split(' — ')[1] || b.dataset.name);
    card.dataset.name  = dressings.length ? `${baseName} — ${dressings.join(' + ')}` : baseName;
    card.dataset.price = btn.dataset.price; // all dressings same price

  } else {
    // Radio — one base option at a time
    card.querySelectorAll('.pc-variant:not(.pc-variant-protein)').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    card.dataset.name  = btn.dataset.name;
    card.dataset.price = btn.dataset.price;
  }

  // Recalculate displayed price: base + all selected protein add-ons
  const base = parseFloat(card.dataset.price) || 0;
  let addons = 0;
  card.querySelectorAll('.pc-variant-protein.active').forEach(b => {
    addons += parseFloat(b.dataset.price) || 0;
  });
  const priceEl = card.querySelector('.pc-price');
  if (priceEl) priceEl.textContent = '$' + (base + addons).toFixed(2);
});

/* --- Floating Call Button (mobile only) --- */
(function() {
  const fab = document.createElement('a');
  fab.href = 'tel:5407139050';
  fab.className = 'float-call';
  fab.setAttribute('aria-label', 'Call to Order');
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.35a16 16 0 006.29 6.29l1.58-1.16a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
    <span>Call to Order</span>`;
  document.body.appendChild(fab);
})();

/* --- Highlight Today's Hours Row --- */
const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const todayName = dayNames[new Date().getDay()];
document.querySelectorAll(`[data-day="${todayName}"]`).forEach(row => {
  row.classList.add('today-row');
});
