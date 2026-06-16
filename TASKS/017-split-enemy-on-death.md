# 017 分裂无人机死亡分裂逻辑

## 任务目标

实现分裂无人机 (`enemy_split_drone`) 死亡后分裂生成小单位的逻辑。

---

## 背景说明

- `enemy_split_drone` 在 EnemyConfig 中已配置 `splitCount: 2` 和 `splitEnemyId: 'enemy_mech_bug'`
- 当前死亡时只发射 `ENEMY_DEATH` 事件，不触发分裂
- 需要补齐分裂敌人的死亡分裂机制

---

## 涉及文件

### 修改文件

- `assets/scripts/core/EventBus.ts` - 添加 `ENEMY_SPLIT` 事件常量
- `assets/scripts/battle/EnemyController.ts` - 在 `_die()` 中添加分裂事件发射
- `assets/scripts/battle/EnemySpawner.ts` - 添加 `spawnEnemyAtPosition()` 方法
- `assets/scripts/battle/BattleManager.ts` - 监听分裂事件，调用 spawner 生成子单位
- `CHANGELOG.md` - 记录变更
- `docs/handoff/CURRENT_STATE.md` - 更新交接状态

### 新增文件

- `TASKS/017-split-enemy-on-death.md` - 任务文件

---

## 允许修改范围

- `assets/scripts/core/EventBus.ts`
- `assets/scripts/battle/EnemyController.ts`
- `assets/scripts/battle/EnemySpawner.ts`
- `assets/scripts/battle/BattleManager.ts`
- `TASKS/017-split-enemy-on-death.md`
- `CHANGELOG.md`
- `docs/handoff/CURRENT_STATE.md`

---

## 禁止修改范围

- 所有 `.scene` 文件
- StageConfig 数值
- TowerConfig 数值
- BattleBalanceConfig 数值
- UI 面板代码
- 平台构建配置
- 平台适配层代码
- 新增图片资源 / prefab
- 引入第三方依赖

---

## 实现步骤

### 步骤 1：EventBus.ts - 添加 ENEMY_SPLIT 事件

在 `BATTLE_EVENTS` 中添加：
```typescript
ENEMY_SPLIT: 'enemy:split',
```

### 步骤 2：EnemyController.ts - 添加分裂逻辑

在 `_die()` 方法中，检查敌人是否有分裂配置，如果有则发射 `ENEMY_SPLIT` 事件：

```typescript
private _die(): void {
    this._state.isAlive = false;
    this._state.health = 0;

    // 发射死亡事件
    this._eventBus.emit(BATTLE_EVENTS.ENEMY_DEATH, {
        enemyId: this._state.id,
        configId: this._state.configId,
        reward: this._state.reward,
        isBoss: this._state.isBoss,
        position: { ...this._state.position }
    });

    // 检查是否需要分裂（只在被击杀时触发，到达基地时不分裂）
    if (this._config.special?.splitCount && this._config.special?.splitEnemyId) {
        this._eventBus.emit(BATTLE_EVENTS.ENEMY_SPLIT, {
            position: { ...this._state.position },
            splitCount: this._config.special.splitCount,
            splitEnemyId: this._config.special.splitEnemyId
        });
    }
}
```

### 步骤 3：EnemySpawner.ts - 添加从指定位置生成敌人的方法

新增 `spawnEnemyAtPosition()` 方法：

```typescript
/**
 * 从指定位置生成敌人（用于分裂逻辑）
 * 子单位从父敌人死亡位置向基地方向移动
 */
spawnEnemyAtPosition(configId: string, position: { x: number; y: number }): void {
    const config = getEnemyConfig(configId);
    if (!config) return;

    // 创建从死亡位置到基地的路径
    const path = [position, { x: BASE_CENTER.x, y: BASE_CENTER.y }];
    const enemy = new EnemyController(configId, config, path, position);
    this._enemies.set(enemy.getId(), enemy);

    this._eventBus.emit(BATTLE_EVENTS.ENEMY_SPAWN, {
        enemyId: enemy.getId(),
        configId: configId,
        position: position
    });
}
```

