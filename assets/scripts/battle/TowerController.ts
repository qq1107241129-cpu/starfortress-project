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

export class TowerController {
    private _state: TowerState;
    private _config: TowerConfig;
    private _levelConfig: TowerLevelConfig;

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
        return this._levelConfig.range;
    }

    getAttack(): number {
        return this._levelConfig.attack;
    }

    getAttackSpeed(): number {
        return this._levelConfig.attackSpeed;
    }

    getType(): TowerConfig['type'] {
        return this._config.type;
    }

    getSplashRadius(): number {
        return this._config.splashRadius;
    }

    getChainCount(): number {
        return this._config.chainCount;
    }

    getSlowFactor(): number {
        return this._config.slowFactor;
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
        this._state.cooldownRemaining = this._levelConfig.attackSpeed;
    }

    /**
     * 从候选敌人中选择目标
     * 优先选择射程内路径进度最高的敌人（距离基地最近）
     */
    selectTarget(enemies: EnemyController[]): EnemyController | null {
        const range = this._levelConfig.range;
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
        const range = this._levelConfig.range;
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
}
