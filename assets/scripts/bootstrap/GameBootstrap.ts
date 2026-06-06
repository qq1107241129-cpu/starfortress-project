/**
 * GameBootstrap - 游戏启动入口
 *
 * 职责：
 * 1. 初始化 Platform WebMock
 * 2. 初始化 ConfigManager
 * 3. 初始化 EventBus
 * 4. 初始化 TimeManager
 * 5. 初始化 BattleManager
 * 6. 初始化 BaseManager、IdleIncomeManager（放置收益）
 * 7. 启动第 1 关测试战斗
 * 8. 输出调试信息
 * 9. 监听战斗结束和放置收益事件
 *
 * 注意：
 * - 不把大量战斗逻辑塞进 GameBootstrap
 * - 不硬编码大量核心数值
 * - 不直接调用平台 API
 */

import { _decorator, Component, Label } from 'cc';
import { Platform } from '../platform/Platform';
import { ConfigManager } from '../core/ConfigManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { TimeManager } from '../core/TimeManager';
import { BattleManager } from '../battle/BattleManager';
import { BaseManager } from '../base/BaseManager';
import { IdleIncomeManager } from '../base/IdleIncomeManager';

const { ccclass, property } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
    @property(Label)
    debugLabel: Label | null = null;

    @property(Label)
    stageLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    baseHpLabel: Label | null = null;

    @property(Label)
    enemyCountLabel: Label | null = null;

    @property(Label)
    towerCountLabel: Label | null = null;

    private _battleManager: BattleManager | null = null;
    private _baseManager: BaseManager | null = null;
    private _idleIncomeManager: IdleIncomeManager | null = null;
    private _eventBus: EventBus | null = null;
    private _isBattleRunning: boolean = false;
    private _boundCallbacks: Array<{ event: string; callback: (...args: any[]) => void }> = [];
    private _saveAccumulator: number = 0;
    /** 在线收益自动保存间隔（秒） */
    private readonly SAVE_INTERVAL: number = 30;

    private _systemsReady: boolean = false;
    private _listenersRegistered: boolean = false;

    onLoad() {
        console.log('[GameBootstrap] onLoad - 开始初始化');
        // Cocos Creator 不会等待 async onLoad，用 .then() 驱动后续流程
        this._initSystems().then(() => {
            // EventBus 已在 _initSystems 中初始化，此时注册监听才有效
            this._setupEventListeners();
            this._systemsReady = true;
            console.log('[GameBootstrap] 所有系统初始化完成');
            this._startBattle();
        }).catch((e) => {
            console.error('[GameBootstrap] 初始化失败:', e);
        });
    }

    start() {
        console.log('[GameBootstrap] start');
    }

    update(deltaTime: number) {
        if (!this._systemsReady) return;

        if (this._isBattleRunning && this._battleManager) {
            this._battleManager.update(deltaTime);
            this._updateUI();
        } else if (!this._isBattleRunning && this._idleIncomeManager) {
            // 非战斗状态：驱动在线收益计时
            this._idleIncomeManager.update(deltaTime);
            // 定期保存在线收益
            this._saveAccumulator += deltaTime;
            if (this._saveAccumulator >= this.SAVE_INTERVAL) {
                this._saveAccumulator = 0;
                this._baseManager?.save();
            }
        }
    }

    private async _initSystems() {
        // 1. 初始化 Platform WebMock
        console.log('[GameBootstrap] 初始化 Platform WebMock');
        const platform = Platform.instance;
        console.log('[GameBootstrap] Platform 类型:', platform.constructor.name);

        // 2. 初始化 ConfigManager
        console.log('[GameBootstrap] 初始化 ConfigManager');
        const configManager = ConfigManager.getInstance();

        // 验证配置系统
        const stageCount = configManager.getStageCount();
        console.log(`[GameBootstrap] 关卡数量: ${stageCount}`);

        const towerConfigs = configManager.getAllTowerConfigs();
        console.log(`[GameBootstrap] 塔配置数量: ${towerConfigs.length}`);

        const enemyConfigs = configManager.getAllEnemyConfigs();
        console.log(`[GameBootstrap] 敌人配置数量: ${enemyConfigs.length}`);

        // 3. 初始化 EventBus
        console.log('[GameBootstrap] 初始化 EventBus');
        this._eventBus = EventBus.getInstance();

        // 4. 初始化 TimeManager
        console.log('[GameBootstrap] 初始化 TimeManager');
        TimeManager.getInstance();

        // 5. 初始化 BattleManager
        console.log('[GameBootstrap] 初始化 BattleManager');
        this._battleManager = BattleManager.getInstance();

        // 6. 初始化 BaseManager（加载存档、初始化建筑）
        console.log('[GameBootstrap] 初始化 BaseManager');
        this._baseManager = BaseManager.getInstance();
        await this._baseManager.init();

        // 7. 初始化 RebirthManager（星核重构，通过 BaseManager 已初始化）
        console.log('[GameBootstrap] RebirthManager 已随 BaseManager 初始化');

        // 8. 初始化 IdleIncomeManager（计算离线收益）
        console.log('[GameBootstrap] 初始化 IdleIncomeManager');
        this._idleIncomeManager = IdleIncomeManager.getInstance();
        const saveData = this._baseManager.getSaveManager().getSave();
        this._idleIncomeManager.init(saveData.lastOfflineTimestamp);
    }

    private _setupEventListeners() {
        if (this._listenersRegistered) return;
        if (!this._eventBus) {
            console.warn('[GameBootstrap] _setupEventListeners: EventBus 未初始化');
            return;
        }
        const eb = this._eventBus;
        this._listenersRegistered = true;

        const bind = (event: string, callback: (...args: any[]) => void) => {
            eb.on(event, callback);
            this._boundCallbacks.push({ event, callback });
        };

        // 监听战斗开始
        bind(BATTLE_EVENTS.BATTLE_START, (data: any) => {
            console.log('[GameBootstrap] 战斗开始', data);
            this._isBattleRunning = true;
        });

        // 监听战斗结束
        bind(BATTLE_EVENTS.BATTLE_END, () => {
            console.log('[GameBootstrap] 战斗结束');
            this._isBattleRunning = false;
        });

        // 监听战斗结算
        bind(BATTLE_EVENTS.BATTLE_SETTLEMENT, (data: any) => {
            console.log('[GameBootstrap] 战斗结算:', data);
            this._showSettlement(data);
        });

        // 监听战斗结果
        bind(BATTLE_EVENTS.BATTLE_RESULT, (data: any) => {
            console.log('[GameBootstrap] 战斗结果:', data.result);
        });

        // 监听敌人生成
        bind(BATTLE_EVENTS.ENEMY_SPAWN, (data: any) => {
            console.log(`[GameBootstrap] 敌人生成: ${data.configId} at (${data.position.x}, ${data.position.y})`);
        });

        // 监听敌人死亡
        bind(BATTLE_EVENTS.ENEMY_DEATH, (data: any) => {
            console.log(`[GameBootstrap] 敌人死亡: ${data.enemyId}, 奖励: ${data.reward}`);
        });

        // 监听敌人到达基地
        bind(BATTLE_EVENTS.ENEMY_REACH_BASE, (data: any) => {
            console.log(`[GameBootstrap] 敌人到达基地: ${data.enemyId}, 伤害: ${data.damage}`);
        });

        // 监听基地生命值变化
        bind(BATTLE_EVENTS.BASE_HEALTH_CHANGE, (data: any) => {
            console.log(`[GameBootstrap] 基地生命值: ${data.health}/${data.maxHealth}`);
        });

        // 监听波次开始
        bind(BATTLE_EVENTS.STAGE_WAVE_START, (data: any) => {
            console.log(`[GameBootstrap] 波次 ${data.waveIndex} 开始`);
        });

        // 监听 Boss 生成
        bind(BATTLE_EVENTS.STAGE_BOSS_SPAWN, (data: any) => {
            console.log(`[GameBootstrap] Boss 生成: ${data.bossId}`);
        });

        // 监听时间更新
        bind(BATTLE_EVENTS.TIME_UPDATE, (data: any) => {
            // 每 10 秒输出一次
            if (Math.floor(data.currentTime) % 10 === 0) {
                console.log(`[GameBootstrap] 时间: ${data.currentTime.toFixed(1)}s, 剩余: ${data.remainingTime.toFixed(1)}s`);
            }
        });

        // 监听在线收益发放：累加经营币到 BaseManager
        bind(BATTLE_EVENTS.IDLE_INCOME_TICK, (data: { amount: number }) => {
            if (this._baseManager) {
                this._baseManager.addBaseCoin(data.amount);
            }
        });
    }

    private _startBattle() {
        if (!this._battleManager) {
            console.error('[GameBootstrap] BattleManager 未初始化');
            return;
        }

        console.log('[GameBootstrap] 启动第 1 关');
        const success = this._battleManager.startBattleByIndex(0);

        if (success) {
            console.log('[GameBootstrap] 战斗启动成功');

            // 自动放置一些测试塔
            this._placeTestTowers();
        } else {
            console.error('[GameBootstrap] 战斗启动失败');
        }
    }

    private _placeTestTowers() {
        const towerManager = this._battleManager?.getTowerManager();
        if (!towerManager) {
            console.error('[GameBootstrap] TowerManager 未初始化');
            return;
        }

        const slots = towerManager.getSlots();
        console.log(`[GameBootstrap] 可用槽位数量: ${slots.length}`);

        // 放置测试塔
        const testTowers = [
            { slotId: 'slot_1', towerId: 'tower_machinegun' },
            { slotId: 'slot_2', towerId: 'tower_cannon' },
            { slotId: 'slot_3', towerId: 'tower_ice' },
            { slotId: 'slot_4', towerId: 'tower_electric' },
        ];

        for (const testTower of testTowers) {
            const success = towerManager.placeTower(testTower.slotId, testTower.towerId, 1);
            if (success) {
                console.log(`[GameBootstrap] 放置塔成功: ${testTower.towerId} at ${testTower.slotId}`);
            } else {
                console.warn(`[GameBootstrap] 放置塔失败: ${testTower.towerId} at ${testTower.slotId}`);
            }
        }
    }

    private _updateUI() {
        if (!this._battleManager) return;

        const battleInfo = this._battleManager.getBattleInfo();

        // 更新调试标签
        if (this.debugLabel) {
            this.debugLabel.string = `状态: ${battleInfo.state}`;
        }

        // 更新关卡标签
        if (this.stageLabel) {
            this.stageLabel.string = `关卡: ${battleInfo.stageId}`;
        }

        // 更新时间标签
        if (this.timeLabel) {
            this.timeLabel.string = `时间: ${battleInfo.currentTime.toFixed(1)}s / ${battleInfo.remainingTime.toFixed(1)}s`;
        }

        // 更新基地生命值标签
        if (this.baseHpLabel) {
            this.baseHpLabel.string = `基地: ${battleInfo.baseHealth}/${battleInfo.baseHealthMax}`;
        }

        // 更新敌人数量标签
        if (this.enemyCountLabel) {
            this.enemyCountLabel.string = `敌人: ${battleInfo.enemyCount}`;
        }

        // 更新塔数量标签
        if (this.towerCountLabel) {
            this.towerCountLabel.string = `塔: ${battleInfo.towerCount}`;
        }
    }

    private _showSettlement(data: any) {
        console.log('=== 战斗结算 ===');
        console.log(`关卡: ${data.stageId}`);
        console.log(`结果: ${data.result}`);
        console.log(`时长: ${data.duration.toFixed(1)}秒`);
        console.log(`击杀: ${data.killCount} (Boss: ${data.bossKillCount})`);
        console.log(`基地剩余: ${data.baseHealthRemaining}/${data.baseHealthMax}`);
        console.log(`战斗金币: ${data.battleCoinReward}`);
        console.log(`经营币: ${data.baseCoinReward}`);
        console.log(`星级: ${data.starRating}`);
        console.log('================');

        // 更新调试标签显示结算信息
        if (this.debugLabel) {
            this.debugLabel.string = `结算: ${data.result} - ${data.starRating}星`;
        }
    }

    onDestroy() {
        console.log('[GameBootstrap] onDestroy');
        // 退出时先保存当前资源（包括在线收益），再更新离线时间戳
        // 顺序不能反：先 save 确保 baseCoin 持久化，再更新时间戳避免重复结算离线收益
        this._baseManager?.save();
        this._baseManager?.updateOfflineTimestamp();
        // 只解绑本实例注册的事件监听，不调用 EventBus.clear() 以免破坏其他系统
        if (this._eventBus) {
            for (const { event, callback } of this._boundCallbacks) {
                this._eventBus.off(event, callback);
            }
        }
        this._boundCallbacks = [];
    }
}
