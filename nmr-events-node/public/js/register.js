(function () {
  var reg = document.getElementById('reg-form');
  var otp = document.getElementById('otp-form');
  var done = document.getElementById('done');
  var email = '';

  function step(n) {
    [1, 2, 3].forEach(function (i) {
      document.getElementById('st' + i).className = 'tag ' + (i === n ? 'bg-flame-500/20 text-gold-300' : i < n ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400');
    });
  }
  function clearErrors() {
    document.querySelectorAll('[data-err]').forEach(function (p) { p.textContent = ''; });
    document.getElementById('reg-err').textContent = '';
  }
  function showCode(d) {
    var box = document.getElementById('demo-box');
    if (d.devOtp) { document.getElementById('demo-code').textContent = d.devOtp; box.classList.remove('hidden'); } else box.classList.add('hidden');
  }

  reg.addEventListener('submit', function (e) {
    e.preventDefault(); clearErrors();
    var f = Object.fromEntries(new FormData(reg).entries());
    var btn = reg.querySelector('button[type=submit]'); btn.disabled = true;
    api('/api/auth/register-employee', { method: 'POST', body: f }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) {
        var fields = r.data.error && r.data.error.fields;
        if (fields) Object.keys(fields).forEach(function (k) { var p = document.querySelector('[data-err="' + k + '"]'); if (p) p.textContent = fields[k]; });
        document.getElementById('reg-err').textContent = errText(r.data);
        return;
      }
      email = r.data.email;
      document.getElementById('otp-email').textContent = email;
      showCode(r.data);
      reg.classList.add('hidden'); otp.classList.remove('hidden'); step(2);
      document.getElementById('otp').focus();
    });
  });

  otp.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = document.getElementById('otp-err'); err.textContent = '';
    var btn = otp.querySelector('button[type=submit]'); btn.disabled = true;
    api('/api/auth/verify-otp', { method: 'POST', body: { email: email, otp: document.getElementById('otp').value } }).then(function (r) {
      btn.disabled = false;
      if (!r.ok) { err.textContent = errText(r.data); return; }
      document.getElementById('done-id').textContent = r.data.badge.uniqueId;
      document.getElementById('done-link').href = r.data.badgeUrl;
      otp.classList.add('hidden'); done.classList.remove('hidden'); step(3);
    });
  });

  document.getElementById('resend').addEventListener('click', function () {
    var err = document.getElementById('otp-err'); err.textContent = '';
    api('/api/auth/resend-otp', { method: 'POST', body: { email: email } }).then(function (r) {
      if (!r.ok) { err.textContent = errText(r.data); return; }
      showCode(r.data); err.textContent = ''; err.className = 'mt-1.5 text-xs text-emerald-300'; err.textContent = NMR.t('r.resent');
      setTimeout(function () { err.className = 'err'; err.textContent = ''; }, 4000);
    });
  });
})();
