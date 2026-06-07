# CHANGELOG

## 2026-06-07 012-build-wechat-douyin-taptap 构建链路配置

### Added

- 配置微信小游戏构建目标（wechatgame）
- 配置抖音小游戏构建目标（bytedance）
- 配置 TapTap 小游戏构建目标（cocos-play）
- 更新 `docs/PUBLISH_MATRIX.md` 添加构建步骤和体积检查说明
- 添加源码体积估算：TypeScript 脚本约 300KB，assets 目录约 875KB

### Changed

- 更新 `settings/v2/packages/builder.json` 添加构建任务配置（Battle.scene UUID 修正为 3a1a0eba-8136-47cf-82d1-febcf32362c0）

### Notes

- 已配置，待实际 Web/微信/抖音/TapTap 工具验证
- Web 预览使用 WebMockPlatform，待实际运行验证
- 平台 API 调用仅存在于 `assets/scripts/platform/` 目录
- 所有平台适配器代码中有降级处理（代码审查确认，非平台实测）
- 业务代码未直接调用 wx、tt、tap、TapSDK
- 各平台构建产物待实际构建和开发者工具验证
- 主包实际体积待构建报告确认

## 2026-06-07 011.5-battle-visual-demo 最小可视化战斗 Demo

### Added

- 新增 `assets/scripts/battle/BattleVisualManager.ts`：战斗可视化管理器，监听战斗事件，将逻辑对象映射为可见节点，管理塔、敌人、攻击特效的显示。使用绑定回调方案确保 EventBus 正确解绑。
- 新增 `assets/scripts/battle/EnemyView.ts`：敌人可视化组件，使用 Graphics 绘制圆形敌人和血条，根据敌人类型设置不同颜色。
- 新增 `assets/scripts/battle/TowerView.ts`：防御塔可视化组件，使用 Graphics 绘制矩形防御塔，显示攻击闪烁反馈，根据塔类型设置不同颜色。
- 新增 `assets/scripts/battle/AttackEffectView.ts`：攻击特效可视化组件，使用 Graphics 绘制攻击线和命中特效。

### Changed

- 更新 `assets/scripts/core/EventBus.ts`：新增 `TOWER_PLACED` 和 `TOWER_ATTACK` 事件，用于可视化层监听。
- 更新 `assets/scripts/battle/TowerManager.ts`：在 `placeTower()` 中发射 `TOWER_PLACED` 事件，在 `_executeAttack()` 中发射 `TOWER_ATTACK` 事件。

### Notes

- 战斗可视化层只负责显示，不修改战斗逻辑和数值。
- 敌人使用 Graphics 绘制圆形：普通黄色、Boss 红色、快速橙色、重甲灰色、分裂绿色。
- 塔使用 Graphics 绘制矩形：机枪蓝、炮塔橙、冰塔浅蓝、电塔紫色。
- 攻击时显示攻击线特效和塔闪烁反馈。
- 敌人血条实时更新，死亡后节点自动销毁。
- 路径使用 Graphics 绘制线条和节点。
- 空槽位使用 Graphics 绘制矩形，放置塔后隐藏。
- BattleVisualManager 使用绑定回调方案确保 EventBus.on/off 正确匹配。
- 未修改平台 adapter、未引入新依赖、未修改战斗数值。

## 2026-06-07 011-ui-flow 修复主流程链路

### Fixed

