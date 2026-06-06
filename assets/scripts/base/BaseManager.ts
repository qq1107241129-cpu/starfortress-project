/**
 * 基地总管理器
 * 协调 SaveManager 和 BuildingManager，管理基地整体状态
 *
 * 职责：
 * 1. 初始化加载存档
 * 2. 管理资源（经营币、战斗金币）
 * 3. 协调建筑升级与存档保存
 * 4. 暴露建筑效果给其他系统
 */

import { SaveManager } from '../core/SaveManager';
import { BuildingManager, BuildingState } from './BuildingManager';

export class BaseManager {
    private static _instance: BaseManager | null = null;
    private _saveManager: SaveManager;
    private _buildingManager: BuildingManager;
    private _battleCoin: number = 0;
    private _baseCoin: number = 0;
    private _initialized: boolean = false;

    constructor() {
        this._saveManager = SaveManager.getInstance();
        this._buildingManager = BuildingManager.getInstance();
    }

    static getInstance(): BaseManager {
        if (!BaseManager._instance) {
            BaseManager._instance = new BaseManager();
        }
        return BaseManager._instance;
    }

    /**
     * 初始化基地系统：加载存档，初始化建筑
     * 必须在游戏启动时调用
     */
    async init(): Promise<void> {
        if (this._initialized) {
            console.log('[BaseManager] 已初始化，跳过');
            return;
        }
        const saveData = await this._saveManager.load();
        this._battleCoin = saveData.battleCoin;
        this._baseCoin = saveData.baseCoin;
        this._buildingManager.initFromSave(saveData);
        this._initialized = true;
        console.log(`[BaseManager] 初始化完成，经营币: ${this._baseCoin}，战斗金币: ${this._battleCoin}`);
    }

    /**
     * 是否已初始化
     */
    isInitialized(): boolean {
        return this._initialized;
    }

    /**
     * 获取 SaveManager 实例（供 IdleIncomeManager 读取时间戳等）
     */
    getSaveManager(): SaveManager {
        return this._saveManager;
    }

    // ==================== 资源管理 ====================

    /**
     * 获取当前经营币
     */
    getBaseCoin(): number {
        return this._baseCoin;
    }

    /**
     * 获取当前战斗金币
     */
    getBattleCoin(): number {
        return this._battleCoin;
    }

    /**
     * 增加经营币（建筑产出、离线收益等）
     */
    addBaseCoin(amount: number): void {
        this._baseCoin += amount;
    }

    /**
     * 增加战斗金币（战斗结算奖励）
     */
    addBattleCoin(amount: number): void {
        this._battleCoin += amount;
    }

    /**
     * 消耗经营币
     * @returns 是否消耗成功
     */
    spendBaseCoin(amount: number): boolean {
        if (this._baseCoin < amount) {
            return false;
        }
        this._baseCoin -= amount;
        return true;
    }

    /**
     * 消耗战斗金币
     * @returns 是否消耗成功
     */
    spendBattleCoin(amount: number): boolean {
        if (this._battleCoin < amount) {
            return false;
        }
        this._battleCoin -= amount;
        return true;
    }

    // ==================== 建筑操作 ====================

    /**
     * 获取建筑管理器
     */
    getBuildingManager(): BuildingManager {
        return this._buildingManager;
    }

    /**
     * 获取指定建筑状态
     */
    getBuildingState(buildingId: string): BuildingState | null {
        return this._buildingManager.getBuildingState(buildingId);
    }

    /**
     * 获取所有建筑状态
     */
    getAllBuildingStates(): BuildingState[] {
        return this._buildingManager.getAllBuildingStates();
    }

