# TASKS/014-battle-balance-config-baseline.md

## 任务目标

将战斗代码中散落的硬编码平衡数值集中到 `BattleBalanceConfig.ts` 配置文件中，**默认值保持当前行为不变**。

本任务只做配置化抽取，不做数值调优。

## 背景说明

当前塔、敌人、关卡、技能的核心数值已在 TowerConfig / EnemyConfig / StageConfig / SkillConfig 中，但战斗代码里仍有大量硬编码常量直接影响战斗体验。这些数值散落在 EnemyController、ProjectileManager、SkillManager、BattleSettlement、RogueChoiceManager、BattleManager 中，难以统一调优和审查。

本任务将这些数值抽取到统一的 `BattleBalanceConfig.ts`，默认值与当前硬编码值完全一致，确保行为不变。

后续数值调优在 `TASKS/015-battle-balance-first-tuning.md` 中进行。

后台配置 / Excel 导入更后续再做。

## 允许修改范围

- `assets/scripts/data/BattleBalanceConfig.ts`（新增）
- `assets/scripts/data/BattleBalanceConfig.ts.meta`（新增，由 Cocos Creator 生成）
- `assets/scripts/battle/EnemyController.ts`
- `assets/scripts/battle/ProjectileManager.ts`
- `assets/scripts/battle/SkillManager.ts`
- `assets/scripts/battle/BattleSettlement.ts`
- `assets/scripts/battle/RogueChoiceManager.ts`
- `assets/scripts/battle/BattleManager.ts`
- `CHANGELOG.md`
- `docs/handoff/CURRENT_STATE.md`
- `TASKS/014-battle-balance-config-baseline.md`

## 禁止修改范围

- `assets/scenes/*.scene`
- `assets/scripts/data/TowerConfig.ts`（不改塔数值）
- `assets/scripts/data/EnemyConfig.ts`（不改敌人数值）
- `assets/scripts/data/StageConfig.ts`（不改关卡数值）
- `assets/scripts/data/SkillConfig.ts`（不改技能数值）
- `assets/scripts/data/EconomyConfig.ts`
- `assets/scripts/data/BuildingConfig.ts`
- `assets/scripts/data/RebirthConfig.ts`
- `assets/scripts/platform/*`
- 不修改战斗机制
- 不修改攻击逻辑
- 不修改敌人目标选择
- 不引入新依赖
- 不接后台
- 不做 Excel 导入

## 实现计划

### 1. 新增 `assets/scripts/data/BattleBalanceConfig.ts`

**`.meta` 文件说明**：执行 Agent 无法在命令行环境中生成 Cocos Creator 的 `.meta` 文件。执行完成后，用户必须用 Cocos Creator 打开项目，让编辑器自动生成 `BattleBalanceConfig.ts.meta`。如果 `.meta` 缺失，任务不得视为完成。

定义以下配置项，**默认值与当前硬编码值完全一致**：

