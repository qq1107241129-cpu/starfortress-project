/**
 * 投射物管理器
 * 管理塔发射的投射物：移动、碰撞检测、伤害结算
 */

import { EnemyController } from './EnemyController';
import { BATTLE_BALANCE } from '../data/BattleBalanceConfig';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';

export type ProjectileType = 'single' | 'splash' | 'chain';

export interface ProjectileState {
    id: string;
    type: ProjectileType;
    position: { x: number; y: number };
    targetId: string;
    damage: number;
    speed: number;
    isAlive: boolean;
    /** 炮塔：爆炸半径 */
    splashRadius: number;
    /** 电塔：剩余弹射次数 */
    chainRemaining: number;
    /** 电塔：弹射距离上限 */
    chainRange: number;
    /** 电塔：已弹射的敌人ID列表（避免重复弹射） */
    chainHitIds: string[];
    /** 冰塔：减速系数 */
    slowFactor: number;
    /** 冰塔：减速持续时间 */
    slowDuration: number;
}

export class ProjectileManager {
    private _projectiles: Map<string, ProjectileState> = new Map();
    private _eventBus: EventBus = EventBus.getInstance();

    /**
     * 创建单体投射物（机枪塔）
     */
    createSingle(
        fromPos: { x: number; y: number },
        targetId: string,
        damage: number
    ): string {
        const id = this._genId();
        this._projectiles.set(id, {
            id,
            type: 'single',
            position: { ...fromPos },
            targetId,
            damage,
            speed: BATTLE_BALANCE.projectileSpeed,
            isAlive: true,
            splashRadius: 0,
            chainRemaining: 0,
            chainRange: 0,
            chainHitIds: [],
            slowFactor: 0,
            slowDuration: 0,
        });
        return id;
    }

    /**
     * 创建范围投射物（炮塔）
     */
    createSplash(
        fromPos: { x: number; y: number },
        targetId: string,
        damage: number,
        splashRadius: number
    ): string {
        const id = this._genId();
        this._projectiles.set(id, {
            id,
            type: 'splash',
            position: { ...fromPos },
            targetId,
            damage,
            speed: BATTLE_BALANCE.projectileSpeed * BATTLE_BALANCE.splashProjectileSpeedFactor,
            isAlive: true,
            splashRadius,
            chainRemaining: 0,
            chainRange: 0,
            chainHitIds: [],
            slowFactor: 0,
            slowDuration: 0,
        });
        return id;
    }

    /**
     * 创建减速投射物（冰塔）
     */
    createIce(
        fromPos: { x: number; y: number },
        targetId: string,
        damage: number,
        slowFactor: number,
        slowDuration: number
    ): string {
        const id = this._genId();
        this._projectiles.set(id, {
            id,
            type: 'single',
            position: { ...fromPos },
            targetId,
            damage,
            speed: BATTLE_BALANCE.projectileSpeed,
            isAlive: true,
            splashRadius: 0,
            chainRemaining: 0,
            chainRange: 0,
            chainHitIds: [],
            slowFactor,
            slowDuration,
        });
        return id;
    }

    /**
     * 创建链式投射物（电塔）
     */
    createChain(
        fromPos: { x: number; y: number },
        targetId: string,
        damage: number,
        chainCount: number
    ): string {
        const id = this._genId();
        this._projectiles.set(id, {
            id,
            type: 'chain',
            position: { ...fromPos },
            targetId,
            damage,
            speed: 99999, // 电弧瞬发，投射物瞬间命中
            isAlive: true,
            splashRadius: 0,
            chainRemaining: chainCount,
            chainRange: BATTLE_BALANCE.chainRange,
            chainHitIds: [targetId],
            slowFactor: 0,
            slowDuration: 0,
        });
        return id;
    }

    /**
     * 每帧更新所有投射物
     * @returns 本帧命中的伤害事件列表
     */
    update(deltaTime: number, enemyMap: Map<string, EnemyController>): ProjectileHitEvent[] {
        const hits: ProjectileHitEvent[] = [];

        this._projectiles.forEach(proj => {
            if (!proj.isAlive) return;

            const target = enemyMap.get(proj.targetId);

            // 目标已死亡或不存在，投射物消失
            if (!target || !target.isAlive()) {
                proj.isAlive = false;
                return;
            }

            // 向目标移动
            const tPos = target.getPosition();
            const dx = tPos.x - proj.position.x;
            const dy = tPos.y - proj.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const moveDistance = proj.speed * deltaTime;

            if (dist <= moveDistance + BATTLE_BALANCE.hitCollisionTolerance) {
                // 命中目标
                proj.position.x = tPos.x;
                proj.position.y = tPos.y;
                this._onHit(proj, target, enemyMap, hits);
            } else {
                const ratio = moveDistance / dist;
                proj.position.x += dx * ratio;
                proj.position.y += dy * ratio;
            }
        });

        // 清理已死亡投射物
        this._projectiles.forEach((proj, id) => {
            if (!proj.isAlive) {
                this._projectiles.delete(id);
            }
        });

        return hits;
    }

