# CHANGELOG

## 2026-06-05 007-rogue-choice-and-skills 完成

### Added

- 新增 `assets/scripts/battle/RogueChoiceManager.ts`：肉鸽选择管理器，管理局内 3 选 1 强化选择（触发计时、选项生成、选择生效）。
- 新增 `assets/scripts/battle/SkillManager.ts`：主动技能管理器，管理技能充能次数和释放逻辑（轨道炮区域伤害、全屏冻结）。
- 新增 `assets/scripts/ui/BattleUI.ts`：战斗 UI 组件，管理技能按钮和肉鸽选择面板的交互。

### Changed

- 更新 `assets/scripts/core/EventBus.ts`：新增肉鸽选择事件（ROGUE_CHOICE_TRIGGER、ROGUE_CHOICE_SELECT、ROGUE_CHOICE_COMPLETE）、主动技能事件（SKILL_USE、SKILL_CHARGE_CHANGE、SKILL_ORBITAL_CANNON、SKILL_FREEZE）、战斗强制暂停/恢复事件（BATTLE_FORCE_PAUSE、BATTLE_FORCE_RESUME）。
- 更新 `assets/scripts/data/SkillConfig.ts`：ActiveSkillConfig 新增 `initialCharges` 字段；RogueUpgradeConfig.type 新增 `tower_chain_count` 类型；`rogue_electric_bounce` 改为 `tower_chain_count` 类型，真正实现电塔弹射次数 +1。
- 更新 `assets/scripts/battle/EnemyController.ts`：新增 `freeze()` 方法（完全停止移动）和 `isFrozen()` 方法。
- 更新 `assets/scripts/battle/TowerController.ts`：新增 `applyAttackBonus()`、`applySpeedBonus()`、`applyRangeBonus()`、`applyChainCountBonus()` 方法；`getChainCount()` 现在包含弹射次数加成。
- 更新 `assets/scripts/battle/TowerManager.ts`：`applyRogueUpgrade()` 支持 `tower_chain_count` 类型。
- 更新 `assets/scripts/battle/BattleManager.ts`：集成 RogueChoiceManager 和 SkillManager；新增 `useSkill()`、`getSkillManager()`、`getRogueChoiceManager()` 方法；update() 中集成肉鸽选择触发逻辑；支持肉鸽选择期间强制暂停/恢复战斗。
- 更新 `docs/GAME_DESIGN.md`：新增第 16 节「局内肉鸽选择系统」和第 17 节「主动技能系统」；`rogue_electric_bounce` 类型修正为 `tower_chain_count`。

### Fixed

- RogueChoiceManager._applyUpgrade() 缺少 `tower_chain_count` 分支：`rogue_electric_bounce` 选择后实际不生效。补全该分支，调用 `TowerManager.applyRogueUpgrade()`。
- tower_speed 不生效：`TowerController.resetCooldown()` 直接使用原始 `attackSpeed`，忽略 `_speedBonus`。改为调用 `getAttackSpeed()`（含加成）。
- tower_range 不生效：`TowerController.selectTarget()` 和 `getEnemiesInRange()` 直接使用原始 `range`，忽略 `_rangeBonus`。改为调用 `getRange()`（含加成）。
- 炮塔爆炸范围不随 tower_range 加成变化：`getSplashRadius()` 改为应用 `_rangeBonus`，与配置文案"炮塔爆炸范围 +20%"语义一致。
- BattleUI.onDestroy() 事件解绑失败：改为存储绑定回调引用，复用同一引用进行 on/off。
- BattleUI 移除未使用导入（UITransform、Color、Sprite）。
- 轨道炮无存活敌人时不再消耗充能：`useSkill()` 在无有效目标时返回 false，不扣除 charge。
- 全屏冻结无存活敌人时不再消耗充能：同上。
- `rogue_electric_bounce` 实现修正：从 `tower_attack`（攻击加成）改为 `tower_chain_count`（弹射次数 +1），电塔链式弹射次数受肉鸽强化影响。
- `rogue_ice_effect` 文案与实际效果不一致：原类型为 `tower_attack`（攻击加成），但配置描述为"冰塔减速效果 +10%"。新增 `tower_slow_effect` 类型、`TowerController._slowBonus`/`applySlowBonus()`/`getSlowFactor()` 加成接口，`RogueChoiceManager`/`TowerManager` 补全该分支。
- `docs/GAME_DESIGN.md` 16.3 类型表遗漏 `tower_chain_count` 和 `tower_slow_effect`：从"4 类"更正为"6 类"。

