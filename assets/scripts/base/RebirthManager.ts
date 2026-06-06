/**
 * 星核重构管理器
 * 管理转生条件判断、星核碎片计算、重置与保留、永久技能
 *
 * 职责：
 * 1. 判断是否满足转生条件
 * 2. 计算可获得的星核碎片
 * 3. 执行转生重置（保留永久内容）
 * 4. 管理永久技能等级和升级
 * 5. 暴露永久技能加成给其他系统
 */

import { SaveManager, SaveData } from '../core/SaveManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import {
    REBIRTH_CONFIG,
    RebirthCondition,
    PermanentSkillConfig,
    getPermanentSkillConfig,
    calculateRebirthShards,
} from '../data/RebirthConfig';

export interface RebirthStatus {
    canRebirth: boolean;
    unmetConditions: string[];
    estimatedShards: number;
}

export interface PermanentSkillState {
    config: PermanentSkillConfig;
    currentLevel: number;
    currentEffect: number;
    nextLevelCost: number;
    canUpgrade: boolean;
}

export class RebirthManager {
    private static _instance: RebirthManager | null = null;
    private _saveManager: SaveManager;
    private _eventBus: EventBus;
    private _rebirthToken: number = 0;
    private _permanentSkillLevels: Record<string, number> = {};
    private _initialized: boolean = false;

    constructor() {
        this._saveManager = SaveManager.getInstance();
        this._eventBus = EventBus.getInstance();
    }

    static getInstance(): RebirthManager {
        if (!RebirthManager._instance) {
            RebirthManager._instance = new RebirthManager();
        }
        return RebirthManager._instance;
    }

    /**
     * 从存档加载转生数据
     * 必须在 SaveManager.load() 之后调用
     */
    initFromSave(saveData: SaveData): void {
        this._rebirthToken = saveData.rebirthToken;
        this._permanentSkillLevels = { ...saveData.permanentSkillLevels };
        this._initialized = true;
        console.log(`[RebirthManager] 初始化完成，星核碎片: ${this._rebirthToken}，永久技能: ${JSON.stringify(this._permanentSkillLevels)}`);
    }

    isInitialized(): boolean {
        return this._initialized;
    }

    // ==================== 转生条件判断 ====================

    /**
     * 检查是否满足转生条件
     * @param baseCoreLevel 基地核心等级
     * @param highestStage 历史最高通关关卡
     * @param totalBuildingLevels 总建筑等级
     * @param totalPower 总战力
     */
    checkRebirthConditions(params: {
        baseCoreLevel: number;
        highestStage: number;
        totalBuildingLevels: number;
        totalPower: number;
    }): RebirthStatus {
        const unmetConditions: string[] = [];

        for (const condition of REBIRTH_CONFIG.conditions) {
            const met = this._checkCondition(condition, params);
            if (!met) {
                unmetConditions.push(this._getConditionDescription(condition));
            }
        }

        // 计算预计可获得碎片
        const estimatedShards = calculateRebirthShards({
            highestStage: params.highestStage,
            baseLevel: params.baseCoreLevel,
            totalBuildingLevels: params.totalBuildingLevels,
            totalPower: params.totalPower,
        });

        return {
            canRebirth: unmetConditions.length === 0,
            unmetConditions,
            estimatedShards: Math.max(0, estimatedShards),
        };
    }

    private _checkCondition(condition: RebirthCondition, params: {
        baseCoreLevel: number;
        highestStage: number;
        totalBuildingLevels: number;
        totalPower: number;
    }): boolean {
        switch (condition.type) {
            case 'base_level':
                return params.baseCoreLevel >= condition.value;
            case 'stage_cleared':
                return params.highestStage >= condition.value;
            case 'total_power':
                return params.totalPower >= condition.value;
            default:
                return false;
        }
    }

    private _getConditionDescription(condition: RebirthCondition): string {
        switch (condition.type) {
            case 'base_level':
                return `基地核心达到 ${condition.value} 级`;
            case 'stage_cleared':
                return `通关第 ${condition.value} 关`;
            case 'total_power':
                return `总战力达到 ${condition.value}`;
            default:
                return '未知条件';
        }
    }

    // ==================== 星核碎片计算 ====================

    /**
     * 计算本次转生可获得的星核碎片
     */
    calculateShards(params: {
        highestStage: number;
        baseLevel: number;
        totalBuildingLevels: number;
        totalPower: number;
    }): number {
        return Math.max(0, calculateRebirthShards(params));
    }

    /**
     * 获取当前持有的星核碎片
     */
    getRebirthTokens(): number {
        return this._rebirthToken;
    }

    // ==================== 转生执行 ====================

