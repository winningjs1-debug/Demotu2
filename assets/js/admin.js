/* DemoTu.com 主页后台交互 */
(function () {
  'use strict';

  var PASS_KEY = 'demotu-admin-pass-v1';
  var SESSION_KEY = 'demotu-admin-auth';
  var DEFAULT_PASS = 'demotu2026';
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var site = window.DemoTuSite;
  var profileApi = window.DemoTuProfile;

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function hashPass(p) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(p)).then(function (buf) {
        return 'sha:' + Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      });
    }
    var h = 5381;
    for (var i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0;
    return Promise.resolve('fb:' + h);
  }

  function ensurePass() {
    if (!localStorage.getItem(PASS_KEY)) {
      hashPass(DEFAULT_PASS).then(function (h) { localStorage.setItem(PASS_KEY, h); });
    }
  }

  function verify(p) {
    return hashPass(p).then(function (h) { return h === localStorage.getItem(PASS_KEY); });
  }

  /* ---------- 登录 ---------- */
  function unlock() {
    $('#loginView').hidden = true;
    $('#dashView').hidden = false;
    initDashboard();
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var pass = $('#loginPass').value;
    verify(pass).then(function (ok) {
      if (!ok) {
        $('#loginError').textContent = '密码不正确，请重试。';
        var card = $('.login-card');
        card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        return;
      }
      $('#loginError').textContent = '';
      sessionStorage.setItem(SESSION_KEY, '1');
      unlock();
    });
  });
  $('#logoutBtn').addEventListener('click', function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  /* ---------- 标签页 ---------- */
  function initDashboard() {
    renderProfile(); renderLinks(); renderGallery(); renderCovers(); updateStorageInfo();
  }
  $$('#adminTabs .admin-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('#adminTabs .admin-tab').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      $$('.admin-panel').forEach(function (p) { p.hidden = true; });
      $('#panel-' + btn.dataset.tab).hidden = false;
      if (btn.dataset.tab === 'images') { renderGallery(); renderCovers(); }
    });
  });

  /* ---------- 资料 ---------- */
  var pendingAvatar = null;
  function renderProfile() {
    var p = profileApi ? profileApi.get() : {};
    $('#adminAvatar').src = p.avatar || 'assets/img/avatar.svg';
    $('#editProfileName').value = p.name || '';
    $('#editProfileHandle').value = p.handle || '';
    $('#editProfileBio').value = p.bio || '';
    pendingAvatar = null;
  }
  function compressImage(file, maxSide, quality, square) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var canvas = document.createElement('canvas');
        var ctx;
        if (square) {
          var side = Math.min(w, h);
          var scale = Math.min(1, maxSide / side);
          var size = Math.max(1, Math.round(side * scale));
          canvas.width = canvas.height = size;
          ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
        } else {
          var ratio = Math.min(1, maxSide / Math.max(w, h));
          canvas.width = Math.max(1, Math.round(w * ratio));
          canvas.height = Math.max(1, Math.round(h * ratio));
          ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  }
  $('#adminAvatarFile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    compressImage(f, 360, 0.86, true).then(function (data) {
      pendingAvatar = data;
      $('#adminAvatar').src = data;
      toast('头像已选好，记得点「保存资料」');
    }).catch(function () { toast('图片读取失败，请换一张试试'); });
    e.target.value = '';
  });
  $('#resetAvatarBtn').addEventListener('click', function () {
    pendingAvatar = 'assets/img/avatar.svg';
    $('#adminAvatar').src = pendingAvatar;
    toast('已恢复默认头像，记得点「保存资料」');
  });
  $('#saveProfileBtn').addEventListener('click', function () {
    if (!profileApi) return toast('资料模块未加载');
    var patch = {
      name: $('#editProfileName').value.trim(),
      handle: $('#editProfileHandle').value.trim(),
      bio: $('#editProfileBio').value.trim()
    };
    if (pendingAvatar) patch.avatar = pendingAvatar;
    profileApi.set(patch);
    renderProfile();
    toast('资料已保存，全站已同步');
  });

  /* ---------- 链接 ---------- */
  var ICON_NAMES = [
    ['github', 'GitHub'], ['gitee', 'Gitee'], ['email', '邮箱'], ['qq', 'QQ'],
    ['wechat', '微信'], ['rss', 'RSS'], ['link', '网址'], ['camera', '相机'],
    ['music', '音乐'], ['heart', '爱心']
  ];
  var linkRows = [];
  function iconHtml(name) {
    var key = String(name || 'link');
    var svg = site.ICONS[key];
    if (svg) {
      var filled = /^(github|gitee|qq|wechat|heart)$/.test(key);
      return '<svg ' + (filled ? '' : 'stroke="currentColor" fill="none"') +
        ' viewBox="0 0 24 24">' + svg + '</svg>';
    }
    return '<span class="diy-ico">' + esc(key.slice(0, 2)) + '</span>';
  }
  function previewLinks() {
    var data = {
      links: linkRows.map(function (x) { return { icon: x.custom || x.icon, label: x.label, url: x.url }; }),
      reward: rewardData()
    };
    var html = data.links.map(function (x) {
      return '<a class="social-icon" href="' + esc(x.url || '#') + '" title="' + esc(x.label) +
        '" aria-label="' + esc(x.label) + '">' + iconHtml(x.icon) + '</a>';
    }).join('');
    if (data.reward.label) {
      html += '<a class="ig-reward-link" href="' + esc(data.reward.url || '#') + '">' +
        esc(data.reward.emoji + ' ' + data.reward.label) + '</a>';
    }
    $('#linkPreview').innerHTML = html;
  }
  function rewardData() {
    return {
      label: $('#rewardLabel').value.trim(),
      emoji: $('#rewardEmoji').value.trim() || '☕',
      url: $('#rewardUrl').value.trim() || 'about.html'
    };
  }
  function renderLinks(data) {
    var d = data || site.getLinks();
    linkRows = d.links.map(function (x) {
      var known = ICON_NAMES.some(function (p) { return p[0] === x.icon; });
      return known ? { icon: x.icon, label: x.label, url: x.url, custom: '' }
                   : { icon: 'link', label: x.label, url: x.url, custom: x.icon };
    });
    $('#rewardLabel').value = d.reward.label.replace(/^☕\s*/, '');
    $('#rewardEmoji').value = d.reward.emoji || '☕';
    $('#rewardUrl').value = d.reward.url;
    drawRows();
  }
  function drawRows() {
    var html = linkRows.map(function (x, i) {
      var opts = ICON_NAMES.map(function (pair) {
        return '<option value="' + pair[0] + '"' + (x.icon === pair[0] ? ' selected' : '') + '>' + pair[1] + '</option>';
      }).join('');
      return '<div class="link-row" data-i="' + i + '">' +
        '<div class="link-icon-cell"><select class="l-icon" aria-label="图标">' + opts + '</select>' +
        '<input class="l-custom" type="text" maxlength="4" placeholder="自定义符号（选填）" value="' + esc(x.custom || '') + '"></div>' +
        '<input class="l-label" type="text" maxlength="24" placeholder="名称" value="' + esc(x.label) + '">' +
        '<input class="l-url" type="text" placeholder="网址 https://…" value="' + esc(x.url) + '">' +
        '<div class="link-row-ops">' +
        '<button class="mini up" title="上移">↑</button><button class="mini down" title="下移">↓</button>' +
        '<button class="mini del" title="删除">×</button></div></div>';
    }).join('');
    $('#linkList').innerHTML = html || '<p class="gallery-empty">还没有链接，点下面的「添加链接」。</p>';
    $$('#linkList .link-row').forEach(function (row) {
      var i = Number(row.dataset.i);
      $('.l-icon', row).addEventListener('change', function (e) { linkRows[i].icon = e.target.value; previewLinks(); });
      $('.l-custom', row).addEventListener('input', function (e) { linkRows[i].custom = e.target.value.trim(); previewLinks(); });
      $('.l-label', row).addEventListener('input', function (e) { linkRows[i].label = e.target.value; previewLinks(); });
      $('.l-url', row).addEventListener('input', function (e) { linkRows[i].url = e.target.value; previewLinks(); });
      $('.up', row).addEventListener('click', function () { if (i > 0) { swap(i, i - 1); } });
      $('.down', row).addEventListener('click', function () { if (i < linkRows.length - 1) { swap(i, i + 1); } });
      $('.del', row).addEventListener('click', function () { linkRows.splice(i, 1); drawRows(); previewLinks(); });
    });
    previewLinks();
  }
  function swap(a, b) { var t = linkRows[a]; linkRows[a] = linkRows[b]; linkRows[b] = t; drawRows(); }
  $('#addLinkBtn').addEventListener('click', function () {
    linkRows.push({ icon: 'link', label: '新链接', url: 'https://', custom: '' });
    drawRows();
    var rows = $$('#linkList .link-row');
    if (rows.length) rows[rows.length - 1].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $('#saveLinksBtn').addEventListener('click', function () {
    var payload = {
      links: linkRows.map(function (x) {
        return { icon: x.custom || x.icon, label: x.label.trim() || '链接', url: x.url.trim() || '#' };
      }),
      reward: rewardData()
    };
    toast(site.setLinks(payload) ? '链接已保存，首页已更新' : '保存失败，浏览器存储空间可能已满');
    previewLinks();
  });
  ['#rewardLabel', '#rewardEmoji', '#rewardUrl'].forEach(function (sel) {
    $(sel).addEventListener('input', previewLinks);
  });

  /* ---------- 图片库 ---------- */
  function renderGallery() {
    var list = site.getGallery();
    $('#galleryGrid').innerHTML = list.length ? list.map(function (x) {
      return '<div class="gallery-item" data-id="' + esc(x.id) + '">' +
        '<img src="' + esc(x.data) + '" alt="' + esc(x.title) + '">' +
        '<div class="g-name" title="' + esc(x.title) + '">' + esc(x.title) + '</div>' +
        '<div class="g-ops"><button class="mini avatar-use">设头像</button>' +
        '<button class="mini del">删除</button></div></div>';
    }).join('') : '<div class="gallery-empty">还没有上传图片，点上方区域添加。</div>';
    $$('#galleryGrid .gallery-item').forEach(function (item) {
      var id = item.dataset.id;
      var img = $('img', item).src;
      $('.avatar-use', item).addEventListener('click', function () {
        pendingAvatar = img; $('#adminAvatar').src = img;
        profileApi.set({ avatar: img });
        toast('已设为头像，全站同步');
      });
      $('.del', item).addEventListener('click', function () {
        if (!confirm('确定删除这张图片？')) return;
        site.removeGallery(id); renderGallery(); renderCovers(); toast('图片已删除');
      });
    });
  }
  $('#galleryFile').addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    if (!files.length) return;
    toast('正在处理 ' + files.length + ' 张图片…');
    Promise.all(files.map(function (f) { return compressImage(f, 900, 0.82, false); }))
      .then(function (datas) {
        var ok = site.addGallery(datas.map(function (d, i) {
          return { data: d, title: files[i].name.replace(/\.[^.]+$/, '').slice(0, 40) };
        }));
        renderGallery(); updateStorageInfo();
        toast(ok ? '图片已保存到本机' : '保存失败，浏览器存储空间可能已满（建议少传几张）');
      })
      .catch(function () { toast('有图片读取失败，请重试'); });
    e.target.value = '';
  });

  /* ---------- 首页封面 ---------- */
  var pickingSlot = null;
  function renderCovers() {
    var covers = site.getCovers();
    var html = '';
    for (var i = 0; i < 11; i++) {
      var src = covers[i] || '';
      html += '<div class="cover-item" data-i="' + i + '">' +
        (src ? '<img src="' + esc(src) + '" alt="封面">' : '<img src="" alt="" style="display:none">') +
        '<span class="c-num">' + (i + 1) + '</span>' +
        '<span class="c-src">' + (src ? '已自定义' : '默认封面') + '</span>' +
        '<button class="mini change">更换</button>' +
        (src ? '<button class="mini reset" title="恢复默认">↺</button>' : '') +
        '</div>';
    }
    $('#coverList').innerHTML = html;
    $$('#coverList .cover-item').forEach(function (item) {
      var i = Number(item.dataset.i);
      $('.change', item).addEventListener('click', function () { openPicker(i); });
      var reset = $('.reset', item);
      if (reset) reset.addEventListener('click', function () {
        site.setCover(i, null); renderCovers(); toast('第 ' + (i + 1) + ' 格已恢复默认');
      });
    });
  }
  function openPicker(i) {
    pickingSlot = i;
    var list = site.getGallery();
    $('#pickerOptions').innerHTML = list.length ? list.map(function (x) {
      return '<img src="' + esc(x.data) + '" data-id="' + esc(x.id) + '" title="' + esc(x.title) + '" alt="' + esc(x.title) + '">';
    }).join('') : '<div class="picker-empty">图片库还是空的，先上传几张图片吧。</div>';
    $$('#pickerOptions img').forEach(function (im) {
      im.addEventListener('click', function () {
        var item = list.filter(function (x) { return x.id === im.dataset.id; })[0];
        if (item) { site.setCover(pickingSlot, item.data); closePicker(); renderCovers(); toast('封面已更新'); }
      });
    });
    $('#pickerModal').hidden = false;
  }
  function closePicker() { $('#pickerModal').hidden = true; pickingSlot = null; }
  $('#pickerClose').addEventListener('click', closePicker);
  $('#pickerModal').addEventListener('click', function (e) { if (e.target === $('#pickerModal')) closePicker(); });
  $('#pickerUrlBtn').addEventListener('click', function () {
    var url = $('#pickerUrl').value.trim();
    if (!/^(https?:\/\/|data:image\/|\.\/|\.\.\/|assets\/)/i.test(url)) return toast('请填写有效的图片网址');
    if (pickingSlot === null) return;
    site.setCover(pickingSlot, url);
    $('#pickerUrl').value = '';
    closePicker(); renderCovers(); toast('封面已更新');
  });
  $('#clearCoversBtn').addEventListener('click', function () {
    if (!confirm('确定把所有封面恢复成默认图片吗？')) return;
    site.clearCovers(); renderCovers(); toast('已全部恢复默认封面');
  });

  /* ---------- 设置 ---------- */
  $('#changePassBtn').addEventListener('click', function () {
    var old = $('#oldPass').value, next = $('#newPass').value, next2 = $('#newPass2').value;
    if (!next || next.length < 6) return toast('新密码至少 6 位');
    if (next !== next2) return toast('两次输入的新密码不一致');
    verify(old).then(function (ok) {
      if (!ok) return toast('当前密码不正确');
      return hashPass(next).then(function (h) {
        localStorage.setItem(PASS_KEY, h);
        $('#oldPass').value = $('#newPass').value = $('#newPass2').value = '';
        toast('密码已修改，下次登录请使用新密码');
      });
    });
  });
  function updateStorageInfo() {
    var bytes = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('demotu-') === 0) bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) {}
    $('#storageInfo').textContent = '当前资料、链接与图片约占用 ' + (bytes / 1024).toFixed(1) +
      ' KB（浏览器一般上限约 5 MB）。';
  }
  $('#exportBtn').addEventListener('click', function () {
    var blob = new Blob([site.exportData()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'demotu-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('备份文件已下载');
  });
  $('#importFile').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    f.text().then(function (txt) {
      site.importData(txt);
      renderProfile(); renderLinks(); renderGallery(); renderCovers(); updateStorageInfo();
      toast('备份已导入');
    }).catch(function () { toast('文件格式不正确'); });
    e.target.value = '';
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm('确定恢复默认资料、链接和封面吗？上传的图片也会被清空。')) return;
    site.resetAll();
    if (profileApi) profileApi.reset();
    initDashboard();
    toast('已恢复默认数据');
  });

  /* ---------- 启动 ---------- */
  ensurePass();
  if (sessionStorage.getItem(SESSION_KEY) === '1') unlock();
})();
