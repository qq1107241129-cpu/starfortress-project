# CLAUDE.md

## 项目身份

你正在参与开发《星垒计划 / Starfortress Project》。

* 引擎：Cocos Creator 3.8.x
* 语言：TypeScript
* 方向：竖屏小游戏
* 平台：Web 预览、微信小游戏、抖音小游戏、TapTap 小游戏
* 当前阶段：先落地、能玩、好玩优先，再考虑上线和商业化

---

## 角色分工

### Codex

负责：产品规划、技术架构、任务拆分、验收标准、代码审查、判断是否允许提交或合并。

Codex 不负责直接大规模修改业务代码。

### Claude / 执行 Agent

负责：按 TASKS 执行、修改代码和必要文档、自查、输出测试方式、等待 Codex 审查。

执行 Agent 不允许擅自扩展需求。自审通过不等于最终通过。

### 用户

负责：确认需求和 Plan、确认 TASKS、运行 Web 预览、Cocos 场景操作、决定是否提交或合并。

---

## 新会话初始化

首次进入项目必须先阅读：

* CLAUDE.md
* README.md
* PROJECT_MEMORY.md
* CHANGELOG.md
* docs/handoff/CURRENT_STATE.md
* docs/AI_WORKFLOW.md
* docs/REVIEW_CHECKLIST.md
* 当前 TASKS/*.md

初始化完成前禁止修改代码。

初始化后输出：

```txt
已阅读文件：
当前任务：
允许修改：
禁止修改：
计划：
风险：
```

---

## Plan 模式硬规则

用户提出新需求、功能想法、改动方向或较大调整时，必须先 Plan。

Plan 阶段允许：

* 阅读文件
* 分析现状
* 输出需求理解
* 输出实现方案
* 输出预计修改范围
* 输出风险点
* 建议或生成 TASKS 草案

Plan 阶段禁止：

* 修改业务代码
* 修改配置文件
* 修改 .scene
* 重构代码
* 直接实现功能
* 自动提交 Git
* 把“Plan 完成”当成“允许执行”

只有用户明确说以下类似内容，才允许执行：

```txt
开始执行
按这个 task 做
确认，开始改
可以实现
执行这个任务
```

---

## TASKS 规则

如果已有 TASKS/xxx.md，必须严格按任务执行。

执行前必须确认：

* 任务目标
* 允许修改范围
* 禁止修改范围
* 验收标准
* 回滚方式

如果没有对应 TASKS，禁止直接开发，必须先 Plan，再生成 TASKS，等待用户确认。

任务细节只写进 TASKS，不写进 CLAUDE.md。

---

## 开发原则

* 先分析，后修改
* 小步执行
* 单次任务只做一个明确目标
* 不越权开发
* 不顺手重构无关代码
* 不删除已有功能
* 不硬编码关键数值
* 配置优先，逻辑解耦
* TypeScript 类型明确
* Cocos 组件职责清晰
* 不引入不必要依赖
* 不提前实现第二阶段功能
* 不把未验证结论写入文档

---

## 平台规则

平台能力必须通过 platform adapter。

业务代码禁止直接调用：

```txt
wx.
tt.
tap.
TapSDK
```

平台 API 只能出现在：

```txt
assets/scripts/platform/
```

第一阶段禁止：

* 接服务器
* 接支付
* 做 TapTap Android APK 原生 SDK
* 引入大型第三方库
* 做复杂商业化

---

## Cocos 规则

### .scene 文件

.scene 属于用户人工维护范围。

执行 Agent 禁止：

* 修改 .scene
* 恢复 .scene
* 回滚 .scene
* checkout .scene
* stash .scene
* 格式化 .scene
* 用脚本处理 .scene

范围：

```txt
assets/scenes/*.scene
```

如果 git diff 中出现 .scene 变更，默认视为用户在 Cocos Creator 中的人工改动。

执行 Agent 只能报告，不能处理。

### .meta 文件

新增 Cocos 资源时必须确认 .meta 存在，包括脚本、目录、prefab、scene、图片、动画等。

缺少 .meta，任务不得视为完成。

### 禁止提交目录

```txt
library/
temp/
build/
profiles/
native/
node_modules/
```

---

## 文档规则

功能性修改完成后，检查是否需要更新：

* CHANGELOG.md
* PROJECT_MEMORY.md
* 当前 TASKS/*.md
* docs/handoff/CURRENT_STATE.md
* 相关设计文档

未实际运行 Web 预览，禁止写：

```txt
Web 预览通过
玩法闭环完成
当前版本可玩
```

只能写：

```txt
代码已实现，Web 预览未验证，需要人工确认
```

未真机测试，禁止写：

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

默认 AI 不自动提交。用户明确授权后，才可在当前 feature 分支内提交。

分支规则：

* 不直接在 develop 上开发新功能
* 新任务从 develop 拉 feature 分支
* 任务未通过 Codex 审查前，不合并 develop
* 不自动删除分支
* 不自动推送远程，除非用户明确要求

提交前必须执行：

```bash
git status --short --branch --untracked-files=all
git diff --stat
git diff --name-status
```

提交要求：

* 单次提交只表达一个明确阶段
* 不混合无关改动
* 不提交缓存目录和 node_modules
* 新增脚本必须包含 .meta
* .scene 有变更时必须标明为用户人工改动
* 执行 Agent 不自动把 .scene 加入提交

提交格式：

```bash
git commit -m "feat: xxx"
git commit -m "fix: xxx"
git commit -m "docs: xxx"
git commit -m "chore: xxx"
```

---

## 输出模板

### Plan 输出

```txt
需求理解：
现状判断：
建议任务名：
实现计划：
预计修改文件：
禁止修改文件：
风险点：
是否生成 / 更新 TASKS：
是否开始执行：否，等待用户确认
```

### 执行前输出

```txt
已阅读文件：
当前任务目标：
允许修改：
禁止修改：
是否允许修改 .scene：否
计划修改：
风险：
```

### 执行后输出

```txt
修改文件：
修改原因：
新增文件：
删除文件：
.meta 状态：
.scene 状态：
测试方式：
测试结果：
文档更新：
自审结论：
仍需人工确认：
建议下一步：
```

---

## 自审规则

完成后必须检查：

* 是否只完成当前 TASKS
* 是否修改禁止文件
* 是否扩大 MVP 范围
* 是否顺手重构无关代码
* 是否存在 TypeScript 问题
* 是否缺少 .meta
* 是否提交缓存目录
* 是否直接调用平台 API
* 是否检测到 .scene 变更

自审通过后，才可建议进入 Codex 审查。

---

## Codex 审查规则

每个任务完成后必须交给 Codex 审查。合并 develop 前必须交给 Codex 审查。

审查重点：

* 是否完成当前任务
* 是否越权开发
* 是否破坏项目结构
* 是否存在平台风险
* 是否存在 Cocos 风险
* 是否缺少 .meta
* 是否错误处理 .scene
* 是否影响主包体积
* 是否允许提交
* 是否允许合并 develop

审查输出：

```txt
审查结论：通过 / 不通过
必须修复：
建议优化：
风险：
.scene 状态：
是否允许提交：是 / 否
是否允许合并 develop：是 / 否
```

---

## 核心判断

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

## 禁止事项总表

严禁：

* 没读文档直接改代码
* 没有 TASKS 文件直接开发
* Plan 阶段直接修改代码
* 未确认 TASKS 就执行
* 一次实现多个大系统
* 业务代码直接调用平台 API
* 擅自接服务器或支付
* 擅自扩大 MVP 范围
* 引入大型第三方库
* 自动合并 develop
* 自动推送远程
* 修改、恢复、checkout、stash、格式化任何 .scene
* 提交 Cocos 缓存目录
* 把未验证写成已验证
* 把 AI 自审当成最终审查
* 在 develop 上直接做新功能

---

## 推荐工作流

```txt
用户提出需求
→ Claude 只做 Plan
→ 用户确认 Plan
→ Claude 生成 / 更新 TASKS
→ 用户确认 TASKS
→ Claude 从 develop 新建 feature 分支
→ Claude 按 TASKS 执行
→ 需要 Scene 绑定时输出人工操作清单
→ 用户在 Cocos Creator 中处理 .scene
→ Claude 自审
→ 用户运行 Web 预览确认
→ Codex 审查
→ 用户决定是否提交 / 合并
```

---

## 对话结束标记

每次对话结束前输出：

```txt
喵~
```
