/**
 * 战斗管理器
 * 管理战斗流程：开始、暂停、结算
 */

import { StageManager } from './StageManager';
import { EnemySpawner } from './EnemySpawner';
import { BattleSettlement } from './BattleSettlement';
import { TimeManager } from '../core/TimeManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { ConfigManager } from '../core/ConfigManager';

export type BattleState = 'idle' | 'playing' | 'paused' | 'victory' | 'defeat' | 'settlement';

export interface BattleInfo {
    state: BattleState;
    stageId: string;
    currentTime: number;
    remainingTime: number;
    baseHealth: number;
    baseHealthMax: number;
    killCount: number;
    bossKillCount: number;
    enemyCount: number;
}

export class BattleManager {
    private static _instance: BattleManager | null = null;
    private _state: BattleState = 'idle';
    private _stageManager: StageManager;
    private _enemySpawner: EnemySpawner | null = null;
    private _battleSettlement: BattleSettlement | null = null;
    private _timeManager: TimeManager;
    private _eventBus: EventBus;
    private _configManager: ConfigManager;

    constructor() {
        this._stageManager = new StageManager();
        this._timeManager = TimeManager.getInstance();
        this._eventBus = EventBus.getInstance();
        this._configManager = ConfigManager.getInstance();

        this._setupEventListeners();
    }

    static getInstance(): BattleManager {
        if (!BattleManager._instance) {
            BattleManager._instance = new BattleManager();
        }
        return BattleManager._instance;
    }

    /**
     * 设置事件监听
     */
    private _setupEventListeners(): void {
        // 监听敌人到达基地
        this._eventBus.on(BATTLE_EVENTS.ENEMY_REACH_BASE, (data: { enemyId: string; damage: number }) => {
            this._stageManager.damageBase(data.damage);
        });

        // 监听敌人死亡
        this._eventBus.on(BATTLE_EVENTS.ENEMY_DEATH, (data: { enemyId: string; reward: number; isBoss: boolean }) => {
            if (this._battleSettlement) {
                this._battleSettlement.recordKill(data.isBoss);
            }
        });

        // 监听战斗结果
        this._eventBus.on(BATTLE_EVENTS.BATTLE_RESULT, (data: { result: 'victory' | 'defeat' }) => {
            this._endBattle(data.result);
        });
    }

    /**
     * 开始战斗
     */
    startBattle(stageId: string): boolean {
        if (this._state !== 'idle') {
            console.warn('BattleManager: Battle already in progress');
            return false;
        }

        // 加载关卡
        if (!this._stageManager.loadStage(stageId)) {
            return false;
        }

        const stageConfig = this._stageManager.getCurrentStage();
        if (!stageConfig) {
            return false;
        }

        // 初始化敌人生成器
        const path = this._stageManager.getPath();
        this._enemySpawner = new EnemySpawner(stageConfig, path);

        // 初始化结算系统
        this._battleSettlement = new BattleSettlement(stageConfig);
        this._battleSettlement.reset();

        // 开始计时
        this._timeManager.startBattleTimer(stageConfig.duration);

        // 开始生成敌人
        this._enemySpawner.start();

        // 更新状态
        this._state = 'playing';

        return true;
    }

    /**
     * 通过索引开始战斗
     */
    startBattleByIndex(stageIndex: number): boolean {
        const stageConfig = this._configManager.getStageConfigByIndex(stageIndex);
        if (!stageConfig) {
            console.error('BattleManager: Stage not found at index:', stageIndex);
            return false;
        }

        return this.startBattle(stageConfig.id);
    }

    /**
     * 暂停战斗
     */
    pauseBattle(): void {
        if (this._state !== 'playing') return;

        this._state = 'paused';
        this._timeManager.pauseBattleTimer();
    }

    /**
     * 恢复战斗
     */
    resumeBattle(): void {
        if (this._state !== 'paused') return;

        this._state = 'playing';
        this._timeManager.resumeBattleTimer();
    }

    /**
     * 更新战斗（每帧调用）
     */
    update(deltaTime: number): void {
        if (this._state !== 'playing') return;

        // 更新时间
        this._timeManager.updateBattleTime(deltaTime);
        const currentTime = this._timeManager.getBattleTime();

        // 更新敌人生成器
        if (this._enemySpawner) {
            this._enemySpawner.update(deltaTime, currentTime);
        }
    }

    /**
     * 结束战斗
     */
    private _endBattle(result: 'victory' | 'defeat'): void {
        this._state = result;

        // 停止计时
        this._timeManager.stopBattleTimer();

        // 计算结算数据
        if (this._battleSettlement) {
            const baseState = this._stageManager.getBaseState();
            const battleResult = this._battleSettlement.calculateResult(
                result,
                baseState.health,
                baseState.maxHealth
            );

            // 触发结算事件
            this._eventBus.emit(BATTLE_EVENTS.BATTLE_SETTLEMENT, battleResult);
        }
    }

    /**
     * 进入结算界面
     */
    enterSettlement(): void {
        if (this._state !== 'victory' && this._state !== 'defeat') return;
        this._state = 'settlement';
    }

    /**
     * 返回空闲状态
     */
    returnToIdle(): void {
        this._state = 'idle';
        this._enemySpawner?.clear();
        this._stageManager.reset();
        this._battleSettlement = null;
        this._enemySpawner = null;
    }

    /**
     * 获取战斗状态
     */
    getState(): BattleState {
        return this._state;
    }

    /**
     * 获取战斗信息
     */
    getBattleInfo(): BattleInfo {
        const baseState = this._stageManager.getBaseState();
        const stageConfig = this._stageManager.getCurrentStage();

        return {
            state: this._state,
            stageId: stageConfig?.id || '',
            currentTime: this._timeManager.getBattleTime(),
            remainingTime: this._timeManager.getRemainingTime(),
            baseHealth: baseState.health,
            baseHealthMax: baseState.maxHealth,
            killCount: this._battleSettlement?.getKillCount() || 0,
            bossKillCount: this._battleSettlement?.getBossKillCount() || 0,
            enemyCount: this._enemySpawner?.getEnemyCount() || 0
        };
    }

    /**
     * 获取所有存活的敌人
     */
    getAliveEnemies() {
        return this._enemySpawner?.getAliveEnemies() || [];
    }

    /**
     * 获取当前关卡配置
     */
    getCurrentStage() {
        return this._stageManager.getCurrentStage();
    }

    /**
     * 获取路径
     */
    getPath() {
        return this._stageManager.getPath();
    }

    /**
     * 是否正在战斗
     */
    isPlaying(): boolean {
        return this._state === 'playing';
    }

    /**
     * 是否暂停
     */
    isPaused(): boolean {
        return this._state === 'paused';
    }

    /**
     * 是否已结束
     */
    isEnded(): boolean {
        return this._state === 'victory' || this._state === 'defeat';
    }
}