```typescript
export interface BattleBalanceConfig {
    // ==================== 敌人 ====================
    /** 敌人基础移动速度乘数（像素/秒），speed 字段乘以此值。当前: 100 */
    enemyBaseSpeed: number;
    /** 敌人到达基地时造成的伤害。当前: 10 */
    enemyBaseDamageToBase: number;

    // ==================== 投射物 ====================
    /** 投射物基础飞行速度（像素/秒）。当前: 600 */
    projectileSpeed: number;
    /** 炮塔投射物速度系数（乘以 projectileSpeed）。当前: 0.8 */
    splashProjectileSpeedFactor: number;
    /** 电塔投射物速度系数（乘以 projectileSpeed）。当前: 1.5 */
    chainProjectileSpeedFactor: number;
    /** 命中碰撞容差（像素）。当前: 5 */
    hitCollisionTolerance: number;

    // ==================== 伤害衰减 ====================
    /** 炮塔范围伤害衰减系数（0~1），距离中心越远伤害越低。当前: 0.5 */
    splashDamageFalloff: number;
    /** 电塔链式伤害衰减系数（每次弹射乘以此值）。当前: 0.8 */
    chainDamageFalloff: number;
    /** 电塔弹射距离上限（像素）。当前: 120 */
    chainRange: number;

    // ==================== 技能 ====================
    /** 轨道炮命中半径（像素）。当前: 100 */
    orbitalCannonRadius: number;
    /** 密集度搜索半径（像素）。当前: 120 */
    densestSearchRadius: number;

    // ==================== 结算 ====================
    /** 失败时战斗金币倍率。当前: 0.3 */
    defeatBattleCoinMultiplier: number;
    /** 失败时经营币倍率。当前: 0.2 */
    defeatBaseCoinMultiplier: number;
    /** 基础经营币奖励（胜利时）。当前: 50 */
    baseBaseCoinReward: number;
    /** 星级评定阈值：满星所需最低生命百分比。当前: 0.8 */
    starRating3Threshold: number;
    /** 星级评定阈值：二星所需最低生命百分比。当前: 0.5 */
    starRating2Threshold: number;

    // ==================== 肉鸽 ====================
    /** 肉鸽选择触发时间点（秒）。当前: [45, 90, 135] */
    rogueTriggerTimes: number[];
    /** 每次肉鸽选择的候选选项数。当前: 3 */
    rogueChoiceCount: number;

    // ==================== 战斗流程 ====================
    /** 放置阶段需要放置的塔数量。当前: 4 */
    requiredTowerCount: number;
}

export const BATTLE_BALANCE: BattleBalanceConfig = {
    // 敌人
    enemyBaseSpeed: 100,
    enemyBaseDamageToBase: 10,

    // 投射物
    projectileSpeed: 600,
    splashProjectileSpeedFactor: 0.8,
    chainProjectileSpeedFactor: 1.5,
    hitCollisionTolerance: 5,

    // 伤害衰减
    splashDamageFalloff: 0.5,
    chainDamageFalloff: 0.8,
    chainRange: 120,

    // 技能
    orbitalCannonRadius: 100,
    densestSearchRadius: 120,

    // 结算
    defeatBattleCoinMultiplier: 0.3,
    defeatBaseCoinMultiplier: 0.2,
    baseBaseCoinReward: 50,
    starRating3Threshold: 0.8,
    starRating2Threshold: 0.5,

    // 肉鸽
    rogueTriggerTimes: [45, 90, 135],
    rogueChoiceCount: 3,

    // 战斗流程
    requiredTowerCount: 4,
};
```

### 2. 修改 `EnemyController.ts`

- 顶部导入 `BATTLE_BALANCE`
- 第 144 行 `effectiveSpeed * deltaTime * 100` → `effectiveSpeed * deltaTime * BATTLE_BALANCE.enemyBaseSpeed`
- 第 215 行 `damage: 10` → `damage: BATTLE_BALANCE.enemyBaseDamageToBase`

### 3. 修改 `ProjectileManager.ts`

- 顶部导入 `BATTLE_BALANCE`
- 删除顶部 `PROJECTILE_SPEED` 和 `CHAIN_RANGE` 常量
- `createSingle` 中 `speed: PROJECTILE_SPEED` → `speed: BATTLE_BALANCE.projectileSpeed`
- `createSplash` 中 `speed: PROJECTILE_SPEED * 0.8` → `speed: BATTLE_BALANCE.projectileSpeed * BATTLE_BALANCE.splashProjectileSpeedFactor`
- `createIce` 中 `speed: PROJECTILE_SPEED` → `speed: BATTLE_BALANCE.projectileSpeed`
- `createChain` 中 `speed: PROJECTILE_SPEED * 1.5` → `speed: BATTLE_BALANCE.projectileSpeed * BATTLE_BALANCE.chainProjectileSpeedFactor`，`chainRange: CHAIN_RANGE` → `chainRange: BATTLE_BALANCE.chainRange`
- `_onHit` 中 `dist <= moveDistance + 5` → `dist <= moveDistance + BATTLE_BALANCE.hitCollisionTolerance`
- 范围伤害衰减 `(1 - distRatio * 0.5)` → `(1 - distRatio * BATTLE_BALANCE.splashDamageFalloff)`
- 链式伤害衰减 `chainDamage * 0.8` → `chainDamage * BATTLE_BALANCE.chainDamageFalloff`

