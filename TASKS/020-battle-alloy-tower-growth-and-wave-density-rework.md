# 020 战斗合金系统 + 塔等级重构 + 怪物密度提升

## 任务目标

重做战斗内塔放置、塔升级和怪物密度逻辑，打通新战斗节奏：

1. 进入战斗不暂停，直接开始刷怪
2. 开局给合金，怪物掉合金
3. 用合金建塔、局内升级塔
4. 战斗结束清空合金
5. 怪物密度大幅提升，增强割草爽感
6. 塔等级语义重构：局外等级变为上限，局内从 1 级开始

**核心原则**：020 只做 MVP 可玩版，打通新循环，不做过度扩展。

---

## 背景说明

### 当前问题

1. **放置阶段强制暂停**：进入战斗后必须放满 4 个塔才开始刷怪，节奏割裂
2. **塔等级直接读取存档**：局外升级的等级直接成为战斗实际等级，缺乏局内成长感
3. **怪物密度偏低**：当前第 1 关总计约 75 个怪，割草爽感不足
4. **缺乏局内资源**：没有局内经济系统，建塔/升级没有决策空间

### 新设计

1. **合金系统**：局内资源，开局获得，怪物掉落，用于建塔和升级，战斗结束清空
2. **塔等级重构**：局外等级 = 局内可升级上限，局内塔从 1 级开始，消耗合金升级
3. **基地核心等级**：决定塔等级总上限（每级基地核心 × 6 级上限）
4. **怪物密度**：数量 ×2~3，间隔缩短，单怪数值降低，总体难度不变

---

## 涉及文件

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `assets/scripts/battle/BattleManager.ts` | 核心修改 | 移除放置阶段暂停、新增合金系统、集成合金扣除 |
| `assets/scripts/battle/TowerManager.ts` | 核心修改 | 放塔/升级增加合金检查和等级上限检查 |
| `assets/scripts/battle/TowerController.ts` | 核心修改 | 新增等级上限字段、升级成本查询 |
| `assets/scripts/battle/EnemyController.ts` | 核心修改 | 新增 alloyReward、死亡事件携带合金 |
| `assets/scripts/battle/EnemySpawner.ts` | 微调 | 可能无修改 |
| `assets/scripts/battle/BattleSettlement.ts` | 不修改 | 合金不进入结算 |
| `assets/scripts/ui/BattleUI.ts` | 核心修改 | 合金显示、建造/升级成本检查 |
| `assets/scripts/ui/TowerUpgradeUI.ts` | 不修改 | 文案改动后续处理 |
| `assets/scripts/data/TowerConfig.ts` | 核心修改 | 新增 buildCostAlloy、upgradeCostAlloy |
| `assets/scripts/data/EnemyConfig.ts` | 核心修改 | 新增 alloyDrop |
| `assets/scripts/data/StageConfig.ts` | 核心修改 | 波次密度调整 |
| `assets/scripts/data/BattleBalanceConfig.ts` | 核心修改 | 新增 initialAlloy、towerLevelCapPerBaseLevel |
| `assets/scripts/core/SaveManager.ts` | 注释更新 | towerLevels 语义改为"局外塔等级上限" |
| `assets/scripts/base/BaseManager.ts` | 不修改 | 已有 getBaseCoreLevel() |
| `assets/scripts/base/BuildingManager.ts` | 不修改 | 无修改 |
| `CHANGELOG.md` | 更新 | 记录本次改动 |
| `PROJECT_MEMORY.md` | 更新 | 更新合金系统、塔等级语义 |
| `docs/handoff/CURRENT_STATE.md` | 更新 | 更新当前状态 |

---

## 允许修改范围

```
assets/scripts/battle/BattleManager.ts
assets/scripts/battle/TowerManager.ts
assets/scripts/battle/TowerController.ts
assets/scripts/battle/EnemyController.ts
assets/scripts/battle/EnemySpawner.ts（仅必要时）
assets/scripts/ui/BattleUI.ts
assets/scripts/data/TowerConfig.ts
assets/scripts/data/EnemyConfig.ts
assets/scripts/data/StageConfig.ts
assets/scripts/data/BattleBalanceConfig.ts
assets/scripts/core/SaveManager.ts（仅注释更新）
CHANGELOG.md
PROJECT_MEMORY.md
docs/handoff/CURRENT_STATE.md
TASKS/020-battle-alloy-tower-growth-and-wave-density-rework.md
```

