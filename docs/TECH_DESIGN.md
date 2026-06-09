# 技术设计文档

## 1. 技术基线

- 引擎：Cocos Creator 3.8.x
- 语言：TypeScript
- 屏幕方向：竖屏
- 第一阶段平台：Web 预览、微信小游戏、抖音小游戏、TapTap 小游戏
- 第二阶段可选：TapTap Android APK

## 2. 总体系统结构图

```txt
玩家
-> UI 层
-> GameManager
-> Battle / Base / Data / Platform / Save
-> 配置、存档、本地平台能力
```

```mermaid
flowchart TD
  Player["玩家"] --> UI["UI 层"]
  UI --> GameManager["GameManager"]
  GameManager --> Battle["Battle 战斗系统"]
  GameManager --> Base["Base 经营系统"]
  GameManager --> Save["SaveManager 存档"]
  GameManager --> Platform["Platform Adapter"]
  Battle --> Config["ConfigManager / Data Config"]
  Base --> Config
  Save --> Platform
```

## 3. 核心循环结构图

```txt
BattleManager
-> BattleSettlement
-> ResourceManager / SaveManager
-> BuildingManager / TowerManager
-> IdleIncomeManager
-> RebirthManager
-> Permanent Skills
-> BattleManager
```

## 4. 模块结构图

```txt
assets/
└─ scripts/
   ├─ core/
   │  ├─ GameManager.ts
   │  ├─ SaveManager.ts
   │  ├─ EventBus.ts
   │  ├─ TimeManager.ts
   │  └─ ConfigManager.ts
   ├─ battle/
   │  ├─ BattleManager.ts
   │  ├─ StageManager.ts
   │  ├─ EnemySpawner.ts
   │  ├─ EnemyController.ts
   │  ├─ TowerManager.ts
   │  ├─ TowerController.ts
   │  ├─ ProjectileManager.ts
   │  ├─ SkillManager.ts
   │  ├─ RogueChoiceManager.ts
   │  ├─ BattleSettlement.ts
   │  ├─ BattleVisualManager.ts  (011.5 新增)
   │  ├─ EnemyView.ts           (011.5 新增)
   │  ├─ TowerView.ts           (011.5 新增)
   │  └─ AttackEffectView.ts    (011.5 新增)
   ├─ base/
   │  ├─ BaseManager.ts
   │  ├─ BuildingManager.ts
   │  ├─ IdleIncomeManager.ts
   │  └─ RebirthManager.ts
   ├─ data/
   │  ├─ TowerConfig.ts
   │  ├─ EnemyConfig.ts
   │  ├─ StageConfig.ts
   │  ├─ BuildingConfig.ts
   │  ├─ SkillConfig.ts
   │  ├─ RebirthConfig.ts
   │  └─ EconomyConfig.ts
   ├─ platform/
   │  ├─ IPlatform.ts
   │  ├─ Platform.ts
   │  ├─ WebMockPlatform.ts
   │  ├─ WechatPlatform.ts
   │  ├─ DouyinPlatform.ts
   │  └─ TapTapMiniPlatform.ts
   └─ ui/
      ├─ MainUI.ts
      ├─ BattleUI.ts
      ├─ SettlementUI.ts
      ├─ BuildingUI.ts
      ├─ TowerUpgradeUI.ts
      ├─ OfflineRewardUI.ts
      ├─ RebirthUI.ts
      └─ SettingsUI.ts
```

## 5. 平台适配结构图

```mermaid
flowchart TD
  Biz["业务系统"] --> Platform["Platform.instance"]
  Platform --> IPlatform["IPlatform"]
  IPlatform --> Web["WebMockPlatform"]
  IPlatform --> Wechat["WechatPlatform"]
  IPlatform --> Douyin["DouyinPlatform"]
  IPlatform --> TapTap["TapTapMiniPlatform"]
  Web --> LocalStorage["localStorage"]
  Wechat --> WX["wx API"]
  Douyin --> TT["tt API"]
  TapTap --> TAP["TapTap 小游戏 API"]
```

平台 API 只能出现在 `assets/scripts/platform/`。

## 6. 启动流程

```txt
GameBootstrap.onLoad()
  → Platform.instance (WebMock)
  → ConfigManager.getInstance()
  → EventBus.getInstance()
  → TimeManager.getInstance()
  → BattleManager.getInstance()
  → BaseManager.init()（加载存档）
  → IdleIncomeManager.init()（计算离线收益）
  → 显示主界面（GameManager 状态 = 'main'）

主界面点击「开始战斗」
  → GameManager.enterBattle(0)
  → GameManager 状态 = 'battle'
  → BattleManager.startBattleByIndex(0)
  → BattleManager 发出 BATTLE_START 事件并进入塔位放置阶段
  → 玩家点击空塔位选择 4 种 MVP 塔
  → 放置满 4 个塔后 BattleManager 开始刷怪

GameBootstrap.update(deltaTime)
  → 战斗中：BattleManager.update(deltaTime)
  → 非战斗：IdleIncomeManager.update(deltaTime)
```

GameBootstrap 职责：

1. 初始化所有 Manager 单例
2. 监听 BATTLE_START / BATTLE_END 等战斗事件，维护运行状态和调试输出
3. 驱动 BattleManager.update() 或 IdleIncomeManager.update()
4. 输出调试日志
5. 定期保存存档

注意：

