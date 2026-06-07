/**
 * TowerView - 防御塔可视化组件
 * 使用 Graphics 绘制可见防御塔，显示攻击反馈
 */

import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TowerView')
export class TowerView extends Component {
    private _towerId: string = '';
    private _configId: string = '';
    private _slotId: string = '';
    private _graphics: Graphics | null = null;
    private _towerColor: Color = new Color(200, 200, 200, 255);
    private _towerSize: number = 18;
    private _isFlashing: boolean = false;
    private _flashTimer: number = 0;
    private _originalColor: Color = new Color(200, 200, 200, 255);

    /**
     * 初始化塔视图
     */
    init(towerId: string, configId: string, slotId: string, position: { x: number; y: number }): void {
        this._towerId = towerId;
        this._configId = configId;
        this._slotId = slotId;

        // 设置位置
        this.node.setPosition(position.x, position.y, 0);

        // 获取或添加 Graphics 组件
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }

        // 根据塔类型设置颜色和大小
        this._setStyleByType(configId);

        // 绘制塔
        this._draw();
    }

    /**
     * 获取塔ID
     */
    getTowerId(): string {
        return this._towerId;
    }

    /**
     * 获取槽位ID
     */
    getSlotId(): string {
        return this._slotId;
    }

    /**
     * 播放攻击反馈（闪烁效果）
     */
    playAttackFeedback(): void {
        this._isFlashing = true;
        this._flashTimer = 0.15; // 闪烁持续时间
        this._draw();
    }

    /**
     * 根据塔类型设置样式
     */
    private _setStyleByType(configId: string): void {
        if (configId.includes('machinegun')) {
            this._towerColor = new Color(50, 150, 255, 255); // 机枪塔: 蓝色
            this._towerSize = 16;
        } else if (configId.includes('cannon')) {
            this._towerColor = new Color(255, 120, 30, 255); // 炮塔: 橙色
            this._towerSize = 20;
        } else if (configId.includes('ice')) {
            this._towerColor = new Color(100, 200, 255, 255); // 冰塔: 浅蓝
            this._towerSize = 16;
        } else if (configId.includes('electric')) {
            this._towerColor = new Color(180, 100, 255, 255); // 电塔: 紫色
            this._towerSize = 18;
        } else {
            this._towerColor = new Color(200, 200, 200, 255); // 默认: 灰色
            this._towerSize = 16;
        }
        this._originalColor = this._towerColor.clone();
    }

    /**
     * 绘制塔
     */
    private _draw(): void {
        if (!this._graphics) return;

        this._graphics.clear();

        // 绘制塔底座（矩形）
        const baseSize = this._towerSize + 4;
        this._graphics.fillColor = new Color(60, 60, 60, 255);
        this._graphics.rect(-baseSize, -baseSize, baseSize * 2, baseSize * 2);
        this._graphics.fill();

        // 绘制塔主体
        const drawColor = this._isFlashing ? new Color(255, 255, 255, 255) : this._towerColor;
        this._graphics.fillColor = drawColor;
        this._graphics.rect(-this._towerSize, -this._towerSize, this._towerSize * 2, this._towerSize * 2);
        this._graphics.fill();

        // 绘制塔边框
        this._graphics.strokeColor = new Color(0, 0, 0, 200);
        this._graphics.lineWidth = 2;
        this._graphics.rect(-this._towerSize, -this._towerSize, this._towerSize * 2, this._towerSize * 2);
        this._graphics.stroke();

        // 绘制塔中心标记（小圆点）
        this._graphics.fillColor = new Color(255, 255, 255, 200);
        this._graphics.circle(0, 0, 4);
        this._graphics.fill();
    }

    update(deltaTime: number): void {
        // 处理闪烁效果
        if (this._isFlashing) {
            this._flashTimer -= deltaTime;
            if (this._flashTimer <= 0) {
                this._isFlashing = false;
                this._draw();
            }
        }
    }

    onDestroy(): void {
        this._graphics = null;
    }
}
