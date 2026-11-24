/* DemoTu.com 社区 · 本地存储版 Ins 社交功能
 * 发帖(文字+图片) / 点赞 / 评论 / 删除 / 资料编辑
 * 资料通过 profile.js 全站共享：社区改一次，首页 / 关于页 / 动态流全部同步。
 */
(function () {
  'use strict';
  var KEY = 'demotu-social-v1';
  var P = window.DemoTuProfile;
  var DEFAULT_AVATAR = 'assets/img/avatar.svg';

  function profile() { return P ? P.get() : { name: 'DemoTu.com', handle: 'demotu', bio: '', avatar: DEFAULT_AVATAR }; }
  function defaultAvatar() { return (P && P.DEFAULT.avatar) || DEFAULT_AVATAR; }

  function migrateProfile() {
    try {
      if (localStorage.getItem('demotu-profile-v1')) return;
      var old = JSON.parse(localStorage.getItem(KEY));
      if (old && old.profile && P) P.set(old.profile);
    } catch (e) {}
  }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d && Array.isArray(d.posts)) return { posts: d.posts };
    } catch (e) {}
    return { posts: seedPosts() };
  }
  function seedPosts() {
    return [
      { id: 'seed1', text: '今日份的小确幸：窗边的光刚好落在书页上。☀', image: 'assets/img/collab/angel-lamb.jpg', time: Date.now() - 86400000, likes: 12, liked: false, comments: [{ name: '小羊', text: '好治愈呀～', time: Date.now() - 86000000 }] },
      { id: 'seed2', text: '收到一束玫瑰，想把这份温柔也分给你。❀', image: 'assets/img/collab/rose-bunny.jpg', time: Date.now() - 172800000, likes: 28, liked: false, comments: [] }
    ];
  }
  migrateProfile();
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ posts: state.posts })); } catch (e) { toast('存储空间不足'); } }

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function timeAgo(ts) {
    var d = Date.now() - ts, m = Math.floor(d / 60000), h = Math.floor(m / 60), day = Math.floor(h / 24);
    if (m < 1) return '刚刚';
    if (m < 60) return m + ' 分钟前';
    if (h < 24) return h + ' 小时前';
    if (day < 30) return day + ' 天前';
    return new Date(ts).toLocaleDateString('zh-CN');
  }
  function toast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 渲染 ---------- */
  function renderProfile() {
    var p = profile();
    $('avatarImg').src = p.avatar || defaultAvatar();
    $('composeAvatar').src = p.avatar || defaultAvatar();
    $('profName').textContent = p.name || 'DemoTu.com';
    $('profBio').textContent = p.bio || '';
    $('statPosts').textContent = state.posts.length;
    $('statLikes').textContent = '5.2w';
    $('statFollow').textContent = '5.2w';
  }
  function renderFeed() {
    var feed = $('feed'), empty = $('feedEmpty');
    var posts = state.posts.slice().sort(function (a, b) { return b.time - a.time; });
    var p = profile();
    $('feedCount').textContent = '共 ' + posts.length + ' 条';
    if (!posts.length) { feed.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    feed.innerHTML = posts.map(function (post) {
      var mine = post.mine !== false; // 种子帖也允许删除，演示完整功能
      var comments = (post.comments || []);
      var media = post.image ? '<div class="post-image"><img src="' + esc(post.image) + '" alt="帖子图片" loading="lazy"></div>' : '';
      return '<article class="post-card glass-card" data-id="' + esc(post.id) + '">' +
        '<div class="post-head"><img class="post-avatar" src="' + esc(p.avatar || defaultAvatar()) + '" alt="">' +
        '<div class="post-meta"><b>' + esc(p.name) + '</b><small>' + timeAgo(post.time) + ' · @' + esc(p.handle || 'demotu') + '</small></div>' +
        (mine ? '<button class="post-del" data-act="del" title="删除">⋯</button>' : '') + '</div>' +
        (post.text ? '<p class="post-text">' + esc(post.text) + '</p>' : '') + media +
        '<div class="post-actions">' +
        '<button class="act-like' + (post.liked ? ' liked' : '') + '" data-act="like"><span>' + (post.liked ? '♥' : '♡') + '</span> ' + (post.likes || 0) + '</button>' +
        '<button data-act="comment"><span>💬</span> ' + comments.length + '</button>' +
        '<button data-act="share"><span>✉</span> 分享</button>' +
        '</div>' +
        (comments.length ? '<div class="post-comments">' + comments.slice(0, 2).map(function (c) {
          return '<p><b>' + esc(c.name) + '：</b>' + esc(c.text) + '</p>';
        }).join('') + (comments.length > 2 ? '<small>查看全部 ' + comments.length + ' 条评论</small>' : '') + '</div>' : '') +
        '</article>';
    }).join('');
  }
  function renderAll() { renderProfile(); renderFeed(); }

  /* ---------- 发帖 ---------- */
  var pendingImage = null;
  function updateCompose() {
    var text = $('composeText').value.trim();
    $('composeSubmit').disabled = !text && !pendingImage;
    $('composeHint').textContent = pendingImage ? '已添加 1 张图片' : '';
  }
  $('composeText').addEventListener('input', function () {
    this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 140) + 'px'; updateCompose();
  });
  $('composeImage').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    compressImage(f, 1400, 0.82, function (dataUrl) {
      pendingImage = dataUrl;
      $('composePreview').innerHTML = '<div class="preview-img"><img src="' + dataUrl + '" alt="预览"><button id="removeImg">×</button></div>';
      $('removeImg').onclick = function () { pendingImage = null; $('composePreview').innerHTML = ''; $('composeImage').value = ''; updateCompose(); };
      updateCompose();
    });
  });
  $('composeSubmit').addEventListener('click', function () {
    var text = $('composeText').value.trim();
    if (!text && !pendingImage) return;
    state.posts.push({ id: 'p' + Date.now(), text: text, image: pendingImage || '', time: Date.now(), likes: 0, liked: false, comments: [], mine: true });
    save();
    $('composeText').value = ''; $('composeText').style.height = 'auto';
    pendingImage = null; $('composePreview').innerHTML = ''; $('composeImage').value = '';
    updateCompose(); renderAll(); toast('发布成功 ❀');
  });

  /* ---------- 互动：点赞 / 评论 / 分享 / 删除 ---------- */
  $('feed').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]'); if (!btn) return;
    var card = btn.closest('.post-card'); if (!card) return;
    var id = card.getAttribute('data-id');
    var post = state.posts.find(function (p) { return p.id === id; }); if (!post) return;
    var act = btn.getAttribute('data-act');
    if (act === 'like') {
      post.liked = !post.liked; post.likes = (post.likes || 0) + (post.liked ? 1 : -1);
      save(); renderFeed(); renderProfile();
    } else if (act === 'del') {
      if (!confirm('确定删除这条动态吗？')) return;
      state.posts = state.posts.filter(function (p) { return p.id !== id; });
      save(); renderAll(); toast('已删除');
    } else if (act === 'comment') {
      openComments(id);
    } else if (act === 'share') {
      var p = profile();
      var msg = (p.name || 'DemoTu') + ' 的动态：' + (post.text || '分享了一张图片') + ' — ' + location.href;
      if (navigator.share) navigator.share({ title: 'DemoTu.com 社区', text: msg }).catch(function () {});
      else if (navigator.clipboard) { navigator.clipboard.writeText(msg); toast('链接已复制'); }
      else toast('分享：' + msg);
    }
  });

  /* ---------- 评论弹窗 ---------- */
  var currentCommentPost = null;
  function openComments(id) {
    currentCommentPost = id;
    var post = state.posts.find(function (p) { return p.id === id; }); if (!post) return;
    renderComments(post);
    $('commentModal').hidden = false;
    setTimeout(function () { $('commentInput').focus(); }, 50);
  }
  function renderComments(post) {
    var list = (post.comments || []);
    $('commentList').innerHTML = list.length ? list.map(function (c) {
      return '<div class="comment-item"><b>' + esc(c.name) + '</b><p>' + esc(c.text) + '</p><small>' + timeAgo(c.time) + '</small></div>';
    }).join('') : '<p class="no-comment">还没有评论，来说第一句吧～</p>';
  }
  function sendComment() {
    var input = $('commentInput'), text = input.value.trim(); if (!text || !currentCommentPost) return;
    var post = state.posts.find(function (p) { return p.id === currentCommentPost; }); if (!post) return;
    var p = profile();
    post.comments = post.comments || [];
    post.comments.push({ name: p.name || '我', text: text, time: Date.now() });
    input.value = ''; save(); renderComments(post); renderFeed(); toast('评论成功');
  }
  $('commentSend').addEventListener('click', sendComment);
  $('commentInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendComment(); });
  $('commentModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });

  /* ---------- 资料编辑：头像 / 昵称 / 账号 / 简介一处搞定 ---------- */
  var pendingAvatar = null;
  function updateCounts() {
    $('nameCount').textContent = $('editName').value.length + ' / 24';
    $('bioCount').textContent = $('editBio').value.length + ' / 100';
  }
  function openEdit() {
    var p = profile();
    pendingAvatar = null;
    $('editName').value = p.name || '';
    $('editHandle').value = p.handle || '';
    $('editBio').value = p.bio || '';
    $('editAvatarPreview').src = p.avatar || defaultAvatar();
    updateCounts();
    $('editModal').hidden = false;
    setTimeout(function () { $('editName').focus(); }, 60);
  }
  $('editProfileBtn').addEventListener('click', openEdit);
  $('avatarEdit').addEventListener('click', openEdit);
  $('editCancel').addEventListener('click', function () { $('editModal').hidden = true; });
  $('editModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
  $('editName').addEventListener('input', updateCounts);
  $('editBio').addEventListener('input', updateCounts);
  $('editSave').addEventListener('click', function () {
    var name = $('editName').value.trim() || 'DemoTu.com';
    var handle = $('editHandle').value.trim().replace(/^@/, '').replace(/\s+/g, '');
    if (!handle) handle = 'demotu';
    if (!/^[\w\u4e00-\u9fa5.-]+$/.test(handle)) { toast('账号只能包含中英文、数字、_ . -'); return; }
    var bio = $('editBio').value.trim();
    var patch = { name: name, handle: handle, bio: bio };
    if (pendingAvatar) patch.avatar = pendingAvatar;
    if (P) P.set(patch);
    save();
    $('editModal').hidden = true;
    renderAll();
    toast('资料已更新，全站已同步 ❀');
  });
  $('editAvatarReset').addEventListener('click', function () {
    pendingAvatar = defaultAvatar();
    $('editAvatarPreview').src = defaultAvatar();
    toast('已恢复默认头像，保存后生效');
  });
  $('editAvatarPick').addEventListener('click', function () { $('editAvatarInput').click(); });
  $('editAvatarInput').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function () { setupCrop(reader.result); };
    reader.readAsDataURL(f);
    this.value = '';
  });

  /* ---------- 头像智能裁剪：可缩放 + 可拖动，手机电脑通用 ---------- */
  var crop = { base: 1, zoom: 1, dx: 0, dy: 0, size: 260, ready: false, dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 };
  function setupCrop(src) {
    var img = $('cropImg');
    crop.ready = false;
    crop.zoom = 1; crop.dx = 0; crop.dy = 0;
    $('cropZoom').value = 1;
    img.onload = function () {
      var stage = $('cropStage').getBoundingClientRect();
      crop.size = Math.max(160, Math.min(stage.width, stage.height) || 260);
      crop.base = Math.max(crop.size / img.naturalWidth, crop.size / img.naturalHeight);
      crop.ready = true;
      renderCrop();
      $('cropModal').hidden = false;
    };
    img.src = src;
  }
  function renderCrop() {
    var img = $('cropImg'); if (!crop.ready) return;
    var w = img.naturalWidth * crop.base * crop.zoom;
    var h = img.naturalHeight * crop.base * crop.zoom;
    var limX = Math.max(0, (w - crop.size) / 2);
    var limY = Math.max(0, (h - crop.size) / 2);
    crop.dx = clamp(crop.dx, -limX, limX);
    crop.dy = clamp(crop.dy, -limY, limY);
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    img.style.transform = 'translate(calc(-50% + ' + crop.dx + 'px), calc(-50% + ' + crop.dy + 'px))';
  }
  $('cropZoom').addEventListener('input', function () { crop.zoom = parseFloat(this.value) || 1; renderCrop(); });
  var stageEl = $('cropStage');
  stageEl.addEventListener('pointerdown', function (e) {
    if (!crop.ready) return;
    crop.dragging = true; crop.sx = e.clientX; crop.sy = e.clientY; crop.ox = crop.dx; crop.oy = crop.dy;
    stageEl.setPointerCapture(e.pointerId); stageEl.classList.add('dragging');
  });
  stageEl.addEventListener('pointermove', function (e) {
    if (!crop.dragging) return;
    crop.dx = crop.ox + (e.clientX - crop.sx);
    crop.dy = crop.oy + (e.clientY - crop.sy);
    renderCrop();
  });
  ['pointerup', 'pointercancel'].forEach(function (evt) {
    stageEl.addEventListener(evt, function () { crop.dragging = false; stageEl.classList.remove('dragging'); });
  });
  $('cropCancel').addEventListener('click', function () { $('cropModal').hidden = true; });
  $('cropModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
  $('cropSave').addEventListener('click', function () {
    var img = $('cropImg'); if (!crop.ready) return;
    try {
      var scale = crop.base * crop.zoom;
      var side = crop.size / scale;
      var cx = img.naturalWidth / 2 - crop.dx / scale;
      var cy = img.naturalHeight / 2 - crop.dy / scale;
      var sx = clamp(cx - side / 2, 0, Math.max(0, img.naturalWidth - side));
      var sy = clamp(cy - side / 2, 0, Math.max(0, img.naturalHeight - side));
      var canvas = document.createElement('canvas'); canvas.width = canvas.height = 400;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, 400, 400);
      pendingAvatar = canvas.toDataURL('image/jpeg', 0.9);
      $('editAvatarPreview').src = pendingAvatar;
      $('cropModal').hidden = true;
      toast('头像已选好，保存资料后同步 ❀');
    } catch (err) { toast('图片处理失败，请换一张试试'); }
  });

  /* ---------- 图片压缩工具 ---------- */
  function compressImage(file, maxSize, quality, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) { var r = Math.min(maxSize / w, maxSize / h); w = Math.round(w * r); h = Math.round(h * r); }
        var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- 关闭所有弹窗（ESC） ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') ['editModal', 'cropModal', 'commentModal'].forEach(function (id) { $(id).hidden = true; });
  });

  /* 首页「编辑主页」跳到这里时自动打开编辑弹窗 */
  if (location.hash === '#edit') {
    setTimeout(function () {
      openEdit();
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }, 120);
  }

  if (P) P.subscribe(function () { renderAll(); });
  renderAll();
})();
