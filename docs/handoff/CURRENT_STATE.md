# Starfortress Project 当前交接状态

生成时间：2026-06-06

本文件基于当前仓库读取结果整理，用于新会话接手。未重新启动 Cocos Creator，也未重新运行 Web 预览；无法确认的内容均标注为“不确定，需要人工确认”。

## 1. 项目名称、技术栈、目标平台

- 项目中文名：《星垒计划》
- 项目英文名：Starfortress Project
- 仓库名：starfortress-project
- 技术栈：Cocos Creator 3.8.x + TypeScript
- 当前 `package.json` 标记 Creator 版本：3.8.8
- 屏幕方向：竖屏
- 目标平台：
  - Web 预览
  - 微信小游戏
  - 抖音小游戏
  - TapTap 小游戏
- 第二阶段可选平台：
  - TapTap Android APK
  - Android / iOS 原生包

## 2. 当前 Git 分支状态

- 当前分支：`feature/007-rogue-choice-and-skills`
- 当前 HEAD：`640c159 更新文档`
- `develop` 与 `origin/develop` 当前也指向 `640c159 更新文档`
- 当前工作区存在未提交改动。

当前 `git status --short --branch --untracked-files=all` 结果要点：

```txt
## feature/007-rogue-choice-and-skills
 M CHANGELOG.md
 M assets/scripts/battle/BattleManager.ts
 M assets/scripts/battle/EnemyController.ts
 A assets/scripts/battle/RogueChoiceManager.ts
 A assets/scripts/battle/SkillManager.ts
 M assets/scripts/battle/TowerController.ts
 M assets/scripts/battle/TowerManager.ts
 M assets/scripts/core/EventBus.ts
 M assets/scripts/data/SkillConfig.ts
 A assets/scripts/ui/BattleUI.ts
 M docs/GAME_DESIGN.md
?? assets/scripts/battle/RogueChoiceManager.ts.meta
?? assets/scripts/battle/SkillManager.ts.meta
?? assets/scripts/ui.meta
?? assets/scripts/ui/BattleUI.ts.meta
```

当前未见 staged 内容；提交前需要人工重新执行 `git status`、`git diff`、`git diff --cached` 确认。

## 3. 已完成任务：001 到当前任务

已提交并在 `CHANGELOG.md` 中记录完成的任务：

1. `001-project-init`
   - 完成项目文档、MVP 范围、任务拆分、审查标准初始化。
   - 无业务代码和 Cocos 场景改动。

2. `002-platform-adapter`
   - 完成 `assets/scripts/platform/` 平台适配层。
   - 包含 `IPlatform.ts`、`Platform.ts`、`WebMockPlatform.ts`、`WechatPlatform.ts`、`DouyinPlatform.ts`、`TapTapMiniPlatform.ts`。
   - 平台 API 只允许在 platform 目录内出现。

3. `003-core-data-config`
   - 完成核心数据配置。
   - 包含塔、敌人、关卡、建筑、技能、转生、经济配置，以及 `ConfigManager.ts`。

4. `004-battle-prototype`
   - 完成战斗原型基础模块。
   - 包含 `BattleManager`、`StageManager`、`TimeManager`、`BattleSettlement`、事件总线等基础能力。

5. `005-tower-system`
   - 完成 MVP 塔系统。
   - 包含 `TowerController`、`TowerManager`、`ProjectileManager`。
   - 当前投射物为逻辑层数据，无 Cocos 节点或 Prefab。

6. `006-enemy-wave-system`
   - 完成敌人与波次系统。
   - 包含敌人生成、波次事件、击杀奖励衔接。

7. `006.5-foundation-playable-integration`
   - 完成 Cocos 工程结构补齐和最小可玩战斗集成。
   - 新增 `GameBootstrap.ts` 和可信的 `assets/scenes/Battle.scene`。
   - `CHANGELOG.md` 记录 001~006 集成验收通过。

当前任务：

8. `007-rogue-choice-and-skills`
   - 当前处于进行中状态。
   - 工作区已有 007 代码和文档改动，但最近一次 Codex 审查结论为“不通过”。
   - `CHANGELOG.md` 工作区 diff 中写了“007 完成”，但这只是未提交改动，且当前不能视为已通过。

## 4. 当前正在进行的任务

当前任务文件：`TASKS/007-rogue-choice-and-skills.md`

任务目标：

