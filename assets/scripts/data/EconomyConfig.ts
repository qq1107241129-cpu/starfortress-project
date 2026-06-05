/**
 * 经济配置
 * 定义在线收益、离线收益倍率和离线上限
 */

export interface EconomyConfig {
    baseOnlineIncome: number;
    offlineIncomeMultiplier: number;
    offlineIncomeCapMinutes: number;
    factoryOfflineBonusPerLevel: number;
    battleCoinMultiplier: number;
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

export function calculateOnlineIncome(factoryLevel: number): number {
    const factoryConfig = ECONOMY_CONFIG;
    return factoryConfig.baseOnlineIncome * (1 + (factoryLevel - 1) * 0.1);
}

export function calculateOfflineIncome(
    factoryLevel: number,
    offlineMinutes: number
): { income: number; cappedMinutes: number } {
    const config = ECONOMY_CONFIG;
    const maxMinutes = config.offlineIncomeCapMinutes + (factoryLevel - 1) * config.factoryOfflineBonusPerLevel;
    const cappedMinutes = Math.min(offlineMinutes, maxMinutes);
    const income = Math.floor(config.baseOnlineIncome * config.offlineIncomeMultiplier * (cappedMinutes / 1));
    return { income, cappedMinutes };
}
