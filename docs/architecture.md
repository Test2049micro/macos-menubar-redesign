# 架构说明

## 1. 总览：配置驱动的三层结构

```
┌─────────────────────────────────────────────┐
│ index.html          页面骨架 + 内联 SVG 符号库   │  （结构）
├─────────────────────────────────────────────┤
│ src/css/menubar.css 设计令牌 + BEM 样式          │  （表现）
├─────────────────────────────────────────────┤
│ src/js/config.js    单一事实源：内容/状态/屏幕/i18n │  （数据）
│ src/js/app.js       渲染与交互                    │  （行为）
└─────────────────────────────────────────────┘
```

原则：**渲染层零硬编码**。`app.js` 只消费 `config.js` 的数据；改内容不改代码，改代码不动内容。

## 2. 数据流

```
config.js ──► app.js builders（纯函数，返回 HTML 字符串）
                    │
                    ▼
              index.html 容器挂载
              #legacyMock / #mainMock / #matrix / #multiscreen
                    │
                    ▼
              bindMainMock() / bindControls() 绑定交互
```

- **builders** 是纯函数（无 DOM），可在 Node 中直接测试——`scripts/smoke.js` 即以此做断言
- **mount/bind** 才接触 DOM，`init()` 有守卫：配置缺失时输出明确错误而非白屏
- UMD 包装使 `config.js` / `app.js` 既能在浏览器以 `<script>` 运行（`file:// 直开可用`），也能被 Node `require` 测试

## 3. 配置 Schema（config.js）

```js
{
  meta:      { name, version, license, locale },
  thresholds:{ maxPinnedTools:3, badgeMax:99, gutter:8 },
  anno:      { wifi:1, chip:2, claude:3, copilot:4, ghost:5, clock:6 },
  legacy:    { appName, menus, clock, items:[{icon,size,text}|{battery:{level,color,text}}] },
  system:    { wifi:{tip}, sound:{tip}, battery:{level,state,tip} },
  ime:       { label:'拼', active:true, tip },
  comms:     [{ id, name, icon, unread }],
  tools:     [{ id, name, status:'running'|'idle'|其他, icon, pinned }],
  tray:      { search, controlCenter, clock },
  ghost:     { text, level, tip },                 // 已移除项的幽灵展示
  stateGroups:[{ title, sub, items:[stateId...] }],
  states:    [{ id, title, desc, sys, ime, comm, tools, chip, tray, clock }],
  screens:   { stage:[{role,mode,appMenus,window,dock,cap}], specials:[{role,mode,...}] }
}
```

### 状态对象（states[]）字段

| 字段 | 取值 | 说明 |
| --- | --- | --- |
| `sys` | `{level, color:'green'\|'red'\|'', bolt, tip, showText}` | 系统区电池形态 |
| `ime` | `'pin' \| 'abc' \| null` | 输入法三态（高亮/弱化/隐藏分区） |
| `comm` | 数字 | 未读数；`0` = 通信分区整体隐藏 |
| `tools` | `['copilot*','gpt',...]` | 工具 id 数组，后缀 `*` = 运行中 |
| `chip` | 数字 | 溢出芯片计数 |
| `tray` | `{cc, focus}` | 控制中心与专注模式 |
| `clock` | 字符串 | 该状态的时钟文本 |

## 4. 如何扩展

### 新增一个工具

```js
// config.js → tools
{ id: 'cursor', name: 'Cursor', status: 'idle', icon: 'i-spark', pinned: false }
```

图标需先在 `index.html` 的符号库中定义 `<symbol id="i-xxx">`。冒烟测试会校验引用闭合。

### 新增一个状态场景

```js
// config.js → states
{
  id: 'meeting', title: '会议中 · 10:00',
  desc: '全工具静默：无圆点、无徽标，仅系统与时钟可见。',
  sys: { level: 0.69, color: 'green', bolt: true, tip: '电池 69% · 充电中' },
  ime: 'pin', comm: 0, tools: [], chip: 10,
  tray: { cc: true, focus: true }, clock: '10月16日 周五 10:00'
}
// 并加入 stateGroups 对应组的 items 数组
```

### 新增一块屏幕角色

`screens.specials` 中追加 `{ role, label, tag, mode:'hidden'|'portrait'|'remote'|'full', ... }`，渲染器按 `mode` 分派；新 `mode` 需在 `app.js` 的 `specialHTML()` 中增加分支。

### 切换语言

`config.meta.locale = 'en'`，并补全 `i18n.en` 缺失的键。页面框架文案目前为中文（组件层文案已 i18n 就绪）。

## 5. 主题与密度

- **外观**：`.screen`（深） / `.screen--light`（浅）两组 CSS 变量；页头三态切换，默认 `auto` 跟随 `prefers-color-scheme`
- **密度**：`body.density-compact` 覆盖 `--bar-h / --bar-h-mini / --hit` 三个令牌
- **降级链**：`@supports` 检测 backdrop-filter → `@media (hover:hover)` 限制提示 → `prefers-reduced-motion` → `forced-colors` → `print`

## 6. 构建与测试

```bash
npm run build   # scripts/build.mjs：将 index.html 中
                # <!-- build:css|js path --> 标记内联为 <style>/<script>
                # 产出 dist/macos-menubar-redesign.html（零外部引用，可直接分享）
npm test        # scripts/smoke.js：13 项断言
                #   [1] 配置完整性   [2] 工具函数   [3] 渲染输出
                #   [4] 引用闭合     [5] 置顶计数一致性
```

两个脚本均只使用 Node 原生能力（>=18），无 npm 依赖。

## 7. 目录职责速查

| 路径 | 职责 | 修改频率 |
| --- | --- | --- |
| `src/js/config.js` | 内容数据 | 高（适配自己的菜单栏） |
| `src/js/app.js` | 渲染与交互 | 中 |
| `src/css/menubar.css` | 令牌与样式 | 中 |
| `index.html` | 骨架 + 符号库 | 低 |
| `scripts/` | 构建与测试 | 低 |
| `dist/` | 构建产物（勿手改） | 由 build 生成 |
