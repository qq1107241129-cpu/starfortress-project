/**
 * EnemyView - 敌人可视化组件
 * 使用 Graphics 绘制可见敌人，同步逻辑位置
 */

import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';

const { ccclass, property } = _decorator;

/** 敌人尺寸（半径） */
const ENEMY_RADIUS = 12;
/** 血条宽度 */
const HEALTH_BAR_WIDTH = 30;
/** 血条高度 */
const HEALTH_BAR_HEIGHT = 4;
/** 血条相对敌人顶部偏移 */
const HEALTH_BAR_OFFSET_Y = 18;

@ccclass('EnemyView')
export class EnemyView extends Component {
    private _enemyId: string = '';
    private _configId: string = '';
    private _graphics: Graphics | null = null;
    private _healthPercent: number = 1;
    private _enemyColor: Color = new Color(255, 255, 0, 255);

    /**
     * 初始化敌人视图
     */
    init(enemyId: string, configId: string, position: { x: number; y: number }): void {
        this._enemyId = enemyId;
        this._configId = configId;

        // 设置初始位置
        this.node.setPosition(position.x, position.y, 0);

        // 获取或添加 Graphics 组件
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }

        // 根据敌人类型设置颜色
        this._setColorByType(configId);

        // 绘制敌人
        this._draw();
    }

    /**
     * 获取敌人ID
     */
    getEnemyId(): string {
        return this._enemyId;
    }

    /**
     * 更新位置
     */
    updatePosition(position: { x: number; y: number }): void {
        this.node.setPosition(position.x, position.y, 0);
    }

    /**
     * 更新血量显示
     */
    updateHealth(percent: number): void {
        this._healthPercent = Math.max(0, Math.min(1, percent));
        this._draw();
    }

    /**
     * 根据敌人类型设置颜色
     */
    private _setColorByType(configId: string): void {
        if (configId.includes('boss')) {
            this._enemyColor = new Color(255, 50, 50, 255); // Boss: 红色
        } else if (configId.includes('fast')) {
            this._enemyColor = new Color(255, 165, 0, 255); // 快速: 橙色
        } else if (configId.includes('heavy')) {
            this._enemyColor = new Color(150, 150, 150, 255); // 重甲: 灰色
        } else if (configId.includes('split')) {
            this._enemyColor = new Color(50, 200, 50, 255); // 分裂: 绿色
        } else {
            this._enemyColor = new Color(255, 220, 50, 255); // 普通: 黄色
        }
    }

    /**
     * 绘制敌人和血条
     */
    private _draw(): void {
        if (!this._graphics) return;

        this._graphics.clear();

        // 绘制敌人圆形
        this._graphics.fillColor = this._enemyColor;
        this._graphics.circle(0, 0, ENEMY_RADIUS);
        this._graphics.fill();

        // 绘制敌人边框
        this._graphics.strokeColor = new Color(0, 0, 0, 200);
        this._graphics.lineWidth = 2;
        this._graphics.circle(0, 0, ENEMY_RADIUS);
        this._graphics.stroke();

        // 绘制血条背景（黑色）
        const barY = HEALTH_BAR_OFFSET_Y;
        this._graphics.fillColor = new Color(0, 0, 0, 180);
        this._graphics.rect(-HEALTH_BAR_WIDTH / 2, barY, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
        this._graphics.fill();

        // 绘制血条前景（绿色到红色渐变）
        const barWidth = HEALTH_BAR_WIDTH * this._healthPercent;
        if (this._healthPercent > 0.5) {
            this._graphics.fillColor = new Color(50, 200, 50, 255);
        } else if (this._healthPercent > 0.25) {
            this._graphics.fillColor = new Color(255, 200, 0, 255);
        } else {
            this._graphics.fillColor = new Color(255, 50, 50, 255);
        }
        this._graphics.rect(-HEALTH_BAR_WIDTH / 2, barY, barWidth, HEALTH_BAR_HEIGHT);
        this._graphics.fill();
    }

    onDestroy(): void {
        this._graphics = null;
    }
}
