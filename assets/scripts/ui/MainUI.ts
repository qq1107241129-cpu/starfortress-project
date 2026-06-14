/**
 * 主界面 UI
 * 提供游戏主菜单入口：开始战斗、建筑、塔升级、星核重构、设置
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建主界面 Canvas 节点
 * 2. 挂载此组件
 * 3. 绑定按钮节点和资源显示 Label
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { GameManager } from '../core/GameManager';
import { BaseManager } from '../base/BaseManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { styleButton, styleLabel } from './UIStyleUtil';

const { ccclass, property } = _decorator;

@ccclass('MainUI')
export class MainUI extends Component {
    // ==================== 按钮 ====================
    @property(Node)
    startBattleButton: Node | null = null;

    @property(Node)
    buildingButton: Node | null = null;

    @property(Node)
    towerUpgradeButton: Node | null = null;

    @property(Node)
    rebirthButton: Node | null = null;

    @property(Node)
    settingsButton: Node | null = null;

    // ==================== 资源显示 ====================
    @property(Label)
    baseCoinLabel: Label | null = null;

    @property(Label)
    battleCoinLabel: Label | null = null;

    @property(Label)
    rebirthTokenLabel: Label | null = null;

    @property(Label)
    stageLabel: Label | null = null;

    // ==================== 内部状态 ====================
    private _gameManager: GameManager | null = null;
    private _baseManager: BaseManager | null = null;
    private _eventBus: EventBus | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // 绑定回调引用
    private _boundOnStartBattle: (() => void) | null = null;
    private _boundOnBuilding: (() => void) | null = null;
    private _boundOnTowerUpgrade: (() => void) | null = null;
    private _boundOnRebirth: (() => void) | null = null;
    private _boundOnSettings: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._gameManager = GameManager.getInstance();
        this._baseManager = BaseManager.getInstance();

        this._setupButtonListeners();
        this._applyStyles();

        // 监听状态变化：当回到 main 时刷新 UI
        this._unsubStateChange = this._gameManager.onStateChange((state) => {
            if (state === 'main') {
                this._refreshUI();
            }
            // 非 main 状态时隐藏主界面
            this.node.active = (state === 'main');
        });
    }

    start(): void {
        // 初始化 BaseManager 后刷新 UI
        this._initAndRefresh();
    }

    onDestroy(): void {
        // 解绑按钮
        if (this.startBattleButton && this._boundOnStartBattle) {
            this.startBattleButton.off(Node.EventType.TOUCH_END, this._boundOnStartBattle);
        }
        if (this.buildingButton && this._boundOnBuilding) {
            this.buildingButton.off(Node.EventType.TOUCH_END, this._boundOnBuilding);
        }
        if (this.towerUpgradeButton && this._boundOnTowerUpgrade) {
            this.towerUpgradeButton.off(Node.EventType.TOUCH_END, this._boundOnTowerUpgrade);
        }
        if (this.rebirthButton && this._boundOnRebirth) {
            this.rebirthButton.off(Node.EventType.TOUCH_END, this._boundOnRebirth);
        }
        if (this.settingsButton && this._boundOnSettings) {
            this.settingsButton.off(Node.EventType.TOUCH_END, this._boundOnSettings);
        }

        // 解绑状态监听
        if (this._unsubStateChange) {
            this._unsubStateChange();
        }

        this._gameManager = null;
        this._baseManager = null;
        this._eventBus = null;
    }

    // ==================== 初始化 ====================

    private async _initAndRefresh(): Promise<void> {
        if (!this._baseManager) return;

        if (!this._baseManager.isInitialized()) {
            await this._baseManager.init();
        }

        this._refreshUI();
    }

    // ==================== 按钮监听 ====================

    private _setupButtonListeners(): void {
        if (this.startBattleButton) {
            this._boundOnStartBattle = () => this._onStartBattle();
            this.startBattleButton.on(Node.EventType.TOUCH_END, this._boundOnStartBattle);
        }

        if (this.buildingButton) {
            this._boundOnBuilding = () => this._onBuilding();
            this.buildingButton.on(Node.EventType.TOUCH_END, this._boundOnBuilding);
        }

        if (this.towerUpgradeButton) {
            this._boundOnTowerUpgrade = () => this._onTowerUpgrade();
            this.towerUpgradeButton.on(Node.EventType.TOUCH_END, this._boundOnTowerUpgrade);
        }

        if (this.rebirthButton) {
            this._boundOnRebirth = () => this._onRebirth();
            this.rebirthButton.on(Node.EventType.TOUCH_END, this._boundOnRebirth);
        }

        if (this.settingsButton) {
            this._boundOnSettings = () => this._onSettings();
            this.settingsButton.on(Node.EventType.TOUCH_END, this._boundOnSettings);
        }
    }

    // ==================== 样式应用 ====================

    private _applyStyles(): void {
        // 应用按钮样式
        if (this.startBattleButton) {
            styleButton(this.startBattleButton, 'primary');
        }
        if (this.buildingButton) {
            styleButton(this.buildingButton, 'secondary');
        }
        if (this.towerUpgradeButton) {
            styleButton(this.towerUpgradeButton, 'secondary');
        }
        if (this.rebirthButton) {
            styleButton(this.rebirthButton, 'secondary');
        }
        if (this.settingsButton) {
            styleButton(this.settingsButton, 'secondary');
        }

        // 应用文字样式
        if (this.baseCoinLabel) {
            styleLabel(this.baseCoinLabel, 'medium');
        }
        if (this.battleCoinLabel) {
            styleLabel(this.battleCoinLabel, 'medium');
        }
        if (this.rebirthTokenLabel) {
            styleLabel(this.rebirthTokenLabel, 'medium');
        }
        if (this.stageLabel) {
            styleLabel(this.stageLabel, 'medium');
        }
    }

    // ==================== 按钮事件 ====================

    private _onStartBattle(): void {
        // 默认进入第 1 关（后续可根据进度选择关卡）
        this._gameManager?.enterBattle(0);
    }

    private _onBuilding(): void {
        this._gameManager?.enterBuilding();
    }

    private _onTowerUpgrade(): void {
        this._gameManager?.enterTowerUpgrade();
    }

    private _onRebirth(): void {
        this._gameManager?.enterRebirth();
    }

    private _onSettings(): void {
        this._gameManager?.enterSettings();
    }

    // ==================== UI 刷新 ====================

    private _refreshUI(): void {
        if (!this._baseManager || !this._baseManager.isInitialized()) return;

        if (this.baseCoinLabel) {
            this.baseCoinLabel.string = `经营币: ${this._baseManager.getBaseCoin()}`;
        }
        if (this.battleCoinLabel) {
            this.battleCoinLabel.string = `战斗金币: ${this._baseManager.getBattleCoin()}`;
        }
        if (this.rebirthTokenLabel) {
            const rebirthMgr = this._baseManager.getRebirthManager();
            this.rebirthTokenLabel.string = `星核碎片: ${rebirthMgr.getRebirthTokens()}`;
        }
        if (this.stageLabel) {
            const saveMgr = this._baseManager.getSaveManager();
            const save = saveMgr.getSave();
            this.stageLabel.string = `最高关卡: ${save.highestStage}`;
        }
    }
}
