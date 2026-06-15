# 016 关卡选择动态面板

## 任务目标

实现关卡选择动态面板，让玩家在主界面点击"开始游戏"后打开关卡选择界面，而不是直接进入第一关。面板根据 StageConfig 自动生成关卡列表，支持解锁/锁定状态，胜利后解锁下一关。

---

## 背景说明

- 第一关已经可以正常游玩
- 当前 MainUI._onStartBattle() 硬编码调用 enterBattle(0)，直接进入第一关
- 缺少关卡选择入口，不方便扩展后续关卡
- StageConfig.ts 已有 10 关配置
- SaveManager.ts 已有 currentStage 和 highestStage 字段
- GameManager.enterBattle(stageIndex) 已支持传入具体关卡索引

---

## 涉及文件

### 新增文件

- `assets/scripts/ui/StageSelectPanel.ts` - 关卡选择面板组件
- `assets/scripts/ui/StageSelectPanel.ts.meta` - Cocos meta 文件（用户用 Creator 打开自动生成）

### 修改文件

- `assets/scripts/ui/MainUI.ts` - 开始游戏按钮改为打开关卡选择面板
- `assets/scripts/core/GameManager.ts` - 新增 stageSelect 状态
- `assets/scripts/core/SaveManager.ts` - 新增 updateHighestStage 方法
- `assets/scripts/bootstrap/GameBootstrap.ts` - 胜利时更新 highestStage
- `assets/scripts/ui/SettlementUI.ts` - 继续按钮逻辑优化
- `CHANGELOG.md` - 记录本次改动
- `PROJECT_MEMORY.md` - 更新关卡选择相关说明
- `docs/handoff/CURRENT_STATE.md` - 更新交接状态

---

## 允许修改范围

- `assets/scripts/ui/MainUI.ts`
- `assets/scripts/ui/StageSelectPanel.ts`（新增）
- `assets/scripts/ui/StageSelectPanel.ts.meta`（新增，用户用 Creator 自动生成）
- `assets/scripts/core/GameManager.ts`
- `assets/scripts/core/SaveManager.ts`
- `assets/scripts/bootstrap/GameBootstrap.ts`
- `assets/scripts/ui/SettlementUI.ts`
- `CHANGELOG.md`
- `PROJECT_MEMORY.md`
- `docs/handoff/CURRENT_STATE.md`

---

## 禁止修改范围

- 禁止修改任何 `.scene` 文件
- 禁止手写 Battle.scene JSON
- 禁止修改平台构建配置
- 禁止修改平台适配层代码
- 禁止接服务器
- 禁止接支付
- 禁止引入第三方依赖
- 禁止做复杂关卡大地图
- 禁止一次性做完整 10 关数值（StageConfig 已有 10 关配置，本次不修改数值）
- 禁止新增图片、美术资源或 prefab
- 禁止顺手重构无关代码
- 禁止自动提交 Git
- 禁止自动合并 develop

---

## 实现步骤

### 步骤 1：新增 StageSelectPanel.ts

创建 `assets/scripts/ui/StageSelectPanel.ts`，作为独立 UI 组件。

**核心功能：**
- `open()` 方法：打开面板，刷新关卡列表
- `close()` 方法：关闭面板
- `refresh()` 方法：刷新关卡列表和解锁状态
- 动态生成关卡按钮（使用 Graphics + Label，不引入图片资源）
- 读取 StageConfig 获取关卡列表
- 读取 SaveManager.highestStage 判断解锁状态
- 已解锁关卡点击后调用 GameManager.enterBattle(stageIndex)
- 未解锁关卡显示锁定状态，不允许点击

**解锁逻辑：**
- Stage 1（index 0）：始终解锁
- Stage N（index N-1）：`highestStage >= N-1` 时解锁
- 默认 `highestStage: 0`，所以初始只有第 1 关可玩

**UI 结构（动态生成）：**
- 标题 Label："选择关卡"
- 关闭按钮：返回主界面
- 关卡按钮列表：垂直排列
  - 每个按钮显示：关卡名称 + 描述 + 锁定/解锁状态
  - 已解锁：可点击，高亮显示
  - 未解锁：置灰，不可点击

---

### 步骤 2：修改 MainUI.ts

**改动点：**
- 新增 `@property(Node) stageSelectPanel: Node | null = null` 属性（可选绑定）
- 修改 `_onStartBattle()` 方法：
  - 优先尝试打开 StageSelectPanel
  - 如果 StageSelectPanel 未绑定或未找到，输出 warn 日志
  - 保留兜底逻辑：直接进入最高可挑战关卡

