/**
 * 塔升级 UI
 * 显示塔列表、等级、属性和升级按钮
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建塔升级界面节点
 * 2. 挂载此组件
 * 3. 绑定塔槽位节点和 Label
 *
 * 限制说明（MVP）：
 * - 塔升级在战斗外进行，通过 BaseManager 获取塔配置数据
 * - 升级消耗战斗金币，效果在下次战斗中生效
 * - 塔等级通过 SaveManager 持久化（towerLevels 字段）
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { GameManager } from '../core/GameManager';
import { BaseManager } from '../base/BaseManager';
import { getTowerConfig, getTowerLevelConfig, TOWER_CONFIGS } from '../data/TowerConfig';

const { ccclass, property } = _decorator;

@ccclass('TowerUpgradeUI')
export class TowerUpgradeUI extends Component {
    // ==================== 面板 ====================
    @property(Node)
    towerPanel: Node | null = null;

    // ==================== 塔列表（4 个槽位对应 4 种 MVP 塔） ====================
    @property({ type: [Node] })
    towerSlots: Node[] = [];

    @property({ type: [Label] })
    towerNameLabels: Label[] = [];

    @property({ type: [Label] })
    towerLevelLabels: Label[] = [];

    @property({ type: [Label] })
    towerAttackLabels: Label[] = [];

    @property({ type: [Label] })
    towerSpeedLabels: Label[] = [];

    @property({ type: [Label] })
    towerRangeLabels: Label[] = [];

    @property({ type: [Label] })
    towerCostLabels: Label[] = [];

    @property({ type: [Button] })
    towerUpgradeButtons: Button[] = [];

    // ==================== 资源显示 ====================
    @property(Label)
    battleCoinLabel: Label | null = null;

    // ==================== 返回按钮 ====================
    @property(Node)
    backButton: Node | null = null;

    // ==================== 内部状态 ====================
    private _gameManager: GameManager | null = null;
    private _baseManager: BaseManager | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // 绑定回调引用
    private _boundOnBack: (() => void) | null = null;
    private _towerUpgradeButtonListeners: Array<{ node: Node; handler: () => void }> = [];

    // 当前塔等级缓存（configId -> level）
    private _towerLevels: Map<string, number> = new Map();

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._gameManager = GameManager.getInstance();
        this._baseManager = BaseManager.getInstance();

        // 绑定返回按钮
        if (this.backButton) {
            this._boundOnBack = () => this._onBack();
            this.backButton.on(Node.EventType.TOUCH_END, this._boundOnBack);
        }

        // 绑定升级按钮
        this._setupUpgradeButtons();

        // 默认隐藏
        this.node.active = false;

        // 监听状态变化
        this._unsubStateChange = this._gameManager.onStateChange((state) => {
            this.node.active = (state === 'towerUpgrade');
            if (state === 'towerUpgrade') {
                this._loadTowerLevels();
                this._refreshUI();
            }
        });
    }

    onDestroy(): void {
        if (this.backButton && this._boundOnBack) {
            this.backButton.off(Node.EventType.TOUCH_END, this._boundOnBack);
        }
        for (const entry of this._towerUpgradeButtonListeners) {
            entry.node.off(Node.EventType.TOUCH_END, entry.handler);
        }
        this._towerUpgradeButtonListeners = [];
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        this._gameManager = null;
        this._baseManager = null;
    }

    // ==================== 塔等级管理 ====================

    /**
     * 从存档加载塔等级
     */
    private _loadTowerLevels(): void {
        if (!this._baseManager) return;
        const saveMgr = this._baseManager.getSaveManager();
        const save = saveMgr.getSave();
        this._towerLevels.clear();
        for (const config of TOWER_CONFIGS) {
            const level = save.towerLevels[config.id] ?? 1;
            this._towerLevels.set(config.id, level);
        }
    }

    /**
     * 获取指定塔的当前等级
     */
    private _getTowerLevel(configId: string): number {
        return this._towerLevels.get(configId) ?? 1;
    }

    // ==================== 按钮设置 ====================

    private _setupUpgradeButtons(): void {
        for (let i = 0; i < this.towerUpgradeButtons.length; i++) {
            const btn = this.towerUpgradeButtons[i];
            if (!btn) continue;

            const handler = () => this._onUpgradeTower(i);
            btn.node.on(Node.EventType.TOUCH_END, handler);
            this._towerUpgradeButtonListeners.push({ node: btn.node, handler });
        }
    }

    // ==================== 按钮事件 ====================

    private _onUpgradeTower(index: number): void {
        if (!this._baseManager) return;

        const configs = TOWER_CONFIGS;
        if (index < 0 || index >= configs.length) return;

        const config = configs[index];
        const currentLevel = this._getTowerLevel(config.id);
        const nextLevelConfig = getTowerLevelConfig(config.id, currentLevel + 1);

        if (!nextLevelConfig) {
            console.log(`[TowerUpgradeUI] ${config.name} 已达最高等级`);
            return;
        }

        // 检查战斗金币是否足够
        const battleCoin = this._baseManager.getBattleCoin();
        if (battleCoin < nextLevelConfig.upgradeCost) {
            console.log(`[TowerUpgradeUI] 战斗金币不足: 需要 ${nextLevelConfig.upgradeCost}, 当前 ${battleCoin}`);
            return;
        }

        // 扣除战斗金币
        const spent = this._baseManager.spendBattleCoin(nextLevelConfig.upgradeCost);
        if (!spent) return;

        // 更新塔等级
        const newLevel = currentLevel + 1;
        this._towerLevels.set(config.id, newLevel);

        // 持久化到存档
        const saveMgr = this._baseManager.getSaveManager();
        const towerLevelsObj: Record<string, number> = {};
        this._towerLevels.forEach((level, id) => {
            towerLevelsObj[id] = level;
        });
        saveMgr.updateSave({ towerLevels: towerLevelsObj });

        console.log(`[TowerUpgradeUI] ${config.name} 升级到 Lv.${newLevel}`);
        this._refreshUI();
    }

    private _onBack(): void {
        this._gameManager?.returnToMain();
    }

    // ==================== UI 刷新 ====================

    private _refreshUI(): void {
        // 刷新资源显示
        if (this.battleCoinLabel && this._baseManager) {
            this.battleCoinLabel.string = `战斗金币: ${this._baseManager.getBattleCoin()}`;
        }

        this._updateTowerSlots();
    }

    private _updateTowerSlots(): void {
        const configs = TOWER_CONFIGS;

        for (let i = 0; i < this.towerSlots.length; i++) {
            const slot = this.towerSlots[i];
            if (!slot) continue;

            if (i < configs.length) {
                slot.active = true;
                this._updateSlotDisplay(i, configs[i]);
            } else {
                slot.active = false;
            }
        }
    }

    private _updateSlotDisplay(index: number, config: typeof TOWER_CONFIGS[0]): void {
        const currentLevel = this._getTowerLevel(config.id);
        const currentLevelConfig = getTowerLevelConfig(config.id, currentLevel);
        const nextLevelConfig = getTowerLevelConfig(config.id, currentLevel + 1);
        const maxLevel = config.levels.length;
        const canUpgrade = nextLevelConfig !== null;
        const upgradeCost = nextLevelConfig?.upgradeCost ?? 0;

        // 检查是否买得起
        let canAfford = false;
        if (canUpgrade && this._baseManager) {
            canAfford = this._baseManager.getBattleCoin() >= upgradeCost;
        }

        if (index < this.towerNameLabels.length && this.towerNameLabels[index]) {
            this.towerNameLabels[index].string = config.name;
        }
        if (index < this.towerLevelLabels.length && this.towerLevelLabels[index]) {
            this.towerLevelLabels[index].string = `Lv.${currentLevel}/${maxLevel}`;
        }
        if (index < this.towerAttackLabels.length && this.towerAttackLabels[index]) {
            const attack = currentLevelConfig?.attack ?? 0;
            this.towerAttackLabels[index].string = `攻击: ${attack}`;
        }
        if (index < this.towerSpeedLabels.length && this.towerSpeedLabels[index]) {
            const speed = currentLevelConfig?.attackSpeed ?? 0;
            this.towerSpeedLabels[index].string = `射速: ${speed.toFixed(1)}s`;
        }
        if (index < this.towerRangeLabels.length && this.towerRangeLabels[index]) {
            const range = currentLevelConfig?.range ?? 0;
            this.towerRangeLabels[index].string = `射程: ${range}`;
        }
        if (index < this.towerCostLabels.length && this.towerCostLabels[index]) {
            if (canUpgrade) {
                this.towerCostLabels[index].string = `升级: ${upgradeCost} 战斗金币`;
            } else {
                this.towerCostLabels[index].string = '已满级';
            }
        }
        if (index < this.towerUpgradeButtons.length && this.towerUpgradeButtons[index]) {
            this.towerUpgradeButtons[index].interactable = canUpgrade && canAfford;
        }
    }
}
