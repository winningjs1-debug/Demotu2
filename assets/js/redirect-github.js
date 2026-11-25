/* 旧 GitHub Pages 入口自动跳转到云端正式站，保证原链接始终打开最新版。 */
(function () {
  try {
    if (location.hostname.indexOf('github.io') === -1) return;
    var rel = location.pathname.replace(/^\/Demotu2\/?/, '');
    var u = new URL('https://demotu.app.workbuddy.host/' + rel);
    u.searchParams.set('sharecode', 'WW34KV7DHD');
    location.replace(u.pathname + u.search + u.hash);
  } catch (e) {}
})();
