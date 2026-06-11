# Starfortress Project 当前交接状态

生成时间：2026-06-08

本文件基于当前仓库读取结果整理，用于新会话接手。未重新启动 Cocos Creator，也未重新运行 Web 预览；无法确认的内容均标注为"不确定，需要人工确认"。

---

## 1. 项目基本信息

- 项目中文名：《星垒计划》
- 项目英文名：Starfortress Project
- 仓库名：starfortress-project
- 技术栈：Cocos Creator 3.8.x + TypeScript
- 当前 `package.json` 标记 Creator 版本：3.8.8
- 屏幕方向：竖屏
- 当前目标平台：
  - Web 预览
  - 微信小游戏
  - 抖音小游戏
  - TapTap 小游戏
- 第二阶段可选平台：
  - TapTap Android APK
  - Android / iOS 原生包
- 当前阶段：MVP 开发

### 012 完成状态

- 012 已完成的是平台构建链路配置
- 012 不代表小游戏提审质量达标
- 012 不代表 Web demo 已经可玩
- 012 不代表当前版本已经达到可玩或提审质量

### 可视化战斗状态

- 011.5-battle-visual-demo 已完成
- 战斗可视化层已实现（BattleVisualManager、EnemyView、TowerView、AttackEffectView）
- 是否可玩需要人工在 Web 预览中确认

### 013.1 UILayer 改动状态

- 013.1-UILayer改动 任务1 已完成
- UILayerController 已创建并挂载到 UILayer 节点
- BattleVisualManager 已添加 GameManager 状态监听
- UILayer 默认隐藏，战斗状态时显示，非战斗状态时隐藏
- BattleVisualRoot 默认隐藏，战斗状态时显示

### 013.2 战斗布局重新设计状态

- 013.2-battle-layout-redesign 已实现
- **坐标系已修正**：从横屏(1920×1080)改为 BattleVisualRoot 本地坐标系
- 基地 100×100 正方形居中 (0, 0)（本地坐标原点）
- 8 个塔位围绕基地，距离 110 像素
- 战斗区域：半宽 420，半高 650（竖屏纵向更大）
- 敌人从随机方向进攻
- 战斗开始后暂停，玩家放置 4 个塔后自动恢复
- 小怪白色，Boss 红色
- 不同敌人类型有不同像素形状
- 修复了 StageManager 重复 getPath() 方法 bug
- **修复了塔位放置流程**：
  - 移除 GameBootstrap 自动放置测试塔（此前 slot_1~slot_4 被自动占据）
  - BATTLE_START 不再重复发出（_resumeFromPlacement 改用 BATTLE_PLACEMENT_COMPLETE）
  - GameManager 先 setState('battle') 再 startBattle（节点在 BATTLE_START 前激活）
  - 塔位选择面板支持动态创建（场景未绑定时自动创建）
  - **触摸坐标换算修复**：改用 Camera.screenToWorld() 做 screen→world 转换
  - **动态面板按钮触摸修复**：改用系统级触摸 + 手动碰撞检测
  - **Web 预览鼠标点击修复**：BattleVisualManager 与 BattleUI 动态面板同时监听 MOUSE_DOWN；坐标换算优先使用 getUILocation() 的 UI 世界坐标，Canvas Camera 仅作兜底
  - **BattleUI 激活时序修复**：BattleUI 的 GameManager 状态监听前移到 onLoad，避免 onLoad 内设置 active=false 后 start 未及时执行，导致 battle 状态无法激活 UI
  - **节点级点击兜底**：动态槽位节点、动态塔选择按钮、取消按钮同时挂 TOUCH_END，配合系统级输入双路径处理

**关键判断：任务完成不等于玩法闭环完成；012 构建完成也不代表当前版本已经达到可玩或提审质量。**

---

## 2. 当前 Git 状态

- 当前分支：`feature/013-playable-battle-visual-demo`
- 工作区有未提交改动（013.1-UILayer改动）
- 已修改文件：CHANGELOG.md、CLAUDE.md、Battle.scene、BattleVisualManager.ts、CURRENT_STATE.md
- 新增文件：UILayerController.ts、UILayerController.ts.meta

```txt
git status --short --branch --untracked-files=all 结果：
## feature/013-playable-battle-visual-demo
 M CHANGELOG.md
 M CLAUDE.md
 M assets/scenes/Battle.scene
 M assets/scripts/battle/BattleVisualManager.ts
 M docs/handoff/CURRENT_STATE.md
?? TASKS/013.1-UILayer改动.md
?? assets/scripts/ui/UILayerController.ts
?? assets/scripts/ui/UILayerController.ts.meta
```

