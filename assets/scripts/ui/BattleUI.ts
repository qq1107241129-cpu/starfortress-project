/**
 * 战斗 UI
 * 管理战斗界面的技能按钮、肉鸽选择面板、时间/生命/资源提示
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建 Canvas 节点
 * 2. 挂载此组件
 * 3. 创建技能按钮节点并绑定到 orbitalCannonButton / freezeButton
 * 4. 创建肉鸽选择面板节点并绑定到 rogueChoicePanel
 * 5. 创建 3 个选择按钮节点并绑定到 rogueChoiceButtons
 * 6. 绑定时间、生命、资源显示 Label（可选）
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { BattleManager } from '../battle/BattleManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { RogueUpgradeConfig } from '../data/SkillConfig';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('BattleUI')
export class BattleUI extends Component {
    // ==================== 技能按钮 ====================
    @property(Node)
    orbitalCannonButton: Node | null = null;

    @property(Node)
    freezeButton: Node | null = null;

    @property(Label)
    orbitalCannonChargeLabel: Label | null = null;

    @property(Label)
    freezeChargeLabel: Label | null = null;

    // ==================== 肉鸽选择面板 ====================
    @property(Node)
    rogueChoicePanel: Node | null = null;

    @property([Node])
    rogueChoiceButtons: Node[] = [];

    @property([Label])
    rogueChoiceLabels: Label[] = [];

    @property(Label)
    rogueChoiceTitleLabel: Label | null = null;

    // ==================== 战斗信息显示（可选绑定） ====================
    @property(Label)
    timeLabel: Label | null = null;

    @property(Label)
    baseHealthLabel: Label | null = null;

    @property(Label)
    battleCoinLabel: Label | null = null;

    @property(Label)
    baseCoinLabel: Label | null = null;

    @property(Node)
    pauseButton: Node | null = null;

    @property(Node)
    returnMainButton: Node | null = null;

    // ==================== 内部状态 ====================
    private _battleManager: BattleManager | null = null;
    private _gameManager: GameManager | null = null;
    private _eventBus: EventBus | null = null;
    private _currentChoices: RogueUpgradeConfig[] = [];

    // 保存绑定后的回调引用，确保 on 能正确 off
    private _boundOnRogueChoiceTrigger: ((data: any) => void) | null = null;
    private _boundOnSkillChargeChange: ((data: any) => void) | null = null;
    private _boundOnSkillUse: ((data: any) => void) | null = null;

    // 保存按钮回调引用，确保能安全解绑
    private _boundOnOrbitalCannonClick: (() => void) | null = null;
    private _boundOnFreezeClick: (() => void) | null = null;
    private _rogueChoiceButtonListeners: Array<{ node: Node; handler: () => void }> = [];
    private _boundOnPause: (() => void) | null = null;
    private _boundOnReturnMain: (() => void) | null = null;
    private _boundOnSettlement: ((data: any) => void) | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._setupEventListeners();
        this._setupButtonListeners();

        // 初始隐藏肉鸽选择面板
        this._hideRogueChoicePanel();

        // 默认隐藏战斗 UI（主界面状态）
        this.node.active = false;
    }

    start(): void {
        // 获取 BattleManager 实例
        this._battleManager = BattleManager.getInstance();
        this._gameManager = GameManager.getInstance();
        this._updateSkillUI();
        this._setupExtraButtons();

        // 监听状态变化：battle 状态时显示，其他状态隐藏
        if (this._gameManager) {
            this._unsubStateChange = this._gameManager.onStateChange((state) => {
                this.node.active = (state === 'battle');
                if (state === 'battle') {
                    this._updateSkillUI();
                }
            });
        }
    }

    /**
     * 每帧刷新战斗信息（倒计时、基地生命）
     */
    update(_deltaTime: number): void {
        if (this.node.active && this._battleManager) {
            this.updateBattleInfo();
        }
    }

    onDestroy(): void {
        // 解绑状态监听
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        // 解绑 EventBus 事件
        if (this._eventBus) {
            if (this._boundOnRogueChoiceTrigger) {
                this._eventBus.off(BATTLE_EVENTS.ROGUE_CHOICE_TRIGGER, this._boundOnRogueChoiceTrigger);
            }
            if (this._boundOnSkillChargeChange) {
                this._eventBus.off(BATTLE_EVENTS.SKILL_CHARGE_CHANGE, this._boundOnSkillChargeChange);
            }
            if (this._boundOnSkillUse) {
                this._eventBus.off(BATTLE_EVENTS.SKILL_USE, this._boundOnSkillUse);
            }
            if (this._boundOnSettlement) {
                this._eventBus.off(BATTLE_EVENTS.BATTLE_SETTLEMENT, this._boundOnSettlement);
                this._boundOnSettlement = null;
            }
        }

        // 解绑技能按钮事件
        if (this.orbitalCannonButton && this._boundOnOrbitalCannonClick) {
            this.orbitalCannonButton.off(Node.EventType.TOUCH_END, this._boundOnOrbitalCannonClick);
        }
        if (this.freezeButton && this._boundOnFreezeClick) {
            this.freezeButton.off(Node.EventType.TOUCH_END, this._boundOnFreezeClick);
        }

        // 解绑肉鸽选择按钮事件
        for (const entry of this._rogueChoiceButtonListeners) {
            entry.node.off(Node.EventType.TOUCH_END, entry.handler);
        }
        this._rogueChoiceButtonListeners = [];

        // 解绑暂停/返回按钮
        if (this.pauseButton && this._boundOnPause) {
            this.pauseButton.off(Node.EventType.TOUCH_END, this._boundOnPause);
        }
        if (this.returnMainButton && this._boundOnReturnMain) {
            this.returnMainButton.off(Node.EventType.TOUCH_END, this._boundOnReturnMain);
        }

        this._eventBus = null;
        this._battleManager = null;
        this._gameManager = null;
    }

    // ==================== 事件监听 ====================

    private _setupEventListeners(): void {
        if (!this._eventBus) return;

        // 创建并保存绑定引用
        this._boundOnRogueChoiceTrigger = this._onRogueChoiceTrigger.bind(this);
        this._boundOnSkillChargeChange = this._onSkillChargeChange.bind(this);
        this._boundOnSkillUse = this._onSkillUse.bind(this);

        this._eventBus.on(BATTLE_EVENTS.ROGUE_CHOICE_TRIGGER, this._boundOnRogueChoiceTrigger);
        this._eventBus.on(BATTLE_EVENTS.SKILL_CHARGE_CHANGE, this._boundOnSkillChargeChange);
        this._eventBus.on(BATTLE_EVENTS.SKILL_USE, this._boundOnSkillUse);

        // 监听战斗结算，隐藏战斗 UI（由 SettlementUI 接管）
        this._boundOnSettlement = () => {
            this.node.active = false;
        };
        this._eventBus.on(BATTLE_EVENTS.BATTLE_SETTLEMENT, this._boundOnSettlement);
    }

    private _setupButtonListeners(): void {
        // 轨道炮按钮
        if (this.orbitalCannonButton) {
            this._boundOnOrbitalCannonClick = () => this._onOrbitalCannonClick();
            this.orbitalCannonButton.on(Node.EventType.TOUCH_END, this._boundOnOrbitalCannonClick);
        }

        // 全屏冻结按钮
        if (this.freezeButton) {
            this._boundOnFreezeClick = () => this._onFreezeClick();
            this.freezeButton.on(Node.EventType.TOUCH_END, this._boundOnFreezeClick);
        }

        // 肉鸽选择按钮
        this.rogueChoiceButtons.forEach((button, index) => {
            if (button) {
                const handler = () => this._onRogueChoiceSelect(index);
                button.on(Node.EventType.TOUCH_END, handler);
                this._rogueChoiceButtonListeners.push({ node: button, handler });
            }
        });
    }

    // ==================== 按钮点击处理 ====================

    private _onOrbitalCannonClick(): void {
        if (!this._battleManager) return;

        const success = this._battleManager.useSkill('skill_orbital_cannon');
        if (!success) {
            console.log('[BattleUI] 轨道炮无法使用（无充能、无有效目标或战斗未进行）');
        }
    }

    private _onFreezeClick(): void {
        if (!this._battleManager) return;

        const success = this._battleManager.useSkill('skill_freeze');
        if (!success) {
            console.log('[BattleUI] 全屏冻结无法使用（无充能或战斗未进行）');
        }
    }

    private _onRogueChoiceSelect(choiceIndex: number): void {
        if (!this._eventBus) return;

        // 发送选择事件
        this._eventBus.emit(BATTLE_EVENTS.ROGUE_CHOICE_SELECT, { choiceIndex });

        // 隐藏选择面板
        this._hideRogueChoicePanel();
    }

    // ==================== 事件处理 ====================

    private _onRogueChoiceTrigger(data: {
        choices: RogueUpgradeConfig[];
        choiceIndex: number;
        totalChoices: number;
    }): void {
        this._currentChoices = data.choices;
        this._showRogueChoicePanel(data.choices, data.choiceIndex, data.totalChoices);
    }

    private _onSkillChargeChange(_data: { skillId: string; remainingCharges?: number }): void {
        this._updateSkillUI();
    }

    private _onSkillUse(_data: { skillId: string; remainingCharges: number }): void {
        this._updateSkillUI();
    }

    // ==================== 额外按钮设置 ====================

    private _setupExtraButtons(): void {
        if (this.pauseButton) {
            this._boundOnPause = () => this._onPause();
            this.pauseButton.on(Node.EventType.TOUCH_END, this._boundOnPause);
        }
        if (this.returnMainButton) {
            this._boundOnReturnMain = () => this._onReturnMain();
            this.returnMainButton.on(Node.EventType.TOUCH_END, this._boundOnReturnMain);
        }
    }

    private _onPause(): void {
        if (!this._battleManager) return;
        if (this._battleManager.isPlaying()) {
            this._battleManager.pauseBattle();
            console.log('[BattleUI] 战斗暂停');
        } else if (this._battleManager.isPaused()) {
            this._battleManager.resumeBattle();
            console.log('[BattleUI] 战斗恢复');
        }
    }

    private _onReturnMain(): void {
        if (!this._battleManager || !this._gameManager) return;
        // 结束战斗并返回主界面
        if (this._battleManager.isPlaying() || this._battleManager.isPaused()) {
            this._battleManager.returnToIdle();
        }
        this._gameManager.returnToMain();
    }

    /**
     * 更新战斗信息显示（每帧由外部调用或通过 update）
     */
    updateBattleInfo(): void {
        if (!this._battleManager) return;

        const info = this._battleManager.getBattleInfo();

        if (this.timeLabel) {
            const remaining = Math.max(0, info.remainingTime);
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            this.timeLabel.string = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (this.baseHealthLabel) {
            this.baseHealthLabel.string = `基地: ${info.baseHealth}/${info.baseHealthMax}`;
        }
    }

    // ==================== UI 更新 ====================

    private _updateSkillUI(): void {
        if (!this._battleManager) return;

        const skillManager = this._battleManager.getSkillManager();

        // 更新轨道炮充能显示
        const orbitalCharges = skillManager.getCharges('skill_orbital_cannon');
        if (this.orbitalCannonChargeLabel) {
            this.orbitalCannonChargeLabel.string = `${orbitalCharges}`;
        }

        // 更新轨道炮按钮状态
        if (this.orbitalCannonButton) {
            const button = this.orbitalCannonButton.getComponent(Button);
            if (button) {
                button.interactable = orbitalCharges > 0;
            }
        }

        // 更新全屏冻结充能显示
        const freezeCharges = skillManager.getCharges('skill_freeze');
        if (this.freezeChargeLabel) {
            this.freezeChargeLabel.string = `${freezeCharges}`;
        }

        // 更新冻结按钮状态
        if (this.freezeButton) {
            const button = this.freezeButton.getComponent(Button);
            if (button) {
                button.interactable = freezeCharges > 0;
            }
        }
    }

    private _showRogueChoicePanel(
        choices: RogueUpgradeConfig[],
        choiceIndex: number,
        totalChoices: number
    ): void {
        if (!this.rogueChoicePanel) return;

        // 显示面板
        this.rogueChoicePanel.active = true;

        // 更新标题
        if (this.rogueChoiceTitleLabel) {
            this.rogueChoiceTitleLabel.string = `强化选择 (${choiceIndex}/${totalChoices})`;
        }

        // 更新选项按钮
        for (let i = 0; i < this.rogueChoiceButtons.length; i++) {
            const button = this.rogueChoiceButtons[i];
            const label = this.rogueChoiceLabels[i];

            if (i < choices.length) {
                const choice = choices[i];

                // 显示按钮
                if (button) button.active = true;

                // 更新标签
                if (label) {
                    label.string = `${choice.name}\n${choice.description}`;
                }
            } else {
                // 隐藏多余的按钮
                if (button) button.active = false;
            }
        }

        console.log(`[BattleUI] 显示肉鸽选择面板: ${choiceIndex}/${totalChoices}`);
    }

    private _hideRogueChoicePanel(): void {
        if (this.rogueChoicePanel) {
            this.rogueChoicePanel.active = false;
        }
    }
}
