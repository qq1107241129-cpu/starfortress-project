/**
 * 放置收益管理器
 * 管理在线收益计时、离线收益计算和领取
 *
 * 职责：
 * 1. 在线时每帧累加经营币（按分钟产出，deltaTime 换算）
 * 2. 启动时计算离线收益并通知 UI
 * 3. 领取离线收益后保存存档和新时间戳
 *
 * 收益公式（含永久技能加成）：
 * - 在线收益 = 矿场产出 × 工厂在线倍率 × (1 + 永久经营加成)
 * - 离线收益 = 在线收益 × 离线倍率 × 离线分钟数（有上限）
 * - 离线上限 = 基础上限 + 工厂加成 + 永久离线扩展加成
 */

import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { SaveManager } from '../core/SaveManager';
import { BuildingManager } from './BuildingManager';
import { RebirthManager } from './RebirthManager';
import {
    ECONOMY_CONFIG,
    calculateOnlineIncomePerMinute,
    calculateOfflineIncome,
} from '../data/EconomyConfig';

export interface OfflineRewardInfo {
    /** 离线收益（经营币） */
    income: number;
    /** 实际计算的离线分钟数（已被上限截断） */
    cappedMinutes: number;
    /** 离线收益上限（分钟） */
    maxMinutes: number;
    /** 离线时长（分钟，未截断） */
    rawOfflineMinutes: number;
}

export class IdleIncomeManager {
    private static _instance: IdleIncomeManager | null = null;
    private _eventBus: EventBus;
    private _saveManager: SaveManager;
    private _buildingManager: BuildingManager;
    private _rebirthManager: RebirthManager;
    private _pendingOfflineReward: OfflineRewardInfo | null = null;
    private _onlineAccumulator: number = 0;
    private _initialized: boolean = false;

    constructor() {
        this._eventBus = EventBus.getInstance();
        this._saveManager = SaveManager.getInstance();
        this._buildingManager = BuildingManager.getInstance();
        this._rebirthManager = RebirthManager.getInstance();
    }

    static getInstance(): IdleIncomeManager {
        if (!IdleIncomeManager._instance) {
            IdleIncomeManager._instance = new IdleIncomeManager();
        }
        return IdleIncomeManager._instance;
    }

    /**
     * 初始化：计算离线收益
     * 必须在 SaveManager.load() 和 BuildingManager.initFromSave() 之后调用
     */
    init(lastOfflineTimestamp: number): void {
        if (this._initialized) {
            console.log('[IdleIncomeManager] 已初始化，跳过');
            return;
        }

        const now = Date.now();
        const offlineMs = now - lastOfflineTimestamp;
        const offlineMinutes = offlineMs / (1000 * 60);

        if (offlineMinutes >= 1) {
            const mineOutput = this._buildingManager.getBuildingEffect('building_mine');
            const factoryLevel = this._buildingManager.getBuildingLevel('building_factory');
            const result = calculateOfflineIncome(mineOutput, factoryLevel, offlineMinutes);

            // 永久技能「离线扩展」：每级 +30 分钟离线上限
            const permOfflineBonus = this._rebirthManager.getPermanentOfflineBonusMinutes();
            const effectiveMaxMinutes = (result.maxMinutes ?? 0) + permOfflineBonus;
            const effectiveCappedMinutes = Math.min(offlineMinutes, effectiveMaxMinutes);

            // 重新计算离线收益（基于有效封顶分钟数）
            const onlineRate = calculateOnlineIncomePerMinute(mineOutput, factoryLevel);
            const effectiveIncome = Math.floor(onlineRate * ECONOMY_CONFIG.offlineIncomeMultiplier * effectiveCappedMinutes);

            this._pendingOfflineReward = {
                income: effectiveIncome,
                cappedMinutes: effectiveCappedMinutes,
                maxMinutes: effectiveMaxMinutes,
                rawOfflineMinutes: offlineMinutes,
            };

            console.log(
                `[IdleIncomeManager] 离线 ${offlineMinutes.toFixed(1)} 分钟，` +
                `基础上限 ${result.maxMinutes} 分钟 + 永久加成 ${permOfflineBonus} 分钟 = 有效上限 ${effectiveMaxMinutes} 分钟，` +
                `可领取 ${effectiveIncome} 经营币`
            );

            this._eventBus.emit(BATTLE_EVENTS.OFFLINE_REWARD_READY, this._pendingOfflineReward);
        } else {
            console.log('[IdleIncomeManager] 离线时间不足 1 分钟，无离线收益');
        }

        this._initialized = true;
    }

    /**
     * 每帧更新：累加在线收益
     * 当战斗未进行时（在主界面/经营界面），持续产出经营币
     * @param deltaTime 帧间隔（秒）
     */
    update(deltaTime: number): void {
        // 战斗进行中不产出在线收益（战斗有独立结算）
        // 这里只在非战斗状态产出
        // 由调用方（GameBootstrap 或 GameManager）决定是否调用
        const mineOutput = this._buildingManager.getBuildingEffect('building_mine');
        const factoryLevel = this._buildingManager.getBuildingLevel('building_factory');
        const baseIncomePerMinute = calculateOnlineIncomePerMinute(mineOutput, factoryLevel);

        // 永久技能「资源增产」：每级 +5% 经营产出
        const permProductionBonus = this._rebirthManager.getPermanentProductionBonus();
        const incomePerMinute = baseIncomePerMinute * (1 + permProductionBonus);
        const incomePerSecond = incomePerMinute / 60;

        this._onlineAccumulator += incomePerSecond * deltaTime;

        // 每累积 1 经营币就发放
        const wholeCoins = Math.floor(this._onlineAccumulator);
        if (wholeCoins > 0) {
            this._onlineAccumulator -= wholeCoins;
            this._eventBus.emit(BATTLE_EVENTS.IDLE_INCOME_TICK, { amount: wholeCoins });
        }
    }

    /**
     * 领取离线收益
     * @returns 领取的经营币数量，无离线收益返回 0
     */
    async claimOfflineReward(): Promise<number> {
        if (!this._pendingOfflineReward) {
            console.log('[IdleIncomeManager] 无离线收益可领取');
            return 0;
        }

        const reward = this._pendingOfflineReward.income;

        // 更新时间戳（防止重复领取）
        await this._saveManager.updateLastOfflineTimestamp();
        this._pendingOfflineReward = null;

        console.log(`[IdleIncomeManager] 领取离线收益: ${reward} 经营币`);

        this._eventBus.emit(BATTLE_EVENTS.OFFLINE_REWARD_CLAIMED, { amount: reward });

        return reward;
    }

    /**
     * 获取待领取的离线收益信息
     */
    getPendingOfflineReward(): OfflineRewardInfo | null {
        return this._pendingOfflineReward;
    }

    /**
     * 是否有待领取的离线收益
     */
    hasPendingOfflineReward(): boolean {
        return this._pendingOfflineReward !== null;
    }

    /**
     * 获取当前在线收益速率（经营币/分钟，含永久技能加成）
     */
    getOnlineIncomePerMinute(): number {
        const mineOutput = this._buildingManager.getBuildingEffect('building_mine');
        const factoryLevel = this._buildingManager.getBuildingLevel('building_factory');
        const baseIncome = calculateOnlineIncomePerMinute(mineOutput, factoryLevel);
        const permProductionBonus = this._rebirthManager.getPermanentProductionBonus();
        return baseIncome * (1 + permProductionBonus);
    }
}
