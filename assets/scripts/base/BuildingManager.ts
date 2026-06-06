/**
 * 建筑管理器
 * 管理 5 个 MVP 建筑的等级、升级、消耗和属性加成
 *
 * 建筑等级持久化通过 SaveManager。
 * 建筑效果以数值形式暴露给其他系统读取。
 */

import { BuildingConfig, BuildingLevelConfig, getBuildingConfig, getBuildingLevelConfig, BUILDING_CONFIGS } from '../data/BuildingConfig';
import { SaveData } from '../core/SaveManager';

export interface BuildingState {
    config: BuildingConfig;
    currentLevel: number;
    currentEffectValue: number;
    nextLevelConfig: BuildingLevelConfig | null;
    canUpgrade: boolean;
    upgradeCost: number;
}

export class BuildingManager {
    private static _instance: BuildingManager | null = null;
    /** 内存中的建筑等级缓存，启动时从存档加载 */
    private _buildingLevels: Map<string, number> = new Map();
    private _initialized: boolean = false;

    static getInstance(): BuildingManager {
        if (!BuildingManager._instance) {
            BuildingManager._instance = new BuildingManager();
        }
        return BuildingManager._instance;
    }

    /**
     * 从存档加载建筑等级
     * 必须在 SaveManager.load() 之后调用
     */
    initFromSave(saveData: SaveData): void {
        this._buildingLevels.set('building_base', saveData.baseCoreLevel);
        this._buildingLevels.set('building_lab', saveData.labLevel);
        this._buildingLevels.set('building_mine', saveData.mineLevel);
        this._buildingLevels.set('building_reactor', saveData.reactorLevel);
        this._buildingLevels.set('building_factory', saveData.factoryLevel);
        this._initialized = true;
        console.log('[BuildingManager] 建筑等级从存档加载完成');
    }

    /**
     * 获取指定建筑的当前等级
     */
    getBuildingLevel(buildingId: string): number {
        return this._buildingLevels.get(buildingId) ?? 1;
    }

    /**
     * 获取指定建筑的当前效果值
     */
    getBuildingEffect(buildingId: string): number {
        const level = this.getBuildingLevel(buildingId);
        const levelConfig = getBuildingLevelConfig(buildingId, level);
        if (!levelConfig) return 0;
        return levelConfig.effectValue;
    }

    /**
     * 获取指定建筑的状态（用于 UI 显示）
     */
    getBuildingState(buildingId: string): BuildingState | null {
        const config = getBuildingConfig(buildingId);
        if (!config) return null;

        const currentLevel = this.getBuildingLevel(buildingId);
        const currentLevelConfig = getBuildingLevelConfig(buildingId, currentLevel);
        const nextLevelConfig = getBuildingLevelConfig(buildingId, currentLevel + 1);

        return {
            config,
            currentLevel,
            currentEffectValue: currentLevelConfig?.effectValue ?? 0,
            nextLevelConfig,
            canUpgrade: nextLevelConfig !== null,
            upgradeCost: nextLevelConfig?.upgradeCost ?? 0,
        };
    }

    /**
     * 获取所有建筑的状态
     */
    getAllBuildingStates(): BuildingState[] {
        return BUILDING_CONFIGS
            .map(config => this.getBuildingState(config.id))
            .filter((s): s is BuildingState => s !== null);
    }

    /**
     * 升级指定建筑
     * @param buildingId 建筑 ID
     * @param availableAmount 当前可用的对应资源金额
     * @returns 升级是否成功
     */
    upgrade(buildingId: string, availableAmount: number): boolean {
        const state = this.getBuildingState(buildingId);
        if (!state) {
            console.warn(`[BuildingManager] 建筑 ${buildingId} 不存在`);
            return false;
        }

        if (!state.canUpgrade) {
            console.warn(`[BuildingManager] 建筑 ${buildingId} 已达最高等级`);
            return false;
        }

        if (availableAmount < state.upgradeCost) {
            console.warn(`[BuildingManager] 资源不足: 需要 ${state.upgradeCost}, 当前 ${availableAmount}`);
            return false;
        }

        // 升级
        const newLevel = state.currentLevel + 1;
        this._buildingLevels.set(buildingId, newLevel);
        console.log(`[BuildingManager] ${state.config.name} 升级到 ${newLevel} 级`);
        return true;
    }

    /**
     * 获取所有建筑等级总和（用于星核碎片计算）
     */
    getTotalBuildingLevels(): number {
        let total = 0;
        this._buildingLevels.forEach(level => {
            total += level;
        });
        return total;
    }

    /**
     * 重置建筑等级为 1（星核重构后调用）
     * 基地核心等级保留，其他建筑重置
     */
    reset(): void {
        const baseLevel = this.getBuildingLevel('building_base');
        this._buildingLevels.set('building_base', baseLevel);
        this._buildingLevels.set('building_lab', 1);
        this._buildingLevels.set('building_mine', 1);
        this._buildingLevels.set('building_reactor', 1);
        this._buildingLevels.set('building_factory', 1);
        console.log(`[BuildingManager] 建筑等级已重置，基地核心保留为 ${baseLevel} 级`);
    }

    /**
     * 获取存档数据（供 SaveManager 保存）
     */
    toSaveData(): Partial<SaveData> {
        return {
            baseCoreLevel: this.getBuildingLevel('building_base'),
            labLevel: this.getBuildingLevel('building_lab'),
            mineLevel: this.getBuildingLevel('building_mine'),
            reactorLevel: this.getBuildingLevel('building_reactor'),
            factoryLevel: this.getBuildingLevel('building_factory'),
        };
    }
}