    /**
     * 升级建筑（根据配置扣除对应资源）
     * @returns 升级是否成功
     */
    async upgradeBuilding(buildingId: string): Promise<boolean> {
        const state = this._buildingManager.getBuildingState(buildingId);
        if (!state) {
            console.warn(`[BaseManager] 建筑 ${buildingId} 不存在`);
            return false;
        }

        if (!state.canUpgrade) {
            console.warn(`[BaseManager] ${state.config.name} 已达最高等级`);
            return false;
        }

        const costType = state.config.costType;
        const cost = state.upgradeCost;

        // 根据配置的资源类型扣除
        if (costType === 'baseCoin') {
            if (!this.spendBaseCoin(cost)) {
                console.warn(`[BaseManager] 经营币不足: 需要 ${cost}, 当前 ${this._baseCoin}`);
                return false;
            }
        } else {
            if (!this.spendBattleCoin(cost)) {
                console.warn(`[BaseManager] 战斗金币不足: 需要 ${cost}, 当前 ${this._battleCoin}`);
                return false;
            }
        }

        // 执行升级（传入扣除后的金额，BuildingManager 内部会再次验证）
        const availableAfterSpend = costType === 'baseCoin' ? this._baseCoin : this._battleCoin;
        const success = this._buildingManager.upgrade(buildingId, availableAfterSpend + cost);
        if (!success) {
            // 升级失败，退还资源
            if (costType === 'baseCoin') {
                this._baseCoin += cost;
            } else {
                this._battleCoin += cost;
            }
            return false;
        }

        // 保存存档
        await this._save();
        const resourceLabel = costType === 'baseCoin' ? '经营币' : '战斗金币';
        const remaining = costType === 'baseCoin' ? this._baseCoin : this._battleCoin;
        console.log(`[BaseManager] ${state.config.name} 升级成功，剩余${resourceLabel}: ${remaining}`);
        return true;
    }

    /**
     * 获取指定建筑的升级资源类型和金额（供 UI 显示）
     */
    getUpgradeCostInfo(buildingId: string): { costType: 'baseCoin' | 'battleCoin'; cost: number } | null {
        const state = this._buildingManager.getBuildingState(buildingId);
        if (!state || !state.canUpgrade) return null;
        return {
            costType: state.config.costType,
            cost: state.upgradeCost,
        };
    }

    // ==================== 建筑效果查询 ====================

    /**
     * 获取基地核心等级
     */
    getBaseCoreLevel(): number {
        return this._buildingManager.getBuildingLevel('building_base');
    }

    /**
     * 获取研究所效果倍率（塔攻击/射速加成）
     */
    getLabEffectMultiplier(): number {
        return this._buildingManager.getBuildingEffect('building_lab');
    }

    /**
     * 获取矿场每分钟经营币产出
     */
    getMineIncomePerMinute(): number {
        return this._buildingManager.getBuildingEffect('building_mine');
    }

    /**
     * 获取能源反应堆技能次数加成
     */
    getReactorSkillBonus(): number {
        return this._buildingManager.getBuildingEffect('building_reactor');
    }

    /**
     * 获取工厂在线收益倍率
     */
    getFactoryOnlineMultiplier(): number {
        return this._buildingManager.getBuildingEffect('building_factory');
    }

    /**
     * 获取工厂等级（用于离线收益计算）
     */
    getFactoryLevel(): number {
        return this._buildingManager.getBuildingLevel('building_factory');
    }

    /**
     * 获取所有建筑等级总和（用于星核碎片计算）
     */
    getTotalBuildingLevels(): number {
        return this._buildingManager.getTotalBuildingLevels();
    }

    // ==================== 存档操作 ====================

    /**
     * 保存当前状态到存档
     */
    private async _save(): Promise<void> {
        const buildingSave = this._buildingManager.toSaveData();
        await this._saveManager.updateSave({
            ...buildingSave,
            battleCoin: this._battleCoin,
            baseCoin: this._baseCoin,
        });
    }

    /**
     * 手动保存（供外部调用，如退出游戏前）
     */
    async save(): Promise<void> {
        await this._save();
    }

    /**
     * 更新离线时间戳（退出游戏前调用）
     */
    async updateOfflineTimestamp(): Promise<void> {
        await this._saveManager.updateLastOfflineTimestamp();
    }

    /**
     * 重置基地（星核重构后调用）
     * 保留基地核心等级和星核碎片，重置其他建筑和普通资源
     */
    async reset(): Promise<void> {
        this._battleCoin = 0;
        this._baseCoin = 0;
        this._buildingManager.reset();
        await this._save();
        console.log('[BaseManager] 基地已重置（星核重构）');
    }
}
