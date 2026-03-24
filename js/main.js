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

/* --- Highlight Today's Hours Row --- */
const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const todayName = dayNames[new Date().getDay()];
document.querySelectorAll(`[data-day="${todayName}"]`).forEach(row => {
  row.classList.add('today-row');
});
