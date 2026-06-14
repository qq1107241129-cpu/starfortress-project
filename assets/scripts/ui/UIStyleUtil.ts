/**
 * UI 样式工具
 * 提供通用方法：styleButton、styleLabel、stylePanel
 *
 * 设计原则：
 * - styleButton 不强行统一所有按钮尺寸，优先保留原 UITransform 尺寸
 * - stylePanel 必须读取 UITransform 尺寸，不要用 panelPadding 画 40×40 小面板
 * - Graphics 只在初始化时绘制，不做每帧重绘
 * - 不破坏 Button 点击区域和 Label 显示
 *
 * 按钮样式查找优先级：
 * 1. button.target 上的 Sprite
 * 2. 当前节点 Sprite
 * 3. 名称包含 Background/Bg 的子节点 Sprite
 * 4. 第一个 Sprite
 * 5. Graphics fallback
 */

import { Node, Label, Button, Sprite, UITransform, Color, Graphics } from 'cc';
import { UI_THEME } from './UITheme';

/**
 * 在节点及其子节点中查找第一个匹配名称的 Sprite 组件
 * @param node 根节点
 * @param namePatterns 名称匹配模式（忽略大小写）
 */
function findSpriteByName(node: Node, namePatterns: string[]): Sprite | null {
    for (const child of node.children) {
        const childName = child.name.toLowerCase();
        for (const pattern of namePatterns) {
            if (childName.includes(pattern.toLowerCase())) {
                const sprite = child.getComponent(Sprite);
                if (sprite) return sprite;
            }
        }
        // 递归查找
        const found = findSpriteByName(child, namePatterns);
        if (found) return found;
    }
    return null;
}

/**
 * 在节点及其子节点中查找第一个 Sprite 组件
 */
function findFirstSpriteInChildren(node: Node): Sprite | null {
    for (const child of node.children) {
        const sprite = child.getComponent(Sprite);
        if (sprite) return sprite;
        // 递归查找
        const found = findFirstSpriteInChildren(child);
        if (found) return found;
    }
    return null;
}

/**
 * 在节点及其子节点中查找第一个 Label 组件
 */
function findFirstLabelInChildren(node: Node): Label | null {
    for (const child of node.children) {
        const label = child.getComponent(Label);
        if (label) return label;
        // 递归查找
        const found = findFirstLabelInChildren(child);
        if (found) return found;
    }
    return null;
}

/**
 * 样式化按钮
 * 不强行统一所有按钮尺寸，优先保留原 UITransform 尺寸
 *
 * 查找优先级：
 * 1. button.target 上的 Sprite
 * 2. 当前节点 Sprite
 * 3. 名称包含 Background/Bg 的子节点 Sprite
 * 4. 第一个 Sprite
 * 5. Graphics fallback
 *
 * @param buttonNode 按钮节点
 * @param variant 按钮变体：primary（主按钮）、danger（危险按钮）、secondary（次要按钮）、ghost（幽灵按钮）
 */
