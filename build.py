# -*- coding: utf-8 -*-
"""
个人网站模板生成器
读取 site.config.json，生成 10 个静态页面。
修改配置后运行：python build.py
"""
import json
import html
import os

BASE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE, 'site.config.json'), 'r', encoding='utf-8') as f:
    cfg = json.load(f)

site = cfg.get('site', {})


def esc(value):
    return html.escape(str(value if value is not None else ''), quote=True)


def safe_json(data):
    return json.dumps(data, ensure_ascii=False).replace('</', '<\\/')


NAV = [
    ('home', '首页', 'index.html'),
    ('projects', '项目', 'projects.html'),
    ('timeline', '归档', 'timeline.html'),
    ('photowall', '照片墙', 'photowall.html'),
    ('music', '音乐', 'music.html'),
    ('tree', '灵境', 'tree.html'),
    ('moments', '说说', 'moments.html'),
    ('chatter', '杂谈', 'chatter.html'),
    ('friends', '友链', 'friends.html'),
    ('about', '关于', 'about.html'),
]

ICONS = {
    'github': '<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>',
    'gitee': '<path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482c0-.326.266-.592.592-.592h6.81c.328 0 .593.266.593.592v3.408a4.74 4.74 0 0 1-4.741 4.74H7.11A4.74 4.74 0 0 1 2.37 14.81V9.186a4.74 4.74 0 0 1 4.74-4.741h10.963v.888z"/>',
    'email': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>',
    'qq': '<path d="M12 2c-4.418 0-8 3.582-8 8 0 1.25.289 2.433.805 3.49-1.024 1.708-1.53 3.843-1.021 5.308.203.585.806.84 1.341.57.828-.418 1.625-1.025 2.296-1.722 1.335.539 2.862.854 4.579.854 1.716 0 3.243-.315 4.578-.854.671.697 1.468 1.304 2.296 1.722.535.27 1.138.015 1.341-.57.509-1.465.003-3.6-1.021-5.308C19.71 12.433 20 11.25 20 10c0-4.418-3.582-8-8-8zm-2.5 8c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2zm5 0c-.828 0-1.5-.895-1.5-2s.672-2 1.5-2 1.5.895 1.5 2-.672 2-1.5 2z"/>',
    'wechat': '<path d="M8.5 13.5c-3.59 0-6.5-2.42-6.5-5.4 0-2.98 2.91-5.4 6.5-5.4s6.5 2.42 6.5 5.4c0 2.98-2.91 5.4-6.5 5.4zm7.5 7.8c-2.76 0-5-2.02-5-4.5 0-2.48 2.24-4.5 5-4.5s5 2.02 5 4.5c0 2.48-2.24 4.5-5 4.5z"/>',
    'rss': '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
}

SEARCH_SVG = '''<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'''


def nav_html(active):
    links = []
    for key, label, file in NAV:
        cls = 'nav-link active' if key == active else 'nav-link'
        links.append('<a class="%s" href="%s">%s</a>' % (cls, file, label))
    mobile = []
    for key, label, file in NAV:
        cls = 'active' if key == active else ''
        mobile.append('<a class="%s" href="%s">%s</a>' % (cls, file, label))
    return '''
    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="index.html">%s<span class="dot">の</span>小站</a>
        <nav class="main-nav">%s</nav>
      </div>
    </header>
    <button class="mobile-nav-toggle" id="navToggle" aria-label="打开菜单" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <nav class="mobile-nav" id="mobileNav">%s</nav>
    ''' % (esc(site.get('name', 'DemoTu.com')), ''.join(links), ''.join(mobile))


