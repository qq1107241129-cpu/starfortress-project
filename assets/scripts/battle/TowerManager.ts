/**
 * 塔管理器
 * 管理所有塔实例：创建、更新、目标选择、攻击调度
 */

import { TowerController } from './TowerController';
import { ProjectileManager } from './ProjectileManager';
import { EnemyController } from './EnemyController';
import { getTowerConfig } from '../data/TowerConfig';

/** 固定塔位定义 */
export interface TowerSlot {
    id: string;
    position: { x: number; y: number };
    /** 该位置当前放置的塔ID，null 表示空位 */
    towerId: string | null;
}

export class TowerManager {
    private _towers: Map<string, TowerController> = new Map();
    private _slots: TowerSlot[];
    private _projectileManager: ProjectileManager;

    constructor(slots: TowerSlot[]) {
        this._slots = slots.map(s => ({ ...s, towerId: null }));
        this._projectileManager = new ProjectileManager();
    }

    /**
     * 在指定槽位放置塔
     * @param slotId 槽位ID
     * @param towerConfigId 塔配置ID
     * @param level 塔等级
     * @returns 是否放置成功
     */
    placeTower(slotId: string, towerConfigId: string, level: number = 1): boolean {
        const slot = this._slots.find(s => s.id === slotId);
        if (!slot || slot.towerId) return false;

        const config = getTowerConfig(towerConfigId);
        if (!config) return false;

        const tower = new TowerController(towerConfigId, config, level, slot.position);
        this._towers.set(tower.getId(), tower);
        slot.towerId = tower.getId();

        return true;
    }

    /**
     * 每帧更新：处理所有塔的攻击逻辑
     * @param deltaTime 帧间隔（秒）
     * @param enemies 当前存活敌人列表
     */
    update(deltaTime: number, enemies: EnemyController[]): void {
        const enemyMap = new Map<string, EnemyController>();
        enemies.forEach(e => enemyMap.set(e.getId(), e));

        this._towers.forEach(tower => {
            const canAttack = tower.update(deltaTime);
            if (!canAttack) return;

            const target = tower.selectTarget(enemies);
            if (!target) return;

            // 根据塔类型执行不同攻击
            this._executeAttack(tower, target);

            // 重置冷却
            tower.resetCooldown();
        });

        // 更新投射物
        this._projectileManager.update(deltaTime, enemyMap);
    }

    /**
     * 根据塔类型执行攻击
     */
    private _executeAttack(tower: TowerController, target: EnemyController): void {
        const towerPos = tower.getPosition();
        const attack = tower.getAttack();

        switch (tower.getType()) {
            case 'machinegun':
                // 单体高频攻击：直接发射单体投射物
                this._projectileManager.createSingle(towerPos, target.getId(), attack);
                break;

            case 'cannon':
                // 范围伤害：发射范围投射物
                this._projectileManager.createSplash(
                    towerPos,
                    target.getId(),
                    attack,
                    tower.getSplashRadius()
                );
                break;

            case 'ice':
                // 减速攻击：发射减速投射物
                this._projectileManager.createIce(
                    towerPos,
                    target.getId(),
                    attack,
                    tower.getSlowFactor(),
                    tower.getSlowDuration()
                );
                break;

            case 'electric':
                // 链式攻击：发射链式投射物
                this._projectileManager.createChain(
                    towerPos,
                    target.getId(),
                    attack,
                    tower.getChainCount()
                );
                break;
        }
    }

    /**
     * 获取所有塔
     */
    getTowers(): TowerController[] {
        return Array.from(this._towers.values());
    }

    /**
     * 根据ID获取塔
     */
    getTower(towerId: string): TowerController | undefined {
        return this._towers.get(towerId);
    }

    /**
     * 获取投射物管理器
     */
    getProjectileManager(): ProjectileManager {
        return this._projectileManager;
    }

    /**
     * 获取所有槽位
     */
    getSlots(): TowerSlot[] {
        return this._slots.map(s => ({ ...s }));
    }

    /**
     * 升级指定槽位的塔
     */
    upgradeTower(slotId: string): boolean {
        const slot = this._slots.find(s => s.id === slotId);
        if (!slot || !slot.towerId) return false;

        const tower = this._towers.get(slot.towerId);
        if (!tower) return false;

        return tower.upgrade();
    }

    /**
     * 清除所有塔和投射物
     */
    clear(): void {
        this._towers.clear();
        this._projectileManager.clear();
        this._slots.forEach(s => s.towerId = null);
    }

    /**
     * 重置（清除塔和投射物，保留槽位定义）
     */
    reset(): void {
        this.clear();
    }
}
