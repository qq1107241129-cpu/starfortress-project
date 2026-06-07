/**
 * 星核重构 UI 组件
 * 显示转生条件、预计碎片、永久技能列表和确认弹窗
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建 UI 节点
 * 2. 挂载此组件
 * 3. 绑定 Label 和 Node 引用
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { BaseManager } from '../base/BaseManager';
import { RebirthStatus, PermanentSkillState } from '../base/RebirthManager';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('RebirthUI')
export class RebirthUI extends Component {
    // ==================== 转生面板 ====================
    @property(Node)
    rebirthPanel: Node | null = null;

    @property(Label)
    statusLabel: Label | null = null;

    @property(Label)
    estimatedShardsLabel: Label | null = null;

    @property(Label)
    currentShardsLabel: Label | null = null;

    @property(Button)
    rebirthButton: Button | null = null;

    // ==================== 确认弹窗 ====================
    @property(Node)
    confirmPanel: Node | null = null;

    @property(Label)
    confirmShardsLabel: Label | null = null;

    @property(Button)
    confirmYesButton: Button | null = null;

    @property(Button)
    confirmNoButton: Button | null = null;

    // ==================== 永久技能面板 ====================
    @property(Node)
    skillPanel: Node | null = null;

    // ==================== 返回按钮 ====================
    @property(Node)
    backButton: Node | null = null;

    @property([Node])
    skillSlots: Node[] = [];

    @property([Label])
    skillNameLabels: Label[] = [];

    @property([Label])
    skillLevelLabels: Label[] = [];

    @property([Label])
    skillEffectLabels: Label[] = [];

    @property([Label])
    skillCostLabels: Label[] = [];

    @property([Button])
    skillUpgradeButtons: Button[] = [];

    // ==================== 内部状态 ====================
    private _baseManager: BaseManager | null = null;
    private _gameManager: GameManager | null = null;
    private _unsubStateChange: (() => void) | null = null;
    private _pendingRebirthStatus: RebirthStatus | null = null;
    private _skillUpgradeCallbacks: Array<() => void> = [];
    private _boundOnBack: (() => void) | null = null;

    onLoad(): void {
        this._baseManager = BaseManager.getInstance();
        this._gameManager = GameManager.getInstance();

        // 默认隐藏面板
        if (this.rebirthPanel) this.rebirthPanel.active = false;
        if (this.confirmPanel) this.confirmPanel.active = false;
        if (this.skillPanel) this.skillPanel.active = false;

        // 默认隐藏节点
        this.node.active = false;

        // 监听状态变化：rebirth 状态时显示，其他状态隐藏
        this._unsubStateChange = this._gameManager.onStateChange((state) => {
            this.node.active = (state === 'rebirth');
            if (state === 'rebirth') {
                this.showRebirthPanel();
            } else {
                this.hideRebirthPanel();
            }
        });

        // 绑定按钮事件
        if (this.rebirthButton) {
            this.rebirthButton.node.on('click', this._onRebirthClick, this);
        }
        if (this.confirmYesButton) {
            this.confirmYesButton.node.on('click', this._onConfirmYes, this);
        }
        if (this.confirmNoButton) {
            this.confirmNoButton.node.on('click', this._onConfirmNo, this);
        }

        // 绑定返回按钮
        if (this.backButton) {
            this._boundOnBack = () => this._onBack();
            this.backButton.on(Node.EventType.TOUCH_END, this._boundOnBack);
        }

        // 绑定永久技能升级按钮（保存引用以便 onDestroy 解绑）
        this._skillUpgradeCallbacks = [];
        for (let i = 0; i < this.skillUpgradeButtons.length; i++) {
            const btn = this.skillUpgradeButtons[i];
            if (btn) {
                const callback = (): void => { this._onSkillUpgrade(i); };
                this._skillUpgradeCallbacks.push(callback);
                btn.node.on('click', callback, this);
            }
        }
    }

    onDestroy(): void {
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        if (this.rebirthButton) {
            this.rebirthButton.node.off('click', this._onRebirthClick, this);
        }
        if (this.confirmYesButton) {
            this.confirmYesButton.node.off('click', this._onConfirmYes, this);
        }
        if (this.confirmNoButton) {
            this.confirmNoButton.node.off('click', this._onConfirmNo, this);
        }
        if (this.backButton && this._boundOnBack) {
            this.backButton.off(Node.EventType.TOUCH_END, this._boundOnBack);
        }

        // 解绑永久技能升级按钮
        for (let i = 0; i < this.skillUpgradeButtons.length; i++) {
            const btn = this.skillUpgradeButtons[i];
            if (btn && this._skillUpgradeCallbacks[i]) {
                btn.node.off('click', this._skillUpgradeCallbacks[i], this);
            }
        }
        this._skillUpgradeCallbacks = [];
        this._baseManager = null;
        this._gameManager = null;
    }

    // ==================== 面板显示 ====================

    /**
     * 显示转生面板
     * 仅在 GameManager 状态为 'rebirth' 时允许显示，防止旧按钮绕过状态管理
     */
    showRebirthPanel(): void {
        if (!this._baseManager) return;
        // 防止旧 RebirthOpenButton 绕过 GameManager 直接调用
        if (!this._gameManager || this._gameManager.getState() !== 'rebirth') {
            console.warn('[RebirthUI] 忽略非 rebirth 状态的 showRebirthPanel 调用');
            return;
        }
        if (!this._baseManager.isInitialized()) {
            console.warn('[RebirthUI] BaseManager 未初始化');
            return;
        }

        this._refreshRebirthPanel();
        this._refreshSkillPanel();

        if (this.rebirthPanel) this.rebirthPanel.active = true;
        if (this.skillPanel) this.skillPanel.active = true;
    }

    /**
     * 隐藏转生面板
     */
    hideRebirthPanel(): void {
        if (this.rebirthPanel) this.rebirthPanel.active = false;
        if (this.confirmPanel) this.confirmPanel.active = false;
        if (this.skillPanel) this.skillPanel.active = false;
    }

    // ==================== 刷新 ====================

    private _refreshRebirthPanel(): void {
        if (!this._baseManager) return;

        const status = this._baseManager.checkRebirthConditions();
        const rebirthMgr = this._baseManager.getRebirthManager();

        // 状态文本
        if (this.statusLabel) {
            if (status.canRebirth) {
                this.statusLabel.string = '条件已满足，可以进行星核重构';
            } else {
                this.statusLabel.string = `未满足条件：\n${status.unmetConditions.join('\n')}`;
            }
        }

        // 预计碎片
        if (this.estimatedShardsLabel) {
            this.estimatedShardsLabel.string = `预计获得: ${status.estimatedShards} 星核碎片`;
        }

        // 当前碎片
        if (this.currentShardsLabel) {
            this.currentShardsLabel.string = `当前碎片: ${rebirthMgr.getRebirthTokens()}`;
        }

        // 转生按钮状态
        if (this.rebirthButton) {
            this.rebirthButton.interactable = status.canRebirth;
        }
    }

    private _refreshSkillPanel(): void {
        if (!this._baseManager) return;

        const skills = this._baseManager.getAllPermanentSkillStates();

        for (let i = 0; i < this.skillSlots.length; i++) {
            const slot = this.skillSlots[i];
            if (!slot) continue;

            if (i < skills.length) {
                const skill = skills[i];
                slot.active = true;

                if (this.skillNameLabels[i]) {
                    this.skillNameLabels[i].string = skill.config.name;
                }
                if (this.skillLevelLabels[i]) {
                    this.skillLevelLabels[i].string = `Lv.${skill.currentLevel}/${skill.config.maxLevel}`;
                }
                if (this.skillEffectLabels[i]) {
                    this.skillEffectLabels[i].string = skill.config.description;
                }
                if (this.skillCostLabels[i]) {
                    if (skill.currentLevel >= skill.config.maxLevel) {
                        this.skillCostLabels[i].string = '已满级';
                    } else {
                        this.skillCostLabels[i].string = `需要: ${skill.nextLevelCost} 碎片`;
                    }
                }
                if (this.skillUpgradeButtons[i]) {
                    this.skillUpgradeButtons[i].interactable = skill.canUpgrade;
                }
            } else {
                slot.active = false;
            }
        }
    }

    // ==================== 按钮回调 ====================

    private _onRebirthClick(): void {
        if (!this._baseManager) return;

        const status = this._baseManager.checkRebirthConditions();
        if (!status.canRebirth) return;

        this._pendingRebirthStatus = status;

        // 显示确认弹窗
        if (this.confirmPanel) this.confirmPanel.active = true;
        if (this.confirmShardsLabel) {
            this.confirmShardsLabel.string = `确认进行星核重构？\n将获得 ${status.estimatedShards} 星核碎片\n\n重置内容：\n- 战斗金币、经营币\n- 建筑等级（基地核心除外）\n\n保留内容：\n- 星核碎片、永久技能\n- 历史最高关卡`;
        }
    }

    private async _onConfirmYes(): Promise<void> {
        if (!this._baseManager || !this._pendingRebirthStatus) return;

        try {
            const result = await this._baseManager.executeRebirth();
            console.log(`[RebirthUI] 星核重构完成，获得 ${result.shardsGained} 碎片`);
        } catch (e) {
            console.warn(`[RebirthUI] 星核重构失败: ${e}`);
            if (this.confirmPanel) this.confirmPanel.active = false;
            this._pendingRebirthStatus = null;
            this._refreshRebirthPanel();
            return;
        }

        // 隐藏确认弹窗
        if (this.confirmPanel) this.confirmPanel.active = false;

        // 刷新面板
        this._refreshRebirthPanel();
        this._refreshSkillPanel();

        this._pendingRebirthStatus = null;
    }

    private _onConfirmNo(): void {
        if (this.confirmPanel) this.confirmPanel.active = false;
        this._pendingRebirthStatus = null;
    }

    private async _onSkillUpgrade(index: number): Promise<void> {
        if (!this._baseManager) return;

        const skills = this._baseManager.getAllPermanentSkillStates();
        if (index >= skills.length) return;

        const skill = skills[index];
        const success = await this._baseManager.upgradePermanentSkill(skill.config.id);
        if (success) {
            console.log(`[RebirthUI] ${skill.config.name} 升级成功`);
            this._refreshRebirthPanel();
            this._refreshSkillPanel();
        }
    }

    /**
     * 返回主界面（隐藏确认弹窗后返回）
     */
    private _onBack(): void {
        // 如果确认弹窗正在显示，先隐藏
        if (this.confirmPanel) this.confirmPanel.active = false;
        this._pendingRebirthStatus = null;
        this._gameManager?.returnToMain();
    }
}
