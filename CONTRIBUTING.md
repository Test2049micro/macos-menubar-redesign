# 贡献指南

感谢你愿意参与「问 · macOS 菜单栏重设计」。本项目零依赖、纯静态，参与门槛很低。

## 本地开发

```bash
git clone https://github.com/Test2049micro/macos-menubar-redesign.git
cd macos-menubar-redesign
open index.html        # 直接浏览原型（无需构建）
npm test               # 提交前必跑：13 项冒烟测试
npm run build          # 需要更新 dist/ 单文件时运行
```

## 你可以贡献什么

| 类型 | 示例 | 入口文件 |
| --- | --- | --- |
| 设计内容 | 新的状态场景、新的分区规则、文案修订 | `src/js/config.js` + `docs/design-spec.md` |
| 交互与渲染 | 弹层行为、键盘支持、新组件 | `src/js/app.js` |
| 视觉令牌 | 间距、圆角、系统色对齐 | `src/css/menubar.css` 的 `:root` |
| 文档与翻译 | en 文案补全、规范澄清 | `src/js/config.js` 的 `i18n` + `docs/` |
| 工程 | 测试用例、构建脚本、CI | `scripts/` |

## 三条核心约定

1. **数据与渲染分离**：任何菜单栏内容（工具、状态、屏幕）只进 `src/js/config.js`，不要在 `app.js` 里硬编码。
2. **零依赖**：不引入框架、CDN、npm 运行时依赖；构建与测试脚本只用 Node 原生能力。
3. **可访问性不降级**：新增交互必须可键盘触达；纯装饰元素加 `aria-hidden`；动效遵守 `prefers-reduced-motion`。

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 新增「会议中」状态场景
fix: 修复浅色外观下分隔线对比度不足
docs: 补充竖屏收缩顺序说明
refactor: 将电池渲染提取为纯函数
test: 增加配置 schema 断言
chore: 更新 dist 构建产物
```

## Pull Request 流程

1. Fork 并基于 `main` 创建分支（`feat/xxx`、`fix/xxx`）
2. 完成修改，确保 `npm test` 通过
3. 若改动会影响单文件产物，运行 `npm run build` 并一并提交 `dist/`
4. 提交 PR，填写模板：动机 / 改动点 / 验证方式 / 是否影响配置 schema

## 报告问题

- 交互或渲染异常 → 使用 Bug 模板，附浏览器与外观（深/浅）
- 设计提案 → 使用 Feature 模板，说明场景与预期行为
- 安全问题 → 请勿公开提交，先私信维护者

## 行为准则

参与本项目即表示你遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。
