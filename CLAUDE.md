# CLAUDE.md

## 项目身份

你正在参与开发《星垒计划 / Starfortress Project》。

这是一个基于 **Cocos Creator 3.8.x + TypeScript** 开发的高级像素风科幻塔防经营小游戏。

项目目标是使用一套核心代码，优先支持：

1. 微信小游戏
2. 抖音小游戏
3. TapTap 小游戏

第二阶段可选支持：

1. TapTap Android APK
2. Android / iOS 原生包

---

## 项目基础信息

* 中文名：星垒计划
* 英文名：Starfortress Project
* 仓库名：starfortress-project
* 项目代号：SFP
* 技术栈：Cocos Creator 3.8.x + TypeScript
* 屏幕方向：竖屏
* 美术风格：高级精细像素风 + 轻 UI 质感
* 游戏类型：科幻塔防 + 放置 + 经营 + 转生
* 第一阶段目标：先落地、能玩、好玩优先，再考虑上线，最后考虑商业化

---

## AI 分工

### Codex

Codex 负责：

1. 产品规划
2. 技术架构
3. 任务拆分
4. 验收标准
5. 代码审查
6. 风险识别
7. 生成 执行Agent 执行提示词

Codex 不负责直接大规模改业务代码。

### 执行Agent

执行Agent 负责：

1. 按当前 TASKS 文件执行
2. 修改代码
3. 修改必要文档
4. 按验收标准自查
5. 输出测试方式
6. 等待 Codex 审查

执行Agent 不允许擅自扩展需求。

### 用户

用户负责：

1. 确认玩法方向
2. 确认任务是否继续
3. 运行项目
4. 真机测试
5. 决定是否提交 Git
6. 决定是否进入下一阶段

---

## 新会话初始化要求

每次新会话首次进入项目，必须先阅读以下文件：

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

初始化后必须输出：

1. 项目用途
2. 技术栈
3. 当前任务目标
4. 已确认玩法
5. MVP 范围
6. 本次允许修改的文件
7. 本次禁止修改的文件
8. 可能风险

---

## 核心玩法约束

《星垒计划》的核心循环是：

```txt
塔防战斗
→ 获得战斗金币
→ 升级塔防 / 基地 / 建筑
→ 基地经营和放置系统产出经营币
→ 经营币反哺塔防成长
→ 达成条件后星核重构
→ 获得星核碎片
→ 解锁永久技能和长期成长
```

---

## MVP 范围

MVP 只做以下内容：

### 战斗系统

1. 1 张地图
2. 10 个关卡
3. 每关 3 分钟
4. 自动战斗
5. 局内肉鸽选择
6. 主动技能
7. 战斗结算

### MVP 塔

1. 机枪塔
2. 炮塔
3. 冰塔
4. 电塔

### 后续塔，MVP 暂不实现

1. 火焰塔
2. 召唤塔
3. 激光塔

### MVP 建筑

1. 基地核心
2. 研究所
3. 矿场
4. 能源反应堆
5. 工厂

### 后续建筑，MVP 暂不实现

1. 居民区
2. 商店
3. 仓库
4. 指挥中心
5. 防御学院

### MVP 资源

1. 战斗金币
2. 经营币
3. 星核碎片

### MVP 转生系统

转生系统名称：星核重构。

转生代币名称：星核碎片。

MVP 先做：

1. 转生条件
2. 星核碎片计算
3. 转生确认
4. 普通资源重置
5. 永久技能保留
6. 5 个永久技能

---

## 平台硬约束

第一阶段目标平台：

1. Web 预览
2. 微信小游戏
3. 抖音小游戏
4. TapTap 小游戏

必须遵守：

1. 一套核心代码，多平台构建
2. 主包目标小于 4MB
3. 资源必须支持分包和远程资源
4. 平台能力必须通过 platform adapter
5. 业务代码禁止直接调用 wx、tt、tap、TapSDK
6. 平台 API 只能出现在 platform 目录
7. 平台功能不可用时必须降级，不允许崩溃
8. 第一阶段不接服务器
9. 第一阶段不接支付
10. 第一阶段不做 TapTap Android APK 原生 SDK

---

## 平台适配层规范

平台能力必须统一走：

