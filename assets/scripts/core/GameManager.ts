/**
 * GameManager - 游戏流程状态管理
 *
 * 职责：
 * 1. 管理游戏流程状态（主界面、战斗、结算、建筑、塔升级、转生、设置）
 * 2. 协调 UI 面板切换
 * 3. 调用 BattleManager.startBattleByIndex 启动战斗
 *
 * 状态流转：
 *   main -> battle -> settlement -> main
 *   main -> building / towerUpgrade / rebirth / settings -> main
 */

import { EventBus, BATTLE_EVENTS } from './EventBus';
import { BattleManager } from '../battle/BattleManager';

/** 游戏流程状态 */
export type GameFlowState =
    | 'main'         // 主界面
    | 'battle'       // 战斗中
    | 'settlement'   // 结算界面
    | 'building'     // 建筑升级
    | 'towerUpgrade' // 塔升级
    | 'rebirth'      // 星核重构
    | 'settings';    // 设置

export class GameManager {
    private static _instance: GameManager | null = null;
    private _state: GameFlowState = 'main';
    private _eventBus: EventBus;
    private _battleManager: BattleManager;
    private _boundOnSettlement: ((data: any) => void) | null = null;

    /** 状态变化回调（UI 面板注册） */
    private _stateChangeCallbacks: Array<(state: GameFlowState) => void> = [];

    private constructor() {
        this._eventBus = EventBus.getInstance();
        this._battleManager = BattleManager.getInstance();
        this._setupEventListeners();
    }

    static getInstance(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }

    /**
     * 获取当前流程状态
     */
    getState(): GameFlowState {
        return this._state;
    }

    /**
     * 切换流程状态
     * @param newState 目标状态
     */
    setState(newState: GameFlowState): void {
        if (this._state === newState) return;

        const oldState = this._state;
        this._state = newState;
        console.log(`[GameManager] 状态切换: ${oldState} -> ${newState}`);

        // 通知所有监听者
        for (const cb of this._stateChangeCallbacks) {
            try {
                cb(newState);
            } catch (e) {
                console.error('[GameManager] 状态回调异常:', e);
            }
        }
    }

    /**
     * 注册状态变化回调
     * @returns 取消注册函数
     */
    onStateChange(callback: (state: GameFlowState) => void): () => void {
        this._stateChangeCallbacks.push(callback);
        return () => {
            const idx = this._stateChangeCallbacks.indexOf(callback);
            if (idx !== -1) {
                this._stateChangeCallbacks.splice(idx, 1);
            }
        };
    }

    /**
     * 进入战斗（从主界面）
     * 先切换状态激活 UI 节点，再启动战斗
     * @param stageIndex 关卡索引（0-based）
     */
    enterBattle(stageIndex: number): void {
        // 如果战斗已结束（胜利/失败），先回到 idle 状态
        if (this._battleManager.isEnded()) {
            this._battleManager.returnToIdle();
        }
        // 先切换状态，激活 BattleVisualManager / BattleUI 等节点
        this.setState('battle');
        // 再启动战斗（会同步发出 BATTLE_START，此时节点已激活）
        const success = this._battleManager.startBattleByIndex(stageIndex);
        if (!success) {
            console.warn(`[GameManager] 无法启动战斗: 关卡 ${stageIndex}`);
            this.setState('main'); // 启动失败时回退到主界面
        }
    }

    /**
     * 进入结算（战斗结束后由 BattleManager 触发）
     */
    enterSettlement(): void {
        this.setState('settlement');
    }

    /**
     * 返回主界面
     */
    returnToMain(): void {
        // 如果战斗还在进行，先结束
        if (this._battleManager.isPlaying() || this._battleManager.isPaused()) {
            this._battleManager.returnToIdle();
        }
        this.setState('main');
    }

    /**
     * 进入建筑升级界面
     */
    enterBuilding(): void {
        this.setState('building');
    }

    /**
     * 进入塔升级界面
     */
    enterTowerUpgrade(): void {
        this.setState('towerUpgrade');
    }

    /**
     * 进入星核重构界面
     */
    enterRebirth(): void {
        this.setState('rebirth');
    }

    /**
     * 进入设置界面
     */
    enterSettings(): void {
        this.setState('settings');
    }

    // ==================== 内部事件监听 ====================

    private _setupEventListeners(): void {
        // 战斗结算后自动切换到结算状态
        this._boundOnSettlement = () => {
            this.enterSettlement();
        };
        this._eventBus.on(BATTLE_EVENTS.BATTLE_SETTLEMENT, this._boundOnSettlement);
    }

    /**
     * 销毁（清理事件监听）
     */
    destroy(): void {
        if (this._eventBus && this._boundOnSettlement) {
            this._eventBus.off(BATTLE_EVENTS.BATTLE_SETTLEMENT, this._boundOnSettlement);
            this._boundOnSettlement = null;
        }
        this._stateChangeCallbacks = [];
    }
}
