/**
 * 存档管理器
 * 负责玩家存档的读取、保存和默认值管理
 *
 * 存储通过 Platform adapter 进行，不直接调用平台 API。
 * Web 环境使用 localStorage，小游戏平台使用平台本地存储。
 */

import { Platform } from '../platform/Platform';

/** 存档数据结构 */
export interface SaveData {
    playerLevel: number;
    currentStage: number;
    highestStage: number;
    battleCoin: number;
    baseCoin: number;
    rebirthToken: number;
    baseCoreLevel: number;
    labLevel: number;
    mineLevel: number;
    reactorLevel: number;
    factoryLevel: number;
    towerLevels: Record<string, number>;
    permanentSkillLevels: Record<string, number>;
    lastOfflineTimestamp: number;
    settings: Record<string, string>;
}

/** 存档版本号，用于后续版本迁移 */
const SAVE_VERSION = 1;
const SAVE_KEY = 'starfortress_save';
const SAVE_VERSION_KEY = 'starfortress_save_version';

/** 默认存档数据 */
function getDefaultSaveData(): SaveData {
    return {
        playerLevel: 1,
        currentStage: 1,
        highestStage: 0,
        battleCoin: 0,
        baseCoin: 0,
        rebirthToken: 0,
        baseCoreLevel: 1,
        labLevel: 1,
        mineLevel: 1,
        reactorLevel: 1,
        factoryLevel: 1,
        towerLevels: {},
        permanentSkillLevels: {},
        lastOfflineTimestamp: Date.now(),
        settings: {},
    };
}

/**
 * 合并存档数据：用默认值填充缺失字段
 * 保证读取到的存档结构完整，不会因缺字段而崩溃
 */
function mergeWithDefaults(data: Partial<SaveData>): SaveData {
    const defaults = getDefaultSaveData();
    return {
        playerLevel: data.playerLevel ?? defaults.playerLevel,
        currentStage: data.currentStage ?? defaults.currentStage,
        highestStage: data.highestStage ?? defaults.highestStage,
        battleCoin: data.battleCoin ?? defaults.battleCoin,
        baseCoin: data.baseCoin ?? defaults.baseCoin,
        rebirthToken: data.rebirthToken ?? defaults.rebirthToken,
        baseCoreLevel: data.baseCoreLevel ?? defaults.baseCoreLevel,
        labLevel: data.labLevel ?? defaults.labLevel,
        mineLevel: data.mineLevel ?? defaults.mineLevel,
        reactorLevel: data.reactorLevel ?? defaults.reactorLevel,
        factoryLevel: data.factoryLevel ?? defaults.factoryLevel,
        towerLevels: data.towerLevels ?? defaults.towerLevels,
        permanentSkillLevels: data.permanentSkillLevels ?? defaults.permanentSkillLevels,
        lastOfflineTimestamp: data.lastOfflineTimestamp ?? defaults.lastOfflineTimestamp,
        settings: data.settings ?? defaults.settings,
    };
}

export class SaveManager {
    private static _instance: SaveManager | null = null;
    private _currentSave: SaveData | null = null;

    static getInstance(): SaveManager {
        if (!SaveManager._instance) {
            SaveManager._instance = new SaveManager();
        }
        return SaveManager._instance;
    }

    /**
     * 加载存档
     * 读取失败或无存档时返回默认数据
     */
    async load(): Promise<SaveData> {
        try {
            const platform = Platform.instance;
            const versionStr = await platform.getStorage(SAVE_VERSION_KEY);
            const savedVersion = versionStr ? parseInt(versionStr, 10) : 0;

            const saveStr = await platform.getStorage(SAVE_KEY);
            if (saveStr) {
                const parsed = JSON.parse(saveStr) as Partial<SaveData>;
                this._currentSave = mergeWithDefaults(parsed);

                // 版本迁移预留
                if (savedVersion < SAVE_VERSION) {
                    console.log(`[SaveManager] 存档版本 ${savedVersion} -> ${SAVE_VERSION}，已合并默认值`);
                    await this.save();
                }

                console.log('[SaveManager] 存档加载成功');
                return { ...this._currentSave };
            }
        } catch (e) {
            console.warn('[SaveManager] 加载存档失败，使用默认数据:', e);
        }

        // 无存档或读取失败，使用默认数据
        this._currentSave = getDefaultSaveData();
        console.log('[SaveManager] 无存档，使用默认数据');
        return { ...this._currentSave };
    }

