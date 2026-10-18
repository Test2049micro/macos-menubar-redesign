/*!
 * 问 · macOS 菜单栏重设计 — 配置（单一事实源）
 * ------------------------------------------------------------------
 * 本文件是原型的唯一数据源：菜单栏内容、状态矩阵、多屏幕配置全部在此定义。
 * 渲染层（src/js/app.js）只消费数据，不硬编码任何业务内容。
 * 适配您自己的菜单栏：只需修改本文件中的 tools / comms / system / states / screens。
 *
 * 许可：MIT
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.MBR = root.MBR || {};
  for (var k in api) { root.MBR[k] = api[k]; }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var ZH = 'zh-CN';

  /* ================= i18n 文案表 ================= */
  var i18n = {
    'zh-CN': {
      appName: '网易UU远程',
      menus: ['窗口'],
      running: '运行中',
      idle: '空闲',
      charging: '充电中',
      discharging: '电池供电',
      low: '电量低',
      focus: '专注模式已开启',
      connected: '已连接',
      reconnecting: '重连中',
      lost: '已断开',
      imeActive: '中文输入',
      imeIdle: '英文输入',
      overflowTitle: '已折叠的工具',
      overflowEmpty: '所有工具均已在菜单栏显示',
      overflowFoot: '在「系统设置 › 菜单栏」中可统一管理；工具区置顶上限 3 个。',
      pin: '置顶到工具区',
      unpin: '收入溢出区',
      limitHint: '工具区最多置顶 3 个，请先将一个图标收入溢出区',
      clock: function (d) {
        var wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
        function p(n) { return (n < 10 ? '0' : '') + n; }
        return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + wd + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
      }
    },
    'en': {
      appName: 'UU Remote',
      menus: ['Window'],
      running: 'Running',
      idle: 'Idle',
      charging: 'Charging',
      discharging: 'On battery',
      low: 'Low battery',
      focus: 'Focus on',
      connected: 'Connected',
      reconnecting: 'Reconnecting',
      lost: 'Disconnected',
      imeActive: 'Chinese input',
      imeIdle: 'English input',
      overflowTitle: 'Collapsed items',
      overflowEmpty: 'All items are visible',
      overflowFoot: 'Manage everything in System Settings > Menu Bar. Tool zone pins up to 3.',
      pin: 'Pin to tool zone',
      unpin: 'Collapse',
      limitHint: 'Tool zone holds 3 pins. Collapse one first.',
      clock: function (d) {
        var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
        function p(n) { return (n < 10 ? '0' : '') + n; }
        var h = d.getHours();
        return wd + ' ' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(h) + ':' + p(d.getMinutes());
      }
    }
  };

  /* ================= 主配置 ================= */
  var config = {

    meta: {
      name: '问 · macOS 菜单栏重设计',
      version: '2.0.0',
      license: 'MIT',
      locale: ZH
    },

    /* 全局阈值（参数化，便于适配） */
    thresholds: {
      maxPinnedTools: 3,   // 工具区置顶上限
      badgeMax: 99,        // 未读徽标上限，超出显示 99+
      gutter: 8            // 区间距（pt 语义）
    },

    /* 标注编号（与 03 节图例对应） */
    anno: { wifi: 1, chip: 2, claude: 3, copilot: 4, ghost: 5, clock: 6 },

    /* ---------- 现状（截图还原，用于 02 节对比） ---------- */
    legacy: {
      appName: '网易UU远程',
      menus: ['窗口'],
      clock: 'Fri Oct 16 9:26 AM',
      items: [
        { icon: 'i-tag', size: 'sm', text: '额度' },
        { icon: 'i-copilot', size: 'md' },
        { icon: 'i-monitor', size: 'sm' },
        { icon: 'i-gpt', size: 'lg' },
        { icon: 'i-claude', size: 'md' },
        { icon: 'i-letter-s', size: 'sm' },
        { icon: 'i-letter-m', size: 'sm' },
        { icon: 'i-branch', size: 'md' },
        { icon: 'i-cat', size: 'md' },
        { text: '拼', size: 'text' },
        { battery: { level: 0.8, color: 'gray', text: '80% n/a' } },
        { icon: 'i-fork', size: 'sm' },
        { icon: 'i-smile', size: 'md' },
        { icon: 'i-spark', size: 'sm' },
        { icon: 'i-letter-w', size: 'sm' },
        { battery: { level: 0.69, color: 'green', text: '69%' } },
        { icon: 'i-wechat', size: 'md' },
        { icon: 'i-cc', size: 'md' },
        { icon: 'i-code', size: 'sm' },
        { icon: 'i-switch', size: 'sm' }
      ]
    },

    /* ---------- 重新设计：主菜单栏（03 节交互演示） ---------- */
    system: {
      wifi: { tip: 'Wi-Fi · HomeStudio_5G' },
      sound: { tip: '声音 · 60%' },
      battery: { level: 0.69, state: 'charging', tip: '电池 69% · 充电中' }
    },
    ime: { label: '拼', active: true, tip: '输入法：拼音（仅中文输入时高亮）' },
    comms: [
      { id: 'wechat', name: '微信', icon: 'i-wechat', unread: 3 }
    ],
    tools: [
      { id: 'copilot', name: 'GitHub Copilot', status: 'running', icon: 'i-copilot', pinned: true },
      { id: 'gpt', name: 'ChatGPT', status: 'idle', icon: 'i-gpt', pinned: true },
      { id: 'claude', name: 'Claude', status: 'idle', icon: 'i-claude', pinned: true },
      { id: 'cat', name: 'GitHub Desktop', status: '2 个通知', icon: 'i-cat', pinned: false },
      { id: 'sm', name: 'Sublime Merge', status: '空闲', icon: 'i-letter-s', pinned: false },
      { id: 'mistral', name: 'Mistral', status: '已连接', icon: 'i-letter-m', pinned: false },
      { id: 'branch', name: 'Git 分支', status: 'main', icon: 'i-branch', pinned: false },
      { id: 'fork', name: 'Fork', status: '3 个待合并', icon: 'i-fork', pinned: false },
      { id: 'monitor', name: '显示设置', status: '外接 1 台显示器', icon: 'i-monitor', pinned: false },
      { id: 'smile', name: '表情工具', status: '空闲', icon: 'i-smile', pinned: false }
    ],
    tray: { search: true, controlCenter: true, clock: true },
    /* 已移除的失效项（保留为幽灵元素，用于设计叙事） */
    ghost: { text: '80% n/a', level: 0.8, tip: '已移除：失效的重复电池指示器（80% n/a）' },

    /* ---------- 全天候状态矩阵（04 节） ----------
     * schema:
     *   sys   { level, color:'green'|'red'|'', bolt, tip, showText }
     *   ime   'pin'（中文高亮） | 'abc'（英文弱化） | null（隐藏分区）
     *   comm  未读数，0 表示隐藏通信分区
     *   tools 工具 id 数组，后缀 '*' 表示运行中
     *   chip  溢出芯片数字
     *   tray  { cc, focus }
     */
    stateGroups: [
      { title: '一天中的不同时候', sub: '时钟格式 · 专注模式 · 日期翻转', items: ['morning', 'afternoon', 'evening', 'night'] },
      { title: '任务与通知状态', sub: '运行圆点 · 未读徽标 · 自动置顶', items: ['idle', 'concurrent', 'surge'] },
      { title: '系统与容量状态', sub: '电池三态 · 应用增长', items: ['charging', 'discharging', 'low', 'growth'] }
    ],
    states: [
      {
        id: 'morning', title: '早间 · 周五 09:26',
        desc: '与截图同时刻的标准状态：系统三件套、3 个置顶工具、中文紧凑时钟。',
        sys: { level: 0.69, color: 'green', bolt: true, tip: '电池 69% · 充电中' },
        ime: 'pin', comm: 3, tools: ['copilot*', 'gpt', 'claude'], chip: 7,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 09:26'
      },
      {
        id: 'afternoon', title: '午后 · 周五 15:03',
        desc: '双任务并发：Copilot 与 ChatGPT 同时运行，圆点并列，不增加任何文字噪音。',
        sys: { level: 0.74, color: 'green', bolt: true, tip: '电池 74% · 充电中' },
        ime: 'pin', comm: 3, tools: ['copilot*', 'gpt*', 'claude'], chip: 7,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 15:03'
      },
      {
        id: 'evening', title: '晚间 · 周五 21:47',
        desc: '专注模式开启：月亮图标出现在托盘区；工具全部空闲，布局不因时间而改变。',
        sys: { level: 0.81, color: 'green', bolt: true, tip: '电池 81% · 充电中' },
        ime: 'pin', comm: 3, tools: ['copilot', 'gpt', 'claude'], chip: 7,
        tray: { cc: true, focus: true }, clock: '10月16日 周五 21:47'
      },
      {
        id: 'night', title: '深夜 · 周六 02:15',
        desc: '日期自动翻转；过夜任务保留运行圆点；无未读时通信区与分隔线自动隐藏。',
        sys: { level: 0.63, color: '', bolt: false, tip: '电池 63%' },
        ime: 'abc', comm: 0, tools: ['copilot*'], chip: 9,
        tray: { cc: true, focus: true }, clock: '10月17日 周六 02:15'
      },
      {
        id: 'idle', title: '全部空闲 · 11:20',
        desc: '无运行、无未读：圆点与徽标全部消失，微信因无未读收入溢出区。',
        sys: { level: 0.69, color: 'green', bolt: true, tip: '电池 69% · 充电中' },
        ime: 'pin', comm: 0, tools: ['copilot', 'gpt', 'claude'], chip: 8,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 11:20'
      },
      {
        id: 'concurrent', title: '多任务并发 · 14:35',
        desc: '脱离电源后电池恢复单色；三个工具两个在运行，视觉密度仍不增加。',
        sys: { level: 0.52, color: '', bolt: false, tip: '电池 52%' },
        ime: 'pin', comm: 3, tools: ['copilot*', 'gpt*', 'claude'], chip: 7,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 14:35'
      },
      {
        id: 'surge', title: '任务突发 · 16:48',
        desc: '溢出区中的 Mistral 突然开始运行：按 P1 规则自动占位，Claude 被换入溢出区。',
        sys: { level: 0.58, color: '', bolt: false, tip: '电池 58%' },
        ime: 'pin', comm: 3, tools: ['mistral*', 'copilot', 'gpt'], chip: 8,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 16:48'
      },
      {
        id: 'charging', title: '充电中 · 10:05',
        desc: '电池转绿并叠加闪电标识，与系统原生语义保持一致。',
        sys: { level: 0.69, color: 'green', bolt: true, tip: '电池 69% · 充电中' },
        ime: 'pin', comm: 3, tools: ['copilot', 'gpt', 'claude'], chip: 7,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 10:05'
      },
      {
        id: 'discharging', title: '电池供电 · 12:30',
        desc: '脱离电源后恢复单色渲染，百分比保留，不抢视觉焦点。',
        sys: { level: 0.52, color: '', bolt: false, tip: '电池 52%' },
        ime: 'pin', comm: 3, tools: ['copilot', 'gpt', 'claude'], chip: 7,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 12:30'
      },
      {
        id: 'low', title: '低电量 · 18:12',
        desc: '电池转红并常显百分比；行动引导由系统弹窗负责，状态栏只负责状态。',
        sys: { level: 0.11, color: 'red', bolt: false, tip: '电池电量低 · 11%', showText: true },
        ime: 'pin', comm: 3, tools: ['copilot', 'gpt', 'claude'], chip: 7,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 18:12'
      },
      {
        id: 'growth', title: '应用增长 · 20:26',
        desc: '应用继续增加：只有芯片数字增长（+7 → +12），栏高、间距与节奏不变。',
        sys: { level: 0.47, color: '', bolt: false, tip: '电池 47%' },
        ime: 'pin', comm: 3, tools: ['copilot', 'gpt', 'claude'], chip: 12,
        tray: { cc: true, focus: false }, clock: '10月16日 周五 20:26'
      }
    ],

    /* ---------- 多屏幕适配（05 节） ---------- */
    screens: {
      stage: [
        {
          role: 'main', label: '主屏 · MacBook Pro 14″', tag: '焦点屏', mode: 'full',
          appMenus: ['Zotero', '文件', '编辑'],
          window: {
            title: '分析并搭建 CLI-Anything 项目',
            body: '焦点应用 Zotero —— 应用菜单出现在主屏菜单栏左侧。<br/>Dock 跟随指针所在屏幕（系统默认行为，设计不干预）。'
          },
          dock: true,
          cap: '<b>主屏：</b>应用菜单 + 完整五区。菜单跟随焦点应用，是唯一默认承载应用菜单的屏幕。'
        },
        {
          role: 'secondary', label: '副屏 · 27″ 4K', tag: '状态条', mode: 'slim',
          window: {
            title: '设置 · 多显示器',
            body: '副屏窗口 —— 该屏不显示应用菜单，只保留右对齐状态条；五区内容与主屏同源同步，切屏不丢上下文。'
          },
          dock: false,
          cap: '<b>副屏：</b>纯状态条（无应用菜单），五区同源；可在设置中开启「副屏显示应用菜单」。'
        }
      ],
      specials: [
        {
          role: 'fullscreen', label: '副屏全屏运行', tag: '自动隐藏', mode: 'hidden',
          hint: ['菜单栏已自动隐藏', '指针移至屏幕顶部可临时呼出 · 其他屏幕不受影响'],
          cap: '<b>全屏应用：</b>该屏菜单栏让位，主屏与其他副屏完全不受影响。'
        },
        {
          role: 'portrait', label: '竖屏副屏', tag: '顺序收缩', mode: 'portrait',
          portraitItems: ['battery', 'clock', 'cc'],
          portraitClock: '周六 02:15',
          cap: '<b>竖屏：</b>宽度不足时按「系统 → 时钟 → 通信 → 工具」顺序收缩，始终保留系统与时钟。'
        },
        {
          role: 'remote', label: '远程会话叠加', tag: '收敛为徽标', mode: 'remote',
          conn: { label: 'UU远程 · 已连接', quality: 'good' },
          window: {
            title: '网易UU远程 · 远程桌面',
            body: '远程工具收敛为单一连接徽标：圆点表示连接质量（绿 / 琥珀 / 红），不再堆叠多个图标。'
          },
          dock: false,
          cap: '<b>远程会话：</b>UU远程等常驻工具只保留连接状态徽标，菜单栏回归安静。'
        }
      ]
    }
  };

  return { config: config, i18n: i18n };
});
