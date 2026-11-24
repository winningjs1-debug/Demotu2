/* 装修风格切换：A=原版餐具兔（居中铺满，原版暖粉遮罩）；
 * B-E=5.jpg/9.jpg 拼贴主体居中排版（保留原图色调，不染色）。
 * 顶部英文化设计不受影响。localStorage 记忆选择，对所有页面生效。 */
(function () {
  'use strict';
  var KEY = 'demotu-skin';
  /* URL 相对 CSS 文件目录(assets/css/)解析 */
  var DIR = '../img/landscape/';
  var ORIG_OVERLAY = 'linear-gradient(to bottom,rgba(255,244,247,.08) 0%,rgba(255,242,246,.24) 28%,rgba(255,247,249,.6) 58%,rgba(255,251,252,.94) 86%,#fff 100%)';
  var ORIG_GRADIENT = 'linear-gradient(-45deg,#f3dce3,#efe6f1,#e8eef6,#f7e6ec)';
  function veil(tint) {
    return 'linear-gradient(to bottom, rgba(' + tint + ',.02) 0%, rgba(' + tint + ',.10) 20%, rgba(' + tint + ',.40) 52%, rgba(' + tint + ',.80) 82%, #fdfcfa 100%)';
  }
  var SKINS = {
    A: {
      name: '原版·餐具兔', desc: '法式蕾丝 · 居中铺满',
      img: 'orig-tableware', portrait: 'orig-tableware',
      fit: 'cover', pos: 'center 26%', phOp: 0.72,
      body: '#fff', overlay: ORIG_OVERLAY, gradient: ORIG_GRADIENT, gradOp: 0.32,
      accent: '#a88b96', gold: '#c9aebb',
      title: 'linear-gradient(120deg,#b98aa0 0%,#d9b48f 52%,#b98aa0 100%)'
    },
    B: {
      name: '小羊·居中', desc: '原色拼贴 · 居中排版',
      img: 'center-lamb', portrait: 'portrait-lamb',
      fit: '100% auto', pos: 'center top', phOp: 1,
      body: '#fbfbfc', overlay: veil('238,240,244'),
      gradient: 'linear-gradient(-45deg,#edf0f2,#f6f7f8,#eef1f3,#f7f8f9)', gradOp: 0.18,
      accent: '#8b929b', gold: '#b9bec5',
      title: 'linear-gradient(120deg,#7d858f 0%,#b9bec5 52%,#8e969f 100%)'
    },
    C: {
      name: '兔宝·居中', desc: '原色拼贴 · 居中排版',
      img: 'center-bunny', portrait: 'portrait-bunny',
      fit: '100% auto', pos: 'center top', phOp: 1,
      body: '#fdfaf9', overlay: veil('246,238,238'),
      gradient: 'linear-gradient(-45deg,#f5eeec,#faf5f4,#f3ecea,#f9f5f4)', gradOp: 0.18,
      accent: '#a88b8e', gold: '#c9b9b8',
      title: 'linear-gradient(120deg,#947a7e 0%,#c9b9b8 52%,#a58b8f 100%)'
    },
    D: {
      name: '双拼·居中', desc: '羊兔并置 · 居中排版',
      img: 'center-duo', portrait: 'portrait-bunny',
      fit: '100% auto', pos: 'center top', phOp: 1,
      body: '#fafbfb', overlay: veil('240,240,242'),
      gradient: 'linear-gradient(-45deg,#f0f0f2,#f7f7f8,#efeff2,#f7f7f8)', gradOp: 0.18,
      accent: '#8f8d96', gold: '#c0bec4',
      title: 'linear-gradient(120deg,#7d7b85 0%,#c0bec4 52%,#8f8d98 100%)'
    },
    E: {
      name: '小羊·纸底', desc: '原色拼贴 · 居中纸底',
      img: 'center-lamb-paper', portrait: 'portrait-lamb',
      fit: '100% auto', pos: 'center top', phOp: 1,
      body: '#fbfaf8', overlay: veil('242,240,236'),
      gradient: 'linear-gradient(-45deg,#f1eeea,#f8f6f2,#f0ede8,#f8f6f3)', gradOp: 0.18,
      accent: '#96918a', gold: '#c5bfb7',
      title: 'linear-gradient(120deg,#817c74 0%,#c5bfb7 52%,#948f87 100%)'
    }
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
    root.style.setProperty('--skin-bg', 'url("' + DIR + s.img + '.jpg")');
    root.style.setProperty('--skin-bg-mobile', 'url("' + DIR + (s.portrait || s.img) + '.jpg")');
    root.style.setProperty('--skin-fit', s.fit || '100% auto');
    root.style.setProperty('--skin-pos', s.pos || 'center top');
    root.style.setProperty('--skin-ph-op', s.phOp || 1);
    root.style.setProperty('--skin-body-bg', s.body);
    root.style.setProperty('--skin-overlay', s.overlay);
    root.style.setProperty('--skin-gradient', s.gradient);
    root.style.setProperty('--skin-grad-op', s.gradOp || 0.18);
    root.style.setProperty('--skin-accent', s.accent);
    root.style.setProperty('--skin-gold', s.gold);
    root.style.setProperty('--skin-title', s.title);
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
