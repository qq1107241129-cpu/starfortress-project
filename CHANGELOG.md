# CHANGELOG

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
