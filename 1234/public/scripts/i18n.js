/** WORD BRIDGE — Giao diện 100% Tiếng Việt (đã gỡ bỏ chuyển đổi giao diện EN theo yêu cầu). */
(function () {
  try { localStorage.removeItem('wb_ui_locale'); } catch {}
  document.documentElement.lang = 'vi';
  window.WB_I18N = {
    t: function (key) { return key; },
    getLocale: function () { return 'vi'; },
    setLocale: function () { document.documentElement.lang = 'vi'; },
    apply: function () { document.documentElement.lang = 'vi'; }
  };
})();
