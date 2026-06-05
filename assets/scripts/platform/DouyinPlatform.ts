/**
 * DouyinPlatform — 抖音小游戏平台适配
 *
 * 仅在此文件中访问 tt 全局对象。
 * 抖音 API 与微信存在命名差异（如 getStorageSync 接收对象而非字符串），
 * 差异封装在本文件内部，业务层不感知。
 *
 * any 使用说明：
 * tt 对象由抖音小游戏运行时注入，TypeScript 无原生类型。
 * 构造函数接收外部传入的 tt 实例，内部通过 any 访问。
 * 业务层不会直接接触 any。
 */

import { IPlatform, LoginResult, ShareResult, RewardAdResult, SystemInfo } from './IPlatform';

export class DouyinPlatform implements IPlatform {
    private _tt: any;

    constructor(ttInstance: any) {
        this._tt = ttInstance;
    }

    async login(): Promise<LoginResult> {
        return new Promise<LoginResult>((resolve) => {
            try {
                this._tt.login({
                    success: (res: { code: string; anonymousCode: string }) => {
                        resolve({ userId: res.code || res.anonymousCode, token: res.code || '' });
                    },
                    fail: (err: any) => {
                        console.warn('[DouyinPlatform] login failed, degrading:', err);
                        resolve({ userId: '', token: '' });
                    },
                });
            } catch (e) {
                console.warn('[DouyinPlatform] login exception, degrading:', e);
                resolve({ userId: '', token: '' });
            }
        });
    }

    async share(title: string, imageUrl?: string): Promise<ShareResult> {
        return new Promise<ShareResult>((resolve) => {
            try {
                this._tt.shareAppMessage({
                    title,
                    imageUrl,
                    success: () => resolve({ success: true }),
                    fail: (err: any) => {
                        console.warn('[DouyinPlatform] share failed, degrading:', err);
                        resolve({ success: false });
                    },
                });
            } catch (e) {
                console.warn('[DouyinPlatform] share exception, degrading:', e);
                resolve({ success: false });
            }
        });
    }

    async showRewardAd(adUnitId?: string): Promise<RewardAdResult> {
        if (!adUnitId) {
            console.warn('[DouyinPlatform] showRewardAd: no adUnitId provided');
            return { rewarded: false };
        }

        try {
            const ad = this._tt.createRewardedVideoAd({ adUnitId });

            return new Promise<RewardAdResult>((resolve) => {
                const onClose = (res: { isEnded: boolean }) => {
                    ad.offClose(onClose);
                    resolve({ rewarded: res.isEnded });
                };

                ad.onClose(onClose);

                ad.onError((err: any) => {
                    console.warn('[DouyinPlatform] reward ad error:', err);
                    ad.offClose(onClose);
                    resolve({ rewarded: false });
                });

                ad.show().catch(() => {
                    ad.load().then(() => ad.show()).catch(() => {
                        ad.offClose(onClose);
                        resolve({ rewarded: false });
                    });
                });
            });
        } catch (e) {
            console.warn('[DouyinPlatform] showRewardAd failed, degrading:', e);
            return { rewarded: false };
        }
    }

    async vibrateShort(): Promise<void> {
        return new Promise<void>((resolve) => {
            try {
                this._tt.vibrateShort({
                    type: 'medium',
                    success: () => resolve(),
                    fail: () => resolve(),
                });
            } catch (e) {
                console.warn('[DouyinPlatform] vibrateShort failed, degrading:', e);
                resolve();
            }
        });
    }

    async getSystemInfo(): Promise<SystemInfo> {
        return new Promise<SystemInfo>((resolve) => {
            try {
                this._tt.getSystemInfo({
                    success: (res: any) => {
                        resolve({
                            screenWidth: res.screenWidth || 375,
                            screenHeight: res.screenHeight || 667,
                            brand: res.brand || '',
                            model: res.model || '',
                            system: res.system || '',
                            platform: 'douyin',
                        });
                    },
                    fail: (err: any) => {
                        console.warn('[DouyinPlatform] getSystemInfo failed, degrading:', err);
                        resolve({
                            screenWidth: 375,
                            screenHeight: 667,
                            brand: '',
                            model: '',
                            system: '',
                            platform: 'douyin',
                        });
                    },
                });
            } catch (e) {
                console.warn('[DouyinPlatform] getSystemInfo exception, degrading:', e);
                resolve({
                    screenWidth: 375,
                    screenHeight: 667,
                    brand: '',
                    model: '',
                    system: '',
                    platform: 'douyin',
                });
            }
        });
    }

    async getStorage(key: string): Promise<string | null> {
        try {
            // 抖音 getStorageSync 接收对象 { key }，与微信不同
            const value = this._tt.getStorageSync({ key });
            return value ?? null;
        } catch (e) {
            console.warn('[DouyinPlatform] getStorage failed, degrading:', e);
            return null;
        }
    }

    async setStorage(key: string, value: string): Promise<void> {
        try {
            // 抖音 setStorageSync 接收对象 { key, data }，与微信不同
            this._tt.setStorageSync({ key, data: value });
        } catch (e) {
            console.warn('[DouyinPlatform] setStorage failed, degrading:', e);
        }
    }

    async removeStorage(key: string): Promise<void> {
        try {
            // 抖音 removeStorageSync 接收对象 { key }，与微信不同
            this._tt.removeStorageSync({ key });
        } catch (e) {
            console.warn('[DouyinPlatform] removeStorage failed, degrading:', e);
        }
    }
}
