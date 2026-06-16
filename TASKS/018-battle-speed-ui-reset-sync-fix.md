# 018 倍速 UI 重置同步修复

## 任务目标

修复开完 4 倍速后重新开始游戏时，UI 仍显示 4 倍速但实际逻辑已是 1 倍速的问题。

---

## 背景说明

- `BattleManager.startBattle()` 重置 `_battleSpeed = 1` 但没有发射 `BATTLE_SPEED_CHANGE` 事件
- `BattleUI` 监听 `BATTLE_SPEED_CHANGE` 事件来更新倍速按钮文本
- 由于没有事件通知，UI 不知道倍速已重置，仍显示旧值

---

## 涉及文件

### 修改文件

- `assets/scripts/battle/BattleManager.ts` - 在重置倍速时发射事件
- `CHANGELOG.md` - 记录变更
- `docs/handoff/CURRENT_STATE.md` - 更新交接状态

### 新增文件

- `TASKS/018-battle-speed-ui-reset-sync-fix.md` - 任务文件

---

## 允许修改范围

- `assets/scripts/battle/BattleManager.ts`
- `TASKS/018-battle-speed-ui-reset-sync-fix.md`
- `CHANGELOG.md`
- `docs/handoff/CURRENT_STATE.md`

---

## 禁止修改范围

- 所有 `.scene` 文件
- StageConfig / TowerConfig / EnemyConfig / BattleBalanceConfig
- StageSelectPanel.ts / MainUI.ts / SaveManager.ts
- 平台构建配置 / 平台适配层代码
- 新增图片资源 / prefab / 第三方依赖

---

## 实现步骤

### 步骤 1：BattleManager.ts - startBattle() 中发射事件

在 `startBattle()` 方法中，重置 `_battleSpeed = 1` 后，发射 `BATTLE_SPEED_CHANGE` 事件：

```typescript
this._battleSpeed = 1; // 重置倍速为 1x
this._eventBus.emit(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, { speed: this._battleSpeed });
```

### 步骤 2：BattleManager.ts - returnToIdle() 中发射事件

在 `returnToIdle()` 方法中，重置 `_battleSpeed = 1` 后，也发射 `BATTLE_SPEED_CHANGE` 事件（保持一致性）：

```typescript
this._battleSpeed = 1; // 重置倍速为 1x
this._eventBus.emit(BATTLE_EVENTS.BATTLE_SPEED_CHANGE, { speed: this._battleSpeed });
```

### 步骤 3：更新文档

- 更新 `CHANGELOG.md`
- 更新 `docs/handoff/CURRENT_STATE.md`

---

## 验收标准

1. ✅ 进入战斗，初始显示 1x
2. ✅ 点击倍速按钮切到 4x，显示 4x，逻辑也为 4x
3. ✅ 结束战斗后重新开始新一局，UI 显示回 1x
4. ✅ 新一局实际逻辑也是 1x
5. ✅ 再次点击倍速按钮，能按 1x → 2x → 3x → 4x 正常循环
6. ✅ 不修改任何 `.scene` 文件
7. ✅ TypeScript 编译无错误
8. ✅ Web 预览待用户确认

---

## 测试方式

### Web 预览测试

1. 打开 Cocos Creator，运行 Web 预览
2. 进入战斗
3. 点击倍速按钮切到 4x
4. 确认 UI 显示 4x，敌人移动加快
5. 结束战斗或返回主界面
6. 再次开始战斗
7. 确认倍速按钮显示 1x
8. 观察敌人移动、倒计时、攻击频率确认逻辑也是 1x
9. 再次点击倍速按钮确认循环正常

---

## 回滚方式

1. 恢复 `assets/scripts/battle/BattleManager.ts`
2. 删除 `TASKS/018-battle-speed-ui-reset-sync-fix.md`

---

## 风险点

1. **事件发射时机**：在 `startBattle()` 中发射事件时，BattleUI 可能还未完全初始化
   - 缓解：BattleUI 在 `start()` 中调用 `_setupExtraButtons()` → `_initSpeedButton()` 注册事件监听，时序应该正确

2. **returnToIdle() 中发射事件**：此时 BattleUI 可能已隐藏
   - 缓解：事件发射是安全的，即使没有监听器也不会崩溃

---

## 给执行 Agent 的执行提示词

你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/018-battle-speed-ui-reset-sync-fix.md

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. TASKS/018-battle-speed-ui-reset-sync-fix.md

执行前先输出：
1. 已阅读哪些文件
2. 当前任务目标
3. 本次计划修改哪些文件
4. 不会修改哪些文件
5. 可能风险

严格遵守当前任务的允许修改范围和禁止修改范围。
不要自动提交 Git。