---

## 禁止修改范围

```
所有 .scene 文件
assets/scripts/battle/BattleSettlement.ts
assets/scripts/ui/TowerUpgradeUI.ts（文案改动后续处理）
assets/scripts/ui/TowerUpgradeUI.ts
平台构建配置
平台适配层代码（assets/scripts/platform/）
新增图片资源
新增 prefab
引入第三方依赖
接服务器
接支付
做自由摆放塔位
做复杂塔详情 UI
自动提交 Git
```

---

## 实现阶段

### 阶段 1：取消放置阶段暂停

**目标**：进入战斗后直接开始刷怪，不再强制暂停等待放塔。

**修改文件**：`BattleManager.ts`

**具体改动**：

1. `startBattle()` 中：
   - 移除 `_isPlacementPaused = true`，改为 `false`
   - 移除 `_placedTowerCount = 0`
   - 末尾直接调用 `this._enemySpawner.start()` 启动敌人生成
   - `BATTLE_START` 事件不再携带 `isPlacementPhase: true`

2. 移除以下内容：
   - `_placedTowerCount` 字段
   - `_requiredTowerCount` getter
   - `_resumeFromPlacement()` 方法

3. `placeTower()` 中：
   - 移除 `_placedTowerCount++` 和计数检查
   - 只保留基本的放塔逻辑

4. `update()` 中：
   - 移除 `_isPlacementPaused` 守卫（`if (this._isForcePaused || this._isPlacementPaused) return;` 改为 `if (this._isForcePaused) return;`）

5. `returnToIdle()` 中：
   - 移除 `this._isPlacementPaused = false`
   - 移除 `this._placedTowerCount = 0`

6. `isPlacementPhase()` 方法：
   - 保留但返回 `false`（或直接移除，看是否有外部调用）

7. `BattleBalanceConfig.ts` 中：
   - `requiredTowerCount` 字段保留但不再使用（避免破坏接口）

---

### 阶段 2：新增合金系统

**目标**：在 BattleManager 中维护局内合金状态。

**修改文件**：`BattleManager.ts`、`BattleBalanceConfig.ts`

**具体改动**：

1. `BattleBalanceConfig.ts` 新增配置：
   ```typescript
   /** 开局初始合金 */
   initialAlloy: number;
   /** 每级基地核心对应的塔等级上限 */
   towerLevelCapPerBaseLevel: number;
   ```
   默认值：`initialAlloy: 200`、`towerLevelCapPerBaseLevel: 6`

2. `BattleManager.ts` 新增：
   ```typescript
   /** 当前局内合金 */
   private _battleAlloy: number = 0;

   /** 获取当前合金 */
   getBattleAlloy(): number { return this._battleAlloy; }

   /** 增加合金 */
   addBattleAlloy(amount: number): void {
       this._battleAlloy += amount;
       this._eventBus.emit(BATTLE_EVENTS.BATTLE_ALLOY_CHANGE, { alloy: this._battleAlloy });
   }

   /** 消耗合金，返回是否成功 */
   spendBattleAlloy(amount: number): boolean {
       if (this._battleAlloy < amount) return false;
       this._battleAlloy -= amount;
       this._eventBus.emit(BATTLE_EVENTS.BATTLE_ALLOY_CHANGE, { alloy: this._battleAlloy });
       return true;
   }
   ```

3. `startBattle()` 中：
   - 初始化合金：`this._battleAlloy = BATTLE_BALANCE.initialAlloy;`
   - 发出初始事件：`this._eventBus.emit(BATTLE_EVENTS.BATTLE_ALLOY_CHANGE, { alloy: this._battleAlloy });`

4. `returnToIdle()` 和 `_endBattle()` 中：
   - 清空合金：`this._battleAlloy = 0;`

5. `EventBus.ts` 中：
   - 新增事件常量：`BATTLE_ALLOY_CHANGE: 'battle_alloy_change'`

6. `getBattleInfo()` 中：
   - 新增 `battleAlloy: this._battleAlloy` 字段

---

### 阶段 3：敌人掉落合金

**目标**：怪物死亡时掉落合金，自动累加到局内合金。

**修改文件**：`EnemyConfig.ts`、`EnemyController.ts`、`BattleManager.ts`

**具体改动**：

