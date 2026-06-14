/**
 * 时间管理器
 * 管理战斗计时
 */

import { EventBus, BATTLE_EVENTS } from './EventBus';

export class TimeManager {
    private static _instance: TimeManager | null = null;
    private _battleTime: number = 0;
    private _battleDuration: number = 0;
    private _isBattleRunning: boolean = false;
    private _lastUpdateTime: number = 0;
    private _eventBus: EventBus;

    constructor() {
        this._eventBus = EventBus.getInstance();
    }

    static getInstance(): TimeManager {
        if (!TimeManager._instance) {
            TimeManager._instance = new TimeManager();
        }
        return TimeManager._instance;
    }

    /**
     * 开始战斗计时
     * 注意：BATTLE_START 事件由 BattleManager.startBattle() 统一发出
     */
    startBattleTimer(duration: number): void {
        this._battleTime = 0;
        this._battleDuration = duration;
        this._isBattleRunning = true;
        this._lastUpdateTime = Date.now();
    }

    /**
     * 暂停战斗计时
     */
    pauseBattleTimer(): void {
        this._isBattleRunning = false;
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_PAUSE);
    }

    /**
     * 恢复战斗计时
     */
    resumeBattleTimer(): void {
        this._isBattleRunning = true;
        this._lastUpdateTime = Date.now();
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_RESUME);
    }

    /**
     * 停止战斗计时
     * 注意：BATTLE_END 事件由 BattleManager._endBattle() 或 returnToIdle() 统一发出
     */
    stopBattleTimer(): void {
        this._isBattleRunning = false;
    }

    /**
     * 更新战斗时间（每帧调用）
     */
    updateBattleTime(deltaTime: number): void {
        if (!this._isBattleRunning) return;

        this._battleTime += deltaTime;
        this._eventBus.emit(BATTLE_EVENTS.TIME_UPDATE, {
            currentTime: this._battleTime,
            remainingTime: Math.max(0, this._battleDuration - this._battleTime),
            progress: this._battleTime / this._battleDuration
        });

        // 时间到后停止计时，但不触发胜利（胜利由 Boss 击杀触发）
        if (this._battleTime >= this._battleDuration) {
            this._battleTime = this._battleDuration;
            this._isBattleRunning = false;
        }
    }

    /**
     * 获取当前战斗时间
     */
    getBattleTime(): number {
        return this._battleTime;
    }

    /**
     * 获取剩余时间
     */
    getRemainingTime(): number {
        return Math.max(0, this._battleDuration - this._battleTime);
    }

    /**
     * 获取战斗进度（0-1）
     */
    getBattleProgress(): number {
        if (this._battleDuration <= 0) return 1;
        return Math.min(1, this._battleTime / this._battleDuration);
    }

    /**
     * 战斗是否正在进行
     */
    isBattleRunning(): boolean {
        return this._isBattleRunning;
    }
}