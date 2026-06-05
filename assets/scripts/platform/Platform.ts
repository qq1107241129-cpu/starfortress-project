/**
 * Platform — 平台适配层入口
 *
 * 业务代码通过 Platform.instance 获取当前平台实现。
 * 根据运行环境自动选择 WechatPlatform / DouyinPlatform / TapTapMiniPlatform / WebMockPlatform。
 *
 * 使用方式：
 *   import { Platform } from './Platform';
 *   const result = await Platform.instance.login();
 */

import { IPlatform } from './IPlatform';
import { WebMockPlatform } from './WebMockPlatform';
import { WechatPlatform } from './WechatPlatform';
import { DouyinPlatform } from './DouyinPlatform';
import { TapTapMiniPlatform } from './TapTapMiniPlatform';

/**
 * 微信小游戏全局对象声明
 * 仅在微信小游戏运行时存在
 */
declare const wx: {
    login(option: { success?: (res: { code: string }) => void; fail?: (err: any) => void }): void;
    shareAppMessage(option: { title: string; imageUrl?: string }): void;
    createRewardedVideoAd(option: { adUnitId: string }): {
        show(): Promise<void>;
        onLoad(callback: () => void): void;
        onError(callback: (err: any) => void): void;
        onClose(callback: (res: { isEnded: boolean }) => void): void;
        destroy(): void;
    };
    vibrateShort(option?: { type?: string }): void;
    getSystemInfo(option: {
        success?: (res: any) => void;
        fail?: (err: any) => void;
        complete?: () => void;
    }): void;
    getStorageSync(key: string): string | '';
    setStorageSync(key: string, value: string): void;
    removeStorageSync(key: string): void;
    canIUse(api: string): boolean;
} | undefined;

/**
 * 抖音小游戏全局对象声明
 * 仅在抖音小游戏运行时存在
 */
declare const tt: {
    login(option: { success?: (res: { code: string; anonymousCode: string }) => void; fail?: (err: any) => void }): void;
    shareAppMessage(option: { title: string; imageUrl?: string; success?: () => void; fail?: (err: any) => void }): void;
    createRewardedVideoAd(option: { adUnitId: string }): {
        show(): Promise<void>;
        onLoad(callback: () => void): void;
        onError(callback: (err: any) => void): void;
        onClose(callback: (res: { isEnded: boolean }) => void): void;
        destroy(): void;
    };
    vibrateShort(option?: { type?: string; success?: () => void; fail?: (err: any) => void }): void;
    getSystemInfo(option: {
        success?: (res: any) => void;
        fail?: (err: any) => void;
        complete?: () => void;
    }): void;
    getStorageSync(option: { key: string }): string | '';
    setStorageSync(option: { key: string; data: string }): void;
    removeStorageSync(option: { key: string }): void;
} | undefined;

/**
 * TapTap 小游戏全局对象声明
 * 仅在 TapTap 小游戏运行时存在
 * 注：TapTap 小游戏 API 可能以 tap 或 TapSDK 形式暴露，具体以实际平台文档为准
 */
declare const tap: {
    login(): Promise<{ userId: string; token: string }>;
    share(option: { title: string; imageUrl?: string }): Promise<void>;
    showRewardAd(adUnitId: string): Promise<boolean>;
    vibrateShort(): Promise<void>;
    getSystemInfo(): Promise<any>;
    getStorage(key: string): Promise<string | null>;
    setStorage(key: string, value: string): Promise<void>;
    removeStorage(key: string): Promise<void>;
} | undefined;

/**
 * TapTap SDK 全局对象声明
 * 部分 TapTap 小游戏环境以 TapSDK 形式暴露，与 tap 并存或互为替代
 */
declare const TapSDK: {
    login(): Promise<{ userId: string; token: string }>;
    share(option: { title: string; imageUrl?: string }): Promise<void>;
    showRewardAd(adUnitId: string): Promise<boolean>;
    vibrateShort(): Promise<void>;
    getSystemInfo(): Promise<any>;
    getStorage(key: string): Promise<string | null>;
    setStorage(key: string, value: string): Promise<void>;
    removeStorage(key: string): Promise<void>;
} | undefined;

export class Platform {
    private static _instance: IPlatform | null = null;

    /**
     * 注册自定义平台实现，覆盖自动检测结果
     *
     * 用于测试、特殊环境或需要手动指定平台的场景。
     * 调用后 Platform.instance 将返回注册的实例。
     * 传入 null 可恢复自动检测行为。
     */
    static register(platform: IPlatform | null): void {
        this._instance = platform;
    }

    /**
     * 获取当前平台实例
     *
     * 优先返回通过 register() 注册的实例。
     * 未注册时根据运行环境自动检测：
     * - 微信小游戏环境（wx 全局对象存在）→ WechatPlatform
     * - 抖音小游戏环境（tt 全局对象存在）→ DouyinPlatform
     * - TapTap 小游戏环境（tap 或 TapSDK 全局对象存在）→ TapTapMiniPlatform
     * - 其他环境（Web 预览、编辑器）→ WebMockPlatform
     */
    static get instance(): IPlatform {
        if (!this._instance) {
            this._instance = this.detectPlatform();
        }
        return this._instance;
    }

    /**
     * 检测当前运行环境并返回对应平台实现
     *
     * any 使用说明：
     * wx / tt / tap / TapSDK 是小游戏运行时注入的全局对象，
     * TypeScript 编译期无法获得类型信息，
     * 通过 typeof 检查 + as any 访问，
     * 将 any 限制在 platform 目录内，业务层不会接触。
     */
    private static detectPlatform(): IPlatform {
        /* eslint-disable no-undef */
        // 微信小游戏
        if (typeof wx !== 'undefined' && wx) {
            return new WechatPlatform(wx as any);
        }

        // 抖音小游戏
        if (typeof tt !== 'undefined' && tt) {
            return new DouyinPlatform(tt as any);
        }

        // TapTap 小游戏（tap 或 TapSDK）
        if (typeof tap !== 'undefined' && tap) {
            return new TapTapMiniPlatform(tap as any);
        }
        if (typeof TapSDK !== 'undefined' && TapSDK) {
            return new TapTapMiniPlatform(TapSDK as any);
        }
        /* eslint-enable no-undef */

        // Web 预览 / 编辑器
        return new WebMockPlatform();
    }
}
