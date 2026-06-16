/**
 * 战斗暂停弹窗
 * 点击暂停按钮后弹出，提供继续游戏、重打本关、返回主菜单三个选项
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建空节点 BattlePausePanelRoot（放在 BattleUIRoot 下）
 * 2. 挂载此组件
 * 3. 设置默认 active = false
 * 4. 由 BattleUI 的暂停按钮触发 open() 打开
 *
 * 布局说明：
 * - 半透明遮罩覆盖整个面板区域
 * - 居中主面板，深色背景 + 青色描边
 * - 顶部标题："暂停"
 * - 中间说明："战斗已暂停"
 * - 底部纵向三个按钮：继续游戏、重打本关、返回主菜单
 */

import { _decorator, Component, Node, Label, Graphics, Color, UITransform, Button } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BattlePausePanel')
export class BattlePausePanel extends Component {
    // ==================== 面板尺寸 ====================
    private readonly PANEL_WIDTH = 400;
    private readonly PANEL_HEIGHT = 360;

    // ==================== 内部状态 ====================
    private _initialized: boolean = false;
    private _panelContainer: Node | null = null;

    // ==================== 回调 ====================
    private _onContinue: (() => void) | null = null;
    private _onRetry: (() => void) | null = null;
    private _onReturnMain: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onDestroy(): void {
        this._onContinue = null;
        this._onRetry = null;
        this._onReturnMain = null;
        this._panelContainer = null;
    }

    // ==================== 公开接口 ====================

    /**
     * 打开暂停弹窗
     * 支持 lazy init：即使节点初始 active=false，也能在第一次 open() 时正常初始化
     */
    open(): void {
        this.node.active = true;
        this._bringToFront();
        this._ensureInitialized();
        console.log('[BattlePausePanel] open');
    }

    /**
     * 关闭暂停弹窗
     */
    close(): void {
        this.node.active = false;
        console.log('[BattlePausePanel] close');
    }

    /**
     * 设置按钮回调
     */
    setCallbacks(
        onContinue: () => void,
        onRetry: () => void,
        onReturnMain: () => void
    ): void {
        this._onContinue = onContinue;
        this._onRetry = onRetry;
        this._onReturnMain = onReturnMain;
    }

    // ==================== 层级控制 ====================

    /**
     * 将面板置顶显示
     * 先将当前节点在父节点中置顶，再将父节点在祖父节点中置顶
     * 确保暂停弹窗不被塔位、敌人、攻击特效、技能按钮盖住
     */
    private _bringToFront(): void {
        const parent = this.node.parent;
        if (parent) {
            this.node.setSiblingIndex(parent.children.length - 1);
            const grandParent = parent.parent;
            if (grandParent) {
                parent.setSiblingIndex(grandParent.children.length - 1);
            }
        }
    }

    // ==================== 初始化 ====================

    /**
     * 确保初始化（幂等，只执行一次）
     */
    private _ensureInitialized(): void {
        if (this._initialized) return;
        this._createUI();
        this._initialized = true;
        console.log('[BattlePausePanel] initialized');
    }

    // ==================== UI 创建 ====================

    /**
     * 创建整个 UI 结构（只执行一次）
     */
    private _createUI(): void {
        // 创建半透明背景遮罩
        this._createBackground();

        // 创建面板容器
        this._panelContainer = new Node('PanelContainer');
        const containerTransform = this._panelContainer.addComponent(UITransform);
        containerTransform.setContentSize(this.PANEL_WIDTH, this.PANEL_HEIGHT);
        this.node.addChild(this._panelContainer);

        // 绘制面板背景
        this._drawPanelBackground();

        // 创建标题
        this._createTitle();

        // 创建说明文字
        this._createDescription();

        // 创建三个按钮
        this._createButtons();
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

        // 点击遮罩不关闭（暂停弹窗需要明确选择）
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
        graphics.strokeColor = new Color(0, 180, 230, 200);
        graphics.lineWidth = 2;
        graphics.roundRect(-w / 2, -h / 2, w, h, radius);
        graphics.stroke();
    }

