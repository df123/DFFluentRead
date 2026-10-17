# 移除传统机器翻译 + 恢复全部大模型服务：执行计划

- 日期：2026-10-17
- 分支：`feature-for-batch`
- 基线提交：`6a9f69c`（本文所有行号都以这个提交为准）
- 取代：`docs/superpowers/specs/2026-08-07-remove-machine-translators-design.md`（目标一致，细节以本文为准，见附录 C）
- 来源：用户 2026-10-17 问答中的决定（见 §1.3）

---

## §0 使用方法

1. **必读**：`AGENTS.md`、本文、`docs/changes/2026-09-18.md`（了解要撤回的那批改动）。
2. **一个工作包（WP）一个提交**，按 WP0 → WP6 的顺序做（WP6 只 push，不提交）。提交信息用中文，格式沿用仓库习惯（`feat:` / `fix:` / `refactor:` / `docs:` / `chore:`）。
3. **行号以 `6a9f69c` 为准**。WP0 把工作区恢复到这个提交后，行号与本文一致；后面的 WP 会让行号漂移，按函数名 / 上下文定位即可。
4. **停止条件**（遇到就停下来，汇报后等用户决定）：
   - WP0 的补丁保存或校验失败；
   - 代码和本文的代码地图明显不符（不只是行号漂移几行）；
   - 需要改本文文件清单以外的文件；
   - `pnpm compile` 出现新增错误，且在改动范围内无法消除；`pnpm build` 或 `pnpm build:firefox` 失败；
   - 涉及 `main`、`upstream` 的任何操作；WP6 以外的 push；删除 `.test-shots/` 以外的用户文件；
   - WP6 前 `git status -sb` 显示 behind，或者 push 被拒绝；
   - **宿主约 23:00 关机**：22:45 以后不开始新的 WP；正在做的 WP 如果 22:55 前做不完，就停下，在交接里写清工作区状态，不提交半成品，不 push。
5. 与本文冲突时，以用户给的启动 prompt 为准，并把冲突点写回本文。

---

## §1 背景快照

### 1.1 仓库状态（2026-10-17 21:40 只读核对）

- `feature-for-batch` HEAD = `6a9f69c`，比 `origin/feature-for-batch`（`897d37d`）多 4 个提交，未 push。
- 工作区有 2026-09-18 的未提交改动：22 个文件，+30/-1371，内容见 `docs/changes/2026-09-18.md`：
  - 删掉 23 个 LLM 服务中的 21 个，以及 13 个服务实现文件和 `utils/newApi.ts`；
  - 新增 OpenCode Zen / Go；
  - 修复 `validateConfig` 的必填字段里残留 `display` 的问题。
- 未跟踪：`.test-shots/`（9-18 手工验证的 4 张截图）、`docs/changes/`（2026-09-08.md、2026-09-18.md）。
- 机器翻译 8 个服务和 `entrypoints/offscreen/` 都还在；默认服务是 `microsoft`（`option.ts:393`）。
- 没有单元测试框架（`package.json` 无 vitest / jest）。`pnpm compile` = `vue-tsc --noEmit`。

### 1.2 23 个 LLM 服务的构成（核对事实）

- 13 个有独立实现文件：`azure-openai`、`claude`、`coze`（cozecom 和 cozecn 共用）、`custom`、`gemini`、`grok`、`hunyuan-translation`、`infini`、`minimax`、`newapi`、`tongyi`、`yiyan`、`zhipu`。
- 9 个走通用实现 `common`：openai、moonshot、baichuan、lingyi、jieyue、groq、huanYuan、doubao、siliconCloud。
- 另外两个：`deepseek` 有自己的实现，不在 9-18 的删除范围内；`grok.ts` 在 HEAD 中没有被 import，grok 实际走 `common`（`_service.ts:65`），`grok.ts` 是死代码，本次不处理。

### 1.3 用户决定（2026-10-17，原话）

1. “保留 13 个服务实现文件和 utils/newApi.ts。但是要移除传统机器翻译”。
2. 恢复范围：“全部”，即 23 个 LLM 服务全部恢复，并且可用。
3. OpenCode Zen/Go 和 validateConfig 修复：“要保留”。
4. 默认服务：“让用户填写，不然就不翻译，因为没有api key翻译不了”。
5. 未配置时提示：“弹”。
6. 补充（2026-10-17 21:52）：做完后“push”；旧截图“删除”；执行 agent “是的是pi code agent”；扩展“自己，发布到firefox商店”；宿主约 23:00 关机“是的”。

---

## §2 红线

