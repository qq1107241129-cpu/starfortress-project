/**
 * EnemyView - 敌人可视化组件
 * 使用 Graphics 绘制像素风格敌人，同步逻辑位置
 */

import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';

const { ccclass, property } = _decorator;

/** 小怪尺寸 */
const ENEMY_SIZE = 20;
/** Boss 尺寸 */
const BOSS_SIZE = 30;
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
    private _enemyColor: Color = new Color(255, 255, 255, 255); // 默认白色
    private _isBoss: boolean = false;
    private _enemySize: number = ENEMY_SIZE;

    /**
     * 初始化敌人视图
     */
    init(enemyId: string, configId: string, position: { x: number; y: number }): void {
        this._enemyId = enemyId;
        this._configId = configId;
        this._isBoss = configId.includes('boss');
        this._enemySize = this._isBoss ? BOSS_SIZE : ENEMY_SIZE;

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
        } else {
            this._enemyColor = new Color(255, 255, 255, 255); // 小怪: 白色
        }
    }

    /**
     * 绘制敌人和血条
     */
    private _draw(): void {
        if (!this._graphics) return;

        this._graphics.clear();

        // 根据敌人类型绘制不同像素形状
        this._drawShape();

        // 绘制血条背景（黑色）
        const barY = this._enemySize + 4;
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

    /**
     * 根据敌人类型绘制不同像素形状
     */
    private _drawShape(): void {
        if (!this._graphics) return;

        const s = this._enemySize / 2;

        if (this._configId.includes('boss')) {
            // Boss: 十字形/星形
            this._graphics.fillColor = this._enemyColor;
            // 中心方块
            this._graphics.rect(-s/2, -s/2, s, s);
            this._graphics.fill();
            // 上下延伸
            this._graphics.rect(-s/4, -s, s/2, s*2);
            this._graphics.fill();
            // 左右延伸
            this._graphics.rect(-s, -s/4, s*2, s/2);
            this._graphics.fill();
        } else if (this._configId.includes('fast')) {
            // 快速突击虫: 三角形/箭头形
            this._graphics.fillColor = this._enemyColor;
            this._graphics.moveTo(0, s);
            this._graphics.lineTo(-s, -s);
            this._graphics.lineTo(s, -s);
            this._graphics.close();
            this._graphics.fill();
        } else if (this._configId.includes('heavy')) {
            // 重甲机械兵: 厚实方块（更大）
            this._graphics.fillColor = this._enemyColor;
            this._graphics.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
            this._graphics.fill();
            // 边框
            this._graphics.strokeColor = new Color(100, 100, 100, 255);
            this._graphics.lineWidth = 3;
            this._graphics.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
            this._graphics.stroke();
        } else if (this._configId.includes('split')) {
            // 分裂无人机: 菱形
            this._graphics.fillColor = this._enemyColor;
            this._graphics.moveTo(0, s);
            this._graphics.lineTo(s, 0);
            this._graphics.lineTo(0, -s);
            this._graphics.lineTo(-s, 0);
            this._graphics.close();
            this._graphics.fill();
        } else {
            // 普通机械虫: 小方块
            this._graphics.fillColor = this._enemyColor;
            this._graphics.rect(-s/2, -s/2, s, s);
            this._graphics.fill();
        }

        // 绘制边框
        this._graphics.strokeColor = new Color(0, 0, 0, 200);
        this._graphics.lineWidth = 1;
    }

    onDestroy(): void {
        this._graphics = null;
    }
}
