/**
 * SkillEffectView
 *
 * Visual-only active skill effects for orbital cannon and full-screen freeze.
 * This component should be mounted on BattleVisualRoot/EffectLayer.
 *
 * It listens to skill events and draws short-lived Graphics effects. It does
 * not change skill damage, freeze duration, charges, targeting, or enemy logic.
 */

import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';

const { ccclass } = _decorator;

type SkillEffectType = 'orbital' | 'freeze';

interface LayerBounds {
    width: number;
    height: number;
    halfWidth: number;
    halfHeight: number;
}

interface BeamLine {
    offsetX: number;
    width: number;
    alpha: number;
}

interface SparkLine {
    angle: number;
    length: number;
    delay: number;
}

interface OrbitalPayload {
    radius: number;
    topY: number;
    beamLines: BeamLine[];
    sparks: SparkLine[];
}

interface IceCrack {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    branchX: number;
    branchY: number;
    delay: number;
}

interface IceFlake {
    x: number;
    y: number;
    size: number;
    angle: number;
    delay: number;
}

interface BurstSnowflake {
    angle: number;
    distanceScale: number;
    size: number;
    delay: number;
    drift: number;
    spin: number;
}

interface FreezePayload {
    bounds: LayerBounds;
    maxRadius: number;
    burstFlakes: BurstSnowflake[];
    cracks: IceCrack[];
    flakes: IceFlake[];
}

interface EffectItem {
    node: Node;
    graphics: Graphics;
    elapsed: number;
    duration: number;
    type: SkillEffectType;
    payload: OrbitalPayload | FreezePayload;
}

@ccclass('SkillEffectView')
export class SkillEffectView extends Component {
    private static readonly FALLBACK_WIDTH = 1080;
    private static readonly FALLBACK_HEIGHT = 1920;

    private static readonly ORBITAL_LOCK_DURATION = 0.22;
    private static readonly ORBITAL_STRIKE_DURATION = 0.22;
    private static readonly ORBITAL_BURST_DURATION = 0.48;
    private static readonly FREEZE_IMPACT_DURATION = 0.22;
    private static readonly FREEZE_COVER_DURATION = 0.65;
    private static readonly FREEZE_FADE_DURATION = 0.30;

    private _eventBus: EventBus | null = null;
    private _activeEffects: EffectItem[] = [];