def background_html():
    return '''
    <div class="bg-slides" id="bgSlides"></div>
    <div class="bg-overlay"></div>
    <div class="bg-gradient"></div>
    <div class="bg-blobs"><div class="blob one"></div><div class="blob two"></div></div>
    <div class="starfield" id="starfield"></div>
    <div class="shooting-star"></div><div class="shooting-star second"></div>
    <canvas class="firefly-canvas" id="fireflyCanvas"></canvas>
    <canvas class="snow-canvas" id="snowCanvas"></canvas>
    <div class="bg-vignette"></div>
    '''


def footer_html():
    return '''
    <footer class="site-footer">
      <div class="footer-bar glass-card">
        <div class="clock-block" id="clock">00:00:00</div>
        <div class="footer-info">
          <div class="uptime"><span class="pulse-dot"></span><span>系统已稳定运行：<strong id="uptime">0 天 0 小时 0 分</strong></span></div>
          <div class="footer-small">🌙 愿你在这里找到一点温柔</div>
          <a class="footer-link" href="about.html">%s</a>
        </div>
      </div>
    </footer>
    ''' % esc(site.get('footerText', '© 2026 DemoTu.com · 用热爱发电'))


def shell(title, active, content):
    config_js = safe_json(cfg)
    return '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#f6f7ff">
  <meta name="description" content="%s">
  <title>%s · %s</title>
  <link rel="icon" href="assets/img/avatar.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/css/style.css">
  <script>window.SITE_CONFIG = %s;</script>
</head>
<body>
  %s
  %s
  <main class="page-main">
    %s
  </main>
  %s
  <script src="assets/js/main.js"></script>
