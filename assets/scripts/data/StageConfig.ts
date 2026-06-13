/**
 * 关卡配置
 * 定义 MVP 10 个关卡的属性
 */

export interface WaveConfig {
    time: number;
    enemyId: string;
    count: number;
    interval: number;
}

export interface StageConfig {
    id: string;
    name: string;
    description: string;
    duration: number;
    waves: WaveConfig[];
    bossTime: number;
    bossEnemyId: string;
    baseHealth: number;
    rewardMultiplier: number;
}

export const STAGE_CONFIGS: StageConfig[] = [
    {
        id: 'stage_1',
        name: '前线哨站',
        description: '第 1 关无脑过，建立目标感',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_mech_bug', count: 15, interval: 1 },
            { time: 30, enemyId: 'enemy_mech_bug', count: 24, interval: 0.5 },
            { time: 60, enemyId: 'enemy_mech_bug', count: 15, interval: 0.4 },
            { time: 90, enemyId: 'enemy_fast_bug', count: 15, interval: 0.3 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 100,
        rewardMultiplier: 1.0,
    },
    {
        id: 'stage_2',
        name: '外围防线',
        description: '加一点压力，让玩家看到敌潮增长',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_mech_bug', count: 8, interval: 1.8 },
            { time: 30, enemyId: 'enemy_fast_bug', count: 5, interval: 1.2 },
            { time: 60, enemyId: 'enemy_mech_bug', count: 12, interval: 1.0 },
            { time: 90, enemyId: 'enemy_fast_bug', count: 8, interval: 0.8 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 100,
        rewardMultiplier: 1.2,
    },
    {
        id: 'stage_3',
        name: '资源回收区',
        description: '需要第一次升级，建立局外成长必要性',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_mech_bug', count: 10, interval: 1.5 },
            { time: 30, enemyId: 'enemy_fast_bug', count: 8, interval: 1.0 },
            { time: 60, enemyId: 'enemy_heavy_mech', count: 2, interval: 3 },
            { time: 90, enemyId: 'enemy_mech_bug', count: 15, interval: 0.8 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 100,
        rewardMultiplier: 1.4,
    },
    {
        id: 'stage_4',
        name: '机械废墟',
        description: '引入快速敌人，让塔类型差异开始出现',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_fast_bug', count: 10, interval: 1.0 },
            { time: 30, enemyId: 'enemy_mech_bug', count: 15, interval: 0.8 },
            { time: 60, enemyId: 'enemy_fast_bug', count: 12, interval: 0.7 },
            { time: 90, enemyId: 'enemy_heavy_mech', count: 3, interval: 2.5 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 100,
        rewardMultiplier: 1.6,
    },
    {
        id: 'stage_5',
        name: '能量中继站',
        description: '需要考虑肉鸽选择，建立局内选择价值',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_mech_bug', count: 12, interval: 1.2 },
            { time: 30, enemyId: 'enemy_fast_bug', count: 10, interval: 0.8 },
            { time: 60, enemyId: 'enemy_split_drone', count: 5, interval: 2.0 },
            { time: 90, enemyId: 'enemy_heavy_mech', count: 4, interval: 2.0 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 120,
        rewardMultiplier: 1.8,
    },
    {
        id: 'stage_6',
        name: '装甲车间',
        description: '引入重甲压力，让炮塔/电塔价值出现',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_heavy_mech', count: 5, interval: 3.0 },
            { time: 30, enemyId: 'enemy_mech_bug', count: 20, interval: 0.6 },
            { time: 60, enemyId: 'enemy_heavy_mech', count: 8, interval: 2.0 },
            { time: 90, enemyId: 'enemy_fast_bug', count: 15, interval: 0.5 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 120,
        rewardMultiplier: 2.0,
    },
    {
        id: 'stage_7',
        name: '分裂巢穴',
        description: '引入分裂或混合敌人，测试清群能力',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_split_drone', count: 8, interval: 1.5 },
            { time: 30, enemyId: 'enemy_mech_bug', count: 25, interval: 0.5 },
            { time: 60, enemyId: 'enemy_split_drone', count: 10, interval: 1.2 },
            { time: 90, enemyId: 'enemy_heavy_mech', count: 5, interval: 2.0 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 130,
        rewardMultiplier: 2.2,
    },
    {
        id: 'stage_8',
        name: '指挥中心',
        description: '需要经营系统支撑，经营币反哺塔防',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_mech_bug', count: 20, interval: 0.8 },
            { time: 30, enemyId: 'enemy_fast_bug', count: 15, interval: 0.6 },
            { time: 60, enemyId: 'enemy_heavy_mech', count: 8, interval: 1.5 },
            { time: 90, enemyId: 'enemy_split_drone', count: 8, interval: 1.0 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 140,
        rewardMultiplier: 2.5,
    },
    {
        id: 'stage_9',
        name: '核心区外围',
        description: '综合压力，为重构目标铺垫',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_fast_bug', count: 20, interval: 0.5 },
            { time: 30, enemyId: 'enemy_heavy_mech', count: 10, interval: 1.5 },
            { time: 60, enemyId: 'enemy_split_drone', count: 12, interval: 1.0 },
            { time: 90, enemyId: 'enemy_mech_bug', count: 30, interval: 0.3 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 150,
        rewardMultiplier: 2.8,
    },
    {
        id: 'stage_10',
        name: '星核重构之门',
        description: '第一次星核重构门槛，作为 MVP 长线目标',
        duration: 180,
        waves: [
            { time: 5, enemyId: 'enemy_heavy_mech', count: 10, interval: 2.0 },
            { time: 30, enemyId: 'enemy_split_drone', count: 15, interval: 1.0 },
            { time: 60, enemyId: 'enemy_fast_bug', count: 25, interval: 0.4 },
            { time: 90, enemyId: 'enemy_heavy_mech', count: 12, interval: 1.2 },
        ],
        bossTime: 150,
        bossEnemyId: 'enemy_boss',
        baseHealth: 200,
        rewardMultiplier: 3.0,
    },
];

export function getStageConfig(stageId: string): StageConfig | undefined {
    return STAGE_CONFIGS.find(s => s.id === stageId);
}

export function getStageConfigByIndex(index: number): StageConfig | undefined {
    return STAGE_CONFIGS[index];
}
