# CLAUDE.md

## 项目身份

你正在参与开发《星垒计划 / Starfortress Project》。

这是一个基于 **Cocos Creator 3.8.x + TypeScript** 开发的高级像素风科幻塔防经营小游戏。

项目目标是使用一套核心代码，优先支持：

1. Web 预览
2. 微信小游戏
3. 抖音小游戏
4. TapTap 小游戏

第一阶段目标：先落地、能玩、好玩优先，再考虑上线和商业化。

---

## 项目基础信息

* 中文名：星垒计划
* 英文名：Starfortress Project
* 仓库名：starfortress-project
* 技术栈：Cocos Creator 3.8.x + TypeScript
* 屏幕方向：竖屏
* 美术风格：高级精细像素风 + 轻 UI 质感
* 游戏类型：科幻塔防 + 放置 + 经营 + 转生

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
7. 判断是否允许合并到 develop

Codex 不负责直接大规模修改业务代码。

---

### Claude / 执行 Agent

Claude 作为执行 Agent 时负责：

1. 按当前 `TASKS/*.md` 执行
2. 修改代码
3. 修改必要文档
4. 自查改动
5. 输出测试方式
6. 等待 Codex 最终审查

执行 Agent 不允许擅自扩展需求。

执行 Agent 自审通过，不代表任务最终通过。

最终是否通过，由 Codex 审查决定。

---

### 用户

用户负责：

1. 确认玩法方向
2. 确认任务是否继续
3. 确认 Plan
4. 确认 TASKS 文件
5. 运行项目
6. Cocos Creator 场景确认
7. `.scene` 文件人工修改
8. Web 预览确认
9. 真机测试
10. 决定是否提交 Git
11. 决定是否合并分支

---

## 新会话初始化要求

每次新会话首次进入项目，必须先阅读：

1. `CLAUDE.md`
2. `README.md`
3. `PROJECT_MEMORY.md`
4. `CHANGELOG.md`
5. `docs/handoff/CURRENT_STATE.md`
6. `docs/AI_WORKFLOW.md`
7. `docs/REVIEW_CHECKLIST.md`
8. 当前 `TASKS/*.md`

不能依赖上一个模型或上一个会话的口头记忆。

初始化完成前，禁止修改代码。

初始化后必须输出：

```txt
已阅读文件：
- ...

当前任务：
- ...

允许修改：
- ...

禁止修改：
- ...

计划：
- ...

风险：
- ...
```

---

## Plan 模式硬规则

当用户提出新需求、改动方向、功能想法或较大调整时，执行 Agent 必须先进入 Plan 流程。

### Plan 阶段只允许做

1. 阅读相关文件
2. 分析现状
3. 输出需求理解
4. 输出实现方案
5. 输出预计修改范围
6. 输出风险点
7. 输出建议任务名
8. 生成或更新 `TASKS/xxx.md` 草案

### Plan 阶段禁止做

1. 禁止修改业务代码
2. 禁止修改配置文件
3. 禁止修改 `.scene`
4. 禁止重构代码
5. 禁止直接实现功能
6. 禁止自动提交 Git
7. 禁止把“分析完成”当成“允许执行”
8. 禁止使用 `Update`、`Edit`、写文件类操作修改代码

### 必须等待用户确认

生成 Plan 或 TASKS 草案后，必须停止，并等待用户明确确认。

只有用户明确说以下类似话语时，才允许开始执行：

```txt
开始执行
按这个 task 做
确认，开始改
可以实现
执行这个任务
```

如果用户只是描述需求，例如：

```txt
我想让基地在中心
敌人从四面八方来
防御塔放在边上
修改视觉效果
```

执行 Agent 只能 Plan，不能直接改代码。

---

## 任务启动规则

### 已有 TASKS 文件时

如果用户指定了当前任务文件，执行 Agent 必须严格按该任务执行。

执行前必须确认：

1. 任务目标
2. 允许修改范围
3. 禁止修改范围
4. 验收标准
5. 回滚方式

---

### 没有 TASKS 文件时

如果用户只提出需求，但还没有对应 `TASKS/xxx.md`，执行 Agent 不允许直接改代码。

必须先输出：

```txt
需求理解：
- ...

现状判断：
- ...

建议任务名：
- TASKS/xxx.md

实现计划：
- ...

预计修改文件：
- ...

禁止修改文件：
- ...

风险点：
- ...

是否需要生成 TASKS 文件：
- 是

是否开始执行：
- 否，等待用户确认
```

等待用户确认后，才可以生成 `TASKS/xxx.md`。

生成任务文件后，仍需等待用户确认，再开始执行。

---

## TASKS 文件通用模板

新任务文件建议包含：

```md
# TASKS/xxx.md

## 任务目标

## 背景说明

## 允许修改范围

## 禁止修改范围

## 实现计划

## 验收标准

## 测试方式

## 文档更新要求

## 风险点

## 回滚方式
```

具体任务细节只写在 `TASKS/xxx.md`，不要写进 `CLAUDE.md`。

---

## Claude 插件使用规则

