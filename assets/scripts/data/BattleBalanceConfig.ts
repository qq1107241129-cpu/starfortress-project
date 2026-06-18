/**
 * 战斗平衡配置
 * 集中管理战斗代码中的硬编码平衡常量
 *
 * 本文件只做配置化抽取，默认值与原硬编码值完全一致，行为不变。
 * 数值调优在后续任务中进行。
 */

export interface BattleBalanceConfig {
    // ==================== 敌人 ====================
    /** 敌人基础移动速度乘数（像素/秒），speed 字段乘以此值。原硬编码: 100 */
    enemyBaseSpeed: number;
    /** 敌人到达基地时造成的伤害。原硬编码: 10 */
    enemyBaseDamageToBase: number;

    // ==================== 投射物 ====================
    /** 投射物基础飞行速度（像素/秒）。原硬编码: 600 */
    projectileSpeed: number;
    /** 炮塔投射物速度系数（乘以 projectileSpeed）。原硬编码: 0.8 */
    splashProjectileSpeedFactor: number;
    /** 电塔投射物速度系数（乘以 projectileSpeed）。原硬编码: 1.5 */
    chainProjectileSpeedFactor: number;
    /** 命中碰撞容差（像素）。原硬编码: 5 */
    hitCollisionTolerance: number;

    // ==================== 伤害衰减 ====================
    /** 炮塔范围伤害衰减系数（0~1），距离中心越远伤害越低。原硬编码: 0.5 */
    splashDamageFalloff: number;
    /** 电塔链式伤害衰减系数（每次弹射乘以此值）。原硬编码: 0.8 */
    chainDamageFalloff: number;
    /** 电塔弹射距离上限（像素）。原硬编码: 120 */
    chainRange: number;

    // ==================== 技能 ====================
    /** 轨道炮命中半径（像素）。原硬编码: 100 */
    orbitalCannonRadius: number;
    /** 密集度搜索半径（像素）。原硬编码: 120 */
    densestSearchRadius: number;

    // ==================== 结算 ====================
    /** 失败时战斗金币倍率。原硬编码: 0.3 */
    defeatBattleCoinMultiplier: number;
    /** 失败时经营币倍率。原硬编码: 0.2 */
    defeatBaseCoinMultiplier: number;
    /** 基础经营币奖励（胜利时）。原硬编码: 50 */
    baseBaseCoinReward: number;
    /** 星级评定阈值：满星所需最低生命百分比。原硬编码: 0.8 */
    starRating3Threshold: number;
    /** 星级评定阈值：二星所需最低生命百分比。原硬编码: 0.5 */
    starRating2Threshold: number;

    // ==================== 肉鸽 ====================
    /** 肉鸽选择触发时间点（秒）。原硬编码: [45, 90, 135] */
    rogueTriggerTimes: number[];
    /** 每次肉鸽选择的候选选项数。原硬编码: 3 */
    rogueChoiceCount: number;

    // ==================== 战斗流程 ====================
    /** 放置阶段需要放置的塔数量。原硬编码: 4 */
    requiredTowerCount: number;

    // ==================== 合金系统（020） ====================
    /** 开局初始合金 */
    initialAlloy: number;
    /** 每级基地核心对应的塔等级上限 */
    towerLevelCapPerBaseLevel: number;
}

export const BATTLE_BALANCE: BattleBalanceConfig = {
    // 敌人
    enemyBaseSpeed: 100,
    enemyBaseDamageToBase: 10,

    // 投射物
    projectileSpeed: 600,
    splashProjectileSpeedFactor: 0.8,
    chainProjectileSpeedFactor: 1.5,
    hitCollisionTolerance: 5,

    // 伤害衰减
    splashDamageFalloff: 0.5,
    chainDamageFalloff: 0.8,
    chainRange: 120,

    // 技能
    orbitalCannonRadius: 100,
    densestSearchRadius: 120,

    // 结算
    defeatBattleCoinMultiplier: 0.3,
    defeatBaseCoinMultiplier: 0.2,
    baseBaseCoinReward: 50,
    starRating3Threshold: 0.8,
    starRating2Threshold: 0.5,

    // 肉鸽
    rogueTriggerTimes: [45, 90, 135],
    rogueChoiceCount: 3,

    // 战斗流程
    requiredTowerCount: 4,

    // 合金系统（020）
    initialAlloy: 200,
    towerLevelCapPerBaseLevel: 6,
};