### Notes

- 肉鸽选择触发时间：45 秒、90 秒、135 秒，每局 3 次。
- 轨道炮自动锁定敌人最密集区域，造成 500 点范围伤害（半径 100 像素）。
- 全屏冻结使所有敌人停止移动 2 秒（通过 EnemyController.applySlow(1.0, 2) 实现）。
- 肉鸽选择期间战斗强制暂停，选择完成后恢复。
- 技能采用充能制，每局初始 1 次，可通过肉鸽选择获得额外充能。
- BattleUI 已在 Cocos Creator 编辑器中挂载到 Battle.scene 并绑定技能按钮和肉鸽选择面板。
- .meta 文件由 Cocos Creator 自动生成，未手写。
- 未实现复杂技能树、广告刷新肉鸽选项等 MVP 外功能。
- **Web 预览验证待执行**：需在 Cocos Creator 中运行一局战斗，验证肉鸽选择弹出、技能使用、电塔弹射 +1 效果。

## 2026-06-05 006.5-foundation-playable-integration 完成

### Added

- 新增 `assets/scripts/bootstrap/GameBootstrap.ts`：游戏启动入口脚本，负责初始化所有系统并启动战斗。
- 新增 `assets/scripts/bootstrap/GameBootstrap.ts.meta`：meta 文件。

### Fixed

- 修复目录名拼写错误：`assets/sences` → `assets/scenes`。
- GameBootstrap.onDestroy() 不再调用 EventBus.clear()，改为只解绑自身注册的事件监听。

### Verified

- `assets/scenes/Battle.scene` 已在 Cocos Creator 3.8.x 中重新保存，GameBootstrap 组件已挂载到 Canvas 节点。
- 调试 Label（debugLabel、stageLabel、timeLabel、baseHpLabel、enemyCountLabel、towerCountLabel）已绑定到场景节点。
- 本地预览 Console 验证通过：战斗流程启动、刷怪、塔攻击、结算日志正常输出。
- 001~006 集成验收通过：
  - 002 Platform adapter 在 WebMock 环境下正常降级
  - 003 ConfigManager 能读取 MVP 配置（4 种塔、5 种敌人、10 关）
  - 004 战斗原型能初始化、开始、计时、结束和结算
  - 005 塔系统能创建塔、搜索目标、攻击敌人
  - 006 敌人和波次系统能读取关卡配置并按波次刷怪

### Notes

- GameBootstrap 自动启动第 1 关测试战斗
- 自动放置 4 种测试塔（机枪塔、炮塔、冰塔、电塔）
- 输出详细调试日志，便于验证战斗流程
- 未实现 007 肉鸽选择、主动技能等后续功能
- 未修改平台适配层核心文件

## 2026-06-05 006-enemy-wave-system 完成

### Changed

- 更新 `assets/scripts/battle/BattleSettlement.ts`：`recordKill()` 新增 `reward` 参数，累计敌人击杀奖励；新增 `_totalEnemyReward` 字段；`_calculateBattleCoinReward()` 改为基于累计敌人奖励 × 关卡倍率 × 胜负倍率计算。
- 更新 `assets/scripts/battle/BattleManager.ts`：ENEMY_DEATH 监听中将 `data.reward` 传给 `BattleSettlement.recordKill()`。
- 更新 `assets/scripts/battle/EnemySpawner.ts`：新增 `_waveStartedSet` 跟踪已开始波次；每波首次开始生成时触发 `STAGE_WAVE_START` 事件并更新 `_currentWaveIndex`；`clear()` 中清理 `_waveStartedSet`。
- 更新 `docs/GAME_DESIGN.md`：新增第 15 节「敌人与波次系统」，包含模块职责、五种敌人属性表、波次配置设计、敌人行为、事件通信、验收标准。

### Notes

