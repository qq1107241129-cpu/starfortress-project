# CLAUDE.md

## 项目身份

你正在参与开发《星垒计划 / Starfortress Project》。

项目基于 **Cocos Creator 3.8.x + TypeScript**，目标是一套核心代码优先支持：

1. Web 预览
2. 微信小游戏
3. 抖音小游戏
4. TapTap 小游戏

当前阶段目标：先落地、能玩、好玩优先，再考虑上线和商业化。

---

## AI 分工

### Codex

Codex 负责：

1. 产品规划
2. 技术架构
3. 任务拆分
4. 验收标准
5. 代码审查
6. 判断是否允许合并到 develop

Codex 不负责直接大规模修改业务代码。

### Claude / 执行 Agent

Claude 作为执行 Agent，负责：

1. 按当前 `TASKS/*.md` 执行
2. 修改代码和必要文档
3. 自查改动
4. 输出测试方式
5. 等待 Codex 最终审查

执行 Agent 不允许擅自扩展需求。

执行 Agent 自审通过，不代表任务最终通过。

最终是否通过，由 Codex 审查决定。

### 用户

用户负责：

1. 确认需求和 Plan
2. 确认 TASKS 文件
3. 运行项目和 Web 预览
4. Cocos Creator 场景确认
5. `.scene` 文件人工修改
6. 决定是否提交、合并、进入下一阶段

---

## 新会话初始化

每次新会话首次进入项目，必须先阅读：

1. `CLAUDE.md`
2. `README.md`
3. `PROJECT_MEMORY.md`
4. `CHANGELOG.md`
5. `docs/handoff/CURRENT_STATE.md`
6. `docs/AI_WORKFLOW.md`
7. `docs/REVIEW_CHECKLIST.md`
8. 当前 `TASKS/*.md`

初始化完成前，禁止修改代码。

初始化后输出：

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

当用户提出新需求、功能想法、改动方向或较大调整时，必须先 Plan。

### Plan 阶段允许

1. 阅读文件
2. 分析现状
3. 输出需求理解
4. 输出实现方案
5. 输出预计修改范围
6. 输出风险点
7. 建议或生成 `TASKS/xxx.md` 草案

### Plan 阶段禁止

1. 禁止修改业务代码
2. 禁止修改配置文件
3. 禁止修改 `.scene`
4. 禁止重构代码
5. 禁止直接实现功能
6. 禁止自动提交 Git
7. 禁止使用写文件操作修改代码
8. 禁止把“Plan 完成”当成“允许执行”

生成 Plan 或 TASKS 草案后，必须停止，等待用户确认。

只有用户明确说：

```txt
开始执行
按这个 task 做
确认，开始改
可以实现
执行这个任务
```

才允许开始修改代码。

---

## 任务规则

如果已有 `TASKS/xxx.md`，必须严格按任务执行。

执行前确认：

1. 任务目标
2. 允许修改范围
3. 禁止修改范围
4. 验收标准
5. 回滚方式

如果没有对应 TASKS，禁止直接开发，必须先 Plan，再生成 TASKS，等待用户确认。

TASKS 文件通用模板：

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

具体任务细节只写进 `TASKS/xxx.md`，不要写进 `CLAUDE.md`。

---

## 开发原则

1. 先分析，后修改
2. 小步执行
3. 单次任务只做一个明确目标
4. 不允许越权修改
5. 不允许顺手重构无关代码
6. 不允许删除已有功能
7. 不允许硬编码关键数值
8. 配置优先，逻辑解耦
9. TypeScript 类型要明确
10. Cocos 组件职责清晰
11. 不引入不必要依赖
12. 不提前实现第二阶段功能
13. 不把未验证结论写入文档

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

1. 接服务器
2. 接支付
3. 做 TapTap Android APK 原生 SDK
4. 引入大型第三方库
5. 做复杂商业化

---

## Cocos 项目规则

### `.scene` 文件

`.scene` 文件属于用户人工维护范围。

执行 Agent 禁止：

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

如果 git diff 中出现 `.scene` 文件变更，默认视为用户在 Cocos Creator 中的人工改动。

执行 Agent 只能报告，不能处理。

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

### `.meta` 文件

新增 Cocos 资源时，必须确认 `.meta` 文件存在。

包括：

1. 新增 TypeScript 脚本
2. 新增目录
3. 新增 prefab
4. 新增 scene
5. 新增图片资源
6. 新增动画资源

缺少 `.meta`，任务不得视为完成。

### 缓存目录

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

## 文档规则

功能性修改完成后，检查是否需要更新：

1. `CHANGELOG.md`
2. `PROJECT_MEMORY.md`
3. 当前 `TASKS/*.md`
4. `docs/handoff/CURRENT_STATE.md`
5. 相关设计文档

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

用户明确授权后，可以在当前 feature 分支内分阶段提交。

### 分支规则

1. 不允许直接在 develop 上开发新功能
2. 新任务必须从 develop 拉出 feature 分支
3. 任务未通过 Codex 审查前，不允许合并回 develop
4. 不允许自动删除分支
5. 不允许自动推送远程，除非用户明确要求

### 提交前检查

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
6. `.scene` 有变更时，必须标明为用户人工改动
7. 执行 Agent 不允许自动把 `.scene` 加入提交

提交格式：

```bash
git commit -m "feat: xxx"
git commit -m "fix: xxx"
git commit -m "docs: xxx"
git commit -m "chore: xxx"
```

---

## 输出要求

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

## 自审规则

完成后必须检查：

1. 是否只完成当前 TASKS
2. 是否修改禁止文件
3. 是否扩大 MVP 范围
4. 是否顺手重构无关代码
5. 是否存在 TypeScript 问题
6. 是否缺少 `.meta`
7. 是否提交缓存目录
8. 是否直接调用平台 API
9. 是否检测到 `.scene` 变更

自审通过后，才可以建议进入 Codex 审查。

---

## Codex 审查规则

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
