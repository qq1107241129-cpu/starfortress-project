# PROJECT_MEMORY

本文记录《星垒计划 / Starfortress Project》的长期决策。后续任务如果改变核心范围、平台约束、协作规则或术语，必须同步更新本文。

## 项目身份

- 游戏名：星垒计划
- 英文名：Starfortress Project
- 仓库名：starfortress-project
- 项目代号：SFP
- 技术栈：Cocos Creator 3.8.x + TypeScript
- 屏幕方向：竖屏
- 目标平台：微信小游戏、抖音小游戏、TapTap 小游戏
- 第二阶段可选：TapTap Android APK
- 游戏类型：科幻塔防 + 放置 + 经营 + 轻度肉鸽 + 转生养成小游戏
- 核心定位：披着塔防皮的模拟经营小游戏
- 美术风格：高级精细像素风 + 轻 UI 质感

## 核心玩法

```txt
3 分钟塔防战斗
-> 获得战斗金币
-> 升级塔防、基地、建筑、放置系统
-> 经营和放置产出经营币
-> 经营币反哺塔防成长
-> 达成条件后星核重构
-> 获得星核碎片
-> 解锁永久技能、特殊能力、新塔、新建筑
-> 下一轮更强
```

## MVP 范围

### 战斗

- 1 张地图
- 10 个关卡
- 每关 3 分钟
- 自动战斗能发挥约 80% 效果
- 固定塔位，MVP 不做自由摆放
- 每局 3 次局内肉鸽选择
- 2 个主动技能：轨道炮、全屏冻结

### 塔

MVP 只做：

- 机枪塔
- 炮塔
- 冰塔
- 电塔

完整规划保留：

- 机枪塔
- 炮塔
- 火焰塔
- 电塔
- 冰塔
- 召唤塔
- 激光塔

### 敌人

MVP 只做：

- 普通机械虫
- 快速突击虫
- 重甲机械兵
- 分裂无人机
- 小 Boss

### 建筑

MVP 只做：

- 基地核心
- 研究所
- 矿场
- 能源反应堆
- 工厂

完整规划保留：

- 基地
- 研究所
- 矿场
- 能源反应堆
- 居民区
- 商店
- 工厂

### 放置收益

- 在线收益高。
- 离线收益低。
- 离线收益有时间上限。
- 工厂升级可提高离线收益上限。
- 后续广告可用于离线收益翻倍，MVP 只预留接口。

### 星核重构

- 转生系统名称：星核重构。
- 转生代币名称：星核碎片。
- MVP 先只做 5 个永久技能：
  1. 所有塔攻击永久 +5%
  2. 经营产出永久 +5%
  3. 开局获得 1 次轨道炮
  4. 离线收益上限 +30 分钟
  5. 肉鸽选项品质小幅提升

## 平台 API 禁止规则

- 平台能力必须通过 platform adapter。
- 业务代码禁止直接调用 `wx`、`tt`、`tap`、`TapSDK`。
- 平台 API 只能出现在 `assets/scripts/platform/`。
- 必须包含 `WebMockPlatform`、`WechatPlatform`、`DouyinPlatform`、`TapTapMiniPlatform`。
- 平台能力不可用时必须降级，不能崩溃。

推荐业务侧调用：

```ts
Platform.instance.login()
Platform.instance.share()
Platform.instance.showRewardAd()
```

## 技术与商业化约束

- 主包目标小于 4MB。
- 资源必须支持分包和远程资源。
- 第一阶段不接服务器。
- 第一阶段不接支付。
- 第一阶段不做复杂商业化。
- TapTap Android APK 只做第二阶段规划，不进入 MVP 实现。

## UI 流程架构

- `GameManager` 管理游戏流程状态：main / battle / settlement / building / towerUpgrade / rebirth / settings。
- UI 面板通过 `GameManager.onStateChange()` 回调自动显示/隐藏。
- 战斗结算由 `BattleManager` 通过 `EventBus.emit(BATTLE_SETTLEMENT)` 触发，`GameManager` 自动切换到 settlement 状态。
- 主界面 → 战斗 → 结算 → 主界面 为 MVP 核心路径。
- GameBootstrap 不自动启动战斗，由主界面按钮触发 `GameManager.enterBattle(0)`。
- BattleManager 在 `BATTLE_START` 后进入塔位放置阶段，由玩家点击空塔位选择 4 种 MVP 塔；放置满 4 个塔后开始刷怪。
- GameBootstrap 监听 `BATTLE_END` 事件恢复 `_isBattleRunning` 标志，确保 IdleIncomeManager 正常运行。
- BattleManager 在 `startBattle()` 时发出 `BATTLE_START`，在 `_endBattle()` 和 `returnToIdle()` 时发出 `BATTLE_END`。
- 所有 UI 组件在 onDestroy 中解绑事件、按钮回调和 onStateChange 取消函数。

