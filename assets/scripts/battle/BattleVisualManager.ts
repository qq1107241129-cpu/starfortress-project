/**
 * BattleVisualManager - 战斗可视化管理器
 * 管理塔、敌人、攻击特效的显示
 * 监听战斗事件，将逻辑对象映射为可见节点
 */

import { _decorator, Component, Node, Graphics, Color, Label, UITransform, input, Input, EventTouch, EventMouse, Vec2, Vec3, Camera, Canvas, find } from 'cc';
import { EventBus, BATTLE_EVENTS } from '../core/EventBus';
import { GameManager, GameFlowState } from '../core/GameManager';
import { BattleManager } from './BattleManager';
import { EnemyView } from './EnemyView';
import { TowerView } from './TowerView';
import { AttackEffectView } from './AttackEffectView';
import { BASE_CENTER, BASE_SIZE, BASE_HALF_SIZE, SLOT_SIZE, SLOT_HALF_SIZE, TOWER_SLOT_POSITIONS } from './StageManager';

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
    private _isSystemInputRegistered: boolean = false;
    private _slotPointerListeners: Array<{ node: Node; handler: () => void }> = [];

    // 保存绑定回调引用，用于正确解绑
    private _boundOnBattleStart: ((data: any) => void) | null = null;
    private _boundOnBattleEnd: (() => void) | null = null;
    private _boundOnEnemySpawn: ((data: any) => void) | null = null;
    private _boundOnEnemyDeath: ((data: any) => void) | null = null;
    private _boundOnEnemyReachBase: ((data: any) => void) | null = null;
    private _boundOnTowerPlaced: ((data: any) => void) | null = null;
    private _boundOnTowerAttack: ((data: any) => void) | null = null;
    private _boundOnChainHit: ((data: any) => void) | null = null;
    private _boundOnSplashHit: ((data: any) => void) | null = null;
    private _boundOnDamageNumberShow: ((data: any) => void) | null = null;
    private _boundOnEnemySlowed: ((data: any) => void) | null = null;
    private _boundOnEnemySlowEnded: ((data: any) => void) | null = null;
    private _boundOnProjectileSpawn: ((data: any) => void) | null = null;
    private _boundOnProjectileHit: ((data: any) => void) | null = null;

    // 飘字管理
    private _floatingTexts: Array<{ node: Node; lifetime: number; maxLifetime: number; startY: number }> = [];

    // 飞行特效追踪：effectNode -> targetId
    private _trackingEffects: Map<Node, string> = new Map();

    // 减速特效：enemyId -> effectNode
    private _slowEffects: Map<string, Node> = new Map();

    // 投射物视觉节点：projectileId -> node
    private _projectileVisuals: Map<string, Node> = new Map();

    onLoad(): void {
        this._eventBus = EventBus.getInstance();
        this._battleManager = BattleManager.getInstance();
        this._gameManager = GameManager.getInstance();

        // 默认隐藏（与 Cocos Creator 编辑器中设置一致）
        this.node.active = false;

        // 监听状态变化：battle 状态时显示，其他状态隐藏
        this._unsubStateChange = this._gameManager.onStateChange((state: GameFlowState) => {
            const isBattle = state === 'battle';
            this.node.active = isBattle;
            if (isBattle) {
                this._registerSystemInput();
            } else {
                this._unregisterSystemInput();
            }
        });

        // 确保层级节点存在
        this._ensureLayers();

        // 注册事件监听
        this._setupEventListeners();

        this._unregisterSystemInput();
    }

    /**
     * 确保层级节点存在
     * 给所有节点添加 UITransform，确保触摸事件能正确传播
     * 在 Cocos Creator 3.x 中，父节点没有 UITransform 时，子节点收不到触摸事件
     */
    private _ensureLayers(): void {
        // 确保 BattleVisualRoot 自身有 UITransform（覆盖整个 Canvas 区域）
        let rootTransform = this.node.getComponent(UITransform);
        if (!rootTransform) {
            rootTransform = this.node.addComponent(UITransform);
        }
        rootTransform.setContentSize(1080, 1920); // 竖屏设计分辨率

        if (!this.towerLayer) {
            this.towerLayer = new Node('TowerLayer');
            this.towerLayer.parent = this.node;
        }
        this._ensureLayerTransform(this.towerLayer);

        if (!this.enemyLayer) {
            this.enemyLayer = new Node('EnemyLayer');
            this.enemyLayer.parent = this.node;
        }
        this._ensureLayerTransform(this.enemyLayer);

        if (!this.effectLayer) {
            this.effectLayer = new Node('EffectLayer');
            this.effectLayer.parent = this.node;
        }
        this._ensureLayerTransform(this.effectLayer);

        if (!this.pathLayer) {
            this.pathLayer = new Node('PathLayer');
            this.pathLayer.parent = this.node;
        }
        this._ensureLayerTransform(this.pathLayer);
    }

    /**
     * 确保层级节点有 UITransform
     */
    private _ensureLayerTransform(node: Node): void {
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        transform.setContentSize(1080, 1920);
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
        this._boundOnChainHit = this._onChainHit.bind(this);
        this._boundOnSplashHit = this._onSplashHit.bind(this);
        this._boundOnDamageNumberShow = this._onDamageNumberShow.bind(this);
        this._boundOnEnemySlowed = this._onEnemySlowed.bind(this);
        this._boundOnEnemySlowEnded = this._onEnemySlowEnded.bind(this);
        this._boundOnProjectileSpawn = this._onProjectileSpawn.bind(this);
        this._boundOnProjectileHit = this._onProjectileHit.bind(this);

        // 注册事件
        this._eventBus.on(BATTLE_EVENTS.BATTLE_START, this._boundOnBattleStart);
        this._eventBus.on(BATTLE_EVENTS.BATTLE_END, this._boundOnBattleEnd);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_SPAWN, this._boundOnEnemySpawn);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_DEATH, this._boundOnEnemyDeath);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_REACH_BASE, this._boundOnEnemyReachBase);
        this._eventBus.on(BATTLE_EVENTS.TOWER_PLACED, this._boundOnTowerPlaced);
        this._eventBus.on(BATTLE_EVENTS.TOWER_ATTACK, this._boundOnTowerAttack);
        this._eventBus.on(BATTLE_EVENTS.CHAIN_HIT, this._boundOnChainHit);
        this._eventBus.on(BATTLE_EVENTS.SPLASH_HIT, this._boundOnSplashHit);
        this._eventBus.on(BATTLE_EVENTS.DAMAGE_NUMBER_SHOW, this._boundOnDamageNumberShow);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_SLOWED, this._boundOnEnemySlowed);
        this._eventBus.on(BATTLE_EVENTS.ENEMY_SLOW_ENDED, this._boundOnEnemySlowEnded);
        this._eventBus.on(BATTLE_EVENTS.PROJECTILE_SPAWN, this._boundOnProjectileSpawn);
        this._eventBus.on(BATTLE_EVENTS.PROJECTILE_HIT, this._boundOnProjectileHit);
    }

    private _registerSystemInput(): void {
        if (this._isSystemInputRegistered) return;

        input.on(Input.EventType.TOUCH_START, this._onSystemTouchStart, this);
        input.on(Input.EventType.MOUSE_DOWN, this._onSystemMouseDown, this);
        this._isSystemInputRegistered = true;
        console.log('[BattleVisualManager] system input registered');
    }

    private _unregisterSystemInput(): void {
        if (!this._isSystemInputRegistered) return;

        input.off(Input.EventType.TOUCH_START, this._onSystemTouchStart, this);
        input.off(Input.EventType.MOUSE_DOWN, this._onSystemMouseDown, this);
        this._isSystemInputRegistered = false;
        console.log('[BattleVisualManager] system input unregistered');
    }

    /**
     * 战斗开始事件处理
     */
    private _onBattleStart(data: any): void {
        console.log('[BattleVisualManager] 战斗开始，初始化可视化');
        this._isInitialized = true;

        // 绘制中央基地
        this._drawBase();

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
        this._removeSlowEffect(enemyId);
    }

    /**
     * 敌人到达基地事件处理
     */
    private _onEnemyReachBase(data: any): void {
        const { enemyId } = data;
        this._removeEnemyView(enemyId);
        this._removeSlowEffect(enemyId);
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

        // 只有电塔需要立即创建攻击特效（瞬发电弧）
        // 其他塔的投射物视觉由 PROJECTILE_SPAWN 事件管理
        if (towerType === 'electric_tower') {
            this._createAttackEffect(towerType, towerPosition, targetPosition);
        }
    }

    /**
     * 电弧弹射特效事件处理
     */
    private _onChainHit(data: any): void {
        if (!this._isInitialized || !this.effectLayer) return;

        const { fromPosition, toPosition } = data;

        // 创建电弧弹射特效
        this._createAttackEffect('electric_tower', fromPosition, toPosition);
    }

    /**
     * 炮塔范围爆炸特效事件处理
     */
    private _onSplashHit(data: any): void {
        if (!this._isInitialized || !this.effectLayer) return;

        const { position, radius } = data;

        // 创建爆炸特效节点
        const explosionNode = new Node('Explosion');
        explosionNode.parent = this.effectLayer;
        explosionNode.setPosition(position.x, position.y, 0);

        const transform = explosionNode.addComponent(UITransform);
        transform.setContentSize(radius * 2, radius * 2);

        const graphics = explosionNode.addComponent(Graphics);

        // 第一帧立即绘制爆点（橙红色实心圆 + 外圈闪光）
        graphics.fillColor = new Color(255, 200, 100, 255);
        graphics.circle(0, 0, radius * 0.5);
        graphics.fill();

        // 外圈冲击波（第一帧就可见）
        graphics.strokeColor = new Color(255, 135, 45, 200);
        graphics.lineWidth = 4;
        graphics.circle(0, 0, radius * 0.7);
        graphics.stroke();

        // 更外圈的冲击波
        graphics.strokeColor = new Color(255, 80, 20, 120);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, radius);
        graphics.stroke();

        // 动画参数
        const maxRadius = radius;
        const duration = 0.25; // 爆炸持续时间

        // 添加逐帧更新组件（从初始爆点开始扩散）
        explosionNode.addComponent(class extends Component {
            private _lifetime = 0;
            private _graphics = graphics;
            private _maxRadius = maxRadius;
            private _duration = duration;

            update(dt: number) {
                this._lifetime += dt;
                const progress = Math.min(1, this._lifetime / this._duration);
                const alpha = 1 - progress;

                this._graphics.clear();

                // 内圈闪光（从大到小）
                if (progress < 0.4) {
                    const flashAlpha = 1 - progress / 0.4;
                    this._graphics.fillColor = new Color(255, 200, 100, Math.floor(255 * flashAlpha));
                    this._graphics.circle(0, 0, this._maxRadius * 0.5 * (1 - progress * 0.5));
                    this._graphics.fill();
                }

                // 外圈冲击波（从小到大扩散）
                const ringRadius = this._maxRadius * (0.3 + progress * 0.7);
                this._graphics.strokeColor = new Color(255, 135, 45, Math.floor(200 * alpha));
                this._graphics.lineWidth = 3;
                this._graphics.circle(0, 0, ringRadius);
                this._graphics.stroke();

                // 最外圈淡出
                if (progress > 0.3) {
                    const outerAlpha = (1 - progress) * 0.6;
                    this._graphics.strokeColor = new Color(255, 80, 20, Math.floor(120 * outerAlpha));
                    this._graphics.lineWidth = 2;
                    this._graphics.circle(0, 0, ringRadius * 1.2);
                    this._graphics.stroke();
                }

                // 动画结束，销毁节点
                if (progress >= 1) {
                    this.node.destroy();
                }
            }
        });
    }

    /**
     * 敌人减速事件处理
     */
    private _onEnemySlowed(data: any): void {
        if (!this._isInitialized || !this.enemyLayer) return;

        const { enemyId, position } = data;

        // 如果已有减速特效，先移除
        this._removeSlowEffect(enemyId);

        // 创建减速特效节点
        const slowNode = new Node(`SlowEffect_${enemyId}`);
        slowNode.parent = this.enemyLayer;
        slowNode.setPosition(position.x, position.y, 0);

        const transform = slowNode.addComponent(UITransform);
        transform.setContentSize(40, 40);

        const graphics = slowNode.addComponent(Graphics);

        // 绘制冰蓝色光环
        graphics.strokeColor = new Color(100, 200, 255, 180);
        graphics.lineWidth = 2;
        graphics.circle(0, 0, 18);
        graphics.stroke();

        // 绘制内部冰晶装饰
        graphics.strokeColor = new Color(150, 230, 255, 120);
        graphics.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            graphics.moveTo(0, 0);
            graphics.lineTo(x, y);
            graphics.stroke();
        }

        // 添加闪烁动画组件
        slowNode.addComponent(class extends Component {
            private _graphics = graphics;
            private _lifetime = 0;

            update(dt: number) {
                this._lifetime += dt;
                const alpha = 0.6 + Math.sin(this._lifetime * 8) * 0.4;
                this._graphics.clear();

                // 外圈光环
                this._graphics.strokeColor = new Color(100, 200, 255, Math.floor(180 * alpha));
                this._graphics.lineWidth = 2;
                this._graphics.circle(0, 0, 18);
                this._graphics.stroke();

                // 内部冰晶
                this._graphics.strokeColor = new Color(150, 230, 255, Math.floor(120 * alpha));
                this._graphics.lineWidth = 1;
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const x = Math.cos(angle) * 10;
                    const y = Math.sin(angle) * 10;
                    this._graphics.moveTo(0, 0);
                    this._graphics.lineTo(x, y);
                    this._graphics.stroke();
                }
            }
        });

        this._slowEffects.set(enemyId, slowNode);
    }

    /**
     * 敌人减速结束事件处理
     */
    private _onEnemySlowEnded(data: any): void {
        const { enemyId } = data;
        this._removeSlowEffect(enemyId);
    }

    /**
     * 移除减速特效
     */
    private _removeSlowEffect(enemyId: string): void {
        const slowNode = this._slowEffects.get(enemyId);
        if (slowNode && slowNode.isValid) {
            slowNode.destroy();
        }
        this._slowEffects.delete(enemyId);
    }

    /**
     * 投射物创建事件处理
     */
    private _onProjectileSpawn(data: any): void {
        if (!this._isInitialized || !this.effectLayer) return;

        const { projectileId, type, position, targetId } = data;

        // 电塔投射物是瞬发的，不需要视觉节点
        if (type === 'chain') return;

        // 创建投射物视觉节点
        const projNode = new Node(`Projectile_${projectileId}`);
        projNode.parent = this.effectLayer;
        projNode.setPosition(position.x, position.y, 0);

        const transform = projNode.addComponent(UITransform);
        transform.setContentSize(20, 20);

        const graphics = projNode.addComponent(Graphics);

        // 根据类型绘制不同外观
        if (type === 'splash') {
            // 炮塔：橙红色圆形炮弹
            graphics.fillColor = new Color(255, 135, 45, 255);
            graphics.circle(0, 0, 6);
            graphics.fill();
            graphics.strokeColor = new Color(255, 200, 100, 200);
            graphics.lineWidth = 1;
            graphics.circle(0, 0, 8);
            graphics.stroke();
        } else if (type === 'ice') {
            // 冰塔：冰蓝色菱形
            graphics.fillColor = new Color(135, 225, 255, 255);
            graphics.moveTo(0, 7);
            graphics.lineTo(5, 0);
            graphics.lineTo(0, -7);
            graphics.lineTo(-5, 0);
            graphics.close();
            graphics.fill();
        } else {
            // 机枪塔：黄白色小圆点
            graphics.fillColor = new Color(255, 240, 170, 255);
            graphics.circle(0, 0, 3);
            graphics.fill();
        }

        // 存储映射
        this._projectileVisuals.set(projectileId, projNode);
    }

    /**
     * 投射物命中事件处理
     */
    private _onProjectileHit(data: any): void {
        const { projectileId, type, position } = data;

        // 销毁投射物视觉节点
        const projNode = this._projectileVisuals.get(projectileId);
        if (projNode && projNode.isValid) {
            projNode.destroy();
        }
        this._projectileVisuals.delete(projectileId);

        // 注意：炮塔爆炸特效由 SPLASH_HIT 事件处理，不在这里重复创建
    }

    /**
     * 伤害飘字事件处理
     */
    private _onDamageNumberShow(data: any): void {
        if (!this._isInitialized || !this.effectLayer) return;

        const { damage, position } = data;

        // 创建飘字节点
        const floatNode = new Node('DamageFloat');
        floatNode.parent = this.effectLayer;
        floatNode.setPosition(position.x, position.y + 30, 0);

        // 添加 Label 组件
        const label = floatNode.addComponent(Label);
        label.string = `-${damage}`;
        label.fontSize = 20;
        label.color = new Color(255, 255, 200, 255); // 浅黄色

        // 添加 UITransform（Label 自动添加，但确保存在）
        const transform = floatNode.getComponent(UITransform) || floatNode.addComponent(UITransform);
        transform.setContentSize(60, 30);

        // 记录飘字信息
        this._floatingTexts.push({
            node: floatNode,
            lifetime: 0,
            maxLifetime: 0.7, // 0.7 秒真实时间
            startY: position.y + 30,
        });
    }

    /**
     * 创建攻击特效
     */
    private _createAttackEffect(
        towerType: string,
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): Node | null {
        if (!this.effectLayer) return null;

        const effectNode = new Node('AttackEffect');
        effectNode.parent = this.effectLayer;

        const effectView = effectNode.addComponent(AttackEffectView);
        effectView.playTowerAttackEffect(towerType, fromPos, toPos);

        return effectNode;
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
     * 绘制中央基地（100×100 正方形，本地坐标原点）
     */
    private _drawBase(): void {
        if (!this.pathLayer) return;

        // 清除旧的基地显示
        this.pathLayer.removeAllChildren();

        // 创建基地绘制节点（位于 BattleVisualRoot 本地坐标原点）
        const baseNode = new Node('Base');
        baseNode.parent = this.pathLayer;
        baseNode.setPosition(BASE_CENTER.x, BASE_CENTER.y, 0);

        const graphics = baseNode.addComponent(Graphics);
        const transform = baseNode.addComponent(UITransform);
        transform.setContentSize(BASE_SIZE, BASE_SIZE);

        // 绘制基地填充（深灰色）
        graphics.fillColor = new Color(60, 60, 80, 255);
        graphics.rect(-BASE_HALF_SIZE, -BASE_HALF_SIZE, BASE_SIZE, BASE_SIZE);
        graphics.fill();

        // 绘制基地边框（亮蓝色）
        graphics.strokeColor = new Color(100, 200, 255, 255);
        graphics.lineWidth = 3;
        graphics.rect(-BASE_HALF_SIZE, -BASE_HALF_SIZE, BASE_SIZE, BASE_SIZE);
        graphics.stroke();

        // 绘制基地内部装饰（十字线）
        graphics.strokeColor = new Color(80, 150, 200, 150);
        graphics.lineWidth = 1;
        graphics.moveTo(-BASE_HALF_SIZE * 0.6, 0);
        graphics.lineTo(BASE_HALF_SIZE * 0.6, 0);
        graphics.stroke();
        graphics.moveTo(0, -BASE_HALF_SIZE * 0.6);
        graphics.lineTo(0, BASE_HALF_SIZE * 0.6);
        graphics.stroke();

        // 绘制基地中心圆
        graphics.fillColor = new Color(100, 200, 255, 200);
        graphics.circle(0, 0, 12);
        graphics.fill();
    }

    /**
     * 显示空槽位（使用 Graphics 绘制，本地坐标）
     * 不注册节点级触摸事件，改用系统级触摸 + 手动碰撞检测
     */
    private _showEmptySlots(): void {
        if (!this._battleManager || !this.towerLayer) {
            console.warn('[BattleVisualManager] _showEmptySlots: battleManager or towerLayer is null');
            return;
        }

        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) {
            console.warn('[BattleVisualManager] _showEmptySlots: towerManager is null');
            return;
        }

        const slots = towerManager.getSlots();
        console.log(`[BattleVisualManager] 创建 ${slots.length} 个塔位`);
        this._clearSlotPointerListeners();

        for (const slot of slots) {
            const slotNode = new Node(`Slot_${slot.id}`);
            slotNode.parent = this.towerLayer;
            slotNode.setPosition(slot.position.x, slot.position.y, 0);

            const transform = slotNode.addComponent(UITransform);
            transform.setContentSize(SLOT_SIZE, SLOT_SIZE);

            // 使用 Graphics 绘制矩形槽位
            const graphics = slotNode.addComponent(Graphics);
            graphics.fillColor = new Color(80, 80, 80, 200);
            graphics.rect(-SLOT_HALF_SIZE, -SLOT_HALF_SIZE, SLOT_SIZE, SLOT_SIZE);
            graphics.fill();

            // 绘制边框（高亮，提示可点击）
            graphics.strokeColor = new Color(150, 220, 255, 255);
            graphics.lineWidth = 2;
            graphics.rect(-SLOT_HALF_SIZE, -SLOT_HALF_SIZE, SLOT_SIZE, SLOT_SIZE);
            graphics.stroke();

            // 绘制中心标记（小十字）
            graphics.strokeColor = new Color(200, 230, 255, 150);
            graphics.lineWidth = 1;
            graphics.moveTo(-8, 0);
            graphics.lineTo(8, 0);
            graphics.stroke();
            graphics.moveTo(0, -8);
            graphics.lineTo(0, 8);
            graphics.stroke();

            const slotClickHandler = () => {
                console.log(`[BattleVisualManager] node TOUCH_END hit slot ${slot.id}`);
                this._onSlotClick(slot.id);
            };
            slotNode.on(Node.EventType.TOUCH_END, slotClickHandler);
            this._slotPointerListeners.push({ node: slotNode, handler: slotClickHandler });

            this._slotViews.set(slot.id, slotNode);
            console.log(`[BattleVisualManager] 塔位 ${slot.id} 创建完成, pos=(${slot.position.x}, ${slot.position.y})`);
        }
    }

    /**
     * 系统级触摸事件处理
     * 绕过节点层级触摸拦截，直接检测触摸位置是否在槽位范围内
     */
    private _onSystemTouchStart(event: EventTouch): void {
        if (!this._isInitialized) return;
        if (!this._battleManager) return;

        // 获取触摸位置（屏幕坐标）
        const touch = event.touch;
        if (!touch) return;

        const screenPos = touch.getUILocation();

        // 将屏幕坐标转换为 BattleVisualRoot 本地坐标
        const localPos = this._screenToLocal(screenPos);
        if (!localPos) return;

        // 遍历所有槽位，检测碰撞
        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) return;

        const slots = towerManager.getSlots();
        for (const slot of slots) {
            // 检测触摸点是否在槽位范围内
            const dx = Math.abs(localPos.x - slot.position.x);
            const dy = Math.abs(localPos.y - slot.position.y);

            if (dx <= SLOT_HALF_SIZE && dy <= SLOT_HALF_SIZE) {
                if (slot.towerId) {
                    // 点击已放置塔显示详情
                    console.log(`[BattleVisualManager] 系统触摸命中已放置塔 ${slot.towerId}`);
                    this._onTowerClick(slot.towerId, slot.id);
                } else {
                    // 点击空槽位显示建塔选择（020: playing 状态也可点击）
                    console.log(`[BattleVisualManager] 点击塔位: slotId=${slot.id} occupied=false`);
                    this._onSlotClick(slot.id);
                }
                return;
            }
        }
    }

    /**
     * 将屏幕坐标转换为 BattleVisualRoot 本地坐标
     * 需要先用 Camera 做 screen→world 转换，再用 UITransform 做 world→local 转换
     */
    private _onSystemMouseDown(event: EventMouse): void {
        if (!this._isInitialized) return;
        if (!this._battleManager) return;

        const screenPos = event.getUILocation();
        const localPos = this._screenToLocal(screenPos);
        if (!localPos) return;

        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) return;

        const slots = towerManager.getSlots();
        for (const slot of slots) {
            const dx = Math.abs(localPos.x - slot.position.x);
            const dy = Math.abs(localPos.y - slot.position.y);

            if (dx <= SLOT_HALF_SIZE && dy <= SLOT_HALF_SIZE) {
                if (slot.towerId) {
                    // 点击已放置塔显示详情
                    console.log(`[BattleVisualManager] system mouse hit placed tower ${slot.towerId}`);
                    this._onTowerClick(slot.towerId, slot.id);
                } else {
                    // 点击空槽位显示建塔选择（020: playing 状态也可点击）
                    console.log(`[BattleVisualManager] 点击塔位: slotId=${slot.id} occupied=false`);
                    this._onSlotClick(slot.id);
                }
                return;
            }
        }
    }

    private _screenToLocal(screenPos: Vec2): Vec2 | null {
        const transform = this.node.getComponent(UITransform);
        if (!transform) return null;

        const directLocal = this._worldToLocal(transform, new Vec3(screenPos.x, screenPos.y, 0));
        if (this._isReasonableBattleLocal(directLocal)) {
            return directLocal;
        }

        // 第一步：屏幕坐标 → 世界坐标（通过 Camera）
        const camera = this._getCamera();
        let worldPos: Vec3;
        if (camera) {
            worldPos = new Vec3();
            camera.screenToWorld(new Vec3(screenPos.x, screenPos.y, 0), worldPos);
        } else {
            // 降级：直接使用屏幕坐标（在默认 Camera 配置下通常也有效）
            worldPos = new Vec3(screenPos.x, screenPos.y, 0);
        }

        // 第二步：世界坐标 → 本地坐标
        const localPos3 = new Vec3();
        transform.convertToNodeSpaceAR(worldPos, localPos3);

        return new Vec2(localPos3.x, localPos3.y);
    }

    /**
     * 获取 2D UI Camera
     */
    private _worldToLocal(transform: UITransform, worldPos: Vec3): Vec2 {
        const localPos3 = new Vec3();
        transform.convertToNodeSpaceAR(worldPos, localPos3);
        return new Vec2(localPos3.x, localPos3.y);
    }

    private _isReasonableBattleLocal(localPos: Vec2): boolean {
        return Math.abs(localPos.x) <= 600 && Math.abs(localPos.y) <= 900;
    }

    private _getCamera(): Camera | null {
        let current: Node | null = this.node;
        while (current) {
            const canvas = current.getComponent(Canvas);
            if (canvas && canvas.cameraComponent) {
                return canvas.cameraComponent;
            }

            const childCamera = current.getChildByName('Camera')?.getComponent(Camera);
            if (childCamera) {
                return childCamera;
            }

            current = current.parent;
        }

        const canvasCameraNode = find('Canvas/Camera');
        if (canvasCameraNode) {
            return canvasCameraNode.getComponent(Camera) || null;
        }

        // 优先查找名为 "Camera" 的子节点
        const cameraNode = find('Camera');
        if (cameraNode) {
            return cameraNode.getComponent(Camera) || null;
        }
        return null;
    }

    /**
     * 塔位点击处理（020: 移除 isPlacementPhase 检查，playing 状态也可点击）
     */
    private _onSlotClick(slotId: string): void {
        console.log(`[BattleVisualManager] _onSlotClick: slotId=${slotId}`);

        if (!this._battleManager) {
            console.warn('[BattleVisualManager] _onSlotClick: _battleManager is null');
            return;
        }

        // 检查是否在战斗中
        if (!this._battleManager.isPlaying()) {
            console.log('[BattleVisualManager] 不在战斗中，忽略点击');
            return;
        }

        // 检查槽位是否已有塔
        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) {
            console.warn('[BattleVisualManager] _onSlotClick: towerManager is null');
            return;
        }

        const slots = towerManager.getSlots();
        const slot = slots.find(s => s.id === slotId);
        if (slot && slot.towerId) {
            console.log(`[BattleVisualManager] 槽位 ${slotId} 已有塔`);
            return;
        }

        // 通知 BattleUI 显示塔选择面板
        console.log(`[BattleVisualManager] 打开塔选择: slotId=${slotId}`);
        if (this._eventBus) {
            this._eventBus.emit('SHOW_TOWER_SELECT', { slotId });
        }
    }

    /**
     * 已放置塔点击处理（战斗阶段）
     */
    private _onTowerClick(towerId: string, slotId: string): void {
        console.log(`[BattleVisualManager] _onTowerClick: towerId=${towerId}, slotId=${slotId}`);

        if (!this._battleManager) return;
        if (!this._eventBus) return;

        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) return;

        const tower = towerManager.getTower(towerId);
        if (!tower) return;

        // 发出塔详情显示事件
        this._eventBus.emit(BATTLE_EVENTS.TOWER_DETAIL_SHOW, {
            towerId: tower.getId(),
            slotId: slotId,
            configId: tower.getConfig().id,
        });
    }

    /**
     * 清除所有可视化
     */
    private _clearAll(): void {
        this._clearSlotPointerListeners();

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

        // 清除飘字
        for (const float of this._floatingTexts) {
            if (float.node && float.node.isValid) {
                float.node.destroy();
            }
        }
        this._floatingTexts = [];

        // 清除追踪特效映射
        this._trackingEffects.clear();

        // 清除减速特效
        for (const [enemyId, slowNode] of this._slowEffects) {
            if (slowNode && slowNode.isValid) {
                slowNode.destroy();
            }
        }
        this._slowEffects.clear();

        // 清除投射物视觉
        for (const [id, node] of this._projectileVisuals) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        this._projectileVisuals.clear();

        // 清除层级子节点
        if (this.towerLayer) this.towerLayer.removeAllChildren();
        if (this.enemyLayer) this.enemyLayer.removeAllChildren();
        if (this.effectLayer) this.effectLayer.removeAllChildren();
        if (this.pathLayer) this.pathLayer.removeAllChildren();
    }

    private _clearSlotPointerListeners(): void {
        for (const entry of this._slotPointerListeners) {
            if (entry.node && entry.node.isValid) {
                entry.node.off(Node.EventType.TOUCH_END, entry.handler);
            }
        }
        this._slotPointerListeners = [];
    }

    update(deltaTime: number): void {
        if (!this._isInitialized) return;

        // 同步敌人位置
        this._syncEnemyPositions();

        // 同步敌人血量
        this._syncEnemyHealth();

        // 同步投射物视觉位置
        this._syncProjectilePositions();

        // 同步减速特效位置
        this._syncSlowEffectPositions();

        // 更新飘字动画（使用真实 deltaTime，不跟随倍速）
        this._updateFloatingTexts(deltaTime);
    }

    /**
     * 同步投射物视觉位置（跟随逻辑投射物）
     */
    private _syncProjectilePositions(): void {
        if (!this._battleManager) return;

        const towerManager = this._battleManager.getTowerManager();
        if (!towerManager) return;

        const projectileManager = towerManager.getProjectileManager();
        const activeProjectiles = projectileManager.getActiveProjectiles();

        // 更新每个活跃投射物的视觉位置
        for (const proj of activeProjectiles) {
            const visualNode = this._projectileVisuals.get(proj.id);
            if (visualNode && visualNode.isValid) {
                visualNode.setPosition(proj.position.x, proj.position.y, 0);
            }
        }

        // 清理已失效的投射物视觉
        const activeIds = new Set(activeProjectiles.map(p => p.id));
        for (const [id, node] of this._projectileVisuals) {
            if (!activeIds.has(id)) {
                if (node && node.isValid) {
                    node.destroy();
                }
                this._projectileVisuals.delete(id);
            }
        }
    }

    /**
     * 同步减速特效位置（跟随敌人移动）
     * 同时兜底清理：敌人死亡或节点无效时，移除对应减速特效
     */
    private _syncSlowEffectPositions(): void {
        if (!this._battleManager) return;

        const aliveEnemies = this._battleManager.getAliveEnemies();
        const aliveIds = new Set<string>();
        for (const enemy of aliveEnemies) {
            aliveIds.add(enemy.getId());
        }

        // 兜底清理：遍历 _slowEffects，清理不在存活列表中或节点无效的特效
        const toRemove: string[] = [];
        for (const [enemyId, slowNode] of this._slowEffects) {
            if (!aliveIds.has(enemyId) || !slowNode || !slowNode.isValid) {
                toRemove.push(enemyId);
            }
        }
        for (const enemyId of toRemove) {
            this._removeSlowEffect(enemyId);
        }

        // 正常同步存活敌人的减速特效位置
        for (const enemy of aliveEnemies) {
            const enemyId = enemy.getId();
            const slowNode = this._slowEffects.get(enemyId);
            if (slowNode && slowNode.isValid) {
                const position = enemy.getPosition();
                slowNode.setPosition(position.x, position.y, 0);
            }
        }
    }

    /**
     * 更新飞行特效追踪（已弃用，现在使用投射物视觉系统）
     */
    private _updateTrackingEffects(): void {
        // 投射物视觉现在由 _syncProjectilePositions() 处理
        // 此方法保留为空，避免破坏现有调用
    }

    /**
     * 更新飘字动画
     * 使用真实 deltaTime，不跟随战斗倍速，确保 x4 下不会瞬间消失
     */
    private _updateFloatingTexts(deltaTime: number): void {
        const floatSpeed = 70; // 飘字上升速度（像素/秒）

        for (let i = this._floatingTexts.length - 1; i >= 0; i--) {
            const float = this._floatingTexts[i];
            float.lifetime += deltaTime;

            // 检查是否结束
            if (float.lifetime >= float.maxLifetime) {
                if (float.node && float.node.isValid) {
                    float.node.destroy();
                }
                this._floatingTexts.splice(i, 1);
                continue;
            }

            // 更新位置（向上漂浮）
            const progress = float.lifetime / float.maxLifetime;
            const newY = float.startY + floatSpeed * float.lifetime;
            float.node.setPosition(float.node.position.x, newY, 0);

            // 更新透明度（从 255 渐变到 0）
            const label = float.node.getComponent(Label);
            if (label) {
                const alpha = Math.floor(255 * (1 - progress));
                label.color = new Color(label.color.r, label.color.g, label.color.b, alpha);
            }
        }
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
        // 取消系统级触摸事件
        this._unregisterSystemInput();

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
            if (this._boundOnChainHit) {
                this._eventBus.off(BATTLE_EVENTS.CHAIN_HIT, this._boundOnChainHit);
            }
            if (this._boundOnSplashHit) {
                this._eventBus.off(BATTLE_EVENTS.SPLASH_HIT, this._boundOnSplashHit);
            }
            if (this._boundOnDamageNumberShow) {
                this._eventBus.off(BATTLE_EVENTS.DAMAGE_NUMBER_SHOW, this._boundOnDamageNumberShow);
            }
            if (this._boundOnEnemySlowed) {
                this._eventBus.off(BATTLE_EVENTS.ENEMY_SLOWED, this._boundOnEnemySlowed);
            }
            if (this._boundOnEnemySlowEnded) {
                this._eventBus.off(BATTLE_EVENTS.ENEMY_SLOW_ENDED, this._boundOnEnemySlowEnded);
            }
            if (this._boundOnProjectileSpawn) {
                this._eventBus.off(BATTLE_EVENTS.PROJECTILE_SPAWN, this._boundOnProjectileSpawn);
            }
            if (this._boundOnProjectileHit) {
                this._eventBus.off(BATTLE_EVENTS.PROJECTILE_HIT, this._boundOnProjectileHit);
            }
        }

        this._boundOnBattleStart = null;
        this._boundOnBattleEnd = null;
        this._boundOnEnemySpawn = null;
        this._boundOnEnemyDeath = null;
        this._boundOnEnemyReachBase = null;
        this._boundOnTowerPlaced = null;
        this._boundOnTowerAttack = null;
        this._boundOnChainHit = null;
        this._boundOnSplashHit = null;
        this._boundOnDamageNumberShow = null;
        this._boundOnEnemySlowed = null;
        this._boundOnEnemySlowEnded = null;
        this._boundOnProjectileSpawn = null;
        this._boundOnProjectileHit = null;

        // 清理飘字
        for (const float of this._floatingTexts) {
            if (float.node && float.node.isValid) {
                float.node.destroy();
            }
        }
        this._floatingTexts = [];

        this._clearAll();

        this._eventBus = null;
        this._battleManager = null;
        this._gameManager = null;
    }
}
