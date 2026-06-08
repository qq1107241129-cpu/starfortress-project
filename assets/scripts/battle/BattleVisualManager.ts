/**
 * BattleVisualManager - 战斗可视化管理器
 * 管理塔、敌人、攻击特效的显示
 * 监听战斗事件，将逻辑对象映射为可见节点
 */

import { _decorator, Component, Node, Graphics, Color, UITransform } from 'cc';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { GameManager, GameFlowState } from '../core/GameManager';
import { BattleManager } from './BattleManager';
import { EnemyView } from './EnemyView';
import { TowerView } from './TowerView';
import { AttackEffectView } from './AttackEffectView';

const { ccclass, property } = _decorator;

@ccclass('BattleVisualManager')
export class BattleVisualManager extends Component {
    @property(Node)
    towerLayer: Node | null = null;

    @property(Node)
    enemyLayer: Node | null = null;

    @property(Node)
    effectLayer: Node | null = null;

    @property(Node)
    pathLayer: Node | null = null;

    private _eventBus: EventBus | null = null;
    private _battleManager: BattleManager | null = null;
    private _gameManager: GameManager | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // 敌人视图映射：enemyId -> EnemyView
    private _enemyViews: Map<string, EnemyView> = new Map();

    // 塔视图映射：towerId -> TowerView
    private _towerViews: Map<string, TowerView> = new Map();

    // 槽位视图映射：slotId -> Node（用于显示空槽位）
    private _slotViews: Map<string, Node> = new Map();

    private _isInitialized: boolean = false;

    // 保存绑定回调引用，用于正确解绑
    private _boundOnBattleStart: ((data: any) => void) | null = null;
    private _boundOnBattleEnd: (() => void) | null = null;
    private _boundOnEnemySpawn: ((data: any) => void) | null = null;
    private _boundOnEnemyDeath: ((data: any) => void) | null = null;
    private _boundOnEnemyReachBase: ((data: any) => void) | null = null;
    private _boundOnTowerPlaced: ((data: any) => void) | null = null;
    private _boundOnTowerAttack: ((data: any) => void) | null = null;

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._battleManager = BattleManager.getInstance();
        this._gameManager = GameManager.getInstance();

        // 默认隐藏（与 Cocos Creator 编辑器中设置一致）
        this.node.active = false;

        // 监听状态变化：battle 状态时显示，其他状态隐藏
        this._unsubStateChange = this._gameManager.onStateChange((state: GameFlowState) => {
            this.node.active = (state === 'battle');
        });

        // 确保层级节点存在
        this._ensureLayers();

