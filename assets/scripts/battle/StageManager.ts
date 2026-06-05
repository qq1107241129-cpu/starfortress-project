/**
 * 关卡管理器
 * 管理关卡配置、路径、基地状态
 */

import { StageConfig, getStageConfig, getStageConfigByIndex } from '../data/StageConfig';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';

export interface BaseState {
    health: number;
    maxHealth: number;
    isDestroyed: boolean;
}

export class StageManager {
    private _currentStage: StageConfig | null = null;
    private _baseState: BaseState;
    private _path: { x: number; y: number }[] = [];
    private _eventBus: EventBus;

    constructor() {
        this._eventBus = EventBus.getInstance();
        this._baseState = {
            health: 0,
            maxHealth: 0,
            isDestroyed: false
        };
    }

    /**
     * 加载关卡配置
     */
    loadStage(stageId: string): boolean {
        const stageConfig = getStageConfig(stageId);
        if (!stageConfig) {
            console.error(`StageManager: Stage config not found: ${stageId}`);
            return false;
        }

        this._currentStage = stageConfig;
        this._initBaseState();
        this._initPath();

        return true;
    }

    /**
     * 通过索引加载关卡
     */
    loadStageByIndex(index: number): boolean {
        const stageConfig = getStageConfigByIndex(index);
        if (!stageConfig) {
            console.error(`StageManager: Stage config not found at index: ${index}`);
            return false;
        }

        this._currentStage = stageConfig;
        this._initBaseState();
        this._initPath();

        return true;
    }

    /**
     * 初始化基地状态
     */
    private _initBaseState(): void {
        if (!this._currentStage) return;

        this._baseState = {
            health: this._currentStage.baseHealth,
            maxHealth: this._currentStage.baseHealth,
            isDestroyed: false
        };

        this._eventBus.emit(BATTLE_EVENTS.BASE_HEALTH_CHANGE, {
            health: this._baseState.health,
            maxHealth: this._baseState.maxHealth
        });
    }

    /**
     * 初始化路径（临时简单路径）
     */
    private _initPath(): void {
        // 临时路径：从屏幕左侧到右侧，中间有转弯
        // 实际项目中应该从关卡配置或地图数据加载
        this._path = [
            { x: -100, y: 300 },   // 起点（屏幕外）
            { x: 100, y: 300 },    // 第一个点
            { x: 100, y: 200 },    // 向上
            { x: 300, y: 200 },    // 向右
            { x: 300, y: 400 },    // 向下
            { x: 500, y: 400 },    // 向右
            { x: 500, y: 300 },    // 向上
            { x: 700, y: 300 },    // 向右
            { x: 700, y: 500 },    // 向下
            { x: 900, y: 500 },    // 向右
            { x: 900, y: 300 },    // 向上
            { x: 1100, y: 300 },   // 终点（基地位置）
        ];
    }

    /**
     * 基地受到伤害
     */
    damageBase(damage: number): void {
        if (this._baseState.isDestroyed) return;

        this._baseState.health = Math.max(0, this._baseState.health - damage);

        this._eventBus.emit(BATTLE_EVENTS.BASE_HEALTH_CHANGE, {
            health: this._baseState.health,
            maxHealth: this._baseState.maxHealth
        });

        // 检查基地是否被摧毁
        if (this._baseState.health <= 0) {
            this._baseState.isDestroyed = true;
            this._eventBus.emit(BATTLE_EVENTS.BATTLE_RESULT, { result: 'defeat' });
        }
    }

    /**
     * 获取当前关卡配置
     */
    getCurrentStage(): StageConfig | null {
        return this._currentStage;
    }

    /**
     * 获取基地状态
     */
    getBaseState(): BaseState {
        return { ...this._baseState };
    }

    /**
     * 获取路径
     */
    getPath(): { x: number; y: number }[] {
        return [...this._path];
    }

    /**
     * 获取基地生命值百分比
     */
    getBaseHealthPercent(): number {
        if (this._baseState.maxHealth <= 0) return 0;
        return this._baseState.health / this._baseState.maxHealth;
    }

    /**
     * 基地是否被摧毁
     */
    isBaseDestroyed(): boolean {
        return this._baseState.isDestroyed;
    }

    /**
     * 获取关卡时长
     */
    getStageDuration(): number {
        return this._currentStage?.duration || 0;
    }

    /**
     * 重置关卡状态
     */
    reset(): void {
        this._currentStage = null;
        this._baseState = {
            health: 0,
            maxHealth: 0,
            isDestroyed: false
        };
        this._path = [];
    }
}