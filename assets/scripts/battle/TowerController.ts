/**
 * 塔控制器
 * 控制单个塔的行为：目标选择、攻击冷却、攻击执行
 */

import { TowerConfig, TowerLevelConfig, getTowerLevelConfig } from '../data/TowerConfig';
import { EnemyController } from './EnemyController';

export interface TowerState {
    id: string;
    configId: string;
    level: number;
    position: { x: number; y: number };
    /** 攻击冷却剩余时间（秒） */
    cooldownRemaining: number;
}

/** 塔生效属性（用于显示） */
export interface TowerEffectiveStats {
    id: string;
    configId: string;
    name: string;
    type: string;
    level: number;
    attack: number;
    attackSpeed: number;
    range: number;
    splashRadius: number;
    chainCount: number;
    slowFactor: number;
    slowDuration: number;
}

export class TowerController {
    private _state: TowerState;
    private _config: TowerConfig;
    private _levelConfig: TowerLevelConfig;
    /** 肉鸽强化加成：攻击倍率 */
    private _attackBonus: number = 0;
    /** 肉鸽强化加成：射速倍率 */
    private _speedBonus: number = 0;
    /** 肉鸽强化加成：范围倍率 */
    private _rangeBonus: number = 0;
    /** 肉鸽强化加成：电塔弹射次数增量 */
    private _chainCountBonus: number = 0;
    /** 肉鸽强化加成：减速效果倍率 */
    private _slowBonus: number = 0;

    constructor(
        configId: string,
        config: TowerConfig,
        level: number,
        position: { x: number; y: number }
    ) {
        this._config = config;
        this._levelConfig = getTowerLevelConfig(configId, level) ?? config.levels[0];

        this._state = {
            id: `tower_${configId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            configId,
            level,
            position: { ...position },
            cooldownRemaining: 0,
        };
    }

    getId(): string {
        return this._state.id;
    }

    getConfig(): TowerConfig {
        return this._config;
    }

    getLevelConfig(): TowerLevelConfig {
        return this._levelConfig;
    }

    getState(): TowerState {
        return { ...this._state };
    }

    getPosition(): { x: number; y: number } {
        return { ...this._state.position };
    }

    getRange(): number {
        return Math.floor(this._levelConfig.range * (1 + this._rangeBonus));
    }

    getAttack(): number {
        return Math.floor(this._levelConfig.attack * (1 + this._attackBonus));
    }

    getAttackSpeed(): number {
        // 射速加成：attackSpeed 越小越快，所以 bonus 要反向应用
        return this._levelConfig.attackSpeed * (1 - this._speedBonus);
    }

    /**
     * 应用攻击加成（累加）
     * @param bonus 加成倍率（如 0.1 表示 +10%）
     */
    applyAttackBonus(bonus: number): void {
        this._attackBonus += bonus;
    }

    /**
     * 应用射速加成（累加）
     * @param bonus 加成倍率（如 0.15 表示 +15%）
     */
    applySpeedBonus(bonus: number): void {
        this._speedBonus += bonus;
    }

    /**
     * 应用范围加成（累加）
     * @param bonus 加成倍率（如 0.2 表示 +20%）
     */
    applyRangeBonus(bonus: number): void {
        this._rangeBonus += bonus;
    }

    /**
     * 应用弹射次数加成（累加整数）
     * @param bonus 弹射次数增量（如 1 表示 +1 次弹射）
     */
    applyChainCountBonus(bonus: number): void {
        this._chainCountBonus += bonus;
    }

    /**
     * 应用减速效果加成（累加）
     * @param bonus 加成倍率（如 0.1 表示 +10%）
     */
    applySlowBonus(bonus: number): void {
        this._slowBonus += bonus;
    }

    getType(): TowerConfig['type'] {
        return this._config.type;
    }

    getSplashRadius(): number {
        return Math.floor(this._config.splashRadius * (1 + this._rangeBonus));
    }

    getChainCount(): number {
        return this._config.chainCount + this._chainCountBonus;
    }

    getSlowFactor(): number {
        return this._config.slowFactor * (1 + this._slowBonus);
    }

    getSlowDuration(): number {
        return this._config.slowDuration;
    }

    /**
     * 每帧更新：处理攻击冷却
     * @returns 如果可以攻击则返回 true
     */
    update(deltaTime: number): boolean {
        if (this._state.cooldownRemaining > 0) {
            this._state.cooldownRemaining -= deltaTime;
        }
        return this._state.cooldownRemaining <= 0;
    }

    /**
     * 重置攻击冷却
     */
    resetCooldown(): void {
        this._state.cooldownRemaining = this.getAttackSpeed();
    }

    /**
     * 从候选敌人中选择目标
     * 优先选择射程内路径进度最高的敌人（距离基地最近）
     */
    selectTarget(enemies: EnemyController[]): EnemyController | null {
        const range = this.getRange();
        const pos = this._state.position;

        let bestTarget: EnemyController | null = null;
        let bestProgress = -1;

        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;

            const ePos = enemy.getPosition();
            const dx = ePos.x - pos.x;
            const dy = ePos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= range) {
                const progress = enemy.getPathProgress();
                if (progress > bestProgress) {
                    bestProgress = progress;
                    bestTarget = enemy;
                }
            }
        }

        return bestTarget;
    }

    /**
     * 获取射程内所有敌人（用于炮塔范围伤害）
     */
    getEnemiesInRange(enemies: EnemyController[]): EnemyController[] {
        const range = this.getRange();
        const pos = this._state.position;

        return enemies.filter(enemy => {
            if (!enemy.isAlive()) return false;
            const ePos = enemy.getPosition();
            const dx = ePos.x - pos.x;
            const dy = ePos.y - pos.y;
            return Math.sqrt(dx * dx + dy * dy) <= range;
        });
    }

    /**
     * 升级塔
     * @returns 是否升级成功
     */
    upgrade(): boolean {
        const nextLevel = this._state.level + 1;
        const nextConfig = getTowerLevelConfig(this._state.configId, nextLevel);
        if (!nextConfig) return false;

        this._state.level = nextLevel;
        this._levelConfig = nextConfig;
        return true;
    }

    /**
     * 获取当前实际生效属性（含等级和加成）
     */
    getEffectiveStats(): TowerEffectiveStats {
        return {
            id: this._state.id,
            configId: this._state.configId,
            name: this._config.name,
            type: this._config.type,
            level: this._state.level,
            attack: this.getAttack(),
            attackSpeed: this.getAttackSpeed(),
            range: this.getRange(),
            splashRadius: this.getSplashRadius(),
            chainCount: this.getChainCount(),
            slowFactor: this.getSlowFactor(),
            slowDuration: this.getSlowDuration(),
        };
    }
}
