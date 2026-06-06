/**
 * 经济配置
 * 定义在线收益、离线收益倍率和离线上限
 *
 * 收益公式：
 * - 在线收益 = 矿场产出 × 工厂在线倍率 × baseCoinMultiplier
 * - 离线收益 = 在线收益 × offlineIncomeMultiplier × 离线分钟数（有上限）
 * - 离线上限 = offlineIncomeCapMinutes + (工厂等级 - 1) × factoryOfflineBonusPerLevel
 */

export interface EconomyConfig {
    /** 基础在线收益（未升级矿场时的兜底值，经营币/分钟） */
    baseOnlineIncome: number;
    /** 离线收益倍率（相对在线收益） */
    offlineIncomeMultiplier: number;
    /** 离线收益时间上限（分钟） */
    offlineIncomeCapMinutes: number;
    /** 每级工厂增加的离线时间上限（分钟） */
    factoryOfflineBonusPerLevel: number;
    /** 战斗金币全局倍率 */
    battleCoinMultiplier: number;
    /** 经营币全局倍率 */
    baseCoinMultiplier: number;
}

export const ECONOMY_CONFIG: EconomyConfig = {
    baseOnlineIncome: 10,
    offlineIncomeMultiplier: 0.3,
    offlineIncomeCapMinutes: 60,
    factoryOfflineBonusPerLevel: 15,
    battleCoinMultiplier: 1.0,
    baseCoinMultiplier: 1.0,
};

/**
 * 计算在线收益（经营币/分钟）
 * @param mineOutput 矿场当前等级的 effectValue（经营币/分钟）
 * @param factoryLevel 工厂等级（影响在线倍率）
 */
export function calculateOnlineIncomePerMinute(mineOutput: number, factoryLevel: number): number {
    const config = ECONOMY_CONFIG;
    const factoryMultiplier = 1 + (factoryLevel - 1) * 0.1;
    return mineOutput * factoryMultiplier * config.baseCoinMultiplier;
}

/**
 * 计算在线收益（向后兼容，使用 baseOnlineIncome 兜底）
 * @deprecated 请使用 calculateOnlineIncomePerMinute(mineOutput, factoryLevel)
 */
export function calculateOnlineIncome(factoryLevel: number): number {
    const config = ECONOMY_CONFIG;
    const factoryMultiplier = 1 + (factoryLevel - 1) * 0.1;
    return config.baseOnlineIncome * factoryMultiplier;
}

/**
 * 计算离线收益（支持新旧两种调用方式）
 *
 * 新方式：calculateOfflineIncome(mineOutput, factoryLevel, offlineMinutes)
 * 旧方式（向后兼容）：calculateOfflineIncome(factoryLevel, offlineMinutes)
 */
export function calculateOfflineIncome(
    mineOutputOrFactoryLevel: number,
    factoryLevelOrOfflineMinutes: number,
    offlineMinutes?: number
): { income: number; cappedMinutes: number; maxMinutes?: number } {
    const config = ECONOMY_CONFIG;

    let mineOutput: number;
    let factoryLevel: number;
    let offlineMin: number;

    if (offlineMinutes !== undefined) {
        // 新方式：(mineOutput, factoryLevel, offlineMinutes)
        mineOutput = mineOutputOrFactoryLevel;
        factoryLevel = factoryLevelOrOfflineMinutes;
        offlineMin = offlineMinutes;
    } else {
        // 旧方式：(factoryLevel, offlineMinutes)
        mineOutput = config.baseOnlineIncome;
        factoryLevel = mineOutputOrFactoryLevel;
        offlineMin = factoryLevelOrOfflineMinutes;
    }

    const maxMinutes = config.offlineIncomeCapMinutes + (factoryLevel - 1) * config.factoryOfflineBonusPerLevel;
    const cappedMinutes = Math.min(offlineMin, maxMinutes);
    const onlineRate = calculateOnlineIncomePerMinute(mineOutput, factoryLevel);
    const income = Math.floor(onlineRate * config.offlineIncomeMultiplier * cappedMinutes);
    return { income, cappedMinutes, maxMinutes };
}
