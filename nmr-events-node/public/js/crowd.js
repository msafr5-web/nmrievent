(function () {
  var planForm = document.getElementById('plan-form');
  var planOut = document.getElementById('plan-out');
  var planErr = document.getElementById('plan-err');
  var lastPlan = null;

  function role(r) { return NMR.t('role.' + r); }

  function renderPlan() {
    planOut.replaceChildren();
    if (!lastPlan) { planOut.appendChild(h('p', 'text-slate-400', NMR.t('cr.empty'))); return; }
    var p = lastPlan;
    var tot = h('div', 'mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5');
    [['EVENT_DIRECTOR', p.totals.director], ['ZONE_SUPERVISOR', p.totals.supervisors], ['SAFETY', p.totals.safety], ['USHER', p.totals.ushers], ['FIRST_AID', p.totals.firstAid]].forEach(function (x) {
      var c = h('div', 'rounded-xl border border-white/10 bg-ink-900 p-3 text-center');
      c.append(h('p', 'text-2xl font-black text-white', String(x[1])), h('p', 'text-[11px] text-slate-400', role(x[0])));
      tot.appendChild(c);
    });
    planOut.append(h('h2', 'mb-3 text-lg font-bold text-white', NMR.t('cr.total') + ': ' + p.totals.all + ' · ' + NMR.t('cr.zones') + ': ' + p.zones), tot);

    var tree = h('ul', 'space-y-3');
    var dir = h('li', 'rounded-xl border border-gold-400/40 bg-gold-400/10 p-3 font-bold text-gold-300', role('EVENT_DIRECTOR') + ' ×1');
    var inner = h('ul', 'mt-3 space-y-3 border-s border-white/10 ps-4');
    p.tree.children.forEach(function (z) {
      var li = h('li', 'rounded-xl border border-white/10 bg-ink-900 p-3');
      li.appendChild(h('p', 'font-semibold text-white', role('ZONE_SUPERVISOR') + ' · ' + NMR.t('cr.zone') + ' ' + z.zone));
      var kids = h('p', 'mt-2 flex flex-wrap gap-2');
      z.children.forEach(function (c) { kids.appendChild(h('span', 'tag bg-royal-600/25 text-royal-400', role(c.role) + ' ×' + c.count)); });
      li.appendChild(kids); inner.appendChild(li);
    });
    dir.appendChild(inner); tree.appendChild(dir); planOut.appendChild(tree);
  }

  planForm.addEventListener('submit', function (e) {
    e.preventDefault(); planErr.textContent = '';
    var q = new URLSearchParams({ area: document.getElementById('p-area').value, crowd: document.getElementById('p-crowd').value, venueType: document.getElementById('p-venue').value });
    api('/api/crowd/plan?' + q).then(function (r) {
      if (!r.ok) { planErr.textContent = errText(r.data); return; }
      lastPlan = r.data; renderPlan();
    });
  });
  renderPlan();
  NMR.onLang(function () { renderPlan(); paintMonitor(); });

  // ---- live monitor (operator key kept only for this tab) ----
  var keyForm = document.getElementById('key-form');
  var keyInput = document.getElementById('key');
  var monErr = document.getElementById('mon-err');
  var body = document.getElementById('mon-body');
  var sel = document.getElementById('ev');
  var timer = null;
  var snap = null;
  var KEY = '';
  var LVL = { normal: 'bg-emerald-500/15 text-emerald-300', busy: 'bg-amber-500/15 text-amber-300', near: 'bg-orange-500/20 text-orange-300', over: 'bg-red-500/20 text-red-300', unknown: 'bg-white/5 text-slate-400' };
  var BAR = { normal: 'bg-emerald-400', busy: 'bg-amber-400', near: 'bg-orange-500', over: 'bg-red-500', unknown: 'bg-slate-500' };

  function call(path, opts) {
    opts = opts || {}; opts.headers = { 'x-admin-key': KEY };
    return api(path, opts);
  }

  function paintMonitor() {
    if (!snap) return;
    document.getElementById('occ').textContent = snap.currentOccupancy;
    document.getElementById('cap').textContent = snap.capacity;
    var lvl = document.getElementById('lvl');
    lvl.className = 'tag ' + LVL[snap.level]; lvl.textContent = NMR.t('level.' + snap.level) + ' · ' + snap.percent + '%';
    var bar = document.getElementById('bar');
    bar.className = 'h-full rounded-full transition-all ' + BAR[snap.level];
    bar.style.width = Math.min(snap.percent, 100) + '%';
    var parts = Object.keys(snap.staff || {}).map(function (k) { return NMR.t('status.' + k) + ': ' + snap.staff[k]; });
    document.getElementById('staff').textContent = parts.length ? NMR.t('cr.staffline') + ' — ' + parts.join(' · ') : '';
  }

  function poll() {
    if (!sel.value) return;
    call('/api/crowd/' + encodeURIComponent(sel.value) + '/status').then(function (r) {
      if (!r.ok) { monErr.textContent = errText(r.data); return; }
      monErr.textContent = ''; snap = r.data; paintMonitor();
    });
  }
  function start() { clearInterval(timer); poll(); timer = setInterval(function () { if (!document.hidden) poll(); }, 3000); }

  keyForm.addEventListener('submit', function (e) {
    e.preventDefault(); monErr.textContent = ''; KEY = keyInput.value.trim();
    call('/api/event-projects').then(function (r) {
      if (!r.ok) { monErr.textContent = errText(r.data); body.classList.add('hidden'); clearInterval(timer); return; }
      sel.replaceChildren();
      if (!r.data.events.length) { monErr.textContent = NMR.t('cr.noevents'); body.classList.add('hidden'); return; }
      r.data.events.forEach(function (ev) { sel.add(new Option(ev.clientName, ev.id)); });
      body.classList.remove('hidden'); start();
    });
  });
  sel.addEventListener('change', start);
  body.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-d]');
    if (!b || !sel.value) return;
    call('/api/crowd/' + encodeURIComponent(sel.value) + '/occupancy', { method: 'POST', body: { delta: Number(b.dataset.d) } }).then(function (r) {
      if (!r.ok) { monErr.textContent = errText(r.data); return; }
      poll();
    });
  });
})();
