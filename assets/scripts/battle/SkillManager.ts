/**
 * 主动技能管理器
 * 管理主动技能的充能次数和释放逻辑
 */

import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { ActiveSkillConfig, ACTIVE_SKILL_CONFIGS } from '../data/SkillConfig';
import { EnemyController } from './EnemyController';

export interface SkillState {
    skillId: string;
    config: ActiveSkillConfig;
    charges: number;
    isReady: boolean;
}

export class SkillManager {
    private _eventBus: EventBus;
    private _skills: Map<string, SkillState> = new Map();

    constructor() {
        this._eventBus = EventBus.getInstance();
        this._setupEventListeners();
    }

    /**
     * 初始化技能（每局开始时调用）
     */
    init(): void {
        this._skills.clear();

        ACTIVE_SKILL_CONFIGS.forEach(config => {
            this._skills.set(config.id, {
                skillId: config.id,
                config,
                charges: config.initialCharges,
                isReady: config.initialCharges > 0,
            });
        });
    }

    /**
     * 重置技能状态
     */
    reset(): void {
        this.init();
    }

    /**
     * 使用技能
     * @param skillId 技能ID
     * @param enemies 当前存活敌人列表（用于轨道炮目标选择）
     * @returns 是否使用成功（无充能或无有效目标时返回 false，不扣除充能）
     */
    useSkill(skillId: string, enemies: EnemyController[]): boolean {
        const skill = this._skills.get(skillId);
        if (!skill || skill.charges <= 0) {
            console.warn(`SkillManager: Skill ${skillId} has no charges`);
            return false;
        }

        // 执行技能效果，返回是否实际生效
        let effective = false;
        switch (skillId) {
            case 'skill_orbital_cannon':
                effective = this._executeOrbitalCannon(skill.config, enemies);
                break;
            case 'skill_freeze':
                effective = this._executeFreeze(skill.config, enemies);
                break;
            default:
                console.warn(`SkillManager: Unknown skill ${skillId}`);
                return false;
        }

        // 未生效（如无存活敌人），不扣除充能
        if (!effective) {
            return false;
        }

        // 消耗充能
        skill.charges--;
        skill.isReady = skill.charges > 0;

        // 通知充能变化
        this._eventBus.emit(BATTLE_EVENTS.SKILL_CHARGE_CHANGE, {
            skillId,
            chargeDelta: -1,
            remainingCharges: skill.charges,
        });

        // 通知技能使用
        this._eventBus.emit(BATTLE_EVENTS.SKILL_USE, {
            skillId,
            remainingCharges: skill.charges,
        });

        return true;
    }

    /**
     * 执行轨道炮：对敌人最密集区域造成高额伤害
     * @returns 是否实际命中敌人
     */
    private _executeOrbitalCannon(config: ActiveSkillConfig, enemies: EnemyController[]): boolean {
        if (!config.damage) return false;

        const aliveEnemies = enemies.filter(e => e.isAlive());
        if (aliveEnemies.length === 0) return false;

        // 找到最密集的敌人区域
        const targetPos = this._findDensestPosition(aliveEnemies);
        const hitRadius = 100; // 命中半径（像素）

        // 对范围内所有敌人造成伤害
        let hitCount = 0;
        aliveEnemies.forEach(enemy => {
            const pos = enemy.getPosition();
            const dx = pos.x - targetPos.x;
            const dy = pos.y - targetPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= hitRadius) {
                enemy.takeDamage(config.damage!);
                hitCount++;
            }
        });

        console.log(`[SkillManager] 轨道炮命中 ${hitCount} 个敌人，中心点 (${targetPos.x.toFixed(0)}, ${targetPos.y.toFixed(0)})`);

        // 触发轨道炮事件（用于特效显示）
        this._eventBus.emit(BATTLE_EVENTS.SKILL_ORBITAL_CANNON, {
            position: targetPos,
            radius: hitRadius,
            damage: config.damage,
            hitCount,
        });

        return hitCount > 0;
    }

    /**
     * 执行全屏冻结：使所有敌人停止移动 2 秒
     * @returns 是否实际冻结了敌人
     */
    private _executeFreeze(config: ActiveSkillConfig, enemies: EnemyController[]): boolean {
        const duration = config.duration || 2;
        const aliveEnemies = enemies.filter(e => e.isAlive());

        if (aliveEnemies.length === 0) return false;

        // 对所有存活敌人施加完全减速（slowFactor = 1.0）
        aliveEnemies.forEach(enemy => {
            enemy.applySlow(1.0, duration);
        });

        console.log(`[SkillManager] 全屏冻结 ${aliveEnemies.length} 个敌人，持续 ${duration} 秒`);

        // 触发冻结事件（用于特效显示）
        this._eventBus.emit(BATTLE_EVENTS.SKILL_FREEZE, {
            duration,
            targetCount: aliveEnemies.length,
        });

        return true;
    }

    /**
     * 找到敌人最密集的位置
     * 使用密度估算法：对每个敌人计算周围半径内敌人数量
     */
    private _findDensestPosition(enemies: EnemyController[]): { x: number; y: number } {
        if (enemies.length === 0) return { x: 540, y: 360 }; // 默认屏幕中心
        if (enemies.length === 1) return enemies[0].getPosition();

        const searchRadius = 120;
        let bestPos = enemies[0].getPosition();
        let bestCount = 0;

        for (const enemy of enemies) {
            const pos = enemy.getPosition();
            let count = 0;

            for (const other of enemies) {
                const otherPos = other.getPosition();
                const dx = otherPos.x - pos.x;
                const dy = otherPos.y - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= searchRadius) {
                    count++;
                }
            }

            if (count > bestCount) {
                bestCount = count;
                bestPos = pos;
            }
        }

        return bestPos;
    }

    /**
     * 增加技能充能
     */
    addCharge(skillId: string, amount: number): void {
        const skill = this._skills.get(skillId);
        if (!skill) return;

        skill.charges += amount;
        skill.isReady = skill.charges > 0;

        this._eventBus.emit(BATTLE_EVENTS.SKILL_CHARGE_CHANGE, {
            skillId,
            chargeDelta: amount,
            remainingCharges: skill.charges,
        });
    }

    /**
     * 设置事件监听
     */
    private _setupEventListeners(): void {
        // 监听技能充能变化（来自肉鸽选择）
        this._eventBus.on(BATTLE_EVENTS.SKILL_CHARGE_CHANGE, (data: { skillId: string; chargeDelta: number }) => {
            // 如果是增加充能（来自肉鸽选择），且不是由 useSkill 触发的减少
            if (data.chargeDelta > 0) {
                const skill = this._skills.get(data.skillId);
                if (skill) {
                    skill.charges += data.chargeDelta;
                    skill.isReady = skill.charges > 0;
                }
            }
        });
    }

    /**
     * 获取技能状态
     */
    getSkillState(skillId: string): SkillState | undefined {
        return this._skills.get(skillId);
    }

    /**
     * 获取所有技能状态
     */
    getAllSkillStates(): SkillState[] {
        return Array.from(this._skills.values());
    }

    /**
     * 检查技能是否可用
     */
    canUseSkill(skillId: string): boolean {
        const skill = this._skills.get(skillId);
        return skill !== undefined && skill.charges > 0;
    }

    /**
     * 获取技能剩余充能
     */
    getCharges(skillId: string): number {
        return this._skills.get(skillId)?.charges ?? 0;
    }
}
