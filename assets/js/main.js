/* ===========================================================
   个人网站模板 · 交互脚本
   =========================================================== */

(function () {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const canvas = $('#fireflyCanvas');
  let fireflies = [];
  let fireflyRaf = null;

  const snowCanvas = $('#snowCanvas');
  let snowflakes = [];
  let snowRaf = null;

  /* ---------------- 主题 ---------------- */
  const THEME_KEY = 'personal-site-theme';
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
    $$('[data-theme-toggle]').forEach(function (btn) {
      const title = $('.theme-title', btn);
      const desc = $('.theme-desc', btn);
      if (title) title.textContent = theme === 'dark' ? '日间模式' : '夜间模式';
      if (desc) desc.textContent = theme === 'dark' ? '晨光吻过银器' : '月光轻覆蕾丝';
      btn.setAttribute('aria-label', theme === 'dark' ? '切换到日间模式' : '切换到夜间模式');
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#b9b4c0' : '#ffffff';
    drawFireflies();
    drawSnow();
  }

  applyTheme(initialTheme);

  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  /* ---------------- 背景轮播 ---------------- */
  const slidesRoot = $('#bgSlides');
  const backgrounds = Array.isArray(cfg.backgrounds) && cfg.backgrounds.length
    ? cfg.backgrounds
    : [];

  if (slidesRoot) {
    backgrounds.forEach(function (url, index) {
      const div = document.createElement('div');
      div.className = 'bg-slide' + (index === 0 ? ' active' : '');
      div.style.backgroundImage = 'url("' + url + '")';
      slidesRoot.appendChild(div);
    });

    const slides = $$('.bg-slide', slidesRoot);
    if (slides.length > 1) {
      let current = 0;
      setInterval(function () {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }, 6500);
    }
  }

  /* ---------------- 星空 ---------------- */
  const starfield = $('#starfield');
  if (starfield) {
    let starHtml = '';
    for (let i = 0; i < 70; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = (Math.random() * 4).toFixed(2);
      const size = (Math.random() > 0.85 ? 3 : 2);
      starHtml += '<span class="star" style="top:' + top + '%;left:' + left +
        '%;animation-delay:' + delay + 's;width:' + size + 'px;height:' + size + 'px"></span>';
    }
    starfield.innerHTML = starHtml;
  }

  /* ---------------- 流萤画布 ---------------- */
  function resizeCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFireflies() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const count = isDark ? 52 : 36;

    if (fireflies.length !== count) {
      fireflies = Array.from({ length: count }, function () {
        const petal = Math.random() > 0.74;
        return {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: petal ? 2.2 + Math.random() * 2.6 : 0.8 + Math.random() * 1.6,
          vx: (Math.random() - 0.5) * (petal ? 0.5 : 0.25),
          vy: petal ? 0.25 + Math.random() * 0.45 : -0.12 - Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          petal: petal
        };
      });
    }

    if (fireflyRaf) cancelAnimationFrame(fireflyRaf);

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      fireflies.forEach(function (f) {
        f.x += f.vx + Math.sin(f.phase) * (f.petal ? 0.42 : 0.12);
        f.y += f.vy;
        f.phase += f.petal ? 0.018 : 0.012;

        if (f.petal) {
          if (f.y > window.innerHeight + 12) { f.y = -12; f.x = Math.random() * window.innerWidth; }
        } else if (f.y < -10) {
          f.y = window.innerHeight + 10;
          f.x = Math.random() * window.innerWidth;
        }
        if (f.x < -12) f.x = window.innerWidth + 12;
        if (f.x > window.innerWidth + 12) f.x = -12;

        const alpha = 0.35 + Math.sin(f.phase) * 0.3;

        if (f.petal) {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.phase);
          ctx.beginPath();
          ctx.ellipse(0, 0, f.r * 1.7, f.r * 0.85, 0, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? 'rgba(240, 202, 216,' + Math.max(alpha * 0.8, 0.18) + ')'
            : 'rgba(224, 168, 190,' + Math.max(alpha * 0.75, 0.2) + ')';
          ctx.shadowBlur = 7;
          ctx.shadowColor = '#e8c0cf';
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? 'rgba(255, 255, 255,' + Math.max(alpha, 0.12) + ')'
            : 'rgba(201, 140, 160,' + Math.max(alpha * 0.7, 0.1) + ')';
          ctx.shadowBlur = isDark ? 12 : 8;
          ctx.shadowColor = isDark ? '#ffffff' : '#d99aae';
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;
      fireflyRaf = requestAnimationFrame(frame);
    }
    frame();
  }

  if (canvas) {
    resizeCanvas();
    drawFireflies();
    window.addEventListener('resize', resizeCanvas);
  }

  /* ---------------- 动态下雪 ---------------- */
  function resizeSnow() {
    if (!snowCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    snowCanvas.width = window.innerWidth * dpr;
    snowCanvas.height = window.innerHeight * dpr;
    snowCanvas.style.width = window.innerWidth + 'px';
    snowCanvas.style.height = window.innerHeight + 'px';
    const ctx = snowCanvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawSnow() {
    if (!snowCanvas) return;
    const ctx = snowCanvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const count = isDark ? 90 : 70;

    if (snowflakes.length !== count) {
      snowflakes = Array.from({ length: count }, function () {
        return {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 1 + Math.random() * 3,
          vy: 0.4 + Math.random() * 1.1,
          drift: Math.random() * Math.PI * 2,
          driftSpeed: 0.006 + Math.random() * 0.014,
          sway: 0.4 + Math.random() * 1.0,
          alpha: 0.35 + Math.random() * 0.5
        };
      });
    }

    if (snowRaf) cancelAnimationFrame(snowRaf);

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      snowflakes.forEach(function (f) {
        f.y += f.vy;
        f.drift += f.driftSpeed;
        f.x += Math.sin(f.drift) * f.sway;

        if (f.y > window.innerHeight + 8) {
          f.y = -8;
          f.x = Math.random() * window.innerWidth;
        }
        if (f.x < -10) f.x = window.innerWidth + 10;
        if (f.x > window.innerWidth + 10) f.x = -10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        // 雪花主体纯白；用极淡的冷色描边与柔光勾出轮廓，浅色背景下仍可见
        ctx.fillStyle = 'rgba(255,255,255,' + f.alpha + ')';
        ctx.shadowBlur = isDark ? 8 : 6;
        ctx.shadowColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(168,156,190,0.55)';
        ctx.fill();
        if (!isDark) {
          ctx.shadowBlur = 0;
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = 'rgba(176,164,198,0.42)';
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0;
      snowRaf = requestAnimationFrame(frame);
    }
    frame();
  }

  if (snowCanvas) {
    resizeSnow();
    drawSnow();
    window.addEventListener('resize', resizeSnow);
  }

  /* ---------------- 时钟与运行时间 ---------------- */
  const clockEl = $('#clock');
  const uptimeEl = $('#uptime');
  const startDate = cfg.site && cfg.site.startDate ? new Date(cfg.site.startDate) : new Date();

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
  }

  function tickUptime() {
    if (!uptimeEl) return;
    const diff = Math.max(0, Date.now() - startDate.getTime());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    uptimeEl.textContent = days + ' 天 ' + hours + ' 小时 ' + minutes + ' 分';
  }

  tickClock();
  tickUptime();
  setInterval(tickClock, 1000);
  setInterval(tickUptime, 30000);

  /* ---------------- 连接状态卡 ---------------- */
  const statusCard = $('#statusCard');
  const statusText = $('#statusText');
  if (statusCard) {
    setTimeout(function () {
      statusCard.classList.add('connected');
      if (statusText) statusText.textContent = '已连接 · 欢迎光临';
    }, 2200);
  }

  /* ---------------- 图片加载失败兜底 ---------------- */
  $$('img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (!img.getAttribute('data-fallback')) {
        img.setAttribute('data-fallback', '1');
        img.src = 'assets/img/post-placeholder.svg';
      }
    });
  });

  /* ---------------- 搜索过滤 ---------------- */
  const searchInput = $('#searchInput');
  const searchForm = $('#searchForm');
  const emptyState = $('#searchEmpty');

  function runSearch() {
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();
    const items = $$('.searchable');
    let visible = 0;

    items.forEach(function (item) {
      const haystack = [
        item.getAttribute('data-title') || '',
        item.getAttribute('data-desc') || '',
        item.getAttribute('data-tags') || ''
      ].join(' ').toLowerCase();

      const match = !keyword || haystack.indexOf(keyword) !== -1;
      item.classList.toggle('hidden', !match);
      if (match) visible++;
    });

    if (emptyState) emptyState.classList.toggle('show', visible === 0 && !!keyword);
  }

  if (searchInput) {
    searchInput.addEventListener('input', runSearch);
    if (searchForm) searchForm.addEventListener('submit', function (e) { e.preventDefault(); runSearch(); });
  }

  /* ---------------- 移动端导航 ---------------- */
  const navToggle = $('#navToggle');
  const mobileNav = $('#mobileNav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', mobileNav.classList.contains('open') ? 'true' : 'false');
    });
    $$('a', mobileNav).forEach(function (link) {
      link.addEventListener('click', function () { mobileNav.classList.remove('open'); });
    });
  }

  /* ---------------- 滚动入场 ---------------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------------- 音乐页模拟播放器 ---------------- */
  const playBtn = $('#playBtn');
  const progressBar = $('#progressBar');
  const currentTitle = $('#currentTitle');
  const currentArtist = $('#currentArtist');
  let playing = false;
  let progress = 28;
  let progressTimer = null;

  function updatePlayUi() {
    if (playBtn) playBtn.textContent = playing ? '❚❚' : '▶';
    if (progressBar) progressBar.style.width = progress + '%';
  }

  if (playBtn) {
    playBtn.addEventListener('click', function () {
      playing = !playing;
      if (playing) {
        progressTimer = setInterval(function () {
          progress = progress >= 100 ? 0 : progress + 1;
          updatePlayUi();
        }, 900);
      } else {
        clearInterval(progressTimer);
      }
      updatePlayUi();
    });
  }

  $$('.track').forEach(function (track) {
    track.addEventListener('click', function () {
      $$('.track').forEach(function (t) { t.classList.remove('active'); });
      track.classList.add('active');
      if (currentTitle) currentTitle.textContent = track.getAttribute('data-title') || currentTitle.textContent;
      if (currentArtist) currentArtist.textContent = track.getAttribute('data-artist') || currentArtist.textContent;
      progress = 0;
      updatePlayUi();
    });
  });
})();