- 实现局内肉鸽强化选择。
- 实现每局 3 次 3 选 1。
- 实现塔属性强化。
- 实现 2 个主动技能：轨道炮、全屏冻结。
- 在战斗 UI 暴露技能按钮和肉鸽选择面板入口。

当前工作区已有 007 相关文件：

- `assets/scripts/battle/RogueChoiceManager.ts`
- `assets/scripts/battle/RogueChoiceManager.ts.meta`
- `assets/scripts/battle/SkillManager.ts`
- `assets/scripts/battle/SkillManager.ts.meta`
- `assets/scripts/ui.meta`
- `assets/scripts/ui/BattleUI.ts`
- `assets/scripts/ui/BattleUI.ts.meta`
- `assets/scripts/battle/BattleManager.ts`
- `assets/scripts/battle/EnemyController.ts`
- `assets/scripts/battle/TowerController.ts`
- `assets/scripts/battle/TowerManager.ts`
- `assets/scripts/core/EventBus.ts`
- `assets/scripts/data/SkillConfig.ts`
- `docs/GAME_DESIGN.md`
- `CHANGELOG.md`

当前已知阻塞点：

- `assets/scenes/Battle.scene` 当前没有 007 的 `BattleUI` 挂载痕迹；只检出 `GameBootstrap` 和调试 Label。
- `BattleUI.ts` 中事件监听使用 `bind(this)` 注册和解绑，`onDestroy()` 无法移除同一引用。
- `SkillManager.ts` 中轨道炮在无存活敌人时可能仍消耗技能次数。
- `rogue_electric_bounce` 配置描述为“电塔弹射次数 +1”，但当前类型是 `tower_attack`，实际效果与文案不一致。
- 007 是否已在 Web 预览中验证：不确定，需要人工确认。

## 5. 001~006.5 当前是否跑通

- `CHANGELOG.md` 中 `006.5-foundation-playable-integration` 记录：001~006 集成验收通过。
- 记录内容包括：
  - Platform adapter 在 WebMock 环境下降级正常。
  - ConfigManager 能读取 MVP 配置。
  - 战斗原型能初始化、开始、计时、结束和结算。
  - 塔系统能创建塔、搜索目标、攻击敌人。
  - 敌人和波次系统能读取关卡配置并按波次刷怪。
  - 本地预览 Console 验证通过。
- 本次交接整理未重新启动 Cocos Creator，也未重新运行 Web 预览。
- 当前工作区叠加了未提交的 007 改动，因此 001~006.5 在当前工作区是否仍完全跑通：不确定，需要人工确认。

## 6. Cocos Creator 工程壳迁移状态

当前仓库已经具备 Cocos Creator 3.8.x 工程基本结构：

- `package.json` 存在。
- `tsconfig.json` 存在。
- `assets/` 存在。
- `settings/` 存在，当前包含 `settings/v2`。
- `.creator/` 存在。
- `assets/scenes/` 存在。
- `assets/scripts/` 存在。
- `.gitignore` 明确不忽略 `*.meta`。

当前本地存在但不应提交的 Cocos 生成目录：

- `library/`
- `temp/`
- `profiles/`

`.gitignore` 当前忽略：

- `library/`
- `temp/`
- `local/`
- `logs/`
- `build/`
- `profiles/`
- `native/`
- `node_modules/`

注意：

- `.meta` 文件必须提交。
- 不要提交 `library/`、`temp/`、`build/`、`local/`、`profiles/`、`native/`。

## 7. Battle.scene 当前状态

当前场景文件：

- `assets/scenes/Battle.scene`
- `assets/scenes/Battle.scene.meta`

当前读取到的场景状态：

- `Battle.scene` 存在，大小约 36 KB。
- `Battle.scene.meta` 存在。
- 场景包含 `Canvas`。
- 场景包含 `GameBootstrap`。
- 场景包含调试 Label：
  - `DebugInfoLabel`
  - `TimerLabel`
  - `BaseHpLabel`
  - `StageLabel`
  - `EnemyCountLabel`
  - `TowerCountLabel`
- 当前 `git diff -- assets/scenes/Battle.scene` 无输出，说明 007 当前没有修改场景文件。
- 当前未检出 `BattleUI`、`RogueChoiceManager` 或 `SkillManager` 的场景挂载痕迹。

结论：

- `Battle.scene` 当前可作为 006.5 的最小战斗启动场景。
- `Battle.scene` 当前不能证明已完成 007 UI 挂载。
- 007 继续推进时，应由 Cocos Creator 编辑器挂载 `BattleUI` 并保存场景，不应手写 `.scene` JSON。

