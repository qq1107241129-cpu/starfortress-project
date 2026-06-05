# TASKS/001-project-init

## 1. 任务目标

初始化项目文档、目录结构和基础工程规范，建立《星垒计划》后续开发与审查的共同上下文。

## 2. 背景说明

当前项目处于启动阶段，需要先固定产品目标、MVP 范围、技术栈、平台硬约束、Codex / 执行 Agent 分工和第一批任务拆分。该任务不写业务代码。

## 3. 涉及文件

- `README.md`
- `CLAUDE.md`
- `PROJECT_MEMORY.md`
- `CHANGELOG.md`
- `docs/PRD.md`
- `docs/GAME_DESIGN.md`
- `docs/TECH_DESIGN.md`
- `docs/PLATFORM.md`
- `docs/PUBLISH_MATRIX.md`
- `docs/ART_GUIDE.md`
- `docs/AI_ASSET_PROMPTS.md`
- `docs/REVIEW_CHECKLIST.md`
- `docs/COMPLIANCE.md`
- `docs/AI_WORKFLOW.md`
- `TASKS/001-project-init.md`
- `TASKS/002-platform-adapter.md`
- `TASKS/003-core-data-config.md`
- `TASKS/004-battle-prototype.md`
- `TASKS/005-tower-system.md`
- `TASKS/006-enemy-wave-system.md`
- `TASKS/007-rogue-choice-and-skills.md`
- `TASKS/008-base-building-system.md`
- `TASKS/009-idle-offline-reward.md`
- `TASKS/010-rebirth-system.md`
- `TASKS/011-ui-flow.md`
- `TASKS/012-build-wechat-douyin-taptap.md`

## 4. 允许修改范围

- 创建或更新上述文档。
- 创建 `docs/` 与 `TASKS/` 目录。
- 补充项目目标、MVP 范围、平台约束、任务拆分、验收标准和审查标准。

## 5. 禁止修改范围

- 不创建业务脚本。
- 不创建 Cocos 场景、Prefab、资源导入配置。
- 不接入平台 API。
- 不初始化服务器、支付、广告 SDK 或原生 SDK。
- 不做超出 MVP 的玩法实现。

## 6. 实现假设

- 当前任务只负责文档初始化。
- 如果仓库尚未包含 Cocos Creator 工程结构，不在本任务中创建完整工程。
- 具体 Cocos 项目初始化可作为后续任务单独处理。

## 7. 实现步骤

1. 创建或更新 `README.md`，写入项目用途、技术栈、已确认玩法、MVP 范围、目录结构、第一批任务清单和执行 Agent 执行提示词。
2. 创建或更新 `CLAUDE.md`，写入 AI 分工、新会话初始化要求、平台硬约束、文件修改规则、Git 规则和审查规则。
3. 创建或更新 `PROJECT_MEMORY.md`，记录长期约束、项目定位、平台硬约束、MVP 范围、执行 Agent 可切换规则和任务顺序。
4. 创建或更新 `CHANGELOG.md`，写入初始化或文档重整记录。
5. 创建或更新 `docs/` 下的 PRD、玩法设计、技术设计、平台、发布矩阵、美术、AI 素材提示词、审查清单、合规和 AI 协作流程文档。
6. 创建或更新 `TASKS/001` 至 `TASKS/012`。
7. 确认每个任务文件包含任务目标、背景说明、涉及文件、允许修改范围、禁止修改范围、实现步骤、验收标准、测试方式、回滚方式、给执行 Agent 的执行提示词。

## 8. 验收标准

1. 文档齐全。
2. 目录清晰。
3. 所有核心约束写入 `PROJECT_MEMORY.md`。
4. `CHANGELOG.md` 有第一条初始化记录。
5. 没有业务代码改动。
6. 每个 `TASKS/*.md` 均包含必需章节。

## 9. 测试方式

- 使用文件列表检查所有目标文件是否存在。
- 阅读 `PROJECT_MEMORY.md`，确认平台硬约束完整。
- 阅读 `CHANGELOG.md`，确认初始化记录存在。
- 检查没有新增业务脚本、场景、Prefab 或平台 SDK。

## 10. 回滚方式

- 删除本任务新增的文档和目录。
- 如已有文件被更新，按 `git diff` 中的变更逐项回退。
- 回滚后再次确认无业务代码变更。

## 11. 给执行 Agent 的执行提示词

你是《星垒计划 / Starfortress Project》的执行工程师。当前任务是 `TASKS/001-project-init.md`。

请先阅读 `CLAUDE.md`、`README.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md`、`docs/PRD.md`、`docs/GAME_DESIGN.md`、`docs/TECH_DESIGN.md`、`docs/PLATFORM.md`、`docs/PUBLISH_MATRIX.md`、`docs/ART_GUIDE.md`、`docs/AI_ASSET_PROMPTS.md`、`docs/REVIEW_CHECKLIST.md`、`docs/COMPLIANCE.md`、`docs/AI_WORKFLOW.md` 和当前任务文件。

只允许创建或更新本任务列出的文档与目录。不要写业务代码，不要接平台 API，不要创建服务器、支付、广告 SDK 或原生 SDK。完成前确认每个任务文件都有必需章节，并更新 `CHANGELOG.md` 与 `PROJECT_MEMORY.md`。

完成后输出修改文件列表、修改原因、Web 预览测试方式、三端小游戏影响验证、主包体积影响、是否更新 `CHANGELOG.md` 与 `PROJECT_MEMORY.md`，并提示用户执行 `git status` 和 `git diff`。