    /**
     * 执行星核重构
     * 1. 校验转生条件（不满足则拒绝执行）
     * 2. 计算并发放星核碎片
     * 3. 重置普通资源和进度
     * 4. 保留永久内容
     * 5. 触发转生完成事件
     */
    async executeRebirth(params: {
        highestStage: number;
        baseLevel: number;
        totalBuildingLevels: number;
        totalPower: number;
    }): Promise<{ shardsGained: number; totalShards: number }> {
        // 强制校验转生条件
        const status = this.checkRebirthConditions(params);
        if (!status.canRebirth) {
            console.warn(`[RebirthManager] 转生条件未满足: ${status.unmetConditions.join(', ')}`);
            throw new Error(`转生条件未满足: ${status.unmetConditions.join(', ')}`);
        }

        // 计算碎片
        const shardsGained = this.calculateShards(params);

        // 增加碎片
        this._rebirthToken += shardsGained;

        // 重置存档内存状态（保留永久字段，重置普通字段）
        // 不在此处保存，由 BaseManager 统一保存
        this._saveManager.resetForRebirth(this._rebirthToken, this._permanentSkillLevels);

        // 触发事件
        this._eventBus.emit(BATTLE_EVENTS.REBIRTH_COMPLETE, {
            shardsGained,
            totalShards: this._rebirthToken,
        });

        console.log(`[RebirthManager] 星核重构完成，获得 ${shardsGained} 星核碎片，总计 ${this._rebirthToken}`);

        return {
            shardsGained,
            totalShards: this._rebirthToken,
        };
    }

    // ==================== 永久技能管理 ====================

    /**
     * 获取指定永久技能的状态
     */
    getPermanentSkillState(skillId: string): PermanentSkillState | null {
        const config = getPermanentSkillConfig(skillId);
        if (!config) return null;

        const currentLevel = this._permanentSkillLevels[skillId] ?? 0;
        const currentEffect = currentLevel * config.effectPerLevel;
        const nextLevelCost = currentLevel < config.maxLevel
            ? config.shardCostPerLevel[currentLevel]
            : -1;

        return {
            config,
            currentLevel,
            currentEffect,
            nextLevelCost,
            canUpgrade: currentLevel < config.maxLevel && this._rebirthToken >= nextLevelCost,
        };
    }

    /**
     * 获取所有永久技能状态
     */
    getAllPermanentSkillStates(): PermanentSkillState[] {
        return REBIRTH_CONFIG.permanentSkills
            .map(skill => this.getPermanentSkillState(skill.id))
            .filter((s): s is PermanentSkillState => s !== null);
    }

    /**
     * 升级永久技能
     * @returns 升级是否成功
     */
    async upgradePermanentSkill(skillId: string): Promise<boolean> {
        const state = this.getPermanentSkillState(skillId);
        if (!state) {
            console.warn(`[RebirthManager] 永久技能 ${skillId} 不存在`);
            return false;
        }

        if (!state.canUpgrade) {
            if (state.currentLevel >= state.config.maxLevel) {
                console.warn(`[RebirthManager] ${state.config.name} 已达最高等级`);
            } else {
                console.warn(`[RebirthManager] 星核碎片不足: 需要 ${state.nextLevelCost}, 当前 ${this._rebirthToken}`);
            }
            return false;
        }

        // 扣除碎片
        this._rebirthToken -= state.nextLevelCost;

        // 升级
        const newLevel = state.currentLevel + 1;
        this._permanentSkillLevels[skillId] = newLevel;

        // 保存
        await this._saveManager.updateSave({
            rebirthToken: this._rebirthToken,
            permanentSkillLevels: { ...this._permanentSkillLevels },
        });

        // 触发事件
        this._eventBus.emit(BATTLE_EVENTS.PERMANENT_SKILL_UPGRADE, {
            skillId,
            newLevel,
            remainingTokens: this._rebirthToken,
        });

        console.log(`[RebirthManager] ${state.config.name} 升级到 ${newLevel} 级，剩余碎片: ${this._rebirthToken}`);
        return true;
    }

    // ==================== 永久技能加成读取接口 ====================

    /**
     * 获取永久技能等级
     */
    getPermanentSkillLevel(skillId: string): number {
        return this._permanentSkillLevels[skillId] ?? 0;
    }

    /**
     * 获取所有塔攻击永久加成倍率（perm_attack）
     * 每级 +5%，返回如 0.05 表示 5%
     */
    getPermanentAttackBonus(): number {
        const level = this.getPermanentSkillLevel('perm_attack');
        return level * 0.05;
    }

    /**
     * 获取经营产出永久加成倍率（perm_production）
     * 每级 +5%，返回如 0.05 表示 5%
     */
    getPermanentProductionBonus(): number {
        const level = this.getPermanentSkillLevel('perm_production');
        return level * 0.05;
    }

    /**
     * 获取开局轨道炮充能次数（perm_orbital）
     * 每级 +1 次
     */
    getPermanentOrbitalCharges(): number {
        return this.getPermanentSkillLevel('perm_orbital');
    }

    /**
     * 获取离线收益上限额外分钟数（perm_offline）
     * 每级 +30 分钟
     */
    getPermanentOfflineBonusMinutes(): number {
        const level = this.getPermanentSkillLevel('perm_offline');
        return level * 30;
    }

    /**
     * 获取肉鸽选项品质加成倍率（perm_rogue_quality）
     * 每级 +10%，返回如 0.1 表示 10%
     */
    getPermanentRogueQualityBonus(): number {
        const level = this.getPermanentSkillLevel('perm_rogue_quality');
        return level * 0.1;
    }

    /**
     * 获取存档数据（供 SaveManager 保存）
     */
    toSaveData(): Partial<SaveData> {
        return {
            rebirthToken: this._rebirthToken,
            permanentSkillLevels: { ...this._permanentSkillLevels },
        };
    }
}
