/**
 * 星核重构配置
 * 定义转生条件、星核碎片计算参数和永久技能
 */

export interface RebirthCondition {
    type: 'base_level' | 'stage_cleared' | 'total_power';
    value: number;
}

export interface RebirthShardCalculation {
    highestStageWeight: number;
    baseLevelWeight: number;
    totalBuildingWeight: number;
    totalPowerWeight: number;
}

export interface PermanentSkillConfig {
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    effectPerLevel: number;
    shardCostPerLevel: number[];
}

export interface RebirthConfig {
    conditions: RebirthCondition[];
    shardCalculation: RebirthShardCalculation;
    permanentSkills: PermanentSkillConfig[];
}

export const REBIRTH_CONFIG: RebirthConfig = {
    conditions: [
        { type: 'base_level', value: 10 },
        { type: 'stage_cleared', value: 10 },
    ],
    shardCalculation: {
        highestStageWeight: 10,
        baseLevelWeight: 5,
        totalBuildingWeight: 2,
        totalPowerWeight: 0.01,
    },
    permanentSkills: [
        {
            id: 'perm_attack',
            name: '战术强化',
            description: '所有塔攻击永久 +5%',
            maxLevel: 10,
            effectPerLevel: 0.05,
            shardCostPerLevel: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560],
        },
        {
            id: 'perm_production',
            name: '资源增产',
            description: '经营产出永久 +5%',
            maxLevel: 10,
            effectPerLevel: 0.05,
            shardCostPerLevel: [0, 10, 20, 40, 80, 160, 320, 640, 1280, 2560],
        },
        {
            id: 'perm_orbital',
            name: '轨道支援',
            description: '开局获得 1 次轨道炮',
            maxLevel: 3,
            effectPerLevel: 1,
            shardCostPerLevel: [0, 50, 150],
        },
        {
            id: 'perm_offline',
            name: '离线扩展',
            description: '离线收益上限 +30 分钟',
            maxLevel: 5,
            effectPerLevel: 30,
            shardCostPerLevel: [0, 20, 50, 120, 300],
        },
        {
            id: 'perm_rogue_quality',
            name: '命运干预',
            description: '肉鸽选项品质小幅提升',
            maxLevel: 5,
            effectPerLevel: 0.1,
            shardCostPerLevel: [0, 30, 80, 200, 500],
        },
    ],
};

export function getPermanentSkillConfig(skillId: string): PermanentSkillConfig | undefined {
    return REBIRTH_CONFIG.permanentSkills.find(s => s.id === skillId);
}

export function calculateRebirthShards(params: {
    highestStage: number;
    baseLevel: number;
    totalBuildingLevels: number;
    totalPower: number;
}): number {
    const { shardCalculation } = REBIRTH_CONFIG;
    return Math.floor(
        params.highestStage * shardCalculation.highestStageWeight +
        params.baseLevel * shardCalculation.baseLevelWeight +
        params.totalBuildingLevels * shardCalculation.totalBuildingWeight +
        params.totalPower * shardCalculation.totalPowerWeight
    );
}
