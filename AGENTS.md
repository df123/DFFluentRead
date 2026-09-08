# AGENTS.md — AI 辅助开发说明（DFFluentRead / 流畅阅读）

面向 AI 开发工具（ZCode / Claude Code / Cursor 等）的项目调试环境说明。
本项目为 WXT + Vue3 + Element Plus 的浏览器翻译扩展，包管理器 pnpm，分支策略：功能开发在 feature 分支。

## 调试环境（WSL2）

### Firefox 调试（web-ext 驱动 snap Firefox）

```bash
pnpm dev:firefox:wsl   # 即 mkdir -p ~/wxt-tmp && TMPDIR=~/wxt-tmp wxt -b firefox
```

- snap Firefox 沙箱看不到 /tmp，必须把 TMPDIR 放到 $HOME 下（wxt 有 patch 绕过 isWsl 检测走 web-ext runner）。
- web-ext 以 `-start-debugger-server <port>` 启动 Firefox（端口见进程 cmdline），**Playwright 无法连接 Firefox**（无 CDP/Juggler），只能手动调试或用 Firefox DevTools 的 `about:debugging` 远程连接。

### Chromium + Playwright 联调（推荐自动化调试链路）

三个关键事实：

1. **品牌版 Chrome ≥137 已忽略 `--load-extension`**（静默不生效）。加载未打包扩展的官方方式是 CDP 方法 `Extensions.loadUnpacked`，且 Chrome 必须带 `--enable-unsafe-extension-debugging` 启动。
2. **WXT 的 web-ext runner 对 chromium 用 `--remote-debugging-pipe`**（CDP 走文件描述符，无 TCP 端口），外部工具连不上；且其拉起的 Chrome 在本机会静默退出。因此 Chromium 自动化调试时用 `WXT_NO_RUNNER=1` 走手动 runner（wxt.config.ts 中 `webExt.disabled` 开关，注意键名是 `webExt` 不是已弃用的 `runner`；不影响 `dev:firefox:wsl`）。
3. node 环境里可用 playwright：`/home/df/.nvm/versions/node/v24.11.1/lib/node_modules/@playwright/cli/node_modules/playwright/index.mjs`（若 `import('playwright')` 解析到别处的桩模块，按此绝对路径导入）。

步骤：

```bash
# 1. 只构建+监听（不托管浏览器）
WXT_NO_RUNNER=1 pnpm dev

# 2. 启动调试 Chrome（窗口保持最大化，不要 F11/--start-fullscreen）
google-chrome --remote-debugging-port=9222 \
  --user-data-dir=$HOME/chrome-debug-profile \
  --enable-unsafe-extension-debugging \
  --no-first-run --no-default-browser-check about:blank
```

```js
// 3. Playwright 接管并加载扩展（重复调用 loadUnpacked 即热重载扩展）
const { chromium } = await import('file:///home/df/.nvm/versions/node/v24.11.1/lib/node_modules/@playwright/cli/node_modules/playwright/index.mjs');
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const cdp = await browser.newBrowserCDPSession();
const { id } = await cdp.send('Extensions.loadUnpacked',
  { path: '/home/df/DFFluentRead/.output/chrome-mv3-dev' });
// 之后 browser.contexts()[0].newPage() 正常操作页面
```

### 已知坑

- **Playwright 关掉 Chrome 最后一个标签页 = 整个 Chrome 退出**。
- MV3 service worker 闲置后会从 `/json/list` 消失，别依赖它找扩展 ID；扩展 ID 由加载路径决定，路径不变则稳定。
- **编辑 `wxt.config.ts` 会让跑着的 dev server 退出**，需重启 `WXT_NO_RUNNER=1 pnpm dev`。
- 代码改动后：WXT 自动重建 `.output/chrome-mv3-dev`，再重发一次 `Extensions.loadUnpacked` 即完成扩展热重载。
- web-ext 偶尔会在仓库根目录生成 Windows UNC 字面名的临时目录（`\\wsl.localhost\...`），直接删掉即可，勿提交。

## 扩展配置

- 配置以 JSON **字符串**存在 `chrome.storage.local` 的 `config` 键（即 WXT storage 的 `local:config`）。
- UI 导入路径：popup → 高级选项 → 导入配置 → 粘贴 JSON → 保存（带校验）。
- 当前调试 profile（`~/chrome-debug-profile`）已配置 DeepSeek 服务（`service: deepseek`）+ 批量翻译开启（`batchTranslationEnabled: true`，批次 1024）。