1. `EnemyConfig.ts` 接口新增：
   ```typescript
   /** 死亡掉落合金 */
   alloyDrop: number;
   ```

2. `ENEMY_CONFIGS` 各敌人配置新增 `alloyDrop`：
   - `enemy_mech_bug`: 5
   - `enemy_fast_bug`: 8
   - `enemy_heavy_mech`: 20
   - `enemy_split_drone`: 15
   - `enemy_boss`: 50

3. `EnemyState` 接口新增：
   ```typescript
   alloyReward: number;
   ```

4. `EnemyController` 构造函数中：
   - 读取 `config.alloyDrop` 赋值给 `this._state.alloyReward`

5. `EnemyController._die()` 发出的 `ENEMY_DEATH` 事件新增 `alloyReward` 字段：
   ```typescript
   this._eventBus.emit(BATTLE_EVENTS.ENEMY_DEATH, {
       enemyId: this._state.id,
       configId: this._state.configId,
       reward: this._state.reward,
       alloyReward: this._state.alloyReward,  // 新增
       isBoss: this._state.isBoss,
       position: { ...this._state.position }
   });
   ```

6. `BattleManager._setupEventListeners()` 中：
   - `ENEMY_DEATH` 监听新增合金累加：
   ```typescript
   if (data.alloyReward > 0) {
       this.addBattleAlloy(data.alloyReward);
   }
   ```

---

### 阶段 4：塔建造消耗合金

**目标**：建塔时消耗合金，不同塔成本不同。

**修改文件**：`TowerConfig.ts`、`TowerManager.ts`、`BattleManager.ts`

**具体改动**：

1. `TowerConfig` 接口新增：
   ```typescript
   /** 建造消耗合金 */
   buildCostAlloy: number;
   ```

2. `TOWER_CONFIGS` 各塔配置新增 `buildCostAlloy`：
   - `machinegun_tower`: 80
   - `cannon_tower`: 150
   - `ice_tower`: 120
   - `electric_tower`: 140

3. `TowerConfig.levels` 各等级新增 `upgradeCostAlloy`：
   ```typescript
   upgradeCostAlloy: number;
   ```
   各塔各等级示例值：
   - level 1: 0（建造已消耗）
   - level 2: 50
   - level 3: 80
   - level 4: 120
   - level 5: 180

4. `TowerManager.placeTower()` 签名变更：
   ```typescript
   placeTower(slotId: string, towerConfigId: string, level: number = 1): boolean
   ```
   内部逻辑不变（成本检查由 BattleManager 处理）。

5. `BattleManager.placeTower()` 新增合金检查：
   ```typescript
   placeTower(slotId: string, towerConfigId: string, level: number = 1): boolean {
       if (!this._towerManager) return false;

       // 检查合金
       const config = getTowerConfig(towerConfigId);
       if (!config) return false;
       if (!this.spendBattleAlloy(config.buildCostAlloy)) {
           console.log(`[BattleManager] 合金不足，无法建造 ${config.name}，需要 ${config.buildCostAlloy}，当前 ${this._battleAlloy}`);
           return false;
       }

       // 放塔
       const success = this._towerManager.placeTower(slotId, towerConfigId, level);
       if (!success) {
           // 放塔失败，退还合金
           this.addBattleAlloy(config.buildCostAlloy);
           return false;
       }
       return success;
   }
   ```

---

### 阶段 5：塔等级上限逻辑

**目标**：局内塔等级不能超过局外上限和基地总上限。

**修改文件**：`TowerController.ts`、`TowerManager.ts`、`BattleManager.ts`

**具体改动**：

1. `TowerController` 新增字段：
   ```typescript
   /** 局内可升级上限（由局外上限和基地总上限取较小值） */
   private _maxLevelCap: number = 999;
   ```

2. `TowerController` 新增方法：
   ```typescript
   /** 设置等级上限 */
   setMaxLevelCap(cap: number): void {
       this._maxLevelCap = cap;
   }

   /** 获取等级上限 */
   getMaxLevelCap(): number {
       return this._maxLevelCap;
   }

   /** 是否已达上限 */
   isAtMaxLevel(): boolean {
       return this._state.level >= this._maxLevelCap;
   }

   /** 获取升级消耗合金 */
   getUpgradeCostAlloy(): number {
       const nextLevel = this._state.level + 1;
       const nextConfig = getTowerLevelConfig(this._state.configId, nextLevel);
       return nextConfig?.upgradeCostAlloy ?? 999999;
   }
   ```

