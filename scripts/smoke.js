#!/usr/bin/env node
/**
 * 问 · macOS 菜单栏重设计 — 冒烟测试（零依赖）
 * 校验配置完整性、渲染纯函数输出、图标引用闭合、置顶计数一致性。
 * 用法：node scripts/smoke.js   （或 npm test）
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const { config: cfg, i18n } = require(path.join(root, 'src/js/config.js'));
const app = require(path.join(root, 'src/js/app.js'));
const B = app.builders;

let passed = 0;
function ok(name, fn) {
  fn();
  passed++;
  console.log('  ✓ ' + name);
}

console.log('\n[1] 配置完整性');
ok('meta 与阈值', () => {
  assert.strictEqual(cfg.meta.version, '2.1.0');
  assert.strictEqual(cfg.thresholds.maxPinnedTools, 3);
  assert.strictEqual(cfg.thresholds.badgeMax, 99);
});
ok('数据规模', () => {
  assert.strictEqual(cfg.legacy.items.length, 20, 'legacy items');
  assert.strictEqual(cfg.tools.length, 10, 'tools');
  assert.strictEqual(cfg.states.length, 15, 'states');
  assert.strictEqual(cfg.comms.length, 1);
  const total = cfg.stateGroups.reduce((n, g) => n + g.items.length, 0);
  assert.strictEqual(total, cfg.states.length, 'stateGroups 覆盖全部状态');
});
ok('i18n 双语时钟', () => {
  const d = new Date(2026, 9, 16, 9, 26);
  assert.ok(i18n['zh-CN'].clock(d).includes('10月16日'));
  assert.ok(i18n['en'].clock(d).includes('10/16'));
});

console.log('\n[2] 工具函数');
ok('HTML 转义', () => {
  assert.strictEqual(B.esc('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});
ok('徽标上限 99+', () => {
  assert.strictEqual(B.fmtBadge(3), '3');
  assert.strictEqual(B.fmtBadge(150), '99+');
});

console.log('\n[3] 渲染输出');
ok('现状栏包含关键元素', () => {
  const html = B.buildLegacyBar();
  assert.ok(html.includes('80% n/a'), '失效电池');
  assert.ok(html.includes('Fri Oct 16 9:26 AM'), '原始时钟');
  assert.ok(html.includes('网易UU远程'), '应用名');
});
ok('主菜单栏包含交互骨架', () => {
  const html = B.buildMainBar();
  ['overflowChip', 'overflowPop', 'toolsZone', 'popList', 'clockLive', 'menubar__item--ghost']
    .forEach(id => assert.ok(html.includes(id), id));
});
ok('状态矩阵渲染 15 张卡片 / 4 组', () => {
  const html = B.buildMatrix();
  assert.strictEqual((html.match(/class="mini"/g) || []).length, 15);
  assert.strictEqual((html.match(/class="mx-group"/g) || []).length, 4);
});
ok('多屏幕渲染 5 个角色', () => {
  const html = B.buildScreens();
  ['mon--main', 'mon--secondary', 'mon--fullscreen', 'mon--portrait', 'mon--remote', 'fs-chip']
    .forEach(cls => assert.ok(html.includes(cls), cls));
});

console.log('\n[4] 引用闭合');
ok('所有图标引用均在符号库中定义', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const defined = new Set([...indexHtml.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
  const rendered = [
    B.buildLegacyBar(), B.buildMainBar(), B.buildMatrix(), B.buildScreens()
  ].join('');
  const used = new Set([...rendered.matchAll(/href="#(i-[a-z-]+)"/g)].map(m => m[1]));
  assert.ok(used.size > 0, '未提取到图标引用');
  used.forEach(id => assert.ok(defined.has(id), '未定义符号: ' + id));
});
ok('配置中的 icon 字段均有对应符号', () => {
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const defined = new Set([...indexHtml.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]));
  const ids = new Set();
  cfg.tools.forEach(t => ids.add(t.icon));
  cfg.legacy.items.forEach(it => it.icon && ids.add(it.icon));
  ids.forEach(id => assert.ok(defined.has(id), '未定义符号: ' + id));
});

console.log('\n[5] 置顶计数一致性');
ok('默认置顶 3 个 → 芯片 +7', () => {
  const visible = cfg.tools.filter(t => t.pinned);
  const hidden = cfg.tools.filter(t => !t.pinned);
  assert.strictEqual(visible.length, 3);
  assert.strictEqual(hidden.length, 7);
  assert.strictEqual(visible.length, cfg.thresholds.maxPinnedTools);
});
ok('pin/unpin 状态机', () => {
  const before = Object.keys(app.state.pinned).length;
  assert.strictEqual(before, cfg.tools.length);
  assert.strictEqual(app.state.pinned.copilot, true);
  assert.strictEqual(app.state.pinned.cat, false);
});

console.log(`\n冒烟测试通过：${passed} 项全部 ✓\n`);
