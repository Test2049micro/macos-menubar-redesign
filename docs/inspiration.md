# 同类开源项目调研

> 2026-10-18 · 检索范围：GitHub 与公开评测 · 目的：验证「分区 + 溢出 + 徽标」方案在既有生态中的位置，并提取可借鉴的交互范式

## 1. 项目全景

| 项目 | 许可 | 状态（2026-10） | 核心能力 |
| --- | --- | --- | --- |
| [Bartender 6/7](https://www.macbartender.com/) | 商业（$25 起） | 活跃 | 图标隐藏、触发器、AppleScript、场景预设 |
| [Ice](https://github.com/jordanbaird/Ice) | GPL-3.0 | 停滞（0.11.12，2024-10） | 隐藏/显示、always-hidden 区、搜索、热键 |
| [Thaw](https://github.com/thaw-app/Thaw) | GPL-3.0 | 活跃（Ice 社区分支，约 10k stars） | 悬停/点击/滚动呼出、自动重隐、拖拽重排、刘海机次级栏、搜索、外观定制、配置文件、热键 |
| [Hidden Bar](https://github.com/dwarvesf/hidden) | MIT | 活跃（14k+ stars） | 单击折叠分隔线，极简 |
| [Dozer](https://github.com/Mortennn/Dozer) | MIT | 停止维护（2020 后无发布） | 分组隐藏（⌘+拖曳 + 点击） |
| [OpenBartender](https://github.com/rpsadarangani/OpenBartender) | MIT | 活跃 | 两区（hidden + always-hidden）、悬停预览、无辅助功能权限、分隔线宽度法 |
| [TuckBar](https://tuckbar.com) | 免费（MAS） | 活跃 | 按显示屏整栏隐藏（OLED 烧屏防护） |

## 2. 技术路径（供落地参考）

macOS 不允许应用直接操作其他应用的状态项，业界通用两种手法：

1. **分隔线宽度法**（Hidden Bar / Dozer / OpenBartender）：插入一个自己的状态项作分隔线，将其宽度撑到极大（如 10,000px），把左侧图标挤出屏幕。无需辅助功能权限
2. **私有 API / Accessibility**（Bartender / Ice / Thaw）：直接操纵状态项，能力更强但依赖系统 API，macOS 26/27 已多次变更相关行为（Ice 停滞、Thaw 分叉的主因）

**本项目是设计提案，不涉及任何状态项操纵**；如需落地为工具，建议参考 OpenBartender 的零权限路径或跟踪 Thaw 对 macOS 26/27 的适配。

## 3. 借鉴与对应关系

| 来源项目的做法 | 本方案的对应设计 |
| --- | --- |
| Thaw/Ice 的 always-hidden 区 | 溢出区「+N」芯片 + 管理面板（置顶上限 3 个） |
| Thaw 的菜单栏项搜索 | 管理面板预留搜索位（路线图） |
| Thaw 的配置文件（工作/演示/极简） | 密度两档 + 外观三态（配置化的雏形，路线图：场景预设） |
| Thaw 的自动重隐（auto-rehide） | 面板失焦即关（180ms 过渡） |
| OpenBartender/Hidden Bar 的悬停呼出 | 悬停 120ms 高亮 + 提示（hover peek 的轻量版） |
| Thaw 的刘海次级栏 | 刘海屏规则：避开安全区或双行状态条 |
| TuckBar 的按屏整栏隐藏 | 多屏规则中的「全屏自动隐藏 / OLED 场景」 |
| 系统原生电池语义 | 电池三态（绿+闪电 / 单色 / 红+百分比） |
| Apple HIG 菜单栏章节 | 分区、命中区域、简洁性原则 |

## 4. 差异化定位

既有工具解决「**如何隐藏**」，本项目解决「**如何组织**」：

- 不做隐藏开关，而建立**功能分区**与**优先级规则**（P0/P1/P2）
- 不做图标重排，而统一**视觉语言**（模板图标 + 徽标语义）
- 覆盖既有工具较少系统化处理的场景：**全天候状态矩阵**与**多屏幕行为**

两者互补：本方案可直接作为 Ice/Thaw 类工具的交互与视觉参考，或以「配置驱动的设计规范」形式独立存在。

## 5. 参考链接

- Apple Human Interface Guidelines — [The Menu Bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)
- GitHub — jordanbaird/Ice · thaw-app/Thaw · dwarvesf/hidden · Mortennn/Dozer · rpsadarangani/OpenBartender
- 评测参考：tuckbar.com/blog（Bartender 替代品对比，2026-09）