### 分支状态判断

1. 当前在 feature/013-playable-battle-visual-demo ✓
2. 有未提交改动（013.1-UILayer改动）
3. 有未跟踪文件（UILayerController.ts、UILayerController.ts.meta、TASKS/013.1-UILayer改动.md）
4. 无 staged 内容 ✓
5. 所有新增 .meta 文件存在 ✓
6. 不应提交的目录未被提交 ✓

### 结论

当前有 013.1 未提交改动，UILayerController 已挂载到 UILayer 节点（人工确认）。建议确认 Web 预览效果后提交。

---

## 3. 任务完成状态总览

| 任务编号 | 任务名 | 状态 | 审查通过 | 合入 develop | 核心产物 | 当前风险 | 人工确认 |
|---------|--------|------|---------|-------------|---------|---------|---------|
| 001 | project-init | 已完成 | ✓ | ✓ | 项目文档体系 | 无 | 不需要 |
| 002 | platform-adapter | 已完成 | ✓ | ✓ | IPlatform/Platform/4个适配器 | 无 | 不需要 |
| 003 | core-data-config | 已完成 | ✓ | ✓ | 8个Config + ConfigManager | 无 | 不需要 |
| 004 | battle-prototype | 已完成 | ✓ | ✓ | BattleManager/StageManager/TimeManager/EnemySpawner/EnemyController/BattleSettlement/EventBus | 无 | 不需要 |
| 005 | tower-system | 已完成 | ✓ | ✓ | TowerManager/TowerController/ProjectileManager | 无 | 不需要 |
| 006 | enemy-wave-system | 已完成 | ✓ | ✓ | EnemySpawner增强/BattleSettlement增强 | 无 | 不需要 |
| 006.5 | foundation-playable-integration | 已完成 | ✓ | ✓ | GameBootstrap/Battle.scene | 无 | 需要确认Web预览 |
| 007 | rogue-choice-and-skills | 已完成 | ✓ | ✓ | RogueChoiceManager/SkillManager/BattleUI | 无 | 需要确认Web预览 |
| 008 | base-building-system | 已完成 | ✓ | ✓ | SaveManager/BuildingManager/BaseManager/BuildingUI | 无 | 需要确认UI |
| 009 | idle-offline-reward | 已完成 | ✓ | ✓ | IdleIncomeManager/OfflineRewardUI | 无 | 需要确认UI |
| 010 | rebirth-system | 已完成 | ✓ | ✓ | RebirthManager/RebirthUI | 无 | 需要确认UI |
| 011 | ui-flow | 已完成 | ✓ | ✓ | GameManager/MainUI/SettlementUI/TowerUpgradeUI/SettingsUI | 无 | 需要确认UI |
| 011.5 | battle-visual-demo | 已完成 | ✓ | ✓ | BattleVisualManager/EnemyView/TowerView/AttackEffectView | 需要确认可视化效果 | 需要Web预览确认 |
| 012 | build-wechat-douyin-taptap | 已完成 | ✓ | ✓ | builder.json构建配置 | 未实机验证 | 需要工具实测 |
| 013.1 | UILayer改动 | 已完成 | - | - | UILayerController/BattleVisualManager状态监听 | 无 | 已确认挂载 |
| 013.2 | 战斗布局重新设计 | 已完成 | - | - | 基地居中/8塔位/随机敌人/像素形状 | 需要Web预览验证 | 需要确认UI |
| 013.3.1 | 统一塔类型命名 | 已完成 | - | - | machinegun_tower/cannon_tower/ice_tower/electric_tower | 需要Web预览验证 | 需要确认放置和攻击 |

### 012 特别说明

- 012 完成的是平台构建链路配置
- 不代表小游戏提审质量达标
- 不代表 Web demo 已经可玩
- 可视化战斗和可玩闭环仍需单独确认

---

## 4. 当前建议新增任务

### 013-playable-battle-visual-demo

**建议状态**：建议新增

**为什么需要**：

1. 现有战斗逻辑可能已经跑通
2. 但塔、怪、子弹、攻击反馈可能没有完整画出来
3. 玩家无法只靠画面理解战斗
4. 012 已完成后仍需要补可玩 demo
5. 完成 013 后再考虑重新构建平台包或提审

