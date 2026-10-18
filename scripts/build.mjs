#!/usr/bin/env node
/**
 * 问 · macOS 菜单栏重设计 — 零依赖构建脚本
 * 将 index.html 中的 <!-- build:css|js path --> 标记替换为内联内容，
 * 产出可直接分享的单文件 dist/macos-menubar-redesign.html。
 *
 * 用法：node scripts/build.mjs   （或 npm run build）
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = join(root, 'index.html');

let html = readFileSync(htmlPath, 'utf8');
let inlined = 0;

html = html.replace(/<!-- build:css ([^>]+?) -->[\s\S]*?<!-- endbuild -->/g, (_m, rel) => {
  const css = readFileSync(join(root, rel.trim()), 'utf8');
  inlined++;
  return '<style>\n' + css + '\n</style>';
});

html = html.replace(/<!-- build:js ([^>]+?) -->[\s\S]*?<!-- endbuild -->/g, (_m, rel) => {
  const js = readFileSync(join(root, rel.trim()), 'utf8');
  inlined++;
  return '<script>\n' + js + '\n</script>';
});

const outDir = join(root, 'dist');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'macos-menubar-redesign.html');
writeFileSync(outPath, html);

console.log('[build] inlined blocks:', inlined);
console.log('[build] written:', outPath, `(${(html.length / 1024).toFixed(1)} KB)`);
if (inlined === 0) {
  console.error('[build] 未找到任何构建标记，请检查 index.html');
  process.exit(1);
}
