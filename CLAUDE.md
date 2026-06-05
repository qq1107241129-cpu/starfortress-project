# CLAUDE.md

## 项目身份

你正在参与《星垒计划 / Starfortress Project》。这是一个基于 Cocos Creator 3.8.x + TypeScript 的竖屏科幻塔防经营小游戏。

核心定位：披着塔防皮的模拟经营小游戏。

游戏类型：科幻塔防 + 放置 + 经营 + 轻度肉鸽 + 转生养成小游戏。

## 项目基础信息

- 游戏名：星垒计划
- 英文名：Starfortress Project
- 仓库名：starfortress-project
- 技术栈：Cocos Creator 3.8.x + TypeScript
- 目标平台：微信小游戏、抖音小游戏、TapTap 小游戏
- 第二阶段可选：TapTap Android APK
- 屏幕方向：竖屏
- 美术风格：高级精细像素风 + 轻 UI 质感

## AI 分工

- Codex：规划 + 审查。负责产品规划、技术架构、任务拆分、验收标准、风险识别和 diff 审查。
- 执行 Agent：执行代码和文档修改。可使用 DeepSeek、MiMo 或其他代码模型，但角色固定为执行工程师。
- 人工：拍板、运行、测试、提交 Git。人工负责方向确认、运行项目、真机测试、构建验证和是否提交。

不要把任何具体模型写成唯一执行者。模型可以切换，但职责不变。

## 新会话初始化要求

每次新会话或切换执行模型后，必须重新阅读：

1. `CLAUDE.md`
2. `README.md`
3. `PROJECT_MEMORY.md`
4. `CHANGELOG.md`
5. `docs/PRD.md`
6. `docs/GAME_DESIGN.md`
7. `docs/TECH_DESIGN.md`
8. `docs/PLATFORM.md`
9. `docs/PUBLISH_MATRIX.md`
10. `docs/ART_GUIDE.md`
11. `docs/AI_ASSET_PROMPTS.md`
12. `docs/REVIEW_CHECKLIST.md`
13. `docs/COMPLIANCE.md`
14. `docs/AI_WORKFLOW.md`
15. 当前 `TASKS/*.md`

不能依赖上一个模型或上一个会话的口头记忆。

初始化完成前，禁止修改代码。

## MVP 范围

### 必须做

- 1 张战斗地图
- 10 个关卡
- 每关 3 分钟
- 自动战斗
- 4 种塔：机枪塔、炮塔、冰塔、电塔
- 5 种敌人：普通机械虫、快速突击虫、重甲机械兵、分裂无人机、小 Boss
- 2 个主动技能：轨道炮、全屏冻结
- 每局 3 次 3 选 1 肉鸽选择
- 5 个建筑：基地核心、研究所、矿场、能源反应堆、工厂
- 在线收益、离线收益、离线收益上限
- 星核重构、星核碎片、5 个永久技能
- Web、微信、抖音、TapTap 小游戏构建方向验证

### 暂不做

- 联网、服务器、支付
- PVP、好友排行榜、公会
- 复杂商城、复杂剧情、皮肤系统
- 多地图主题、多角色系统
- 超过 10 关、超过 4 种 MVP 塔、超过 5 种 MVP 敌人
- TapTap Android APK 原生 SDK

## 平台硬约束

1. 使用 Cocos Creator 3.8.x + TypeScript。
2. 一套核心代码支持微信小游戏、抖音小游戏、TapTap 小游戏。
3. 主包目标小于 4MB。
4. 资源必须支持分包和远程资源。
5. 平台能力必须通过 platform adapter。
6. 业务代码禁止直接调用 `wx`、`tt`、`tap`、`TapSDK`。
7. 平台 API 只能出现在 `assets/scripts/platform/`。
8. 必须包含 `WebMockPlatform`、`WechatPlatform`、`DouyinPlatform`、`TapTapMiniPlatform`。
9. TapTap Android APK 只做第二阶段规划，不进入 MVP 实现。
10. 第一阶段不接服务器、不接支付、不做复杂商业化。

## 平台适配层规范

业务侧只能通过：

```ts
Platform.instance
```

适配层目录：

```txt
assets/scripts/platform/
├─ IPlatform.ts
├─ Platform.ts
├─ WebMockPlatform.ts
├─ WechatPlatform.ts
├─ DouyinPlatform.ts
└─ TapTapMiniPlatform.ts
```

接口至少包含：

```ts
login()
share()
showRewardAd()
vibrateShort()
getSystemInfo()
getStorage()
setStorage()
removeStorage()
```

## 代码开发原则

1. 先读文档，再改文件。
2. 只执行当前任务。
3. 不越权修改。
4. 不顺手重构无关代码。
5. 不删除已有功能。
6. 数值配置驱动，避免散落硬编码。
7. Cocos 组件职责清晰。
8. TypeScript 类型明确。
9. 平台失败要降级。
10. 不引入不必要依赖。
11. 不提前实现第二阶段功能。

## 文件修改规则

执行前必须从当前 `TASKS/*.md` 确认：

- 涉及文件
- 允许修改范围
- 禁止修改范围
- 实现步骤
- 验收标准
- 测试方式
- 回滚方式

如果必须修改未授权文件，先说明原因，并记录到当前任务的“实现假设”或任务备注中。

## 文档同步规则

功能性修改后必须检查：

- `CHANGELOG.md`
- `PROJECT_MEMORY.md`
- 当前任务文件
- `docs/TECH_DESIGN.md`
- `docs/PLATFORM.md`
- `docs/PUBLISH_MATRIX.md`

如果没有更新，必须说明原因。

## Git 规则

AI 不要自动提交。完成后只提示人工执行：

```bash
git status
git diff
```

由人工决定是否提交。

## 执行 Agent 执行前输出格式

```txt
已阅读文件：
- ...

当前任务目标：
- ...

计划修改文件：
- ...

不会修改文件：
- ...

可能风险：
- ...
```

## 执行 Agent 执行后输出格式

```txt
修改文件列表：
- ...

每个文件修改原因：
- ...

Web 预览测试方式：
- ...

微信小游戏影响验证：
- ...

抖音小游戏影响验证：
- ...

TapTap 小游戏影响验证：
- ...

主包体积影响：
- ...

CHANGELOG.md 是否更新：
- 是 / 否，原因

PROJECT_MEMORY.md 是否更新：
- 是 / 否，原因

下一步建议：
- ...

请人工执行：
git status
git diff
```

## Codex 审查规则

Codex 审查执行 Agent 的 diff 时必须检查：

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
14. 是否符合 MVP 缩范围原则。

## 禁止事项

- 没读文档直接改代码。
- 没有任务文件直接开发。
- 一次性实现多个大系统。
- 在业务代码直接调用平台 API。
- 擅自接服务器、支付、复杂商业化。
- 擅自引入大型第三方库。
- 擅自做 TapTap Android APK 原生功能。
- 擅自复刻已有游戏角色、UI、塔、敌人或素材。
- 擅自扩大 MVP 范围。
- 自动提交 Git。

## 当前阶段原则

```txt
能跑起来
-> 能打一局
-> 能结算资源
-> 能升级
-> 能产生放置收益
-> 能星核重构
-> 再考虑平台构建
-> 再考虑广告和分享
```