- 不动 `main`，不向 `upstream` 推送，不 force push。计划最后一步 WP6 push 到 `origin/feature-for-batch`（用户 2026-10-17 同意），只在 WP6 做。
- 只删除 `.test-shots/`（用户 2026-10-17 同意）；其他未跟踪文件不删；`docs/changes/` 里的已有文件只修改，不删。
- 不做任何发布动作：不升版本号，不跑 `zip`，不上传 AMO（发布前要做的事见附录 D）。
- `~/chrome-debug-profile` 里有用户的 API Key：不导出、不打印、不写进任何文件。
- 不改 `userscripts.js`、README、`docs/guide/` 等文档站内容，不改版本号。
- 编辑 `wxt.config.ts` 会让跑着的 dev server 退出（AGENTS.md），改完需要重启。

---

## §3 工作包总览

| WP | 内容 | 提交 | 依赖 | 优先级 | 影响已安装用户的配置 |
|----|------|------|------|--------|----------------------|
| WP0 | 保存 9-18 补丁，把工作区恢复到 `6a9f69c`，提交本计划 | `docs:` 提交本计划 | — | P0 | 否 |
| WP1 | validateConfig 去掉 `display` | `fix:` | WP0 | P0 | 否 |
| WP2 | 新增 OpenCode Zen / Go | `feat:` | WP0 | P0 | 否 |
| WP3 | 移除 8 个传统机器翻译、offscreen、输入框翻译 | `refactor:` | WP2 | P0 | 是（旧 service 值失效，WP4 处理） |
| WP4 | 不预设默认服务；未配置时拦截所有翻译入口并弹提示；迁移旧配置 | `feat:` | WP3 | P0 | 是 |
| WP5 | 文档：变更记录、`.gitignore`、删除旧截图、旧设计文档状态 | `docs:` | WP4 | P1 | 否 |
| WP6 | push 到 `origin/feature-for-batch` | 无提交 | WP5 | P0 | 否 |

- 本计划不发布。扩展会发布到 Firefox 商店（AMO），所以 WP3 起每个 WP 都要过 `pnpm build:firefox`。WP3、WP4 必须一起交付，不要单独拿 WP3 的构建给用户用。
- WP1 和 WP2 互不依赖，顺序可以对调。

---

## WP0：保存 9-18 补丁并恢复工作区

### 目标
- 把 9-18 的未提交改动完整保存成补丁，然后把这 22 个文件恢复到 `6a9f69c`，为后续 WP 提供干净的基线。
- 提交本计划文档。

### 非目标
- 不 stash，不新建分支，不碰 `.test-shots/` 和 `docs/changes/`。

### 设计决策
- **D0.1** 补丁存到仓库外的 `~/DFFluentRead-backups/20260918-llm-shrink.patch`，用 `git diff HEAD --binary` 生成，覆盖删除和修改。
- **D0.2** 只恢复 `git status` 里列出的 22 个已跟踪路径，**逐个列出路径**，不要用 `git restore .` / `git checkout .` / `git clean`。

### 步骤
1. `git status --short`，确认改动正好是这 22 个路径加 3 个未跟踪项（`.test-shots/`、`docs/changes/`、`docs/superpowers/plans/`）。不一致就停。
2. `mkdir -p ~/DFFluentRead-backups && git diff HEAD --binary > ~/DFFluentRead-backups/20260918-llm-shrink.patch`。
3. 校验补丁：`git apply -R --check ~/DFFluentRead-backups/20260918-llm-shrink.patch` 要成功；`git diff HEAD --stat | tail -1` 应为 `22 files changed, 30 insertions(+), 1371 deletions(-)`。
4. 恢复：`git restore --source=HEAD --worktree -- <22 个路径>`（路径清单见附录 A）。
5. 再校验：`git status --short` 只剩 3 个未跟踪项；`git apply --check ~/DFFluentRead-backups/20260918-llm-shrink.patch` 成功，说明补丁还能重新打上。
6. `git add docs/superpowers/plans/2026-10-17-remove-machine-translators-plan.md && git commit`，提交信息：`docs: 添加移除传统机器翻译执行计划`。

### 自检
- 第 3 步和第 5 步的两个 `--check` 都成功。
- `ls entrypoints/service/` 包含 13 个恢复的文件；`ls entrypoints/utils/newApi.ts` 存在。

### 验收
- 补丁文件存在且非空；工作区除 3 个未跟踪项外是干净的；计划文档已提交。

---

## WP1：validateConfig 去掉 display

### 目标
- 配置导入时不再要求已删除的 `display` 字段。

### 代码地图
- `components/Main.vue:1351`：`const requiredFields = ['on', 'service', 'display', 'from', 'to'];`

### 设计决策
- **D1.1** 改为 `['on', 'service', 'from', 'to']`，其他校验逻辑不动。

### 步骤
1. 修改这一行。
2. `pnpm compile`，记录错误数，作为后续 WP 的**基线**（9-18 记录为 3 处存量错误，未核对）。