        // 注册事件监听
        this._setupEventListeners();
    }

    /**
     * 确保层级节点存在
     */
    private _ensureLayers(): void {
        if (!this.towerLayer) {
            this.towerLayer = new Node('TowerLayer');
            this.towerLayer.parent = this.node;
        }
        if (!this.enemyLayer) {
            this.enemyLayer = new Node('EnemyLayer');
            this.enemyLayer.parent = this.node;
        }
        if (!this.effectLayer) {
            this.effectLayer = new Node('EffectLayer');
            this.effectLayer.parent = this.node;
        }
        if (!this.pathLayer) {
            this.pathLayer = new Node('PathLayer');
            this.pathLayer.parent = this.node;
        }
    }

    /**
     * 注册事件监听（使用绑定回调确保正确解绑）
     */
    private _setupEventListeners(): void {
        if (!this._eventBus) return;

        // 创建绑定回调
        this._boundOnBattleStart = this._onBattleStart.bind(this);
        this._boundOnBattleEnd = this._onBattleEnd.bind(this);
        this._boundOnEnemySpawn = this._onEnemySpawn.bind(this);
        this._boundOnEnemyDeath = this._onEnemyDeath.bind(this);
        this._boundOnEnemyReachBase = this._onEnemyReachBase.bind(this);
        this._boundOnTowerPlaced = this._onTowerPlaced.bind(this);
        this._boundOnTowerAttack = this._onTowerAttack.bind(this);

        // 注册事件
        this._eventBus.on(BATTLE_EVENTS.BATTLE_START, this._boundOnBattleStart);
        this._eventBus.on(BATTLE_EVENTS.BATTLE_END, this._boundOnBattleEnd);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_SPAWN, this._boundOnEnemySpawn);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_DEATH, this._boundOnEnemyDeath);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_REACH_BASE, this._boundOnEnemyReachBase);
        this._eventBus.on(BATTLE_EVENTS.TOWER_PLACED, this._boundOnTowerPlaced);
        this._eventBus.on(BATTLE_EVENTS.TOWER_ATTACK, this._boundOnTowerAttack);
    }

    /**
     * 战斗开始事件处理
     */
    private _onBattleStart(data: any): void {
        console.log('[BattleVisualManager] 战斗开始，初始化可视化');
        this._isInitialized = true;

        // 显示路径
        this._showPath();

        // 显示空槽位
        this._showEmptySlots();
    }

    /**
     * 战斗结束事件处理
     */
    private _onBattleEnd(): void {
        console.log('[BattleVisualManager] 战斗结束，清理可视化');
        this._clearAll();
        this._isInitialized = false;
    }

    /**
     * 敌人生成事件处理
     */
    private _onEnemySpawn(data: any): void {
        if (!this._isInitialized || !this.enemyLayer) return;

        const { enemyId, configId, position } = data;

        // 创建敌人节点
        const enemyNode = new Node(`Enemy_${enemyId}`);
        enemyNode.parent = this.enemyLayer;

        // 使用 Graphics 绘制可见图形
        const graphics = enemyNode.addComponent(Graphics);
        const transform = enemyNode.addComponent(UITransform);
        transform.setContentSize(30, 30);

        // 添加 EnemyView 组件
        const enemyView = enemyNode.addComponent(EnemyView);
        enemyView.init(enemyId, configId, position);

        this._enemyViews.set(enemyId, enemyView);
    }

    /**
     * 敌人死亡事件处理
     */
    private _onEnemyDeath(data: any): void {
        const { enemyId } = data;
        this._removeEnemyView(enemyId);
    }

    /**
     * 敌人到达基地事件处理
     */
    private _onEnemyReachBase(data: any): void {
        const { enemyId } = data;
        this._removeEnemyView(enemyId);
    }

    /**
     * 塔放置事件处理
     */
    private _onTowerPlaced(data: any): void {
        if (!this._isInitialized || !this.towerLayer) return;

        const { towerId, configId, slotId, position, level } = data;

        // 创建塔节点
        const towerNode = new Node(`Tower_${towerId}`);
        towerNode.parent = this.towerLayer;

        // 使用 Graphics 绘制可见图形
        const graphics = towerNode.addComponent(Graphics);
        const transform = towerNode.addComponent(UITransform);
        transform.setContentSize(40, 40);

        // 添加 TowerView 组件
        const towerView = towerNode.addComponent(TowerView);
        towerView.init(towerId, configId, slotId, position);

        this._towerViews.set(towerId, towerView);

        // 隐藏对应的空槽位
        const slotView = this._slotViews.get(slotId);
        if (slotView) {
            slotView.active = false;
        }
    }

    /**
     * 塔攻击事件处理
     */
    private _onTowerAttack(data: any): void {
        if (!this._isInitialized || !this.effectLayer) return;

        const { towerId, towerType, towerPosition, targetId, targetPosition } = data;

        // 塔攻击反馈
        const towerView = this._towerViews.get(towerId);
        if (towerView) {
            towerView.playAttackFeedback();
        }

        // 创建攻击特效
        this._createAttackEffect(towerType, towerPosition, targetPosition);
    }

    /**
     * 创建攻击特效
     */
    private _createAttackEffect(
        towerType: string,
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): void {
        if (!this.effectLayer) return;

        const effectNode = new Node('AttackEffect');
        effectNode.parent = this.effectLayer;

        const effectView = effectNode.addComponent(AttackEffectView);
        const color = AttackEffectView.getTowerAttackColor(towerType);
        effectView.initAttackLine(fromPos, toPos, color, 3);
    }

    /**
     * 移除敌人视图
     */
    private _removeEnemyView(enemyId: string): void {
        const enemyView = this._enemyViews.get(enemyId);
        if (enemyView) {
            enemyView.node.destroy();
            this._enemyViews.delete(enemyId);
        }
    }

    /**
     * 显示路径（使用 Graphics 绘制）
     */
    private _showPath(): void {
        if (!this._battleManager || !this.pathLayer) return;

        const path = this._battleManager.getPath();
        if (path.length < 2) return;

        // 清除旧的路径显示
        this.pathLayer.removeAllChildren();

        // 创建路径绘制节点
        const pathDrawNode = new Node('PathDraw');
        pathDrawNode.parent = this.pathLayer;

        const graphics = pathDrawNode.addComponent(Graphics);
        const transform = pathDrawNode.addComponent(UITransform);
        transform.setContentSize(1200, 800);

        // 绘制路径线
        graphics.strokeColor = new Color(100, 100, 100, 150);
        graphics.lineWidth = 4;
        graphics.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            graphics.lineTo(path[i].x, path[i].y);
        }
        graphics.stroke();

        // 绘制路径点
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            graphics.fillColor = new Color(150, 150, 150, 200);
            graphics.circle(point.x, point.y, 8);
            graphics.fill();
        }
    }

    /**
     * 显示空槽位（使用 Graphics 绘制）
     */
    private _showEmptySlots(): void {
        if (!this._battleManager || !this.towerLayer) return;

        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) return;

        const slots = towerManager.getSlots();

        for (const slot of slots) {
            const slotNode = new Node(`Slot_${slot.id}`);
            slotNode.parent = this.towerLayer;
            slotNode.setPosition(slot.position.x, slot.position.y, 0);

            const transform = slotNode.addComponent(UITransform);
            transform.setContentSize(50, 50);

            // 使用 Graphics 绘制矩形槽位
            const graphics = slotNode.addComponent(Graphics);
            graphics.fillColor = new Color(80, 80, 80, 200);
            graphics.rect(-25, -25, 50, 50);
            graphics.fill();

            // 绘制边框
            graphics.strokeColor = new Color(120, 120, 120, 255);
            graphics.lineWidth = 2;
            graphics.rect(-25, -25, 50, 50);
            graphics.stroke();

            this._slotViews.set(slot.id, slotNode);
        }
    }

    /**
     * 清除所有可视化
     */
    private _clearAll(): void {
        // 清除敌人视图
        this._enemyViews.forEach(view => {
            if (view.node && view.node.isValid) {
                view.node.destroy();
            }
        });
        this._enemyViews.clear();

        // 清除塔视图
        this._towerViews.forEach(view => {
            if (view.node && view.node.isValid) {
                view.node.destroy();
            }
        });
        this._towerViews.clear();

        // 清除槽位视图
        this._slotViews.forEach(node => {
            if (node && node.isValid) {
                node.destroy();
            }
        });
        this._slotViews.clear();

        // 清除层级子节点
        if (this.towerLayer) this.towerLayer.removeAllChildren();
        if (this.enemyLayer) this.enemyLayer.removeAllChildren();
        if (this.effectLayer) this.effectLayer.removeAllChildren();
        if (this.pathLayer) this.pathLayer.removeAllChildren();
    }

    update(deltaTime: number): void {
        if (!this._isInitialized) return;

        // 同步敌人位置
        this._syncEnemyPositions();

        // 同步敌人血量
        this._syncEnemyHealth();
    }

    /**
     * 同步敌人位置
     */
    private _syncEnemyPositions(): void {
        if (!this._battleManager) return;

        const aliveEnemies = this._battleManager.getAliveEnemies();

        for (const enemy of aliveEnemies) {
            const enemyId = enemy.getId();
            const enemyView = this._enemyViews.get(enemyId);

            if (enemyView) {
                const position = enemy.getPosition();
                enemyView.updatePosition(position);
            }
        }
    }

    /**
     * 同步敌人血量
     */
    private _syncEnemyHealth(): void {
        if (!this._battleManager) return;

        const aliveEnemies = this._battleManager.getAliveEnemies();

        for (const enemy of aliveEnemies) {
            const enemyId = enemy.getId();
            const enemyView = this._enemyViews.get(enemyId);

            if (enemyView) {
                const healthPercent = enemy.getHealthPercent();
                enemyView.updateHealth(healthPercent);
            }
        }
    }

    onDestroy(): void {
        // 取消状态监听
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }
        // 取消事件监听（使用保存的绑定回调引用）
        if (this._eventBus) {
            if (this._boundOnBattleStart) {
                this._eventBus.off(BATTLE_EVENTS.BATTLE_START, this._boundOnBattleStart);
            }
            if (this._boundOnBattleEnd) {
                this._eventBus.off(BATTLE_EVENTS.BATTLE_END, this._boundOnBattleEnd);
            }
            if (this._boundOnEnemySpawn) {
                this._eventBus.off(BATTLE_EVENTS.ENEMY_SPAWN, this._boundOnEnemySpawn);
            }
            if (this._boundOnEnemyDeath) {
                this._eventBus.off(BATTLE_EVENTS.ENEMY_DEATH, this._boundOnEnemyDeath);
            }
            if (this._boundOnEnemyReachBase) {
                this._eventBus.off(BATTLE_EVENTS.ENEMY_REACH_BASE, this._boundOnEnemyReachBase);
            }
            if (this._boundOnTowerPlaced) {
                this._eventBus.off(BATTLE_EVENTS.TOWER_PLACED, this._boundOnTowerPlaced);
            }
            if (this._boundOnTowerAttack) {
                this._eventBus.off(BATTLE_EVENTS.TOWER_ATTACK, this._boundOnTowerAttack);
            }
        }

        this._boundOnBattleStart = null;
        this._boundOnBattleEnd = null;
        this._boundOnEnemySpawn = null;
        this._boundOnEnemyDeath = null;
        this._boundOnEnemyReachBase = null;
        this._boundOnTowerPlaced = null;
        this._boundOnTowerAttack = null;

        this._clearAll();

        this._eventBus = null;
        this._battleManager = null;
        this._gameManager = null;
    }
}