- 修复 GameBootstrap 自动启动战斗：移除 onLoad 中的 `_startBattle()` 调用，改为主界面按钮触发 `GameManager.enterBattle(0)`。
- 修复 BattleManager 未发出 BATTLE_START/BATTLE_END 事件：`startBattle()` 末尾发出 `BATTLE_START`，`_endBattle()` 和 `returnToIdle()` 发出 `BATTLE_END`，GameBootstrap 依赖这些事件正确设置 `_isBattleRunning`。
- 修复 BATTLE_START/BATTLE_END 重复发出：移除 `TimeManager.startBattleTimer()` 和 `stopBattleTimer()` 中的事件发出，统一由 `BattleManager` 发出；`returnToIdle()` 仅在战斗进行中/暂停时发出 `BATTLE_END`，避免与 `_endBattle()` 重复。
- 修复战斗结算奖励未入账：GameBootstrap 监听 `BATTLE_SETTLEMENT` 事件，调用 `BaseManager.addBattleCoin()` 和 `addBaseCoin()` 发放奖励并保存存档。
- 修复 GameBootstrap 放置塔使用固定 level=1：改为从 `SaveManager.towerLevels` 读取已保存的塔等级。
- 修复 GameManager.enterBattle() 在战斗已结束时启动失败：进入战斗前检查 `isEnded()`，自动调用 `returnToIdle()` 回到 idle 状态。
- 修复 BuildingUI 未接入 GameManager 状态管理：新增 `onStateChange` 监听，`building` 状态时显示面板并刷新。
- 修复 BuildingUI 进入后无法返回主界面：新增 `backButton` 属性，点击调用 `GameManager.returnToMain()`。
- 修复 RebirthUI 未接入 GameManager 状态管理：新增 `onStateChange` 监听，`rebirth` 状态时显示面板并刷新；`showRebirthPanel()` 增加状态守卫，防止旧 RebirthOpenButton 绕过 GameManager 直接调用。
- 修复 RebirthUI 进入后无法返回主界面：新增 `backButton` 属性，点击后隐藏确认弹窗并调用 `GameManager.returnToMain()`。
- 修复 BattleUI 不随状态显示/隐藏：新增 `onStateChange` 监听，`battle` 状态时显示，其他状态隐藏；新增 `update()` 方法自动刷新倒计时和基地生命 Label。
- 修复 SettlementUI 继续按钮可能重复点击：点击后清空 `_currentResult` 防止重入；新增 `onStateChange` 监听，非 `settlement` 状态时隐藏。

### Changed

- 更新 `docs/TECH_DESIGN.md`：修正启动流程描述，GameBootstrap 不再自动启动战斗，改为主界面触发；补充 UI 面板通过 `GameManager.onStateChange()` 自动显示/隐藏的说明。

### Notes

- 主界面 → 战斗 → 结算 → 主界面 核心路径已完整接通。
- 建筑升级、塔升级、星核重构、设置入口均通过 GameManager 状态管理自动显示/隐藏。
- 塔升级后下次战斗自动使用存档中的塔等级。
- 所有 UI 组件在 onDestroy 中正确解绑 onStateChange 回调。
- BattleUI 的 `update()` 每帧调用 `updateBattleInfo()` 刷新倒计时和基地生命，不使用全局 find。
- 未修改平台 adapter、未新增平台广告/分享、未引入新依赖。

## 2026-06-06 011-ui-flow 完成

### Added

- 新增 `assets/scripts/core/GameManager.ts`：游戏流程状态管理器，管理主界面/战斗/结算/建筑/塔升级/转生/设置状态切换，提供状态变化回调接口。
- 新增 `assets/scripts/ui/MainUI.ts`：主界面 UI 组件，显示资源（经营币、战斗金币、星核碎片、最高关卡），提供开始战斗、建筑、塔升级、星核重构、设置入口按钮。
- 新增 `assets/scripts/ui/SettlementUI.ts`：战斗结算 UI 组件，显示胜负结果、星级评定、击杀数、奖励金额，提供继续和返回主界面按钮。
- 新增 `assets/scripts/ui/TowerUpgradeUI.ts`：塔升级 UI 组件，显示 4 种 MVP 塔列表、等级、攻击/射速/射程属性和升级按钮，升级消耗战斗金币并持久化到存档。
- 新增 `assets/scripts/ui/SettingsUI.ts`：设置 UI 组件，提供音效/震动开关和存档重置功能。

### Changed