### 自检
- `git diff --stat` 只有 `components/Main.vue` 1 行。
- `pnpm compile` 错误数 = 基线。

### 集成 / 流程验证（留给 /agent-verify）
- popup → 高级选项 → 导入配置，粘贴不含 `display` 的配置，弹出“配置导入成功”。

### 验收
- 提交：`fix: 配置导入校验去掉已删除的 display 必填字段`。

---

## WP2：新增 OpenCode Zen / OpenCode Go

### 目标
- 在恢复了全部 LLM 的基础上，把 9-18 新增的两个服务加回来，走通用实现 `common`。

### 非目标
- 不改其他服务的模型列表（OpenRouter 的默认模型列表很旧，本次不动）。

### 代码地图（`6a9f69c`）
- `entrypoints/utils/option.ts`：
  - `services` 对象在 :1-38，`openrouter` 在 :34；
  - `AI` 集合 :43-68，`useToken` :70-97，`useModel` :99-123，`useProxy` :125-151；
  - `models` 在 :176-205，`openrouter` 那一项在 :204，是最后一项，**行尾没有逗号**；
  - `options.services` 中 OpenRouter 在 :278。
- `entrypoints/utils/constant.ts:29`：openrouter 的 URL。
- `entrypoints/service/_service.ts:64`：`[services.openrouter]: common,`。

### 设计决策
- **D2.1** 新增内容和 9-18 版本逐字一致，原文见附录 B。
- **D2.2** 位置：
  - `services` 中加在 `newapi` 之后、`chromeTranslator` 之前；
  - 四个集合中加在 `services.openrouter` 之后；
  - `models` 中加在 openrouter 之后（给 :204 行尾补上逗号）；
  - 下拉选项、URL、`_service` 映射都加在 openrouter 之后。

### 步骤
1. 按附录 B 修改 3 个文件。
2. `pnpm compile`。

### 自检
- `grep -rn "opencode" entrypoints | wc -l` = 18。其中 option.ts 14 处（services 2、四个集合 8、models 2、下拉选项 2），constant.ts 2 处，_service.ts 2 处。
- `pnpm compile` 错误数 = 基线。

### 集成 / 流程验证（留给 /agent-verify）
- 下拉框里有“OpenCode Zen（免费）⭐️”“OpenCode Go（低成本）⭐️”；选 Zen 后模型列表与附录 B 一致。

### 验收
- 提交：`feat: 新增 OpenCode Zen / OpenCode Go 翻译服务`。

---

## WP3：移除 8 个传统机器翻译、offscreen 和输入框翻译

### 目标
- 删除 microsoft、google、deepL、deeplx、xiaoniu、youdao、tencent（腾讯云机器翻译）、chromeTranslator 共 8 个服务。
- 删除 offscreen 入口和权限。
- 删除依赖微软翻译的输入框翻译功能。

### 非目标
- 不删 `tencentSecretId` / `tencentSecretKey` 字段和设置页里的腾讯密钥输入框，因为腾讯混元翻译（`hunyuan-translation.ts:97-98`）要用。
- 不改 `batchTranslation.ts:149-152` 的 `isLLM` 判断（删除后恒为 true，行为不变，不扩大改动面）。设计文档原计划要简化它，这里不做。
- 不清理老用户存储里机器翻译服务的 token 等旧键（无害）。
- 不改 `userscripts.js`。

### 代码地图（`6a9f69c`）

**删除的文件（9 项）**
- `entrypoints/service/` 下：`microsoft.ts`、`google.ts`、`deepl.ts`、`deeplx.ts`、`xiaoniu.ts`、`youdao.ts`、`tencent.ts`、`chrome-translator.ts`
- 整个目录：`entrypoints/offscreen/`（`index.html`、`main.ts`）

**`entrypoints/service/_service.ts`**
- 删除 8 个 import：:2 microsoft、:3 deepl、:4 deeplx、:10 google、:11 xiaoniu、:12 youdao、:13 tencent、:22 chromeTranslator。
- 删除映射 :29-37（:29 是“传统机器翻译”注释，:30-37 是 8 条映射）。

**`entrypoints/utils/option.ts`**
- `services`：删除 :2-9（“传统机器翻译”注释和 7 个键）以及 :37 `chromeTranslator`。
- `servicesType`：
  - 删除 :42 `machine` 集合；
  - `useToken` 删除 deepL、deeplx、xiaoniu（:78-80）；
  - `useProxy` 删除 google、deepL、deeplx、xiaoniu、youdao、tencent（:130-137 一带）；
  - `useCustomUrl` 删除 deeplx（:155）；
  - 删除 :160 `isMachine`、:169 `isYoudao`；
  - :170 `isTencent` 改为只匹配 `services.huanYuanTranslation`。