3. `TowerController.upgrade()` 增加上限检查：
   ```typescript
   upgrade(): boolean {
       if (this.isAtMaxLevel()) return false;
       const nextLevel = this._state.level + 1;
       const nextConfig = getTowerLevelConfig(this._state.configId, nextLevel);
       if (!nextConfig) return false;
       this._state.level = nextLevel;
       this._levelConfig = nextConfig;
       return true;
   }
   ```

4. 新增全局函数（放在 `TowerConfig.ts` 或 `BattleBalanceConfig.ts`）：
   ```typescript
   /**
    * 根据基地核心等级计算塔等级总上限
    * @param baseCoreLevel 基地核心等级
    * @returns 塔等级总上限
    */
   export function getTowerGlobalLevelCap(baseCoreLevel: number): number {
       return baseCoreLevel * BATTLE_BALANCE.towerLevelCapPerBaseLevel;
   }
   ```

5. `TowerManager.placeTower()` 中设置等级上限：
   ```typescript
   placeTower(slotId: string, towerConfigId: string, level: number = 1): boolean {
       // ... 现有逻辑 ...

       const tower = new TowerController(towerConfigId, config, level, slot.position);

       // 计算等级上限：min(局外上限, 基地总上限)
       const externalCap = this._getExternalLevelCap(towerConfigId);
       const globalCap = this._getGlobalLevelCap();
       tower.setMaxLevelCap(Math.min(externalCap, globalCap));

       // ... 现有逻辑 ...
   }

   /** 获取局外塔等级上限（从存档读取） */
   private _getExternalLevelCap(towerConfigId: string): number {
       try {
           const saveMgr = BaseManager.getInstance().getSaveManager();
           const save = saveMgr.getSave();
           return save.towerLevels?.[towerConfigId] ?? 1;
       } catch {
           return 1;
       }
   }

   /** 获取基地核心等级决定的全局上限 */
   private _getGlobalLevelCap(): number {
       try {
           const baseCoreLevel = BaseManager.getInstance().getBaseCoreLevel();
           return getTowerGlobalLevelCap(baseCoreLevel);
       } catch {
           return 6; // 兜底
       }
   }
   ```

6. `TowerManager` 需要新增导入：
   ```typescript
   import { BaseManager } from '../base/BaseManager';
   import { getTowerGlobalLevelCap } from '../data/TowerConfig';
   ```

---

### 阶段 6：局内塔升级消耗合金

**目标**：升级塔时消耗合金，检查等级上限。

**修改文件**：`TowerManager.ts`、`BattleManager.ts`

**具体改动**：

1. `TowerManager.upgradeTower()` 新增合金检查和等级上限检查：
   ```typescript
   upgradeTower(slotId: string): { success: boolean; costAlloy: number; reason?: string } {
       const slot = this._slots.find(s => s.id === slotId);
       if (!slot || !slot.towerId) return { success: false, costAlloy: 0, reason: 'slot_empty' };

       const tower = this._towers.get(slot.towerId);
       if (!tower) return { success: false, costAlloy: 0, reason: 'tower_not_found' };

       if (tower.isAtMaxLevel()) return { success: false, costAlloy: 0, reason: 'max_level' };

       const costAlloy = tower.getUpgradeCostAlloy();
       return { success: true, costAlloy };
   }
   ```

   注意：实际的合金扣除由 BattleManager 处理。

2. `BattleManager` 新增方法：
   ```typescript
   /**
    * 升级指定槽位的塔
    * @param slotId 槽位ID
    * @returns 是否升级成功
    */
   upgradeTowerAtSlot(slotId: string): boolean {
       if (!this._towerManager) return false;

       const result = this._towerManager.upgradeTower(slotId);
       if (!result.success) {
           if (result.reason === 'max_level') {
               console.log(`[BattleManager] 塔已达等级上限`);
           }
           return false;
       }

       if (!this.spendBattleAlloy(result.costAlloy)) {
           console.log(`[BattleManager] 合金不足，无法升级，需要 ${result.costAlloy}，当前 ${this._battleAlloy}`);
           return false;
       }

       // 执行升级
       const slot = this._towerManager.getSlots().find(s => s.id === slotId);
       if (!slot || !slot.towerId) return false;
       const tower = this._towerManager.getTower(slot.towerId);
       if (!tower) return false;
       const upgradeSuccess = tower.upgrade();
       if (!upgradeSuccess) {
           // 升级失败，退还合金
           this.addBattleAlloy(result.costAlloy);
           return false;
       }

       console.log(`[BattleManager] 塔升级成功，消耗合金 ${result.costAlloy}`);
       return true;
   }
   ```

