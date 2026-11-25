/* DemoTu.com 号主后台：邮箱验证码登录 + 云端发布内容管理 */
(function () {
  'use strict';

  var cloud = window.DemoTuCloud;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  var toastTimer;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }
  function errMsg(e) { return (e && (e.message || e.error_description)) ? (e.message || e.error_description) : '操作失败，请重试'; }

  var pending = null, sessUser = null, owner = false, allRows = [], editing = {};

  function show(view) {
    ['loginView', 'bindView', 'dashView'].forEach(function (id) { $('#' + id).hidden = true; });
    $('#' + view).hidden = false;
  }

  async function checkAuth() {
    if (!cloud || !cloud.available) {
      $('#loginError').textContent = '云服务未加载，请刷新页面重试';
      return;
    }
    try {
      var res = await cloud.session();
      if (res.error) { $('#loginError').textContent = errMsg(res.error); return; }
      if (res.data && res.data.user) {
        sessUser = res.data.user;
        owner = await cloud.isOwner();
        if (owner) { show('dashView'); await loadAll(); }
        else {
          $('#whoEmail').textContent = sessUser.email || sessUser.name || '已登录账号';
          show('bindView');
        }
      } else show('loginView');
    } catch (e) {
      $('#loginError').textContent = errMsg(e);
    }
  }

  $('#sendCodeBtn').addEventListener('click', async function () {
    var email = $('#loginEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('请输入正确的邮箱地址');
    var btn = this; btn.disabled = true; btn.textContent = '发送中…';
    var res = await cloud.signIn(email);
    btn.disabled = false; btn.textContent = '获取验证码';
    if (res.error) { $('#loginError').textContent = errMsg(res.error); return; }
    pending = { email: email, verificationId: res.data.verificationId, isExistingUser: res.data.isExistingUser };
    $('#loginError').textContent = '';
    toast('验证码已发送到邮箱，请查收');
  });

  $('#loginBtn').addEventListener('click', async function () {
    var email = $('#loginEmail').value.trim(), code = $('#loginCode').value.trim();
    if (!pending || pending.email !== email) return toast('请先获取当前邮箱的验证码');
    if (!code) return toast('请输入验证码');
    var res = await cloud.verify(email, pending.verificationId, pending.isExistingUser, code);
    if (res.error) { $('#loginError').textContent = errMsg(res.error); return; }
    sessUser = res.data.user;
    // verify 返回对象可能不带 email，用 session 里的用户补全，确保绑定时能写入邮箱。
    try {
      var s = await cloud.session();
      if (s.data && s.data.user) {
        sessUser = Object.assign({}, s.data.user, sessUser);
        if (!sessUser.email && s.data.user.email) sessUser.email = s.data.user.email;
      }
    } catch (e) {}
    pending = null;
    owner = await cloud.isOwner();
    if (owner) { show('dashView'); await loadAll(); }
    else {
      $('#whoEmail').textContent = sessUser.email || sessUser.name || '已登录账号';
      show('bindView');
    }
  });

  $('#bindBtn').addEventListener('click', async function () {
    var btn = this;
    $('#bindError').textContent = '';
    btn.disabled = true; btn.textContent = '绑定中…';
    try {
      var res = await cloud.bindOwner(sessUser && sessUser.email ? sessUser.email : null);
      if (res.error) { $('#bindError').textContent = errMsg(res.error); return; }
      var ok = await cloud.isOwner();
      if (!ok) { $('#bindError').textContent = '绑定已提交，但身份校验未通过，请刷新页面重试'; return; }
      owner = true; show('dashView'); await loadAll(); toast('号主身份已绑定');
    } catch (e) {
      $('#bindError').textContent = errMsg(e);
    } finally {
      btn.disabled = false; btn.textContent = '绑定为号主';
    }
  });
  async function logout() { await cloud.signOut(); location.reload(); }
  $('#logoutBtn').addEventListener('click', logout);
  $('#bindLogoutBtn').addEventListener('click', logout);

  /* ---------- 标签 ---------- */
  $$('#adminTabs .admin-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });
  function switchTab(tab) {
    $$('#adminTabs .admin-tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    $$('.admin-panel').forEach(function (p) { p.hidden = true; });
    var panel = $('#panel-' + tab); if (panel) panel.hidden = false;
    var u = new URL(location.href); u.searchParams.set('tab', tab);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }

  async function loadAll() {
    allRows = await cloud.all();
    renderProfilePanel();
    ['social', 'photo', 'blog', 'music', 'moment'].forEach(renderContentPanel);
    $('#cloudNotice').innerHTML = '<b>云端发布已连接</b><p>共 ' + allRows.length +
      ' 条已发布内容。你在这里发布后，所有访客打开主页都会看到同一份内容；草稿只有你能看到。</p>';
    var q = new URL(location.href).searchParams.get('tab');
    switchTab(q || 'profile');
  }

  function compress(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h);
        var scale = Math.min(1, maxSide / side), size = Math.max(1, Math.round(side * scale));
        var c = document.createElement('canvas'); c.width = c.height = size;
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', quality || 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  }

  /* ---------- 资料与链接 ---------- */
  function renderProfilePanel() {
    var row = allRows.filter(function (r) { return r.kind === 'profile'; })[0] || {};
    var m = row.meta || {};
    var links = Array.isArray(m.links) && m.links.length ? m.links : (window.SITE_CONFIG.socials || []);
    var panel = $('#panel-profile');
    panel.innerHTML = '<div class="panel-title"><h2>个人资料与主页链接</h2>' +
      '<p>这里发布后，首页、社区、关于页同步显示；访客不能修改。</p></div>' +
      '<div class="card"><div class="form-grid">' +
      '<label>昵称<input type="text" id="pfName" maxlength="24" value="' + esc(row.title || 'DemoTu.com') + '"></label>' +
      '<label>账号（@后）<input type="text" id="pfHandle" maxlength="24" value="' + esc(m.handle || 'demotu') + '"></label>' +
      '<label class="full">简介<textarea id="pfBio" rows="3" maxlength="200">' + esc(row.body || m.bio || '') + '</textarea></label>' +
      '<label class="full">头像<input type="file" id="pfAvatar" accept="image/*"></label>' +
      (row.image_data ? '<div class="avatar-preview"><img src="' + esc(row.image_data) + '" alt="当前头像"></div>' : '') +
      '<label class="full">主页链接（JSON 数组）<textarea id="pfLinks" rows="6">' + esc(JSON.stringify(links, null, 2)) + '</textarea></label>' +
      '</div><div class="card-actions"><button class="btn btn-primary" id="pfSave">发布资料</button></div></div>';

    $('#pfSave').addEventListener('click', async function () {
      var parsed;
      try { parsed = JSON.parse($('#pfLinks').value); if (!Array.isArray(parsed)) throw new Error(); }
      catch (e) { return toast('链接格式不正确，需要是 JSON 数组'); }
      var f = $('#pfAvatar').files && $('#pfAvatar').files[0];
      var payload = {
        id: row.id, kind: 'profile', status: 'published',
        title: $('#pfName').value.trim() || 'DemoTu.com',
        body: $('#pfBio').value.trim(),
        meta: { handle: $('#pfHandle').value.trim() || 'demotu', links: parsed, reward: m.reward || { label: '赞赏我', url: 'about.html', emoji: '☕' } },
        sort_order: 0
      };
      if (f) payload.image_data = await compress(f, 360, 0.86);
      else if (row.image_data) payload.image_data = row.image_data;
      var res = await cloud.save(payload);
      toast(res.error ? errMsg(res.error) : '资料已发布，全站同步');
      if (!res.error) await loadAll();
    });
  }

  /* ---------- 内容栏目 ---------- */
  var FIELDS = {
    social: [
      { k: 'body', label: '动态内容', type: 'textarea', ph: '分享此刻的心情…' },
      { k: 'image', label: '配图（可选）', type: 'file' }
    ],
    photo: [
      { k: 'title', label: '照片标题', type: 'text' },
      { k: 'place', label: '地点 / 备注', type: 'text', meta: true },
      { k: 'image', label: '照片文件', type: 'file' }
    ],
    blog: [
      { k: 'title', label: '文章标题', type: 'text' },
      { k: 'body', label: '摘要 / 正文', type: 'textarea' },
      { k: 'date', label: '日期', type: 'text', meta: true, ph: '2026-11-25' },
      { k: 'tags', label: '标签', type: 'text', meta: true, ph: '生活, 随笔' },
      { k: 'image', label: '封面图（可选）', type: 'file' }
    ],
    music: [
      { k: 'title', label: '歌曲名', type: 'text' },
      { k: 'artist', label: '歌手', type: 'text', meta: true },
      { k: 'duration', label: '时长', type: 'text', meta: true, ph: '04:32' },
      { k: 'emoji', label: 'Emoji 图标', type: 'text', meta: true, ph: '🎵' },
      { k: 'media_url', label: '音频/图片网址（可选）', type: 'text' }
    ],
    moment: [
      { k: 'body', label: '说说内容', type: 'textarea' },
      { k: 'emoji', label: 'Emoji 图标', type: 'text', meta: true, ph: '✨' },
      { k: 'time', label: '时间备注', type: 'text', meta: true, ph: '今天' }
    ]
  };
  var NAMES = { social: '社区动态', photo: '照片', blog: '博客文章', music: '音乐', moment: '说说' };

  function fieldHtml(f, value) {
    var id = 'f-' + f.k, val = value === undefined || value === null ? '' : value;
    if (f.type === 'textarea') return '<label class="full">' + f.label + '<textarea id="' + id + '" rows="3" placeholder="' + esc(f.ph || '') + '">' + esc(val) + '</textarea></label>';
    if (f.type === 'file') return '<label class="full">' + f.label + '<input type="file" id="' + id + '" accept="image/*"></label>';
    return '<label>' + f.label + '<input type="text" id="' + id + '" value="' + esc(val) + '" placeholder="' + esc(f.ph || '') + '"></label>';
  }

  function renderContentPanel(kind) {
    var rows = allRows.filter(function (r) { return r.kind === kind; });
    var panel = $('#panel-' + kind);
    var form = '<div class="card"><div class="panel-title small"><h2>发布新' + NAMES[kind] + '</h2><p>发布后所有访客可见；选择草稿则只有你能看到。</p></div>' +
      '<div class="form-grid">' + FIELDS[kind].map(function (f) { return fieldHtml(f, ''); }).join('') +
      '<label>排序<input type="number" id="f-sort" value="0"></label>' +
      '<label>状态<select id="f-status"><option value="published">立即发布</option><option value="draft">存为草稿</option></select></label>' +
      '</div><div class="card-actions"><button class="btn btn-ghost" id="f-reset" hidden>取消编辑</button>' +
      '<button class="btn btn-primary" id="f-save">发布 / 保存</button></div></div>';
    var list = '<div class="card"><div class="panel-title small"><h2>已发布与草稿</h2><p>共 ' + rows.length + ' 条。</p></div><div class="item-list">' +
      (rows.length ? rows.map(function (r) {
        var m = r.meta || {};
        var preview = r.title || (r.body || '').slice(0, 40) || '（无标题）';
        return '<div class="item-card" data-id="' + r.id + '">' +
          (r.image_data ? '<img src="' + esc(r.image_data) + '" alt="">' : '') +
          '<div class="item-info"><b>' + esc(preview) + '</b><small>' +
          esc(r.status === 'draft' ? '草稿' : (m.date || m.time || m.artist || '')) + '</small></div>' +
          '<div class="item-actions"><button class="mini edit">编辑</button><button class="mini del">删除</button></div></div>';
      }).join('') : '<p class="gallery-empty">还没有内容，先在上方发布一条吧。</p>') + '</div></div>';
    panel.innerHTML = '<div class="panel-title"><h2>' + NAMES[kind] + '</h2><p>这个栏目独立管理，发布后三端同步显示。</p></div>' + form + list;

    editing[kind] = null;
    $('#f-save', panel).addEventListener('click', async function () { await saveContent(kind); });
    $('#f-reset', panel).addEventListener('click', function () { renderContentPanel(kind); });
    $$('.item-card', panel).forEach(function (item) {
      var id = Number(item.dataset.id), row = rows.filter(function (x) { return x.id === id; })[0];
      $('.edit', item).addEventListener('click', function () {
        var m = row.meta || {};
        FIELDS[kind].forEach(function (f) {
          var el = $('#f-' + f.k, panel);
          if (!el || f.type === 'file') return;
          var v = f.meta ? m[f.k] : (f.k === 'body' || f.k === 'title' ? row[f.k] : row[f.k]);
          if (f.k === 'tags' && Array.isArray(v)) v = v.join(', ');
          el.value = v === undefined || v === null ? '' : v;
        });
        $('#f-sort', panel).value = row.sort_order || 0;
        $('#f-status', panel).value = row.status || 'published';
        editing[kind] = row;
        $('#f-reset', panel).hidden = false;
        $('#f-save', panel).textContent = '保存修改';
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      $('.del', item).addEventListener('click', async function () {
        if (!confirm('确定删除这条内容吗？删除后访客也看不到了。')) return;
        var res = await cloud.remove(id);
        toast(res.error ? errMsg(res.error) : '已删除');
        if (!res.error) await loadAll();
      });
    });
  }

  async function saveContent(kind) {
    var panel = $('#panel-' + kind), row = editing[kind] || {}, m = Object.assign({}, row.meta || {});
    var payload = {
      id: row.id, kind: kind,
      status: $('#f-status', panel).value,
      sort_order: Number($('#f-sort', panel).value || 0),
      title: null, body: null, media_url: null, image_data: row.image_data || null, meta: m
    };
    for (var i = 0; i < FIELDS[kind].length; i++) {
      var f = FIELDS[kind][i], el = $('#f-' + f.k, panel);
      if (!el) continue;
      if (f.type === 'file') {
        if (el.files && el.files[0]) payload.image_data = await compress(el.files[0], 900, 0.82);
        continue;
      }
      var v = el.value.trim();
      if (f.meta) {
        if (f.k === 'tags') m[f.k] = v ? v.split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean) : [];
        else m[f.k] = v;
      } else if (f.k === 'media_url') payload.media_url = v || null;
      else payload[f.k] = v || null;
    }
    payload.meta = m;
    var res = await cloud.save(payload);
    toast(res.error ? errMsg(res.error) : (payload.status === 'draft' ? '草稿已保存' : '已发布，访客可见'));
    if (!res.error) { editing[kind] = null; await loadAll(); }
  }

  checkAuth();
})();
