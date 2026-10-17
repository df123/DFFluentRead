# 移除传统机器翻译提供商 - 设计文档

日期：2026-08-07
状态：已批准
已被 docs/superpowers/plans/2026-10-17-remove-machine-translators-plan.md 取代（2026-10-17）

## 背景

项目 DFFluentRead（FluentRead fork）当前包含 8 个传统机器翻译提供商（microsoft、deepL、deeplx、google、xiaoniu、youdao、tencent、chromeTranslator）。用户希望移除这些传统机器翻译提供商，保留全部 LLM 大模型翻译提供商。

## 目标

1. 移除 8 个传统机器翻译提供商
2. 保留全部 LLM 提供商（openai、azureOpenai、gemini、deepseek、openrouter 等）
3. 默认服务从 microsoft 改为 openrouter
4. 输入框翻译功能（依赖微软 API）一并移除
5. chromeTranslator 连带 offscreen 目录和权限一并移除

## 删除的文件（9 个）

- entrypoints/service/microsoft.ts
- entrypoints/service/deepl.ts
- entrypoints/service/deeplx.ts
- entrypoints/service/google.ts
- entrypoints/service/xiaoniu.ts
- entrypoints/service/youdao.ts
- entrypoints/service/tencent.ts
- entrypoints/service/chrome-translator.ts
- entrypoints/offscreen/（整个目录）

## 修改的文件（9 个）

| 文件 | 修改内容 |
|------|---------|
| service/_service.ts | 删除 8 个 import 和 8 个映射条目 |
| utils/option.ts | 删除 8 个 services key、machine 集合、useToken/useProxy/useCustomUrl 中机器条目、isYoudao/isTencent 判断、options.services 中 8 个选项；默认服务改为 services.openrouter |
| utils/constant.ts | 删除 5 个机器翻译 URL（deepL/deeplx/xiaoniu/youdao/tencent） |
| utils/model.ts | 删除 4 个字段：deeplx、youdaoAppKey、youdaoAppSecret；保留 tencentSecretId/tencentSecretKey（混元翻译共用） |
| utils/check.ts | 删除 deeplx、tencent（非混元部分）、google 三个分支 |
| background.ts | 删除微软翻译函数（14-56 行）及 inputBoxTranslation 分支（168-172 行） |
| main/trans.ts | 简化 isMachine 分支，统一走 LLMStandardHTML |
| components/Main.vue | 删除 showDeepLX/showYoudao/showTencent/showMachine 及模板区块、google 过滤逻辑 |
| wxt.config.ts | 删除 offscreen 权限（保留 browser_specific_settings） |

## 关键风险点处理

1. 腾讯字段共用：tencentSecretId/tencentSecretKey 被 hunyuan-translation.ts（LLM 混元翻译）共用 → 保留字段，只移除 tencent 服务本身对它的使用
2. 输入框翻译：background.ts 中微软专用翻译函数（还承担输入框翻译）→ 一并删除
3. 默认服务：microsoft → openrouter
4. batchTranslation.ts：isLLM 判断简化（机器翻译被移除后恒为 LLM 路径）

## 验证

- pnpm compile：与升级前基线对比，不应新增错误
- pnpm build：构建成功
- Firefox 调试验证：设置页无机器翻译选项、默认服务为 openrouter、翻译功能正常