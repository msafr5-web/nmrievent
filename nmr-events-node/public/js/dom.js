// Small helpers shared by the page scripts. Everything is built with textContent, never innerHTML,
// so server or user supplied text can never be interpreted as markup.
window.h = function (tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

/** Calls the JSON API and returns {ok, status, data}; a network failure resolves with ok:false, data.error.code 'NETWORK'. */
window.api = function (path, opts) {
  opts = opts || {};
  var init = { method: opts.method || 'GET', headers: Object.assign({ Accept: 'application/json' }, opts.headers || {}) };
  if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
  return fetch(path, init)
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, status: r.status, data: data }; }); })
    .catch(function () { return { ok: false, status: 0, data: { error: { code: 'NETWORK' } } }; });
};

/** Turns an API error payload into a message in the current language. */
window.errText = function (data) {
  var e = (data && data.error) || {};
  if (e.code === 'NETWORK') return NMR.t('err.network');
  if (e.code === 'INVALID_OTP' && e.attemptsLeft != null) return NMR.t('err.INVALID_OTP_LEFT', e);
  var key = 'err.' + e.code;
  var s = NMR.t(key, e);
  return s === key ? (NMR.t('err.generic')) : s;
};
