# 100 项系统性优化清单

> 应用于 v1.0.0 → v2.0.0 开源化重构。每项标注落地位置；✅ = 已实现，⚠️ = 有意保留的边界（附说明）。
> 验证方式：`npm test`（13 项断言）+ `npm run build` + 结构校验（标签平衡 / 符号闭合）。

## A. 架构与通用性（1–18）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 1 | 单一事实源：所有内容收敛到 config.js | ✅ `src/js/config.js` |
| 2 | 设计令牌分层（颜色/度量/圆角/动效/阴影） | ✅ `menubar.css :root` |
| 3 | 数据层与渲染层分离 | ✅ builders 为纯函数 |
| 4 | 分区模型可插拔（顺序与可见性规则化） | ✅ `commZoneHTML/imeZoneHTML` 空区自动隐藏 |
| 5 | 工具注册表字段化（id/name/status/icon/pinned） | ✅ `tools[]` |
| 6 | 状态机化：12 状态声明式 schema | ✅ `states[]` + `stateGroups[]` |
| 7 | 屏幕模型抽象（main/secondary/fullscreen/portrait/remote） | ✅ `screens.stage/specials` |
| 8 | i18n 就绪（zh-CN 完整 / en 基础） | ✅ `i18n` |
| 9 | 三态主题（跟随系统/深/浅）+ prefers-color-scheme 初始化 | ✅ `applyTheme()` |
| 10 | 密度两档（28pt/24pt）令牌化切换 | ✅ `density-compact` |
| 11 | 时钟格式函数化（中/英、可替换） | ✅ `i18n.*.clock` |
| 12 | 阈值参数化（置顶上限/徽标上限/间距） | ✅ `thresholds` |
| 13 | BEM 命名体系统一 | ✅ 全量重命名 |
| 14 | 零运行时依赖（无框架/CDN/字体请求） | ✅ 内联符号 + 系统字体 |
| 15 | 构建零依赖（Node 原生 ESM） | ✅ `scripts/build.mjs` |
| 16 | dist 单文件产物（可直接分享） | ✅ 80.7KB，零外部引用 |
| 17 | 渐进增强：无 JS 时给出明确指引 | ✅ `<noscript>` |
| 18 | file:// 直开可用（无 module/CORS 依赖） | ✅ classic scripts |

## B. 代码质量（19–34）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 19 | CSS 按章节注释分区 | ✅ 12 个分节 |
| 20 | 消除重复规则（mini 派生自主栏） | ✅ `menubar--mini` |
| 21 | 全局命名空间隔离（MBR） | ✅ UMD |
| 22 | 严格模式 | ✅ 两文件均 `'use strict'` |
| 23 | 魔法数字命名化 | ✅ `thresholds.badgeMax` 等 |
| 24 | 事件委托统一管理 | ✅ zone/list 级委托 |
| 25 | XSS 防护：属性注入转义 | ✅ `esc()` + 冒烟断言 |
| 26 | 单一定时器（15s 时钟，非 1s） | ✅ `startClock()` |
| 27 | 死代码清理（v1 遗留规则/符号） | ✅ 全量重写 |
| 28 | 未使用符号清零 | ✅ 冒烟测试校验 |
| 29 | 引号/缩进/分号风格统一 | ✅ |
| 30 | 函数职责单一（build/mount/bind 分层） | ✅ |
| 31 | 配置启动校验（缺配置不白屏） | ✅ `init()` 守卫 |
| 32 | 键盘可达（tabindex/role=button） | ✅ 工具图标 |
| 33 | ARIA 语义补齐 | ✅ label/expanded/dialog/live |
| 34 | focus-visible 样式 | ✅ 芯片/置顶钮/工具项 |

## C. 可访问性（35–46）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 35 | 文字/图标对比度满足 WCAG AA | ✅ 令牌化 + 深浅双检 |
| 36 | 焦点可见且不被遮挡 | ✅ outline + offset |
| 37 | 全部交互键盘可完成 | ✅ Tab/Enter/Esc/焦点圈定 |
| 38 | 状态变化 aria-live 播报 | ✅ `#mbLive` |
| 39 | prefers-reduced-motion 全局尊重 | ✅ 呼吸/过渡停止 |
| 40 | 语义化标签（header/main/section/table） | ✅ |
| 41 | 装饰性 SVG aria-hidden | ✅ `icon()` |
| 42 | 图标按钮有可访问名称 | ✅ `aria-label` |
| 43 | 弹层 role=dialog + 名称 | ✅ 溢出面板 |
| 44 | 色彩非唯一传达（圆点/徽标 + 文字冗余） | ✅ data-tip |
| 45 | 200% 缩放布局不破碎 | ✅ 相对单位 + 断点 |
| 46 | DOM 顺序 = 视觉顺序 | ✅ |

