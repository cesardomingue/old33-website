/* ===== OLD 33 MEMBERS NAV — included on every page ===== */
(function() {
  function getMember() {
    try { return JSON.parse(localStorage.getItem('ol33_member') || 'null'); } catch(e) { return null; }
  }

  function showSignOutModal() {
    var existing = document.getElementById('signOutModal');
    if (existing) { existing.style.display = 'flex'; return; }

    var modal = document.createElement('div');
    modal.id = 'signOutModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

    var inner = document.createElement('div');
    inner.style.cssText = 'background:#1a1a1a;border:1px solid #333;border-radius:14px;width:100%;max-width:360px;overflow:hidden;';
    inner.innerHTML =
      '<div style="background:#c8a84b;padding:18px 24px;">' +
        '<div style="font-size:16px;font-weight:900;color:#000;letter-spacing:1px;text-transform:uppercase;">Sign Out</div>' +
        '<div style="font-size:12px;color:rgba(0,0,0,.6);margin-top:2px;">Old 33 Members Club</div>' +
      '</div>' +
      '<div style="padding:24px;">' +
        '<p style="font-size:14px;color:#ccc;margin:0 0 24px;line-height:1.6;">Are you sure you want to sign out? Another person can sign in with their email to see their deals.</p>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="signOutCancel" style="flex:1;background:#2a2a2a;border:1px solid #444;color:#ccc;font-size:13px;font-weight:600;padding:12px;border-radius:8px;cursor:pointer;">Cancel</button>' +
          '<button id="signOutConfirm" style="flex:1;background:#c8a84b;border:none;color:#000;font-size:13px;font-weight:800;padding:12px;border-radius:8px;cursor:pointer;letter-spacing:.5px;">Sign Out</button>' +
        '</div>' +
      '</div>';

    modal.appendChild(inner);
    document.body.appendChild(modal);

    document.getElementById('signOutCancel').addEventListener('click', function() {
      modal.style.display = 'none';
    });
    document.getElementById('signOutConfirm').addEventListener('click', function() {
      localStorage.removeItem('ol33_member');
      window.location.reload();
    });
  }

  window.memberSignOut = function() {
    localStorage.removeItem('ol33_member');
    // Keep ol33_info so email pre-fills on next sign-in
    window.location.reload();
  };

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
        signInEl.onclick = function(e) {
          e.preventDefault();
          showSignOutModal();
        };
      }
      if (mobEl) {
        mobEl.textContent = 'Hi, ' + first + ' (Sign Out)';
        mobEl.style.color = '#c8a84b';
        mobEl.onclick = function(e) {
          e.preventDefault();
          showSignOutModal();
        };
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
