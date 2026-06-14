/**
 * UI 主题配置
 * 定义统一颜色、字号、按钮尺寸、面板透明度、描边色
 *
 * 美术方向：
 * - 科幻基地 UI
 * - 深色半透明面板
 * - 蓝紫色/青色描边感
 * - 按钮有轻微发光/描边/层次
 * - 文字清晰，不拥挤
 */

import { Color } from 'cc';

export const UI_THEME = {
    // ==================== 面板颜色 ====================
    /** 面板背景色（深色半透明） */
    panelBgColor: new Color(20, 20, 40, 230),
    /** 面板描边色（蓝紫色） */
    panelBorderColor: new Color(100, 180, 255, 200),

    // ==================== 按钮颜色 ====================
    /** 主按钮背景色（蓝紫色） */
    primaryButtonColor: new Color(60, 120, 200, 255),
    /** 主按钮描边色（亮蓝） */
    primaryButtonBorderColor: new Color(100, 180, 255, 200),
    /** 危险按钮背景色（红橙色） */
    dangerButtonColor: new Color(200, 60, 60, 255),
    /** 危险按钮描边色（亮红） */
    dangerButtonBorderColor: new Color(255, 100, 100, 200),
    /** 次要按钮背景色（暗灰色） */
    secondaryButtonColor: new Color(60, 60, 80, 255),
    /** 次要按钮描边色（暗蓝灰） */
    secondaryButtonBorderColor: new Color(100, 100, 140, 200),
    /** 幽灵按钮背景色（半透明深色） */
    ghostButtonColor: new Color(40, 40, 60, 200),
    /** 幽灵按钮描边色（暗蓝灰） */
    ghostButtonBorderColor: new Color(80, 80, 120, 150),

    // ==================== 文字颜色 ====================
    /** 主文字颜色（白色） */
    textPrimaryColor: new Color(255, 255, 255, 255),
    /** 次要文字颜色（浅蓝灰） */
    textSecondaryColor: new Color(180, 200, 220, 255),
    /** 强调文字颜色（青色） */
    textAccentColor: new Color(100, 200, 255, 255),
    /** 数值文字颜色（青色） */
    textValueColor: new Color(100, 200, 255, 255),
    /** 警告文字颜色（橙色） */
    textWarningColor: new Color(255, 150, 50, 255),

    // ==================== 字号 ====================
    /** 标题字号 */
    fontSizeTitle: 28,
    /** 大字号 */
    fontSizeLarge: 24,
    /** 中字号 */
    fontSizeMedium: 20,
    /** 小字号 */
    fontSizeSmall: 16,

    // ==================== 卡片颜色 ====================
    /** 卡片背景色（深色半透明） */
    cardBgColor: new Color(30, 30, 50, 220),
    /** 卡片描边色（青色） */
    cardBorderColor: new Color(100, 200, 255, 180),
    /** 卡片高亮色（蓝紫色） */
    cardHighlightColor: new Color(80, 160, 240, 255),

    // ==================== 圆角 ====================
    /** 按钮圆角 */
    buttonRadius: 8,
    /** 面板圆角 */
    panelRadius: 12,
};
