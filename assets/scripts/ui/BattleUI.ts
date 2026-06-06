/**
 * 战斗 UI
 * 管理战斗界面的技能按钮和肉鸽选择面板
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建 Canvas 节点
 * 2. 挂载此组件
 * 3. 创建技能按钮节点并绑定到 orbitalCannonButton / freezeButton
 * 4. 创建肉鸽选择面板节点并绑定到 rogueChoicePanel
 * 5. 创建 3 个选择按钮节点并绑定到 rogueChoiceButtons
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { BattleManager } from '../battle/BattleManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { RogueUpgradeConfig } from '../data/SkillConfig';

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

    // ==================== 内部状态 ====================
    private _battleManager: BattleManager | null = null;
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

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._setupEventListeners();
        this._setupButtonListeners();

        // 初始隐藏肉鸽选择面板
        this._hideRogueChoicePanel();
    }

    start(): void {
        // 获取 BattleManager 实例
        this._battleManager = BattleManager.getInstance();
        this._updateSkillUI();
    }

    onDestroy(): void {
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

        this._eventBus = null;
        this._battleManager = null;
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
