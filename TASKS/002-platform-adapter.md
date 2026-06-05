# TASKS/002-platform-adapter

## 1. 任务目标

建立统一平台适配层，使业务层可以通过 `Platform.instance` 调用登录、分享、广告、震动、系统信息和本地存储能力。

## 2. 背景说明

项目目标平台包含 Web、微信小游戏、抖音小游戏和 TapTap 小游戏。业务代码禁止直接调用 `wx`、`tt`、`tap`、`TapSDK`，因此必须先建立 platform adapter。

## 3. 涉及文件

- `assets/scripts/platform/IPlatform.ts`
- `assets/scripts/platform/Platform.ts`
- `assets/scripts/platform/WebMockPlatform.ts`
- `assets/scripts/platform/WechatPlatform.ts`
- `assets/scripts/platform/DouyinPlatform.ts`
- `assets/scripts/platform/TapTapMiniPlatform.ts`
- `docs/PLATFORM.md`
- `PROJECT_MEMORY.md`
- `CHANGELOG.md`

## 4. 允许修改范围

- 新增或更新 platform 目录中的适配层文件。
- 补充平台接口类型、统一返回结构和 mock 实现。
- 更新平台文档、项目记忆和变更记录。

## 5. 禁止修改范围

- 不修改战斗、经营、UI 等业务系统。
- 不在 platform 目录外调用 `wx`、`tt`、`tap`、`TapSDK`。
- 不接入真实广告位 ID、支付 SDK 或服务器。
- 不实现 TapTap Android APK 原生 SDK。

## 6. 实现假设

- Web 预览默认使用 `WebMockPlatform`。
- 小游戏平台 API 不可用时返回降级结果。
- 具体平台 API 差异封装在对应平台类内部。

## 7. 实现步骤

1. 创建 `IPlatform.ts`，定义 `login`、`share`、`showRewardAd`、`vibrateShort`、`getSystemInfo`、`getStorage`、`setStorage`、`removeStorage`。
2. 创建 `Platform.ts`，提供 `Platform.instance`、平台注册和默认 mock 平台。
3. 创建 `WebMockPlatform.ts`，使用 `localStorage` 实现存储，其余能力返回 mock 结果。
4. 创建 `WechatPlatform.ts`，只在该文件中访问微信 API，并为能力不存在提供降级。
5. 创建 `DouyinPlatform.ts`，只在该文件中访问抖音 API，并为能力不存在提供降级。
6. 创建 `TapTapMiniPlatform.ts`，只在该文件中访问 TapTap 小游戏平台能力，并为能力不存在提供降级。
7. 更新 `docs/PLATFORM.md` 中的接口说明。
8. 更新 `CHANGELOG.md` 与必要的 `PROJECT_MEMORY.md`。

## 8. 验收标准

1. 业务层可通过 `Platform.instance` 调用平台能力。
2. WebMockPlatform 可在浏览器调试。
3. 没有业务代码直接调用 `wx`、`tt`、`tap`。
4. 平台 API 只出现在 platform 目录。
5. 平台能力不可用时不会崩溃。

## 9. 测试方式

- Web 预览中调用 mock 登录、分享、广告和存储。
- 搜索 `wx.`、`tt.`、`tap`、`TapSDK`，确认仅 platform 目录内出现。
- 手动模拟广告失败和存储失败，确认返回降级结果。
- 检查 TypeScript 编译无错误。

## 10. 回滚方式

- 删除新增 platform 文件。
- 恢复 `docs/PLATFORM.md`、`PROJECT_MEMORY.md`、`CHANGELOG.md` 中本任务变更。
- 再次搜索平台 API，确认没有残留越权调用。

## 11. 给执行 Agent 的执行提示词

你是《星垒计划》的执行工程师。当前任务是建立平台适配层。请只修改本任务涉及文件，不要实现业务功能。

所有平台 API 只能写在 `assets/scripts/platform/` 下。业务层只能通过 `Platform.instance` 使用能力。Web 调试必须可用，平台能力失败必须降级。完成后更新 `CHANGELOG.md`，如新增长期约束则更新 `PROJECT_MEMORY.md`，并输出三端构建影响说明。