- 更新 `assets/scripts/ui/BattleUI.ts`：新增时间倒计时、基地生命显示 Label；新增暂停和返回主界面按钮；战斗结算后自动隐藏 UI；新增 `updateBattleInfo()` 方法供外部调用刷新战斗信息。
- 更新 `docs/GAME_DESIGN.md`：新增第 21 节「MVP 主流程 UI」，包含流程状态、模块职责、竖屏布局目标和验收标准。
- 更新 `docs/ART_GUIDE.md`：新增第 10 节「竖屏 UI 布局规范」，包含设计分辨率、界面分区、字体规范、按钮规范和占位资源规范。

### Fixed

- 修复 TowerUpgradeUI `@property([Label])` 语法错误：改为 `@property({ type: [Label] })` 合法写法。
- 修复 MainUI 调用不存在的 `getShards()`：改为 `RebirthManager.getRebirthTokens()`。
- 修复 GameManager.enterBattle 未接通 BattleManager：改为直接调用 `BattleManager.startBattleByIndex(stageIndex)`，移除无人监听的 `'game:start_battle'` 字符串事件。
- 修复 TowerUpgradeUI 只打印占位日志：改为实际读取 TowerConfig、扣除战斗金币、更新塔等级并持久化到 SaveManager。
- 修复 BattleUI 的 BATTLE_SETTLEMENT 监听未保存回调引用：改为 `_boundOnSettlement` 字段保存引用，onDestroy 中正确解绑。
- 修复 SettingsUI 的 `onStateChange()` 返回值未保存：改为 `_unsubStateChange` 字段保存取消函数，onDestroy 中调用。
- 修复 GameBootstrap 启动时无条件自动开始战斗：GameManager.enterBattle 由主界面按钮触发，不再自动启动。

### Notes

- GameManager.enterBattle 直接调用 BattleManager.startBattleByIndex，战斗启动成功后切换状态。
- MainUI 在 onLoad 中异步初始化 BaseManager，确保资源数据就绪后刷新显示。
- SettlementUI 监听 BATTLE_SETTLEMENT 事件自动显示，战斗结算数据由 BattleSettlement 提供。
- TowerUpgradeUI 读取 TowerConfig 配置显示 4 种 MVP 塔，升级消耗战斗金币，塔等级持久化到 SaveManager.towerLevels。
- BattleUI 的暂停按钮支持暂停/恢复切换，返回按钮通过 GameManager.returnToMain() 结束战斗并返回。
- 所有 UI 组件在 onDestroy 中正确解绑 EventBus 事件、按钮回调和 onStateChange 取消函数。
- UI 脚本只包含逻辑和接口，实际节点绑定需在 Cocos Creator 编辑器中完成。
- 设置界面的音效/震动开关使用 SaveManager.settings 持久化，格式为 `{ sound: 'true'/'false', vibration: 'true'/'false' }`。
- 设置界面的存档重置为 MVP 调试用途，后续需加确认弹窗。
- 未实现营销落地页、商城、排行榜、好友系统、皮肤或平台广告分享。
- **场景挂载需人工操作**：需在 Cocos Creator 编辑器中为 Battle.scene 创建 MainUI、SettlementUI、TowerUpgradeUI、SettingsUI 节点并挂载组件、绑定按钮和 Label。

## 2026-06-06 010-rebirth-system 完成

### Added

- 新增 `assets/scripts/base/RebirthManager.ts`：星核重构管理器，管理转生条件判断、星核碎片计算、转生执行、永久技能升级和加成读取。
- 新增 `assets/scripts/ui/RebirthUI.ts`：星核重构 UI 组件，显示转生条件、预计碎片、确认弹窗和永久技能列表。

### Changed