## 8. GameBootstrap 当前状态

当前文件：

- `assets/scripts/bootstrap/GameBootstrap.ts`
- `assets/scripts/bootstrap/GameBootstrap.ts.meta`

当前读取到的职责：

- `GameBootstrap` 是 Cocos `Component`。
- 已声明并绑定调试 Label 属性：
  - `debugLabel`
  - `stageLabel`
  - `timeLabel`
  - `baseHpLabel`
  - `enemyCountLabel`
  - `towerCountLabel`
- `start()` 中会启动战斗。
- `update(deltaTime)` 中会推进 `BattleManager.update(deltaTime)` 并刷新调试 Label。
- `_startBattle()` 调用 `BattleManager.startBattleByIndex(0)` 启动第 1 关测试战斗。
- `onDestroy()` 存在，按 `CHANGELOG.md` 记录，不再调用 `EventBus.clear()`，只解绑自身事件监听。

当前注意事项：

- 不要恢复 `EventBus.clear()`。
- 007 如需 UI 接入，应避免破坏 `GameBootstrap` 已有 001~006.5 集成能力。

## 9. 平台 adapter 规则

平台规则来自 `CLAUDE.md`、`PROJECT_MEMORY.md`、`docs/PLATFORM.md` 和 `docs/TECH_DESIGN.md`：

- 所有平台能力必须通过 `Platform.instance`。
- 业务代码禁止直接调用：
  - `wx`
  - `tt`
  - `tap`
  - `TapSDK`
- 平台 API 只能出现在 `assets/scripts/platform/` 目录。
- 平台能力不可用时必须降级，不能导致核心玩法崩溃。
- MVP 只预留广告和分享接口，不真实接入广告刷新或商业化。

平台适配层文件：

- `assets/scripts/platform/IPlatform.ts`
- `assets/scripts/platform/Platform.ts`
- `assets/scripts/platform/WebMockPlatform.ts`
- `assets/scripts/platform/WechatPlatform.ts`
- `assets/scripts/platform/DouyinPlatform.ts`
- `assets/scripts/platform/TapTapMiniPlatform.ts`

## 10. 当前禁止事项

全项目禁止事项：

- 不要越权修改当前任务未授权文件。
- 不要顺手重构无关代码。
- 不要删除已有功能。
- 不要自动提交 Git。
- 不要直接调用平台 API。
- 不要引入不必要依赖。
- 不要破坏 Cocos Creator 工程结构。
- 不要忽略或遗漏 `.meta` 文件。
- 不要提交 Cocos 生成缓存目录。

当前 007 禁止事项：

- 不新增 MVP 外主动技能。
- 不做复杂技能树。
- 不做广告刷新肉鸽选项的真实接入。
- 不实现完整美术特效。
- 不接平台 API。
- 不实现 008 或后续任务内容。

第一阶段持续禁止：

- 不接服务器。
- 不接支付。
- 不做 TapTap Android APK 原生 SDK。
- 不做复杂商业化。

## 11. 后续任务顺序

根据 `PROJECT_MEMORY.md` 和 `TASKS/` 当前文件，任务顺序如下：

1. `001-project-init`：已完成
2. `002-platform-adapter`：已完成
3. `003-core-data-config`：已完成
4. `004-battle-prototype`：已完成
5. `005-tower-system`：已完成
6. `006-enemy-wave-system`：已完成
7. `006.5-foundation-playable-integration`：已完成
8. `007-rogue-choice-and-skills`：进行中，当前未通过审查
9. `008-base-building-system`：未开始
10. `009-idle-offline-reward`：未开始
11. `010-rebirth-system`：未开始
12. `011-ui-flow`：未开始
13. `012-build-wechat-douyin-taptap`：未开始

下一任务分支建议在 007 审查通过并合并后创建：

```bash
git checkout -b feature/008-base-building-system
```

## 12. 下一步建议

建议先完成 007 修复，不要进入 008：

1. 用 Cocos Creator 3.8.x 打开当前项目。
2. 确认新增 007 脚本的 `.meta` 文件已由 Cocos 生成并纳入 Git。
3. 在 `Battle.scene` 中挂载 `BattleUI`。
4. 绑定技能按钮、肉鸽选择面板、选项按钮和文本。
5. 修复 `BattleUI.onDestroy()` 事件解绑问题。
6. 修复轨道炮无目标时仍消耗次数的问题。
7. 修复 `rogue_electric_bounce` 配置与实际效果不一致的问题。
8. Web 预览验证：
   - 第 1 关可以启动。
   - 45 秒、90 秒、135 秒可以触发最多 3 次肉鸽选择。
   - 3 选 1 选择后立即生效。
   - 主动技能按钮可点击。
   - 轨道炮能造成伤害。
   - 全屏冻结能暂停敌人移动。
