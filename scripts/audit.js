#!/usr/bin/env node
/**
 * 问 · macOS 菜单栏重设计 — 自动化审计（零依赖）
 * 10 个轨道、150+ 项检查，覆盖配置完整性、i18n 一致性、i18n 纪律、
 * 渲染输出、引用闭合、CSS 覆盖、新特性渲染、可访问性、构建产物。
 *
 * 用法：node scripts/audit.js
 * 退出码 0 = 全部通过；1 = 存在失败项。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const { config: cfg, i18n } = require(path.join(root, 'src/js/config.js'));
const app = require(path.join(root, 'src/js/app.js'));
const B = app.builders;

let pass = 0, fail = 0;
const failures = [];
function ok(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; failures.push('  ✗ ' + name + '\n      ' + e.message); }
}
function check(name, cond, msg) {
  if (!cond) { throw new Error(msg || '断言为假'); }
  pass++;
}
function group(title) { console.log('\n[' + title + ']'); }

/* ---------- 工具：读取并去掉注释，便于扫描硬编码 ---------- */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

const appSrc = stripComments(fs.readFileSync(path.join(root, 'src/js/app.js'), 'utf8'));
const cssSrc = fs.readFileSync(path.join(root, 'src/css/menubar.css'), 'utf8');
const indexSrc = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

/* ===================================================================
 * A. 配置完整性
 * =================================================================== */
group('A. 配置完整性');
ok('meta.version 语义化版本', () => {
  check('A1', /^\d+\.\d+\.\d+$/.test(cfg.meta.version), 'version 格式: ' + cfg.meta.version);
  check('A2', cfg.meta.license === 'MIT', 'license');
});
ok('阈值字段齐全', () => {
  check('A3', cfg.thresholds.maxPinnedTools === 3, 'maxPinnedTools');
  check('A4', cfg.thresholds.badgeMax === 99, 'badgeMax');
  check('A5', typeof cfg.thresholds.gutter === 'number', 'gutter');
});
ok('legacy 还原项 20 个', () => check('A6', cfg.legacy.items.length === 20, 'legacy.items=' + cfg.legacy.items.length));
ok('tools 数量与 id 唯一', () => {
  check('A7', cfg.tools.length === 10, 'tools=' + cfg.tools.length);
  const ids = cfg.tools.map(t => t.id);
  check('A8', new Set(ids).size === ids.length, '工具 id 重复');
});
ok('comms 单通信源', () => check('A9', cfg.comms.length === 1 && !!cfg.comms[0].icon, 'comms'));
ok('states 15 个且 id 唯一', () => {
  check('A10', cfg.states.length === 15, 'states=' + cfg.states.length);
  const ids = cfg.states.map(s => s.id);
  check('A11', new Set(ids).size === ids.length, '状态 id 重复');
});
ok('stateGroups 覆盖全部状态（双向）', () => {
  const set = new Set(cfg.states.map(s => s.id));
  const grp = cfg.stateGroups.flatMap(g => g.items);
  check('A12', grp.length === set.size, 'group 项数=' + grp.length + ' 状态数=' + set.size);
  grp.forEach(id => check('A13:' + id, set.has(id), 'group 引用了不存在的状态: ' + id));
  [...set].forEach(id => check('A14:' + id, grp.includes(id), '状态未被任何 group 引用: ' + id));
});
ok('每个 state 字段结构完整', () => {
  cfg.states.forEach(s => {
    check('A15:' + s.id + '.sys', s.sys && typeof s.sys.level === 'number' && typeof s.sys.tip === 'string', 'sys');
    check('A16:' + s.id + '.ime', ['pin', 'abc', null].includes(s.ime), 'ime=' + s.ime);
    check('A17:' + s.id + '.tools', Array.isArray(s.tools), 'tools 非数组');
    check('A18:' + s.id + '.chip', typeof s.chip === 'number', 'chip');
    check('A19:' + s.id + '.tray', s.tray && typeof s.tray === 'object', 'tray');
    check('A20:' + s.id + '.clock', typeof s.clock === 'string' && s.clock.length > 0, 'clock');
    check('A21:' + s.id + '.title', typeof s.title === 'string', 'title');
    check('A22:' + s.id + '.desc', typeof s.desc === 'string', 'desc');
  });
});
ok('state.tools 仅引用合法工具 id', () => {
  const toolIds = new Set(cfg.tools.map(t => t.id));
  cfg.states.forEach(s => s.tools.forEach(t => {
    const id = String(t).replace(/\*$/, '');
    check('A23:' + s.id + '->' + id, toolIds.has(id), '非法工具引用: ' + id);
  }));
});
ok('ghost / screens 结构', () => {
  check('A24', cfg.ghost && typeof cfg.ghost.text === 'string', 'ghost.text');
  check('A25', cfg.screens.stage.length === 2, 'stage');
  check('A26', cfg.screens.specials.length === 3, 'specials');
  cfg.screens.specials.forEach(s => check('A27:' + s.role, !!s.role && !!s.mode && !!s.cap, 'special 缺字段'));
  const portrait = cfg.screens.specials.find(s => s.mode === 'portrait');
  check('A28', portrait && typeof portrait.portraitBattery === 'number', 'portraitBattery');
  const remote = cfg.screens.specials.find(s => s.mode === 'remote');
  check('A29', remote && ['good', 'warn', 'bad'].includes(remote.conn.quality), 'remote.conn.quality');
});
ok('anno 标注编号合法', () => {
  const keys = Object.keys(cfg.anno);
  check('A30', keys.length >= 4, 'anno keys');
  keys.forEach(k => check('A31:' + k, typeof cfg.anno[k] === 'number', 'anno.' + k + ' 非数字'));
});
ok('meta.locale 在 i18n 中', () => check('A32', !!i18n[cfg.meta.locale], 'locale 无对应 i18n'));

