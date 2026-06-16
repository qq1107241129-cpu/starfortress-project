/**
 * 关卡选择面板
 * 动态生成关卡列表 UI，支持解锁/锁定状态，可滚动查看全部关卡
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建空节点 StageSelectPanelRoot（放在 MainUIRoot 下）
 * 2. 挂载此组件
 * 3. 在 Cocos Creator 中设置默认 active = false（不要在代码中设置）
 * 4. 由 MainUI 的"开始游戏"按钮调用 open() 打开
 *
 * 布局说明：
 * - 容器固定尺寸 560 x 980
 * - 标题固定在顶部 y=420
 * - 返回按钮固定在底部 y=-420
 * - 中间区域为可滚动关卡列表（ScrollView + Mask + Content）
 * - 所有关卡根据 StageConfig 动态生成，支持滚动查看
 * - 打开面板时默认滚动到推荐关卡附近
 */

import { _decorator, Component, Node, Label, Graphics, Color, UITransform, Button, ScrollView, Mask, Vec2 } from 'cc';
import { GameManager } from '../core/GameManager';
import { SaveManager } from '../core/SaveManager';
import { ConfigManager } from '../core/ConfigManager';
import { StageConfig } from '../data/StageConfig';

const { ccclass, property } = _decorator;

/** 单个关卡按钮的数据 */
interface StageButtonData {
    stageIndex: number;
    stageConfig: StageConfig;
    isUnlocked: boolean;
    node: Node;
}

@ccclass('StageSelectPanel')
export class StageSelectPanel extends Component {
    // ==================== 容器尺寸 ====================
    private readonly PANEL_WIDTH = 560;
    private readonly PANEL_HEIGHT = 980;

    // ==================== 标题区域（固定顶部）====================
    private readonly TITLE_Y = 420;
    private readonly TITLE_FONT_SIZE = 36;

    // ==================== 返回按钮（固定底部）====================
    private readonly BACK_BTN_Y = -420;
    private readonly BACK_BTN_WIDTH = 180;
    private readonly BACK_BTN_HEIGHT = 56;

    // ==================== 滚动区域 ====================
    private readonly SCROLL_AREA_Y = 10;
    private readonly SCROLL_AREA_HEIGHT = 700;
    private readonly STAGE_BTN_WIDTH = 480;
    private readonly STAGE_BTN_HEIGHT = 96;
    private readonly STAGE_BTN_GAP = 16;
    private readonly LIST_TOP_PADDING = 32;
    private readonly LIST_BOTTOM_PADDING = 32;

    // ==================== 关卡按钮内部文字 ====================
    private readonly STAGE_TITLE_Y = 28;
    private readonly STAGE_TITLE_FONT = 24;
    private readonly STAGE_DESC_Y = 0;
    private readonly STAGE_DESC_FONT = 16;
    private readonly STAGE_STATUS_Y = -28;
    private readonly STAGE_STATUS_FONT = 18;

