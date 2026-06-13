/**
 * AttackEffectView - 攻击特效可视化组件
 * 显示塔攻击时的视觉反馈（攻击线、命中特效等）
 */

import { _decorator, Component, Graphics, Color } from 'cc';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';

const { ccclass, property } = _decorator;

type EffectPoint = { x: number; y: number };
type AttackEffectType = 'none' | 'line' | 'hit' | 'bullet' | 'shell' | 'ice' | 'lightning';

@ccclass('AttackEffectView')
export class AttackEffectView extends Component {
    private _graphics: Graphics | null = null;
    private _lifetime: number = 0;
    private _maxLifetime: number = 0.2; // 特效持续时间（秒）
    private _effectType: AttackEffectType = 'none';
    private _fromPos: EffectPoint = { x: 0, y: 0 };
    private _toPos: EffectPoint = { x: 0, y: 0 };
    private _effectColor: Color = new Color(255, 255, 255, 255);
    private _lineWidth: number = 2;
    private _radius: number = 4;
    private _flightDuration: number = 0;
    private _hitDuration: number = 0;
    private _lightningPoints: EffectPoint[] = [];

    /** 战斗倍速缓存 */
    private _battleSpeed: number = 1;
    private _boundOnSpeedChange: ((data: { speed: number }) => void) | null = null;

    onLoad(): void {
        this._ensureGraphics();
        this._setupSpeedListener();
    }

    private _setupSpeedListener(): void {
        const eventBus = EventBus.getInstance();
        this._boundOnSpeedChange = (data: { speed: number }) => {
            this._battleSpeed = data.speed;
        };
        eventBus.on(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, this._boundOnSpeedChange);
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
        if (!this._ensureGraphics()) return;

        this.node.setPosition(0, 0, 0);
        this._effectType = 'line';
        this._fromPos = { ...fromPos };
        this._toPos = { ...toPos };
        this._effectColor = color.clone();
        this._lineWidth = lineWidth;
        this._lifetime = 0;
        this._maxLifetime = 0.16;
        this._drawLegacyAttackLine(1);
    }

    /**
     * 初始化命中特效（圆形扩散）
     */
    initHitEffect(
        position: { x: number; y: number },
        radius: number,
        color: Color
    ): void {
        if (!this._ensureGraphics()) return;

        this.node.setPosition(position.x, position.y, 0);
        this._effectType = 'hit';
        this._effectColor = color.clone();
        this._radius = radius;
        this._lifetime = 0;
        this._maxLifetime = 0.18;
        this._drawLegacyHitEffect(1);
    }

    /**
     * 统一入口：根据塔类型播放对应攻击特效。
     * 未知 towerType 才回退到旧的普通攻击线。
     */
    playTowerAttackEffect(
        towerType: string,
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): void {
        switch (towerType) {
            case 'machinegun_tower':
                this.playBulletEffect(fromPos, toPos);
                break;
            case 'cannon_tower':
                this.playShellEffect(fromPos, toPos);
                break;
            case 'ice_tower':
                this.playIceShardEffect(fromPos, toPos);
                break;
            case 'electric_tower':
                this.playLightningEffect(fromPos, toPos);
                break;
            default:
                this.initAttackLine(fromPos, toPos, AttackEffectView.getTowerAttackColor(towerType), 3);
                break;
        }
    }

    /**
     * 机枪塔：快速小子弹 + 短拖尾 + 小闪点。
     */
    playBulletEffect(
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): void {
        this._startMovingEffect('bullet', fromPos, toPos, 0.1, 0.05);
        this._effectColor = new Color(255, 240, 170, 255);
        this._drawBulletEffect();
    }

    /**
     * 炮塔：较大炮弹 + 命中爆炸圆环。
     */
    playShellEffect(
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): void {
        this._startMovingEffect('shell', fromPos, toPos, 0.26, 0.18);
        this._effectColor = new Color(255, 115, 35, 255);
        this._drawShellEffect();
    }

    /**
     * 冰塔：冰蓝冰锥 + 冰冻扩散。
     */
    playIceShardEffect(
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): void {
        this._startMovingEffect('ice', fromPos, toPos, 0.22, 0.16);
        this._effectColor = new Color(135, 225, 255, 255);
        this._drawIceShardEffect();
    }