- `options.services`：
  - 删除 :256-264（“传统机器翻译”注释、“机器翻译”分隔项和 7 个选项）；
  - 删除 :267 Chrome内置AI翻译；
  - 保留 :266 “AI翻译”分隔项。
- `options` 中删除 `inputBoxTranslationTarget`（:365-377）和 `inputBoxTranslationTrigger`（:378-384）。
- `defaultOption` 中删除 `deeplx`（:395）、`inputBoxTranslationTrigger`（:404）、`inputBoxTranslationTarget`（:405）。`service` 字段留到 WP4 处理。

**`entrypoints/utils/constant.ts`**
- 删除 5 个 URL：:5 deepL、:6 deeplx、:13 xiaoniu、:14 youdao、:15 tencent。保留 :26 混元翻译的 URL。

**`entrypoints/utils/model.ts`**
- 删除字段声明和初始化：
  - `deeplx`（:42、:88）
  - `youdaoAppKey`（:46、:92）、`youdaoAppSecret`（:47、:93）
  - `inputBoxTranslationTrigger`（:53、:99）、`inputBoxTranslationTarget`（:54、:100）
- 保留 `tencentSecretId` / `tencentSecretKey`（:48-49、:94-95），注释改为“腾讯云 Secret ID（腾讯混元翻译使用）”。

**`entrypoints/utils/check.ts`**
- :11-18：去掉 deeplx 豁免，改成直接判断 token。
- :25-29：条件改为 `config.service === services.huanYuanTranslation`，提示改为“腾讯混元翻译密钥尚未配置，请前往设置页配置SecretId和SecretKey”（D3.3）。

**`entrypoints/background.ts`**
- 删除 :11-56：`translateWithMicrosoftInBackground` 和 `refreshMicrosoftTokenInBackground` 两个函数及其注释。
- 删除 :167-172：`inputBoxTranslation` 消息分支。

**`entrypoints/content.ts`**
- 删除 :655-1021 的整个输入框翻译功能，从“输入框翻译功能”注释开始，到文件末尾的 `setupInputBoxTranslation();` 为止。其中包含以下函数（已核对，只被输入框翻译使用）：
  - `setupInputBoxTranslation`、`isInputElement`、`getInputBoxText`、`removeTriggerSymbols`、`setInputBoxText`
  - `createTranslationTooltip`、`getTooltipIcon`、`removeExistingTooltip`、`addInputBoxAnimation`
  - `translateWithMicrosoft`、`handleInputBoxTranslation`

**`entrypoints/style.css`**
- 删除 :50-142：输入框翻译的 3 个 `@keyframes` 和 `.fluent-input-*` 规则（只有 content.ts 的输入框代码使用）。
- 保留 :144-152 的 `@keyframes spin`。它和 :1 重复，但不在本次范围。

**`components/Main.vue`**
- :42：“翻译服务”的 tooltip 原文为“机器翻译：快速稳定，适合日常使用；AI翻译：更自然流畅，需要配置令牌”，改为“选择大模型翻译服务，并填写对应的 API Key（令牌）；未配置时不会翻译”。
- 删除 DeepLX 区块（:218-230，从注释 `<!-- DeepLX URL 配置-->` 到 `</el-row>`）。
- 删除有道区块（:260-286，注释和两个 `v-show="compute.showYoudao"` 的 el-row）。
- 腾讯区块（:288-314）保留，改三处文字：
  - :288 的注释 `<!-- 腾讯云机器翻译配置 -->` 改为 `<!-- 腾讯混元翻译密钥配置 -->`；
  - 两处 tooltip 里的“腾讯云机器翻译服务”改为“腾讯混元翻译服务”。
- 删除输入框翻译设置：
  - :472-489（注释“输入框翻译功能”和 el-row）；
  - :528-539（注释“输入框翻译目标语言”和 el-row）。
- computed 中删除 :756 `showMachine`（模板未使用）、:766 `showYoudao`、:774 `showDeepLX`。保留 :768 `showTencent`。

**`wxt.config.ts`**
- :36 `permissions` 中删除 `'offscreen'`，变成 `['storage', 'contextMenus']`。`browser_specific_settings` 保留。

### 设计决策
- **D3.1** 8 个服务全部删除，包括 chromeTranslator：设计文档已把它列为要删的对象，而且它依赖 offscreen。
- **D3.2** 输入框翻译整体删除，包括设置项、字段、样式和后台消息分支。不改成走 LLM（用户没要求）。
- **D3.3** 腾讯混元翻译此前没有任何密钥检查（不在 `useToken` 里，`check.ts:26` 只检查已删除的 tencent 服务），没有密钥时请求会直接失败。按用户决定“没有api key翻译不了 → 不翻译”，把这项检查改为对 huanYuanTranslation 生效。
- **D3.4** 保留下拉框中的“AI翻译”分隔项，只删“机器翻译”分隔项。