3. `TowerManager.upgradeTower()` 原有方法保留但不再直接调用 `tower.upgrade()`：
   - 改为只做检查，返回成本信息
   - 实际升级由 `BattleManager.upgradeTowerAtSlot()` 执行

---

### 阶段 7：UI 更新

**目标**：战斗 UI 显示合金数量，建塔/升级时检查合金。

**修改文件**：`BattleUI.ts`

**具体改动**：

1. `BattleUI` 新增属性（可选绑定）：
   ```typescript
   @property(Label)
   alloyLabel: Label | null = null;
   ```

2. `onLoad()` 中监听合金变化事件：
   ```typescript
   this._boundOnAlloyChange = (data: { alloy: number }) => {
       this._updateAlloyDisplay(data.alloy);
   };
   this._eventBus.on(BATTLE_EVENTS.BATTLE_ALLOY_CHANGE, this._boundOnAlloyChange);
   ```

3. 新增方法：
   ```typescript
   private _updateAlloyDisplay(alloy: number): void {
       if (this.alloyLabel) {
           this.alloyLabel.string = `合金: ${alloy}`;
       }
   }
   ```

4. `updateBattleInfo()` 中刷新合金显示：
   ```typescript
   if (this._battleManager) {
       this._updateAlloyDisplay(this._battleManager.getBattleAlloy());
   }
   ```

5. `_onTowerSelect()` 中：
   - 移除从 `SaveManager.towerLevels` 读取塔等级的逻辑
   - 改为使用固定等级 1（新塔从 1 级开始）
   - 合金检查由 `BattleManager.placeTower()` 处理，失败时输出日志

6. 塔详情面板（如有）：
   - 显示当前等级和等级上限
   - 显示升级消耗合金
   - 暂不做复杂 UI，先用日志提示

7. `onDestroy()` 中解绑合金事件：
   ```typescript
   if (this._boundOnAlloyChange) {
       this._eventBus.off(BATTLE_EVENTS.BATTLE_ALLOY_CHANGE, this._boundOnAlloyChange);
   }
   ```

8. 如果没有现成的合金 Label 绑定：
   - 优先复用 `battleCoinLabel` 或 `baseCoinLabel`（如果它们在战斗中不显示）
   - 或者在 `updateBattleInfo()` 中动态更新已有的文本区域
   - 不要求用户本轮额外拖 UI 节点

---

### 阶段 8：怪物密度调整

**目标**：怪物数量大幅增加，单怪数值降低，总体难度不变。

**修改文件**：`StageConfig.ts`、`EnemyConfig.ts`

**具体改动**：

1. `StageConfig.ts` 各关卡波次调整：
   - `count` 增加 2~3 倍
   - `interval` 缩短到 0.5~0.7 倍
   - 示例（第 1 关）：
     ```
     原：{ time: 5, enemyId: 'enemy_mech_bug', count: 12, interval: 1 }
     新：{ time: 5, enemyId: 'enemy_mech_bug', count: 30, interval: 0.4 }
     ```

2. `EnemyConfig.ts` 各敌人数值调整：
   - `health` 降低到 0.6 倍（向下取整）
   - `baseDamage` 降低到 0.7 倍（向下取整）
   - `reward` 降低到 0.5 倍（向下取整）
   - 示例：
     ```
     原：enemy_mech_bug { health: 15, baseDamage: 10, reward: 10 }
     新：enemy_mech_bug { health: 9, baseDamage: 7, reward: 5 }
     ```

3. Boss 和分裂怪不大改：
   - `enemy_boss` 的 health 和 reward 保持不变或小幅下调
   - `enemy_split_drone` 的 splitCount 保持不变
   - 避免连锁问题

4. 保留当前 10 关结构，不新增关卡。

**数值调整参考表**：

