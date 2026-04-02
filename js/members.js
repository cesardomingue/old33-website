/* ===== OLD 33 MEMBERS NAV — included on every page ===== */
(function() {
  function getMember() {
    try { return JSON.parse(localStorage.getItem('ol33_member') || 'null'); } catch(e) { return null; }
  }

  function openMemberModal(e) {
    if (e) e.preventDefault();
    var member = getMember();
    if (member) {
      // Already signed in — go to home to see deals
      window.location.href = 'index.html#membersSection';
      return;
    }
    // Redirect to homepage which has the full modal
    window.location.href = 'index.html#join';
  }

  function updateNav() {
    var member = getMember();

    // Auto-enroll from ol33_info if not already a member
    if (!member) {
      try {
        var saved = JSON.parse(localStorage.getItem('ol33_info') || '{}');
        if (saved.name && saved.email) {
          member = { name: saved.name, email: saved.email, joined: new Date().toISOString() };
          localStorage.setItem('ol33_member', JSON.stringify(member));
        }
      } catch(ex) {}
    }

    var signInEl = document.getElementById('navSignIn');
    var mobEl    = document.getElementById('mobSignIn');

    if (member) {
      var first = member.name.split(' ')[0];
      if (signInEl) {
        signInEl.textContent = 'Hi, ' + first;
        signInEl.style.color = '#c8a84b';
        signInEl.style.fontWeight = '700';
      }
      if (mobEl) {
        mobEl.textContent = 'Hi, ' + first;
        mobEl.style.color = '#c8a84b';
      }
    }
  }

  // Expose for index.html modal usage
  window.openMemberModal = openMemberModal;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }
})();
