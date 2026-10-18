# 问 · macOS 菜单栏重设计

> 一份面向macOS 本机菜单栏（状态栏）的**设计提案 + 可交互原型**：配置驱动、零依赖、可离线运行。

[![License: MIT](https://img.shields.io/badge/License-MIT-3e5bff.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-30d158.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-13%20passed-0a9d62.svg)](scripts/smoke.js)

## 它解决什么问题

真实用户的菜单栏截图呈现出四个结构性问题：

| 问题 | 证据 |
| --- | --- |
| 密度失控 | 右侧 21 个条目并列，第三方图标 16 个 |
| 风格混杂 | 图标 3 种尺寸、字母/图形/文字 3 种形态混排 |
| 状态失效 | 「80% n/a」与「69%」双电池指示并存，其一已失效 |
| 无溢出机制 | 应用随装随加，只能无限变挤 |

## 方案：分区 · 折叠 · 统一 · 徽标

右侧按功能分为**五区**，区间以 1pt 细线 + 8pt 间距分隔：

```
系统区        输入法区   通信区      工具区              托盘区
Wi-Fi 声音 69%  拼      微信●3   Copilot● ChatGPT Claude +7   搜索 控制中心 10月16日 周五 09:26
```

- **溢出折叠**：低优先级工具收入「+N」芯片，点击展开管理面板，支持一键置顶（上限 3 个）
- **统一模板图标**：全部 16pt、同一命中区域，品牌识别交给悬停提示
- **状态即徽标**：运行中 = 呼吸圆点，未读 = 数字徽标（99+ 封顶）
- **全天候**：12 个时候/状态的设计响应（早间/深夜/专注/低电量/任务突发……）
- **多屏幕**：主屏承载应用菜单，副屏为同源状态条；全屏自动隐藏、竖屏顺序收缩、远程会话收敛为连接徽标

**量化效果**：右侧可见条目 21 → 12（-43%），第三方图标 16 → 4（-75%），电池指示 2 处 → 1 处，新增 7 项收纳能力。

## 快速开始

无需安装任何依赖，三种方式任选：

```bash
# 1. 直接打开（推荐）
open index.html            # macOS；Windows 用 start，Linux 用 xdg-open

# 2. 构建单文件分享版
npm run build              # 产出 dist/macos-menubar-redesign.html（零外部引用）

# 3. 运行测试
npm test                   # 13 项冒烟测试：配置完整性 / 渲染输出 / 引用闭合 / 计数一致性
```

## 仓库结构

```
menubar-redesign/
├── index.html              # 页面骨架 + 内联 SVG 符号库
├── src/
│   ├── css/menubar.css     # 设计令牌 + BEM 样式（深/浅外观、密度、降级）
│   ├── js/config.js        # 单一事实源：内容 / 状态 / 屏幕 / i18n / 阈值
│   └── js/app.js           # 渲染与交互（纯函数构建 + DOM 绑定分离）
├── scripts/
│   ├── build.mjs           # 零依赖构建：src → dist 单文件
│   └── smoke.js            # 零依赖冒烟测试
├── docs/
│   ├── design-spec.md      # 设计规范（分区 / 优先级 / 度量 / 交互 / 多屏）
│   ├── architecture.md     # 架构与数据流、如何扩展
│   └── inspiration.md      # 同类开源项目调研与借鉴
├── dist/                   # 构建产物（已提交，便于直接分享）
├── OPTIMIZATIONS.md        # 100 项系统性优化清单
├── CHANGELOG.md
└── LICENSE                 # MIT
```

## 适配你自己的菜单栏

所有内容都在 `src/js/config.js`，改数据即可，无需碰渲染层：

```js
tools: [
  { id: 'copilot', name: 'GitHub Copilot', status: 'running', icon: 'i-copilot', pinned: true },
  //      ↑ id       ↑ 悬停显示的名称   ↑ running=呼吸圆点   ↑ 符号 id   ↑ 是否置顶
]
```

新增一个工具 = 加一行配置；新增一个状态 = 往 `states[]` 加一个声明式对象。详见 [docs/architecture.md](docs/architecture.md)。

## 演示交互

| 操作 | 效果 |
| --- | --- |
| 点击工具区图标 | 收入溢出区 |
| 点击「+N」芯片 | 展开管理面板（Esc 关闭，Tab 焦点圈定） |
| 点击面板中的置顶按钮 | 回到工具区（满 3 个时给出上限提示） |
| 页头「跟随系统/深色/浅色」 | 全部演示同步切换外观 |
| 页头「宽松/紧凑」 | 28pt / 24pt 两档栏高 |
| 页头「导出配置」 | 复制当前配置 JSON |
| 页头「重置演示」 | 恢复初始置顶状态 |

## 文档

- [设计规范](docs/design-spec.md) — 五区定义、P0/P1/P2 优先级、度量令牌、12 状态矩阵、8 项多屏规则
- [架构说明](docs/architecture.md) — 数据流、配置 schema、扩展指南、构建与测试
- [同类项目调研](docs/inspiration.md) — Ice / Thaw / Hidden Bar / Dozer / OpenBartender / TuckBar
- [100 项优化清单](OPTIMIZATIONS.md) — 开源前的系统性优化记录

## 关于本项目的定位

这是一个**设计提案与原型**，不调用任何 macOS 私有 API，不操纵其他应用的状态项。它适合：

- 想重新组织自己菜单栏的团队，作为评审与沟通基线
- 想实现「分区 + 溢出 + 徽标」信息架构的菜单栏管理工具（如 Ice/Thaw 生态），作为交互与视觉参考
- 学习「配置驱动 + 零依赖 + 单文件分发」前端组织方式的练习

若你要实现为真实应用，请阅读 [docs/inspiration.md](docs/inspiration.md) 中关于 NSStatusItem / 分隔线宽度法等技术路径的说明，并关注 macOS 26/27 对菜单栏 API 的变更。

## 致谢

交互范式参考了 [Ice](https://github.com/jordanbaird/Ice) / [Thaw](https://github.com/thaw-app/Thaw)、[Hidden Bar](https://github.com/dwarvesf/hidden)、[Dozer](https://github.com/Mortennn/Dozer)、[OpenBartender](https://github.com/rpsadarangani/OpenBartender) 与 [TuckBar](https://tuckbar.com) 等开源项目；菜单栏基础规范参考 [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)。图标均为示意重绘，不代表官方资源。

## 许可

[MIT](LICENSE) © 2026 问 · MenuBar Redesign Contributors

---

### English Summary

**macOS Menu Bar Redesign** — a configuration-driven, zero-dependency design proposal and interactive prototype that reorganizes the macOS menu bar into five functional zones with overflow collapsing, unified template icons, and status badges. It reduces visible right-side items from 21 to 12 while keeping every function reachable, and documents behavior across 12 time/system states and multi-screen setups. Open `index.html` to explore; run `npm run build` for a single-file shareable build and `npm test` for the smoke tests. MIT licensed.