**注意**：仓库已存在 011.5-battle-visual-demo 任务，可能已覆盖部分需求。需要人工确认 011.5 的可视化效果是否完整。

如果 011.5 已经完整实现可视化，则 013 可能不需要。如果 011.5 效果不完整，则需要 013 补充。

---

## 5. 当前玩法可玩性评估

| 项目 | 状态 | 说明 |
|------|------|------|
| 1. 主界面是否存在 | 已确认 | MainUIRoot 节点存在于 Battle.scene |
| 2. 开始战斗按钮是否存在 | 已确认 | MainUI.ts 有 startBattleButton 属性 |
| 3. 点击开始战斗后是否进入战斗 | 需要人工确认 | 未重新运行 Web 预览验证 |
| 4. 战斗逻辑是否运行 | 需要人工确认 | BattleManager/EnemySpawner/TowerManager 代码存在 |
| 5. 战斗倒计时是否运行 | 需要人工确认 | TimeManager 代码存在 |
| 6. 敌人逻辑是否生成 | 需要人工确认 | EnemySpawner 代码存在 |
| 7. 塔逻辑是否存在 | 需要人工确认 | TowerManager/TowerController 代码存在 |
| 8. 投射物逻辑是否存在 | 需要人工确认 | ProjectileManager 代码存在 |
| 9. 玩家是否能看到敌人节点 | 需要人工确认 | EnemyView/BattleVisualManager 代码存在 |
| 10. 玩家是否能看到塔节点 | 需要人工确认 | TowerView/BattleVisualManager 代码存在 |
| 11. 玩家是否能看到投射物或攻击反馈 | 需要人工确认 | AttackEffectView 代码存在 |
| 12. 敌人死亡是否有视觉消失 | 需要人工确认 | BattleVisualManager 有移除逻辑 |
| 13. 战斗结束是否有结算 UI | 需要人工确认 | SettlementPanel 节点存在，SettlementUI 代码存在 |
| 14. 结算资源是否进入基地系统 | 需要人工确认 | BattleSettlement/BaseManager 代码存在 |
| 15. 基地升级是否可用 | 需要人工确认 | BuildingPanel 节点存在，BuildingUI 代码存在 |
| 16. 下一局是否能体现成长 | 需要人工确认 | SaveManager/TowerUpgradeUI 代码存在 |
| 17. 离线收益是否可见可领 | 需要人工确认 | OfflineRewardPanel 节点存在，OfflineRewardUI 代码存在 |
| 18. 转生系统是否可见可用 | 需要人工确认 | RebirthUIRoot 节点存在，RebirthUI 代码存在 |
| 19. Web 预览是否完整验收过 | 不确定 | 未重新运行 Web 预览 |
| 20. 当前是否可以称为"可玩 demo" | 不确定 | 需要人工确认上述所有项 |

---

## 6. Cocos 场景与 UI 状态

### 6.1 场景文件

- `assets/scenes/Battle.scene` 存在
- `assets/scenes/Battle.scene.meta` 存在
- 由 Cocos Creator 保存（从格式判断）
- 未发现手写 JSON 风险

### 6.2 Canvas 下主要节点

从 Battle.scene 检索到的主要节点：

```txt
Canvas
├── Camera
├── GameBootstrap
├── UILayer（默认隐藏，开始战斗后显示）
│   ├── DebugInfoLabel
│   ├── TimerLabel
│   ├── BaseHpLabel
│   ├── StageLabel
│   ├── EnemyCountLabel
│   └── TowerCountLabel
├── BattleUIRoot
│   ├── OrbitalCannonButton
│   ├── FreezeButton
│   ├── RogueChoicePanel
│   │   ├── RogueChoiceTitleLabel
│   │   ├── RogueChoiceButton1
│   │   ├── RogueChoiceButton2
│   │   └── RogueChoiceButton3
│   └── ...（其他战斗UI元素）
├── OfflineRewardPanel
│   ├── Background
│   ├── OfflineTimeLabel
│   ├── RewardAmountLabel
│   ├── CapInfoLabel
│   ├── ClaimButton
│   └── AdDoubleButton
├── BuildingPanel
├── RebirthUIRoot
├── MainUIRoot
├── SettlementPanel
├── TowerUpgradePanel
├── SettingsUI
└── BattleVisualRoot
```