    /**
     * 保存当前存档
     */
    async save(): Promise<void> {
        if (!this._currentSave) {
            console.warn('[SaveManager] 无存档数据可保存');
            return;
        }

        try {
            const platform = Platform.instance;
            await platform.setStorage(SAVE_KEY, JSON.stringify(this._currentSave));
            await platform.setStorage(SAVE_VERSION_KEY, SAVE_VERSION.toString());
            console.log('[SaveManager] 存档保存成功');
        } catch (e) {
            console.warn('[SaveManager] 保存存档失败:', e);
        }
    }

    /**
     * 获取当前存档数据（只读副本）
     * 未加载时返回默认数据
     */
    getSave(): SaveData {
        if (!this._currentSave) {
            return getDefaultSaveData();
        }
        return { ...this._currentSave };
    }

    /**
     * 更新存档字段（部分更新）
     * 更新后自动保存
     */
    async updateSave(partial: Partial<SaveData>): Promise<void> {
        if (!this._currentSave) {
            this._currentSave = getDefaultSaveData();
        }
        Object.assign(this._currentSave, partial);
        await this.save();
    }

    /**
     * 更新离线时间戳
     * 在玩家退出或切后台时调用
     */
    async updateLastOfflineTimestamp(): Promise<void> {
        await this.updateSave({ lastOfflineTimestamp: Date.now() });
    }

    /**
     * 重置存档为默认值
     * 用于星核重构后的普通资源重置（保留永久内容由调用方处理）
     */
    async resetToDefault(): Promise<SaveData> {
        this._currentSave = getDefaultSaveData();
        await this.save();
        return { ...this._currentSave };
    }

    /**
     * 删除存档
     */
    async clearSave(): Promise<void> {
        try {
            const platform = Platform.instance;
            await platform.removeStorage(SAVE_KEY);
            await platform.removeStorage(SAVE_VERSION_KEY);
            this._currentSave = null;
            console.log('[SaveManager] 存档已清除');
        } catch (e) {
            console.warn('[SaveManager] 清除存档失败:', e);
        }
    }

    /**
     * 星核重构重置：重置普通资源和进度，保留永久内容
     * 保留：rebirthToken、permanentSkillLevels、highestStage、towerLevels、settings
     * 重置：battleCoin、baseCoin、建筑等级、currentStage、lastOfflineTimestamp
     *
     * 注意：此方法只重置内存状态，不调用 save()。
     * 调用方（BaseManager）需在所有状态更新完成后统一调用 save()。
     */
    resetForRebirth(preservedRebirthToken: number, preservedPermanentSkills: Record<string, number>): void {
        const defaults = getDefaultSaveData();
        if (!this._currentSave) {
            this._currentSave = defaults;
        }

        // 保留永久字段和用户设置
        const preservedHighestStage = this._currentSave.highestStage;
        const preservedTowerLevels = { ...this._currentSave.towerLevels };
        const preservedSettings = { ...this._currentSave.settings };

        // 重置为默认值，同时保留永久内容和用户设置
        this._currentSave = {
            ...defaults,
            rebirthToken: preservedRebirthToken,
            permanentSkillLevels: preservedPermanentSkills,
            highestStage: preservedHighestStage,
            towerLevels: preservedTowerLevels,
            settings: preservedSettings,
        };

        console.log('[SaveManager] 星核重构重置完成（内存状态）');
    }
}
