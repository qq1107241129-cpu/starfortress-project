/**
 * 塔配置
 * 定义 MVP 四种塔的属性
 */

export interface TowerLevelConfig {
    level: number;
    attack: number;
    attackSpeed: number;
    range: number;
    upgradeCost: number;
}

export interface TowerConfig {
    id: string;
    name: string;
    description: string;
    type: 'machinegun_tower' | 'cannon_tower' | 'ice_tower' | 'electric_tower';
    baseAttack: number;
    baseAttackSpeed: number;
    baseRange: number;
    /** 炮塔：爆炸半径（像素），0 表示单体 */
    splashRadius: number;
    /** 电塔：链式弹射数量，0 表示不弹射 */
    chainCount: number;
    /** 冰塔：减速系数（0~1），0 表示无减速。敌人速度乘以 (1 - slowFactor) */
    slowFactor: number;
    /** 冰塔：减速持续时间（秒） */
    slowDuration: number;
    levels: TowerLevelConfig[];
}

export const TOWER_CONFIGS: TowerConfig[] = [
    {
        id: 'machinegun_tower',
        name: '机枪塔',
        description: '基础单体输出，射速快，伤害稳定',
        type: 'machinegun_tower',
        baseAttack: 10,
        baseAttackSpeed: 0.5,
        baseRange: 150,
        splashRadius: 0,
        chainCount: 0,
        slowFactor: 0,
        slowDuration: 0,
        levels: [
            { level: 1, attack: 10, attackSpeed: 0.5, range: 450, upgradeCost: 0 },
            { level: 2, attack: 15, attackSpeed: 0.45, range: 460, upgradeCost: 100 },
            { level: 3, attack: 22, attackSpeed: 0.4, range: 470, upgradeCost: 250 },
            { level: 4, attack: 30, attackSpeed: 0.35, range: 480, upgradeCost: 500 },
            { level: 5, attack: 40, attackSpeed: 0.3, range: 500, upgradeCost: 1000 },
        ],
    },
    {
        id: 'cannon_tower',
        name: '炮塔',
        description: '范围伤害，攻击慢，爆炸范围伤害',
        type: 'cannon_tower',
        baseAttack: 25,
        baseAttackSpeed: 1.5,
        baseRange: 120,
        splashRadius: 120,
        chainCount: 0,
        slowFactor: 0,
        slowDuration: 0,
        levels: [
            { level: 1, attack: 25, attackSpeed: 1.5, range: 420, upgradeCost: 0 },
            { level: 2, attack: 40, attackSpeed: 1.4, range: 430, upgradeCost: 150 },
            { level: 3, attack: 60, attackSpeed: 1.3, range: 440, upgradeCost: 350 },
            { level: 4, attack: 85, attackSpeed: 1.2, range: 450, upgradeCost: 700 },
            { level: 5, attack: 120, attackSpeed: 1.1, range: 460, upgradeCost: 1400 },
        ],
    },
    {
        id: 'ice_tower',
        name: '冰塔',
        description: '控制，降低敌人移动速度',
        type: 'ice_tower',
        baseAttack: 5,
        baseAttackSpeed: 1.0,
        baseRange: 130,
        splashRadius: 0,
        chainCount: 0,
        slowFactor: 0.4,
        slowDuration: 2.0,
        levels: [
            { level: 1, attack: 5, attackSpeed: 1.0, range: 430, upgradeCost: 0 },
            { level: 2, attack: 8, attackSpeed: 0.9, range: 440, upgradeCost: 120 },
            { level: 3, attack: 12, attackSpeed: 0.8, range: 450, upgradeCost: 280 },
            { level: 4, attack: 18, attackSpeed: 0.7, range: 460, upgradeCost: 560 },
            { level: 5, attack: 25, attackSpeed: 0.6, range: 480, upgradeCost: 1100 },
        ],
    },
    {
        id: 'electric_tower',
        name: '电塔',
        description: '链式攻击，攻击多个敌人',
        type: 'electric_tower',
        baseAttack: 15,
        baseAttackSpeed: 0.8,
        baseRange: 140,
        splashRadius: 0,
        chainCount: 3,
        slowFactor: 0,
        slowDuration: 0,
        levels: [
            { level: 1, attack: 15, attackSpeed: 0.8, range: 440, upgradeCost: 0 },
            { level: 2, attack: 22, attackSpeed: 0.75, range: 450, upgradeCost: 130 },
            { level: 3, attack: 32, attackSpeed: 0.7, range: 460, upgradeCost: 300 },
            { level: 4, attack: 45, attackSpeed: 0.65, range: 470, upgradeCost: 600 },
            { level: 5, attack: 60, attackSpeed: 0.6, range: 480, upgradeCost: 1200 },
        ],
    },
];

export function getTowerConfig(towerId: string): TowerConfig | undefined {
    return TOWER_CONFIGS.find(t => t.id === towerId);
}

export function getTowerLevelConfig(towerId: string, level: number): TowerLevelConfig | undefined {
    const tower = getTowerConfig(towerId);
    return tower?.levels.find(l => l.level === level);
}
