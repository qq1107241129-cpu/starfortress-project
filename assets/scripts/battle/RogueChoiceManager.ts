/**
 * 肉鸽选择管理器
 * 管理局内 3 选 1 强化选择：触发计时、选项生成、选择生效
 */

import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { RogueUpgradeConfig, ROGUE_UPGRADE_CONFIGS } from '../data/SkillConfig';
import { BATTLE_BALANCE } from '../data/BattleBalanceConfig';
import { TowerManager } from './TowerManager';

export interface RogueChoiceState {
    /** 是否正在等待玩家选择 */
    isActive: boolean;
    /** 当前选择的候选选项 */
    choices: RogueUpgradeConfig[];
    /** 已触发的选择次数 */
    triggeredCount: number;
    /** 下一个触发时间点索引 */
    nextTriggerIndex: number;
}

export class RogueChoiceManager {
    private _eventBus: EventBus;
    private _towerManager: TowerManager | null = null;
    private _state: RogueChoiceState;
    private _appliedUpgrades: RogueUpgradeConfig[] = [];

    constructor() {
        this._eventBus = EventBus.getInstance();
        this._state = {
            isActive: false,
            choices: [],
            triggeredCount: 0,
            nextTriggerIndex: 0,
        };

        this._setupEventListeners();
    }

    /**
     * 设置塔管理器引用（用于应用强化效果）
     */
    setTowerManager(towerManager: TowerManager): void {
        this._towerManager = towerManager;
    }

    /**
     * 重置状态（新一局开始时调用）
     */
    reset(): void {
        this._state = {
            isActive: false,
            choices: [],
            triggeredCount: 0,
            nextTriggerIndex: 0,
        };
        this._appliedUpgrades = [];
    }

    /**
     * 每帧更新：检查是否应该触发肉鸽选择
     * @param currentTime 当前战斗时间（秒）
     */
    update(currentTime: number): void {
        // 如果正在选择中，不重复触发
        if (this._state.isActive) return;

        // 检查是否到达下一个触发时间
        if (this._state.nextTriggerIndex >= BATTLE_BALANCE.rogueTriggerTimes.length) return;

        const triggerTime = BATTLE_BALANCE.rogueTriggerTimes[this._state.nextTriggerIndex];
        if (currentTime >= triggerTime) {
            this._triggerChoice();
        }
    }

    /**
     * 触发肉鸽选择
     */
    private _triggerChoice(): void {
        // 生成 3 个随机选项
        this._state.choices = this._generateChoices();
        this._state.isActive = true;

        // 暂停战斗
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_FORCE_PAUSE);

        // 通知 UI 显示选择面板
        this._eventBus.emit(BATTLE_EVENTS.ROGUE_CHOICE_TRIGGER, {
            choices: this._state.choices,
            choiceIndex: this._state.triggeredCount + 1,
            totalChoices: BATTLE_BALANCE.rogueTriggerTimes.length,
        });
    }

    /**
     * 从配置池中随机抽取 3 个选项
     */
    private _generateChoices(): RogueUpgradeConfig[] {
        const pool = [...ROGUE_UPGRADE_CONFIGS];
        const choices: RogueUpgradeConfig[] = [];

        // Fisher-Yates 洗牌后取前 3 个
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const count = Math.min(BATTLE_BALANCE.rogueChoiceCount, pool.length);
        for (let i = 0; i < count; i++) {
            choices.push(pool[i]);
        }

        return choices;
    }

    /**
     * 玩家选择了一个选项
     * @param choiceIndex 选项索引（0-2）
     */
    selectChoice(choiceIndex: number): void {
        if (!this._state.isActive) return;
        if (choiceIndex < 0 || choiceIndex >= this._state.choices.length) return;

        const choice = this._state.choices[choiceIndex];
        this._applyUpgrade(choice);
        this._appliedUpgrades.push(choice);

        this._state.triggeredCount++;
        this._state.nextTriggerIndex++;
        this._state.isActive = false;
        this._state.choices = [];

        // 恢复战斗
        this._eventBus.emit(BATTLE_EVENTS.BATTLE_FORCE_RESUME);

        // 通知选择完成
        this._eventBus.emit(BATTLE_EVENTS.ROGUE_CHOICE_COMPLETE, {
            selectedUpgrade: choice,
            totalTriggered: this._state.triggeredCount,
        });
    }

    /**
     * 应用强化效果
     */
    private _applyUpgrade(upgrade: RogueUpgradeConfig): void {
        switch (upgrade.type) {
            case 'tower_attack':
                // 塔攻击强化：通知 TowerManager 应用全局或特定塔攻击加成
                if (this._towerManager) {
                    this._towerManager.applyRogueUpgrade(upgrade);
                }
                break;

            case 'tower_speed':
                // 塔射速强化
                if (this._towerManager) {
                    this._towerManager.applyRogueUpgrade(upgrade);
                }
                break;

            case 'tower_range':
                // 塔范围强化
                if (this._towerManager) {
                    this._towerManager.applyRogueUpgrade(upgrade);
                }
                break;

            case 'tower_chain_count':
                // 弹射次数加成：通知 TowerManager 应用
                if (this._towerManager) {
                    this._towerManager.applyRogueUpgrade(upgrade);
                }
                break;

            case 'tower_slow_effect':
                // 减速效果加成：通知 TowerManager 应用
                if (this._towerManager) {
                    this._towerManager.applyRogueUpgrade(upgrade);
                }
                break;

            case 'skill_charge':
                // 技能充能：通过事件通知 SkillManager
                this._eventBus.emit(BATTLE_EVENTS.SKILL_CHARGE_CHANGE, {
                    skillId: upgrade.target,
                    chargeDelta: upgrade.value,
                });
                break;
        }
    }

    /**
     * 设置事件监听
     */
    private _setupEventListeners(): void {
        // 监听玩家选择事件（由 UI 触发）
        this._eventBus.on(BATTLE_EVENTS.ROGUE_CHOICE_SELECT, (data: { choiceIndex: number }) => {
            this.selectChoice(data.choiceIndex);
        });
    }

    /**
     * 获取当前状态
     */
    getState(): RogueChoiceState {
        return { ...this._state };
    }

    /**
     * 获取已应用的强化列表
     */
    getAppliedUpgrades(): RogueUpgradeConfig[] {
        return [...this._appliedUpgrades];
    }

    /**
     * 是否所有选择都已完成
     */
    isAllChoicesCompleted(): boolean {
        return this._state.triggeredCount >= BATTLE_BALANCE.rogueTriggerTimes.length;
    }
}