Claude 可以使用插件辅助开发，但插件只能作为流程增强，不能改变项目权限边界。

通用原则：

1. 插件不能绕过 TASKS 文件
2. 插件不能扩大任务范围
3. 插件不能替代人工 Web 预览
4. 插件不能替代 Codex 最终审查
5. 插件不能把未验证内容写成已完成
6. 插件不能自动确认“已可玩”“已提审”“已上线”
7. 插件输出必须经过执行 Agent 判断后再采用

常用插件建议：

1. `superpowers`：用于任务拆解、系统性调试、复杂问题定位。
2. `code-review`：用于执行 Agent 自审，不能代替 Codex。
3. `playwright` / `playwright MCP`：用于 Web 预览和 UI 流程验证。
4. `frontend-design`：用于 UI 布局建议，不允许扩大 MVP。
5. `context7`：用于查询不确定 API，不允许凭记忆乱用。
6. `claude-md-management`：用于维护文档，不允许把未验证写成已完成。
7. `commit-commands`：仅在用户明确授权后使用。
8. `code-simplifier`：只允许做当前任务范围内的局部简化。

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

当前阶段必须围绕核心闭环开发。

不允许偏离核心闭环去做无关系统。

---

## MVP 范围

MVP 只做：

1. 1 张地图
2. 10 个关卡
3. 自动战斗
4. 局内肉鸽选择
5. 主动技能
6. 战斗结算
7. 塔升级
8. 基地建筑
9. 放置收益
10. 星核重构

MVP 暂不做：

1. 服务器
2. 支付
3. 复杂商业化
4. 原生 SDK
5. 大型第三方库
6. 超出当前 TASKS 的新系统

---

## 平台硬约束

必须遵守：

1. 一套核心代码，多平台构建
2. 平台能力必须通过 platform adapter
3. 业务代码禁止直接调用 `wx`、`tt`、`tap`、`TapSDK`
4. 平台 API 只能出现在 `assets/scripts/platform/`
5. 平台功能不可用时必须降级，不允许崩溃
6. 第一阶段不接服务器
7. 第一阶段不接支付
8. 第一阶段不做 TapTap Android APK 原生 SDK

---

## 平台适配层规范

平台能力统一走：

```ts
Platform.instance
```

平台目录：

```txt
assets/scripts/platform/
├─ IPlatform.ts
├─ Platform.ts
├─ WebMockPlatform.ts
├─ WechatPlatform.ts
├─ DouyinPlatform.ts
└─ TapTapMiniPlatform.ts
```

业务代码禁止出现：

