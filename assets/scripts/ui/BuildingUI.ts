/**
 * 建筑 UI 组件
 * 显示建筑列表、等级、效果和升级按钮
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建建筑界面节点
 * 2. 挂载此组件
 * 3. 绑定建筑面板节点和升级按钮
 *
 * 注意：本组件只包含逻辑，不包含美术资源。
 * 实际 UI 布局需要在 Cocos Creator 编辑器中搭建。
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { BaseManager } from '../base/BaseManager';
import { BuildingState } from '../base/BuildingManager';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('BuildingUI')
export class BuildingUI extends Component {
    // ==================== 建筑面板引用 ====================
    @property(Node)
    buildingPanel: Node | null = null;

    @property([Node])
    buildingSlots: Node[] = [];

    @property([Label])
    buildingNameLabels: Label[] = [];

    @property([Label])
    buildingLevelLabels: Label[] = [];

    @property([Label])
    buildingEffectLabels: Label[] = [];

    @property([Label])
    buildingCostLabels: Label[] = [];

    @property([Button])
    upgradeButtons: Button[] = [];

    // ==================== 资源显示 ====================
    @property(Label)
    baseCoinLabel: Label | null = null;

    @property(Label)
    battleCoinLabel: Label | null = null;

    // ==================== 返回按钮 ====================
    @property(Node)
    backButton: Node | null = null;

    // ==================== 内部状态 ====================
    private _baseManager: BaseManager | null = null;
    private _gameManager: GameManager | null = null;
    private _unsubStateChange: (() => void) | null = null;
    private _boundOnBack: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad(): void {
        // onLoad 保持同步，仅获取实例引用
        this._baseManager = BaseManager.getInstance();
        this._gameManager = GameManager.getInstance();

        // 绑定返回按钮
        if (this.backButton) {
            this._boundOnBack = () => this._onBack();
            this.backButton.on(Node.EventType.TOUCH_END, this._boundOnBack);
        }

        // 默认隐藏
        this.node.active = false;

        // 监听状态变化：building 状态时显示，其他状态隐藏
        this._unsubStateChange = this._gameManager.onStateChange((state) => {
            this.node.active = (state === 'building');
            if (state === 'building') {
                this.refreshUI();
            }
        });
    }

    start(): void {
        // start 中启动异步初始化，init 完成后再刷新 UI
        this._initAndRefresh();
    }

    /**
     * 异步初始化 BaseManager 并刷新 UI
     * 保证 init 完成后再 refresh，避免首次显示为空
     */
    private async _initAndRefresh(): Promise<void> {
        if (!this._baseManager) return;

        if (!this._baseManager.isInitialized()) {
            console.log('[BuildingUI] BaseManager 未初始化，自动初始化');
            await this._baseManager.init();
        }

        // init 完成后刷新
        this.refreshUI();
    }

    onDestroy(): void {
        if (this.backButton && this._boundOnBack) {
            this.backButton.off(Node.EventType.TOUCH_END, this._boundOnBack);
        }
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        this._baseManager = null;
        this._gameManager = null;
    }

    // ==================== UI 刷新 ====================

    /**
     * 刷新所有建筑 UI
     */
    refreshUI(): void {
        if (!this._baseManager || !this._baseManager.isInitialized()) {
            console.warn('[BuildingUI] BaseManager 未初始化，无法刷新');
            return;
        }

        this._updateResourceDisplay();
        this._updateBuildingSlots();
    }

    /**
     * 更新资源显示
     */
    private _updateResourceDisplay(): void {
        if (!this._baseManager) return;

        if (this.baseCoinLabel) {
            this.baseCoinLabel.string = `经营币: ${this._baseManager.getBaseCoin()}`;
        }
        if (this.battleCoinLabel) {
            this.battleCoinLabel.string = `战斗金币: ${this._baseManager.getBattleCoin()}`;
        }
    }

    /**
     * 更新建筑槽位显示
     */
    private _updateBuildingSlots(): void {
        if (!this._baseManager) return;

        const states = this._baseManager.getAllBuildingStates();

        for (let i = 0; i < this.buildingSlots.length; i++) {
            const slot = this.buildingSlots[i];
            if (!slot) continue;

            if (i < states.length) {
                const state = states[i];
                slot.active = true;
                this._updateSlotDisplay(i, state);
            } else {
                slot.active = false;
            }
        }
    }

    /**
     * 更新单个建筑槽位的显示
     */
    private _updateSlotDisplay(index: number, state: BuildingState): void {
        if (!this._baseManager) return;

        // 建筑名称
        if (index < this.buildingNameLabels.length && this.buildingNameLabels[index]) {
            this.buildingNameLabels[index].string = state.config.name;
        }

        // 等级
        if (index < this.buildingLevelLabels.length && this.buildingLevelLabels[index]) {
            const maxLevel = state.config.levels.length;
            this.buildingLevelLabels[index].string = `Lv.${state.currentLevel}/${maxLevel}`;
        }

        // 效果
        if (index < this.buildingEffectLabels.length && this.buildingEffectLabels[index]) {
            this.buildingEffectLabels[index].string = this._formatEffectText(state);
        }

        // 升级消耗（根据 costType 显示对应资源）
        if (index < this.buildingCostLabels.length && this.buildingCostLabels[index]) {
            if (state.canUpgrade) {
                const resourceLabel = state.config.costType === 'baseCoin' ? '经营币' : '战斗金币';
                this.buildingCostLabels[index].string = `升级: ${state.upgradeCost} ${resourceLabel}`;
            } else {
                this.buildingCostLabels[index].string = '已满级';
            }
        }

        // 升级按钮状态（根据 costType 判断对应资源是否足够）
        if (index < this.upgradeButtons.length && this.upgradeButtons[index]) {
            let canAfford = false;
            if (state.canUpgrade) {
                if (state.config.costType === 'baseCoin') {
                    canAfford = this._baseManager.getBaseCoin() >= state.upgradeCost;
                } else {
                    canAfford = this._baseManager.getBattleCoin() >= state.upgradeCost;
                }
            }
            this.upgradeButtons[index].interactable = state.canUpgrade && canAfford;
        }
    }

    /**
     * 格式化效果文本
     */
    private _formatEffectText(state: BuildingState): string {
        const config = state.config;
        const effect = state.currentEffectValue;

        switch (config.type) {
            case 'base':
                return `基地等级: ${effect}`;
            case 'lab':
                return `塔属性倍率: ×${effect.toFixed(2)}`;
            case 'mine':
                return `经营币产出: ${effect}/分钟`;
            case 'reactor':
                return `技能次数+${effect}`;
            case 'factory':
                return `在线收益倍率: ×${effect.toFixed(2)}`;
            default:
                return `效果: ${effect}`;
        }
    }

    // ==================== 按钮事件 ====================

    /**
     * 升级按钮点击（由 Cocos Button Click Events 调用）
     * Cocos Button 回调签名：(event?: Event, customEventData?: string)
     * customEventData 为建筑索引字符串 "0"~"4"
     */
    async onUpgradeButtonClick(_event?: any, customEventData?: string): Promise<void> {
        if (!this._baseManager) return;

        if (typeof customEventData !== 'string' || customEventData.trim() === '') {
            console.warn(`[BuildingUI] 未提供建筑索引 customEventData`);
            return;
        }

        const parsed = Number(customEventData);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 4) {
            console.warn(`[BuildingUI] 无效的建筑索引: "${customEventData}"`);
            return;
        }

        const buildingIndex = parsed;

        const states = this._baseManager.getAllBuildingStates();
        if (buildingIndex >= states.length) return;

        const state = states[buildingIndex];
        const success = await this._baseManager.upgradeBuilding(state.config.id);

        if (success) {
            console.log(`[BuildingUI] ${state.config.name} 升级成功`);
            this.refreshUI();
        } else {
            console.log(`[BuildingUI] ${state.config.name} 升级失败`);
        }
    }

    /**
     * 显示建筑面板
     */
    showPanel(): void {
        if (this.buildingPanel) {
            this.buildingPanel.active = true;
        }
        this.refreshUI();
    }

    /**
     * 隐藏建筑面板
     */
    hidePanel(): void {
        if (this.buildingPanel) {
            this.buildingPanel.active = false;
        }
    }

    /**
     * 返回主界面
     */
    private _onBack(): void {
        this._gameManager?.returnToMain();
    }
}