### 6.3 UI 面板状态

| 面板 | 用途 | 存在 | 挂组件 | 默认状态 | 显示时机 | 需人工确认 |
|------|------|------|--------|---------|---------|-----------|
| UILayer | 战斗信息层 | ✓ | 无（包含调试Label） | 隐藏 | 开始战斗后显示 | 确认Layout |
| MainUIRoot | 主界面入口 | ✓ | MainUI.ts | 显示 | 游戏启动时 | 确认Layout |
| BattleUIRoot | 战斗UI（技能/肉鸽） | ✓ | BattleUI.ts | 隐藏 | 战斗开始后 | 确认Layout |
| BuildingPanel | 建筑升级 | ✓ | BuildingUI.ts | 隐藏 | 进入建筑界面时 | 确认Layout |
| TowerUpgradePanel | 塔升级 | ✓ | TowerUpgradeUI.ts | 隐藏 | 进入塔升级界面时 | 确认Layout |
| RebirthUIRoot | 转生系统 | ✓ | RebirthUI.ts | 隐藏 | 进入转生界面时 | 确认Layout |
| SettlementPanel | 战斗结算 | ✓ | SettlementUI.ts | 隐藏 | 战斗结算时 | 确认Layout |
| SettingsUI | 设置 | ✓ | SettingsUI.ts | 隐藏 | 进入设置界面时 | 确认Layout |
| OfflineRewardPanel | 离线收益 | ✓ | OfflineRewardUI.ts | 隐藏 | 有离线收益时 | 确认Layout |

### 6.4 BattleVisualRoot 状态

- BattleVisualRoot 节点存在 ✓
- 是否挂载 BattleVisualManager：需要人工确认
- 是否绑定 TowerLayer：需要人工确认
- 是否绑定 EnemyLayer：需要人工确认
- 是否绑定 EffectLayer：需要人工确认
- 是否绑定 PathLayer：需要人工确认
- 运行时创建塔/怪/特效：从代码逻辑看应该可以，需要人工确认

### 6.5 当前 UI 混乱风险

**UILayer 默认隐藏，开始战斗后显示**：这是正确的设计，战斗 UI 元素（倒计时、基地血量、敌人数量等）只在战斗状态下显示。

**其他面板显隐状态需要人工确认**：
- MainUIRoot：应默认显示（主界面入口）
- BattleUIRoot：应默认隐藏，战斗开始后显示
- BuildingPanel：应默认隐藏，进入建筑界面时显示
- TowerUpgradePanel：应默认隐藏，进入塔升级界面时显示
- RebirthUIRoot：应默认隐藏，进入转生界面时显示
- SettlementPanel：应默认隐藏，战斗结算时显示
- SettingsUI：应默认隐藏，进入设置界面时显示
- OfflineRewardPanel：应默认隐藏，有离线收益时显示

建议人工在 Cocos Creator 中确认各面板的默认 active 状态是否正确。

---

## 7. 核心系统状态

### 7.1 Bootstrap / 启动流程

**GameBootstrap 职责**：

- 初始化系统
- 接入 BattleManager
- 接入 BaseManager
- 接入 IdleIncomeManager
- 接入 UI 主流程
- 接入 BattleVisualManager（通过事件监听）

**当前已知风险**：

- 未重新运行 Web 预览，不确定启动流程是否正常

### 7.2 EventBus

**当前职责**：模块间通信

**主要事件类型**：

- 战斗事件：BATTLE_START、BATTLE_END、BATTLE_SETTLEMENT、BATTLE_RESULT、ENEMY_SPAWN、ENEMY_DEATH、ENEMY_REACH_BASE、BASE_HEALTH_CHANGE、STAGE_WAVE_START、STAGE_BOSS_SPAWN、TIME_UPDATE
- UI 事件：无独立UI事件，通过GameManager状态管理
- 肉鸽事件：ROGUE_CHOICE_TRIGGER、ROGUE_CHOICE_SELECT、ROGUE_CHOICE_COMPLETE、BATTLE_FORCE_PAUSE、BATTLE_FORCE_RESUME
- 技能事件：SKILL_USE、SKILL_CHARGE_CHANGE、SKILL_ORBITAL_CANNON、SKILL_FREEZE
- 基地事件：REBIRTH_COMPLETE、PERMANENT_SKILL_UPGRADE
- 离线收益事件：IDLE_INCOME_TICK、OFFLINE_REWARD_READY、OFFLINE_REWARD_CLAIMED
- 可视化事件：TOWER_PLACED、TOWER_ATTACK

