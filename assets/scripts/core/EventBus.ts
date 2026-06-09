/**
 * 事件总线
 * 用于模块间通信，解耦业务逻辑
 */

export type EventCallback = (...args: any[]) => void;

export class EventBus {
    private static _instance: EventBus | null = null;
    private _listeners: Map<string, EventCallback[]> = new Map();

    static getInstance(): EventBus {
        if (!EventBus._instance) {
            EventBus._instance = new EventBus();
        }
        return EventBus._instance;
    }

    /**
     * 注册事件监听
     */
    on(event: string, callback: EventCallback): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(callback);
    }

    /**
     * 注销事件监听
     */
    off(event: string, callback: EventCallback): void {
        const callbacks = this._listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event: string, ...args: any[]): void {
        const callbacks = this._listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(...args);
                } catch (e) {
                    console.error(`EventBus: Error in callback for event "${event}":`, e);
                }
            });
        }
    }

    /**
     * 清除所有监听
     */
    clear(): void {
        this._listeners.clear();
    }
}

// 预定义事件常量
export const BATTLE_EVENTS = {
    BATTLE_START: 'battle:start',
    BATTLE_PAUSE: 'battle:pause',
    BATTLE_RESUME: 'battle:resume',
    BATTLE_END: 'battle:end',
    BATTLE_SETTLEMENT: 'battle:settlement',
    ENEMY_SPAWN: 'enemy:spawn',
    ENEMY_DEATH: 'enemy:death',
    ENEMY_REACH_BASE: 'enemy:reach_base',
    BASE_HEALTH_CHANGE: 'base:health_change',
    STAGE_WAVE_START: 'stage:wave_start',
    STAGE_BOSS_SPAWN: 'stage:boss_spawn',
    TIME_UPDATE: 'time:update',
    BATTLE_RESULT: 'battle:result',
    // 肉鸽选择事件
    ROGUE_CHOICE_TRIGGER: 'rogue:choice_trigger',
    ROGUE_CHOICE_SELECT: 'rogue:choice_select',
    ROGUE_CHOICE_COMPLETE: 'rogue:choice_complete',
    // 主动技能事件
    SKILL_USE: 'skill:use',
    SKILL_CHARGE_CHANGE: 'skill:charge_change',
    SKILL_ORBITAL_CANNON: 'skill:orbital_cannon',
    SKILL_FREEZE: 'skill:freeze',
    // 战斗暂停/恢复（用于肉鸽选择期间）
    BATTLE_FORCE_PAUSE: 'battle:force_pause',
    BATTLE_FORCE_RESUME: 'battle:force_resume',
    // 放置阶段完成（区别于 BATTLE_START，不触发自动放置）
    BATTLE_PLACEMENT_COMPLETE: 'battle:placement_complete',
    // 放置收益事件
    IDLE_INCOME_TICK: 'idle:income_tick',
    OFFLINE_REWARD_READY: 'idle:offline_reward_ready',
    OFFLINE_REWARD_CLAIMED: 'idle:offline_reward_claimed',
    // 星核重构事件
    REBIRTH_COMPLETE: 'rebirth:complete',
    PERMANENT_SKILL_UPGRADE: 'rebirth:skill_upgrade',
    // 可视化事件（011.5-battle-visual-demo）
    TOWER_PLACED: 'tower:placed',
    TOWER_ATTACK: 'tower:attack',
} as const;