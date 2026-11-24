/* DemoTu.com 全站账号资料共享层
 * 社区页编辑的昵称 / 账号 / 简介 / 头像，会自动同步到首页、关于页等所有页面。
 * 数据存 localStorage；同标签页用自定义事件，跨标签页用 storage 事件。 */
(function () {
  'use strict';

  var KEY = 'demotu-profile-v1';
  var OLD_KEY = 'demotu-social-v1';
  var DEFAULT = {
    name: 'DemoTu.com',
    handle: 'demotu',
    bio: '把每一天的小确幸，写成手账里的一页。',
    avatar: 'assets/img/avatar.svg'
  };
  var EVENT = 'demotu:profile';

  function clean(p) {
    p = p && typeof p === 'object' ? p : {};
    var out = {};
    Object.keys(DEFAULT).forEach(function (k) {
      var v = p[k];
      out[k] = (v === undefined || v === null || v === '') ? DEFAULT[k] : String(v);
    });
    out.handle = out.handle.replace(/^@+/, '').replace(/\s+/g, '');
    return out;
  }

  function get() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!saved) {
      // 从旧版社区数据迁移，避免老用户资料丢失
      try {
        var old = JSON.parse(localStorage.getItem(OLD_KEY));
        if (old && old.profile) saved = old.profile;
      } catch (e2) {}
    }
    return clean(saved);
  }

  function set(patch) {
    var next = clean(Object.assign(get(), patch || {}));
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
    } catch (e) {
      window.dispatchEvent(new Event(EVENT));
    }
    return next;
  }

  function reset() { return set(DEFAULT); }

  function subscribe(fn) {
    if (typeof fn !== 'function') return;
    window.addEventListener(EVENT, function (e) { fn(e.detail || get()); });
    window.addEventListener('storage', function (e) {
      if (e.key === KEY || e.key === OLD_KEY) fn(get());
    });
  }

  /* 把资料写进带 data-profile 标记的元素，全站共用，不改原有样式 */
  function apply(p) {
    p = p || get();
    var nodes = document.querySelectorAll('[data-profile]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], key = el.getAttribute('data-profile');
      if (key === 'avatar') {
        if (p.avatar) el.setAttribute('src', p.avatar);
      } else if (key === 'handle') {
        el.textContent = '@' + (p.handle || DEFAULT.handle);
      } else if (p[key]) {
        el.textContent = p[key];
      }
    }
  }

  var api = { get: get, set: set, reset: reset, subscribe: subscribe, apply: apply, DEFAULT: DEFAULT, EVENT: EVENT };
  window.DemoTuProfile = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(get()); });
  } else {
    apply(get());
  }
  subscribe(apply);
})();