export function styleButton(buttonNode: Node, variant: 'primary' | 'danger' | 'secondary' | 'ghost' = 'primary'): void {
    // 1. 查找 Button 组件
    const button = buttonNode.getComponent(Button);

    // 2. 按优先级查找 Sprite
    let sprite: Sprite | null = null;

    // 优先级 1：button.target 上的 Sprite
    if (button && button.target) {
        sprite = button.target.getComponent(Sprite);
    }

    // 优先级 2：当前节点 Sprite
    if (!sprite) {
        sprite = buttonNode.getComponent(Sprite);
    }

    // 优先级 3：名称包含 Background/Bg 的子节点 Sprite
    if (!sprite) {
        sprite = findSpriteByName(buttonNode, ['background', 'bg']);
    }

    // 优先级 4：第一个 Sprite
    if (!sprite) {
        sprite = findFirstSpriteInChildren(buttonNode);
    }

    // 3. 设置颜色
    let bgColor: Color;
    let borderColor: Color;
    let textColor: Color;

    switch (variant) {
        case 'primary':
            bgColor = UI_THEME.primaryButtonColor;
            borderColor = UI_THEME.primaryButtonBorderColor;
            textColor = UI_THEME.textPrimaryColor;
            break;
        case 'danger':
            bgColor = UI_THEME.dangerButtonColor;
            borderColor = UI_THEME.dangerButtonBorderColor;
            textColor = UI_THEME.textPrimaryColor;
            break;
        case 'secondary':
            bgColor = UI_THEME.secondaryButtonColor;
            borderColor = UI_THEME.secondaryButtonBorderColor;
            textColor = UI_THEME.textSecondaryColor;
            break;
        case 'ghost':
            bgColor = UI_THEME.ghostButtonColor;
            borderColor = UI_THEME.ghostButtonBorderColor;
            textColor = UI_THEME.textSecondaryColor;
            break;
    }

    // 4. 修改 Sprite 颜色
    if (sprite) {
        sprite.color = bgColor;
    }

    // 5. 设置 Button transition colors
    if (button) {
        button.transition = Button.Transition.COLOR;
        // 使用 new Color(...)，不要直接复用 UI_THEME 里的 Color 对象
        button.normalColor = new Color(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
        button.pressedColor = new Color(
            Math.max(0, bgColor.r - 30),
            Math.max(0, bgColor.g - 30),
            Math.max(0, bgColor.b - 30),
            bgColor.a
        );
        button.hoverColor = new Color(
            Math.min(255, bgColor.r + 20),
            Math.min(255, bgColor.g + 20),
            Math.min(255, bgColor.b + 20),
            bgColor.a
        );
        button.disabledColor = new Color(100, 100, 100, 200);

        // 如果找到背景节点，设置 button.target
        if (sprite && !button.target) {
            button.target = sprite;
        }
    }

    // 6. 修改 Label 颜色（只改第一个）
    const label = findFirstLabelInChildren(buttonNode);
    if (label) {
        label.color = textColor;
    }

    // 7. 如果没有 Sprite，使用 Graphics fallback
    if (!sprite) {
        const transform = buttonNode.getComponent(UITransform);
        let width = 200;
        let height = 60;
        if (transform) {
            width = transform.width;
            height = transform.height;
        }

        // 创建/复用 UIStyleBg 子节点作为背景，放到 children 最前面
        let bgNode = buttonNode.getChildByName('UIStyleBg');
        if (!bgNode) {
            bgNode = new Node('UIStyleBg');
            bgNode.parent = buttonNode;
            bgNode.setSiblingIndex(0); // 放到最前面，作为背景
        }

        const graphics = bgNode.getComponent(Graphics) || bgNode.addComponent(Graphics);
        const bgTransform = bgNode.getComponent(UITransform) || bgNode.addComponent(UITransform);
        bgTransform.setContentSize(width, height);

        graphics.clear();
        graphics.fillColor = bgColor;
        graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.buttonRadius);
        graphics.fill();
        graphics.strokeColor = borderColor;
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.buttonRadius);
        graphics.stroke();
    }
}

/**
 * 样式化文字
 * @param labelNode Label 节点
 * @param variant 文字变体：title（标题）、large（大字）、medium（中字）、small（小字）
 */
export function styleLabel(labelNode: Node, variant: 'title' | 'large' | 'medium' | 'small' = 'medium'): void {
    const label = labelNode.getComponent(Label);
    if (!label) return;

    switch (variant) {
        case 'title':
            label.fontSize = UI_THEME.fontSizeTitle;
            label.color = UI_THEME.textPrimaryColor;
            break;
        case 'large':
            label.fontSize = UI_THEME.fontSizeLarge;
            label.color = UI_THEME.textPrimaryColor;
            break;
        case 'medium':
            label.fontSize = UI_THEME.fontSizeMedium;
            label.color = UI_THEME.textSecondaryColor;
            break;
        case 'small':
            label.fontSize = UI_THEME.fontSizeSmall;
            label.color = UI_THEME.textSecondaryColor;
            break;
    }
}

