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
```

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