### 4. 修改 `SkillManager.ts`

- 顶部导入 `BATTLE_BALANCE`
- `_executeOrbitalCannon` 中 `const hitRadius = 100` → `const hitRadius = BATTLE_BALANCE.orbitalCannonRadius`
- `_findDensestPosition` 中 `const searchRadius = 120` → `const searchRadius = BATTLE_BALANCE.densestSearchRadius`
- **注意**：`_findDensestPosition` 默认坐标 `{ x: 540, y: 360 }` **不在本任务修改**。该坐标属于坐标体系清理范畴，后续在 `TASKS/014.3-battle-coordinate-and-event-cleanup.md` 中处理。本任务保持原值不变。

### 5. 修改 `BattleSettlement.ts`

- 顶部导入 `BATTLE_BALANCE`
- `_calculateBattleCoinReward` 中 `0.3` → `BATTLE_BALANCE.defeatBattleCoinMultiplier`
- `_calculateBaseCoinReward` 中 `baseReward = 50` → `baseReward = BATTLE_BALANCE.baseBaseCoinReward`，`0.2` → `BATTLE_BALANCE.defeatBaseCoinMultiplier`
- `_calculateStarRating` 中 `0.8` → `BATTLE_BALANCE.starRating3Threshold`，`0.5` → `BATTLE_BALANCE.starRating2Threshold`

### 6. 修改 `RogueChoiceManager.ts`

- 顶部导入 `BATTLE_BALANCE`
- 删除顶部 `ROGUE_TRIGGER_TIMES` 和 `CHOICE_COUNT` 常量
- 所有 `ROGUE_TRIGGER_TIMES` 引用 → `BATTLE_BALANCE.rogueTriggerTimes`
- 所有 `CHOICE_COUNT` 引用 → `BATTLE_BALANCE.rogueChoiceCount`

### 7. 修改 `BattleManager.ts`

- 顶部导入 `BATTLE_BALANCE`
- `REQUIRED_TOWER_COUNT` 常量删除，改用 `BATTLE_BALANCE.requiredTowerCount`

## 验收标准

1. `BattleBalanceConfig.ts` 存在且导出 `BATTLE_BALANCE` 常量
2. `BattleBalanceConfig.ts.meta` 存在（由 Cocos Creator 生成）
3. 所有硬编码平衡数值已替换为配置引用
4. 配置默认值与原硬编码值完全一致
5. SkillManager 默认坐标 `{ x: 540, y: 360 }` 保持不变
6. Web 预览战斗体验与修改前完全一致
7. 无 TypeScript 编译错误
8. 未修改任何 `.scene`
9. 未修改 TowerConfig / EnemyConfig / StageConfig / SkillConfig
10. 未修改战斗机制
11. 未引入新依赖

## `.meta` 文件处理

执行 Agent 无法在命令行中生成 Cocos `.meta` 文件。执行完成后：

1. 用户必须用 Cocos Creator 打开项目
2. Cocos Creator 会自动为 `BattleBalanceConfig.ts` 生成 `.meta` 文件
3. 确认 `.meta` 存在后才可提交 Git
4. 如果 `.meta` 缺失，任务不得视为完成

## 测试方式

1. 在 Cocos Creator 中运行 Web 预览
2. 进入战斗，放置 4 种塔
3. 确认敌人移动速度、塔攻击、投射物飞行、技能效果与之前一致
4. 确认战斗结算奖励与之前一致
5. 确认肉鸽选择在 45/90/135 秒触发

## 文档更新要求

1. `CHANGELOG.md` — 添加 014 条目
2. `docs/handoff/CURRENT_STATE.md` — 更新当前状态

## 风险点

