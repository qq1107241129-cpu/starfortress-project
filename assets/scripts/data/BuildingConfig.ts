/**
 * 建筑配置
 * 定义 MVP 5 个建筑的属性
 */

/** 升级消耗资源类型 */
export type CostType = 'baseCoin' | 'battleCoin';

export interface BuildingLevelConfig {
    level: number;
    upgradeCost: number;
    effectValue: number;
}

export interface BuildingConfig {
    id: string;
    name: string;
    description: string;
    type: 'base' | 'lab' | 'mine' | 'reactor' | 'factory';
    /** 升级消耗的资源类型 */
    costType: CostType;
    baseEffect: number;
    levels: BuildingLevelConfig[];
}

export const BUILDING_CONFIGS: BuildingConfig[] = [
    {
        id: 'building_base',
        name: '基地核心',
        description: '主等级，影响解锁和星核重构条件',
        type: 'base',
        costType: 'battleCoin',
        baseEffect: 1,
        levels: [
            { level: 1, upgradeCost: 0, effectValue: 1 },
            { level: 2, upgradeCost: 200, effectValue: 2 },
            { level: 3, upgradeCost: 500, effectValue: 3 },
            { level: 4, upgradeCost: 1000, effectValue: 4 },
            { level: 5, upgradeCost: 2000, effectValue: 5 },
            { level: 6, upgradeCost: 4000, effectValue: 6 },
            { level: 7, upgradeCost: 8000, effectValue: 7 },
            { level: 8, upgradeCost: 16000, effectValue: 8 },
            { level: 9, upgradeCost: 32000, effectValue: 9 },
            { level: 10, upgradeCost: 64000, effectValue: 10 },
        ],
    },
    {
        id: 'building_lab',
        name: '研究所',
        description: '提升塔攻击、射速、科技和肉鸽品质',
        type: 'lab',
        costType: 'baseCoin',
        baseEffect: 1.0,
        levels: [
            { level: 1, upgradeCost: 0, effectValue: 1.0 },
            { level: 2, upgradeCost: 150, effectValue: 1.05 },
            { level: 3, upgradeCost: 350, effectValue: 1.10 },
            { level: 4, upgradeCost: 700, effectValue: 1.15 },
            { level: 5, upgradeCost: 1400, effectValue: 1.20 },
            { level: 6, upgradeCost: 2800, effectValue: 1.25 },
            { level: 7, upgradeCost: 5600, effectValue: 1.30 },
            { level: 8, upgradeCost: 11200, effectValue: 1.35 },
            { level: 9, upgradeCost: 22400, effectValue: 1.40 },
            { level: 10, upgradeCost: 44800, effectValue: 1.50 },
        ],
    },
    {
        id: 'building_mine',
        name: '矿场',
        description: '产出经营币',
        type: 'mine',
        costType: 'baseCoin',
        baseEffect: 10,
        levels: [
            { level: 1, upgradeCost: 0, effectValue: 10 },
            { level: 2, upgradeCost: 100, effectValue: 15 },
            { level: 3, upgradeCost: 250, effectValue: 22 },
            { level: 4, upgradeCost: 500, effectValue: 30 },
            { level: 5, upgradeCost: 1000, effectValue: 40 },
            { level: 6, upgradeCost: 2000, effectValue: 55 },
            { level: 7, upgradeCost: 4000, effectValue: 75 },
            { level: 8, upgradeCost: 8000, effectValue: 100 },
            { level: 9, upgradeCost: 16000, effectValue: 140 },
            { level: 10, upgradeCost: 32000, effectValue: 200 },
        ],
    },
    {
        id: 'building_reactor',
        name: '能源反应堆',
        description: '提升主动技能次数或初始能量',
        type: 'reactor',
        costType: 'battleCoin',
        baseEffect: 1,
        levels: [
            { level: 1, upgradeCost: 0, effectValue: 1 },
            { level: 2, upgradeCost: 200, effectValue: 2 },
            { level: 3, upgradeCost: 500, effectValue: 3 },
            { level: 4, upgradeCost: 1000, effectValue: 4 },
            { level: 5, upgradeCost: 2000, effectValue: 5 },
        ],
    },
    {
        id: 'building_factory',
        name: '工厂',
        description: '提升在线收益倍率和离线收益上限',
        type: 'factory',
        costType: 'baseCoin',
        baseEffect: 1.0,
        levels: [
            { level: 1, upgradeCost: 0, effectValue: 1.0 },
            { level: 2, upgradeCost: 300, effectValue: 1.10 },
            { level: 3, upgradeCost: 700, effectValue: 1.20 },
            { level: 4, upgradeCost: 1500, effectValue: 1.30 },
            { level: 5, upgradeCost: 3000, effectValue: 1.50 },
        ],
    },
];

export function getBuildingConfig(buildingId: string): BuildingConfig | undefined {
    return BUILDING_CONFIGS.find(b => b.id === buildingId);
}

export function getBuildingLevelConfig(buildingId: string, level: number): BuildingLevelConfig | undefined {
    const building = getBuildingConfig(buildingId);
    return building?.levels.find(l => l.level === level);
}
