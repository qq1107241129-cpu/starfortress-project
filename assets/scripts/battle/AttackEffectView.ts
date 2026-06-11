/**
 * AttackEffectView - 攻击特效可视化组件
 * 显示塔攻击时的视觉反馈（攻击线、命中特效等）
 */

import { _decorator, Component, Node, Graphics, Color, Vec3, tween, UITransform } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AttackEffectView')
export class AttackEffectView extends Component {
    private _graphics: Graphics | null = null;
    private _lifetime: number = 0;
    private _maxLifetime: number = 0.2; // 特效持续时间（秒）

    onLoad(): void {
        this._graphics = this.node.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
    }

    /**
     * 初始化攻击线特效
     */
    initAttackLine(
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number },
        color: Color,
        lineWidth: number = 2
    ): void {
        if (!this._graphics) return;

        this._graphics.clear();
        this._graphics.strokeColor = color;
        this._graphics.lineWidth = lineWidth;
        this._graphics.moveTo(fromPos.x, fromPos.y);
        this._graphics.lineTo(toPos.x, toPos.y);
        this._graphics.stroke();

        this._lifetime = 0;
    }

    /**
     * 初始化命中特效（圆形扩散）
     */
    initHitEffect(
        position: { x: number; y: number },
        radius: number,
        color: Color
    ): void {
        if (!this._graphics) return;

        this.node.setPosition(position.x, position.y, 0);

        this._graphics.clear();
        this._graphics.fillColor = color;
        this._graphics.circle(0, 0, radius);
        this._graphics.fill();

        this._lifetime = 0;
    }

    update(deltaTime: number): void {
        this._lifetime += deltaTime;

        // 淡出效果
        if (this._graphics) {
            const alpha = 1 - (this._lifetime / this._maxLifetime);
            if (alpha <= 0) {
                this.node.destroy();
                return;
            }

            const color = this._graphics.fillColor.clone();
            color.a = Math.floor(alpha * 255);
            this._graphics.fillColor = color;
        }

        // 超过生命周期后销毁
        if (this._lifetime >= this._maxLifetime) {
            this.node.destroy();
        }
    }

    /**
     * 根据塔类型获取攻击颜色
     */
    static getTowerAttackColor(towerType: string): Color {
        switch (towerType) {
            case 'machinegun_tower':
                return new Color(0, 200, 255, 255); // 蓝色
            case 'cannon_tower':
                return new Color(255, 150, 0, 255); // 橙色
            case 'ice_tower':
                return new Color(150, 220, 255, 255); // 浅蓝
            case 'electric_tower':
                return new Color(220, 150, 255, 255); // 紫色
            default:
                return new Color(255, 255, 255, 255); // 白色
        }
    }
}