    /**
     * 创建标题
     */
    private _createTitle(): void {
        if (!this._panelContainer) return;

        const titleNode = new Node('Title');
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(this.PANEL_WIDTH, 50);
        titleNode.setPosition(0, 130, 0);

        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = '暂停';
        titleLabel.fontSize = 32;
        titleLabel.lineHeight = 40;
        titleLabel.color = new Color(220, 230, 255, 255);
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;

        this._panelContainer.addChild(titleNode);
    }

    /**
     * 创建说明文字
     */
    private _createDescription(): void {
        if (!this._panelContainer) return;

        const descNode = new Node('Description');
        const descTransform = descNode.addComponent(UITransform);
        descTransform.setContentSize(this.PANEL_WIDTH - 40, 30);
        descNode.setPosition(0, 80, 0);

        const descLabel = descNode.addComponent(Label);
        descLabel.string = '战斗已暂停';
        descLabel.fontSize = 20;
        descLabel.lineHeight = 26;
        descLabel.color = new Color(160, 180, 210, 200);
        descLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        descLabel.verticalAlign = Label.VerticalAlign.CENTER;

        this._panelContainer.addChild(descNode);
    }

    /**
     * 创建三个按钮
     */
    private _createButtons(): void {
        if (!this._panelContainer) return;

        const buttonWidth = 280;
        const buttonHeight = 50;
        const buttonGap = 16;
        const startY = 20;

        // 继续游戏（primary）
        this._createButton(
            'ContinueButton',
            '继续游戏',
            0,
            startY,
            buttonWidth,
            buttonHeight,
            new Color(0, 150, 200, 230),  // 青色背景
            new Color(0, 200, 255, 255),  // 青色描边
            new Color(255, 255, 255, 255), // 白色文字
            () => {
                if (this._onContinue) this._onContinue();
            }
        );

        // 重打本关（secondary）
        this._createButton(
            'RetryButton',
            '重打本关',
            0,
            startY - buttonHeight - buttonGap,
            buttonWidth,
            buttonHeight,
            new Color(50, 60, 80, 200),   // 深色背景
            new Color(80, 120, 200, 150),  // 蓝色描边
            new Color(180, 200, 240, 255), // 浅蓝文字
            () => {
                if (this._onRetry) this._onRetry();
            }
        );

        // 返回主菜单（ghost）
        this._createButton(
            'ReturnButton',
            '返回主菜单',
            0,
            startY - (buttonHeight + buttonGap) * 2,
            buttonWidth,
            buttonHeight,
            new Color(40, 40, 50, 150),    // 更深背景
            new Color(100, 100, 120, 100), // 灰色描边
            new Color(150, 150, 170, 200), // 灰色文字
            () => {
                if (this._onReturnMain) this._onReturnMain();
            }
        );
    }

    /**
     * 创建单个按钮
     */
    private _createButton(
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        bgColor: Color,
        borderColor: Color,
        textColor: Color,
        onClick: () => void
    ): void {
        if (!this._panelContainer) return;

        const btnNode = new Node(name);
        const btnTransform = btnNode.addComponent(UITransform);
        btnTransform.setContentSize(width, height);
        btnNode.setPosition(x, y, 0);

        // 绘制按钮背景
        const graphics = btnNode.addComponent(Graphics);
        const radius = 8;

        graphics.fillColor = bgColor;
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.fill();

        graphics.strokeColor = borderColor;
        graphics.lineWidth = 1;
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.stroke();

        // 按钮文字
        const labelNode = new Node('Label');
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(width, height);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 22;
        label.lineHeight = 28;
        label.color = textColor;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        btnNode.addChild(labelNode);

        // 点击事件
        btnNode.on(Node.EventType.TOUCH_END, onClick);

        // Button 组件（用于按下效果）
        const button = btnNode.addComponent(Button);
        button.transition = Button.Transition.COLOR;
        button.normalColor = new Color(255, 255, 255, 255);
        button.pressedColor = new Color(200, 220, 255, 255);
        button.hoverColor = new Color(230, 240, 255, 255);
        button.disabledColor = new Color(150, 150, 150, 255);

        this._panelContainer.addChild(btnNode);
    }
}
