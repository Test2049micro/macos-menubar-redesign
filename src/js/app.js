/*!
 * 问 · macOS 菜单栏重设计 — 渲染与交互层
 * ------------------------------------------------------------------
 * 只消费 src/js/config.js 的数据，不硬编码业务内容。
 * 结构：utils（纯函数） → builders（纯字符串构建，可在 Node 中测试） → mount/bind（DOM）。
 *
 * 许可：MIT
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.MBR = root.MBR || {};
  for (var k in api) { root.MBR[k] = api[k]; }
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  'use strict';

  var MBR = root.MBR || {};
  var cfg = (MBR.config) || {};
  var T = (MBR.i18n && cfg.meta && MBR.i18n[cfg.meta.locale]) || {};

  /* ================= utils ================= */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(id) { return document.getElementById(id); }
  function icon(id, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
  }
  function anno(n) {
    return '<span class="anno" aria-hidden="true">' + n + '</span>';
  }
  function fmtBadge(n) {
    var max = (cfg.thresholds && cfg.thresholds.badgeMax) || 99;
    return n > max ? max + '+' : String(n);
  }
  function clockNow() {
    return T.clock ? T.clock(new Date()) : '';
  }
  function tipAttr(tip) {
    return tip ? ' data-tip="' + esc(tip) + '"' : '';
  }
  function item(inner, tip, cls, extra) {
    return '<span class="menubar__item' + (cls ? ' ' + cls : '') + '"' + tipAttr(tip) + (extra || '') + '>' + inner + '</span>';
  }

  /* ================= 片段构建（纯函数） ================= */
  function battHTML(level, color, text) {
    return '<span class="batt' + (color ? ' batt--' + color : '') + '" aria-hidden="true">' +
      '<span class="batt__fill" style="width:calc((100% - 3.6px) * ' + level + ')"></span></span>' +
      (text ? '<span class="batt-txt">' + esc(text) + '</span>' : '');
  }
  function sysZoneHTML(sys) {
    var h = '<div class="menubar__zone">' +
      item(icon('i-wifi'), cfg.system.wifi.tip) +
      item(icon('i-sound'), cfg.system.sound.tip) +
      item(battHTML(sys.level, sys.color), sys.tip);
    if (sys.bolt) { h += item(icon('i-bolt', 'ic--bolt'), T.charging, 'menubar__item--bolt'); }
    if (sys.showText) { h += '<span class="batt-txt">' + Math.round(sys.level * 100) + '%</span>'; }
    return h + '</div>';
  }
  function imeZoneHTML(mode) {
    if (mode === 'pin') {
      return '<div class="menubar__zone">' +
        '<span class="menubar__item menubar__ime"' + tipAttr(T.imeActive) + '><span class="ime-dot" aria-hidden="true"></span>' + esc(cfg.ime.label) + '</span></div>';
    }
    if (mode === 'abc') {
      return '<div class="menubar__zone">' +
        '<span class="menubar__item menubar__ime menubar__ime--dim"' + tipAttr(T.imeIdle) + '><span class="ime-dot ime-dot--off" aria-hidden="true"></span>ABC</span></div>';
    }
    return '';
  }
  function commZoneHTML(unread) {
    if (!unread) { return ''; }
    var c = cfg.comms[0];
    return '<div class="menubar__zone">' +
      item(icon(c.icon) + '<span class="badge">' + fmtBadge(unread) + '</span>', c.name + ' · ' + unread + ' 条未读') +
      '</div>';
  }
  function toolItemHTML(t, interactive) {
    var running = t.status === 'running' || (typeof t === 'string' && t.charAt(t.length - 1) === '*');
    var id = typeof t === 'string' ? t.replace(/\*$/, '') : t.id;
    var def = null;
    for (var i = 0; i < cfg.tools.length; i++) { if (cfg.tools[i].id === id) { def = cfg.tools[i]; break; } }
    if (!def) { return ''; }
    var inner = icon(def.icon);
    if (running) { inner += '<span class="dot dot--running" aria-hidden="true"></span>'; }
    if (def.id === 'claude') { inner += anno(cfg.anno.claude); }
    if (interactive) {
      return '<span class="menubar__item menubar__item--clickable" role="button" tabindex="0" data-tool="' + def.id + '"' +
        tipAttr(def.name + ' · ' + def.status + '（' + T.unpin + '）') +
        ' aria-label="' + esc(def.name + '，' + T.unpin) + '">' + inner + '</span>';
    }
    return item(inner, def.name + (running ? ' · ' + T.running : ''));
  }
  function trayZoneHTML(clock, tray) {
    var h = '<div class="menubar__zone">';
    h += item(icon('i-search'), '聚焦搜索');
    h += item(icon('i-cc'), '控制中心');
    if (tray && tray.focus) { h += item(icon('i-moon'), T.focus); }
    h += '<span class="menubar__item menubar__clock">' + esc(clock) + '</span>';
    return h + '</div>';
  }
  function sep() { return '<span class="menubar__sep" aria-hidden="true"></span>'; }

  /* 状态迷你栏（04 矩阵 / 05 多屏共用） */
  function miniBarHTML(st, opts) {
    opts = opts || {};
    var zones = [];
    zones.push(sysZoneHTML(st.sys));
    var ime = imeZoneHTML(st.ime); if (ime) { zones.push(ime); }
    var comm = commZoneHTML(st.comm); if (comm) { zones.push(comm); }
    if (st.tools && st.tools.length) {
      zones.push('<div class="menubar__zone">' + st.tools.map(function (t) { return toolItemHTML(t, false); }).join('') + '</div>');
    }
    if (st.chip) {
      zones.push('<div class="ov"><span class="ov__chip">+' + st.chip + '</span></div>');
    }
    zones.push(trayZoneHTML(st.clock, st.tray));
    return '<div class="menubar menubar--mini' + (opts.slim ? ' menubar--slim' : '') + '">' +
      (opts.appMenus
        ? '<div class="menubar__left">' + opts.appMenus.map(function (m, i) {
            return item(i === 0 ? '<span class="menubar__app">' + esc(m) + '</span>' : esc(m));
          }).join('') + '</div>'
        : '<div class="menubar__left"><span class="menubar__item menubar__apple">' + icon('i-apple') + '</span></div>') +
      '<div class="menubar__right">' + zones.join(sep()) + '</div></div>';
  }

  /* ---------- 02 节：现状还原 ---------- */
  function buildLegacyBar() {
    var L = cfg.legacy;
    var left = '<div class="menubar__left">' +
      '<span class="menubar__item menubar__apple">' + icon('i-apple', 'ic--lg') + '</span>' +
      item('<span class="menubar__app">' + esc(L.appName) + '</span>') +
      L.menus.map(function (m) { return item(esc(m)); }).join('') +
      '</div>';
    var right = L.items.map(function (it) {
      if (it.battery) {
        return item(battHTML(it.battery.level, it.battery.color, it.battery.text));
      }
      if (it.text) {
        return item('<span class="menubar__text">' + esc(it.text) + '</span>', null, 'menubar__item--text');
      }
      var sizeCls = it.size === 'lg' ? 'ic--lg' : it.size === 'sm' ? 'ic--sm' : it.size === 'md' ? 'ic--md' : '';
      return item(icon(it.icon, sizeCls));
    }).join('');
    right += item('<span class="menubar__clock">' + esc(L.clock) + '</span>');
    return '<div class="menubar">' + left + '<div class="menubar__right">' + right + '</div></div>';
  }

  /* ---------- 03 节：主交互菜单栏 ---------- */
  function buildMainBar() {
    var sys = cfg.system.battery;
    var left = '<div class="menubar__left">' +
      '<span class="menubar__item menubar__apple">' + icon('i-apple', 'ic--lg') + '</span>' +
      item('<span class="menubar__app">' + esc(T.appName) + '</span>') +
      T.menus.map(function (m) { return item(esc(m)); }).join('') +
      '</div>';
    var zones = [];
    /* 系统区（含幽灵元素） */
    zones.push(
      '<div class="menubar__zone">' +
      item(icon('i-wifi') + anno(cfg.anno.wifi), cfg.system.wifi.tip) +
      item(icon('i-sound'), cfg.system.sound.tip) +
      item(battHTML(sys.level, sys.state === 'charging' ? 'green' : sys.state === 'low' ? 'red' : '', sys.state === 'charging' ? Math.round(sys.level * 100) + '%' : ''), sys.tip) +
      item(battHTML(cfg.ghost.level, 'gray', cfg.ghost.text) + anno(cfg.anno.ghost), cfg.ghost.tip, 'menubar__item--ghost') +
      '</div>'
    );
    /* 输入法区 */
    zones.push(imeZoneHTML('pin'));
    /* 通信区 */
    var c = cfg.comms[0];
    zones.push('<div class="menubar__zone">' +
      item(icon(c.icon) + '<span class="badge">' + fmtBadge(c.unread) + '</span>', c.name + ' · ' + c.unread + ' 条未读') + '</div>');
    /* 工具区（动态） */
    zones.push('<div class="menubar__zone" id="toolsZone"></div>');
    /* 溢出芯片 + 管理面板 */
    zones.push(
      '<div class="ov" id="overflowWrap">' +
      '<button type="button" class="ov__chip" id="overflowChip" aria-haspopup="dialog" aria-expanded="false">+0</button>' +
      '<div class="pop" id="overflowPop" role="dialog" aria-label="' + esc(T.overflowTitle) + '">' +
      '<div class="pop__head"><span>' + esc(T.overflowTitle) + '</span><span class="pop__count" id="popCount"></span></div>' +
      '<div class="pop__list" id="popList"></div>' +
      '<div class="pop__hint" id="popHint" role="alert"></div>' +
      '<div class="pop__foot">' + esc(T.overflowFoot) + '</div>' +
      '</div></div>'
    );
    /* 托盘区 */
    zones.push('<div class="menubar__zone">' +
      item(icon('i-search'), '聚焦搜索') +
      item(icon('i-cc'), '控制中心') +
      '<span class="menubar__item menubar__clock"><span id="clockLive">' + esc(clockNow()) + '</span>' + anno(cfg.anno.clock) + '</span>' +
      '</div>');
    return '<div class="menubar">' + left + '<div class="menubar__right">' + zones.join(sep()) + '</div></div>';
  }

  /* ---------- 04 节：状态矩阵 ---------- */
  function buildMatrix() {
    var byId = {};
    cfg.states.forEach(function (s) { byId[s.id] = s; });
    return cfg.stateGroups.map(function (g) {
      var cards = g.items.map(function (id) {
        var st = byId[id];
        return '<div class="mini">' +
          '<div class="screen"><div class="screen__wall"></div>' + miniBarHTML(st) + '</div>' +
          '<div class="mini__cap"><b>' + esc(st.title) + '</b><span>' + st.desc + '</span></div>' +
          '</div>';
      }).join('');
      return '<div class="mx-group">' +
        '<div class="mx-gtitle">' + esc(g.title) + '<span class="mx-gtitle__sub">' + esc(g.sub) + '</span></div>' +
        '<div class="mx-grid">' + cards + '</div></div>';
    }).join('');
  }

  /* ---------- 05 节：多屏幕 ---------- */
  function stageScreenHTML(s) {
    var st = {
      sys: cfg.system.battery, ime: 'pin', comm: cfg.comms[0].unread,
      tools: cfg.tools.filter(function (t) { return t.pinned; }).map(function (t) { return t.id + (t.status === 'running' ? '*' : ''); }),
      chip: cfg.tools.filter(function (t) { return !t.pinned; }).length + (cfg.comms[0].unread ? 0 : 1),
      tray: { cc: true, focus: false }, clock: clockNow()
    };
    var bar = miniBarHTML(st, { appMenus: s.mode === 'full' ? s.appMenus : null, slim: s.mode === 'slim' });
    var win = s.window
      ? '<div class="win"><div class="win__bar"><span class="win__dots" aria-hidden="true"><i></i><i></i><i></i></span>' + esc(s.window.title) + '</div><div class="win__body">' + s.window.body + '</div></div>'
      : '';
    var dock = s.dock
      ? '<div class="dock">' + ['i-dock-finder', 'i-dock-safari', 'i-wechat', 'i-dock-terminal', 'i-dock-code', 'i-letter-z']
          .map(function (ic, i) {
            var names = ['Finder', 'Safari', '微信', '终端', 'VS Code', 'Zotero'];
            var dks = ['dk--finder', 'dk--safari', 'dk--wechat', 'dk--terminal', 'dk--code', 'dk--zotero'];
            return '<span class="dk ' + dks[i] + '" data-name="' + names[i] + '">' + icon(ic) + '</span>';
          }).join('') + '</div>'
      : '';
    return '<div class="screen screen--tall"><div class="screen__wall"></div>' + bar + win + dock + '</div>';
  }
  function specialHTML(s) {
    var body = '';
    if (s.mode === 'hidden') {
      body = '<div class="screen__hint"><span class="fs-chip">' + esc(s.hint[0]) + '</span><small>' + esc(s.hint[1]) + '</small></div>';
    } else if (s.mode === 'portrait') {
      var zones = [];
      zones.push('<div class="menubar__zone">' + item(battHTML(0.63, '', '63%'), '电池 63%') + '</div>');
      zones.push('<div class="menubar__zone"><span class="menubar__item menubar__clock">' + esc(s.portraitClock) + '</span></div>');
      zones.push('<div class="menubar__zone">' + item(icon('i-cc'), '控制中心') + '</div>');
      body = '<div class="menubar menubar--mini menubar--slim"><div class="menubar__left"><span class="menubar__item menubar__apple">' + icon('i-apple') + '</span></div>' +
        '<div class="menubar__right">' + zones.join(sep()) + '</div></div>';
    } else if (s.mode === 'remote') {
      var q = s.conn.quality;
      var zones2 = [];
      zones2.push('<div class="menubar__zone">' +
        item(icon('i-wifi'), cfg.system.wifi.tip) + item(icon('i-sound'), cfg.system.sound.tip) +
        item(battHTML(cfg.system.battery.level, 'green'), cfg.system.battery.tip) + '</div>');
      zones2.push('<div class="menubar__zone"><span class="menubar__item menubar__conn' + (q === 'warn' ? ' menubar__conn--warn' : '') + '"' +
        tipAttr('UU远程 · 连接质量' + (q === 'good' ? '良好' : q === 'warn' ? '一般' : '差')) + '><span class="conn-dot" aria-hidden="true"></span>' + esc(s.conn.label) + '</span></div>');
      zones2.push('<div class="menubar__zone">' + item(icon('i-cc'), '控制中心') +
        '<span class="menubar__item menubar__clock">' + esc(clockNow()) + '</span></div>');
      body = '<div class="menubar menubar--mini menubar--slim">' +
        '<div class="menubar__left"><span class="menubar__item menubar__apple">' + icon('i-apple') + '</span></div>' +
        '<div class="menubar__right">' + zones2.join(sep()) + '</div></div>';
      if (s.window) {
        body += '<div class="win"><div class="win__bar"><span class="win__dots" aria-hidden="true"><i></i><i></i><i></i></span>' + esc(s.window.title) + '</div><div class="win__body">' + s.window.body + '</div></div>';
      }
    }
    var cls = s.mode === 'portrait' ? 'screen screen--portrait' : 'screen screen--tall';
    return '<div class="' + cls + '"><div class="screen__wall"></div>' + body + '</div>';
  }
  function buildScreens() {
    var stage = cfg.screens.stage.map(function (s) {
      return '<div class="mon mon--' + s.role + '">' +
        '<div class="mon__label"><span class="mon__name">' + esc(s.label) + '</span><span class="mon__chip">' + esc(s.tag) + '</span></div>' +
        stageScreenHTML(s) + '<p class="mon__cap">' + s.cap + '</p></div>';
    }).join('');
    var specials = cfg.screens.specials.map(function (s) {
      return '<div class="mon mon--' + s.role + '">' +
        '<div class="mon__label"><span class="mon__name">' + esc(s.label) + '</span><span class="mon__chip">' + esc(s.tag) + '</span></div>' +
        specialHTML(s) + '<p class="mon__cap">' + s.cap + '</p></div>';
    }).join('');
    return '<div class="multi-stage">' + stage + '</div>' +
      '<div class="mini-row">' + specials + '</div>';
  }

  /* ================= 运行时状态 ================= */
  var state = {
    theme: 'auto',           // auto | dark | light
    density: 'regular',      // regular | compact
    annotations: false,
    pinned: {},              // toolId -> bool
    popOpen: false
  };
  cfg.tools.forEach(function (t) { state.pinned[t.id] = !!t.pinned; });

  function visibleTools() { return cfg.tools.filter(function (t) { return state.pinned[t.id]; }); }
  function hiddenTools() { return cfg.tools.filter(function (t) { return !state.pinned[t.id]; }); }

  /* ================= 交互 ================= */
  var liveTimer = null, toastTimer = null, hintTimer = null;

  function announce(msg) {
    var live = el('mbLive');
    if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 60); }
  }
  function showToast(msg) {
    var t = el('toast');
    if (!t) { return; }
    t.textContent = msg;
    t.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('toast--show'); }, 2400);
  }
  function showHint(msg) {
    var h = el('popHint');
    if (!h) { return; }
    h.textContent = msg;
    h.classList.add('pop__hint--show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { h.classList.remove('pop__hint--show'); }, 2800);
  }

  function renderTools() {
    var zone = el('toolsZone');
    if (zone) {
      zone.innerHTML = visibleTools().map(function (t) { return toolItemHTML(t, true); }).join('');
    }
    var hidden = hiddenTools();
    var chip = el('overflowChip');
    if (chip) {
      chip.textContent = '+' + hidden.length;
      chip.setAttribute('aria-label', T.overflowTitle + '，共 ' + hidden.length + ' 项');
    }
    var wrap = el('overflowWrap');
    if (wrap) { wrap.hidden = hidden.length === 0; }
    var list = el('popList');
    if (list) {
      list.innerHTML = hidden.length
        ? hidden.map(function (t) {
            return '<div class="pop__item">' + icon(t.icon) +
              '<div class="pop__info"><div class="pop__name">' + esc(t.name) + '</div><div class="pop__status">' + esc(t.status) + '</div></div>' +
              '<button type="button" class="pop__pin" data-pin="' + t.id + '" title="' + esc(T.pin) + '" aria-label="' + esc(t.name + ' ' + T.pin) + '">' + icon('i-pinup', 'ic--sm') + '</button></div>';
          }).join('')
        : '<div class="pop__empty">' + esc(T.overflowEmpty) + '</div>';
    }
    var cnt = el('popCount');
    if (cnt) { cnt.textContent = hidden.length + ' 项'; }
  }

  function openPop() {
    var pop = el('overflowPop'), chip = el('overflowChip');
    if (!pop || !chip) { return; }
    /* 边界检测：右溢出时向左翻转 */
    pop.classList.add('pop--open');
    chip.setAttribute('aria-expanded', 'true');
    state.popOpen = true;
    var rect = pop.getBoundingClientRect();
    if (rect.right > (root.innerWidth - 8)) { pop.classList.add('pop--flip'); } else { pop.classList.remove('pop--flip'); }
    var first = pop.querySelector('.pop__pin');
    if (first) { first.focus(); }
  }
  function closePop(focusChip) {
    var pop = el('overflowPop'), chip = el('overflowChip');
    if (pop) { pop.classList.remove('pop--open'); }
    if (chip) {
      chip.setAttribute('aria-expanded', 'false');
      if (focusChip) { chip.focus(); }
    }
    state.popOpen = false;
  }

  function pinTool(id) {
    var t = null;
    for (var i = 0; i < cfg.tools.length; i++) { if (cfg.tools[i].id === id) { t = cfg.tools[i]; break; } }
    if (!t) { return; }
    var max = (cfg.thresholds && cfg.thresholds.maxPinnedTools) || 3;
    if (visibleTools().length >= max) {
      showHint(T.limitHint);
      announce(T.limitHint);
      return;
    }
    state.pinned[id] = true;
    renderTools();
    announce(t.name + ' 已置顶到工具区');
  }
  function unpinTool(id) {
    var t = null;
    for (var i = 0; i < cfg.tools.length; i++) { if (cfg.tools[i].id === id) { t = cfg.tools[i]; break; } }
    if (!t) { return; }
    state.pinned[id] = false;
    renderTools();
    announce(t.name + ' 已' + T.unpin);
  }

  function bindMainMock() {
    var chip = el('overflowChip'), pop = el('overflowPop'), list = el('popList'), zone = el('toolsZone');
    if (!chip) { return; }

    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      state.popOpen ? closePop(true) : openPop();
    });
    document.addEventListener('click', function (e) {
      if (state.popOpen && pop && !pop.contains(e.target) && e.target !== chip && !chip.contains(e.target)) {
        closePop(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.popOpen) { closePop(true); }
      /* 弹层内焦点圈定 */
      if (e.key === 'Tab' && state.popOpen && pop) {
        var f = pop.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) { return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    if (list) {
      list.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-pin]') : null;
        if (btn) { pinTool(btn.getAttribute('data-pin')); }
      });
    }
    if (zone) {
      zone.addEventListener('click', function (e) {
        var it = e.target.closest ? e.target.closest('[data-tool]') : null;
        if (it) { unpinTool(it.getAttribute('data-tool')); }
      });
      zone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var it = e.target.closest ? e.target.closest('[data-tool]') : null;
          if (it) { e.preventDefault(); unpinTool(it.getAttribute('data-tool')); }
        }
      });
    }
  }

  /* ================= 控制条 ================= */
  var mq = root.matchMedia ? root.matchMedia('(prefers-color-scheme: light)') : null;

  function applyTheme() {
    var light = state.theme === 'light' || (state.theme === 'auto' && !!(mq && mq.matches));
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) { screens[i].classList.toggle('screen--light', light); }
    var btns = document.querySelectorAll('[data-theme]');
    for (var j = 0; j < btns.length; j++) {
      btns[j].classList.toggle('seg__btn--active', btns[j].getAttribute('data-theme') === state.theme);
      btns[j].setAttribute('aria-pressed', String(btns[j].getAttribute('data-theme') === state.theme));
    }
  }
  function applyDensity() {
    document.body.classList.toggle('density-compact', state.density === 'compact');
    var btns = document.querySelectorAll('[data-density]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('seg__btn--active', btns[i].getAttribute('data-density') === state.density);
      btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-density') === state.density));
    }
  }
  function applyAnnotations() {
    document.body.classList.toggle('show-anno', state.annotations);
    var btn = el('annoBtn');
    if (btn) {
      btn.textContent = state.annotations ? '隐藏标注' : '显示标注';
      btn.setAttribute('aria-pressed', String(state.annotations));
    }
  }
  function exportConfig() {
    var json = JSON.stringify(cfg, null, 2);
    function ok() { showToast('配置 JSON 已复制到剪贴板'); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = json;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); }
      catch (err) { showToast('复制失败，JSON 已输出到控制台'); if (root.console) { console.log(json); } }
      document.body.removeChild(ta);
    }
    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(json).then(ok, fallback);
    } else { fallback(); }
  }

  function bindControls() {
    var themeBtns = document.querySelectorAll('[data-theme]');
    for (var i = 0; i < themeBtns.length; i++) {
      themeBtns[i].addEventListener('click', function () {
        state.theme = this.getAttribute('data-theme');
        applyTheme();
      });
    }
    var densBtns = document.querySelectorAll('[data-density]');
    for (var j = 0; j < densBtns.length; j++) {
      densBtns[j].addEventListener('click', function () {
        state.density = this.getAttribute('data-density');
        applyDensity();
      });
    }
    var annoBtn = el('annoBtn');
    if (annoBtn) {
      annoBtn.addEventListener('click', function () {
        state.annotations = !state.annotations;
        applyAnnotations();
      });
    }
    var exportBtn = el('exportBtn');
    if (exportBtn) { exportBtn.addEventListener('click', exportConfig); }
    var resetBtn = el('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        cfg.tools.forEach(function (t) { state.pinned[t.id] = !!t.pinned; });
        closePop(false);
        renderTools();
        showToast('演示已重置');
        announce('演示已重置');
      });
    }
    if (mq && mq.addEventListener) {
      mq.addEventListener('change', function () { if (state.theme === 'auto') { applyTheme(); } });
    }
  }

  /* ================= 挂载 ================= */
  /* 注意：#legacyMock / #mainMock 容器内已含 .screen__wall，
     故使用 insertAdjacentHTML 追加，避免覆盖墙体。 */
  function mount() {
    var legacy = el('legacyMock');
    if (legacy) { legacy.insertAdjacentHTML('beforeend', buildLegacyBar() + dockHTML()); }
    var main = el('mainMock');
    if (main) { main.insertAdjacentHTML('beforeend', buildMainBar() + windowHTML(cfg.screens.stage[0].window) + dockHTML()); }
    var matrix = el('matrix');
    if (matrix) { matrix.innerHTML = buildMatrix(); }
    var screens = el('multiscreen');
    if (screens) { screens.innerHTML = buildScreens(); }
    renderTools();
  }
  function dockHTML() {
    return '<div class="dock">' + ['i-dock-finder', 'i-dock-safari', 'i-wechat', 'i-dock-terminal', 'i-dock-code', 'i-letter-z']
      .map(function (ic, i) {
        var names = ['Finder', 'Safari', '微信', '终端', 'VS Code', 'Zotero'];
        var dks = ['dk--finder', 'dk--safari', 'dk--wechat', 'dk--terminal', 'dk--code', 'dk--zotero'];
        return '<span class="dk ' + dks[i] + '" data-name="' + names[i] + '">' + icon(ic) + '</span>';
      }).join('') + '</div>';
  }
  function windowHTML(w) {
    if (!w) { return ''; }
    return '<div class="win"><div class="win__bar"><span class="win__dots" aria-hidden="true"><i></i><i></i><i></i></span>' + esc(w.title) + '</div><div class="win__body">' + w.body + '</div></div>';
  }

  /* 实时时钟（15s 粒度，跨天自动翻转） */
  function startClock() {
    var node = el('clockLive');
    if (!node) { return; }
    function tick() { node.textContent = clockNow(); }
    tick();
    setInterval(tick, 15000);
  }

  /* ================= 初始化 ================= */
  function init() {
    if (!cfg.tools) { if (root.console) { console.error('[MBR] config 缺失，请检查 src/js/config.js'); } return; }
    mount();
    bindControls();
    bindMainMock();
    applyTheme();
    applyDensity();
    applyAnnotations();
    startClock();
  }

  var app = {
    init: init,
    state: state,
    config: cfg,
    /* 纯函数导出（供测试与二次开发） */
    builders: {
      esc: esc, fmtBadge: fmtBadge, clockNow: clockNow,
      buildLegacyBar: buildLegacyBar, buildMainBar: buildMainBar,
      buildMatrix: buildMatrix, buildScreens: buildScreens, miniBarHTML: miniBarHTML
    }
  };
  MBR.app = app;
  return app;
});