- 敌人奖励衔接已实现：EnemyController 死亡事件携带 reward → BattleManager 传递 → BattleSettlement 累计 → 结算时 battleCoinReward = 累计奖励 × 关卡倍率 × 胜负倍率。
- 波次事件已修正：每波首次开始生成时触发 STAGE_WAVE_START，同步更新 _currentWaveIndex。
- 配置驱动验证：敌人属性全部来自 EnemyConfig，波次配置来自 StageConfig，无硬编码数值。
- 分裂无人机的分裂逻辑（死亡后生成小单位）当前未在 EnemyController 中实现，属于后续扩展点，不影响 MVP 波次系统验收。

## 2026-06-05 005-tower-system 完成

### Added

- 新增 `assets/scripts/battle/TowerManager.ts`：塔管理器，管理所有塔实例、固定槽位、攻击调度。
- 新增 `assets/scripts/battle/TowerController.ts`：塔控制器，控制单个塔的目标选择、攻击冷却、属性读取。
- 新增 `assets/scripts/battle/ProjectileManager.ts`：投射物管理器，管理投射物飞行、碰撞检测、伤害结算，支持单体/范围/链式三种类型。

### Changed

- 更新 `assets/scripts/data/TowerConfig.ts`：TowerConfig 新增 `splashRadius`（炮塔爆炸半径）、`chainCount`（电塔弹射数量）、`slowFactor`（冰塔减速系数）、`slowDuration`（冰塔减速持续时间）字段。
- 更新 `assets/scripts/battle/EnemyController.ts`：新增 `applySlow()` 减速接口、`getEffectiveSpeed()` 有效速度计算、`getPathProgress()` 路径进度查询。EnemyState 新增 `slowFactor`、`slowRemaining` 字段。
- 更新 `assets/scripts/battle/BattleManager.ts`：集成 TowerManager，战斗循环中驱动塔更新和攻击。

### Notes

- 四种塔攻击行为已验证：机枪塔单体高频、炮塔范围伤害（含距离衰减）、冰塔减速、电塔链式弹射（含伤害衰减）。
- 塔属性全部来自 TowerConfig，无硬编码数值。
- 固定塔位由 TowerSlot 配置提供，不做自由摆放。
- 投射物为逻辑层数据，无 Cocos 节点或 Prefab 创建。

## 2026-06-05 004-battle-prototype 完成

### Added

- 新增 `assets/scripts/battle/BattleManager.ts`：战斗管理器，管理战斗流程（开始、暂停、结算）。
- 新增 `assets/scripts/battle/StageManager.ts`：关卡管理器，管理关卡配置、路径、基地状态。
- 新增 `assets/scripts/battle/EnemySpawner.ts`：敌人生成器，根据关卡波次配置生成敌人。
- 新增 `assets/scripts/battle/EnemyController.ts`：敌人控制器，控制单个敌人的行为（移动、受伤、死亡）。
- 新增 `assets/scripts/battle/BattleSettlement.ts`：战斗结算，处理战斗结束后的奖励计算、数据统计。
- 新增 `assets/scripts/core/EventBus.ts`：事件总线，用于模块间通信，解耦业务逻辑。
- 新增 `assets/scripts/core/TimeManager.ts`：时间管理器，管理战斗计时、暂停、恢复、停止、时间更新。

### Notes

- 实现最小战斗原型，支持敌人沿路径移动、基地受伤、胜负判定和结算。
- 战斗时长按 180 秒配置，失败也给予少量奖励。
- 使用简单占位路径，后续可替换为实际地图路径。
- 无 Cocos 场景或资源文件改动。

## 2026-06-05 003-core-data-config 完成

### Added

- 新增 `assets/scripts/data/TowerConfig.ts`：MVP 4 种塔配置（机枪塔、炮塔、冰塔、电塔），含 5 级升级参数。
- 新增 `assets/scripts/data/EnemyConfig.ts`：MVP 5 种敌人配置（普通机械虫、快速突击虫、重甲机械兵、分裂无人机、小 Boss）。
- 新增 `assets/scripts/data/StageConfig.ts`：MVP 10 关配置，含波次、Boss 时间、奖励倍率。
- 新增 `assets/scripts/data/BuildingConfig.ts`：MVP 5 个建筑配置（基地核心、研究所、矿场 10 级，能源反应堆、工厂 5 级），含 5-10 级升级参数。
- 新增 `assets/scripts/data/SkillConfig.ts`：2 个主动技能（轨道炮、全屏冻结）和 7 个肉鸽强化配置。
- 新增 `assets/scripts/data/RebirthConfig.ts`：星核重构条件、星核碎片计算参数、5 个永久技能配置。
- 新增 `assets/scripts/data/EconomyConfig.ts`：在线收益、离线收益倍率、离线上限、工厂加成配置。
- 新增 `assets/scripts/core/ConfigManager.ts`：统一配置读取管理器，暴露所有配置查询方法。