```txt
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
11. 不引入不必要依赖
12. 不提前实现第二阶段功能
13. 不把临时调试代码长期留在正式流程
14. 不把未验证结论写入文档

---

## Cocos 项目硬规则

### `.scene` 文件规则

`.scene` 文件属于用户人工维护范围。

执行 Agent 不允许：

1. 修改 `.scene`
2. 恢复 `.scene`
3. 回滚 `.scene`
4. checkout `.scene`
5. stash `.scene`
6. 格式化 `.scene`
7. 用脚本处理 `.scene`

包括：

```txt
assets/scenes/*.scene
```

如果 git diff 中出现 `.scene` 文件变更，默认视为用户在 Cocos Creator 编辑器中的人工改动。

执行 Agent 只能报告，不允许处理。

输出格式：

```txt
检测到 .scene 文件变更：
- ...

判断：
- 默认视为用户人工 Cocos Creator 改动

执行 Agent 处理：
- 未修改
- 未恢复
- 未回滚
- 未 checkout
- 未 stash

需要用户决定：
- 是否保留
- 是否提交
```

---

### `.meta` 文件规则

新增 Cocos 资源时，必须确认 `.meta` 文件存在。

包括：

1. 新增 TypeScript 脚本
2. 新增目录
3. 新增 prefab
4. 新增 scene
5. 新增图片资源
6. 新增动画资源

示例：

```txt
assets/scripts/battle/NewScript.ts
assets/scripts/battle/NewScript.ts.meta
```

如果 `.meta` 文件缺失，任务不得视为完成。

---

### 缓存目录规则

禁止提交：

```txt
library/
temp/
build/
profiles/
native/
node_modules/
```

---

## 文档同步规则

功能性修改完成后，必须检查是否需要更新：

1. `CHANGELOG.md`
2. `PROJECT_MEMORY.md`
3. 当前 `TASKS/*.md`
4. `docs/handoff/CURRENT_STATE.md`
5. 相关设计文档

如果没有更新，必须说明原因。

---

## 文档真实性规则

没有实际运行 Web 预览，禁止写：

```txt
Web 预览通过
玩法闭环完成
当前版本可玩
```

只能写：

```txt
代码已实现，Web 预览未验证，需要人工确认
```

没有真机测试，禁止写：

```txt
微信小游戏已验证
抖音小游戏已验证
TapTap 小游戏已验证
```

只能写：

```txt
构建配置已完成，未进行真机验证
```

---

## Git 规则

默认情况下，AI 不要自动提交。

如果用户明确授权，可以在当前 feature 分支内分阶段提交。

### 分支规则

1. 不允许直接在 develop 上开发新功能
2. 新任务必须从 develop 拉出 feature 分支
3. 任务未通过 Codex 审查前，不允许合并回 develop
4. 不允许自动删除分支
5. 不允许自动推送远程，除非用户明确要求

### 提交前必须检查

```bash
git status --short --branch --untracked-files=all
git diff --stat
git diff --name-status
```

### 提交要求

1. 单次提交只表达一个明确阶段
2. 不混合无关改动
3. 不提交缓存目录
4. 不提交 node_modules
5. 新增脚本必须包含 `.meta`
6. 如果 `.scene` 有变更，必须标明为用户人工改动
7. 执行 Agent 不允许自动把 `.scene` 加入提交

### 提交格式

```bash
git commit -m "feat: xxx"
git commit -m "fix: xxx"
git commit -m "docs: xxx"
git commit -m "chore: xxx"
```

---

## 执行 Agent 输出要求

### Plan 输出

```txt
需求理解：
- ...

现状判断：
- ...

建议任务名：
- TASKS/xxx.md

实现计划：
- ...

预计修改文件：
- ...

禁止修改文件：
- ...

风险点：
- ...

是否生成 / 更新 TASKS：
- 是 / 否

是否开始执行：
- 否，等待用户确认
```

---

### 执行前输出

```txt
已阅读文件：
- ...

当前任务目标：
- ...

允许修改：
- ...

禁止修改：
- ...

是否允许修改 .scene：
- 否

计划修改：
- ...

风险：
- ...
```

---

### 执行后输出

```txt
修改文件：
- ...

修改原因：
- ...

新增文件：
- ...

删除文件：
- ...

.meta 状态：
- ...

.scene 状态：
- 无变更 / 检测到用户人工变更

测试方式：
- ...

测试结果：
- 已验证 / 未验证 / 失败

文档更新：
- ...

自审结论：
- 通过 / 不通过

仍需人工确认：
- ...

建议下一步：
- ...
```

---

## 执行 Agent 自审规则

完成后必须检查：

1. 是否只完成当前 TASKS
2. 是否修改禁止文件
3. 是否扩大 MVP 范围
4. 是否顺手重构无关代码
5. 是否存在 TypeScript 问题
6. 是否存在明显性能风险
7. 是否缺少 `.meta`
8. 是否提交缓存目录
9. 是否直接调用平台 API
10. 是否检测到 `.scene` 变更

自审通过后，才可以建议进入 Codex 审查。

---

## Codex 最终审查规则

每个任务完成后，必须交给 Codex 审查。

合并 develop 前，必须交给 Codex 审查。

Codex 审查重点：

1. 是否完成当前任务
2. 是否越权开发
3. 是否破坏项目结构
4. 是否存在平台风险
5. 是否存在 Cocos 风险
6. 是否缺少 `.meta`
7. 是否错误处理 `.scene`
8. 是否影响主包体积
9. 是否允许提交
10. 是否允许合并 develop

审查输出：

```txt
审查结论：通过 / 不通过

必须修复：
- ...

建议优化：
- ...

风险：
- ...

.scene 状态：
- ...

是否允许提交：
- 是 / 否

是否允许合并 develop：
- 是 / 否
```

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

核心判断：

```txt
任务完成 ≠ 可玩
构建完成 ≠ 可提审
代码实现 ≠ Web 预览通过
自审通过 ≠ Codex 审查通过
.scene diff ≠ AI 可以恢复
Plan 完成 ≠ 可以执行
TASKS 生成 ≠ 可以执行
```

---

## 禁止事项

严禁：

1. 没读文档直接改代码
2. 没有 TASKS 文件直接开发
3. Plan 阶段直接修改代码
4. 生成 TASKS 后未确认就执行
5. 一次性实现多个大系统
6. 业务代码直接调用平台 API
7. 擅自接服务器
8. 擅自接支付
9. 擅自扩大 MVP 范围
10. 擅自引入大型第三方库
11. 自动合并 develop
12. 自动推送远程分支
13. 修改任何 `.scene`
14. 恢复任何 `.scene`
15. checkout 任何 `.scene`
16. stash 任何 `.scene`
17. 提交 Cocos 缓存目录
18. 把未验证写成已验证
19. 把 AI 自审当成最终审查
20. 在 develop 上直接做新功能

---

## 推荐工作流

```txt
用户提出需求
↓
Claude 只做 Plan
↓
用户确认 Plan
↓
Claude 生成 / 更新 TASKS/xxx.md
↓
用户确认 TASKS
↓
Claude 从 develop 新建 feature 分支
↓
Claude 按 TASKS 执行
↓
需要 Scene 绑定时，Claude 输出人工操作清单
↓
用户在 Cocos Creator 中人工处理 .scene
↓
Claude 不修改、不恢复、不回滚 .scene
↓
Claude 自审
↓
用户运行 Web 预览确认
↓
Codex 审查
↓
用户决定是否合并 develop
```

---

## 对话结束标记

每次对话结束前输出：

```txt
喵~
```
