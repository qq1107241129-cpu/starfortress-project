/**
 * 战斗管理器
 * 管理战斗流程：开始、暂停、结算
 */

import { StageManager } from './StageManager';
import { EnemySpawner } from './EnemySpawner';
import { BattleSettlement } from './BattleSettlement';
import { TowerManager, TowerSlot } from './TowerManager';
import { RogueChoiceManager } from './RogueChoiceManager';
import { SkillManager } from './SkillManager';
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
    towerCount: number;
}

export class BattleManager {
    private static _instance: BattleManager | null = null;
    private _state: BattleState = 'idle';
    private _stageManager: StageManager;
    private _enemySpawner: EnemySpawner | null = null;
    private _battleSettlement: BattleSettlement | null = null;
    private _towerManager: TowerManager | null = null;
    private _rogueChoiceManager: RogueChoiceManager;
    private _skillManager: SkillManager;
    private _timeManager: TimeManager;
    private _eventBus: EventBus;
    private _configManager: ConfigManager;
    /** 是否因肉鸽选择而暂停 */
    private _isForcePaused: boolean = false;

    constructor() {
        this._stageManager = new StageManager();
        this._rogueChoiceManager = new RogueChoiceManager();
        this._skillManager = new SkillManager();
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
                this._battleSettlement.recordKill(data.isBoss, data.reward);
            }
        });

        // 监听战斗结果
        this._eventBus.on(BATTLE_EVENTS.BATTLE_RESULT, (data: { result: 'victory' | 'defeat' }) => {
            this._endBattle(data.result);
        });

        // 监听强制暂停（肉鸽选择期间）
        this._eventBus.on(BATTLE_EVENTS.BATTLE_FORCE_PAUSE, () => {
            this._isForcePaused = true;
            this._timeManager.pauseBattleTimer();
        });

        // 监听强制恢复（肉鸽选择完成后）
        this._eventBus.on(BATTLE_EVENTS.BATTLE_FORCE_RESUME, () => {
            this._isForcePaused = false;
            this._timeManager.resumeBattleTimer();
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

        // 初始化塔管理器（使用默认槽位，后续可从关卡配置加载）
        const defaultSlots: TowerSlot[] = [
            { id: 'slot_1', position: { x: 200, y: 300 }, towerId: null },
            { id: 'slot_2', position: { x: 400, y: 200 }, towerId: null },
            { id: 'slot_3', position: { x: 400, y: 400 }, towerId: null },
            { id: 'slot_4', position: { x: 600, y: 300 }, towerId: null },
        ];
        this._towerManager = new TowerManager(defaultSlots);

        // 初始化肉鸽选择管理器
        this._rogueChoiceManager.reset();
        this._rogueChoiceManager.setTowerManager(this._towerManager);

        // 初始化主动技能管理器
        this._skillManager.init();

        // 重置强制暂停状态
        this._isForcePaused = false;

        // 开始计时
        this._timeManager.startBattleTimer(stageConfig.duration);

        // 开始生成敌人
        this._enemySpawner.start();

        // 更新状态
        this._state = 'playing';

        // 通知外部战斗已开始（GameBootstrap 依赖此事件设置 _isBattleRunning 和放置塔）
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_START, { stageId });

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

        // 如果因肉鸽选择而暂停，跳过战斗逻辑更新
        if (this._isForcePaused) return;

        // 更新时间
        this._timeManager.updateBattleTime(deltaTime);
        const currentTime = this._timeManager.getBattleTime();

        // 更新肉鸽选择（检查是否触发）
        this._rogueChoiceManager.update(currentTime);

        // 更新敌人生成器
        if (this._enemySpawner) {
            this._enemySpawner.update(deltaTime, currentTime);
        }

        // 更新塔（目标选择 + 攻击）
        if (this._towerManager && this._enemySpawner) {
            const aliveEnemies = this._enemySpawner.getAliveEnemies();
            this._towerManager.update(deltaTime, aliveEnemies);
        }
    }

    /**
     * 结束战斗
     */
    private _endBattle(result: 'victory' | 'defeat'): void {
        this._state = result;

        // 停止计时
        this._timeManager.stopBattleTimer();

        // 通知外部战斗已结束（GameBootstrap 依赖此事件恢复 _isBattleRunning）
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_END);

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
        if (this._state === 'idle') return;
        const wasPlaying = this._state === 'playing' || this._state === 'paused';
        this._state = 'idle';
        this._enemySpawner?.clear();
        this._towerManager?.clear();
        this._stageManager.reset();
        this._battleSettlement = null;
        this._enemySpawner = null;
        this._towerManager = null;
        // 如果是玩家主动中断战斗（暂停/进行中），需要停止计时并发出 BATTLE_END
        // 如果是战斗已结束（victory/defeat），_endBattle() 已经发出过 BATTLE_END
        if (wasPlaying) {
            this._timeManager.stopBattleTimer();
            this._eventBus.emit(BATTLE_EVENTS.BATTLE_END);
        }
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
            enemyCount: this._enemySpawner?.getEnemyCount() || 0,
            towerCount: this._towerManager?.getTowers().length || 0,
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
     * 获取塔管理器
     */
    getTowerManager(): TowerManager | null {
        return this._towerManager;
    }

    /**
     * 使用主动技能
     * @param skillId 技能ID
     * @returns 是否使用成功
     */
    useSkill(skillId: string): boolean {
        if (this._state !== 'playing') return false;
        if (!this._enemySpawner) return false;

        const aliveEnemies = this._enemySpawner.getAliveEnemies();
        return this._skillManager.useSkill(skillId, aliveEnemies);
    }

    /**
     * 获取主动技能管理器
     */
    getSkillManager(): SkillManager {
        return this._skillManager;
    }

    /**
     * 获取肉鸽选择管理器
     */
    getRogueChoiceManager(): RogueChoiceManager {
        return this._rogueChoiceManager;
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