需要从 StageManager 导入 `BASE_CENTER`。

### 步骤 4：BattleManager.ts - 监听分裂事件

在 `_setupEventListeners()` 中添加：

```typescript
// 监听敌人分裂
this._eventBus.on(BATTLE_EVENTS.ENEMY_SPLIT, (data: {
    position: { x: number; y: number };
    splitCount: number;
    splitEnemyId: string;
}) => {
    if (this._enemySpawner && this._state === 'playing') {
        for (let i = 0; i < data.splitCount; i++) {
            // 子单位位置稍微偏移，避免重叠
            const offset = (i - (data.splitCount - 1) / 2) * 20;
            const spawnPos = {
                x: data.position.x + offset,
                y: data.position.y + offset
            };
            this._enemySpawner.spawnEnemyAtPosition(data.splitEnemyId, spawnPos);
        }
    }
});
```

### 步骤 5：更新文档

- 更新 `CHANGELOG.md`
- 更新 `docs/handoff/CURRENT_STATE.md`

---

## 关键设计决策

1. **分裂触发条件**：只在 `_die()` 中触发（被攻击击杀），`_reachBase()` 中不触发
2. **子单位位置**：从父敌人死亡位置生成，稍微偏移避免重叠
3. **子单位路径**：从死亡位置直接向基地方向移动
4. **防止无限分裂**：子单位是 `enemy_mech_bug`（普通机械虫），没有分裂配置，不会递归分裂
5. **事件解耦**：使用 `ENEMY_SPLIT` 事件，BattleManager 负责协调，EnemySpawner 负责生成

---

## 验收标准

1. ✅ enemy_split_drone 被塔击杀后，生成 2 个小单位
2. ✅ 子单位显示在战斗画面中
3. ✅ 子单位继续移动到基地
4. ✅ 子单位可以被塔攻击并死亡
5. ✅ 分裂无人机到达基地时不触发分裂
6. ✅ 子单位不会无限递归分裂
7. ✅ ENEMY_SPAWN / ENEMY_DEATH 事件不破坏现有逻辑
8. ✅ TypeScript 编译无错误
9. ✅ 不修改任何 `.scene` 文件
10. ✅ Web 预览待用户确认

---

## 测试方式

### Web 预览测试

1. 打开 Cocos Creator，运行 Web 预览
2. 进入包含 `enemy_split_drone` 的关卡（第 5 关开始出现）
3. 等分裂无人机出现
4. 用塔击杀分裂无人机
5. 确认死亡位置附近出现 2 个小单位（普通机械虫）
6. 确认小单位继续移动、可被攻击、死亡后消失
7. 测试分裂无人机到达基地，不应生成小单位

---

## 回滚方式

1. 恢复 `assets/scripts/core/EventBus.ts`
2. 恢复 `assets/scripts/battle/EnemyController.ts`
3. 恢复 `assets/scripts/battle/EnemySpawner.ts`
4. 恢复 `assets/scripts/battle/BattleManager.ts`
5. 删除 `TASKS/017-split-enemy-on-death.md`

---

## 风险点

1. **子单位路径**：从死亡位置直接到基地中心，可能穿过障碍物（当前 MVP 无此问题）
2. **子单位位置偏移**：多个子单位可能重叠，使用 offset 分散
3. **性能**：大量分裂可能增加敌人数量，当前 MVP splitCount=2 影响不大

---

## 给执行 Agent 的执行提示词

你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/017-split-enemy-on-death.md

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. TASKS/017-split-enemy-on-death.md

执行前先输出：
1. 已阅读哪些文件
2. 当前任务目标
3. 本次计划修改哪些文件
4. 不会修改哪些文件
5. 可能风险

严格遵守当前任务的允许修改范围和禁止修改范围。
不要自动提交 Git。