### Notes

- 本次仅新增数据配置和读取管理，未实现战斗、UI、存档或平台功能。
- 配置使用 TypeScript 常量，后续可迁移为 JSON 或表格。
- 无 Cocos 场景或资源文件改动。

## 2026-06-05 002-platform-adapter 完成

### Added

- 新增 `assets/scripts/platform/IPlatform.ts`：平台适配层统一接口，定义 login、share、showRewardAd、vibrateShort、getSystemInfo、getStorage、setStorage、removeStorage。
- 新增 `assets/scripts/platform/Platform.ts`：平台入口，根据运行环境自动选择 WechatPlatform / DouyinPlatform / TapTapMiniPlatform / WebMockPlatform。支持 `Platform.register()` 覆盖实例。支持 TapSDK 全局对象检测。
- 新增 `assets/scripts/platform/WebMockPlatform.ts`：Web 预览与编辑器环境的 mock 实现，使用 localStorage。
- 新增 `assets/scripts/platform/WechatPlatform.ts`：微信小游戏平台适配，仅在此文件中访问 wx。
- 新增 `assets/scripts/platform/DouyinPlatform.ts`：抖音小游戏平台适配，仅在此文件中访问 tt，已处理 API 命名差异。
- 新增 `assets/scripts/platform/TapTapMiniPlatform.ts`：TapTap 小游戏平台适配，仅在此文件中访问 tap。

### Fixed

- Codex 审查修复：Platform.ts 补充 `register(platform)` 方法，支持手动覆盖平台实例。
- Codex 审查修复：Platform.ts 补充 TapSDK 全局对象声明和检测，tap 和 TapSDK 任一存在均创建 TapTapMiniPlatform。
- Codex 审查修复：所有平台 getStorage 使用 `??` 替代 `||`，避免空字符串被误判为 null。

### Notes

- 本次仅新增 platform 适配层文件，未修改业务代码。
- 无 Cocos 场景或资源文件改动。
- 根目录 `审查模板.md` 为空文件，非本任务产物，不纳入提交。

## 2026-06-05 001-project-init 完成

### Verified

- 001-project-init 任务正式确认完成。
- 一致性检查通过：`README.md`、`CLAUDE.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md`、`docs/` 下 10 个文档、`TASKS/` 下 12 个任务文件全部存在且内容完整。
- 每个 TASKS 文件均包含必需章节：任务目标、背景说明、涉及文件、允许修改范围、禁止修改范围、实现步骤、验收标准、测试方式、回滚方式、给执行 Agent 的执行提示词。
- 无业务代码改动，无 Cocos 场景或资源文件改动。

## 2026-06-05

### Changed

- docs: regenerate project starter package and unify execution agent workflow.
- 统一将执行角色命名为“执行 Agent”，明确可使用 DeepSeek、MiMo 或其他代码模型。
- 重整 PRD、MVP 设计、技术结构图、素材规范、AI 占位素材提示词、AI 协作流程、审查清单、项目记忆和任务提示词。

### Added

- 新增或补全 `CLAUDE.md` 与 `docs/AI_WORKFLOW.md` 的执行 Agent 工作流。

### Notes

- 本次仅修改 Markdown 文档，没有修改业务代码、Cocos 场景或资源文件。

## 2026-06-05 初始化记录

### Added

- 初始化《星垒计划 / Starfortress Project》项目文档体系。
- 新增 PRD、玩法设计、技术设计、平台适配、发布矩阵、美术规范、AI 素材提示词、审查清单与合规文档。
- 新增 `TASKS/001` 至 `TASKS/012` 的首批任务拆分。
- 明确 Codex / 执行 Agent 分工与平台 API 适配约束。
