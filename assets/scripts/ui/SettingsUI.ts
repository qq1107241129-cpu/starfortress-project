/**
 * 设置 UI
 * 提供音效、震动开关和存档调试预留
 *
 * 使用方式：
 * 1. 在 Cocos Creator 中创建设置界面节点
 * 2. 挂载此组件
 * 3. 绑定开关节点和返回按钮
 */

import { _decorator, Component, Node, Button, Label } from 'cc';
import { GameManager } from '../core/GameManager';
import { BaseManager } from '../base/BaseManager';

const { ccclass, property } = _decorator;

/** 设置数据结构 */
export interface GameSettings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
    soundEnabled: true,
    vibrationEnabled: true,
};

@ccclass('SettingsUI')
export class SettingsUI extends Component {
    // ==================== 开关节点 ====================
    @property(Node)
    soundToggle: Node | null = null;

    @property(Node)
    vibrationToggle: Node | null = null;

    // ==================== 状态显示 ====================
    @property(Label)
    soundLabel: Label | null = null;

    @property(Label)
    vibrationLabel: Label | null = null;

    // ==================== 按钮 ====================
    @property(Node)
    backButton: Node | null = null;

    @property(Node)
    resetSaveButton: Node | null = null;

    // ==================== 内部状态 ====================
    private _gameManager: GameManager | null = null;
    private _baseManager: BaseManager | null = null;
    private _settings: GameSettings = { ...DEFAULT_SETTINGS };

    // 绑定回调引用
    private _boundOnBack: (() => void) | null = null;
    private _boundOnSoundToggle: (() => void) | null = null;
    private _boundOnVibrationToggle: (() => void) | null = null;
    private _boundOnResetSave: (() => void) | null = null;
    private _unsubStateChange: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad(): void {
        this._gameManager = GameManager.getInstance();
        this._baseManager = BaseManager.getInstance();

        // 绑定按钮
        if (this.backButton) {
            this._boundOnBack = () => this._onBack();
            this.backButton.on(Node.EventType.TOUCH_END, this._boundOnBack);
        }

        if (this.soundToggle) {
            this._boundOnSoundToggle = () => this._onSoundToggle();
            this.soundToggle.on(Node.EventType.TOUCH_END, this._boundOnSoundToggle);
        }

        if (this.vibrationToggle) {
            this._boundOnVibrationToggle = () => this._onVibrationToggle();
            this.vibrationToggle.on(Node.EventType.TOUCH_END, this._boundOnVibrationToggle);
        }

        if (this.resetSaveButton) {
            this._boundOnResetSave = () => this._onResetSave();
            this.resetSaveButton.on(Node.EventType.TOUCH_END, this._boundOnResetSave);
        }

        // 默认隐藏
        this.node.active = false;

        // 监听状态变化
        this._unsubStateChange = this._gameManager.onStateChange((state) => {
            this.node.active = (state === 'settings');
            if (state === 'settings') {
                this._loadSettings();
                this._refreshUI();
            }
        });
    }

    onDestroy(): void {
        if (this.backButton && this._boundOnBack) {
            this.backButton.off(Node.EventType.TOUCH_END, this._boundOnBack);
        }
        if (this.soundToggle && this._boundOnSoundToggle) {
            this.soundToggle.off(Node.EventType.TOUCH_END, this._boundOnSoundToggle);
        }
        if (this.vibrationToggle && this._boundOnVibrationToggle) {
            this.vibrationToggle.off(Node.EventType.TOUCH_END, this._boundOnVibrationToggle);
        }
        if (this.resetSaveButton && this._boundOnResetSave) {
            this.resetSaveButton.off(Node.EventType.TOUCH_END, this._boundOnResetSave);
        }
        if (this._unsubStateChange) {
            this._unsubStateChange();
            this._unsubStateChange = null;
        }

        this._boundOnBack = null;
        this._boundOnSoundToggle = null;
        this._boundOnVibrationToggle = null;
        this._boundOnResetSave = null;
        this._gameManager = null;
        this._baseManager = null;
    }

    // ==================== 按钮事件 ====================

    private _onBack(): void {
        this._saveSettings();
        this._gameManager?.returnToMain();
    }

    private _onSoundToggle(): void {
        this._settings.soundEnabled = !this._settings.soundEnabled;
        this._refreshUI();
    }

    private _onVibrationToggle(): void {
        this._settings.vibrationEnabled = !this._settings.vibrationEnabled;
        this._refreshUI();
    }

    private _onResetSave(): void {
        // MVP 阶段：重置存档（需确认）
        console.log('[SettingsUI] 重置存档（MVP 阶段直接重置，后续加确认弹窗）');
        if (this._baseManager) {
            const saveMgr = this._baseManager.getSaveManager();
            saveMgr.resetToDefault().then(() => {
                console.log('[SettingsUI] 存档已重置');
            });
        }
    }

    // ==================== 设置读写 ====================

    private _loadSettings(): void {
        if (!this._baseManager) return;
        const saveMgr = this._baseManager.getSaveManager();
        const save = saveMgr.getSave();

        if (save.settings && save.settings.sound !== undefined) {
            this._settings.soundEnabled = save.settings.sound === 'true';
        }
        if (save.settings && save.settings.vibration !== undefined) {
            this._settings.vibrationEnabled = save.settings.vibration === 'true';
        }
    }

    private _saveSettings(): void {
        if (!this._baseManager) return;
        const saveMgr = this._baseManager.getSaveManager();
        saveMgr.updateSave({
            settings: {
                sound: String(this._settings.soundEnabled),
                vibration: String(this._settings.vibrationEnabled),
            },
        });
    }

    // ==================== UI 刷新 ====================

    private _refreshUI(): void {
        if (this.soundLabel) {
            this.soundLabel.string = `音效: ${this._settings.soundEnabled ? '开' : '关'}`;
        }
        if (this.vibrationLabel) {
            this.vibrationLabel.string = `震动: ${this._settings.vibrationEnabled ? '开' : '关'}`;
        }
    }
}