9. 验证完成后再更新或保留 `CHANGELOG.md` 中 007 完成记录。
10. 重新提交给 Codex 审查。

## 13. 新会话启动提示词

```txt
你是《星垒计划 / Starfortress Project》的 Codex 协作助手。

请先读取：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. docs/AI_WORKFLOW.md
6. docs/REVIEW_CHECKLIST.md
7. 当前 TASKS 文件

当前仓库位于：
D:\project\starfortress-project

当前分支应为：
feature/007-rogue-choice-and-skills

当前任务：
TASKS/007-rogue-choice-and-skills.md

请先确认 git status 和当前未提交改动。不要依赖聊天记忆，不要自动提交 Git。

当前重点：
007 仍在进行中，之前审查未通过。请只围绕 007 修复，不要实现 008 或后续任务。
```

## 14. 执行 Agent 提示词模板

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

请先读取：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. docs/handoff/CURRENT_STATE.md
5. 当前任务文件：TASKS/007-rogue-choice-and-skills.md

当前目标：
修复并完成 007-rogue-choice-and-skills。

严格要求：
1. 只修复 007，不要实现 008 或后续任务。
2. 不要接服务器。
3. 不要接支付。
4. 不要真实接入广告刷新。
5. 不要接 TapTap Android APK 原生 SDK。
6. 不要直接调用 wx、tt、tap、TapSDK。
7. 不要破坏 Cocos Creator 工程结构。
8. 不要手写 .scene JSON；场景挂载必须通过 Cocos Creator 编辑器完成。
9. 不要自动提交 Git。

必须处理：
1. 确认新增脚本 .meta 已生成并纳入 Git。
2. 在 Cocos Creator 中把 BattleUI 挂载到 Battle.scene，并绑定技能按钮、肉鸽面板、选项按钮和文本。
3. 修复 BattleUI.onDestroy() 事件解绑失败问题。
4. 修复轨道炮无存活敌人时仍消耗技能次数的问题。
5. 修复 rogue_electric_bounce 配置与实际效果不一致的问题。
6. 完成 Web 预览验证后再更新 CHANGELOG.md。

完成后输出：
1. 修改文件列表
2. 每个文件修改原因
3. Web 预览验证方式
4. 是否影响平台 adapter
5. 是否影响主包体积
6. 是否还有风险
7. 提醒人工执行：
   git status
   git diff --name-status
   git diff --stat
   git diff
   git diff --cached --name-status
```

## 15. Codex 审查提示词模板

```txt
你是《星垒计划 / Starfortress Project》的代码审查员。

请审查执行 Agent 当前产生的改动，不要直接修改代码。

当前任务文件：
TASKS/007-rogue-choice-and-skills.md

请基于当前仓库状态进行审查，不要只依赖粘贴摘要。

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
4. 是否实现了不属于当前任务的内容
5. 是否实现了 008 或后续任务内容
6. 是否修改了当前任务禁止修改的文件
7. 是否破坏 Cocos Creator 项目结构
8. 新增 Cocos 脚本是否有 .meta
9. Battle.scene 是否通过 Cocos Creator 编辑器挂载 BattleUI
10. GameBootstrap 既有 001~006.5 能力是否被破坏
11. 是否直接调用 wx、tt、tap、TapSDK
12. 平台 API 是否只出现在允许目录
13. 是否引入不必要依赖
14. 是否影响主包体积
15. 是否有明显性能风险
16. TypeScript 类型是否清晰
17. 是否符合 MVP 缩范围原则
18. 是否更新 CHANGELOG.md
19. 是否需要更新 PROJECT_MEMORY.md
20. 是否可以进入提交

请输出：
1. 审查结论：通过 / 不通过
2. 必须修复项
3. 建议优化项
4. 平台风险
5. 包体风险
6. 性能风险
7. 是否允许提交
8. 建议本次提交应包含哪些文件
9. 建议本次提交不应包含哪些文件
10. 如果不通过，给执行 Agent 的修复提示词
11. 如果通过，请给出下一步 Git 命令
```