```typescript
private _onStartBattle(): void {
    // 优先打开关卡选择面板
    if (this.stageSelectPanel) {
        const panel = this.stageSelectPanel.getComponent(StageSelectPanel);
        if (panel) {
            panel.open();
            return;
        }
    }
    // 兜底：直接进入最高可挑战关卡
    console.warn('[MainUI] StageSelectPanel 未找到，直接进入最高可挑战关卡');
    const saveMgr = this._baseManager?.getSaveManager();
    const highestStage = saveMgr?.getSave().highestStage || 0;
    this._gameManager?.enterBattle(highestStage);
}
```

---

### 步骤 3：修改 GameManager.ts

**改动点：**
- 在 `GameFlowState` 类型中新增 `'stageSelect'` 状态
- 新增 `enterStageSelect()` 方法

```typescript
export type GameFlowState =
    | 'main'
    | 'stageSelect'  // 新增：关卡选择
    | 'battle'
    | 'settlement'
    | 'building'
    | 'towerUpgrade'
    | 'rebirth'
    | 'settings';

enterStageSelect(): void {
    this.setState('stageSelect');
}
```

---

### 步骤 4：修改 SaveManager.ts

**改动点：**
- 确认 `highestStage` 默认值为 0（已正确）
- 新增 `updateHighestStage(stageIndex: number)` 方法

```typescript
/**
 * 更新最高关卡记录
 * 只在新记录更高时更新
 * @param stageIndex 关卡索引（0-based）
 */
async updateHighestStage(stageIndex: number): Promise<void> {
    if (!this._currentSave) return;
    const stageNumber = stageIndex + 1; // index 0 = stage 1
    if (stageNumber > this._currentSave.highestStage) {
        this._currentSave.highestStage = stageNumber;
        await this.save();
        console.log(`[SaveManager] 最高关卡更新: ${stageNumber}`);
    }
}
```

---

### 步骤 5：修改 GameBootstrap.ts

**改动点：**
- 监听 `BATTLE_RESULT` 事件
- 胜利时调用 `SaveManager.updateHighestStage(currentStageIndex)`

```typescript
// 在 _setupEventListeners() 中添加
this._eventBus.on(BATTLE_EVENTS.BATTLE_RESULT, (data: { result: 'victory' | 'defeat' }) => {
    if (data.result === 'victory') {
        const battleInfo = this._battleManager.getBattleInfo();
        // 从 stageId 推算 index
        const stageIndex = this._getStageIndexFromId(battleInfo.stageId);
        if (stageIndex >= 0) {
            this._saveManager.updateHighestStage(stageIndex);
        }
    }
});
```

**注意：** 需要新增 `_getStageIndexFromId()` 辅助方法，从 stageId（如 'stage_1'）推算 index（如 0）。

---

### 步骤 6：修改 SettlementUI.ts

**改动点：**
- 修改 `_onContinue()` 方法：
  - 胜利后如果有下一关且已解锁，直接进入下一关
  - 否则返回主界面
- 不硬编码关卡号，动态计算下一关

```typescript
private _onContinue(): void {
    if (!this._currentResult) return;
    const result = this._currentResult;
    this._currentResult = null;
    this.node.active = false;

    // 胜利后尝试进入下一关
    if (result.result === 'victory') {
        const nextStageIndex = this._getNextStageIndex(result.stageId);
        if (nextStageIndex >= 0) {
            this._gameManager?.enterBattle(nextStageIndex);
            return;
        }
    }
    // 默认返回主界面
    this._gameManager?.returnToMain();
}

private _getNextStageIndex(currentStageId: string): number {
    // 从 stageId 推算当前 index，然后 +1
    const match = currentStageId.match(/stage_(\d+)/);
    if (match) {
        const currentIndex = parseInt(match[1], 10) - 1;
        const nextIndex = currentIndex + 1;
        // 检查下一关是否存在
        if (nextIndex < this._configManager.getStageCount()) {
            return nextIndex;
        }
    }
    return -1; // 没有下一关
}
```

---

### 步骤 7：更新文档

- 更新 `CHANGELOG.md`：记录 016 关卡选择动态面板
- 更新 `PROJECT_MEMORY.md`：补充关卡选择相关说明
- 更新 `docs/handoff/CURRENT_STATE.md`：更新交接状态

---

## Cocos Creator 人工操作清单

由于执行 Agent 禁止修改 `.scene`，以下操作需用户在 Cocos Creator 中手动完成：

### 1. 创建 StageSelectPanelRoot 节点

- 在 `MainUIRoot` 下新建空节点，命名为 `StageSelectPanelRoot`
- 设置默认 `active = false`（面板默认隐藏）

### 2. 挂载 StageSelectPanel 组件

- 选中 `StageSelectPanelRoot` 节点
- 在属性检查器中点击「添加组件」
- 搜索并添加 `StageSelectPanel` 脚本组件

### 3. 绑定 MainUI 引用（可选）