## UI 层级置顶规则

- Cocos Creator 3.x 中兄弟节点按 `siblingIndex` 顺序渲染，siblingIndex 越大，渲染越靠后，视觉上越靠上。
- 战斗中的弹出面板（肉鸽选择、塔位选择）需要置顶显示，防止被 BattleVisualRoot 盖住。
- `BattleUI._bringNodeToFront(target)` 方法封装置顶逻辑：`target.setSiblingIndex(target.parent.children.length - 1)`。
- 弹出面板时需要两步置顶：先置顶面板节点（在 BattleUIRoot 内），再置顶 BattleUIRoot（在 Canvas 下）。
- 面板隐藏后不需要恢复层级，下次显示时会重新置顶。

## 执行 Agent 可切换规则

- Codex：规划 + 审查。
- 执行 Agent：执行代码和文档修改，可使用 DeepSeek、MiMo 或其他代码模型。
- 人工：拍板、运行、测试、提交 Git。
- 模型可以切换，但角色固定为执行工程师。
- 切换模型后必须重新阅读 `CLAUDE.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md` 和当前 `TASKS/*.md`。
- 不能依赖上一个模型的口头记忆。

## 当前任务顺序

```txt
001-project-init
-> 002-platform-adapter
-> 003-core-data-config
-> 004-battle-prototype
-> 005-tower-system
-> 006-enemy-wave-system
-> 007-rogue-choice-and-skills
-> 008-base-building-system
-> 009-idle-offline-reward
-> 010-rebirth-system
-> 011-ui-flow
-> 011.5-battle-visual-demo
-> 012-build-wechat-douyin-taptap
-> 014-battle-balance-config-baseline
-> 014.1-battle-speed-control
-> 014.2-electric-chain-effect-and-damage-float-text
-> 015-rogue-choice-panel-zindex-fix
-> 016-stage-select-dynamic-panel
-> 020-battle-alloy-tower-growth-and-wave-density-rework
```

## 战斗数值配置位置

- `assets/scripts/data/BattleBalanceConfig.ts`：集中管理战斗平衡常量（敌人速度、投射物速度、伤害衰减、技能半径、结算倍率等）
- 默认值与原硬编码值一致，修改此文件可统一调整战斗体验
- 后续数值调优在 `TASKS/015-battle-balance-first-tuning.md`

## 合金系统（020）

- 局内资源名称：合金
- 内部字段：`BattleManager._battleAlloy`
- 合金只在单局战斗内有效，不写入存档
- 每局开始时给初始合金（`BATTLE_BALANCE.initialAlloy`，默认 200）
- 怪物死亡时掉落合金（`EnemyConfig.alloyDrop`）
- 合金用途：
  - 在空塔位建造防御塔（`TowerConfig.buildCostAlloy`）
  - 在战斗中升级已放置的防御塔（`TowerLevelConfig.upgradeCostAlloy`）
- 战斗结束、返回主菜单、重打本关时，合金清空并重新初始化
- 合金不进入战斗结算奖励（`BattleSettlement.ts` 未修改）

## 塔等级语义（020）

- `SaveManager.towerLevels` 语义变更：从"永久塔等级"改为"局外塔等级上限"
- 局外塔升级的含义：提升该塔"局内可升级上限"
- 局内塔等级：
  - 每个已放置塔进入战斗时从 1 级开始
  - 玩家消耗合金在局内升级该塔
  - 局内实际等级不能超过：该塔局外上限、基地核心等级决定的总上限
- 基地核心等级决定塔等级总上限：`baseCoreLevel * BATTLE_BALANCE.towerLevelCapPerBaseLevel`（默认每级 6）
- 字段名 `towerLevels` 保留不变，仅注释和文档说明语义变更

## 战斗倍速规则

- `BattleManager` 维护 `_battleSpeed`，`update()` 使用 `scaledDeltaTime = deltaTime * _battleSpeed`
- 倍速通过 `scaledDeltaTime` 影响：战斗倒计时、敌人移动、敌人生成、塔攻击冷却、投射物飞行、减速持续时间
- 倍速不影响：主界面、按钮点击、设置界面、离线收益
- 倍速按钮由用户在 Cocos Creator 中手动创建节点并绑定 `speedButton` / `speedButtonLabel`