</body>
</html>
''' % (
        esc(site.get('description', '')),
        esc(title),
        esc(site.get('title', '个人小站')),
        config_js,
        background_html(),
        nav_html(active),
        content,
        footer_html(),
    )


def socials_html():
    out = []
    for item in cfg.get('socials', []):
        icon = ICONS.get(item.get('icon'), ICONS['rss'])
        stroke = '' if item.get('icon') in ('github', 'gitee', 'qq', 'wechat') else 'stroke="currentColor" fill="none"'
        out.append(
            '<a class="social-icon" href="%s" title="%s" aria-label="%s">'
            '<svg %s viewBox="0 0 24 24">%s</svg></a>'
            % (esc(item.get('url', '#')), esc(item.get('label', '')), esc(item.get('label', '')), stroke, icon)
        )
    return ''.join(out)


def home_content():
    stats = cfg.get('stats', {})
    articles = cfg.get('articles', [])
    chatters = cfg.get('chatters', [])
    photos = cfg.get('photos', [])

    # 九宫格内容：文章 + 杂谈 + 照片
    posts = []
    for a in articles:
        posts.append((a.get('cover', ''), a.get('title', ''), a.get('date', ''), '文章', 'projects.html'))
    for c in chatters:
        posts.append((c.get('cover', ''), c.get('title', ''), c.get('date', ''), '杂谈', 'chatter.html'))
    for ph in photos:
        posts.append((ph.get('url', ''), ph.get('title', ''), ph.get('place', ''), '照片', 'photowall.html'))

    like_nums = [268, 142, 386, 97, 231, 158, 412, 76, 203, 315, 184, 129]
    comment_nums = [24, 11, 38, 7, 19, 13, 45, 5, 22, 30, 16, 9]

    post_html = []
    for i, (cover, title, meta, kind, link) in enumerate(posts):
        post_html.append('''
        <a class="ig-post searchable reveal" href="%s"
           data-title="%s" data-desc="%s" data-tags="%s">
          <img src="%s" alt="%s" loading="lazy">
          <span class="ig-post-kind">%s</span>
          <div class="ig-post-hover">
            <span>&#10084; %d</span><span>&#128172; %d</span>
          </div>
        </a>''' % (
            esc(link), esc(title), esc(meta), esc(kind + ' 文章 杂谈 照片'),
            esc(cover), esc(title), esc(kind),
            like_nums[i % len(like_nums)], comment_nums[i % len(comment_nums)],
        ))

    stat_values = [
        stats.get('articles', len(articles)),
        stats.get('chatter', len(chatters)),
        stats.get('photos', len(photos)),
    ]
    stat_labels = ['文章', '杂谈', '照片']
    stat_html = []
    for value, label in zip(stat_values, stat_labels):
        stat_html.append('<div class="ig-stat"><strong>%s</strong><span>%s</span></div>' % (esc(value), esc(label)))

    highlights = [
        ('photo', '照片墙', 'photowall.html'),
        ('music', '音乐', 'music.html'),
        ('project', '项目', 'projects.html'),
        ('archive', '归档', 'timeline.html'),
        ('wonder', '灵境', 'tree.html'),
        ('about', '关于', 'about.html'),
    ]
    highlight_html = []
    for icon, label, link in highlights:
        highlight_html.append('''
        <a class="ig-highlight reveal" href="%s">
          <span class="ig-hl-ring"><span class="ig-hl-emoji"><img src="assets/img/highlights/%s.svg" alt="%s"></span></span>
          <span class="ig-hl-label">%s</span>
        </a>''' % (link, icon, esc(label), esc(label)))
    theme_highlight = '''
        <button class="ig-highlight reveal" data-theme-toggle type="button" aria-label="切换主题">
          <span class="ig-hl-ring"><span class="ig-hl-emoji"><img src="assets/img/highlights/theme.svg" alt="主题"></span></span>
          <span class="ig-hl-label">主题圆盘</span>
        </button>'''

    content = '''
    <section class="search-wrap reveal">
      <form class="search-box" id="searchForm">
        %s
        <input id="searchInput" type="text" placeholder="搜索标题、描述或标签..." autocomplete="off" spellcheck="false">
      </form>
    </section>

    <section class="ig-profile glass-card reveal searchable"
             data-title="%s %s" data-desc="%s" data-tags="个人 资料 主页">
      <div class="ig-avatar-col">
        <div class="ig-avatar-ring"><div class="avatar-frame"><img src="assets/img/avatar.svg" alt="头像"></div></div>
      </div>
      <div class="ig-profile-main">
        <div class="ig-namerow">
          <h1 class="profile-name">%s</h1>
          <span class="ig-verified" title="已认证">&#10003;</span>
          <a class="ig-edit" href="about.html">编辑主页</a>
        </div>
        <div class="ig-stats">%s</div>
        <div class="ig-bio">
          <p class="ig-bio-name">%s</p>
          <p class="ig-bio-text">%s</p>
          <div class="ig-status" id="statusCard"><span class="ig-status-dot"></span><span class="status-text" id="statusText">CONNECTING...</span></div>
          <div class="ig-bio-links">%s<a class="ig-reward-link" href="about.html">&#9749; 赞赏我</a></div>
        </div>
      </div>
    </section>

    <section class="ig-highlights">%s%s</section>

    <nav class="ig-tabs reveal">
      <a class="ig-tab active" href="index.html"><span class="ig-tab-ico">&#9638;</span>帖子</a>
      <a class="ig-tab" href="photowall.html"><span class="ig-tab-ico">&#9636;</span>相册</a>
      <a class="ig-tab" href="about.html"><span class="ig-tab-ico">&#9678;</span>关于</a>
    </nav>

    <section class="ig-grid" id="postGrid">%s</section>

    <div class="empty-state" id="searchEmpty">没有找到相关内容，换个关键词试试吧 &#10052;</div>
    ''' % (
        SEARCH_SVG,
        esc(site.get('name', '')), esc(site.get('title', '')), esc(site.get('subtitle', '')),
        esc(site.get('name', '')),
        ''.join(stat_html),
        esc(site.get('title', '')),
        esc(site.get('subtitle', '')),
        socials_html(),
        ''.join(highlight_html), theme_highlight,
        ''.join(post_html),
    )
    return content


def page_heading(badge, title, desc):
    return '''
    <section class="page-heading reveal">
      <span class="page-badge">%s</span>
      <h1>%s</h1>
      <p>%s</p>
    </section>
    ''' % (esc(badge), esc(title), esc(desc))


def projects_content():
    cards = []
    for p in cfg.get('projects', []):
        tags = ''.join('<span class="tag">%s</span>' % esc(t) for t in p.get('tags', []))
        cards.append('''
        <a class="glass-card content-card project-card reveal" href="%s">
          <div><div class="project-emoji">%s</div><h3>%s</h3><p>%s</p></div>
          <div><div class="tag-row">%s</div><div class="go">查看详情 →</div></div>
        </a>''' % (esc(p.get('url', '#')), esc(p.get('emoji', '✨')), esc(p.get('name', '')), esc(p.get('desc', '')), tags))
    return page_heading('PROJECTS', '项目', '一些从想法变成现实的小东西，持续更新中。') + '<div class="project-grid">%s</div>' % ''.join(cards)


def timeline_content():
    items = []
    for t in cfg.get('timeline', []):
        items.append('''
        <div class="timeline-item">
          <div class="timeline-date">%s</div>
          <h3>%s</h3>
          <p>%s</p>
        </div>''' % (esc(t.get('date', '')), esc(t.get('title', '')), esc(t.get('desc', ''))))
    return page_heading('ARCHIVE', '归档', '时间是一条温柔的河，记录我走过的每一个节点。') + \
        '<div class="glass-card content-card timeline reveal">%s</div>' % ''.join(items)


def photowall_content():
    cards = []
    for p in cfg.get('photos', []):
        cards.append('''
        <figure class="photo-card reveal">
          <img src="%s" alt="%s">
          <div class="shade"></div>
          <figcaption>%s<small>%s</small></figcaption>
        </figure>''' % (esc(p.get('url', '')), esc(p.get('title', '')), esc(p.get('title', '')), esc(p.get('place', ''))))
    return page_heading('GALLERY', '照片墙', '把沿途的光影收藏起来，留给以后的自己。') + '<div class="photo-grid">%s</div>' % ''.join(cards)


def music_content():
    tracks = cfg.get('music', [])
    first = tracks[0] if tracks else {'title': '夜的钢琴曲', 'artist': '未知', 'emoji': '🎵'}
    track_html = []
    for i, t in enumerate(tracks):
        track_html.append('''
        <div class="track %s" data-title="%s" data-artist="%s">
          <span class="track-emoji">%s</span>
          <div><div class="track-title">%s</div><div class="track-artist">%s</div></div>
          <span class="track-duration">%s</span>
        </div>''' % (
            'active' if i == 0 else '',
            esc(t.get('title', '')), esc(t.get('artist', '')),
            esc(t.get('emoji', '🎵')), esc(t.get('title', '')), esc(t.get('artist', '')), esc(t.get('duration', ''))
        ))
    return page_heading('MUSIC', '音乐', '深夜电台，写给每一个不肯睡去的灵魂。') + '''
    <div class="glass-card music-player reveal">
      <div class="music-head">
        <div class="music-cover">%s</div>
        <div><h2 id="currentTitle">%s</h2><p id="currentArtist">%s · 正在播放</p></div>
        <button class="play-btn" id="playBtn" aria-label="播放或暂停">▶</button>
      </div>
      <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
      <div class="progress-meta"><span>01:12</span><span>04:32</span></div>
      <div class="track-list">%s</div>
    </div>''' % (esc(first.get('emoji', '🎵')), esc(first.get('title', '')), esc(first.get('artist', '')), ''.join(track_html))


def tree_content():
    cards = []
    for t in cfg.get('tree', []):
        cards.append('''
        <div class="glass-card content-card tree-card reveal">
          <span class="emoji">%s</span>
          <h3>%s</h3>
          <p>%s</p>
        </div>''' % (esc(t.get('emoji', '✨')), esc(t.get('title', '')), esc(t.get('desc', ''))))
    return page_heading('WONDERLAND', '灵境', '所有热爱的事情，都是我精神世界的一棵棵树。') + '<div class="tree-grid">%s</div>' % ''.join(cards)


def moments_content():
    cards = []
    for m in cfg.get('moments', []):
        cards.append('''
        <div class="glass-card moment-card reveal">
          <span class="emoji">%s</span>
          <div><p>%s</p><time>%s</time></div>
        </div>''' % (esc(m.get('emoji', '✨')), esc(m.get('text', '')), esc(m.get('time', ''))))
    return page_heading('MOMENTS', '说说', '碎片化的情绪，也是生活的一部分。') + '<div class="moment-grid">%s</div>' % ''.join(cards)


def chatter_content():
    cards = []
    for c in cfg.get('chatters', []):
        cards.append('''
        <article class="glass-card content-card reveal">
          <div class="mini-label">Records · %s</div>
          <h3 style="margin-top:14px">%s</h3>
          <p>%s</p>
          <div class="card-date" style="color:var(--text-faint)">%s</div>
        </article>''' % (esc(c.get('date', '')), esc(c.get('title', '')), esc(c.get('description', '')), esc(' · '.join(c.get('tags', [])))))
    return page_heading('CHATTER', '杂谈', '一些不太成体系、但足够真诚的想法。') + '<div class="moment-grid">%s</div>' % ''.join(cards)


def friends_content():
    cards = []
    for f in cfg.get('friends', []):
        cards.append('''
        <a class="glass-card friend-card reveal" href="%s" target="_blank" rel="noopener noreferrer">
          <div class="friend-avatar">%s</div>
          <div><h3>%s</h3><p>%s</p></div>
        </a>''' % (esc(f.get('url', '#')), esc(f.get('emoji', '✨')), esc(f.get('name', '')), esc(f.get('desc', ''))))
    return page_heading('FRIENDS', '友链', '在互联网上认识的有趣灵魂，欢迎串门。') + '<div class="friends-grid">%s</div>' % ''.join(cards)


def about_content():
    tags = ['写作', '摄影', '音乐', '代码', '旅行', '咖啡']
    tag_html = ''.join('<span class="tag">%s</span>' % esc(t) for t in tags)
    return page_heading('ABOUT', '关于', '关于我，关于这个小小的互联网角落。') + '''
    <div class="glass-card about-hero reveal">
      <div class="ig-avatar-ring"><div class="avatar-frame"><img src="assets/img/avatar.svg" alt="头像"></div></div>
      <div>
        <h2>%s</h2>
        <p>%s<br><br>%s</p>
      </div>
    </div>
    <div class="glass-card content-card about-more reveal" style="margin-top:24px">
      <h3>我喜欢的</h3>
      <p>在平凡的日子里收集微小的快乐，然后把它们写进文字和照片里。</p>
      <div class="tag-row">%s</div>
    </div>''' % (
        esc(site.get('name', '')),
        esc(site.get('subtitle', '')),
        esc(site.get('description', '')),
        tag_html,
    )


PAGES = {
    'index.html': ('首页', 'home', home_content),
    'projects.html': ('项目', 'projects', projects_content),
    'timeline.html': ('归档', 'timeline', timeline_content),
    'photowall.html': ('照片墙', 'photowall', photowall_content),
    'music.html': ('音乐', 'music', music_content),
    'tree.html': ('灵境', 'tree', tree_content),
    'moments.html': ('说说', 'moments', moments_content),
    'chatter.html': ('杂谈', 'chatter', chatter_content),
    'friends.html': ('友链', 'friends', friends_content),
    'about.html': ('关于', 'about', about_content),
}

for filename, (title, active, builder) in PAGES.items():
    path = os.path.join(BASE, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(shell(title, active, builder()))
    print('generated', filename)

print('done.')