| 敌人 | 原 health | 新 health | 原 baseDamage | 新 baseDamage | 原 reward | 新 reward | alloyDrop |
|------|-----------|-----------|---------------|---------------|-----------|-----------|-----------|
| enemy_mech_bug | 15 | 9 | 10 | 7 | 10 | 5 | 5 |
| enemy_fast_bug | 15 | 9 | 8 | 6 | 15 | 8 | 8 |
| enemy_heavy_mech | 100 | 60 | 20 | 14 | 50 | 25 | 20 |
| enemy_split_drone | 40 | 25 | 12 | 8 | 30 | 15 | 15 |
| enemy_boss | 700 | 500 | 90 | 70 | 200 | 100 | 50 |

**StageConfig 波次调整参考**（第 1 关示例）：

```
原：
waves: [
    { time: 5, enemyId: 'enemy_mech_bug', count: 12, interval: 1 },
    { time: 30, enemyId: 'enemy_mech_bug', count: 24, interval: 0.5 },
    { time: 60, enemyId: 'enemy_mech_bug', count: 36, interval: 0.4 },
    { time: 90, enemyId: 'enemy_fast_bug', count: 3, interval: 0.3 },
]
总怪数：75

新：
waves: [
    { time: 5, enemyId: 'enemy_mech_bug', count: 30, interval: 0.4 },
    { time: 30, enemyId: 'enemy_mech_bug', count: 50, interval: 0.25 },
    { time: 60, enemyId: 'enemy_mech_bug', count: 70, interval: 0.2 },
    { time: 90, enemyId: 'enemy_fast_bug', count: 10, interval: 0.2 },
]
总怪数：160
```

---

### 阶段 9：清理和文档

**目标**：更新注释和文档，说明语义变更。

**修改文件**：`SaveManager.ts`、`CHANGELOG.md`、`PROJECT_MEMORY.md`、`docs/handoff/CURRENT_STATE.md`

**具体改动**：

1. `SaveManager.ts` 中 `towerLevels` 字段注释更新：
   ```typescript
   /**
    * 局外塔等级上限
    * 语义变更（020）：不再表示进入战斗后的实际塔等级
    * 改为表示该塔在局内可升级的上限等级
    * 局内塔从 1 级开始，消耗合金升级，不能超过此上限
    */
   towerLevels: Record<string, number>;
   ```

2. `CHANGELOG.md` 新增条目。

3. `PROJECT_MEMORY.md` 新增合金系统和塔等级语义说明。

4. `docs/handoff/CURRENT_STATE.md` 更新当前状态。

---

## 验收标准

### 核心流程

1. [ ] 进入关卡后不再暂停，怪物直接刷出
2. [ ] 开局获得初始合金（200）
3. [ ] 战斗 UI 能看到当前合金数量（或日志输出）
4. [ ] 点击空塔位，消耗合金放置防御塔
5. [ ] 合金不足时不能放塔，输出提示日志
6. [ ] 怪物死亡掉落合金，合金数量实时更新
7. [ ] 点击已有塔，消耗合金局内升级
8. [ ] 局内塔等级不能超过该塔局外上限
9. [ ] 局内塔等级不能超过基地等级决定的总上限
10. [ ] 战斗结束后合金清空
11. [ ] 重打本关后合金重新初始化

### 怪物密度

12. [ ] 怪物数量明显变多（约 2~3 倍）
13. [ ] 总体难度不明显高于当前版本
14. [ ] 第一关仍可完整游玩

### 技术约束

15. [ ] 不修改任何 `.scene` 文件
16. [ ] 不新增图片资源、prefab、第三方依赖
17. [ ] TypeScript 编译无错误
18. [ ] 合金不写入存档
19. [ ] 合金不进入战斗结算奖励

---

## 测试方式

### Web 预览测试

1. 用 Cocos Creator 打开项目
2. 运行 Web 预览
3. 进入第 1 关战斗
4. 验证：
   - 战斗开始后怪物立即刷出（不暂停）
   - 合金数量显示正确（或控制台输出）
   - 点击空塔位可以建塔（消耗合金）
   - 合金不足时建塔失败（控制台输出）
   - 怪物死亡后合金增加
   - 点击已有塔可以升级（消耗合金）
   - 等级上限生效（不能无限升级）
   - 战斗结束后合金清空
   - 重打本关后合金重新初始化
   - 怪物数量明显增多
   - 第一关可以正常通关

