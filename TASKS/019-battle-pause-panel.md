# 019 战斗暂停弹窗

## 任务目标

新增"战斗暂停弹窗"，点击暂停按钮后弹出面板，提供继续游戏、重打本关、返回主菜单三个选项。

---

## 背景说明

- 当前 BattleUI 已有 pauseButton 和 _onPause() 方法，但只是简单切换暂停/恢复，没有弹窗
- BattleManager 已有 pauseBattle() 和 resumeBattle() 方法
- 需要新增 BattlePausePanel.ts 组件，提供完整的暂停弹窗功能

---

## 涉及文件

### 新增文件

- `assets/scripts/ui/BattlePausePanel.ts` - 暂停弹窗组件
- `assets/scripts/ui/BattlePausePanel.ts.meta` - Cocos meta 文件（用户用 Creator 打开自动生成）
- `TASKS/019-battle-pause-panel.md` - 任务文件

### 修改文件

- `assets/scripts/ui/BattleUI.ts` - 新增 pausePanel 属性，修改 _onPause()
- `CHANGELOG.md` - 记录变更
- `docs/handoff/CURRENT_STATE.md` - 更新交接状态

---

## 允许修改范围

- `assets/scripts/ui/BattlePausePanel.ts`（新增）
- `assets/scripts/ui/BattlePausePanel.ts.meta`（新增，用户用 Creator 自动生成）
- `assets/scripts/ui/BattleUI.ts`
- `assets/scripts/core/EventBus.ts`（仅必要时）
- `assets/scripts/core/GameManager.ts`（仅必要时）
- `CHANGELOG.md`
- `PROJECT_MEMORY.md`
- `docs/handoff/CURRENT_STATE.md`
- `TASKS/019-battle-pause-panel.md`

---

## 禁止修改范围

- 所有 `.scene` 文件
- StageConfig.ts / EnemyConfig.ts / TowerConfig.ts / BattleBalanceConfig.ts
- StageSelectPanel.ts / SaveManager.ts
- 平台构建配置 / 平台适配层代码
- 新增图片资源 / prefab / 第三方依赖
- 自动提交 Git

---

## 实现步骤

### 步骤 1：新增 BattlePausePanel.ts

创建独立 UI 组件，提供 open()/close() 方法，支持 lazy init：

```typescript
@ccclass('BattlePausePanel')
export class BattlePausePanel extends Component {
    // 内部状态
    private _initialized: boolean = false;
    private _panelContainer: Node | null = null;

    // 回调
    private _onContinue: (() => void) | null = null;
    private _onRetry: (() => void) | null = null;
    private _onReturnMain: (() => void) | null = null;

    open(): void {
        this.node.active = true;
        this._ensureInitialized();
    }

    close(): void {
        this.node.active = false;
    }

    setCallbacks(onContinue, onRetry, onReturnMain): void { ... }

    private _ensureInitialized(): void {
        if (this._initialized) return;
        this._createUI();
        this._initialized = true;
    }

    private _createUI(): void {
        // 创建半透明遮罩
        // 创建面板容器
        // 创建标题："暂停"
        // 创建说明文字："战斗已暂停"
        // 创建三个按钮：继续游戏、重打本关、返回主菜单
    }
}
```

**弹窗样式：**
- 半透明遮罩（深色，覆盖整个 BattlePausePanelRoot）
- 居中主面板（深色背景 + 青色描边，类似 styleOuterFrame）
- 顶部标题："暂停"
- 中间说明："战斗已暂停"
- 底部纵向三个按钮：
  - 继续游戏（primary 样式）
  - 重打本关（secondary 样式）
  - 返回主菜单（ghost 样式）
- 使用 Graphics 动态绘制，不新增图片资源

### 步骤 2：修改 BattleUI.ts

新增 pausePanel 属性，修改 _onPause() 方法：

```typescript
@property(Node)
battlePausePanel: Node | null = null;  // 用户绑定 BattlePausePanelRoot

private _pausePanel: BattlePausePanel | null = null;

private _onPause(): void {
    if (!this._battleManager) return;
    if (this._battleManager.isPlaying()) {
        this._battleManager.pauseBattle();
        this._showPausePanel();
    }
}

private _showPausePanel(): void {
    if (!this.battlePausePanel) {
        console.error('[BattleUI] battlePausePanel 未绑定');
        return;
    }

    // 获取或初始化 BattlePausePanel 组件
    if (!this._pausePanel) {
        this._pausePanel = this.battlePausePanel.getComponent(BattlePausePanel);
        if (!this._pausePanel) {
            this._pausePanel = this.battlePausePanel.addComponent(BattlePausePanel);
        }
        this._pausePanel.setCallbacks(
            () => this._onPauseContinue(),
            () => this._onPauseRetry(),
            () => this._onPauseReturnMain()
        );
    }

    this._pausePanel.open();
}

private _onPauseContinue(): void {
    this._battleManager?.resumeBattle();
    this._pausePanel?.close();
}

private _onPauseRetry(): void {
    this._pausePanel?.close();
    const stageId = this._battleManager?.getCurrentStage()?.id;
    this._battleManager?.returnToIdle();
    if (stageId) {
        this._battleManager?.startBattle(stageId);
    }
}

private _onPauseReturnMain(): void {
    this._pausePanel?.close();
    this._gameManager?.returnToMain();
}
```

