/**
 * 战斗结算
 * 处理战斗结束后的奖励计算、数据统计
 */

import { StageConfig } from '../data/StageConfig';

export interface BattleResult {
    stageId: string;
    result: 'victory' | 'defeat';
    duration: number;
    killCount: number;
    bossKillCount: number;
    baseHealthRemaining: number;
    baseHealthMax: number;
    battleCoinReward: number;
    baseCoinReward: number;
    starRating: number; // 1-3 星
}

export class BattleSettlement {
    private _stageConfig: StageConfig;
    private _killCount: number = 0;
    private _bossKillCount: number = 0;
    private _startTime: number = 0;

    constructor(stageConfig: StageConfig) {
        this._stageConfig = stageConfig;
    }

    /**
     * 重置结算数据
     */
    reset(): void {
        this._killCount = 0;
        this._bossKillCount = 0;
        this._startTime = Date.now();
    }

    /**
     * 记录击杀
     */
    recordKill(isBoss: boolean): void {
        this._killCount++;
        if (isBoss) {
            this._bossKillCount++;
        }
    }

    /**
     * 计算战斗结果
     */
    calculateResult(
        result: 'victory' | 'defeat',
        baseHealthRemaining: number,
        baseHealthMax: number
    ): BattleResult {
        const duration = (Date.now() - this._startTime) / 1000; // 秒

        // 计算战斗金币奖励
        const battleCoinReward = this._calculateBattleCoinReward(result);

        // 计算经营币奖励（基础奖励）
        const baseCoinReward = this._calculateBaseCoinReward(result);

        // 计算星级评定
        const starRating = this._calculateStarRating(result, baseHealthRemaining, baseHealthMax);

        return {
            stageId: this._stageConfig.id,
            result,
            duration,
            killCount: this._killCount,
            bossKillCount: this._bossKillCount,
            baseHealthRemaining,
            baseHealthMax,
            battleCoinReward,
            baseCoinReward,
            starRating
        };
    }

    /**
     * 计算战斗金币奖励
     */
    private _calculateBattleCoinReward(result: 'victory' | 'defeat'): number {
        const baseReward = 100; // 基础奖励
        const stageMultiplier = this._stageConfig.rewardMultiplier;
        const resultMultiplier = result === 'victory' ? 1.0 : 0.3; // 失败给 30%

        const reward = Math.floor(baseReward * stageMultiplier * resultMultiplier);
        return reward;
    }

    /**
     * 计算经营币奖励
     */
    private _calculateBaseCoinReward(result: 'victory' | 'defeat'): number {
        const baseReward = 50; // 基础经营币奖励
        const stageMultiplier = this._stageConfig.rewardMultiplier;
        const resultMultiplier = result === 'victory' ? 1.0 : 0.2; // 失败给 20%

        const reward = Math.floor(baseReward * stageMultiplier * resultMultiplier);
        return reward;
    }

    /**
     * 计算星级评定
     */
    private _calculateStarRating(
        result: 'victory' | 'defeat',
        baseHealthRemaining: number,
        baseHealthMax: number
    ): number {
        if (result === 'defeat') {
            return 1; // 失败至少 1 星
        }

        const healthPercent = baseHealthRemaining / baseHealthMax;

        if (healthPercent >= 0.8) {
            return 3; // 生命值 80% 以上 3 星
        } else if (healthPercent >= 0.5) {
            return 2; // 生命值 50% 以上 2 星
        } else {
            return 1; // 其他情况 1 星
        }
    }

    /**
     * 获取当前击杀数
     */
    getKillCount(): number {
        return this._killCount;
    }

    /**
     * 获取 Boss 击杀数
     */
    getBossKillCount(): number {
        return this._bossKillCount;
    }
}