## 投射物视觉与逻辑同步规则

- 投射物视觉跟随 `ProjectileManager` 的逻辑投射物位置
- `PROJECTILE_SPAWN` 事件创建视觉节点，`PROJECTILE_HIT` 事件销毁视觉节点
- 炮塔爆炸在命中同一帧触发：`PROJECTILE_HIT` → `SPLASH_HIT` → `takeDamage` → `DAMAGE_NUMBER_SHOW`
- 不再使用 `AttackEffectView` 的独立飞行特效（已弃用）
- 电塔链式攻击是瞬发电弧：逻辑命中在 `ProjectileManager.update()` 中同帧结算，不使用慢速视觉投射物，也不得用新的魔法速度常量模拟瞬发

## 战斗反馈事件

- `CHAIN_HIT`：电弧弹射特效（塔→敌人1→敌人2...）
- `SPLASH_HIT`：炮塔范围爆炸特效
- `DAMAGE_NUMBER_SHOW`：伤害飘字
- `ENEMY_SLOWED` / `ENEMY_SLOW_ENDED`：减速特效
- `PROJECTILE_SPAWN` / `PROJECTILE_HIT`：投射物视觉同步
- `SKILL_ORBITAL_CANNON`：轨道炮特效（预警圆环 + 能量光柱 + 命中爆炸）
- `SKILL_FREEZE`：全屏冻结特效（冰蓝覆盖 + 雪花扩散 + 冰晶裂纹/短线）

## 技能特效系统

- `SkillEffectView`：技能视觉特效管理器，负责轨道炮和全屏冻结的视觉效果
- 挂载位置：`BattleVisualRoot -> EffectLayer` 节点
- 设计决策：独立于 `BattleVisualManager`，便于后续扩展更多技能特效
- 只负责视觉效果，不修改技能伤害、冻结时长、充能逻辑
- 使用 `Graphics` 动态绘制，不引入新图片资源
- 特效生命周期：轨道炮约 0.9 秒，全屏冻结约 1.17 秒
- 特效使用 `update(deltaTime)` 和内部 active effect list 管理，不跟随战斗倍速
- `BATTLE_END` 事件自动清理所有特效

## 关卡选择系统（016）

- `StageSelectPanel.ts`：关卡选择面板组件，挂载在 `StageSelectPanelRoot` 节点
- 动态生成关卡列表 UI（Graphics + Label，不引入图片资源）
- 读取 `StageConfig` 自动生成关卡按钮，不手写固定按钮
- 读取 `SaveManager.highestStage` 判断解锁状态
- 解锁逻辑：第 1 关始终解锁，第 N 关（index N-1）需要 `highestStage >= N-1`
- highestStage 语义：已通关最高关卡编号（默认 0，通关第 1 关后变为 1）
- 胜利后 `GameBootstrap` 监听 `BATTLE_RESULT` 事件更新 highestStage
- 失败不解锁下一关
- `SettlementUI` 继续按钮返回主界面（保守处理），玩家通过关卡选择面板进入下一关
- 不新增 stageSelect 状态，避免影响 MainUIRoot 显隐逻辑
- StageSelectPanel 自身控制 active 显隐
- 后续增加关卡优先只改 `StageConfig`，面板自动扩展

## .scene 仍由用户人工维护

- 执行 Agent 禁止修改 `.scene` 文件
- 倍速按钮、UI 节点绑定需用户在 Cocos Creator 中手动完成

## MVP 暂不做

- 联网
- 服务器
- PVP
- 好友排行榜
- 支付
- 复杂商城
- 复杂剧情
- 多地图主题
- 超过 10 个关卡
- 超过 4 种 MVP 塔
- 超过 5 种 MVP 敌人
- 多角色系统
- 皮肤系统
- 公会
- 原生 APK

## 审查必须检查

1. 是否符合当前任务。
2. 是否越权修改。
3. 是否破坏 Cocos Creator 项目结构。
4. 是否直接调用 `wx`、`tt`、`tap`、`TapSDK`。
5. 是否所有平台能力都经过 platform adapter。
6. 是否影响微信小游戏构建。
7. 是否影响抖音小游戏构建。
8. 是否影响 TapTap 小游戏转换构建。
9. 是否引入过早复杂度。
10. 是否影响主包体积。
11. 是否有性能风险。
12. 是否更新 `CHANGELOG.md`。
13. 是否更新 `PROJECT_MEMORY.md`。