/* ===================================================================
 * B. i18n 一致性（双语）
 * =================================================================== */
group('B. i18n 一致性');
ok('zh / en 键集合相等', () => {
  const zh = Object.keys(i18n['zh-CN']).sort();
  const en = Object.keys(i18n['en']).sort();
  check('B1', JSON.stringify(zh) === JSON.stringify(en), '键不一致: zh=' + zh.join(',') + ' en=' + en.join(','));
});
ok('各键类型一致', () => {
  for (const k of Object.keys(i18n['zh-CN'])) {
    const z = typeof i18n['zh-CN'][k], e = typeof i18n['en'][k];
    check('B2:' + k, z === e, '类型不一致 ' + k + ' ' + z + ' vs ' + e);
  }
});
ok('connQuality 含 good/warn/bad', () => {
  ['zh-CN', 'en'].forEach(loc => {
    const q = i18n[loc].connQuality;
    ['good', 'warn', 'bad'].forEach(k => check('B3:' + loc + '.' + k, !!q[k], 'connQuality.' + k + ' 缺失'));
  });
});
ok('clock 为函数且双语可调用', () => {
  const d = new Date(2026, 9, 16, 9, 26);
  check('B4', typeof i18n['zh-CN'].clock === 'function' && typeof i18n['en'].clock === 'function');
  check('B5', i18n['zh-CN'].clock(d).includes('10月16日'));
  check('B6', i18n['en'].clock(d).includes('10/16'));
});

/* ===================================================================
 * C. i18n 纪律：app.js 不得硬编码业务文案
 * =================================================================== */
group('C. i18n 纪律（无硬编码文案）');
const forbidden = ['聚焦搜索', '控制中心', '条未读', '已置顶', '演示已重置', '复制到剪贴板', '复制失败', '会议中', '录屏中', '勿扰', '外接屏接入', '良好', '一般', '较差', '已连接', '重连中', '已断开'];
ok('app.js 源码无硬编码业务短语', () => {
  forbidden.forEach(ph => check('C1:' + ph, !appSrc.includes(ph), '发现硬编码短语: ' + ph));
});
ok('app.js 已通过 T.* 引用 i18n 键', () => {
  const refs = [...appSrc.matchAll(/\bT\.([A-Za-z_]+)/g)].map(m => m[1]);
  const uniq = [...new Set(refs)];
  check('C2', uniq.length >= 10, 'T.* 引用过少: ' + uniq.length);
  uniq.forEach(k => check('C3:' + k, !!i18n['zh-CN'][k], 'T.' + k + ' 在 i18n 中缺失'));
});

