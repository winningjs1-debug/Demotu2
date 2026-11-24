/* DemoTu.com 社区 · 本地存储版 Ins 社交功能
 * 头像上传裁剪 / 资料编辑 / 发帖(文字+图片) / 点赞 / 评论 / 删除
 * 数据存 localStorage，刷新不丢，三端可运行。 */
(function () {
  'use strict';
  var KEY = 'demotu-social-v1';
  var DEFAULT_AVATAR = 'assets/img/avatar.svg';

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d === 'object') return d;
    } catch (e) {}
    return { profile: { name: 'DemoTu.com', bio: '把每一天的小确幸，写成手账里的一页。', avatar: DEFAULT_AVATAR }, posts: seedPosts() };
  }
  function seedPosts() {
    return [
      { id: 'seed1', text: '今日份的小确幸：窗边的光刚好落在书页上。☀', image: 'assets/img/collab/angel-lamb.jpg', time: Date.now() - 86400000, likes: 12, liked: false, comments: [{ name: '小羊', text: '好治愈呀～', time: Date.now() - 86000000 }] },
      { id: 'seed2', text: '收到一束玫瑰，想把这份温柔也分给你。❀', image: 'assets/img/collab/rose-bunny.jpg', time: Date.now() - 172800000, likes: 28, liked: false, comments: [] }
    ];
  }
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('存储空间不足'); } }

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
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
    var p = state.profile;
    $('avatarImg').src = p.avatar || DEFAULT_AVATAR;
    $('composeAvatar').src = p.avatar || DEFAULT_AVATAR;
    $('profName').textContent = p.name || 'DemoTu.com';
    $('profBio').textContent = p.bio || '';
    $('statPosts').textContent = state.posts.length;
    var likes = state.posts.reduce(function (n, x) { return n + (x.likes || 0); }, 0);
    $('statLikes').textContent = likes;
    $('statFollow').textContent = 128 + state.posts.length;
  }
  function renderFeed() {
    var feed = $('feed'), empty = $('feedEmpty');
    var posts = state.posts.slice().sort(function (a, b) { return b.time - a.time; });
    $('feedCount').textContent = '共 ' + posts.length + ' 条';
    if (!posts.length) { feed.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    feed.innerHTML = posts.map(function (post) {
      var mine = post.mine !== false; // 种子帖也允许删除，演示完整功能
      var comments = (post.comments || []);
      var media = post.image ? '<div class="post-image"><img src="' + esc(post.image) + '" alt="帖子图片" loading="lazy"></div>' : '';
      return '<article class="post-card glass-card" data-id="' + esc(post.id) + '">' +
        '<div class="post-head"><img class="post-avatar" src="' + esc(state.profile.avatar || DEFAULT_AVATAR) + '" alt="">' +
        '<div class="post-meta"><b>' + esc(state.profile.name) + '</b><small>' + timeAgo(post.time) + ' · @demotu</small></div>' +
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
      var msg = (state.profile.name || 'DemoTu') + ' 的动态：' + (post.text || '分享了一张图片') + ' — ' + location.href;
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
    $('commentList').innerHTML = list.length ? list.map(function (c, i) {
      return '<div class="comment-item"><b>' + esc(c.name) + '</b><p>' + esc(c.text) + '</p><small>' + timeAgo(c.time) + '</small></div>';
    }).join('') : '<p class="no-comment">还没有评论，来说第一句吧～</p>';
  }
  function sendComment() {
    var input = $('commentInput'), text = input.value.trim(); if (!text || !currentCommentPost) return;
    var post = state.posts.find(function (p) { return p.id === currentCommentPost; }); if (!post) return;
    post.comments = post.comments || [];
    post.comments.push({ name: state.profile.name || '我', text: text, time: Date.now() });
    input.value = ''; save(); renderComments(post); renderFeed(); toast('评论成功');
  }
  $('commentSend').addEventListener('click', sendComment);
  $('commentInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendComment(); });
  $('commentModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });

  /* ---------- 资料编辑 ---------- */
  $('editProfileBtn').addEventListener('click', function () {
    $('editName').value = state.profile.name || '';
    $('editBio').value = state.profile.bio || '';
    $('editModal').hidden = false;
  });
  $('editCancel').addEventListener('click', function () { $('editModal').hidden = true; });
  $('editModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
  $('editSave').addEventListener('click', function () {
    state.profile.name = $('editName').value.trim() || 'DemoTu.com';
    state.profile.bio = $('editBio').value.trim();
    save(); renderAll(); $('editModal').hidden = true; toast('资料已更新');
  });

  /* ---------- 头像上传 + 简单方形裁剪 ---------- */
  $('avatarEdit').addEventListener('click', function () { $('avatarInput').click(); });
  $('avatarInput').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      $('cropImg').src = reader.result;
      $('cropModal').hidden = false;
    };
    reader.readAsDataURL(f);
  });
  $('cropCancel').addEventListener('click', function () { $('cropModal').hidden = true; });
  $('cropModal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
  $('cropSave').addEventListener('click', function () {
    var img = $('cropImg');
    try {
      var size = Math.min(img.naturalWidth, img.naturalHeight);
      var sx = (img.naturalWidth - size) / 2, sy = (img.naturalHeight - size) / 2;
      var canvas = document.createElement('canvas'); canvas.width = canvas.height = 320;
      canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, 320, 320);
      state.profile.avatar = canvas.toDataURL('image/jpeg', 0.86);
      save(); renderAll(); $('cropModal').hidden = true; toast('头像已更新');
    } catch (err) { toast('图片处理失败'); }
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

  renderAll();
})();