    private _boundOnOrbitalCannon: ((data: any) => void) | null = null;
    private _boundOnFreeze: ((data: any) => void) | null = null;
    private _boundOnBattleEnd: (() => void) | null = null;

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._setupEventListeners();
    }

    update(deltaTime: number): void {
        for (let i = this._activeEffects.length - 1; i >= 0; i--) {
            const effect = this._activeEffects[i];
            if (!effect.node || !effect.node.isValid) {
                this._activeEffects.splice(i, 1);
                continue;
            }

            effect.elapsed += deltaTime;
            effect.graphics.clear();

            if (effect.type === 'orbital') {
                this._drawOrbital(effect.graphics, effect.elapsed, effect.payload as OrbitalPayload);
            } else {
                this._drawFreeze(effect.graphics, effect.elapsed, effect.payload as FreezePayload);
            }

            if (effect.elapsed >= effect.duration) {
                this._destroyEffectAt(i);
            }
        }
    }

    onDestroy(): void {
        this._unbindEvents();
        this._clearAllEffects();
        this._eventBus = null;
    }

    private _setupEventListeners(): void {
        if (!this._eventBus) return;

        this._boundOnOrbitalCannon = this._onOrbitalCannon.bind(this);
        this._boundOnFreeze = this._onFreeze.bind(this);
        this._boundOnBattleEnd = this._clearAllEffects.bind(this);

        this._eventBus.on(BATTLE_EVENTS.SKILL_ORBITAL_CANNON, this._boundOnOrbitalCannon);
        this._eventBus.on(BATTLE_EVENTS.SKILL_FREEZE, this._boundOnFreeze);
        this._eventBus.on(BATTLE_EVENTS.BATTLE_END, this._boundOnBattleEnd);
    }

    private _unbindEvents(): void {
        if (!this._eventBus) return;

        if (this._boundOnOrbitalCannon) {
            this._eventBus.off(BATTLE_EVENTS.SKILL_ORBITAL_CANNON, this._boundOnOrbitalCannon);
            this._boundOnOrbitalCannon = null;
        }
        if (this._boundOnFreeze) {
            this._eventBus.off(BATTLE_EVENTS.SKILL_FREEZE, this._boundOnFreeze);
            this._boundOnFreeze = null;
        }
        if (this._boundOnBattleEnd) {
            this._eventBus.off(BATTLE_EVENTS.BATTLE_END, this._boundOnBattleEnd);
            this._boundOnBattleEnd = null;
        }
    }

    private _onOrbitalCannon(data: { position?: { x: number; y: number }; radius?: number }): void {
        const position = data && data.position ? data.position : { x: 0, y: 0 };
        const radius = this._safeRadius(data && data.radius ? data.radius : 100);
        const bounds = this._getLayerBounds();

        const effectNode = new Node('OrbitalCannonEffect');
        effectNode.parent = this.node;
        effectNode.setPosition(position.x, position.y, 0);

        const graphics = effectNode.addComponent(Graphics);
        const transform = effectNode.addComponent(UITransform);
        transform.setContentSize(Math.max(radius * 4, 320), Math.max(bounds.height, radius * 5));

        const payload: OrbitalPayload = {
            radius,
            topY: Math.max(bounds.halfHeight - position.y + 80, radius * 3),
            beamLines: this._createBeamLines(),
            sparks: this._createOrbitalSparks(),
        };

        this._activeEffects.push({
            node: effectNode,
            graphics,
            elapsed: 0,
            duration: SkillEffectView.ORBITAL_LOCK_DURATION + SkillEffectView.ORBITAL_STRIKE_DURATION + SkillEffectView.ORBITAL_BURST_DURATION,
            type: 'orbital',
            payload,
        });
    }

    private _onFreeze(data: { duration?: number }): void {
        const bounds = this._getLayerBounds();

        const effectNode = new Node('FreezeEffect');
        effectNode.parent = this.node;
        effectNode.setPosition(0, 0, 0);

        const graphics = effectNode.addComponent(Graphics);
        const transform = effectNode.addComponent(UITransform);
        transform.setContentSize(bounds.width, bounds.height);

        const payload: FreezePayload = {
            bounds,
            maxRadius: Math.sqrt(bounds.halfWidth * bounds.halfWidth + bounds.halfHeight * bounds.halfHeight),
            burstFlakes: this._createBurstSnowflakes(bounds),
            cracks: this._createIceCracks(bounds),
            flakes: this._createIceFlakes(bounds),
        };

        this._activeEffects.push({
            node: effectNode,
            graphics,
            elapsed: 0,
            duration: SkillEffectView.FREEZE_IMPACT_DURATION + SkillEffectView.FREEZE_COVER_DURATION + SkillEffectView.FREEZE_FADE_DURATION,
            type: 'freeze',
            payload,
        });
    }

    private _drawOrbital(graphics: Graphics, elapsed: number, payload: OrbitalPayload): void {
        const lockEnd = SkillEffectView.ORBITAL_LOCK_DURATION;
        const strikeEnd = lockEnd + SkillEffectView.ORBITAL_STRIKE_DURATION;

        if (elapsed < lockEnd) {
            this._drawOrbitalLock(graphics, elapsed / lockEnd, payload.radius, 1);
            return;
        }

        if (elapsed < strikeEnd) {
            const strikeProgress = (elapsed - lockEnd) / SkillEffectView.ORBITAL_STRIKE_DURATION;
            this._drawOrbitalLock(graphics, 1, payload.radius, 1 - strikeProgress * 0.5);
            this._drawOrbitalBeam(graphics, strikeProgress, payload);
            return;
        }

        const burstProgress = this._clamp01((elapsed - strikeEnd) / SkillEffectView.ORBITAL_BURST_DURATION);
        if (burstProgress < 0.18) {
            this._drawOrbitalBeam(graphics, 1, payload);
        }
        this._drawOrbitalBurst(graphics, burstProgress, payload);
    }

    private _drawOrbitalLock(graphics: Graphics, progress: number, radius: number, intensity: number): void {
        const pulse = 0.65 + Math.sin(progress * Math.PI * 8) * 0.25;
        const outerRadius = radius * (1.42 - progress * 0.32);
        const middleRadius = radius * (1.05 - progress * 0.12);
        const innerRadius = radius * (0.58 + progress * 0.06);
        const alpha = this._alpha(210 * intensity * pulse);

        graphics.lineWidth = 3;
        graphics.strokeColor = new Color(255, 78, 38, alpha);
        graphics.circle(0, 0, outerRadius);
        graphics.stroke();

        graphics.lineWidth = 1.5;
        graphics.strokeColor = new Color(255, 180, 64, this._alpha(175 * intensity));
        graphics.circle(0, 0, middleRadius);
        graphics.stroke();

        graphics.lineWidth = 1;
        graphics.strokeColor = new Color(255, 226, 128, this._alpha(135 * intensity));
        graphics.circle(0, 0, innerRadius);
        graphics.stroke();

        const lineInner = radius * 0.22;
        const lineOuter = radius * (1.28 - progress * 0.12);
        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(255, 110, 45, this._alpha(190 * intensity));
        graphics.moveTo(-lineOuter, 0);
        graphics.lineTo(-lineInner, 0);
        graphics.moveTo(lineInner, 0);
        graphics.lineTo(lineOuter, 0);
        graphics.moveTo(0, -lineOuter);
        graphics.lineTo(0, -lineInner);
        graphics.moveTo(0, lineInner);
        graphics.lineTo(0, lineOuter);
        graphics.stroke();

        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(255, 210, 100, this._alpha(150 * intensity));
        for (let i = 0; i < 12; i++) {
            const angle = Math.PI * 2 * i / 12;
            const tickInner = radius * 0.96;
            const tickOuter = radius * 1.10;
            const x1 = Math.cos(angle) * tickInner;
            const y1 = Math.sin(angle) * tickInner;
            const x2 = Math.cos(angle) * tickOuter;
            const y2 = Math.sin(angle) * tickOuter;
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
        }
        graphics.stroke();
    }

    private _drawOrbitalBeam(graphics: Graphics, progress: number, payload: OrbitalPayload): void {
        const beamProgress = this._easeOutCubic(progress);
        const radius = payload.radius;
        const endY = payload.topY - (payload.topY + radius * 0.22) * beamProgress;
        const height = payload.topY - endY;
        const strikeAlpha = Math.sin(this._clamp01(progress) * Math.PI);

        graphics.fillColor = new Color(255, 116, 35, this._alpha(55 * strikeAlpha));
        graphics.rect(-34, endY, 68, height);
        graphics.fill();

        graphics.fillColor = new Color(255, 205, 70, this._alpha(100 * strikeAlpha));
        graphics.rect(-18, endY, 36, height);
        graphics.fill();

        graphics.fillColor = new Color(255, 255, 235, this._alpha(185 * strikeAlpha));
        graphics.rect(-7, endY, 14, height);
        graphics.fill();

        for (let i = 0; i < payload.beamLines.length; i++) {
            const line = payload.beamLines[i];
            graphics.lineWidth = line.width;
            graphics.strokeColor = new Color(255, 230, 130, this._alpha(line.alpha * strikeAlpha));
            graphics.moveTo(line.offsetX, payload.topY);
            graphics.lineTo(line.offsetX * 0.35, endY);
            graphics.stroke();
        }

        if (progress > 0.72) {
            const flashProgress = this._clamp01((progress - 0.72) / 0.28);
            const flashAlpha = 1 - flashProgress;
            graphics.fillColor = new Color(255, 255, 235, this._alpha(220 * flashAlpha));
            graphics.circle(0, 0, radius * (0.18 + flashProgress * 0.35));
            graphics.fill();
        }
    }

    private _drawOrbitalBurst(graphics: Graphics, progress: number, payload: OrbitalPayload): void {
        const radius = payload.radius;
        const fade = 1 - progress;
        const shockRadius = radius * (0.35 + progress * 1.35);
        const secondShockRadius = radius * (0.62 + progress * 1.10);

        if (progress < 0.22) {
            const flash = 1 - progress / 0.22;
            graphics.fillColor = new Color(255, 250, 210, this._alpha(190 * flash));
            graphics.circle(0, 0, radius * (0.25 + progress * 0.7));
            graphics.fill();
        }

        graphics.fillColor = new Color(255, 95, 28, this._alpha(55 * fade));
        graphics.circle(0, 0, radius * (0.62 + progress * 0.08));
        graphics.fill();

        graphics.lineWidth = 5 - progress * 3;
        graphics.strokeColor = new Color(255, 232, 145, this._alpha(210 * fade));
        graphics.circle(0, 0, shockRadius);
        graphics.stroke();

        graphics.lineWidth = 2;
        graphics.strokeColor = new Color(255, 105, 45, this._alpha(145 * fade));
        graphics.circle(0, 0, secondShockRadius);
        graphics.stroke();

        for (let i = 0; i < payload.sparks.length; i++) {
            const spark = payload.sparks[i];
            const local = this._clamp01((progress - spark.delay) / (1 - spark.delay));
            if (local <= 0) continue;

            const sparkFade = 1 - local;
            const inner = radius * (0.18 + local * 0.72);
            const outer = inner + spark.length * (0.65 + sparkFade * 0.45);
            const x1 = Math.cos(spark.angle) * inner;
            const y1 = Math.sin(spark.angle) * inner;
            const x2 = Math.cos(spark.angle) * outer;
            const y2 = Math.sin(spark.angle) * outer;

            graphics.lineWidth = 2.5 - local * 1.2;
            graphics.strokeColor = new Color(255, 205, 80, this._alpha(185 * sparkFade));
            graphics.moveTo(x1, y1);
            graphics.lineTo(x2, y2);
            graphics.stroke();
        }
    }

    private _drawFreeze(graphics: Graphics, elapsed: number, payload: FreezePayload): void {
        const impactEnd = SkillEffectView.FREEZE_IMPACT_DURATION;
        const coverEnd = impactEnd + SkillEffectView.FREEZE_COVER_DURATION;
        const totalDuration = impactEnd + SkillEffectView.FREEZE_COVER_DURATION + SkillEffectView.FREEZE_FADE_DURATION;
        const fadeProgress = elapsed > coverEnd ? this._clamp01((elapsed - coverEnd) / SkillEffectView.FREEZE_FADE_DURATION) : 0;
        const fade = 1 - fadeProgress;
        const coverProgress = elapsed < impactEnd ? this._clamp01(elapsed / impactEnd) : 1;

        this._drawFreezeOverlay(graphics, payload, coverProgress, fade);
        this._drawFreezeSnowflakeBurst(graphics, elapsed, payload, fade);

        if (elapsed > impactEnd * 0.45) {
            const detailProgress = this._clamp01((elapsed - impactEnd * 0.45) / (totalDuration - impactEnd * 0.45));
            this._drawIceCracks(graphics, payload, detailProgress, fade);
            this._drawIceFlakes(graphics, payload, detailProgress, fade);
        }
    }

    private _drawFreezeOverlay(graphics: Graphics, payload: FreezePayload, coverProgress: number, fade: number): void {
        const bounds = payload.bounds;
        const alpha = this._alpha(68 * coverProgress * fade);

        graphics.fillColor = new Color(72, 185, 255, alpha);
        graphics.rect(-bounds.halfWidth, -bounds.halfHeight, bounds.width, bounds.height);
        graphics.fill();

        graphics.fillColor = new Color(215, 248, 255, this._alpha(24 * coverProgress * fade));
        graphics.circle(0, 0, payload.maxRadius * (0.18 + coverProgress * 0.20));
        graphics.fill();

        graphics.lineWidth = 1.5;
        graphics.strokeColor = new Color(180, 236, 255, this._alpha(45 * coverProgress * fade));
        for (let i = -3; i <= 4; i++) {
            const x1 = -bounds.halfWidth + i * bounds.width * 0.24;
            const x2 = x1 + bounds.height * 0.38;
            graphics.moveTo(x1, bounds.halfHeight);
            graphics.lineTo(x2, -bounds.halfHeight);
        }
        graphics.stroke();
    }

    private _drawFreezeSnowflakeBurst(graphics: Graphics, elapsed: number, payload: FreezePayload, fade: number): void {
        const burstWindow = SkillEffectView.FREEZE_IMPACT_DURATION + 0.58;
        const coreProgress = this._clamp01(elapsed / SkillEffectView.FREEZE_IMPACT_DURATION);
        const coreAlpha = this._alpha(210 * (1 - coreProgress) * fade);

        if (coreAlpha > 0) {
            this._drawSnowflakeShape(graphics, 0, 0, 22 + coreProgress * 46, coreProgress * Math.PI * 0.45, coreAlpha, 2.4);
            this._drawSnowflakeShape(graphics, 0, 0, 12 + coreProgress * 28, -coreProgress * Math.PI * 0.35, this._alpha(coreAlpha * 0.75), 1.4);
        }

        for (let i = 0; i < payload.burstFlakes.length; i++) {
            const flake = payload.burstFlakes[i];
            const local = this._clamp01((elapsed - flake.delay) / burstWindow);
            if (local <= 0 || local >= 1) continue;

            const eased = this._easeOutCubic(local);
            const angle = flake.angle + Math.sin(local * Math.PI) * flake.drift;
            const distance = payload.maxRadius * flake.distanceScale * eased;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = flake.size * (0.68 + local * 0.82);
            const alpha = this._alpha(190 * (1 - local * 0.82) * fade);
            const trailInner = Math.max(0, distance - size * 2.4);
            const trailOuter = Math.max(0, distance - size * 0.65);
            const trailX1 = Math.cos(angle) * trailInner;
            const trailY1 = Math.sin(angle) * trailInner;
            const trailX2 = Math.cos(angle) * trailOuter;
            const trailY2 = Math.sin(angle) * trailOuter;

            graphics.lineWidth = 1.2;
            graphics.strokeColor = new Color(190, 240, 255, this._alpha(alpha * 0.42));
            graphics.moveTo(trailX1, trailY1);
            graphics.lineTo(trailX2, trailY2);
            graphics.stroke();

            this._drawSnowflakeShape(graphics, x, y, size, flake.spin + local * Math.PI * 0.35, alpha, 1.5);
        }
    }

    private _drawIceCracks(graphics: Graphics, payload: FreezePayload, progress: number, fade: number): void {
        for (let i = 0; i < payload.cracks.length; i++) {
            const crack = payload.cracks[i];
            const local = this._clamp01((progress - crack.delay) / (1 - crack.delay));
            if (local <= 0) continue;

            const x2 = crack.x1 + (crack.x2 - crack.x1) * local;
            const y2 = crack.y1 + (crack.y2 - crack.y1) * local;
            const branchX = crack.x1 + (crack.branchX - crack.x1) * local;
            const branchY = crack.y1 + (crack.branchY - crack.y1) * local;
            const alpha = this._alpha(145 * fade * (0.55 + local * 0.45));

            graphics.lineWidth = 1.5;
            graphics.strokeColor = new Color(220, 250, 255, alpha);
            graphics.moveTo(crack.x1, crack.y1);
            graphics.lineTo(x2, y2);
            graphics.stroke();

            graphics.lineWidth = 1;
            graphics.strokeColor = new Color(150, 225, 255, this._alpha(alpha * 0.75));
            graphics.moveTo(x2, y2);
            graphics.lineTo(branchX, branchY);
            graphics.stroke();
        }
    }

    private _drawIceFlakes(graphics: Graphics, payload: FreezePayload, progress: number, fade: number): void {
        for (let i = 0; i < payload.flakes.length; i++) {
            const flake = payload.flakes[i];
            const local = this._clamp01((progress - flake.delay) / (1 - flake.delay));
            if (local <= 0) continue;

            const shimmer = 0.65 + Math.sin((progress + flake.delay) * Math.PI * 8) * 0.25;
            const alpha = this._alpha(145 * fade * shimmer);
            const size = flake.size * (0.75 + local * 0.25);
            const angleA = flake.angle;
            const angleB = flake.angle + Math.PI * 0.5;

            graphics.lineWidth = 1.4;
            graphics.strokeColor = new Color(235, 255, 255, alpha);
            graphics.moveTo(flake.x - Math.cos(angleA) * size, flake.y - Math.sin(angleA) * size);
            graphics.lineTo(flake.x + Math.cos(angleA) * size, flake.y + Math.sin(angleA) * size);
            graphics.moveTo(flake.x - Math.cos(angleB) * size * 0.65, flake.y - Math.sin(angleB) * size * 0.65);
            graphics.lineTo(flake.x + Math.cos(angleB) * size * 0.65, flake.y + Math.sin(angleB) * size * 0.65);
            graphics.stroke();
        }
    }

    private _createBeamLines(): BeamLine[] {
        return [
            { offsetX: -24, width: 2, alpha: 95 },
            { offsetX: -12, width: 3, alpha: 125 },
            { offsetX: 0, width: 4, alpha: 180 },
            { offsetX: 13, width: 3, alpha: 120 },
            { offsetX: 25, width: 2, alpha: 90 },
        ];
    }

    private _createOrbitalSparks(): SparkLine[] {
        const sparks: SparkLine[] = [];
        for (let i = 0; i < 12; i++) {
            sparks.push({
                angle: Math.PI * 2 * i / 12 + (i % 2 === 0 ? 0.08 : -0.08),
                length: 44 + (i % 4) * 9,
                delay: (i % 3) * 0.04,
            });
        }
        return sparks;
    }

    private _createBurstSnowflakes(bounds: LayerBounds): BurstSnowflake[] {
        const flakes: BurstSnowflake[] = [];
        const shortSide = Math.min(bounds.width, bounds.height);
        const baseSize = Math.max(8, shortSide * 0.014);

        for (let i = 0; i < 18; i++) {
            flakes.push({
                angle: Math.PI * 2 * i / 18 + (i % 2 === 0 ? 0.07 : -0.07),
                distanceScale: 0.38 + (i % 5) * 0.105,
                size: baseSize + (i % 4) * 3,
                delay: (i % 4) * 0.026,
                drift: (i % 2 === 0 ? 1 : -1) * (0.08 + (i % 3) * 0.035),
                spin: Math.PI * (i % 6) / 6,
            });
        }

        return flakes;
    }

    private _createIceCracks(bounds: LayerBounds): IceCrack[] {
        const cracks: IceCrack[] = [];
        const width = bounds.width;
        const height = bounds.height;

        for (let i = 0; i < 9; i++) {
            const band = i - 4;
            const x1 = -bounds.halfWidth + width * (0.12 + i * 0.10);
            const y1 = bounds.halfHeight - height * (0.18 + (i % 3) * 0.19);
            const x2 = x1 + width * (0.12 + (i % 2) * 0.05);
            const y2 = y1 - height * (0.18 + (i % 4) * 0.04);
            cracks.push({
                x1,
                y1,
                x2,
                y2,
                branchX: x2 + width * 0.05 * (band >= 0 ? -1 : 1),
                branchY: y2 + height * 0.05,
                delay: (i % 5) * 0.06,
            });
        }

        return cracks;
    }

    private _createIceFlakes(bounds: LayerBounds): IceFlake[] {
        const flakes: IceFlake[] = [];
        for (let i = 0; i < 16; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            flakes.push({
                x: -bounds.halfWidth * 0.72 + col * bounds.width * 0.48 + (row % 2) * 24,
                y: -bounds.halfHeight * 0.58 + row * bounds.height * 0.34 + (col % 2) * 18,
                size: 9 + (i % 4) * 2,
                angle: Math.PI * (i % 6) / 6,
                delay: (i % 6) * 0.035,
            });
        }
        return flakes;
    }

    private _drawSnowflakeShape(graphics: Graphics, x: number, y: number, size: number, angle: number, alpha: number, lineWidth: number): void {
        graphics.lineWidth = lineWidth;
        graphics.strokeColor = new Color(238, 255, 255, this._alpha(alpha));

        for (let i = 0; i < 6; i++) {
            const armAngle = angle + Math.PI * 2 * i / 6;
            const cos = Math.cos(armAngle);
            const sin = Math.sin(armAngle);
            const innerX = x - cos * size * 0.22;
            const innerY = y - sin * size * 0.22;
            const outerX = x + cos * size;
            const outerY = y + sin * size;
            const branchBaseX = x + cos * size * 0.58;
            const branchBaseY = y + sin * size * 0.58;
            const branchAngleA = armAngle + Math.PI * 0.74;
            const branchAngleB = armAngle - Math.PI * 0.74;
            const branchLength = size * 0.28;

            graphics.moveTo(innerX, innerY);
            graphics.lineTo(outerX, outerY);
            graphics.moveTo(branchBaseX, branchBaseY);
            graphics.lineTo(branchBaseX + Math.cos(branchAngleA) * branchLength, branchBaseY + Math.sin(branchAngleA) * branchLength);
            graphics.moveTo(branchBaseX, branchBaseY);
            graphics.lineTo(branchBaseX + Math.cos(branchAngleB) * branchLength, branchBaseY + Math.sin(branchAngleB) * branchLength);
        }

        graphics.stroke();
    }

    private _getLayerBounds(): LayerBounds {
        let transform = this.node.getComponent(UITransform);
        if (!transform && this.node.parent) {
            transform = this.node.parent.getComponent(UITransform);
        }

        if (transform) {
            const size = transform.contentSize;
            if (size.width > 0 && size.height > 0) {
                return {
                    width: size.width,
                    height: size.height,
                    halfWidth: size.width * 0.5,
                    halfHeight: size.height * 0.5,
                };
            }
        }

        return {
            width: SkillEffectView.FALLBACK_WIDTH,
            height: SkillEffectView.FALLBACK_HEIGHT,
            halfWidth: SkillEffectView.FALLBACK_WIDTH * 0.5,
            halfHeight: SkillEffectView.FALLBACK_HEIGHT * 0.5,
        };
    }

    private _safeRadius(radius: number): number {
        if (radius < 60) return 60;
        if (radius > 360) return 360;
        return radius;
    }

    private _destroyEffectAt(index: number): void {
        const effect = this._activeEffects[index];
        if (effect && effect.node && effect.node.isValid) {
            effect.node.destroy();
        }
        this._activeEffects.splice(index, 1);
    }

    private _clearAllEffects(): void {
        for (let i = 0; i < this._activeEffects.length; i++) {
            const effect = this._activeEffects[i];
            if (effect.node && effect.node.isValid) {
                effect.node.destroy();
            }
        }
        this._activeEffects = [];
    }

    private _easeOutCubic(value: number): number {
        const t = this._clamp01(value);
        const inv = 1 - t;
        return 1 - inv * inv * inv;
    }

    private _clamp01(value: number): number {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    private _alpha(value: number): number {
        if (value <= 0) return 0;
        if (value >= 255) return 255;
        return Math.floor(value);
    }
}