### 步骤
1. 删除 9 项文件 / 目录（`git rm`）。
2. 按代码地图逐个文件修改。
3. 残留检查（结果应为空）：
   ```bash
   grep -rnE "microsoft|services\.deepL\b|deeplx|services\.google|xiaoniu|youdao|services\.tencent\b|chromeTranslator|chrome-translator|offscreen|isMachine|servicesType\.machine|inputBox|InputBox|translateWithMicrosoft|fluent-input|showDeepLX|showYoudao|showMachine" entrypoints components wxt.config.ts
   ```
   注意：`tencentSecretId` / `tencentSecretKey` / `showTencent` / `isTencent` 应该保留，不算残留。
4. `pnpm compile`；`pnpm build`；`pnpm build:firefox`。
5. 编辑了 `wxt.config.ts`，如果 dev server 在跑，需要重启。

### 自检
- 残留检查为空。
- `pnpm compile` 错误数 = 基线；`pnpm build` 成功。
- `pnpm build:firefox` 成功。
- `.output/chrome-mv3/manifest.json` 的 `permissions` 不含 `offscreen`；产物中没有 `offscreen.html`。
- Firefox 产物的 `manifest.json`（WXT 默认目录 `.output/firefox-mv2/`，以实际为准）的 `permissions` 也不含 `offscreen`。

### 集成 / 流程验证（留给 /agent-verify）
- 下拉框没有机器翻译和 Chrome 内置翻译，“AI翻译”下列出 23 + 2 个服务。
- 选腾讯混元翻译时显示 SecretId / SecretKey 输入框，tooltip 文案正确。
- 高级选项里没有输入框翻译的设置。
- 在输入框里连按三下空格，不触发任何翻译。

### 验收
- 提交：`refactor: 移除传统机器翻译服务、offscreen 和输入框翻译`。

---

## WP4：不预设默认服务，未配置时不翻译并弹提示

### 目标
- 新安装时不选中任何翻译服务。
- 服务未选、已失效（老配置里的机器翻译），或必需的 Key / 模型没填时，**所有翻译入口都不发请求**，并弹提示让用户去设置页配置。
- 老用户存储里的失效 service 值迁移成空。

### 非目标
- 不在 popup 里新增“未配置”的醒目提示，选择框的 placeholder“请选择翻译服务”已够用。
- 不改 `config.on` 的语义：插件关闭时各入口原来是什么行为就保持什么行为。

### 代码地图（`6a9f69c`，WP3 后行号会漂移）

**默认值和配置加载**
- `entrypoints/utils/option.ts:393`：`service: services.microsoft`。
- `entrypoints/utils/model.ts`：Config 构造函数里的 `this.service = defaultOption.service`。
- `entrypoints/utils/config.ts`：
  - :24 `loadConfig` 里 `Object.assign(config, parsedConfig)`；
  - :48 `storage.watch` 里 `Object.assign(config, parsedConfig)`。
- `components/Main.vue`：
  - :725 popup 加载时的 `Object.assign`；
  - :739 popup 的 `storage.watch`；
  - :746 `watch(config, …)` 会把整份配置写回 storage；
  - :1314 导入配置时的 `Object.assign`。

**检查函数**
- `entrypoints/utils/check.ts:6-42`：`checkConfig()`。
  - 空 service 不在任何集合里，token 检查和模型检查会直接跳过，最后返回 true（核对事实）。

**翻译入口**（核对事实：只有第一个入口调用了 checkConfig）
1. 鼠标悬浮：`trans.ts:236` `handleTranslation`，:238 已调用 `checkConfig()`。
2. 整页翻译：`trans.ts:81` `autoTranslateEnglishPage`，**没有检查**。
   - 调用方：`content.ts:32`、`:114`、`:616`，`floatingBall.ts:58`、`:108`、`:139`。
   - 它启动的 IntersectionObserver 会在 `trans.ts:192` 继续调用 `handleBilingualTranslation`。
3. 重试按钮：`icon.ts:56-66` `handleRetryClick` → `handleBilingualTranslation`，**没有检查**。
4. 划词翻译：`components/SelectionTranslator.vue:277-293` `getTranslation` → `translateText`，**没有检查**。
5. 其他发请求的地方都在以上入口的下游：
   - `dom.ts:337` 按钮翻译、`dom.ts:367` 首行文本，都在 `grabNode` 里，由入口 1、2 触发；
   - `batchTranslation.ts:200/237/297`，由入口 2 触发；
   - `translateApi.ts:64`。

**后台**
- `background.ts:183`：`_service[config.service](message)`。service 无效时会抛 TypeError，被 :204 捕获后返回 `{success:false, error}`。

