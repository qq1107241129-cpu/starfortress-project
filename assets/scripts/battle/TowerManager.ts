/**
 * 塔管理器
 * 管理所有塔实例：创建、更新、目标选择、攻击调度
 */

import { TowerController } from './TowerController';
import { ProjectileManager } from './ProjectileManager';
import { EnemyController } from './EnemyController';
import { getTowerConfig, getTowerGlobalLevelCap } from '../data/TowerConfig';
import { RogueUpgradeConfig } from '../data/SkillConfig';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { BaseManager } from '../base/BaseManager';

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
    private _eventBus: EventBus;

    constructor(slots: TowerSlot[]) {
        this._slots = slots.map(s => ({ ...s, towerId: null }));
        this._projectileManager = new ProjectileManager();
        this._eventBus = EventBus.getInstance();
    }

    /**
     * 在指定槽位放置塔
     * @param slotId 槽位ID
     * @param towerConfigId 塔配置ID
     * @param level 塔等级
     * @returns 是否放置成功
     */
    placeTower(slotId: string, towerConfigId: string, level: number = 1): boolean {
        console.log(`[TowerManager] placeTower: slotId=${slotId}, towerConfigId=${towerConfigId}, level=${level}`);

        const slot = this._slots.find(s => s.id === slotId);
        if (!slot) {
            console.warn(`[TowerManager] slot not found: ${slotId}`);
            return false;
        }
        if (slot.towerId) {
            console.warn(`[TowerManager] slot ${slotId} already has tower: ${slot.towerId}`);
            return false;
        }

        const config = getTowerConfig(towerConfigId);
        if (!config) {
            console.warn(`[TowerManager] tower config not found: ${towerConfigId}`);
            return false;
        }

        const tower = new TowerController(towerConfigId, config, level, slot.position);

        // 计算等级上限：min(局外上限, 基地总上限)（020）
        const externalCap = this._getExternalLevelCap(towerConfigId);
        const globalCap = this._getGlobalLevelCap();
        tower.setMaxLevelCap(Math.min(externalCap, globalCap));
        console.log(`[TowerManager] 塔等级上限: ${tower.getMaxLevelCap()} (局外: ${externalCap}, 全局: ${globalCap})`);

        this._towers.set(tower.getId(), tower);
        slot.towerId = tower.getId();

        // 发射塔放置事件
        this._eventBus.emit(BATTLE_EVENTS.TOWER_PLACED, {
            towerId: tower.getId(),
            configId: towerConfigId,
            slotId: slotId,
            position: slot.position,
            level: level,
        });

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
        const targetPos = target.getPosition();

        switch (tower.getType()) {
            case 'machinegun_tower':
                // 单体高频攻击：直接发射单体投射物
                this._projectileManager.createSingle(towerPos, target.getId(), attack);
                break;

            case 'cannon_tower':
                // 范围伤害：发射范围投射物
                this._projectileManager.createSplash(
                    towerPos,
                    target.getId(),
                    attack,
                    tower.getSplashRadius()
                );
                break;

            case 'ice_tower':
                // 减速攻击：发射减速投射物
                this._projectileManager.createIce(
                    towerPos,
                    target.getId(),
                    attack,
                    tower.getSlowFactor(),
                    tower.getSlowDuration()
                );
                break;

            case 'electric_tower':
                // 链式攻击：发射链式投射物
                this._projectileManager.createChain(
                    towerPos,
                    target.getId(),
                    attack,
                    tower.getChainCount()
                );
                break;
        }

        // 发射攻击事件（用于可视化）
        this._eventBus.emit(BATTLE_EVENTS.TOWER_ATTACK, {
            towerId: tower.getId(),
            towerType: tower.getType(),
            towerPosition: towerPos,
            targetId: target.getId(),
            targetPosition: targetPos,
        });
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
     * 升级指定槽位的塔（020: 返回升级信息，由 BattleManager 处理合金扣除）
     * @returns 升级信息：成功、成本、原因
     */
    upgradeTower(slotId: string): { success: boolean; costAlloy: number; reason?: string } {
        const slot = this._slots.find(s => s.id === slotId);
        if (!slot || !slot.towerId) return { success: false, costAlloy: 0, reason: 'slot_empty' };

        const tower = this._towers.get(slot.towerId);
        if (!tower) return { success: false, costAlloy: 0, reason: 'tower_not_found' };

        if (tower.isAtMaxLevel()) return { success: false, costAlloy: 0, reason: 'max_level' };

        const costAlloy = tower.getUpgradeCostAlloy();
        return { success: true, costAlloy };
    }

    /**
     * 执行塔升级（由 BattleManager 调用）
     */
    executeUpgrade(slotId: string): boolean {
        const slot = this._slots.find(s => s.id === slotId);
        if (!slot || !slot.towerId) return false;

        const tower = this._towers.get(slot.towerId);
        if (!tower) return false;

        return tower.upgrade();
    }

    /**
     * 获取局外塔等级上限（从存档读取）（020）
     */
    private _getExternalLevelCap(towerConfigId: string): number {
        try {
            const saveMgr = BaseManager.getInstance().getSaveManager();
            const save = saveMgr.getSave();
            return save.towerLevels?.[towerConfigId] ?? 1;
        } catch {
            return 1;
        }
    }

    /**
     * 获取基地核心等级决定的全局上限（020）
     */
    private _getGlobalLevelCap(): number {
        try {
            const baseCoreLevel = BaseManager.getInstance().getBaseCoreLevel();
            return getTowerGlobalLevelCap(baseCoreLevel);
        } catch {
            return 6; // 兜底
        }
    }

    /**
     * 应用肉鸽强化效果
     * @param upgrade 肉鸽强化配置
     */
    applyRogueUpgrade(upgrade: RogueUpgradeConfig): void {
        this._towers.forEach(tower => {
            switch (upgrade.type) {
                case 'tower_attack':
                    // 全局攻击加成（target 为空）或特定类型塔加成
                    if (!upgrade.target || tower.getType() === upgrade.target) {
                        tower.applyAttackBonus(upgrade.value);
                    }
                    break;

                case 'tower_speed':
                    // 射速加成（target 为塔类型）
                    if (!upgrade.target || tower.getType() === upgrade.target) {
                        tower.applySpeedBonus(upgrade.value);
                    }
                    break;

                case 'tower_range':
                    // 范围加成（target 为塔类型）
                    if (!upgrade.target || tower.getType() === upgrade.target) {
                        tower.applyRangeBonus(upgrade.value);
                    }
                    break;

                case 'tower_chain_count':
                    // 弹射次数加成（target 为塔类型，如 electric）
                    if (!upgrade.target || tower.getType() === upgrade.target) {
                        tower.applyChainCountBonus(upgrade.value);
                    }
                    break;

                case 'tower_slow_effect':
                    // 减速效果加成（target 为塔类型，如 ice）
                    if (!upgrade.target || tower.getType() === upgrade.target) {
                        tower.applySlowBonus(upgrade.value);
                    }
                    break;
            }
        });

        console.log(`[TowerManager] 应用肉鸽强化: ${upgrade.name} (${upgrade.type})`);
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