- 选中 `MainUIRoot` 节点上的 `MainUI` 组件
- 将 `StageSelectPanelRoot` 拖拽到 `stageSelectPanel` 属性
- 如果不绑定，代码会自动通过节点查找（有 warn 日志提示）

### 4. 调整布局

- 调整 `StageSelectPanelRoot` 的位置、大小、锚点
- 建议覆盖大部分屏幕（竖屏 1080x1920）

### 5. 保存场景

- 通过 Cocos Creator 保存 `Battle.scene`

**注意：** `.scene` 变更属于用户人工 Cocos 编辑器改动，执行 Agent 不处理、不回滚、不格式化、不 checkout、不 stash。

---

## 验收标准

1. ✅ Web 预览进入主界面正常
2. ✅ 点击"开始游戏"后打开关卡选择面板（不直接进入战斗）
3. ✅ 面板中至少显示第 1 关和第 2 关
4. ✅ 初始状态第 1 关可点击，第 2 关锁定
5. ✅ 点击第 1 关可以进入第一关战斗
6. ✅ 第一关胜利后，highestStage 更新，第 2 关解锁
7. ✅ 回到主界面再次点击"开始游戏"，第 2 关可点击
8. ✅ 失败不会解锁下一关
9. ✅ 后续在 StageConfig 增加第 3 关后，面板能自动多显示一个关卡按钮
10. ✅ 不修改 .scene
11. ✅ 新增 StageSelectPanel.ts 时必须有 .meta
12. ✅ TypeScript 编译无错误
13. ✅ 未引入新依赖
14. ✅ 未改变平台 adapter 规则
15. ✅ 未自动提交 Git

---

## 测试方式

### Web 预览测试

1. 打开 Cocos Creator，运行 Web 预览
2. 主界面点击"开始游戏"，确认打开关卡选择面板
3. 确认第 1 关可点击，第 2 关锁定
4. 点击第 1 关进入战斗
5. 胜利后返回主界面，再次点击"开始游戏"
6. 确认第 2 关已解锁

### 失败测试

1. 故意失败一局（不放塔或放弱塔）
2. 确认 highestStage 不更新
3. 确认下一关仍然锁定

### 扩展性测试

1. 在 StageConfig 中临时添加第 11 关配置
2. 确认面板自动显示第 11 关按钮（锁定状态）

---

## 回滚方式

1. 删除 `assets/scripts/ui/StageSelectPanel.ts`
2. 恢复 `MainUI.ts` 的 `_onStartBattle()` 为直接调用 `enterBattle(0)`
3. 恢复 `GameManager.ts` 的 `GameFlowState` 类型（移除 stageSelect）
4. 恢复 `SaveManager.ts`（移除 updateHighestStage 方法）
5. 恢复 `GameBootstrap.ts`（移除 BATTLE_RESULT 监听）
6. 恢复 `SettlementUI.ts` 的 `_onContinue()` 方法

---

## 风险点

1. **StageSelectPanel 动态 UI 生成复杂度**
   - 风险：动态创建节点可能与 Cocos 场景绑定冲突
   - 缓解：StageSelectPanel 完全动态生成，不依赖场景节点绑定

2. **highestStage 更新时机**
   - 风险：如果更新发生在结算前，可能导致数据不一致
   - 缓解：在 BATTLE_RESULT 事件后更新，结算流程已启动

3. **SettlementUI "继续"按钮逻辑**
   - 风险：如果下一关配置不存在，可能导致崩溃
   - 缓解：检查下一关是否存在，不存在则返回主界面

4. **GameManager 状态扩展**
   - 风险：新增 stageSelect 状态可能影响现有 UI 显隐逻辑
   - 缓解：stageSelect 状态下 MainUI 隐藏，StageSelectPanel 显示

5. **.meta 文件缺失**
   - 风险：新增 StageSelectPanel.ts 后如果没有 .meta，Cocos 无法识别
   - 缓解：提醒用户用 Cocos Creator 打开项目自动生成

---

## 给执行 Agent 的执行提示词

你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/016-stage-select-dynamic-panel.md

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. docs/AI_WORKFLOW.md
6. docs/REVIEW_CHECKLIST.md
7. TASKS/016-stage-select-dynamic-panel.md

执行前先输出：
1. 已阅读哪些文件
2. 当前任务目标
3. 本次计划修改哪些文件
4. 不会修改哪些文件
5. 可能风险

严格遵守当前任务的允许修改范围和禁止修改范围。
不要自动提交 Git。

完成后输出：
1. 修改文件列表
2. 每个文件修改原因
3. Cocos 人工操作清单
4. 如何在 Web 预览测试
5. 验收标准 checklist
6. 是否更新 CHANGELOG.md
7. 是否更新 PROJECT_MEMORY.md