    /**
     * 命中处理
     */
    private _onHit(
        proj: ProjectileState,
        target: EnemyController,
        enemyMap: Map<string, EnemyController>,
        hits: ProjectileHitEvent[]
    ): void {
        // 对主目标造成伤害
        const actualDamage = target.takeDamage(proj.damage);
        const targetPos = target.getPosition();
        hits.push({
            projectileId: proj.id,
            enemyId: target.getId(),
            damage: actualDamage,
            position: targetPos,
        });

        // 发出伤害飘字事件
        this._eventBus.emit(BATTLE_EVENTS.DAMAGE_NUMBER_SHOW, {
            damage: actualDamage,
            position: targetPos,
        });

        // 冰塔减速效果
        if (proj.slowFactor > 0) {
            target.applySlow(proj.slowFactor, proj.slowDuration);
        }

        // 炮塔范围伤害
        if (proj.type === 'splash' && proj.splashRadius > 0) {
            const center = target.getPosition();
            enemyMap.forEach(enemy => {
                if (!enemy.isAlive() || enemy.getId() === target.getId()) return;
                const ePos = enemy.getPosition();
                const dx = ePos.x - center.x;
                const dy = ePos.y - center.y;
                if (Math.sqrt(dx * dx + dy * dy) <= proj.splashRadius) {
                    // 范围伤害衰减：距离中心越远伤害越低
                    const distRatio = Math.sqrt(dx * dx + dy * dy) / proj.splashRadius;
                    const splashDamage = Math.floor(proj.damage * (1 - distRatio * BATTLE_BALANCE.splashDamageFalloff));
                    const actualSplashDamage = enemy.takeDamage(splashDamage);
                    hits.push({
                        projectileId: proj.id,
                        enemyId: enemy.getId(),
                        damage: actualSplashDamage,
                        position: ePos,
                    });

                    // 发出伤害飘字事件
                    this._eventBus.emit(BATTLE_EVENTS.DAMAGE_NUMBER_SHOW, {
                        damage: actualSplashDamage,
                        position: ePos,
                    });
                }
            });
        }

        // 电塔链式攻击
        if (proj.type === 'chain' && proj.chainRemaining > 0) {
            this._chainAttack(proj, target, enemyMap, hits);
        }

        proj.isAlive = false;
    }

    /**
     * 链式攻击：从当前目标弹射到附近敌人
     */
    private _chainAttack(
        proj: ProjectileState,
        fromEnemy: EnemyController,
        enemyMap: Map<string, EnemyController>,
        hits: ProjectileHitEvent[]
    ): void {
        const fromPos = fromEnemy.getPosition();
        let chainDamage = proj.damage;
        let currentPos = fromPos;

        for (let i = 0; i < proj.chainRemaining; i++) {
            // 链式伤害衰减：每次弹射降低 20%
            chainDamage = Math.floor(chainDamage * BATTLE_BALANCE.chainDamageFalloff);

            // 找到最近的未命中敌人
            let nearestEnemy: EnemyController | null = null;
            let nearestDist = proj.chainRange;

            enemyMap.forEach(enemy => {
                if (!enemy.isAlive()) return;
                if (proj.chainHitIds.includes(enemy.getId())) return;

                const ePos = enemy.getPosition();
                const dx = ePos.x - currentPos.x;
                const dy = ePos.y - currentPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            });

            if (!nearestEnemy) break;

            const chainTarget = nearestEnemy;
            const chainTargetPos = chainTarget.getPosition();

            // 发出电弧弹射特效事件（从上一个位置到当前敌人位置）
            this._eventBus.emit(BATTLE_EVENTS.CHAIN_HIT, {
                fromPosition: { ...currentPos },
                toPosition: { ...chainTargetPos },
                chainIndex: i,
                damage: chainDamage,
            });

            const actualChainDamage = chainTarget.takeDamage(chainDamage);
            proj.chainHitIds.push(chainTarget.getId());
            currentPos = chainTargetPos;

            hits.push({
                projectileId: proj.id,
                enemyId: chainTarget.getId(),
                damage: actualChainDamage,
                position: currentPos,
            });

            // 发出伤害飘字事件
            this._eventBus.emit(BATTLE_EVENTS.DAMAGE_NUMBER_SHOW, {
                damage: actualChainDamage,
                position: currentPos,
            });
        }
    }

    /**
     * 获取所有活跃投射物（用于渲染）
     */
    getActiveProjectiles(): ProjectileState[] {
        return Array.from(this._projectiles.values()).filter(p => p.isAlive);
    }

    /**
     * 清除所有投射物
     */
    clear(): void {
        this._projectiles.clear();
    }

    private _genId(): string {
        return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
}

/** 投射物命中事件 */
export interface ProjectileHitEvent {
    projectileId: string;
    enemyId: string;
    damage: number;
    position: { x: number; y: number };
}
