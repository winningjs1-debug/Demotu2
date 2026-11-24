/* DemoTu.com 后台配置共享层
 * 负责：首页社交链接、九宫格自定义封面、上传图片库。
 * 所有数据保存在本机 localStorage，全站页面自动读取；未配置时保留原有静态内容。 */
(function () {
  'use strict';

  var LINKS_KEY = 'demotu-links-v1';
  var COVERS_KEY = 'demotu-covers-v1';
  var GALLERY_KEY = 'demotu-gallery-v1';
  var EVENT = 'demotu:site-data';

  var ICONS = {
    github: '<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>',
    gitee: '<path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482c0-.326.266-.592.592-.592h6.81c.328 0 .593.266.593.592v3.408a4.74 4.74 0 0 1-4.741 4.74H7.11A4.74 4.74 0 0 1 2.37 14.81V9.186a4.74 4.741 0 0 1 4.74-4.741h10.963v.888z"/>',
    email: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>',
    qq: '<path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z"/>',
    wechat: '<path d="M8.5 13.5c-3.59 0-6.5-2.42-6.5-5.4 0-2.98 2.91-5.4 6.5-5.4s6.5 2.42 6.5 5.4c0 2.98-2.91 5.4-6.5 5.4zm7.5 7.8c-2.76 0-5-2.02-5-4.5 0-2.48 2.24-4.5 5-4.5s5 2.02 5 4.5c0 2.48-2.24 4.5-5 4.5z"/>',
    rss: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    link: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    camera: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm8 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"/>',
    music: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" fill="none" d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>',
    heart: '<path d="M12 21s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 3.5C20 16.2 12 21 12 21z"/>'
  };
  var FILLED = { github: 1, gitee: 1, qq: 1, wechat: 1, heart: 1 };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var val = JSON.parse(raw);
      return val === null ? fallback : val;
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function notify() {
    try { window.dispatchEvent(new CustomEvent(EVENT)); }
    catch (e) { window.dispatchEvent(new Event(EVENT)); }
  }

  function defaults() {
    var links = [];
    var box = document.querySelector('[data-social-links]');
    if (box) {
      var anchors = box.querySelectorAll('a.social-icon');
      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        links.push({
          icon: a.getAttribute('data-icon') || 'link',
          label: a.getAttribute('title') || a.getAttribute('aria-label') || '链接',
          url: a.getAttribute('href') || '#'
        });
      }
    } else if (window.SITE_CONFIG && window.SITE_CONFIG.socials) {
      links = window.SITE_CONFIG.socials.map(function (x) {
        return { icon: x.icon || 'link', label: x.label || '链接', url: x.url || '#' };
      });
    }
    var rewardEl = document.querySelector('.ig-reward-link');
    var reward = {
      label: rewardEl ? rewardEl.textContent.trim() : '☕ 赞赏我',
      url: rewardEl ? rewardEl.getAttribute('href') : 'about.html',
      emoji: '☕'
    };
    return { links: links, reward: reward };
  }

  function getLinks() {
    var saved = read(LINKS_KEY, null);
    if (!saved || !Array.isArray(saved.links)) return defaults();
    return {
      links: saved.links.map(function (x) {
        return {
          icon: String(x.icon || 'link'),
          label: String(x.label || '链接'),
          url: String(x.url || '#')
        };
      }),
      reward: {
        label: String((saved.reward && saved.reward.label) || '☕ 赞赏我'),
        url: String((saved.reward && saved.reward.url) || 'about.html'),
        emoji: String((saved.reward && saved.reward.emoji) || '☕')
      }
    };
  }

  function setLinks(data) {
    var next = {
      links: (data && Array.isArray(data.links) ? data.links : []).map(function (x) {
        return {
          icon: String(x.icon || 'link'),
          label: String(x.label || '链接').slice(0, 24),
          url: String(x.url || '#').slice(0, 400)
        };
      }),
      reward: {
        label: String((data.reward && data.reward.label) || '☕ 赞赏我').slice(0, 24),
        url: String((data.reward && data.reward.url) || 'about.html').slice(0, 400),
        emoji: String((data.reward && data.reward.emoji) || '☕').slice(0, 4)
      }
    };
    if (!write(LINKS_KEY, next)) return false;
    applyLinks(); notify(); return true;
  }

  function iconHtml(name) {
    var key = String(name || 'link');
    if (ICONS[key]) {
      return '<svg ' + (FILLED[key] ? '' : 'stroke="currentColor" fill="none"') +
        ' viewBox="0 0 24 24" aria-hidden="true">' + ICONS[key] + '</svg>';
    }
    return '<span class="diy-ico">' + esc(key.slice(0, 2)) + '</span>';
  }

  function applyLinks() {
    var box = document.querySelector('[data-social-links]');
    if (!box) return;
    var data = getLinks();
    var html = data.links.map(function (x) {
      return '<a class="social-icon" href="' + esc(x.url) + '" title="' + esc(x.label) +
        '" aria-label="' + esc(x.label) + '">' + iconHtml(x.icon) + '</a>';
    }).join('');
    if (data.reward && data.reward.label) {
      html += '<a class="ig-reward-link" href="' + esc(data.reward.url) + '">' +
        esc(data.reward.emoji + ' ' + data.reward.label.replace(/^☕\s*/, '')) + '</a>';
    }
    box.innerHTML = html;
  }

  function getCovers() { return read(COVERS_KEY, {}); }

  function setCover(index, dataUrl) {
    var covers = getCovers();
    var key = String(index);
    if (dataUrl) covers[key] = String(dataUrl);
    else delete covers[key];
    if (!write(COVERS_KEY, covers)) return false;
    applyCovers(); notify(); return true;
  }

  function clearCovers() {
    if (!write(COVERS_KEY, {})) return false;
    applyCovers(); notify(); return true;
  }

  function applyCovers() {
    var covers = getCovers();
    var imgs = document.querySelectorAll('.ig-post img[data-post-index]');
    for (var i = 0; i < imgs.length; i++) {
      var el = imgs[i], src = covers[el.getAttribute('data-post-index')];
      if (src) el.setAttribute('src', src);
    }
  }

  function getGallery() {
    var arr = read(GALLERY_KEY, []);
    return Array.isArray(arr) ? arr : [];
  }

  function addGallery(items) {
    var list = getGallery();
    var stamp = Date.now();
    items.forEach(function (item, i) {
      list.unshift({
        id: 'img-' + stamp + '-' + i,
        title: item.title || ('我的图片 ' + (list.length + 1)),
        data: String(item.data || ''),
        time: stamp
      });
    });
    if (!write(GALLERY_KEY, list.slice(0, 60))) return false;
    notify(); return true;
  }

  function removeGallery(id) {
    var list = getGallery().filter(function (x) { return x.id !== id; });
    if (!write(GALLERY_KEY, list)) return false;
    notify(); return true;
  }

  function renameGallery(id, title) {
    var list = getGallery();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) list[i].title = String(title || '').slice(0, 40);
    }
    if (!write(GALLERY_KEY, list)) return false;
    notify(); return true;
  }

  function exportData() {
    var out = { version: 1, links: getLinks(), covers: getCovers(), gallery: getGallery() };
    try {
      if (window.DemoTuProfile) out.profile = window.DemoTuProfile.get();
    } catch (e) {}
    return JSON.stringify(out);
  }

  function importData(raw) {
    var obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object') throw new Error('数据格式不正确');
    var ok = true;
    if (obj.links) ok = setLinks(obj.links) && ok;
    if (obj.covers) {
      ok = write(COVERS_KEY, obj.covers) && ok;
      applyCovers();
    }
    if (Array.isArray(obj.gallery)) {
      ok = write(GALLERY_KEY, obj.gallery.slice(0, 60)) && ok;
    }
    if (obj.profile && window.DemoTuProfile) window.DemoTuProfile.set(obj.profile);
    notify();
    return ok;
  }

  function resetAll() {
    try {
      localStorage.removeItem(LINKS_KEY);
      localStorage.removeItem(COVERS_KEY);
      localStorage.removeItem(GALLERY_KEY);
    } catch (e) {}
    applyLinks(); applyCovers(); notify();
  }

  var api = {
    ICONS: ICONS, getLinks: getLinks, setLinks: setLinks,
    getCovers: getCovers, setCover: setCover, clearCovers: clearCovers,
    getGallery: getGallery, addGallery: addGallery, removeGallery: removeGallery,
    renameGallery: renameGallery,
    exportData: exportData, importData: importData, resetAll: resetAll,
    apply: function () { applyLinks(); applyCovers(); },
    EVENT: EVENT
  };
  window.DemoTuSite = api;

  function boot() {
    applyLinks(); applyCovers();
    window.addEventListener(EVENT, function () { applyLinks(); applyCovers(); });
    window.addEventListener('storage', function (e) {
      if (e.key === LINKS_KEY || e.key === COVERS_KEY || e.key === GALLERY_KEY) {
        applyLinks(); applyCovers();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
