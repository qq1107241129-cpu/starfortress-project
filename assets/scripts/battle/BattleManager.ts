/**
 * 战斗管理器
 * 管理战斗流程：开始、暂停、结算
 */

import { StageManager, TOWER_SLOT_POSITIONS } from './StageManager';
import { EnemySpawner } from './EnemySpawner';
import { BattleSettlement } from './BattleSettlement';
import { TowerManager, TowerSlot } from './TowerManager';
import { RogueChoiceManager } from './RogueChoiceManager';
import { SkillManager } from './SkillManager';
import { TimeManager } from '../core/TimeManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { ConfigManager } from '../core/ConfigManager';
import { BATTLE_BALANCE } from '../data/BattleBalanceConfig';

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
    /** 是否因塔位选择而暂停 */
    private _isPlacementPaused: boolean = false;
    /** 已放置的塔数量 */
    private _placedTowerCount: number = 0;
    /** 需要放置的塔数量（从配置读取） */
    private get _requiredTowerCount(): number { return BATTLE_BALANCE.requiredTowerCount; }

    // ==================== 战斗倍速 ====================
    /** 当前战斗倍速 */
    private _battleSpeed: number = 1;
    /** 可选倍速列表 */
    private readonly SPEED_OPTIONS: number[] = [1, 2, 3, 4];

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
        this._eventBus.on(BATTLE_EVENTS.ENEMY_REACH_BASE, (data: { enemyId: string; configId: string; isBoss: boolean; damage: number }) => {
            // 先扣血
            this._stageManager.damageBase(data.damage);

            // Boss 进基地触发结算
            if (data.isBoss && this._state === 'playing') {
                const baseState = this._stageManager.getBaseState();
                if (baseState.health > 0) {
                    // 基地血量 > 0，胜利
                    this._eventBus.emit(BATTLE_EVENTS.BATTLE_RESULT, { result: 'victory' });
                }
                // 基地血量 <= 0 时，damageBase 已经触发了 defeat，这里不需要重复触发
            }
        });

        // 监听敌人死亡
        this._eventBus.on(BATTLE_EVENTS.ENEMY_DEATH, (data: { enemyId: string; reward: number; isBoss: boolean }) => {
            if (this._battleSettlement) {
                this._battleSettlement.recordKill(data.isBoss, data.reward);
            }
            // Boss 死亡触发胜利
            if (data.isBoss && this._state === 'playing') {
                this._eventBus.emit(BATTLE_EVENTS.BATTLE_RESULT, { result: 'victory' });
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

        // 初始化敌人生成器（使用随机路径）
        this._enemySpawner = new EnemySpawner(stageConfig, this._stageManager);

        // 初始化结算系统
        this._battleSettlement = new BattleSettlement(stageConfig);
        this._battleSettlement.reset();

        // 初始化塔管理器（使用新的 8 个塔位）
        const slots: TowerSlot[] = TOWER_SLOT_POSITIONS.map(pos => ({
            id: pos.id,
            position: { x: pos.x, y: pos.y },
            towerId: null
        }));
        this._towerManager = new TowerManager(slots);

        // 初始化肉鸽选择管理器
        this._rogueChoiceManager.reset();
        this._rogueChoiceManager.setTowerManager(this._towerManager);

        // 初始化主动技能管理器
        this._skillManager.init();

        // 重置强制暂停状态
        this._isForcePaused = false;
        this._isPlacementPaused = true; // 开始时暂停，等待玩家放置塔
        this._placedTowerCount = 0;
        this._battleSpeed = 1; // 重置倍速为 1x

        // 开始计时
        this._timeManager.startBattleTimer(stageConfig.duration);

        // 更新状态
        this._state = 'playing';

        // 通知外部战斗已开始
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_START, { stageId, isPlacementPhase: true });

        return true;
    }

    /**
     * 放置塔（玩家选择后调用）
     */
    placeTower(slotId: string, towerConfigId: string, level: number = 1): boolean {
        console.log(`[BattleManager] placeTower: slotId=${slotId}, towerConfigId=${towerConfigId}, level=${level}`);

        if (!this._towerManager) {
            console.warn('[BattleManager] placeTower: towerManager is null');
            return false;
        }

        const success = this._towerManager.placeTower(slotId, towerConfigId, level);
        console.log(`[BattleManager] placeTower result: ${success}`);

        if (success) {
            this._placedTowerCount++;
            console.log(`[BattleManager] 放置塔 ${this._placedTowerCount}/${this._requiredTowerCount}`);

            // 检查是否放够了塔
            if (this._placedTowerCount >= this._requiredTowerCount) {
                this._resumeFromPlacement();
            }
        }
        return success;
    }

    /**
     * 从放置阶段恢复，开始战斗
     */
    private _resumeFromPlacement(): void {
        this._isPlacementPaused = false;
        console.log('[BattleManager] 塔放置完成，战斗开始');

        // 开始生成敌人
        if (this._enemySpawner) {
            this._enemySpawner.start();
        }

        // 通知外部放置阶段完成（使用独立事件，避免重复触发 BATTLE_START）
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_PLACEMENT_COMPLETE, { stageId: this._stageManager.getCurrentStage()?.id });
    }

    /**
     * 是否处于放置阶段
     */
    isPlacementPhase(): boolean {
        return this._isPlacementPaused;
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

        // 如果因肉鸽选择或塔位选择而暂停，跳过战斗逻辑更新
        if (this._isForcePaused || this._isPlacementPaused) return;

        // 应用战斗倍速
        const scaledDeltaTime = deltaTime * this._battleSpeed;

        // 更新时间
        this._timeManager.updateBattleTime(scaledDeltaTime);
        const currentTime = this._timeManager.getBattleTime();

        // 更新肉鸽选择（检查是否触发）
        this._rogueChoiceManager.update(currentTime);

        // 更新敌人生成器
        if (this._enemySpawner) {
            this._enemySpawner.update(scaledDeltaTime, currentTime);
        }

        // 更新塔（目标选择 + 攻击）
        if (this._towerManager && this._enemySpawner) {
            const aliveEnemies = this._enemySpawner.getAliveEnemies();
            this._towerManager.update(scaledDeltaTime, aliveEnemies);
        }
    }

    // ==================== 战斗倍速控制 ====================

    /**
     * 获取当前战斗倍速
     */
    getBattleSpeed(): number {
        return this._battleSpeed;
    }

    /**
     * 设置战斗倍速
     * @param speed 倍速值（必须在 SPEED_OPTIONS 中）
     */
    setBattleSpeed(speed: number): void {
        if (this.SPEED_OPTIONS.indexOf(speed) === -1) {
            console.warn(`[BattleManager] 不支持的倍速: ${speed}`);
            return;
        }
        this._battleSpeed = speed;
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, { speed });
        console.log(`[BattleManager] 战斗倍速切换为: x${speed}`);
    }

    /**
     * 循环切换战斗倍速：1x → 2x → 3x → 4x → 1x
     */
    cycleBattleSpeed(): void {
        const currentIndex = this.SPEED_OPTIONS.indexOf(this._battleSpeed);
        const nextIndex = (currentIndex + 1) % this.SPEED_OPTIONS.length;
        this.setBattleSpeed(this.SPEED_OPTIONS[nextIndex]);
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
        this._isPlacementPaused = false;
        this._placedTowerCount = 0;
        this._battleSpeed = 1; // 重置倍速为 1x
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
