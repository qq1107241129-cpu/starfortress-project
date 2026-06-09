/**
 * 关卡管理器
 * 管理关卡配置、路径、基地状态
 *
 * 坐标系说明：
 * - 使用 BattleVisualRoot 本地坐标系
 * - 基地中心为 (0, 0)
 * - 战斗区域为竖屏布局，纵向大于横向
 */

import { StageConfig, getStageConfig, getStageConfigByIndex } from '../data/StageConfig';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';

export interface BaseState {
    health: number;
    maxHealth: number;
    isDestroyed: boolean;
}

// ==================== 战斗布局常量 ====================

/** 基地中心坐标（BattleVisualRoot 本地坐标原点） */
export const BASE_CENTER = { x: 0, y: 0 };
/** 基地边长 */
export const BASE_SIZE = 100;
/** 基地半边长 */
export const BASE_HALF_SIZE = BASE_SIZE / 2;

/** 塔位尺寸（视觉大小） */
export const SLOT_SIZE = 48;
/** 塔位半尺寸 */
export const SLOT_HALF_SIZE = SLOT_SIZE / 2;

/** 塔位到基地中心的距离 */
export const SLOT_DISTANCE = 110;

/** 战斗区域半宽（敌人生成范围） */
export const BATTLE_HALF_WIDTH = 420;
/** 战斗区域半高（敌人生成范围，竖屏纵向更大） */
export const BATTLE_HALF_HEIGHT = 650;

/** 8 个塔位坐标（围绕基地，BattleVisualRoot 本地坐标） */
export const TOWER_SLOT_POSITIONS = [
    { id: 'slot_1', x: -110, y: 110 },   // 上左
    { id: 'slot_2', x: 0, y: 110 },      // 上中
    { id: 'slot_3', x: 110, y: 110 },    // 上右
    { id: 'slot_4', x: -110, y: 0 },     // 左中
    { id: 'slot_5', x: 110, y: 0 },      // 右中
    { id: 'slot_6', x: -110, y: -110 },  // 下左
    { id: 'slot_7', x: 0, y: -110 },     // 下中
    { id: 'slot_8', x: 110, y: -110 },   // 下右
];

export class StageManager {
    private _currentStage: StageConfig | null = null;
    private _baseState: BaseState;
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
     * 获取随机生成路径（从战斗区域边缘到基地边缘）
     * 使用 BattleVisualRoot 本地坐标系
     */
    getRandomSpawnPath(): { x: number; y: number }[] {
        // 随机选择一个方向：0=上, 1=下, 2=左, 3=右
        const direction = Math.floor(Math.random() * 4);
        let spawnPoint: { x: number; y: number };
        let targetPoint: { x: number; y: number };

        switch (direction) {
            case 0: // 从上方生成
                spawnPoint = {
                    x: (Math.random() - 0.5) * BATTLE_HALF_WIDTH * 2,
                    y: BATTLE_HALF_HEIGHT + 50
                };
                targetPoint = { x: BASE_CENTER.x, y: BASE_CENTER.y + BASE_HALF_SIZE };
                break;
            case 1: // 从下方生成
                spawnPoint = {
                    x: (Math.random() - 0.5) * BATTLE_HALF_WIDTH * 2,
                    y: -(BATTLE_HALF_HEIGHT + 50)
                };
                targetPoint = { x: BASE_CENTER.x, y: BASE_CENTER.y - BASE_HALF_SIZE };
                break;
            case 2: // 从左方生成
                spawnPoint = {
                    x: -(BATTLE_HALF_WIDTH + 50),
                    y: (Math.random() - 0.5) * BATTLE_HALF_HEIGHT * 2
                };
                targetPoint = { x: BASE_CENTER.x - BASE_HALF_SIZE, y: BASE_CENTER.y };
                break;
            case 3: // 从右方生成
                spawnPoint = {
                    x: BATTLE_HALF_WIDTH + 50,
                    y: (Math.random() - 0.5) * BATTLE_HALF_HEIGHT * 2
                };
                targetPoint = { x: BASE_CENTER.x + BASE_HALF_SIZE, y: BASE_CENTER.y };
                break;
            default:
                spawnPoint = { x: 0, y: BATTLE_HALF_HEIGHT + 50 };
                targetPoint = { x: BASE_CENTER.x, y: BASE_CENTER.y + BASE_HALF_SIZE };
        }

        return [spawnPoint, targetPoint];
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
    }
}
