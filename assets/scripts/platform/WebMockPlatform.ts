/**
 * WebMockPlatform
 *
 * Web 预览与 Cocos Creator 编辑器环境使用的 mock 平台实现。
 * 存储使用 localStorage，其余能力返回 mock 结果。
 * 用于开发调试和玩法验证，不依赖任何小游戏平台 API。
 */

import { IPlatform, LoginResult, ShareResult, RewardAdResult, SystemInfo } from './IPlatform';

export class WebMockPlatform implements IPlatform {
    async login(): Promise<LoginResult> {
        console.log('[WebMockPlatform] login called — returning mock result');
        return {
            userId: 'web_mock_user_001',
            token: '',
        };
    }

    async share(title: string, _imageUrl?: string): Promise<ShareResult> {
        console.log(`[WebMockPlatform] share called — title: "${title}"`);
        return { success: true };
    }

    async showRewardAd(_adUnitId?: string): Promise<RewardAdResult> {
        console.log('[WebMockPlatform] showRewardAd called — returning rewarded');
        return { rewarded: true };
    }

    async vibrateShort(): Promise<void> {
        console.log('[WebMockPlatform] vibrateShort called');
    }

    async getSystemInfo(): Promise<SystemInfo> {
        return {
            screenWidth: window.innerWidth || 375,
            screenHeight: window.innerHeight || 667,
            brand: 'web',
            model: 'browser',
            system: navigator.userAgent || 'web',
            platform: 'web',
        };
    }

    async getStorage(key: string): Promise<string | null> {
        try {
            const value = localStorage.getItem(key);
            return value ?? null;
        } catch (e) {
            console.warn('[WebMockPlatform] getStorage failed:', e);
            return null;
        }
    }

    async setStorage(key: string, value: string): Promise<void> {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('[WebMockPlatform] setStorage failed:', e);
        }
    }

    async removeStorage(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('[WebMockPlatform] removeStorage failed:', e);
        }
    }
}