### 设计决策
- **D4.1** `defaultOption.service` 改为 `""`。
- **D4.2** 在 `option.ts` 的 `servicesType` 中新增：
  ```ts
  isValid: (service: string) => !!service && Object.values(services).includes(service)
  ```
- **D4.3** 把 `check.ts` 拆成两个函数：
  - `checkServiceReady(): boolean`：不检查 `config.on`。依次检查：
    1. `!servicesType.isValid(config.service)` 时提示“翻译服务尚未配置，请前往设置页选择翻译服务并填写 API Key”，返回 false；
    2. 原有的 token 检查、yiyan 的 AK/SK 检查、混元翻译的密钥检查（WP3 的 D3.3）、模型检查，保持原来的顺序和文案。
  - `checkConfig()` 改为 `if (!config.on) return false; return checkServiceReady();`，对外行为不变。
- **D4.4** 各入口的处理：
  - 入口 1：已调用 `checkConfig()`，不变。
  - 入口 2：`autoTranslateEnglishPage` 开头，在 `isAutoTranslating` 判断之后、`grabAllNode` 之前，加 `if (!checkServiceReady()) return;`。每次触发只检查一次，再加上 `sendErrorMessage` 本身 1 秒节流，整页翻译只弹一次提示。
  - 入口 3：`handleRetryClick` 在 `wrapper.remove()` 之前加 `if (!checkServiceReady()) return;`，未配置时保留失败标记，不重试。
  - 入口 4：`getTranslation` 在 `isLoading = true` 之前加检查。未通过时设 `error.value = '翻译服务尚未配置，请前往设置页配置'` 并返回，不发请求。
  - 用 `checkServiceReady` 而不用 `checkConfig`，是为了不给入口 2、3、4 新增“插件关闭则不翻译”的行为（非目标）。
- **D4.5** 后台兜底：`background.ts:183` 之前加检查。`_service[config.service]` 不存在时调用 `reject(new Error('翻译服务尚未配置'))`，与服务报错走同一条路径（:202）。不在后台弹 UI。
- **D4.6** 旧配置迁移：
  - 在 `config.ts` 新增并导出 `normalizeConfig(obj)`：如果 `!servicesType.isValid(obj.service)`，就把 `obj.service` 设为 `""`。
  - 调用位置：`config.ts:24`、`:48` 的 `Object.assign` 之后；`Main.vue:725`、`:739`、`:1314` 的 `Object.assign` 之后。
  - 只改内存。popup 的 `watch(config)`（Main.vue:746）和 content 的 `config.count++` 写回时会顺带持久化，不额外主动写 storage。
  - 注意 `option.ts` 和 `config.ts` 之间是否会循环 import：`model.ts` 已经 import 了 option，`config.ts` import model，所以 config 再 import option 没问题。如果 `compile` 报循环依赖，就把 `normalizeConfig` 放到 `check.ts` 或 `option.ts`，并在汇报中说明。
- **D4.7** 提示统一用 `sendErrorMessage`（`tip.ts:16`，ElMessage，1 秒节流），不新增 UI 组件。

### 步骤
1. 改 `option.ts`（D4.1、D4.2）。
2. 改 `check.ts`（D4.3）。
3. 改 `trans.ts` 入口 2、`icon.ts` 入口 3、`SelectionTranslator.vue` 入口 4（D4.4）。`trans.ts:1` 已经从 `check.ts` import，补上 `checkServiceReady` 即可。
4. 改 `background.ts`（D4.5）。
5. 改 `config.ts`、`Main.vue`（D4.6）。
6. `pnpm compile`；`pnpm build`；`pnpm build:firefox`。

### 自检
- `grep -n "services.microsoft" entrypoints -r` 为空。
- `grep -n "checkServiceReady" -r entrypoints components` 命中：定义 1 处、checkConfig 内 1 处、trans.ts、icon.ts、SelectionTranslator.vue。
- `pnpm compile` 错误数 = 基线；`pnpm build`、`pnpm build:firefox` 成功。

### 集成 / 流程验证（留给 /agent-verify，用新的 Chrome profile，不要用 `~/chrome-debug-profile`，以免覆盖用户配置）
1. 新安装（空 storage）：popup 的翻译服务为空，显示 placeholder。
2. 未配置时，以下操作都不发出任何网络请求：Ctrl+悬浮、悬浮球整页翻译、快捷键整页翻译、划词翻译。
   - 前三种弹出“翻译服务尚未配置…”，整页翻译只弹一次；
   - 划词弹窗里显示错误文案。
3. 选了服务但没填 Key：弹“令牌尚未配置…”，不发请求。
4. 导入 `service: "microsoft"` 的老配置：导入成功；popup 中翻译服务显示为空；翻译时弹出未配置提示。
5. 用 `~/chrome-debug-profile`（DeepSeek 已配置），在 example.com 上悬浮翻译冒烟一次，双语正常。

