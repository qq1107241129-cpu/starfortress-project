/**
 * 离线收益弹窗
 * 显示离线期间累积的经营币，提供领取按钮
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建离线弹窗节点
 * 2. 挂载此组件
 * 3. 绑定 Label 和 Button 节点
 * 4. 弹窗默认隐藏，由 IdleIncomeManager 通过事件触发显示
 *
 * 广告翻倍只预留入口，不要求真实广告。广告不可用时领取基础收益。
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { IdleIncomeManager, OfflineRewardInfo } from '../base/IdleIncomeManager';
import { BaseManager } from '../base/BaseManager';

const { ccclass, property } = _decorator;

@ccclass('OfflineRewardUI')
export class OfflineRewardUI extends Component {
    @property(Node)
    popupNode: Node | null = null;

    @property(Label)
    offlineTimeLabel: Label | null = null;

    @property(Label)
    rewardAmountLabel: Label | null = null;

    @property(Label)
    capInfoLabel: Label | null = null;

    @property(Button)
    claimButton: Button | null = null;

    @property(Button)
    adDoubleButton: Button | null = null;

    private _eventBus: EventBus | null = null;
    private _idleIncomeManager: IdleIncomeManager | null = null;
    private _baseManager: BaseManager | null = null;
    private _currentReward: OfflineRewardInfo | null = null;

    // 保存绑定后的回调引用，确保 on 能正确 off（与 BattleUI 一致）
    private _boundOnRewardReady: ((reward: OfflineRewardInfo) => void) | null = null;
    private _boundOnClaimClick: (() => void) | null = null;
    private _boundOnAdDoubleClick: (() => void) | null = null;

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._idleIncomeManager = IdleIncomeManager.getInstance();
        this._baseManager = BaseManager.getInstance();

        // 默认隐藏弹窗
        if (this.popupNode) {
            this.popupNode.active = false;
        }

        // 创建并保存绑定回调引用
        this._boundOnRewardReady = this._onRewardReady.bind(this);
        this._eventBus.on(BATTLE_EVENTS.OFFLINE_REWARD_READY, this._boundOnRewardReady);

        // 绑定领取按钮点击事件
        this._boundOnClaimClick = this.onClaimClick.bind(this);
        if (this.claimButton) {
            this.claimButton.node.on('click', this._boundOnClaimClick, this);
        }

        // 绑定广告翻倍按钮点击事件（预留入口，当前已隐藏）
        this._boundOnAdDoubleClick = this.onAdDoubleClick.bind(this);
        if (this.adDoubleButton) {
            this.adDoubleButton.node.on('click', this._boundOnAdDoubleClick, this);
        }

        // 主动检查是否已有待领取的离线收益（避免事件在 UI 注册前已发出）
        const pending = this._idleIncomeManager.getPendingOfflineReward();
        if (pending) {
            this._showPopup(pending);
        }
    }

    onDestroy(): void {
        // 使用保存的引用解绑，确保 off 能正确匹配 on
        if (this._eventBus && this._boundOnRewardReady) {
            this._eventBus.off(BATTLE_EVENTS.OFFLINE_REWARD_READY, this._boundOnRewardReady);
        }
        // 解绑按钮点击事件
        if (this.claimButton && this._boundOnClaimClick) {
            this.claimButton.node.off('click', this._boundOnClaimClick, this);
        }
        if (this.adDoubleButton && this._boundOnAdDoubleClick) {
            this.adDoubleButton.node.off('click', this._boundOnAdDoubleClick, this);
        }
        this._boundOnRewardReady = null;
        this._boundOnClaimClick = null;
        this._boundOnAdDoubleClick = null;
        this._eventBus = null;
        this._idleIncomeManager = null;
        this._baseManager = null;
    }

    /**
     * 离线收益就绪时显示弹窗
     */
    private _onRewardReady(reward: OfflineRewardInfo): void {
        this._currentReward = reward;
        this._showPopup(reward);
    }

    /**
     * 显示弹窗
     */
    private _showPopup(reward: OfflineRewardInfo): void {
        if (this.popupNode) {
            this.popupNode.active = true;
        }

        // 离线时长
        if (this.offlineTimeLabel) {
            const hours = Math.floor(reward.rawOfflineMinutes / 60);
            const minutes = Math.floor(reward.rawOfflineMinutes % 60);
            if (hours > 0) {
                this.offlineTimeLabel.string = `离线 ${hours} 小时 ${minutes} 分钟`;
            } else {
                this.offlineTimeLabel.string = `离线 ${minutes} 分钟`;
            }
        }

        // 收益数量
        if (this.rewardAmountLabel) {
            this.rewardAmountLabel.string = `+${reward.income} 经营币`;
        }

        // 上限信息
        if (this.capInfoLabel) {
            if (reward.rawOfflineMinutes > reward.maxMinutes) {
                this.capInfoLabel.string = `离线上限 ${reward.maxMinutes} 分钟（已截断）`;
            } else {
                this.capInfoLabel.string = `离线上限 ${reward.maxMinutes} 分钟`;
            }
        }

        // 广告翻倍按钮：广告不可用时隐藏或置灰
        if (this.adDoubleButton) {
            // MVP 阶段广告只预留入口，不可用时隐藏
            this.adDoubleButton.node.active = false;
        }
    }

    /**
     * 点击领取按钮
     */
    async onClaimClick(): Promise<void> {
        if (!this._idleIncomeManager || !this._baseManager) return;

        const amount = await this._idleIncomeManager.claimOfflineReward();
        if (amount > 0) {
            this._baseManager.addBaseCoin(amount);
            await this._baseManager.save();
            console.log(`[OfflineRewardUI] 领取 ${amount} 经营币，当前: ${this._baseManager.getBaseCoin()}`);
        }
        this._hidePopup();
    }

    /**
     * 点击广告翻倍按钮（预留入口）
     * 广告不可用时此按钮已隐藏，不会被调用
     */
    async onAdDoubleClick(): Promise<void> {
        // 预留入口：未来接入真实广告
        // 广告成功后给予双倍收益
        // 广告失败时降级为基础收益
        console.log('[OfflineRewardUI] 广告翻倍功能未实现，领取基础收益');
        await this.onClaimClick();
    }

    /**
     * 隐藏弹窗
     */
    private _hidePopup(): void {
        if (this.popupNode) {
            this.popupNode.active = false;
        }
        this._currentReward = null;
    }
}