    // ==================== 内部状态 ====================
    private _gameManager: GameManager | null = null;
    private _saveManager: SaveManager | null = null;
    private _configManager: ConfigManager | null = null;
    private _stageButtons: StageButtonData[] = [];
    private _panelContainer: Node | null = null;
    private _scrollView: ScrollView | null = null;
    private _scrollContent: Node | null = null;
    private _initialized: boolean = false;
    private _uiCreated: boolean = false;

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._ensureInitialized();
    }

    onDestroy(): void {
        this._clearStageButtons();
        this._gameManager = null;
        this._saveManager = null;
        this._configManager = null;
        this._scrollView = null;
        this._scrollContent = null;
        this._panelContainer = null;
    }

    // ==================== 公开接口 ====================

    /**
     * 打开关卡选择面板
     * 支持 lazy init：即使节点初始 active=false，也能在第一次 open() 时正常初始化
     */
    open(): void {
        this.node.active = true;
        this._ensureInitialized();
        this.refresh();
        console.log('[StageSelectPanel] open');
    }

    /**
     * 关闭关卡选择面板
     */
    close(): void {
        this.node.active = false;
    }

    /**
     * 刷新关卡列表
     */
    refresh(): void {
        if (!this._configManager || !this._saveManager) {
            console.warn('[StageSelectPanel] ConfigManager 或 SaveManager 未初始化');
            return;
        }

        const stageConfigs = this._configManager.getAllStageConfigs();
        const save = this._saveManager.getSave();
        const highestStage = save.highestStage;

        // 确保 UI 已创建（只执行一次）
        if (!this._uiCreated) {
            this._createUI();
            this._uiCreated = true;
        }

        // 更新关卡按钮
        this._updateStageButtons(stageConfigs, highestStage);

        // 默认滚动到推荐关卡
        const recommendedIndex = Math.min(highestStage, stageConfigs.length - 1);
        this._scrollToRecommended(recommendedIndex, stageConfigs.length);

        console.log(`[StageSelectPanel] refresh stage count: ${stageConfigs.length} highestStage: ${highestStage} recommendedIndex: ${recommendedIndex}`);
        console.log(`[StageSelectPanel] scroll to recommended stage index: ${recommendedIndex}`);
    }

    // ==================== 初始化 ====================

    /**
     * 确保初始化（幂等，只执行一次）
     */
    private _ensureInitialized(): void {
        if (this._initialized) return;

        this._gameManager = GameManager.getInstance();
        this._saveManager = SaveManager.getInstance();
        this._configManager = ConfigManager.getInstance();

        this._initialized = true;
        console.log('[StageSelectPanel] initialized');
    }

    // ==================== UI 创建 ====================

    /**
     * 创建整个 UI 结构（只执行一次）
     */
    private _createUI(): void {
        // 创建半透明背景遮罩（覆盖整个 StageSelectPanelRoot）
        this._createBackground();

        // 创建固定尺寸的 panelContainer
        this._panelContainer = new Node('PanelContainer');
        const containerTransform = this._panelContainer.addComponent(UITransform);
        containerTransform.setContentSize(this.PANEL_WIDTH, this.PANEL_HEIGHT);
        this.node.addChild(this._panelContainer);

        // 绘制面板背景
        this._drawPanelBackground();

        // 创建标题（固定顶部）
        this._createTitle();

        // 创建返回按钮（固定底部）
        this._createBackButton();

        // 创建可滚动关卡列表区域
        this._createScrollView();
    }

    /**
     * 创建半透明背景遮罩
     */
    private _createBackground(): void {
        const rootTransform = this.node.getComponent(UITransform);
        const rootWidth = rootTransform ? rootTransform.width : 720;
        const rootHeight = rootTransform ? rootTransform.height : 1280;

        const bgNode = new Node('Background');
        bgNode.addComponent(UITransform).setContentSize(rootWidth, rootHeight);
        const graphics = bgNode.addComponent(Graphics);

        // 深色半透明遮罩
        graphics.fillColor = new Color(0, 0, 0, 150);
        graphics.rect(-rootWidth / 2, -rootHeight / 2, rootWidth, rootHeight);
        graphics.fill();

        this.node.addChild(bgNode);

        // 点击遮罩关闭面板
        bgNode.on(Node.EventType.TOUCH_END, () => {
            this.close();
        });
    }

    /**
     * 绘制面板背景
     */
    private _drawPanelBackground(): void {
        if (!this._panelContainer) return;

        const graphics = this._panelContainer.addComponent(Graphics);
        const w = this.PANEL_WIDTH;
        const h = this.PANEL_HEIGHT;
        const radius = 16;

        // 面板背景
        graphics.fillColor = new Color(20, 25, 40, 240);
        graphics.roundRect(-w / 2, -h / 2, w, h, radius);
        graphics.fill();

        // 面板描边
        graphics.strokeColor = new Color(60, 100, 180, 180);
        graphics.lineWidth = 2;
        graphics.roundRect(-w / 2, -h / 2, w, h, radius);
        graphics.stroke();
    }

    /**
     * 创建标题（固定顶部）
     */
    private _createTitle(): void {
        if (!this._panelContainer) return;

        const titleNode = new Node('Title');
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(this.PANEL_WIDTH, 60);
        titleNode.setPosition(0, this.TITLE_Y, 0);

        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = '选择关卡';
        titleLabel.fontSize = this.TITLE_FONT_SIZE;
        titleLabel.lineHeight = this.TITLE_FONT_SIZE + 8;
        titleLabel.color = new Color(220, 230, 255, 255);
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;

        this._panelContainer.addChild(titleNode);
    }

    /**
     * 创建返回按钮（固定底部）
     */
    private _createBackButton(): void {
        if (!this._panelContainer) return;

        const btnNode = new Node('BackButton');
        const btnTransform = btnNode.addComponent(UITransform);
        btnTransform.setContentSize(this.BACK_BTN_WIDTH, this.BACK_BTN_HEIGHT);
        btnNode.setPosition(0, this.BACK_BTN_Y, 0);

        // 绘制按钮背景
        const graphics = btnNode.addComponent(Graphics);
        const w = this.BACK_BTN_WIDTH;
        const h = this.BACK_BTN_HEIGHT;
        const radius = 8;

        graphics.fillColor = new Color(50, 60, 80, 200);
        graphics.roundRect(-w / 2, -h / 2, w, h, radius);
        graphics.fill();

        graphics.strokeColor = new Color(80, 120, 200, 150);
        graphics.lineWidth = 1;
        graphics.roundRect(-w / 2, -h / 2, w, h, radius);
        graphics.stroke();

        // 按钮文字
        const labelNode = new Node('Label');
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(w, h);
        const label = labelNode.addComponent(Label);
        label.string = '返回';
        label.fontSize = 24;
        label.lineHeight = 28;
        label.color = new Color(180, 200, 240, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        btnNode.addChild(labelNode);

        // 点击事件
        btnNode.on(Node.EventType.TOUCH_END, () => {
            this.close();
        });

        this._panelContainer.addChild(btnNode);
    }

    /**
     * 创建可滚动关卡列表区域
     * 使用 ScrollView + Mask + Content 结构
     */
    private _createScrollView(): void {
        if (!this._panelContainer) return;

        // 创建 ScrollView 节点（作为裁剪容器）
        const scrollNode = new Node('ScrollView');
        const scrollTransform = scrollNode.addComponent(UITransform);
        scrollTransform.setContentSize(this.STAGE_BTN_WIDTH, this.SCROLL_AREA_HEIGHT);
        scrollNode.setPosition(0, this.SCROLL_AREA_Y, 0);

        // 添加 Mask 组件实现裁剪
        const mask = scrollNode.addComponent(Mask);
        mask.type = Mask.Type.RECT;
        mask.enabled = true;

        // 绘制滚动区域背景（可选，便于调试）
        const scrollBg = scrollNode.addComponent(Graphics);
        scrollBg.fillColor = new Color(15, 18, 30, 100);
        scrollBg.rect(-this.STAGE_BTN_WIDTH / 2, -this.SCROLL_AREA_HEIGHT / 2, this.STAGE_BTN_WIDTH, this.SCROLL_AREA_HEIGHT);
        scrollBg.fill();

        // 创建 Content 节点（ScrollView 的内容容器）
        this._scrollContent = new Node('Content');
        const contentTransform = this._scrollContent.addComponent(UITransform);
        contentTransform.setContentSize(this.STAGE_BTN_WIDTH, 0);
        contentTransform.setAnchorPoint(0.5, 1); // 顶部对齐
        scrollNode.addChild(this._scrollContent);

        // 添加 ScrollView 组件
        this._scrollView = scrollNode.addComponent(ScrollView);
        this._scrollView.content = this._scrollContent;
        this._scrollView.horizontal = false;
        this._scrollView.vertical = true;
        this._scrollView.bounceDuration = 0.2;
        this._scrollView.inertia = true;
        this._scrollView.brake = 0.5;
        this._scrollView.elastic = true;

        this._panelContainer.addChild(scrollNode);
    }

    // ==================== 关卡按钮管理 ====================

    /**
     * 更新关卡按钮列表
     * 遍历所有 StageConfig，不再限制显示数量
     */
    private _updateStageButtons(stageConfigs: StageConfig[], highestStage: number): void {
        // 清除旧按钮
        this._clearStageButtons();

        if (!this._scrollContent) return;

        const stageCount = stageConfigs.length;
        if (stageCount === 0) return;

        // 计算 Content 高度（含顶部和底部 padding）
        const itemHeight = this.STAGE_BTN_HEIGHT + this.STAGE_BTN_GAP;
        const contentHeight = this.LIST_TOP_PADDING + stageCount * itemHeight - this.STAGE_BTN_GAP + this.LIST_BOTTOM_PADDING;
        const contentTransform = this._scrollContent.getComponent(UITransform);
        if (contentTransform) {
            contentTransform.setContentSize(this.STAGE_BTN_WIDTH, contentHeight);
        }

        // 从上往下排列所有关卡按钮（第一个按钮从 content 顶部往下偏移 padding）
        for (let i = 0; i < stageCount; i++) {
            const stageConfig = stageConfigs[i];
            const stageIndex = i;
            const stageNumber = i + 1;
            const isUnlocked = stageIndex === 0 || highestStage >= stageIndex;

            const btnNode = this._createStageButton(stageConfig, stageIndex, stageNumber, isUnlocked);

            // 从上往下排列：第一个按钮在 padding 下方
            const yPos = -this.LIST_TOP_PADDING - this.STAGE_BTN_HEIGHT / 2 - i * itemHeight;
            btnNode.setPosition(0, yPos, 0);

            this._scrollContent.addChild(btnNode);

            this._stageButtons.push({
                stageIndex,
                stageConfig,
                isUnlocked,
                node: btnNode
            });
        }
    }

    /**
     * 创建单个关卡按钮
     */
    private _createStageButton(
        stageConfig: StageConfig,
        stageIndex: number,
        stageNumber: number,
        isUnlocked: boolean
    ): Node {
        const btnNode = new Node(`StageButton_stage_${stageNumber}`);
        const btnTransform = btnNode.addComponent(UITransform);
        btnTransform.setContentSize(this.STAGE_BTN_WIDTH, this.STAGE_BTN_HEIGHT);

        // 绘制按钮背景
        const graphics = btnNode.addComponent(Graphics);
        const w = this.STAGE_BTN_WIDTH;
        const h = this.STAGE_BTN_HEIGHT;
        const radius = 12;

        if (isUnlocked) {
            // 已解锁：深色背景 + 青色描边
            graphics.fillColor = new Color(30, 45, 70, 230);
            graphics.roundRect(-w / 2, -h / 2, w, h, radius);
            graphics.fill();

            graphics.strokeColor = new Color(0, 180, 230, 200);
            graphics.lineWidth = 2;
            graphics.roundRect(-w / 2, -h / 2, w, h, radius);
            graphics.stroke();
        } else {
            // 未解锁：更深的背景 + 灰色描边
            graphics.fillColor = new Color(25, 25, 35, 180);
            graphics.roundRect(-w / 2, -h / 2, w, h, radius);
            graphics.fill();

            graphics.strokeColor = new Color(70, 70, 90, 120);
            graphics.lineWidth = 1;
            graphics.roundRect(-w / 2, -h / 2, w, h, radius);
            graphics.stroke();
        }

        // 关卡标题（上方）
        this._createStageTitle(btnNode, stageNumber, stageConfig.name, isUnlocked);

        // 关卡描述（中间）
        this._createStageDesc(btnNode, stageConfig.description, isUnlocked);

        // 状态文字（下方）
        this._createStageStatus(btnNode, isUnlocked);

        // 点击事件
        if (isUnlocked) {
            btnNode.on(Node.EventType.TOUCH_END, () => {
                console.log(`[StageSelectPanel] click stage: stage_${stageIndex + 1} unlocked=true`);
                this.close();
                if (this._gameManager) {
                    this._gameManager.enterBattle(stageIndex);
                }
            });

            const button = btnNode.addComponent(Button);
            button.transition = Button.Transition.COLOR;
            button.normalColor = new Color(255, 255, 255, 255);
            button.pressedColor = new Color(200, 220, 255, 255);
            button.hoverColor = new Color(230, 240, 255, 255);
            button.disabledColor = new Color(150, 150, 150, 255);
        } else {
            btnNode.on(Node.EventType.TOUCH_END, () => {
                console.log(`[StageSelectPanel] click stage: stage_${stageIndex + 1} unlocked=false`);
            });
        }

        return btnNode;
    }

    /**
     * 创建关卡标题
     */
    private _createStageTitle(parent: Node, stageNumber: number, name: string, isUnlocked: boolean): void {
        const node = new Node('StageTitle');
        const transform = node.addComponent(UITransform);
        transform.setContentSize(this.STAGE_BTN_WIDTH - 40, 30);
        node.setPosition(0, this.STAGE_TITLE_Y, 0);

        const label = node.addComponent(Label);
        label.string = `第 ${stageNumber} 关：${name}`;
        label.fontSize = this.STAGE_TITLE_FONT;
        label.lineHeight = this.STAGE_TITLE_FONT + 4;
        label.color = isUnlocked ? new Color(255, 255, 255, 255) : new Color(100, 100, 120, 200);
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        parent.addChild(node);
    }

    /**
     * 创建关卡描述
     */
    private _createStageDesc(parent: Node, description: string, isUnlocked: boolean): void {
        const node = new Node('StageDesc');
        const transform = node.addComponent(UITransform);
        transform.setContentSize(this.STAGE_BTN_WIDTH - 40, 24);
        node.setPosition(0, this.STAGE_DESC_Y, 0);

        const label = node.addComponent(Label);
        label.string = description;
        label.fontSize = this.STAGE_DESC_FONT;
        label.lineHeight = this.STAGE_DESC_FONT + 4;
        label.color = isUnlocked ? new Color(160, 180, 210, 200) : new Color(70, 70, 90, 150);
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        parent.addChild(node);
    }

    /**
     * 创建状态文字
     */
    private _createStageStatus(parent: Node, isUnlocked: boolean): void {
        const node = new Node('StageStatus');
        const transform = node.addComponent(UITransform);
        transform.setContentSize(this.STAGE_BTN_WIDTH - 40, 24);
        node.setPosition(0, this.STAGE_STATUS_Y, 0);

        const label = node.addComponent(Label);
        label.string = isUnlocked ? '点击挑战' : '🔒 未解锁';
        label.fontSize = this.STAGE_STATUS_FONT;
        label.lineHeight = this.STAGE_STATUS_FONT + 4;
        label.color = isUnlocked ? new Color(0, 220, 180, 255) : new Color(120, 120, 140, 180);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        parent.addChild(node);
    }

    // ==================== 滚动控制 ====================

    /**
     * 滚动到推荐关卡位置
     * recommendedIndex = min(highestStage, stageCount - 1)
     * highestStage=0 → 推荐 index 0（第 1 关）
     * highestStage=1 → 推荐 index 1（第 2 关）
     *
     * 使用"可见窗口 startIndex 算法"：
     * 1. 计算一屏最多能完整显示几个按钮 (visibleCount)
     * 2. startIndex = max(0, recommendedIndex - visibleCount + 1)
     * 3. targetScrollY = startIndex * itemStride
     * 4. 限制在 [0, maxScrollY] 范围内
     *
     * 使用 scheduleOnce 延迟一帧执行，确保 contentSize 更新后再滚动
     */
    private _scrollToRecommended(recommendedIndex: number, stageCount: number): void {
        if (!this._scrollView || !this._scrollContent || stageCount === 0) return;

        const itemStride = this.STAGE_BTN_HEIGHT + this.STAGE_BTN_GAP;
        const contentHeight = this.LIST_TOP_PADDING + stageCount * itemStride - this.STAGE_BTN_GAP + this.LIST_BOTTOM_PADDING;
        const maxScrollY = Math.max(0, contentHeight - this.SCROLL_AREA_HEIGHT);

        // 一屏最多能完整显示几个按钮
        const visibleCount = Math.max(1, Math.floor((this.SCROLL_AREA_HEIGHT - this.LIST_TOP_PADDING - this.LIST_BOTTOM_PADDING) / itemStride));

        // 计算应该从第几关开始显示
        // recommendedIndex = 0, visibleCount = 5 → startIndex = 0
        // recommendedIndex = 3, visibleCount = 5 → startIndex = 0
        // recommendedIndex = 6, visibleCount = 5 → startIndex = 2
        const startIndex = Math.max(0, recommendedIndex - visibleCount + 1);

        // 计算滚动距离
        const targetScrollY = startIndex * itemStride;
        const finalScrollY = Math.min(Math.max(0, targetScrollY), maxScrollY);

        console.log(`[StageSelectPanel] visibleCount: ${visibleCount} recommendedIndex: ${recommendedIndex} startIndex: ${startIndex} finalScrollY: ${finalScrollY.toFixed(1)} maxScrollY: ${maxScrollY.toFixed(1)}`);

        // 延迟一帧执行，确保 contentSize 更新后再滚动
        this.scheduleOnce(() => {
            if (!this._scrollView || !this._scrollView.isValid) return;

            // 使用 scrollToOffset 滚动（Cocos ScrollView 的 offset 是从顶部开始的偏移）
            const offset = new Vec2(0, finalScrollY);
            this._scrollView.scrollToOffset(offset, 0.1, true);
        }, 0);
    }

    // ==================== 清理逻辑 ====================

    /**
     * 清除所有关卡按钮
     */
    private _clearStageButtons(): void {
        for (const btnData of this._stageButtons) {
            if (btnData.node && btnData.node.isValid) {
                btnData.node.destroy();
            }
        }
        this._stageButtons = [];

        // 清理 Content 子节点（防御性清理）
        if (this._scrollContent && this._scrollContent.isValid) {
            this._scrollContent.removeAllChildren();
        }
    }
}
