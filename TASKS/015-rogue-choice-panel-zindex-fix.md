# TASKS/015-rogue-choice-panel-zindex-fix.md

## 任务目标

修复肉鸽选项面板和塔位选择面板被 BattleVisualRoot 盖住的问题，确保弹出面板在战斗中始终置顶显示。

## 背景说明

### 问题分析

1. `BattleUI.ts` 的 `_showRogueChoicePanel` 方法只是设置 `this.rogueChoicePanel.active = true`，没有做任何层级置顶操作

2. 场景结构：
   ```
   Canvas
   ├── MainUIRoot
   ├── BattleUIRoot（包含 RogueChoicePanel、技能按钮等）
   ├── BattleVisualRoot（包含 TowerLayer、EnemyLayer、EffectLayer）
   └── ...
   ```

3. Cocos Creator 3.x 渲染规则：兄弟节点按 `siblingIndex` 顺序渲染，后渲染的会覆盖先渲染的

4. 如果 BattleVisualRoot 在 BattleUIRoot 之后渲染（siblingIndex 更大），BattleVisualRoot 的内容会覆盖 BattleUIRoot

### 影响范围

- 肉鸽选择面板（RogueChoicePanel）：战斗中 45/90/135 秒触发时被盖住
- 塔位选择面板（TowerSelectPanel）：战斗开始放置阶段可能被盖住

## 允许修改范围

- `assets/scripts/ui/BattleUI.ts`
- `CHANGELOG.md`
- `docs/handoff/CURRENT_STATE.md`
- `TASKS/015-rogue-choice-panel-zindex-fix.md`

## 禁止修改范围

- `assets/scenes/*.scene`
- `assets/scripts/data/*`（战斗数值配置）
- `assets/scripts/platform/*`
- 不修改战斗逻辑
- 不修改攻击逻辑
- 不引入新依赖
- 不扩大到 UI 重构
- 不自动提交 Git

## 实现计划

### 1. 封装 `_bringNodeToFront` 方法

在 `BattleUI.ts` 中新增私有方法：

```typescript
/**
 * 将节点置顶到其父节点的最上层
 * @param target 目标节点
 */
private _bringNodeToFront(target: Node | null): void {
    if (!target || !target.parent) return;
    target.setSiblingIndex(target.parent.children.length - 1);
}
```

### 2. 修改 `_showRogueChoicePanel` 方法

在显示肉鸽面板前调用置顶：

```typescript
private _showRogueChoicePanel(...): void {
    if (!this.rogueChoicePanel) return;

    // 置顶肉鸽选择面板
    this._bringNodeToFront(this.rogueChoicePanel);
    // 置顶 BattleUIRoot（确保在 BattleVisualRoot 之上）
    this._bringNodeToFront(this.node);

    // 显示面板
    this.rogueChoicePanel.active = true;
    // ... 其余代码不变
}
```

### 3. 修改 `_showTowerSelectPanel` 方法

在显示塔位选择面板前调用置顶：

```typescript
private _showTowerSelectPanel(): void {
    if (!this.towerSelectPanel) return;

    // 置顶塔位选择面板
    this._bringNodeToFront(this.towerSelectPanel);
    // 置顶 BattleUIRoot
    this._bringNodeToFront(this.node);

    // 显示面板
    this.towerSelectPanel.active = true;
    // ... 其余代码不变
}
```

### 4. 修改 `_ensureDynamicTowerSelectPanel` 方法

在动态创建面板后置顶：

```typescript
private _ensureDynamicTowerSelectPanel(): void {
    // ... 创建面板代码 ...

    // 置顶动态面板
    this._bringNodeToFront(this._dynamicTowerSelectPanel);
    // 置顶 BattleUIRoot
    this._bringNodeToFront(this.node);
}
```

## 验收标准

1. 进入战斗后，正常放塔、刷怪
2. 到 45 秒触发第一次肉鸽选择
3. RogueChoicePanel 显示在最上层，不被 BattleVisualRoot、敌人、塔、特效盖住
4. 三个肉鸽选项按钮可点击
5. 点击选择后，面板关闭，战斗恢复
6. 第二次、第三次肉鸽选择同样置顶
7. 塔位选择面板（放置阶段）同样置顶显示
8. 不影响主动技能按钮、倍速按钮、战斗结算 UI
9. 不修改 `.scene`
10. 不修改战斗数值

## 测试方式

1. 在 Cocos Creator 中运行 Web 预览
2. 进入战斗，放置塔（验证塔位选择面板是否可见可点击）
3. 等待 45 秒，观察肉鸽选择面板是否置顶显示
4. 点击肉鸽选项，验证按钮可点击
5. 切换倍速（x2/x3/x4），再次验证面板可见性
6. 观察控制台是否有报错

## 风险点

1. **setSiblingIndex 可能影响其他 UI 面板**：只在面板显示时调用，影响范围可控
2. **肉鸽面板隐藏后是否需要恢复层级**：肉鸽面板隐藏后，BattleUIRoot 的层级位置不影响功能，可以不恢复
3. **性能影响**：setSiblingIndex 是轻量级操作，每局只调用几次，无性能风险

## 回滚方式

```bash
git checkout assets/scripts/ui/BattleUI.ts
```

---

## 执行状态

- 状态：已完成
- 实际修改：
  - `assets/scripts/ui/BattleUI.ts`：新增 `_bringNodeToFront()` 方法，在 `_showRogueChoicePanel()`、`_showTowerSelectPanel()`、`_showDynamicTowerSelectPanel()` 中调用置顶
- 未修改：`.scene` 文件、战斗数值配置、platform 目录
- 验证状态：代码已实现，Web 预览待用户确认
- 风险：无新增风险，`setSiblingIndex` 是轻量级操作