/**
 * 样式化面板标题
 * 标题使用浅蓝/白色，字号比正文大
 * @param labelNode Label 节点
 */
export function stylePanelTitle(labelNode: Node): void {
    const label = labelNode.getComponent(Label);
    if (!label) return;

    label.fontSize = UI_THEME.fontSizeTitle;
    label.color = UI_THEME.textAccentColor;
}

/**
 * 样化数值文字
 * 数值使用青色，突出显示
 * @param labelNode Label 节点
 */
export function styleValueLabel(labelNode: Node): void {
    const label = labelNode.getComponent(Label);
    if (!label) return;

    label.fontSize = UI_THEME.fontSizeMedium;
    label.color = UI_THEME.textValueColor;
}

/**
 * 样式化警告文字
 * 警告使用橙色
 * @param labelNode Label 节点
 */
export function styleWarningLabel(labelNode: Node): void {
    const label = labelNode.getComponent(Label);
    if (!label) return;

    label.fontSize = UI_THEME.fontSizeMedium;
    label.color = UI_THEME.textWarningColor;
}

/**
 * 样式化面板
 * 必须读取 UITransform 尺寸，不要用 panelPadding 画 40×40 小面板
 *
 * 优先修改 Sprite 颜色，如果没有 Sprite 再使用 Graphics fallback
 * 如果有 Sprite，也需要绘制描边层
 * @param panelNode 面板节点
 */
export function stylePanel(panelNode: Node): void {
    // 1. 查找 Sprite 组件
    const sprite = panelNode.getComponent(Sprite) || findFirstSpriteInChildren(panelNode);

    // 2. 修改 Sprite 颜色
    if (sprite) {
        sprite.color = UI_THEME.panelBgColor;
    }

    // 3. 创建/复用 UIStyleBg 子节点作为背景和描边，放到 children 最前面
    const transform = panelNode.getComponent(UITransform);

    // 读取 UITransform 尺寸
    let width = 400;
    let height = 300;
    if (transform) {
        width = transform.width;
        height = transform.height;
    }

    let bgNode = panelNode.getChildByName('UIStyleBg');
    if (!bgNode) {
        bgNode = new Node('UIStyleBg');
        bgNode.parent = panelNode;
        bgNode.setSiblingIndex(0); // 放到最前面，作为背景
    }

    const graphics = bgNode.getComponent(Graphics) || bgNode.addComponent(Graphics);
    const bgTransform = bgNode.getComponent(UITransform) || bgNode.addComponent(UITransform);
    bgTransform.setContentSize(width, height);

    // 只在初始化时绘制，不做每帧重绘
    graphics.clear();

    // 如果没有 Sprite，绘制背景
    if (!sprite) {
        graphics.fillColor = UI_THEME.panelBgColor;
        graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.panelRadius);
        graphics.fill();
    }

    // 绘制描边（无论是否有 Sprite）
    graphics.strokeColor = UI_THEME.panelBorderColor;
    graphics.lineWidth = 3; // 描边稍粗，更明显
    graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.panelRadius);
    graphics.stroke();
}

/**
 * 样式化外层大框
 * 用于肉鸽选择面板等需要明显外框的场景
 * 深色半透明背景 + 青色/蓝紫色描边 + 轻微科幻 UI 质感
 * @param panelNode 面板节点
 */