- GameBootstrap 不自动启动战斗，由主界面按钮触发
- GameManager 管理流程状态（main / battle / settlement / building / towerUpgrade / rebirth / settings）
- UI 面板通过 GameManager.onStateChange() 回调自动显示/隐藏
- 不把大量战斗逻辑塞进 GameBootstrap
- 不硬编码大量核心数值
- 不直接调用平台 API

## 7. 数据流图

```mermaid
flowchart LR
  Config["配置数据"] --> Managers["各 Manager"]
  Managers --> Runtime["运行时状态"]
  Runtime --> Save["SaveManager"]
  Save --> Storage["Platform Storage"]
  Storage --> Save
  Save --> Runtime
  Runtime --> UI["UI 展示"]
```

## 8. 主要 Manager 划分

- `GameManager`：流程状态、模块初始化、主界面与战斗切换。
- `ConfigManager`：统一读取塔、敌人、关卡、建筑、技能、经济和重构配置。
- `SaveManager`：存档默认值、读写、版本迁移预留、离线时间戳。
- `TimeManager`：战斗计时、在线收益计时、离线时长计算。
- `BattleManager`：单局状态、开始、暂停、胜负、结算触发。
- `StageManager`：关卡配置读取和关卡进度。
- `EnemySpawner`：按波次生成敌人。
- `TowerManager`：固定塔位、塔实例、塔升级加成。
- `SkillManager`：主动技能次数和释放。
- `RogueChoiceManager`：局内 3 选 1 强化。
- `BuildingManager`：建筑等级、升级、效果汇总。
- `IdleIncomeManager`：在线收益计时（每帧累加经营币）、离线收益计算（基于离线时长和工厂等级）、离线收益上限、离线收益领取。
- `RebirthManager`：星核重构条件判断、碎片计算、转生执行（保留永久内容）、永久技能等级管理和加成读取。通过 `resetForRebirth()` 与 SaveManager 协作重置存档。
- `BattleVisualManager`：战斗可视化管理器（011.5 新增），监听战斗事件，将逻辑对象映射为可见节点，管理塔、敌人、攻击特效的显示。不修改战斗逻辑和数值。

## 8.1 战斗可视化层设计（011.5）

### 设计原则

- 可视化层只负责显示，不修改战斗逻辑和数值
- 通过监听 EventBus 事件获取战斗状态
- 读取逻辑对象的只读状态（位置、血量等）
- 根据逻辑对象 ID 维护节点映射

### 模块职责

- `BattleVisualManager`：主入口，管理所有可视化节点
  - 监听 `BATTLE_START` 初始化场景
  - 监听 `ENEMY_SPAWN` / `ENEMY_DEATH` 管理敌人节点
  - 监听 `TOWER_PLACED` 管理塔节点
  - 监听 `TOWER_ATTACK` 显示攻击特效
  - 在 `update()` 中同步敌人位置和血量
- `EnemyView`：敌人显示组件
  - 用简单方块表示敌人
  - 根据敌人类型设置不同颜色
  - 显示血条
- `TowerView`：塔显示组件
  - 用简单方块表示塔
  - 根据塔类型设置不同颜色
  - 攻击时播放闪烁反馈
- `AttackEffectView`：攻击特效组件
  - 显示塔到敌人的攻击线
  - 淡出效果

### 事件扩展

新增事件（`EventBus.ts`）：

```typescript
TOWER_PLACED: 'tower:placed'   // 塔放置时发出
TOWER_ATTACK: 'tower:attack'   // 塔攻击时发出
```

事件数据结构：

```typescript
// TOWER_PLACED
{
  towerId: string;
  configId: string;
  slotId: string;
  position: { x: number; y: number };
  level: number;
}

// TOWER_ATTACK
{
  towerId: string;
  towerType: string;
  towerPosition: { x: number; y: number };
  targetId: string;
  targetPosition: { x: number; y: number };
}
```

### 场景结构

Battle.scene 中需要创建以下节点层级（需在 Cocos Creator 中手动设置）：

```txt
Canvas
└─ BattleVisualRoot
   ├─ TowerLayer     (塔和槽位)
   ├─ EnemyLayer     (敌人)
   ├─ EffectLayer    (攻击特效)
   └─ PathLayer      (路径点)
```

将 `BattleVisualManager` 组件挂载到 `BattleVisualRoot` 节点，并绑定各 Layer 节点。

## 9. 配置系统设计

MVP 至少包含：

- `TowerConfig`
- `EnemyConfig`
- `StageConfig`
- `BuildingConfig`
- `SkillConfig`
- `RebirthConfig`
- `EconomyConfig`

原则：

- 数值必须配置驱动。
- 业务逻辑不得散落大量魔法数字。
- MVP 可先用 TypeScript 常量，后续可迁移 JSON 或表格。
- 配置读取统一经过 `ConfigManager`。

## 10. 存档系统设计

MVP 存档字段：

```txt
playerLevel
currentStage
highestStage
battleCoin
baseCoin
rebirthToken
baseCoreLevel
labLevel
mineLevel
reactorLevel
factoryLevel
towerLevels
permanentSkillLevels
lastOfflineTimestamp
settings
totalRebirths (可选，统计用)
```

规则：

- 缺字段时使用默认值。
- 读写失败时降级。
- Web 调试使用 `localStorage`。
- 小游戏平台使用 platform adapter 的 storage 能力。
- 第一阶段不接服务器。

## 11. 构建与包体原则

- 主包目标小于 4MB。
- 大资源预留分包和远程资源。
- 首屏资源保持精简。
- 不引入不必要大型依赖。
- 平台构建差异在平台适配层和构建配置中处理。