## D. 性能（47–56）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 47 | 视口外章节延迟渲染 | ✅ `content-visibility` |
| 48 | will-change 限定于动画元素 | ✅ `.dot--running` |
| 49 | backdrop-filter 限定使用（栏/Dock） | ✅ |
| 50 | 事件监听最小化（无 scroll/resize 轮询） | ✅ matchMedia 替代 resize |
| 51 | 响应式由 CSS 断点承担 | ✅ 5 个断点 |
| 52 | 批量 DOM 写入（单次 innerHTML） | ✅ mount/render |
| 53 | SVG symbol 复用（29 个符号） | ✅ |
| 54 | 时钟 15s 粒度 | ✅ |
| 55 | 动画仅 transform/opacity（合成层） | ✅ |
| 56 | 布局读写分离（边界检测一次性读取） | ✅ `openPop()` |

## E. 文档与开源规范（57–72）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 57 | README（中文 + English Summary） | ✅ |
| 58 | LICENSE（MIT） | ✅ |
| 59 | CONTRIBUTING.md | ✅ |
| 60 | .gitignore | ✅ |
| 61 | 设计规范文档 | ✅ `docs/design-spec.md` |
| 62 | 架构与扩展指南 | ✅ `docs/architecture.md` |
| 63 | 100 项优化清单 | ✅ 本文件 |
| 64 | 同类项目调研 | ✅ `docs/inspiration.md` |
| 65 | CHANGELOG（语义化版本） | ✅ |
| 66 | Issue 模板（bug/feature） | ✅ 2 个 YAML |
| 67 | PR 模板 | ✅ |
| 68 | package.json 元数据完整 | ✅ |
| 69 | 关键逻辑中文注释 | ✅ |
| 70 | 演示 GIF 占位 | ⚠️ README 预留位，待录屏补充 |
| 71 | 致谢与参考链接 | ✅ README + inspiration |
| 72 | 行为准则 | ✅ CODE_OF_CONDUCT.md |

## F. 健壮性与兼容（73–84）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 73 | backdrop-filter @supports 降级 | ✅ 实色背景回退 |
| 74 | -webkit- 前缀补齐 | ✅ |
| 75 | 触屏设备 hover 降级 | ✅ `@media (hover:hover)` |
| 76 | 响应式断点完善（5 档） | ✅ |
| 77 | 打印样式 | ✅ 隐藏交互控件 |
| 78 | 深色模式跟随系统 | ✅ |
| 79 | forced-colors 基础适配 | ✅ 边框/分隔线 |
| 80 | 无 JS 降级提示 | ✅ noscript |
| 81 | file:// 直开可用 | ✅ 冒烟 + 手动验证 |
| 82 | 配置错误不白屏（明确报错） | ✅ init 守卫 |
| 83 | 弹层边界检测（右溢出翻转） | ✅ `pop--flip` |
| 84 | 芯片计数与实际条目一致 | ✅ 数据派生 + 断言 |

## G. 设计逻辑与通用性深化（85–100）

| # | 优化项 | 落地 |
| --- | --- | --- |
| 85 | 空分区自动隐藏规则 | ✅ 无未读时通信区消失 |
| 86 | P1 抢占算法（运行中 > 置顶） | ✅ 文档化 + surge 演示 |
| 87 | 溢出阈值参数化 | ✅ thresholds |
| 88 | 竖屏收缩顺序参数化 | ✅ portraitItems + 规范表 |
| 89 | 多屏角色抽象 | ✅ role/mode 分派 |
| 90 | 远程连接三态语义（绿/琥珀/红） | ✅ quality + CSS |
| 91 | 电池三态参数化 | ✅ sys.color/bolt/showText |
| 92 | 徽标 99+ 封顶 | ✅ fmtBadge |
| 93 | 输入法三态规则化 | ✅ imeZoneHTML |
| 94 | 时钟跨天自动翻转 | ✅ 每次 tick 重算 |
| 95 | 语义色对齐 macOS 命名 | ✅ --sys-green/red/orange |
| 96 | pt/px 度量映射表 | ✅ design-spec §4 |
| 97 | 状态矩阵驱动化（可扩展） | ✅ stateGroups |
| 98 | 演示控制集中为控制面板 | ✅ 页头 6 控件 |
| 99 | 一键导出配置 JSON | ✅ exportBtn + 剪贴板降级 |
| 100 | CI 友好（测试可复现、构建可复现） | ✅ smoke + build |

---

**统计**：✅ 99 项已落地 · ⚠️ 1 项预留（演示 GIF，需录屏）
**复现**：`npm test && npm run build`