```ts
Platform.instance
```

必须包含：

```txt
assets/scripts/platform/
├─ IPlatform.ts
├─ Platform.ts
├─ WebMockPlatform.ts
├─ WechatPlatform.ts
├─ DouyinPlatform.ts
└─ TapTapMiniPlatform.ts
```

平台接口至少包含：

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

禁止在业务代码中出现：

```ts
wx.
tt.
tap.
TapSDK
```

例外：只有 `assets/scripts/platform/` 目录允许出现平台 API。

---

## 代码开发原则

1. 先分析，后修改
2. 小步执行
3. 单次任务只做一个明确目标
4. 不允许越权修改
5. 不允许顺手重构无关代码
6. 不允许删除已有功能
7. 不允许把数值硬编码到业务逻辑
8. 配置优先，逻辑解耦
9. Cocos 组件职责要清晰
10. TypeScript 类型要明确
11. 不写无法解释的魔法数字
12. 不引入不必要依赖
13. 不提前实现第二阶段功能

---

## 文件修改规则

执行任务前，必须从当前 TASKS 文件中确认：

1. 允许修改范围
2. 禁止修改范围
3. 涉及文件
4. 验收标准
5. 回滚方式

如果当前任务没有明确允许修改某文件，不要修改。

如果确实必须修改，应先说明原因，并把假设记录到当前 TASKS 文件的“实现假设”中。

---

## 文档同步规则

任何功能性修改完成后，必须检查是否需要更新：

1. CHANGELOG.md
2. PROJECT_MEMORY.md
3. 当前 TASKS 文件
4. docs/TECH_DESIGN.md
5. docs/PLATFORM.md
6. docs/PUBLISH_MATRIX.md

如果没有更新，必须说明原因。

---

## Git 规则

AI 不要自动提交。

修改完成后，只提示用户执行：

```bash
git status
git diff
```

等待用户确认后，再由用户决定是否提交。

建议提交格式：

```bash
git add .
git commit -m "feat: xxx"
```

常用提交类型：

```txt
feat: 新功能
fix: 修复
docs: 文档
refactor: 重构
test: 测试
chore: 工程配置
```

---

## 执行Agent 执行前输出格式

执行Agent 在动手前必须输出：

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

确认任务边界后再开始修改。

---

## 执行Agent 执行后输出格式

执行Agent 完成后必须输出：

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

请用户执行：
git status
git diff
```

---

## Codex 审查规则

Codex 审查 执行Agent 的 git diff 时，必须检查：

1. 是否符合当前 TASKS 任务
2. 是否越权修改
3. 是否破坏 Cocos Creator 项目结构
4. 是否直接调用 wx、tt、tap、TapSDK
5. 是否所有平台能力都经过 platform adapter
6. 是否影响微信小游戏构建
7. 是否影响抖音小游戏构建
8. 是否影响 TapTap 小游戏转换构建
9. 是否引入过早复杂度
10. 是否影响主包体积
11. 是否有重复代码
12. 是否有性能风险
13. 是否更新 CHANGELOG.md
14. 是否更新 PROJECT_MEMORY.md
15. 是否符合 MVP 缩范围原则

审查输出格式：

```txt
审查结论：通过 / 不通过

必须修复：
- ...

建议优化：
- ...

平台风险：
- ...

包体风险：
- ...

给 执行Agent 的修复提示词：
- ...
```

---

## 禁止事项

严禁：

1. 没读文档直接改代码
2. 没有 TASKS 文件直接开发
3. 一次性实现多个大系统
4. 在业务代码直接调用平台 API
5. 擅自接服务器
6. 擅自接支付
7. 擅自加入复杂商业化
8. 擅自引入大型第三方库
9. 擅自做 TapTap Android APK 原生功能
10. 擅自改游戏方向
11. 擅自改美术风格
12. 擅自扩大 MVP 范围
13. 自动提交 Git

---

## 当前阶段原则

当前阶段不是追求完整商业游戏，而是验证核心闭环。

优先顺序：

```txt
能跑起来
→ 能打一局
→ 能结算资源
→ 能升级
→ 能产生放置收益
→ 能转生
→ 再考虑平台构建
→ 再考虑广告和分享
```
