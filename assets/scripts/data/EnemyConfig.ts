/**
 * 敌人配置
 * 定义 MVP 五种敌人的属性
 */

export interface EnemyConfig {
    id: string;
    name: string;
    description: string;
    type: 'normal' | 'fast' | 'heavy' | 'split' | 'boss';
    health: number;
    speed: number;
    armor: number;
    reward: number;
    special?: {
        splitCount?: number;
        splitEnemyId?: string;
    };
}

export const ENEMY_CONFIGS: EnemyConfig[] = [
    {
        id: 'enemy_mech_bug',
        name: '普通机械虫',
        description: '血量低、速度中、奖励低',
        type: 'normal',
        health: 15,
        speed: 1.0,
        armor: 0,
        reward: 10,
    },
    {
        id: 'enemy_fast_bug',
        name: '快速突击虫',
        description: '血量低、速度快',
        type: 'fast',
        health: 15,
        speed: 2.0,
        armor: 0,
        reward: 15,
    },
    {
        id: 'enemy_heavy_mech',
        name: '重甲机械兵',
        description: '血量高、护甲高、速度慢',
        type: 'heavy',
        health: 100,
        speed: 0.5,
        armor: 20,
        reward: 50,
    },
    {
        id: 'enemy_split_drone',
        name: '分裂无人机',
        description: '死亡后分裂或生成小单位',
        type: 'split',
        health: 40,
        speed: 1.2,
        armor: 5,
        reward: 30,
        special: {
            splitCount: 2,
            splitEnemyId: 'enemy_mech_bug',
        },
    },
    {
        id: 'enemy_boss',
        name: '小 Boss',
        description: '血量高、奖励高、最后 30 秒出现',
        type: 'boss',
        health: 500,
        speed: 0.3,
        armor: 30,
        reward: 200,
    },
];

export function getEnemyConfig(enemyId: string): EnemyConfig | undefined {
    return ENEMY_CONFIGS.find(e => e.id === enemyId);
}
