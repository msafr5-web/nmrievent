(function () {
  var grid = document.getElementById('pf-grid');
  var filters = document.getElementById('pf-filters');
  var items = [];
  var cat = 'all';
  var ICON = {
    exhibition: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
    event: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
    interior: 'M4 20v-7a2 2 0 012-2h12a2 2 0 012 2v7M6 11V7a2 2 0 012-2h8a2 2 0 012 2v4M3 20h18',
    branding: 'M12 3a9 9 0 100 18 4 4 0 004-4 2 2 0 012-2h1a2 2 0 002-2 9 9 0 00-9-10z'
  };
  var HUE = { exhibition: ['#7c3aed', '#f97316'], event: ['#f97316', '#f59e0b'], interior: ['#6d28d9', '#22d3ee'], branding: ['#a855f7', '#f59e0b'] };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function render() {
    grid.replaceChildren();
    var shown = items.filter(function (p) { return cat === 'all' || p.category === cat; });
    if (!shown.length) { grid.appendChild(el('p', 'text-slate-400', NMR.t('pf.noitems'))); return; }
    shown.forEach(function (p) {
      var c = HUE[p.category] || HUE.event;
      var card = el('article', 'card overflow-hidden !p-0 transition hover:-translate-y-1 hover:shadow-glow-purple');
      var art = el('div', 'grid h-40 place-items-center');
      art.style.background = 'linear-gradient(135deg,' + c[0] + ',' + c[1] + ')';
      art.innerHTML = '<svg class="h-14 w-14 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICON[p.category] || ICON.event) + '"/></svg>';
      var body = el('div', 'p-5');
      body.appendChild(el('p', 'text-xs font-semibold uppercase tracking-wide text-gold-400', NMR.t('cat.' + p.category)));
      body.appendChild(el('h3', 'mt-1 text-lg font-bold text-white', p.title));
      body.appendChild(el('p', 'mt-1 text-sm text-slate-400', p.year + (p.area ? ' · ' + p.area + ' ' + NMR.t('pf.area') : '')));
      card.append(art, body);
      grid.appendChild(card);
    });
  }

  filters.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    render();
  });
  NMR.onLang(render);

  fetch('/api/projects').then(function (r) { return r.json(); }).then(function (d) { items = d.portfolio || []; render(); })
    .catch(function () { grid.appendChild(el('p', 'text-slate-400', NMR.t('err.network'))); });

  // Count-up for the headline figures; users who prefer reduced motion see the final numbers at once.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-count]').forEach(function (n) {
    var end = Number(n.dataset.count);
    if (reduce) return;
    var start = performance.now();
    (function tick(now) {
      var k = Math.min((now - start) / 1200, 1);
      n.textContent = '+' + Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(start);
  });
})();