- 更新 `assets/scripts/core/SaveManager.ts`：新增 `resetForRebirth()` 方法，重置普通资源但保留永久内容（星核碎片、永久技能、历史最高关卡、塔等级）。
- 更新 `assets/scripts/core/EventBus.ts`：新增星核重构事件（REBIRTH_COMPLETE、PERMANENT_SKILL_UPGRADE）。
- 更新 `assets/scripts/base/BaseManager.ts`：集成 RebirthManager 初始化；新增转生条件检查、执行转生、永久技能升级和加成读取接口。
- 更新 `assets/scripts/bootstrap/GameBootstrap.ts`：补充 RebirthManager 初始化日志。
- 更新 `assets/scripts/base/IdleIncomeManager.ts`：集成永久技能「资源增产」到在线收益计算（乘以 1 + getPermanentProductionBonus()）；集成永久技能「离线扩展」到离线收益上限（叠加 getPermanentOfflineBonusMinutes()）。
- 更新 `docs/GAME_DESIGN.md`：新增第 20 节「星核重构系统」，包含转生条件、碎片计算公式、重置规则、永久技能列表和验收标准。
- 更新 `docs/TECH_DESIGN.md`：补充 RebirthManager 职责描述，更新模块结构图和存档字段。

### Fixed

- 修复 `resetForRebirth()` 未保留用户设置（settings）：星核重构时 `settings` 被 `...defaults` 覆盖为空对象，导致用户/本地设置丢失。现已将 `settings` 加入保留列表。
- 修复 RebirthUI 永久技能升级按钮匿名回调无法解绑：改为存储绑定回调引用 `_skillUpgradeCallbacks`，onDestroy 中逐个解绑。

### Notes

- 转生条件：基地核心 10 级 + 通关第 10 关（配置驱动）。
- 星核碎片公式：最高关卡×10 + 基地等级×5 + 总建筑等级×2 + 总战力×0.01。
- 5 个永久技能：战术强化（塔攻击+5%/级）、资源增产（经营+5%/级）、轨道支援（开局轨道炮+1/级）、离线扩展（离线上限+30分钟/级）、命运干预（肉鸽品质+10%/级）。
- 转生后保留：星核碎片、永久技能、历史最高关卡、塔等级。
- 转生后重置：战斗金币、经营币、建筑等级（基地核心除外）。
- 永久技能集成状态：
  - ✅ 已接入：「资源增产」— IdleIncomeManager 在线收益计算已乘以 (1 + getPermanentProductionBonus())。
  - ✅ 已接入：「离线扩展」— IdleIncomeManager 离线收益上限已叠加 getPermanentOfflineBonusMinutes()。
  - 🔲 预留接口（未接入战斗系统）：「战术强化」getPermanentAttackBonus()、「轨道支援」getPermanentOrbitalCharges()、「命运干预」getPermanentRogueQualityBonus()。

## 2026-06-06 009-idle-offline-reward 完成

### Added

- 新增 `assets/scripts/base/IdleIncomeManager.ts`：放置收益管理器，在线时每帧累加经营币，启动时计算离线收益，提供领取接口。
- 新增 `assets/scripts/ui/OfflineRewardUI.ts`：离线收益弹窗组件，显示离线时长、收益金额和领取按钮，广告翻倍预留入口。

### Changed

- 更新 `assets/scripts/data/EconomyConfig.ts`：新增 `calculateOnlineIncomePerMinute(mineOutput, factoryLevel)` 函数，在线收益公式改为「矿场产出 × 工厂在线倍率 × baseCoinMultiplier」；`calculateOfflineIncome` 新增 `mineOutput` 参数，返回值新增 `maxMinutes` 字段。
- 更新 `assets/scripts/core/EventBus.ts`：新增放置收益事件（IDLE_INCOME_TICK、OFFLINE_REWARD_READY、OFFLINE_REWARD_CLAIMED）。
- 更新 `assets/scripts/bootstrap/GameBootstrap.ts`：接入 BaseManager、IdleIncomeManager 初始化；调整初始化顺序，EventBus 初始化后再注册事件监听；新增 `_listenersRegistered` 防重复注册；非战斗状态驱动在线收益计时；监听 IDLE_INCOME_TICK 累加经营币；定期保存（每 30 秒）；退出时先保存资源再更新离线时间戳。
- 更新 `assets/scripts/base/BaseManager.ts`：新增 `getSaveManager()` 方法；清理未使用的 `SaveData` 导入。
- 更新 `assets/scripts/ui/OfflineRewardUI.ts`：修复领取按钮和广告翻倍按钮未绑定点击事件；在 onLoad 中注册 click 监听，在 onDestroy 中解绑。
- 更新 `docs/GAME_DESIGN.md`：新增第 19 节「放置收益系统」。
- 更新 `docs/TECH_DESIGN.md`：补充 IdleIncomeManager 职责描述。

