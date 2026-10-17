import {services} from "../utils/option";
import custom from "./custom";
import tongyi from "./tongyi";
import zhipu from "./zhipu";
import yiyan from "./yiyan";
import gemini from "./gemini";
import claude from "./claude";
import infini from "@/entrypoints/service/infini";
import minimax from "@/entrypoints/service/minimax";
import common from "@/entrypoints/service/common";
import coze from "@/entrypoints/service/coze";
import deepseek from "./deepseek";
import newapi from "./newapi";
import azureOpenai from "./azure-openai";
import hunyuanTranslation from "./hunyuan-translation";

type ServiceFunction = (message: any) => Promise<any>;
type ServiceMap = {[key: string]: ServiceFunction;};

export const _service: ServiceMap = {
    // 大模型翻译
    [services.custom]: custom,
    [services.tongyi]: tongyi,
    [services.zhipu]: zhipu,
    [services.yiyan]: yiyan,
    [services.gemini]: gemini,
    [services.claude]: claude,
    [services.infini]: infini,
    [services.minimax]: minimax,
    [services.cozecom]: coze,
    [services.cozecn]: coze,
    [services.deepseek]: deepseek,
    [services.newapi]: newapi,
    // openai schema
    [services.openai]: common,
    [services.azureOpenai]: azureOpenai,
    [services.moonshot]: common,
    [services.baichuan]: common,
    [services.lingyi]: common,
    [services.jieyue]: common,
    [services.groq]: common,
    [services.huanYuan]: common,
    [services.huanYuanTranslation]: hunyuanTranslation,
    [services.doubao]: common,
    [services.siliconCloud]: common,
    [services.openrouter]: common,
    [services.opencodeZen]: common,
    [services.opencodeGo]: common,
    [services.grok]: common,
}