### 验收
- 提交：`feat: 不预设默认翻译服务，未配置时拦截所有翻译入口并提示`。

---

## WP5：文档收尾

### 目标
- 变更记录与事实一致；删除旧截图，并忽略截图目录；旧设计文档标明已被取代。

### 步骤
1. `rm -r .test-shots/`（里面只有 4 张 9-18 的 png，用户 2026-10-17 同意删除）；`.gitignore` 末尾加一行 `.test-shots/`，以后的验证截图放这里也不会入库。
2. 改写 `docs/changes/2026-09-18.md`：
   - 在开头加说明：这批改动中“LLM 服务收缩”部分已于 2026-10-17 按用户决定撤回，未入库；补丁备份在 `~/DFFluentRead-backups/20260918-llm-shrink.patch`；OpenCode Zen/Go 和 validateConfig 修复分别由 WP2、WP1 的提交入库（写上提交哈希）。
   - 把第 19 行的“截图见 `.test-shots/`”改为“截图已于 2026-10-17 删除（拍的是已撤回的状态）”。
   - 正文其余部分作为历史保留，不删。
3. 新增 `docs/changes/<执行日期>.md`，按已有格式（时间 / 目的 / 修改 / 验证）记录 WP1–WP4，每项写上提交哈希、`pnpm compile` 基线与结果、残留 grep 结果。
4. 在 `docs/superpowers/specs/2026-08-07-remove-machine-translators-design.md` 的“状态”行后加一行：`已被 docs/superpowers/plans/2026-10-17-remove-machine-translators-plan.md 取代（2026-10-17）`。正文不改。
5. `git add .gitignore docs/changes/ docs/superpowers/specs/2026-08-07-remove-machine-translators-design.md`。`docs/changes/2026-09-08.md` 也一起入库（之前未跟踪）。

### 验收
- `.test-shots/` 目录不存在；`git status --short` 为空。
- 提交：`docs: 更新变更记录，忽略本地测试截图目录`。

---

## WP6：push

### 目标
- 把 `feature-for-batch` 推到 origin。之前没推送的 4 个提交（`3e26cb0`、`4411d49`、`8eea316`、`6a9f69c`）会一起推上去，这是预期的。

### 前提
- WP0–WP5 都已提交，自检全部通过，没有触发停止条件。

### 步骤
1. `git status --short` 为空。
2. `git fetch origin`，然后 `git status -sb`：只能是 ahead，不能 behind。如果 behind 就停下。
3. `git push origin feature-for-batch`（不加 `-f`）。被拒绝就停下。
4. 核对：`git rev-parse HEAD` 和 `git rev-parse origin/feature-for-batch` 一致。

### 验收
- 本地 HEAD 与 origin 一致，没有用 force。

---

## 汇报模板（执行 agent 结束时输出）

```text
## 交接说明
- 分支 / 最终 HEAD：
- 提交列表（哈希 + 标题，按 WP）：
- 补丁备份：路径、大小、两次 --check 的结果
- pnpm compile：基线错误数 / 每个 WP 后的错误数（贴出错误摘要）
- pnpm build / pnpm build:firefox：结果；两个 manifest 的 permissions
- 残留 grep（WP3、WP4）：命令和输出
- .test-shots/ 是否已删除
- push：本地 HEAD 和 origin/feature-for-batch 的哈希
- 如果因为 23:00 停在中途：停在哪个 WP，工作区里有什么未提交的改动
- 偏离计划的地方（逐条，说明原因）：
- 没做的事：
- 需要用户决定的事：
```

---

## 附录 A：WP0 要恢复的 22 个路径

```
components/Main.vue
entrypoints/content.ts
entrypoints/service/_service.ts
entrypoints/service/azure-openai.ts
entrypoints/service/claude.ts
entrypoints/service/coze.ts
entrypoints/service/custom.ts
entrypoints/service/gemini.ts
entrypoints/service/grok.ts
entrypoints/service/hunyuan-translation.ts
entrypoints/service/infini.ts
entrypoints/service/minimax.ts
entrypoints/service/newapi.ts
entrypoints/service/tongyi.ts
entrypoints/service/yiyan.ts
entrypoints/service/zhipu.ts
entrypoints/utils/check.ts
entrypoints/utils/constant.ts
entrypoints/utils/model.ts
entrypoints/utils/newApi.ts
entrypoints/utils/option.ts
entrypoints/utils/template.ts
```

## 附录 B：OpenCode Zen / Go 的新增内容（来自 9-18 版本，逐字照抄）

