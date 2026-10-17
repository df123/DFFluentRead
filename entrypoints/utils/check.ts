import { customModelString, services, servicesType } from "./option";
import { sendErrorMessage } from "./tip";
import { config } from "@/entrypoints/utils/config";

// 检查翻译服务是否就绪（不检查 config.on，供非悬浮入口使用）
export function checkServiceReady(): boolean {
    // 0. 服务必须已选择且有效
    if (!servicesType.isValid(config.service)) {
        sendErrorMessage("翻译服务尚未配置，请前往设置页选择翻译服务并填写 API Key");
        return false;
    }

    // 2. Check if the token is provided for services that require it
    if (servicesType.isUseToken(config.service) && !config.token[config.service]) {
        sendErrorMessage("令牌尚未配置，请前往设置页配置");
        return false;
    }
    // Special case for YiYan service (requires both AK and SK)
    if (config.service === services.yiyan && (!config.ak || !config.sk)) {
        sendErrorMessage("令牌尚未配置，请前往设置页配置");
        return false;
    }
    
    // Special case for Tencent Hunyuan Translation service (requires both SecretId and SecretKey)
    if (config.service === services.huanYuanTranslation && (!config.tencentSecretId || !config.tencentSecretKey)) {
        sendErrorMessage("腾讯混元翻译密钥尚未配置，请前往设置页配置SecretId和SecretKey");
        return false;
    }

    // 3. Check if a model is selected for AI services (except specific services like Coze)
    if (servicesType.isAI(config.service) && ![services.cozecn, services.cozecom].includes(config.service)) {
        const model = config.model[config.service];
        const customModel = config.customModel[config.service];
        if (!model || (model === customModelString && !customModel)) {
            sendErrorMessage("模型尚未配置，请前往设置页配置");
            return false;
        }
    }

    return true;
}

// Check configuration before translation
export function checkConfig(): boolean {
    // 1. Check if the plugin is enabled
    if (!config.on) return false;

    // 2. 服务就绪检查（服务选择、令牌、密钥、模型）
    return checkServiceReady();
}

// Check if the node needs to be translated
export function skipNode(node: Node): boolean {
    return !node || !node.textContent?.trim() || hasLoadingSpinner(node) || hasRetryTag(node);
}

// Check if the node or any of its children contains a loading spinner
export function hasLoadingSpinner(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) return false;

    // Type guard to check if the node is an Element
    if (node instanceof Element && node.classList.contains('fluent-read-loading')) return true;

    // Check children only if the node is an Element
    if (node instanceof Element) {
        return Array.from(node.children).some(child => hasLoadingSpinner(child));
    }

    return false;
}

// Check if the node or any of its children contains a retry tag
export function hasRetryTag(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) return false;

    // Type guard to check if the node is an Element
    if (node instanceof Element && node.classList.contains('fluent-read-failure')) return true;

    // Check children only if the node is an Element
    if (node instanceof Element) {
        return Array.from(node.children).some(child => hasRetryTag(child));
    }

    return false;
}

// Search for a node with a specific class name
export function searchClassName(node: Node, className: string): Node | null {
    if (node instanceof Element && node.classList.contains(className)) return node;

    // Check children only if the node is an Element
    if (node instanceof Element) {
        for (let child of node.children) {
            let result = searchClassName(child, className);
            if (result) return result;
        }
    }

    return null;
}

export function contentPostHandler(text: string) {
    // 替换掉<think>与</think>之间的内容
    let content = text;
    content = content.replace(/^<think>[\s\S]*?<\/think>/, "");
    return content;
}