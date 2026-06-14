/**
 * 战斗结算 UI
 * 显示战斗结果、奖励和继续按钮
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建结算界面节点
 * 2. 挂载此组件
 * 3. 绑定结果 Label 和按钮节点
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { GameManager } from '../core/GameManager';
import { BaseManager } from '../base/BaseManager';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { BattleResult } from '../battle/BattleSettlement';
import { styleButton, styleLabel } from './UIStyleUtil';

const { ccclass, property } = _decorator;

@ccclass('SettlementUI')
export class SettlementUI extends Component {
    // ==================== 结果显示 ====================
    @property(Label)
    resultLabel: Label | null = null;

    @property(Label)
    stageLabel: Label | null = null;

    @property(Label)
    starLabel: Label | null = null;

    @property(Label)
    killCountLabel: Label | null = null;

    @property(Label)
    bossKillLabel: Label | null = null;

    @property(Label)
    healthLabel: Label | null = null;

    @property(Label)
    battleCoinLabel: Label | null = null;

    @property(Label)
    baseCoinLabel: Label | null = null;

    // ==================== 按钮 ====================
    @property(Node)
    continueButton: Node | null = null;

    @property(Node)
    returnMainButton: Node | null = null;

    // ==================== 内部状态 ====================
    private _gameManager: GameManager | null = null;
    private _baseManager: BaseManager | null = null;
    private _eventBus: EventBus | null = null;
    private _currentResult: BattleResult | null = null;

    // 绑定回调引用
    private _boundOnSettlement: ((data: any) => void) | null = null;
    private _boundOnContinue: (() => void) | null = null;
    private _boundOnReturnMain: (() => void) | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._gameManager = GameManager.getInstance();
        this._baseManager = BaseManager.getInstance();

        // 监听结算事件
        this._boundOnSettlement = this._onSettlement.bind(this);
        this._eventBus.on(BATTLE_EVENTS.BATTLE_SETTLEMENT, this._boundOnSettlement);

        // 绑定按钮
        this._setupButtonListeners();
        this._applyStyles();

        // 默认隐藏
        this.node.active = false;

        // 监听状态变化：settlement 状态时显示，其他状态隐藏
        this._unsubStateChange = this._gameManager.onStateChange((state) => {
            if (state !== 'settlement') {
                this.node.active = false;
            }
        });
    }

    private _setupButtonListeners(): void {
        if (this.continueButton) {
            this._boundOnContinue = () => this._onContinue();
            this.continueButton.on(Node.EventType.TOUCH_END, this._boundOnContinue);
        }
        if (this.returnMainButton) {
            this._boundOnReturnMain = () => this._onReturnMain();
            this.returnMainButton.on(Node.EventType.TOUCH_END, this._boundOnReturnMain);
        }
    }

    // ==================== 样式应用 ====================

    private _applyStyles(): void {
        // 应用按钮样式
        if (this.continueButton) {
            styleButton(this.continueButton, 'primary');
        }
        if (this.returnMainButton) {
            styleButton(this.returnMainButton, 'secondary');
        }

        // 应用文字样式
        if (this.resultLabel) {
            styleLabel(this.resultLabel, 'title');
        }
        if (this.stageLabel) {
            styleLabel(this.stageLabel, 'medium');
        }
        if (this.starLabel) {
            styleLabel(this.starLabel, 'large');
        }
        if (this.killCountLabel) {
            styleLabel(this.killCountLabel, 'medium');
        }
        if (this.bossKillLabel) {
            styleLabel(this.bossKillLabel, 'medium');
        }
        if (this.healthLabel) {
            styleLabel(this.healthLabel, 'medium');
        }
        if (this.battleCoinLabel) {
            styleLabel(this.battleCoinLabel, 'medium');
        }
        if (this.baseCoinLabel) {
            styleLabel(this.baseCoinLabel, 'medium');
        }
    }

    onDestroy(): void {
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        if (this._eventBus && this._boundOnSettlement) {
            this._eventBus.off(BATTLE_EVENTS.BATTLE_SETTLEMENT, this._boundOnSettlement);
        }
        if (this.continueButton && this._boundOnContinue) {
            this.continueButton.off(Node.EventType.TOUCH_END, this._boundOnContinue);
        }
        if (this.returnMainButton && this._boundOnReturnMain) {
            this.returnMainButton.off(Node.EventType.TOUCH_END, this._boundOnReturnMain);
        }

        this._boundOnSettlement = null;
        this._boundOnContinue = null;
        this._boundOnReturnMain = null;
        this._eventBus = null;
        this._gameManager = null;
        this._baseManager = null;
    }

    // ==================== 事件处理 ====================

    private _onSettlement(data: BattleResult): void {
        this._currentResult = data;
        this._showResult(data);
        this.node.active = true;
    }

    // ==================== 按钮事件 ====================

    private _onContinue(): void {
        // 继续下一关（如有）
        if (!this._currentResult) return;

        // 清空当前结果，防止重复点击
        this._currentResult = null;

        // 重新开始同一关（GameManager.enterBattle 会自动处理 ended 状态）
        this.node.active = false;
        this._gameManager?.enterBattle(0);
    }

    private _onReturnMain(): void {
        this.node.active = false;
        this._gameManager?.returnToMain();
    }

    // ==================== UI 显示 ====================

    private _showResult(result: BattleResult): void {
        if (this.resultLabel) {
            this.resultLabel.string = result.result === 'victory' ? '胜利！' : '失败...';
        }
        if (this.stageLabel) {
            this.stageLabel.string = `关卡: ${result.stageId}`;
        }
        if (this.starLabel) {
            const stars = '★'.repeat(result.starRating) + '☆'.repeat(3 - result.starRating);
            this.starLabel.string = stars;
        }
        if (this.killCountLabel) {
            this.killCountLabel.string = `击杀: ${result.killCount}`;
        }
        if (this.bossKillLabel) {
            this.bossKillLabel.string = `Boss击杀: ${result.bossKillCount}`;
        }
        if (this.healthLabel) {
            this.healthLabel.string = `基地生命: ${result.baseHealthRemaining}/${result.baseHealthMax}`;
        }
        if (this.battleCoinLabel) {
            this.battleCoinLabel.string = `战斗金币: +${result.battleCoinReward}`;
        }
        if (this.baseCoinLabel) {
            this.baseCoinLabel.string = `经营币: +${result.baseCoinReward}`;
        }
    }
}