export function styleOuterFrame(panelNode: Node): void {
    // 1. 查找 Sprite 组件
    const sprite = panelNode.getComponent(Sprite) || findFirstSpriteInChildren(panelNode);

    // 2. 修改 Sprite 颜色
    if (sprite) {
        sprite.color = UI_THEME.panelBgColor;
    }

    // 3. 创建/复用 UIStyleBg 子节点作为背景和描边，放到 children 最前面
    const transform = panelNode.getComponent(UITransform);

    // 读取 UITransform 尺寸
    let width = 600;
    let height = 500;
    if (transform) {
        width = transform.width;
        height = transform.height;
    }

    let bgNode = panelNode.getChildByName('UIStyleBg');
    if (!bgNode) {
        bgNode = new Node('UIStyleBg');
        bgNode.parent = panelNode;
        bgNode.setSiblingIndex(0); // 放到最前面，作为背景
    }

    const graphics = bgNode.getComponent(Graphics) || bgNode.addComponent(Graphics);
    const bgTransform = bgNode.getComponent(UITransform) || bgNode.addComponent(UITransform);
    bgTransform.setContentSize(width, height);

    // 只在初始化时绘制，不做每帧重绘
    graphics.clear();

    // 绘制背景（深色半透明）
    graphics.fillColor = UI_THEME.panelBgColor;
    graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.panelRadius);
    graphics.fill();

    // 绘制外层描边（青色/蓝紫色，稍粗）
    graphics.strokeColor = UI_THEME.panelBorderColor;
    graphics.lineWidth = 4; // 外框描边更粗
    graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.panelRadius);
    graphics.stroke();

    // 绘制内层描边（更亮的青色，营造层次感）
    graphics.strokeColor = new Color(
        Math.min(255, UI_THEME.panelBorderColor.r + 30),
        Math.min(255, UI_THEME.panelBorderColor.g + 30),
        Math.min(255, UI_THEME.panelBorderColor.b + 30),
        150
    );
    graphics.lineWidth = 1;
    graphics.roundRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8, UI_THEME.panelRadius - 2);
    graphics.stroke();
}

/**
 * 样式化卡片
 * 用于肉鸽选项卡片，有明显边框效果
 *
 * 如果节点有 Sprite，也不能只改 sprite.color，需要额外绘制边框层
 * 推荐创建/复用 UIStyleBg 子节点，放在 children 最前面
 *
 * @param cardNode 卡片节点
 * @param variant 卡片变体：default（默认）、highlight（高亮）
 */
export function styleCard(cardNode: Node, variant: 'default' | 'highlight' = 'default'): void {
    // 1. 设置颜色
    let bgColor: Color;
    let borderColor: Color;

    switch (variant) {
        case 'default':
            bgColor = UI_THEME.cardBgColor;
            borderColor = UI_THEME.cardBorderColor;
            break;
        case 'highlight':
            bgColor = UI_THEME.cardHighlightColor;
            borderColor = UI_THEME.cardBorderColor;
            break;
    }

    // 2. 查找 Sprite 组件（仅用于修改颜色，不用于绘制边框）
    const sprite = cardNode.getComponent(Sprite) || findFirstSpriteInChildren(cardNode);
    if (sprite) {
        sprite.color = bgColor;
    }

    // 3. 创建/复用 UIStyleBg 子节点作为背景和边框，放到 children 最前面
    let bgNode = cardNode.getChildByName('UIStyleBg');
    if (!bgNode) {
        bgNode = new Node('UIStyleBg');
        bgNode.parent = cardNode;
        bgNode.setSiblingIndex(0); // 放到最前面，作为背景
    }

    const transform = cardNode.getComponent(UITransform);
    let width = 200;
    let height = 150;
    if (transform) {
        width = transform.width;
        height = transform.height;
    }

    const graphics = bgNode.getComponent(Graphics) || bgNode.addComponent(Graphics);
    const bgTransform = bgNode.getComponent(UITransform) || bgNode.addComponent(UITransform);
    bgTransform.setContentSize(width, height);

    // 绘制背景和边框
    graphics.clear();
    graphics.fillColor = bgColor;
    graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.panelRadius);
    graphics.fill();
    graphics.strokeColor = borderColor;
    graphics.lineWidth = 3; // 边框稍粗，更明显
    graphics.roundRect(-width / 2, -height / 2, width, height, UI_THEME.panelRadius);
    graphics.stroke();
}


