# CHANGELOG

## 2026-06-05 002-platform-adapter 完成

### Added

- 新增 `assets/scripts/platform/IPlatform.ts`：平台适配层统一接口，定义 login、share、showRewardAd、vibrateShort、getSystemInfo、getStorage、setStorage、removeStorage。
- 新增 `assets/scripts/platform/Platform.ts`：平台入口，根据运行环境自动选择 WechatPlatform / DouyinPlatform / TapTapMiniPlatform / WebMockPlatform。支持 `Platform.register()` 覆盖实例。支持 TapSDK 全局对象检测。
- 新增 `assets/scripts/platform/WebMockPlatform.ts`：Web 预览与编辑器环境的 mock 实现，使用 localStorage。
- 新增 `assets/scripts/platform/WechatPlatform.ts`：微信小游戏平台适配，仅在此文件中访问 wx。
- 新增 `assets/scripts/platform/DouyinPlatform.ts`：抖音小游戏平台适配，仅在此文件中访问 tt，已处理 API 命名差异。
- 新增 `assets/scripts/platform/TapTapMiniPlatform.ts`：TapTap 小游戏平台适配，仅在此文件中访问 tap。

### Fixed

- Codex 审查修复：Platform.ts 补充 `register(platform)` 方法，支持手动覆盖平台实例。
- Codex 审查修复：Platform.ts 补充 TapSDK 全局对象声明和检测，tap 和 TapSDK 任一存在均创建 TapTapMiniPlatform。
- Codex 审查修复：所有平台 getStorage 使用 `??` 替代 `||`，避免空字符串被误判为 null。

### Notes

- 本次仅新增 platform 适配层文件，未修改业务代码。
- 无 Cocos 场景或资源文件改动。
- 根目录 `审查模板.md` 为空文件，非本任务产物，不纳入提交。

## 2026-06-05 001-project-init 完成

### Verified

- 001-project-init 任务正式确认完成。
- 一致性检查通过：`README.md`、`CLAUDE.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md`、`docs/` 下 10 个文档、`TASKS/` 下 12 个任务文件全部存在且内容完整。
- 每个 TASKS 文件均包含必需章节：任务目标、背景说明、涉及文件、允许修改范围、禁止修改范围、实现步骤、验收标准、测试方式、回滚方式、给执行 Agent 的执行提示词。
- 无业务代码改动，无 Cocos 场景或资源文件改动。

## 2026-06-05

### Changed

- docs: regenerate project starter package and unify execution agent workflow.
- 统一将执行角色命名为“执行 Agent”，明确可使用 DeepSeek、MiMo 或其他代码模型。
- 重整 PRD、MVP 设计、技术结构图、素材规范、AI 占位素材提示词、AI 协作流程、审查清单、项目记忆和任务提示词。

### Added

- 新增或补全 `CLAUDE.md` 与 `docs/AI_WORKFLOW.md` 的执行 Agent 工作流。

### Notes

- 本次仅修改 Markdown 文档，没有修改业务代码、Cocos 场景或资源文件。

## 2026-06-05 初始化记录

### Added

- 初始化《星垒计划 / Starfortress Project》项目文档体系。
- 新增 PRD、玩法设计、技术设计、平台适配、发布矩阵、美术规范、AI 素材提示词、审查清单与合规文档。
- 新增 `TASKS/001` 至 `TASKS/012` 的首批任务拆分。
- 明确 Codex / 执行 Agent 分工与平台 API 适配约束。