### 步骤 3：更新文档

- 更新 `CHANGELOG.md`
- 更新 `docs/handoff/CURRENT_STATE.md`

---

## 关键设计决策

1. **暂停逻辑**：复用 BattleManager.pauseBattle()，不新增暂停方法
2. **重打本关**：调用 returnToIdle() 后再调用 startBattle(stageId)，倍速自动重置为 1x
3. **返回主菜单**：调用 GameManager.returnToMain()，不触发胜利结算
4. **弹窗样式**：使用 Graphics 动态绘制，styleOuterFrame/styleButton 统一样式
5. **lazy init**：BattlePausePanel 支持节点初始 active=false

---

## Cocos Creator 人工操作清单

1. 在 BattleUIRoot 下创建空节点 PauseButton（如果还没有）
2. 在 BattleUIRoot 下创建空节点 BattlePausePanelRoot
3. 设置 BattlePausePanelRoot 默认 active=false
4. 将 BattlePausePanel.ts 挂载到 BattlePausePanelRoot
5. 在 BattleUI 组件中绑定 pauseButton（如果还没有）
6. 在 BattleUI 组件中绑定 battlePausePanel（指向 BattlePausePanelRoot）
7. 调整 PauseButton 位置（战斗界面合适位置）
8. 保存 Battle.scene
9. 用 Cocos Creator 打开项目自动生成 BattlePausePanel.ts.meta

---

## 验收标准

1. ✅ Web 预览进入战斗正常
2. ✅ 战斗中点击暂停按钮，战斗停止
3. ✅ 弹出"战斗暂停弹窗"
4. ✅ 弹窗样式符合"弹窗风格"（半透明遮罩 + 居中面板 + 按钮）
5. ✅ 点击"继续游戏"后，弹窗关闭，战斗恢复
6. ✅ 点击"重打本关"后，重新开始当前关卡
7. ✅ 重打本关后倍速显示和逻辑都回到 1x
8. ✅ 点击"返回主菜单"后，退出战斗并回到主界面
9. ✅ 返回主菜单不触发胜利结算和奖励
10. ✅ 暂停期间敌人、塔、投射物、倒计时都停止
11. ✅ 多次暂停/继续不会重复创建 UI
12. ✅ 不修改任何 `.scene` 文件
13. ✅ 新增 BattlePausePanel.ts 时必须有 .meta
14. ✅ TypeScript 编译无错误
15. ✅ Web 预览待用户确认

---

## 测试方式

### Web 预览测试

1. 打开 Cocos Creator，运行 Web 预览
2. 进入战斗
3. 点击暂停按钮
4. 确认战斗停止，弹出暂停弹窗
5. 点击"继续游戏"，确认弹窗关闭，战斗恢复
6. 再次点击暂停按钮
7. 点击"重打本关"，确认重新开始当前关卡，倍速回到 1x
8. 再次点击暂停按钮
9. 点击"返回主菜单"，确认回到主界面
10. 确认没有触发胜利结算和奖励

---

## 回滚方式

1. 删除 `assets/scripts/ui/BattlePausePanel.ts`
2. 删除 `assets/scripts/ui/BattlePausePanel.ts.meta`
3. 恢复 `assets/scripts/ui/BattleUI.ts`
4. 删除 `TASKS/019-battle-pause-panel.md`

---

## 风险点

1. **暂停逻辑冲突**：当前 pauseBattle() 只设置 _state='paused'，不影响 _isForcePaused（肉鸽暂停）
   - 缓解：两种暂停独立，不冲突

2. **重打本关**：需要正确获取当前 stageId
   - 缓解：使用 getCurrentStage()?.id 获取

3. **返回主菜单不触发结算**：GameManager.returnToMain() 调用 returnToIdle()，不触发 BATTLE_SETTLEMENT
   - 缓解：returnToIdle() 只清理状态，不发放奖励

4. **BattlePausePanelRoot 默认 inactive**：需要 open() 支持 lazy init
   - 缓解：open() 中先激活节点，再调用 _ensureInitialized()

5. **.meta 文件**：新增脚本必须有 .meta
   - 缓解：提醒用户用 Cocos Creator 打开项目自动生成

---

## 给执行 Agent 的执行提示词

你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/019-battle-pause-panel.md

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. TASKS/019-battle-pause-panel.md

执行前先输出：
1. 已阅读哪些文件
2. 当前任务目标
3. 本次计划修改哪些文件
4. 不会修改哪些文件
5. 可能风险

严格遵守当前任务的允许修改范围和禁止修改范围。
不要自动提交 Git。