1. 配置导入路径错误导致编译失败 — 缓解：仔细检查相对路径
2. 默认值抄写错误导致行为变化 — 缓解：逐项对比原硬编码值
3. 遗漏某个硬编码数值 — 缓解：按文件逐一检查

## 回滚方式

```bash
git checkout assets/scripts/battle/EnemyController.ts
git checkout assets/scripts/battle/ProjectileManager.ts
git checkout assets/scripts/battle/SkillManager.ts
git checkout assets/scripts/battle/BattleSettlement.ts
git checkout assets/scripts/battle/RogueChoiceManager.ts
git checkout assets/scripts/battle/BattleManager.ts
rm assets/scripts/data/BattleBalanceConfig.ts
rm assets/scripts/data/BattleBalanceConfig.ts.meta
```

---

## 后续任务说明

- `TASKS/015-battle-balance-first-tuning.md`：第一版数值调优（调整塔/敌人/关卡强弱）
- `TASKS/014.3-battle-coordinate-and-event-cleanup.md`：SkillManager 默认坐标 `{ x: 540, y: 360 }` 清理、SHOW_TOWER_SELECT 裸字符串事件整理

---

## 给执行 Agent 的执行提示词

你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/014-battle-balance-config-baseline.md

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. TASKS/014-battle-balance-config-baseline.md

执行规则：
1. 只能执行当前任务
2. 只做配置化抽取，不做数值调优
3. 默认值必须与原硬编码值完全一致
4. SkillManager 默认坐标 { x: 540, y: 360 } 保持不变，不在本任务修改
5. 不允许修改当前任务未授权文件
6. 不修改 .scene 文件
7. 不修改 TowerConfig / EnemyConfig / StageConfig / SkillConfig
8. 不修改战斗机制
9. 不引入新依赖
10. 不自动提交 Git
11. .meta 文件无法在命令行生成，必须提醒用户用 Cocos Creator 打开项目生成

完成后必须输出：
1. 修改文件列表
2. 每个文件修改原因
3. 默认值与原值对照表
4. 如何在 Web 预览测试
5. 是否更新 CHANGELOG.md
6. 是否更新 PROJECT_MEMORY.md
7. .meta 文件状态提醒
8. 下一步建议

不要提交 Git，只提示人工执行：
git status
git diff

---

## 执行状态

- 状态：已完成，代码已提交
- 实际修改：
  - 新增 `assets/scripts/data/BattleBalanceConfig.ts`（20+ 个平衡常量）
  - 新增 `assets/scripts/data/BattleBalanceConfig.ts.meta`
  - 修改 `assets/scripts/battle/EnemyController.ts`（敌人速度和基地伤害改为配置读取）
  - 修改 `assets/scripts/battle/ProjectileManager.ts`（投射物速度/碰撞容差/伤害衰减改为配置读取）
  - 修改 `assets/scripts/battle/SkillManager.ts`（轨道炮半径和搜索半径改为配置读取）
  - 修改 `assets/scripts/battle/BattleSettlement.ts`（失败倍率/基础奖励/星级阈值改为配置读取）
  - 修改 `assets/scripts/battle/RogueChoiceManager.ts`（肉鸽触发时间和候选数改为配置读取）
  - 修改 `assets/scripts/battle/BattleManager.ts`（放置塔数量改为配置读取）
- 未修改：TowerConfig / EnemyConfig / StageConfig / SkillConfig 数值、战斗机制、.scene
- 验证状态：代码已实现，Web 预览待用户确认
- 风险：默认值抄写错误可能导致行为变化（已逐项对比确认一致）

## Codex 复审修复记录（2026-06-14）

- `BattleBalanceConfig.ts` interface 已确认只写类型，具体数值只写在 `BATTLE_BALANCE`
- `BattleBalanceConfig.ts.meta` 已存在
- 已恢复后续越权调试数值改动：普通机械虫生命值、第 1 关波次、炮塔爆炸半径均回到 014 基线前配置
- Web 预览仍待用户确认
