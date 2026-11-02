(function () {
  var menu = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('hidden') === false;
      nav.classList.toggle('flex', open);
      nav.classList.toggle('absolute', open);
      nav.classList.toggle('inset-x-0', open);
      nav.classList.toggle('top-16', open);
      nav.classList.toggle('flex-col', open);
      nav.classList.toggle('items-stretch', open);
      nav.classList.toggle('bg-ink-950', open);
      nav.classList.toggle('p-3', open);
      nav.classList.toggle('border-b', open);
      nav.classList.toggle('border-white/10', open);
      menu.setAttribute('aria-expanded', String(open));
    });
  }
  var lang = document.getElementById('lang-toggle');
  if (lang) lang.addEventListener('click', function () { NMR.setLang(NMR.getLang() === 'ar' ? 'en' : 'ar'); });
  var print = document.querySelector('[data-print]');
  if (print) print.addEventListener('click', function () { window.print(); });
})();