`option.ts` 的 `services`：
```ts
    opencodeZen: "opencodeZen", // OpenCode Zen（免费额度）
    opencodeGo: "opencodeGo", // OpenCode Go（低成本订阅）
```
`AI`、`useToken`、`useModel`、`useProxy` 四个集合各加：
```ts
        services.opencodeZen,
        services.opencodeGo,
```
`models`：
```ts
    [services.opencodeZen, ["deepseek-v4-flash", "deepseek-v4-pro", "glm-5.3-flash", "glm-5.3", "kimi-k3", "kimi-k2.7-code", "minimax-m3", "deepseek-v4-flash-free", "muse-spark-1.3-contributor-free", customModelString]],
    [services.opencodeGo, ["deepseek-v4.1-flash", "deepseek-v4-pro", "deepseek-v4-flash", "glm-5.3-flash", "glm-5.3", "glm-5.2", "kimi-k3", "kimi-k2.7-code", "kimi-k2.6", "longcat-2.0", "mimo-v2.5", customModelString]],
```
`options.services`：
```ts
        {value: services.opencodeZen, label: "OpenCode Zen（免费）⭐️"},
        {value: services.opencodeGo, label: "OpenCode Go（低成本）⭐️"},
```
`constant.ts` 的 `urls`：
```ts
    [services.opencodeZen]: "https://opencode.ai/zen/v1/chat/completions",
    [services.opencodeGo]: "https://opencode.ai/zen/go/v1/chat/completions",
```
`_service.ts`：
```ts
    [services.opencodeZen]: common,
    [services.opencodeGo]: common,
```
也可以从补丁 `~/DFFluentRead-backups/20260918-llm-shrink.patch` 里对照。

## 附录 C：与 2026-08-07 设计文档的差异

| 设计文档 | 本计划 | 原因 |
|----------|--------|------|
| 默认服务改为 openrouter | 默认服务为空，未配置时不翻译 | 用户 2026-10-17 决定 |
| `trans.ts` 简化 isMachine 分支，统一走 LLMStandardHTML | 不需要 | `6a9f69c` 已删除 isMachine 分支和 LLMStandardHTML |
| `check.ts` 删除 google 分支 | 不需要 | `6a9f69c` 已删除 |
| `Main.vue` 删除 google 过滤逻辑 | 不需要 | `6a9f69c` 已删除 |
| `batchTranslation.ts` 简化 isLLM | 不改 | 行为不变，减少改动面 |
| 输入框翻译只写了改 `background.ts` | 同时删除 `content.ts`、`Main.vue`、`option.ts`、`model.ts`、`style.css` 中的相关代码 | 设计文档漏写 |
| `check.ts` 删除 tencent 分支 | 改为对混元翻译生效 | 混元翻译此前没有密钥检查（D3.3） |
| 没有 OpenCode Zen/Go | 新增 | 用户 2026-10-17 决定保留 |
| 没有未配置拦截 | WP4 | 用户 2026-10-17 决定 |

## 附录 D：默认决策与待确认事项

### 默认决策（按保守原则定的，用户可以推翻）
1. 9-18 改动用补丁备份后恢复，不 stash，不建备份分支。
2. 一个 WP 一个提交，共 6 个提交（WP0 是提交本计划，WP6 只 push）。
3. `.test-shots/` 加进 `.gitignore`。
4. `docs/changes/` 两份已有记录都入库，2026-09-18.md 补上撤回说明。
5. 不改版本号；不改 README 和文档站；不简化 `batchTranslation.ts`。
6. 入口 2、3、4 用不检查 `on` 的 `checkServiceReady`，不改变插件关闭时的现有行为。
7. 腾讯混元翻译补上密钥检查（D3.3）。
8. 老配置中失效的 service 只在内存里迁移成空值，借助已有的写回逻辑持久化。

### 已确认（用户 2026-10-17 21:52）
1. 做完后是否 push → “push”（WP6）。
2. 旧截图是否删除 → “删除”（WP5）。
3. 执行 agent → “是的是pi code agent”。
4. 发布对象 → “自己，发布到firefox商店”。
5. 宿主约 23:00 关机 → “是的”（§0 停止条件）。

### 发布到 AMO 前要做的事（不在本计划内）
- 升版本号（当前 `0.0.33`）。
- `README.md:15` 仍写着“微软翻译、谷歌翻译、DeepL翻译”，需要更新。
- 发布说明要告诉老用户：升级后默认不再使用微软翻译，需要自己选服务并填 API Key；输入框翻译已移除。
- 在 Firefox 里手动验证（`pnpm dev:firefox:wsl`；Playwright 连不上 Firefox）。
- `pnpm zip:firefox` 打包；AMO 上传和源码提交由谁做，待用户定。

### 待用户确认
1. 以后每次计划做完是否都可以直接 push（目前只当本计划同意）。
2. AMO 打包上传和源码提交由谁做。
3. `README.md:15` 是否在本计划里改（默认等发布时再改）。