### Notes

- 在线收益依赖矿场建筑 effectValue（经营币/分钟），工厂等级提供在线倍率加成。
- 离线收益公式：在线收益 × 0.3 × 离线分钟数（上限 60 + (工厂等级-1) × 15 分钟）。
- Web 调试使用本地时间计算离线时长，小游戏平台通过 platform adapter 的 storage 存储时间戳。
- 广告翻倍按钮默认隐藏，广告不可用时领取基础收益。
- 未接入真实广告、服务器校时或复杂反作弊。

## 2026-06-06 008-base-building-system 完成

### Added

- 新增 `assets/scripts/core/SaveManager.ts`：存档管理器，通过 Platform adapter 读写存档，支持默认值合并和版本迁移预留。
- 新增 `assets/scripts/base/BuildingManager.ts`：建筑管理器，管理 5 个 MVP 建筑的等级、升级、消耗和属性加成。
- 新增 `assets/scripts/base/BaseManager.ts`：基地总管理器，协调 SaveManager 和 BuildingManager，管理资源和建筑效果查询。
- 新增 `assets/scripts/ui/BuildingUI.ts`：建筑 UI 组件，显示建筑列表、等级、效果和升级按钮。

### Changed

- 更新 `assets/scripts/data/BuildingConfig.ts`：BuildingConfig 新增 `costType` 字段（`'baseCoin' | 'battleCoin'`），明确每个建筑升级消耗的资源类型。
- 更新 `docs/GAME_DESIGN.md`：新增第 18 节「基地经营建筑系统」。

### Fixed

- BuildingUI 自动初始化 BaseManager：onLoad 时检测未初始化则自动调用 `init()`，确保建筑列表可刷新。
- 升级消耗资源类型按 BuildingConfig.costType 配置决定：基地核心和能源反应堆消耗战斗金币，研究所/矿场/工厂消耗经营币。
- BuildingManager 清理未使用的 `BUILDING_LEVEL_KEYS` 常量和 `_saveManager` 字段。
- BuildingManager.reset() 注释与代码行为一致：保留基地核心等级，重置其他建筑。
- BaseManager.init() 增加重复初始化保护。

### Notes

- 建筑升级资源类型：基地核心(battleCoin)、研究所(baseCoin)、矿场(baseCoin)、能源反应堆(battleCoin)、工厂(baseCoin)。
- 建筑等级持久化通过 SaveManager，存储使用 Platform adapter（Web 环境 localStorage）。
- 建筑效果以数值形式暴露给其他系统，本次未集成到战斗系统。
- BuildingUI 需要在 Cocos Creator 编辑器中挂载到场景才能运行。
- 未实现居民区、商店等 MVP 外建筑。
- 未接入广告、支付或服务器。

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
- 统一将执行角色命名为"执行 Agent"，明确可使用 DeepSeek、MiMo 或其他代码模型。
- 重整 PRD、MVP 设计、技术结构图、素材规范、AI 占位素材提示词、AI 协作流程、审查清单、项目记忆和任务提示词。

### Added

- 新增或补全 `CLAUDE.md` 与 `docs/AI_WORKFLOW.md` 的执行 Agent 工作流。

### Notes

- 本次仅修改 Markdown 文档，没有修改业务代码、Cocos 场景或资源文件。

## 2026-06-05 初始化记录

### Added

- 初始化《星垒计划 / Starfortress Project》项目文档体系。
- 新增 PRD、玩法设计、技术设计、平台适配、发布矩阵、美术规范、AI 占位素材提示词、审查清单与合规文档。
- 新增 `TASKS/001` 至 `TASKS/012` 的首批任务拆分。
- 明确 Codex / 执行 Agent 分工与平台 API 适配约束。