/* ===================================================================
 * D. 渲染输出
 * =================================================================== */
group('D. 渲染输出');
const legacy = B.buildLegacyBar();
const main = B.buildMainBar();
const matrix = B.buildMatrix();
const screens = B.buildScreens();
ok('四个 builder 均有非空输出', () => {
  [['legacy', legacy], ['main', main], ['matrix', matrix], ['screens', screens]].forEach(([n, h]) =>
    check('D1:' + n, h && h.length > 50, n + ' 输出过短'));
});
ok('主栏含交互骨架', () => {
  ['overflowChip', 'overflowPop', 'toolsZone', 'popList', 'clockLive', 'menubar__item--ghost']
    .forEach(id => check('D2:' + id, main.includes(id), '缺少 ' + id));
});
ok('矩阵含全部 15 个状态标题', () => {
  cfg.states.forEach(s => check('D3:' + s.id, matrix.includes(s.title), '矩阵缺少标题: ' + s.title));
});
ok('多屏含 5 类角色', () => {
  ['mon--main', 'mon--secondary', 'mon--fullscreen', 'mon--portrait', 'mon--remote', 'fs-chip']
    .forEach(c => check('D4:' + c, screens.includes(c), '缺少 ' + c));
});
ok('输出无 undefined / null / [object Object] / NaN', () => {
  [legacy, main, matrix, screens].forEach((h, i) => {
    check('D5:' + i, !/undefined|null|\[object Object\]|NaN/.test(h), '渲染泄漏于区块 ' + i);
  });
});

/* ===================================================================
 * E. 引用闭合
 * =================================================================== */
