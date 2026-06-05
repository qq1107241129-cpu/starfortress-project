/**
 * 平台适配层统一接口
 *
 * 所有平台能力必须通过此接口暴露。
 * 业务代码只通过 Platform.instance 访问，不直接调用 wx / tt / tap / TapSDK。
 */

/** 登录结果 */
export interface LoginResult {
    /** 平台用户唯一标识，Web 调试环境返回 mock 值 */
    userId: string;
    /** 登录凭证，小游戏平台用于换取 openid，Web 调试环境返回空字符串 */
    token: string;
}

/** 分享结果 */
export interface ShareResult {
    /** 分享是否成功 */
    success: boolean;
}

/** 广告结果 */
export interface RewardAdResult {
    /** 广告是否成功播放并发放奖励 */
    rewarded: boolean;
}

/** 系统信息 */
export interface SystemInfo {
    /** 屏幕宽度 px */
    screenWidth: number;
    /** 屏幕高度 px */
    screenHeight: number;
    /** 设备品牌 */
    brand: string;
    /** 设备型号 */
    model: string;
    /** 操作系统及版本 */
    system: string;
    /** 平台标识：wechat / douyin / taptap / web */
    platform: string;
}

/**
 * 平台能力接口
 *
 * 所有方法返回 Promise，统一异步模型。
 * 平台能力不可用时返回降级结果，不抛异常。
 */
export interface IPlatform {
    /** 登录 */
    login(): Promise<LoginResult>;

    /** 分享 */
    share(title: string, imageUrl?: string): Promise<ShareResult>;

    /** 展示激励视频广告 */
    showRewardAd(adUnitId?: string): Promise<RewardAdResult>;

    /** 短振动 */
    vibrateShort(): Promise<void>;

    /** 获取系统信息 */
    getSystemInfo(): Promise<SystemInfo>;

    /** 读取本地存储，key 不存在返回 null */
    getStorage(key: string): Promise<string | null>;

    /** 写入本地存储 */
    setStorage(key: string, value: string): Promise<void>;

    /** 删除本地存储 */
    removeStorage(key: string): Promise<void>;
}
