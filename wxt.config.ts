import {defineConfig} from 'wxt';
import vue from '@vitejs/plugin-vue';
import {resolve} from 'path';
import fs from 'fs';


const packageJson = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

interface FirefoxGeckoSettings {
    id?: string;
    strict_min_version?: string;
    strict_max_version?: string;
    update_url?: string;
    data_collection_permissions?: {
        required?: string[];
        optional?: string[];
    };
}


// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/webextension-polyfill'],
    imports: {
        addons: {
            vueTemplate: true,
        },
    },
    vite: () => ({
        plugins: [vue()],
        define: {
            'process.env.VUE_APP_VERSION': JSON.stringify(packageJson.version),
        }
    }),
    manifest: {
        permissions: ['storage', 'contextMenus', 'offscreen'],
        browser_specific_settings: {
            gecko: {
                data_collection_permissions: {
                    required: ['websiteContent'],
                    optional: ['technicalAndInteraction'],
                },
            } as FirefoxGeckoSettings,
        },
    },
    // WXT 的 web-ext runner 对 chromium 用 --remote-debugging-pipe（无 TCP 端口），
    // Playwright 等外部工具连不上；且品牌版 Chrome 137+ 已忽略 --load-extension。
    // 设 WXT_NO_RUNNER=1 走手动模式：只构建+监听，浏览器由外部启动
    // （--remote-debugging-port=9222 --enable-unsafe-extension-debugging），
    // 扩展通过 CDP Extensions.loadUnpacked 加载 .output/chrome-mv3-dev。
    webExt: {
        disabled: process.env.WXT_NO_RUNNER === '1',
    },

});