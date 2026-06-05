/**
 * WechatPlatform — 微信小游戏平台适配
 *
 * 仅在此文件中访问 wx 全局对象。
 * 所有 wx API 调用均做降级处理：能力不可用时返回安全默认值，不抛异常。
 *
 * any 使用说明：
 * wx 对象由微信小游戏运行时注入，TypeScript 无原生类型。
 * 构造函数接收外部传入的 wx 实例，内部通过 any 访问。
 * 业务层不会直接接触 any。
 */

import { IPlatform, LoginResult, ShareResult, RewardAdResult, SystemInfo } from './IPlatform';

/** 平台回调风格的 Promise 包装器 */
function wrapCallback<T>(
    api: (option: { success?: (res: T) => void; fail?: (err: any) => void; complete?: () => void }) => void,
    option?: Record<string, any>
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        try {
            api({
                ...option,
                success: (res: T) => resolve(res),
                fail: (err: any) => reject(err),
            });
        } catch (e) {
            reject(e);
        }
    });
}

export class WechatPlatform implements IPlatform {
    private _wx: any;

    constructor(wxInstance: any) {
        this._wx = wxInstance;
    }

    async login(): Promise<LoginResult> {
        try {
            const res = await wrapCallback<{ code: string }>(this._wx.login.bind(this._wx));
            return { userId: res.code, token: res.code };
        } catch (e) {
            console.warn('[WechatPlatform] login failed, degrading:', e);
            return { userId: '', token: '' };
        }
    }

    async share(title: string, imageUrl?: string): Promise<ShareResult> {
        try {
            this._wx.shareAppMessage({ title, imageUrl });
            return { success: true };
        } catch (e) {
            console.warn('[WechatPlatform] share failed, degrading:', e);
            return { success: false };
        }
    }

    async showRewardAd(adUnitId?: string): Promise<RewardAdResult> {
        if (!adUnitId) {
            console.warn('[WechatPlatform] showRewardAd: no adUnitId provided');
            return { rewarded: false };
        }

        try {
            const ad = this._wx.createRewardedVideoAd({ adUnitId });

            return new Promise<RewardAdResult>((resolve) => {
                const onClose = (res: { isEnded: boolean }) => {
                    ad.offClose(onClose);
                    resolve({ rewarded: res.isEnded });
                };

                ad.onClose(onClose);

                ad.onError((err: any) => {
                    console.warn('[WechatPlatform] reward ad error:', err);
                    ad.offClose(onClose);
                    resolve({ rewarded: false });
                });

                ad.show().catch(() => {
                    // 广告加载失败时尝试重新加载
                    ad.load().then(() => ad.show()).catch(() => {
                        ad.offClose(onClose);
                        resolve({ rewarded: false });
                    });
                });
            });
        } catch (e) {
            console.warn('[WechatPlatform] showRewardAd failed, degrading:', e);
            return { rewarded: false };
        }
    }

    async vibrateShort(): Promise<void> {
        try {
            this._wx.vibrateShort({ type: 'medium' });
        } catch (e) {
            console.warn('[WechatPlatform] vibrateShort failed, degrading:', e);
        }
    }

    async getSystemInfo(): Promise<SystemInfo> {
        try {
            const res = await wrapCallback<any>(this._wx.getSystemInfo.bind(this._wx));
            return {
                screenWidth: res.screenWidth || 375,
                screenHeight: res.screenHeight || 667,
                brand: res.brand || '',
                model: res.model || '',
                system: res.system || '',
                platform: 'wechat',
            };
        } catch (e) {
            console.warn('[WechatPlatform] getSystemInfo failed, degrading:', e);
            return {
                screenWidth: 375,
                screenHeight: 667,
                brand: '',
                model: '',
                system: '',
                platform: 'wechat',
            };
        }
    }

    async getStorage(key: string): Promise<string | null> {
        try {
            const value = this._wx.getStorageSync(key);
            return value ?? null;
        } catch (e) {
            console.warn('[WechatPlatform] getStorage failed, degrading:', e);
            return null;
        }
    }

    async setStorage(key: string, value: string): Promise<void> {
        try {
            this._wx.setStorageSync(key, value);
        } catch (e) {
            console.warn('[WechatPlatform] setStorage failed, degrading:', e);
        }
    }

    async removeStorage(key: string): Promise<void> {
        try {
            this._wx.removeStorageSync(key);
        } catch (e) {
            console.warn('[WechatPlatform] removeStorage failed, degrading:', e);
        }
    }
}
