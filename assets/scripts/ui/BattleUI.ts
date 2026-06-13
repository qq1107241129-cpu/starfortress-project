/**
 * 战斗 UI
 * 管理战斗界面的技能按钮、肉鸽选择面板、塔位选择、时间/生命/资源提示
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建 Canvas 节点
 * 2. 挂载此组件
 * 3. 创建技能按钮节点并绑定到 orbitalCannonButton / freezeButton
 * 4. 创建肉鸽选择面板节点并绑定到 rogueChoicePanel
 * 5. 创建 3 个选择按钮节点并绑定到 rogueChoiceButtons
 * 6. 绑定时间、生命、资源显示 Label（可选）
 * 7. 创建倍速按钮节点并绑定到 speedButton / speedButtonLabel
 *
 * 塔位选择面板：如果 towerSelectPanel 未绑定，会自动动态创建
 */

import { _decorator, Component, Node, Label, Button, Color, UITransform, Graphics, Sprite, UIOpacity, input, Input, EventTouch, EventMouse, Vec2, Vec3, Camera, Canvas, find } from 'cc';
import { BattleManager } from '../battle/BattleManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { RogueUpgradeConfig } from '../data/SkillConfig';
import { GameManager } from '../core/GameManager';
import { TOWER_CONFIGS } from '../data/TowerConfig';

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

    // ==================== 塔位选择面板 ====================
    @property(Node)
    towerSelectPanel: Node | null = null;

    @property([Node])
    towerSelectButtons: Node[] = [];

    @property([Label])
    towerSelectLabels: Label[] = [];

    @property(Label)
    towerSelectTitleLabel: Label | null = null;

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

    // ==================== 倍速按钮（场景绑定） ====================
    @property(Node)
    speedButton: Node | null = null;

    @property(Label)
    speedButtonLabel: Label | null = null;

    // ==================== 内部状态 ====================
    private _battleManager: BattleManager | null = null;
    private _gameManager: GameManager | null = null;
    private _eventBus: EventBus | null = null;
    private _currentChoices: RogueUpgradeConfig[] = [];
    private _currentSlotId: string = ''; // 当前选择的塔位ID

    // 动态创建的塔位选择面板
    private _dynamicTowerSelectPanel: Node | null = null;
    private _dynamicTowerSelectButtons: Node[] = [];
    private _dynamicTowerSelectLabels: Label[] = [];
    // 动态按钮的世界坐标碰撞区域（用于系统级触摸检测）
    private _dynamicButtonBounds: Array<{ x: number; y: number; halfW: number; halfH: number; towerIndex: number }> = [];
    // 取消按钮的世界坐标碰撞区域
    private _cancelButtonBounds: { x: number; y: number; halfW: number; halfH: number } | null = null;
    private _isSystemInputRegistered: boolean = false;

    // 保存绑定后的回调引用，确保 on 能正确 off
    private _boundOnRogueChoiceTrigger: ((data: any) => void) | null = null;
    private _boundOnSkillChargeChange: ((data: any) => void) | null = null;
    private _boundOnSkillUse: ((data: any) => void) | null = null;
    private _boundOnShowTowerSelect: ((data: any) => void) | null = null;

    // 保存按钮回调引用，确保能安全解绑
    private _boundOnOrbitalCannonClick: (() => void) | null = null;
    private _boundOnFreezeClick: (() => void) | null = null;
    private _rogueChoiceButtonListeners: Array<{ node: Node; handler: () => void }> = [];
    private _towerSelectButtonListeners: Array<{ node: Node; handler: () => void }> = [];
    private _boundOnPause: (() => void) | null = null;
    private _boundOnReturnMain: (() => void) | null = null;
    private _boundOnSettlement: ((data: any) => void) | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // ==================== 倍速按钮内部状态 ====================
    private _boundOnSpeedClick: (() => void) | null = null;
    private _boundOnSpeedChange: ((data: { speed: number }) => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._battleManager = BattleManager.getInstance();
        this._gameManager = GameManager.getInstance();
        this._setupEventListeners();
        this._setupButtonListeners();

        if (this._gameManager && !this._unsubStateChange) {
            this._unsubStateChange = this._gameManager.onStateChange((state) => {
                const isBattle = state === 'battle';
                this.node.active = isBattle;
                if (isBattle) {
                    this._registerSystemInput();
                    this._updateSkillUI();
                } else {
                    this._unregisterSystemInput();
                }
            });
        }

        // 初始隐藏肉鸽选择面板和塔位选择面板
        this._hideRogueChoicePanel();
        this._hideTowerSelectPanel();

        // 默认隐藏战斗 UI（主界面状态）
        this.node.active = false;

        this._unregisterSystemInput();
    }

    start(): void {
        // 获取 BattleManager 实例
        if (!this._battleManager) {
            this._battleManager = BattleManager.getInstance();
        }
        if (!this._gameManager) {
            this._gameManager = GameManager.getInstance();
        }
        this._updateSkillUI();
        this._setupExtraButtons();
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
        // 取消系统级触摸事件
        this._unregisterSystemInput();

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
            // 解绑塔位点击事件（使用绑定回调引用）
            if (this._boundOnShowTowerSelect) {
                this._eventBus.off('SHOW_TOWER_SELECT', this._boundOnShowTowerSelect);
                this._boundOnShowTowerSelect = null;
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

        // 解绑塔位选择按钮事件
        for (const entry of this._towerSelectButtonListeners) {
            entry.node.off(Node.EventType.TOUCH_END, entry.handler);
        }
        this._towerSelectButtonListeners = [];

        // 解绑暂停/返回按钮
        if (this.pauseButton && this._boundOnPause) {
            this.pauseButton.off(Node.EventType.TOUCH_END, this._boundOnPause);
        }
        if (this.returnMainButton && this._boundOnReturnMain) {
            this.returnMainButton.off(Node.EventType.TOUCH_END, this._boundOnReturnMain);
        }

        // 销毁动态创建的面板
        if (this._dynamicTowerSelectPanel && this._dynamicTowerSelectPanel.isValid) {
            this._dynamicTowerSelectPanel.destroy();
            this._dynamicTowerSelectPanel = null;
        }

        // 解绑倍速按钮事件
        if (this.speedButton && this._boundOnSpeedClick) {
            this.speedButton.off(Node.EventType.TOUCH_END, this._boundOnSpeedClick);
            this._boundOnSpeedClick = null;
        }
        if (this._boundOnSpeedChange) {
            EventBus.getInstance().off(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, this._boundOnSpeedChange);
            this._boundOnSpeedChange = null;
        }

        this._eventBus = null;
        this._battleManager = null;
        this._gameManager = null;
    }

    // ==================== 事件监听 ====================

    private _registerSystemInput(): void {
        if (this._isSystemInputRegistered) return;

        input.on(Input.EventType.TOUCH_START, this._onDynamicPanelTouchStart, this);
        input.on(Input.EventType.MOUSE_DOWN, this._onDynamicPanelMouseDown, this);
        this._isSystemInputRegistered = true;
        console.log('[BattleUI] dynamic panel system input registered');
    }

    private _unregisterSystemInput(): void {
        if (!this._isSystemInputRegistered) return;

        input.off(Input.EventType.TOUCH_START, this._onDynamicPanelTouchStart, this);
        input.off(Input.EventType.MOUSE_DOWN, this._onDynamicPanelMouseDown, this);
        this._isSystemInputRegistered = false;
        console.log('[BattleUI] dynamic panel system input unregistered');
    }

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

        // 监听塔位点击事件（使用绑定回调，确保可正确解绑）
        this._boundOnShowTowerSelect = (data: { slotId: string }) => {
            console.log(`[BattleUI] 收到 SHOW_TOWER_SELECT 事件, slotId=${data.slotId}`);
            this.showTowerSelectPanel(data.slotId);
        };
        this._eventBus.on('SHOW_TOWER_SELECT', this._boundOnShowTowerSelect);
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

        // 塔位选择按钮（场景中预绑定的）
        this.towerSelectButtons.forEach((button, index) => {
            if (button) {
                const handler = () => this._onTowerSelect(index);
                button.on(Node.EventType.TOUCH_END, handler);
                this._towerSelectButtonListeners.push({ node: button, handler });
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

    // ==================== 塔位选择处理 ====================

    /**
     * 显示塔位选择面板
     * @param slotId 塔位ID
     */
    showTowerSelectPanel(slotId: string): void {
        console.log(`[BattleUI] showTowerSelectPanel called, slotId=${slotId}`);
        this._currentSlotId = slotId;

        // 优先使用场景中绑定的面板，其次使用动态创建的面板
        if (this.towerSelectPanel) {
            this._showTowerSelectPanel();
        } else {
            console.log('[BattleUI] towerSelectPanel 未绑定，使用动态面板');
            this._ensureDynamicTowerSelectPanel();
            this._showDynamicTowerSelectPanel();
        }
    }

    private _onTowerSelect(towerIndex: number): void {
        console.log(`[BattleUI] _onTowerSelect called, towerIndex=${towerIndex}, slotId=${this._currentSlotId}`);

        if (!this._battleManager) {
            console.warn('[BattleUI] _onTowerSelect: _battleManager is null');
            return;
        }
        if (!this._currentSlotId) {
            console.warn('[BattleUI] _onTowerSelect: _currentSlotId is empty');
            return;
        }

        // 获取塔配置
        const towerConfigs = TOWER_CONFIGS;
        console.log(`[BattleUI] TOWER_CONFIGS length=${towerConfigs.length}`);

        if (towerIndex >= towerConfigs.length) {
            console.warn(`[BattleUI] towerIndex ${towerIndex} >= configs length ${towerConfigs.length}`);
            return;
        }

        const towerConfig = towerConfigs[towerIndex];
        console.log(`[BattleUI] 选择塔: ${towerConfig.name} (${towerConfig.id})`);

        // 放置塔
        const success = this._battleManager.placeTower(this._currentSlotId, towerConfig.id, 1);
        console.log(`[BattleUI] placeTower result: ${success}`);

        if (success) {
            console.log(`[BattleUI] 放置塔成功: ${towerConfig.name} at ${this._currentSlotId}`);
        } else {
            console.warn(`[BattleUI] 放置塔失败: ${towerConfig.name} at ${this._currentSlotId}`);
        }

        // 隐藏选择面板
        this._hideTowerSelectPanel();
        this._hideDynamicTowerSelectPanel();
        this._currentSlotId = '';
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

        // 初始化倍速按钮（场景绑定）
        this._initSpeedButton();
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

    // ==================== 倍速按钮 ====================

    /**
     * 初始化倍速按钮（场景绑定）
     * 如果 speedButton 或 speedButtonLabel 未绑定，输出 warn 不崩溃
     */
    private _initSpeedButton(): void {
        if (!this.speedButton) {
            console.warn('[BattleUI] speedButton is not bound');
            return;
        }
        if (!this.speedButtonLabel) {
            console.warn('[BattleUI] speedButtonLabel is not bound');
            return;
        }

        // 初始文本
        this.speedButtonLabel.string = '倍速 x1';

        // 点击事件
        this._boundOnSpeedClick = () => this._onSpeedClick();
        this.speedButton.on(Node.EventType.TOUCH_END, this._boundOnSpeedClick);

        // 监听倍速变化事件
        this._boundOnSpeedChange = (data: { speed: number }) => {
            this._updateSpeedButton(data.speed);
        };
        EventBus.getInstance().on(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, this._boundOnSpeedChange);
    }

    /**
     * 倍速按钮点击处理
     */
    private _onSpeedClick(): void {
        if (!this._battleManager) return;
        this._battleManager.cycleBattleSpeed();
    }

    /**
     * 更新倍速按钮文本
     */
    private _updateSpeedButton(speed: number): void {
        if (this.speedButtonLabel) {
            this.speedButtonLabel.string = `倍速 x${speed}`;
        }
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

    private _showTowerSelectPanel(): void {
        if (!this.towerSelectPanel) return;

        // 显示面板
        this.towerSelectPanel.active = true;

        // 更新标题
        if (this.towerSelectTitleLabel) {
            this.towerSelectTitleLabel.string = '选择防御塔';
        }

        // 更新选项按钮
        const towerConfigs = TOWER_CONFIGS;
        for (let i = 0; i < this.towerSelectButtons.length; i++) {
            const button = this.towerSelectButtons[i];
            const label = this.towerSelectLabels[i];

            if (i < towerConfigs.length) {
                const config = towerConfigs[i];

                // 显示按钮
                if (button) button.active = true;

                // 更新标签
                if (label) {
                    label.string = config.name;
                }
            } else {
                // 隐藏多余的按钮
                if (button) button.active = false;
            }
        }

        console.log('[BattleUI] 显示塔位选择面板（场景绑定）');
    }

    private _hideTowerSelectPanel(): void {
        if (this.towerSelectPanel) {
            this.towerSelectPanel.active = false;
        }
    }

    // ==================== 动态塔位选择面板 ====================

    /**
     * 确保动态塔位选择面板存在
     * 当场景中未绑定 towerSelectPanel 时自动创建
     */
    private _ensureDynamicTowerSelectPanel(): void {
        if (this._dynamicTowerSelectPanel && this._dynamicTowerSelectPanel.isValid) {
            // 面板已存在，确保碰撞区域已初始化
            if (this._dynamicButtonBounds.length === 0) {
                this._rebuildDynamicButtonBounds();
            }
            return;
        }

        console.log('[BattleUI] 动态创建塔位选择面板');

        const panel = new Node('DynamicTowerSelectPanel');
        panel.parent = this.node;

        // 面板居中显示
        const panelTransform = panel.addComponent(UITransform);
        panelTransform.setContentSize(600, 400);

        // 半透明背景
        const bg = panel.addComponent(Graphics);
        bg.fillColor = new Color(20, 20, 40, 220);
        bg.roundRect(-300, -200, 600, 400, 12);
        bg.fill();
        bg.strokeColor = new Color(100, 180, 255, 200);
        bg.lineWidth = 2;
        bg.roundRect(-300, -200, 600, 400, 12);
        bg.stroke();

        // 标题
        const titleNode = new Node('Title');
        titleNode.parent = panel;
        titleNode.setPosition(0, 150, 0);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = '选择防御塔';
        titleLabel.fontSize = 28;
        titleLabel.color = new Color(255, 255, 255, 255);

        // 创建塔选择按钮
        const towerConfigs = TOWER_CONFIGS;
        const buttonWidth = 120;
        const buttonHeight = 80;
        const spacing = 10;
        const totalWidth = towerConfigs.length * buttonWidth + (towerConfigs.length - 1) * spacing;
        const startX = -totalWidth / 2 + buttonWidth / 2;

        this._dynamicTowerSelectButtons = [];
        this._dynamicTowerSelectLabels = [];
        this._dynamicButtonBounds = [];
        this._cancelButtonBounds = null;

        for (let i = 0; i < towerConfigs.length; i++) {
            const config = towerConfigs[i];
            const btnNode = new Node(`TowerBtn_${i}`);
            btnNode.parent = panel;
            btnNode.setPosition(startX + i * (buttonWidth + spacing), 20, 0);

            const btnTransform = btnNode.addComponent(UITransform);
            btnTransform.setContentSize(buttonWidth, buttonHeight);

            // 按钮背景
            const btnGraphics = btnNode.addComponent(Graphics);

            // 根据塔类型设置不同颜色
            let btnColor: Color;
            switch (config.type) {
                case 'machinegun_tower':
                    btnColor = new Color(40, 80, 140, 255);
                    break;
                case 'cannon_tower':
                    btnColor = new Color(140, 60, 20, 255);
                    break;
                case 'ice_tower':
                    btnColor = new Color(30, 100, 140, 255);
                    break;
                case 'electric_tower':
                    btnColor = new Color(80, 40, 140, 255);
                    break;
                default:
                    btnColor = new Color(60, 60, 60, 255);
            }

            btnGraphics.fillColor = btnColor;
            btnGraphics.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            btnGraphics.fill();
            btnGraphics.strokeColor = new Color(150, 200, 255, 180);
            btnGraphics.lineWidth = 2;
            btnGraphics.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
            btnGraphics.stroke();

            // 塔名称
            const nameNode = new Node('Name');
            nameNode.parent = btnNode;
            nameNode.setPosition(0, 10, 0);
            const nameLabel = nameNode.addComponent(Label);
            nameLabel.string = config.name;
            nameLabel.fontSize = 18;
            nameLabel.color = new Color(255, 255, 255, 255);

            // 塔描述
            const descNode = new Node('Desc');
            descNode.parent = btnNode;
            descNode.setPosition(0, -18, 0);
            const descLabel = descNode.addComponent(Label);
            descLabel.string = config.description.substring(0, 8) + '...';
            descLabel.fontSize = 12;
            descLabel.color = new Color(180, 200, 220, 255);

            const towerIndex = i;
            btnNode.on(Node.EventType.TOUCH_END, () => {
                console.log(`[BattleUI] node TOUCH_END hit tower select button ${towerIndex}`);
                this._onTowerSelect(towerIndex);
            });

            // 不使用节点级触摸（会被 UI 层拦截），改用系统级触摸 + 碰撞检测
            // 存储按钮的世界坐标碰撞区域
            this._dynamicButtonBounds.push({
                x: btnNode.position.x,
                y: btnNode.position.y,
                halfW: buttonWidth / 2,
                halfH: buttonHeight / 2,
                towerIndex: i,
            });

            this._dynamicTowerSelectButtons.push(btnNode);
            this._dynamicTowerSelectLabels.push(nameLabel);
        }

        // 取消按钮
        const cancelBtnNode = new Node('CancelBtn');
        cancelBtnNode.parent = panel;
        cancelBtnNode.setPosition(0, -130, 0);
        const cancelTransform = cancelBtnNode.addComponent(UITransform);
        cancelTransform.setContentSize(120, 40);
        const cancelGraphics = cancelBtnNode.addComponent(Graphics);
        cancelGraphics.fillColor = new Color(80, 40, 40, 255);
        cancelGraphics.roundRect(-60, -20, 120, 40, 6);
        cancelGraphics.fill();
        cancelGraphics.strokeColor = new Color(200, 100, 100, 200);
        cancelGraphics.lineWidth = 1;
        cancelGraphics.roundRect(-60, -20, 120, 40, 6);
        cancelGraphics.stroke();
        const cancelLabelNode = new Node('Label');
        cancelLabelNode.parent = cancelBtnNode;
        const cancelLabel = cancelLabelNode.addComponent(Label);
        cancelLabel.string = '取消';
        cancelLabel.fontSize = 18;
        cancelLabel.color = new Color(255, 200, 200, 255);
        cancelBtnNode.on(Node.EventType.TOUCH_END, () => {
            console.log('[BattleUI] node TOUCH_END hit cancel button');
            this._hideDynamicTowerSelectPanel();
            this._currentSlotId = '';
        });
        // 不使用节点级触摸，改用系统级触摸
        this._cancelButtonBounds = {
            x: cancelBtnNode.position.x,
            y: cancelBtnNode.position.y,
            halfW: 60,
            halfH: 20,
        };

        this._dynamicTowerSelectPanel = panel;
        panel.active = false;
    }

    /**
     * 显示动态塔位选择面板
     */
    private _showDynamicTowerSelectPanel(): void {
        if (!this._dynamicTowerSelectPanel) return;
        this._dynamicTowerSelectPanel.active = true;
        console.log('[BattleUI] 显示动态塔位选择面板');
    }

    /**
     * 隐藏动态塔位选择面板
     */
    private _hideDynamicTowerSelectPanel(): void {
        if (this._dynamicTowerSelectPanel) {
            this._dynamicTowerSelectPanel.active = false;
        }
    }

    /**
     * 重建动态按钮碰撞区域（面板已存在但碰撞区域丢失时调用）
     */
    private _rebuildDynamicButtonBounds(): void {
        if (!this._dynamicTowerSelectPanel) return;

        this._dynamicButtonBounds = [];
        this._cancelButtonBounds = null;

        const towerConfigs = TOWER_CONFIGS;
        const buttonWidth = 120;
        const buttonHeight = 80;
        const spacing = 10;
        const totalWidth = towerConfigs.length * buttonWidth + (towerConfigs.length - 1) * spacing;
        const startX = -totalWidth / 2 + buttonWidth / 2;

        for (let i = 0; i < towerConfigs.length; i++) {
            this._dynamicButtonBounds.push({
                x: startX + i * (buttonWidth + spacing),
                y: 20,
                halfW: buttonWidth / 2,
                halfH: buttonHeight / 2,
                towerIndex: i,
            });
        }

        this._cancelButtonBounds = {
            x: 0,
            y: -130,
            halfW: 60,
            halfH: 20,
        };
    }

    /**
     * 系统级触摸事件处理（动态面板按钮）
     * 绕过节点层级触摸拦截
     */
    private _onDynamicPanelTouchStart(event: EventTouch): void {
        // 只在动态面板显示时处理
        if (!this._dynamicTowerSelectPanel || !this._dynamicTowerSelectPanel.active) return;

        const touch = event.touch;
        if (!touch) return;

        const screenPos = touch.getUILocation();

        // 将屏幕坐标转换为面板本地坐标
        const localPos = this._screenToPanelLocal(screenPos);
        if (!localPos) return;

        // 检测塔选择按钮碰撞
        for (const btn of this._dynamicButtonBounds) {
            if (Math.abs(localPos.x - btn.x) <= btn.halfW &&
                Math.abs(localPos.y - btn.y) <= btn.halfH) {
                console.log(`[BattleUI] 系统触摸命中塔选择按钮 ${btn.towerIndex}`);
                this._onTowerSelect(btn.towerIndex);
                return;
            }
        }

        // 检测取消按钮碰撞
        if (this._cancelButtonBounds) {
            const cb = this._cancelButtonBounds;
            if (Math.abs(localPos.x - cb.x) <= cb.halfW &&
                Math.abs(localPos.y - cb.y) <= cb.halfH) {
                console.log('[BattleUI] 系统触摸命中取消按钮');
                this._hideDynamicTowerSelectPanel();
                this._currentSlotId = '';
                return;
            }
        }
    }

    /**
     * 将屏幕坐标转换为动态面板本地坐标
     */
    private _onDynamicPanelMouseDown(event: EventMouse): void {
        if (!this._dynamicTowerSelectPanel || !this._dynamicTowerSelectPanel.active) return;

        const screenPos = event.getUILocation();
        const localPos = this._screenToPanelLocal(screenPos);
        if (!localPos) return;

        for (const btn of this._dynamicButtonBounds) {
            if (Math.abs(localPos.x - btn.x) <= btn.halfW &&
                Math.abs(localPos.y - btn.y) <= btn.halfH) {
                console.log(`[BattleUI] system mouse hit tower select button ${btn.towerIndex}`);
                this._onTowerSelect(btn.towerIndex);
                return;
            }
        }

        if (this._cancelButtonBounds) {
            const cb = this._cancelButtonBounds;
            if (Math.abs(localPos.x - cb.x) <= cb.halfW &&
                Math.abs(localPos.y - cb.y) <= cb.halfH) {
                console.log('[BattleUI] system mouse hit cancel button');
                this._hideDynamicTowerSelectPanel();
                this._currentSlotId = '';
                return;
            }
        }
    }

    private _screenToPanelLocal(screenPos: Vec2): Vec2 | null {
        if (!this._dynamicTowerSelectPanel) return null;

        const panelTransform = this._dynamicTowerSelectPanel.getComponent(UITransform);
        if (!panelTransform) return null;

        const directLocal = this._worldToLocal(panelTransform, new Vec3(screenPos.x, screenPos.y, 0));
        if (this._isReasonablePanelLocal(directLocal)) {
            return directLocal;
        }

        // 屏幕坐标 → 世界坐标
        const camera = this._getCamera();
        let worldPos: Vec3;
        if (camera) {
            worldPos = new Vec3();
            camera.screenToWorld(new Vec3(screenPos.x, screenPos.y, 0), worldPos);
        } else {
            worldPos = new Vec3(screenPos.x, screenPos.y, 0);
        }

        // 世界坐标 → 面板本地坐标
        const localPos3 = new Vec3();
        panelTransform.convertToNodeSpaceAR(worldPos, localPos3);

        return new Vec2(localPos3.x, localPos3.y);
    }

    /**
     * 获取 2D UI Camera
     */
    private _worldToLocal(transform: UITransform, worldPos: Vec3): Vec2 {
        const localPos3 = new Vec3();
        transform.convertToNodeSpaceAR(worldPos, localPos3);
        return new Vec2(localPos3.x, localPos3.y);
    }

    private _isReasonablePanelLocal(localPos: Vec2): boolean {
        return Math.abs(localPos.x) <= 400 && Math.abs(localPos.y) <= 300;
    }

    private _getCamera(): Camera | null {
        let current: Node | null = this.node;
        while (current) {
            const canvas = current.getComponent(Canvas);
            if (canvas && canvas.cameraComponent) {
                return canvas.cameraComponent;
            }

            const childCamera = current.getChildByName('Camera')?.getComponent(Camera);
            if (childCamera) {
                return childCamera;
            }

            current = current.parent;
        }

        const canvasCameraNode = find('Canvas/Camera');
        if (canvasCameraNode) {
            return canvasCameraNode.getComponent(Camera) || null;
        }

        const cameraNode = find('Camera');
        if (cameraNode) {
            return cameraNode.getComponent(Camera) || null;
        }
        return Camera.main || null;
    }
}
