// Runs before first paint so the page never flashes in the wrong language or direction.
(function () {
  var lang = 'en';
  try { lang = localStorage.getItem('nmr-lang') === 'ar' ? 'ar' : 'en'; } catch (e) { /* storage blocked */ }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
})();
