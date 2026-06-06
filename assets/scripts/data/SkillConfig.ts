/**
 * 技能配置
 * 定义主动技能和局内强化
 */

export interface ActiveSkillConfig {
    id: string;
    name: string;
    description: string;
    cooldown: number;
    damage?: number;
    duration?: number;
    /** 每局初始充能次数 */
    initialCharges: number;
}

export interface RogueUpgradeConfig {
    id: string;
    name: string;
    description: string;
    type: 'tower_attack' | 'tower_speed' | 'tower_range' | 'tower_chain_count' | 'tower_slow_effect' | 'skill_charge';
    target?: string;
    value: number;
}

export const ACTIVE_SKILL_CONFIGS: ActiveSkillConfig[] = [
    {
        id: 'skill_orbital_cannon',
        name: '轨道炮',
        description: '对敌人最密集区域造成高额伤害',
        cooldown: 60,
        damage: 500,
        initialCharges: 1,
    },
    {
        id: 'skill_freeze',
        name: '全屏冻结',
        description: '使所有敌人停止移动 2 秒',
        cooldown: 45,
        duration: 2,
        initialCharges: 1,
    },
];

export const ROGUE_UPGRADE_CONFIGS: RogueUpgradeConfig[] = [
    {
        id: 'rogue_all_attack',
        name: '火力增幅',
        description: '所有塔攻击 +10%',
        type: 'tower_attack',
        value: 0.1,
    },
    {
        id: 'rogue_machinegun_speed',
        name: '机枪强化',
        description: '机枪塔射速 +15%',
        type: 'tower_speed',
        target: 'machinegun',
        value: 0.15,
    },
    {
        id: 'rogue_cannon_range',
        name: '炮击扩展',
        description: '炮塔爆炸范围 +20%',
        type: 'tower_range',
        target: 'cannon',
        value: 0.2,
    },
    {
        id: 'rogue_ice_effect',
        name: '冰冻增幅',
        description: '冰塔减速效果 +10%',
        type: 'tower_slow_effect',
        target: 'ice',
        value: 0.1,
    },
    {
        id: 'rogue_electric_bounce',
        name: '电弧扩展',
        description: '电塔弹射次数 +1',
        type: 'tower_chain_count',
        target: 'electric',
        value: 1,
    },
    {
        id: 'rogue_orbital_charge',
        name: '轨道炮充能',
        description: '获得 1 次轨道炮',
        type: 'skill_charge',
        target: 'skill_orbital_cannon',
        value: 1,
    },
    {
        id: 'rogue_freeze_charge',
        name: '冻结充能',
        description: '获得 1 次全屏冻结',
        type: 'skill_charge',
        target: 'skill_freeze',
        value: 1,
    },
];

export function getActiveSkillConfig(skillId: string): ActiveSkillConfig | undefined {
    return ACTIVE_SKILL_CONFIGS.find(s => s.id === skillId);
}

export function getRogueUpgradeConfig(upgradeId: string): RogueUpgradeConfig | undefined {
    return ROGUE_UPGRADE_CONFIGS.find(u => u.id === upgradeId);
}
