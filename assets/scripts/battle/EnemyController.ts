/**
 * 敌人控制器
 * 控制单个敌人的行为：移动、受伤、死亡、减速
 */

import { EnemyConfig } from '../data/EnemyConfig';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';

export interface EnemyState {
    id: string;
    configId: string;
    health: number;
    maxHealth: number;
    speed: number;
    armor: number;
    reward: number;
    position: { x: number; y: number };
    pathIndex: number;
    pathProgress: number;
    isAlive: boolean;
    isBoss: boolean;
    /** 当前减速系数（0~1），0 表示无减速 */
    slowFactor: number;
    /** 减速剩余时间（秒） */
    slowRemaining: number;
}

export class EnemyController {
    private _state: EnemyState;
    private _path: { x: number; y: number }[];
    private _eventBus: EventBus;
    private _config: EnemyConfig;

    constructor(
        configId: string,
        config: EnemyConfig,
        path: { x: number; y: number }[],
        spawnPosition: { x: number; y: number }
    ) {
        this._config = config;
        this._path = path;
        this._eventBus = EventBus.getInstance();

        this._state = {
            id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            configId: configId,
            health: config.health,
            maxHealth: config.health,
            speed: config.speed,
            armor: config.armor,
            reward: config.reward,
            position: { ...spawnPosition },
            pathIndex: 0,
            pathProgress: 0,
            isAlive: true,
            isBoss: config.type === 'boss',
            slowFactor: 0,
            slowRemaining: 0,
        };
    }

    /**
     * 获取敌人状态
     */
    getState(): EnemyState {
        return { ...this._state };
    }

    /**
     * 获取敌人ID
     */
    getId(): string {
        return this._state.id;
    }

    /**
     * 敌人是否存活
     */
    isAlive(): boolean {
        return this._state.isAlive;
    }

    /**
     * 获取当前有效速度（考虑减速）
     */
    getEffectiveSpeed(): number {
        const slowFactor = this._state.slowRemaining > 0 ? this._state.slowFactor : 0;
        return this._state.speed * (1 - slowFactor);
    }

    /**
     * 施加减速效果
     * @param slowFactor 减速系数（0~1），速度乘以 (1 - slowFactor)
     * @param duration 持续时间（秒）
     */
    applySlow(slowFactor: number, duration: number): void {
        // 取更强的减速效果
        if (slowFactor > this._state.slowFactor || this._state.slowRemaining <= 0) {
            this._state.slowFactor = slowFactor;
        }
        // 刷新持续时间
        this._state.slowRemaining = Math.max(this._state.slowRemaining, duration);
    }

    /**
     * 更新敌人位置（每帧调用）
     */
    update(deltaTime: number): void {
        if (!this._state.isAlive || this._path.length < 2) return;

        // 更新减速计时
        if (this._state.slowRemaining > 0) {
            this._state.slowRemaining -= deltaTime;
            if (this._state.slowRemaining <= 0) {
                this._state.slowFactor = 0;
                this._state.slowRemaining = 0;
            }
        }

        const currentTarget = this._path[this._state.pathIndex + 1];
        if (!currentTarget) {
            // 到达终点（基地）
            this._reachBase();
            return;
        }

        // 计算移动距离（使用有效速度）
        const effectiveSpeed = this.getEffectiveSpeed();
        const moveDistance = effectiveSpeed * deltaTime * 100; // 100 像素/秒为基础速度
        const dx = currentTarget.x - this._state.position.x;
        const dy = currentTarget.y - this._state.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= moveDistance) {
            // 到达当前路径点
            this._state.position.x = currentTarget.x;
            this._state.position.y = currentTarget.y;
            this._state.pathIndex++;

            // 检查是否到达终点
            if (this._state.pathIndex >= this._path.length - 1) {
                this._reachBase();
            }
        } else {
            // 向目标移动
            const ratio = moveDistance / distance;
            this._state.position.x += dx * ratio;
            this._state.position.y += dy * ratio;
        }

        // 更新路径进度
        this._state.pathProgress = this._state.pathIndex / (this._path.length - 1);
    }

    /**
     * 敌人受到伤害
     */
    takeDamage(damage: number): void {
        if (!this._state.isAlive) return;

        // 计算实际伤害（考虑护甲）
        const actualDamage = Math.max(1, damage - this._state.armor);
        this._state.health -= actualDamage;

        // 检查死亡
        if (this._state.health <= 0) {
            this._die();
        }
    }

    /**
     * 获取当前位置
     */
    getPosition(): { x: number; y: number } {
        return { ...this._state.position };
    }

    /**
     * 获取路径进度（用于目标优先级排序）
     */
    getPathProgress(): number {
        return this._state.pathProgress;
    }

    /**
     * 获取生命值百分比
     */
    getHealthPercent(): number {
        if (this._state.maxHealth <= 0) return 0;
        return this._state.health / this._state.maxHealth;
    }

    /**
     * 敌人到达基地
     */
    private _reachBase(): void {
        this._state.isAlive = false;
        this._eventBus.emit(BATTLE_EVENTS.ENEMY_REACH_BASE, {
            enemyId: this._state.id,
            damage: 10 // 基础伤害值
        });
    }

    /**
     * 敌人死亡
     */
    private _die(): void {
        this._state.isAlive = false;
        this._state.health = 0;

        this._eventBus.emit(BATTLE_EVENTS.ENEMY_DEATH, {
            enemyId: this._state.id,
            configId: this._state.configId,
            reward: this._state.reward,
            isBoss: this._state.isBoss,
            position: { ...this._state.position }
        });
    }
}
