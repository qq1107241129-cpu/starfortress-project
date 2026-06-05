# 平台适配设计

## 1. 目标平台

第一阶段：

1. Web 预览
2. 微信小游戏
3. 抖音小游戏
4. TapTap 小游戏

第二阶段可选：

1. TapTap Android APK
2. iOS / Android 原生包

## 2. 平台适配原则

- 业务代码不得直接调用 `wx`、`tt`、`tap`、`TapSDK`。
- 所有平台能力必须通过统一 platform adapter。
- WebMockPlatform 必须可运行。
- 没有平台 API 时不能崩溃。
- 平台功能失败时必须降级。
- TapTap Android APK 第一阶段只做规划，不接原生 SDK。

## 3. 适配层结构

```txt
assets/scripts/platform/
├─ IPlatform.ts
├─ Platform.ts
├─ WebMockPlatform.ts
├─ WechatPlatform.ts
├─ DouyinPlatform.ts
└─ TapTapMiniPlatform.ts
```

## 4. 能力接口

MVP 需要预留：

- `login`
- `share`
- `showRewardAd`
- `vibrateShort`
- `getSystemInfo`
- `getStorage`
- `setStorage`
- `removeStorage`

业务侧推荐调用：

```ts
Platform.instance.login()
Platform.instance.share()
Platform.instance.showRewardAd()
Platform.instance.vibrateShort()
Platform.instance.getSystemInfo()
```

## 5. WebMockPlatform

Web 调试环境使用 mock 实现：

- `login` 返回模拟用户信息或空登录结果。
- `share` 记录日志并返回成功。
- `showRewardAd` 默认返回成功，后续可配置失败模拟。
- `vibrateShort` 在 Web 中静默成功。
- 存储使用 `localStorage`。

## 6. 微信小游戏

仅 `WechatPlatform` 可以访问微信小游戏 API。

要求：

- 能力不存在时降级。
- 广告加载失败时返回失败结果。
- 分享失败不影响主流程。
- 存储失败时返回明确错误。

## 7. 抖音小游戏

仅 `DouyinPlatform` 可以访问抖音小游戏 API。

要求：

- API 名称差异封装在适配层内部。
- 业务层不感知抖音 API。
- 分享和广告失败时降级。

## 8. TapTap 小游戏

仅 `TapTapMiniPlatform` 可以访问 TapTap 小游戏平台能力。

要求：

- 第一阶段只适配小游戏方向。
- 不写 TapTap Android APK 原生 SDK。
- 转换构建不可用时记录风险，不阻塞 Web 预览。

## 9. 广告与分享

MVP 只预留接口，不强依赖广告：

- 失败后复活
- 离线收益翻倍
- 战斗奖励翻倍
- 免费刷新肉鸽选项
- 免费获得主动技能次数
- 加速建筑生产

任何广告失败都不能破坏核心玩法。

## 10. 包体与资源

- 主包目标小于 4MB。
- 大资源预留分包和远程资源。
- 首屏必要资源优先保持精简。
- 平台适配代码应避免引入大型依赖。