**事件解绑风险**：各组件在 onDestroy 中解绑，风险较低

### 7.3 Platform Adapter

**platform 目录文件**：

- `IPlatform.ts`
- `Platform.ts`
- `WebMockPlatform.ts`
- `WechatPlatform.ts`
- `DouyinPlatform.ts`
- `TapTapMiniPlatform.ts`

**合规性**：

- 不存在业务代码直接调用 wx / tt / tap / TapSDK
- 符合平台 API 只在 platform 目录内的规则

### 7.4 Config / 数据配置

**配置文件状态**：

| 配置 | 文件 | 状态 |
|------|------|------|
| ConfigManager | core/ConfigManager.ts | ✓ |
| TowerConfig | data/TowerConfig.ts | ✓ |
| EnemyConfig | data/EnemyConfig.ts | ✓ |
| StageConfig | data/StageConfig.ts | ✓ |
| BuildingConfig | data/BuildingConfig.ts | ✓ |
| SkillConfig | data/SkillConfig.ts | ✓ |
| EconomyConfig | data/EconomyConfig.ts | ✓ |
| RebirthConfig | data/RebirthConfig.ts | ✓ |

**已知问题**：

- 007 审查时发现 `rogue_electric_bounce` 配置与实际效果不一致，需要确认是否已修复
- 资源消耗类型需要确认是否按 BuildingConfig 正确配置

### 7.5 Battle / 战斗逻辑

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| BattleManager | battle/BattleManager.ts | 战斗流程管理 |
| StageManager | battle/StageManager.ts | 关卡管理 |
| TimeManager | core/TimeManager.ts | 时间管理 |
| EnemySpawner | battle/EnemySpawner.ts | 敌人生成 |
| EnemyController | battle/EnemyController.ts | 敌人控制 |
| TowerManager | battle/TowerManager.ts | 塔管理 |
| TowerController | battle/TowerController.ts | 塔控制 |
| ProjectileManager | battle/ProjectileManager.ts | 投射物管理 |

**当前状态**：

- 是逻辑层对象
- 是否创建 Cocos 节点：需要通过 BattleVisualManager 确认
- 当前是否看得到敌人、塔、投射物：需要人工 Web 预览确认

### 7.6 Battle Visual / 战斗可视化

**已实现文件**：

| 文件 | 职责 |
|------|------|
| BattleVisualManager | 战斗可视化管理器，监听事件创建/销毁节点 |
| EnemyView | 敌人可视化组件，Graphics绘制圆形+血条 |
| TowerView | 塔可视化组件，Graphics绘制矩形+闪烁反馈 |
| AttackEffectView | 攻击特效组件，Graphics绘制攻击线 |

**层级结构**（从代码推断）：

- TowerLayer：塔和槽位
- EnemyLayer：敌人
- EffectLayer：攻击特效
- PathLayer：路径点

**已知风险**：

- 未重新运行 Web 预览验证可视化效果
- 场景中 BattleVisualRoot 是否正确绑定需要人工确认

### 7.7 Rogue / Skills

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| RogueChoiceManager | battle/RogueChoiceManager.ts | 肉鸽选择管理 |
| SkillManager | battle/SkillManager.ts | 主动技能管理 |
| BattleUI | ui/BattleUI.ts | 战斗UI（技能按钮/肉鸽面板） |

**功能状态**：

- 轨道炮：实现，有UI入口
- 全屏冻结：实现，有UI入口
- 肉鸽 3 选 1：实现，有UI入口
- 次数限制：实现
- 无目标消耗次数风险：007 审查时发现，需要确认是否已修复

### 7.8 Base Building / 基地建筑

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| BaseManager | base/BaseManager.ts | 基地总管理 |
| BuildingManager | base/BuildingManager.ts | 建筑管理 |
| BuildingUI | ui/BuildingUI.ts | 建筑UI |
| SaveManager | core/SaveManager.ts | 存档管理 |

**功能状态**：

- 建筑列表：5个MVP建筑
- 建筑升级：实现
- 资源类型：baseCoin / battleCoin
- 消耗是否按 BuildingConfig：应该按配置
- BuildingUI 场景绑定状态：BuildingPanel 节点存在，需要人工确认绑定