    /**
     * 电塔：瞬发折线闪电。
     */
    playLightningEffect(
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): void {
        this.node.setPosition(0, 0, 0);
        this._effectType = 'lightning';
        this._fromPos = { ...fromPos };
        this._toPos = { ...toPos };
        this._effectColor = new Color(170, 125, 255, 255);
        this._lifetime = 0;
        this._maxLifetime = 0.11;
        this._flightDuration = 0;
        this._hitDuration = 0.11;
        this._lightningPoints = this._createLightningPoints(fromPos, toPos);
        this._drawLightningEffect();
    }

    update(deltaTime: number): void {
        this._lifetime += deltaTime * this._battleSpeed;

        if (this._lifetime >= this._maxLifetime) {
            this._destroyEffectNode();
            return;
        }

        switch (this._effectType) {
            case 'line':
                this._drawLegacyAttackLine(this._remainingAlpha());
                break;
            case 'hit':
                this._drawLegacyHitEffect(this._remainingAlpha());
                break;
            case 'bullet':
                this._drawBulletEffect();
                break;
            case 'shell':
                this._drawShellEffect();
                break;
            case 'ice':
                this._drawIceShardEffect();
                break;
            case 'lightning':
                this._drawLightningEffect();
                break;
        }
    }

    /**
     * 根据塔类型获取攻击颜色
     */
    static getTowerAttackColor(towerType: string): Color {
        switch (towerType) {
            case 'machinegun_tower':
                return new Color(255, 240, 170, 255); // 黄白色
            case 'cannon_tower':
                return new Color(255, 115, 35, 255); // 橙红色
            case 'ice_tower':
                return new Color(135, 225, 255, 255); // 冰蓝色
            case 'electric_tower':
                return new Color(170, 125, 255, 255); // 蓝紫色
            default:
                return new Color(255, 255, 255, 255); // 白色
        }
    }

