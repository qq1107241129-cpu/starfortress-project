/**
 * 配置管理器
 * 统一暴露读取方法，提供配置查询接口
 */

import { TowerConfig, TowerLevelConfig, TOWER_CONFIGS, getTowerConfig, getTowerLevelConfig } from '../data/TowerConfig';
import { EnemyConfig, ENEMY_CONFIGS, getEnemyConfig } from '../data/EnemyConfig';
import { StageConfig, STAGE_CONFIGS, getStageConfig, getStageConfigByIndex } from '../data/StageConfig';
import { BuildingConfig, BuildingLevelConfig, BUILDING_CONFIGS, getBuildingConfig, getBuildingLevelConfig } from '../data/BuildingConfig';
import { ActiveSkillConfig, RogueUpgradeConfig, ACTIVE_SKILL_CONFIGS, ROGUE_UPGRADE_CONFIGS, getActiveSkillConfig, getRogueUpgradeConfig } from '../data/SkillConfig';
import { RebirthConfig, PermanentSkillConfig, REBIRTH_CONFIG, getPermanentSkillConfig, calculateRebirthShards } from '../data/RebirthConfig';
import { EconomyConfig, ECONOMY_CONFIG, calculateOnlineIncome, calculateOfflineIncome } from '../data/EconomyConfig';

export class ConfigManager {
    private static _instance: ConfigManager | null = null;

    static getInstance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    // ==================== 塔配置 ====================

    getTowerConfig(towerId: string): TowerConfig | undefined {
        return getTowerConfig(towerId);
    }

    getTowerLevelConfig(towerId: string, level: number): TowerLevelConfig | undefined {
        return getTowerLevelConfig(towerId, level);
    }

    getAllTowerConfigs(): TowerConfig[] {
        return TOWER_CONFIGS;
    }

    // ==================== 敌人配置 ====================

    getEnemyConfig(enemyId: string): EnemyConfig | undefined {
        return getEnemyConfig(enemyId);
    }

    getAllEnemyConfigs(): EnemyConfig[] {
        return ENEMY_CONFIGS;
    }

    // ==================== 关卡配置 ====================

    getStageConfig(stageId: string): StageConfig | undefined {
        return getStageConfig(stageId);
    }

    getStageConfigByIndex(index: number): StageConfig | undefined {
        return getStageConfigByIndex(index);
    }

    getAllStageConfigs(): StageConfig[] {
        return STAGE_CONFIGS;
    }

    getStageCount(): number {
        return STAGE_CONFIGS.length;
    }

    // ==================== 建筑配置 ====================

    getBuildingConfig(buildingId: string): BuildingConfig | undefined {
        return getBuildingConfig(buildingId);
    }

    getBuildingLevelConfig(buildingId: string, level: number): BuildingLevelConfig | undefined {
        return getBuildingLevelConfig(buildingId, level);
    }

    getAllBuildingConfigs(): BuildingConfig[] {
        return BUILDING_CONFIGS;
    }

    // ==================== 技能配置 ====================

    getActiveSkillConfig(skillId: string): ActiveSkillConfig | undefined {
        return getActiveSkillConfig(skillId);
    }

    getAllActiveSkillConfigs(): ActiveSkillConfig[] {
        return ACTIVE_SKILL_CONFIGS;
    }

    getRogueUpgradeConfig(upgradeId: string): RogueUpgradeConfig | undefined {
        return getRogueUpgradeConfig(upgradeId);
    }

    getAllRogueUpgradeConfigs(): RogueUpgradeConfig[] {
        return ROGUE_UPGRADE_CONFIGS;
    }

    // ==================== 星核重构配置 ====================

    getRebirthConfig(): RebirthConfig {
        return REBIRTH_CONFIG;
    }

    getPermanentSkillConfig(skillId: string): PermanentSkillConfig | undefined {
        return getPermanentSkillConfig(skillId);
    }

    getAllPermanentSkillConfigs(): PermanentSkillConfig[] {
        return REBIRTH_CONFIG.permanentSkills;
    }

    calculateRebirthShards(params: {
        highestStage: number;
        baseLevel: number;
        totalBuildingLevels: number;
        totalPower: number;
    }): number {
        return calculateRebirthShards(params);
    }

    // ==================== 经济配置 ====================

    getEconomyConfig(): EconomyConfig {
        return ECONOMY_CONFIG;
    }

    calculateOnlineIncome(factoryLevel: number): number {
        return calculateOnlineIncome(factoryLevel);
    }

    calculateOfflineIncome(factoryLevel: number, offlineMinutes: number): { income: number; cappedMinutes: number } {
        return calculateOfflineIncome(factoryLevel, offlineMinutes);
    }
}