### 7.9 Idle / Offline Reward

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| IdleIncomeManager | base/IdleIncomeManager.ts | 放置收益管理 |
| OfflineRewardUI | ui/OfflineRewardUI.ts | 离线收益UI |
| EconomyConfig | data/EconomyConfig.ts | 经济配置 |

**功能状态**：

- 在线收益：实现
- 离线收益：实现
- 离线时长上限：实现
- 领取逻辑：实现
- 是否接入 GameBootstrap：已接入
- 是否已 UI 验证：需要人工确认

### 7.10 Rebirth

**核心模块**：

| 模块 | 文件 | 职责 |
|------|------|------|
| RebirthManager | base/RebirthManager.ts | 转生管理 |
| RebirthUI | ui/RebirthUI.ts | 转生UI |

**功能状态**：

- 转生条件：基地核心10级 + 通关第10关
- 转生奖励：星核碎片
- 重置范围：战斗金币、经营币、建筑等级（基地核心除外）
- 是否接入主界面：RebirthUIRoot 节点存在
- 是否已验证：需要人工确认

### 7.11 UI Flow

**UI 面板列表**：

- MainUIRoot：主界面
- BattleUIRoot：战斗UI
- BuildingPanel：建筑升级
- TowerUpgradePanel：塔升级
- RebirthUIRoot：转生
- SettlementPanel：战斗结算
- SettingsUI：设置
- OfflineRewardPanel：离线收益

**流程状态**：

- 开始战斗流程：实现
- 返回主界面流程：实现
- UI 显隐管理：通过 GameManager 状态管理
- 当前面板是否杂乱：可能同时显示，需要人工确认
- 是否需要 Layout 整理：需要人工在 Cocos Creator 中确认

### 7.12 Platform Build

**012 完成状态**：

- Web 构建：已配置，待实测
- 微信小游戏构建：已配置，待 AppID/微信开发者工具实测
- 抖音小游戏构建：已配置，待 AppID/抖音开发者工具实测
- TapTap 小游戏构建：已配置，待转换工具实测

**是否只是构建链路**：是

**是否已实机验证**：否

**是否已提审**：否

**是否建议可玩 demo 完成后重新构建**：是

---

## 8. 当前主要问题和风险

1. **任务完成不等于可玩闭环完成**：001~012 都已完成，但实际可玩性需要人工验证。

2. **012 构建完成不等于提审质量达标**：只是配置了构建目标，未实机验证。

3. **当前可能仍缺少完整战斗可视化**：011.5 已实现，但效果需要人工确认。

4. **当前 UI 面板可能同时显示**：导致画面混乱，需要人工在 Cocos Creator 中设置默认显隐。

5. **Cocos 场景绑定必须人工确认**：从 scene 文件可以看到节点名，但组件绑定和属性赋值需要打开 Cocos Creator 确认。

6. **新增脚本 .meta 必须提交**：当前所有 .meta 已提交，后续新增脚本时注意。

7. **Battle.scene 不得手写 JSON**：必须通过 Cocos Creator 编辑器保存。

8. **Web 预览结果必须人工确认**：未重新运行 Web 预览，不确定当前状态。

9. **平台包可能需要在可玩 demo 完成后重新构建**：012 只是配置，实际构建需要人工操作。

10. **如果 Scene 中有 Missing Script**：必须先修复，当前未确认是否有 Missing Script。

11. **如果 UI active 状态错误**：运行画面会混乱，需要人工确认。

12. **如果可视化层直接改战斗逻辑**：后续风险高，当前代码分离良好。

13. **如果继续平台提审**：会暴露 demo 不可玩的问题。

---

## 9. 当前禁止事项

- 不自动提交 Git
- 不手写 Battle.scene JSON
- 不提交 Cocos 缓存目录（library/、temp/、build/、profiles/、native/）
- 不提交 node_modules
- 不直接调用平台 API（wx/tt/tap/TapSDK）
- 不接服务器
- 不接支付
- 不做正式平台提审
- 不引入不必要依赖
- 不重写战斗系统
- 不越权做后续任务
- 不在 develop 上直接做未审查功能
- 不把"未验证"写成"已通过"

---

## 10. 下一步建议

根据当前仓库状态：

1. **不回滚 012**：保留 012 作为构建链路成果。

2. **暂停平台提审**：当前 demo 可玩性未确认，不适合提审。