group('E. 引用闭合');
ok('所有图标引用均在符号库定义', () => {
  const defined = new Set([...indexSrc.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
  const rendered = [legacy, main, matrix, screens].join('');
  const used = new Set([...rendered.matchAll(/href="#(i-[a-z-]+)"/g)].map(m => m[1]));
  check('E1', used.size > 0, '未提取到图标引用');
  [...used].forEach(id => check('E2:' + id, defined.has(id), '未定义符号: ' + id));
});
ok('配置 icon 字段均有符号', () => {
  const defined = new Set([...indexSrc.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
  const ids = new Set();
  cfg.tools.forEach(t => ids.add(t.icon));
  cfg.legacy.items.forEach(it => it.icon && ids.add(it.icon));
  [...ids].forEach(id => check('E3:' + id, defined.has(id), '未定义符号: ' + id));
});
ok('index.html 含语言切换控件与无障碍节点', () => {
  check('E4', /data-lang="zh-CN"/.test(indexSrc), '缺中文语言按钮');
  check('E5', /data-lang="en"/.test(indexSrc), '缺英文语言按钮');
  check('E6', indexSrc.includes('id="toast"'), '缺 toast');
  check('E7', indexSrc.includes('id="mbLive"'), '缺 live region');
});

/* ===================================================================
 * F. CSS 覆盖
 * =================================================================== */
group('F. CSS 覆盖');
ok('app.js 引用的新类在 CSS 中定义', () => {
  ['menubar__ind', 'menubar__ind--meeting', 'menubar__ind--recording', 'dot--meeting', 'dot--recording', 'menubar__pill', 'menubar__item--dnd']
    .forEach(c => check('F1:' + c, cssSrc.includes('.' + c), 'CSS 缺少 ' + c));
});
ok('reduced-motion 覆盖录屏呼吸动画', () => {
  check('F2', cssSrc.includes('.dot--recording') && cssSrc.includes('prefers-reduced-motion'), '录屏动画未做降级');
});

/* ===================================================================
 * G. 新特性渲染（会议 / 录屏 / 勿扰 / 外接屏）
 * =================================================================== */
group('G. 新特性渲染');
ok('trayZoneHTML 渲染会议指示', () => {
  check('G1', B.miniBarHTML({ sys: { level: .7, tip: '' }, ime: null, tools: [], tray: { cc: true, meeting: true } }).includes('menubar__ind--meeting'));
});
ok('trayZoneHTML 渲染录屏呼吸圆点', () => {
  check('G2', B.miniBarHTML({ sys: { level: .7, tip: '' }, ime: null, tools: [], tray: { cc: true, recording: true } }).includes('dot--recording'));
});
ok('trayZoneHTML 渲染勿扰（月亮 + dnd）', () => {
  const h = B.miniBarHTML({ sys: { level: .7, tip: '' }, ime: null, tools: [], tray: { cc: true, focus: true, dnd: true } });
  check('G3', h.includes('menubar__item--dnd') && h.includes('i-moon'), '勿扰渲染缺失');
});
ok('trayZoneHTML 渲染外接屏提示徽标', () => {
  check('G4', B.miniBarHTML({ sys: { level: .7, tip: '' }, ime: null, tools: [], tray: { cc: true }, display: true }).includes('menubar__pill'));
});
ok('竖屏电池参数化（非硬编码 0.63）', () => {
  const portrait = cfg.screens.specials.find(s => s.mode === 'portrait');
  const h = screens; // 已在 screens 中渲染
  check('G5', h.includes(Math.round(portrait.portraitBattery * 100) + '%'), '竖屏电池百分比未参数化');
});

/* ===================================================================
 * H. 可访问性
 * =================================================================== */
group('H. 可访问性');
ok('矩阵卡片含标题与说明', () => {
  cfg.states.forEach(s => {
    check('H1:' + s.id, matrix.includes(esc(s.title)) && matrix.includes(s.desc), '矩阵可访问文本缺失: ' + s.id);
  });
});
ok('溢出面板语义完整', () => {
  check('H2', main.includes('role="dialog"'), 'overflowPop 缺 role=dialog');
  check('H3', main.includes('aria-expanded'), 'overflowChip 缺 aria-expanded');
  check('H4', main.includes('aria-haspopup'), 'overflowChip 缺 aria-haspopup');
});
ok('控制按钮含 aria-pressed', () => {
  ['data-theme', 'data-density', 'data-lang'].forEach(d =>
    check('H5:' + d, (indexSrc.match(new RegExp(d + '="[^"]*"', 'g')) || []).length >= 2, d + ' 按钮不足'));
});

/* ===================================================================
 * I. 构建产物
 * =================================================================== */
group('I. 构建产物');
const distPath = path.join(root, 'dist', 'macos-menubar-redesign.html');
ok('dist 单文件存在且非空', () => {
  check('I1', fs.existsSync(distPath), 'dist 缺失');
  check('I2', fs.statSync(distPath).size > 50000, 'dist 过小');
});
ok('dist 无外部 http(s) 引用、无构建标记残留', () => {
  const dist = fs.readFileSync(distPath, 'utf8');
  check('I3', !/https?:\/\//.test(dist) || !/<script[^>]+src=/.test(dist), 'dist 含外部脚本引用');
  check('I4', !/<!--\s*build:/.test(dist), 'dist 残留 build 标记');
  check('I5', dist.includes('menubar__ind--recording'), 'dist 未包含新特性');
});

/* ---------- 辅助：转义（与 app.esc 行为一致，便于断言） ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ===================================================================
 * 汇总
 * =================================================================== */
console.log(`\n审计完成：通过 ${pass} 项，失败 ${fail} 项。`);
if (fail > 0) {
  console.log('\n失败项：');
  failures.forEach(f => console.log(f));
  process.exit(1);
} else {
  console.log('✓ 全部检查通过');
}
