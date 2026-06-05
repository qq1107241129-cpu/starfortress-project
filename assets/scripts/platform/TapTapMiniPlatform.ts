/**
 * TapTapMiniPlatform — TapTap 小游戏平台适配
 *
 * 仅在此文件中访问 tap 全局对象。
 * TapTap 小游戏 API 以 tap 或 TapSDK 形式暴露，具体以实际平台文档为准。
 * 本文件假设 API 为 Promise 风格；如实际平台使用回调风格，需在此文件内适配。
 *
 * 注意：TapTap Android APK 原生 SDK 不在 MVP 范围内，
 * 本文件仅适配 TapTap 小游戏方向。
 *
 * any 使用说明：
 * tap 对象由 TapTap 小游戏运行时注入，TypeScript 无原生类型。
 * 构造函数接收外部传入的 tap 实例，内部通过 any 访问。
 * 业务层不会直接接触 any。
 */

import { IPlatform, LoginResult, ShareResult, RewardAdResult, SystemInfo } from './IPlatform';

export class TapTapMiniPlatform implements IPlatform {
    private _tap: any;

    constructor(tapInstance: any) {
        this._tap = tapInstance;
    }

    async login(): Promise<LoginResult> {
        try {
            const res = await this._tap.login();
            return {
                userId: res.userId || '',
                token: res.token || '',
            };
        } catch (e) {
            console.warn('[TapTapMiniPlatform] login failed, degrading:', e);
            return { userId: '', token: '' };
        }
    }

    async share(title: string, imageUrl?: string): Promise<ShareResult> {
        try {
            await this._tap.share({ title, imageUrl });
            return { success: true };
        } catch (e) {
            console.warn('[TapTapMiniPlatform] share failed, degrading:', e);
            return { success: false };
        }
    }

    async showRewardAd(adUnitId?: string): Promise<RewardAdResult> {
        if (!adUnitId) {
            console.warn('[TapTapMiniPlatform] showRewardAd: no adUnitId provided');
            return { rewarded: false };
        }

        try {
            const rewarded = await this._tap.showRewardAd(adUnitId);
            return { rewarded: !!rewarded };
        } catch (e) {
            console.warn('[TapTapMiniPlatform] showRewardAd failed, degrading:', e);
            return { rewarded: false };
        }
    }

    async vibrateShort(): Promise<void> {
        try {
            await this._tap.vibrateShort();
        } catch (e) {
            console.warn('[TapTapMiniPlatform] vibrateShort failed, degrading:', e);
        }
    }

    async getSystemInfo(): Promise<SystemInfo> {
        try {
            const res = await this._tap.getSystemInfo();
            return {
                screenWidth: res.screenWidth || 375,
                screenHeight: res.screenHeight || 667,
                brand: res.brand || '',
                model: res.model || '',
                system: res.system || '',
                platform: 'taptap',
            };
        } catch (e) {
            console.warn('[TapTapMiniPlatform] getSystemInfo failed, degrading:', e);
            return {
                screenWidth: 375,
                screenHeight: 667,
                brand: '',
                model: '',
                system: '',
                platform: 'taptap',
            };
        }
    }

    async getStorage(key: string): Promise<string | null> {
        try {
            const value = await this._tap.getStorage(key);
            return value ?? null;
        } catch (e) {
            console.warn('[TapTapMiniPlatform] getStorage failed, degrading:', e);
            return null;
        }
    }

    async setStorage(key: string, value: string): Promise<void> {
        try {
            await this._tap.setStorage(key, value);
        } catch (e) {
            console.warn('[TapTapMiniPlatform] setStorage failed, degrading:', e);
        }
    }

    async removeStorage(key: string): Promise<void> {
        try {
            await this._tap.removeStorage(key);
        } catch (e) {
            console.warn('[TapTapMiniPlatform] removeStorage failed, degrading:', e);
        }
    }
}
