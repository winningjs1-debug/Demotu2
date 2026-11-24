/* 三套装修皮肤切换：A 银白手账 / B 粉白梦境 / C 复古相簿
 * 方案数据与切换逻辑，localStorage 记忆选择，对所有页面生效。 */
(function () {
  'use strict';
  var KEY = 'demotu-skin';
  var SKINS = {
    A: { name: '天使之窗', desc: '银白手账', img: 'angel-lamb', veil: 'rgba(255,255,255,.58)' },
    B: { name: '玫瑰兔宝', desc: '粉白梦境', img: 'rose-bunny', veil: 'rgba(255,245,247,.55)' },
    C: { name: '复古相簿', desc: '银金拼贴', img: 'angel-lamb', veil: 'rgba(250,248,244,.62)' }
  };
  window.DEMO_SKINS = SKINS;

  function current() {
    try { var s = localStorage.getItem(KEY); return SKINS[s] ? s : 'A'; }
    catch (e) { return 'A'; }
  }
  window.getSkin = current;

  function apply(id) {
    if (!SKINS[id]) id = 'A';
    var s = SKINS[id];
    var root = document.documentElement;
    root.setAttribute('data-skin', id);
    // 背景图与遮罩通过 CSS 变量驱动 style.css 中的 .bg-photo / .bg-overlay
    var img = '../img/collab/' + s.img + '.jpg';
    root.style.setProperty('--skin-bg', 'url("' + img + '")');
    root.style.setProperty('--skin-veil', s.veil);
    try { localStorage.setItem(KEY, id); } catch (e) {}
    document.querySelectorAll('[data-skin-btn]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-skin-btn') === id);
    });
  }
  window.applySkin = apply;

  function openPicker(e) {
    if (e) e.preventDefault();
    var box = document.getElementById('skinPicker');
    if (!box) return;
    box.classList.toggle('open');
  }
  window.toggleSkinPicker = openPicker;

  document.addEventListener('DOMContentLoaded', function () {
    apply(current());
    var btn = document.getElementById('skinFab');
    if (btn) btn.addEventListener('click', openPicker);
    document.querySelectorAll('[data-skin-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        apply(b.getAttribute('data-skin-btn'));
        var box = document.getElementById('skinPicker');
        if (box) box.classList.remove('open');
      });
    });
  });
})();
