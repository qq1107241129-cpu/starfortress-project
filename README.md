# Starfortress Project / 星垒计划

《星垒计划》是一款科幻塔防 + 放置 + 经营 + 轻度肉鸽 + 转生养成小游戏。玩家在异星前线建设基地，通过 3 分钟一局的自动塔防抵御敌潮，获得战斗金币后升级塔防、基地、建筑和放置系统；基地经营与放置收益产出经营币，继续反哺塔防成长；达成条件后进行“星核重构”，获得“星核碎片”，解锁永久技能与长期成长。

核心定位：披着塔防皮的模拟经营小游戏。

## 项目用途

本仓库用于沉淀《星垒计划》的产品设计、技术约束、平台适配规则、素材规范、任务拆分、AI 协作流程与后续代码审查标准。当前阶段只重整启动包与任务文档，不写业务代码。

## 基础信息

- 游戏名：星垒计划
- 英文名：Starfortress Project
- 仓库名：starfortress-project
- 技术栈：Cocos Creator 3.8.x + TypeScript
- 屏幕方向：竖屏
- 目标平台：微信小游戏、抖音小游戏、TapTap 小游戏
- 第二阶段可选：TapTap Android APK
- 美术风格：高级精细像素风 + 轻 UI 质感

## 已确认玩法

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

局内玩法参考“轻度肉鸽成长”的节奏：自动战斗能发挥约 80% 效果，玩家通过局内 3 选 1 强化和主动技能提高上限。只能参考方向，不能复刻任何现有游戏的角色、UI、怪物、塔或具体表现。

## MVP 范围

- 1 张科幻基地外环战斗地图
- 10 个关卡，每关 3 分钟
- 4 种 MVP 塔：机枪塔、炮塔、冰塔、电塔
- 5 种 MVP 敌人：普通机械虫、快速突击虫、重甲机械兵、分裂无人机、小 Boss
- 2 个主动技能：轨道炮、全屏冻结
- 每局 3 次局内肉鸽强化选择
- 5 个 MVP 建筑：基地核心、研究所、矿场、能源反应堆、工厂
- 在线收益、离线收益、离线收益上限、离线结算弹窗
- 星核重构、星核碎片、5 个永久技能
- 主界面、战斗界面、结算界面、建筑升级界面、塔升级界面、转生界面、设置界面
- PlatformAdapter、WebMockPlatform、WechatPlatform、DouyinPlatform、TapTapMiniPlatform

## 平台硬约束

- 一套核心代码支持微信小游戏、抖音小游戏、TapTap 小游戏。
- 主包目标小于 4MB。
- 资源必须支持分包和远程资源。
- 平台能力必须通过 platform adapter。
- 业务代码禁止直接调用 `wx`、`tt`、`tap`、`TapSDK`。
- 平台 API 只能出现在 `assets/scripts/platform/`。
- 第一阶段不接服务器、不接支付、不做复杂商业化。
- TapTap Android APK 只做第二阶段规划，不进入 MVP 实现。

## 协作规则

- Codex：规划 + 审查。
- 执行 Agent：执行代码和文档修改，可使用 DeepSeek、MiMo 或其他代码模型。
- 人工：拍板、运行、测试、提交 Git。

模型可以切换，但角色固定。切换执行模型后，必须重新阅读 `CLAUDE.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md` 和当前 `TASKS/*.md`，不能依赖上一个模型的口头记忆。

## 目录结构

```txt
starfortress-project/
├─ CLAUDE.md
├─ README.md
├─ PROJECT_MEMORY.md
├─ CHANGELOG.md
├─ docs/
│  ├─ PRD.md
│  ├─ GAME_DESIGN.md
│  ├─ TECH_DESIGN.md
│  ├─ PLATFORM.md
│  ├─ PUBLISH_MATRIX.md
│  ├─ ART_GUIDE.md
│  ├─ AI_ASSET_PROMPTS.md
│  ├─ REVIEW_CHECKLIST.md
│  ├─ COMPLIANCE.md
│  └─ AI_WORKFLOW.md
└─ TASKS/
   ├─ 001-project-init.md
   ├─ 002-platform-adapter.md
   ├─ 003-core-data-config.md
   ├─ 004-battle-prototype.md
   ├─ 005-tower-system.md
   ├─ 006-enemy-wave-system.md
   ├─ 007-rogue-choice-and-skills.md
   ├─ 008-base-building-system.md
   ├─ 009-idle-offline-reward.md
   ├─ 010-rebirth-system.md
   ├─ 011-ui-flow.md
   └─ 012-build-wechat-douyin-taptap.md
```

## 第一批任务清单

1. `TASKS/001-project-init.md`：初始化并统一项目启动包文档。
2. `TASKS/002-platform-adapter.md`：建立统一平台适配层。
3. `TASKS/003-core-data-config.md`：建立核心数据配置系统。
4. `TASKS/004-battle-prototype.md`：实现最小塔防战斗原型。
5. `TASKS/005-tower-system.md`：实现 MVP 四种塔。
6. `TASKS/006-enemy-wave-system.md`：实现敌人与波次系统。
7. `TASKS/007-rogue-choice-and-skills.md`：实现局内肉鸽选择与主动技能。
8. `TASKS/008-base-building-system.md`：实现基地经营建筑系统。
9. `TASKS/009-idle-offline-reward.md`：实现在线与离线收益。
10. `TASKS/010-rebirth-system.md`：实现星核重构系统。
11. `TASKS/011-ui-flow.md`：完成 MVP 主流程 UI。
12. `TASKS/012-build-wechat-douyin-taptap.md`：验证三端小游戏构建链路。

## 下一步执行提示词

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

当前任务文件：
TASKS/001-project-init.md

请先阅读：
1. CLAUDE.md
2. README.md
3. PROJECT_MEMORY.md
4. CHANGELOG.md
5. docs/PRD.md
6. docs/GAME_DESIGN.md
7. docs/TECH_DESIGN.md
8. docs/PLATFORM.md
9. docs/PUBLISH_MATRIX.md
10. docs/ART_GUIDE.md
11. docs/AI_ASSET_PROMPTS.md
12. docs/REVIEW_CHECKLIST.md
13. docs/COMPLIANCE.md
14. docs/AI_WORKFLOW.md
15. TASKS/001-project-init.md

严格遵守当前 TASKS 文件的允许修改范围和禁止修改范围。
不要自动提交 Git。完成后提示人工执行：

git status
git diff
```
