/**
 * UILayerController - UILayer 显隐控制器
 *
 * 职责：
 * 1. 监听 GameManager 状态变化
 * 2. 战斗状态时显示 UILayer（调试 Label、倒计时等）
 * 3. 非战斗状态时隐藏 UILayer
 *
 * 使用方式：
 * 1. 挂载到 Battle.scene 中的 UILayer 节点
 * 2. UILayer 默认在 Cocos Creator 编辑器中设置为隐藏
 * 3. 运行时由本组件根据 GameManager 状态控制显隐
 */

import { _decorator, Component } from 'cc';
import { GameManager, GameFlowState } from '../core/GameManager';

const { ccclass } = _decorator;

@ccclass('UILayerController')
export class UILayerController extends Component {
    private _gameManager: GameManager | null = null;
    private _unsubStateChange: (() => void) | null = null;

    onLoad(): void {
        this._gameManager = GameManager.getInstance();

        // 默认隐藏（与 Cocos Creator 编辑器中设置一致）
        this.node.active = false;

        // 监听状态变化：battle 状态时显示，其他状态隐藏
        this._unsubStateChange = this._gameManager.onStateChange((state: GameFlowState) => {
            this.node.active = (state === 'battle');
        });
    }

    onDestroy(): void {
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        this._gameManager = null;
    }
}