### 控制台日志检查

- `[BattleManager] 合金不足，无法建造 xxx，需要 xxx，当前 xxx`
- `[BattleManager] 塔已达等级上限`
- `[BattleManager] 塔升级成功，消耗合金 xxx`
- `[BattleManager] 合金不足，无法升级，需要 xxx，当前 xxx`

---

## 回滚方式

### 代码回滚

1. 使用 `git stash` 或 `git checkout` 回滚修改的文件
2. 优先回滚 `StageConfig.ts` 和 `EnemyConfig.ts`（密度调整）
3. 如果合金系统有问题，回滚 `BattleManager.ts`、`TowerManager.ts`、`TowerController.ts`

### 配置回滚

1. `BattleBalanceConfig.ts` 中的 `initialAlloy` 和 `towerLevelCapPerBaseLevel` 可以快速调整
2. `EnemyConfig.ts` 中的数值可以快速调整
3. `StageConfig.ts` 中的波次配置可以快速调整

### 降级方案

如果新系统不稳定，可以：
1. 保留合金系统但简化（去掉升级功能，只做建塔）
2. 降低怪物密度（减少 count，增加 interval）
3. 提高初始合金（让玩家更容易建塔）

---

## 给执行 Agent 的执行提示词

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/020-battle-alloy-tower-growth-and-wave-density-rework.md

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. TASKS/020-battle-alloy-tower-growth-and-wave-density-rework.md

执行前先输出：
1. 已阅读哪些文件
2. 当前任务目标
3. 本次计划修改哪些文件
4. 不会修改哪些文件
5. 可能风险

执行规则：
1. 只做当前任务
2. 不允许擅自扩大需求
3. 不允许修改当前任务未授权文件
4. 不允许删除已有功能
5. 不允许重构无关代码
6. 不允许业务代码直接调用 wx、tt、tap、TapSDK
7. 平台能力必须通过 platform adapter
8. 不接服务器、不接支付、不做复杂商业化
9. 不修改 .scene 文件
10. 不新增图片、prefab、第三方依赖
11. TowerUpgradeUI 文案先不改
12. BattleSettlement.ts 不改
13. 不做复杂塔详情 UI
14. 怪物密度只做第一版基线
15. SaveManager.towerLevels 字段名保留
16. 不新增 .scene 绑定
17. 第一关必须可完整游玩

完成后必须输出：
1. 修改文件列表
2. 每个文件修改原因
3. 如何在 Web 预览测试
4. 如何验证不影响微信小游戏
5. 如何验证不影响抖音小游戏
6. 如何验证不影响 TapTap 小游戏
7. 是否影响主包体积
8. 是否更新 CHANGELOG.md
9. 是否更新 PROJECT_MEMORY.md
10. 下一步建议

不要提交 Git，只提示人工执行：
git status
git diff
```

---

## 附录：配置参考值

### BattleBalanceConfig 新增

```typescript
initialAlloy: 200,
towerLevelCapPerBaseLevel: 6,
```

### TowerConfig buildCostAlloy

| 塔 | buildCostAlloy |
|----|----------------|
| machinegun_tower | 80 |
| cannon_tower | 150 |
| ice_tower | 120 |
| electric_tower | 140 |

### TowerConfig upgradeCostAlloy（各等级）

| 塔 | Lv2 | Lv3 | Lv4 | Lv5 |
|----|-----|-----|-----|-----|
| machinegun_tower | 50 | 80 | 120 | 180 |
| cannon_tower | 70 | 110 | 160 | 240 |
| ice_tower | 60 | 95 | 140 | 210 |
| electric_tower | 65 | 100 | 150 | 225 |

### EnemyConfig alloyDrop

| 敌人 | alloyDrop |
|------|-----------|
| enemy_mech_bug | 5 |
| enemy_fast_bug | 8 |
| enemy_heavy_mech | 20 |
| enemy_split_drone | 15 |
| enemy_boss | 50 |

### EnemyConfig 数值调整

| 敌人 | health | baseDamage | reward |
|------|--------|------------|--------|
| enemy_mech_bug | 9 | 7 | 5 |
| enemy_fast_bug | 9 | 6 | 8 |
| enemy_heavy_mech | 60 | 14 | 25 |
| enemy_split_drone | 25 | 8 | 15 |
| enemy_boss | 500 | 70 | 100 |