    private _startMovingEffect(
        effectType: AttackEffectType,
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number },
        flightDuration: number,
        hitDuration: number
    ): void {
        this.node.setPosition(0, 0, 0);
        this._effectType = effectType;
        this._fromPos = { ...fromPos };
        this._toPos = { ...toPos };
        this._lifetime = 0;
        this._flightDuration = flightDuration;
        this._hitDuration = hitDuration;
        this._maxLifetime = flightDuration + hitDuration;
        this._lightningPoints = [];
    }

    /**
     * 更新目标位置（用于飞行特效追踪移动中的敌人）
     * 只在飞行阶段更新，命中阶段不再更新
     */
    updateTargetPosition(pos: { x: number; y: number }): void {
        if (this._lifetime <= this._flightDuration) {
            this._toPos = { ...pos };
        }
    }

    /**
     * 是否还在飞行阶段
     */
    isInFlightPhase(): boolean {
        return this._lifetime <= this._flightDuration;
    }

    private _drawLegacyAttackLine(alphaRatio: number): void {
        if (!this._ensureGraphics()) return;

        this._graphics.clear();
        this._graphics.strokeColor = this._withAlpha(this._effectColor, alphaRatio);
        this._graphics.lineWidth = this._lineWidth;
        this._graphics.moveTo(this._fromPos.x, this._fromPos.y);
        this._graphics.lineTo(this._toPos.x, this._toPos.y);
        this._graphics.stroke();
    }

    private _drawLegacyHitEffect(alphaRatio: number): void {
        if (!this._ensureGraphics()) return;

        this._graphics.clear();
        this._graphics.fillColor = this._withAlpha(this._effectColor, alphaRatio);
        this._graphics.circle(0, 0, this._radius);
        this._graphics.fill();
    }

    private _drawBulletEffect(): void {
        if (!this._ensureGraphics()) return;

        this._graphics.clear();

        if (this._lifetime <= this._flightDuration) {
            const t = this._clamp01(this._lifetime / this._flightDuration);
            const pos = this._lerpPoint(this._fromPos, this._toPos, t);
            const dir = this._direction(this._fromPos, this._toPos);
            const trailLength = 18;
            const trailStart = {
                x: pos.x - dir.x * trailLength,
                y: pos.y - dir.y * trailLength,
            };

            this._graphics.strokeColor = new Color(255, 220, 95, 150);
            this._graphics.lineWidth = 3;
            this._graphics.moveTo(trailStart.x, trailStart.y);
            this._graphics.lineTo(pos.x, pos.y);
            this._graphics.stroke();

            this._graphics.fillColor = new Color(255, 250, 210, 255);
            this._graphics.circle(pos.x, pos.y, 3.5);
            this._graphics.fill();
            return;
        }

        const hitT = this._clamp01((this._lifetime - this._flightDuration) / this._hitDuration);
        const alpha = 1 - hitT;
        const sparkRadius = 3 + hitT * 8;
        this._graphics.fillColor = this._withAlpha(new Color(255, 245, 190, 255), alpha);
        this._graphics.circle(this._toPos.x, this._toPos.y, sparkRadius);
        this._graphics.fill();
        this._graphics.strokeColor = this._withAlpha(new Color(255, 255, 255, 255), alpha);
        this._graphics.lineWidth = 2;
        this._drawCross(this._toPos, sparkRadius + 3);
    }

    private _drawShellEffect(): void {
        if (!this._ensureGraphics()) return;

        this._graphics.clear();

        if (this._lifetime <= this._flightDuration) {
            const t = this._clamp01(this._lifetime / this._flightDuration);
            const pos = this._lerpPoint(this._fromPos, this._toPos, t);
            const dir = this._direction(this._fromPos, this._toPos);
            const tail = {
                x: pos.x - dir.x * 16,
                y: pos.y - dir.y * 16,
            };

            this._graphics.strokeColor = new Color(180, 70, 25, 120);
            this._graphics.lineWidth = 5;
            this._graphics.moveTo(tail.x, tail.y);
            this._graphics.lineTo(pos.x, pos.y);
            this._graphics.stroke();

            this._graphics.fillColor = new Color(255, 135, 45, 255);
            this._graphics.circle(pos.x, pos.y, 7);
            this._graphics.fill();
            this._graphics.strokeColor = new Color(255, 225, 125, 220);
            this._graphics.lineWidth = 2;
            this._graphics.circle(pos.x, pos.y, 8);
            this._graphics.stroke();
            return;
        }

        const hitT = this._clamp01((this._lifetime - this._flightDuration) / this._hitDuration);
        const alpha = 1 - hitT;
        const ringRadius = 8 + hitT * 28;
        this._graphics.fillColor = this._withAlpha(new Color(255, 95, 35, 255), alpha * 0.35);
        this._graphics.circle(this._toPos.x, this._toPos.y, ringRadius * 0.45);
        this._graphics.fill();
        this._graphics.strokeColor = this._withAlpha(new Color(255, 135, 45, 255), alpha);
        this._graphics.lineWidth = 4;
        this._graphics.circle(this._toPos.x, this._toPos.y, ringRadius);
        this._graphics.stroke();
    }

    private _drawIceShardEffect(): void {
        if (!this._ensureGraphics()) return;

        this._graphics.clear();

        if (this._lifetime <= this._flightDuration) {
            const t = this._clamp01(this._lifetime / this._flightDuration);
            const pos = this._lerpPoint(this._fromPos, this._toPos, t);
            const dir = this._direction(this._fromPos, this._toPos);
            const perp = { x: -dir.y, y: dir.x };

            this._graphics.strokeColor = new Color(90, 190, 255, 140);
            this._graphics.lineWidth = 3;
            this._graphics.moveTo(pos.x - dir.x * 16, pos.y - dir.y * 16);
            this._graphics.lineTo(pos.x, pos.y);
            this._graphics.stroke();

            this._graphics.fillColor = new Color(135, 225, 255, 240);
            this._graphics.moveTo(pos.x + dir.x * 11, pos.y + dir.y * 11);
            this._graphics.lineTo(pos.x + perp.x * 5, pos.y + perp.y * 5);
            this._graphics.lineTo(pos.x - dir.x * 10, pos.y - dir.y * 10);
            this._graphics.lineTo(pos.x - perp.x * 5, pos.y - perp.y * 5);
            this._graphics.close();
            this._graphics.fill();

            this._graphics.strokeColor = new Color(230, 255, 255, 220);
            this._graphics.lineWidth = 1;
            this._graphics.moveTo(pos.x + dir.x * 8, pos.y + dir.y * 8);
            this._graphics.lineTo(pos.x - dir.x * 7, pos.y - dir.y * 7);
            this._graphics.stroke();
            return;
        }

        const hitT = this._clamp01((this._lifetime - this._flightDuration) / this._hitDuration);
        const alpha = 1 - hitT;
        const ringRadius = 7 + hitT * 26;
        this._graphics.strokeColor = this._withAlpha(new Color(135, 225, 255, 255), alpha);
        this._graphics.lineWidth = 3;
        this._graphics.circle(this._toPos.x, this._toPos.y, ringRadius);
        this._graphics.stroke();

        this._graphics.strokeColor = this._withAlpha(new Color(220, 255, 255, 255), alpha);
        this._graphics.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const inner = 5 + hitT * 6;
            const outer = 11 + hitT * 22;
            const from = {
                x: this._toPos.x + Math.cos(angle) * inner,
                y: this._toPos.y + Math.sin(angle) * inner,
            };
            const to = {
                x: this._toPos.x + Math.cos(angle) * outer,
                y: this._toPos.y + Math.sin(angle) * outer,
            };
            this._graphics.moveTo(from.x, from.y);
            this._graphics.lineTo(to.x, to.y);
            this._graphics.stroke();
        }
    }

    private _drawLightningEffect(): void {
        if (!this._ensureGraphics() || this._lightningPoints.length < 2) return;

        this._graphics.clear();
        const alpha = this._remainingAlpha();
        const flash = 0.85 + Math.sin(this._lifetime * 90) * 0.15;

        this._graphics.strokeColor = this._withAlpha(new Color(90, 115, 255, 255), alpha * 0.55);
        this._graphics.lineWidth = 7;
        this._strokeLightningPath();

        this._graphics.strokeColor = this._withAlpha(new Color(225, 245, 255, 255), alpha * flash);
        this._graphics.lineWidth = 2;
        this._strokeLightningPath();

        this._graphics.fillColor = this._withAlpha(new Color(175, 135, 255, 255), alpha * 0.7);
        this._graphics.circle(this._toPos.x, this._toPos.y, 5);
        this._graphics.fill();
    }

    private _strokeLightningPath(): void {
        if (!this._graphics || this._lightningPoints.length < 2) return;

        const first = this._lightningPoints[0];
        this._graphics.moveTo(first.x, first.y);
        for (let i = 1; i < this._lightningPoints.length; i++) {
            const point = this._lightningPoints[i];
            this._graphics.lineTo(point.x, point.y);
        }
        this._graphics.stroke();
    }

    private _createLightningPoints(
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): EffectPoint[] {
        const points: EffectPoint[] = [{ ...fromPos }];
        const dir = this._direction(fromPos, toPos);
        const perp = { x: -dir.y, y: dir.x };
        const segments = 4;
        const distance = this._distance(fromPos, toPos);
        const maxOffset = Math.min(24, Math.max(10, distance * 0.12));

        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const base = this._lerpPoint(fromPos, toPos, t);
            const sign = i % 2 === 0 ? 1 : -1;
            const offset = sign * (maxOffset * (0.55 + Math.random() * 0.45));
            points.push({
                x: base.x + perp.x * offset,
                y: base.y + perp.y * offset,
            });
        }

        points.push({ ...toPos });
        return points;
    }

    private _drawCross(center: EffectPoint, radius: number): void {
        if (!this._ensureGraphics()) return;

        this._graphics.moveTo(center.x - radius, center.y);
        this._graphics.lineTo(center.x + radius, center.y);
        this._graphics.stroke();
        this._graphics.moveTo(center.x, center.y - radius);
        this._graphics.lineTo(center.x, center.y + radius);
        this._graphics.stroke();
    }

    private _remainingAlpha(): number {
        return this._clamp01(1 - this._lifetime / this._maxLifetime);
    }

    private _withAlpha(color: Color, alphaRatio: number): Color {
        return new Color(color.r, color.g, color.b, Math.floor(color.a * this._clamp01(alphaRatio)));
    }

    private _lerpPoint(from: EffectPoint, to: EffectPoint, t: number): EffectPoint {
        return {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
        };
    }

    private _direction(from: EffectPoint, to: EffectPoint): EffectPoint {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        return { x: dx / length, y: dy / length };
    }

    private _distance(from: EffectPoint, to: EffectPoint): number {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private _clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }

    private _ensureGraphics(): boolean {
        if (!this._graphics) {
            this._graphics = this.node.getComponent(Graphics);
        }
        if (!this._graphics) {
            this._graphics = this.node.addComponent(Graphics);
        }
        return !!this._graphics;
    }

    private _destroyEffectNode(): void {
        if (this._graphics) {
            this._graphics.clear();
        }
        this.node.destroy();
    }

    onDestroy(): void {
        if (this._boundOnSpeedChange) {
            EventBus.getInstance().off(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, this._boundOnSpeedChange);
            this._boundOnSpeedChange = null;
        }
        if (this._graphics) {
            this._graphics.clear();
        }
        this._graphics = null;
        this._lightningPoints = [];
    }
}
