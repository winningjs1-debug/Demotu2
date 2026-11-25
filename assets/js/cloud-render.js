/* DemoTu.com 公开内容渲染层：把云端已发布内容套进现有美化组件。
 * 云端没有内容时保留站点默认静态内容，外观完全不变。 */
(function () {
  'use strict';

  var cloud = window.DemoTuCloud;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function img(row, fallback) {
    if (row.image_data) return esc(row.image_data);
    if (row.media_url && /^(https?:|data:image\/|assets\/|\.\/)/i.test(row.media_url)) return esc(row.media_url);
    return fallback || 'assets/img/posts/post-lace-01.jpg';
  }
  function meta(row) {
    try { return row.meta && typeof row.meta === 'object' ? row.meta : JSON.parse(row.meta || '{}'); }
    catch (e) { return {}; }
  }

  var TAB_BY_PAGE = {
    'index.html': 'profile', 'social.html': 'social', 'photowall.html': 'photo',
    'blog.html': 'blog', 'music.html': 'music', 'moments.html': 'moment'
  };

  function addAdminButton(tab) {
    if (!tab) return;
    var old = $('#cloudAdminEntry'); if (old) old.remove();
    var a = document.createElement('a');
    a.id = 'cloudAdminEntry';
    a.className = 'cloud-admin-entry';
    a.href = 'admin.html?tab=' + encodeURIComponent(tab);
    a.title = '进入本栏目后台';
    a.innerHTML = '<span>✦</span> 管理本栏目';
    document.body.appendChild(a);
  }

  function renderProfile(row) {
    if (!row) return;
    var m = meta(row), name = row.title || m.name;
    $$('[data-profile="name"]').forEach(function (el) { if (name) el.textContent = name; });
    $$('[data-profile="handle"]').forEach(function (el) { el.textContent = '@' + (m.handle || 'demotu'); });
    $$('[data-profile="bio"]').forEach(function (el) { if (m.bio || row.body) el.textContent = m.bio || row.body; });
    $$('[data-profile="avatar"]').forEach(function (el) { if (row.image_data) el.setAttribute('src', row.image_data); });
    if (Array.isArray(m.links)) {
      var box = $('[data-social-links]');
      if (box) {
        var html = m.links.map(function (x) {
          return '<a class="social-icon" href="' + esc(x.url || '#') + '" title="' + esc(x.label || '链接') +
            '" aria-label="' + esc(x.label || '链接') + '">' +
            (window.DemoTuSite && window.DemoTuSite.ICONS[x.icon]
              ? '<svg viewBox="0 0 24 24">' + window.DemoTuSite.ICONS[x.icon] + '</svg>'
              : '<span class="diy-ico">' + esc(String(x.icon || '链').slice(0, 2)) + '</span>') + '</a>';
        }).join('');
        if (m.reward && m.reward.label) {
          html += '<a class="ig-reward-link" href="' + esc(m.reward.url || '#') + '">' +
            esc((m.reward.emoji || '☕') + ' ' + m.reward.label) + '</a>';
        }
        box.innerHTML = html;
      }
    }
  }

  function renderHome(rows) {
    var pool = rows.filter(function (r) { return r.kind !== 'profile'; });
    if (!pool.length) return;
    var grid = $('#postGrid');
    if (!grid) return;
    var fallback = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];
    grid.innerHTML = pool.map(function (r, i) {
      var m = meta(r);
      var kind = ({ social: '动态', photo: '照片', blog: '文章', music: '音乐', moment: '说说' })[r.kind] || '记录';
      var date = m.date || m.time || '';
      return '<a class="ig-post searchable reveal" href="' +
        (r.kind === 'social' ? 'social.html' : r.kind === 'photo' ? 'photowall.html' : r.kind === 'music' ? 'music.html' : r.kind === 'moment' ? 'moments.html' : 'blog.html') +
        '" data-title="' + esc(r.title || r.body || '') + '" data-desc="' + esc(date) + '" data-tags="' + esc(kind) + '">' +
        '<img src="' + img(r, 'assets/img/posts/post-lace-' + fallback[i % 9] + '.jpg') + '" alt="' + esc(r.title || '我的记录') + '" loading="lazy">' +
        '<span class="ig-post-kind">' + kind + '</span>' +
        '<div class="ig-post-hover"><span>&#10084; 0</span><span>&#128172; 0</span></div></a>';
    }).join('');
  }

  function renderPhotos(rows) {
    var box = $('.photo-grid'); if (!box || !rows.length) return;
    box.innerHTML = rows.map(function (r) {
      var m = meta(r);
      return '<figure class="photo-card reveal"><img src="' + img(r) + '" alt="' + esc(r.title || '照片') + '">' +
        '<div class="shade"></div><figcaption>' + esc(r.title || '照片') + '<small>' + esc(m.place || '') + '</small></figcaption></figure>';
    }).join('');
  }

  function renderBlog(rows) {
    var box = $('.moment-grid'); if (!box || !rows.length) return;
    box.innerHTML = rows.map(function (r) {
      var m = meta(r);
      return '<article class="glass-card content-card reveal"><div class="mini-label">Records · ' + esc(m.date || '') + '</div>' +
        '<h3 style="margin-top:14px">' + esc(r.title || '') + '</h3><p>' + esc(r.body || m.description || '') + '</p>' +
        '<div class="card-date" style="color:var(--text-faint)">' + esc((m.tags || []).join(' · ')) + '</div></article>';
    }).join('');
  }

  function renderMusic(rows) {
    var list = $('.track-list'); if (!list || !rows.length) return;
    list.innerHTML = rows.map(function (r, i) {
      var m = meta(r);
      return '<div class="track ' + (i === 0 ? 'active' : '') + '" data-title="' + esc(r.title || '') +
        '" data-artist="' + esc(m.artist || '') + '"><span class="track-emoji">' + esc(m.emoji || '🎵') + '</span>' +
        '<div><div class="track-title">' + esc(r.title || '') + '</div><div class="track-artist">' + esc(m.artist || '') + '</div></div>' +
        '<span class="track-duration">' + esc(m.duration || '') + '</span></div>';
    }).join('');
    var first = rows[0], fm = meta(first);
    var ct = $('#currentTitle'), ca = $('#currentArtist'), cover = $('.music-cover');
    if (ct) ct.textContent = first.title || '';
    if (ca) ca.textContent = (fm.artist || '') + ' · 正在播放';
    if (cover) cover.textContent = fm.emoji || '🎵';
    $$('.track', list).forEach(function (t) {
      t.addEventListener('click', function () {
        $$('.track', list).forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        if (ct) ct.textContent = t.getAttribute('data-title') || '';
        if (ca) ca.textContent = (t.getAttribute('data-artist') || '') + ' · 正在播放';
      });
    });
  }

  function renderMoments(rows) {
    var box = $('.moment-grid'); if (!box || !rows.length) return;
    box.innerHTML = rows.map(function (r) {
      var m = meta(r);
      return '<div class="glass-card moment-card reveal"><span class="emoji">' + esc(m.emoji || '✨') + '</span>' +
        '<div><p>' + esc(r.body || r.title || '') + '</p><time>' + esc(m.time || '') + '</time></div></div>';
    }).join('');
  }

  function renderSocial(rows) {
    var feed = $('#feed'); if (!feed) return;
    var compose = $('.soc-compose'), editBtn = $('#editProfileBtn');
    if (compose) compose.hidden = true;
    if (editBtn) editBtn.hidden = true;
    if (!rows.length) return;
    feed.innerHTML = rows.map(function (r) {
      var m = meta(r);
      var prof = window.DemoTuProfile ? window.DemoTuProfile.get() : {};
      return '<article class="post-card glass-card"><div class="post-head">' +
        '<img class="post-avatar" src="' + esc(prof.avatar || 'assets/img/avatar.svg') + '" alt="">' +
        '<div class="post-meta"><b>' + esc(prof.name || 'DemoTu.com') + '</b>' +
        '<small>' + esc(m.time || '') + '</small></div></div>' +
        (r.body ? '<p class="post-text">' + esc(r.body) + '</p>' : '') +
        (r.image_data ? '<div class="post-image"><img src="' + esc(r.image_data) + '" alt="动态图片"></div>' : '') +
        '</article>';
    }).join('');
    var cnt = $('#feedCount'); if (cnt) cnt.textContent = '共 ' + rows.length + ' 条';
    var empty = $('#feedEmpty'); if (empty) empty.hidden = true;
  }

  function pathName() {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }

  async function boot() {
    if (!cloud || !cloud.available) return;
    var page = pathName();
    var tab = TAB_BY_PAGE[page];
    if (cloud.isOwner) {
      var owner = await cloud.isOwner();
      if (owner) addAdminButton(tab || 'profile');
    }
    var rows = [];
    try { rows = await cloud.all(); } catch (e) { return; }
    if (!rows.length) return;
    var by = function (k) { return rows.filter(function (r) { return r.kind === k; }); };
    var profile = by('profile')[0];
    if (profile) renderProfile(profile);
    if (page === 'index.html') renderHome(rows);
    if (page === 'photowall.html') renderPhotos(by('photo'));
    if (page === 'blog.html' || page === 'chatter.html') renderBlog(by('blog'));
    if (page === 'music.html') renderMusic(by('music'));
    if (page === 'moments.html') renderMoments(by('moment'));
    if (page === 'social.html') renderSocial(by('social'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
