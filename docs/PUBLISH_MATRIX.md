# 发布矩阵

## 1. 阶段目标

第一阶段目标是验证 Web 预览、微信小游戏、抖音小游戏、TapTap 小游戏方向的构建链路。第二阶段再考虑 TapTap Android APK 和原生移动包。

## 2. 平台矩阵

| 平台 | 阶段 | 状态 | 目标 | 关键约束 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| Web 预览 | MVP | 已配置，待实测 | 用于日常调试与玩法验证 | 使用 WebMockPlatform，不依赖平台 API | Cocos Web Preview 可进入主流程 |
| 微信小游戏 | MVP | 已配置，待 AppID/微信开发者工具实测 | 验证微信小游戏构建产物可打开 | 主包目标小于 4MB，业务代码不得直接调用 `wx` | 构建微信小游戏并在开发者工具打开 |
| 抖音小游戏 | MVP | 已配置，待 AppID/抖音开发者工具实测 | 验证抖音小游戏构建产物可打开 | 业务代码不得直接调用 `tt` | 构建抖音小游戏并在开发者工具打开 |
| TapTap 小游戏 | MVP | 已配置，待转换工具实测 | 验证 TapTap 小游戏转换产物可生成 | 业务代码不得直接调用 `tap` 或 `TapSDK` | 运行转换链路并检查产物 |
| TapTap Android APK | 第二阶段 | 仅规划 | 后续原生包方向 | MVP 不接原生 SDK | 暂不验证 |
| iOS / Android 原生包 | 第二阶段 | 仅规划 | 后续原生包方向 | MVP 不接原生 SDK | 暂不验证 |

## 3. MVP 发布前检查

1. Web 预览可运行。
2. 微信小游戏构建产物可打开。
3. 抖音小游戏构建产物可打开。
4. TapTap 小游戏转换产物可生成。
5. 主包目标小于 4MB。
6. 平台能力不可用时能降级。
7. 业务层没有直接调用平台 API。
8. `docs/PUBLISH_MATRIX.md` 与实际状态一致。

## 4. 构建步骤

### 4.1 Web 预览

1. 打开 Cocos Creator 3.8.x
2. 打开项目 `starfortress-project`
3. 点击顶部菜单 `预览` → `浏览器预览`
4. 等待编译完成，浏览器自动打开游戏

### 4.2 微信小游戏构建

1. 打开 Cocos Creator 3.8.x
2. 打开项目 `starfortress-project`
3. 点击顶部菜单 `项目` → `构建发布`
4. 选择平台 `WeChat Mini Game`
5. 填写配置：
   - 应用 ID：（需要在微信公众平台申请）
   - 远程服务器地址：（如有远程资源）
   - 方向：竖屏
6. 点击 `构建`
7. 构建完成后，使用微信开发者工具打开 `build/wechatgame` 目录

### 4.3 抖音小游戏构建

1. 打开 Cocos Creator 3.8.x
2. 打开项目 `starfortress-project`
3. 点击顶部菜单 `项目` → `构建发布`
4. 选择平台 `ByteDance Mini Game`
5. 填写配置：
   - 应用 ID：（需要在抖音开放平台申请）
   - 远程服务器地址：（如有远程资源）
   - 方向：竖屏
6. 点击 `构建`
7. 构建完成后，使用抖音开发者工具打开 `build/bytedance` 目录

### 4.4 TapTap 小游戏构建

1. 打开 Cocos Creator 3.8.x
2. 打开项目 `starfortress-project`
3. 点击顶部菜单 `项目` → `构建发布`
4. 选择平台 `Cocos Play`
5. 填写配置：
   - 应用 ID：（需要在 TapTap 开放平台申请）
   - 远程服务器地址：（如有远程资源）
   - 方向：竖屏
6. 点击 `构建`
7. 构建完成后，使用 TapTap 小游戏转换工具处理 `build/cocos-play` 目录

## 5. 主包体积检查

- **源码体积估算**：TypeScript 脚本约 300 KB，assets 目录约 875 KB
- **主包目标**：小于 4 MB
- **当前状态**：源码体积估算通过，实际构建主包体积待构建报告确认

## 6. 资源分包说明

当前 MVP 阶段资源较少，暂未配置分包。后续如有需要，可在构建配置中添加 `subpackageList` 配置。

## 7. 平台降级验证

代码审查确认所有平台适配器代码中有降级处理（非平台实测）：

- `WechatPlatform`：所有方法均有 try-catch 降级
- `DouyinPlatform`：所有方法均有 try-catch 降级
- `TapTapMiniPlatform`：所有方法均有 try-catch 降级
- `WebMockPlatform`：Web 环境使用 localStorage，其他能力返回 mock 结果

## 8. 风险记录

- Cocos Creator 3.8.x 对各小游戏平台的构建选项可能存在版本差异，具体配置以实际编辑器版本为准。
- TapTap 小游戏转换链路需要在对应平台工具可用后补充实测步骤。
- 广告与分享接口在 MVP 阶段只预留，不作为核心流程阻塞项。
- 各平台 AppID 需要在对应平台申请后才能进行实际构建验证。