3. **人工确认 011.5 可视化效果**：
   - 用 Cocos Creator 3.8.x 打开项目
   - 运行 Web 预览
   - 确认能否看到塔、敌人、攻击反馈、死亡消失
   - 确认战斗结算是否正常

4. **如果 011.5 效果不完整**：新建 `TASKS/013-playable-battle-visual-demo.md` 补充可视化。

5. **如果 011.5 效果完整**：新建 `TASKS/013-playable-loop-integration.md` 完善可玩闭环。

6. **最后重新构建平台包**：准备提审。

建议任务顺序：

```txt
013-playable-loop-integration（战斗结算资源 → 回基地升级 → 再战斗变强）
014-demo-polish-and-first-run（首次体验调优、默认资源、UI显隐、调试Label清理）
最后重新构建平台包，准备提审
```

---

## 11. 建议的 013 任务摘要

如果需要新增可视化任务：

```txt
任务名：013-playable-battle-visual-demo

目标：让玩家在 Web 预览中肉眼看到塔打怪的完整过程。

验收：
主界面 -> 开始战斗 -> 可见塔 -> 可见敌人 -> 敌人移动 -> 攻击反馈 -> 敌人死亡 -> 结算

禁止：
不做平台构建，不接 SDK，不重写战斗系统，不做正式美术，不引入新依赖。
```

如果 011.5 已完整实现，则建议：

```txt
任务名：013-playable-loop-integration

目标：让玩家体验完整的"打怪 → 结算 → 升级 → 再打变强"循环。

验收：
战斗结算 → 资源入账 → 回基地 → 升级塔/建筑 → 再次战斗 → 感受到变强

禁止：
不做平台构建，不接 SDK，不引入新依赖。
```

---

## 12. 给下一位执行 Agent 的提示词

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前仓库路径：
D:\project\starfortress-project

当前分支：
develop

当前建议任务：
1. 先人工运行 Web 预览，确认 011.5 可视化效果
2. 根据效果决定是否需要 013 补充任务

需要先读取：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. docs/AI_WORKFLOW.md
6. docs/REVIEW_CHECKLIST.md
7. 当前 TASKS 文件

需要先执行：
git status --short --branch --untracked-files=all
git log --oneline -10

严格要求：
1. 只做当前任务
2. 不自动提交 Git
3. 不手写 .scene JSON
4. 不接平台 API
5. 不引入依赖
6. Cocos 场景绑定必须通过 Cocos Creator 编辑器完成

Web 预览验收标准：
1. 主界面显示正常
2. 点击开始战斗进入战斗
3. 能看到塔节点
4. 能看到敌人节点和移动
5. 能看到攻击反馈
6. 敌人死亡后节点消失
7. 战斗结算正常显示
8. 结算资源正确入账
```

---

## 13. 给 Codex 审查员的提示词

```txt
你是《星垒计划 / Starfortress Project》的代码审查员。

请审查执行 Agent 当前产生的改动，不要直接修改代码。

当前任务文件：
根据实际任务确定 TASKS/xxx.md

审查前必须读取：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. docs/AI_WORKFLOW.md
6. docs/REVIEW_CHECKLIST.md
7. 当前 TASKS 文件
8. 本次新增或修改的关键文件

重点检查：
1. 是否符合当前 TASKS 任务
2. 是否只完成了当前任务
3. 是否存在越权修改
4. git status 是否干净
5. git diff 是否符合预期
6. 新增 .meta 是否存在
7. Battle.scene 是否手写 JSON 风险
8. Cocos 场景绑定是否正确
9. Web 预览结果是否正常
10. 是否能进入下一任务

请输出：
1. 审查结论：通过 / 不通过
2. 必须修复项
3. 建议优化项
4. 是否允许提交
5. 如果不通过，给最小修复提示词
6. 如果通过，给提交建议

提交建议格式：
git add [文件列表]
git commit -m "feat(xxx): 描述"
```

---

## 14. 不确定内容说明

以下内容未实际验证，需要人工确认：

1. Web 预览是否能正常运行
2. 战斗可视化效果是否完整
3. UI 面板默认显隐是否正确
4. BattleVisualManager 组件绑定是否正确
5. 各 UI 面板 Layout 是否合理
6. 是否存在 Missing Script
7. 平台构建是否能正常生成产物
8. 实际可玩性是否达标

---

*本文档基于仓库文件和 git 命令输出生成，未运行 Web 预览，未打开 Cocos Creator。*
