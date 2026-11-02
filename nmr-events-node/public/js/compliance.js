(function () {
  var form = document.getElementById('calc-form');
  var out = document.getElementById('result');
  var errBox = document.getElementById('form-err');
  var density = document.getElementById('density');
  var densityOut = document.getElementById('density-out');
  var last = null; // {input, data}
  var STATUS_CLS = { COMPLIANT: 'bg-emerald-500/15 text-emerald-300', CONDITIONAL: 'bg-amber-500/15 text-amber-300', NON_COMPLIANT: 'bg-red-500/15 text-red-300' };
  var SEV_CLS = { critical: 'border-red-500/40 bg-red-500/10 text-red-200', warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200', info: 'border-royal-500/40 bg-royal-600/10 text-slate-200' };

  density.addEventListener('input', function () { densityOut.textContent = Number(density.value).toFixed(1); });

  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function row(label, value) {
    var r = h('div', 'flex items-baseline justify-between gap-3 border-b border-white/5 py-2 text-sm');
    r.append(h('span', 'text-slate-400', label), h('span', 'font-semibold text-white', value));
    return r;
  }
  function panel(title) { var c = h('section', 'card'); c.appendChild(h('h3', 'mb-2 text-base font-bold text-white', title)); return c; }

  function render() {
    out.replaceChildren();
    if (!last) return;
    var d = last.data;
    var t = NMR.t;

    var head = h('section', 'card flex flex-wrap items-center justify-between gap-3');
    var left = h('div');
    left.append(h('p', 'label !mb-0', t('c.title')), h('p', 'mt-1 text-xl font-black text-white', t('status.' + d.status)));
    head.append(left, h('span', 'tag text-sm ' + STATUS_CLS[d.status], d.status.replace('_', ' ')));
    out.appendChild(head);

    var find = panel(t('c.findings'));
    if (!d.findings.length) find.appendChild(h('p', 'text-sm text-slate-400', t('c.none')));
    d.findings.forEach(function (f) {
      find.appendChild(h('p', 'mb-2 rounded-xl border p-3 text-sm ' + SEV_CLS[f.severity], t('f.' + f.code, f.values)));
    });
    out.appendChild(find);

    var cap = panel(t('c.cap'));
    cap.append(
      row(t('cap.dense'), fmt(d.capacity.dense)),
      row(t('cap.standard'), fmt(d.capacity.standard)),
      row(t('cap.comfortable'), fmt(d.capacity.comfortable)),
      row(t('c.actual'), d.density.actual + ' m²/' + t('c.person') + ' · ' + t('band.' + d.density.band))
    );
    out.appendChild(cap);

    var eg = panel(t('c.egress'));
    eg.append(
      row(t('c.exits'), String(d.egress.requiredExits)),
      row(t('c.wtotal'), d.egress.totalWidthM + ' m'),
      row(t('c.weach'), d.egress.perExitWidthM + ' m'),
      row(t('c.mindoor'), d.egress.minDoorWidthM + ' m')
    );
    out.appendChild(eg);

    var fire = panel(t('c.fire'));
    var yes = '✓';
    fire.append(row(t('c.ext'), String(d.fire.extinguishers)), row(t('c.emlight'), yes), row(t('c.signage'), yes));
    if (d.fire.fireAlarm) fire.appendChild(row(t('c.alarm'), yes));
    if (d.fire.sprinklers) fire.appendChild(row(t('c.sprinkler'), yes));
    var fl = h('div', 'mt-3');
    fl.appendChild(h('p', 'text-xs text-slate-400', t('c.flame')));
    var chips = h('p', 'mt-2 flex flex-wrap gap-2');
    d.fire.flameRetardant.forEach(function (k) { chips.appendChild(h('span', 'tag bg-flame-500/15 text-flame-400', t('flame.' + k))); });
    fl.appendChild(chips); fire.appendChild(fl);
    out.appendChild(fire);

    if (d.outdoor) {
      var od = panel(t('c.outdoor'));
      od.append(row(t('c.water'), String(d.outdoor.waterPoints)), row(t('c.shade'), yes), row(t('c.weather'), yes));
      out.appendChild(od);
    }

    var permits = panel(t('c.permits'));
    var boxes = [];
    d.permits.forEach(function (a) {
      permits.appendChild(h('h4', 'mt-4 text-sm font-bold text-gold-300', t('auth.' + a.authority)));
      a.items.forEach(function (it) {
        var lab = h('label', 'flex min-h-11 cursor-pointer items-center gap-3 border-b border-white/5 text-sm');
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = it.id; cb.className = 'h-5 w-5 accent-orange-500';
        boxes.push(cb);
        lab.append(cb, h('span', 'flex-1 text-slate-200', t('p.' + it.id)), h('span', 'tag ' + (it.required ? 'bg-flame-500/15 text-flame-400' : 'bg-white/5 text-slate-400'), t(it.required ? 'c.required' : 'c.optional')));
        permits.appendChild(lab);
      });
    });
    var res = h('div', 'mt-4', null);
    res.setAttribute('aria-live', 'polite');
    var btn = h('button', 'btn-primary mt-4', t('c.validate'));
    btn.type = 'button';
    btn.addEventListener('click', function () {
      var done = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      res.textContent = t('c.checking');
      api('/api/compliance/validate', { method: 'POST', body: Object.assign({}, last.input, { done: done }) }).then(function (r) {
        res.replaceChildren();
        if (!r.ok) { res.appendChild(h('p', 'err', errText(r.data))); return; }
        var v = r.data;
        var bar = h('div', 'h-3 overflow-hidden rounded-full bg-white/10');
        var fill = h('div', 'h-full rounded-full ' + (v.ready ? 'bg-emerald-400' : 'bg-flame-500'));
        fill.style.width = v.progress.percent + '%';
        bar.appendChild(fill);
        res.append(h('p', 'mb-2 text-sm text-slate-300', t('c.progress') + ': ' + v.progress.completed + ' / ' + v.progress.required + ' (' + v.progress.percent + '%)'), bar);
        if (v.ready) res.appendChild(h('p', 'mt-3 text-sm font-semibold text-emerald-300', t('c.ready')));
        else if (v.missing.length) {
          res.appendChild(h('p', 'mt-3 text-sm font-semibold text-amber-300', t('c.missing')));
          var ul = h('ul', 'mt-1 list-disc ps-5 text-sm text-slate-300');
          v.missing.forEach(function (m) { ul.appendChild(h('li', null, t('p.' + m.id))); });
          res.appendChild(ul);
        }
      });
    });
    permits.append(btn, res);
    out.appendChild(permits);

    out.appendChild(h('p', 'text-xs text-slate-500', t('c.disclaimer')));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errBox.textContent = '';
    var f = new FormData(form);
    var input = {
      area: Number(f.get('area')), crowd: Number(f.get('crowd')), venueType: f.get('venueType'),
      eventType: f.get('eventType'), density: Number(f.get('density')), duration: Number(f.get('duration')) || 1
    };
    var qs = new URLSearchParams(input).toString();
    api('/api/compliance/calculate?' + qs).then(function (r) {
      if (!r.ok) {
        var fields = r.data.error && r.data.error.fields;
        errBox.textContent = errText(r.data) + (fields ? ' (' + Object.keys(fields).join(', ') + ')' : '');
        return;
      }
      last = { input: input, data: r.data };
      render();
    });
  });
  NMR.onLang(render);
})();
