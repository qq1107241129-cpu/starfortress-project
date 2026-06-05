# AI 协作工作流

## 1. Codex 的职责

Codex 负责规划 + 审查：

1. 维护 PRD、技术方案和任务拆分。
2. 制定验收标准和风险边界。
3. 审查执行 Agent 的 `git diff`。
4. 检查越权修改、平台风险、包体风险、性能风险和文档同步。
5. 生成执行提示词和修复提示词。

Codex 不应在没有任务单的情况下直接大规模写业务代码。

## 2. 执行 Agent 的职责

执行 Agent 负责执行。执行 Agent 可以是 DeepSeek、MiMo 或其他代码模型，但角色固定为执行工程师。

职责：

1. 阅读 `CLAUDE.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md` 和当前任务文件。
2. 只按照当前 `TASKS/*.md` 修改代码或文档。
3. 不擅自扩大需求。
4. 不越权修改文件。
5. 不自动提交 Git。
6. 完成后输出测试方式和风险说明。

## 3. 人工的职责

人工负责拍板、运行、测试、提交 Git：

1. 确认游戏方向。
2. 确认任务是否开始。
3. 运行项目和构建工具。
4. 做 Web 预览、小游戏工具和真机测试。
5. 将 `git status` / `git diff` 交给 Codex 审查。
6. 决定是否提交。

## 4. 多 Agent 协作流程

```txt
人工确认当前任务
-> 执行 Agent 阅读 CLAUDE.md / PROJECT_MEMORY.md / CHANGELOG.md / 当前 TASKS
-> 执行 Agent 按任务修改
-> 人工运行 git status / git diff
-> Codex 审查 diff
-> 不通过则执行 Agent 按修复提示词修复
-> Codex 再审查
-> 人工测试
-> 人工提交 Git
-> 进入下一任务
```

## 5. 模型切换规则

- 可以从 DeepSeek 切到 MiMo，也可以切到其他代码模型。
- 模型可以切换，但角色固定为执行 Agent。
- 切换模型后必须重新阅读：
  1. `CLAUDE.md`
  2. `PROJECT_MEMORY.md`
  3. `CHANGELOG.md`
  4. 当前 `TASKS/*.md`
- 不能依赖上一个模型的口头记忆。
- 切换模型后仍必须遵守当前任务的允许修改范围和禁止修改范围。

## 6. 当前任务启动提示词

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

请先阅读：
1. CLAUDE.md
2. PROJECT_MEMORY.md
3. CHANGELOG.md
4. 当前任务文件

当前任务：
TASKS/xxx.md

执行前先输出：
1. 已阅读哪些文件
2. 当前任务目标
3. 本次计划修改哪些文件
4. 不会修改哪些文件
5. 可能风险

严格遵守当前任务的允许修改范围和禁止修改范围。
不要自动提交 Git。
```

## 7. Codex 审查提示词

```txt
你是《星垒计划 / Starfortress Project》的代码审查员。

请审查当前 git diff，不要直接修改代码。

当前任务文件：
TASKS/xxx.md

请重点检查：
1. 是否符合当前任务
2. 是否存在越权修改
3. 是否破坏 Cocos Creator 项目结构
4. 是否直接调用 wx、tt、tap、TapSDK
5. 是否所有平台能力都经过 platform adapter
6. 是否影响微信小游戏构建
7. 是否影响抖音小游戏构建
8. 是否影响 TapTap 小游戏转换构建
9. 是否引入过早复杂度
10. 是否影响主包体积
11. 是否有性能风险
12. 是否更新 CHANGELOG.md
13. 是否更新 PROJECT_MEMORY.md
14. 是否符合 MVP 缩范围原则

请输出：
1. 审查结论：通过 / 不通过
2. 必须修复项
3. 建议优化项
4. 平台风险
5. 包体风险
6. 是否允许进入提交
7. 给执行 Agent 的修复提示词
```

## 8. 执行 Agent 执行提示词

```txt
你是《星垒计划 / Starfortress Project》的执行工程师，角色为执行 Agent。

请先阅读根目录 CLAUDE.md，然后执行当前任务：

TASKS/xxx.md

严格遵守 CLAUDE.md 和当前 TASKS 文件。

执行规则：
1. 只能执行当前任务
2. 不允许擅自扩大需求
3. 不允许修改当前任务未授权文件
4. 不允许删除已有功能
5. 不允许重构无关代码
6. 不允许业务代码直接调用 wx、tt、tap、TapSDK
7. 平台能力必须通过 platform adapter
8. 第一阶段只做微信小游戏、抖音小游戏、TapTap 小游戏
9. TapTap Android APK 只做规划，不写原生 SDK
10. 不接服务器
11. 不接支付
12. 不做复杂商业化

完成后必须输出：
1. 修改文件列表
2. 每个文件修改原因
3. 如何在 Web 预览测试
4. 如何验证不影响微信小游戏
5. 如何验证不影响抖音小游戏
6. 如何验证不影响 TapTap 小游戏
7. 是否影响主包体积
8. 是否更新 CHANGELOG.md
9. 是否更新 PROJECT_MEMORY.md
10. 下一步建议

不要提交 Git，只提示人工执行：
git status
git diff
```

## 9. 执行 Agent 修复提示词

```txt
Codex 审查未通过。

请根据以下审查结果修复当前任务，不要扩大修改范围。

当前任务：
TASKS/xxx.md

审查结果：
【粘贴 Codex 的必须修复项】

修复要求：
1. 只修复 Codex 指出的必须修复项
2. 不要顺手优化其他内容
3. 不要修改当前任务未授权文件
4. 不要删除已有功能
5. 不要引入新系统
6. 不要自动提交 Git

修复完成后输出：
1. 修复了哪些问题
2. 修改了哪些文件
3. 如何验证
4. 是否还有风险
5. 请人工执行 git status 和 git diff
```

## 10. 人工 Git 命令

```bash
git status
git diff
git diff --stat
git diff 文件路径
git add .
git commit -m "docs: regenerate project starter package"
```

如果当前目录还不是 Git 仓库，由人工决定是否执行 `git init`。

## 11. 任务开始检查清单

```txt
[ ] 当前任务文件存在
[ ] 已阅读 CLAUDE.md
[ ] 已阅读 PROJECT_MEMORY.md
[ ] 已阅读 CHANGELOG.md
[ ] 已阅读当前 TASKS 文件
[ ] 已确认允许修改范围
[ ] 已确认禁止修改范围
[ ] 没有把多个任务混在一起
[ ] 执行 Agent 不依赖上一模型口头记忆
```

## 12. 任务结束检查清单

```txt
[ ] 执行 Agent 输出了修改文件列表
[ ] 已说明每个文件修改原因
[ ] 已说明 Web 预览测试方式
[ ] 已说明三端小游戏影响验证
[ ] 已说明主包体积影响
[ ] 已更新 CHANGELOG.md 或说明无需更新
[ ] 已更新 PROJECT_MEMORY.md 或说明无需更新
[ ] 没有直接调用 wx / tt / tap / TapSDK
[ ] 没有越权修改
[ ] 人工已执行 git status / git diff
[ ] Codex 已审查
```
