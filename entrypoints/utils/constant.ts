import { services } from "./option";

// 常量工具类
export const urls: any = {
    [services.openai]: "https://api.openai.com/v1/chat/completions",
    [services.azureOpenai]: "https://your-resource-name.openai.azure.com/openai/deployments/your-deployment-name/chat/completions?api-version=2024-02-15-preview",
    [services.moonshot]: "https://api.moonshot.cn/v1/chat/completions",
    [services.custom]: "https://localhost:11434/v1/chat/completions",
    [services.tongyi]: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    [services.zhipu]: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    [services.claude]: "https://api.anthropic.com/v1/messages",
    [services.baichuan]: "https://api.baichuan-ai.com/v1/chat/completions",
    [services.lingyi]: "https://api.lingyiwanwu.com/v1/chat/completions",
    [services.deepseek]: "https://api.deepseek.com/chat/completions",
    [services.jieyue]: "https://api.stepfun.com/v1/chat/completions",
    [services.yiyan]: {tokenUrl: "https://aip.baidubce.com/oauth/2.0/token"},
    [services.groq]: "https://api.groq.com/openai/v1/chat/completions",
    [services.cozecom]: "https://api.coze.com/open_api/v2/chat",
    [services.cozecn]: "https://api.coze.cn/open_api/v2/chat",
    [services.huanYuan]: "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
    [services.huanYuanTranslation]: "https://hunyuan.tencentcloudapi.com/",
    [services.doubao]: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    [services.siliconCloud]: "https://api.siliconflow.cn/v1/chat/completions",
    [services.openrouter]: "https://openrouter.ai/api/v1/chat/completions",
    [services.opencodeZen]: "https://opencode.ai/zen/v1/chat/completions",
    [services.opencodeGo]: "https://opencode.ai/zen/go/v1/chat/completions",
    [services.grok]: "https://api.x.ai/v1/chat/completions",

    // [services.baidufree]:"https://fanyi.baidu.com/transapi"
    // [services.baidu]: "https://fanyi-api.baidu.com/api/trans/vip/translate",
}

// 支持从 API 获取模型列表的服务（OpenAI 兼容的 GET /models 接口）
export const modelUrls: any = {
    [services.deepseek]: "https://api.deepseek.com/models",
}

export const method = {POST: "POST", GET: "GET",};

export const constants = {
    // 键鼠事件
    DoubleClick: "DoubleClick",
    LongPress: "LongPress",
    MiddleClick: "MiddleClick",
    // 触屏设备事件
    TwoFinger: "TwoFinger",
    ThreeFinger: "ThreeFinger",
    FourFinger: "FourFinger",
    DoubleClickScreen: "DoubleClickScree",
    TripleClickScreen: "TripleClickScreen",
}

// 右键菜单ID常量
export const CONTEXT_MENU_IDS = {
    TRANSLATE_FULL_PAGE: 'fluent-read-translate-full-page',
    RESTORE_ORIGINAL: 'fluent-read-restore-original',
}
